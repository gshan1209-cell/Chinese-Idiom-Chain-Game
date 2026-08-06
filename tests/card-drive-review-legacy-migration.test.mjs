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

test('records the safe Review and quarantined legacy Batch 2 migration', async () => {
  const [folders, assets, ledger] = await Promise.all([
    readJson('../data/drive-assets/drive-folders.json'),
    readJson('../data/drive-assets/idiom-card-assets.json'),
    readJson('../data/drive-assets/migrations/2026-08-07-phase1-batch2-review-and-legacy.json'),
  ]);

  const assetById = new Map(assets.assets.map((asset) => [asset.assetId, asset]));

  assert.equal(ledger.status, 'verified');
  assert.equal(ledger.entries.length, 9);
  assert.ok(ledger.entries.every(({ status }) => status === 'verified'));

  const difficulty = assetById.get('difficulty-badge-sheet-e-s-v1.0');
  assert.equal(difficulty.status, 'review');
  assert.equal(difficulty.currentApproved, false);
  assert.equal(
    difficulty.parentFolderKey,
    'idiom-cards.components.difficulty-badges.review',
  );
  assert.equal(
    difficulty.filename,
    'CICG_Component_DifficultyBadge_E-S_v1.0_Review.jpeg',
  );

  for (const rarity of ['n', 'r', 'sr', 'ssr']) {
    const template = assetById.get(`template-rarity-${rarity}-v2.7-quarantined`);
    assert.equal(template.status, 'quarantined');
    assert.equal(template.currentApproved, false);
    assert.equal(template.parentFolderKey, 'idiom-cards.inbox');
  }

  const approvedAssets = assets.assets.filter(
    ({ status }) => status === 'approved' || status === 'published',
  );
  const nonApprovedAssets = assets.assets.filter(
    ({ status }) => status !== 'approved' && status !== 'published',
  );
  assert.ok(approvedAssets.every(({ currentApproved }) => currentApproved));
  assert.ok(nonApprovedAssets.every(({ currentApproved }) => !currentApproved));

  assert.deepEqual(validateDriveFolderRegistry(folders), []);
  assert.deepEqual(validateDriveAssetRegistry(assets), []);
  assert.deepEqual(validateDriveMigrationLedger(ledger), []);
});
