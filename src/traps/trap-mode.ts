import type { PuzzlePlayMode } from '../domain/trap.js';

export function usesCandidateDecoys(mode: PuzzlePlayMode): boolean {
  return mode === 'trap-candidates' || mode === 'trap-board';
}

export function usesBoardIntruders(mode: PuzzlePlayMode): boolean {
  return mode === 'trap-board';
}
