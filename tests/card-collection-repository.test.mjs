import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createMemoryCardCollectionRepository
} from '../.test-dist/src/cards/collection-repository.js';
import { createCollectionWriteQueue } from '../.test-dist/src/cards/collection-write-queue.js';

const NOW = '2026-08-06T13:10:00.000Z';

function stateWithGrant(current, rewardId) {
  return Object.freeze({
    grants: Object.freeze([
      ...current.grants,
      Object.freeze({
        rewardId,
        milestoneLevelCount: 10,
        status: 'pending',
        createdAt: NOW,
        resolvedAt: null,
        revealedAt: null,
        resolvedCardId: null,
        acquisitionId: null
      })
    ]),
    inventory: current.inventory,
    metadata: Object.freeze({ schemaVersion: 1, updatedAt: NOW })
  });
}

test('memory repository loads an isolated immutable empty state', async () => {
  const repository = createMemoryCardCollectionRepository(NOW);
  const first = await repository.load();
  const second = await repository.load();

  assert.notEqual(first, second);
  assert.deepEqual(first.grants, []);
  assert.equal(Object.isFrozen(first), true);
});

test('transact commits the returned state and value atomically', async () => {
  const repository = createMemoryCardCollectionRepository(NOW);
  const value = await repository.transact((current) => ({
    state: stateWithGrant(current, 'card-grant:main-levels:10'),
    value: 'saved'
  }));
  const loaded = await repository.load();

  assert.equal(value, 'saved');
  assert.equal(loaded.grants.length, 1);
});

test('a failed transaction leaves the previous state unchanged', async () => {
  const repository = createMemoryCardCollectionRepository(NOW);
  await repository.transact((current) => ({
    state: stateWithGrant(current, 'card-grant:main-levels:10'),
    value: undefined
  }));

  await assert.rejects(
    repository.transact(() => {
      throw new Error('write failed');
    }),
    /write failed/
  );

  const loaded = await repository.load();
  assert.equal(loaded.grants.length, 1);
});

test('clear resets all stores to a new empty state', async () => {
  const repository = createMemoryCardCollectionRepository(NOW);
  await repository.transact((current) => ({
    state: stateWithGrant(current, 'card-grant:main-levels:10'),
    value: undefined
  }));
  await repository.clear('2026-08-07T00:00:00.000Z');

  const loaded = await repository.load();
  assert.deepEqual(loaded.grants, []);
  assert.equal(loaded.metadata.updatedAt, '2026-08-07T00:00:00.000Z');
});

test('write queue preserves order and continues after a failure', async () => {
  const queue = createCollectionWriteQueue();
  const events = [];
  let release;
  const gate = new Promise((resolve) => { release = resolve; });

  const first = queue.enqueue(async () => {
    events.push('first-start');
    await gate;
    events.push('first-end');
  });
  const second = queue.enqueue(async () => {
    events.push('second');
    throw new Error('expected');
  });
  const third = queue.enqueue(async () => {
    events.push('third');
  });

  await Promise.resolve();
  assert.deepEqual(events, ['first-start']);
  release();
  await first;
  await assert.rejects(second, /expected/);
  await third;
  assert.deepEqual(events, ['first-start', 'first-end', 'second', 'third']);
});
