import test from 'node:test';
import assert from 'node:assert/strict';

import {
  carryResourcesToNextLevel,
  createBonusResources,
  gainTurnEnergy,
  spendFullEnergy
} from '../.test-dist/src/game/bonus/bonus-energy.js';

test('一般答對、連擊與困難成語依規則增加能量', () => {
  assert.equal(
    gainTurnEnergy({
      currentEnergy: 0,
      combo: 1,
      difficulty: 'normal',
      usedHintForTurn: false
    }),
    15
  );
  assert.equal(
    gainTurnEnergy({
      currentEnergy: 0,
      combo: 5,
      difficulty: 'hard',
      usedHintForTurn: false
    }),
    35
  );
});

test('能量最高為 100，使用提示後只取得基本能量', () => {
  assert.equal(
    gainTurnEnergy({
      currentEnergy: 95,
      combo: 1,
      difficulty: 'normal',
      usedHintForTurn: false
    }),
    100
  );
  assert.equal(
    gainTurnEnergy({
      currentEnergy: 20,
      combo: 8,
      difficulty: 'hard',
      usedHintForTurn: true
    }),
    35
  );
});

test('啟動後能量歸零，下一關最多保留 50', () => {
  const full = createBonusResources({ energy: 100, shieldLayers: 2 });
  assert.equal(spendFullEnergy(full).energy, 0);
  assert.deepEqual(carryResourcesToNextLevel(full), { ...full, energy: 50 });
  assert.throws(
    () => spendFullEnergy(createBonusResources({ energy: 99 })),
    /能量未滿/
  );
});
