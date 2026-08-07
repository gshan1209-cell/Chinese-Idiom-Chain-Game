import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';

import {
  validateDriveAssetFolderAssignments,
} from '../.test-dist/src/cards/drive-assets/index.js';

const approvedAsset = Object.freeze({
  assetId: 'frame-n-v1.0',
  assetType: 'card-frame',
  identity: 'rarity-frame-n',
  version: '1.0',
  status: 'approved',
  currentApproved: true,
  filename: 'frame.png',
  driveFileId: 'frame-file',
  parentFolderKey: 'frames.approved',
  mimeType: 'image/png',
  sizeBytes: 1,
  sha256: 'a'.repeat(64),
  widthPx: 1,
  heightPx: 1,
  webViewLink: 'https://drive.google.com/file/d/frame-file/view',
  supersedesAssetId: null,
  supersededByAssetId: null,
  approvalEvidenceIds: ['approval'],
  licenseEvidenceId: null,
});

const folders = Object.freeze({
  schemaVersion: 1,
  updatedAt: '2026-08-07T00:00:00+08:00',
  folders: [
    {
      folderKey: 'frames.approved',
      driveFolderId: 'approved-folder',
      name: '20_Approved',
      parentFolderKey: null,
      lifecycleRole: 'approved',
    },
    {
      folderKey: 'frames.review',
      driveFolderId: 'review-folder',
      name: '10_Review',
      parentFolderKey: null,
      lifecycleRole: 'review',
    },
    {
      folderKey: 'references.active',
      driveFolderId: 'reference-folder',
      name: '05_Reference_Only',
      parentFolderKey: null,
      lifecycleRole: 'reference',
    },
    {
      folderKey: 'references.archive',
      driveFolderId: 'archive-folder',
      name: '06_Rejected_And_Unverifiable',
      parentFolderKey: null,
      lifecycleRole: 'archive',
    },
  ],
});

test('rejects assets that point to unknown folder keys', () => {
  const issues = validateDriveAssetFolderAssignments({
    schemaVersion: 1,
    updatedAt: '2026-08-07T00:00:00+08:00',
    assets: [{ ...approvedAsset, parentFolderKey: 'missing-folder' }],
  }, folders);

  assert.ok(issues.some(({ code }) => code === 'unknown-asset-parent-folder'));
});

test('rejects Approved assets assigned to Review folders', () => {
  const issues = validateDriveAssetFolderAssignments({
    schemaVersion: 1,
    updatedAt: '2026-08-07T00:00:00+08:00',
    assets: [{ ...approvedAsset, parentFolderKey: 'frames.review' }],
  }, folders);

  assert.ok(issues.some(
    ({ code }) => code === 'asset-lifecycle-folder-mismatch',
  ));
});

test('rejects Approved-folder assets that are not current Approved masters', () => {
  const issues = validateDriveAssetFolderAssignments({
    schemaVersion: 1,
    updatedAt: '2026-08-07T00:00:00+08:00',
    assets: [{ ...approvedAsset, currentApproved: false }],
  }, folders);

  assert.ok(issues.some(
    ({ code }) => code === 'asset-current-approved-mismatch',
  ));
});

test('routes archived reference-only assets to Archive instead of active Reference', () => {
  const issues = validateDriveAssetFolderAssignments({
    schemaVersion: 1,
    updatedAt: '2026-08-07T00:00:00+08:00',
    assets: [{
      ...approvedAsset,
      assetId: 'archived-reference',
      assetType: 'reference-only',
      status: 'archived',
      currentApproved: false,
      driveFileId: 'archived-reference-file',
      parentFolderKey: 'references.archive',
      approvalEvidenceIds: [],
    }],
  }, folders);

  assert.deepEqual(issues, []);
});

test('accepts the current governed Asset and Folder registries', async () => {
  const [assets, currentFolders] = await Promise.all([
    readFile(new URL('../data/drive-assets/idiom-card-assets.json', import.meta.url), 'utf8'),
    readFile(new URL('../data/drive-assets/drive-folders.json', import.meta.url), 'utf8'),
  ]);

  assert.deepEqual(validateDriveAssetFolderAssignments(
    JSON.parse(assets),
    JSON.parse(currentFolders),
  ), []);
});

test('the permanent CLI validates cross-registry folder assignments', async () => {
  const cli = await readFile(
    new URL('../scripts/validate-drive-assets.mjs', import.meta.url),
    'utf8',
  );

  assert.match(cli, /validateDriveAssetFolderAssignments/u);
});
