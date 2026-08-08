import type { CampaignProgress } from '../domain/progress.js';
import type { PuzzleLevel } from '../domain/puzzle.js';
import { validateIdiomCardDefinitions } from './card-definition-validator.js';
import { buildMilestoneCardPool } from './card-pool.js';
import { calculateCompletedScoreSnapshots } from './hidden-reward-score.js';
import { createMissingLevelGrants } from './level-reward-grants.js';
import { buildLevelRewardPool } from './level-reward-pool.js';
import { applyCardAcquisition } from './inventory-engine.js';
import { createMissingMilestoneGrants } from './milestone-grants.js';
import {
  resolvePendingGrant,
  resolvePendingLevelGrant
} from './reward-resolver.js';
import type {
  ActiveIdiomReference,
  CardCollectionRepository,
  CardCollectionState,
  CardDefinitionFinding,
  CardGrant,
  CardLevelGrant,
  CardMilestoneGrant,
  CardUpgradeRecord,
  IdiomCardDefinition,
  IdiomDifficultyGrade,
  PlayerCardInventoryItem,
  RandomSource
} from './card-types.js';

export interface SyncCardCollectionInput {
  readonly repository: CardCollectionRepository;
  readonly completedUniqueMainLevels: number;
  readonly definitions: readonly IdiomCardDefinition[];
  readonly activeIdioms: readonly ActiveIdiomReference[];
  readonly random: RandomSource;
  readonly now: string;
}

export interface SyncCardCollectionLevelRewardsInput {
  readonly repository: CardCollectionRepository;
  readonly levels: readonly PuzzleLevel[];
  readonly progress: CampaignProgress;
  readonly definitions: readonly IdiomCardDefinition[];
  readonly activeIdioms: readonly ActiveIdiomReference[];
  readonly difficultyById: ReadonlyMap<string, IdiomDifficultyGrade>;
  readonly random: RandomSource;
  readonly now: string;
}

export interface CardCollectionSyncResult {
  readonly state: CardCollectionState;
  readonly createdGrantCount: number;
  readonly resolvedGrantCount: number;
  readonly pendingGrantCount: number;
  readonly findings: readonly CardDefinitionFinding[];
}

function freezeState(
  grants: readonly CardGrant[],
  inventory: readonly PlayerCardInventoryItem[],
  upgrades: readonly CardUpgradeRecord[],
  updatedAt: string
): CardCollectionState {
  return Object.freeze({
    grants: Object.freeze([...grants]),
    inventory: Object.freeze([...inventory]),
    upgrades: Object.freeze([...upgrades]),
    metadata: Object.freeze({ schemaVersion: 2, updatedAt })
  });
}

function sortGrants(
  grants: readonly CardGrant[]
): readonly CardGrant[] {
  return Object.freeze([...grants].sort((left, right) => {
    const leftLegacy = 'milestoneLevelCount' in left;
    const rightLegacy = 'milestoneLevelCount' in right;
    if (leftLegacy !== rightLegacy) return leftLegacy ? -1 : 1;
    if (leftLegacy && rightLegacy) {
      return left.milestoneLevelCount - right.milestoneLevelCount ||
        left.rewardId.localeCompare(right.rewardId);
    }
    if (!leftLegacy && !rightLegacy) {
      return left.campaignOrdinal - right.campaignOrdinal ||
        left.rewardId.localeCompare(right.rewardId);
    }
    return 0;
  }));
}

function isMilestoneGrant(grant: CardGrant): grant is CardMilestoneGrant {
  return 'milestoneLevelCount' in grant;
}

function inventoryHasAcquisition(
  inventory: readonly PlayerCardInventoryItem[],
  acquisitionId: string
): boolean {
  return inventory.some((item) =>
    item.acquisitionHistory.some((record) =>
      record.acquisitionId === acquisitionId
    )
  );
}

export function syncCardCollectionMilestones(
  input: SyncCardCollectionInput
): Promise<CardCollectionSyncResult> {
  const validation = validateIdiomCardDefinitions(
    input.definitions,
    input.activeIdioms,
    input.now
  );
  const pool = buildMilestoneCardPool(validation.validDefinitions);

  return input.repository.transact((current) => {
    const missing = createMissingMilestoneGrants(
      input.completedUniqueMainLevels,
      current.grants.filter(isMilestoneGrant),
      input.now
    );
    const combined = sortGrants([...current.grants, ...missing]);
    const nextGrants: CardGrant[] = [];
    let nextInventory = current.inventory;
    let resolvedGrantCount = 0;
    let changed = missing.length > 0;

    for (const grant of combined) {
      if (!isMilestoneGrant(grant)) {
        nextGrants.push(grant);
        continue;
      }
      if (grant.status !== 'pending') {
        nextGrants.push(grant);
        if (
          grant.resolvedCardId !== null &&
          grant.acquisitionId !== null &&
          grant.resolvedAt !== null &&
          !inventoryHasAcquisition(nextInventory, grant.acquisitionId)
        ) {
          nextInventory = applyCardAcquisition(
            nextInventory,
            grant.resolvedCardId,
            Object.freeze({
              acquisitionId: grant.acquisitionId,
              method: 'milestone-reward',
              acquiredAt: grant.resolvedAt,
              sourceReference: grant.rewardId
            })
          );
          changed = true;
        }
        continue;
      }

      const resolution = resolvePendingGrant(
        grant,
        pool,
        nextInventory,
        input.random,
        input.now
      );
      nextGrants.push(resolution.grant);

      if (
        resolution.error === null &&
        resolution.acquisition !== null &&
        resolution.grant.resolvedCardId !== null &&
        resolution.grant !== grant
      ) {
        nextInventory = applyCardAcquisition(
          nextInventory,
          resolution.grant.resolvedCardId,
          resolution.acquisition
        );
        resolvedGrantCount += 1;
        changed = true;
      }
    }

    const state = changed
      ? freezeState(
        nextGrants,
        nextInventory,
        current.upgrades,
        input.now
      )
      : current;
    const result: CardCollectionSyncResult = Object.freeze({
      state,
      createdGrantCount: missing.length,
      resolvedGrantCount,
      pendingGrantCount: state.grants.filter(
        (grant) => grant.status === 'pending'
      ).length,
      findings: validation.findings
    });

    return Object.freeze({ state, value: result });
  });
}


function isLevelGrant(grant: CardGrant): grant is CardLevelGrant {
  return 'campaignOrdinal' in grant;
}

function completedLevelsFromProgress(
  levels: readonly PuzzleLevel[],
  progress: CampaignProgress
): readonly PuzzleLevel[] {
  return Object.freeze(levels
    .filter((level) => {
      const saved = progress.levelProgressById[level.id];
      return saved?.completed === true && saved.completionCount > 0;
    })
    .sort((left, right) => left.campaignOrdinal - right.campaignOrdinal));
}

function repairGrantInventory(
  grant: CardGrant,
  inventory: readonly PlayerCardInventoryItem[]
): readonly PlayerCardInventoryItem[] {
  if (grant.status === 'pending' ||
      grant.resolvedCardId === null ||
      grant.acquisitionId === null ||
      grant.resolvedAt === null ||
      inventoryHasAcquisition(inventory, grant.acquisitionId)) return inventory;

  return applyCardAcquisition(
    inventory,
    grant.resolvedCardId,
    Object.freeze({
      acquisitionId: grant.acquisitionId,
      method: isLevelGrant(grant) ? 'level-reward' : 'milestone-reward',
      acquiredAt: grant.resolvedAt,
      sourceReference: grant.rewardId
    })
  );
}

export function syncCardCollectionLevelRewards(
  input: SyncCardCollectionLevelRewardsInput
): Promise<CardCollectionSyncResult> {
  const validation = validateIdiomCardDefinitions(
    input.definitions,
    input.activeIdioms,
    input.now
  );
  const completedLevels = completedLevelsFromProgress(
    input.levels,
    input.progress
  );
  const completedLevelIds = new Set(completedLevels.map((level) => level.id));
  const scoreSnapshots = calculateCompletedScoreSnapshots(
    input.levels,
    completedLevelIds,
    input.difficultyById
  );

  return input.repository.transact((current) => {
    const legacyGrants = current.grants.filter(isMilestoneGrant);
    const existingLevelGrants = current.grants.filter(isLevelGrant);
    const missing = createMissingLevelGrants({
      completedLevels,
      existing: existingLevelGrants,
      legacyGrants,
      scoreSnapshots,
      now: input.now
    });
    const combined = sortGrants([...current.grants, ...missing]);
    const nextGrants: CardGrant[] = [];
    let nextInventory = current.inventory;
    let resolvedGrantCount = 0;
    let changed = missing.length > 0;

    for (const grant of combined) {
      if (!isLevelGrant(grant)) {
        nextGrants.push(grant);
        const repaired = repairGrantInventory(grant, nextInventory);
        if (repaired !== nextInventory) changed = true;
        nextInventory = repaired;
        continue;
      }

      if (grant.status !== 'pending') {
        nextGrants.push(grant);
        const repaired = repairGrantInventory(grant, nextInventory);
        if (repaired !== nextInventory) changed = true;
        nextInventory = repaired;
        continue;
      }

      const targetLevel = completedLevels.find((level) =>
        level.chapterId === grant.chapterId &&
        level.levelNumber === grant.levelNumber &&
        level.campaignOrdinal === grant.campaignOrdinal
      );
      if (targetLevel === undefined) {
        nextGrants.push(grant);
        continue;
      }

      const pool = buildLevelRewardPool({
        definitions: validation.validDefinitions,
        targetLevel,
        completedLevels
      });
      const resolution = resolvePendingLevelGrant(
        grant,
        pool,
        input.random,
        input.now
      );
      nextGrants.push(resolution.grant);

      if (resolution.error === null &&
          resolution.acquisition !== null &&
          resolution.grant.resolvedCardId !== null &&
          resolution.grant !== grant) {
        nextInventory = applyCardAcquisition(
          nextInventory,
          resolution.grant.resolvedCardId,
          resolution.acquisition
        );
        resolvedGrantCount += 1;
        changed = true;
      }
    }

    const state = changed
      ? freezeState(
        nextGrants,
        nextInventory,
        current.upgrades,
        input.now
      )
      : current;
    const result: CardCollectionSyncResult = Object.freeze({
      state,
      createdGrantCount: missing.length,
      resolvedGrantCount,
      pendingGrantCount: state.grants.filter(
        (grant) => grant.status === 'pending'
      ).length,
      findings: validation.findings
    });

    return Object.freeze({ state, value: result });
  });
}
