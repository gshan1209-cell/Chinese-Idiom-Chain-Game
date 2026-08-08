import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildLevelRewardPool,
  minimumRarityForOrdinal
} from '../.test-dist/src/cards/level-reward-pool.js';

function level(levelNumber, idiomIds) {
  return Object.freeze({
    id: `level-${levelNumber}`,
    chapterId: 'chapter-1',
    levelNumber,
    campaignOrdinal: levelNumber,
    placements: Object.freeze(idiomIds.map((idiomId) => Object.freeze({ idiomId })))
  });
}

function card(id, idiomId, rarity, overrides = {}) {
  return Object.freeze({
    id,
    idiomId,
    rarity,
    enabled: true,
    approvalStatus: 'Approved',
    sourceStatus: 'Approved',
    rarityApproved: true,
    acquisitionMethods: Object.freeze(['milestone-reward']),
    weight: 1,
    ...overrides
  });
}

test('uses N R and SR minimum rarities for ordinary ten and hundred ordinals', () => {
  assert.equal(minimumRarityForOrdinal(7), 'N');
  assert.equal(minimumRarityForOrdinal(10), 'R');
  assert.equal(minimumRarityForOrdinal(100), 'SR');
});

test('ordinary level uses only idioms from that level', () => {
  const targetLevel = level(7, ['a', 'b']);
  const pool = buildLevelRewardPool({
    definitions: [
      card('card-a', 'a', 'N'),
      card('card-b', 'b', 'R'),
      card('card-c', 'c', 'SSR')
    ],
    targetLevel,
    completedLevels: [targetLevel]
  });

  assert.deepEqual(pool.map((item) => item.id), ['card-a', 'card-b']);
});

test('global level 10 uses completed-range R plus', () => {
  const completedLevels = [level(1, ['a']), level(10, ['b'])];
  const pool = buildLevelRewardPool({
    definitions: [
      card('card-a-n', 'a', 'N'),
      card('card-a-r', 'a', 'R'),
      card('card-b-sr', 'b', 'SR'),
      card('card-c-ssr', 'c', 'SSR')
    ],
    targetLevel: completedLevels[1],
    completedLevels
  });

  assert.deepEqual(pool.map((item) => item.id), ['card-a-r', 'card-b-sr']);
  assert.ok(pool.every((item) => ['R', 'SR', 'SSR'].includes(item.rarity)));
});

test('global level 100 uses completed-range SR plus', () => {
  const completedLevels = [level(1, ['a']), level(100, ['b'])];
  const pool = buildLevelRewardPool({
    definitions: [
      card('card-a-r', 'a', 'R'),
      card('card-a-sr', 'a', 'SR'),
      card('card-b-ssr', 'b', 'SSR')
    ],
    targetLevel: completedLevels[1],
    completedLevels
  });

  assert.deepEqual(pool.map((item) => item.id), ['card-a-sr', 'card-b-ssr']);
  assert.ok(pool.every((item) => ['SR', 'SSR'].includes(item.rarity)));
});

test('applies the formal approval allowlist before level scoping', () => {
  const targetLevel = level(1, ['a']);
  const pool = buildLevelRewardPool({
    definitions: [
      card('approved', 'a', 'N'),
      card('review', 'a', 'N', { approvalStatus: 'Review' }),
      card('ur', 'a', 'UR')
    ],
    targetLevel,
    completedLevels: [targetLevel]
  });

  assert.deepEqual(pool.map((item) => item.id), ['approved']);
});
