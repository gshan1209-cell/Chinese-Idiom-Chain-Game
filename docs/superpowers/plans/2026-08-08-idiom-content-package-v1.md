# 成語內容包標準 v1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立可重複使用的成語內容包、永久驗證 Gate，以及「綿裡藏針」首份 NeedsReview 範例。

**Architecture:** JSON 內容包是機器可讀的唯一真實來源，Markdown 保存人類校訂紀錄；獨立 Node 驗證器檢查語義界線、來源、主題與 Renderer 投影。現有 UR 提示語只引用內容包，不再自行承擔成語資料來源責任。

**Tech Stack:** JSON Schema 2020-12、Node.js ESM、`node:test`、Markdown、GitHub Actions 既有 `./scripts/verify.sh`。

## Global Constraints

- 不修改遊戲 Runtime 或 IndexedDB schema。
- 不把「綿裡藏針」加入正式 `data/idioms.source.csv`。
- 不配置正式 `UR-####`。
- 典故不得包含 IP 劇情或角色設定。
- `NeedsReview` 資料只能存放於 `data/idioms/review/`。
- 主題必須對應 `data/cards/theme-badge-registry.json`。
- 所有新增驗證必須進入永久 `./scripts/verify.sh` Gate。

---

### Task 1: 建立規格、Schema 與目錄說明

**Files:**
- Create: `docs/superpowers/specs/2026-08-08-idiom-content-package-v1-design.md`
- Create: `docs/idioms/README.md`
- Create: `data/idioms/idiom-content-package.schema.json`

**Interfaces:**
- Produces: `IdiomContentPackage` JSON 契約與 Review/Approved 路徑規則。
- Consumes: `data/cards/theme-badge-registry.json` 的主題治理概念。

- [ ] **Step 1: 寫入已核准設計規格**
- [ ] **Step 2: 建立 JSON Schema，鎖定必要欄位與 enum**
- [ ] **Step 3: 建立人類操作說明與狀態移動規則**
- [ ] **Step 4: 以 JSON parser 驗證 Schema 可讀**
- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-08-08-idiom-content-package-v1-design.md docs/idioms/README.md data/idioms/idiom-content-package.schema.json
git commit -m "docs: define reusable idiom content packages"
```

### Task 2: 先寫失敗測試與最小驗證器

**Files:**
- Create: `tests/idiom-content-package.test.mjs`
- Create: `scripts/validate-idiom-content-packages.mjs`
- Modify: `package.json`
- Modify: `scripts/verify.sh`

**Interfaces:**
- Produces: `validateIdiomContentPackage(record, context)` 與 CLI 永久 Gate。
- Consumes: `data/idioms/review/*.json`、`data/idioms/approved/*.json`、主題 Registry。

- [ ] **Step 1: 寫入測試，要求四字、四組注音、來源、異形關係與 Renderer 一致**
- [ ] **Step 2: 執行測試並確認因驗證器不存在而 RED**

```bash
node --test tests/idiom-content-package.test.mjs
```

Expected: FAIL，指出無法匯入 `validate-idiom-content-packages.mjs`。

- [ ] **Step 3: 實作最小驗證器**
- [ ] **Step 4: 執行測試並確認 GREEN**

```bash
node --test tests/idiom-content-package.test.mjs
```

Expected: PASS。

- [ ] **Step 5: 把 `validate:idiom-content` 與 `test:idiom-content` 加入 package scripts 及 verify**
- [ ] **Step 6: Commit**

```bash
git add scripts/validate-idiom-content-packages.mjs tests/idiom-content-package.test.mjs package.json scripts/verify.sh
git commit -m "test: add idiom content package gate"
```

### Task 3: 建立「綿裡藏針」首份內容包

**Files:**
- Create: `data/idioms/review/mian-li-cang-zhen.json`
- Create: `docs/idioms/review/mian-li-cang-zhen-content-review-v1.0.md`

**Interfaces:**
- Produces: `idiom-mian-li-cang-zhen` NeedsReview 資料。
- Consumes: 教育部《重編國語辭典修訂本》與《國語辭典簡編本》來源證據。

- [ ] **Step 1: 建立結構化內容包**
- [ ] **Step 2: 建立人類校訂紀錄，分開釋義、典故摘要與來源**
- [ ] **Step 3: 執行單檔與全目錄驗證**

```bash
npm run validate:idiom-content
npm run test:idiom-content
```

Expected: PASS，輸出已驗證 1 份內容包。

- [ ] **Step 4: Commit**

```bash
git add data/idioms/review/mian-li-cang-zhen.json docs/idioms/review/mian-li-cang-zhen-content-review-v1.0.md
git commit -m "docs: add Mian Li Cang Zhen content review"
```

### Task 4: 對齊 UR 提示語與資產註冊

**Files:**
- Modify: `docs/card-prompts/shared/CICG_UR_Kimetsu_Shinobu_MianLiCangZhen_FullPrompt_v1.0.md`
- Modify: `data/drive-assets/ur-card-assets-2026-08-08.json`

**Interfaces:**
- Produces: 提示語對內容包的單向引用與最新 Review metadata。
- Consumes: `data/idioms/review/mian-li-cang-zhen.json`。

- [ ] **Step 1: 把提示語的 `allusionBody` 改為典故摘要**
- [ ] **Step 2: 新增 `idiomContentPackagePath`、`contentStatus` 與來源狀態**
- [ ] **Step 3: 保留 `RV-UR-0002`、`formalCardNumber = null` 與授權 Gate**
- [ ] **Step 4: 更新 Drive 同一 File ID 的提示語內容**
- [ ] **Step 5: 讀回 Drive metadata，更新 GitHub 資產雜湊與大小**
- [ ] **Step 6: Commit**

```bash
git add docs/card-prompts/shared/CICG_UR_Kimetsu_Shinobu_MianLiCangZhen_FullPrompt_v1.0.md data/drive-assets/ur-card-assets-2026-08-08.json
git commit -m "docs: link Shinobu UR prompt to idiom content package"
```

### Task 5: 完整驗證與 PR 收尾

**Files:**
- Modify: `docs/superpowers/plans/2026-08-08-idiom-content-package-v1.md`

**Interfaces:**
- Produces: PR #51 可稽核驗證紀錄。
- Consumes: 前四個 Task 的所有產物。

- [ ] **Step 1: 執行內容包專屬驗證**
- [ ] **Step 2: 執行 `./scripts/verify.sh`**
- [ ] **Step 3: 確認 PR changed files、Drive File ID 與 GitHub registry 一致**
- [ ] **Step 4: 更新 PR #51 說明與驗證結果**
- [ ] **Step 5: CI 全綠後 Squash Merge**
