import type {
  CardAcquisitionRecord,
  CardCollectionState,
  CardGrant,
  CardLevelGrant,
  CardMilestoneGrant,
  CardRewardProbabilitySnapshot,
  CardRewardScoreSnapshot,
  CardUpgradeMaterial,
  CardUpgradeRecord,
  CardUpgradeTargetRarity,
  MinimumRewardRarity,
  PlayerCardInventoryItem,
  RewardRarity
} from './card-types.js';
import {
  levelAcquisitionId,
  levelRewardId
} from './level-reward-grants.js';
import { minimumRarityForOrdinal } from './level-reward-pool.js';
import {
  milestoneAcquisitionId,
  milestoneRewardId
} from './milestone-grants.js';

const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u;
const MILESTONE_REWARD_PATTERN = /^card-grant:main-levels:(\d+)$/u;
const LEVEL_REWARD_PATTERN = /^card-grant:main-level:([^:]+):(\d+)$/u;
const REWARD_RARITIES = new Set<RewardRarity>(['N', 'R', 'SR', 'SSR']);
const REWARD_RARITY_RANK: Readonly<Record<RewardRarity, number>> = Object.freeze({
  N: 0,
  R: 1,
  SR: 2,
  SSR: 3
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0;
}

function isTimestamp(value: unknown): value is string {
  return isNonEmptyString(value) &&
    ISO_TIMESTAMP_PATTERN.test(value) &&
    Number.isFinite(Date.parse(value));
}

function milestoneLevelCountFromRewardId(rewardId: string): number | null {
  const match = MILESTONE_REWARD_PATTERN.exec(rewardId);
  if (match === null) return null;
  const milestoneLevelCount = Number(match[1]);
  if (!isPositiveInteger(milestoneLevelCount) ||
      milestoneLevelCount % 10 !== 0 ||
      milestoneRewardId(milestoneLevelCount) !== rewardId) return null;
  return milestoneLevelCount;
}

function isLevelRewardId(rewardId: string): boolean {
  const match = LEVEL_REWARD_PATTERN.exec(rewardId);
  if (match === null) return false;
  const levelNumber = Number(match[2]);
  return isPositiveInteger(levelNumber) &&
    levelRewardId(match[1] ?? '', levelNumber) === rewardId;
}

function freezeAcquisition(
  record: CardAcquisitionRecord
): CardAcquisitionRecord {
  return Object.freeze({ ...record });
}

function freezeInventoryItem(
  item: PlayerCardInventoryItem
): PlayerCardInventoryItem {
  return Object.freeze({
    ...item,
    acquisitionHistory: Object.freeze(
      item.acquisitionHistory.map(freezeAcquisition)
    )
  });
}

function freezeScoreSnapshot(
  snapshot: CardRewardScoreSnapshot
): CardRewardScoreSnapshot {
  return Object.freeze({ ...snapshot });
}

function freezeProbabilitySnapshot(
  snapshot: CardRewardProbabilitySnapshot
): CardRewardProbabilitySnapshot {
  return Object.freeze({ ...snapshot });
}

function freezeGrant(grant: CardGrant): CardGrant {
  if ('campaignOrdinal' in grant) {
    return Object.freeze({
      ...grant,
      scoreSnapshot: freezeScoreSnapshot(grant.scoreSnapshot),
      probabilitySnapshot: grant.probabilitySnapshot === null
        ? null
        : freezeProbabilitySnapshot(grant.probabilitySnapshot)
    });
  }
  return Object.freeze({ ...grant });
}

function freezeUpgradeMaterial(
  material: CardUpgradeMaterial
): CardUpgradeMaterial {
  return Object.freeze({ ...material });
}

function freezeUpgrade(record: CardUpgradeRecord): CardUpgradeRecord {
  return Object.freeze({
    ...record,
    materials: Object.freeze(record.materials.map(freezeUpgradeMaterial))
  });
}

function freezeState(state: CardCollectionState): CardCollectionState {
  return Object.freeze({
    grants: Object.freeze(state.grants.map(freezeGrant)),
    inventory: Object.freeze(state.inventory.map(freezeInventoryItem)),
    upgrades: Object.freeze(state.upgrades.map(freezeUpgrade)),
    metadata: Object.freeze({ ...state.metadata })
  });
}

export function createEmptyCardCollectionState(
  now: string
): CardCollectionState {
  return freezeState({
    grants: [],
    inventory: [],
    upgrades: [],
    metadata: {
      schemaVersion: 2,
      updatedAt: now
    }
  });
}

function parseMilestoneGrant(value: unknown): CardMilestoneGrant | null {
  if (!isRecord(value) || !isNonEmptyString(value.rewardId)) return null;
  if (!isPositiveInteger(value.milestoneLevelCount) ||
      value.milestoneLevelCount % 10 !== 0) return null;
  const milestoneLevelCount = value.milestoneLevelCount;
  if (value.rewardId !== milestoneRewardId(milestoneLevelCount) ||
      !isTimestamp(value.createdAt)) return null;

  const base = {
    rewardId: value.rewardId,
    milestoneLevelCount,
    createdAt: value.createdAt
  };

  if (value.status === 'pending') {
    if (value.resolvedAt !== null ||
        value.revealedAt !== null ||
        value.resolvedCardId !== null ||
        value.acquisitionId !== null) return null;
    return Object.freeze({
      ...base,
      status: 'pending',
      resolvedAt: null,
      revealedAt: null,
      resolvedCardId: null,
      acquisitionId: null
    });
  }

  if (value.status !== 'resolved' && value.status !== 'revealed') return null;
  if (!isTimestamp(value.resolvedAt) ||
      !isNonEmptyString(value.resolvedCardId) ||
      !isNonEmptyString(value.acquisitionId) ||
      value.acquisitionId !== milestoneAcquisitionId(value.rewardId)) return null;

  if (value.status === 'resolved') {
    if (value.revealedAt !== null) return null;
    return Object.freeze({
      ...base,
      status: 'resolved',
      resolvedAt: value.resolvedAt,
      revealedAt: null,
      resolvedCardId: value.resolvedCardId,
      acquisitionId: value.acquisitionId
    });
  }

  if (!isTimestamp(value.revealedAt)) return null;
  return Object.freeze({
    ...base,
    status: 'revealed',
    resolvedAt: value.resolvedAt,
    revealedAt: value.revealedAt,
    resolvedCardId: value.resolvedCardId,
    acquisitionId: value.acquisitionId
  });
}

function parseScoreSnapshot(value: unknown): CardRewardScoreSnapshot | null {
  if (!isRecord(value) ||
      !isNonNegativeInteger(value.levelHiddenScore) ||
      !isNonNegativeInteger(value.hiddenRewardScore) ||
      value.hiddenRewardScore < value.levelHiddenScore) return null;
  return freezeScoreSnapshot({
    levelHiddenScore: value.levelHiddenScore,
    hiddenRewardScore: value.hiddenRewardScore
  });
}

function expectedRolledRarity(
  rollValue: number,
  ssrTickets: number,
  srTickets: number,
  minimumRarity: MinimumRewardRarity
): RewardRarity {
  if (rollValue < ssrTickets) return 'SSR';
  if (rollValue < ssrTickets + srTickets) return 'SR';
  return minimumRarity;
}

function parseProbabilitySnapshot(
  value: unknown,
  scoreSnapshot: CardRewardScoreSnapshot,
  campaignOrdinal: number
): CardRewardProbabilitySnapshot | null {
  if (!isRecord(value) ||
      value.levelHiddenScore !== scoreSnapshot.levelHiddenScore ||
      value.hiddenRewardScore !== scoreSnapshot.hiddenRewardScore ||
      !isNonNegativeInteger(value.srTickets) ||
      !isNonNegativeInteger(value.ssrTickets) ||
      !isNonNegativeInteger(value.baseTickets) ||
      value.srTickets !== Math.min(scoreSnapshot.hiddenRewardScore, 400) ||
      value.ssrTickets !== Math.min(
        Math.floor(scoreSnapshot.hiddenRewardScore / 10),
        100
      ) ||
      value.baseTickets !== 1000 - value.srTickets - value.ssrTickets ||
      value.minimumRarity !== minimumRarityForOrdinal(campaignOrdinal) ||
      !REWARD_RARITIES.has(value.rolledRarity as RewardRarity) ||
      !REWARD_RARITIES.has(value.resolvedRarity as RewardRarity) ||
      REWARD_RARITY_RANK[value.resolvedRarity as RewardRarity] <
        REWARD_RARITY_RANK[value.minimumRarity as MinimumRewardRarity] ||
      !Number.isInteger(value.rollValue) ||
      (value.rollValue as number) < 0 ||
      (value.rollValue as number) >= 1000 ||
      ((value.rollValue as number) < value.ssrTickets + value.srTickets &&
        REWARD_RARITY_RANK[value.resolvedRarity as RewardRarity] >
          REWARD_RARITY_RANK[value.rolledRarity as RewardRarity]) ||
      ((value.rollValue as number) >= value.ssrTickets + value.srTickets &&
        (value.minimumRarity === 'N'
          ? value.resolvedRarity !== 'N' && value.resolvedRarity !== 'R'
          : value.resolvedRarity !== value.minimumRarity)) ||
      value.rolledRarity !== expectedRolledRarity(
        value.rollValue as number,
        value.ssrTickets,
        value.srTickets,
        value.minimumRarity as MinimumRewardRarity
      )) return null;

  return freezeProbabilitySnapshot({
    levelHiddenScore: value.levelHiddenScore,
    hiddenRewardScore: value.hiddenRewardScore,
    srTickets: value.srTickets,
    ssrTickets: value.ssrTickets,
    baseTickets: value.baseTickets,
    minimumRarity: value.minimumRarity as MinimumRewardRarity,
    rolledRarity: value.rolledRarity as RewardRarity,
    resolvedRarity: value.resolvedRarity as RewardRarity,
    rollValue: value.rollValue as number
  });
}

function parseLevelGrant(value: unknown): CardLevelGrant | null {
  if (!isRecord(value) ||
      !isNonEmptyString(value.rewardId) ||
      !isNonEmptyString(value.chapterId) ||
      !isPositiveInteger(value.levelNumber) ||
      !isPositiveInteger(value.campaignOrdinal) ||
      value.rewardId !== levelRewardId(value.chapterId, value.levelNumber) ||
      !isTimestamp(value.createdAt) ||
      typeof value.legacyCoverage !== 'boolean') return null;

  const scoreSnapshot = parseScoreSnapshot(value.scoreSnapshot);
  if (scoreSnapshot === null) return null;

  const base = {
    rewardId: value.rewardId,
    chapterId: value.chapterId,
    levelNumber: value.levelNumber,
    campaignOrdinal: value.campaignOrdinal,
    scoreSnapshot,
    createdAt: value.createdAt,
    legacyCoverage: value.legacyCoverage
  };

  if (value.status === 'pending') {
    if (value.probabilitySnapshot !== null ||
        value.resolvedAt !== null ||
        value.revealedAt !== null ||
        value.resolvedCardId !== null ||
        value.acquisitionId !== null) return null;
    return Object.freeze({
      ...base,
      probabilitySnapshot: null,
      status: 'pending',
      resolvedAt: null,
      revealedAt: null,
      resolvedCardId: null,
      acquisitionId: null
    });
  }

  if (value.status !== 'resolved' && value.status !== 'revealed') return null;
  const probabilitySnapshot = parseProbabilitySnapshot(
    value.probabilitySnapshot,
    scoreSnapshot,
    value.campaignOrdinal
  );
  if (probabilitySnapshot === null ||
      !isTimestamp(value.resolvedAt) ||
      !isNonEmptyString(value.resolvedCardId) ||
      !isNonEmptyString(value.acquisitionId) ||
      value.acquisitionId !== levelAcquisitionId(value.rewardId)) return null;

  if (value.status === 'resolved') {
    if (value.revealedAt !== null) return null;
    return Object.freeze({
      ...base,
      probabilitySnapshot,
      status: 'resolved',
      resolvedAt: value.resolvedAt,
      revealedAt: null,
      resolvedCardId: value.resolvedCardId,
      acquisitionId: value.acquisitionId
    });
  }

  if (!isTimestamp(value.revealedAt)) return null;
  return Object.freeze({
    ...base,
    probabilitySnapshot,
    status: 'revealed',
    resolvedAt: value.resolvedAt,
    revealedAt: value.revealedAt,
    resolvedCardId: value.resolvedCardId,
    acquisitionId: value.acquisitionId
  });
}

function parseAcquisition(
  value: unknown,
  schemaVersion: 1 | 2
): CardAcquisitionRecord | null {
  if (!isRecord(value) ||
      !isNonEmptyString(value.acquisitionId) ||
      !isTimestamp(value.acquiredAt) ||
      !isNonEmptyString(value.sourceReference)) return null;

  if (value.method === 'milestone-reward') {
    if (milestoneLevelCountFromRewardId(value.sourceReference) === null ||
        value.acquisitionId !== milestoneAcquisitionId(value.sourceReference)) return null;
  } else if (schemaVersion === 2 && value.method === 'level-reward') {
    if (!isLevelRewardId(value.sourceReference) ||
        value.acquisitionId !== levelAcquisitionId(value.sourceReference)) return null;
  } else if (schemaVersion === 2 && value.method === 'upgrade-reward') {
    if (value.acquisitionId !== `card-acquisition:${value.sourceReference}`) return null;
  } else {
    return null;
  }

  return freezeAcquisition({
    acquisitionId: value.acquisitionId,
    method: value.method,
    acquiredAt: value.acquiredAt,
    sourceReference: value.sourceReference
  });
}

function parseInventoryItem(
  value: unknown,
  usedAcquisitionIds: ReadonlySet<string>,
  schemaVersion: 1 | 2
): PlayerCardInventoryItem | null {
  if (!isRecord(value) ||
      !isNonEmptyString(value.cardId) ||
      !isPositiveInteger(value.ownedCount) ||
      !isTimestamp(value.firstOwnedAt) ||
      !isTimestamp(value.lastOwnedAt) ||
      !Array.isArray(value.acquisitionHistory)) return null;

  const records: CardAcquisitionRecord[] = [];
  const localIds = new Set<string>();
  for (const rawRecord of value.acquisitionHistory) {
    const record = parseAcquisition(rawRecord, schemaVersion);
    if (record === null ||
        localIds.has(record.acquisitionId) ||
        usedAcquisitionIds.has(record.acquisitionId)) return null;
    localIds.add(record.acquisitionId);
    records.push(record);
  }

  if (records.length !== value.ownedCount) return null;

  return freezeInventoryItem({
    cardId: value.cardId,
    ownedCount: value.ownedCount,
    firstOwnedAt: value.firstOwnedAt,
    lastOwnedAt: value.lastOwnedAt,
    acquisitionHistory: records
  });
}

function parseUpgradeMaterial(value: unknown): CardUpgradeMaterial | null {
  if (!isRecord(value) ||
      !isNonEmptyString(value.cardId) ||
      !isPositiveInteger(value.quantity)) return null;
  return freezeUpgradeMaterial({
    cardId: value.cardId,
    quantity: value.quantity
  });
}

function parseUpgrade(value: unknown): CardUpgradeRecord | null {
  if (!isRecord(value) ||
      !isNonEmptyString(value.upgradeId) ||
      !isNonEmptyString(value.resultCardId) ||
      !isNonEmptyString(value.acquisitionId) ||
      value.acquisitionId !== `card-acquisition:${value.upgradeId}` ||
      !isTimestamp(value.createdAt) ||
      !Array.isArray(value.materials)) return null;

  const targetBySource = { N: 'R', R: 'SR', SR: 'SSR' } as const;
  if (value.sourceRarity !== 'N' &&
      value.sourceRarity !== 'R' &&
      value.sourceRarity !== 'SR') return null;
  if (value.targetRarity !== targetBySource[value.sourceRarity]) return null;

  const materials: CardUpgradeMaterial[] = [];
  const cardIds = new Set<string>();
  let total = 0;
  for (const rawMaterial of value.materials) {
    const material = parseUpgradeMaterial(rawMaterial);
    if (material === null || cardIds.has(material.cardId)) return null;
    cardIds.add(material.cardId);
    total += material.quantity;
    materials.push(material);
  }
  if (total !== 10) return null;

  return freezeUpgrade({
    upgradeId: value.upgradeId,
    sourceRarity: value.sourceRarity,
    targetRarity: value.targetRarity as CardUpgradeTargetRarity,
    materials,
    resultCardId: value.resultCardId,
    acquisitionId: value.acquisitionId,
    createdAt: value.createdAt
  });
}

export function parseCardCollectionState(
  value: unknown,
  now: string
): CardCollectionState {
  if (!isRecord(value) ||
      !Array.isArray(value.grants) ||
      !Array.isArray(value.inventory) ||
      !isRecord(value.metadata) ||
      (value.metadata.schemaVersion !== 1 && value.metadata.schemaVersion !== 2) ||
      !isTimestamp(value.metadata.updatedAt)) {
    return createEmptyCardCollectionState(now);
  }

  const schemaVersion = value.metadata.schemaVersion;
  const grants: CardGrant[] = [];
  const rewardIds = new Set<string>();
  for (const rawGrant of value.grants) {
    const grant = schemaVersion === 1
      ? parseMilestoneGrant(rawGrant)
      : parseMilestoneGrant(rawGrant) ?? parseLevelGrant(rawGrant);
    if (grant === null || rewardIds.has(grant.rewardId)) continue;
    rewardIds.add(grant.rewardId);
    grants.push(grant);
  }

  const inventory: PlayerCardInventoryItem[] = [];
  const cardIds = new Set<string>();
  const acquisitionIds = new Set<string>();
  for (const rawItem of value.inventory) {
    const item = parseInventoryItem(rawItem, acquisitionIds, schemaVersion);
    if (item === null || cardIds.has(item.cardId)) continue;
    cardIds.add(item.cardId);
    for (const record of item.acquisitionHistory) {
      acquisitionIds.add(record.acquisitionId);
    }
    inventory.push(item);
  }

  const upgrades: CardUpgradeRecord[] = [];
  const upgradeIds = new Set<string>();
  const rawUpgrades = schemaVersion === 2 && Array.isArray(value.upgrades)
    ? value.upgrades
    : [];
  for (const rawUpgrade of rawUpgrades) {
    const upgrade = parseUpgrade(rawUpgrade);
    if (upgrade === null || upgradeIds.has(upgrade.upgradeId)) continue;
    upgradeIds.add(upgrade.upgradeId);
    upgrades.push(upgrade);
  }

  return freezeState({
    grants,
    inventory,
    upgrades,
    metadata: {
      schemaVersion: 2,
      updatedAt: value.metadata.updatedAt
    }
  });
}
