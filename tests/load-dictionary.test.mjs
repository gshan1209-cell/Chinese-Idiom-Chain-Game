import assert from 'node:assert/strict';
import test from 'node:test';

import { loadDictionary } from '../.test-dist/src/idioms/load-dictionary.js';

const idiom = {
  id: 'idiom-0001',
  text: '一心一意',
  firstChar: '一',
  lastChar: '意',
  bopomofo: '',
  pinyin: '',
  meaning: '心意專一。',
  example: '他一心一意學習。',
  source: '測試資料',
  difficulty: 'easy',
  tags: [],
  enabled: true,
  version: 1
};

function response(data, ok = true, status = 200) {
  return { ok, status, json: async () => data };
}

function createFetcher(responses) {
  const calls = [];
  const fetcher = async (url) => {
    calls.push(url);
    const next = responses.shift();
    if (!next) throw new Error(`沒有為 ${url} 準備回應`);
    return next;
  };
  return { fetcher, calls };
}

test('loads the versioned dictionary named by manifest', async () => {
  const { fetcher, calls } = createFetcher([
    response({ dictionaryVersion: 1, files: { idioms: 'idioms.v1.json' } }),
    response({ schemaVersion: 1, dictionaryVersion: 1, count: 1, idioms: [idiom] })
  ]);

  const loaded = await loadDictionary(fetcher);

  assert.deepEqual(calls, ['/generated/manifest.json', '/generated/idioms.v1.json']);
  assert.equal(loaded.payload.count, 1);
  assert.equal(loaded.index.byText.get('一心一意')?.id, 'idiom-0001');
});

test('reports a Traditional Chinese error for non-ok responses', async () => {
  const { fetcher } = createFetcher([response({}, false, 503)]);
  await assert.rejects(() => loadDictionary(fetcher), /字典資訊載入失敗.*503/);
});

test('rejects a malformed dictionary payload', async () => {
  const { fetcher } = createFetcher([
    response({ dictionaryVersion: 1, files: { idioms: 'idioms.v1.json' } }),
    response({ schemaVersion: 1, dictionaryVersion: 1, count: 1, idioms: [{ text: '一心一意' }] })
  ]);
  await assert.rejects(() => loadDictionary(fetcher), /字典資料格式錯誤/);
});

test('rejects a count mismatch', async () => {
  const { fetcher } = createFetcher([
    response({ dictionaryVersion: 1, files: { idioms: 'idioms.v1.json' } }),
    response({ schemaVersion: 1, dictionaryVersion: 1, count: 2, idioms: [idiom] })
  ]);
  await assert.rejects(() => loadDictionary(fetcher), /字典筆數不一致/);
});

test('rejects a dictionary without enabled idioms', async () => {
  const { fetcher } = createFetcher([
    response({ dictionaryVersion: 1, files: { idioms: 'idioms.v1.json' } }),
    response({ schemaVersion: 1, dictionaryVersion: 1, count: 1, idioms: [{ ...idiom, enabled: false }] })
  ]);
  await assert.rejects(() => loadDictionary(fetcher), /沒有可使用的成語/);
});
