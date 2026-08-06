import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateDriveMigrationLedger,
} from '../.test-dist/src/cards/drive-assets/index.js';

test('blocks a file move without rollback metadata', () => {
  const issues = validateDriveMigrationLedger({
    schemaVersion: 1,
    batchId: 'phase1-batch1-approved-rarity-frames',
    phase: 'phase1',
    createdAt: '2026-08-06T14:00:00+08:00',
    sourceCommit: 'b73c444be304b8550b4c1696a562e0a6fe9863c3',
    status: 'in-progress',
    entries: [{
      resourceKind: 'file',
      assetId: 'frame-n-v1.0-emerald-antique-gold',
      driveResourceId: '1KO7NHfipw-MlFfYLDaakHuupGjtrwYu8',
      operation: 'move-and-rename',
      before: null,
      after: null,
      rollback: null,
      status: 'applied',
      blockingReason: null,
    }],
  });

  assert.ok(issues.some(({ code }) => code === 'missing-snapshot'));
});
