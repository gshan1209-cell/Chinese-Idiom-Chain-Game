import type {
  ActiveIdiomReference,
  CardAcquisitionMethod,
  CardApprovalStatus,
  CardDefinitionFinding,
  CardDefinitionValidationResult,
  CardRarity,
  CardSourceStatus,
  IdiomCardDefinition,
  IdiomDifficultyGrade
} from './card-types.js';

const ALLOWED_KEYS = new Set([
  'id',
  'idiomId',
  'title',
  'bopomofo',
  'pinyin',
  'subtitle',
  'rarity',
  'difficulty',
  'imageAsset',
  'thumbnailAsset',
  'storySummary',
  'storySource',
  'motto',
  'enabled',
  'approvalStatus',
  'sourceStatus',
  'rarityApproved',
  'releaseOrder',
  'startsAt',
  'endsAt',
  'acquisitionMethods',
  'weight',
  'licenseEvidenceId'
]);

const RARITIES = new Set<CardRarity>(['N', 'R', 'SR', 'SSR', 'UR']);
const DIFFICULTIES = new Set<IdiomDifficultyGrade>(['E', 'D', 'C', 'B', 'A', 'S']);
const APPROVAL_STATUSES = new Set<CardApprovalStatus>([
  'Approved',
  'Review',
  'Legacy',
  'Rejected'
]);
const SOURCE_STATUSES = new Set<CardSourceStatus>([
  'Approved',
  'NeedsReview',
  'Rejected'
]);
const ACQUISITION_METHODS = new Set<CardAcquisitionMethod>([
  'milestone-reward',
  'achievement-reward',
  'direct-purchase',
  'fixed-bundle',
  'event-reward',
  'manual-grant'
]);

const BOPOMOFO_PATTERN = /^[\u3105-\u312f\u02d9\u02ca\u02c7\u02cb]+$/u;
const PINYIN_PATTERN = /^[a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜńňǹḿ]+$/u;
const HAN_PATTERN = /^\p{Script=Han}$/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cardIdOf(value: unknown): string | null {
  if (!isRecord(value)) return null;
  return typeof value.id === 'string' && value.id.trim() !== '' ? value.id : null;
}

function freezeFinding(
  index: number,
  cardId: string | null,
  code: string,
  message: string
): CardDefinitionFinding {
  return Object.freeze({ index, cardId, code, message });
}

function hasExactlyFourStrings(value: unknown): value is [string, string, string, string] {
  return Array.isArray(value) &&
    value.length === 4 &&
    value.every((entry) => typeof entry === 'string' && entry.trim() !== '');
}

function isValidBopomofo(value: unknown): value is [string, string, string, string] {
  return hasExactlyFourStrings(value) && value.every((entry) => BOPOMOFO_PATTERN.test(entry));
}

function isValidPinyin(value: unknown): value is [string, string, string, string] {
  return hasExactlyFourStrings(value) && value.every((entry) => PINYIN_PATTERN.test(entry));
}

function isFourHanCharacters(value: unknown): value is string {
  return typeof value === 'string' &&
    Array.from(value).length === 4 &&
    Array.from(value).every((character) => HAN_PATTERN.test(character));
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function isLocalCardAsset(value: unknown): value is string {
  return typeof value === 'string' &&
    value.startsWith('/assets/cards/') &&
    !value.includes('..') &&
    !value.includes('://') &&
    !value.includes('<') &&
    !value.includes('>') &&
    !value.startsWith('data:') &&
    !value.startsWith('blob:');
}

function isIsoOrNull(value: unknown): value is string | null {
  return value === null || (
    typeof value === 'string' &&
    value.trim() !== '' &&
    Number.isFinite(Date.parse(value))
  );
}

function cloneDefinition(record: Record<string, unknown>): IdiomCardDefinition {
  return Object.freeze({
    id: record.id as string,
    idiomId: record.idiomId as string,
    title: record.title as string,
    bopomofo: Object.freeze([...(record.bopomofo as [string, string, string, string])]) as readonly [string, string, string, string],
    pinyin: Object.freeze([...(record.pinyin as [string, string, string, string])]) as readonly [string, string, string, string],
    subtitle: record.subtitle as string,
    rarity: record.rarity as CardRarity,
    difficulty: record.difficulty as IdiomDifficultyGrade,
    imageAsset: record.imageAsset as string,
    thumbnailAsset: record.thumbnailAsset as string,
    storySummary: record.storySummary as string,
    storySource: record.storySource as string,
    motto: record.motto as string,
    enabled: record.enabled as boolean,
    approvalStatus: record.approvalStatus as CardApprovalStatus,
    sourceStatus: record.sourceStatus as CardSourceStatus,
    rarityApproved: record.rarityApproved as boolean,
    releaseOrder: record.releaseOrder as number,
    startsAt: record.startsAt as string | null,
    endsAt: record.endsAt as string | null,
    acquisitionMethods: Object.freeze([...(record.acquisitionMethods as CardAcquisitionMethod[])]),
    weight: record.weight as number,
    licenseEvidenceId: record.licenseEvidenceId as string | null
  });
}

function validateRecord(
  record: Record<string, unknown>,
  index: number,
  idCounts: ReadonlyMap<string, number>,
  idiomById: ReadonlyMap<string, string>,
  atMs: number
): readonly CardDefinitionFinding[] {
  const findings: CardDefinitionFinding[] = [];
  const cardId = cardIdOf(record);
  const add = (code: string, message: string) => {
    findings.push(freezeFinding(index, cardId, code, message));
  };

  for (const key of Object.keys(record)) {
    if (!ALLOWED_KEYS.has(key)) add('unknown-field', `不允許的圖卡欄位：${key}`);
  }

  if (!isNonEmptyString(record.id)) add('invalid-id', '圖卡 id 不可為空。');
  if (cardId !== null && (idCounts.get(cardId) ?? 0) > 1) add('duplicate-id', '圖卡 id 不得重複。');
  if (!isNonEmptyString(record.idiomId)) add('invalid-idiom-id', 'idiomId 不可為空。');

  const idiomText = typeof record.idiomId === 'string' ? idiomById.get(record.idiomId) : undefined;
  if (idiomText === undefined) {
    add('unknown-idiom', 'idiomId 必須指向啟用中的成語。');
  } else if (!isFourHanCharacters(record.title) || record.title !== idiomText) {
    add('idiom-mismatch', '圖卡標題必須是對應的四字繁體成語。');
  }

  if (!isValidBopomofo(record.bopomofo)) add('invalid-bopomofo', '注音必須恰好四筆並使用注音符號。');
  if (!isValidPinyin(record.pinyin)) add('invalid-pinyin', '拼音必須恰好四筆、小寫並使用正式聲調符號。');
  if (!isNonEmptyString(record.subtitle)) add('invalid-subtitle', '副標題不可為空。');
  if (typeof record.rarity !== 'string' || !RARITIES.has(record.rarity as CardRarity)) add('invalid-rarity', '稀有度無效。');
  if (typeof record.difficulty !== 'string' || !DIFFICULTIES.has(record.difficulty as IdiomDifficultyGrade)) add('invalid-difficulty', '難易度無效。');
  if (!isLocalCardAsset(record.imageAsset)) add('invalid-image-asset', '主圖必須是 Repository 內核准卡牌資產。');
  if (!isLocalCardAsset(record.thumbnailAsset)) add('invalid-thumbnail-asset', '縮圖必須是 Repository 內核准卡牌資產。');
  if (!isNonEmptyString(record.storySummary)) add('invalid-story-summary', '典故摘要不可為空。');
  if (!isNonEmptyString(record.storySource)) add('invalid-story-source', '典故來源不可為空。');
  if (!isNonEmptyString(record.motto)) add('invalid-motto', '卡牌箴言不可為空。');
  if (record.enabled !== true) add('disabled-card', '正式卡必須啟用。');
  if (record.approvalStatus !== 'Approved' || !APPROVAL_STATUSES.has(record.approvalStatus as CardApprovalStatus)) add('unapproved-asset', '只有 Approved 素材可進正式卡池。');
  if (record.sourceStatus !== 'Approved' || !SOURCE_STATUSES.has(record.sourceStatus as CardSourceStatus)) add('unapproved-source', '成語來源必須通過校訂。');
  if (record.rarityApproved !== true) add('unapproved-rarity', '稀有度必須通過人工複核。');
  if (!Number.isInteger(record.releaseOrder) || (record.releaseOrder as number) < 0) add('invalid-release-order', 'releaseOrder 必須是非負整數。');
  if (!isIsoOrNull(record.startsAt) || !isIsoOrNull(record.endsAt)) add('invalid-release-window', '發布期間必須是 null 或合法 ISO-8601。');

  if (isIsoOrNull(record.startsAt) && record.startsAt !== null && Date.parse(record.startsAt) > atMs) {
    add('not-released', '圖卡尚未到發布時間。');
  }
  if (isIsoOrNull(record.endsAt) && record.endsAt !== null && Date.parse(record.endsAt) < atMs) {
    add('expired-card', '圖卡已超過發布時間。');
  }

  if (!Array.isArray(record.acquisitionMethods) ||
      record.acquisitionMethods.length === 0 ||
      !record.acquisitionMethods.every((method) => typeof method === 'string' && ACQUISITION_METHODS.has(method as CardAcquisitionMethod)) ||
      !record.acquisitionMethods.includes('milestone-reward')) {
    add('invalid-acquisition-methods', '正式里程碑卡必須包含 milestone-reward。');
  }

  if (!Number.isInteger(record.weight) || (record.weight as number) <= 0) add('invalid-weight', '權重必須是大於零的有限整數。');

  if (record.rarity === 'UR') {
    if (!isNonEmptyString(record.licenseEvidenceId)) add('missing-license-evidence', 'UR 必須有可稽核授權證據。');
  } else if (record.licenseEvidenceId !== null) {
    add('unexpected-license-evidence', 'N 至 SSR 的授權證據欄位應為 null。');
  }

  return Object.freeze(findings);
}

export function validateIdiomCardDefinitions(
  input: unknown,
  activeIdioms: readonly ActiveIdiomReference[],
  at: string
): CardDefinitionValidationResult {
  if (!Array.isArray(input)) {
    return Object.freeze({
      validDefinitions: Object.freeze([]),
      findings: Object.freeze([
        freezeFinding(-1, null, 'invalid-root', '圖卡定義根節點必須是陣列。')
      ])
    });
  }

  const atMs = Date.parse(at);
  if (!Number.isFinite(atMs)) {
    return Object.freeze({
      validDefinitions: Object.freeze([]),
      findings: Object.freeze([
        freezeFinding(-1, null, 'invalid-validation-time', '驗證時間必須是合法 ISO-8601。')
      ])
    });
  }

  const idiomById = new Map(activeIdioms.map((idiom) => [idiom.id, idiom.text]));
  const idCounts = new Map<string, number>();
  for (const value of input) {
    const id = cardIdOf(value);
    if (id !== null) idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
  }

  const validDefinitions: IdiomCardDefinition[] = [];
  const findings: CardDefinitionFinding[] = [];

  input.forEach((value, index) => {
    if (!isRecord(value)) {
      findings.push(freezeFinding(index, null, 'invalid-record', '圖卡定義必須是物件。'));
      return;
    }
    const recordFindings = validateRecord(value, index, idCounts, idiomById, atMs);
    findings.push(...recordFindings);
    if (recordFindings.length === 0) validDefinitions.push(cloneDefinition(value));
  });

  return Object.freeze({
    validDefinitions: Object.freeze(validDefinitions),
    findings: Object.freeze(findings)
  });
}
