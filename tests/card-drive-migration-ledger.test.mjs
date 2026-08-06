import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateDriveMigrationLedger,
} from '../.test-dist/src/cards/drive-assets/index.js';

const fileBefore = Object.freeze({
  name: 'N.png',
  parentFolderId: 'source-folder',
  mimeType: 'image/png',
  sizeBytes: 2285281,
  sha256: '17e6a6798e491ad2bad12b5746e7c3414078e456b83838db2e75aa0a7352ae65',
  webViewLink: 'https://drive.google.com/file/d/file-n/view',
});

const fileAfter = Object.freeze({
  ...fileBefore,
  name: 'CICG_Component_RarityFrame_N_v1.0_Approved.png',
  parentFolderId: 'approved-folder',
});

const folderBefore = Object.freeze({
  name: 'CICG_Card_Templates_v2.6_Review',
  parentFolderId: 'visuals-folder',
  mimeType: 'application/vnd.google-apps.folder',
  sizeBytes: null,
  sha256: null,
  webViewLink: 'https://drive.google.com/drive/folders/folder-review',
});

function entry(overrides = {}) {
  return {
    resourceKind: 'file',
    assetId: 'frame-n-v1.0-emerald-antique-gold',
    driveResourceId: 'file-n',
    operation: 'move-and-rename',
    before: fileBefore,
    after: fileAfter,
    rollback: fileBefore,
    status: 'verified',
    blockingReason: null,
    ...overrides,
  };
}

function ledger(overrides = {}) {
  return {
    schemaVersion: 1,
    batchId: 'phase1-batch1-approved-rarity-frames',
    phase: 'phase1',
    createdAt: '2026-08-06T14:00:00+08:00',
    sourceCommit: 'b73c444be304b8550b4c1696a562e0a6fe9863c3',
    status: 'verified',
    entries: [entry()],
    ...overrides,
  };
}

test('blocks a file move without rollback metadata', () => {
  const issues = validateDriveMigrationLedger(ledger({
    status: 'in-progress',
    entries: [entry({
      before: null,
      after: null,
      rollback: null,
      status: 'applied',
    })],
  }));

  assert.ok(issues.some(({ code }) => code === 'missing-snapshot'));
});

test('rejects invalid source commits and duplicate Drive resource IDs', () => {
  const issues = validateDriveMigrationLedger(ledger({
    sourceCommit: 'not-a-commit',
    entries: [entry(), entry({ assetId: 'frame-r', driveResourceId: 'file-n' })],
  }));

  assert.ok(issues.some(({ code }) => code === 'invalid-source-commit'));
  assert.ok(issues.some(({ code }) => code === 'duplicate-drive-resource-id'));
});

test('requires rollback snapshots to equal the before snapshot exactly', () => {
  const issues = validateDriveMigrationLedger(ledger({
    entries: [entry({ rollback: { ...fileBefore, parentFolderId: 'other-folder' } })],
  }));

  assert.ok(issues.some(({ code }) => code === 'rollback-mismatch'));
});

test('validates file and folder snapshot shapes', () => {
  const issues = validateDriveMigrationLedger(ledger({
    status: 'in-progress',
    entries: [
      entry({
        status: 'planned',
        before: { ...fileBefore, sizeBytes: 0, sha256: 'bad' },
        rollback: { ...fileBefore, sizeBytes: 0, sha256: 'bad' },
      }),
      entry({
        resourceKind: 'folder',
        assetId: null,
        driveResourceId: 'folder-review',
        operation: 'move',
        status: 'planned',
        before: { ...folderBefore, sizeBytes: 1 },
        after: { ...folderBefore, parentFolderId: 'templates-review', sha256: 'bad' },
        rollback: { ...folderBefore, sizeBytes: 1 },
      }),
    ],
  }));

  assert.ok(issues.some(({ code }) => code === 'invalid-file-snapshot'));
  assert.ok(issues.some(({ code }) => code === 'invalid-folder-snapshot'));
});

test('verified moves preserve immutable metadata and change parent', () => {
  const issues = validateDriveMigrationLedger(ledger({
    entries: [entry({
      after: {
        ...fileAfter,
        parentFolderId: fileBefore.parentFolderId,
        sha256: '27e6a6798e491ad2bad12b5746e7c3414078e456b83838db2e75aa0a7352ae65',
      },
    })],
  }));

  assert.ok(issues.some(({ code }) => code === 'verified-move-mismatch'));
});

test('blocked entries require a reason and no applied snapshots', () => {
  const issues = validateDriveMigrationLedger(ledger({
    status: 'blocked',
    entries: [entry({ status: 'blocked', blockingReason: '', after: fileAfter })],
  }));

  assert.ok(issues.some(({ code }) => code === 'blocked-missing-reason'));
  assert.ok(issues.some(({ code }) => code === 'blocked-has-applied-metadata'));
});

test('verified ledgers require every mutated entry to be verified', () => {
  const issues = validateDriveMigrationLedger(ledger({
    entries: [entry({ status: 'applied' })],
  }));

  assert.ok(issues.some(({ code }) => code === 'ledger-not-fully-verified'));
});
