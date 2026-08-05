import test from 'node:test';
import assert from 'node:assert/strict';

import { createIdiomIndex } from '../.test-dist/src/idioms/idiom-index.js';
import {
  countAvailableBonusQuestions,
  createBonusQuestion,
  hasMinimumBonusQuestions
} from '../.test-dist/src/game/bonus/question-generator.js';

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

function idiom(id, text, extra = {}) {
  const characters = [...text];
  return {
    ...base,
    ...extra,
    id,
    text,
    firstChar: characters[0],
    lastChar: characters.at(-1)
  };
}

const idioms = [
  idiom('idiom-0001', '畫龍點睛', {
    bopomofo: 'ㄏㄨㄚˋ ㄌㄨㄥˊ ㄉㄧㄢˇ ㄐㄧㄥ',
    pinyin: 'hua long dian jing'
  }),
  idiom('idiom-0002', '一諾千金'),
  idiom('idiom-0003', '萬眾一心'),
  idiom('idiom-0004', '刻舟求劍'),
  idiom('idiom-0005', '守株待兔'),
  idiom('idiom-0006', '亡羊補牢'),
  idiom('idiom-0007', '胸有成竹'),
  idiom('idiom-0008', '隔岸觀火'),
  idiom('idiom-0009', '無中生有'),
  idiom('idiom-0010', '無效成語', { enabled: false })
];

const index = createIdiomIndex(idioms);
const pickFirst = () => 0;

test('產生四個唯一且安全的候選字', () => {
  const question = createBonusQuestion(index, new Set(), 6, [2, 2], {
    pickIndex: pickFirst,
    createQuestionId: () => 'question-1'
  });

  assert.ok(question);
  assert.equal(question.prompt, '畫龍點＿');
  assert.equal(question.answer, '睛');
  assert.equal(question.choices.length, 4);
  assert.equal(new Set(question.choices.map((choice) => choice.character)).size, 4);
  assert.equal(
    question.choices.filter((choice) => choice.character === '睛').length,
    1
  );
  assert.equal(question.choices.some((choice) => choice.holeIndex >= 6), false);
  assert.notEqual(question.correctHoleIndex, 2);
  for (const choice of question.choices.filter((item) => item.character !== '睛')) {
    assert.equal(index.byText.has(`畫龍點${choice.character}`), false);
  }
});

test('跳過已使用與停用成語，支援九洞配置', () => {
  const question = createBonusQuestion(index, new Set(['idiom-0001']), 9, [], {
    pickIndex: pickFirst,
    createQuestionId: () => 'question-2'
  });
  assert.ok(question);
  assert.notEqual(question.idiomId, 'idiom-0001');
  assert.notEqual(question.idiomId, 'idiom-0010');
  assert.equal(question.holeCount, 9);
});

test('至少八題安全題目才允許啟動', () => {
  assert.equal(countAvailableBonusQuestions(index), 9);
  assert.equal(hasMinimumBonusQuestions(index), true);
  assert.equal(hasMinimumBonusQuestions(index, 10), false);
});

test('不足三個安全干擾字時不出題，也不符合啟動門檻', () => {
  const tiny = createIdiomIndex([
    idiom('tiny-1', '畫龍點睛'),
    idiom('tiny-2', '一諾千金'),
    idiom('tiny-3', '萬眾一心')
  ]);
  assert.equal(
    createBonusQuestion(tiny, new Set(), 6, [], { pickIndex: pickFirst }),
    null
  );
  assert.equal(hasMinimumBonusQuestions(tiny), false);
});
