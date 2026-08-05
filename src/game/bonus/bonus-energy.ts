import type { BonusResources, EnergyGainInput } from '../../domain/bonus.js';

const MAX_ENERGY = 100;
const MAX_CARRY_ENERGY = 50;
const MAX_SHIELDS = 3;

function finiteNonNegativeInteger(value: unknown, fallback = 0): number {
  if (value === undefined) return fallback;
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error('獎勵資源必須是非負整數。');
  }
  return value;
}

export function createBonusResources(partial: Partial<BonusResources> = {}): BonusResources {
  return Object.freeze({
    energy: Math.min(MAX_ENERGY, finiteNonNegativeInteger(partial.energy)),
    hintTickets: finiteNonNegativeInteger(partial.hintTickets),
    shieldLayers: Math.min(MAX_SHIELDS, finiteNonNegativeInteger(partial.shieldLayers)),
    scoreMultiplierTurns: finiteNonNegativeInteger(partial.scoreMultiplierTurns),
    timeBonusSeconds: finiteNonNegativeInteger(partial.timeBonusSeconds)
  });
}

export function gainTurnEnergy(input: EnergyGainInput): number {
  const currentEnergy = Math.min(MAX_ENERGY, Math.max(0, finiteNonNegativeInteger(input.currentEnergy)));
  let gain = 15;
  if (!input.usedHintForTurn) {
    if (input.combo >= 3) gain += 5;
    if (input.combo >= 5) gain += 10;
    if (input.difficulty === 'hard') gain += 5;
  }
  return Math.min(MAX_ENERGY, currentEnergy + gain);
}

export function spendFullEnergy(resources: BonusResources): BonusResources {
  if (resources.energy !== MAX_ENERGY) throw new Error('能量未滿 100%，無法啟動獎勵關卡。');
  return createBonusResources({ ...resources, energy: 0 });
}

export function carryResourcesToNextLevel(resources: BonusResources): BonusResources {
  return createBonusResources({ ...resources, energy: Math.min(MAX_CARRY_ENERGY, resources.energy) });
}
