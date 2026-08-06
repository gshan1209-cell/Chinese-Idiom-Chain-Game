import assert from 'node:assert/strict';
import test from 'node:test';

import { createCustomMediaItem } from '../.test-dist/src/media/media-library.js';
import {
  MediaImportError,
  exportMediaBackup,
  importMediaBackup
} from '../.test-dist/src/media/media-import-export.js';

function createState() {
  const custom = createCustomMediaItem(
    {
      id: 'custom-1',
      type: 'radio',
      title: '夜讀電台',
      category: '音樂',
      sourceUrl: 'https://radio.example/live'
    },
    '2026-08-06T00:00:00.000Z'
  );
  const builtIn = Object.freeze({
    ...custom,
    id: 'built-in-1',
    origin: 'built-in'
  });
  return Object.freeze({
    library: Object.freeze([builtIn, custom]),
    favoriteIds: Object.freeze(['built-in-1', 'custom-1']),
    preferences: Object.freeze({
      volume: 0.8,
      muted: false,
      dockCollapsed: false,
      lastSelectedItemId: 'custom-1'
    })
  });
}

test('exports schema version one without built-in item definitions', () => {
  const backup = JSON.parse(
    exportMediaBackup({
      state: createState(),
      exportedAt: '2026-08-06T01:02:03.000Z'
    })
  );

  assert.equal(backup.schemaVersion, 1);
  assert.equal(backup.exportedAt, '2026-08-06T01:02:03.000Z');
  assert.deepEqual(backup.library.map((item) => item.id), ['custom-1']);
  assert.deepEqual(backup.favoriteIds, ['built-in-1', 'custom-1']);
  assert.equal(backup.preferences.volume, 0.8);
});

test('rejects malformed JSON and unsupported schemas without partial state', () => {
  const current = createState();
  assert.throws(() => importMediaBackup('{broken', current), MediaImportError);
  assert.throws(
    () =>
      importMediaBackup(
        JSON.stringify({ schemaVersion: 2, library: [] }),
        current
      ),
    MediaImportError
  );
  assert.deepEqual(current.library.map((item) => item.id), [
    'built-in-1',
    'custom-1'
  ]);
});

test('imports valid custom items and reports added counts', () => {
  const backup = JSON.stringify({
    schemaVersion: 1,
    exportedAt: '2026-08-06T01:02:03.000Z',
    library: [
      {
        id: 'custom-2',
        type: 'youtube-video',
        title: '成語影片',
        category: '教學',
        sourceUrl: 'https://youtu.be/dQw4w9WgXcQ',
        createdAt: '2026-08-06T01:00:00.000Z'
      }
    ],
    favoriteIds: ['custom-2'],
    preferences: {
      volume: 0.6,
      muted: true,
      dockCollapsed: true,
      lastSelectedItemId: 'custom-2'
    }
  });

  const result = importMediaBackup(backup, createState());
  assert.deepEqual(result.summary, { added: 1, skipped: 0, failed: 0 });
  assert.deepEqual(result.state.library.map((item) => item.id), [
    'built-in-1',
    'custom-1',
    'custom-2'
  ]);
  assert.deepEqual(result.state.favoriteIds, ['custom-2']);
  assert.equal(result.state.preferences.lastSelectedItemId, 'custom-2');
});

test('skips duplicate IDs and canonical URLs without overwriting built-ins', () => {
  const backup = JSON.stringify({
    schemaVersion: 1,
    exportedAt: '2026-08-06T01:02:03.000Z',
    library: [
      {
        id: 'built-in-1',
        type: 'radio',
        title: '冒用內建 ID',
        category: '音樂',
        sourceUrl: 'https://radio.example/new'
      },
      {
        id: 'custom-2',
        type: 'radio',
        title: '重複網址',
        category: '音樂',
        sourceUrl: 'https://radio.example/live'
      }
    ],
    favoriteIds: [],
    preferences: {
      volume: 0.5,
      muted: false,
      dockCollapsed: false,
      lastSelectedItemId: null
    }
  });

  const result = importMediaBackup(backup, createState());
  assert.deepEqual(result.summary, { added: 0, skipped: 2, failed: 0 });
  assert.equal(result.state.library[0].title, '夜讀電台');
});

test('counts unsafe individual records as failed and keeps valid records', () => {
  const backup = JSON.stringify({
    schemaVersion: 1,
    exportedAt: '2026-08-06T01:02:03.000Z',
    library: [
      {
        id: 'unsafe',
        type: 'radio',
        title: '不安全',
        category: '音樂',
        sourceUrl: 'javascript:alert(1)'
      },
      {
        id: 'custom-3',
        type: 'radio',
        title: '安全電台',
        category: '音樂',
        sourceUrl: 'https://radio.example/three'
      }
    ],
    favoriteIds: [],
    preferences: {
      volume: 1,
      muted: false,
      dockCollapsed: false,
      lastSelectedItemId: null
    }
  });

  const result = importMediaBackup(backup, createState());
  assert.deepEqual(result.summary, { added: 1, skipped: 0, failed: 1 });
  assert.ok(result.state.library.some((item) => item.id === 'custom-3'));
});

test('clamps volume and validates preference booleans', () => {
  const base = {
    schemaVersion: 1,
    exportedAt: '2026-08-06T01:02:03.000Z',
    library: [],
    favoriteIds: [],
    preferences: {
      volume: 3,
      muted: false,
      dockCollapsed: false,
      lastSelectedItemId: null
    }
  };
  const result = importMediaBackup(JSON.stringify(base), createState());
  assert.equal(result.state.preferences.volume, 1);

  assert.throws(
    () =>
      importMediaBackup(
        JSON.stringify({
          ...base,
          preferences: { ...base.preferences, muted: 'no' }
        }),
        createState()
      ),
    MediaImportError
  );
});
