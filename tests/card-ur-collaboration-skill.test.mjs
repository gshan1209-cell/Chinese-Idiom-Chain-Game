import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const UR_SKILL_PATH =
  '.agents/skills/generating-cicg-ur-collaboration-cards/SKILL.md';
const UR_GATE_SPEC_PATH =
  'docs/superpowers/specs/2026-08-08-ur-collaboration-generation-skill-and-zhuyin-gate-design.md';

test('UR collaboration requests route through the dedicated skill', async () => {
  const [agents, generalSkill, urSkill, gateSpec] = await Promise.all([
    read('AGENTS.md'),
    read('.agents/skills/generating-cicg-idiom-cards/SKILL.md'),
    read(UR_SKILL_PATH),
    read(UR_GATE_SPEC_PATH)
  ]);

  const escapedSkillPath = UR_SKILL_PATH.replaceAll('/', '\\/');
  assert.match(agents, new RegExp(escapedSkillPath));
  assert.match(generalSkill, new RegExp(escapedSkillPath));
  assert.match(urSkill, /IP[^\n]*角色/);
  assert.match(urSkill, /必填[^\n]*IP[^\n]*角色/);
  assert.match(urSkill, /未指定成語[^\n]*自動/);
  assert.match(urSkill, /1024 × 1200/);
  assert.match(urSkill, /不得[^\n]*生成完整卡面/);
  assert.match(gateSpec, /japanese-kana-in-bopomofo/);
});

test('UR skill and master prompt enforce Renderer-only Taiwanese Zhuyin', async () => {
  const [urSkill, masterPrompt, generalSkill] = await Promise.all([
    read(UR_SKILL_PATH),
    read('docs/card-prompts/shared/ur-collaboration-master-prompt-v1.md'),
    read('.agents/skills/generating-cicg-idiom-cards/SKILL.md')
  ]);

  for (const entry of [urSkill, masterPrompt, generalSkill]) {
    assert.match(entry, /圖片模型不得生成[^\n]*注音/);
    assert.match(entry, /Renderer[^\n]*bopomofo\[4\]/i);
    assert.match(entry, /平假名/);
    assert.match(entry, /片假名/);
  }

  assert.match(urSkill, /japanese-kana-in-bopomofo/);
  assert.match(urSkill, /四筆[^\n]*逐字對齊/);
  assert.match(urSkill, /字型[^\n]*(?:缺字|覆蓋)/);
});

test('UR skill keeps unlicensed collaborations in Review', async () => {
  const urSkill = await read(UR_SKILL_PATH);

  assert.match(urSkill, /沒有[^\n]*授權[^\n]*Review/);
  assert.match(urSkill, /不得[^\n]*Approved/);
  assert.match(urSkill, /licenseEvidenceId/);
  assert.match(urSkill, /UR[^\n]*里程碑[^\n]*卡池/);
});
