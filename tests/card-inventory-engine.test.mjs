import test from 'node:test';
import assert from 'node:assert/strict';

import { applyCardAcquisition } from '../.test-dist/src/cards/inventory-engine.js';

const FIRST_AT = '2026-08-06T12:50:00.000Z';
const SECOND_AT = '2026-08-07T12:50:00.000Z';

function record(acquisitionId, acquiredAt = FIRST_AT) {
  return Object.freeze({
    acquisitionId,
    method: 'milestone-reward',
    acquiredAt,
    sourceReference: acquisitionId.replace('card-acquisition:', '')
  });
}

test('creates the first immutable inventory item', () => {
  const next = applyCardAcquisition([], 'card-a', record('acquisition-a'));
  assert.equal(next.length, 1);
  assert.equal(next[0].cardId, 'card-a');
  assert.equal(next[0].ownedCount, 1);
  assert.equal(next[0].firstOwnedAt, FIRST_AT);
  assert.equal(next[0].lastOwnedAt, FIRST_AT);
  assert.equal(Object.isFrozen(next), true);
  assert.equal(Object.isFrozen(next[0]), true);
});

test('increments an existing card only for a distinct acquisition id', () => {
  const first = applyCardAcquisition([], 'card-a', record('acquisition-a'));
  const second = applyCardAcquisition(
    first,
    'card-a',
    record('acquisition-b', SECOND_AT)
  );

  assert.equal(second[0].ownedCount, 2);
  assert.equal(second[0].firstOwnedAt, FIRST_AT);
  assert.equal(second[0].lastOwnedAt, SECOND_AT);
  assert.deepEqual(
    second[0].acquisitionHistory.map((entry) => entry.acquisitionId),
    ['acquisition-a', 'acquisition-b']
  );
});

test('replaying the same acquisition id is idempotent across the inventory', () => {
  const first = applyCardAcquisition([], 'card-a', record('acquisition-a'));
  const replaySameCard = applyCardAcquisition(
    first,
    'card-a',
    record('acquisition-a', SECOND_AT)
  );
  const replayDifferentCard = applyCardAcquisition(
    first,
    'card-b',
    record('acquisition-a', SECOND_AT)
  );

  assert.equal(replaySameCard, first);
  assert.equal(replayDifferentCard, first);
  assert.equal(first[0].ownedCount, 1);
});
