import test from 'node:test';
import assert from 'node:assert/strict';

import { validateProjectAssetRegistry } from '../.test-dist/src/cards/drive-assets/index.js';

const now = '2026-08-07T10:16:03+08:00';
const checksum = 'a'.repeat(64);

const background = {
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
  driveFileId: 'drive-bg-home',
  parentFolderKey: 'visuals.game-backgrounds.review',
  githubPath: null,
  githubPr: null,
  filename: 'CICG_BG_01_Home_Portrait_v1.0_Review.png',
  mimeType: 'image/png',
  sizeBytes: 2147544,
  sha256: checksum,
  widthPx: 941,
  heightPx: 1672,
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
  notes: 'Review only',
};

function registry(...assets) {
  return { schemaVersion: 1, updatedAt: now, assets };
}

function issueCodes(value) {
  return validateProjectAssetRegistry(value).map(({ code }) => code);
}

test('accepts a valid review source master', () => {
  assert.deepEqual(validateProjectAssetRegistry(registry(background)), []);
});

test('rejects invalid quantity arithmetic', () => {
  assert.ok(issueCodes(registry({
    ...background,
    requiredQty: 3,
    availableQty: 1,
    gapQty: 0,
  })).includes('invalid-gap-quantity'));
});

test('rejects an approved current master without approval evidence', () => {
  assert.ok(issueCodes(registry({
    ...background,
    lifecycleStatus: 'approved',
    approvalStatus: 'approved',
    currentMaster: true,
    parentFolderKey: 'visuals.game-backgrounds.approved',
  })).includes('approved-missing-evidence'));
});

test('rejects a runtime derivative without source binding', () => {
  assert.ok(issueCodes(registry({
    ...background,
    recordId: 'runtime-home-bg@1.0',
    identity: 'runtime-home-bg',
    domain: 'runtime-derivative',
    role: 'runtime-derivative',
    sourceSystem: 'github',
    driveFileId: null,
    parentFolderKey: null,
    githubPath: 'public/assets/backgrounds/home.webp',
    filename: 'home.webp',
    mimeType: 'image/webp',
    sourceAssetId: null,
    sourceSha256: null,
  })).includes('derivative-missing-source'));
});

test('rejects duplicate record IDs and duplicate current masters', () => {
  const approved = {
    ...background,
    recordId: 'bg-home-portrait@1.0',
    lifecycleStatus: 'approved',
    approvalStatus: 'approved',
    currentMaster: true,
    parentFolderKey: 'visuals.game-backgrounds.approved',
    approvalEvidenceIds: ['approval-1'],
  };
  const issues = issueCodes(registry(
    approved,
    { ...approved, driveFileId: 'drive-bg-home-2' },
  ));
  assert.ok(issues.includes('duplicate-project-record-id'));
  assert.ok(issues.includes('duplicate-project-current-master'));
});

test('rejects invalid versions and checksums', () => {
  const issues = issueCodes(registry({
    ...background,
    version: 'v1',
    sha256: 'not-a-checksum',
  }));
  assert.ok(issues.includes('invalid-project-version'));
  assert.ok(issues.includes('invalid-project-sha256'));
});

test('requires Drive and GitHub physical locations when applicable', () => {
  const driveIssues = issueCodes(registry({
    ...background,
    driveFileId: null,
    parentFolderKey: null,
  }));
  assert.ok(driveIssues.includes('missing-physical-location'));

  const missing = {
    ...background,
    recordId: 'missing-logo@0.0',
    identity: 'missing-logo',
    role: 'requirement-only',
    lifecycleStatus: 'missing',
    approvalStatus: 'not-started',
    sourceSystem: 'none',
    driveFileId: null,
    parentFolderKey: null,
    filename: null,
    mimeType: null,
    sizeBytes: null,
    sha256: null,
    widthPx: null,
    heightPx: null,
  };
  assert.deepEqual(validateProjectAssetRegistry(registry(missing)), []);
  assert.ok(issueCodes(registry({
    ...missing,
    driveFileId: 'unexpected',
  })).includes('unexpected-physical-location'));
});

test('requires a GitHub PR number for github-pr candidates', () => {
  assert.ok(issueCodes(registry({
    ...background,
    sourceSystem: 'github-pr',
    driveFileId: null,
    parentFolderKey: null,
    githubPath: 'public/assets/80_Inbox/example.png',
    githubPr: null,
  })).includes('pr-review-missing-pr'));
});

test('rejects current master flags outside approved or published states', () => {
  assert.ok(issueCodes(registry({
    ...background,
    currentMaster: true,
  })).includes('invalid-current-master-state'));
});

test('evidence cannot be a current master', () => {
  assert.ok(issueCodes(registry({
    ...background,
    role: 'evidence',
    domain: 'test-evidence',
    lifecycleStatus: 'approved',
    approvalStatus: 'approved',
    currentMaster: true,
    approvalEvidenceIds: ['approval-1'],
  })).includes('evidence-cannot-be-current-master'));
});

test('release artifacts require version and bound commit SHA', () => {
  assert.ok(issueCodes(registry({
    ...background,
    role: 'release-artifact',
    domain: 'release-store',
    releaseVersion: null,
    boundCommitSha: null,
  })).includes('release-missing-binding'));
});

test('returns stable issues instead of throwing for malformed JSON', () => {
  assert.doesNotThrow(() => validateProjectAssetRegistry({ schemaVersion: 1 }));
  assert.ok(issueCodes({ schemaVersion: 1 }).includes('malformed-project-registry'));
  assert.ok(issueCodes({
    schemaVersion: 1,
    updatedAt: now,
    assets: [null],
  }).includes('malformed-project-asset'));
});
