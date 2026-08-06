import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Idiom } from '../domain/idiom';
import type { PuzzleBoard } from '../domain/puzzle';
import type { CandidateDecoySession, PuzzlePlayMode } from '../domain/trap';
import {
  beginCandidateDecoyEjection,
  completeCandidateDecoyEjection,
  createCandidateDecoySession,
  getVisibleCandidateDecoys,
  recordValidCandidatePlacement
} from '../traps/candidate-decoy-engine';

function shuffledCharacters(characters: readonly string[]): readonly string[] {
  const result = [...characters];
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

interface CandidateDecoyHookState {
  readonly board: PuzzleBoard;
  readonly contextKey: string;
  readonly dictionaryReady: boolean;
  readonly session: CandidateDecoySession;
}

export interface UseCandidateDecoysOptions {
  readonly board: PuzzleBoard;
  readonly mode: PuzzlePlayMode;
  readonly idioms: readonly Idiom[];
}

function makeHookState(
  options: UseCandidateDecoysOptions,
  validPlacements: number
): CandidateDecoyHookState {
  return Object.freeze({
    board: options.board,
    contextKey: `${options.board.level.id}:${options.mode}`,
    dictionaryReady: options.idioms.length > 0,
    session: createCandidateDecoySession({
      board: options.board,
      idioms: options.idioms,
      mode: options.mode,
      orderCharacters: shuffledCharacters,
      validPlacements
    })
  });
}

export function useCandidateDecoys(options: UseCandidateDecoysOptions) {
  const { board, idioms, mode } = options;
  const contextKey = `${board.level.id}:${mode}`;
  const [state, setState] = useState<CandidateDecoyHookState>(() =>
    makeHookState(options, 0)
  );

  useEffect(() => {
    setState((current) => {
      const boardChanged = current.board !== board;
      const contextChanged = current.contextKey !== contextKey || boardChanged;
      const dictionaryBecameReady =
        !current.dictionaryReady && idioms.length > 0;
      if (!contextChanged && !dictionaryBecameReady) return current;
      return makeHookState(
        { board, idioms, mode },
        contextChanged ? 0 : current.session.validPlacements
      );
    });
  }, [board, contextKey, idioms, mode]);

  const recordValidPlacement = useCallback(() => {
    setState((current) => Object.freeze({
      ...current,
      session: recordValidCandidatePlacement(current.session)
    }));
  }, []);

  const beginEjection = useCallback((id: string) => {
    setState((current) => {
      const session = beginCandidateDecoyEjection(current.session, id);
      return session === current.session
        ? current
        : Object.freeze({ ...current, session });
    });
  }, []);

  const completeEjection = useCallback((id: string) => {
    setState((current) => {
      const session = completeCandidateDecoyEjection(current.session, id);
      return session === current.session
        ? current
        : Object.freeze({ ...current, session });
    });
  }, []);

  const visibleDecoys = useMemo(
    () => state.contextKey === contextKey && state.board === board
      ? getVisibleCandidateDecoys(state.session)
      : Object.freeze([]),
    [board, contextKey, state]
  );

  const reservedCharacters = useMemo(
    () => Object.freeze(
      state.session.decoys.map((decoy) => decoy.character)
    ),
    [state.session.decoys]
  );

  return {
    session: state.session,
    visibleDecoys,
    reservedCharacters,
    recordValidPlacement,
    beginEjection,
    completeEjection
  };
}
