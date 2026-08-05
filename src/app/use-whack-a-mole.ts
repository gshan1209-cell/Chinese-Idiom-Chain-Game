import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction
} from 'react';

import type {
  BonusDifficulty,
  BonusRewardType,
  BonusRound,
  BonusSettlement
} from '../domain/bonus';
import type { GameSession } from '../domain/game';
import { spendFullEnergy } from '../game/bonus/bonus-energy';
import {
  createBonusQuestion,
  hasMinimumBonusQuestions
} from '../game/bonus/question-generator';
import {
  answerWhackRound,
  pauseWhackRound,
  resumeWhackRound,
  startWhackRound,
  tickWhackRound,
  type WhackEngineDependencies
} from '../game/bonus/whack-a-mole-engine';
import {
  applyBonusSettlement,
  calculateBonusSettlement
} from '../game/bonus/reward-calculator';
import type { IdiomIndex } from '../idioms/idiom-index';

export type BonusView = 'closed' | 'selecting' | 'playing' | 'result';

export interface WhackAMoleController {
  readonly view: BonusView;
  readonly round: BonusRound | null;
  readonly settlement: BonusSettlement | null;
  readonly availableRewards: readonly BonusRewardType[];
  readonly unavailableReason: string | null;
  openRewardSelector(): void;
  startRound(rewardType: BonusRewardType): void;
  hitHole(questionId: string, holeIndex: number): void;
  closeResult(): void;
  cancelSelection(): void;
}

interface UseWhackAMoleInput {
  readonly session: GameSession | null;
  readonly index: IdiomIndex | null;
  readonly setSession: Dispatch<SetStateAction<GameSession | null>>;
  readonly difficulty?: BonusDifficulty;
  readonly ignoreEnergy?: boolean;
}

const MINIMUM_QUESTION_COUNT = 8;
const INSUFFICIENT_QUESTIONS_MESSAGE =
  '目前可用的安全題目不足 8 題，能量不會扣除。請先補充成語題庫。';
const CLASSIC_REWARDS = Object.freeze([
  'hint-ticket',
  'score-multiplier',
  'shield'
] as const satisfies readonly BonusRewardType[]);

function readHoleCount(): 6 | 9 {
  if (typeof window === 'undefined') return 6;
  return window.matchMedia('(min-width: 48rem)').matches ? 9 : 6;
}

export function useWhackAMole({
  session,
  index,
  setSession,
  difficulty = 'normal',
  ignoreEnergy = false
}: UseWhackAMoleInput): WhackAMoleController {
  const [view, setView] = useState<BonusView>('closed');
  const [round, setRound] = useState<BonusRound | null>(null);
  const [settlement, setSettlement] = useState<BonusSettlement | null>(null);
  const [unavailableReason, setUnavailableReason] = useState<string | null>(null);
  const [holeCount, setHoleCount] = useState<6 | 9>(readHoleCount);
  const previousSessionId = useRef<string | null>(session?.id ?? null);

  useEffect(() => {
    const currentId = session?.id ?? null;
    if (previousSessionId.current !== currentId) {
      previousSessionId.current = currentId;
      setView('closed');
      setRound(null);
      setSettlement(null);
      setUnavailableReason(null);
    }
  }, [session?.id]);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 48rem)');
    const update = () => setHoleCount(media.matches ? 9 : 6);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const createDependencies = useCallback((): WhackEngineDependencies | null => {
    if (index === null) return null;
    return {
      now: () => performance.now(),
      nextQuestion: (usedIdiomIds, recentCorrectHoles) =>
        createBonusQuestion(index, usedIdiomIds, holeCount, recentCorrectHoles)
    };
  }, [holeCount, index]);

  useEffect(() => {
    if (
      round === null ||
      (round.phase !== 'active' && round.phase !== 'feedback')
    ) {
      return;
    }
    const dependencies = createDependencies();
    if (dependencies === null) return;
    let frame = 0;
    const animate = () => {
      setRound((current) =>
        current === null ? null : tickWhackRound(current, dependencies)
      );
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [createDependencies, round?.phase]);

  useEffect(() => {
    const handleVisibility = () => {
      const nowMs = performance.now();
      setRound((current) => {
        if (current === null) return null;
        return document.hidden
          ? pauseWhackRound(current, nowMs)
          : resumeWhackRound(current, nowMs);
      });
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    if (round === null || round.phase !== 'settled' || settlement !== null) return;
    const nextSettlement = calculateBonusSettlement(round);
    setSession((current) =>
      current === null ? null : applyBonusSettlement(current, nextSettlement)
    );
    setSettlement(nextSettlement);
    setView('result');
  }, [round, setSession, settlement]);

  const openRewardSelector = useCallback(() => {
    if (!ignoreEnergy) {
      if (session === null || session.result !== null || session.bonusResources.energy !== 100) return;
    }
    const enoughQuestions =
      index !== null && hasMinimumBonusQuestions(index, MINIMUM_QUESTION_COUNT);
    setUnavailableReason(enoughQuestions ? null : INSUFFICIENT_QUESTIONS_MESSAGE);
    setView('selecting');
  }, [ignoreEnergy, index, session]);

  const startRound = useCallback(
    (rewardType: BonusRewardType) => {
      if (!ignoreEnergy) {
        if (
          session === null ||
          session.result !== null ||
          session.bonusResources.energy !== 100
        ) {
          return;
        }
      }
      if (
        !CLASSIC_REWARDS.includes(
          rewardType as (typeof CLASSIC_REWARDS)[number]
        )
      ) {
        return;
      }
      if (
        index === null ||
        !hasMinimumBonusQuestions(index, MINIMUM_QUESTION_COUNT)
      ) {
        setUnavailableReason(INSUFFICIENT_QUESTIONS_MESSAGE);
        return;
      }
      const dependencies = createDependencies();
      if (dependencies === null) return;
      const nextRound = startWhackRound(rewardType, difficulty, dependencies);
      if (nextRound.phase === 'settled' || nextRound.question === null) {
        setUnavailableReason(INSUFFICIENT_QUESTIONS_MESSAGE);
        return;
      }
      setSession((current) => {
        if (current === null || current.bonusResources.energy !== 100) return current;
        return Object.freeze({
          ...current,
          bonusResources: spendFullEnergy(current.bonusResources)
        });
      });
      setUnavailableReason(null);
      setSettlement(null);
      setRound(nextRound);
      setView('playing');
    },
    [createDependencies, difficulty, index, session, setSession]
  );

  const hitHole = useCallback(
    (questionId: string, holeIndex: number) => {
      const dependencies = createDependencies();
      if (dependencies === null) return;
      setRound((current) =>
        current === null
          ? null
          : answerWhackRound(current, questionId, holeIndex, dependencies)
      );
    },
    [createDependencies]
  );

  const closeResult = useCallback(() => {
    setRound(null);
    setSettlement(null);
    setUnavailableReason(null);
    setView('closed');
  }, []);

  const cancelSelection = useCallback(() => {
    setUnavailableReason(null);
    setView('closed');
  }, []);

  return useMemo(
    () => ({
      view,
      round,
      settlement,
      availableRewards: CLASSIC_REWARDS,
      unavailableReason,
      openRewardSelector,
      startRound,
      hitHole,
      closeResult,
      cancelSelection
    }),
    [
      cancelSelection,
      closeResult,
      hitHole,
      openRewardSelector,
      round,
      settlement,
      startRound,
      unavailableReason,
      view
    ]
  );
}
