# Chapter One Card Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立第一章 61 張成語圖卡的 GitHub 機器主檔、Google Sheet 人工管理表與自動驗證 Gate。

**Architecture:** 使用 `data/cards/chapter-1-card-catalog.json` 作為可版本化的 canonical catalog；Node 驗證器負責與第一章關卡、稀有度外框、難易度、性別配額及 SSR 史詩規則交叉驗證。Google Sheet `Card_Catalog` 是人工管理投影，欄位與 canonical catalog 對齊，但不得取代 GitHub main 的真實狀態。

**Tech Stack:** Node.js 22、ES modules、內建 `node:test`、TypeScript strict、Google Sheets API、既有 Vite PWA CI。

## Global Constraints

- 第一章固定 20 關、61 個唯一 `idiomId` 與 61 個唯一成語文字。
- 不修改 IndexedDB 進度 schema。
- 稀有度與卡片難易度互相獨立。
- N／R／SR／SSR 必須使用各自專屬外框。
- UR 只保留給正式授權 IP 聯名，不得進第一章一般卡池。
- 全章及每一批女性主要角色比例均不得低於 50%。
- SSR 必須具英雄主角、宏大場景、電影式構圖、傳奇光效與高張力決定性瞬間。
- 主插圖不得烙入正式卡框、標籤、圖卡文字或浮水印。

---

### Task 1: 建立失敗測試與驗證契約

**Files:**
- Create: `tests/chapter-one-card-catalog.test.mjs`
- Create: `scripts/validate-card-catalog.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `src/puzzle/levels.ts` 編譯後的 `PUZZLE_LEVELS`、`data/cards/chapter-1-card-catalog.json`
- Produces: `validateChapterOneCardCatalog(catalog, levels)` 與 CLI exit code

- [ ] **Step 1: Write the failing tests**

測試必須覆蓋：61 張唯一卡、與 placement 完全一致、稀有度外框映射、E～S 名稱映射、非空類別與完整提示語、全章及逐批女性 50%、SSR 史詩欄位與提示語。

- [ ] **Step 2: Run tests to verify RED**

Run: `npm run test:card-catalog`

Expected: FAIL，因驗證器與 catalog 尚不存在。

- [ ] **Step 3: Implement the validator**

匯出：

```js
export function validateChapterOneCardCatalog(catalog, levels) {
  return { errors: string[], summary: { totalCards, femaleLeadCards, femaleRatio, batches } };
}
```

CLI 在 `errors.length > 0` 時輸出每項錯誤並設 `process.exitCode = 1`。

- [ ] **Step 4: Run tests to verify GREEN after Task 2 data exists**

Run: `npm run test:card-catalog`

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add tests/chapter-one-card-catalog.test.mjs scripts/validate-card-catalog.mjs package.json
git commit -m "test: add chapter one card catalog gates"
```

### Task 2: 建立 61 張 canonical catalog

**Files:**
- Create: `data/cards/chapter-1-card-catalog.json`

**Interfaces:**
- Consumes: 第一章 `LEVEL_CHAINS`、成語來源 CSV 與四階外框 Registry
- Produces: `schemaVersion: 1`、`chapterId: chapter-1`、`batchSize: 10`、`cards: [...]`

- [ ] **Step 1: Create all 61 records**

每張卡保存設計規格要求的身分、分級、文案、提示語、角色、SSR 與治理欄位。

- [ ] **Step 2: Assign batches and gender leads**

`batch-01`～`batch-06` 各 10 張且至少 5 張女性主角；`batch-07` 唯一一張必須為女性主角。全章女性主角至少 31 張。

- [ ] **Step 3: Assign rarity-specific frames**

只使用：

```text
rarity-frame-n
rarity-frame-r
rarity-frame-sr
rarity-frame-ssr
```

- [ ] **Step 4: Add complete prompts**

每筆 `promptMaster` 均須包含風格、角色、場景、構圖、光影、版面限制與負面限制。SSR 額外附加完整 `ssrEpicPromptBlock`。

- [ ] **Step 5: Run focused tests**

Run: `npm run test:card-catalog`

Expected: PASS。

- [ ] **Step 6: Commit**

```bash
git add data/cards/chapter-1-card-catalog.json
git commit -m "feat: add chapter one card catalog"
```

### Task 3: 接入 Repository CI 與控制中心 Registry

**Files:**
- Modify: `package.json`
- Modify: `scripts/verify.sh`
- Modify: `data/drive-assets/asset-control-center.json`
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `.agents/skills/generating-cicg-idiom-cards/SKILL.md`

**Interfaces:**
- Consumes: `npm run test:card-catalog`
- Produces: 完整 CI 永久 Gate 與跨聊天必讀入口

- [ ] **Step 1: Add package scripts**

加入 `validate:card-catalog` 與 `test:card-catalog`，並納入 `npm test` 或 `scripts/verify.sh`。

- [ ] **Step 2: Register Card_Catalog worksheet**

在 `asset-control-center.json` 的 `worksheets` 加入：

```json
"cardCatalog": "Card_Catalog"
```

- [ ] **Step 3: Update human and agent entry docs**

明確要求產圖前讀取 canonical catalog；不得自行更改稀有度、難易度、性別、文案與提示語。

- [ ] **Step 4: Run repository verification**

Run: `./scripts/verify.sh`

Expected: 全部 Node tests、TypeScript strict、ESLint、Vite PWA build 與 npm audit 通過。

- [ ] **Step 5: Commit**

```bash
git add package.json scripts/verify.sh data/drive-assets/asset-control-center.json README.md AGENTS.md .agents/skills/generating-cicg-idiom-cards/SKILL.md
git commit -m "feat: enforce card catalog workflow"
```

### Task 4: 建立 Google Sheet Card_Catalog

**Files:**
- Update: Google Sheet `1JwdPPz4cjx94MYE5qXJt2GaE67e9HUlzXPY4OPb6S94`

**Interfaces:**
- Consumes: canonical catalog
- Produces: `Card_Catalog`、Control Center KPI、Codebook 欄位定義與 Version History 記錄

- [ ] **Step 1: Add the Card_Catalog sheet**

新增工作表並凍結標題列。

- [ ] **Step 2: Write headers and 61 rows**

欄位與 canonical catalog 對齊，包含完整提示語與角色性別欄位。

- [ ] **Step 3: Add governance entries**

在 `Codebook_Agent` 增加枚舉與 Gate；在 `Version_History` 記錄建立事件。

- [ ] **Step 4: Add dashboard KPIs**

顯示總卡數、女性主角數／占比、批次 Gate、SSR 數與 SSR 史詩提示語完整度。

- [ ] **Step 5: Read back and verify**

確認 61 筆、標題、批次與女性比例正確。

### Task 5: PR、CI 與 Audit

**Files:**
- No new source files unless CI identifies a defect.

- [ ] **Step 1: Open one implementation PR**

Title: `feat: 建立第一章成語圖卡管理主檔`

- [ ] **Step 2: Wait for GitHub Actions**

確認完整 CI 全綠並記錄實際測試數量，不沿用舊數字。

- [ ] **Step 3: Confirm branch freshness**

要求 `behind_by = 0`，若落後則同步 `main` 後重跑 CI。

- [ ] **Step 4: ChatGPT Audit**

核對 61 張卡、性別 Gate、SSR 史詩 Gate、Google Sheet 與 GitHub catalog 一致。

- [ ] **Step 5: Squash merge**

僅在 CI、Review Threads 與 Audit 全部通過後合併。