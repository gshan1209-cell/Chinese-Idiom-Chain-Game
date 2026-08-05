import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildDictionary,
  parseCsv,
  validateIdiomRecord
} from './build-idioms.mjs';

const validRecord = {
  id: 'idiom-0001',
  text: '一心一意',
  bopomofo: 'ㄧ ㄒㄧㄣ ㄧ ㄧˋ',
  pinyin: 'yī xīn yī yì',
  meaning: '心意專一，沒有別的念頭。',
  example: '他一心一意完成這項工作。',
  source: '示範資料，正式發布前需完成授權與校訂',
  difficulty: 'easy',
  tags: ['態度'],
  enabled: true,
  version: 1
};

test('validateIdiomRecord rejects text that is not four Han characters', () => {
  assert.throws(
    () => validateIdiomRecord({ ...validRecord, text: '一心' }, 2),
    /第 2 列.*四個中文字/
  );
});

test('validateIdiomRecord rejects missing meaning', () => {
  assert.throws(
    () => validateIdiomRecord({ ...validRecord, meaning: '' }, 3),
    /第 3 列.*meaning/
  );
});

test('parseCsv supports quoted commas and pipe-separated tags', () => {
  const csv = [
    'id,text,bopomofo,pinyin,meaning,example,source,difficulty,tags,enabled,version',
    'idiom-0001,一心一意,,,"專心一致，沒有雜念。","他一心一意，完成任務。",示範資料,easy,態度|學習,true,1'
  ].join('\n');

  assert.deepEqual(parseCsv(csv), [
    {
      id: 'idiom-0001',
      text: '一心一意',
      bopomofo: '',
      pinyin: '',
      meaning: '專心一致，沒有雜念。',
      example: '他一心一意，完成任務。',
      source: '示範資料',
      difficulty: 'easy',
      tags: ['態度', '學習'],
      enabled: true,
      version: 1
    }
  ]);
});

test('buildDictionary derives first and last characters', () => {
  const result = buildDictionary([validRecord]);

  assert.equal(result.idioms[0].firstChar, '一');
  assert.equal(result.idioms[0].lastChar, '意');
});

test('buildDictionary rejects duplicate ids', () => {
  assert.throws(
    () => buildDictionary([validRecord, { ...validRecord, text: '意氣風發' }]),
    /重複 id.*idiom-0001/
  );
});

test('buildDictionary rejects duplicate idiom text', () => {
  assert.throws(
    () => buildDictionary([validRecord, { ...validRecord, id: 'idiom-0002' }]),
    /重複成語.*一心一意/
  );
});

test('buildDictionary excludes disabled idioms from indexes', () => {
  const disabled = {
    ...validRecord,
    id: 'idiom-0002',
    text: '意氣風發',
    enabled: false
  };
  const result = buildDictionary([validRecord, disabled]);

  assert.deepEqual(result.firstCharIndex, { 一: ['idiom-0001'] });
  assert.deepEqual(result.lastCharIndex, { 意: ['idiom-0001'] });
});

test('buildDictionary groups candidates by first character', () => {
  const result = buildDictionary([
    { ...validRecord, id: 'idiom-0002', text: '意氣風發' },
    { ...validRecord, id: 'idiom-0003', text: '意想不到' }
  ]);

  assert.deepEqual(result.firstCharIndex, {
    意: ['idiom-0002', 'idiom-0003']
  });
});
