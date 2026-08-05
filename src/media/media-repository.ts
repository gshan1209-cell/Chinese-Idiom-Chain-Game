import type {
  MediaLibraryItem,
  MediaPreferences,
  MediaState
} from './media-types.js';

export interface MediaRepository {
  load(): Promise<MediaState | null>;
  save(state: MediaState): Promise<void>;
}

function cloneItem(item: MediaLibraryItem): MediaLibraryItem {
  return Object.freeze({ ...item });
}

function clonePreferences(preferences: MediaPreferences): MediaPreferences {
  return Object.freeze({ ...preferences });
}

export function cloneMediaState(state: MediaState): MediaState {
  return Object.freeze({
    library: Object.freeze(state.library.map(cloneItem)),
    favoriteIds: Object.freeze([...state.favoriteIds]),
    preferences: clonePreferences(state.preferences)
  });
}

export function createMemoryMediaRepository(
  initial: MediaState | null = null
): MediaRepository {
  let stored = initial === null ? null : cloneMediaState(initial);

  return Object.freeze({
    load(): Promise<MediaState | null> {
      return Promise.resolve(
        stored === null ? null : cloneMediaState(stored)
      );
    },
    save(state: MediaState): Promise<void> {
      stored = cloneMediaState(state);
      return Promise.resolve();
    }
  });
}
