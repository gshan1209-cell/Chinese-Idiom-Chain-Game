import assert from 'node:assert/strict';
import test from 'node:test';

import { createIdiomIndex } from '../.test-dist/src/idioms/idiom-index.js';
import {
  createClassicSession,
  createNextClassicSession,
  requestClassicHint,
  submitClassicTurn
} from '../.test-dist/src/game/game-engine.js';
import { createBonusResources } from '../.test-dist/src/game/bonus/bonus-energy.js';

const base = {
  bopomofo: '',
  pinyin: '',
  meaning: '測試解釋',
  example: '測試例句',
  source: '測試資料',
  difficulty: 'easy',
  tags: [],
  enabled: true,
  version: 1
};

function idiom(id, text, difficulty = 'easy') {
  const characters = [...text];
  return {
    ...base,
    id,
    text,
    difficulty,
    firstChar: characters[0],
    lastChar: characters.at(-1)
  };
}

const chain = [
  idiom('idiom-0001', '一心一意'),
  idiom('idiom-0002', '意氣風發'),
  idiom('idiom-0003', '發揚光大', 'hard'),
  idiom('idiom-0004', '大公無私'),
  idiom('idiom-0005', '私心雜念')
];
const index = createIdiomIndex(chain);

function start(resources = createBonusResources()) {
  return createClassicSession(index, {
    pickIndex: () => 0,
    createSessionId: () => 'session-1',
    now: () => '2026-08-05T08:00:00.000Z',
    initialBonusResources: resources
  });
}

test('正確答案累積能量並套用雙倍分數題數', () => {
  const first = submitClassicTurn(
    start(createBonusResources({ scoreMultiplierTurns: 3 })),
    '意氣風發',
    index
  );

  assert.equal(first.result.scoreDelta, 200);
  assert.equal(first.session.bonusResources.scoreMultiplierTurns, 2);
  assert.equal(first.session.bonusResources.energy, 15);
});

test('提示後答對只取得基本能量，提示券不扣分', () => {
  const first = submitClassicTurn(start(), '意氣風發', index);
  const withTicket = {
    ...first.session,
    score: 80,
    bonusResources: createBonusResources({
      ...first.session.bonusResources,
      hintTickets: 1
    })
  };
  const hinted = requestClassicHint(withTicket, index, { pickIndex: () => 0 });
  assert.equal(hinted.session.score, 80);
  assert.equal(hinted.session.bonusResources.hintTickets, 0);

  const second = submitClassicTurn(hinted.session, '發揚光大', index);
  assert.equal(second.session.bonusResources.energy, 30);
  assert.equal(second.session.hintUsedForCurrentTurn, false);
});

test('護盾會消耗一層並保留連擊', () => {
  const session = {
    ...start(createBonusResources({ shieldLayers: 1 })),
    combo: 4
  };
  const outcome = submitClassicTurn(session, '不存在詞', index);
  assert.equal(outcome.session.combo, 4);
  assert.equal(outcome.session.bonusResources.shieldLayers, 0);
});

test('下一關最多保留 50 能量與其他道具', () => {
  const previous = {
    ...start(createBonusResources({ energy: 100, shieldLayers: 2 })),
    result: 'completed'
  };
  const next = createNextClassicSession(previous, index, { pickIndex: () => 0 });
  assert.equal(next.bonusResources.energy, 50);
  assert.equal(next.bonusResources.shieldLayers, 2);
});
