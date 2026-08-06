import { validateIdiomCardDefinitions } from './card-definition-validator.js';
import { buildMilestoneCardPool } from './card-pool.js';
import { applyCardAcquisition } from './inventory-engine.js';
import { createMissingMilestoneGrants } from './milestone-grants.js';
import { resolvePendingGrant } from './reward-resolver.js';
import type {
  ActiveIdiomReference,
  CardCollectionRepository,
  CardCollectionState,
  CardDefinitionFinding,
  CardMilestoneGrant,
  IdiomCardDefinition,
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

export interface CardCollectionSyncResult {
  readonly state: CardCollectionState;
  readonly createdGrantCount: number;
  readonly resolvedGrantCount: number;
  readonly pendingGrantCount: number;
  readonly findings: readonly CardDefinitionFinding[];
}

function freezeState(
  grants: readonly CardMilestoneGrant[],
  inventory: readonly PlayerCardInventoryItem[],
  updatedAt: string
): CardCollectionState {
  return Object.freeze({
    grants: Object.freeze([...grants]),
    inventory: Object.freeze([...inventory]),
    metadata: Object.freeze({ schemaVersion: 1, updatedAt })
  });
}

function sortGrants(
  grants: readonly CardMilestoneGrant[]
): readonly CardMilestoneGrant[] {
  return Object.freeze([...grants].sort((left, right) =>
    left.milestoneLevelCount - right.milestoneLevelCount ||
    left.rewardId.localeCompare(right.rewardId)
  ));
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
      current.grants,
      input.now
    );
    const combined = sortGrants([...current.grants, ...missing]);
    const nextGrants: CardMilestoneGrant[] = [];
    let nextInventory = current.inventory;
    let resolvedGrantCount = 0;
    let changed = missing.length > 0;

    for (const grant of combined) {
      if (grant.status !== 'pending') {
        nextGrants.push(grant);
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
      ? freezeState(nextGrants, nextInventory, input.now)
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
