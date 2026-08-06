import type { Idiom } from '../domain/idiom.js';
import type { PuzzleBoard, PuzzleSession } from '../domain/puzzle.js';
import type {
  BoardIntruder,
  BoardIntruderSession,
  BoardIntruderStatus,
  PuzzlePlayMode
} from '../domain/trap.js';
import { usesBoardIntruders } from './trap-mode.js';
import { buildSafeTrapCharacters } from './trap-safe-characters.js';

const THRESHOLD_RATIOS = Object.freeze({
  1: Object.freeze([0.35]),
  2: Object.freeze([0.25, 0.6]),
  3: Object.freeze([0.2, 0.5, 0.75])
} as const);

const REVEAL_INTERVALS = Object.freeze([3, 5, 7] as const);
const MAX_VISIBLE_INTRUDERS = 2;
const MAX_NATURAL_REVEALS = 3;

export type CharacterOrderer = (
  characters: readonly string[]
) => readonly string[];

export type CellKeyOrderer = (
  cellKeys: readonly string[]
) => readonly string[];

export interface CreateBoardIntruderSessionOptions {
  readonly board: PuzzleBoard;
  readonly puzzleSession: PuzzleSession;
  readonly idioms: readonly Idiom[];
  readonly mode: PuzzlePlayMode;
  readonly excludedCharacters?: readonly string[];
  readonly orderCharacters: CharacterOrderer;
  readonly orderCellKeys: CellKeyOrderer;
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
): BoardIntruderSession {
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

function isVisibleStatus(status: BoardIntruderStatus): boolean {
  return status === 'active' || status === 'revealing' || status === 'ejecting';
}

function isCellEmpty(puzzleSession: PuzzleSession, key: string): boolean {
  return (puzzleSession.values[key] ?? '') === '';
}

function replaceIntruders(
  session: BoardIntruderSession,
  intruders: readonly BoardIntruder[]
): BoardIntruderSession {
  const frozen = Object.freeze([...intruders]);
  if (
    frozen.length === session.intruders.length &&
    frozen.every((intruder, index) => intruder === session.intruders[index])
  ) {
    return session;
  }
  return Object.freeze({ ...session, intruders: frozen });
}

function startDueReveal(session: BoardIntruderSession): BoardIntruderSession {
  if (session.intruders.some((intruder) => intruder.status === 'revealing')) {
    return session;
  }
  const index = session.intruders.findIndex((intruder) =>
    intruder.status === 'active' &&
    intruder.revealCount < MAX_NATURAL_REVEALS &&
    intruder.nextRevealAtActionCount !== null &&
    intruder.nextRevealAtActionCount <= session.actionCount
  );
  if (index < 0) return session;

  return replaceIntruders(
    session,
    session.intruders.map((intruder, intruderIndex) =>
      intruderIndex === index
        ? Object.freeze({ ...intruder, status: 'revealing' as const })
        : intruder
    )
  );
}

export function boardIntruderCount(fillableCellCount: number): number {
  if (!Number.isInteger(fillableCellCount) || fillableCellCount < 1) return 0;
  return Math.min(3, Math.max(1, Math.ceil(fillableCellCount * 0.1)));
}

export function boardIntruderActivationThresholds(
  total: number,
  fillableCellCount: number
): readonly number[] {
  if (
    !Number.isInteger(total) ||
    total < 1 ||
    total > 3 ||
    !Number.isInteger(fillableCellCount) ||
    fillableCellCount < 1
  ) {
    return Object.freeze([]);
  }

  const ratios = THRESHOLD_RATIOS[total as 1 | 2 | 3];
  return Object.freeze(
    ratios.map((ratio) => Math.max(1, Math.ceil(fillableCellCount * ratio)))
  );
}

export function createBoardIntruderSession(
  options: CreateBoardIntruderSessionOptions
): BoardIntruderSession {
  const validPlacements = nonNegativeInteger(options.validPlacements);
  const actionCount = nonNegativeInteger(options.actionCount);

  if (
    !usesBoardIntruders(options.mode) ||
    options.puzzleSession.status === 'completed'
  ) {
    return emptySession(options.board, options.mode, validPlacements, actionCount);
  }

  const safeCharacters = buildSafeTrapCharacters(
    options.board,
    options.idioms,
    options.excludedCharacters
  );
  const eligibleCellKeys = Object.freeze(
    options.board.fillableKeys.filter(
      (key) => isCellEmpty(options.puzzleSession, key)
    )
  );
  const orderedCharacters = Object.freeze([
    ...options.orderCharacters(safeCharacters)
  ]);
  const orderedCellKeys = Object.freeze([
    ...options.orderCellKeys(eligibleCellKeys)
  ]);

  validatePermutation(
    safeCharacters,
    orderedCharacters,
    '陷阱字排序結果無效。'
  );
  validatePermutation(
    eligibleCellKeys,
    orderedCellKeys,
    '伏字格排序結果無效。'
  );

  const total = Math.min(
    boardIntruderCount(options.board.fillableKeys.length),
    orderedCharacters.length,
    orderedCellKeys.length
  );
  const thresholds = boardIntruderActivationThresholds(
    total,
    options.board.fillableKeys.length
  );
  let visibleCount = 0;
  const intruders: BoardIntruder[] = [];

  for (let index = 0; index < total; index += 1) {
    const character = orderedCharacters[index];
    const targetCellKey = orderedCellKeys[index];
    const activationAfterValidPlacements = thresholds[index];
    const revealIntervalActions = REVEAL_INTERVALS[index];
    if (
      character === undefined ||
      targetCellKey === undefined ||
      activationAfterValidPlacements === undefined ||
      revealIntervalActions === undefined
    ) {
      throw new Error('盤面伏字計畫無效。');
    }

    const active =
      activationAfterValidPlacements <= validPlacements &&
      visibleCount < MAX_VISIBLE_INTRUDERS;
    if (active) visibleCount += 1;

    intruders.push(Object.freeze({
      id: `board-intruder-${String(index + 1)}`,
      character,
      targetCellKey,
      activationAfterValidPlacements,
      revealIntervalActions,
      nextRevealAtActionCount: active
        ? actionCount + revealIntervalActions
        : null,
      revealCount: 0,
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

export function reconcileBoardIntruders(
  session: BoardIntruderSession,
  puzzleSession: PuzzleSession
): BoardIntruderSession {
  if (!usesBoardIntruders(session.mode)) return session;

  if (puzzleSession.status === 'completed') {
    return replaceIntruders(
      session,
      session.intruders.map((intruder) =>
        intruder.status === 'removed'
          ? intruder
          : Object.freeze({
              ...intruder,
              status: 'removed' as const,
              nextRevealAtActionCount: null
            })
      )
    );
  }

  let intruders = session.intruders.map((intruder) => {
    if (intruder.status === 'removed' || isCellEmpty(puzzleSession, intruder.targetCellKey)) {
      return intruder;
    }
    if (intruder.status === 'scheduled') {
      return Object.freeze({
        ...intruder,
        status: 'removed' as const,
        nextRevealAtActionCount: null
      });
    }
    if (intruder.status === 'active' || intruder.status === 'revealing') {
      return Object.freeze({
        ...intruder,
        status: 'ejecting' as const,
        nextRevealAtActionCount: null
      });
    }
    return intruder;
  });

  let visibleCount = intruders.filter((intruder) => isVisibleStatus(intruder.status)).length;
  intruders = intruders.map((intruder) => {
    if (
      intruder.status === 'scheduled' &&
      intruder.activationAfterValidPlacements <= session.validPlacements &&
      isCellEmpty(puzzleSession, intruder.targetCellKey) &&
      visibleCount < MAX_VISIBLE_INTRUDERS
    ) {
      visibleCount += 1;
      return Object.freeze({
        ...intruder,
        status: 'active' as const,
        nextRevealAtActionCount: session.actionCount + intruder.revealIntervalActions
      });
    }
    return intruder;
  });

  return replaceIntruders(session, intruders);
}

export function recordValidBoardPlacement(
  session: BoardIntruderSession,
  puzzleSession: PuzzleSession
): BoardIntruderSession {
  if (!usesBoardIntruders(session.mode)) return session;
  const advanced = Object.freeze({
    ...session,
    validPlacements: session.validPlacements + 1,
    actionCount: session.actionCount + 1
  });
  return startDueReveal(reconcileBoardIntruders(advanced, puzzleSession));
}

export function recordBoardPuzzleAction(
  session: BoardIntruderSession,
  puzzleSession: PuzzleSession
): BoardIntruderSession {
  if (!usesBoardIntruders(session.mode)) return session;
  const advanced = Object.freeze({
    ...session,
    actionCount: session.actionCount + 1
  });
  return startDueReveal(reconcileBoardIntruders(advanced, puzzleSession));
}

export function beginBoardIntruderEjection(
  session: BoardIntruderSession,
  id: string
): BoardIntruderSession {
  const index = session.intruders.findIndex(
    (intruder) =>
      intruder.id === id &&
      (intruder.status === 'active' || intruder.status === 'revealing')
  );
  if (index < 0) return session;

  return replaceIntruders(
    session,
    session.intruders.map((intruder, intruderIndex) =>
      intruderIndex === index
        ? Object.freeze({
            ...intruder,
            status: 'ejecting' as const,
            nextRevealAtActionCount: null
          })
        : intruder
    )
  );
}

export function completeBoardIntruderEjection(
  session: BoardIntruderSession,
  puzzleSession: PuzzleSession,
  id: string
): BoardIntruderSession {
  const index = session.intruders.findIndex(
    (intruder) => intruder.id === id && intruder.status === 'ejecting'
  );
  if (index < 0) return session;

  const removed = replaceIntruders(
    session,
    session.intruders.map((intruder, intruderIndex) =>
      intruderIndex === index
        ? Object.freeze({
            ...intruder,
            status: 'removed' as const,
            nextRevealAtActionCount: null
          })
        : intruder
    )
  );
  return reconcileBoardIntruders(removed, puzzleSession);
}

export function completeBoardIntruderReveal(
  session: BoardIntruderSession,
  id: string
): BoardIntruderSession {
  const index = session.intruders.findIndex(
    (intruder) => intruder.id === id && intruder.status === 'revealing'
  );
  if (index < 0) return session;

  return replaceIntruders(
    session,
    session.intruders.map((intruder, intruderIndex) => {
      if (intruderIndex !== index) return intruder;
      const revealCount = intruder.revealCount + 1;
      return Object.freeze({
        ...intruder,
        status: 'active' as const,
        revealCount,
        nextRevealAtActionCount:
          revealCount >= MAX_NATURAL_REVEALS
            ? null
            : session.actionCount + intruder.revealIntervalActions
      });
    })
  );
}

export function getVisibleBoardIntruders(
  session: BoardIntruderSession
): readonly BoardIntruder[] {
  return Object.freeze(
    session.intruders.filter((intruder) => isVisibleStatus(intruder.status))
  );
}
