import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateRewardTickets,
  resolvePendingGrant,
  resolvePendingLevelGrant
} from '../.test-dist/src/cards/reward-resolver.js';
import { createMissingMilestoneGrants } from '../.test-dist/src/cards/milestone-grants.js';

const NOW = '2026-08-06T12:40:00.000Z';

function card(id, weight = 1) {
  return Object.freeze({ id, weight });
}

function pendingGrant() {
  return createMissingMilestoneGrants(10, [], NOW)[0];
}

function inventory(cardId, acquisitionId = `old-${cardId}`) {
  return Object.freeze({
    cardId,
    ownedCount: 1,
    firstOwnedAt: NOW,
    lastOwnedAt: NOW,
    acquisitionHistory: Object.freeze([
      Object.freeze({
        acquisitionId,
        method: 'milestone-reward',
        acquiredAt: NOW,
        sourceReference: 'old-reward'
      })
    ])
  });
}

test('keeps an empty-pool grant pending without consuming random input', () => {
  let calls = 0;
  const result = resolvePendingGrant(
    pendingGrant(),
    [],
    [],
    { next: () => { calls += 1; return 0; } },
    NOW
  );

  assert.equal(calls, 0);
  assert.equal(result.grant.status, 'pending');
  assert.equal(result.acquisition, null);
  assert.equal(result.error, null);
});

test('owned cards remain eligible for a duplicate reward', () => {
  const result = resolvePendingGrant(
    pendingGrant(),
    [card('owned', 100), card('new', 1)],
    [inventory('owned')],
    { next: () => 0 },
    NOW
  );

  assert.equal(result.grant.resolvedCardId, 'owned');
  assert.equal(result.acquisition.acquisitionId, 'card-acquisition:card-grant:main-levels:10');
});

test('uses deterministic weighted boundaries', () => {
  const pool = [card('a', 1), card('b', 3)];
  const first = resolvePendingGrant(pendingGrant(), pool, [], { next: () => 0 }, NOW);
  const second = resolvePendingGrant(pendingGrant(), pool, [], { next: () => 0.2499 }, NOW);
  const third = resolvePendingGrant(pendingGrant(), pool, [], { next: () => 0.25 }, NOW);
  const last = resolvePendingGrant(pendingGrant(), pool, [], { next: () => 0.9999 }, NOW);

  assert.equal(first.grant.resolvedCardId, 'a');
  assert.equal(second.grant.resolvedCardId, 'a');
  assert.equal(third.grant.resolvedCardId, 'b');
  assert.equal(last.grant.resolvedCardId, 'b');
});

test('rejects invalid random values without resolving the grant', () => {
  for (const value of [-0.01, 1, Number.NaN, Number.POSITIVE_INFINITY]) {
    const result = resolvePendingGrant(
      pendingGrant(),
      [card('a')],
      [],
      { next: () => value },
      NOW
    );
    assert.equal(result.grant.status, 'pending');
    assert.equal(result.acquisition, null);
    assert.equal(result.error, 'invalid-random-value');
  }
});

test('replaying a resolved reward never consumes random input or changes the card', () => {
  const first = resolvePendingGrant(
    pendingGrant(),
    [card('a'), card('b')],
    [],
    { next: () => 0 },
    NOW
  );
  let calls = 0;
  const replay = resolvePendingGrant(
    first.grant,
    [card('b')],
    [],
    { next: () => { calls += 1; return 0.9; } },
    '2026-08-07T00:00:00.000Z'
  );

  assert.equal(calls, 0);
  assert.equal(replay.grant, first.grant);
  assert.equal(replay.grant.resolvedCardId, 'a');
  assert.equal(replay.acquisition, null);
});


function levelCard(id, rarity, weight = 1) {
  return Object.freeze({ id, rarity, weight });
}

function pendingLevelGrant(campaignOrdinal, hiddenRewardScore = 50) {
  return Object.freeze({
    rewardId: `card-grant:main-level:chapter-1:${campaignOrdinal}`,
    chapterId: 'chapter-1',
    levelNumber: campaignOrdinal,
    campaignOrdinal,
    scoreSnapshot: Object.freeze({ levelHiddenScore: 5, hiddenRewardScore }),
    probabilitySnapshot: null,
    status: 'pending',
    createdAt: NOW,
    resolvedAt: null,
    revealedAt: null,
    resolvedCardId: null,
    acquisitionId: null,
    legacyCoverage: false
  });
}

function randomSequence(...values) {
  let index = 0;
  return Object.freeze({
    next() {
      const value = values[index];
      index += 1;
      return value;
    },
    calls() {
      return index;
    }
  });
}

test('score 50 creates exactly 50 SR and 5 SSR tickets', () => {
  assert.deepEqual(calculateRewardTickets(50), {
    srTickets: 50,
    ssrTickets: 5,
    baseTickets: 945
  });
});

test('caps SR and SSR tickets', () => {
  assert.deepEqual(calculateRewardTickets(5000), {
    srTickets: 400,
    ssrTickets: 100,
    baseTickets: 500
  });
});

test('resolves score 50 ticket boundaries before weighted card selection', () => {
  const pool = [
    levelCard('n', 'N'),
    levelCard('r', 'R'),
    levelCard('sr', 'SR'),
    levelCard('ssr', 'SSR')
  ];
  const ssr = resolvePendingLevelGrant(
    pendingLevelGrant(1), pool, randomSequence(0.000, 0), NOW
  );
  const sr = resolvePendingLevelGrant(
    pendingLevelGrant(1), pool, randomSequence(0.005, 0), NOW
  );
  const base = resolvePendingLevelGrant(
    pendingLevelGrant(1), pool, randomSequence(0.055, 0), NOW
  );

  assert.equal(ssr.grant.resolvedCardId, 'ssr');
  assert.equal(ssr.grant.probabilitySnapshot.rollValue, 0);
  assert.equal(ssr.grant.probabilitySnapshot.rolledRarity, 'SSR');
  assert.equal(sr.grant.resolvedCardId, 'sr');
  assert.equal(sr.grant.probabilitySnapshot.rollValue, 5);
  assert.equal(sr.grant.probabilitySnapshot.rolledRarity, 'SR');
  assert.equal(base.grant.resolvedCardId, 'n');
  assert.equal(base.grant.probabilitySnapshot.rollValue, 55);
  assert.equal(base.grant.probabilitySnapshot.rolledRarity, 'N');
});

test('ordinary base uses combined N and R card weights', () => {
  const result = resolvePendingLevelGrant(
    pendingLevelGrant(1),
    [levelCard('n', 'N', 1), levelCard('r', 'R', 3)],
    randomSequence(0.5, 0.75),
    NOW
  );

  assert.equal(result.grant.resolvedCardId, 'r');
  assert.equal(result.grant.probabilitySnapshot.resolvedRarity, 'R');
});

test('ordinal 10 and 100 base regions resolve at their guaranteed floor', () => {
  const ten = resolvePendingLevelGrant(
    pendingLevelGrant(10),
    [levelCard('r', 'R'), levelCard('sr', 'SR')],
    randomSequence(0.5, 0),
    NOW
  );
  const hundred = resolvePendingLevelGrant(
    pendingLevelGrant(100),
    [levelCard('sr', 'SR'), levelCard('ssr', 'SSR')],
    randomSequence(0.5, 0),
    NOW
  );

  assert.equal(ten.grant.resolvedCardId, 'r');
  assert.equal(ten.grant.probabilitySnapshot.minimumRarity, 'R');
  assert.equal(hundred.grant.resolvedCardId, 'sr');
  assert.equal(hundred.grant.probabilitySnapshot.minimumRarity, 'SR');
});

test('falls back from missing SSR without crossing the ordinal 100 floor', () => {
  const result = resolvePendingLevelGrant(
    pendingLevelGrant(100),
    [levelCard('sr', 'SR')],
    randomSequence(0, 0),
    NOW
  );

  assert.equal(result.grant.resolvedCardId, 'sr');
  assert.equal(result.grant.probabilitySnapshot.rolledRarity, 'SSR');
  assert.equal(result.grant.probabilitySnapshot.resolvedRarity, 'SR');
});

test('keeps the grant pending when the minimum rarity is absent', () => {
  const random = randomSequence(0.5);
  const result = resolvePendingLevelGrant(
    pendingLevelGrant(100),
    [levelCard('ssr', 'SSR')],
    random,
    NOW
  );

  assert.equal(result.grant.status, 'pending');
  assert.equal(result.acquisition, null);
  assert.equal(random.calls(), 1);
});

test('rejects invalid tier or selection RNG without mutating the level grant', () => {
  for (const values of [[1], [0.5, Number.NaN]]) {
    const grant = pendingLevelGrant(1);
    const result = resolvePendingLevelGrant(
      grant,
      [levelCard('n', 'N')],
      randomSequence(...values),
      NOW
    );
    assert.equal(result.grant, grant);
    assert.equal(result.acquisition, null);
    assert.equal(result.error, 'invalid-random-value');
  }
});
