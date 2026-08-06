import test from 'node:test';
import assert from 'node:assert/strict';

import {
  REQUIRED_PHASE1_FOLDER_KEYS,
  validateDriveFolderRegistry,
} from '../.test-dist/src/cards/drive-assets/index.js';

test('requires the complete Phase 1 folder graph', () => {
  const issues = validateDriveFolderRegistry({
    schemaVersion: 1,
    updatedAt: '2026-08-06T14:00:00+08:00',
    folders: [],
  });

  assert.equal(REQUIRED_PHASE1_FOLDER_KEYS.length, 42);
  assert.ok(issues.some(({ code }) => code === 'missing-required-folder'));
});

test('rejects duplicate Drive folder IDs', () => {
  const issues = validateDriveFolderRegistry({
    schemaVersion: 1,
    updatedAt: '2026-08-06T14:00:00+08:00',
    folders: [
      {
        folderKey: 'project.root',
        driveFolderId: 'same-folder-id',
        name: 'Chinese-Idiom-Chain-Game',
        parentFolderKey: null,
        lifecycleRole: 'root',
      },
      {
        folderKey: 'project.inbox',
        driveFolderId: 'same-folder-id',
        name: '80_Inbox',
        parentFolderKey: 'project.root',
        lifecycleRole: 'inbox',
      },
    ],
  });

  assert.ok(issues.some(({ code }) => code === 'duplicate-drive-folder-id'));
});
