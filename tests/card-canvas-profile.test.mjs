import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { validateCardCanvas } from '../scripts/card-canvas-profile.mjs';

const repoUrl = new URL('../', import.meta.url);

async function readJson(relativePath) {
  const content = await readFile(new URL(relativePath, repoUrl), 'utf8');
  return JSON.parse(content);
}

test('canvas profile registry declares 897x1752 as the only canonical production profile', async () => {
  const registry = await readJson('data/cards/card-canvas-profiles.json');
  assert.equal(registry.currentProfileId, 'cicg-card-897x1752-v1');

  const canonical = registry.profiles.find(
    (profile) => profile.profileId === registry.currentProfileId,
  );
  assert.deepEqual(
    canonical,
    {
      profileId: 'cicg-card-897x1752-v1',
      widthPx: 897,
      heightPx: 1752,
      aspectRatio: '299:584',
      status: 'canonical',
      newProductionAllowed: true,
    },
  );

  const legacy = registry.profiles.find(
    (profile) => profile.profileId === 'cicg-card-1024x2000-legacy-v1',
  );
  assert.equal(legacy.status, 'legacy-compatible');
  assert.equal(legacy.newProductionAllowed, false);
});

test('897x1752 canonical production succeeds', () => {
  assert.deepEqual(
    validateCardCanvas({
      widthPx: 897,
      heightPx: 1752,
      dimensionStatus: 'canonical',
    }),
    {
      valid: true,
      profileId: 'cicg-card-897x1752-v1',
      dimensionStatus: 'canonical',
      reason: null,
    },
  );
});

test('1024x2000 is rejected for new production', () => {
  const result = validateCardCanvas({
    widthPx: 1024,
    heightPx: 2000,
    dimensionStatus: 'legacy-compatible',
    newProductionAllowed: false,
  });
  assert.equal(result.valid, false);
  assert.match(result.reason, /legacy.*new production/i);
});

test('1024x2000 remains valid for explicit legacy preservation', () => {
  assert.deepEqual(
    validateCardCanvas(
      {
        widthPx: 1024,
        heightPx: 2000,
        dimensionStatus: 'legacy-compatible',
        newProductionAllowed: false,
      },
      { productionIntent: 'preserve-existing' },
    ),
    {
      valid: true,
      profileId: 'cicg-card-1024x2000-legacy-v1',
      dimensionStatus: 'legacy-compatible',
      reason: null,
    },
  );
});

test('near-canonical dimensions are rejected without tolerance', () => {
  const result = validateCardCanvas({
    widthPx: 896,
    heightPx: 1752,
    dimensionStatus: 'canonical',
  });
  assert.equal(result.valid, false);
  assert.match(result.reason, /unsupported card canvas/i);
});

test('integer multiples are valid only as derivative exports', () => {
  assert.deepEqual(
    validateCardCanvas({
      widthPx: 1794,
      heightPx: 3504,
      dimensionStatus: 'derivative',
      sourceCanvasProfile: 'cicg-card-897x1752-v1',
    }),
    {
      valid: true,
      profileId: 'cicg-card-897x1752-v1',
      dimensionStatus: 'derivative',
      reason: null,
    },
  );

  const invalid = validateCardCanvas({
    widthPx: 1794,
    heightPx: 3504,
    dimensionStatus: 'canonical',
  });
  assert.equal(invalid.valid, false);
  assert.match(invalid.reason, /derivative/i);
});
