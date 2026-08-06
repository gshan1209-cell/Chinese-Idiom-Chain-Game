import test from 'node:test';
import assert from 'node:assert/strict';

import { resolvePendingGrant } from '../.test-dist/src/cards/reward-resolver.js';
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

test('prefers unowned cards before any duplicate card', () => {
  const result = resolvePendingGrant(
    pendingGrant(),
    [card('owned', 100), card('new', 1)],
    [inventory('owned')],
    { next: () => 0 },
    NOW
  );

  assert.equal(result.grant.resolvedCardId, 'new');
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
