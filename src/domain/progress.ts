export type LevelStars = 1 | 2 | 3;

export interface LevelCompletionResult {
  readonly levelId: string;
  readonly levelNumber: number;
  readonly score: number;
  readonly mistakes: number;
  readonly hintsUsed: number;
}

export interface LevelProgress {
  readonly levelId: string;
  readonly completed: true;
  readonly stars: LevelStars;
  readonly bestScore: number;
  readonly bestMistakes: number;
  readonly bestHintsUsed: number;
  readonly completionCount: number;
  readonly firstCompletedAt: string;
  readonly lastCompletedAt: string;
}

export interface CampaignProgress {
  readonly schemaVersion: 1;
  readonly campaignId: 'chapter-1';
  readonly highestUnlockedLevel: number;
  readonly lastPlayedLevel: number;
  readonly levelProgressById: Readonly<Record<string, LevelProgress>>;
  readonly updatedAt: string;
}
