import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  validateAllIdiomContentPackages,
  validateIdiomContentPackage
} from '../scripts/validate-idiom-content-packages.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(
  await readFile(path.join(projectRoot, 'data', 'cards', 'theme-badge-registry.json'), 'utf8')
);
const sample = JSON.parse(
  await readFile(path.join(projectRoot, 'data', 'idioms', 'review', 'mian-li-cang-zhen.json'), 'utf8')
);

function clone(value) {
  return structuredClone(value);
}

test('綿裡藏針內容包保存四字、四組注音與來源異形關係', () => {
  assert.doesNotThrow(() =>
    validateIdiomContentPackage(sample, {
      context: 'sample',
      registry,
      directoryStatus: 'NeedsReview'
    })
  );
  assert.equal(sample.displayText, '綿裡藏針');
  assert.deepEqual(sample.bopomofo, ['ㄇㄧㄢˊ', 'ㄌㄧˇ', 'ㄘㄤˊ', 'ㄓㄣ']);
  assert.equal(sample.sourceHeadword, '綿裡針');
  assert.equal(sample.variantRelation, 'variant_of');
  assert.equal(sample.primarySource.work, '《曲江池》');
  assert.equal(sample.primarySource.chapter, '第二折');
});

test('注音不是四組時拒絕', () => {
  const invalid = clone(sample);
  invalid.bopomofo = invalid.bopomofo.slice(0, 3);
  assert.throws(
    () => validateIdiomContentPackage(invalid, { context: 'invalid', registry }),
    /bopomofo 必須恰好四組/
  );
});

test('meaning 與 allusionSummary 混用時拒絕', () => {
  const invalid = clone(sample);
  invalid.allusionSummary = invalid.meaning;
  assert.throws(
    () => validateIdiomContentPackage(invalid, { context: 'invalid', registry }),
    /不得完全相同/
  );
});

test('典故含有 IP 或角色內容時拒絕', () => {
  const invalid = clone(sample);
  invalid.rendererProjection.allusionBody += '胡蝶忍以毒刃演繹此義。';
  assert.throws(
    () => validateIdiomContentPackage(invalid, { context: 'invalid', registry }),
    /典故不得包含 IP／角色內容/
  );
});

test('Renderer 投影必須與內容包一致', () => {
  const invalid = clone(sample);
  invalid.rendererProjection.title = '笑裡藏刀';
  assert.throws(
    () => validateIdiomContentPackage(invalid, { context: 'invalid', registry }),
    /title 必須等於 displayText/
  );
});

test('Review 與 Approved 目錄全部通過永久驗證', async () => {
  const count = await validateAllIdiomContentPackages(projectRoot);
  assert.equal(count, 1);
});
