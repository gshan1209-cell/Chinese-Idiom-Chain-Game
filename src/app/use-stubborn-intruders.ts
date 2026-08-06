import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Idiom } from '../domain/idiom';
import type { PuzzleBoard, PuzzleSession } from '../domain/puzzle';
import type {
  PuzzlePlayMode,
  StubbornIntruderSession
} from '../domain/trap';
import {
  activateNextDueStubbornIntruder,
  clearStubbornIntruderForHint,
  completeStubbornEjection,
  createStubbornIntruderSession,
  getVisibleStubbornIntruders,
  hitStubbornIntruder,
  isStubbornTargetBlocked,
  reconcileStubbornIntruders,
  recordStubbornPuzzleAction,
  recordStubbornValidPlacement
} from '../traps/stubborn-intruder-engine';

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

interface StubbornIntruderHookState {
  readonly board: PuzzleBoard;
  readonly contextKey: string;
  readonly dictionaryReady: boolean;
  readonly session: StubbornIntruderSession;
}

export interface UseStubbornIntrudersOptions {
  readonly board: PuzzleBoard;
  readonly puzzleSession: PuzzleSession;
  readonly mode: PuzzlePlayMode;
  readonly idioms: readonly Idiom[];
  readonly excludedCharacters: readonly string[];
  readonly excludedTargetCellKeys: readonly string[];
  readonly nextAutoCellKey: string | null;
}

function contextKeyFor(options: UseStubbornIntrudersOptions): string {
  return [
    options.board.level.id,
    options.mode,
    options.excludedCharacters.join(''),
    options.excludedTargetCellKeys.join(',')
  ].join(':');
}

function dynamicExcludedTargetKeys(
  puzzleSession: PuzzleSession,
  nextAutoCellKey: string | null
): readonly string[] {
  return Object.freeze([
    ...(puzzleSession.selectedCellKey === null ? [] : [puzzleSession.selectedCellKey]),
    ...(nextAutoCellKey === null ? [] : [nextAutoCellKey])
  ]);
}

function makeHookState(
  options: UseStubbornIntrudersOptions,
  validPlacements: number,
  actionCount: number
): StubbornIntruderHookState {
  return Object.freeze({
    board: options.board,
    contextKey: contextKeyFor(options),
    dictionaryReady: options.idioms.length > 0,
    session: createStubbornIntruderSession({
      board: options.board,
      puzzleSession: options.puzzleSession,
      idioms: options.idioms,
      mode: options.mode,
      excludedCharacters: options.excludedCharacters,
      excludedTargetCellKeys: options.excludedTargetCellKeys,
      selectedCellKey: options.puzzleSession.selectedCellKey,
      nextAutoCellKey: options.nextAutoCellKey,
      orderCharacters: shuffled,
      orderCellKeys: shuffled,
      validPlacements,
      actionCount
    })
  });
}

export function useStubbornIntruders(options: UseStubbornIntrudersOptions) {
  const {
    board,
    puzzleSession,
    mode,
    idioms,
    excludedCharacters,
    excludedTargetCellKeys,
    nextAutoCellKey
  } = options;
  const contextKey = contextKeyFor(options);
  const [state, setState] = useState<StubbornIntruderHookState>(() =>
    makeHookState(options, 0, 0)
  );

  useEffect(() => {
    setState((current) => {
      const boardChanged = current.board !== board;
      const contextChanged = current.contextKey !== contextKey || boardChanged;
      const dictionaryBecameReady =
        !current.dictionaryReady && idioms.length > 0;
      if (!contextChanged && !dictionaryBecameReady) return current;
      return makeHookState(
        {
          board,
          puzzleSession,
          mode,
          idioms,
          excludedCharacters,
          excludedTargetCellKeys,
          nextAutoCellKey
        },
        contextChanged ? 0 : current.session.validPlacements,
        contextChanged ? 0 : current.session.actionCount
      );
    });
  }, [
    board,
    contextKey,
    excludedCharacters,
    excludedTargetCellKeys,
    idioms,
    mode,
    nextAutoCellKey,
    puzzleSession
  ]);

  const recordValidPlacement = useCallback((
    nextPuzzleSession: PuzzleSession,
    nextNavigationCellKey: string | null = null
  ) => {
    setState((current) => {
      const advanced = recordStubbornValidPlacement(current.session);
      const session = reconcileStubbornIntruders(
        advanced,
        nextPuzzleSession,
        dynamicExcludedTargetKeys(nextPuzzleSession, nextNavigationCellKey)
      );
      return session === current.session
        ? current
        : Object.freeze({ ...current, session });
    });
  }, []);

  const recordPuzzleAction = useCallback((
    nextPuzzleSession: PuzzleSession,
    nextNavigationCellKey: string | null = null
  ) => {
    setState((current) => {
      const advanced = recordStubbornPuzzleAction(current.session);
      const session = reconcileStubbornIntruders(
        advanced,
        nextPuzzleSession,
        dynamicExcludedTargetKeys(nextPuzzleSession, nextNavigationCellKey)
      );
      return session === current.session
        ? current
        : Object.freeze({ ...current, session });
    });
  }, []);

  const hitIntruder = useCallback((id: string, nowMs: number) => {
    setState((current) => {
      const session = hitStubbornIntruder(current.session, id, nowMs);
      return session === current.session
        ? current
        : Object.freeze({ ...current, session });
    });
  }, []);

  const completeEjection = useCallback((id: string) => {
    setState((current) => {
      const completed = completeStubbornEjection(current.session, id);
      const session = activateNextDueStubbornIntruder(completed);
      return session === current.session
        ? current
        : Object.freeze({ ...current, session });
    });
  }, []);

  const prepareHint = useCallback((targetCellKey: string) => {
    setState((current) => {
      const session = clearStubbornIntruderForHint(
        current.session,
        targetCellKey
      );
      return session === current.session
        ? current
        : Object.freeze({ ...current, session });
    });
  }, []);

  const visibleIntruders = useMemo(
    () => state.contextKey === contextKey && state.board === board
      ? getVisibleStubbornIntruders(state.session)
      : Object.freeze([]),
    [board, contextKey, state]
  );
  const reservedCharacters = useMemo(
    () => Object.freeze(
      state.session.intruders
        .filter((intruder) => intruder.status !== 'removed')
        .map((intruder) => intruder.character)
    ),
    [state.session]
  );
  const reservedTargetCellKeys = useMemo(
    () => Object.freeze(
      state.session.intruders
        .filter((intruder) => intruder.status !== 'removed')
        .map((intruder) => intruder.targetCellKey)
    ),
    [state.session]
  );
  const isCellBlocked = useCallback(
    (targetCellKey: string) => isStubbornTargetBlocked(
      state.session,
      targetCellKey
    ),
    [state.session]
  );

  return {
    session: state.session,
    visibleIntruders,
    reservedCharacters,
    reservedTargetCellKeys,
    recordValidPlacement,
    recordPuzzleAction,
    hitIntruder,
    completeEjection,
    prepareHint,
    isCellBlocked
  };
}
