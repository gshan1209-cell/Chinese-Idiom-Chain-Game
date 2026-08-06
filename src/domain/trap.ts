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

export type BoardIntruderStatus =
  | 'scheduled'
  | 'active'
  | 'revealing'
  | 'ejecting'
  | 'removed';

export interface BoardIntruder {
  readonly id: string;
  readonly character: string;
  readonly targetCellKey: string;
  readonly activationAfterValidPlacements: number;
  readonly revealIntervalActions: number;
  readonly nextRevealAtActionCount: number | null;
  readonly revealCount: number;
  readonly status: BoardIntruderStatus;
}

export interface BoardIntruderSession {
  readonly levelId: string;
  readonly mode: PuzzlePlayMode;
  readonly validPlacements: number;
  readonly actionCount: number;
  readonly intruders: readonly BoardIntruder[];
}
