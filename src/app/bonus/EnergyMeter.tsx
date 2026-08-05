import type { BonusResources } from '../../domain/bonus';

interface EnergyMeterProps {
  readonly resources: BonusResources;
  readonly disabled: boolean;
  readonly onStart: () => void;
}

export function EnergyMeter({ resources, disabled, onStart }: EnergyMeterProps) {
  const remaining = Math.max(0, 100 - resources.energy);
  return (
    <section className="energy-panel" aria-labelledby="energy-title">
      <div className="energy-heading">
        <h2 id="energy-title">趣味能量</h2>
        <strong>{resources.energy}%</strong>
      </div>
      <progress
        max={100}
        value={resources.energy}
        aria-label={`趣味能量 ${resources.energy}%`}
      />
      <div className="resource-chips" aria-label="目前道具">
        <span>提示券 {resources.hintTickets}</span>
        <span>護盾 {resources.shieldLayers}</span>
        <span>雙倍分數 {resources.scoreMultiplierTurns} 題</span>
      </div>
      {resources.energy === 100 ? (
        <button
          className="bonus-start-button"
          type="button"
          disabled={disabled}
          onClick={onStart}
        >
          啟動成語打地鼠
        </button>
      ) : (
        <p className="energy-note">再累積 {remaining}% 就能啟動獎勵關卡</p>
      )}
    </section>
  );
}
