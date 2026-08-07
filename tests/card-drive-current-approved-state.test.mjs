import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateDriveAssetRegistry,
} from '../.test-dist/src/cards/drive-assets/index.js';

const reviewAsset = Object.freeze({
  assetId: 'review-frame',
  assetType: 'card-frame',
  identity: 'rarity-frame-review',
  version: '1.0',
  status: 'review',
  currentApproved: true,
  filename: 'review.png',
  driveFileId: 'review-file',
  parentFolderKey: 'idiom-cards.components.card-frames.review',
  mimeType: 'image/png',
  sizeBytes: 1,
  sha256: 'a'.repeat(64),
  widthPx: 1,
  heightPx: 1,
  webViewLink: 'https://drive.google.com/file/d/review-file/view',
  supersedesAssetId: null,
  supersededByAssetId: null,
  approvalEvidenceIds: [],
  licenseEvidenceId: null,
});

test('rejects current Approved flags on non-approved lifecycle states', () => {
  const issues = validateDriveAssetRegistry({
    schemaVersion: 1,
    updatedAt: '2026-08-07T00:00:00+08:00',
    assets: [reviewAsset],
  });

  assert.ok(issues.some(
    ({ code }) => code === 'current-approved-status-mismatch',
  ));
});

test('rejects Approved or published status on reference-only assets', () => {
  const issues = validateDriveAssetRegistry({
    schemaVersion: 1,
    updatedAt: '2026-08-07T00:00:00+08:00',
    assets: [{
      ...reviewAsset,
      assetId: 'reference-approved',
      assetType: 'reference-only',
      identity: 'competitor-layout-reference',
      status: 'approved',
      currentApproved: false,
      driveFileId: 'reference-approved-file',
      parentFolderKey: 'idiom-cards.reference-only',
      approvalEvidenceIds: ['review-evidence'],
    }],
  });

  assert.ok(issues.some(
    ({ code }) => code === 'reference-only-approved',
  ));
});
