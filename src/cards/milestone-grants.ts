import type { CampaignProgress } from '../domain/progress.js';
import type { CardMilestoneGrant } from './card-types.js';

const MILESTONE_SIZE = 10;

export function listMilestoneLevelCounts(
  completedUniqueMainLevels: number
): readonly number[] {
  if (!Number.isInteger(completedUniqueMainLevels) || completedUniqueMainLevels < MILESTONE_SIZE) {
    return Object.freeze([]);
  }
  const result: number[] = [];
  const highest = Math.floor(completedUniqueMainLevels / MILESTONE_SIZE) * MILESTONE_SIZE;
  for (let milestone = MILESTONE_SIZE; milestone <= highest; milestone += MILESTONE_SIZE) {
    result.push(milestone);
  }
  return Object.freeze(result);
}

export function countCompletedUniqueMainLevels(progress: CampaignProgress): number {
  return Object.values(progress.levelProgressById).filter((level) =>
    level.completed && level.completionCount > 0
  ).length;
}

export function milestoneRewardId(milestoneLevelCount: number): string {
  return `card-grant:main-levels:${String(milestoneLevelCount)}`;
}

export function milestoneAcquisitionId(rewardId: string): string {
  return `card-acquisition:${rewardId}`;
}

function createPendingGrant(
  milestoneLevelCount: number,
  now: string
): CardMilestoneGrant {
  return Object.freeze({
    rewardId: milestoneRewardId(milestoneLevelCount),
    milestoneLevelCount,
    status: 'pending',
    createdAt: now,
    resolvedAt: null,
    revealedAt: null,
    resolvedCardId: null,
    acquisitionId: null
  });
}

export function createMissingMilestoneGrants(
  completedUniqueMainLevels: number,
  existing: readonly CardMilestoneGrant[],
  now: string
): readonly CardMilestoneGrant[] {
  const existingIds = new Set(existing.map((grant) => grant.rewardId));
  return Object.freeze(
    listMilestoneLevelCounts(completedUniqueMainLevels)
      .map((milestone) => createPendingGrant(milestone, now))
      .filter((grant) => !existingIds.has(grant.rewardId))
  );
}
