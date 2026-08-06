import type { Idiom } from '../domain/idiom.js';
import type { PuzzleBoard } from '../domain/puzzle.js';
import type {
  CandidateDecoy,
  CandidateDecoySession,
  CandidateDecoyStatus,
  PuzzlePlayMode
} from '../domain/trap.js';
import { usesCandidateDecoys } from './trap-mode.js';

const THRESHOLD_RATIOS = Object.freeze({
  1: Object.freeze([0.25]),
  2: Object.freeze([0.2, 0.55]),
  3: Object.freeze([0.15, 0.45, 0.7]),
  4: Object.freeze([0.12, 0.35, 0.58, 0.78])
} as const);

export type CharacterOrderer = (
  characters: readonly string[]
) => readonly string[];

export interface CreateCandidateDecoySessionOptions {
  readonly board: PuzzleBoard;
  readonly idioms: readonly Idiom[];
  readonly mode: PuzzlePlayMode;
  readonly orderCharacters: CharacterOrderer;
  readonly validPlacements?: number;
}

export function candidateDecoyCount(fillableCellCount: number): number {
  if (!Number.isInteger(fillableCellCount) || fillableCellCount < 1) return 0;
  return Math.min(4, Math.max(1, Math.ceil(fillableCellCount * 0.18)));
}

export function candidateDecoyActivationThresholds(
  total: number,
  fillableCellCount: number
): readonly number[] {
  if (
    !Number.isInteger(total) ||
    total < 1 ||
    total > 4 ||
    !Number.isInteger(fillableCellCount) ||
    fillableCellCount < 1
  ) {
    return Object.freeze([]);
  }
  const ratios = THRESHOLD_RATIOS[total as 1 | 2 | 3 | 4];
  return Object.freeze(
    ratios.map((ratio) => Math.max(1, Math.ceil(fillableCellCount * ratio)))
  );
}

function safeCharacters(
  board: PuzzleBoard,
  idioms: readonly Idiom[]
): readonly string[] {
  const forbidden = new Set<string>(board.candidateCharacters);
  for (const cell of board.cells.values()) forbidden.add(cell.answer);

  const safe = new Set<string>();
  for (const idiom of idioms) {
    if (!idiom.enabled) continue;
    for (const character of idiom.text) {
      if (!forbidden.has(character)) safe.add(character);
    }
  }
  return Object.freeze([...safe]);
}

function validateOrderedCharacters(
  safe: readonly string[],
  ordered: readonly string[]
): void {
  const safeSet = new Set(safe);
  const orderedSet = new Set(ordered);
  if (
    ordered.length !== safe.length ||
    orderedSet.size !== ordered.length ||
    ordered.some((character) => !safeSet.has(character))
  ) {
    throw new Error('偽字排序結果無效。');
  }
}

export function createCandidateDecoySession(
  options: CreateCandidateDecoySessionOptions
): CandidateDecoySession {
  const validPlacements = Number.isInteger(options.validPlacements) &&
    (options.validPlacements ?? 0) > 0
    ? options.validPlacements ?? 0
    : 0;

  if (!usesCandidateDecoys(options.mode)) {
    return Object.freeze({
      levelId: options.board.level.id,
      mode: options.mode,
      validPlacements,
      decoys: Object.freeze([])
    });
  }

  const safe = safeCharacters(options.board, options.idioms);
  const ordered = Object.freeze([...options.orderCharacters(safe)]);
  validateOrderedCharacters(safe, ordered);

  const total = Math.min(
    candidateDecoyCount(options.board.fillableKeys.length),
    ordered.length
  );
  const thresholds = candidateDecoyActivationThresholds(
    total,
    options.board.fillableKeys.length
  );
  const decoys: CandidateDecoy[] = ordered.slice(0, total).map((character, index) => {
    const threshold = thresholds[index];
    if (threshold === undefined) throw new Error('偽字啟動門檻無效。');
    return Object.freeze({
      id: `candidate-decoy-${String(index + 1)}`,
      character,
      activationAfterValidPlacements: threshold,
      status: threshold <= validPlacements ? 'active' : 'scheduled'
    });
  });

  return Object.freeze({
    levelId: options.board.level.id,
    mode: options.mode,
    validPlacements,
    decoys: Object.freeze(decoys)
  });
}

export function recordValidCandidatePlacement(
  session: CandidateDecoySession
): CandidateDecoySession {
  if (!usesCandidateDecoys(session.mode)) return session;

  const validPlacements = session.validPlacements + 1;
  const decoys = session.decoys.map((decoy) => {
    if (
      decoy.status === 'scheduled' &&
      decoy.activationAfterValidPlacements <= validPlacements
    ) {
      return Object.freeze({ ...decoy, status: 'active' as const });
    }
    return decoy;
  });

  return Object.freeze({
    ...session,
    validPlacements,
    decoys: Object.freeze(decoys)
  });
}

function transitionCandidateDecoy(
  session: CandidateDecoySession,
  id: string,
  from: CandidateDecoyStatus,
  to: CandidateDecoyStatus
): CandidateDecoySession {
  const index = session.decoys.findIndex(
    (decoy) => decoy.id === id && decoy.status === from
  );
  if (index < 0) return session;

  const decoys = session.decoys.map((decoy, decoyIndex) =>
    decoyIndex === index
      ? Object.freeze({ ...decoy, status: to })
      : decoy
  );
  return Object.freeze({ ...session, decoys: Object.freeze(decoys) });
}

export function beginCandidateDecoyEjection(
  session: CandidateDecoySession,
  id: string
): CandidateDecoySession {
  return transitionCandidateDecoy(session, id, 'active', 'ejecting');
}

export function completeCandidateDecoyEjection(
  session: CandidateDecoySession,
  id: string
): CandidateDecoySession {
  return transitionCandidateDecoy(session, id, 'ejecting', 'removed');
}

export function getVisibleCandidateDecoys(
  session: CandidateDecoySession
): readonly CandidateDecoy[] {
  return Object.freeze(
    session.decoys.filter(
      (decoy) => decoy.status === 'active' || decoy.status === 'ejecting'
    )
  );
}
