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
import { createBonusQuestion } from '../game/bonus/question-generator';
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
}

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
  difficulty = 'normal'
}: UseWhackAMoleInput): WhackAMoleController {
  const [view, setView] = useState<BonusView>('closed');
  const [round, setRound] = useState<BonusRound | null>(null);
  const [settlement, setSettlement] = useState<BonusSettlement | null>(null);
  const [holeCount, setHoleCount] = useState<6 | 9>(readHoleCount);
  const previousSessionId = useRef<string | null>(session?.id ?? null);

  useEffect(() => {
    const currentId = session?.id ?? null;
    if (previousSessionId.current !== currentId) {
      previousSessionId.current = currentId;
      setView('closed');
      setRound(null);
      setSettlement(null);
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
    if (session?.result === null && session.bonusResources.energy === 100) {
      setView('selecting');
    }
  }, [session]);

  const startRound = useCallback(
    (rewardType: BonusRewardType) => {
      if (
        session === null ||
        session.result !== null ||
        session.bonusResources.energy !== 100 ||
        !CLASSIC_REWARDS.includes(
          rewardType as (typeof CLASSIC_REWARDS)[number]
        )
      ) {
        return;
      }
      const dependencies = createDependencies();
      if (dependencies === null) return;
      const nextRound = startWhackRound(rewardType, difficulty, dependencies);
      if (nextRound.phase === 'settled' || nextRound.question === null) return;
      setSession((current) => {
        if (current === null || current.bonusResources.energy !== 100) return current;
        return Object.freeze({
          ...current,
          bonusResources: spendFullEnergy(current.bonusResources)
        });
      });
      setSettlement(null);
      setRound(nextRound);
      setView('playing');
    },
    [createDependencies, difficulty, session, setSession]
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
    setView('closed');
  }, []);

  const cancelSelection = useCallback(() => {
    setView('closed');
  }, []);

  return useMemo(
    () => ({
      view,
      round,
      settlement,
      availableRewards: CLASSIC_REWARDS,
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
      view
    ]
  );
}
