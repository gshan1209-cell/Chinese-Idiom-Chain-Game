import assert from 'node:assert/strict';
import test from 'node:test';

import { createIdiomIndex } from '../.test-dist/src/idioms/idiom-index.js';
import {
  createClassicSession,
  requestClassicHint,
  submitClassicTurn
} from '../.test-dist/src/game/game-engine.js';

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

function idiom(id, text) {
  const chars = [...text];
  return {
    ...base,
    id,
    text,
    firstChar: chars[0],
    lastChar: chars.at(-1)
  };
}

const chain = [
  idiom('idiom-0001', '一心一意'),
  idiom('idiom-0002', '意氣風發'),
  idiom('idiom-0003', '發揚光大'),
  idiom('idiom-0004', '大公無私'),
  idiom('idiom-0005', '私心雜念')
];

function startWithFirst(idioms = chain) {
  return createClassicSession(createIdiomIndex(idioms), {
    createSessionId: () => 'session-1',
    now: () => '2026-08-05T08:00:00.000Z',
    pickIndex: () => 0
  });
}

test('starts from an enabled idiom that has an unused continuation', () => {
  const session = startWithFirst();

  assert.equal(session.id, 'session-1');
  assert.equal(session.previousIdiom.text, '一心一意');
  assert.deepEqual(session.history.map((item) => item.text), ['一心一意']);
  assert.deepEqual([...session.usedIdiomIds], ['idiom-0001']);
  assert.equal(session.score, 0);
  assert.equal(session.result, null);
});

test('rejects an idiom that does not exist and resets combo', () => {
  const index = createIdiomIndex(chain);
  const original = { ...startWithFirst(), combo: 3 };
  const outcome = submitClassicTurn(original, '意不存在', index);

  assert.equal(outcome.result.correct, false);
  assert.equal(outcome.result.errorCode, 'IDIOM_NOT_FOUND');
  assert.equal(outcome.session.wrongCount, 1);
  assert.equal(outcome.session.combo, 0);
  assert.equal(outcome.session.previousIdiom.text, '一心一意');
});

test('rejects an idiom whose first character does not match', () => {
  const index = createIdiomIndex(chain);
  const outcome = submitClassicTurn(startWithFirst(), '發揚光大', index);

  assert.equal(outcome.result.correct, false);
  assert.equal(outcome.result.errorCode, 'CHAIN_CHAR_MISMATCH');
  assert.equal(outcome.result.nextRequiredChar, '意');
});

test('rejects an idiom already used in the same session', () => {
  const loop = [
    idiom('idiom-0101', '一心一意'),
    idiom('idiom-0102', '意氣用事'),
    idiom('idiom-0103', '事出有因'),
    idiom('idiom-0104', '因循守舊'),
    idiom('idiom-0105', '舊事重提'),
    idiom('idiom-0106', '提心吊膽'),
    idiom('idiom-0107', '膽大心細'),
    idiom('idiom-0108', '細水長流'),
    idiom('idiom-0109', '流連忘返'),
    idiom('idiom-0110', '返老還童'),
    idiom('idiom-0111', '童心未泯'),
    idiom('idiom-0112', '泯然眾人')
  ];
  const index = createIdiomIndex(loop);
  const used = new Set(['idiom-0101', 'idiom-0102']);
  const session = {
    ...createClassicSession(index, { pickIndex: () => 0 }),
    previousIdiom: loop[1],
    usedIdiomIds: used,
    history: [loop[0], loop[1]]
  };
  const outcome = submitClassicTurn(session, '一心一意', index);

  assert.equal(outcome.result.correct, false);
  assert.equal(outcome.result.errorCode, 'CHAIN_CHAR_MISMATCH');

  const repeatSession = {
    ...session,
    previousIdiom: idiom('idiom-0999', '返璞歸一')
  };
  const repeat = submitClassicTurn(repeatSession, '一心一意', index);
  assert.equal(repeat.result.errorCode, 'IDIOM_ALREADY_USED');
});

test('scores correct turns and increases combo bonus', () => {
  const index = createIdiomIndex(chain);
  const first = submitClassicTurn(startWithFirst(), '意氣風發', index);
  const second = submitClassicTurn(first.session, '發揚光大', index);

  assert.equal(first.result.scoreDelta, 100);
  assert.equal(first.session.score, 100);
  assert.equal(first.session.combo, 1);
  assert.equal(second.result.scoreDelta, 120);
  assert.equal(second.session.score, 220);
  assert.equal(second.session.combo, 2);
  assert.equal(second.session.maxCombo, 2);
});

test('caps combo bonus at two hundred points', () => {
  const index = createIdiomIndex(chain);
  const session = { ...startWithFirst(), combo: 99, maxCombo: 99 };
  const outcome = submitClassicTurn(session, '意氣風發', index);

  assert.equal(outcome.result.scoreDelta, 300);
  assert.equal(outcome.session.combo, 100);
});

test('hint returns an unused candidate and deducts fifty points without going below zero', () => {
  const index = createIdiomIndex(chain);
  const session = { ...startWithFirst(), score: 30 };
  const outcome = requestClassicHint(session, index, { pickIndex: () => 0 });

  assert.equal(outcome.idiom?.text, '意氣風發');
  assert.equal(outcome.session.score, 0);
  assert.equal(outcome.session.hintsUsed, 1);
  assert.equal(outcome.session.combo, 0);
});

test('completes the session when the accepted idiom has no unused continuation', () => {
  const shortChain = [idiom('idiom-0201', '一心一意'), idiom('idiom-0202', '意想不到')];
  const index = createIdiomIndex(shortChain);
  const outcome = submitClassicTurn(startWithFirst(shortChain), '意想不到', index);

  assert.equal(outcome.result.correct, true);
  assert.equal(outcome.session.result, 'completed');
  assert.notEqual(outcome.session.endedAt, null);
});
