import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PROJECT_ASSET_DOMAINS,
  PROJECT_ASSET_LIFECYCLE_STATUSES,
  PROJECT_ASSET_ROLES,
} from '../.test-dist/src/cards/drive-assets/index.js';

test('exports the Phase 2 project asset vocabulary', () => {
  assert.deepEqual(PROJECT_ASSET_DOMAINS, [
    'project-management',
    'design-spec',
    'branding',
    'background',
    'ui-component',
    'map-progress',
    'item-icon',
    'bonus-mode',
    'pwa-icon',
    'game-content',
    'localization',
    'license-evidence',
    'test-evidence',
    'release-store',
    'runtime-derivative',
  ]);

  assert.deepEqual(PROJECT_ASSET_ROLES, [
    'source-master',
    'runtime-derivative',
    'evidence',
    'release-artifact',
    'dashboard',
    'requirement-only',
  ]);

  assert.deepEqual(PROJECT_ASSET_LIFECYCLE_STATUSES, [
    'missing',
    'intake',
    'review',
    'changes-requested',
    'approved',
    'published',
    'blocked',
    'quarantined',
    'archived',
    'rejected',
    'unverifiable',
  ]);
});
