import type { Difficulty } from './idiom.js';

export type BonusDifficulty = 'easy' | 'normal' | 'challenge' | 'extreme';
export type BonusRewardType = 'hint-ticket' | 'time' | 'score-multiplier' | 'shield';
export type BonusRoundPhase = 'active' | 'feedback' | 'paused' | 'settled';

export interface BonusResources {
  readonly energy: number;
  readonly hintTickets: number;
  readonly shieldLayers: number;
  readonly scoreMultiplierTurns: number;
  readonly timeBonusSeconds: number;
}

export interface EnergyGainInput {
  readonly currentEnergy: number;
  readonly combo: number;
  readonly difficulty: Difficulty;
  readonly usedHintForTurn: boolean;
}

export interface BonusQuestionChoice {
  readonly holeIndex: number;
  readonly character: string;
}

export interface BonusQuestion {
  readonly id: string;
  readonly idiomId: string;
  readonly idiomText: string;
  readonly prompt: string;
  readonly answer: string;
  readonly choices: readonly BonusQuestionChoice[];
  readonly correctHoleIndex: number;
  readonly holeCount: 6 | 9;
}

export interface BonusFeedback {
  readonly kind: 'correct' | 'wrong';
  readonly message: string;
  readonly correctIdiomText: string | null;
}

export interface BonusRound {
  readonly id: string;
  readonly settlementId: string;
  readonly rewardType: BonusRewardType;
  readonly difficulty: BonusDifficulty;
  readonly phase: BonusRoundPhase;
  readonly phaseBeforePause: Exclude<BonusRoundPhase, 'paused'> | null;
  readonly startedAtMs: number;
  readonly deadlineMs: number;
  readonly pausedAtMs: number | null;
  readonly feedbackUntilMs: number | null;
  readonly remainingMs: number;
  readonly question: BonusQuestion | null;
  readonly usedIdiomIds: ReadonlySet<string>;
  readonly recentCorrectHoles: readonly number[];
  readonly correctCount: number;
  readonly wrongCount: number;
  readonly combo: number;
  readonly maxCombo: number;
  readonly score: number;
  readonly feedback: BonusFeedback | null;
  readonly settledAtMs: number | null;
}

export interface BonusSettlement {
  readonly id: string;
  readonly rewardType: BonusRewardType;
  readonly rewardAmount: number;
  readonly perfect: boolean;
  readonly perfectScoreBonus: number;
  readonly perfectEnergyBonus: number;
}
