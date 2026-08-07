import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

const CATALOG_PATH = fileURLToPath(
  new URL('../data/generated/chapter-1-card-catalog.json', import.meta.url)
);

const EXPECTED_FRAME_BY_RARITY = Object.freeze({
  N: 'rarity-frame-n',
  R: 'rarity-frame-r',
  SR: 'rarity-frame-sr',
  SSR: 'rarity-frame-ssr'
});

const EXPECTED_DIFFICULTY_LABEL = Object.freeze({
  E: '入門',
  D: '基礎',
  C: '普通',
  B: '進階',
  A: '困難',
  S: '極限'
});

const SSR_VISUAL_REQUIREMENTS = Object.freeze({
  visualTone: 'epic',
  compositionScale: 'grand',
  characterPresence: 'heroic',
  vfxIntensity: 'high',
  ssrEpicRequirement: 'required'
});

const ALLOWED_LEADS = new Set(['female', 'male', 'mixed', 'group', 'none']);

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function fourNonEmptyStrings(value) {
  return Array.isArray(value) && value.length === 4 && value.every(nonEmptyString);
}

function addDuplicateErrors(errors, cards, field) {
  const seen = new Set();
  for (const card of cards) {
    const value = card?.[field];
    if (!nonEmptyString(value)) {
      errors.push(`${field} must be a non-empty string.`);
      continue;
    }
    if (seen.has(value)) errors.push(`${field} must be unique: ${value}.`);
    seen.add(value);
  }
}

function expectedPlacements(levels) {
  const map = new Map();
  for (const level of levels) {
    level.placements.forEach((placement, index) => {
      map.set(placement.idiomId, {
        idiomId: placement.idiomId,
        idiomText: placement.text,
        levelNumber: level.levelNumber,
        placementOrder: index + 1,
        levelDifficulty: level.difficulty
      });
    });
  }
  return map;
}

function validateApprovedCard(errors, card) {
  if (!fourNonEmptyStrings(card.bopomofo)) {
    errors.push(`${card.cardId} approved card requires four non-empty bopomofo values.`);
  }
  if (!fourNonEmptyStrings(card.pinyin)) {
    errors.push(`${card.cardId} approved card requires four non-empty pinyin values.`);
  }
  if (card.copyReviewStatus !== 'approved') {
    errors.push(`${card.cardId} approved card requires copyReviewStatus=approved.`);
  }
  if (card.licenseStatus !== 'approved') {
    errors.push(`${card.cardId} approved card requires licenseStatus=approved.`);
  }
  if (!nonEmptyString(card.driveFileId) || !nonEmptyString(card.driveUrl) || !nonEmptyString(card.sha256)) {
    errors.push(`${card.cardId} approved card requires Drive File ID, URL and sha256.`);
  }
}

export function validateChapterOneCardCatalog(catalog, levels) {
  const errors = [];
  const cards = Array.isArray(catalog?.cards) ? catalog.cards : [];
  const placements = expectedPlacements(levels);

  if (catalog?.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
  if (catalog?.chapterId !== 'chapter-1') errors.push('chapterId must be chapter-1.');
  if (cards.length !== 61) errors.push(`catalog must contain exactly 61 cards; received ${cards.length}.`);
  if (placements.size !== 61) errors.push(`chapter one must contain exactly 61 placements; received ${placements.size}.`);

  addDuplicateErrors(errors, cards, 'cardId');
  addDuplicateErrors(errors, cards, 'idiomId');
  addDuplicateErrors(errors, cards, 'idiomText');

  const catalogIdiomIds = new Set();
  const batches = new Map();

  for (const card of cards) {
    if (!card || typeof card !== 'object') {
      errors.push('every catalog entry must be an object.');
      continue;
    }

    catalogIdiomIds.add(card.idiomId);
    const expected = placements.get(card.idiomId);
    if (!expected) {
      errors.push(`${card.cardId ?? card.idiomId} is not a chapter-one placement.`);
    } else {
      if (card.idiomText !== expected.idiomText) {
        errors.push(`${card.idiomId} idiomText must be ${expected.idiomText}.`);
      }
      if (card.levelNumber !== expected.levelNumber) {
        errors.push(`${card.idiomId} levelNumber must be ${expected.levelNumber}.`);
      }
      if (card.placementOrder !== expected.placementOrder) {
        errors.push(`${card.idiomId} placementOrder must be ${expected.placementOrder}.`);
      }
      if (card.levelDifficulty !== expected.levelDifficulty) {
        errors.push(`${card.idiomId} levelDifficulty must be ${expected.levelDifficulty}.`);
      }
    }

    if (card.rarity === 'UR') errors.push(`${card.cardId} UR is reserved for licensed IP and is forbidden in chapter one.`);
    const expectedFrame = EXPECTED_FRAME_BY_RARITY[card.rarity];
    if (!expectedFrame) {
      errors.push(`${card.cardId} rarity must be N, R, SR or SSR.`);
    } else if (card.frameAssetId !== expectedFrame) {
      errors.push(`${card.cardId} frameAssetId must be ${expectedFrame} for ${card.rarity}.`);
    }

    const expectedLabel = EXPECTED_DIFFICULTY_LABEL[card.cardDifficultyCode];
    if (!expectedLabel) {
      errors.push(`${card.cardId} cardDifficultyCode must be E, D, C, B, A or S.`);
    } else if (card.cardDifficultyLabel !== expectedLabel) {
      errors.push(`${card.cardId} cardDifficultyLabel must be ${expectedLabel}.`);
    }

    for (const field of ['categoryPrimary', 'categorySecondary', 'meaning', 'subtitle', 'allusionSummary', 'exampleSentence', 'allusionSource']) {
      if (!nonEmptyString(card[field])) errors.push(`${card.cardId} ${field} must be non-empty.`);
    }

    for (const field of [
      'promptStyleProfile',
      'promptCharacterBrief',
      'promptSceneBrief',
      'promptLayoutConstraints',
      'promptNegativeConstraints',
      'promptTemplateRef'
    ]) {
      if (!nonEmptyString(card[field])) errors.push(`${card.cardId} ${field} must be non-empty.`);
    }

    if (!nonEmptyString(card.promptMaster) || card.promptMaster.length < 300) {
      errors.push(`${card.cardId} promptMaster must be a complete production prompt.`);
    } else {
      if (!card.promptMaster.includes(card.idiomText)) {
        errors.push(`${card.cardId} promptMaster must include the idiom text.`);
      }
      if (!card.promptMaster.includes('禁止任何可讀文字')) {
        errors.push(`${card.cardId} promptMaster must forbid baked-in card text.`);
      }
      if (!card.promptMaster.includes('1024×1200') || !card.promptMaster.includes('1024×2000')) {
        errors.push(`${card.cardId} promptMaster must include modular artwork dimensions.`);
      }
    }

    if (!ALLOWED_LEADS.has(card.primaryVisualLead)) {
      errors.push(`${card.cardId} primaryVisualLead is invalid.`);
    }
    if (card.mainCharacterGender !== card.primaryVisualLead) {
      errors.push(`${card.cardId} mainCharacterGender must match primaryVisualLead for a single-lead card.`);
    }
    if (!Number.isInteger(card.mainCharacterCount) || card.mainCharacterCount < 1) {
      errors.push(`${card.cardId} mainCharacterCount must be a positive integer.`);
    }

    if (!nonEmptyString(card.batchId) || !/^batch-0[1-7]$/u.test(card.batchId)) {
      errors.push(`${card.cardId} batchId must be batch-01 through batch-07.`);
    } else {
      const batch = batches.get(card.batchId) ?? [];
      batch.push(card);
      batches.set(card.batchId, batch);
    }

    if (card.rarity === 'SSR') {
      for (const [field, expectedValue] of Object.entries(SSR_VISUAL_REQUIREMENTS)) {
        if (card[field] !== expectedValue) {
          errors.push(`${card.cardId} SSR ${field} must be ${expectedValue}.`);
        }
      }
      if (!nonEmptyString(card.ssrEpicPromptBlock) || card.ssrEpicPromptBlock.length < 100) {
        errors.push(`${card.cardId} SSR requires a complete ssrEpicPromptBlock.`);
      } else if (!card.promptMaster.includes(card.ssrEpicPromptBlock)) {
        errors.push(`${card.cardId} SSR promptMaster must include ssrEpicPromptBlock.`);
      }
    } else if (card.ssrEpicRequirement !== 'not-applicable' || card.ssrEpicPromptBlock !== null) {
      errors.push(`${card.cardId} non-SSR epic fields must be not-applicable and null.`);
    }

    if (card.reviewStatus === 'approved' || card.currentMaster === true) {
      validateApprovedCard(errors, card);
    }
  }

  for (const idiomId of placements.keys()) {
    if (!catalogIdiomIds.has(idiomId)) errors.push(`missing chapter-one card for ${idiomId}.`);
  }

  const femaleLeadCards = cards.filter((card) => card.primaryVisualLead === 'female').length;
  const femaleRatio = cards.length === 0 ? 0 : femaleLeadCards / cards.length;
  const chapterMinimum = catalog?.genderQuota?.chapterFemaleLeadMinimum ?? 31;
  if (femaleLeadCards < chapterMinimum || femaleRatio < 0.5) {
    errors.push(`chapter female lead gate requires at least ${chapterMinimum} cards and 50%; received ${femaleLeadCards}/${cards.length}.`);
  }

  const minimumBatchRatio = catalog?.genderQuota?.perBatchFemaleLeadRatioMinimum ?? 0.5;
  const batchSummaries = [...batches.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([batchId, batchCards]) => {
      const femaleLeadCount = batchCards.filter((card) => card.primaryVisualLead === 'female').length;
      const ratio = batchCards.length === 0 ? 0 : femaleLeadCount / batchCards.length;
      if (ratio < minimumBatchRatio) {
        errors.push(`${batchId} female lead gate requires at least 50%; received ${femaleLeadCount}/${batchCards.length}.`);
      }
      return Object.freeze({
        batchId,
        totalCards: batchCards.length,
        femaleLeadCards: femaleLeadCount,
        femaleRatio: ratio
      });
    });

  if (batchSummaries.length !== 7) errors.push(`catalog must contain exactly 7 batches; received ${batchSummaries.length}.`);

  return Object.freeze({
    errors: Object.freeze(errors),
    summary: Object.freeze({
      totalCards: cards.length,
      femaleLeadCards,
      femaleRatio,
      batches: Object.freeze(batchSummaries)
    })
  });
}

export async function validateGeneratedChapterOneCardCatalog(catalogPath = CATALOG_PATH) {
  const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
  const { PUZZLE_LEVELS } = await import('../.test-dist/src/puzzle/levels.js');
  return validateChapterOneCardCatalog(catalog, PUZZLE_LEVELS);
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = await validateGeneratedChapterOneCardCatalog();
  if (result.errors.length > 0) {
    for (const error of result.errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(
      `Validated ${result.summary.totalCards} cards; female leads ${result.summary.femaleLeadCards}/${result.summary.totalCards}; ${result.summary.batches.length} batches passed.`
    );
  }
}