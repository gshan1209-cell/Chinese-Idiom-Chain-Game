import type { PuzzlePlayMode } from '../domain/trap.js';

export function usesCandidateDecoys(mode: PuzzlePlayMode): boolean {
  return mode === 'trap-candidates' || mode === 'trap-board' || mode === 'trap-stubborn';
}

export function usesBoardIntruders(mode: PuzzlePlayMode): boolean {
  return mode === 'trap-board' || mode === 'trap-stubborn';
}

export function usesStubbornIntruders(mode: PuzzlePlayMode): boolean {
  return mode === 'trap-stubborn';
}
