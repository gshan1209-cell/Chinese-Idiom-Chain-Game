import { useState } from 'react';

interface MoleHoleProps {
  readonly holeIndex: number;
  readonly character: string | null;
  readonly disabled: boolean;
  readonly onHit: (holeIndex: number) => void;
}

export function MoleHole({
  holeIndex,
  character,
  disabled,
  onHit
}: MoleHoleProps) {
  const sleeping = character === null;
  const [hitKey, setHitKey] = useState(0);

  const handleClick = () => {
    if (disabled || sleeping) return;
    setHitKey(Date.now());
    onHit(holeIndex);
  };

  return (
    <button
      className={`mole-hole ${sleeping ? 'sleeping' : 'active'} ${hitKey ? 'hit-active' : ''}`}
      type="button"
      disabled={disabled || sleeping}
      aria-label={
        sleeping ? '目前沒有地鼠' : `第 ${holeIndex + 1} 洞，候選字 ${character}`
      }
      data-hole-index={holeIndex}
      onClick={handleClick}
    >
      <span className="hole-number" aria-hidden="true">
        {holeIndex + 1}
      </span>
      <span className="mole-character" aria-hidden={sleeping}>
        {character ?? '·'}
      </span>
      {hitKey ? (
        <span key={hitKey} className="hit-ring-burst" aria-hidden="true" />
      ) : null}
      {hitKey ? (
        <span key={`score-${hitKey}`} className="hit-floating-text" aria-hidden="true">
          💥 +100
        </span>
      ) : null}
    </button>
  );
}
