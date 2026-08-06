import assert from 'node:assert/strict';
import test from 'node:test';

import { createCustomMediaItem } from '../.test-dist/src/media/media-library.js';
import { createMemoryMediaRepository } from '../.test-dist/src/media/media-repository.js';

function stateFixture() {
  const item = createCustomMediaItem(
    {
      id: 'custom-1',
      type: 'radio',
      title: '夜讀電台',
      category: '音樂',
      sourceUrl: 'https://radio.example/live'
    },
    '2026-08-06T00:00:00.000Z'
  );
  return {
    library: [item],
    favoriteIds: ['custom-1'],
    preferences: {
      volume: 0.8,
      muted: false,
      dockCollapsed: false,
      lastSelectedItemId: 'custom-1'
    }
  };
}

test('memory repository starts empty and returns a frozen copy after save', async () => {
  const repository = createMemoryMediaRepository(null);
  assert.equal(await repository.load(), null);

  const state = stateFixture();
  await repository.save(state);
  const loaded = await repository.load();

  assert.deepEqual(loaded, state);
  assert.notEqual(loaded, state);
  assert.ok(Object.isFrozen(loaded));
  assert.ok(Object.isFrozen(loaded.library));
  assert.ok(Object.isFrozen(loaded.favoriteIds));
  assert.ok(Object.isFrozen(loaded.preferences));
});

test('memory repository isolates stored values from caller mutation', async () => {
  const state = stateFixture();
  const repository = createMemoryMediaRepository(state);

  state.favoriteIds.push('later-change');
  state.preferences.volume = 0.1;
  const firstLoad = await repository.load();
  assert.deepEqual(firstLoad.favoriteIds, ['custom-1']);
  assert.equal(firstLoad.preferences.volume, 0.8);

  const secondLoad = await repository.load();
  assert.notEqual(secondLoad, firstLoad);
  assert.notEqual(secondLoad.library, firstLoad.library);
});
