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

function containsOldDimensionBlocker(reason) {
  return /1024x2000|required 1024|897x1752.*not.*canonical/i.test(reason);
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

  assert(
    assetRegistry.card.canonicalRendererOutput === false,
    'Dimension migration must not claim canonical Renderer output.',
  );
  assert(
    assetRegistry.card.publicationStatus === 'not-approved-for-publication',
    'Dimension migration must not approve publication.',
  );
  assert(
    assetRegistry.card.formalCardNumber === null,
    'Dimension migration must not assign a formal UR number.',
  );
  assert(
    !(assetRegistry.card.blockingReasons ?? []).some(containsOldDimensionBlocker),
    'Registered 897x1752 asset must not retain the old dimension blocker.',
  );

  return validated;
}

async function validateKimetsuRegistrationDraft() {
  const draft = await readJson(
    'data/drive-assets/ur-kimetsu-review-registration-draft-2026-08-08.json',
  );

  assert(
    draft.registrationStatus === 'pending-drive-upload',
    'Registration draft must remain pending-drive-upload.',
  );
  assert(draft.cards.length === 13, 'Registration draft must contain 13 cards.');
  assert(
    draft.sharedCardState.formalCardNumber === null,
    'Registration draft must not assign a formal UR number.',
  );
  assert(
    draft.sharedCardState.publicationStatus === 'not-approved-for-publication',
    'Registration draft must remain not-approved-for-publication.',
  );
  assert(
    draft.sharedCardState.canonicalRendererOutput === false,
    'Registration draft must not claim canonical Renderer output.',
  );

  const canvasResult = validateCardCanvas(draft.sharedImageState);
  assert(
    canvasResult.valid,
    `Registration draft has invalid shared canvas metadata: ${canvasResult.reason}`,
  );
  assert(
    canvasResult.profileId === draft.sharedImageState.canvasProfile,
    'Registration draft canvasProfile does not match its dimensions.',
  );

  const reviewIds = draft.cards.map((card) => card.reviewIdentifier);
  const hashes = draft.cards.map((card) => card.imageSha256);
  assert(
    new Set(reviewIds).size === reviewIds.length,
    'Registration draft Review identifiers must be unique.',
  );
  assert(
    new Set(hashes).size === hashes.length,
    'Registration draft image SHA-256 values must be unique.',
  );
  assert(
    hashes.every((hash) => /^[a-f0-9]{64}$/.test(hash)),
    'Registration draft image SHA-256 values must be lowercase 64-character hex.',
  );

  assert(
    draft.registryEffects.formalUrAssignedCountDelta === 0 &&
      draft.registryEffects.formalUrNextSequenceDelta === 0,
    'Registration draft must not mutate formal UR sequence counters.',
  );
  assert(
    ![
      ...(draft.sharedBlockingReasons ?? []),
      ...(draft.batchBlockingReasons ?? []),
    ].some(containsOldDimensionBlocker),
    'Registration draft must not retain the old dimension blocker.',
  );

  const uzui = draft.cards.find(
    (card) => card.reviewIdentifier === 'RV-UR-0009',
  );
  assert(uzui, 'RV-UR-0009 must be present in the registration draft.');
  assert(
    uzui.qualityStatus === 'blocked-text-mismatch' &&
      uzui.expectedIdiomTitle === '豪氣干雲' &&
      uzui.observedIdiomTitle === '豪氣千雲',
    'RV-UR-0009 must preserve its visible title mismatch finding.',
  );

  return draft.cards.length;
}

const registry = await validateProfileRegistry();
const validatedAssets = await validateDeclaredUrAssets();
const draftCards = await validateKimetsuRegistrationDraft();

console.log(
  `Card canvas profiles valid: current=${registry.currentProfileId} declared-assets=${validatedAssets} draft-cards=${draftCards}`,
);
