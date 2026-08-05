import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createIdiomIndex,
  getCandidatesByFirstChar,
  getIdiomByText
} from '../.test-dist/src/idioms/idiom-index.js';

const base = {
  bopomofo: '',
  pinyin: '',
  meaning: '測試解釋',
  example: '',
  source: '測試資料',
  difficulty: 'easy',
  tags: [],
  enabled: true,
  version: 1
};

const fixtures = [
  { ...base, id: 'idiom-0001', text: '一心一意', firstChar: '一', lastChar: '意' },
  { ...base, id: 'idiom-0002', text: '意氣風發', firstChar: '意', lastChar: '發' },
  { ...base, id: 'idiom-0003', text: '意想不到', firstChar: '意', lastChar: '到' },
  {
    ...base,
    id: 'idiom-0004',
    text: '意在言外',
    firstChar: '意',
    lastChar: '外',
    enabled: false
  }
];

test('returns enabled idioms whose first character matches', () => {
  const index = createIdiomIndex(fixtures);

  assert.deepEqual(
    getCandidatesByFirstChar(index, '意').map((idiom) => idiom.text),
    ['意氣風發', '意想不到']
  );
});

test('finds an enabled idiom by normalized text', () => {
  const index = createIdiomIndex(fixtures);

  assert.equal(getIdiomByText(index, '  一心一意  ')?.id, 'idiom-0001');
  assert.equal(getIdiomByText(index, '意在言外'), null);
});

test('returns a frozen empty list for an invalid first character', () => {
  const index = createIdiomIndex(fixtures);
  const result = getCandidatesByFirstChar(index, '不是單字');

  assert.deepEqual(result, []);
  assert.equal(Object.isFrozen(result), true);
});

test('candidate arrays cannot mutate the internal index', () => {
  const index = createIdiomIndex(fixtures);
  const candidates = getCandidatesByFirstChar(index, '意');

  assert.equal(Object.isFrozen(candidates), true);
  assert.throws(() => candidates.push(fixtures[0]), TypeError);
  assert.equal(getCandidatesByFirstChar(index, '意').length, 2);
});

test('rejects duplicate ids', () => {
  assert.throws(
    () => createIdiomIndex([...fixtures, { ...fixtures[0], text: '一言為定', firstChar: '一', lastChar: '定' }]),
    /重複 id.*idiom-0001/
  );
});

test('rejects duplicate idiom text', () => {
  assert.throws(
    () => createIdiomIndex([...fixtures, { ...fixtures[0], id: 'idiom-0999' }]),
    /重複成語.*一心一意/
  );
});
