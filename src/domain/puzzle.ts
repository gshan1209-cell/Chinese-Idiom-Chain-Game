export type PuzzleDirection = 'horizontal' | 'vertical';
export type PuzzleDifficulty = 'easy' | 'normal' | 'hard';

export interface PuzzlePlacement {
  readonly id: string;
  readonly idiomId: string;
  readonly text: string;
  readonly direction: PuzzleDirection;
  readonly startRow: number;
  readonly startColumn: number;
}

export interface PuzzleLevel {
  readonly id: string;
  readonly chapterId: string;
  readonly levelNumber: number;
  readonly title: string;
  readonly width: number;
  readonly height: number;
  readonly placements: readonly PuzzlePlacement[];
  readonly fixedCells: readonly string[];
  readonly difficulty: PuzzleDifficulty;
  readonly hintLimit: number;
}

export interface PuzzleCell {
  readonly key: string;
  readonly row: number;
  readonly column: number;
  readonly answer: string;
  readonly fixed: boolean;
  readonly placementIds: readonly string[];
}

export interface PuzzleBoard {
  readonly level: PuzzleLevel;
  readonly cells: ReadonlyMap<string, PuzzleCell>;
  readonly fillableKeys: readonly string[];
  readonly candidateCharacters: readonly string[];
}

export function cellKey(row: number, column: number): string {
  return `${row}:${column}`;
}

export interface PuzzleTile {
  readonly id: string;
  readonly character: string;
  readonly usedBy: string | null;
}

export type PuzzleSessionStatus = 'playing' | 'completed';

export interface PuzzleSession {
  readonly board: PuzzleBoard;
  readonly values: Readonly<Record<string, string>>;
  readonly tileByCell: Readonly<Record<string, string>>;
  readonly tiles: readonly PuzzleTile[];
  readonly selectedCellKey: string | null;
  readonly status: PuzzleSessionStatus;
  readonly score: number;
  readonly mistakes: number;
  readonly hintsUsed: number;
  readonly correctCells: number;
}

export interface PlaceTileResult {
  readonly session: PuzzleSession;
  readonly correct: boolean;
  readonly cellKey: string | null;
}

export interface HintResult {
  readonly session: PuzzleSession;
  readonly hintedCellKey: string | null;
}
