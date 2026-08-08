import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HAN = /^\p{Script=Han}{4}$/u;
const BOPOMOFO = /^[ㄅ-㆙ˊˇˋ˙]+$/u;
const CONTENT_STATUSES = new Set(['NeedsReview', 'Approved', 'Deprecated']);
const VARIANT_RELATIONS = new Set(['canonical', 'variant_of', 'related']);
const DIFFICULTIES = new Set(['E', 'D', 'C', 'B', 'A', 'S']);
const SOURCE_TYPES = new Set(['primary-text', 'authoritative-dictionary', 'supporting-reference']);
const SOURCE_STATUSES = new Set(['verified', 'NeedsReview']);
const FORBIDDEN_ALLUSION_TERMS = ['鬼滅之刃', '胡蝶忍', '蝶柱', '角色劇情', 'IP 世界觀'];

function fail(context, message) {
  throw new Error(`${context}: ${message}`);
}

function expectString(value, context, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(context, `${label} 必須是非空字串`);
  }
}

function validateSource(source, context, label) {
  if (source === null || typeof source !== 'object' || Array.isArray(source)) {
    fail(context, `${label} 必須是物件`);
  }
  for (const key of ['sourceId', 'authority', 'dynasty', 'author', 'work', 'chapter', 'excerpt', 'url']) {
    expectString(source[key], context, `${label}.${key}`);
  }
  if (!/^https:\/\//u.test(source.url)) {
    fail(context, `${label}.url 必須使用 HTTPS`);
  }
  if (!SOURCE_TYPES.has(source.evidenceType)) {
    fail(context, `${label}.evidenceType 無效`);
  }
  if (!SOURCE_STATUSES.has(source.sourceStatus)) {
    fail(context, `${label}.sourceStatus 無效`);
  }
}

function validateTheme(theme, registry, context, label) {
  if (theme === null || typeof theme !== 'object' || Array.isArray(theme)) {
    fail(context, `${label} 必須是物件`);
  }
  const match = registry.badges.find(
    (badge) => badge.systemValue === theme.systemValue && badge.displayName === theme.displayName
  );
  if (!match) {
    fail(context, `${label} 必須對應核准主題 Registry`);
  }
}

export function validateIdiomContentPackage(
  record,
  { context = 'idiom package', registry, directoryStatus } = {}
) {
  if (record === null || typeof record !== 'object' || Array.isArray(record)) {
    fail(context, '根節點必須是物件');
  }
  if (record.schemaVersion !== 1) {
    fail(context, 'schemaVersion 必須是 1');
  }
  expectString(record.idiomId, context, 'idiomId');
  if (!HAN.test(record.displayText ?? '')) {
    fail(context, 'displayText 必須是四個漢字');
  }
  if (!HAN.test(record.traditionalText ?? '')) {
    fail(context, 'traditionalText 必須是四個漢字');
  }
  if (
    !Array.isArray(record.bopomofo) ||
    record.bopomofo.length !== 4 ||
    record.bopomofo.some((item) => !BOPOMOFO.test(item))
  ) {
    fail(context, 'bopomofo 必須恰好四組有效注音');
  }
  expectString(record.sourceHeadword, context, 'sourceHeadword');
  if (!VARIANT_RELATIONS.has(record.variantRelation)) {
    fail(context, 'variantRelation 無效');
  }
  if (record.variantRelation === 'variant_of' && record.sourceHeadword === record.displayText) {
    fail(context, 'variant_of 必須指向不同來源詞頭');
  }
  expectString(record.meaning, context, 'meaning');
  expectString(record.allusionSummary, context, 'allusionSummary');
  if (record.meaning.trim() === record.allusionSummary.trim()) {
    fail(context, 'meaning 與 allusionSummary 不得完全相同');
  }
  validateSource(record.primarySource, context, 'primarySource');
  if (!Array.isArray(record.supportingSources) || record.supportingSources.length === 0) {
    fail(context, 'supportingSources 至少需要一筆');
  }
  record.supportingSources.forEach((source, index) =>
    validateSource(source, context, `supportingSources[${index}]`)
  );
  expectString(record.exampleSentence, context, 'exampleSentence');
  if (!registry || !Array.isArray(registry.badges)) {
    fail(context, '缺少 theme badge registry');
  }
  validateTheme(record.themeCategory, registry, context, 'themeCategory');
  if (!DIFFICULTIES.has(record.difficulty)) {
    fail(context, 'difficulty 必須是 E、D、C、B、A 或 S');
  }
  if (
    !Number.isInteger(record.positiveMeaningScore) ||
    record.positiveMeaningScore < 0 ||
    record.positiveMeaningScore > 100
  ) {
    fail(context, 'positiveMeaningScore 必須是 0 到 100 的整數');
  }
  if (!CONTENT_STATUSES.has(record.contentStatus)) {
    fail(context, 'contentStatus 無效');
  }
  if (directoryStatus && record.contentStatus !== directoryStatus) {
    fail(context, `目錄狀態要求 ${directoryStatus}，實際為 ${record.contentStatus}`);
  }
  if (!Array.isArray(record.reviewHistory) || record.reviewHistory.length === 0) {
    fail(context, 'reviewHistory 至少需要一筆');
  }
  for (const [index, entry] of record.reviewHistory.entries()) {
    expectString(entry.reviewedAt, context, `reviewHistory[${index}].reviewedAt`);
    expectString(entry.reviewer, context, `reviewHistory[${index}].reviewer`);
    expectString(entry.notes, context, `reviewHistory[${index}].notes`);
    if (!CONTENT_STATUSES.has(entry.status)) {
      fail(context, `reviewHistory[${index}].status 無效`);
    }
  }

  const projection = record.rendererProjection;
  if (projection === null || typeof projection !== 'object' || Array.isArray(projection)) {
    fail(context, 'rendererProjection 必須是物件');
  }
  if (projection.title !== record.displayText) {
    fail(context, 'rendererProjection.title 必須等於 displayText');
  }
  if (JSON.stringify(projection.bopomofo) !== JSON.stringify(record.bopomofo)) {
    fail(context, 'rendererProjection.bopomofo 必須等於 bopomofo');
  }
  if (projection.meaning !== record.meaning) {
    fail(context, 'rendererProjection.meaning 必須等於 meaning');
  }
  if (projection.allusionTitle !== '典故') {
    fail(context, 'rendererProjection.allusionTitle 固定為「典故」');
  }
  expectString(projection.allusionBody, context, 'rendererProjection.allusionBody');
  expectString(projection.sourceLine, context, 'rendererProjection.sourceLine');
  validateTheme(projection.themeCategory, registry, context, 'rendererProjection.themeCategory');
  if (projection.themeCategory.systemValue !== record.themeCategory.systemValue) {
    fail(context, 'rendererProjection.themeCategory 必須等於 themeCategory');
  }
  for (const forbidden of FORBIDDEN_ALLUSION_TERMS) {
    if (record.allusionSummary.includes(forbidden) || projection.allusionBody.includes(forbidden)) {
      fail(context, `典故不得包含 IP／角色內容：${forbidden}`);
    }
  }
  return record;
}

async function loadJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function listJsonFiles(directory) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => path.join(directory, entry.name))
      .sort();
  } catch (error) {
    if (error && error.code === 'ENOENT') return [];
    throw error;
  }
}

export async function validateAllIdiomContentPackages(projectRoot) {
  const registry = await loadJson(
    path.join(projectRoot, 'data', 'cards', 'theme-badge-registry.json')
  );
  const groups = [
    { directory: path.join(projectRoot, 'data', 'idioms', 'review'), status: 'NeedsReview' },
    { directory: path.join(projectRoot, 'data', 'idioms', 'approved'), status: 'Approved' }
  ];
  let count = 0;
  for (const group of groups) {
    for (const filePath of await listJsonFiles(group.directory)) {
      const record = await loadJson(filePath);
      validateIdiomContentPackage(record, {
        context: path.relative(projectRoot, filePath),
        registry,
        directoryStatus: group.status
      });
      count += 1;
    }
  }
  if (count === 0) {
    throw new Error('找不到任何成語內容包');
  }
  return count;
}

async function main() {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const count = await validateAllIdiomContentPackages(projectRoot);
  console.log(`成語內容包驗證完成：${count} 份。`);
}

const isDirectExecution =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
