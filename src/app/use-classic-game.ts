import { useCallback, useEffect, useState } from 'react';

import type { GameSession, TurnErrorCode } from '../domain/game';
import {
  createClassicSession,
  requestClassicHint,
  submitClassicTurn
} from '../game/game-engine';
import type { IdiomIndex } from '../idioms/idiom-index';
import { loadDictionary } from '../idioms/load-dictionary';

export type FeedbackTone = 'info' | 'success' | 'error';

export interface GameFeedback {
  readonly tone: FeedbackTone;
  readonly message: string;
}

export interface ClassicGameController {
  readonly loading: boolean;
  readonly loadError: string | null;
  readonly session: GameSession | null;
  readonly input: string;
  readonly feedback: GameFeedback | null;
  readonly hintText: string | null;
  readonly canStart: boolean;
  setInput(value: string): void;
  startGame(): void;
  submitAnswer(): void;
  requestHint(): void;
  restartGame(): void;
  retryLoad(): void;
}

const ERROR_MESSAGES: Readonly<Record<TurnErrorCode, string>> = {
  IDIOM_NOT_FOUND: '字典裡找不到這個四字成語。',
  CHAIN_CHAR_MISMATCH: '第一個字沒有接上上一題的最後一字。',
  IDIOM_ALREADY_USED: '這個成語本局已經使用過了。',
  NO_AVAILABLE_CANDIDATE: '目前沒有可接續的成語。',
  SESSION_ENDED: '本局已經結束，請重新開始。',
  DICTIONARY_UNAVAILABLE: '成語字典尚未準備完成。'
};

function normalizeInput(value: string): string {
  return [...value.replace(/\s/g, '')].slice(0, 4).join('');
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '成語字典載入失敗，請稍後再試。';
}

export function useClassicGame(): ClassicGameController {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [index, setIndex] = useState<IdiomIndex | null>(null);
  const [session, setSession] = useState<GameSession | null>(null);
  const [input, setInputState] = useState('');
  const [feedback, setFeedback] = useState<GameFeedback | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);

    void loadDictionary()
      .then((loaded) => {
        if (!active) return;
        setIndex(loaded.index);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setIndex(null);
        setLoading(false);
        setLoadError(errorMessage(error));
      });

    return () => {
      active = false;
    };
  }, [loadAttempt]);

  const startGame = useCallback(() => {
    if (index === null) {
      setFeedback({ tone: 'error', message: ERROR_MESSAGES.DICTIONARY_UNAVAILABLE });
      return;
    }
    try {
      setSession(createClassicSession(index));
      setInputState('');
      setHintText(null);
      setFeedback({ tone: 'info', message: '請接出下一個四字成語。' });
    } catch (error: unknown) {
      setFeedback({ tone: 'error', message: errorMessage(error) });
    }
  }, [index]);

  const submitAnswer = useCallback(() => {
    if (index === null || session === null) return;
    const normalized = normalizeInput(input);
    if (normalized.length !== 4) {
      setFeedback({ tone: 'error', message: '請輸入完整的四字成語。' });
      return;
    }

    const outcome = submitClassicTurn(session, normalized, index);
    setSession(outcome.session);
    setHintText(null);

    if (!outcome.result.correct) {
      const code = outcome.result.errorCode ?? 'IDIOM_NOT_FOUND';
      setFeedback({ tone: 'error', message: ERROR_MESSAGES[code] });
      return;
    }

    setInputState('');
    if (outcome.session.result === 'completed') {
      setFeedback({ tone: 'success', message: '這條接龍已經完整走到底！' });
      return;
    }
    setFeedback({
      tone: 'success',
      message: `答對了，獲得 ${outcome.result.scoreDelta} 分！`
    });
  }, [index, input, session]);

  const showHint = useCallback(() => {
    if (index === null || session === null) return;
    const outcome = requestClassicHint(session, index);
    setSession(outcome.session);
    if (outcome.idiom === null) {
      setHintText(null);
      setFeedback({ tone: 'info', message: '已經沒有未使用的接續成語。' });
      return;
    }
    setHintText(outcome.idiom.text);
    setFeedback({ tone: 'info', message: '提示會扣 50 分，這次已套用。' });
  }, [index, session]);

  const setInput = useCallback((value: string) => {
    setInputState(normalizeInput(value));
  }, []);

  const retryLoad = useCallback(() => {
    setLoadAttempt((attempt) => attempt + 1);
  }, []);

  return {
    loading,
    loadError,
    session,
    input,
    feedback,
    hintText,
    canStart: index !== null && !loading,
    setInput,
    startGame,
    submitAnswer,
    requestHint: showHint,
    restartGame: startGame,
    retryLoad
  };
}
