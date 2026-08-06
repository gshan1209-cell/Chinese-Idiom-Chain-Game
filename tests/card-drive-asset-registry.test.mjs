import test from 'node:test';
import assert from 'node:assert/strict';

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
  filename: 'CICG_Component_RarityFrame_N_v1.0_Approved.png',
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

test('rejects duplicate current Approved masters in one asset family', () => {
  const issues = validateDriveAssetRegistry({
    schemaVersion: 1,
    updatedAt: '2026-08-06T14:00:00+08:00',
    assets: [
      approved,
      {
        ...approved,
        assetId: 'frame-n-v1.1-emerald-antique-gold',
        driveFileId: 'frame-n-v1.1-drive-file',
        version: '1.1',
      },
    ],
  });

  assert.ok(issues.some(({ code }) => code === 'duplicate-current-approved'));
});

test('rejects Approved assets without checksum or approval evidence', () => {
  const issues = validateDriveAssetRegistry({
    schemaVersion: 1,
    updatedAt: '2026-08-06T14:00:00+08:00',
    assets: [{ ...approved, sha256: '', approvalEvidenceIds: [] }],
  });

  assert.deepEqual(issues.map(({ code }) => code).sort(), [
    'approved-missing-evidence',
    'invalid-sha256',
  ]);
});
