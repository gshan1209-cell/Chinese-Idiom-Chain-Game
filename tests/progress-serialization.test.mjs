import test from 'node:test';
import assert from 'node:assert/strict';

import { parseCampaignProgress } from '../.test-dist/src/progress/progress-serialization.js';

const NOW = '2026-08-05T12:00:00.000Z';

function validProgress() {
  return {
    schemaVersion: 1,
    campaignId: 'chapter-1',
    highestUnlockedLevel: 3,
    lastPlayedLevel: 2,
    levelProgressById: {
      'level-001': {
        levelId: 'level-001',
        completed: true,
        stars: 3,
        bestScore: 800,
        bestMistakes: 0,
        bestHintsUsed: 0,
        completionCount: 2,
        firstCompletedAt: '2026-08-05T10:00:00.000Z',
        lastCompletedAt: '2026-08-05T11:00:00.000Z'
      }
    },
    updatedAt: '2026-08-05T11:00:00.000Z'
  };
}

test('preserves a valid campaign progress record', () => {
  assert.deepEqual(parseCampaignProgress(validProgress(), 20, NOW), validProgress());
});

test('falls back to initial progress for malformed or unsupported records', () => {
  for (const value of [null, [], {}, { ...validProgress(), schemaVersion: 2 }]) {
    const parsed = parseCampaignProgress(value, 20, NOW);
    assert.equal(parsed.highestUnlockedLevel, 1);
    assert.equal(parsed.lastPlayedLevel, 1);
    assert.deepEqual(parsed.levelProgressById, {});
  }
});

test('clamps persisted navigation levels to the current chapter size', () => {
  const parsed = parseCampaignProgress({
    ...validProgress(),
    highestUnlockedLevel: 99,
    lastPlayedLevel: -4
  }, 20, NOW);

  assert.equal(parsed.highestUnlockedLevel, 20);
  assert.equal(parsed.lastPlayedLevel, 1);
});

test('removes invalid level records while preserving valid records', () => {
  const parsed = parseCampaignProgress({
    ...validProgress(),
    levelProgressById: {
      ...validProgress().levelProgressById,
      'level-999': {
        levelId: 'level-999',
        completed: true,
        stars: 9,
        bestScore: -1,
        bestMistakes: -1,
        bestHintsUsed: -1,
        completionCount: 0,
        firstCompletedAt: '',
        lastCompletedAt: ''
      }
    }
  }, 20, NOW);

  assert.deepEqual(Object.keys(parsed.levelProgressById), ['level-001']);
});

test('drops records beyond a shortened chapter and keeps unlock state consistent', () => {
  const source = {
    ...validProgress(),
    highestUnlockedLevel: 20,
    lastPlayedLevel: 20,
    levelProgressById: {
      ...validProgress().levelProgressById,
      'level-020': {
        levelId: 'level-020',
        completed: true,
        stars: 1,
        bestScore: 100,
        bestMistakes: 4,
        bestHintsUsed: 2,
        completionCount: 1,
        firstCompletedAt: NOW,
        lastCompletedAt: NOW
      }
    }
  };
  const parsed = parseCampaignProgress(source, 10, NOW);

  assert.equal(parsed.highestUnlockedLevel, 10);
  assert.equal(parsed.lastPlayedLevel, 10);
  assert.equal(parsed.levelProgressById['level-020'], undefined);
});
