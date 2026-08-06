import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';

import {
  validateDriveAssetRegistry,
  validateDriveFolderRegistry,
  validateDriveMigrationLedger,
} from '../.test-dist/src/cards/drive-assets/index.js';

async function readJson(relativePath) {
  return JSON.parse(await readFile(
    new URL(relativePath, import.meta.url),
    'utf8',
  ));
}

test('records the read-only Drive baseline without pretending Phase 1 is ready', async () => {
  const [folders, assets, migration] = await Promise.all([
    readJson('../data/drive-assets/drive-folders.json'),
    readJson('../data/drive-assets/idiom-card-assets.json'),
    readJson('../data/drive-assets/migrations/2026-08-06-phase1-batch0-inventory.json'),
  ]);

  const folderIssues = validateDriveFolderRegistry(folders);
  const missingRequiredFolders = folderIssues.filter(
    ({ code }) => code === 'missing-required-folder',
  );

  assert.equal(folders.folders.length, 22);
  assert.equal(assets.assets.length, 4);
  assert.equal(migration.entries.length, 0);
  assert.equal(missingRequiredFolders.length, 39);
  assert.ok(folderIssues.every(({ code }) => code === 'missing-required-folder'));
  assert.deepEqual(validateDriveAssetRegistry(assets), []);
  assert.deepEqual(validateDriveMigrationLedger(migration), []);
});
