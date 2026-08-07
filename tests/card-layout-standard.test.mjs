import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const SPEC_PATH =
  'docs/superpowers/specs/2026-08-07-idiom-card-layout-lock-v2-6-1-design.md';

test('all card-generation entry points use layout v2.6.1', async () => {
  const [agents, prompt, stateText, spec] = await Promise.all([
    read('AGENTS.md'),
    read('docs/card-prompts/PROJECT_PROMPT.md'),
    read('docs/card-prompts/state/current-batch.json'),
    read(SPEC_PATH),
  ]);
  const state = JSON.parse(stateText);

  assert.match(agents, new RegExp(SPEC_PATH.replaceAll('/', '\\/')));
  assert.match(prompt, new RegExp(SPEC_PATH.replaceAll('/', '\\/')));
  assert.equal(state.layoutVersion, '2.6.1');
  assert.equal(state.currentLayoutStandard, SPEC_PATH);
  assert.match(spec, /1024 × 2000/);
  assert.match(spec, /Header \| 0 \| 0 \| 1024 \| 360/);
  assert.match(spec, /Main Artwork \| 0 \| 360 \| 1024 \| 1200/);
  assert.match(spec, /Footer \| 0 \| 1560 \| 1024 \| 440/);
});

test('project prompt forbids flat-card generation and card-face pinyin', async () => {
  const prompt = await read('docs/card-prompts/PROJECT_PROMPT.md');

  assert.match(prompt, /圖片模型只能生成[^\n]*artwork/);
  assert.match(prompt, /不得[^\n]*生成完整卡面/);
  assert.match(prompt, /漢語拼音[^\n]*不得[^\n]*卡面/);
  assert.match(prompt, /SSR[^\n]*overlay[^\n]*不得[^\n]*reflow/i);
});
