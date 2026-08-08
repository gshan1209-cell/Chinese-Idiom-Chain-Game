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

test('creates an immutable empty schema version two state', () => {
  const state = createEmptyCardCollectionState(NOW);
  assert.deepEqual(state.grants, []);
  assert.deepEqual(state.inventory, []);
  assert.deepEqual(state.upgrades, []);
  assert.deepEqual(state.metadata, { schemaVersion: 2, updatedAt: NOW });
  assert.equal(Object.isFrozen(state), true);
  assert.equal(Object.isFrozen(state.grants), true);
  assert.equal(Object.isFrozen(state.upgrades), true);
});

test('parses version-one milestone state into version-two state without dropping ownership', () => {
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
  assert.equal(state.metadata.schemaVersion, 2);
  assert.deepEqual(state.upgrades, []);
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
    assert.equal(state.metadata.schemaVersion, 2);
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


function pendingLevelGrant(overrides = {}) {
  return {
    rewardId: 'card-grant:main-level:chapter-1:1',
    chapterId: 'chapter-1',
    levelNumber: 1,
    campaignOrdinal: 1,
    scoreSnapshot: {
      levelHiddenScore: 2,
      hiddenRewardScore: 2
    },
    probabilitySnapshot: null,
    status: 'pending',
    createdAt: NOW,
    resolvedAt: null,
    revealedAt: null,
    resolvedCardId: null,
    acquisitionId: null,
    legacyCoverage: false,
    ...overrides
  };
}

test('accepts version-two pending per-level grants and freezes snapshots', () => {
  const raw = {
    grants: [pendingLevelGrant()],
    inventory: [],
    upgrades: [],
    metadata: { schemaVersion: 2, updatedAt: NOW }
  };
  const state = parseCardCollectionState(raw, NOW);

  assert.equal(state.grants.length, 1);
  assert.equal(state.grants[0].campaignOrdinal, 1);
  assert.deepEqual(state.grants[0].scoreSnapshot, {
    levelHiddenScore: 2,
    hiddenRewardScore: 2
  });
  assert.equal(Object.isFrozen(state.grants[0].scoreSnapshot), true);
});

test('accepts a consistent resolved per-level grant and level acquisition', () => {
  const rewardId = 'card-grant:main-level:chapter-1:1';
  const acquisitionId = `card-acquisition:${rewardId}`;
  const state = parseCardCollectionState({
    grants: [pendingLevelGrant({
      status: 'resolved',
      probabilitySnapshot: {
        levelHiddenScore: 2,
        hiddenRewardScore: 2,
        srTickets: 2,
        ssrTickets: 0,
        baseTickets: 998,
        minimumRarity: 'N',
        rolledRarity: 'N',
        resolvedRarity: 'N',
        rollValue: 500
      },
      resolvedAt: NOW,
      resolvedCardId: 'card-a',
      acquisitionId
    })],
    inventory: [inventoryItem({
      acquisitionHistory: [{
        acquisitionId,
        method: 'level-reward',
        acquiredAt: NOW,
        sourceReference: rewardId
      }]
    })],
    upgrades: [],
    metadata: { schemaVersion: 2, updatedAt: NOW }
  }, NOW);

  assert.equal(state.grants.length, 1);
  assert.equal(state.inventory.length, 1);
  assert.equal(state.inventory[0].acquisitionHistory[0].method, 'level-reward');
});

test('rejects a probability snapshot whose rolled rarity contradicts roll value', () => {
  const state = parseCardCollectionState({
    grants: [pendingLevelGrant({
      status: 'resolved',
      probabilitySnapshot: {
        levelHiddenScore: 2,
        hiddenRewardScore: 2,
        srTickets: 2,
        ssrTickets: 0,
        baseTickets: 998,
        minimumRarity: 'N',
        rolledRarity: 'SR',
        resolvedRarity: 'SR',
        rollValue: 500
      },
      resolvedAt: NOW,
      resolvedCardId: 'card-a',
      acquisitionId: 'card-acquisition:card-grant:main-level:chapter-1:1'
    })],
    inventory: [],
    upgrades: [],
    metadata: { schemaVersion: 2, updatedAt: NOW }
  }, NOW);

  assert.equal(state.grants.length, 0);
});

test('rejects a probability snapshot whose resolved rarity falls below the grant floor', () => {
  const rewardId = 'card-grant:main-level:chapter-1:10';
  const state = parseCardCollectionState({
    grants: [pendingLevelGrant({
      rewardId,
      levelNumber: 10,
      campaignOrdinal: 10,
      status: 'resolved',
      probabilitySnapshot: {
        levelHiddenScore: 2,
        hiddenRewardScore: 2,
        srTickets: 2,
        ssrTickets: 0,
        baseTickets: 998,
        minimumRarity: 'R',
        rolledRarity: 'R',
        resolvedRarity: 'N',
        rollValue: 500
      },
      resolvedAt: NOW,
      resolvedCardId: 'card-a',
      acquisitionId: `card-acquisition:${rewardId}`
    })],
    inventory: [],
    upgrades: [],
    metadata: { schemaVersion: 2, updatedAt: NOW }
  }, NOW);

  assert.equal(state.grants.length, 0);
});

test('rejects a probability snapshot resolved above a non-base rolled rarity', () => {
  const state = parseCardCollectionState({
    grants: [pendingLevelGrant({
      scoreSnapshot: { levelHiddenScore: 50, hiddenRewardScore: 50 },
      status: 'resolved',
      probabilitySnapshot: {
        levelHiddenScore: 50,
        hiddenRewardScore: 50,
        srTickets: 50,
        ssrTickets: 5,
        baseTickets: 945,
        minimumRarity: 'N',
        rolledRarity: 'SR',
        resolvedRarity: 'SSR',
        rollValue: 10
      },
      resolvedAt: NOW,
      resolvedCardId: 'card-a',
      acquisitionId: 'card-acquisition:card-grant:main-level:chapter-1:1'
    })],
    inventory: [],
    upgrades: [],
    metadata: { schemaVersion: 2, updatedAt: NOW }
  }, NOW);

  assert.equal(state.grants.length, 0);
});

test('rejects a base snapshot resolved outside the ordinary N or R pool', () => {
  const state = parseCardCollectionState({
    grants: [pendingLevelGrant({
      status: 'resolved',
      probabilitySnapshot: {
        levelHiddenScore: 2,
        hiddenRewardScore: 2,
        srTickets: 2,
        ssrTickets: 0,
        baseTickets: 998,
        minimumRarity: 'N',
        rolledRarity: 'N',
        resolvedRarity: 'SSR',
        rollValue: 500
      },
      resolvedAt: NOW,
      resolvedCardId: 'card-a',
      acquisitionId: 'card-acquisition:card-grant:main-level:chapter-1:1'
    })],
    inventory: [],
    upgrades: [],
    metadata: { schemaVersion: 2, updatedAt: NOW }
  }, NOW);

  assert.equal(state.grants.length, 0);
});

test('skips malformed version-two entries without dropping valid entries', () => {
  const state = parseCardCollectionState({
    grants: [
      pendingLevelGrant(),
      pendingLevelGrant({
        rewardId: 'card-grant:main-level:chapter-1:2',
        levelNumber: 2,
        campaignOrdinal: 2,
        scoreSnapshot: { levelHiddenScore: -1, hiddenRewardScore: 1 }
      })
    ],
    inventory: [],
    upgrades: [{ upgradeId: '' }],
    metadata: { schemaVersion: 2, updatedAt: NOW }
  }, NOW);

  assert.equal(state.grants.length, 1);
  assert.deepEqual(state.upgrades, []);
});
