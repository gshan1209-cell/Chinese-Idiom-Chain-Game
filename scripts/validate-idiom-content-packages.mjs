import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HAN_FOUR = /^\p{Script=Han}{4}$/u;
const HAN_FIVE = /^\p{Script=Han}{5}$/u;
const BOPOMOFO = /^[ㄅ-㆙ˊˇˋ˙]+$/u;
const CONTENT_STATUSES = new Set(['NeedsReview', 'Approved', 'Deprecated']);
const PUBLICATION_STATUSES = new Set(['internal-review', 'not-approved-for-publication', 'approved-for-publication', 'deprecated']);
const VARIANT_RELATIONS = new Set(['canonical', 'variant_of', 'related']);
const DIFFICULTIES = new Set(['E', 'D', 'C', 'B', 'A', 'S']);
const BASE_RARITIES = new Set(['SR', 'SSR']);
const ALLUSION_TYPES = new Set(['fixed-origin', 'early-attestation', 'semantic-origin', 'variant-origin', 'lexical-note']);
const SOURCE_TYPES = new Set(['primary-text', 'authoritative-dictionary', 'supporting-reference']);
const SOURCE_STATUSES = new Set(['verified', 'NeedsReview']);
const FORBIDDEN_GENERIC_TERMS = ['鬼滅之刃','竈門炭治郎','竈門禰豆子','我妻善逸','嘴平伊之助','富岡義勇','胡蝶忍','煉獄杏壽郎','宇髄天元','時透無一郎','甘露寺蜜璃','伊黑小芭內','不死川實彌','悲鳴嶼行冥','火之神神樂','血鬼術','雷之呼吸','獸之呼吸','水之呼吸','蟲之呼吸','炎之呼吸','音之呼吸','霞之呼吸','戀之呼吸','蛇之呼吸','風之呼吸','岩之呼吸'];
const FORBIDDEN_VARIANT_KEYS = ['displayText','traditionalText','bopomofo','meaning','allusionType','allusionSummary','cardAllusion','primarySource','supportingSources','exampleSentence','themeCategory','difficulty','baseRarity','positiveMeaningScore','genericCardCopy','rendererProjection'];

function fail(context, message) { throw new Error(`${context}: ${message}`); }
function expectString(value, context, label) { if (typeof value !== 'string' || value.trim() === '') fail(context, `${label} 必須是非空字串`); }
function validateMaximLines(lines, context, label) {
  if (!Array.isArray(lines) || lines.length !== 4) fail(context, `${label} 必須恰好四句`);
  if (lines.some((line) => typeof line !== 'string' || !HAN_FIVE.test(line))) fail(context, `${label} 每句必須恰好五個漢字`);
}
function validateSource(source, context, label) {
  if (source === null || typeof source !== 'object' || Array.isArray(source)) fail(context, `${label} 必須是物件`);
  for (const key of ['sourceId','authority','dynasty','author','work','chapter','excerpt','url']) expectString(source[key], context, `${label}.${key}`);
  if (!/^https:\/\//u.test(source.url)) fail(context, `${label}.url 必須使用 HTTPS`);
  if (!SOURCE_TYPES.has(source.evidenceType)) fail(context, `${label}.evidenceType 無效`);
  if (!SOURCE_STATUSES.has(source.sourceStatus)) fail(context, `${label}.sourceStatus 無效`);
}
function validateTheme(theme, registry, context, label) {
  if (theme === null || typeof theme !== 'object' || Array.isArray(theme)) fail(context, `${label} 必須是物件`);
  const match = registry.badges.find((badge) => badge.systemValue === theme.systemValue && badge.displayName === theme.displayName);
  if (!match) fail(context, `${label} 必須對應核准主題 Registry`);
}
function validateReviewHistory(history, context) {
  if (!Array.isArray(history) || history.length === 0) fail(context, 'reviewHistory 至少需要一筆');
  for (const [index, entry] of history.entries()) {
    expectString(entry.reviewedAt, context, `reviewHistory[${index}].reviewedAt`);
    expectString(entry.reviewer, context, `reviewHistory[${index}].reviewer`);
    expectString(entry.notes, context, `reviewHistory[${index}].notes`);
    if (!CONTENT_STATUSES.has(entry.status)) fail(context, `reviewHistory[${index}].status 無效`);
  }
}
function validateNoIpTerms(record, context) {
  const genericTexts = [record.meaning, record.allusionSummary, record.cardAllusion, record.exampleSentence, record.genericCardCopy?.subtitle, ...(record.genericCardCopy?.maximLines ?? []), record.rendererProjection?.allusionBody, record.rendererProjection?.subtitle, ...(record.rendererProjection?.maximLines ?? [])].filter((value) => typeof value === 'string');
  for (const forbidden of FORBIDDEN_GENERIC_TERMS) if (genericTexts.some((text) => text.includes(forbidden))) fail(context, `通用內容不得包含 IP／角色／招式內容：${forbidden}`);
}

export function validateIdiomContentPackage(record, { context = 'idiom package', registry, directoryStatus } = {}) {
  if (record === null || typeof record !== 'object' || Array.isArray(record)) fail(context, '根節點必須是物件');
  if (record.schemaVersion !== 2) fail(context, 'schemaVersion 必須是 2');
  expectString(record.idiomId, context, 'idiomId');
  if (!/^idiom-[a-z0-9-]+$/u.test(record.idiomId)) fail(context, 'idiomId 格式無效');
  if (!HAN_FOUR.test(record.displayText ?? '')) fail(context, 'displayText 必須是四個漢字');
  if (!HAN_FOUR.test(record.traditionalText ?? '')) fail(context, 'traditionalText 必須是四個漢字');
  if (!Array.isArray(record.bopomofo) || record.bopomofo.length !== 4 || record.bopomofo.some((item) => typeof item !== 'string' || !BOPOMOFO.test(item))) fail(context, 'bopomofo 必須恰好四組有效注音');
  expectString(record.sourceHeadword, context, 'sourceHeadword');
  if (!VARIANT_RELATIONS.has(record.variantRelation)) fail(context, 'variantRelation 無效');
  if (record.variantRelation === 'variant_of' && record.sourceHeadword === record.displayText) fail(context, 'variant_of 必須指向不同來源詞頭');
  expectString(record.meaning, context, 'meaning');
  if (!ALLUSION_TYPES.has(record.allusionType)) fail(context, 'allusionType 無效');
  expectString(record.allusionSummary, context, 'allusionSummary');
  expectString(record.cardAllusion, context, 'cardAllusion');
  if (record.meaning.trim() === record.allusionSummary.trim()) fail(context, 'meaning 與 allusionSummary 不得完全相同');
  validateSource(record.primarySource, context, 'primarySource');
  if (!Array.isArray(record.supportingSources)) fail(context, 'supportingSources 必須是陣列');
  record.supportingSources.forEach((source, index) => validateSource(source, context, `supportingSources[${index}]`));
  expectString(record.exampleSentence, context, 'exampleSentence');
  if (!registry || !Array.isArray(registry.badges)) fail(context, '缺少 theme badge registry');
  validateTheme(record.themeCategory, registry, context, 'themeCategory');
  if (!DIFFICULTIES.has(record.difficulty)) fail(context, 'difficulty 必須是 E、D、C、B、A 或 S');
  if (!BASE_RARITIES.has(record.baseRarity)) fail(context, 'baseRarity 必須是 SR 或 SSR');
  if (!Number.isInteger(record.positiveMeaningScore) || record.positiveMeaningScore < 0 || record.positiveMeaningScore > 100) fail(context, 'positiveMeaningScore 必須是 0 到 100 的整數');
  const generic = record.genericCardCopy;
  if (generic === null || typeof generic !== 'object' || Array.isArray(generic)) fail(context, 'genericCardCopy 必須是物件');
  expectString(generic.subtitle, context, 'genericCardCopy.subtitle');
  validateMaximLines(generic.maximLines, context, 'genericCardCopy.maximLines');
  if (!CONTENT_STATUSES.has(record.contentStatus)) fail(context, 'contentStatus 無效');
  if (!PUBLICATION_STATUSES.has(record.publicationStatus)) fail(context, 'publicationStatus 無效');
  if (directoryStatus && record.contentStatus !== directoryStatus) fail(context, `目錄狀態要求 ${directoryStatus}，實際為 ${record.contentStatus}`);
  if (record.contentStatus === 'NeedsReview' && record.publicationStatus !== 'internal-review') fail(context, 'NeedsReview 成語內容只能使用 internal-review');
  validateReviewHistory(record.reviewHistory, context);
  const projection = record.rendererProjection;
  if (projection === null || typeof projection !== 'object' || Array.isArray(projection)) fail(context, 'rendererProjection 必須是物件');
  if (projection.title !== record.displayText) fail(context, 'rendererProjection.title 必須等於 displayText');
  if (JSON.stringify(projection.bopomofo) !== JSON.stringify(record.bopomofo)) fail(context, 'rendererProjection.bopomofo 必須等於 bopomofo');
  if (projection.meaning !== record.meaning) fail(context, 'rendererProjection.meaning 必須等於 meaning');
  if (projection.allusionTitle !== '典故') fail(context, 'rendererProjection.allusionTitle 固定為「典故」');
  if (projection.allusionBody !== record.cardAllusion) fail(context, 'rendererProjection.allusionBody 必須等於 cardAllusion');
  expectString(projection.sourceLine, context, 'rendererProjection.sourceLine');
  if (projection.subtitle !== generic.subtitle) fail(context, 'rendererProjection.subtitle 必須等於 genericCardCopy.subtitle');
  if (JSON.stringify(projection.maximLines) !== JSON.stringify(generic.maximLines)) fail(context, 'rendererProjection.maximLines 必須等於 genericCardCopy.maximLines');
  validateTheme(projection.themeCategory, registry, context, 'rendererProjection.themeCategory');
  if (JSON.stringify(projection.themeCategory) !== JSON.stringify(record.themeCategory)) fail(context, 'rendererProjection.themeCategory 必須等於 themeCategory');
  if (projection.baseRarity !== record.baseRarity) fail(context, 'rendererProjection.baseRarity 必須等於 baseRarity');
  validateNoIpTerms(record, context);
  return record;
}

export function validateCardVariant(record, { context = 'card variant', idiomIds, directoryStatus } = {}) {
  if (record === null || typeof record !== 'object' || Array.isArray(record)) fail(context, '根節點必須是物件');
  for (const forbiddenKey of FORBIDDEN_VARIANT_KEYS) if (Object.hasOwn(record, forbiddenKey)) fail(context, `聯名覆寫不得重新定義 ${forbiddenKey}`);
  if (record.schemaVersion !== 1) fail(context, 'schemaVersion 必須是 1');
  expectString(record.variantId, context, 'variantId');
  if (!/^variant-[a-z0-9-]+$/u.test(record.variantId)) fail(context, 'variantId 格式無效');
  expectString(record.idiomId, context, 'idiomId');
  if (!(idiomIds instanceof Set) || !idiomIds.has(record.idiomId)) fail(context, `idiomId 不存在於共用成語庫：${record.idiomId}`);
  const collaboration = record.collaboration;
  if (collaboration === null || typeof collaboration !== 'object' || Array.isArray(collaboration)) fail(context, 'collaboration 必須是物件');
  expectString(collaboration.ipName, context, 'collaboration.ipName');
  expectString(collaboration.characterName, context, 'collaboration.characterName');
  expectString(collaboration.characterTitle, context, 'collaboration.characterTitle');
  expectString(record.characterCore, context, 'characterCore');
  const move = record.primaryMove;
  if (move === null || typeof move !== 'object' || Array.isArray(move)) fail(context, 'primaryMove 必須是物件');
  expectString(move.displayName, context, 'primaryMove.displayName');
  if (!SOURCE_STATUSES.has(move.sourceStatus)) fail(context, 'primaryMove.sourceStatus 無效');
  expectString(record.subtitleOverride, context, 'subtitleOverride');
  validateMaximLines(record.maximOverride, context, 'maximOverride');
  expectString(record.visualDirection, context, 'visualDirection');
  if (record.rarity !== 'UR') fail(context, '聯名覆寫 rarity 固定為 UR');
  if (!CONTENT_STATUSES.has(record.contentStatus)) fail(context, 'contentStatus 無效');
  if (!PUBLICATION_STATUSES.has(record.publicationStatus)) fail(context, 'publicationStatus 無效');
  if (directoryStatus && record.contentStatus !== directoryStatus) fail(context, `目錄狀態要求 ${directoryStatus}，實際為 ${record.contentStatus}`);
  if (record.publicationStatus === 'approved-for-publication' && (typeof record.licenseEvidenceId !== 'string' || record.licenseEvidenceId.trim() === '')) fail(context, '沒有 licenseEvidenceId 時不得核准發布');
  if (record.contentStatus === 'NeedsReview' && record.publicationStatus !== 'not-approved-for-publication') fail(context, 'NeedsReview 聯名覆寫只能使用 not-approved-for-publication');
  if (record.licenseEvidenceId !== null && (typeof record.licenseEvidenceId !== 'string' || record.licenseEvidenceId.trim() === '')) fail(context, 'licenseEvidenceId 必須是非空字串或 null');
  validateReviewHistory(record.reviewHistory, context);
  return record;
}

async function loadJson(filePath) { return JSON.parse(await readFile(filePath, 'utf8')); }
async function listJsonFiles(directory, recursive = false) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isFile() && entry.name.endsWith('.json')) files.push(entryPath);
      else if (recursive && entry.isDirectory()) files.push(...(await listJsonFiles(entryPath, true)));
    }
    return files.sort();
  } catch (error) {
    if (error && error.code === 'ENOENT') return [];
    throw error;
  }
}

export async function validateAllIdiomContentPackages(projectRoot) {
  const registry = await loadJson(path.join(projectRoot, 'data', 'cards', 'theme-badge-registry.json'));
  const groups = [{ directory: path.join(projectRoot, 'data', 'idioms', 'review'), status: 'NeedsReview' }, { directory: path.join(projectRoot, 'data', 'idioms', 'approved'), status: 'Approved' }];
  const idiomIds = new Set();
  let count = 0;
  for (const group of groups) for (const filePath of await listJsonFiles(group.directory)) {
    const record = await loadJson(filePath);
    validateIdiomContentPackage(record, { context: path.relative(projectRoot, filePath), registry, directoryStatus: group.status });
    if (idiomIds.has(record.idiomId)) fail(path.relative(projectRoot, filePath), `idiomId 重複：${record.idiomId}`);
    idiomIds.add(record.idiomId);
    count += 1;
  }
  if (count === 0) throw new Error('找不到任何成語內容包');
  return { count, idiomIds };
}

export async function validateAllCardVariants(projectRoot, idiomIds) {
  const groups = [{ directory: path.join(projectRoot, 'data', 'card-variants', 'review'), status: 'NeedsReview' }, { directory: path.join(projectRoot, 'data', 'card-variants', 'approved'), status: 'Approved' }];
  const variantIds = new Set();
  let count = 0;
  for (const group of groups) for (const filePath of await listJsonFiles(group.directory, true)) {
    const record = await loadJson(filePath);
    validateCardVariant(record, { context: path.relative(projectRoot, filePath), idiomIds, directoryStatus: group.status });
    if (variantIds.has(record.variantId)) fail(path.relative(projectRoot, filePath), `variantId 重複：${record.variantId}`);
    variantIds.add(record.variantId);
    count += 1;
  }
  return count;
}

export async function validateAllContentLibraries(projectRoot) {
  const idioms = await validateAllIdiomContentPackages(projectRoot);
  const variantCount = await validateAllCardVariants(projectRoot, idioms.idiomIds);
  return { idiomCount: idioms.count, variantCount };
}

async function main() {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const result = await validateAllContentLibraries(projectRoot);
  console.log(`成語內容庫驗證完成：${result.idiomCount} 份共用成語，${result.variantCount} 份聯名覆寫。`);
}

const isDirectExecution = process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
