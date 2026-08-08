import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { validateCardCanvas } from '../scripts/card-canvas-profile.mjs';

const repoUrl = new URL('../', import.meta.url);

async function readText(relativePath) {
  return readFile(new URL(relativePath, repoUrl), 'utf8');
}

async function readJson(relativePath) {
  return JSON.parse(await readText(relativePath));
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

test('governed generation and registration contracts use the canonical canvas profile', async () => {
  const paths = [
    '.agents/skills/generating-cicg-idiom-cards/SKILL.md',
    '.agents/skills/generating-cicg-ur-collaboration-cards/SKILL.md',
    '.agents/skills/registering-cicg-card-assets/SKILL.md',
    'docs/card-prompts/shared/ur-collaboration-master-prompt-v1.md',
  ];

  for (const path of paths) {
    const content = await readText(path);
    assert.match(
      content,
      /cicg-card-897x1752-v1/,
      `${path} must reference the canonical canvas profile`,
    );
    assert.match(
      content,
      /897\s*[×x]\s*1752/,
      `${path} must declare the canonical composite dimensions`,
    );
    assert.doesNotMatch(
      content,
      /(?:exact composite canvas|final|complete|canonical|current)[^\n]{0,80}1024\s*[×x]\s*2000/i,
      `${path} must not describe 1024x2000 as the current complete-card standard`,
    );
  }

  const generalSkill = await readText(
    '.agents/skills/generating-cicg-idiom-cards/SKILL.md',
  );
  const urSkill = await readText(
    '.agents/skills/generating-cicg-ur-collaboration-cards/SKILL.md',
  );
  const masterPrompt = await readText(
    'docs/card-prompts/shared/ur-collaboration-master-prompt-v1.md',
  );

  assert.match(generalSkill, /1024\s*[×x]\s*1200\s*px/);
  assert.match(urSkill, /1024\s*[×x]\s*1200\s*px/);
  assert.match(masterPrompt, /1024\s*[×x]\s*1200\s*px/);
});

test('UR review assets treat 897x1752 as canonical dimensions without bypassing other gates', async () => {
  const registry = await readJson(
    'data/drive-assets/ur-card-assets-2026-08-08.json',
  );
  const composite = registry.assets.find(
    (asset) => asset.assetType === 'card-composite-reference',
  );

  assert.equal(composite.widthPx, 897);
  assert.equal(composite.heightPx, 1752);
  assert.equal(composite.canvasProfile, 'cicg-card-897x1752-v1');
  assert.equal(composite.aspectRatio, '299:584');
  assert.equal(composite.dimensionStatus, 'canonical');
  assert.equal(composite.sourceCanvasProfile, null);
  assert.equal(registry.card.canonicalRendererOutput, false);
  assert.equal(registry.card.publicationStatus, 'not-approved-for-publication');
  assert.equal(registry.card.formalCardNumber, null);
  assert.equal(
    registry.card.blockingReasons.some((reason) =>
      /1024x2000|required 1024|dimension/i.test(reason),
    ),
    false,
  );

  const draft = await readJson(
    'data/drive-assets/ur-kimetsu-review-registration-draft-2026-08-08.json',
  );
  assert.equal(draft.cards.length, 13);
  assert.equal(draft.registrationStatus, 'pending-drive-upload');
  assert.equal(draft.registryEffects.formalUrAssignedCountDelta, 0);
  assert.equal(draft.registryEffects.formalUrNextSequenceDelta, 0);

  for (const card of draft.cards) {
    assert.equal(card.formalCardNumber, null);
    assert.equal(card.publicationStatus, 'not-approved-for-publication');
    assert.equal(card.canonicalRendererOutput, false);
    assert.equal(card.imageAsset.widthPx, 897);
    assert.equal(card.imageAsset.heightPx, 1752);
    assert.equal(card.imageAsset.canvasProfile, 'cicg-card-897x1752-v1');
    assert.equal(card.imageAsset.dimensionStatus, 'canonical');
    assert.equal(card.imageAsset.aspectRatio, '299:584');
    assert.equal(
      card.blockingReasons.some((reason) => /1024x2000|required 1024/i.test(reason)),
      false,
    );
  }

  const uzui = draft.cards.find(
    (card) => card.reviewIdentifier === 'RV-UR-0009',
  );
  assert.equal(uzui.qualityStatus, 'blocked-text-mismatch');
  assert.equal(uzui.textVerification.expectedIdiomTitle, '豪氣干雲');
  assert.equal(uzui.textVerification.observedIdiomTitle, '豪氣千雲');
});
