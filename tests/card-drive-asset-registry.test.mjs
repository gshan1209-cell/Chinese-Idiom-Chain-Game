import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DRIVE_ASSET_STATUSES,
  DRIVE_ASSET_TYPES,
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
