import type { BonusResources } from '../domain/bonus.js';
import type { GameSession, TurnErrorCode, TurnResult } from '../domain/game.js';
import type { Idiom } from '../domain/idiom.js';
import {
  carryResourcesToNextLevel,
  createBonusResources,
  gainTurnEnergy
} from './bonus/bonus-energy.js';
import {
  getCandidatesByFirstChar,
  getIdiomByText,
  type IdiomIndex
} from '../idioms/idiom-index.js';

const BASE_SCORE = 100;
const COMBO_STEP = 20;
const MAX_COMBO_BONUS = 200;
const HINT_COST = 50;

export interface GameEngineOptions {
  readonly createSessionId?: () => string;
  readonly now?: () => string;
  readonly pickIndex?: (length: number) => number;
  readonly initialBonusResources?: BonusResources;
}

function defaultSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function defaultNow(): string {
  return new Date().toISOString();
}

function defaultPickIndex(length: number): number {
  return Math.floor(Math.random() * length);
}

function selectByIndex<T>(items: readonly T[], pickIndex: (length: number) => number): T {
  const selectedIndex = pickIndex(items.length);
  if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= items.length) {
    throw new Error(`選取索引超出範圍：${selectedIndex}`);
  }
  const selected = items[selectedIndex];
  if (selected === undefined) throw new Error('無法選取成語。');
  return selected;
}

function unusedCandidates(
  index: IdiomIndex,
  requiredChar: string,
  usedIds: ReadonlySet<string>
): readonly Idiom[] {
  return getCandidatesByFirstChar(index, requiredChar).filter((idiom) => !usedIds.has(idiom.id));
}

function makeTurnResult(
  correct: boolean,
  errorCode: TurnErrorCode | null,
  scoreDelta: number,
  combo: number,
  answer: Idiom | null,
  nextRequiredChar: string
): TurnResult {
  return Object.freeze({ correct, errorCode, scoreDelta, combo, answer, nextRequiredChar });
}

function rejectTurn(
  session: GameSession,
  errorCode: TurnErrorCode
): { readonly session: GameSession; readonly result: TurnResult } {
  const hasShield = session.bonusResources.shieldLayers > 0;
  const bonusResources = hasShield
    ? createBonusResources({
        ...session.bonusResources,
        shieldLayers: session.bonusResources.shieldLayers - 1
      })
    : session.bonusResources;
  const updated = Object.freeze({
    ...session,
    wrongCount: session.wrongCount + 1,
    combo: hasShield ? session.combo : 0,
    bonusResources
  });
  return {
    session: updated,
    result: makeTurnResult(
      false,
      errorCode,
      0,
      updated.combo,
      null,
      session.previousIdiom.lastChar
    )
  };
}

export function createClassicSession(
  index: IdiomIndex,
  options: GameEngineOptions = {}
): GameSession {
  const eligible = [...index.byId.values()].filter(
    (idiom) => unusedCandidates(index, idiom.lastChar, new Set([idiom.id])).length > 0
  );

  if (eligible.length === 0) {
    throw new Error('目前字典沒有可開始的接龍成語。');
  }

  const start = selectByIndex(eligible, options.pickIndex ?? defaultPickIndex);
  const startedAt = (options.now ?? defaultNow)();

  return Object.freeze({
    id: (options.createSessionId ?? defaultSessionId)(),
    mode: 'classic',
    difficulty: start.difficulty,
    startedAt,
    endedAt: null,
    score: 0,
    correctCount: 0,
    wrongCount: 0,
    combo: 0,
    maxCombo: 0,
    hintsUsed: 0,
    previousIdiom: start,
    usedIdiomIds: new Set([start.id]),
    history: Object.freeze([start]),
    result: null,
    bonusResources: options.initialBonusResources ?? createBonusResources(),
    hintUsedForCurrentTurn: false,
    appliedBonusSettlementIds: new Set<string>()
  });
}

export function createNextClassicSession(
  previous: GameSession,
  index: IdiomIndex,
  options: Omit<GameEngineOptions, 'initialBonusResources'> = {}
): GameSession {
  const next = createClassicSession(index, {
    ...options,
    initialBonusResources: carryResourcesToNextLevel(previous.bonusResources)
  });
  return Object.freeze({
    ...next,
    appliedBonusSettlementIds: new Set(previous.appliedBonusSettlementIds)
  });
}

export function submitClassicTurn(
  session: GameSession,
  input: string,
  index: IdiomIndex
): { readonly session: GameSession; readonly result: TurnResult } {
  if (session.result !== null) {
    return {
      session,
      result: makeTurnResult(
        false,
        'SESSION_ENDED',
        0,
        session.combo,
        null,
        session.previousIdiom.lastChar
      )
    };
  }

  const answer = getIdiomByText(index, input);
  if (answer === null) return rejectTurn(session, 'IDIOM_NOT_FOUND');
  if (answer.firstChar !== session.previousIdiom.lastChar) {
    return rejectTurn(session, 'CHAIN_CHAR_MISMATCH');
  }
  if (session.usedIdiomIds.has(answer.id)) {
    return rejectTurn(session, 'IDIOM_ALREADY_USED');
  }

  const combo = session.combo + 1;
  const normalScoreDelta = BASE_SCORE + Math.min(session.combo * COMBO_STEP, MAX_COMBO_BONUS);
  const multiplierActive = session.bonusResources.scoreMultiplierTurns > 0;
  const scoreDelta = multiplierActive ? normalScoreDelta * 2 : normalScoreDelta;
  const bonusResources = createBonusResources({
    ...session.bonusResources,
    energy: gainTurnEnergy({
      currentEnergy: session.bonusResources.energy,
      combo,
      difficulty: answer.difficulty,
      usedHintForTurn: session.hintUsedForCurrentTurn
    }),
    scoreMultiplierTurns: multiplierActive
      ? session.bonusResources.scoreMultiplierTurns - 1
      : 0
  });
  const usedIdiomIds = new Set(session.usedIdiomIds);
  usedIdiomIds.add(answer.id);
  const hasNext = unusedCandidates(index, answer.lastChar, usedIdiomIds).length > 0;
  const updated = Object.freeze({
    ...session,
    score: session.score + scoreDelta,
    correctCount: session.correctCount + 1,
    combo,
    maxCombo: Math.max(session.maxCombo, combo),
    previousIdiom: answer,
    usedIdiomIds,
    history: Object.freeze([...session.history, answer]),
    result: hasNext ? null : ('completed' as const),
    endedAt: hasNext ? null : defaultNow(),
    bonusResources,
    hintUsedForCurrentTurn: false
  });

  return {
    session: updated,
    result: makeTurnResult(true, null, scoreDelta, combo, answer, answer.lastChar)
  };
}

export function requestClassicHint(
  session: GameSession,
  index: IdiomIndex,
  options: Pick<GameEngineOptions, 'pickIndex'> = {}
): { readonly session: GameSession; readonly idiom: Idiom | null } {
  if (session.result !== null) return { session, idiom: null };

  const candidates = unusedCandidates(index, session.previousIdiom.lastChar, session.usedIdiomIds);
  if (candidates.length === 0) {
    return {
      session: Object.freeze({ ...session, result: 'completed' as const, endedAt: defaultNow() }),
      idiom: null
    };
  }

  const idiom = selectByIndex(candidates, options.pickIndex ?? defaultPickIndex);
  const useTicket = session.bonusResources.hintTickets > 0;
  const bonusResources = useTicket
    ? createBonusResources({
        ...session.bonusResources,
        hintTickets: session.bonusResources.hintTickets - 1
      })
    : session.bonusResources;
  return {
    session: Object.freeze({
      ...session,
      score: useTicket ? session.score : Math.max(0, session.score - HINT_COST),
      hintsUsed: session.hintsUsed + 1,
      combo: 0,
      bonusResources,
      hintUsedForCurrentTurn: true
    }),
    idiom
  };
}

export function replaceBonusResources(
  session: GameSession,
  resources: BonusResources
): GameSession {
  return Object.freeze({ ...session, bonusResources: resources });
}
