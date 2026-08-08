import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath, URL } from 'node:url';

function loadJson(relativePath) {
  const path = fileURLToPath(new URL(relativePath, import.meta.url));
  return JSON.parse(readFileSync(path, 'utf8'));
}

function loadText(relativePath) {
  const path = fileURLToPath(new URL(relativePath, import.meta.url));
  return readFileSync(path, 'utf8');
}

test('canonical card number registry uses independent project-wide four-digit rarity sequences', () => {
  const registry = loadJson('../data/cards/card-number-registry.json');
  const schema = loadJson('../data/cards/card-number-registry.schema.json');

  assert.equal(registry.schemaVersion, 1);
  assert.equal(registry.registryId, 'cicg-project-card-numbers');
  assert.equal(registry.numberingPolicy.format, '{rarity}-{sequence:0000}');
  assert.equal(registry.numberingPolicy.scope, 'project-wide-per-rarity');
  assert.equal(registry.numberingPolicy.sequenceStartsAt, 1);
  assert.equal(registry.numberingPolicy.immutableAfterAssignment, true);
  assert.equal(registry.numberingPolicy.reuseRetiredNumbers, false);
  assert.deepEqual(registry.numberingPolicy.supportedRarities, ['N', 'R', 'SR', 'SSR', 'UR']);
  assert.deepEqual(registry.numberingPolicy.licenseGateRequiredFor, ['UR']);

  assert.equal(schema.properties.numberingPolicy.properties.format.const, '{rarity}-{sequence:0000}');
  assert.equal(schema.properties.numberingPolicy.properties.scope.const, 'project-wide-per-rarity');
  assert.equal(schema.properties.cards.items.properties.cardNumber.pattern, '^(N|R|SR|SSR|UR)-[0-9]{4}$');

  const counters = { N: 0, R: 0, SR: 0, SSR: 0, UR: 0 };
  const seenNumbers = new Set();
  const seenActiveCards = new Set();

  for (const card of registry.cards) {
    assert.match(card.cardNumber, /^(N|R|SR|SSR|UR)-[0-9]{4}$/u);
    assert.equal(card.cardNumber, `${card.rarity}-${String(card.sequence).padStart(4, '0')}`);
    assert.equal(seenNumbers.has(card.cardNumber), false, `duplicate card number ${card.cardNumber}`);
    seenNumbers.add(card.cardNumber);
    counters[card.rarity] += 1;

    if (card.status === 'active') {
      const identity = `${card.chapterId}:${card.idiomId}`;
      assert.equal(seenActiveCards.has(identity), false, `multiple active numbers for ${identity}`);
      seenActiveCards.add(identity);
    }
  }

  assert.deepEqual(counters, { N: 12, R: 18, SR: 23, SSR: 8, UR: 0 });
  assert.equal(registry.raritySequences.N.nextSequence, 13);
  assert.equal(registry.raritySequences.R.nextSequence, 19);
  assert.equal(registry.raritySequences.SR.nextSequence, 24);
  assert.equal(registry.raritySequences.SSR.nextSequence, 9);
  assert.equal(registry.raritySequences.UR.nextSequence, 1);
});

test('chapter-one compatibility projection exactly matches canonical chapter-one entries', () => {
  const registry = loadJson('../data/cards/card-number-registry.json');
  const projection = loadJson('../data/cards/chapter-1-card-number-registry.json');
  const canonicalCards = registry.cards
    .filter((card) => card.chapterId === 'chapter-1')
    .map(({ catalogOrder, idiomId, idiomText, rarity, sequence, cardNumber }) => ({
      catalogOrder,
      idiomId,
      idiomText,
      rarity,
      sequence,
      cardNumber,
    }));

  assert.equal(projection.schemaVersion, 2);
  assert.equal(projection.canonicalRegistryPath, 'data/cards/card-number-registry.json');
  assert.deepEqual(projection.cards, canonicalCards);
});

test('all production card prompts require one renderer-owned bottom-center card number plaque', () => {
  const cardPrompt = loadText('../docs/card-prompts/shared/card-master-prompt.md');
  const urPrompt = loadText('../docs/card-prompts/shared/ur-collaboration-master-prompt-v1.md');
  const generalSkill = loadText('../.agents/skills/generating-cicg-idiom-cards/SKILL.md');
  const urSkill = loadText('../.agents/skills/generating-cicg-ur-collaboration-cards/SKILL.md');
  const requiredSpecs = loadText('../.agents/skills/generating-cicg-idiom-cards/references/required-specs.md');
  const numberingSpec = loadText('../docs/superpowers/specs/2026-08-08-project-wide-four-digit-card-numbering-design.md');
  const agents = loadText('../AGENTS.md');

  for (const text of [cardPrompt, urPrompt, generalSkill, urSkill, requiredSpecs, numberingSpec]) {
    assert.match(text, /card-number-plaque/u);
    assert.match(text, /bottom-center/u);
    assert.match(text, /\{\{CARD_NUMBER\}\}|cardNumber/u);
    assert.match(text, /四碼|four-digit/u);
  }

  assert.match(agents, /\.agents\/skills\/generating-cicg-idiom-cards\/SKILL\.md/u);
  assert.doesNotMatch(urPrompt, /最底部不得再次顯示角色名稱、聯名名稱或額外卡號/u);
  assert.match(urPrompt, /最底部只能有一個 canonical card-number-plaque/u);
  assert.match(cardPrompt, /圖片模型不得生成卡號|image model must not generate card numbers/u);
  assert.match(urSkill, /data\/cards\/card-number-registry\.json/u);
  assert.match(urSkill, /沒有可稽核.*licenseEvidenceId.*不得指派.*UR-####/su);
});
