import type { CandidateDecoy } from '../domain/trap';

export interface CandidateDecoyTileProps {
  readonly decoy: CandidateDecoy;
  readonly onChoose: (id: string) => void;
  readonly onEjectionComplete: (id: string) => void;
}

export function CandidateDecoyTile({
  decoy,
  onChoose,
  onEjectionComplete
}: CandidateDecoyTileProps) {
  return (
    <button
      className={`candidate-tile candidate-decoy ${decoy.status}`}
      type="button"
      disabled={decoy.status === 'ejecting'}
      aria-label={`陷阱字 ${decoy.character}，點擊踢出`}
      onClick={() => onChoose(decoy.id)}
      onAnimationEnd={() => {
        if (decoy.status === 'ejecting') onEjectionComplete(decoy.id);
      }}
    >
      {decoy.character}
    </button>
  );
}
