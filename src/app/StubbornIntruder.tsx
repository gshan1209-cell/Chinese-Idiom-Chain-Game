import type { AnimationEvent, PointerEvent } from 'react';

import type { StubbornIntruder as StubbornIntruderState } from '../domain/trap';
import { playStubbornHitFeedback } from './trap-feedback';

export interface StubbornIntruderProps {
  readonly intruder: StubbornIntruderState;
  readonly onHit: (id: string, nowMs: number) => void;
  readonly onEjectionComplete: (id: string) => void;
}

export function StubbornIntruder({
  intruder,
  onHit,
  onEjectionComplete
}: StubbornIntruderProps) {
  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    if (intruder.status !== 'active') return;

    const nextHitStreak = Math.min(
      intruder.requiredHitCount,
      intruder.currentHitStreak + 1
    );
    playStubbornHitFeedback(nextHitStreak);
    onHit(intruder.id, performance.now());
  };

  const handleAnimationEnd = (event: AnimationEvent<HTMLButtonElement>) => {
    if (event.currentTarget !== event.target) return;
    if (intruder.status === 'ejecting') {
      onEjectionComplete(intruder.id);
    }
  };

  return (
    <button
      className={`stubborn-intruder ${intruder.status} hit-${intruder.currentHitStreak}`}
      type="button"
      aria-label={`頑固伏字，已拔除 ${intruder.currentHitStreak}/3`}
      onPointerDown={handlePointerDown}
      onAnimationEnd={handleAnimationEnd}
    >
      <span aria-hidden="true">{intruder.character}</span>
      <small aria-hidden="true">{intruder.currentHitStreak}/3</small>
    </button>
  );
}
