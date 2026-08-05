import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath, URL } from 'node:url';

import {
  createCustomMediaItem,
  mergeMediaLibraries,
  removeCustomMediaItem,
  reorderCustomMediaItems,
  toggleMediaFavorite
} from '../.test-dist/src/media/media-library.js';

function customInput(overrides = {}) {
  return {
    id: 'custom-1',
    type: 'radio',
    title: '  夜讀電台  ',
    category: '  音樂  ',
    sourceUrl: 'https://radio.example/live',
    ...overrides
  };
}

test('creates a normalized immutable custom media item', () => {
  const item = createCustomMediaItem(
    customInput(),
    '2026-08-06T00:00:00.000Z'
  );

  assert.equal(item.title, '夜讀電台');
  assert.equal(item.category, '音樂');
  assert.equal(item.origin, 'custom');
  assert.equal(item.enabled, true);
  assert.equal(item.canonicalUrl, 'https://radio.example/live');
  assert.equal(item.createdAt, '2026-08-06T00:00:00.000Z');
  assert.ok(Object.isFrozen(item));
});

test('rejects invalid title and category lengths', () => {
  assert.throws(() =>
    createCustomMediaItem(customInput({ title: ' ' }), '2026-08-06T00:00:00.000Z')
  );
  assert.throws(() =>
    createCustomMediaItem(
      customInput({ title: '題'.repeat(81) }),
      '2026-08-06T00:00:00.000Z'
    )
  );
  assert.throws(() =>
    createCustomMediaItem(
      customInput({ category: '類'.repeat(31) }),
      '2026-08-06T00:00:00.000Z'
    )
  );
});

test('rejects duplicate IDs and canonical URLs while merging', () => {
  const first = createCustomMediaItem(
    customInput(),
    '2026-08-06T00:00:00.000Z'
  );
  const sameId = createCustomMediaItem(
    customInput({ sourceUrl: 'https://radio.example/other' }),
    '2026-08-06T00:00:01.000Z'
  );
  const sameUrl = createCustomMediaItem(
    customInput({ id: 'custom-2', title: '另一名稱' }),
    '2026-08-06T00:00:02.000Z'
  );

  assert.throws(() => mergeMediaLibraries([first], [sameId]));
  assert.throws(() => mergeMediaLibraries([first], [sameUrl]));
});

test('only custom media items can be removed', () => {
  const custom = createCustomMediaItem(
    customInput(),
    '2026-08-06T00:00:00.000Z'
  );
  const builtIn = Object.freeze({
    ...custom,
    id: 'built-in-1',
    origin: 'built-in'
  });

  assert.deepEqual(removeCustomMediaItem([builtIn, custom], custom.id), [builtIn]);
  assert.throws(() => removeCustomMediaItem([builtIn], builtIn.id));
});

test('toggles favorites without duplicates and stays immutable', () => {
  const selected = toggleMediaFavorite(Object.freeze([]), 'custom-1');
  assert.deepEqual(selected, ['custom-1']);
  assert.ok(Object.isFrozen(selected));
  assert.deepEqual(toggleMediaFavorite(selected, 'custom-1'), []);
});

test('reorders custom items while preserving built-in order', () => {
  const custom1 = createCustomMediaItem(
    customInput(),
    '2026-08-06T00:00:00.000Z'
  );
  const custom2 = createCustomMediaItem(
    customInput({
      id: 'custom-2',
      sourceUrl: 'https://radio.example/two',
      title: '第二台'
    }),
    '2026-08-06T00:00:01.000Z'
  );
  const builtIn = Object.freeze({
    ...custom1,
    id: 'built-in-1',
    origin: 'built-in'
  });

  const result = reorderCustomMediaItems(
    [builtIn, custom1, custom2],
    ['custom-2', 'custom-1']
  );
  assert.deepEqual(result.map((item) => item.id), [
    'built-in-1',
    'custom-2',
    'custom-1'
  ]);
  assert.throws(() =>
    reorderCustomMediaItems([builtIn, custom1], ['missing'])
  );
});

test('keeps the built-in media library empty until Drive approvals exist', () => {
  const path = fileURLToPath(
    new URL('../data/media/default-library.json', import.meta.url)
  );
  const builtIn = JSON.parse(readFileSync(path, 'utf8'));
  assert.deepEqual(builtIn, []);
});
