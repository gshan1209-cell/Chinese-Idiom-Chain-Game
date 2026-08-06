import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getPuzzlePlayModeLockReason,
  isPuzzlePlayModeUnlocked
} from '../.test-dist/src/traps/trap-unlocks.js';

function progressWithCompletedLevels(levelNumbers) {
  const levelProgressById = Object.fromEntries(levelNumbers.map((levelNumber) => [
    `level-${String(levelNumber).padStart(3, '0')}`,
    {
      levelId: `level-${String(levelNumber).padStart(3, '0')}`,
      completed: true,
      stars: 1,
      bestScore: 0,
      bestMistakes: 0,
      bestHintsUsed: 0,
      completionCount: 1,
      firstCompletedAt: '2026-08-06T00:00:00.000Z',
      lastCompletedAt: '2026-08-06T00:00:00.000Z'
    }
  ]));
  return {
    schemaVersion: 1,
    campaignId: 'chapter-1',
    highestUnlockedLevel: Math.max(1, ...levelNumbers.map((value) => value + 1)),
    lastPlayedLevel: 1,
    levelProgressById,
    updatedAt: '2026-08-06T00:00:00.000Z'
  };
}

test('standard mode is always unlocked', () => {
  assert.equal(isPuzzlePlayModeUnlocked(progressWithCompletedLevels([]), 'standard'), true);
});

test('candidate traps unlock only after level five is completed', () => {
  assert.equal(
    isPuzzlePlayModeUnlocked(progressWithCompletedLevels([1, 2, 3, 4]), 'trap-candidates'),
    false
  );
  assert.equal(
    isPuzzlePlayModeUnlocked(progressWithCompletedLevels([1, 2, 3, 4, 5]), 'trap-candidates'),
    true
  );
});

test('locked mode exposes a Traditional Chinese reason', () => {
  assert.equal(
    getPuzzlePlayModeLockReason(progressWithCompletedLevels([]), 'trap-candidates'),
    '完成第 5 關後解鎖候選偽字。'
  );
});
