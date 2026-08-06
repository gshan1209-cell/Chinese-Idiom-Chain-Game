import {
  cloneMediaState,
  type MediaRepository
} from './media-repository.js';
import type {
  MediaItemType,
  MediaLibraryItem,
  MediaPreferences,
  MediaState
} from './media-types.js';

const DATABASE_NAME = 'cicg-media';
const DATABASE_VERSION = 1;
const LIBRARY_STORE = 'library';
const PREFERENCES_STORE = 'preferences';
const CUSTOM_LIBRARY_KEY = 'custom-items';
const PREFERENCES_KEY = 'player';
const MEDIA_TYPES = new Set<MediaItemType>([
  'radio',
  'youtube-video',
  'youtube-playlist'
]);

interface PersistedPreferencesRecord {
  readonly favoriteIds: readonly string[];
  readonly preferences: MediaPreferences;
}

function errorFrom(value: unknown, fallback: string): Error {
  return value instanceof Error ? value : new Error(fallback);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

function isMediaItem(value: unknown): value is MediaLibraryItem {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.type === 'string' &&
    MEDIA_TYPES.has(value.type as MediaItemType) &&
    typeof value.title === 'string' &&
    typeof value.sourceUrl === 'string' &&
    typeof value.canonicalUrl === 'string' &&
    typeof value.category === 'string' &&
    (value.origin === 'built-in' || value.origin === 'custom') &&
    typeof value.enabled === 'boolean' &&
    optionalString(value.createdAt) &&
    optionalString(value.homepageUrl) &&
    optionalString(value.youtubeVideoId) &&
    optionalString(value.youtubePlaylistId)
  );
}

function parseLibrary(value: unknown): readonly MediaLibraryItem[] {
  if (!Array.isArray(value)) {
    throw new Error('媒體清單資料格式不正確。');
  }

  const items: MediaLibraryItem[] = [];
  for (const candidate of value) {
    const item: unknown = candidate;
    if (!isMediaItem(item)) {
      throw new Error('媒體清單資料格式不正確。');
    }
    items.push(Object.freeze({ ...item }));
  }
  return Object.freeze(items);
}

function parsePreferencesRecord(value: unknown): PersistedPreferencesRecord {
  if (!isRecord(value)) throw new Error('媒體偏好資料格式不正確。');
  const favoriteIds = value.favoriteIds;
  const preferences = value.preferences;
  if (
    !Array.isArray(favoriteIds) ||
    favoriteIds.some((id) => typeof id !== 'string') ||
    !isRecord(preferences) ||
    typeof preferences.volume !== 'number' ||
    !Number.isFinite(preferences.volume) ||
    typeof preferences.muted !== 'boolean' ||
    typeof preferences.dockCollapsed !== 'boolean' ||
    (preferences.lastSelectedItemId !== null &&
      typeof preferences.lastSelectedItemId !== 'string')
  ) {
    throw new Error('媒體偏好資料格式不正確。');
  }

  const ids: string[] = [];
  for (const id of favoriteIds) {
    if (typeof id === 'string' && !ids.includes(id)) ids.push(id);
  }

  return Object.freeze({
    favoriteIds: Object.freeze(ids),
    preferences: Object.freeze({
      volume: Math.min(1, Math.max(0, preferences.volume)),
      muted: preferences.muted,
      dockCollapsed: preferences.dockCollapsed,
      lastSelectedItemId: preferences.lastSelectedItemId
    })
  });
}

function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let request: IDBOpenDBRequest;
    try {
      request = factory.open(DATABASE_NAME, DATABASE_VERSION);
    } catch (error) {
      reject(errorFrom(error, '無法開啟媒體資料庫。'));
      return;
    }

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(LIBRARY_STORE)) {
        database.createObjectStore(LIBRARY_STORE);
      }
      if (!database.objectStoreNames.contains(PREFERENCES_STORE)) {
        database.createObjectStore(PREFERENCES_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(errorFrom(request.error, '無法開啟媒體資料庫。'));
    request.onblocked = () =>
      reject(new Error('媒體資料庫目前被其他分頁阻擋。'));
  });
}

async function readState(factory: IDBFactory): Promise<MediaState | null> {
  const database = await openDatabase(factory);
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [LIBRARY_STORE, PREFERENCES_STORE],
      'readonly'
    );
    const libraryRequest = transaction
      .objectStore(LIBRARY_STORE)
      .get(CUSTOM_LIBRARY_KEY);
    const preferencesRequest = transaction
      .objectStore(PREFERENCES_STORE)
      .get(PREFERENCES_KEY);
    let settled = false;

    const fail = (error: unknown, fallback: string) => {
      if (settled) return;
      settled = true;
      database.close();
      reject(errorFrom(error, fallback));
    };

    transaction.oncomplete = () => {
      if (settled) return;
      settled = true;
      database.close();
      const libraryValue: unknown = libraryRequest.result;
      const preferencesValue: unknown = preferencesRequest.result;
      if (libraryValue === undefined && preferencesValue === undefined) {
        resolve(null);
        return;
      }
      try {
        const record = parsePreferencesRecord(preferencesValue);
        resolve(
          cloneMediaState({
            library: parseLibrary(libraryValue),
            favoriteIds: record.favoriteIds,
            preferences: record.preferences
          })
        );
      } catch (error) {
        reject(errorFrom(error, '讀取媒體設定失敗。'));
      }
    };
    libraryRequest.onerror = () =>
      fail(libraryRequest.error, '讀取媒體清單失敗。');
    preferencesRequest.onerror = () =>
      fail(preferencesRequest.error, '讀取媒體偏好失敗。');
    transaction.onerror = () =>
      fail(transaction.error, '讀取媒體資料交易失敗。');
    transaction.onabort = () =>
      fail(transaction.error, '讀取媒體資料交易已中止。');
  });
}

async function writeState(factory: IDBFactory, state: MediaState): Promise<void> {
  const database = await openDatabase(factory);
  const snapshot = cloneMediaState(state);
  const customItems = snapshot.library.filter((item) => item.origin === 'custom');
  const preferencesRecord: PersistedPreferencesRecord = Object.freeze({
    favoriteIds: snapshot.favoriteIds,
    preferences: snapshot.preferences
  });

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      [LIBRARY_STORE, PREFERENCES_STORE],
      'readwrite'
    );
    const libraryRequest = transaction
      .objectStore(LIBRARY_STORE)
      .put(customItems, CUSTOM_LIBRARY_KEY);
    const preferencesRequest = transaction
      .objectStore(PREFERENCES_STORE)
      .put(preferencesRecord, PREFERENCES_KEY);
    let settled = false;

    const fail = (error: unknown, fallback: string) => {
      if (settled) return;
      settled = true;
      database.close();
      reject(errorFrom(error, fallback));
    };

    libraryRequest.onerror = () =>
      fail(libraryRequest.error, '寫入媒體清單失敗。');
    preferencesRequest.onerror = () =>
      fail(preferencesRequest.error, '寫入媒體偏好失敗。');
    transaction.onerror = () =>
      fail(transaction.error, '寫入媒體資料交易失敗。');
    transaction.onabort = () =>
      fail(transaction.error, '寫入媒體資料交易已中止。');
    transaction.oncomplete = () => {
      if (settled) return;
      settled = true;
      database.close();
      resolve();
    };
  });
}

export function createIndexedDbMediaRepository(
  factory: IDBFactory
): MediaRepository {
  return Object.freeze({
    async load(): Promise<MediaState | null> {
      return readState(factory);
    },
    async save(state: MediaState): Promise<void> {
      await writeState(factory, state);
    }
  });
}
