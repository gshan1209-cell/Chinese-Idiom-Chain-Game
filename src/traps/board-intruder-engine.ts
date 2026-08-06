import type { Idiom } from '../domain/idiom.js';
import type { PuzzleBoard, PuzzleSession } from '../domain/puzzle.js';
import type {
  BoardIntruder,
  BoardIntruderSession,
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
      (key) => (options.puzzleSession.values[key] ?? '') === ''
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
