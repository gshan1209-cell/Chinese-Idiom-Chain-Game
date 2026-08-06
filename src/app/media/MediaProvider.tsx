import './media.css';

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode
} from 'react';

import defaultLibrary from '../../../data/media/default-library.json';
import { createIndexedDbMediaRepository } from '../../media/indexeddb-media-repository';
import { exportMediaBackup, importMediaBackup } from '../../media/media-import-export';
import {
  createCustomMediaItem,
  mergeMediaLibraries,
  removeCustomMediaItem,
  reorderCustomMediaItems,
  toggleMediaFavorite
} from '../../media/media-library';
import {
  createInitialPlaybackState,
  reducePlaybackState
} from '../../media/media-playback-policy';
import {
  cloneMediaState,
  createMemoryMediaRepository,
  type MediaRepository
} from '../../media/media-repository';
import type {
  CreateCustomMediaItemInput,
  MediaImportSummary,
  MediaLibraryItem,
  MediaPreferences,
  MediaState
} from '../../media/media-types';
import { MediaContext, type MediaController } from './MediaContext';
import { MediaDock } from './MediaDock';
import { MediaLibraryPanel } from './MediaLibraryPanel';

const DEFAULT_PREFERENCES: MediaPreferences = Object.freeze({
  volume: 0.7,
  muted: false,
  dockCollapsed: false,
  lastSelectedItemId: null
});

const BUILT_IN_LIBRARY: readonly MediaLibraryItem[] = Object.freeze([
  ...defaultLibrary
]);

const INITIAL_STATE: MediaState = cloneMediaState({
  library: BUILT_IN_LIBRARY,
  favoriteIds: [],
  preferences: DEFAULT_PREFERENCES
});

interface MediaProviderProps {
  readonly children: ReactNode;
  readonly bonusActive: boolean;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function updatePreferences(
  state: MediaState,
  patch: Partial<MediaPreferences>
): MediaState {
  return cloneMediaState({
    ...state,
    preferences: Object.freeze({ ...state.preferences, ...patch })
  });
}

function mergePersistedState(persisted: MediaState): MediaState {
  const customItems = persisted.library.filter((item) => item.origin === 'custom');
  const library = mergeMediaLibraries(BUILT_IN_LIBRARY, customItems);
  const requestedItemId = persisted.preferences.lastSelectedItemId;
  const lastSelectedItemId =
    requestedItemId !== null && library.some((item) => item.id === requestedItemId)
      ? requestedItemId
      : null;

  return cloneMediaState({
    library,
    favoriteIds: persisted.favoriteIds,
    preferences: {
      ...persisted.preferences,
      lastSelectedItemId
    }
  });
}

export function MediaProvider({ children, bonusActive }: MediaProviderProps) {
  const [memoryRepository] = useState(() => createMemoryMediaRepository());
  const [repository] = useState<MediaRepository>(() =>
    typeof indexedDB === 'undefined'
      ? memoryRepository
      : createIndexedDbMediaRepository(indexedDB)
  );
  const repositoryRef = useRef<MediaRepository>(repository);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<MediaState>(INITIAL_STATE);
  const [playback, dispatchPlayback] = useReducer(
    reducePlaybackState,
    DEFAULT_PREFERENCES,
    createInitialPlaybackState
  );
  const [panelOpen, setPanelOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    repositoryRef.current
      .load()
      .then((persisted) => {
        if (cancelled) return;
        if (persisted !== null) {
          const next = mergePersistedState(persisted);
          setState(next);
          dispatchPlayback({
            type: 'SET_BASE_VOLUME',
            volume: next.preferences.volume
          });
          dispatchPlayback({
            type: 'SET_MUTED',
            muted: next.preferences.muted
          });
          dispatchPlayback({
            type: 'SET_SELECTED_ITEM',
            itemId: next.preferences.lastSelectedItemId
          });
        }
        setHydrated(true);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        repositoryRef.current = memoryRepository;
        setNotice(
          `${errorMessage(error, '讀取媒體設定失敗。')} 已改用暫存模式，遊戲仍可正常使用。`
        );
        setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [memoryRepository]);

  useEffect(() => {
    if (!hydrated) return;
    const snapshot = cloneMediaState(state);
    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(() => repositoryRef.current.save(snapshot))
      .catch((error: unknown) => {
        repositoryRef.current = memoryRepository;
        setNotice(
          `${errorMessage(error, '儲存媒體設定失敗。')} 已改用暫存模式，遊戲仍可正常使用。`
        );
        return memoryRepository.save(snapshot);
      });
  }, [hydrated, memoryRepository, state]);

  useEffect(() => {
    const updateOnlineState = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineState);
    window.addEventListener('offline', updateOnlineState);
    return () => {
      window.removeEventListener('online', updateOnlineState);
      window.removeEventListener('offline', updateOnlineState);
    };
  }, []);

  useEffect(() => {
    dispatchPlayback({
      type: bonusActive ? 'BONUS_STARTED' : 'BONUS_ENDED'
    });
  }, [bonusActive]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio === null) return;
    audio.volume = playback.effectiveVolume;
    audio.muted = playback.muted;
  }, [playback.effectiveVolume, playback.muted]);

  const activeItem = useMemo(
    () =>
      playback.activeItemId === null
        ? null
        : state.library.find((item) => item.id === playback.activeItemId) ?? null,
    [playback.activeItemId, state.library]
  );

  const openPanel = useCallback(() => setPanelOpen(true), []);

  const pauseAll = useCallback(() => {
    audioRef.current?.pause();
    dispatchPlayback({ type: 'PAUSE_ALL' });
  }, []);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    if (playback.activeSource === 'youtube') pauseAll();
  }, [pauseAll, playback.activeSource]);

  const clearNotice = useCallback(() => setNotice(null), []);

  const addCustomItem = useCallback(
    (input: CreateCustomMediaItemInput): MediaLibraryItem => {
      const item = createCustomMediaItem(input, new Date().toISOString());
      setState((current) =>
        cloneMediaState({
          ...current,
          library: mergeMediaLibraries(current.library, [item])
        })
      );
      setNotice('已加入自訂媒體。');
      return item;
    },
    []
  );

  const removeItem = useCallback(
    (itemId: string) => {
      if (playback.activeItemId === itemId) {
        audioRef.current?.pause();
        dispatchPlayback({ type: 'SET_SELECTED_ITEM', itemId: null });
      }
      setState((current) =>
        cloneMediaState({
          ...current,
          library: removeCustomMediaItem(current.library, itemId),
          favoriteIds: current.favoriteIds.filter((id) => id !== itemId),
          preferences: {
            ...current.preferences,
            lastSelectedItemId:
              current.preferences.lastSelectedItemId === itemId
                ? null
                : current.preferences.lastSelectedItemId
          }
        })
      );
    },
    [playback.activeItemId]
  );

  const toggleFavorite = useCallback((itemId: string) => {
    setState((current) =>
      cloneMediaState({
        ...current,
        favoriteIds: toggleMediaFavorite(current.favoriteIds, itemId)
      })
    );
  }, []);

  const moveCustomItem = useCallback(
    (itemId: string, direction: -1 | 1) => {
      setState((current) => {
        const customIds = current.library
          .filter((item) => item.origin === 'custom')
          .map((item) => item.id);
        const index = customIds.indexOf(itemId);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= customIds.length) return current;
        const nextIds = [...customIds];
        [nextIds[index], nextIds[target]] = [nextIds[target] as string, nextIds[index] as string];
        return cloneMediaState({
          ...current,
          library: reorderCustomMediaItems(current.library, nextIds)
        });
      });
    },
    []
  );

  const playItem = useCallback(
    async (itemId: string): Promise<void> => {
      const item = state.library.find((candidate) => candidate.id === itemId);
      if (item === undefined || !item.enabled) {
        setNotice('找不到可播放的媒體項目。');
        return;
      }
      if (!isOnline) {
        setNotice('目前離線，網路媒體暫時無法播放；成語遊戲仍可使用。');
        return;
      }

      setState((current) =>
        updatePreferences(current, { lastSelectedItemId: item.id })
      );
      const audio = audioRef.current;

      if (item.type === 'radio') {
        if (audio === null) {
          setNotice('音訊播放器尚未準備完成。');
          return;
        }
        audio.pause();
        audio.src = item.canonicalUrl;
        try {
          await audio.play();
          dispatchPlayback({ type: 'PLAY_RADIO', itemId: item.id });
          setNotice(null);
        } catch (error: unknown) {
          dispatchPlayback({ type: 'PAUSE_ALL' });
          setNotice(errorMessage(error, '此電台目前無法播放。'));
        }
        return;
      }

      audio?.pause();
      dispatchPlayback({ type: 'PLAY_YOUTUBE', itemId: item.id });
      setPanelOpen(true);
      setNotice(null);
    },
    [isOnline, state.library]
  );

  const playAdjacent = useCallback(
    async (direction: -1 | 1): Promise<void> => {
      const enabled = state.library.filter((item) => item.enabled);
      if (enabled.length === 0) {
        setNotice('目前沒有可播放的媒體。');
        return;
      }
      const currentIndex = enabled.findIndex(
        (item) => item.id === playback.activeItemId
      );
      const start = currentIndex < 0 ? 0 : currentIndex;
      const target = (start + direction + enabled.length) % enabled.length;
      const item = enabled[target];
      if (item !== undefined) await playItem(item.id);
    },
    [playItem, playback.activeItemId, state.library]
  );

  const playPrevious = useCallback(
    () => playAdjacent(-1),
    [playAdjacent]
  );
  const playNext = useCallback(() => playAdjacent(1), [playAdjacent]);

  const setVolume = useCallback((volume: number) => {
    dispatchPlayback({ type: 'SET_BASE_VOLUME', volume });
    setState((current) => updatePreferences(current, { volume }));
  }, []);

  const setMuted = useCallback((muted: boolean) => {
    dispatchPlayback({ type: 'SET_MUTED', muted });
    setState((current) => updatePreferences(current, { muted }));
  }, []);

  const setDockCollapsed = useCallback((dockCollapsed: boolean) => {
    setState((current) => updatePreferences(current, { dockCollapsed }));
  }, []);

  const exportBackup = useCallback(() => {
    const content = exportMediaBackup({
      state,
      exportedAt: new Date().toISOString()
    });
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `cicg-media-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importBackup = useCallback(
    (json: string): MediaImportSummary => {
      const result = importMediaBackup(json, state);
      audioRef.current?.pause();
      setState(result.state);
      dispatchPlayback({
        type: 'SET_BASE_VOLUME',
        volume: result.state.preferences.volume
      });
      dispatchPlayback({
        type: 'SET_MUTED',
        muted: result.state.preferences.muted
      });
      dispatchPlayback({
        type: 'SET_SELECTED_ITEM',
        itemId: result.state.preferences.lastSelectedItemId
      });
      setNotice(
        `匯入完成：新增 ${result.summary.added}、略過 ${result.summary.skipped}、失敗 ${result.summary.failed}。`
      );
      return result.summary;
    },
    [state]
  );

  const controller = useMemo<MediaController>(
    () => ({
      state,
      playback,
      activeItem,
      panelOpen,
      isOnline,
      hydrated,
      notice,
      openPanel,
      closePanel,
      clearNotice,
      addCustomItem,
      removeItem,
      toggleFavorite,
      moveCustomItem,
      playItem,
      playPrevious,
      playNext,
      pauseAll,
      setVolume,
      setMuted,
      setDockCollapsed,
      exportBackup,
      importBackup
    }),
    [
      activeItem,
      addCustomItem,
      clearNotice,
      closePanel,
      exportBackup,
      hydrated,
      importBackup,
      isOnline,
      moveCustomItem,
      notice,
      openPanel,
      panelOpen,
      pauseAll,
      playItem,
      playNext,
      playPrevious,
      playback,
      removeItem,
      setDockCollapsed,
      setMuted,
      setVolume,
      state,
      toggleFavorite
    ]
  );

  return (
    <MediaContext.Provider value={controller}>
      {children}
      <MediaDock />
      <MediaLibraryPanel />
    </MediaContext.Provider>
  );
}
