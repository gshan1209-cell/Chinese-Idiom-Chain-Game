import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateCompletedScoreSnapshots,
  calculateLevelHiddenScore,
  scoreDifficulty
} from '../.test-dist/src/cards/hidden-reward-score.js';

test('scores E through S as one through six', () => {
  assert.deepEqual(
    ['E', 'D', 'C', 'B', 'A', 'S'].map(scoreDifficulty),
    [1, 2, 3, 4, 5, 6]
  );
});

test('counts duplicate idiom ids once inside one level', () => {
  const level = {
    id: 'level-001',
    chapterId: 'chapter-1',
    levelNumber: 1,
    campaignOrdinal: 1,
    placements: [
      { idiomId: 'a' },
      { idiomId: 'b' },
      { idiomId: 'a' }
    ]
  };

  assert.equal(
    calculateLevelHiddenScore(level, new Map([['a', 'E'], ['b', 'E']])),
    2
  );
});

test('throws when a level idiom has no difficulty reference', () => {
  const level = { placements: [{ idiomId: 'missing' }] };
  assert.throws(
    () => calculateLevelHiddenScore(level, new Map()),
    /missing-card-difficulty:missing/
  );
});

test('creates running snapshots in campaign ordinal order', () => {
  const levels = [
    { id: 'level-002', campaignOrdinal: 2, placements: [{ idiomId: 'b' }] },
    { id: 'level-001', campaignOrdinal: 1, placements: [{ idiomId: 'a' }] },
    { id: 'level-003', campaignOrdinal: 3, placements: [{ idiomId: 'c' }] }
  ];
  const snapshots = calculateCompletedScoreSnapshots(
    levels,
    new Set(['level-001', 'level-003']),
    new Map([['a', 'E'], ['b', 'D'], ['c', 'S']])
  );

  assert.deepEqual(snapshots.get('level-001'), {
    levelHiddenScore: 1,
    hiddenRewardScore: 1
  });
  assert.deepEqual(snapshots.get('level-003'), {
    levelHiddenScore: 6,
    hiddenRewardScore: 7
  });
  assert.equal(snapshots.has('level-002'), false);
  assert.equal(Object.isFrozen(snapshots.get('level-003')), true);
});
