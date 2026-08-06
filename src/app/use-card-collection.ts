import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { IDIOM_CARD_DEFINITIONS } from '../cards/card-definitions';
import { createCollectionWriteQueue } from '../cards/collection-write-queue';
import { createIndexedDbCardCollectionRepository } from '../cards/indexeddb-collection-repository';
import { countCompletedUniqueMainLevels } from '../cards/milestone-grants';
import { syncCardCollectionMilestones } from '../cards/collection-service';
import type {
  ActiveIdiomReference,
  CardCollectionRepository,
  RandomSource
} from '../cards/card-types';
import type { CampaignProgress } from '../domain/progress';
import { loadDictionary } from '../idioms/load-dictionary';

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
  const dictionaryPromiseRef = useRef<Promise<readonly ActiveIdiomReference[]> | null>(null);
  const initialSyncStartedRef = useRef(false);
  const [pendingGrantCount, setPendingGrantCount] = useState(0);
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
        const result = await syncCardCollectionMilestones({
          repository,
          completedUniqueMainLevels: countCompletedUniqueMainLevels(savedProgress),
          definitions: IDIOM_CARD_DEFINITIONS,
          activeIdioms,
          random,
          now: currentTimestamp()
        });
        setPendingGrantCount(result.pendingGrantCount);
        setStorageWarning(null);
      } catch (error) {
        setStorageWarning(COLLECTION_STORAGE_WARNING);
        throw error;
      }
    });
  }, [getActiveIdioms, random, repository, writeQueue]);

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
        setStorageWarning(null);
      } catch (error) {
        setStorageWarning(COLLECTION_STORAGE_WARNING);
        throw error;
      }
    });
  }, [repository, writeQueue]);

  return Object.freeze({
    pendingGrantCount,
    storageWarning,
    syncAfterProgressSaved,
    clearCollection
  });
}
