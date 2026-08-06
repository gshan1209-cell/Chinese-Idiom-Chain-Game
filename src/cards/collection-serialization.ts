import type {
  CardAcquisitionRecord,
  CardCollectionState,
  CardMilestoneGrant,
  PlayerCardInventoryItem
} from './card-types.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function isTimestamp(value: unknown): value is string {
  return isNonEmptyString(value) && Number.isFinite(Date.parse(value));
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

function freezeGrant(grant: CardMilestoneGrant): CardMilestoneGrant {
  return Object.freeze({ ...grant });
}

function freezeState(state: CardCollectionState): CardCollectionState {
  return Object.freeze({
    grants: Object.freeze(state.grants.map(freezeGrant)),
    inventory: Object.freeze(state.inventory.map(freezeInventoryItem)),
    metadata: Object.freeze({ ...state.metadata })
  });
}

export function createEmptyCardCollectionState(
  now: string
): CardCollectionState {
  return freezeState({
    grants: [],
    inventory: [],
    metadata: {
      schemaVersion: 1,
      updatedAt: now
    }
  });
}

function parseGrant(value: unknown): CardMilestoneGrant | null {
  if (!isRecord(value)) return null;
  if (!isNonEmptyString(value.rewardId)) return null;
  if (!Number.isInteger(value.milestoneLevelCount) ||
      (value.milestoneLevelCount as number) <= 0 ||
      (value.milestoneLevelCount as number) % 10 !== 0) return null;
  if (!isTimestamp(value.createdAt)) return null;

  const base = {
    rewardId: value.rewardId,
    milestoneLevelCount: value.milestoneLevelCount as number,
    createdAt: value.createdAt
  };

  if (value.status === 'pending') {
    if (value.resolvedAt !== null ||
        value.revealedAt !== null ||
        value.resolvedCardId !== null ||
        value.acquisitionId !== null) return null;
    return freezeGrant({
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
      !isNonEmptyString(value.acquisitionId)) return null;

  if (value.status === 'resolved') {
    if (value.revealedAt !== null) return null;
    return freezeGrant({
      ...base,
      status: 'resolved',
      resolvedAt: value.resolvedAt,
      revealedAt: null,
      resolvedCardId: value.resolvedCardId,
      acquisitionId: value.acquisitionId
    });
  }

  if (!isTimestamp(value.revealedAt)) return null;
  return freezeGrant({
    ...base,
    status: 'revealed',
    resolvedAt: value.resolvedAt,
    revealedAt: value.revealedAt,
    resolvedCardId: value.resolvedCardId,
    acquisitionId: value.acquisitionId
  });
}

function parseAcquisition(value: unknown): CardAcquisitionRecord | null {
  if (!isRecord(value)) return null;
  if (!isNonEmptyString(value.acquisitionId) ||
      value.method !== 'milestone-reward' ||
      !isTimestamp(value.acquiredAt) ||
      !isNonEmptyString(value.sourceReference)) return null;
  return freezeAcquisition({
    acquisitionId: value.acquisitionId,
    method: 'milestone-reward',
    acquiredAt: value.acquiredAt,
    sourceReference: value.sourceReference
  });
}

function parseInventoryItem(
  value: unknown,
  usedAcquisitionIds: ReadonlySet<string>
): PlayerCardInventoryItem | null {
  if (!isRecord(value)) return null;
  if (!isNonEmptyString(value.cardId) ||
      !Number.isInteger(value.ownedCount) ||
      (value.ownedCount as number) <= 0 ||
      !isTimestamp(value.firstOwnedAt) ||
      !isTimestamp(value.lastOwnedAt) ||
      !Array.isArray(value.acquisitionHistory)) return null;

  const records: CardAcquisitionRecord[] = [];
  const localIds = new Set<string>();
  for (const rawRecord of value.acquisitionHistory) {
    const record = parseAcquisition(rawRecord);
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

export function parseCardCollectionState(
  value: unknown,
  now: string
): CardCollectionState {
  if (!isRecord(value) ||
      !Array.isArray(value.grants) ||
      !Array.isArray(value.inventory) ||
      !isRecord(value.metadata) ||
      value.metadata.schemaVersion !== 1 ||
      !isTimestamp(value.metadata.updatedAt)) {
    return createEmptyCardCollectionState(now);
  }

  const grants: CardMilestoneGrant[] = [];
  const rewardIds = new Set<string>();
  for (const rawGrant of value.grants) {
    const grant = parseGrant(rawGrant);
    if (grant === null || rewardIds.has(grant.rewardId)) continue;
    rewardIds.add(grant.rewardId);
    grants.push(grant);
  }

  const inventory: PlayerCardInventoryItem[] = [];
  const cardIds = new Set<string>();
  const acquisitionIds = new Set<string>();
  for (const rawItem of value.inventory) {
    const item = parseInventoryItem(rawItem, acquisitionIds);
    if (item === null || cardIds.has(item.cardId)) continue;
    cardIds.add(item.cardId);
    for (const record of item.acquisitionHistory) {
      acquisitionIds.add(record.acquisitionId);
    }
    inventory.push(item);
  }

  return freezeState({
    grants,
    inventory,
    metadata: {
      schemaVersion: 1,
      updatedAt: value.metadata.updatedAt
    }
  });
}
