import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CHAPTER_ONE_CARD_DIFFICULTY_BY_ID
} from '../.test-dist/src/cards/generated-card-difficulties.js';

test('exports all sixty-one chapter-one idiom difficulties', () => {
  assert.equal(CHAPTER_ONE_CARD_DIFFICULTY_BY_ID.size, 61);
  assert.equal(CHAPTER_ONE_CARD_DIFFICULTY_BY_ID.get('idiom-0001'), 'E');
  assert.equal(CHAPTER_ONE_CARD_DIFFICULTY_BY_ID.get('idiom-0061'), 'D');
  assert.equal(Object.isFrozen(CHAPTER_ONE_CARD_DIFFICULTY_BY_ID), true);
});
