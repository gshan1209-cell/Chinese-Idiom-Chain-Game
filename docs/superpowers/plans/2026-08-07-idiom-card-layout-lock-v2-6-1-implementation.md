# CICG 成語圖卡版型鎖定 v2.6.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將已核准的 v2.6.1 幾何版型規格正式接入 GitHub `main`、Agent 入口、跨聊天專案提示語與批次狀態，並建立永久一致性 Gate。

**Architecture:** 規格文件維持為 canonical human-readable contract；`AGENTS.md`、`PROJECT_PROMPT.md` 與 `current-batch.json` 只保存必要入口與 current-version 狀態。新增 Node 測試驗證四個來源一致，避免新聊天讀到舊版 `2.6`、拼音卡面規則或可變版型。

**Tech Stack:** Markdown、JSON、Node.js `node:test`、GitHub Actions、既有 `npm run test:cards` 與 `./scripts/verify.sh`。

## Global Constraints

- Canonical composite 固定 `1024 × 2000 px`。
- Header／Main Artwork／Footer 固定為 `360／1200／440 px`。
- `layoutVersion` 固定為 `2.6.1`。
- 圖片模型只能生成 `1024 × 1200` 無文字 artwork，不得生成完整卡面。
- SSR 霓虹框是 `1024 × 2000` 最上層 overlay，不得改變幾何或觸發 reflow。
- 卡面不得顯示漢語拼音。
- 新聊天必須從 GitHub `main` 依序讀取 AGENTS、local skill、state 與 v2.6.1 規格。
- 本任務不實作 renderer、不遷移 61 張類別、不重製圖卡。

---

### Task 1: 建立 v2.6.1 跨入口一致性測試

**Files:**
- Create: `tests/card-layout-standard.test.mjs`

**Interfaces:**
- Consumes: `AGENTS.md`、`docs/card-prompts/PROJECT_PROMPT.md`、`docs/card-prompts/state/current-batch.json`、`docs/superpowers/specs/2026-08-07-idiom-card-layout-lock-v2-6-1-design.md`
- Produces: 永久 Gate，確保所有新聊天入口指向同一 current layout standard。

- [ ] **Step 1: Write the failing test**

```js
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

  assert.match(prompt, /圖片模型只能生成.*artwork/);
  assert.match(prompt, /不得.*生成完整卡面/);
  assert.match(prompt, /漢語拼音.*不得.*卡面/);
  assert.match(prompt, /SSR.*overlay.*不得.*reflow/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/card-layout-standard.test.mjs`

Expected: FAIL because `AGENTS.md`、`PROJECT_PROMPT.md` 與 state 尚未指向 v2.6.1。

- [ ] **Step 3: Commit RED evidence**

```bash
git add tests/card-layout-standard.test.mjs
git commit -m "test: lock idiom card layout standard entry points"
```

---

### Task 2: 更新 Agent 入口與新聊天專案提示語

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/card-prompts/PROJECT_PROMPT.md`

**Interfaces:**
- Consumes: v2.6.1 spec path and fixed geometry contract.
- Produces: 新聊天與 Repository Agent 的強制讀取順序及不可變版型規則。

- [ ] **Step 1: Update AGENTS.md**

在圖卡規格讀取順序中加入：

```text
12. docs/superpowers/specs/2026-08-07-idiom-card-layout-lock-v2-6-1-design.md
13. docs/card-prompts/PROJECT_PROMPT.md
```

並新增永久規則：

```text
- current layout standard 固定為 v2.6.1。
- 所有元件必須使用 v2.6.1 Bounding Box；允許誤差最多 ±2 px。
- SSR 霓虹外框是 full-canvas top overlay，不得縮放內容、改變三區高度或觸發 reflow。
- 圖片模型不得生成完整卡面；只能生成無文字、無 UI 的 1024 × 1200 artwork。
```

- [ ] **Step 2: Update PROJECT_PROMPT.md**

更新版本標頭與必讀清單，將 v2.6.1 列為 current geometry contract。替換舊的拼音卡面條款，加入完整固定幾何、Bounding Box、圖層順序與 SSR overlay 禁止 reflow 規則。

- [ ] **Step 3: Run targeted test**

Run: `node --test tests/card-layout-standard.test.mjs`

Expected: state assertions still FAIL；AGENTS／PROJECT_PROMPT assertions PASS。

- [ ] **Step 4: Commit entry-point updates**

```bash
git add AGENTS.md docs/card-prompts/PROJECT_PROMPT.md
git commit -m "docs: register idiom card layout v2.6.1"
```

---

### Task 3: 更新跨聊天 current state

**Files:**
- Modify: `docs/card-prompts/state/current-batch.json`

**Interfaces:**
- Consumes: v2.6.1 spec path.
- Produces: machine-readable current layout standard for future chats.

- [ ] **Step 1: Update state**

將 state 更新為：

```json
{
  "schemaVersion": 2,
  "project": "Chinese-Idiom-Chain-Game",
  "defaultRenderMode": "modular",
  "layoutVersion": "2.6.1",
  "currentLayoutStandard": "docs/superpowers/specs/2026-08-07-idiom-card-layout-lock-v2-6-1-design.md",
  "componentSetVersion": "theme-badges-v1.0",
  "activeBatchId": null,
  "workflowStatus": "layout-standard-v2-6-1-ready",
  "nextAction": "Migrate all 61 chapter-one cards to fixed themeCategory fields, then generate illustration-only Batch 01 artwork and compose cards with the deterministic v2.6.1 layout contract.",
  "cards": []
}
```

`lastUpdatedAt` 使用實際提交時間的 `+08:00` ISO 8601 值。

- [ ] **Step 2: Run targeted test to verify GREEN**

Run: `node --test tests/card-layout-standard.test.mjs`

Expected: PASS, 2 tests, 0 failed.

- [ ] **Step 3: Run card suite**

Run: `npm run test:cards`

Expected: all card tests PASS, including `card-layout-standard.test.mjs` through `tests/card-*.test.mjs`.

- [ ] **Step 4: Commit state update**

```bash
git add docs/card-prompts/state/current-batch.json
git commit -m "docs: set current card layout standard to v2.6.1"
```

---

### Task 4: 完整驗證、Audit 與合併

**Files:**
- Create: `docs/superpowers/reports/2026-08-07-idiom-card-layout-lock-v2-6-1-audit.md`

**Interfaces:**
- Consumes: all changes from Tasks 1–3.
- Produces: CI evidence、ChatGPT Audit、merged `main` state.

- [ ] **Step 1: Run full verification**

Run:

```bash
npm install
./scripts/verify.sh
```

Expected: Node tests、TypeScript strict、ESLint、Vite/PWA build、Drive/Theme Badge/Card Catalog validators 與 npm audit 全部通過。

- [ ] **Step 2: Create or update PR**

PR title:

```text
docs: lock idiom card layout standard v2.6.1
```

PR body 必須記錄 targeted tests、完整驗證、`behind_by=0`、review threads 與本任務不含 renderer 的範圍界線。

- [ ] **Step 3: Perform ChatGPT Audit**

Audit 必須確認：

```text
spec path exists
AGENTS reads v2.6.1 before PROJECT_PROMPT
PROJECT_PROMPT removes card-face Pinyin
state layoutVersion = 2.6.1
state currentLayoutStandard matches exact spec path
flat full-card image generation is prohibited
SSR overlay cannot reflow geometry
blocking findings = 0
```

- [ ] **Step 4: Verify merge gates**

```text
latest head CI = success
behind_by = 0
unresolved review threads = 0
blocking findings = 0
```

- [ ] **Step 5: Squash Merge**

Merge the PR using Squash Merge and verify the merge SHA is the latest `main` commit.

- [ ] **Step 6: Post-merge verification**

Read the four canonical files from `main` and confirm all use v2.6.1. Report the exact PR number、CI run、test counts and merge SHA.
