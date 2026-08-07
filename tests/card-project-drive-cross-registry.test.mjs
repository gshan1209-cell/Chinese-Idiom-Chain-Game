import test from 'node:test';
import assert from 'node:assert/strict';

import { validateDriveRegistryCrossLinks } from '../.test-dist/src/cards/drive-assets/index.js';

const now = '2026-08-07T10:16:03+08:00';
const checksum = 'a'.repeat(64);

const approvedSource = {
  recordId: 'bg-home-portrait@1.0',
  identity: 'bg-home-portrait',
  assetNameZh: '首頁背景（直式）',
  domain: 'background',
  assetType: 'background',
  role: 'source-master',
  version: '1.0',
  lifecycleStatus: 'approved',
  approvalStatus: 'approved',
  currentMaster: true,
  priority: 'P0',
  requiredQty: 1,
  availableQty: 1,
  gapQty: 0,
  sourceSystem: 'drive',
  driveFileId: 'project-drive-file',
  parentFolderKey: 'visuals.game-backgrounds.approved',
  githubPath: null,
  githubPr: null,
  filename: 'home.png',
  mimeType: 'image/png',
  sizeBytes: 100,
  sha256: checksum,
  widthPx: 100,
  heightPx: 200,
  transparent: false,
  sourceAssetId: null,
  sourceSha256: null,
  releaseVersion: null,
  boundCommitSha: null,
  approvalEvidenceIds: ['approval-1'],
  driftState: 'aligned',
  lastVerifiedAt: now,
  owner: 'Visual Owner',
  nextAction: '維持 current master',
  notes: '',
};

const derivative = {
  ...approvedSource,
  recordId: 'runtime-home-bg@1.0',
  identity: 'runtime-home-bg',
  domain: 'runtime-derivative',
  role: 'runtime-derivative',
  currentMaster: false,
  sourceSystem: 'github',
  driveFileId: null,
  parentFolderKey: null,
  githubPath: 'public/assets/backgrounds/home.webp',
  filename: 'home.webp',
  mimeType: 'image/webp',
  sourceAssetId: approvedSource.recordId,
  sourceSha256: approvedSource.sha256,
};

const idiomAsset = {
  assetId: 'rarity-frame-n@1.0',
  assetType: 'card-frame',
  identity: 'rarity-frame-n',
  version: '1.0',
  status: 'approved',
  currentApproved: true,
  filename: 'frame.png',
  driveFileId: 'idiom-drive-file',
  parentFolderKey: 'idiom-cards.components.card-frames.approved',
  mimeType: 'image/png',
  sizeBytes: 100,
  sha256: 'b'.repeat(64),
  widthPx: 1024,
  heightPx: 2000,
  webViewLink: 'https://drive.google.com/file/d/idiom-drive-file/view',
  supersedesAssetId: null,
  supersededByAssetId: null,
  approvalEvidenceIds: ['approval-2'],
  licenseEvidenceId: null,
};

const emptyIdiomRegistry = { schemaVersion: 1, updatedAt: now, assets: [] };

function projectRegistry(...assets) {
  return { schemaVersion: 1, updatedAt: now, assets };
}

test('accepts an approved source and checksum-bound runtime derivative', () => {
  assert.deepEqual(
    validateDriveRegistryCrossLinks(
      projectRegistry(approvedSource, derivative),
      emptyIdiomRegistry,
    ),
    [],
  );
});

test('rejects a Drive File ID reused by project and idiom-card registries', () => {
  const issues = validateDriveRegistryCrossLinks(
    projectRegistry(approvedSource),
    {
      schemaVersion: 1,
      updatedAt: now,
      assets: [{ ...idiomAsset, driveFileId: approvedSource.driveFileId }],
    },
  );
  assert.ok(issues.some(({ code }) => code === 'cross-registry-drive-file-id'));
});

test('requires a runtime derivative source to exist and be an approved current master', () => {
  const reviewSource = {
    ...approvedSource,
    lifecycleStatus: 'review',
    approvalStatus: 'pending',
    currentMaster: false,
  };
  const reviewIssues = validateDriveRegistryCrossLinks(
    projectRegistry(reviewSource, {
      ...derivative,
      sourceAssetId: reviewSource.recordId,
    }),
    emptyIdiomRegistry,
  );
  assert.ok(reviewIssues.some(({ code }) => code === 'derivative-source-not-approved'));

  const missingIssues = validateDriveRegistryCrossLinks(
    projectRegistry({ ...derivative, sourceAssetId: 'missing-source' }),
    emptyIdiomRegistry,
  );
  assert.ok(missingIssues.some(({ code }) => code === 'derivative-source-not-found'));
});

test('requires the derivative source checksum to match', () => {
  const issues = validateDriveRegistryCrossLinks(
    projectRegistry(approvedSource, { ...derivative, sourceSha256: 'c'.repeat(64) }),
    emptyIdiomRegistry,
  );
  assert.ok(issues.some(({ code }) => code === 'derivative-source-checksum-mismatch'));
});

test('rejects source masters that point back to another source', () => {
  const issues = validateDriveRegistryCrossLinks(
    projectRegistry({
      ...approvedSource,
      sourceAssetId: 'another-source',
      sourceSha256: 'd'.repeat(64),
    }),
    emptyIdiomRegistry,
  );
  assert.ok(issues.some(({ code }) => code === 'source-master-has-source-link'));
});
