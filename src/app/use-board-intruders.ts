import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Idiom } from '../domain/idiom';
import type { PuzzleBoard, PuzzleSession } from '../domain/puzzle';
import type { BoardIntruderSession, PuzzlePlayMode } from '../domain/trap';
import {
  beginBoardIntruderEjection,
  completeBoardIntruderEjection,
  completeBoardIntruderReveal,
  createBoardIntruderSession,
  getVisibleBoardIntruders,
  recordBoardPuzzleAction,
  recordValidBoardPlacement
} from '../traps/board-intruder-engine';

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

interface BoardIntruderHookState {
  readonly board: PuzzleBoard;
  readonly contextKey: string;
  readonly dictionaryReady: boolean;
  readonly session: BoardIntruderSession;
}

export interface UseBoardIntrudersOptions {
  readonly board: PuzzleBoard;
  readonly puzzleSession: PuzzleSession;
  readonly mode: PuzzlePlayMode;
  readonly idioms: readonly Idiom[];
  readonly excludedCharacters: readonly string[];
}

function contextKeyFor(options: UseBoardIntrudersOptions): string {
  return `${options.board.level.id}:${options.mode}:${options.excludedCharacters.join('')}`;
}

function makeHookState(
  options: UseBoardIntrudersOptions,
  validPlacements: number,
  actionCount: number
): BoardIntruderHookState {
  return Object.freeze({
    board: options.board,
    contextKey: contextKeyFor(options),
    dictionaryReady: options.idioms.length > 0,
    session: createBoardIntruderSession({
      board: options.board,
      puzzleSession: options.puzzleSession,
      idioms: options.idioms,
      mode: options.mode,
      excludedCharacters: options.excludedCharacters,
      orderCharacters: shuffled,
      orderCellKeys: shuffled,
      validPlacements,
      actionCount
    })
  });
}

export function useBoardIntruders(options: UseBoardIntrudersOptions) {
  const {
    board,
    puzzleSession,
    mode,
    idioms,
    excludedCharacters
  } = options;
  const contextKey = contextKeyFor(options);
  const [state, setState] = useState<BoardIntruderHookState>(() =>
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
        { board, puzzleSession, mode, idioms, excludedCharacters },
        contextChanged ? 0 : current.session.validPlacements,
        contextChanged ? 0 : current.session.actionCount
      );
    });
  }, [board, contextKey, excludedCharacters, idioms, mode, puzzleSession]);

  const recordValidPlacement = useCallback((nextPuzzleSession: PuzzleSession) => {
    setState((current) => {
      const session = recordValidBoardPlacement(
        current.session,
        nextPuzzleSession
      );
      return session === current.session
        ? current
        : Object.freeze({ ...current, session });
    });
  }, []);

  const recordPuzzleAction = useCallback((nextPuzzleSession: PuzzleSession) => {
    setState((current) => {
      const session = recordBoardPuzzleAction(
        current.session,
        nextPuzzleSession
      );
      return session === current.session
        ? current
        : Object.freeze({ ...current, session });
    });
  }, []);

  const beginEjection = useCallback((id: string) => {
    setState((current) => {
      const session = beginBoardIntruderEjection(current.session, id);
      return session === current.session
        ? current
        : Object.freeze({ ...current, session });
    });
  }, []);

  const completeEjection = useCallback((
    id: string,
    nextPuzzleSession: PuzzleSession
  ) => {
    setState((current) => {
      const session = completeBoardIntruderEjection(
        current.session,
        nextPuzzleSession,
        id
      );
      return session === current.session
        ? current
        : Object.freeze({ ...current, session });
    });
  }, []);

  const completeReveal = useCallback((id: string) => {
    setState((current) => {
      const session = completeBoardIntruderReveal(current.session, id);
      return session === current.session
        ? current
        : Object.freeze({ ...current, session });
    });
  }, []);

  const visibleIntruders = useMemo(
    () => state.contextKey === contextKey && state.board === board
      ? getVisibleBoardIntruders(state.session)
      : Object.freeze([]),
    [board, contextKey, state]
  );

  return {
    session: state.session,
    visibleIntruders,
    recordValidPlacement,
    recordPuzzleAction,
    beginEjection,
    completeEjection,
    completeReveal
  };
}
