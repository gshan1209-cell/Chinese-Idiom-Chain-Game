import test from 'node:test';
import assert from 'node:assert/strict';

import {
  REQUIRED_PHASE1_FOLDER_KEYS,
  validateDriveFolderRegistry,
} from '../.test-dist/src/cards/drive-assets/index.js';

function validate(folders) {
  return validateDriveFolderRegistry({
    schemaVersion: 1,
    updatedAt: '2026-08-06T14:00:00+08:00',
    folders,
  });
}

test('requires the complete Phase 1 folder graph', () => {
  const issues = validate([]);

  assert.equal(REQUIRED_PHASE1_FOLDER_KEYS.length, 43);
  assert.ok(issues.some(({ code }) => code === 'missing-required-folder'));
});

test('rejects duplicate Drive folder IDs', () => {
  const issues = validate([
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
  ]);

  assert.ok(issues.some(({ code }) => code === 'duplicate-drive-folder-id'));
});

test('rejects duplicate folder keys', () => {
  const issues = validate([
    {
      folderKey: 'project.root',
      driveFolderId: 'root-a',
      name: 'Chinese-Idiom-Chain-Game',
      parentFolderKey: null,
      lifecycleRole: 'root',
    },
    {
      folderKey: 'project.root',
      driveFolderId: 'root-b',
      name: 'Duplicate Root',
      parentFolderKey: null,
      lifecycleRole: 'root',
    },
  ]);

  assert.ok(issues.some(({ code }) => code === 'duplicate-folder-key'));
});

test('rejects unknown parent folder keys', () => {
  const issues = validate([
    {
      folderKey: 'project.visuals',
      driveFolderId: 'visuals-id',
      name: '02_UI_UX_And_Visuals',
      parentFolderKey: 'missing-parent',
      lifecycleRole: 'container',
    },
  ]);

  assert.ok(issues.some(({ code }) => code === 'unknown-parent-folder'));
});

test('rejects parent cycles', () => {
  const issues = validate([
    {
      folderKey: 'cycle.a',
      driveFolderId: 'cycle-a-id',
      name: 'A',
      parentFolderKey: 'cycle.b',
      lifecycleRole: 'container',
    },
    {
      folderKey: 'cycle.b',
      driveFolderId: 'cycle-b-id',
      name: 'B',
      parentFolderKey: 'cycle.a',
      lifecycleRole: 'container',
    },
  ]);

  assert.ok(issues.some(({ code }) => code === 'parent-cycle'));
});

test('requires lifecycle roles to match governed folder suffixes', () => {
  const issues = validate([
    {
      folderKey: 'idiom-cards.templates.review',
      driveFolderId: 'templates-review-id',
      name: '10_Review',
      parentFolderKey: null,
      lifecycleRole: 'approved',
    },
  ]);

  assert.ok(issues.some(({ code }) => code === 'lifecycle-role-mismatch'));
});
