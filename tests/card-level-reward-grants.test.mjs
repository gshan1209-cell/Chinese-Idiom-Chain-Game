import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createMissingLevelGrants,
  levelAcquisitionId,
  levelRewardId
} from '../.test-dist/src/cards/level-reward-grants.js';

const NOW = '2026-08-08T08:00:00.000Z';

function level(levelNumber) {
  return Object.freeze({
    id: `level-${String(levelNumber).padStart(3, '0')}`,
    chapterId: 'chapter-1',
    levelNumber,
    campaignOrdinal: levelNumber,
    placements: Object.freeze([])
  });
}

function scoreSnapshots(...levelNumbers) {
  return new Map(levelNumbers.map((levelNumber) => [
    `level-${String(levelNumber).padStart(3, '0')}`,
    Object.freeze({
      levelHiddenScore: levelNumber,
      hiddenRewardScore: levelNumber * 2
    })
  ]));
}

function pendingLevelGrant(levelNumber) {
  const rewardId = levelRewardId('chapter-1', levelNumber);
  return Object.freeze({
    rewardId,
    chapterId: 'chapter-1',
    levelNumber,
    campaignOrdinal: levelNumber,
    scoreSnapshot: Object.freeze({
      levelHiddenScore: levelNumber,
      hiddenRewardScore: levelNumber * 2
    }),
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

function legacyGrant(milestoneLevelCount) {
  return Object.freeze({
    rewardId: `card-grant:main-levels:${milestoneLevelCount}`,
    milestoneLevelCount,
    status: 'resolved',
    createdAt: NOW,
    resolvedAt: NOW,
    revealedAt: null,
    resolvedCardId: 'card-existing',
    acquisitionId: `card-acquisition:card-grant:main-levels:${milestoneLevelCount}`
  });
}

test('creates stable reward and acquisition ids per main level', () => {
  const rewardId = levelRewardId('chapter-1', 7);
  assert.equal(rewardId, 'card-grant:main-level:chapter-1:7');
  assert.equal(levelAcquisitionId(rewardId), 'card-acquisition:card-grant:main-level:chapter-1:7');
});

test('does not recreate an existing per-level grant', () => {
  const missing = createMissingLevelGrants({
    completedLevels: [level(1)],
    existing: [pendingLevelGrant(1)],
    legacyGrants: [],
    scoreSnapshots: scoreSnapshots(1),
    now: NOW
  });

  assert.deepEqual(missing, []);
});

test('legacy milestone 10 covers only global ordinal 10', () => {
  const completedLevels = Array.from({ length: 10 }, (_, index) => level(index + 1));
  const missing = createMissingLevelGrants({
    completedLevels,
    existing: [],
    legacyGrants: [legacyGrant(10)],
    scoreSnapshots: scoreSnapshots(...completedLevels.map((item) => item.levelNumber)),
    now: NOW
  });

  assert.deepEqual(missing.map((grant) => grant.campaignOrdinal), [1,2,3,4,5,6,7,8,9]);
});

test('creates pending grants in campaign ordinal order with frozen score snapshots', () => {
  const missing = createMissingLevelGrants({
    completedLevels: [level(3), level(1), level(2)],
    existing: [],
    legacyGrants: [],
    scoreSnapshots: scoreSnapshots(1, 2, 3),
    now: NOW
  });

  assert.deepEqual(missing.map((grant) => grant.campaignOrdinal), [1, 2, 3]);
  assert.deepEqual(missing[1].scoreSnapshot, {
    levelHiddenScore: 2,
    hiddenRewardScore: 4
  });
  assert.equal(missing[1].probabilitySnapshot, null);
  assert.equal(missing[1].status, 'pending');
  assert.equal(Object.isFrozen(missing[1].scoreSnapshot), true);
  assert.equal(Object.isFrozen(missing[1]), true);
});

test('rejects completed levels without a score snapshot', () => {
  assert.throws(() => createMissingLevelGrants({
    completedLevels: [level(1)],
    existing: [],
    legacyGrants: [],
    scoreSnapshots: new Map(),
    now: NOW
  }), /missing-score-snapshot:level-001/);
});
