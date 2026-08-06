import { milestoneAcquisitionId } from './milestone-grants.js';
import type {
  CardAcquisitionRecord,
  CardMilestoneGrant,
  CardRewardResolution,
  MilestoneCardPoolEntry,
  PlayerCardInventoryItem,
  RandomSource
} from './card-types.js';

function freezeAcquisition(record: CardAcquisitionRecord): CardAcquisitionRecord {
  return Object.freeze({ ...record });
}

function resolvePool(
  pool: readonly MilestoneCardPoolEntry[],
  inventory: readonly PlayerCardInventoryItem[]
): readonly MilestoneCardPoolEntry[] {
  const ownedIds = new Set(
    inventory.filter((item) => item.ownedCount > 0).map((item) => item.cardId)
  );
  const unowned = pool.filter((card) => !ownedIds.has(card.id));
  return unowned.length > 0 ? unowned : pool;
}

export function resolvePendingGrant(
  grant: CardMilestoneGrant,
  pool: readonly MilestoneCardPoolEntry[],
  inventory: readonly PlayerCardInventoryItem[],
  random: RandomSource,
  now: string
): CardRewardResolution {
  if (grant.status !== 'pending') {
    return Object.freeze({ grant, acquisition: null, error: null });
  }

  const candidates = resolvePool(pool, inventory);
  if (candidates.length === 0) {
    return Object.freeze({ grant, acquisition: null, error: null });
  }

  const randomValue = random.next();
  if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
    return Object.freeze({
      grant,
      acquisition: null,
      error: 'invalid-random-value'
    });
  }

  const totalWeight = candidates.reduce((sum, card) => sum + card.weight, 0);
  const target = randomValue * totalWeight;
  let cumulative = 0;
  let selected = candidates[candidates.length - 1];
  for (const candidate of candidates) {
    cumulative += candidate.weight;
    if (target < cumulative) {
      selected = candidate;
      break;
    }
  }

  if (selected === undefined) {
    return Object.freeze({ grant, acquisition: null, error: null });
  }

  const acquisitionId = milestoneAcquisitionId(grant.rewardId);
  const acquisition = freezeAcquisition({
    acquisitionId,
    method: 'milestone-reward',
    acquiredAt: now,
    sourceReference: grant.rewardId
  });
  const resolvedGrant: CardMilestoneGrant = Object.freeze({
    ...grant,
    status: 'resolved',
    resolvedAt: now,
    resolvedCardId: selected.id,
    acquisitionId
  });

  return Object.freeze({
    grant: resolvedGrant,
    acquisition,
    error: null
  });
}
