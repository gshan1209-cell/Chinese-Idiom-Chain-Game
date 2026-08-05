import type { BonusSettlement, BonusRound } from '../../domain/bonus.js';
import type { GameSession } from '../../domain/game.js';
import { createBonusResources } from './bonus-energy.js';

function rewardAmount(round: BonusRound): number {
  const count = round.correctCount;
  switch (round.rewardType) {
    case 'hint-ticket':
      if (count <= 2) return 0;
      if (count <= 5) return 1;
      if (count <= 8) return 2;
      return 3;
    case 'time':
      if (count <= 2) return 0;
      if (count <= 5) return 5;
      if (count <= 8) return 10;
      return 15;
    case 'score-multiplier':
      if (count < 3) return 0;
      return count >= 9 && round.wrongCount === 0 ? 5 : 3;
    case 'shield':
      if (count <= 2) return 0;
      if (count <= 5) return 1;
      return 2;
  }
}

export function calculateBonusSettlement(round: BonusRound): BonusSettlement {
  if (round.phase !== 'settled') {
    throw new Error('獎勵關卡尚未結束，不能結算。');
  }
  const perfect = round.correctCount > 0 && round.wrongCount === 0;
  return Object.freeze({
    id: round.settlementId,
    rewardType: round.rewardType,
    rewardAmount: rewardAmount(round),
    perfect,
    perfectScoreBonus: perfect ? 300 : 0,
    perfectEnergyBonus: perfect ? 10 : 0
  });
}

export function applyBonusSettlement(
  session: GameSession,
  settlement: BonusSettlement
): GameSession {
  if (session.appliedBonusSettlementIds.has(settlement.id)) return session;

  const current = session.bonusResources;
  const bonusResources = createBonusResources({
    energy: Math.min(100, current.energy + settlement.perfectEnergyBonus),
    hintTickets:
      current.hintTickets +
      (settlement.rewardType === 'hint-ticket' ? settlement.rewardAmount : 0),
    shieldLayers: Math.min(
      3,
      current.shieldLayers +
        (settlement.rewardType === 'shield' ? settlement.rewardAmount : 0)
    ),
    scoreMultiplierTurns:
      settlement.rewardType === 'score-multiplier'
        ? Math.max(current.scoreMultiplierTurns, settlement.rewardAmount)
        : current.scoreMultiplierTurns,
    timeBonusSeconds:
      current.timeBonusSeconds +
      (settlement.rewardType === 'time' ? settlement.rewardAmount : 0)
  });
  const appliedBonusSettlementIds = new Set(session.appliedBonusSettlementIds);
  appliedBonusSettlementIds.add(settlement.id);

  return Object.freeze({
    ...session,
    score: session.score + settlement.perfectScoreBonus,
    bonusResources,
    appliedBonusSettlementIds
  });
}
