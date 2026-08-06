import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';

import {
  DRIVE_ASSET_STATUSES,
  DRIVE_ASSET_TYPES,
  validateDriveAssetRegistry,
} from '../.test-dist/src/cards/drive-assets/index.js';

test('exports the approved Drive governance vocabularies', () => {
  assert.deepEqual(DRIVE_ASSET_TYPES, [
    'artwork',
    'card-frame',
    'rarity-badge',
    'difficulty-badge',
    'theme-badge',
    'motto-plaque',
    'effect-overlay',
    'template',
    'composite',
    'reference-only',
    'legacy-flat-card',
  ]);

  assert.deepEqual(DRIVE_ASSET_STATUSES, [
    'intake',
    'classified',
    'review',
    'changes-requested',
    'approved',
    'published',
    'archived',
    'quarantined',
    'rejected',
    'unverifiable',
  ]);
});

const approved = Object.freeze({
  assetId: 'frame-n-v1.0-emerald-antique-gold',
  assetType: 'card-frame',
  identity: 'rarity-frame-n',
  version: '1.0',
  status: 'approved',
  currentApproved: true,
  filename: 'CICG_CardFrame_Rarity_N_v1.0_Approved.png',
  driveFileId: '1KO7NHfipw-MlFfYLDaakHuupGjtrwYu8',
  parentFolderKey: 'idiom-cards.components.card-frames.approved',
  mimeType: 'image/png',
  sizeBytes: 2285281,
  sha256: '17e6a6798e491ad2bad12b5746e7c3414078e456b83838db2e75aa0a7352ae65',
  widthPx: 1024,
  heightPx: 2000,
  webViewLink: 'https://drive.google.com/file/d/1KO7NHfipw-MlFfYLDaakHuupGjtrwYu8/view',
  supersedesAssetId: null,
  supersededByAssetId: null,
  approvalEvidenceIds: ['pr-32'],
  licenseEvidenceId: null,
});

function validate(assets) {
  return validateDriveAssetRegistry({
    schemaVersion: 1,
    updatedAt: '2026-08-06T14:00:00+08:00',
    assets,
  });
}

test('rejects duplicate current Approved masters in one asset family', () => {
  const issues = validate([
    approved,
    {
      ...approved,
      assetId: 'frame-n-v1.1-emerald-antique-gold',
      driveFileId: 'frame-n-v1.1-drive-file',
      version: '1.1',
    },
  ]);

  assert.ok(issues.some(({ code }) => code === 'duplicate-current-approved'));
});

test('rejects Approved assets without checksum or approval evidence', () => {
  const issues = validate([{ ...approved, sha256: '', approvalEvidenceIds: [] }]);

  assert.deepEqual(issues.map(({ code }) => code).sort(), [
    'approved-missing-evidence',
    'invalid-sha256',
  ]);
});

test('rejects duplicate asset and Drive file identifiers', () => {
  const issues = validate([
    approved,
    {
      ...approved,
      identity: 'rarity-frame-r',
      currentApproved: false,
    },
  ]);

  assert.deepEqual(issues.map(({ code }) => code).sort(), [
    'duplicate-asset-id',
    'duplicate-drive-file-id',
  ]);
});

test('rejects invalid semantic versions', () => {
  const issues = validate([{ ...approved, version: 'v1' }]);
  assert.deepEqual(issues.map(({ code }) => code), ['invalid-version']);
});

test('requires published assets to remain the current Approved master', () => {
  const issues = validate([{ ...approved, status: 'published', currentApproved: false }]);
  assert.deepEqual(issues.map(({ code }) => code), ['published-not-approved']);
});

test('requires license evidence for UR asset families', () => {
  const issues = validate([{
    ...approved,
    assetId: 'ur-collab-card-v1.0',
    identity: 'ur-collab-card',
    driveFileId: 'ur-collab-card-drive-id',
  }]);
  assert.deepEqual(issues.map(({ code }) => code), ['ur-missing-license']);
});

test('requires bidirectional supersession links', () => {
  const issues = validate([
    {
      ...approved,
      currentApproved: false,
      supersededByAssetId: 'frame-n-v1.1-emerald-antique-gold',
    },
    {
      ...approved,
      assetId: 'frame-n-v1.1-emerald-antique-gold',
      driveFileId: 'frame-n-v1.1-drive-file',
      version: '1.1',
      supersedesAssetId: null,
    },
  ]);
  assert.ok(issues.some(({ code }) => code === 'broken-supersession'));
});

test('registers Drive schema and CLI validation contracts', async () => {
  const packageJson = JSON.parse(await readFile(
    new URL('../package.json', import.meta.url),
    'utf8',
  ));

  assert.equal(
    packageJson.scripts['validate:drive-assets'],
    'npm run compile:core && node scripts/validate-drive-assets.mjs',
  );
  assert.equal(
    packageJson.scripts['test:drive-assets'],
    'npm run compile:core && node --test tests/card-drive-*.test.mjs',
  );

  for (const filename of [
    'drive-asset.schema.json',
    'drive-folder.schema.json',
    'drive-migration.schema.json',
  ]) {
    const schema = JSON.parse(await readFile(
      new URL(`../data/drive-assets/${filename}`, import.meta.url),
      'utf8',
    ));
    assert.equal(schema.additionalProperties, false);
    assert.equal(schema.properties.schemaVersion.const, 1);
  }

  const cli = await readFile(
    new URL('../scripts/validate-drive-assets.mjs', import.meta.url),
    'utf8',
  );
  assert.match(cli, /\.test-dist\/src\/cards\/drive-assets\/index\.js/u);
  assert.match(cli, /drive-folders\.json/u);
  assert.match(cli, /idiom-card-assets\.json/u);
});

test('keeps migration snapshot types aligned with nullable blocked entries', async () => {
  const source = await readFile(
    new URL('../src/cards/drive-assets/drive-asset-types.ts', import.meta.url),
    'utf8',
  );

  for (const field of ['before', 'after', 'rollback']) {
    assert.match(
      source,
      new RegExp(`readonly ${field}: DriveResourceSnapshot \\| null;`, 'u'),
    );
  }
});
