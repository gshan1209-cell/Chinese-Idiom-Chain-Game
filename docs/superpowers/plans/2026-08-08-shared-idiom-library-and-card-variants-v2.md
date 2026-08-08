# Shared Idiom Library and Card Variants v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立 13 份可供一般卡共用的成語內容包，並用 13 份鬼滅 UR 覆寫資料保存角色、招式與聯名文案。

**Architecture:** 共用成語庫是語文內容的唯一真實來源；聯名覆寫只以 `idiomId` 連結共用資料，不能重複定義典故。單一 Node 驗證器負責 Schema v2 規則、跨目錄狀態與引用完整性。

**Tech Stack:** Node.js 22、ES modules、`node:test`、JSON Schema Draft 2020-12。

## Global Constraints

- 共用內容不得包含 IP、角色或招式名稱。
- 聯名覆寫不得重新定義釋義、典故或來源。
- 箴言固定四句，每句五個繁體漢字。
- 共用基礎稀有度只允許 SR 或 SSR；UR 只屬聯名覆寫。
- 本批全部維持 `NeedsReview`。
- 沒有可稽核授權證據時不得標記為可發布或分配正式 UR 卡號。

---

### Task 1: 以測試定義 Schema v2 與覆寫邊界

**Files:**
- Modify: `tests/idiom-content-package.test.mjs`
- Modify: `scripts/validate-idiom-content-packages.mjs`

**Interfaces:**
- Produces: `validateIdiomContentPackage(record, options)`
- Produces: `validateCardVariant(record, options)`
- Produces: `validateAllIdiomContentPackages(projectRoot)`
- Produces: `validateAllCardVariants(projectRoot, idiomIds)`
- Produces: `validateAllContentLibraries(projectRoot)`

- [ ] **Step 1: Write the failing tests**

新增測試，要求 Schema v2、四句五言、IP 隔離、`idiomId` 交叉引用、授權發布 Gate，以及 13＋13 筆資料總數。

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
node --test tests/idiom-content-package.test.mjs
```

Expected: FAIL，因舊驗證器沒有 `validateCardVariant` 與 Schema v2 支援。

- [ ] **Step 3: Implement minimal validation**

在既有驗證器中新增上述五個介面，並保持單一 CLI 入口。

- [ ] **Step 4: Run tests to verify GREEN**

Run:

```bash
node --test tests/idiom-content-package.test.mjs
node scripts/validate-idiom-content-packages.mjs
```

Expected: 8 tests pass；輸出 13 份共用成語及 13 份聯名覆寫。

### Task 2: 升級共用成語 Schema 並建立 13 份內容包

**Files:**
- Modify: `data/idioms/idiom-content-package.schema.json`
- Modify: `data/idioms/review/mian-li-cang-zhen.json`
- Create: `data/idioms/review/*.json` 共 12 份

**Interfaces:**
- Consumes: `validateIdiomContentPackage`
- Produces: 13 個唯一 `idiomId`

- [ ] **Step 1: Upgrade the schema**

將 `schemaVersion` 固定為 2，加入 `allusionType`、`cardAllusion`、`baseRarity`、`genericCardCopy` 與新 Renderer 欄位。

- [ ] **Step 2: Create the content packages**

每份包含注音、釋義、典故、來源、例句、一般副標與五言四句箴言；資料不足者標記 `sourceStatus: NeedsReview`。

- [ ] **Step 3: Validate all packages**

Run:

```bash
node scripts/validate-idiom-content-packages.mjs
```

Expected: 成語內容包 13 份通過。

### Task 3: 建立聯名覆寫 Schema 與 13 份鬼滅 UR 覆寫

**Files:**
- Create: `data/card-variants/card-variant.schema.json`
- Create: `data/card-variants/review/kimetsu/*.json` 共 13 份

**Interfaces:**
- Consumes: 13 個共用 `idiomId`
- Produces: 13 個唯一 `variantId`

- [ ] **Step 1: Create the variant schema**

定義角色、招式、聯名副標、聯名箴言、構圖、授權與發布狀態。

- [ ] **Step 2: Create 13 review variants**

善逸固定使用「一鳴驚人」；所有招式譯名維持 `NeedsReview`。

- [ ] **Step 3: Run cross-reference validation**

Run:

```bash
node --test tests/idiom-content-package.test.mjs
```

Expected: 13 個 `idiomId` 全部存在，沒有聯名覆寫重新定義典故。

### Task 4: 更新治理文件並完成回歸

**Files:**
- Modify: `docs/idioms/README.md`
- Create: `docs/idioms/review/kimetsu-shared-idiom-batch-v1.0.md`
- Create: `docs/superpowers/specs/2026-08-08-shared-idiom-library-and-card-variants-v2-design.md`
- Create: `docs/superpowers/plans/2026-08-08-shared-idiom-library-and-card-variants-v2.md`

- [ ] **Step 1: Document the source-of-truth split**

說明一般文案位於共用成語庫，角色及招式只位於聯名覆寫層。

- [ ] **Step 2: Record review blockers**

列出詞條地位、注音、典源、招式譯名及 IP 授權待校項目。

- [ ] **Step 3: Run targeted regression**

Run:

```bash
node --test tests/idiom-content-package.test.mjs
node scripts/validate-idiom-content-packages.mjs
```

Expected: 8/8 tests pass，13＋13 筆資料通過。

- [ ] **Step 4: Run repository verification**

Run:

```bash
./scripts/verify.sh
```

Expected: 所有 Repository Gate 通過；若環境無法取得完整 Repository，必須明確記錄僅完成 targeted verification，不得宣稱完整 CI 全綠。
