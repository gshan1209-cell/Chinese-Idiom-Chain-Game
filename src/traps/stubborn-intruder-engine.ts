import type { Idiom } from '../domain/idiom.js';
import type { PuzzleBoard, PuzzleSession } from '../domain/puzzle.js';
import type {
  PuzzlePlayMode,
  StubbornIntruder,
  StubbornIntruderSession,
  StubbornIntruderStatus
} from '../domain/trap.js';
import { usesStubbornIntruders } from './trap-mode.js';
import { buildSafeTrapCharacters } from './trap-safe-characters.js';

const THRESHOLD_RATIOS = Object.freeze({
  1: Object.freeze([0.5]),
  2: Object.freeze([0.35, 0.7])
} as const);

const MAX_VISIBLE_STUBBORN_INTRUDERS = 1;
const MIN_HIT_INTERVAL_MS = 80;
const MAX_HIT_INTERVAL_MS = 700;

export type StubbornCharacterOrderer = (
  characters: readonly string[]
) => readonly string[];

export type StubbornCellKeyOrderer = (
  cellKeys: readonly string[]
) => readonly string[];

export interface CreateStubbornIntruderSessionOptions {
  readonly board: PuzzleBoard;
  readonly puzzleSession: PuzzleSession;
  readonly idioms: readonly Idiom[];
  readonly mode: PuzzlePlayMode;
  readonly excludedCharacters?: readonly string[];
  readonly excludedTargetCellKeys?: readonly string[];
  readonly selectedCellKey?: string | null;
  readonly nextAutoCellKey?: string | null;
  readonly orderCharacters: StubbornCharacterOrderer;
  readonly orderCellKeys: StubbornCellKeyOrderer;
  readonly validPlacements?: number;
  readonly actionCount?: number;
}

function nonNegativeInteger(value: number | undefined): number {
  return Number.isInteger(value) && (value ?? 0) > 0 ? value ?? 0 : 0;
}

function emptySession(
  board: PuzzleBoard,
  mode: PuzzlePlayMode,
  validPlacements: number,
  actionCount: number
): StubbornIntruderSession {
  return Object.freeze({
    levelId: board.level.id,
    mode,
    validPlacements,
    actionCount,
    intruders: Object.freeze([])
  });
}

function validatePermutation(
  source: readonly string[],
  ordered: readonly string[],
  message: string
): void {
  const sourceSet = new Set(source);
  const orderedSet = new Set(ordered);
  if (
    ordered.length !== source.length ||
    orderedSet.size !== ordered.length ||
    ordered.some((value) => !sourceSet.has(value))
  ) {
    throw new Error(message);
  }
}

function isCellEmpty(puzzleSession: PuzzleSession, key: string): boolean {
  return (puzzleSession.values[key] ?? '') === '';
}

function isVisibleStatus(status: StubbornIntruderStatus): boolean {
  return status === 'active' || status === 'ejecting';
}

function replaceIntruders(
  session: StubbornIntruderSession,
  intruders: readonly StubbornIntruder[]
): StubbornIntruderSession {
  const frozen = Object.freeze([...intruders]);
  if (
    frozen.length === session.intruders.length &&
    frozen.every((intruder, index) => intruder === session.intruders[index])
  ) {
    return session;
  }
  return Object.freeze({ ...session, intruders: frozen });
}

function resetIntruder(
  intruder: StubbornIntruder,
  status: StubbornIntruderStatus
): StubbornIntruder {
  return Object.freeze({
    ...intruder,
    status,
    currentHitStreak: 0,
    lastAcceptedHitAtMs: null
  });
}

function resetPartialHitStreaks(
  session: StubbornIntruderSession
): StubbornIntruderSession {
  return replaceIntruders(
    session,
    session.intruders.map((intruder) => {
      if (
        intruder.status !== 'active' ||
        (intruder.currentHitStreak === 0 && intruder.lastAcceptedHitAtMs === null)
      ) {
        return intruder;
      }
      return resetIntruder(intruder, 'active');
    })
  );
}

export function stubbornIntruderCount(fillableCellCount: number): number {
  if (!Number.isInteger(fillableCellCount) || fillableCellCount < 1) return 0;
  return Math.min(2, Math.max(1, Math.ceil(fillableCellCount * 0.06)));
}

export function stubbornIntruderActivationThresholds(
  total: number,
  fillableCellCount: number
): readonly number[] {
  if (
    !Number.isInteger(total) ||
    total < 1 ||
    total > 2 ||
    !Number.isInteger(fillableCellCount) ||
    fillableCellCount < 1
  ) {
    return Object.freeze([]);
  }

  const ratios = THRESHOLD_RATIOS[total as 1 | 2];
  return Object.freeze(
    ratios.map((ratio) => Math.max(1, Math.ceil(fillableCellCount * ratio)))
  );
}

export function createStubbornIntruderSession(
  options: CreateStubbornIntruderSessionOptions
): StubbornIntruderSession {
  const validPlacements = nonNegativeInteger(options.validPlacements);
  const actionCount = nonNegativeInteger(options.actionCount);

  if (
    !usesStubbornIntruders(options.mode) ||
    options.puzzleSession.status === 'completed'
  ) {
    return emptySession(options.board, options.mode, validPlacements, actionCount);
  }

  const emptyCellKeys = Object.freeze(
    options.board.fillableKeys.filter((key) => isCellEmpty(options.puzzleSession, key))
  );
  if (emptyCellKeys.length < 2) {
    return emptySession(options.board, options.mode, validPlacements, actionCount);
  }

  const safeCharacters = buildSafeTrapCharacters(
    options.board,
    options.idioms,
    options.excludedCharacters
  );
  const excludedTargets = new Set(options.excludedTargetCellKeys ?? []);
  if (options.selectedCellKey !== undefined && options.selectedCellKey !== null) {
    excludedTargets.add(options.selectedCellKey);
  }
  if (options.nextAutoCellKey !== undefined && options.nextAutoCellKey !== null) {
    excludedTargets.add(options.nextAutoCellKey);
  }
  const safeTargetCellKeys = Object.freeze(
    emptyCellKeys.filter((key) => !excludedTargets.has(key))
  );

  const orderedCharacters = Object.freeze([
    ...options.orderCharacters(safeCharacters)
  ]);
  const orderedCellKeys = Object.freeze([
    ...options.orderCellKeys(safeTargetCellKeys)
  ]);
  validatePermutation(
    safeCharacters,
    orderedCharacters,
    '頑固伏字字元排序結果無效。'
  );
  validatePermutation(
    safeTargetCellKeys,
    orderedCellKeys,
    '頑固伏字格排序結果無效。'
  );

  const total = Math.min(
    stubbornIntruderCount(options.board.fillableKeys.length),
    orderedCharacters.length,
    orderedCellKeys.length
  );
  const thresholds = stubbornIntruderActivationThresholds(
    total,
    options.board.fillableKeys.length
  );
  let visibleCount = 0;
  const intruders: StubbornIntruder[] = [];

  for (let index = 0; index < total; index += 1) {
    const character = orderedCharacters[index];
    const targetCellKey = orderedCellKeys[index];
    const activationAfterValidPlacements = thresholds[index];
    if (
      character === undefined ||
      targetCellKey === undefined ||
      activationAfterValidPlacements === undefined
    ) {
      throw new Error('頑固伏字計畫無效。');
    }

    const active =
      activationAfterValidPlacements <= validPlacements &&
      visibleCount < MAX_VISIBLE_STUBBORN_INTRUDERS;
    if (active) visibleCount += 1;

    intruders.push(Object.freeze({
      id: `stubborn-intruder-${String(index + 1)}`,
      character,
      targetCellKey,
      activationAfterValidPlacements,
      requiredHitCount: 3,
      currentHitStreak: 0,
      lastAcceptedHitAtMs: null,
      status: active ? 'active' : 'scheduled'
    }));
  }

  return Object.freeze({
    levelId: options.board.level.id,
    mode: options.mode,
    validPlacements,
    actionCount,
    intruders: Object.freeze(intruders)
  });
}

export function activateNextDueStubbornIntruder(
  session: StubbornIntruderSession
): StubbornIntruderSession {
  if (!usesStubbornIntruders(session.mode)) return session;
  if (session.intruders.some((intruder) => isVisibleStatus(intruder.status))) {
    return session;
  }

  const index = session.intruders.findIndex(
    (intruder) =>
      intruder.status === 'scheduled' &&
      intruder.activationAfterValidPlacements <= session.validPlacements
  );
  if (index < 0) return session;

  return replaceIntruders(
    session,
    session.intruders.map((intruder, intruderIndex) =>
      intruderIndex === index ? resetIntruder(intruder, 'active') : intruder
    )
  );
}

export function recordStubbornValidPlacement(
  session: StubbornIntruderSession
): StubbornIntruderSession {
  if (!usesStubbornIntruders(session.mode)) return session;
  const reset = resetPartialHitStreaks(session);
  const advanced = Object.freeze({
    ...reset,
    validPlacements: reset.validPlacements + 1,
    actionCount: reset.actionCount + 1
  });
  return activateNextDueStubbornIntruder(advanced);
}

export function recordStubbornPuzzleAction(
  session: StubbornIntruderSession
): StubbornIntruderSession {
  if (!usesStubbornIntruders(session.mode)) return session;
  const reset = resetPartialHitStreaks(session);
  return Object.freeze({ ...reset, actionCount: reset.actionCount + 1 });
}

export function hitStubbornIntruder(
  session: StubbornIntruderSession,
  id: string,
  nowMs: number
): StubbornIntruderSession {
  if (!Number.isFinite(nowMs) || nowMs < 0) return session;
  const index = session.intruders.findIndex(
    (intruder) => intruder.id === id && intruder.status === 'active'
  );
  if (index < 0) return session;

  const target = session.intruders[index];
  if (target === undefined) return session;
  const previousAt = target.lastAcceptedHitAtMs;
  if (previousAt !== null && nowMs - previousAt < MIN_HIT_INTERVAL_MS) {
    return session;
  }

  const currentHitStreak = previousAt === null || nowMs - previousAt > MAX_HIT_INTERVAL_MS
    ? 1
    : Math.min(target.requiredHitCount, target.currentHitStreak + 1);
  const status = currentHitStreak >= target.requiredHitCount
    ? 'ejecting' as const
    : 'active' as const;

  return replaceIntruders(
    session,
    session.intruders.map((intruder, intruderIndex) =>
      intruderIndex === index
        ? Object.freeze({
            ...intruder,
            currentHitStreak,
            lastAcceptedHitAtMs: nowMs,
            status
          })
        : intruder
    )
  );
}

export function completeStubbornEjection(
  session: StubbornIntruderSession,
  id: string
): StubbornIntruderSession {
  const index = session.intruders.findIndex(
    (intruder) => intruder.id === id && intruder.status === 'ejecting'
  );
  if (index < 0) return session;

  return replaceIntruders(
    session,
    session.intruders.map((intruder, intruderIndex) =>
      intruderIndex === index ? resetIntruder(intruder, 'removed') : intruder
    )
  );
}

export function reconcileStubbornIntruders(
  session: StubbornIntruderSession,
  puzzleSession: PuzzleSession,
  excludedScheduledTargetCellKeys: readonly string[] = []
): StubbornIntruderSession {
  const excluded = new Set(excludedScheduledTargetCellKeys);
  return replaceIntruders(
    session,
    session.intruders.map((intruder) => {
      if (intruder.status === 'removed') return intruder;
      if (puzzleSession.status === 'completed') {
        return resetIntruder(intruder, 'removed');
      }

      const targetFilled = !isCellEmpty(puzzleSession, intruder.targetCellKey);
      if (targetFilled) {
        return intruder.status === 'scheduled'
          ? resetIntruder(intruder, 'removed')
          : resetIntruder(intruder, 'ejecting');
      }
      if (intruder.status === 'scheduled' && excluded.has(intruder.targetCellKey)) {
        return resetIntruder(intruder, 'removed');
      }
      return intruder;
    })
  );
}

export function isStubbornTargetBlocked(
  session: StubbornIntruderSession,
  targetCellKey: string
): boolean {
  return session.intruders.some(
    (intruder) =>
      intruder.targetCellKey === targetCellKey &&
      isVisibleStatus(intruder.status)
  );
}

export function clearStubbornIntruderForHint(
  session: StubbornIntruderSession,
  targetCellKey: string
): StubbornIntruderSession {
  return replaceIntruders(
    session,
    session.intruders.map((intruder) =>
      intruder.targetCellKey === targetCellKey && intruder.status !== 'removed'
        ? resetIntruder(intruder, 'removed')
        : intruder
    )
  );
}

export function getVisibleStubbornIntruders(
  session: StubbornIntruderSession
): readonly StubbornIntruder[] {
  return Object.freeze(
    session.intruders.filter((intruder) => isVisibleStatus(intruder.status))
  );
}

export function getStubbornIntruderAtCell(
  session: StubbornIntruderSession,
  targetCellKey: string
): StubbornIntruder | null {
  return session.intruders.find(
    (intruder) =>
      intruder.targetCellKey === targetCellKey &&
      isVisibleStatus(intruder.status)
  ) ?? null;
}
