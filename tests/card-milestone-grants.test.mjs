import test from 'node:test';
import assert from 'node:assert/strict';

import {
  countCompletedUniqueMainLevels,
  createMissingMilestoneGrants,
  listMilestoneLevelCounts,
  milestoneAcquisitionId,
  milestoneRewardId
} from '../.test-dist/src/cards/milestone-grants.js';

const NOW = '2026-08-06T12:30:00.000Z';

function level(levelId, completionCount = 1) {
  return Object.freeze({
    levelId,
    completed: true,
    stars: 1,
    bestScore: 100,
    bestMistakes: 0,
    bestHintsUsed: 0,
    completionCount,
    firstCompletedAt: NOW,
    lastCompletedAt: NOW
  });
}

test('lists one grant for every ten distinct completed levels', () => {
  assert.deepEqual(listMilestoneLevelCounts(9), []);
  assert.deepEqual(listMilestoneLevelCounts(10), [10]);
  assert.deepEqual(listMilestoneLevelCounts(20), [10, 20]);
  assert.deepEqual(listMilestoneLevelCounts(35), [10, 20, 30]);
});

test('counts distinct completed main levels without using replay counts or stars', () => {
  const progress = {
    schemaVersion: 1,
    campaignId: 'chapter-1',
    highestUnlockedLevel: 11,
    lastPlayedLevel: 10,
    levelProgressById: {
      'chapter-1-level-1': level('chapter-1-level-1', 5),
      'chapter-1-level-2': { ...level('chapter-1-level-2'), stars: 3 },
      malformed: { completed: false, completionCount: 0 }
    },
    updatedAt: NOW
  };

  assert.equal(countCompletedUniqueMainLevels(progress), 2);
});

test('uses fixed reward and acquisition identifiers', () => {
  assert.equal(milestoneRewardId(10), 'card-grant:main-levels:10');
  assert.equal(
    milestoneAcquisitionId('card-grant:main-levels:10'),
    'card-acquisition:card-grant:main-levels:10'
  );
});

test('creates missing pending grants in milestone order', () => {
  const grants = createMissingMilestoneGrants(20, [], NOW);
  assert.equal(grants.length, 2);
  assert.deepEqual(grants.map((grant) => grant.rewardId), [
    'card-grant:main-levels:10',
    'card-grant:main-levels:20'
  ]);
  for (const grant of grants) {
    assert.equal(grant.status, 'pending');
    assert.equal(grant.resolvedCardId, null);
    assert.equal(grant.acquisitionId, null);
  }
});

test('repeated synchronization and existing old-player grants remain idempotent', () => {
  const existing = createMissingMilestoneGrants(10, [], NOW);
  const repeated = createMissingMilestoneGrants(20, existing, NOW);
  assert.equal(repeated.length, 1);
  assert.equal(repeated[0].rewardId, 'card-grant:main-levels:20');

  const noMore = createMissingMilestoneGrants(20, [...existing, ...repeated], NOW);
  assert.deepEqual(noMore, []);
});
