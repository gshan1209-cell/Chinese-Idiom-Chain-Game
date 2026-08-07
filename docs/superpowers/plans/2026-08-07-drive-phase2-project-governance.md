# Drive Phase 2 全專案素材治理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 Phase 1 的 Registry、Migration Ledger、rollback、physical audit 與 CI Gate 擴展到全專案非圖卡素材，完成唯讀 inventory、Asset Control Center freshness、7 張背景納管、PR #36 安全收斂與 lazy-activated Drive 拓樸。

**Architecture:** GitHub 保存通用 Project Asset Registry、Schema、純 TypeScript validators、控制中心快照、inventory、PR #36 candidate evidence、Migration Ledgers 與 reports；Google Drive 保存 source masters、Review、Approved、Evidence 與 Release artifacts。既有 `idiom-card-assets.json` 保持專屬，新增 `project-assets.json` 管理非圖卡邏輯資產，永久 CLI 對兩份 Registry 做 Drive File ID、source／derivative、folder lifecycle 與 dashboard freshness 的交叉驗證。

**Tech Stack:** Node.js `>=22.13.0`、TypeScript `6.0.3` strict、Node test runner、JSON／JSON Schema、GitHub Actions、Google Drive metadata／move API、Google Sheets Asset Control Center。

## Global Constraints

- 真實狀態優先序固定為 `GitHub main → GitHub Actions → Repository Registry／Schema／Reports → Drive Approved → Asset Control Center → PR／Review／Inbox → local-only → chat`。
- Asset Control Center 是 derived human dashboard，不得覆寫 GitHub Registry 的 canonical status、checksum、Folder ID 或 current master。
- `idiom-card-assets.json` 保持圖卡專屬；非圖卡素材使用 `project-assets.json`。
- source master 留在 Drive；只有 Approved source master 的 runtime derivative 才能提交 GitHub `public/assets/`。
- Drive File ID 必須跨所有 Registry 唯一；GitHub-only derivative 的 Drive File ID 為 `null`。
- Evidence 不使用 current master；Release artifact 必須綁定 release version 與 40 字元 commit SHA。
- 新素材先進 `80_Inbox/<Domain>/<YYYY-MM-DD>_<BatchId>`；每批 mutation 上限為 `10 files` 或 `1 logical asset family`。
- 每批 mutation 前必須有 planned Ledger、before／after／rollback snapshot；驗證失敗立即停止並 rollback。
- 空白領域採 lazy activation，只建立被真實資產或 evidence 使用的最小必要資料夾。
- PR #36 不得直接 merge；13 張 PNG 與過時智慧跳格程式／文件必須分離處理。
- 不人工核准 7 張背景、不產製新素材、不修改主玩法、關卡、卡池、IndexedDB Schema 或 PWA 行為。
- 不永久刪除 Drive 素材；舊版、重複候選與不可驗證素材留 Inbox／Archive。
- 程式修改一律 TDD：RED → 最小 GREEN → 完整 `./scripts/verify.sh`。

---

## File Map

### Create

```text
src/cards/drive-assets/project-asset-types.ts
src/cards/drive-assets/validate-project-asset-registry.ts
src/cards/drive-assets/validate-project-asset-folder-assignments.ts
src/cards/drive-assets/validate-drive-registry-cross-links.ts
src/cards/drive-assets/validate-asset-control-center.ts

tests/project-drive-asset-contract.test.mjs
tests/project-drive-asset-registry.test.mjs
tests/project-drive-cross-registry.test.mjs
tests/project-drive-folder-assignment.test.mjs
tests/project-drive-control-center.test.mjs
tests/project-drive-inventory.test.mjs
tests/project-drive-pr36-inventory.test.mjs
tests/project-drive-physical-audit.test.mjs

data/drive-assets/project-asset.schema.json
data/drive-assets/project-inventory.schema.json
data/drive-assets/project-assets.json
data/drive-assets/project-inventory-2026-08-07.json
data/drive-assets/pr36-assets.json
data/drive-assets/physical-audit-phase2-2026-08-07.json
data/drive-assets/migrations/2026-08-07-phase2-batch1-control-center-backgrounds.json
data/drive-assets/migrations/2026-08-07-phase2-batch2-pr36-extraction.json
data/drive-assets/migrations/2026-08-07-phase2-batch3-lazy-topology.json

docs/superpowers/reports/2026-08-07-drive-phase2-baseline-inventory.md
docs/superpowers/reports/2026-08-07-drive-phase2-pr36-disposition.md
docs/superpowers/reports/2026-08-07-drive-phase2-governance-report.md
```

### Modify

```text
.github/workflows/ci.yml
src/cards/drive-assets/index.ts
src/cards/drive-assets/drive-asset-types.ts
src/cards/drive-assets/validate-drive-migration-ledger.ts
scripts/validate-drive-assets.mjs
package.json
scripts/verify.sh
data/drive-assets/drive-migration.schema.json
data/drive-assets/drive-folders.json
data/drive-assets/asset-control-center.json
tests/card-drive-migration-ledger.test.mjs
AGENTS.md
docs/superpowers/specs/README.md
docs/superpowers/reports/README.md
```

### Preserve Without Moving

```text
src/cards/drive-assets/validate-drive-asset-registry.ts
src/cards/drive-assets/validate-drive-folder-registry.ts
data/drive-assets/idiom-card-assets.json
```

`src/cards/drive-assets` 在 Phase 2 保持相容，不執行無關的目錄搬遷。

---

### Task 1: 建立通用 Project Asset Contract

**Files:**
- Create: `src/cards/drive-assets/project-asset-types.ts`
- Modify: `src/cards/drive-assets/index.ts`
- Test: `tests/project-drive-asset-contract.test.mjs`

**Interfaces:**
- Produces `PROJECT_ASSET_DOMAINS`、`PROJECT_ASSET_ROLES`、`PROJECT_ASSET_LIFECYCLE_STATUSES`、`ProjectAssetRecord`、`ProjectAssetRegistry`。

- [ ] **Step 1: Write the failing export test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROJECT_ASSET_DOMAINS,
  PROJECT_ASSET_ROLES,
  PROJECT_ASSET_LIFECYCLE_STATUSES,
} from '../.test-dist/src/cards/drive-assets/index.js';

test('exports the Phase 2 project asset vocabulary', () => {
  assert.deepEqual(PROJECT_ASSET_DOMAINS, [
    'project-management', 'design-spec', 'branding', 'background',
    'ui-component', 'map-progress', 'item-icon', 'bonus-mode',
    'pwa-icon', 'game-content', 'localization', 'license-evidence',
    'test-evidence', 'release-store', 'runtime-derivative',
  ]);
  assert.deepEqual(PROJECT_ASSET_ROLES, [
    'source-master', 'runtime-derivative', 'evidence',
    'release-artifact', 'dashboard', 'requirement-only',
  ]);
  assert.deepEqual(PROJECT_ASSET_LIFECYCLE_STATUSES, [
    'missing', 'intake', 'review', 'changes-requested', 'approved',
    'published', 'blocked', 'quarantined', 'archived',
    'rejected', 'unverifiable',
  ]);
});
```

- [ ] **Step 2: Run RED**

```bash
npm run compile:core
node --test tests/project-drive-asset-contract.test.mjs
```

Expected: FAIL because the exports do not exist。

- [ ] **Step 3: Implement the contract**

```ts
export const PROJECT_ASSET_DOMAINS = [
  'project-management', 'design-spec', 'branding', 'background',
  'ui-component', 'map-progress', 'item-icon', 'bonus-mode',
  'pwa-icon', 'game-content', 'localization', 'license-evidence',
  'test-evidence', 'release-store', 'runtime-derivative',
] as const;

export const PROJECT_ASSET_ROLES = [
  'source-master', 'runtime-derivative', 'evidence',
  'release-artifact', 'dashboard', 'requirement-only',
] as const;

export const PROJECT_ASSET_LIFECYCLE_STATUSES = [
  'missing', 'intake', 'review', 'changes-requested', 'approved',
  'published', 'blocked', 'quarantined', 'archived',
  'rejected', 'unverifiable',
] as const;

export interface ProjectAssetRecord {
  readonly recordId: string;
  readonly identity: string;
  readonly assetNameZh: string;
  readonly domain: (typeof PROJECT_ASSET_DOMAINS)[number];
  readonly assetType: string;
  readonly role: (typeof PROJECT_ASSET_ROLES)[number];
  readonly version: string;
  readonly lifecycleStatus: (typeof PROJECT_ASSET_LIFECYCLE_STATUSES)[number];
  readonly approvalStatus: 'not-started' | 'pending' | 'approved' | 'rejected' | 'unverifiable';
  readonly currentMaster: boolean;
  readonly priority: 'P0' | 'P1' | 'P2';
  readonly requiredQty: number;
  readonly availableQty: number;
  readonly gapQty: number;
  readonly sourceSystem: 'none' | 'drive' | 'github' | 'drive+github' | 'github-pr';
  readonly driveFileId: string | null;
  readonly parentFolderKey: string | null;
  readonly githubPath: string | null;
  readonly githubPr: number | null;
  readonly filename: string | null;
  readonly mimeType: string | null;
  readonly sizeBytes: number | null;
  readonly sha256: string | null;
  readonly widthPx: number | null;
  readonly heightPx: number | null;
  readonly transparent: boolean | null;
  readonly sourceAssetId: string | null;
  readonly sourceSha256: string | null;
  readonly releaseVersion: string | null;
  readonly boundCommitSha: string | null;
  readonly approvalEvidenceIds: readonly string[];
  readonly driftState: 'aligned' | 'drive-only' | 'github-only' | 'candidate-conflict' | 'missing' | 'outdated' | 'blocked' | 'stale-dashboard';
  readonly lastVerifiedAt: string;
  readonly owner: string;
  readonly nextAction: string;
  readonly notes: string;
}

export interface ProjectAssetRegistry {
  readonly schemaVersion: 1;
  readonly updatedAt: string;
  readonly assets: readonly ProjectAssetRecord[];
}
```

- [ ] **Step 4: Run GREEN and commit**

```bash
npm run compile:core
node --test tests/project-drive-asset-contract.test.mjs
git add src/cards/drive-assets tests/project-drive-asset-contract.test.mjs
git commit -m "feat: add project asset governance contracts"
```

---

### Task 2: 實作 Project Asset Registry Validator

**Files:**
- Create: `src/cards/drive-assets/validate-project-asset-registry.ts`
- Modify: `src/cards/drive-assets/index.ts`
- Test: `tests/project-drive-asset-registry.test.mjs`

**Interfaces:**
- Produces `validateProjectAssetRegistry(registry): readonly ProjectAssetIssue[]`。
- Issue 固定為 `{ code, recordId, message }`，依 `code`、`recordId` 排序。

- [ ] **Step 1: Write failing tests**

```js
test('rejects invalid quantity arithmetic', () => {
  const issues = validateProjectAssetRegistry({
    schemaVersion: 1,
    updatedAt: now,
    assets: [{ ...background, requiredQty: 3, availableQty: 1, gapQty: 0 }],
  });
  assert.ok(issues.some(({ code }) => code === 'invalid-gap-quantity'));
});

test('rejects an approved current master without evidence', () => {
  const issues = validateProjectAssetRegistry({
    schemaVersion: 1,
    updatedAt: now,
    assets: [{
      ...background,
      lifecycleStatus: 'approved',
      approvalStatus: 'approved',
      currentMaster: true,
      approvalEvidenceIds: [],
    }],
  });
  assert.ok(issues.some(({ code }) => code === 'approved-missing-evidence'));
});

test('rejects a runtime derivative without source binding', () => {
  const issues = validateProjectAssetRegistry({
    schemaVersion: 1,
    updatedAt: now,
    assets: [{
      ...runtimeDerivative,
      sourceAssetId: null,
      sourceSha256: null,
    }],
  });
  assert.ok(issues.some(({ code }) => code === 'derivative-missing-source'));
});
```

- [ ] **Step 2: Run RED**

```bash
npm run compile:core
node --test tests/project-drive-asset-registry.test.mjs
```

- [ ] **Step 3: Implement exact validation rules**

Required issue codes:

```ts
'malformed-project-registry'
'malformed-project-asset'
'duplicate-project-record-id'
'invalid-project-version'
'invalid-gap-quantity'
'missing-physical-location'
'unexpected-physical-location'
'invalid-project-sha256'
'approved-missing-evidence'
'invalid-current-master-state'
'duplicate-project-current-master'
'pr-review-missing-pr'
'derivative-missing-source'
'evidence-cannot-be-current-master'
'release-missing-binding'
```

Rules:

- `recordId` unique。
- version matches `/^\d+\.\d+(?:-[a-z0-9-]+)?$/`。
- quantities are non-negative integers and `gapQty === Math.max(requiredQty - availableQty, 0)`。
- `missing`／`requirement-only` have no physical location and may have `sha256 = null`。
- Drive physical assets require Drive ID、parent key、filename、MIME、positive size and 64-char lowercase SHA-256。
- GitHub runtime derivatives require GitHub path、filename、MIME、positive size and SHA-256。
- current master requires `approved|published`、`approvalStatus=approved` and non-empty evidence IDs。
- one `domain + assetType + identity` family has at most one current master。
- `github-pr` requires positive PR number。
- runtime derivative requires source ID and source checksum。
- evidence and requirement-only cannot be current master。
- release artifact requires release version and `/^[a-f0-9]{40}$/` commit SHA。
- malformed raw JSON returns issues instead of throwing。

- [ ] **Step 4: Run GREEN and commit**

```bash
npm run compile:core
node --test tests/project-drive-asset-registry.test.mjs
git add src/cards/drive-assets tests/project-drive-asset-registry.test.mjs
git commit -m "feat: validate project asset registry"
```

---

### Task 3: 建立跨 Registry 與 Folder Lifecycle Gate

**Files:**
- Create: `src/cards/drive-assets/validate-drive-registry-cross-links.ts`
- Create: `src/cards/drive-assets/validate-project-asset-folder-assignments.ts`
- Modify: `src/cards/drive-assets/index.ts`
- Test: `tests/project-drive-cross-registry.test.mjs`
- Test: `tests/project-drive-folder-assignment.test.mjs`

**Interfaces:**
- Produces `validateDriveRegistryCrossLinks(projectRegistry, idiomRegistry)`。
- Produces `validateProjectAssetFolderAssignments(projectRegistry, folderRegistry)`。

- [ ] **Step 1: Write duplicate ID and source RED tests**

```js
test('rejects a Drive File ID reused across registries', () => {
  const issues = validateDriveRegistryCrossLinks(
    { schemaVersion: 1, updatedAt: now, assets: [projectAsset] },
    { schemaVersion: 1, updatedAt: now, assets: [
      { ...idiomAsset, driveFileId: projectAsset.driveFileId },
    ] },
  );
  assert.ok(issues.some(({ code }) => code === 'cross-registry-drive-file-id'));
});

test('requires a derivative source to be an approved current master', () => {
  const source = { ...projectAsset, lifecycleStatus: 'review', currentMaster: false };
  const derivative = { ...runtimeDerivative, sourceAssetId: source.recordId, sourceSha256: source.sha256 };
  const issues = validateDriveRegistryCrossLinks(
    { schemaVersion: 1, updatedAt: now, assets: [source, derivative] },
    emptyIdiomRegistry,
  );
  assert.ok(issues.some(({ code }) => code === 'derivative-source-not-approved'));
});
```

- [ ] **Step 2: Write folder lifecycle RED**

```js
test('rejects a review asset assigned to an approved folder', () => {
  const issues = validateProjectAssetFolderAssignments(projectRegistry, folderRegistry);
  assert.ok(issues.some(({ code }) => code === 'project-asset-folder-role-mismatch'));
});
```

- [ ] **Step 3: Run RED**

```bash
npm run compile:core
node --test tests/project-drive-cross-registry.test.mjs tests/project-drive-folder-assignment.test.mjs
```

- [ ] **Step 4: Implement rules**

- Ignore null Drive IDs; every non-null Drive ID appears once across both registries。
- `sourceAssetId` resolves in project registry and points to approved／published current master。
- `sourceSha256` equals source SHA-256。
- Review／changes-requested → review or inbox folder。
- Approved／published source master → approved folder。
- Intake／blocked／quarantined → inbox or archive folder。
- Archived／rejected／unverifiable → archive folder。
- Dashboard／active evidence／design spec → container or reference folder。
- GitHub derivative、missing and requirement-only → no Drive parent。

- [ ] **Step 5: Run GREEN and commit**

```bash
npm run compile:core
node --test tests/project-drive-cross-registry.test.mjs tests/project-drive-folder-assignment.test.mjs
git add src/cards/drive-assets tests/project-drive-*.test.mjs
git commit -m "feat: validate project asset cross links"
```

---

### Task 4: 建立 Asset Control Center Freshness Gate

**Files:**
- Create: `src/cards/drive-assets/validate-asset-control-center.ts`
- Modify: `src/cards/drive-assets/index.ts`
- Test: `tests/project-drive-control-center.test.mjs`

**Interfaces:**
- Produces `validateAssetControlCenterSnapshot(snapshot, projectRegistry, idiomRegistry, context)`。
- `context` is `{ currentMainSha: string; openAssetPrs: readonly number[] }`。

- [ ] **Step 1: Write freshness RED tests**

```js
test('marks a mismatched baseline SHA stale', () => {
  const issues = validateAssetControlCenterSnapshot(
    controlCenter,
    projectRegistry,
    idiomRegistry,
    { currentMainSha: 'a'.repeat(40), openAssetPrs: [36] },
  );
  assert.ok(issues.some(({ code }) => code === 'stale-dashboard-main-sha'));
});

test('rejects Registry count mismatch', () => {
  const snapshot = structuredClone(controlCenter);
  snapshot.currentSnapshot.approvedCurrentMasters = 999;
  const issues = validateAssetControlCenterSnapshot(
    snapshot,
    projectRegistry,
    idiomRegistry,
    { currentMainSha: snapshot.currentSnapshot.baselineGitHubMainSha, openAssetPrs: [36] },
  );
  assert.ok(issues.some(({ code }) => code === 'dashboard-count-mismatch'));
});
```

- [ ] **Step 2: Run RED**

```bash
npm run compile:core
node --test tests/project-drive-control-center.test.mjs
```

- [ ] **Step 3: Implement derived KPI checks**

```ts
const approvedCurrentMasters =
  project.assets.filter(({ currentMaster }) => currentMaster).length
  + idiom.assets.filter(({ currentApproved }) => currentApproved).length;

const reviewOrPrItems =
  project.assets.filter(({ lifecycleStatus, sourceSystem }) =>
    lifecycleStatus === 'review' || sourceSystem === 'github-pr').length
  + idiom.assets.filter(({ status }) => status === 'review').length;

const missingP0Assets = project.assets.filter(
  ({ priority, gapQty }) => priority === 'P0' && gapQty > 0,
).length;
```

Also require:

- valid 40-char baseline SHA equal to context SHA。
- `openAssetPr` is null or in `openAssetPrs`。
- tracked logical count equals distinct project identities plus distinct idiom asset families。
- dashboard timestamp cannot be more than 5 minutes newer than both Registries without a matching Registry update。
- conflicts return issues; validator never rewrites Registry。

- [ ] **Step 4: Run GREEN and commit**

```bash
npm run compile:core
node --test tests/project-drive-control-center.test.mjs
git add src/cards/drive-assets tests/project-drive-control-center.test.mjs
git commit -m "feat: validate asset control center freshness"
```

---

### Task 5: Batch 0 全專案唯讀 Inventory

**Files:**
- Create: `data/drive-assets/project-inventory.schema.json`
- Create: `data/drive-assets/project-inventory-2026-08-07.json`
- Create: `docs/superpowers/reports/2026-08-07-drive-phase2-baseline-inventory.md`
- Test: `tests/project-drive-inventory.test.mjs`

**Interfaces:**
- Immutable evidence for one capture timestamp。
- No Drive create／move／rename／delete call in this task。

- [ ] **Step 1: Write inventory RED tests**

```js
test('captures all eight fixed roots', async () => {
  const inventory = JSON.parse(await readFile(inventoryUrl, 'utf8'));
  assert.equal(inventory.complete, true);
  assert.deepEqual(inventory.roots.map(({ name }) => name).sort(), [
    '00_Project_Management', '01_Design_And_Specs',
    '02_UI_UX_And_Visuals', '03_Game_Content_And_Data',
    '04_Testing_And_Evidence', '05_Releases_And_Store_Assets',
    '80_Inbox', '90_Archive',
  ].sort());
});

test('captures the control center and seven review backgrounds', async () => {
  const inventory = JSON.parse(await readFile(inventoryUrl, 'utf8'));
  assert.ok(inventory.resources.some(({ name }) => name === 'Asset_Control_Center'));
  assert.equal(inventory.resources.filter(({ name }) => /^CICG_BG_\d+_/.test(name)).length, 7);
});
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/project-drive-inventory.test.mjs
```

- [ ] **Step 3: Define exact inventory schema**

```json
{
  "schemaVersion": 1,
  "capturedAt": "ISO-8601 timestamp",
  "sourceCommit": "40-char lowercase SHA",
  "complete": true,
  "roots": [],
  "resources": [],
  "orphanResourceIds": [],
  "warnings": []
}
```

Each resource stores resource kind、Drive ID、exact name、parent Drive ID、MIME、size or null、modifiedTime、webViewLink and matched folder／asset key or null。

- [ ] **Step 4: Perform read-only Drive scan**

Mandatory paths:

```text
00_Project_Management/Asset_Control_Center/CICG_素材管理控制中心_v1.0
01_Design_And_Specs/<2 existing Google Docs>
02_UI_UX_And_Visuals/Idiom_Cards
02_UI_UX_And_Visuals/Game_Backgrounds/10_Review/<7 PNG>
02_UI_UX_And_Visuals/Game_Backgrounds/20_Approved
03_Game_Content_And_Data
04_Testing_And_Evidence
05_Releases_And_Store_Assets
80_Inbox/Idiom_Cards
90_Archive/Idiom_Cards
```

If any listing is partial or unreadable, set `complete=false`, append warning and stop before Task 6。

- [ ] **Step 5: Write baseline report and run GREEN**

Report folder／file totals、MIME、bytes、orphans、Drive-only／GitHub-only／candidate-conflict counts、dashboard mismatch、PR #36 candidate count and explicit zero-mutation statement。

```bash
node --test tests/project-drive-inventory.test.mjs
git add data/drive-assets/project-inventory* docs/superpowers/reports/2026-08-07-drive-phase2-baseline-inventory.md tests/project-drive-inventory.test.mjs
git commit -m "docs: record Phase 2 Drive baseline inventory"
```

---

### Task 6: Batch 1 納管 Control Center 與 7 張背景

**Files:**
- Create: `data/drive-assets/project-asset.schema.json`
- Create: `data/drive-assets/project-assets.json`
- Create: `data/drive-assets/migrations/2026-08-07-phase2-batch1-control-center-backgrounds.json`
- Modify: `data/drive-assets/drive-folders.json`
- Modify: `data/drive-assets/asset-control-center.json`
- Test: `tests/project-drive-asset-registry.test.mjs`
- Test: `tests/project-drive-control-center.test.mjs`

**Interfaces:**
- Adds folder keys:
  - `project.management.asset-control-center`
  - `visuals.game-backgrounds`
  - `visuals.game-backgrounds.review`
  - `visuals.game-backgrounds.approved`

- [ ] **Step 1: Write real-data RED test**

```js
test('registers one dashboard and exactly seven review backgrounds', async () => {
  const registry = JSON.parse(await readFile(projectRegistryUrl, 'utf8'));
  assert.equal(registry.assets.filter(({ role }) => role === 'dashboard').length, 1);
  const backgrounds = registry.assets.filter(({ domain }) => domain === 'background');
  assert.equal(backgrounds.length, 7);
  assert.ok(backgrounds.every(({ lifecycleStatus, currentMaster }) =>
    lifecycleStatus === 'review' && currentMaster === false));
});
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/project-drive-asset-registry.test.mjs tests/project-drive-control-center.test.mjs
```

- [ ] **Step 3: Register exact resources**

```text
Asset_Control_Center folder 16p7x1-uISZShEkppN68Fwqn-epm44Uok
Spreadsheet 1JwdPPz4cjx94MYE5qXJt2GaE67e9HUlzXPY4OPb6S94
Game_Backgrounds 1v-xm8k4ufmr5J4bxCldce7YYU8SZuL1T
10_Review 1i1OZ7qWPhu-YY2bbPUGXb5KHaOLh3NAI
20_Approved 1VX-nfxg0JUiuw-oBJkTVtLwNJR3auB3_
```

Use the seven actual Drive IDs、sizes、dimensions and SHA-256 values from the Control Center Asset Register。All remain `review / pending / currentMaster=false`; campaign map remains `candidate-conflict`。

- [ ] **Step 4: Create verified no-move Ledger**

Batch 1 has zero mutation entries because existing parents already match target parents。Record observed folder／file verification in the report; never invent move entries。

- [ ] **Step 5: Update dashboard snapshot from derived values**

Set current baseline main SHA、logical count、Approved count、Review／PR count、missing P0 count、open PR 36 and timestamp not earlier than Registry timestamps。

- [ ] **Step 6: Run GREEN and commit**

```bash
npm run compile:core
node --test tests/project-drive-asset-registry.test.mjs tests/project-drive-control-center.test.mjs
git add data/drive-assets tests/project-drive-*.test.mjs
git commit -m "feat: register control center and review backgrounds"
```

---

### Task 7: 新增永久 Schema、CLI 與 CI Gate

**Files:**
- Modify: `scripts/validate-drive-assets.mjs`
- Modify: `package.json`
- Modify: `scripts/verify.sh`
- Modify: `.github/workflows/ci.yml`
- Test: `tests/project-drive-asset-registry.test.mjs`
- Test: `tests/project-drive-inventory.test.mjs`

**Interfaces:**
- PASS format:
  `[drive-assets] PASS folders=<n> idiomAssets=<n> projectAssets=<n> inventories=<n> migrations=<n>`。

- [ ] **Step 1: Write CLI RED test**

```js
test('the permanent CLI validates both registries and dashboard freshness', async () => {
  const cli = await readFile(new URL('../scripts/validate-drive-assets.mjs', import.meta.url), 'utf8');
  assert.match(cli, /project-assets\.json/);
  assert.match(cli, /validateDriveRegistryCrossLinks/);
  assert.match(cli, /validateAssetControlCenterSnapshot/);
});
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/project-drive-asset-registry.test.mjs tests/project-drive-inventory.test.mjs
```

- [ ] **Step 3: Extend CLI**

Read:

```text
drive-folders.json
idiom-card-assets.json
project-assets.json
asset-control-center.json
project-inventory-*.json
migrations/*.json
```

Call folder、idiom、project、folder-assignment、cross-registry、dashboard、inventory and all migration validators。

```js
const currentMainSha = process.env.CICG_MAIN_SHA
  ?? controlCenter.currentSnapshot.baselineGitHubMainSha;
```

- [ ] **Step 4: Inject exact CI baseline SHA**

Modify the verify step:

```yaml
      - name: Verify repository
        env:
          CICG_MAIN_SHA: ${{ github.event.pull_request.base.sha || github.sha }}
        run: ./scripts/verify.sh
```

- [ ] **Step 5: Run GREEN and commit**

```bash
npm run test:drive-assets
npm run validate:drive-assets
./scripts/verify.sh
git add .github/workflows/ci.yml scripts package.json tests/project-drive-*.test.mjs
git commit -m "feat: enforce Phase 2 Drive governance gate"
```

---

### Task 8: Batch 2 PR #36 Candidate Inventory 與安全處置

**Files:**
- Create: `data/drive-assets/pr36-assets.json`
- Create: `data/drive-assets/migrations/2026-08-07-phase2-batch2-pr36-extraction.json`
- Create: `docs/superpowers/reports/2026-08-07-drive-phase2-pr36-disposition.md`
- Modify: `data/drive-assets/project-assets.json`
- Modify: `data/drive-assets/drive-folders.json`
- Modify: `src/cards/drive-assets/drive-asset-types.ts`
- Modify: `src/cards/drive-assets/validate-drive-migration-ledger.ts`
- Modify: `data/drive-assets/drive-migration.schema.json`
- Modify: `tests/card-drive-migration-ledger.test.mjs`
- Test: `tests/project-drive-pr36-inventory.test.mjs`

**Interfaces:**
- All 13 PNG filenames receive one disposition。
- Adds migration operation `ingest` with `before=null`、non-null after and rollback snapshots。

- [ ] **Step 1: Write 13-file RED test**

```js
const expected = [
  'game_logo_main.png', 'card_frame_ssr.png',
  'card_illus_yugong.png', 'card_illus_pofuchenzhou.png',
  'campaign_map_bg.png', 'map_node_unlocked.png',
  'map_node_locked.png', 'map_node_completed.png',
  'item_icon_hint.png', 'item_icon_shield.png',
  'item_icon_double.png', 'mole_hole_normal.png',
  'mole_hole_active.png',
].sort();

test('assigns one disposition to every PR 36 PNG', async () => {
  const inventory = JSON.parse(await readFile(pr36InventoryUrl, 'utf8'));
  assert.deepEqual(inventory.assets.map(({ filename }) => filename).sort(), expected);
  assert.ok(inventory.assets.every(({ disposition }) => [
    'duplicate-approved', 'candidate-conflict', 'extract-to-inbox',
    'quarantine', 'reject',
  ].includes(disposition)));
});
```

- [ ] **Step 2: Write ingest migration RED test**

```js
test('accepts a verified ingest with null before and rollback snapshot', () => {
  const issues = validateDriveMigrationLedger({
    ...ledger,
    entries: [{
      resourceKind: 'file',
      assetId: 'branding-game-logo-main@1.0-review',
      driveResourceId: 'new-drive-file-id',
      operation: 'ingest',
      before: null,
      after: fileSnapshot,
      rollback: quarantineSnapshot,
      status: 'verified',
      blockingReason: null,
    }],
  });
  assert.deepEqual(issues, []);
});
```

- [ ] **Step 3: Run RED**

```bash
npm run compile:core
node --test tests/card-drive-migration-ledger.test.mjs tests/project-drive-pr36-inventory.test.mjs
```

- [ ] **Step 4: Calculate real PR blob evidence**

For every PNG, download the exact PR blob and derive fields from bytes:

```js
const bytes = await readFile(downloadedPath);
const record = {
  sizeBytes: bytes.byteLength,
  sha256: createHash('sha256').update(bytes).digest('hex'),
  widthPx: png.width,
  heightPx: png.height,
  hasAlpha: png.hasAlpha,
};
```

The committed inventory must contain measured values only; no sample or sentinel values。

- [ ] **Step 5: Apply conflict rules**

- `card_frame_ssr.png`: exact checksum comparison with Approved SSR v2.8; identical → duplicate-approved, different → quarantine。
- `campaign_map_bg.png`: compare with Drive campaign background candidate; different → candidate-conflict, no automatic winner。
- two card illustrations: extract only when no Drive duplicate; remain Review candidates。
- logo、map nodes、item icons、mole holes: extract only when no equivalent Drive asset exists。

- [ ] **Step 6: Lazy-create only used Inbox batches**

Allowed families:

```text
80_Inbox/Branding/2026-08-07_PR36
80_Inbox/Idiom_Cards/2026-08-07_PR36
80_Inbox/Map_And_Progress/2026-08-07_PR36
80_Inbox/Item_Icons/2026-08-07_PR36
80_Inbox/Bonus_Mode/2026-08-07_PR36
```

Skip any family with zero extract dispositions。

- [ ] **Step 7: Build planned Ledger before ingest**

Each ingest entry stores PR blob SHA、measured checksum、target folder、canonical Inbox filename、`before=null`、expected after and rollback-to-quarantine snapshot。

- [ ] **Step 8: Ingest sequentially**

For each extracted file: upload once、record Drive ID、download bytes、recalculate checksum、verify MIME／size／dimensions、mark verified。On first mismatch stop and move already-ingested files to the batch quarantine folder according to rollback snapshots。

- [ ] **Step 9: Report and GREEN**

Report every filename、checksum、comparison、disposition、Drive ID and reason; state that PR #36 code／docs were not merged。

```bash
npm run test:drive-assets
npm run validate:drive-assets
node --test tests/project-drive-pr36-inventory.test.mjs
git add data/drive-assets docs/superpowers/reports src/cards/drive-assets tests
git commit -m "feat: quarantine and extract PR 36 assets"
```

- [ ] **Step 10: Close PR #36 as superseded**

Only after every extracted file has verified Drive ID、checksum、Registry record and rollback evidence: add a comment linking the disposition report and implementation PR, then close without merging。Preserve the branch until this Phase 2 PR merges。

---

### Task 9: Batch 3 Lazy-Activated Domain Topology

**Files:**
- Modify: `data/drive-assets/drive-folders.json`
- Create: `data/drive-assets/migrations/2026-08-07-phase2-batch3-lazy-topology.json`
- Modify: `src/cards/drive-assets/validate-project-asset-folder-assignments.ts`
- Test: `tests/project-drive-folder-assignment.test.mjs`

**Interfaces:**
- Produces `deriveRequiredProjectFolderKeys(registry): readonly string[]`。

- [ ] **Step 1: Write lazy activation RED tests**

```js
test('does not require unused deep domain folders', () => {
  const issues = validateProjectAssetFolderAssignments(
    registryWithoutTestingOrReleaseAssets,
    folderRegistryWithOnlyActivatedDomains,
  );
  assert.equal(issues.some(({ code }) => code === 'missing-project-folder'), false);
});

test('requires a folder after a physical asset activates the domain', () => {
  const issues = validateProjectAssetFolderAssignments(
    registryWithTestEvidence,
    folderRegistryWithOnlyActivatedDomains,
  );
  assert.ok(issues.some(({ code }) => code === 'missing-project-folder'));
});
```

- [ ] **Step 2: Run RED**

```bash
npm run compile:core
node --test tests/project-drive-folder-assignment.test.mjs
```

- [ ] **Step 3: Implement derivation rules**

- Always require eight fixed roots and existing Phase 1 folders。
- Require Asset Control Center and Game Background folders because real resources exist。
- Require Inbox domain／batch only when records point there。
- Require `03`／`04`／`05` child folders only when physical asset／evidence／release records use them。
- Do not require the full documented target topology merely because it is documented。

- [ ] **Step 4: Create missing required folders sequentially**

For each missing key: planned folder Ledger entry、create under exact parent、verify ID／name／parent／MIME、write Folder Registry、mark verified。Rollback moves newly created empty folders to `90_Archive/<Domain>/Topology_Rollback_<BatchId>`; never delete。

- [ ] **Step 5: Run GREEN and commit**

```bash
npm run test:drive-assets
npm run validate:drive-assets
git add data/drive-assets src/cards/drive-assets tests/project-drive-folder-assignment.test.mjs
git commit -m "feat: activate Phase 2 Drive topology lazily"
```

---

### Task 10: Physical Audit、Readiness 與交付

**Files:**
- Create: `data/drive-assets/physical-audit-phase2-2026-08-07.json`
- Create: `docs/superpowers/reports/2026-08-07-drive-phase2-governance-report.md`
- Modify: `data/drive-assets/asset-control-center.json`
- Modify: `AGENTS.md`
- Modify: `docs/superpowers/specs/README.md`
- Modify: `docs/superpowers/reports/README.md`
- Test: `tests/project-drive-physical-audit.test.mjs`

- [ ] **Step 1: Write physical audit RED**

```js
test('records zero blocking Phase 2 drift', async () => {
  const audit = JSON.parse(await readFile(physicalAuditUrl, 'utf8'));
  assert.equal(audit.blockingDriftCount, 0);
  assert.equal(audit.duplicateCurrentMasterCount, 0);
  assert.equal(audit.unverifiedAppliedMigrationCount, 0);
  assert.equal(audit.unregisteredApprovedResourceCount, 0);
  assert.equal(audit.dashboardFreshness, 'pass');
  assert.equal(audit.pr36Disposition, 'superseded');
});
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/project-drive-physical-audit.test.mjs
```

- [ ] **Step 3: Perform live read-only audit**

Compare actual Drive metadata with Folder Registry、both Asset Registries、all Migration Ledgers、Control Center、baseline inventory and PR #36 inventory。Verify IDs、parents、names、MIME、sizes、checksums、links、Approved folder contents、source bindings、rollback snapshots and dashboard counts。

- [ ] **Step 4: Write final Gate report**

```text
Full project inventory = complete
Project Asset Registry = valid
Idiom Card Registry = valid
Cross Registry File IDs = unique
Folder Registry = valid
Dashboard freshness = pass
PR #36 = safely superseded
Blocking drift = 0
Duplicate current master = 0
Unverified applied migrations = 0
Missing rollback snapshots = 0
Full repository verify = pass
ChatGPT Audit = pass
behind_by = 0
unresolved review threads = 0
```

State explicitly that architecture completion does not visually approve the seven backgrounds。

- [ ] **Step 5: Update permanent entry points**

```text
data/drive-assets/project-assets.json
data/drive-assets/project-inventory-2026-08-07.json
data/drive-assets/pr36-assets.json
data/drive-assets/physical-audit-phase2-2026-08-07.json
docs/superpowers/reports/2026-08-07-drive-phase2-governance-report.md
```

State that the Sheet is derived and GitHub Registries are canonical。

- [ ] **Step 6: Run complete verification**

```bash
npm install
./scripts/verify.sh
npm audit --audit-level=high
```

Record fresh actual counts; do not copy Phase 1 counts。

- [ ] **Step 7: ChatGPT Audit and merge**

Audit all changes against the spec, malformed JSON behavior, cross Registry uniqueness, source binding, Drive evidence, PR #36 closure, dashboard freshness and absence of unrelated game／IndexedDB changes。Fix Critical／Important findings in the same PR and rerun CI。

Final merge Gate:

```text
latest head CI = success
behind_by = 0
unresolved review threads = 0
mergeable = true
Drive blocking drift = 0
```

Then Squash Merge the single Phase 2 implementation PR。

---

## Execution Sequence

```text
Task 1–4  Contracts and pure validators
Task 5    Read-only inventory checkpoint
Task 6    Existing Control Center/background Registry checkpoint
Task 7    Permanent CLI and CI Gate
Task 8    PR #36 extraction checkpoint
Task 9    Lazy topology checkpoint
Task 10   Live audit, CI, ChatGPT Audit and Squash Merge
```

Drive mutation remains forbidden until Tasks 1–7 are GREEN and Task 8 has a complete planned Ledger。Each mutation batch stops on the first verification mismatch。
