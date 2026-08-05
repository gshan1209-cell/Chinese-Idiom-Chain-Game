import {
  MediaValidationError,
  type CreateCustomMediaItemInput,
  type MediaLibraryItem
} from './media-types.js';
import { normalizeHttpsUrl, parseMediaSource } from './media-url-parser.js';

function normalizeText(
  value: string,
  fieldName: string,
  maximumLength: number
): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new MediaValidationError(`${fieldName}不能為空。`);
  }
  if (normalized.length > maximumLength) {
    throw new MediaValidationError(`${fieldName}長度超過限制。`);
  }
  return normalized;
}

function freezeItems(
  items: readonly MediaLibraryItem[]
): readonly MediaLibraryItem[] {
  return Object.freeze([...items]);
}

export function createCustomMediaItem(
  input: CreateCustomMediaItemInput,
  createdAt: string
): MediaLibraryItem {
  const id = normalizeText(input.id, '媒體 ID', 120);
  const title = normalizeText(input.title, '標題', 80);
  const category = normalizeText(input.category, '分類', 30);
  const parsed = parseMediaSource(input.sourceUrl, input.type);
  const homepageUrl = input.homepageUrl === undefined
    ? undefined
    : normalizeHttpsUrl(input.homepageUrl);

  return Object.freeze({
    id,
    type: parsed.type,
    title,
    sourceUrl: input.sourceUrl.trim(),
    canonicalUrl: parsed.canonicalUrl,
    category,
    origin: 'custom' as const,
    enabled: true,
    createdAt,
    ...(homepageUrl === undefined ? {} : { homepageUrl }),
    ...(parsed.type === 'youtube-video'
      ? { youtubeVideoId: parsed.youtubeVideoId }
      : {}),
    ...(parsed.type === 'youtube-playlist'
      ? { youtubePlaylistId: parsed.youtubePlaylistId }
      : {})
  });
}

export function mergeMediaLibraries(
  current: readonly MediaLibraryItem[],
  incoming: readonly MediaLibraryItem[]
): readonly MediaLibraryItem[] {
  const ids = new Set<string>();
  const canonicalUrls = new Set<string>();
  const merged = [...current, ...incoming];

  for (const item of merged) {
    if (ids.has(item.id)) {
      throw new MediaValidationError(`媒體 ID 重複：${item.id}`);
    }
    if (canonicalUrls.has(item.canonicalUrl)) {
      throw new MediaValidationError(`媒體網址重複：${item.canonicalUrl}`);
    }
    ids.add(item.id);
    canonicalUrls.add(item.canonicalUrl);
  }

  return freezeItems(merged);
}

export function removeCustomMediaItem(
  items: readonly MediaLibraryItem[],
  itemId: string
): readonly MediaLibraryItem[] {
  const item = items.find((candidate) => candidate.id === itemId);
  if (item === undefined) return freezeItems(items);
  if (item.origin !== 'custom') {
    throw new MediaValidationError('內建媒體不能刪除。');
  }
  return freezeItems(items.filter((candidate) => candidate.id !== itemId));
}

export function toggleMediaFavorite(
  favoriteIds: readonly string[],
  itemId: string
): readonly string[] {
  if (favoriteIds.includes(itemId)) {
    return Object.freeze(favoriteIds.filter((id) => id !== itemId));
  }
  return Object.freeze([...favoriteIds, itemId]);
}

export function reorderCustomMediaItems(
  items: readonly MediaLibraryItem[],
  orderedCustomIds: readonly string[]
): readonly MediaLibraryItem[] {
  const builtIn = items.filter((item) => item.origin === 'built-in');
  const custom = items.filter((item) => item.origin === 'custom');
  const customById = new Map(custom.map((item) => [item.id, item]));

  if (
    orderedCustomIds.length !== custom.length ||
    new Set(orderedCustomIds).size !== custom.length ||
    orderedCustomIds.some((id) => !customById.has(id))
  ) {
    throw new MediaValidationError('自訂媒體排序清單不完整。');
  }

  return freezeItems([
    ...builtIn,
    ...orderedCustomIds.map((id) => customById.get(id) as MediaLibraryItem)
  ]);
}
