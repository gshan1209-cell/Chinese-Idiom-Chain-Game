import test from 'node:test';
import assert from 'node:assert/strict';

import { validateAssetControlCenterSnapshot } from '../.test-dist/src/cards/drive-assets/index.js';

const now = '2026-08-07T10:16:03+08:00';
const mainSha = 'a'.repeat(40);

const approvedProject = {
  recordId: 'bg-home@1.0',
  identity: 'bg-home',
  assetNameZh: '首頁背景',
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
  driveFileId: 'drive-bg-home',
  parentFolderKey: 'visuals.game-backgrounds.approved',
  githubPath: null,
  githubPr: null,
  filename: 'home.png',
  mimeType: 'image/png',
  sizeBytes: 100,
  sha256: '1'.repeat(64),
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

const reviewProject = {
  ...approvedProject,
  recordId: 'bg-map@1.0-review',
  identity: 'bg-map',
  lifecycleStatus: 'review',
  approvalStatus: 'pending',
  currentMaster: false,
  driveFileId: 'drive-bg-map',
  parentFolderKey: 'visuals.game-backgrounds.review',
  filename: 'map.png',
  sha256: '2'.repeat(64),
  approvalEvidenceIds: [],
  driftState: 'drive-only',
};

const missingProject = {
  ...approvedProject,
  recordId: 'pwa-icon@0.0',
  identity: 'pwa-icon',
  assetNameZh: 'PWA Icon',
  domain: 'pwa-icon',
  assetType: 'pwa-icon',
  role: 'requirement-only',
  version: '0.0',
  lifecycleStatus: 'missing',
  approvalStatus: 'not-started',
  currentMaster: false,
  priority: 'P0',
  requiredQty: 1,
  availableQty: 0,
  gapQty: 1,
  sourceSystem: 'none',
  driveFileId: null,
  parentFolderKey: null,
  githubPath: null,
  filename: null,
  mimeType: null,
  sizeBytes: null,
  sha256: null,
  widthPx: null,
  heightPx: null,
  transparent: null,
  approvalEvidenceIds: [],
  driftState: 'missing',
};

const idiomApproved = {
  assetId: 'rarity-frame-n@1.0',
  assetType: 'card-frame',
  identity: 'rarity-frame-n',
  version: '1.0',
  status: 'approved',
  currentApproved: true,
};

const idiomReview = {
  ...idiomApproved,
  assetId: 'difficulty-badge-set@1.0-review',
  assetType: 'difficulty-badge',
  identity: 'difficulty-badge-set',
  status: 'review',
  currentApproved: false,
};

const projectRegistry = {
  schemaVersion: 1,
  updatedAt: now,
  assets: [approvedProject, reviewProject, missingProject],
};

const idiomRegistry = {
  schemaVersion: 1,
  updatedAt: now,
  assets: [idiomApproved, idiomReview],
};

const controlCenter = {
  schemaVersion: 1,
  updatedAt: now,
  controlCenter: {
    title: 'CICG_素材管理控制中心_v1.0',
    spreadsheetId: 'sheet-id',
  },
  currentSnapshot: {
    snapshotId: 'SNAP-TEST',
    baselineGitHubMainSha: mainSha,
    openAssetPr: 36,
    trackedLogicalAssets: 5,
    approvedCurrentMasters: 2,
    reviewOrPrItems: 2,
    missingP0Assets: 1,
    driftWarnings: 0,
  },
};

const context = { currentMainSha: mainSha, openAssetPrs: [36] };

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function issueCodes(snapshot, nextContext = context) {
  return validateAssetControlCenterSnapshot(
    snapshot,
    projectRegistry,
    idiomRegistry,
    nextContext,
  ).map(({ code }) => code);
}

test('accepts a fresh dashboard whose KPIs are derived from both registries', () => {
  assert.deepEqual(
    validateAssetControlCenterSnapshot(
      controlCenter,
      projectRegistry,
      idiomRegistry,
      context,
    ),
    [],
  );
});

test('marks the dashboard stale when its baseline main SHA is not current', () => {
  assert.ok(issueCodes(controlCenter, {
    currentMainSha: 'b'.repeat(40),
    openAssetPrs: [36],
  }).includes('stale-dashboard-main-sha'));
});

test('marks the dashboard stale when its tracked asset PR is no longer open', () => {
  assert.ok(issueCodes(controlCenter, {
    currentMainSha: mainSha,
    openAssetPrs: [],
  }).includes('stale-dashboard-open-pr'));
});

test('rejects dashboard KPI counts that do not match registries', () => {
  const snapshot = clone(controlCenter);
  snapshot.currentSnapshot.approvedCurrentMasters = 999;
  assert.ok(issueCodes(snapshot).includes('dashboard-count-mismatch'));
});

test('rejects a tracked logical asset count that does not match distinct families', () => {
  const snapshot = clone(controlCenter);
  snapshot.currentSnapshot.trackedLogicalAssets = 999;
  assert.ok(issueCodes(snapshot).includes('dashboard-count-mismatch'));
});

test('rejects a dashboard timestamp more than five minutes ahead of both registries', () => {
  const snapshot = clone(controlCenter);
  snapshot.updatedAt = '2026-08-07T10:22:04+08:00';
  assert.ok(issueCodes(snapshot).includes('stale-dashboard-registry'));
});

test('returns an issue instead of throwing for malformed dashboard JSON', () => {
  assert.doesNotThrow(() => validateAssetControlCenterSnapshot(
    { schemaVersion: 1 },
    projectRegistry,
    idiomRegistry,
    context,
  ));
  assert.ok(issueCodes({ schemaVersion: 1 }).includes('malformed-control-center'));
});
