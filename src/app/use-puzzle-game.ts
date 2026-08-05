import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Idiom } from '../domain/idiom';
import type { PuzzleSession } from '../domain/puzzle';
import { loadDictionary } from '../idioms/load-dictionary';
import { buildPuzzleBoard } from '../puzzle/puzzle-board';
import {
  clearPuzzleEntries,
  createPuzzleSession,
  placePuzzleTile,
  removePuzzleCell,
  reorderPuzzleTiles,
  selectPuzzleCell,
  usePuzzleHint
} from '../puzzle/puzzle-engine';
import { PUZZLE_LEVELS } from '../puzzle/levels';

function shuffled<T>(items: readonly T[]): readonly T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = result[index];
    const replacement = result[swapIndex];
    if (current !== undefined && replacement !== undefined) {
      result[index] = replacement;
      result[swapIndex] = current;
    }
  }
  return result;
}

function indexForLevelNumber(levelNumber: number): number {
  if (!Number.isInteger(levelNumber) || levelNumber < 1 || levelNumber > PUZZLE_LEVELS.length) {
    throw new Error(`關卡範圍必須介於 1 到 ${PUZZLE_LEVELS.length}。`);
  }
  return levelNumber - 1;
}

function makeSession(levelIndex: number): PuzzleSession {
  const level = PUZZLE_LEVELS[levelIndex];
  if (level === undefined) throw new Error('找不到指定關卡。');
  return createPuzzleSession(buildPuzzleBoard(level), shuffled);
}

export interface PuzzleFeedback {
  readonly tone: 'info' | 'success' | 'error';
  readonly message: string;
}

export function usePuzzleGame(initialLevelNumber = 1) {
  const initialLevelIndex = indexForLevelNumber(initialLevelNumber);
  const [levelIndex, setLevelIndex] = useState(initialLevelIndex);
  const [session, setSession] = useState<PuzzleSession>(() => makeSession(initialLevelIndex));
  const [feedback, setFeedback] = useState<PuzzleFeedback>({
    tone: 'info',
    message: '先點選空格，再從下方選一個字。'
  });
  const [idiomsById, setIdiomsById] = useState<ReadonlyMap<string, Idiom>>(new Map());

  useEffect(() => {
    let active = true;
    void loadDictionary()
      .then(({ payload }) => {
        if (active) setIdiomsById(new Map(payload.idioms.map((idiom) => [idiom.id, idiom])));
      })
      .catch(() => {
        if (active) setIdiomsById(new Map());
      });
    return () => {
      active = false;
    };
  }, []);

  const level = PUZZLE_LEVELS[levelIndex];
  if (level === undefined) throw new Error('關卡索引超出範圍。');

  const completedIdioms = useMemo(
    () => level.placements.map((placement) => idiomsById.get(placement.idiomId) ?? {
      id: placement.idiomId,
      text: placement.text,
      meaning: '示範關卡內容，正式發布前需完成解釋校訂。',
      example: ''
    }),
    [idiomsById, level]
  );

  const selectCell = useCallback((key: string) => {
    setSession((current) => selectPuzzleCell(current, key));
    setFeedback({ tone: 'info', message: '已選取空格，請從下方選字。' });
  }, []);

  const chooseTile = useCallback((tileId: string) => {
    setSession((current) => {
      const result = placePuzzleTile(current, tileId);
      if (result.session.status === 'completed') {
        setFeedback({ tone: 'success', message: '恭喜過關！所有成語都完成了。' });
      } else if (result.correct) {
        setFeedback({ tone: 'success', message: '答對了，繼續完成其他空格。' });
      } else {
        setFeedback({ tone: 'error', message: '這個字不對，可以再選一次或使用提示。' });
      }
      return result.session;
    });
  }, []);

  const removeSelected = useCallback(() => {
    setSession((current) => {
      if (current.selectedCellKey === null) return current;
      return removePuzzleCell(current, current.selectedCellKey);
    });
    setFeedback({ tone: 'info', message: '已移除目前格子的文字。' });
  }, []);

  const hint = useCallback(() => {
    setSession((current) => {
      const result = usePuzzleHint(current);
      setFeedback(result.hintedCellKey === null
        ? { tone: 'info', message: '本關提示已用完，或盤面已經完成。' }
        : { tone: 'success', message: '已替你填入一個正確的字。' });
      return result.session;
    });
  }, []);

  const clear = useCallback(() => {
    setSession((current) => clearPuzzleEntries(current));
    setFeedback({ tone: 'info', message: '已清除本關自行填入的文字。' });
  }, []);

  const shuffleTiles = useCallback(() => {
    setSession((current) => reorderPuzzleTiles(current, shuffled));
    setFeedback({ tone: 'info', message: '候選字已重新排列。' });
  }, []);

  const openLevelNumber = useCallback((levelNumber: number) => {
    const nextIndex = indexForLevelNumber(levelNumber);
    setLevelIndex(nextIndex);
    setSession(makeSession(nextIndex));
    setFeedback({ tone: 'info', message: '先點選空格，再從下方選一個字。' });
  }, []);

  return {
    level,
    levelIndex,
    totalLevels: PUZZLE_LEVELS.length,
    session,
    feedback,
    completedIdioms,
    selectCell,
    chooseTile,
    removeSelected,
    hint,
    clear,
    shuffleTiles,
    openLevelNumber,
    restartLevel: () => openLevelNumber(level.levelNumber)
  };
}
