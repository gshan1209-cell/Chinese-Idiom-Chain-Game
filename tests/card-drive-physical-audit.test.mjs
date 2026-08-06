import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
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

test('keeps the audited Drive physical state aligned with all registries and ledgers', async () => {
  const [audit, folders, assets] = await Promise.all([
    readJson('../data/drive-assets/physical-audit-2026-08-07.json'),
    readJson('../data/drive-assets/drive-folders.json'),
    readJson('../data/drive-assets/idiom-card-assets.json'),
  ]);
  const migrationDirectory = new URL('../data/drive-assets/migrations/', import.meta.url);
  const migrationFilenames = (await readdir(migrationDirectory))
    .filter((filename) => filename.endsWith('.json'))
    .sort();
  const ledgers = await Promise.all(
    migrationFilenames.map((filename) => readJson(
      `../data/drive-assets/migrations/${filename}`,
    )),
  );

  const folderByKey = new Map(folders.folders.map((folder) => [folder.folderKey, folder]));
  const assetById = new Map(assets.assets.map((asset) => [asset.driveFileId, asset]));

  assert.equal(audit.visualsRoot.directChildren.length, 1);
  assert.equal(
    audit.visualsRoot.directChildren[0].id,
    folderByKey.get('idiom-cards.root').driveFolderId,
  );

  assert.equal(audit.approvedCardFrames.files.length, 4);
  for (const file of audit.approvedCardFrames.files) {
    const asset = assetById.get(file.id);
    assert.ok(asset);
    assert.equal(asset.filename, file.name);
    assert.equal(asset.sizeBytes, file.sizeBytes);
    assert.equal(asset.status, 'approved');
    assert.equal(asset.currentApproved, true);
    assert.equal(asset.parentFolderKey, audit.approvedCardFrames.folderKey);
  }

  const difficultyReview = audit.reviewAssets.find(({ kind }) => kind === 'file');
  const difficultyAsset = assetById.get(difficultyReview.resourceId);
  assert.equal(difficultyAsset.status, 'review');
  assert.equal(difficultyAsset.currentApproved, false);
  assert.equal(difficultyAsset.filename, difficultyReview.name);
  assert.equal(difficultyAsset.parentFolderKey, difficultyReview.folderKey);

  const inboxIds = new Set(audit.inbox.directResourceIds);
  const quarantinedIds = assets.assets
    .filter(({ status }) => status === 'quarantined')
    .map(({ driveFileId }) => driveFileId);
  assert.equal(inboxIds.size, 7);
  assert.ok(quarantinedIds.every((driveFileId) => inboxIds.has(driveFileId)));
  assert.ok(assets.assets
    .filter(({ status }) => status !== 'approved' && status !== 'published')
    .every(({ currentApproved }) => currentApproved === false));

  for (const folderKey of audit.emptyApprovedFolderKeys) {
    assert.equal(folderByKey.get(folderKey).lifecycleRole, 'approved');
  }

  assert.deepEqual(migrationFilenames, audit.migrationLedgers
    .map(({ filename }) => filename)
    .sort());
  assert.deepEqual(
    ledgers.map(({ status, entries }) => ({ status, entryCount: entries.length })),
    audit.migrationLedgers.map(({ status, entryCount }) => ({ status, entryCount })),
  );

  assert.deepEqual(validateDriveFolderRegistry(folders), []);
  assert.deepEqual(validateDriveAssetRegistry(assets), []);
  for (const ledger of ledgers) {
    assert.deepEqual(validateDriveMigrationLedger(ledger), []);
  }
});

test('the permanent CLI discovers and validates every migration ledger', async () => {
  const cli = await readFile(
    new URL('../scripts/validate-drive-assets.mjs', import.meta.url),
    'utf8',
  );

  assert.match(cli, /readdir\(migrationsPath\)/u);
  assert.match(cli, /filename\.endsWith\('\.json'\)/u);
  assert.match(cli, /migrations\.flatMap/u);
  assert.match(cli, /validateDriveMigrationLedger/u);
});
