export type CardRarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR';

export type IdiomDifficultyGrade = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

export type CardAcquisitionMethod =
  | 'milestone-reward'
  | 'achievement-reward'
  | 'direct-purchase'
  | 'fixed-bundle'
  | 'event-reward'
  | 'manual-grant';

export type CardApprovalStatus =
  | 'Approved'
  | 'Review'
  | 'Legacy'
  | 'Rejected';

export type CardSourceStatus = 'Approved' | 'NeedsReview' | 'Rejected';

export interface ActiveIdiomReference {
  readonly id: string;
  readonly text: string;
}

export interface IdiomCardDefinition {
  readonly id: string;
  readonly idiomId: string;
  readonly title: string;
  readonly bopomofo: readonly [string, string, string, string];
  readonly pinyin: readonly [string, string, string, string];
  readonly subtitle: string;
  readonly rarity: CardRarity;
  readonly difficulty: IdiomDifficultyGrade;
  readonly imageAsset: string;
  readonly thumbnailAsset: string;
  readonly storySummary: string;
  readonly storySource: string;
  readonly motto: string;
  readonly enabled: boolean;
  readonly approvalStatus: CardApprovalStatus;
  readonly sourceStatus: CardSourceStatus;
  readonly rarityApproved: boolean;
  readonly releaseOrder: number;
  readonly startsAt: string | null;
  readonly endsAt: string | null;
  readonly acquisitionMethods: readonly CardAcquisitionMethod[];
  readonly weight: number;
  readonly licenseEvidenceId: string | null;
}

export interface CardDefinitionFinding {
  readonly index: number;
  readonly cardId: string | null;
  readonly code: string;
  readonly message: string;
}

export interface CardDefinitionValidationResult {
  readonly validDefinitions: readonly IdiomCardDefinition[];
  readonly findings: readonly CardDefinitionFinding[];
}

export type CardGrantStatus = 'pending' | 'resolved' | 'revealed';

export interface CardMilestoneGrant {
  readonly rewardId: string;
  readonly milestoneLevelCount: number;
  readonly status: CardGrantStatus;
  readonly createdAt: string;
  readonly resolvedAt: string | null;
  readonly revealedAt: string | null;
  readonly resolvedCardId: string | null;
  readonly acquisitionId: string | null;
}

export interface CardAcquisitionRecord {
  readonly acquisitionId: string;
  readonly method: 'milestone-reward';
  readonly acquiredAt: string;
  readonly sourceReference: string;
}

export interface PlayerCardInventoryItem {
  readonly cardId: string;
  readonly ownedCount: number;
  readonly firstOwnedAt: string;
  readonly lastOwnedAt: string;
  readonly acquisitionHistory: readonly CardAcquisitionRecord[];
}

export interface RandomSource {
  next(): number;
}

export interface MilestoneCardPoolEntry {
  readonly id: string;
  readonly weight: number;
}

export interface CardRewardResolution {
  readonly grant: CardMilestoneGrant;
  readonly acquisition: CardAcquisitionRecord | null;
  readonly error: 'invalid-random-value' | null;
}
