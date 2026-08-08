# UR Collaboration Generation Skill and Zhuyin Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立只需 IP 名稱與角色名即可啟動的 UR 聯名卡 Repository-local 技能，並以 production validator 與跨入口文件測試永久阻擋日文假名注音。

**Architecture:** 新技能負責流程編排與資料補齊，既有 `validateIdiomCardDefinitions` 負責結構化注音字元 Gate；圖片模型仍只生成 illustration-only artwork，Renderer 使用已驗證 `bopomofo[4]` 組裝完整卡面。規格、技能、母提示語與 AGENTS 入口由 Node 文件測試保持一致。

**Tech Stack:** Markdown Agent Skills、TypeScript 6、Node.js 22 `node:test`、GitHub Actions、既有 CICG modular card workflow。

## Global Constraints

- Canonical composite 固定 `1024 × 2000 px`。
- Header／Main Artwork／Footer 固定 `360／1200／440 px`，幾何誤差最多 `±2 px`。
- 圖片模型只能生成 `1024 × 1200 px` 無文字 artwork。
- UR 卡面省略難度徽章，原 difficulty Bounding Box 使用 IP 專屬聯名標籤。
- 四字成語必須恰好四筆臺灣注音；卡面不得顯示拼音。
- 平假名、片假名、片假名擴充與半形片假名均為 Blocking failure。
- 沒有可稽核 `licenseEvidenceId` 時只能 Draft／Review，不得 Approved 或發布。
- 不修改任何 IndexedDB Schema，不將 UR 加入一般里程碑免費卡池。

---

### Task 1: 建立 RED 注音與技能契約測試

**Files:**
- Modify: `tests/card-definition-validator.test.mjs`
- Create: `tests/card-ur-collaboration-skill.test.mjs`

**Interfaces:**
- Consumes: `validateIdiomCardDefinitions(input, activeIdioms, at)`。
- Produces: finding code `japanese-kana-in-bopomofo` 的測試契約，以及 UR 技能必備文件契約。

- [ ] **Step 1: 在 validator 測試加入平假名、片假名與混合字元案例**

```js
test('rejects Japanese kana in the bopomofo field with a dedicated finding', () => {
  for (const bopomofo of [
    ['すい', 'ㄉㄧ', 'ㄕˊ', 'ㄔㄨㄢ'],
    ['スイ', 'ㄉㄧ', 'ㄕˊ', 'ㄔㄨㄢ'],
    ['ㄕㄨㄟす', 'ㄉㄧ', 'ㄕˊ', 'ㄔㄨㄢ']
  ]) {
    const result = validate([validCard({ bopomofo })]);
    assert.equal(result.validDefinitions.length, 0);
    assert.ok(result.findings.some(
      (finding) => finding.code === 'japanese-kana-in-bopomofo'
    ));
  }
});
```

- [ ] **Step 2: 建立跨入口技能契約測試**

測試讀取：

```text
AGENTS.md
.agents/skills/generating-cicg-idiom-cards/SKILL.md
.agents/skills/generating-cicg-ur-collaboration-cards/SKILL.md
docs/card-prompts/shared/ur-collaboration-master-prompt-v1.md
docs/superpowers/specs/2026-08-08-ur-collaboration-generation-skill-and-zhuyin-gate-design.md
```

並斷言：

```js
assert.match(urSkill, /IP[^\n]*角色/);
assert.match(urSkill, /只生成[^\n]*1024 × 1200/);
assert.match(urSkill, /japanese-kana-in-bopomofo/);
assert.match(urSkill, /不得[^\n]*平假名/);
assert.match(urSkill, /不得[^\n]*片假名/);
assert.match(urSkill, /沒有[^\n]*授權[^\n]*Review/);
```

- [ ] **Step 3: 提交 RED 測試**

```bash
git add tests/card-definition-validator.test.mjs tests/card-ur-collaboration-skill.test.mjs
git commit -m "test: require UR skill and Japanese-kana Zhuyin gate"
```

- [ ] **Step 4: 由 GitHub Actions 驗證 RED**

預期：

```text
FAIL：找不到 .agents/skills/generating-cicg-ur-collaboration-cards/SKILL.md
或 finding code 尚為 invalid-bopomofo，而不是 japanese-kana-in-bopomofo
```

---

### Task 2: 實作專屬日文假名 finding

**Files:**
- Modify: `src/cards/card-definition-validator.ts`
- Test: `tests/card-definition-validator.test.mjs`

**Interfaces:**
- Consumes: `record.bopomofo: unknown`。
- Produces: `japanese-kana-in-bopomofo` finding；其他不合法注音仍為 `invalid-bopomofo`。

- [ ] **Step 1: 新增日文假名偵測 Pattern**

```ts
const JAPANESE_KANA_PATTERN =
  /[\u3040-\u309f\u30a0-\u30ff\u31f0-\u31ff\uff65-\uff9f]/u;
```

- [ ] **Step 2: 新增純函式偵測陣列中的假名**

```ts
function containsJapaneseKana(value: unknown): boolean {
  return Array.isArray(value) && value.some(
    (entry) => typeof entry === 'string' && JAPANESE_KANA_PATTERN.test(entry)
  );
}
```

- [ ] **Step 3: 在一般 invalid-bopomofo 前加入專屬 finding**

```ts
if (containsJapaneseKana(record.bopomofo)) {
  add(
    'japanese-kana-in-bopomofo',
    '注音欄不得包含平假名、片假名或半形片假名。'
  );
} else if (!isValidBopomofo(record.bopomofo)) {
  add('invalid-bopomofo', '注音必須恰好四筆並使用臺灣注音符號。');
}
```

- [ ] **Step 4: 執行 `npm run test:cards`**

預期：新增案例與既有 Card tests 全部 PASS。

- [ ] **Step 5: 提交 validator 實作**

```bash
git add src/cards/card-definition-validator.ts tests/card-definition-validator.test.mjs
git commit -m "feat: reject Japanese kana in card Zhuyin"
```

---

### Task 3: 建立 UR 聯名卡 Repository-local 技能

**Files:**
- Create: `.agents/skills/generating-cicg-ur-collaboration-cards/SKILL.md`
- Modify: `.agents/skills/generating-cicg-idiom-cards/SKILL.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: `ipName`、`characterName`，以及可選 `idiom`。
- Produces: 一張 modular UR Review 工作項目、結構化內容、artwork、composition 狀態與證據回報。

- [ ] **Step 1: 建立技能 frontmatter**

```yaml
---
name: generating-cicg-ur-collaboration-cards
description: Use when a Chinese-Idiom-Chain-Game request names an external IP and character and asks to generate, continue, repair, review, or compose a UR collaboration idiom card.
---
```

- [ ] **Step 2: 寫入最小輸入與自動補齊流程**

技能明確規定：

```text
必填：IP 名稱＋角色正式名稱
可選：指定成語
未指定成語時，自動選擇符合角色核心行動且未重複的四字成語
自動補齊：注音、資料層拼音、難度、主題、典故、來源、箴言、場景
```

- [ ] **Step 3: 寫入產製與授權 Gate**

技能必須：

```text
實際使用 image_gen 逐張生成 1024 × 1200 artwork
禁止模型生成完整卡面與任何文字
使用 Renderer 組成 1024 × 2000 composite
Renderer 不可用時 compositionStatus=blocked
缺授權證據時只可 Review
```

- [ ] **Step 4: 寫入注音 Gate 與 finding code**

明確列出 Bopomofo 白名單、日文假名黑名單、四筆逐字對齊、字型覆蓋與 `japanese-kana-in-bopomofo`。

- [ ] **Step 5: 在既有圖卡技能與 AGENTS 加入路由**

UR／聯名任務先讀取新技能；一般 N～SSR 任務仍使用既有技能。

- [ ] **Step 6: 提交技能與入口更新**

```bash
git add .agents/skills/generating-cicg-ur-collaboration-cards/SKILL.md \
  .agents/skills/generating-cicg-idiom-cards/SKILL.md AGENTS.md
git commit -m "feat: add UR collaboration card generation skill"
```

---

### Task 4: 同步 UR 母提示語與規格入口

**Files:**
- Modify: `docs/card-prompts/shared/ur-collaboration-master-prompt-v1.md`
- Modify: `docs/superpowers/specs/2026-08-08-ur-collaboration-card-standard-v1-0-design.md`
- Modify: `.agents/skills/generating-cicg-idiom-cards/references/required-specs.md`
- Test: `tests/card-ur-collaboration-skill.test.mjs`

**Interfaces:**
- Consumes: 已核准 UR v1.0 標準。
- Produces: 跨聊天一致的注音防日文化規則。

- [ ] **Step 1: 母提示語加入 Renderer-only 注音條款**

```text
圖片模型不得生成注音。
注音只能由 Renderer 直接使用已驗證 bopomofo[4] 文字節點。
平假名、片假名、片假名擴充、半形片假名與羅馬字一律禁止。
```

- [ ] **Step 2: UR 標準加入 finding 與失敗狀態**

```text
japanese-kana-in-bopomofo → compositionStatus=changes-requested／blocked
approvalStatus 不得為 Approved
```

- [ ] **Step 3: required-specs 加入新技能與新規格**

Agent 必須在 UR 任務讀取新技能與本規格。

- [ ] **Step 4: 執行 `npm run test:cards`**

預期：全部 PASS。

- [ ] **Step 5: 提交文件同步**

```bash
git add docs/card-prompts/shared/ur-collaboration-master-prompt-v1.md \
  docs/superpowers/specs/2026-08-08-ur-collaboration-card-standard-v1-0-design.md \
  .agents/skills/generating-cicg-idiom-cards/references/required-specs.md \
  tests/card-ur-collaboration-skill.test.mjs
git commit -m "docs: enforce Renderer-only Taiwanese Zhuyin for UR cards"
```

---

### Task 5: 完整驗證、Audit 與合併

**Files:**
- Create: `docs/superpowers/reports/2026-08-08-ur-collaboration-skill-zhuyin-gate-audit.md`

**Interfaces:**
- Consumes: Tasks 1–4 的最新 HEAD。
- Produces: 可稽核 CI、ChatGPT Audit 與 merge evidence。

- [ ] **Step 1: 執行完整 Gate**

```bash
npm install
./scripts/verify.sh
```

- [ ] **Step 2: 確認 PR 與分支狀態**

```text
behind_by = 0
GitHub Actions = success
unresolved review threads = 0
```

- [ ] **Step 3: 審核差異**

確認：

- 日文假名有專屬 finding。
- 正確臺灣注音仍通過。
- 新技能最小輸入只有 IP 與角色名。
- 無授權時只輸出 Review。
- 沒有放寬 UR、卡池、版型或 IndexedDB Gate。

- [ ] **Step 4: 建立 Audit 報告並提交**

```bash
git add docs/superpowers/reports/2026-08-08-ur-collaboration-skill-zhuyin-gate-audit.md
git commit -m "docs: record UR collaboration skill audit"
```

- [ ] **Step 5: Squash Merge**

CI 與 ChatGPT Audit 全部通過後，Squash Merge 至 `main`。
