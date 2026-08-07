import test from 'node:test';
import assert from 'node:assert/strict';

import { validateProjectAssetFolderAssignments } from '../.test-dist/src/cards/drive-assets/index.js';

const now = '2026-08-07T10:16:03+08:00';

const reviewAsset = {
  recordId: 'bg-home-portrait@1.0-review',
  identity: 'bg-home-portrait',
  assetNameZh: '首頁背景（直式）',
  domain: 'background',
  assetType: 'background',
  role: 'source-master',
  version: '1.0',
  lifecycleStatus: 'review',
  approvalStatus: 'pending',
  currentMaster: false,
  priority: 'P0',
  requiredQty: 1,
  availableQty: 1,
  gapQty: 0,
  sourceSystem: 'drive',
  driveFileId: 'project-drive-file',
  parentFolderKey: 'visuals.game-backgrounds.review',
  githubPath: null,
  githubPr: null,
  filename: 'home.png',
  mimeType: 'image/png',
  sizeBytes: 100,
  sha256: 'a'.repeat(64),
  widthPx: 100,
  heightPx: 200,
  transparent: false,
  sourceAssetId: null,
  sourceSha256: null,
  releaseVersion: null,
  boundCommitSha: null,
  approvalEvidenceIds: [],
  driftState: 'drive-only',
  lastVerifiedAt: now,
  owner: 'Visual Reviewer',
  nextAction: '人工審核',
  notes: '',
};

const folders = {
  schemaVersion: 1,
  updatedAt: now,
  folders: [
    {
      folderKey: 'project.root',
      driveFolderId: 'root',
      name: 'Chinese-Idiom-Chain-Game',
      parentFolderKey: null,
      lifecycleRole: 'root',
    },
    {
      folderKey: 'project.visuals',
      driveFolderId: 'visuals',
      name: '02_UI_UX_And_Visuals',
      parentFolderKey: 'project.root',
      lifecycleRole: 'container',
    },
    {
      folderKey: 'visuals.game-backgrounds.review',
      driveFolderId: 'background-review',
      name: '10_Review',
      parentFolderKey: 'project.visuals',
      lifecycleRole: 'review',
    },
    {
      folderKey: 'visuals.game-backgrounds.approved',
      driveFolderId: 'background-approved',
      name: '20_Approved',
      parentFolderKey: 'project.visuals',
      lifecycleRole: 'approved',
    },
    {
      folderKey: 'project.inbox',
      driveFolderId: 'inbox',
      name: '80_Inbox',
      parentFolderKey: 'project.root',
      lifecycleRole: 'inbox',
    },
    {
      folderKey: 'project.archive',
      driveFolderId: 'archive',
      name: '90_Archive',
      parentFolderKey: 'project.root',
      lifecycleRole: 'archive',
    },
    {
      folderKey: 'project.management.asset-control-center',
      driveFolderId: 'control-center',
      name: 'Asset_Control_Center',
      parentFolderKey: 'project.root',
      lifecycleRole: 'container',
    },
  ],
};

function registry(...assets) {
  return { schemaVersion: 1, updatedAt: now, assets };
}

test('accepts review, approved, dashboard and GitHub derivative assignments', () => {
  const approved = {
    ...reviewAsset,
    recordId: 'bg-home-portrait@1.0',
    lifecycleStatus: 'approved',
    approvalStatus: 'approved',
    currentMaster: true,
    parentFolderKey: 'visuals.game-backgrounds.approved',
    approvalEvidenceIds: ['approval-1'],
  };
  const dashboard = {
    ...reviewAsset,
    recordId: 'asset-control-center@1.0',
    identity: 'asset-control-center',
    domain: 'project-management',
    assetType: 'dashboard',
    role: 'dashboard',
    lifecycleStatus: 'approved',
    approvalStatus: 'approved',
    parentFolderKey: 'project.management.asset-control-center',
  };
  const derivative = {
    ...reviewAsset,
    recordId: 'runtime-home@1.0',
    identity: 'runtime-home',
    domain: 'runtime-derivative',
    role: 'runtime-derivative',
    sourceSystem: 'github',
    driveFileId: null,
    parentFolderKey: null,
    githubPath: 'public/assets/home.webp',
    filename: 'home.webp',
    mimeType: 'image/webp',
    sourceAssetId: approved.recordId,
    sourceSha256: approved.sha256,
  };
  assert.deepEqual(
    validateProjectAssetFolderAssignments(
      registry(reviewAsset, approved, dashboard, derivative),
      folders,
    ),
    [],
  );
});

test('rejects an asset that points to an unknown folder key', () => {
  const issues = validateProjectAssetFolderAssignments(
    registry({ ...reviewAsset, parentFolderKey: 'missing-folder' }),
    folders,
  );
  assert.ok(issues.some(({ code }) => code === 'unknown-project-asset-folder'));
});

test('rejects review assets assigned to approved folders', () => {
  const issues = validateProjectAssetFolderAssignments(
    registry({
      ...reviewAsset,
      parentFolderKey: 'visuals.game-backgrounds.approved',
    }),
    folders,
  );
  assert.ok(issues.some(({ code }) => code === 'project-asset-folder-role-mismatch'));
});

test('rejects approved source masters assigned to review folders', () => {
  const issues = validateProjectAssetFolderAssignments(
    registry({
      ...reviewAsset,
      lifecycleStatus: 'approved',
      approvalStatus: 'approved',
      currentMaster: true,
      approvalEvidenceIds: ['approval-1'],
    }),
    folders,
  );
  assert.ok(issues.some(({ code }) => code === 'project-asset-folder-role-mismatch'));
});

test('requires GitHub derivatives and missing requirements to have no Drive parent', () => {
  const derivativeIssues = validateProjectAssetFolderAssignments(
    registry({
      ...reviewAsset,
      role: 'runtime-derivative',
      domain: 'runtime-derivative',
      sourceSystem: 'github',
      parentFolderKey: 'project.inbox',
      githubPath: 'public/assets/home.webp',
      sourceAssetId: 'source',
      sourceSha256: 'b'.repeat(64),
    }),
    folders,
  );
  assert.ok(derivativeIssues.some(({ code }) => code === 'project-asset-unexpected-folder'));

  const missingIssues = validateProjectAssetFolderAssignments(
    registry({
      ...reviewAsset,
      role: 'requirement-only',
      lifecycleStatus: 'missing',
      sourceSystem: 'none',
      driveFileId: null,
      parentFolderKey: 'project.inbox',
      filename: null,
      mimeType: null,
      sizeBytes: null,
      sha256: null,
      widthPx: null,
      heightPx: null,
    }),
    folders,
  );
  assert.ok(missingIssues.some(({ code }) => code === 'project-asset-unexpected-folder'));
});
