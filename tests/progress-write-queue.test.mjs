import test from 'node:test';
import assert from 'node:assert/strict';

import { createProgressWriteQueue } from '../.test-dist/src/progress/progress-write-queue.js';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

test('executes progress writes in enqueue order even when the first write is delayed', async () => {
  const queue = createProgressWriteQueue();
  const firstGate = deferred();
  const events = [];

  const first = queue.enqueue(async () => {
    events.push('first-start');
    await firstGate.promise;
    events.push('first-end');
  });
  const second = queue.enqueue(async () => {
    events.push('second-start');
    events.push('second-end');
  });

  await Promise.resolve();
  assert.deepEqual(events, ['first-start']);

  firstGate.resolve();
  await Promise.all([first, second]);

  assert.deepEqual(events, [
    'first-start',
    'first-end',
    'second-start',
    'second-end'
  ]);
});

test('continues processing later writes after an earlier write fails', async () => {
  const queue = createProgressWriteQueue();
  const events = [];

  const failed = queue.enqueue(async () => {
    events.push('failed-start');
    throw new Error('storage unavailable');
  });
  const next = queue.enqueue(async () => {
    events.push('next-start');
  });

  await assert.rejects(failed, /storage unavailable/);
  await next;
  assert.deepEqual(events, ['failed-start', 'next-start']);
});
