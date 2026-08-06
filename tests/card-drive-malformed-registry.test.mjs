import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateDriveAssetRegistry,
  validateDriveFolderRegistry,
  validateDriveMigrationLedger,
} from '../.test-dist/src/cards/drive-assets/index.js';

test('returns issues instead of throwing on malformed JSON asset records', () => {
  assert.doesNotThrow(() => {
    const issues = validateDriveAssetRegistry({
      schemaVersion: 1,
      updatedAt: '2026-08-07T00:00:00+08:00',
      assets: [{
        assetId: 'broken-approved',
        assetType: 'card-frame',
        identity: 'broken',
        version: '1.0',
        status: 'approved',
        currentApproved: true,
      }],
    });

    assert.ok(issues.some(({ code }) => code === 'invalid-asset-record'));
  });
});

test('returns an issue instead of throwing on a malformed asset registry root', () => {
  assert.doesNotThrow(() => {
    const issues = validateDriveAssetRegistry({ assets: 'not-an-array' });

    assert.deepEqual(issues.map(({ code }) => code), [
      'invalid-registry-shape',
    ]);
  });
});

test('returns issues instead of throwing on malformed JSON folder records', () => {
  assert.doesNotThrow(() => {
    const issues = validateDriveFolderRegistry({
      schemaVersion: 1,
      updatedAt: '2026-08-07T00:00:00+08:00',
      folders: [{
        folderKey: 'idiom-cards.templates.review',
        driveFolderId: 'broken-folder',
      }],
    });

    assert.ok(issues.some(({ code }) => code === 'invalid-folder-record'));
  });
});

test('returns an issue instead of throwing on a malformed folder registry root', () => {
  assert.doesNotThrow(() => {
    const issues = validateDriveFolderRegistry({ folders: null });

    assert.deepEqual(issues.map(({ code }) => code), [
      'invalid-registry-shape',
    ]);
  });
});

test('returns issues instead of throwing on malformed migration entries', () => {
  assert.doesNotThrow(() => {
    const issues = validateDriveMigrationLedger({
      schemaVersion: 1,
      batchId: 'broken-batch',
      phase: 'phase1',
      createdAt: '2026-08-07T00:00:00+08:00',
      sourceCommit: '0'.repeat(40),
      status: 'blocked',
      entries: [{
        driveResourceId: 'broken-entry',
        status: 'blocked',
      }],
    });

    assert.ok(issues.some(({ code }) => code === 'invalid-migration-entry'));
  });
});

test('returns an issue instead of throwing on a malformed migration ledger root', () => {
  assert.doesNotThrow(() => {
    const issues = validateDriveMigrationLedger({ entries: null });

    assert.deepEqual(issues.map(({ code }) => code), [
      'invalid-ledger-shape',
    ]);
  });
});
