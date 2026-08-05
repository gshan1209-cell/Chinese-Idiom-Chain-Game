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
  return (
    <button
      className={`mole-hole ${sleeping ? 'sleeping' : 'active'}`}
      type="button"
      disabled={disabled || sleeping}
      aria-label={
        sleeping ? '目前沒有地鼠' : `第 ${holeIndex + 1} 洞，候選字 ${character}`
      }
      data-hole-index={holeIndex}
      onClick={() => onHit(holeIndex)}
    >
      <span className="hole-number" aria-hidden="true">
        {holeIndex + 1}
      </span>
      <span className="mole-character" aria-hidden={sleeping}>
        {character ?? '·'}
      </span>
    </button>
  );
}
