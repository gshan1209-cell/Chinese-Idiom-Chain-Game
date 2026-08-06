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

test('records four verified rarity-frame moves into the governed Approved folder', async () => {
  const [folders, assets, ledger] = await Promise.all([
    readJson('../data/drive-assets/drive-folders.json'),
    readJson('../data/drive-assets/idiom-card-assets.json'),
    readJson('../data/drive-assets/migrations/2026-08-07-phase1-batch1-approved-rarity-frames.json'),
  ]);

  const folderByKey = new Map(
    folders.folders.map((folder) => [folder.folderKey, folder]),
  );
  const sourceFolderId = folderByKey.get('project.visuals')?.driveFolderId;
  const destinationFolderId = folderByKey.get(
    'idiom-cards.components.card-frames.approved',
  )?.driveFolderId;

  assert.ok(sourceFolderId);
  assert.ok(destinationFolderId);
  assert.equal(ledger.status, 'verified');
  assert.equal(ledger.entries.length, 4);
  assert.ok(ledger.entries.every(({ status }) => status === 'verified'));
  assert.ok(ledger.entries.every(({ operation }) => operation === 'move'));
  assert.ok(ledger.entries.every(({ before }) => before.parentFolderId === sourceFolderId));
  assert.ok(ledger.entries.every(({ rollback }) => rollback.parentFolderId === sourceFolderId));
  assert.ok(ledger.entries.every(({ after }) => after.parentFolderId === destinationFolderId));
  assert.ok(assets.assets.every(
    ({ parentFolderKey }) => parentFolderKey === 'idiom-cards.components.card-frames.approved',
  ));

  assert.deepEqual(validateDriveFolderRegistry(folders), []);
  assert.deepEqual(validateDriveAssetRegistry(assets), []);
  assert.deepEqual(validateDriveMigrationLedger(ledger), []);
});
