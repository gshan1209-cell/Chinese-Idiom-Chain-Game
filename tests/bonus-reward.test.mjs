import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyBonusSettlement,
  calculateBonusSettlement
} from '../.test-dist/src/game/bonus/reward-calculator.js';
import { createBonusResources } from '../.test-dist/src/game/bonus/bonus-energy.js';

function round(rewardType, correctCount, wrongCount = 1) {
  return {
    id: 'round-1',
    settlementId: `${rewardType}-${correctCount}-${wrongCount}`,
    rewardType,
    difficulty: 'normal',
    phase: 'settled',
    phaseBeforePause: null,
    startedAtMs: 0,
    deadlineMs: 15_000,
    pausedAtMs: null,
    feedbackUntilMs: null,
    remainingMs: 0,
    question: null,
    usedIdiomIds: new Set(),
    recentCorrectHoles: [],
    correctCount,
    wrongCount,
    combo: 0,
    maxCombo: 0,
    score: 0,
    feedback: null,
    settledAtMs: 15_000
  };
}

function session() {
  return {
    id: 'session-1',
    mode: 'classic',
    difficulty: 'easy',
    startedAt: '2026-08-05T08:00:00.000Z',
    endedAt: null,
    score: 100,
    correctCount: 0,
    wrongCount: 0,
    combo: 0,
    maxCombo: 0,
    hintsUsed: 0,
    previousIdiom: null,
    usedIdiomIds: new Set(),
    history: [],
    result: null,
    bonusResources: createBonusResources({
      energy: 0,
      shieldLayers: 2,
      scoreMultiplierTurns: 4
    }),
    hintUsedForCurrentTurn: false,
    appliedBonusSettlementIds: new Set()
  };
}

test('四種獎勵門檻符合規格', () => {
  assert.deepEqual(
    [0, 3, 6, 9].map(
      (count) => calculateBonusSettlement(round('hint-ticket', count)).rewardAmount
    ),
    [0, 1, 2, 3]
  );
  assert.deepEqual(
    [0, 3, 6, 9].map(
      (count) => calculateBonusSettlement(round('time', count)).rewardAmount
    ),
    [0, 5, 10, 15]
  );
  assert.deepEqual(
    [0, 3, 9].map((count) =>
      calculateBonusSettlement(
        round('score-multiplier', count, count === 9 ? 0 : 1)
      ).rewardAmount
    ),
    [0, 3, 5]
  );
  assert.deepEqual(
    [0, 3, 6].map(
      (count) => calculateBonusSettlement(round('shield', count)).rewardAmount
    ),
    [0, 1, 2]
  );
});

test('完美命中增加 300 分與 10 能量，護盾上限為三層', () => {
  const settlement = calculateBonusSettlement(round('shield', 9, 0));
  assert.equal(settlement.perfect, true);
  assert.equal(settlement.perfectScoreBonus, 300);
  assert.equal(settlement.perfectEnergyBonus, 10);

  const applied = applyBonusSettlement(session(), settlement);
  assert.equal(applied.score, 400);
  assert.equal(applied.bonusResources.energy, 10);
  assert.equal(applied.bonusResources.shieldLayers, 3);
  assert.equal(applyBonusSettlement(applied, settlement), applied);
});

test('雙倍分數使用較長剩餘題數而非累加', () => {
  const settlement = calculateBonusSettlement(round('score-multiplier', 3, 1));
  assert.equal(
    applyBonusSettlement(session(), settlement).bonusResources.scoreMultiplierTurns,
    4
  );
});
