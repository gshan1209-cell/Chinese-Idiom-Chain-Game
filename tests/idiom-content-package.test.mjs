import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  validateAllContentLibraries,
  validateAllIdiomContentPackages,
  validateAllCardVariants,
  validateCardVariant,
  validateIdiomContentPackage
} from '../scripts/validate-idiom-content-packages.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(await readFile(path.join(projectRoot, 'data', 'cards', 'theme-badge-registry.json'), 'utf8'));
const sample = JSON.parse(await readFile(path.join(projectRoot, 'data', 'idioms', 'review', 'mian-li-cang-zhen.json'), 'utf8'));
const variant = JSON.parse(await readFile(path.join(projectRoot, 'data', 'card-variants', 'review', 'kimetsu', 'shinobu-mian-li-cang-zhen.json'), 'utf8'));

function clone(value) { return JSON.parse(JSON.stringify(value)); }

test('Schema v2 保存可供一般卡使用的通用副標與五言四句箴言', () => {
  assert.doesNotThrow(() => validateIdiomContentPackage(sample, { context: 'sample', registry, directoryStatus: 'NeedsReview' }));
  assert.equal(sample.schemaVersion, 2);
  assert.equal(sample.baseRarity, 'SR');
  assert.equal(sample.genericCardCopy.maximLines.length, 4);
  assert.deepEqual(sample.rendererProjection.maximLines, sample.genericCardCopy.maximLines);
});

test('通用箴言不是四句或每句不是五個漢字時拒絕', () => {
  const invalidCount = clone(sample);
  invalidCount.genericCardCopy.maximLines.pop();
  assert.throws(() => validateIdiomContentPackage(invalidCount, { context: 'invalid', registry }), /maximLines 必須恰好四句/);
  const invalidLength = clone(sample);
  invalidLength.genericCardCopy.maximLines[0] = '柔語藏鋒';
  assert.throws(() => validateIdiomContentPackage(invalidLength, { context: 'invalid', registry }), /每句必須恰好五個漢字/);
});

test('通用內容不得包含 IP、角色或招式名稱', () => {
  const invalid = clone(sample);
  invalid.genericCardCopy.subtitle = '胡蝶忍笑意藏鋒';
  invalid.rendererProjection.subtitle = invalid.genericCardCopy.subtitle;
  assert.throws(() => validateIdiomContentPackage(invalid, { context: 'invalid', registry }), /通用內容不得包含 IP／角色／招式內容/);
});

test('聯名覆寫只引用成語，不得重新定義釋義或典故', () => {
  const invalid = clone(variant);
  invalid.allusionSummary = '角色專屬典故';
  assert.throws(() => validateCardVariant(invalid, { context: 'invalid variant', idiomIds: new Set([sample.idiomId]), directoryStatus: 'NeedsReview' }), /聯名覆寫不得重新定義/);
});

test('聯名覆寫必須引用存在的 idiomId 並保持未授權不可發布', () => {
  assert.doesNotThrow(() => validateCardVariant(variant, { context: 'variant', idiomIds: new Set([sample.idiomId]), directoryStatus: 'NeedsReview' }));
  const missing = clone(variant);
  missing.idiomId = 'idiom-not-found';
  assert.throws(() => validateCardVariant(missing, { context: 'missing', idiomIds: new Set([sample.idiomId]) }), /idiomId 不存在於共用成語庫/);
  const invalidPublication = clone(variant);
  invalidPublication.publicationStatus = 'approved-for-publication';
  assert.throws(() => validateCardVariant(invalidPublication, { context: 'publication', idiomIds: new Set([sample.idiomId]) }), /沒有 licenseEvidenceId 時不得核准發布/);
});

test('Review 與 Approved 共用成語庫共有 13 份內容包', async () => {
  const result = await validateAllIdiomContentPackages(projectRoot);
  assert.equal(result.count, 13);
  assert.equal(result.idiomIds.size, 13);
});

test('鬼滅 UR Review 覆寫共有 13 份且全部通過交叉驗證', async () => {
  const idioms = await validateAllIdiomContentPackages(projectRoot);
  const count = await validateAllCardVariants(projectRoot, idioms.idiomIds);
  assert.equal(count, 13);
});

test('單一入口同時驗證共用成語庫與聯名覆寫層', async () => {
  const result = await validateAllContentLibraries(projectRoot);
  assert.deepEqual(result, { idiomCount: 13, variantCount: 13 });
});
