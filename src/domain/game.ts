import type { Difficulty, Idiom } from './idiom.js';

export type GameMode = 'classic' | 'timed' | 'choice';
export type GameSessionResult = 'completed' | 'quit' | 'timeout';
export type TurnErrorCode =
  | 'IDIOM_NOT_FOUND'
  | 'CHAIN_CHAR_MISMATCH'
  | 'IDIOM_ALREADY_USED'
  | 'NO_AVAILABLE_CANDIDATE'
  | 'SESSION_ENDED'
  | 'DICTIONARY_UNAVAILABLE';

export interface GameSession {
  readonly id: string;
  readonly mode: GameMode;
  readonly difficulty: Difficulty;
  readonly startedAt: string;
  readonly endedAt: string | null;
  readonly score: number;
  readonly correctCount: number;
  readonly wrongCount: number;
  readonly combo: number;
  readonly maxCombo: number;
  readonly hintsUsed: number;
  readonly previousIdiom: Idiom;
  readonly usedIdiomIds: ReadonlySet<string>;
  readonly result: GameSessionResult | null;
}

export interface TurnResult {
  readonly correct: boolean;
  readonly errorCode: TurnErrorCode | null;
  readonly scoreDelta: number;
  readonly combo: number;
  readonly answer: Idiom | null;
  readonly nextRequiredChar: string;
}

export interface CreateSessionInput {
  readonly mode: GameMode;
  readonly difficulty: Difficulty;
}

export type EndReason = GameSessionResult;
