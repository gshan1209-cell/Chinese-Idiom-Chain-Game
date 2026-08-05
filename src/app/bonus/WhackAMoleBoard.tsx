import { useEffect, useMemo } from 'react';

import type { BonusRound } from '../../domain/bonus';
import { MoleHole } from './MoleHole';

interface WhackAMoleBoardProps {
  readonly round: BonusRound;
  readonly onHit: (questionId: string, holeIndex: number) => void;
}

export function WhackAMoleBoard({ round, onHit }: WhackAMoleBoardProps) {
  const question = round.question;
  const holeCount = question?.holeCount ?? 6;
  const choices = useMemo(
    () =>
      new Map(
        question?.choices.map((choice) => [choice.holeIndex, choice.character]) ?? []
      ),
    [question]
  );
  const disabled = round.phase !== 'active' || question === null;

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (disabled || question === null || !/^[1-9]$/.test(event.key)) return;
      const holeIndex = Number(event.key) - 1;
      if (!choices.has(holeIndex)) return;
      event.preventDefault();
      onHit(question.id, holeIndex);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [choices, disabled, onHit, question]);

  const seconds = (round.remainingMs / 1000).toFixed(1);
  const timerPercent = Math.max(
    0,
    Math.min(100, (round.remainingMs / 15_000) * 100)
  );

  return (
    <main className="app-shell bonus-screen">
      <section className="bonus-panel whack-board" aria-labelledby="whack-title">
        <div className="bonus-score-row">
          <span>命中 <strong>{round.correctCount}</strong></span>
          <span>連擊 <strong>{round.combo}</strong></span>
          <span>分數 <strong>{round.score}</strong></span>
        </div>
        <div className="timer-row">
          <span>剩餘時間</span>
          <strong>{seconds} 秒</strong>
        </div>
        <div className="timer-track" aria-hidden="true">
          <span style={{ width: `${timerPercent}%` }} />
        </div>
        <p className="eyebrow">補上最後一字</p>
        <h1 id="whack-title" className="whack-prompt">
          {question?.prompt ?? '準備結算'}
        </h1>

        <div className="mole-grid" aria-label="成語打地鼠候選字">
          {Array.from({ length: holeCount }, (_, holeIndex) => (
            <MoleHole
              key={holeIndex}
              holeIndex={holeIndex}
              character={choices.get(holeIndex) ?? null}
              disabled={disabled}
              onHit={(index) => question !== null && onHit(question.id, index)}
            />
          ))}
        </div>

        <div className="bonus-feedback" aria-live="polite">
          {round.feedback?.kind === 'correct'
            ? round.feedback.message
            : '點擊地鼠，或按鍵盤 1～9。'}
        </div>
        {round.phase === 'feedback' &&
        round.feedback?.correctIdiomText !== null ? (
          <div className="correct-reveal" role="status">
            正確答案：<strong>{round.feedback?.correctIdiomText}</strong>
          </div>
        ) : null}
        {round.phase === 'paused' ? (
          <p className="paused-note" role="status">遊戲已暫停</p>
        ) : null}
      </section>
    </main>
  );
}
