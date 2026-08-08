import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath, URL } from 'node:url';

import { PUZZLE_LEVELS } from '../.test-dist/src/puzzle/levels.js';
import { validateChapterOneCardCatalog } from '../scripts/validate-card-catalog.mjs';

const catalogPath = fileURLToPath(
  new URL('../data/cards/chapter-1-card-catalog.json', import.meta.url)
);
const cardNumberRegistryPath = fileURLToPath(
  new URL('../data/cards/chapter-1-card-number-registry.json', import.meta.url)
);
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
const cardNumberRegistry = JSON.parse(readFileSync(cardNumberRegistryPath, 'utf8'));

function cloneCatalog() {
  return JSON.parse(JSON.stringify(catalog));
}

test('chapter one card catalog passes all permanent gates', () => {
  const result = validateChapterOneCardCatalog(catalog, PUZZLE_LEVELS);
  assert.deepEqual(result.errors, []);
  assert.equal(result.summary.totalCards, 61);
  assert.equal(result.summary.femaleLeadCards, 31);
  assert.ok(result.summary.femaleRatio >= 0.5);
  assert.equal(result.summary.batches.length, 7);
  assert.ok(result.summary.batches.every((batch) => batch.femaleRatio >= 0.5));
});

test('catalog matches the sixty-one chapter-one placements exactly', () => {
  const placements = PUZZLE_LEVELS.flatMap((level) => level.placements);
  const catalogKeys = new Set(catalog.cards.map((card) => `${card.idiomId}:${card.idiomText}`));
  const placementKeys = new Set(placements.map((placement) => `${placement.idiomId}:${placement.text}`));

  assert.equal(catalog.cards.length, 61);
  assert.deepEqual(catalogKeys, placementKeys);
});

test('chapter-one projection uses project-wide four-digit rarity sequences', () => {
  assert.equal(cardNumberRegistry.schemaVersion, 2);
  assert.equal(cardNumberRegistry.chapterId, 'chapter-1');
  assert.equal(cardNumberRegistry.canonicalRegistryPath, 'data/cards/card-number-registry.json');
  assert.equal(cardNumberRegistry.numberingPolicy.format, '{rarity}-{sequence:0000}');
  assert.equal(cardNumberRegistry.numberingPolicy.scope, 'project-wide-per-rarity');
  assert.equal(cardNumberRegistry.numberingPolicy.orderBy, 'catalogOrder');
  assert.equal(cardNumberRegistry.numberingPolicy.immutableAfterAssignment, true);
  assert.equal(cardNumberRegistry.cards.length, 61);

  const catalogById = new Map(catalog.cards.map((card) => [card.idiomId, card]));
  const sortedEntries = [...cardNumberRegistry.cards].sort(
    (left, right) => left.catalogOrder - right.catalogOrder
  );
  const counters = { N: 0, R: 0, SR: 0, SSR: 0 };
  const seenNumbers = new Set();

  for (const entry of sortedEntries) {
    const card = catalogById.get(entry.idiomId);
    assert.ok(card, `missing catalog card for ${entry.idiomId}`);
    assert.equal(entry.idiomText, card.idiomText);
    assert.equal(entry.rarity, card.rarity);
    assert.equal(entry.catalogOrder, card.catalogOrder);

    counters[entry.rarity] += 1;
    const expectedNumber = `${entry.rarity}-${String(counters[entry.rarity]).padStart(4, '0')}`;
    assert.equal(entry.cardNumber, expectedNumber);
    assert.equal(entry.sequence, counters[entry.rarity]);
    assert.equal(seenNumbers.has(entry.cardNumber), false, `duplicate card number ${entry.cardNumber}`);
    seenNumbers.add(entry.cardNumber);
  }

  assert.deepEqual(counters, { N: 12, R: 18, SR: 23, SSR: 8 });
  assert.deepEqual(cardNumberRegistry.rarityCounts, counters);
  assert.equal(seenNumbers.size, 61);
});

test('rejects a rarity frame mismatch', () => {
  const invalid = cloneCatalog();
  invalid.cards[0].frameAssetId = 'rarity-frame-ssr';
  const result = validateChapterOneCardCatalog(invalid, PUZZLE_LEVELS);
  assert.ok(result.errors.some((error) => error.includes('frameAssetId')));
});

test('rejects a batch below the fifty-percent female lead gate', () => {
  const invalid = cloneCatalog();
  for (const card of invalid.cards.filter((entry) => entry.batchId === 'batch-01')) {
    card.primaryVisualLead = 'male';
    card.mainCharacterGender = 'male';
  }
  const result = validateChapterOneCardCatalog(invalid, PUZZLE_LEVELS);
  assert.ok(result.errors.some((error) => error.includes('batch-01')));
});

test('rejects an SSR card without epic visual requirements', () => {
  const invalid = cloneCatalog();
  const ssr = invalid.cards.find((card) => card.rarity === 'SSR');
  assert.ok(ssr);
  ssr.visualTone = 'refined';
  ssr.ssrEpicPromptBlock = null;
  const result = validateChapterOneCardCatalog(invalid, PUZZLE_LEVELS);
  assert.ok(result.errors.some((error) => error.includes('SSR')));
});

test('rejects missing categories and incomplete master prompts', () => {
  const invalid = cloneCatalog();
  invalid.cards[0].categoryPrimary = '';
  invalid.cards[0].promptMaster = '成語插畫';
  const result = validateChapterOneCardCatalog(invalid, PUZZLE_LEVELS);
  assert.ok(result.errors.some((error) => error.includes('categoryPrimary')));
  assert.ok(result.errors.some((error) => error.includes('promptMaster')));
});

test('review cards may keep pronunciation pending but approved cards may not', () => {
  const reviewCatalog = cloneCatalog();
  assert.deepEqual(validateChapterOneCardCatalog(reviewCatalog, PUZZLE_LEVELS).errors, []);

  const invalid = cloneCatalog();
  invalid.cards[0].reviewStatus = 'approved';
  invalid.cards[0].currentMaster = true;
  const result = validateChapterOneCardCatalog(invalid, PUZZLE_LEVELS);
  assert.ok(result.errors.some((error) => error.includes('bopomofo')));
  assert.ok(result.errors.some((error) => error.includes('pinyin')));
  assert.ok(result.errors.some((error) => error.includes('licenseStatus')));
});
