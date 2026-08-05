import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateStars,
  createInitialCampaignProgress,
  getContinueLevelNumber,
  getTotalStars,
  isLevelUnlocked,
  recordLevelCompletion,
  recordLevelStarted
} from '../.test-dist/src/progress/progress-engine.js';

const NOW = '2026-08-05T12:00:00.000Z';
const LATER = '2026-08-05T13:00:00.000Z';

function result(levelNumber, overrides = {}) {
  return {
    levelId: `level-${String(levelNumber).padStart(3, '0')}`,
    levelNumber,
    score: 500,
    mistakes: 0,
    hintsUsed: 0,
    ...overrides
  };
}

test('initial progress unlocks only the first level', () => {
  const progress = createInitialCampaignProgress(20, NOW);

  assert.equal(progress.schemaVersion, 1);
  assert.equal(progress.campaignId, 'chapter-1');
  assert.equal(progress.highestUnlockedLevel, 1);
  assert.equal(progress.lastPlayedLevel, 1);
  assert.equal(isLevelUnlocked(progress, 1), true);
  assert.equal(isLevelUnlocked(progress, 2), false);
});

test('awards three stars for zero hints and zero mistakes', () => {
  assert.equal(calculateStars(result(1)), 3);
});

test('awards two stars for at most one hint and two mistakes', () => {
  assert.equal(calculateStars(result(1, { hintsUsed: 1, mistakes: 2 })), 2);
});

test('awards one star after completion outside the two-star threshold', () => {
  assert.equal(calculateStars(result(1, { hintsUsed: 2, mistakes: 3 })), 1);
});

test('completing a level unlocks the next level and records the best result', () => {
  const initial = createInitialCampaignProgress(20, NOW);
  const completed = recordLevelCompletion(initial, result(1), 20, LATER);

  assert.equal(completed.highestUnlockedLevel, 2);
  assert.equal(completed.lastPlayedLevel, 2);
  assert.deepEqual(completed.levelProgressById['level-001'], {
    levelId: 'level-001',
    completed: true,
    stars: 3,
    bestScore: 500,
    bestMistakes: 0,
    bestHintsUsed: 0,
    completionCount: 1,
    firstCompletedAt: LATER,
    lastCompletedAt: LATER
  });
});

test('completing the final level never unlocks beyond the chapter', () => {
  const initial = {
    ...createInitialCampaignProgress(20, NOW),
    highestUnlockedLevel: 20,
    lastPlayedLevel: 20
  };
  const completed = recordLevelCompletion(initial, result(20), 20, LATER);

  assert.equal(completed.highestUnlockedLevel, 20);
  assert.equal(completed.lastPlayedLevel, 20);
});

test('replaying preserves better stars and score while tracking lower mistakes and hints', () => {
  const initial = createInitialCampaignProgress(20, NOW);
  const first = recordLevelCompletion(
    initial,
    result(1, { score: 900, mistakes: 2, hintsUsed: 1 }),
    20,
    NOW
  );
  const replay = recordLevelCompletion(
    first,
    result(1, { score: 700, mistakes: 0, hintsUsed: 0 }),
    20,
    LATER
  );
  const saved = replay.levelProgressById['level-001'];

  assert.equal(saved?.stars, 3);
  assert.equal(saved?.bestScore, 900);
  assert.equal(saved?.bestMistakes, 0);
  assert.equal(saved?.bestHintsUsed, 0);
  assert.equal(saved?.completionCount, 2);
  assert.equal(saved?.firstCompletedAt, NOW);
  assert.equal(saved?.lastCompletedAt, LATER);
});

test('total stars sums the best star rating of completed levels', () => {
  let progress = createInitialCampaignProgress(20, NOW);
  progress = recordLevelCompletion(progress, result(1), 20, NOW);
  progress = recordLevelCompletion(
    progress,
    result(2, { mistakes: 2, hintsUsed: 1 }),
    20,
    LATER
  );

  assert.equal(getTotalStars(progress), 5);
});

test('starting an unlocked level updates the continue target', () => {
  const initial = {
    ...createInitialCampaignProgress(20, NOW),
    highestUnlockedLevel: 4
  };
  const started = recordLevelStarted(initial, 3, 20, LATER);

  assert.equal(started.lastPlayedLevel, 3);
  assert.equal(getContinueLevelNumber(started, 20), 3);
});

test('starting a locked or out-of-range level is rejected', () => {
  const initial = createInitialCampaignProgress(20, NOW);

  assert.throws(() => recordLevelStarted(initial, 2, 20, LATER), /尚未解鎖/);
  assert.throws(() => recordLevelStarted(initial, 0, 20, LATER), /關卡範圍/);
  assert.throws(() => recordLevelCompletion(initial, result(21), 20, LATER), /關卡範圍/);
});
