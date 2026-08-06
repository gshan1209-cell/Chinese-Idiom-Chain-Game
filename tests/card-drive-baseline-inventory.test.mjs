import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';

import {
  REQUIRED_PHASE1_FOLDER_KEYS,
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

test('records the complete Phase 1 folder topology with real Drive IDs', async () => {
  const [folders, assets, migration] = await Promise.all([
    readJson('../data/drive-assets/drive-folders.json'),
    readJson('../data/drive-assets/idiom-card-assets.json'),
    readJson('../data/drive-assets/migrations/2026-08-06-phase1-batch0-inventory.json'),
  ]);

  const folderKeys = new Set(folders.folders.map(({ folderKey }) => folderKey));
  const approvedAssets = assets.assets.filter(
    ({ status }) => status === 'approved' || status === 'published',
  );
  const reviewAssets = assets.assets.filter(({ status }) => status === 'review');
  const quarantinedAssets = assets.assets.filter(
    ({ status }) => status === 'quarantined',
  );

  assert.equal(folders.folders.length, 60);
  assert.equal(assets.assets.length, 9);
  assert.equal(approvedAssets.length, 4);
  assert.equal(reviewAssets.length, 1);
  assert.equal(quarantinedAssets.length, 4);
  assert.equal(migration.entries.length, 0);
  assert.ok(REQUIRED_PHASE1_FOLDER_KEYS.every((folderKey) => folderKeys.has(folderKey)));
  assert.deepEqual(validateDriveFolderRegistry(folders), []);
  assert.deepEqual(validateDriveAssetRegistry(assets), []);
  assert.deepEqual(validateDriveMigrationLedger(migration), []);
});
