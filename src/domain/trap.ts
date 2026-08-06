export type PuzzlePlayMode =
  | 'standard'
  | 'trap-candidates'
  | 'trap-board'
  | 'trap-stubborn';

export type CandidateDecoyStatus =
  | 'scheduled'
  | 'active'
  | 'ejecting'
  | 'removed';

export interface CandidateDecoy {
  readonly id: string;
  readonly character: string;
  readonly activationAfterValidPlacements: number;
  readonly status: CandidateDecoyStatus;
}

export interface CandidateDecoySession {
  readonly levelId: string;
  readonly mode: PuzzlePlayMode;
  readonly validPlacements: number;
  readonly decoys: readonly CandidateDecoy[];
}
