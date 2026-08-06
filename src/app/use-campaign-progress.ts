import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { CampaignProgress, LevelCompletionResult } from '../domain/progress';
import { PUZZLE_LEVELS } from '../puzzle/levels';
import { createIndexedDbProgressRepository } from '../progress/indexeddb-progress-repository';
import {
  createInitialCampaignProgress,
  recordLevelCompletion,
  recordLevelStarted
} from '../progress/progress-engine';
import type { CampaignProgressRepository } from '../progress/progress-repository';
import { createProgressWriteQueue } from '../progress/progress-write-queue';

const TOTAL_LEVELS = PUZZLE_LEVELS.length;
const STORAGE_WARNING = '目前無法保存本機進度；本次仍可正常遊玩。';

export interface CampaignCompletionPersistence {
  readonly progress: CampaignProgress;
  readonly persisted: Promise<void>;
}

function now(): string {
  return new Date().toISOString();
}

export function useCampaignProgress() {
  const repository = useMemo<CampaignProgressRepository | null>(() => {
    const factory = globalThis.indexedDB;
    return factory === undefined ? null : createIndexedDbProgressRepository(factory);
  }, []);
  const writeQueue = useMemo(() => createProgressWriteQueue(), []);
  const initialProgress = useMemo(
    () => createInitialCampaignProgress(TOTAL_LEVELS, now()),
    []
  );
  const [progress, setProgress] = useState<CampaignProgress>(initialProgress);
  const progressRef = useRef(progress);
  const [loading, setLoading] = useState(true);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  const setCurrentProgress = useCallback((next: CampaignProgress) => {
    progressRef.current = next;
    setProgress(next);
  }, []);

  const persist = useCallback((next: CampaignProgress): Promise<void> => {
    if (repository === null) {
      setStorageWarning(STORAGE_WARNING);
      return Promise.reject(new Error(STORAGE_WARNING));
    }
    const persisted = writeQueue.enqueue(() => repository.save(next));
    void persisted.then(
      () => setStorageWarning(null),
      () => setStorageWarning(STORAGE_WARNING)
    );
    return persisted;
  }, [repository, writeQueue]);

  useEffect(() => {
    let active = true;
    if (repository === null) {
      setStorageWarning(STORAGE_WARNING);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    void repository.load(TOTAL_LEVELS).then(
      (loaded) => {
        if (!active) return;
        setCurrentProgress(loaded);
        setStorageWarning(null);
      },
      () => {
        if (!active) return;
        setStorageWarning(STORAGE_WARNING);
      }
    ).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [repository, setCurrentProgress]);

  const startLevel = useCallback((levelNumber: number): CampaignProgress => {
    const next = recordLevelStarted(
      progressRef.current,
      levelNumber,
      TOTAL_LEVELS,
      now()
    );
    setCurrentProgress(next);
    void persist(next).catch(() => undefined);
    return next;
  }, [persist, setCurrentProgress]);

  const completeLevel = useCallback((
    result: LevelCompletionResult
  ): CampaignCompletionPersistence => {
    const next = recordLevelCompletion(
      progressRef.current,
      result,
      TOTAL_LEVELS,
      now()
    );
    setCurrentProgress(next);
    const persisted = persist(next);
    return Object.freeze({ progress: next, persisted });
  }, [persist, setCurrentProgress]);

  const clearProgress = useCallback(() => {
    const next = createInitialCampaignProgress(TOTAL_LEVELS, now());
    setCurrentProgress(next);
    if (repository === null) {
      setStorageWarning(STORAGE_WARNING);
      return;
    }
    void writeQueue.enqueue(() => repository.clear()).then(
      () => setStorageWarning(null),
      () => setStorageWarning(STORAGE_WARNING)
    );
  }, [repository, setCurrentProgress, writeQueue]);

  return {
    progress,
    loading,
    storageWarning,
    startLevel,
    completeLevel,
    clearProgress
  };
}
