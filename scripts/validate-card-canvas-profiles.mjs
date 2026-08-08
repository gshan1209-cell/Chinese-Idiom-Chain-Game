import { readFile } from 'node:fs/promises';

import {
  CANONICAL_CARD_CANVAS_PROFILE_ID,
  LEGACY_CARD_CANVAS_PROFILE_ID,
  validateCardCanvas,
} from './card-canvas-profile.mjs';

const repoUrl = new URL('../', import.meta.url);

async function readJson(relativePath) {
  const content = await readFile(new URL(relativePath, repoUrl), 'utf8');
  return JSON.parse(content);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function validateProfileRegistry() {
  const registry = await readJson('data/cards/card-canvas-profiles.json');
  assert(registry.schemaVersion === 1, 'Canvas profile schemaVersion must be 1.');
  assert(
    registry.currentProfileId === CANONICAL_CARD_CANVAS_PROFILE_ID,
    'Current canvas profile must be cicg-card-897x1752-v1.',
  );

  const profileIds = registry.profiles.map((profile) => profile.profileId);
  assert(
    new Set(profileIds).size === profileIds.length,
    'Canvas profile IDs must be unique.',
  );

  const canonical = registry.profiles.find(
    (profile) => profile.profileId === CANONICAL_CARD_CANVAS_PROFILE_ID,
  );
  assert(canonical, 'Canonical canvas profile is missing.');
  assert(
    canonical.widthPx === 897 && canonical.heightPx === 1752,
    'Canonical canvas dimensions must be 897x1752.',
  );
  assert(canonical.aspectRatio === '299:584', 'Canonical ratio must be 299:584.');
  assert(canonical.status === 'canonical', 'Current profile must be canonical.');
  assert(
    canonical.newProductionAllowed === true,
    'Canonical profile must allow new production.',
  );

  const legacy = registry.profiles.find(
    (profile) => profile.profileId === LEGACY_CARD_CANVAS_PROFILE_ID,
  );
  assert(legacy, 'Legacy 1024x2000 canvas profile is missing.');
  assert(
    legacy.widthPx === 1024 && legacy.heightPx === 2000,
    'Legacy canvas dimensions must be 1024x2000.',
  );
  assert(
    legacy.status === 'legacy-compatible',
    'Legacy profile must use legacy-compatible status.',
  );
  assert(
    legacy.newProductionAllowed === false,
    'Legacy profile must prohibit new production.',
  );

  return registry;
}

async function validateDeclaredUrAssets() {
  const assetRegistry = await readJson(
    'data/drive-assets/ur-card-assets-2026-08-08.json',
  );
  let validated = 0;

  for (const asset of assetRegistry.assets ?? []) {
    if (!asset.canvasProfile) {
      continue;
    }

    const result = validateCardCanvas(
      {
        widthPx: asset.widthPx,
        heightPx: asset.heightPx,
        dimensionStatus: asset.dimensionStatus,
        sourceCanvasProfile: asset.sourceCanvasProfile,
        newProductionAllowed: asset.newProductionAllowed,
      },
      {
        productionIntent:
          asset.dimensionStatus === 'legacy-compatible'
            ? 'preserve-existing'
            : 'new',
      },
    );

    assert(
      result.valid,
      `${asset.assetId} has invalid canvas metadata: ${result.reason}`,
    );
    assert(
      result.profileId === asset.canvasProfile,
      `${asset.assetId} canvasProfile does not match its dimensions.`,
    );
    validated += 1;
  }

  return validated;
}

const registry = await validateProfileRegistry();
const validatedAssets = await validateDeclaredUrAssets();

console.log(
  `Card canvas profiles valid: current=${registry.currentProfileId} declared-assets=${validatedAssets}`,
);
