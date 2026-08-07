import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

const SEED_PATH = fileURLToPath(
  new URL('../data/cards/chapter-1-card-catalog.seed.csv', import.meta.url)
);
const OUTPUT_PATH = fileURLToPath(
  new URL('../data/generated/chapter-1-card-catalog.json', import.meta.url)
);

const RARITY_FRAME_MAP = Object.freeze({
  N: 'rarity-frame-n',
  R: 'rarity-frame-r',
  SR: 'rarity-frame-sr',
  SSR: 'rarity-frame-ssr'
});

const DIFFICULTY_LABEL_MAP = Object.freeze({
  E: '入門',
  D: '基礎',
  C: '普通',
  B: '進階',
  A: '困難',
  S: '極限'
});

const MOTTO_BY_RARITY = Object.freeze({
  N: Object.freeze(['察己之失', '慎思再行', '莫蹈覆轍']),
  R: Object.freeze(['看清本心', '踏實而行', '日有所成']),
  SR: Object.freeze(['守志不移', '步步精進', '自有回響']),
  SSR: Object.freeze(['心志如炬', '破勢前行', '功成傳世'])
});

const VISUAL_PROFILE_BY_RARITY = Object.freeze({
  N: Object.freeze({
    visualTone: 'grounded',
    compositionScale: 'intimate',
    characterPresence: 'narrative',
    vfxIntensity: 'subtle'
  }),
  R: Object.freeze({
    visualTone: 'refined',
    compositionScale: 'medium',
    characterPresence: 'natural',
    vfxIntensity: 'low'
  }),
  SR: Object.freeze({
    visualTone: 'cinematic',
    compositionScale: 'expansive',
    characterPresence: 'confident',
    vfxIntensity: 'medium'
  }),
  SSR: Object.freeze({
    visualTone: 'epic',
    compositionScale: 'grand',
    characterPresence: 'heroic',
    vfxIntensity: 'high'
  })
});

const SCENE_BY_CATEGORY = Object.freeze({
  態度: '清晰聚焦的修習或行動場景',
  精神: '迎風出發、氣勢昂揚的開闊場景',
  傳承: '薪火相傳、眾人共同擴展成果的場景',
  品德: '莊重而具道德抉擇的場景',
  心理: '表現內心拉扯與自我反省的象徵場景',
  情感: '具有記憶、牽掛或重逢情緒的場景',
  節慶: '充滿更新、祝福與儀式感的節慶場景',
  自然: '以自然循環與變化呈現概念的場景',
  情緒: '從緊張轉為慶幸或喜悅的瞬間',
  時間: '以長路、季節與歲月層次表現時間的場景',
  典故: '具古代文化氛圍與故事線索的典故場景',
  場景: '以大量人物與空間層次呈現規模的場景',
  景物: '壯闊自然景觀與人物心境相互呼應的場景',
  程度: '呈現前所未有規模與巔峰成就的場景',
  成長: '從落後到突破、逐步超越的場景',
  管理: '具有上下關係、示範與組織影響的場景',
  努力: '人物持續奮鬥並突破障礙的場景',
  能力: '人物熟練操作、從容完成任務的場景',
  藝術: '以音樂、書法或創作張力呈現意境的場景',
  真偽: '真假交錯、幻象被揭穿的象徵場景',
  人生: '人生重大選擇與承諾的場景',
  效率: '運用方法後成果倍增的學習或工作場景',
  變化: '意外轉折或新局面出現的場景',
  行動: '人物親自執行、建立界線或完成責任的場景',
  運勢: '危機轉折為希望與吉兆的場景',
  祝福: '充滿吉祥象徵與溫暖祝願的場景',
  人物: '人物與地方氣韻相互成就的場景',
  醫藥: '古今融合的診療、藥材與治癒場景',
  變革: '清除陳舊事物並建立新秩序的場景',
  婚姻: '含蓄溫暖、象徵承諾與情感連結的場景',
  權謀: '彼此試探、真假難辨的緊張場景',
  軍事: '快速推進、路線深入與決斷行動的場景',
  競爭: '多人爭先、節奏快速但主次清楚的場景',
  心境: '自然景物襯托舒暢與自在心情的場景'
});

const STYLE_PROFILE =
  '高精緻日韓動漫手遊半寫實、東方文化細節、電影級光影、精緻材質、清楚景深、手機卡牌主視覺';

const LAYOUT_CONSTRAINTS =
  '直式中央情境插畫，來源尺寸 1024×1200 px，可安全置入 1024×2000 圖卡的 y=360–1559 主圖區；人物臉部與主要動作避開頂部標題區及底部文案區，保留前中後景、清楚輪廓與手機縮圖辨識度。';

const NEGATIVE_CONSTRAINTS =
  '禁止任何可讀文字、成語字樣、注音、拼音、卡框、稀有度徽章、難易度標籤、主題標籤、箴言牌匾、來源文字、Logo、浮水印；禁止複製既有遊戲、動漫或商業 IP 的角色、服裝、構圖與標誌；避免多手指、肢體錯位、臉部崩壞、低解析、過度裸露、血腥與現代品牌。';

const SSR_EPIC_PROMPT_BLOCK =
  '史詩級日韓動漫手遊卡牌主視覺，宏大的世界尺度與電影式構圖。主要角色以英雄姿態位於畫面核心，採低角度或具壓迫感的鏡頭，服裝與髮絲受到強風吹拂。背景具有壯闊天際、雲海、古代建築、山河或象徵成語精神的巨大景觀。金色天光與虹彩能量交織，加入高品質粒子、光柱、景深與環境特效，呈現足以改變命運、扭轉局勢或完成傳奇壯舉的決定性瞬間。';

export function parseCardCatalogSeed(csvText) {
  const lines = csvText.trim().split(/\r?\n/u);
  const headers = lines.shift()?.split(',') ?? [];
  return lines.map((line, index) => {
    const values = line.split(',');
    if (values.length !== headers.length) {
      throw new Error(`Card catalog seed row ${index + 2} has ${values.length} columns; expected ${headers.length}.`);
    }
    return Object.fromEntries(headers.map((header, column) => [header, values[column] ?? '']));
  });
}

function characterBrief(primaryVisualLead) {
  const gender = primaryVisualLead === 'female' ? '成年女性' : '成年男性';
  return `主要角色為 20–30 歲${gender}，具有自然可信的東亞面孔、清楚眼神與符合成語情境的動作；角色是唯一主視覺領袖，服裝採原創東方幻想與日韓手遊融合設計，不使用任何既有 IP。`;
}

function exampleSentence(row) {
  if (row.rarity === 'N') {
    return `面對事情時，應留意並避免「${row.idiomText}」所反映的問題。`;
  }
  const pronoun = row.primaryVisualLead === 'female' ? '她' : '他';
  return `${pronoun}以「${row.idiomText}」的精神面對眼前的挑戰。`;
}

function buildPrompt(row, character, scene) {
  const epic = row.rarity === 'SSR' ? ` ${SSR_EPIC_PROMPT_BLOCK}` : '';
  return `為繁體中文成語《${row.idiomText}》製作獨立中央情境插畫。${STYLE_PROFILE}。${character}${scene}。${epic} 畫面情緒必須準確傳達「${row.meaning}」，但不得在圖中直接寫出成語或說明文字。${LAYOUT_CONSTRAINTS}${NEGATIVE_CONSTRAINTS}`;
}

function buildCard(row) {
  const visual = VISUAL_PROFILE_BY_RARITY[row.rarity];
  if (!visual) throw new Error(`Unsupported rarity ${row.rarity} for ${row.idiomId}.`);
  const character = characterBrief(row.primaryVisualLead);
  const sceneBase = SCENE_BY_CATEGORY[row.categoryPrimary] ?? '具明確敘事層次的東方幻想場景';
  const scene = `${sceneBase}；以「${row.idiomText}」的核心意義具象化：${row.meaning}`;

  return Object.freeze({
    cardId: `cicg-ch1-${row.idiomId}`,
    idiomId: row.idiomId,
    idiomText: row.idiomText,
    chapterId: 'chapter-1',
    levelNumber: Number(row.levelNumber),
    placementOrder: Number(row.placementOrder),
    catalogOrder: Number(row.catalogOrder),
    batchId: row.batchId,
    cardVersion: '1.0-draft',
    rarity: row.rarity,
    frameAssetId: RARITY_FRAME_MAP[row.rarity],
    cardDifficultyCode: row.cardDifficultyCode,
    cardDifficultyLabel: row.cardDifficultyLabel,
    levelDifficulty: row.levelDifficulty,
    categoryPrimary: row.categoryPrimary,
    categorySecondary: row.categorySecondary,
    tags: Object.freeze([row.categoryPrimary, row.categorySecondary]),
    themeBadgeAssetId: null,
    bopomofo: Object.freeze(['', '', '', '']),
    pinyin: Object.freeze(['', '', '', '']),
    subtitle: row.meaning,
    meaning: row.meaning,
    allusionSummary: row.meaning,
    exampleSentence: exampleSentence(row),
    mottoLines: MOTTO_BY_RARITY[row.rarity],
    allusionSource: '待正式考證與校訂',
    copyReviewStatus: 'draft',
    licenseStatus: 'pending',
    promptVersion: '1.0',
    promptStyleProfile: STYLE_PROFILE,
    promptCharacterBrief: character,
    promptSceneBrief: scene,
    promptLayoutConstraints: LAYOUT_CONSTRAINTS,
    promptNegativeConstraints: NEGATIVE_CONSTRAINTS,
    promptTemplateRef: 'template-v2.6-1024x2000-modular',
    promptMaster: buildPrompt(row, character, scene),
    mainCharacterGender: row.primaryVisualLead,
    primaryVisualLead: row.primaryVisualLead,
    mainCharacterCount: 1,
    femaleQuotaChapter: true,
    femaleQuotaBatch: true,
    ...visual,
    ssrEpicRequirement: row.rarity === 'SSR' ? 'required' : 'not-applicable',
    ssrEpicPromptBlock: row.rarity === 'SSR' ? SSR_EPIC_PROMPT_BLOCK : null,
    artworkStatus: 'not-started',
    compositeStatus: 'not-started',
    reviewStatus: 'draft',
    currentMaster: false,
    templateVersion: '2.6',
    driveFileId: null,
    driveUrl: null,
    githubPath: null,
    githubPr: null,
    sha256: null,
    owner: 'Visual Producer',
    lastVerifiedAt: null,
    nextAction: '完成注音、拼音、文案、來源與授權校訂後送交產圖',
    notes: '第一章圖卡主檔初始資料；未校訂、未授權、不得進正式卡池。'
  });
}

export function buildChapterOneCardCatalog(seedRows) {
  const cards = seedRows.map(buildCard);
  return Object.freeze({
    schemaVersion: 1,
    updatedAt: '2026-08-07T00:00:00+08:00',
    chapterId: 'chapter-1',
    batchSize: 10,
    source: Object.freeze({
      seedPath: 'data/cards/chapter-1-card-catalog.seed.csv',
      puzzleLevelsPath: 'src/puzzle/levels.ts',
      idiomSourcePath: 'data/idioms.source.csv'
    }),
    genderQuota: Object.freeze({
      chapterFemaleLeadMinimum: 31,
      perBatchFemaleLeadRatioMinimum: 0.5
    }),
    rarityFrameMap: RARITY_FRAME_MAP,
    difficultyLabelMap: DIFFICULTY_LABEL_MAP,
    cards: Object.freeze(cards)
  });
}

export function writeChapterOneCardCatalog({ seedPath = SEED_PATH, outputPath = OUTPUT_PATH } = {}) {
  const seedRows = parseCardCatalogSeed(readFileSync(seedPath, 'utf8'));
  const catalog = buildChapterOneCardCatalog(seedRows);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
  return catalog;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  const catalog = writeChapterOneCardCatalog();
  console.log(`Built ${catalog.cards.length} chapter-one card catalog entries.`);
}