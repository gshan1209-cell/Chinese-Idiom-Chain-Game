import type { BoardIntruder as BoardIntruderState } from '../domain/trap';

export interface BoardIntruderProps {
  readonly intruder: BoardIntruderState;
  readonly onChoose: (id: string) => void;
  readonly onRevealComplete: (id: string) => void;
  readonly onEjectionComplete: (id: string) => void;
}

export function BoardIntruder({
  intruder,
  onChoose,
  onRevealComplete,
  onEjectionComplete
}: BoardIntruderProps) {
  return (
    <button
      className={`board-intruder ${intruder.status}`}
      type="button"
      aria-label={`怪字 ${intruder.character}，按下可拔除`}
      aria-disabled={intruder.status === 'ejecting'}
      onClick={(event) => {
        event.stopPropagation();
        if (intruder.status === 'active' || intruder.status === 'revealing') {
          onChoose(intruder.id);
        }
      }}
      onAnimationEnd={() => {
        if (intruder.status === 'revealing') onRevealComplete(intruder.id);
        if (intruder.status === 'ejecting') onEjectionComplete(intruder.id);
      }}
    >
      {intruder.character}
    </button>
  );
}
