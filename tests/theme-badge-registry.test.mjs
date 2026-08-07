import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  THEME_CATEGORIES,
  validateThemeBadgeRegistry,
} from '../.test-dist/src/cards/theme-badges/index.js';

const themeRegistry = JSON.parse(
  readFileSync(new URL('../data/cards/theme-badge-registry.json', import.meta.url), 'utf8'),
);
const driveAssets = JSON.parse(
  readFileSync(new URL('../data/drive-assets/idiom-card-assets.json', import.meta.url), 'utf8'),
);

test('theme badge registry contains exactly the nine approved categories', () => {
  const result = validateThemeBadgeRegistry(themeRegistry, driveAssets);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(
    themeRegistry.badges.map((badge) => badge.systemValue),
    [...THEME_CATEGORIES],
  );
  assert.equal(result.summary.badgeCount, 9);
  assert.equal(result.summary.approvedAssetCount, 9);
});

test('rejects mismatched asset identity and category', () => {
  const invalid = JSON.parse(JSON.stringify(themeRegistry));
  invalid.badges[0].assetId = invalid.badges[1].assetId;
  const result = validateThemeBadgeRegistry(invalid, driveAssets);
  assert.ok(result.errors.some((error) => error.includes('assetId')));
});

test('rejects non-transparent or wrong-size masters', () => {
  const invalid = JSON.parse(JSON.stringify(themeRegistry));
  invalid.badges[0].pixelWidth = 900;
  invalid.badges[0].transparentBackground = false;
  const result = validateThemeBadgeRegistry(invalid, driveAssets);
  assert.ok(result.errors.some((error) => error.includes('1024')));
  assert.ok(result.errors.some((error) => error.includes('transparentBackground')));
});

test('rejects secondary display labels outside the fixed nine categories', () => {
  const invalid = JSON.parse(JSON.stringify(themeRegistry));
  invalid.badges[0].displayName = '專注';
  const result = validateThemeBadgeRegistry(invalid, driveAssets);
  assert.ok(result.errors.some((error) => error.includes('displayName')));
});
