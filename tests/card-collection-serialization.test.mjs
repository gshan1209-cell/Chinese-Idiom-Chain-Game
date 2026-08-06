import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createEmptyCardCollectionState,
  parseCardCollectionState
} from '../.test-dist/src/cards/collection-serialization.js';

const NOW = '2026-08-06T13:00:00.000Z';

function pendingGrant(overrides = {}) {
  return {
    rewardId: 'card-grant:main-levels:10',
    milestoneLevelCount: 10,
    status: 'pending',
    createdAt: NOW,
    resolvedAt: null,
    revealedAt: null,
    resolvedCardId: null,
    acquisitionId: null,
    ...overrides
  };
}

function inventoryItem(overrides = {}) {
  return {
    cardId: 'card-a',
    ownedCount: 1,
    firstOwnedAt: NOW,
    lastOwnedAt: NOW,
    acquisitionHistory: [{
      acquisitionId: 'card-acquisition:card-grant:main-levels:10',
      method: 'milestone-reward',
      acquiredAt: NOW,
      sourceReference: 'card-grant:main-levels:10'
    }],
    ...overrides
  };
}

test('creates an immutable empty schema version one state', () => {
  const state = createEmptyCardCollectionState(NOW);
  assert.deepEqual(state.grants, []);
  assert.deepEqual(state.inventory, []);
  assert.deepEqual(state.metadata, { schemaVersion: 1, updatedAt: NOW });
  assert.equal(Object.isFrozen(state), true);
  assert.equal(Object.isFrozen(state.grants), true);
});

test('parses and deeply isolates valid collection data', () => {
  const raw = {
    grants: [pendingGrant()],
    inventory: [inventoryItem()],
    metadata: { schemaVersion: 1, updatedAt: NOW }
  };
  const state = parseCardCollectionState(raw, NOW);
  raw.grants[0].rewardId = 'changed';
  raw.inventory[0].acquisitionHistory[0].acquisitionId = 'changed';

  assert.equal(state.grants[0].rewardId, 'card-grant:main-levels:10');
  assert.equal(
    state.inventory[0].acquisitionHistory[0].acquisitionId,
    'card-acquisition:card-grant:main-levels:10'
  );
  assert.equal(Object.isFrozen(state.inventory[0].acquisitionHistory), true);
});

test('unsupported or malformed top-level states fall back to empty', () => {
  for (const value of [null, [], {}, {
    grants: [],
    inventory: [],
    metadata: { schemaVersion: 2, updatedAt: NOW }
  }]) {
    const state = parseCardCollectionState(value, NOW);
    assert.deepEqual(state.grants, []);
    assert.deepEqual(state.inventory, []);
    assert.equal(state.metadata.schemaVersion, 1);
  }
});

test('isolates invalid individual entries and duplicate identifiers', () => {
  const state = parseCardCollectionState({
    grants: [
      pendingGrant(),
      pendingGrant(),
      pendingGrant({ rewardId: 'card-grant:main-levels:20', status: 'resolved' })
    ],
    inventory: [
      inventoryItem(),
      inventoryItem(),
      inventoryItem({
        cardId: 'card-b',
        acquisitionHistory: [
          inventoryItem().acquisitionHistory[0],
          inventoryItem().acquisitionHistory[0]
        ]
      })
    ],
    metadata: { schemaVersion: 1, updatedAt: NOW }
  }, NOW);

  assert.equal(state.grants.length, 1);
  assert.equal(state.inventory.length, 1);
});

test('accepts a consistent resolved grant and rejects impossible state combinations', () => {
  const resolved = pendingGrant({
    status: 'resolved',
    resolvedAt: NOW,
    resolvedCardId: 'card-a',
    acquisitionId: 'card-acquisition:card-grant:main-levels:10'
  });
  const valid = parseCardCollectionState({
    grants: [resolved],
    inventory: [inventoryItem()],
    metadata: { schemaVersion: 1, updatedAt: NOW }
  }, NOW);
  const invalid = parseCardCollectionState({
    grants: [pendingGrant({ resolvedCardId: 'card-a' })],
    inventory: [],
    metadata: { schemaVersion: 1, updatedAt: NOW }
  }, NOW);

  assert.equal(valid.grants.length, 1);
  assert.equal(valid.grants[0].status, 'resolved');
  assert.equal(invalid.grants.length, 0);
});

test('rejects milestone grants whose reward id does not match the milestone', () => {
  const state = parseCardCollectionState({
    grants: [pendingGrant({
      rewardId: 'card-grant:main-levels:20',
      milestoneLevelCount: 10
    })],
    inventory: [],
    metadata: { schemaVersion: 1, updatedAt: NOW }
  }, NOW);

  assert.equal(state.grants.length, 0);
});

test('rejects resolved grants and inventory with mismatched acquisition ids', () => {
  const state = parseCardCollectionState({
    grants: [pendingGrant({
      status: 'resolved',
      resolvedAt: NOW,
      resolvedCardId: 'card-a',
      acquisitionId: 'card-acquisition:card-grant:main-levels:20'
    })],
    inventory: [inventoryItem({
      acquisitionHistory: [{
        acquisitionId: 'card-acquisition:card-grant:main-levels:20',
        method: 'milestone-reward',
        acquiredAt: NOW,
        sourceReference: 'card-grant:main-levels:10'
      }]
    })],
    metadata: { schemaVersion: 1, updatedAt: NOW }
  }, NOW);

  assert.equal(state.grants.length, 0);
  assert.equal(state.inventory.length, 0);
});

test('rejects human-readable timestamps that are not ISO-8601', () => {
  const state = parseCardCollectionState({
    grants: [pendingGrant({ createdAt: 'August 6, 2026 13:00 UTC' })],
    inventory: [],
    metadata: { schemaVersion: 1, updatedAt: NOW }
  }, NOW);

  assert.equal(state.grants.length, 0);
});
