import { createCustomMediaItem } from './media-library.js';
import {
  type CreateCustomMediaItemInput,
  type MediaBackupInput,
  type MediaImportResult,
  type MediaItemType,
  type MediaLibraryItem,
  type MediaPreferences,
  type MediaState
} from './media-types.js';

const SCHEMA_VERSION = 1;
const MEDIA_TYPES = new Set<MediaItemType>([
  'radio',
  'youtube-video',
  'youtube-playlist'
]);

export class MediaImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MediaImportError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, message: string): Record<string, unknown> {
  if (!isRecord(value)) throw new MediaImportError(message);
  return value;
}

function requireString(value: unknown, message: string): string {
  if (typeof value !== 'string') throw new MediaImportError(message);
  return value;
}

function requireBoolean(value: unknown, message: string): boolean {
  if (typeof value !== 'boolean') throw new MediaImportError(message);
  return value;
}

function parsePreferences(value: unknown): MediaPreferences {
  const record = requireRecord(value, '媒體偏好格式不正確。');
  if (typeof record.volume !== 'number' || !Number.isFinite(record.volume)) {
    throw new MediaImportError('媒體音量格式不正確。');
  }
  const lastSelectedItemId = record.lastSelectedItemId;
  if (lastSelectedItemId !== null && typeof lastSelectedItemId !== 'string') {
    throw new MediaImportError('上次媒體項目格式不正確。');
  }

  return Object.freeze({
    volume: Math.min(1, Math.max(0, record.volume)),
    muted: requireBoolean(record.muted, '靜音設定格式不正確。'),
    dockCollapsed: requireBoolean(
      record.dockCollapsed,
      '播放器收合設定格式不正確。'
    ),
    lastSelectedItemId
  });
}

function parseFavoriteIds(value: unknown): readonly string[] {
  if (!Array.isArray(value) || value.some((id) => typeof id !== 'string')) {
    throw new MediaImportError('收藏清單格式不正確。');
  }
  return Object.freeze([...new Set(value)]);
}

function parseMediaItemInput(
  value: unknown,
  fallbackCreatedAt: string
): Readonly<{
  input: CreateCustomMediaItemInput;
  createdAt: string;
}> {
  const record = requireRecord(value, '媒體項目格式不正確。');
  const type = record.type;
  if (typeof type !== 'string' || !MEDIA_TYPES.has(type as MediaItemType)) {
    throw new MediaImportError('媒體類型不支援。');
  }

  const homepageUrl = record.homepageUrl;
  if (homepageUrl !== undefined && typeof homepageUrl !== 'string') {
    throw new MediaImportError('媒體首頁網址格式不正確。');
  }
  const createdAt = record.createdAt === undefined
    ? fallbackCreatedAt
    : requireString(record.createdAt, '媒體建立時間格式不正確。');

  return Object.freeze({
    input: Object.freeze({
      id: requireString(record.id, '媒體 ID 格式不正確。'),
      type: type as MediaItemType,
      title: requireString(record.title, '媒體標題格式不正確。'),
      category: requireString(record.category, '媒體分類格式不正確。'),
      sourceUrl: requireString(record.sourceUrl, '媒體網址格式不正確。'),
      ...(homepageUrl === undefined ? {} : { homepageUrl })
    }),
    createdAt
  });
}

function freezeState(
  library: readonly MediaLibraryItem[],
  favoriteIds: readonly string[],
  preferences: MediaPreferences
): MediaState {
  return Object.freeze({
    library: Object.freeze([...library]),
    favoriteIds: Object.freeze([...favoriteIds]),
    preferences: Object.freeze({ ...preferences })
  });
}

export function exportMediaBackup(input: MediaBackupInput): string {
  return JSON.stringify(
    {
      schemaVersion: SCHEMA_VERSION,
      exportedAt: input.exportedAt,
      library: input.state.library.filter((item) => item.origin === 'custom'),
      favoriteIds: [...input.state.favoriteIds],
      preferences: { ...input.state.preferences }
    },
    null,
    2
  );
}

export function importMediaBackup(
  json: string,
  current: MediaState
): MediaImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new MediaImportError('備份檔不是有效的 JSON。');
  }

  const root = requireRecord(parsed, '備份檔格式不正確。');
  if (root.schemaVersion !== SCHEMA_VERSION) {
    throw new MediaImportError('不支援此備份檔版本。');
  }
  const exportedAt = requireString(root.exportedAt, '備份時間格式不正確。');
  if (!Array.isArray(root.library)) {
    throw new MediaImportError('媒體清單格式不正確。');
  }

  const importedFavorites = parseFavoriteIds(root.favoriteIds);
  const importedPreferences = parsePreferences(root.preferences);
  const nextLibrary = [...current.library];
  const ids = new Set(nextLibrary.map((item) => item.id));
  const canonicalUrls = new Set(nextLibrary.map((item) => item.canonicalUrl));
  let added = 0;
  let skipped = 0;
  let failed = 0;

  for (const rawItem of root.library) {
    try {
      const candidate = parseMediaItemInput(rawItem, exportedAt);
      const item = createCustomMediaItem(candidate.input, candidate.createdAt);
      if (ids.has(item.id) || canonicalUrls.has(item.canonicalUrl)) {
        skipped += 1;
        continue;
      }
      nextLibrary.push(item);
      ids.add(item.id);
      canonicalUrls.add(item.canonicalUrl);
      added += 1;
    } catch {
      failed += 1;
    }
  }

  const validItemIds = new Set(nextLibrary.map((item) => item.id));
  const favoriteIds = importedFavorites.filter((id) => validItemIds.has(id));
  const lastSelectedItemId = importedPreferences.lastSelectedItemId;
  const preferences = Object.freeze({
    ...importedPreferences,
    lastSelectedItemId:
      lastSelectedItemId !== null && validItemIds.has(lastSelectedItemId)
        ? lastSelectedItemId
        : null
  });

  return Object.freeze({
    state: freezeState(nextLibrary, favoriteIds, preferences),
    summary: Object.freeze({ added, skipped, failed })
  });
}
