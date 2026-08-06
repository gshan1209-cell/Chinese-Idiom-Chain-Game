import test from 'node:test';
import assert from 'node:assert/strict';

import { IDIOM_CARD_DEFINITIONS } from '../.test-dist/src/cards/card-definitions.js';
import {
  validateIdiomCardDefinitions
} from '../.test-dist/src/cards/card-definition-validator.js';
import { buildMilestoneCardPool } from '../.test-dist/src/cards/card-pool.js';

const ACTIVE_IDIOMS = Object.freeze([
  Object.freeze({ id: 'idiom-water-drops-stone', text: '水滴石穿' }),
  Object.freeze({ id: 'idiom-break-cauldron', text: '破釜沉舟' })
]);

const NOW = '2026-08-06T12:00:00.000Z';
const NON_ISO_RELEASE_DATE = 'August 6, 2026 12:00 UTC';

function validCard(overrides = {}) {
  return {
    id: 'card-water-drops-stone',
    idiomId: 'idiom-water-drops-stone',
    title: '水滴石穿',
    bopomofo: ['ㄕㄨㄟˇ', 'ㄉㄧ', 'ㄕˊ', 'ㄔㄨㄢ'],
    pinyin: ['shuǐ', 'dī', 'shí', 'chuān'],
    subtitle: '持續累積，終能突破',
    rarity: 'SSR',
    difficulty: 'B',
    imageAsset: '/assets/cards/water-drops-stone.png',
    thumbnailAsset: '/assets/cards/water-drops-stone-thumb.png',
    storySummary: '水滴持續落下，終能穿石。',
    storySource: '《漢書》相關語意',
    motto: '日日不止，終有所成。',
    enabled: true,
    approvalStatus: 'Approved',
    sourceStatus: 'Approved',
    rarityApproved: true,
    releaseOrder: 1,
    startsAt: null,
    endsAt: null,
    acquisitionMethods: ['milestone-reward'],
    weight: 1,
    licenseEvidenceId: null,
    ...overrides
  };
}

function validate(input) {
  return validateIdiomCardDefinitions(input, ACTIVE_IDIOMS, NOW);
}

test('accepts a fully approved N to SSR card definition', () => {
  const result = validate([validCard()]);
  assert.equal(result.findings.length, 0);
  assert.equal(result.validDefinitions.length, 1);
  assert.equal(result.validDefinitions[0].title, '水滴石穿');
});

test('requires exactly four aligned bopomofo and pinyin readings', () => {
  const missingBopomofo = validate([
    validCard({ bopomofo: ['ㄕㄨㄟˇ', 'ㄉㄧ', 'ㄕˊ'] })
  ]);
  const missingPinyin = validate([
    validCard({ pinyin: ['shuǐ', 'dī', 'shí'] })
  ]);

  assert.equal(missingBopomofo.validDefinitions.length, 0);
  assert.equal(missingPinyin.validDefinitions.length, 0);
  assert.ok(missingBopomofo.findings.some((finding) => finding.code === 'invalid-bopomofo'));
  assert.ok(missingPinyin.findings.some((finding) => finding.code === 'invalid-pinyin'));
});

test('rejects numeric tones uppercase pinyin and unknown romanization fields', () => {
  const numeric = validate([validCard({ pinyin: ['shui3', 'dī', 'shí', 'chuān'] })]);
  const uppercase = validate([validCard({ pinyin: ['SHUǏ', 'dī', 'shí', 'chuān'] })]);
  const unknown = validate([validCard({ romanization: ['shuǐ', 'dī', 'shí', 'chuān'] })]);

  assert.equal(numeric.validDefinitions.length, 0);
  assert.equal(uppercase.validDefinitions.length, 0);
  assert.equal(unknown.validDefinitions.length, 0);
  assert.ok(unknown.findings.some((finding) => finding.code === 'unknown-field'));
});

test('rejects pinyin syllables without an explicit tone mark', () => {
  const result = validate([
    validCard({ pinyin: ['shui', 'dī', 'shí', 'chuān'] })
  ]);

  assert.equal(result.validDefinitions.length, 0);
  assert.ok(result.findings.some((finding) => finding.code === 'invalid-pinyin'));
});

test('rejects human-readable release dates that are not ISO-8601', () => {
  const result = validate([
    validCard({ startsAt: NON_ISO_RELEASE_DATE })
  ]);

  assert.equal(result.validDefinitions.length, 0);
  assert.ok(result.findings.some((finding) => finding.code === 'invalid-release-window'));
});

test('requires the title to match an enabled source idiom', () => {
  const wrongText = validate([validCard({ title: '破釜沉舟' })]);
  const missingIdiom = validate([validCard({ idiomId: 'missing-idiom' })]);

  assert.equal(wrongText.validDefinitions.length, 0);
  assert.equal(missingIdiom.validDefinitions.length, 0);
  assert.ok(wrongText.findings.some((finding) => finding.code === 'idiom-mismatch'));
  assert.ok(missingIdiom.findings.some((finding) => finding.code === 'unknown-idiom'));
});

test('accepts only repository-local approved card asset paths', () => {
  for (const imageAsset of [
    'https://example.com/card.png',
    'data:image/png;base64,abc',
    'blob:https://example.com/id',
    '/assets/cards/../secret.png',
    '/assets/other/card.png',
    '/assets/cards/<script>.png'
  ]) {
    const result = validate([validCard({ imageAsset })]);
    assert.equal(result.validDefinitions.length, 0, imageAsset);
    assert.ok(result.findings.some((finding) => finding.code === 'invalid-image-asset'));
  }
});

test('rejects unapproved sources rarity and invalid milestone weights', () => {
  const cases = [
    validCard({ approvalStatus: 'Review' }),
    validCard({ approvalStatus: 'Legacy' }),
    validCard({ sourceStatus: 'NeedsReview' }),
    validCard({ rarityApproved: false }),
    validCard({ weight: 0 }),
    validCard({ weight: 1.5 })
  ];

  for (const card of cases) {
    const result = validate([card]);
    assert.equal(result.validDefinitions.length, 0);
  }
});

test('requires UR license evidence and always excludes UR from milestone rewards', () => {
  const noLicense = validate([
    validCard({ rarity: 'UR', licenseEvidenceId: null })
  ]);
  assert.equal(noLicense.validDefinitions.length, 0);

  const licensed = validate([
    validCard({ rarity: 'UR', licenseEvidenceId: 'license-ip-2026-001' })
  ]);
  assert.equal(licensed.validDefinitions.length, 1);
  assert.deepEqual(buildMilestoneCardPool(licensed.validDefinitions), []);
});

test('rejects duplicate card ids and keeps only independently valid definitions', () => {
  const result = validate([
    validCard(),
    validCard({
      idiomId: 'idiom-break-cauldron',
      title: '破釜沉舟',
      bopomofo: ['ㄆㄛˋ', 'ㄈㄨˇ', 'ㄔㄣˊ', 'ㄓㄡ'],
      pinyin: ['pò', 'fǔ', 'chén', 'zhōu']
    })
  ]);

  assert.equal(result.validDefinitions.length, 0);
  assert.ok(result.findings.some((finding) => finding.code === 'duplicate-id'));
});

test('ships with an empty official card pool until real cards are approved', () => {
  assert.deepEqual(IDIOM_CARD_DEFINITIONS, []);
});
