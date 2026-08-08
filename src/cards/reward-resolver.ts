import { levelAcquisitionId } from './level-reward-grants.js';
import { minimumRarityForOrdinal } from './level-reward-pool.js';
import { milestoneAcquisitionId } from './milestone-grants.js';
import type {
  CardAcquisitionRecord,
  CardLevelGrant,
  CardMilestoneGrant,
  CardRewardResolution,
  LevelRewardCardPoolEntry,
  MilestoneCardPoolEntry,
  MinimumRewardRarity,
  PlayerCardInventoryItem,
  RandomSource,
  RewardRarity
} from './card-types.js';

export interface RewardTickets {
  readonly srTickets: number;
  readonly ssrTickets: number;
  readonly baseTickets: number;
}

const RARITY_ORDER: readonly RewardRarity[] = Object.freeze([
  'N',
  'R',
  'SR',
  'SSR'
]);

function freezeAcquisition(record: CardAcquisitionRecord): CardAcquisitionRecord {
  return Object.freeze({ ...record });
}

function validRandomValue(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value < 1;
}

function selectWeighted<T extends MilestoneCardPoolEntry>(
  candidates: readonly T[],
  randomValue: number
): T | null {
  if (candidates.length === 0) return null;
  const totalWeight = candidates.reduce((sum, card) => sum + card.weight, 0);
  const target = randomValue * totalWeight;
  let cumulative = 0;
  for (const candidate of candidates) {
    cumulative += candidate.weight;
    if (target < cumulative) return candidate;
  }
  return candidates[candidates.length - 1] ?? null;
}

export function calculateRewardTickets(
  hiddenRewardScore: number
): RewardTickets {
  if (!Number.isInteger(hiddenRewardScore) || hiddenRewardScore < 0) {
    throw new Error('invalid-hidden-score');
  }
  const ssrTickets = Math.min(Math.floor(hiddenRewardScore / 10), 100);
  const srTickets = Math.min(hiddenRewardScore, 400);
  return Object.freeze({
    srTickets,
    ssrTickets,
    baseTickets: 1000 - ssrTickets - srTickets
  });
}

function targetCandidates(
  pool: readonly LevelRewardCardPoolEntry[],
  rolledRarity: RewardRarity,
  minimumRarity: MinimumRewardRarity,
  isBaseRoll: boolean
): readonly LevelRewardCardPoolEntry[] {
  if (isBaseRoll) {
    if (minimumRarity === 'N') {
      return pool.filter((card) => card.rarity === 'N' || card.rarity === 'R');
    }
    return pool.filter((card) => card.rarity === minimumRarity);
  }

  const minimumIndex = RARITY_ORDER.indexOf(minimumRarity);
  for (
    let index = RARITY_ORDER.indexOf(rolledRarity);
    index >= minimumIndex;
    index -= 1
  ) {
    const rarity = RARITY_ORDER[index];
    const candidates = pool.filter((card) => card.rarity === rarity);
    if (candidates.length > 0) return candidates;
  }
  return Object.freeze([]);
}

export function resolvePendingLevelGrant(
  grant: CardLevelGrant,
  pool: readonly LevelRewardCardPoolEntry[],
  random: RandomSource,
  now: string
): CardRewardResolution<CardLevelGrant> {
  if (grant.status !== 'pending') {
    return Object.freeze({ grant, acquisition: null, error: null });
  }
  if (pool.length === 0) {
    return Object.freeze({ grant, acquisition: null, error: null });
  }

  const tierValue = random.next();
  if (!validRandomValue(tierValue)) {
    return Object.freeze({ grant, acquisition: null, error: 'invalid-random-value' });
  }

  const tickets = calculateRewardTickets(grant.scoreSnapshot.hiddenRewardScore);
  const rollValue = Math.floor(tierValue * 1000);
  const minimumRarity = minimumRarityForOrdinal(grant.campaignOrdinal);
  const rolledRarity: RewardRarity = rollValue < tickets.ssrTickets
    ? 'SSR'
    : rollValue < tickets.ssrTickets + tickets.srTickets
      ? 'SR'
      : minimumRarity;
  const isBaseRoll = rollValue >= tickets.ssrTickets + tickets.srTickets;
  const candidates = targetCandidates(
    pool,
    rolledRarity,
    minimumRarity,
    isBaseRoll
  );
  if (candidates.length === 0) {
    return Object.freeze({ grant, acquisition: null, error: null });
  }

  const selectionValue = random.next();
  if (!validRandomValue(selectionValue)) {
    return Object.freeze({ grant, acquisition: null, error: 'invalid-random-value' });
  }
  const selected = selectWeighted(candidates, selectionValue);
  if (selected === null) {
    return Object.freeze({ grant, acquisition: null, error: null });
  }

  const acquisitionId = levelAcquisitionId(grant.rewardId);
  const acquisition = freezeAcquisition({
    acquisitionId,
    method: 'level-reward',
    acquiredAt: now,
    sourceReference: grant.rewardId
  });
  const resolvedGrant: CardLevelGrant = Object.freeze({
    ...grant,
    probabilitySnapshot: Object.freeze({
      levelHiddenScore: grant.scoreSnapshot.levelHiddenScore,
      hiddenRewardScore: grant.scoreSnapshot.hiddenRewardScore,
      srTickets: tickets.srTickets,
      ssrTickets: tickets.ssrTickets,
      baseTickets: tickets.baseTickets,
      minimumRarity,
      rolledRarity,
      resolvedRarity: selected.rarity,
      rollValue
    }),
    status: 'resolved',
    resolvedAt: now,
    resolvedCardId: selected.id,
    acquisitionId
  });

  return Object.freeze({ grant: resolvedGrant, acquisition, error: null });
}

export function resolvePendingGrant(
  grant: CardMilestoneGrant,
  pool: readonly MilestoneCardPoolEntry[],
  _inventory: readonly PlayerCardInventoryItem[],
  random: RandomSource,
  now: string
): CardRewardResolution<CardMilestoneGrant> {
  if (grant.status !== 'pending') {
    return Object.freeze({ grant, acquisition: null, error: null });
  }
  if (pool.length === 0) {
    return Object.freeze({ grant, acquisition: null, error: null });
  }

  const randomValue = random.next();
  if (!validRandomValue(randomValue)) {
    return Object.freeze({ grant, acquisition: null, error: 'invalid-random-value' });
  }

  const selected = selectWeighted(pool, randomValue);
  if (selected === null) {
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

  return Object.freeze({ grant: resolvedGrant, acquisition, error: null });
}
