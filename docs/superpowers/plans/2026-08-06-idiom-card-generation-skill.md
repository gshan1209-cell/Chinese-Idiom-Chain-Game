# 成語圖卡跨聊天產製技能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立 Repository-local 成語圖卡產製技能與機器可讀批次狀態，使本專案的新聊天能從 GitHub `main` 接續圖卡工作。

**Architecture:** 使用 `.agents/skills/` 保存可搜尋的 `SKILL.md` 與精簡參考文件；使用 `docs/card-prompts/state/current-batch.json` 保存跨聊天批次狀態。`AGENTS.md` 與圖卡提示語 README 作為強制入口，所有狀態仍以 GitHub、Drive 與 Manifest 的可稽核證據為準。

**Tech Stack:** Markdown、JSON、Repository-local Agent Skills、GitHub Actions 既有 `./scripts/verify.sh`

## Global Constraints

- 僅適用於 `Chinese-Idiom-Chain-Game` 專案。
- 不修改 production code、依賴、關卡、成語資料或 IndexedDB Schema。
- 圖卡必須遵循最新 v2.1、稀有度與審核規格。
- 未取得正式授權證據不得製作正式 UR 聯名卡。
- docs-only 更新完成 CI 後直接 Squash Merge。

---

### Task 1: 建立技能與參考文件

**Files:**
- Create: `.agents/skills/generating-cicg-idiom-cards/SKILL.md`
- Create: `.agents/skills/generating-cicg-idiom-cards/references/required-specs.md`
- Create: `.agents/skills/generating-cicg-idiom-cards/references/review-checklist.md`

**Interfaces:**
- Consumes: GitHub `main`、Approved 規格、`PROJECT_PROMPT.md`、Manifest、Drive 素材
- Produces: 可由專案 Agent 搜尋與執行的技能入口

- [ ] **Step 1: 記錄無技能時的基線失敗**

在設計規格中保存：目前沒有 `SKILL.md` 與批次狀態檔，新聊天需要手動貼完整指令，且不能可靠判斷上一批進度。

- [ ] **Step 2: 建立最小技能**

技能 frontmatter：

```yaml
---
name: generating-cicg-idiom-cards
description: Use when a Chinese-Idiom-Chain-Game project chat needs to generate, continue, review, repair, approve, upload, or plan an idiom-card batch.
---
```

技能正文必須定義：觸發條件、讀取順序、接續決策、狀態更新、產圖與審核 Gate、停止條件。

- [ ] **Step 3: 建立精簡參考文件**

`required-specs.md` 保存正式文件路徑與優先序；`review-checklist.md` 保存 Blocking Gate，不複製所有長篇規格。

- [ ] **Step 4: 靜態驗證技能格式**

檢查：

```text
frontmatter name 只含英文字母與連字號
description 以 Use when 開頭
所有引用路徑存在
沒有 TBD／TODO／虛構 Drive ID
```

- [ ] **Step 5: Commit**

```bash
git add .agents/skills/generating-cicg-idiom-cards
git commit -m "docs: add idiom card generation skill"
```

---

### Task 2: 建立跨聊天批次狀態

**Files:**
- Create: `docs/card-prompts/state/README.md`
- Create: `docs/card-prompts/state/current-batch.json`

**Interfaces:**
- Consumes: 技能定義的狀態契約
- Produces: 新聊天可讀取與更新的 Active Batch 狀態

- [ ] **Step 1: 建立狀態契約說明**

README 必須定義合法狀態：

```text
planned
content-ready
generated
changes-requested
approved
uploaded
archived
```

並定義每次產圖、審核、上傳與批次完成後必須更新。

- [ ] **Step 2: 建立安全初始狀態**

`current-batch.json` 初始值：

```json
{
  "schemaVersion": 1,
  "project": "Chinese-Idiom-Chain-Game",
  "activeBatchId": null,
  "workflowStatus": "ready",
  "nextAction": "Select or confirm the next batch of idiom cards.",
  "lastUpdatedAt": "2026-08-06T00:00:00+08:00",
  "cards": []
}
```

不得虛構已完成卡片、Drive File ID 或 Approved 狀態。

- [ ] **Step 3: 驗證 JSON**

Run:

```bash
node -e "JSON.parse(require('node:fs').readFileSync('docs/card-prompts/state/current-batch.json','utf8')); console.log('valid')"
```

Expected: `valid`

- [ ] **Step 4: Commit**

```bash
git add docs/card-prompts/state
git commit -m "docs: add idiom card batch state"
```

---

### Task 3: 接上專案入口

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/card-prompts/README.md`

**Interfaces:**
- Consumes: 技能與狀態檔路徑
- Produces: 新聊天必讀與自動接續規則

- [ ] **Step 1: 更新 AGENTS.md**

在成語圖卡任務區加入：

```text
先使用 .agents/skills/generating-cicg-idiom-cards/SKILL.md
再讀 docs/card-prompts/state/current-batch.json
```

並明確要求「繼續產圖／下一批／修正上一批」先讀狀態，不要求使用者重貼完整規格。

- [ ] **Step 2: 更新提示語庫 README**

將技能與狀態檔放在使用順序最前段，並說明 `current-batch.json` 只保存接續狀態，不取代 Drive、Manifest 或審核證據。

- [ ] **Step 3: 檢查路徑一致**

搜尋下列字串，確認拼字完全一致：

```text
.agents/skills/generating-cicg-idiom-cards/SKILL.md
docs/card-prompts/state/current-batch.json
```

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md docs/card-prompts/README.md
git commit -m "docs: route card work through project skill"
```

---

### Task 4: 驗證與合併

**Files:**
- Verify all files created or modified above

**Interfaces:**
- Consumes: 完整 docs-only 變更
- Produces: 可合併 PR 與 CI 證據

- [ ] **Step 1: 自我審核**

檢查：

- 技能觸發描述可搜尋。
- 新聊天有唯一入口。
- 狀態檔沒有虛構完成紀錄。
- 規格優先序一致。
- 產圖與 Approved 權限分離。
- 沒有修改 production code。

- [ ] **Step 2: 執行完整驗證**

Run:

```bash
./scripts/verify.sh
```

Expected: 所有既有 Repository Gate 通過。

- [ ] **Step 3: 建立 docs-only PR**

PR title:

```text
docs: add resumable idiom card generation skill
```

- [ ] **Step 4: 確認 CI 與漂移**

確認：

```text
CI success
behind_by = 0
unresolved review threads = 0
```

- [ ] **Step 5: Squash Merge**

CI 與審核通過後直接 Squash Merge 到 `main`。