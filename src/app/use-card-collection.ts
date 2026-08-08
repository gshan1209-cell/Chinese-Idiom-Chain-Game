import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { IDIOM_CARD_DEFINITIONS } from '../cards/card-definitions';
import { createCollectionWriteQueue } from '../cards/collection-write-queue';
import { createIndexedDbCardCollectionRepository } from '../cards/indexeddb-collection-repository';
import { CHAPTER_ONE_CARD_DIFFICULTY_BY_ID } from '../cards/generated-card-difficulties';
import { syncCardCollectionLevelRewards } from '../cards/collection-service';
import type {
  ActiveIdiomReference,
  CardCollectionRepository,
  RandomSource
} from '../cards/card-types';
import type { CampaignProgress } from '../domain/progress';
import { loadDictionary } from '../idioms/load-dictionary';
import { PUZZLE_LEVELS } from '../puzzle/levels';

export const COLLECTION_STORAGE_WARNING = '目前無法保存圖卡收藏；闖關進度不受影響。';

const EMPTY_ACTIVE_IDIOMS: readonly ActiveIdiomReference[] = Object.freeze([]);

function currentTimestamp(): string {
  return new Date().toISOString();
}

function createBrowserRandomSource(): RandomSource {
  return Object.freeze({
    next: () => globalThis.Math.random()
  });
}

async function loadActiveIdiomReferences(): Promise<readonly ActiveIdiomReference[]> {
  const dictionary = await loadDictionary();
  return Object.freeze(
    dictionary.payload.idioms
      .filter((idiom) => idiom.enabled)
      .map((idiom) => Object.freeze({ id: idiom.id, text: idiom.text }))
  );
}

export function useCardCollection(
  progress: CampaignProgress,
  progressLoading: boolean
) {
  const repository = useMemo<CardCollectionRepository | null>(() => {
    const factory = globalThis.indexedDB;
    return factory === undefined
      ? null
      : createIndexedDbCardCollectionRepository(factory, currentTimestamp());
  }, []);
  const writeQueue = useMemo(() => createCollectionWriteQueue(), []);
  const random = useMemo(() => createBrowserRandomSource(), []);
  const difficultyById = useMemo(
    () => CHAPTER_ONE_CARD_DIFFICULTY_BY_ID,
    []
  );
  const dictionaryPromiseRef = useRef<Promise<readonly ActiveIdiomReference[]> | null>(null);
  const initialSyncStartedRef = useRef(false);
  const [pendingGrantCount, setPendingGrantCount] = useState(0);
  const [latestResolvedGrantId, setLatestResolvedGrantId] = useState<
    string | null
  >(null);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  const getActiveIdioms = useCallback(() => {
    if (dictionaryPromiseRef.current !== null) {
      return dictionaryPromiseRef.current;
    }
    const promise = loadActiveIdiomReferences();
    dictionaryPromiseRef.current = promise;
    void promise.catch(() => {
      if (dictionaryPromiseRef.current === promise) {
        dictionaryPromiseRef.current = null;
      }
    });
    return promise;
  }, []);

  const syncAfterProgressSaved = useCallback((savedProgress: CampaignProgress): Promise<void> => {
    if (repository === null) {
      setStorageWarning(COLLECTION_STORAGE_WARNING);
      return Promise.reject(new Error(COLLECTION_STORAGE_WARNING));
    }

    return writeQueue.enqueue(async () => {
      try {
        const activeIdioms = IDIOM_CARD_DEFINITIONS.length === 0
          ? EMPTY_ACTIVE_IDIOMS
          : await getActiveIdioms();
        const result = await syncCardCollectionLevelRewards({
          repository,
          levels: PUZZLE_LEVELS,
          progress: savedProgress,
          definitions: IDIOM_CARD_DEFINITIONS,
          activeIdioms,
          difficultyById,
          random,
          now: currentTimestamp()
        });
        setPendingGrantCount(result.pendingGrantCount);
        const latestResolved = [...result.state.grants]
          .filter((grant) =>
            'campaignOrdinal' in grant && grant.status !== 'pending'
          )
          .sort((left, right) => {
            if (!('campaignOrdinal' in left) || !('campaignOrdinal' in right)) {
              return 0;
            }
            return left.campaignOrdinal - right.campaignOrdinal;
          })
          .at(-1);
        setLatestResolvedGrantId(latestResolved?.rewardId ?? null);
        setStorageWarning(null);
      } catch (error) {
        setStorageWarning(COLLECTION_STORAGE_WARNING);
        throw error;
      }
    });
  }, [difficultyById, getActiveIdioms, random, repository, writeQueue]);

  useEffect(() => {
    if (progressLoading || initialSyncStartedRef.current) return;
    initialSyncStartedRef.current = true;
    void syncAfterProgressSaved(progress).catch(() => undefined);
  }, [progress, progressLoading, syncAfterProgressSaved]);

  const clearCollection = useCallback((): Promise<void> => {
    if (repository === null) {
      setStorageWarning(COLLECTION_STORAGE_WARNING);
      return Promise.reject(new Error(COLLECTION_STORAGE_WARNING));
    }
    return writeQueue.enqueue(async () => {
      try {
        await repository.clear(currentTimestamp());
        setPendingGrantCount(0);
        setLatestResolvedGrantId(null);
        setStorageWarning(null);
      } catch (error) {
        setStorageWarning(COLLECTION_STORAGE_WARNING);
        throw error;
      }
    });
  }, [repository, writeQueue]);

  return Object.freeze({
    pendingGrantCount,
    latestResolvedGrantId,
    storageWarning,
    syncAfterProgressSaved,
    clearCollection
  });
}
