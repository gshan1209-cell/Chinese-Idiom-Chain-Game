export type CardRarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR';
export type RewardRarity = Exclude<CardRarity, 'UR'>;

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

export interface CardRewardScoreSnapshot {
  readonly levelHiddenScore: number;
  readonly hiddenRewardScore: number;
}

export type MinimumRewardRarity = 'N' | 'R' | 'SR';

export interface CardRewardProbabilitySnapshot {
  readonly levelHiddenScore: number;
  readonly hiddenRewardScore: number;
  readonly srTickets: number;
  readonly ssrTickets: number;
  readonly baseTickets: number;
  readonly minimumRarity: MinimumRewardRarity;
  readonly rolledRarity: RewardRarity;
  readonly resolvedRarity: RewardRarity;
  readonly rollValue: number;
}

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

export interface CardLevelGrant {
  readonly rewardId: string;
  readonly chapterId: string;
  readonly levelNumber: number;
  readonly campaignOrdinal: number;
  readonly scoreSnapshot: CardRewardScoreSnapshot;
  readonly probabilitySnapshot: CardRewardProbabilitySnapshot | null;
  readonly status: CardGrantStatus;
  readonly createdAt: string;
  readonly resolvedAt: string | null;
  readonly revealedAt: string | null;
  readonly resolvedCardId: string | null;
  readonly acquisitionId: string | null;
  readonly legacyCoverage: boolean;
}

export type CardGrant = CardMilestoneGrant | CardLevelGrant;

export interface CardAcquisitionRecord {
  readonly acquisitionId: string;
  readonly method: 'level-reward' | 'milestone-reward' | 'upgrade-reward';
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


export type CardUpgradeSourceRarity = 'N' | 'R' | 'SR';
export type CardUpgradeTargetRarity = 'R' | 'SR' | 'SSR';

export interface CardUpgradeMaterial {
  readonly cardId: string;
  readonly quantity: number;
}

export interface CardUpgradeRecord {
  readonly upgradeId: string;
  readonly sourceRarity: CardUpgradeSourceRarity;
  readonly targetRarity: CardUpgradeTargetRarity;
  readonly materials: readonly CardUpgradeMaterial[];
  readonly resultCardId: string;
  readonly acquisitionId: string;
  readonly createdAt: string;
}

export interface RandomSource {
  next(): number;
}

export interface MilestoneCardPoolEntry {
  readonly id: string;
  readonly weight: number;
}

export interface LevelRewardCardPoolEntry extends MilestoneCardPoolEntry {
  readonly rarity: RewardRarity;
}

export interface CardRewardResolution<
  TGrant extends CardGrant = CardGrant
> {
  readonly grant: TGrant;
  readonly acquisition: CardAcquisitionRecord | null;
  readonly error: 'invalid-random-value' | null;
}

export interface CardCollectionMetadata {
  readonly schemaVersion: 2;
  readonly updatedAt: string;
}

export interface CardCollectionState {
  readonly grants: readonly CardGrant[];
  readonly inventory: readonly PlayerCardInventoryItem[];
  readonly upgrades: readonly CardUpgradeRecord[];
  readonly metadata: CardCollectionMetadata;
}

export interface CardCollectionTransactionResult<T> {
  readonly state: CardCollectionState;
  readonly value: T;
}

export interface CardCollectionRepository {
  load(): Promise<CardCollectionState>;
  transact<T>(
    operation: (
      current: CardCollectionState
    ) => CardCollectionTransactionResult<T>
  ): Promise<T>;
  clear(now: string): Promise<void>;
}
