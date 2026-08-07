# Drive Phase 2 全專案素材治理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將 Phase 1 的 Drive Registry、Migration Ledger、rollback、physical audit 與 CI Gate 擴展到全專案非圖卡素材，完成唯讀 inventory、Asset Control Center freshness、7 張背景納管、PR #36 安全收斂與 lazy-activated Drive 拓樸。

**Architecture:** GitHub `main` 保存通用 Project Asset Registry、Schema、純 TypeScript validator、控制中心快照、唯讀 inventory、PR #36 candidate inventory、Migration Ledger 與報告；Google Drive 保存 source masters、Review、Approved、Evidence 與 Release artifacts。既有 `idiom-card-assets.json` 保持專屬，新增 `project-assets.json` 管理非圖卡邏輯資產，永久 CLI 對兩份 Registry 做 Drive File ID、source／derivative、folder lifecycle 與 dashboard freshness 的交叉驗證。

**Tech Stack:** Node.js `>=22.13.0`、TypeScript `6.0.3` strict、Node test runner、JSON／JSON Schema、GitHub Actions、Google Drive metadata／move API、Google Sheets Asset Control Center。

## Global Constraints

- 真實狀態優先序固定為 `GitHub main → GitHub Actions → Repository Registry／Schema／Reports → Drive Approved → Asset Control Center → PR／Review／Inbox → local-only → chat`。
- `Asset_Control_Center` 是 human-facing derived dashboard，不得覆寫 GitHub Registry 的 canonical status、checksum、Folder ID 或 current master。
- `idiom-card-assets.json` 保持圖卡專屬；非圖卡素材使用 `project-assets.json`，不得混成單一巨大 Registry。
- Drive File ID 必須跨所有 Asset Registries 唯一；GitHub runtime derivative 沒有 Drive File ID 時使用 `null`。
- source master 留在 Drive；只有 Approved source master 的最佳化 runtime derivative 才能提交 GitHub `public/assets/`。
- runtime derivative 必須保存 `sourceAssetId`、`sourceSha256`、自身 `sha256`、尺寸、MIME、檔案大小與 GitHub path。
- Evidence 不使用 `currentApproved`；Release artifact 必須綁定 release version 與 40 字元 commit SHA。
- 新素材先進 `80_Inbox/<Domain>/<YYYY-MM-DD>_<BatchId>`；已知類型且具 metadata 才能移入 `10_Review`。
- 每批 mutation 上限為 `10 files` 或 `1 logical asset family`。
- 每批 move／rename 前必須有 planned Migration Ledger、before／after／rollback snapshot；驗證失敗立即停止並 rollback。
- 空白領域採 lazy activation：只有 inventory 出現真實資產或 evidence 時才建立該 domain 最小必要實體資料夾。
- PR #36 不得直接 merge；其 13 張 PNG 與過時智慧跳格程式／文件必須分離處理。
- 本計畫不人工核准 7 張背景、不產製新素材、不修改主玩法、關卡、卡池、IndexedDB Schema 或 PWA 行為。
- 不永久刪除 Drive 素材；舊版、重複候選與不可驗證素材移入 Inbox／Archive 並保留 evidence。
- 所有程式修改一律 TDD：先確認 RED 原因正確，再最小 GREEN，最後完整 `./scripts/verify.sh`。

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
src/cards/drive-assets/index.ts
scripts/validate-drive-assets.mjs
package.json
scripts/verify.sh
data/drive-assets/drive-folders.json
data/drive-assets/asset-control-center.json
AGENTS.md
docs/superpowers/specs/README.md
docs/superpowers/reports/README.md
```

### Preserve Without Moving

```text
src/cards/drive-assets/drive-asset-types.ts
src/cards/drive-assets/validate-drive-asset-registry.ts
src/cards/drive-assets/validate-drive-folder-registry.ts
src/cards/drive-assets/validate-drive-migration-ledger.ts
data/drive-assets/idiom-card-assets.json
```

`src/cards/drive-assets` 名稱在 Phase 2 保持相容，不執行與本目標無關的目錄搬遷。

---

### Task 1: 建立通用 Project Asset Contract

**Files:**
- Create: `src/cards/drive-assets/project-asset-types.ts`
- Modify: `src/cards/drive-assets/index.ts`
- Test: `tests/project-drive-asset-contract.test.mjs`

**Interfaces:**
- Produces: `PROJECT_ASSET_DOMAINS`、`PROJECT_ASSET_ROLES`、`PROJECT_ASSET_LIFECYCLE_STATUSES`、`ProjectAssetRecord`、`ProjectAssetRegistry`。
- Later tasks import all public names from `src/cards/drive-assets/index.ts`。

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

Expected: FAIL because the new exports do not exist。

- [ ] **Step 3: Implement the exact contract**

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

export type ProjectAssetDomain = (typeof PROJECT_ASSET_DOMAINS)[number];
export type ProjectAssetRole = (typeof PROJECT_ASSET_ROLES)[number];
export type ProjectAssetLifecycleStatus =
  (typeof PROJECT_ASSET_LIFECYCLE_STATUSES)[number];

export interface ProjectAssetRecord {
  readonly recordId: string;
  readonly identity: string;
  readonly assetNameZh: string;
  readonly domain: ProjectAssetDomain;
  readonly assetType: string;
  readonly role: ProjectAssetRole;
  readonly version: string;
  readonly lifecycleStatus: ProjectAssetLifecycleStatus;
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
  readonly driftState:
    | 'aligned' | 'drive-only' | 'github-only' | 'candidate-conflict'
    | 'missing' | 'outdated' | 'blocked' | 'stale-dashboard';
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

- [ ] **Step 4: Export and run GREEN**

```bash
npm run compile:core
node --test tests/project-drive-asset-contract.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add src/cards/drive-assets/project-asset-types.ts src/cards/drive-assets/index.ts tests/project-drive-asset-contract.test.mjs
git commit -m "feat: add project asset governance contracts"
```

---

### Task 2: 實作 Project Asset Registry Validator

**Files:**
- Create: `src/cards/drive-assets/validate-project-asset-registry.ts`
- Modify: `src/cards/drive-assets/index.ts`
- Test: `tests/project-drive-asset-registry.test.mjs`

**Interfaces:**
- Produces: `validateProjectAssetRegistry(registry): readonly ProjectAssetIssue[]`。
- Issue shape: `{ code, recordId, message }`，排序固定為 `code`、`recordId`。

- [ ] **Step 1: Write failing validation tests**

```js
const background = {
  recordId: 'bg-home-portrait@1.0-review',
  identity: 'bg-home-portrait',
  assetNameZh: '首頁背景（直式）',
  domain: 'background',
  assetType: 'background',
  role: 'source-master',
  version: '1.0',
  lifecycleStatus: 'review',
  approvalStatus: 'pending',
  currentMaster: false,
  priority: 'P0',
  requiredQty: 1,
  availableQty: 1,
  gapQty: 0,
  sourceSystem: 'drive',
  driveFileId: '1Ygo9pJmQoRvdUalyrk-Ukd-LsoiA5jL7',
  parentFolderKey: 'visuals.game-backgrounds.review',
  githubPath: null,
  githubPr: null,
  filename: 'CICG_BG_01_Home_Portrait_v1.0_Review.png',
  mimeType: 'image/png',
  sizeBytes: 2147544,
  sha256: '5b6301397f7ac4c1ea9a66a1ee0ea2e80843ddd31b9d75e0220b5465dde93b73',
  widthPx: 941,
  heightPx: 1672,
  transparent: false,
  sourceAssetId: null,
  sourceSha256: null,
  releaseVersion: null,
  boundCommitSha: null,
  approvalEvidenceIds: [],
  driftState: 'drive-only',
  lastVerifiedAt: '2026-08-07T10:16:03+08:00',
  owner: 'Visual Reviewer',
  nextAction: '人工審核',
  notes: 'Review only',
};

test('rejects invalid quantity arithmetic', () => {
  const issues = validateProjectAssetRegistry({
    schemaVersion: 1,
    updatedAt: '2026-08-07T10:16:03+08:00',
    assets: [{ ...background, requiredQty: 3, availableQty: 1, gapQty: 0 }],
  });
  assert.ok(issues.some(({ code }) => code === 'invalid-gap-quantity'));
});

test('rejects an approved current master without approval evidence', () => {
  const issues = validateProjectAssetRegistry({
    schemaVersion: 1,
    updatedAt: '2026-08-07T10:16:03+08:00',
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
    updatedAt: '2026-08-07T10:16:03+08:00',
    assets: [{
      ...background,
      recordId: 'runtime-home-bg@1.0',
      role: 'runtime-derivative',
      domain: 'runtime-derivative',
      sourceSystem: 'github',
      driveFileId: null,
      parentFolderKey: null,
      githubPath: 'public/assets/backgrounds/home.webp',
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

- [ ] **Step 3: Implement all-errors runtime validation**

Required issue codes:

```ts
export type ProjectAssetIssueCode =
  | 'malformed-project-registry'
  | 'malformed-project-asset'
  | 'duplicate-project-record-id'
  | 'invalid-project-version'
  | 'invalid-gap-quantity'
  | 'missing-physical-location'
  | 'unexpected-physical-location'
  | 'invalid-project-sha256'
  | 'approved-missing-evidence'
  | 'invalid-current-master-state'
  | 'duplicate-project-current-master'
  | 'pr-review-missing-pr'
  | 'derivative-missing-source'
  | 'evidence-cannot-be-current-master'
  | 'release-missing-binding';
```

Exact rules:

- `recordId` unique。
- `version` matches `/^\d+\.\d+(?:-[a-z0-9-]+)?$/`。
- quantities are non-negative integers and `gapQty === Math.max(requiredQty - availableQty, 0)`。
- `missing`／`requirement-only` records have no physical Drive／GitHub location and may have `sha256 = null`。
- physical Drive assets require `driveFileId`、`parentFolderKey`、`filename`、`mimeType`、positive `sizeBytes` and 64-char lowercase SHA-256。
- GitHub runtime derivatives require `githubPath`、`filename`、`mimeType`、positive `sizeBytes` and SHA-256。
- approved／published current master requires `approvalStatus = approved` and at least one evidence ID。
- only approved／published records may set `currentMaster = true`。
- one `domain + assetType + identity` family has at most one current master。
- `github-pr` source requires positive `githubPr`。
- runtime derivative requires `sourceAssetId` and `sourceSha256`。
- evidence and requirement-only records cannot be current master。
- release artifact requires `releaseVersion` and `boundCommitSha` matching `/^[a-f0-9]{40}$/`。
- malformed raw JSON returns issues instead of throwing。

- [ ] **Step 4: Run GREEN and commit**

```bash
npm run compile:core
node --test tests/project-drive-asset-registry.test.mjs
git add src/cards/drive-assets/validate-project-asset-registry.ts src/cards/drive-assets/index.ts tests/project-drive-asset-registry.test.mjs
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
- Produces: `validateDriveRegistryCrossLinks(projectRegistry, idiomCardRegistry)`。
- Produces: `validateProjectAssetFolderAssignments(projectRegistry, folderRegistry)`。

- [ ] **Step 1: Write duplicate Drive File ID RED**

```js
test('rejects a Drive File ID reused by project and idiom-card registries', () => {
  const issues = validateDriveRegistryCrossLinks(
    { schemaVersion: 1, updatedAt: now, assets: [projectAsset] },
    { schemaVersion: 1, updatedAt: now, assets: [
      { ...idiomCardAsset, driveFileId: projectAsset.driveFileId },
    ] },
  );
  assert.ok(issues.some(({ code }) => code === 'cross-registry-drive-file-id'));
});
```

- [ ] **Step 2: Write derivative source RED**

```js
test('requires a runtime derivative source to be an approved current master', () => {
  const source = { ...projectAsset, lifecycleStatus: 'review', currentMaster: false };
  const derivative = {
    ...runtimeDerivative,
    sourceAssetId: source.recordId,
    sourceSha256: source.sha256,
  };
  const issues = validateDriveRegistryCrossLinks(
    { schemaVersion: 1, updatedAt: now, assets: [source, derivative] },
    emptyIdiomRegistry,
  );
  assert.ok(issues.some(({ code }) => code === 'derivative-source-not-approved'));
});
```

- [ ] **Step 3: Write folder lifecycle RED**

```js
test('rejects a review asset assigned to an approved folder', () => {
  const issues = validateProjectAssetFolderAssignments(
    { schemaVersion: 1, updatedAt: now, assets: [projectAsset] },
    folderRegistryWithBackgroundReviewAndApproved,
  );
  assert.ok(issues.some(({ code }) => code === 'project-asset-folder-role-mismatch'));
});
```

- [ ] **Step 4: Run RED**

```bash
npm run compile:core
node --test tests/project-drive-cross-registry.test.mjs tests/project-drive-folder-assignment.test.mjs
```

- [ ] **Step 5: Implement exact cross-link rules**

Cross Registry:

- ignore `null` Drive File IDs。
- each non-null Drive File ID appears exactly once across both registries。
- `sourceAssetId` resolves in project registry。
- derivative source must be `approved|published` and `currentMaster = true`。
- `sourceSha256` equals source record SHA-256。
- a source master cannot point back to a derivative。

Folder lifecycle:

| Project status／role | Allowed lifecycle role |
|---|---|
| `intake`, `blocked`, `quarantined` | `inbox` or `archive` |
| `review`, `changes-requested` | `review` or `inbox` |
| `approved`, `published` source master | `approved` |
| `archived`, `rejected`, `unverifiable` | `archive` |
| `dashboard`, `design-spec`, `evidence` active records | `container` or `reference` |
| `runtime-derivative` stored in GitHub | no Drive parent |
| `missing`, `requirement-only` | no Drive parent |

- [ ] **Step 6: Run GREEN and commit**

```bash
npm run compile:core
node --test tests/project-drive-cross-registry.test.mjs tests/project-drive-folder-assignment.test.mjs
git add src/cards/drive-assets tests/project-drive-cross-registry.test.mjs tests/project-drive-folder-assignment.test.mjs
git commit -m "feat: validate project asset cross links"
```

---

### Task 4: 建立 Asset Control Center Freshness Gate

**Files:**
- Create: `src/cards/drive-assets/validate-asset-control-center.ts`
- Modify: `src/cards/drive-assets/index.ts`
- Test: `tests/project-drive-control-center.test.mjs`
- Modify: `data/drive-assets/asset-control-center.json`

**Interfaces:**
- Produces: `validateAssetControlCenterSnapshot(snapshot, projectRegistry, idiomRegistry, context)`。
- `context` exact shape: `{ readonly currentMainSha: string; readonly openAssetPrs: readonly number[] }`。

- [ ] **Step 1: Write stale main SHA RED**

```js
test('marks the dashboard stale when its baseline main SHA is not current', () => {
  const issues = validateAssetControlCenterSnapshot(
    controlCenter,
    projectRegistry,
    idiomRegistry,
    { currentMainSha: 'a'.repeat(40), openAssetPrs: [36] },
  );
  assert.ok(issues.some(({ code }) => code === 'stale-dashboard-main-sha'));
});
```

- [ ] **Step 2: Write derived KPI RED**

```js
test('rejects dashboard counts that do not match registries', () => {
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

- [ ] **Step 3: Run RED**

```bash
npm run compile:core
node --test tests/project-drive-control-center.test.mjs
```

- [ ] **Step 4: Implement freshness rules**

Derived values:

```ts
const allAssets = [...projectRegistry.assets, ...idiomRegistry.assets];
const approvedCurrentMasters = allAssets.filter(isCurrentApproved).length;
const reviewOrPrItems = projectRegistry.assets.filter(
  ({ lifecycleStatus, sourceSystem }) =>
    lifecycleStatus === 'review' || sourceSystem === 'github-pr',
).length + idiomRegistry.assets.filter(({ status }) => status === 'review').length;
const missingP0Assets = projectRegistry.assets.filter(
  ({ priority, gapQty }) => priority === 'P0' && gapQty > 0,
).length;
```

Required checks:

- `baselineGitHubMainSha` is a 40-char SHA and equals `context.currentMainSha`。
- `openAssetPr` is `null` or appears in `context.openAssetPrs`。
- `approvedCurrentMasters`、`reviewOrPrItems`、`missingP0Assets` equal derived Registry counts。
- `trackedLogicalAssets` equals distinct project identities plus distinct idiom-card `assetType + identity` families。
- snapshot `updatedAt` cannot be newer than both Registry timestamps by more than 5 minutes without a matching Registry update; otherwise `stale-dashboard-registry`。
- conflicts return issues only; validator never rewrites Registry。

Update `asset-control-center.json` only after Batch 0 has produced the actual current main SHA and derived counts。

- [ ] **Step 5: Run GREEN and commit**

```bash
npm run compile:core
node --test tests/project-drive-control-center.test.mjs
git add src/cards/drive-assets data/drive-assets/asset-control-center.json tests/project-drive-control-center.test.mjs
git commit -m "feat: validate asset control center freshness"
```

---

### Task 5: 新增 JSON Schema、CLI 與永久 CI Gate

**Files:**
- Create: `data/drive-assets/project-asset.schema.json`
- Create: `data/drive-assets/project-inventory.schema.json`
- Modify: `scripts/validate-drive-assets.mjs`
- Modify: `package.json`
- Modify: `scripts/verify.sh`
- Test: `tests/project-drive-asset-registry.test.mjs`
- Test: `tests/project-drive-inventory.test.mjs`

**Interfaces:**
- CLI continues to print exactly one PASS line or stable FAIL lines。
- PASS format becomes:
  `[drive-assets] PASS folders=<n> idiomAssets=<n> projectAssets=<n> inventories=<n> migrations=<n>`。

- [ ] **Step 1: Add a failing CLI integration test**

```js
test('the permanent CLI validates both asset registries', async () => {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
  assert.equal(
    packageJson.scripts['validate:drive-assets'],
    'npm run compile:core && node scripts/validate-drive-assets.mjs',
  );
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

- [ ] **Step 3: Add schemas matching Task 1 contracts**

Schema requirements:

- Draft 2020-12。
- `additionalProperties: false` at Registry and record levels。
- enum values exactly match exported TypeScript constants。
- nullable Drive／GitHub location fields use `anyOf` with `null`。
- quantities are integers with minimum 0。
- SHA-256 pattern `^[a-f0-9]{64}$` when non-null。
- commit SHA pattern `^[a-f0-9]{40}$` when non-null。

Inventory schema exact root:

```json
{
  "schemaVersion": 1,
  "capturedAt": "2026-08-07T00:00:00+08:00",
  "sourceCommit": "40-char-sha",
  "complete": true,
  "roots": [],
  "resources": [],
  "orphanResourceIds": [],
  "warnings": []
}
```

Each resource stores `resourceKind`、Drive ID、name、parent Drive ID、MIME、size or null、modifiedTime、webViewLink and registered folder／asset key or null。

- [ ] **Step 4: Extend CLI**

CLI reads:

```text
drive-folders.json
idiom-card-assets.json
project-assets.json
asset-control-center.json
project-inventory-*.json
migrations/*.json
```

CLI receives current main SHA from:

```js
const currentMainSha = process.env.CICG_MAIN_SHA
  ?? controlCenter.currentSnapshot.baselineGitHubMainSha;
```

CI workflow must set `CICG_MAIN_SHA` to the checked-out PR base SHA for pull requests and the commit SHA for `main`; local verification may use the committed baseline value。

- [ ] **Step 5: Run GREEN**

```bash
npm run test:drive-assets
npm run validate:drive-assets
./scripts/verify.sh
```

- [ ] **Step 6: Commit**

```bash
git add data/drive-assets scripts package.json tests/project-drive-*.test.mjs
git commit -m "feat: enforce Phase 2 Drive governance gate"
```

---

### Task 6: Batch 0 全專案唯讀 Inventory

**Files:**
- Create: `data/drive-assets/project-inventory-2026-08-07.json`
- Create: `docs/superpowers/reports/2026-08-07-drive-phase2-baseline-inventory.md`
- Test: `tests/project-drive-inventory.test.mjs`

**Interfaces:**
- Inventory is immutable evidence for the captured timestamp。
- No Drive create／move／rename／delete call is allowed in this task。

- [ ] **Step 1: Add failing inventory completeness test**

```js
test('captures all eight fixed project roots', async () => {
  const inventory = JSON.parse(await readFile(inventoryUrl, 'utf8'));
  assert.equal(inventory.complete, true);
  assert.deepEqual(
    inventory.roots.map(({ name }) => name).sort(),
    [
      '00_Project_Management', '01_Design_And_Specs',
      '02_UI_UX_And_Visuals', '03_Game_Content_And_Data',
      '04_Testing_And_Evidence', '05_Releases_And_Store_Assets',
      '80_Inbox', '90_Archive',
    ].sort(),
  );
});

test('records known Phase 2 resources without declaring them approved', async () => {
  const inventory = JSON.parse(await readFile(inventoryUrl, 'utf8'));
  assert.ok(inventory.resources.some(({ name }) => name === 'Asset_Control_Center'));
  assert.ok(inventory.resources.some(({ name }) => name === 'Game_Backgrounds'));
  assert.equal(
    inventory.resources.filter(({ name }) => /^CICG_BG_\d+_/.test(name)).length,
    7,
  );
});
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/project-drive-inventory.test.mjs
```

Expected: FAIL because the inventory file does not exist。

- [ ] **Step 3: Perform read-only Drive scan**

For every discovered resource record:

- Drive resource ID。
- exact name。
- `file` or `folder`。
- direct parent Drive ID。
- MIME。
- size for files, `null` for folders。
- modified time。
- webViewLink。
- matched `folderKey`／`recordId` or `null`。

Mandatory roots and known descendants:

```text
00_Project_Management/Asset_Control_Center/CICG_素材管理控制中心_v1.0
01_Design_And_Specs/CICG_成語卡牌圖卡規範_v1.4
01_Design_And_Specs/CICG_成語卡牌標準模板_v2.5_Approved
02_UI_UX_And_Visuals/Idiom_Cards
02_UI_UX_And_Visuals/Game_Backgrounds/10_Review/<7 PNG files>
02_UI_UX_And_Visuals/Game_Backgrounds/20_Approved
03_Game_Content_And_Data
04_Testing_And_Evidence
05_Releases_And_Store_Assets
80_Inbox/Idiom_Cards
90_Archive/Idiom_Cards
```

If any folder listing is partial or unreadable, set `complete = false`, append a warning, and stop before Batch 1。

- [ ] **Step 4: Write the baseline report**

Report must state:

- folder／file totals by root。
- MIME and total byte counts。
- unregistered resources。
- Drive-only／GitHub-only／candidate-conflict counts。
- Control Center snapshot mismatches。
- PR #36 as a separate GitHub-only candidate set。
- explicit statement that no Drive mutation occurred。

- [ ] **Step 5: Run GREEN and commit**

```bash
node --test tests/project-drive-inventory.test.mjs
npm run validate:drive-assets
git add data/drive-assets/project-inventory-2026-08-07.json docs/superpowers/reports/2026-08-07-drive-phase2-baseline-inventory.md tests/project-drive-inventory.test.mjs
git commit -m "docs: record Phase 2 Drive baseline inventory"
```

---

### Task 7: Batch 1 納管 Control Center 與 7 張背景

**Files:**
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
- No file move is required when current Drive parents already match target parents。

- [ ] **Step 1: Add failing real-data test**

```js
test('registers the control center and exactly seven review backgrounds', async () => {
  const registry = JSON.parse(await readFile(projectRegistryUrl, 'utf8'));
  assert.ok(registry.assets.some(({ role }) => role === 'dashboard'));
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

- [ ] **Step 3: Register exact existing Drive resources**

Control Center:

```text
folder ID 16p7x1-uISZShEkppN68Fwqn-epm44Uok
spreadsheet ID 1JwdPPz4cjx94MYE5qXJt2GaE67e9HUlzXPY4OPb6S94
```

Background parent folders:

```text
Game_Backgrounds 1v-xm8k4ufmr5J4bxCldce7YYU8SZuL1T
10_Review 1i1OZ7qWPhu-YY2bbPUGXb5KHaOLh3NAI
20_Approved 1VX-nfxg0JUiuw-oBJkTVtLwNJR3auB3_
```

Background records use the seven actual Drive IDs and checksums from the Control Center Asset Register; all remain `review / pending / currentMaster=false`。`bg-campaign-map-portrait` remains `candidate-conflict` until PR #36 comparison is complete。

- [ ] **Step 4: Create a verified no-move Ledger**

Batch 1 Ledger entries cover folder registration and existing-parent verification. Because no resource is moved, use zero mutation entries and document verified observations in the Batch 1 report; do not invent `move` entries for resources that stayed in place。

- [ ] **Step 5: Update dashboard snapshot from Registry-derived values**

Set:

- latest `baselineGitHubMainSha`。
- exact derived logical asset count。
- exact Approved current master count。
- exact Review／PR count。
- exact missing P0 count。
- open asset PR `36`。
- `updatedAt` not earlier than Registry timestamps。

- [ ] **Step 6: Run GREEN and commit**

```bash
npm run test:drive-assets
npm run validate:drive-assets
git add data/drive-assets tests/project-drive-*.test.mjs
git commit -m "feat: register control center and review backgrounds"
```

---

### Task 8: Batch 2 建立 PR #36 Candidate Inventory 與安全處置

**Files:**
- Create: `data/drive-assets/pr36-assets.json`
- Create: `data/drive-assets/migrations/2026-08-07-phase2-batch2-pr36-extraction.json`
- Create: `docs/superpowers/reports/2026-08-07-drive-phase2-pr36-disposition.md`
- Modify: `data/drive-assets/project-assets.json`
- Modify: `data/drive-assets/drive-folders.json`
- Test: `tests/project-drive-pr36-inventory.test.mjs`

**Interfaces:**
- PR #36 inventory is evidence; it does not make branch files Approved。
- Every one of the 13 PNG filenames must receive one disposition。

- [ ] **Step 1: Add failing 13-file coverage test**

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

test('assigns one disposition to every PR #36 PNG', async () => {
  const inventory = JSON.parse(await readFile(pr36InventoryUrl, 'utf8'));
  assert.deepEqual(inventory.assets.map(({ filename }) => filename).sort(), expected);
  assert.ok(inventory.assets.every(({ disposition }) => [
    'duplicate-approved', 'candidate-conflict', 'extract-to-inbox',
    'quarantine', 'reject',
  ].includes(disposition)));
});
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/project-drive-pr36-inventory.test.mjs
```

- [ ] **Step 3: Download PR blobs and calculate evidence**

For each PNG record:

```json
{
  "filename": "game_logo_main.png",
  "githubPath": "public/assets/80_Inbox/game_logo_main.png",
  "githubPr": 36,
  "blobSha": "Git blob SHA",
  "sizeBytes": 1,
  "sha256": "64 lowercase hex",
  "widthPx": 800,
  "heightPx": 400,
  "hasAlpha": true,
  "candidateIdentity": "branding-game-logo-main",
  "disposition": "extract-to-inbox",
  "comparedAssetIds": [],
  "reason": "No equivalent Approved master exists"
}
```

Use actual values; `sizeBytes: 1` in this example is only the minimum schema shape and must be replaced by measured bytes in the committed inventory。

- [ ] **Step 4: Apply mandatory conflict rules**

- `card_frame_ssr.png`: compare exact SHA-256 against Approved SSR v2.8 frame。If different, disposition `quarantine`; if identical, `duplicate-approved`。Never create a second current master。
- `campaign_map_bg.png`: compare against `bg-campaign-map-portrait@1.0-review`。If different, `candidate-conflict`; do not choose a winner without human visual approval。
- two card illustrations: `extract-to-inbox` only when no Drive duplicate exists; remain Review candidates, not Approved。
- map nodes、item icons、mole holes、logo: `extract-to-inbox` only when no equivalent Drive asset exists。

- [ ] **Step 5: Create target Inbox folders only for extracted families**

Allowed lazy-activated paths:

```text
80_Inbox/Branding/2026-08-07_PR36
80_Inbox/Idiom_Cards/2026-08-07_PR36
80_Inbox/Map_And_Progress/2026-08-07_PR36
80_Inbox/Item_Icons/2026-08-07_PR36
80_Inbox/Bonus_Mode/2026-08-07_PR36
```

Do not create a domain folder when no file in that domain has `extract-to-inbox` disposition。

- [ ] **Step 6: Build planned Ledger before upload／move**

Every extracted file entry includes:

- PR blob SHA and measured SHA-256 in evidence fields。
- target Drive folder ID。
- planned canonical Inbox filename。
- `before = null` because the resource does not yet exist in Drive。
- `after` expected snapshot。
- `rollback` action defined as move to the same batch quarantine folder, not permanent deletion。

Because the existing Phase 1 migration contract assumes Drive resources already exist, extend `DriveMigrationOperation` with `ingest` and require `before = null`, non-null `after` and non-null rollback snapshot for ingest entries. Add RED／GREEN migration tests before using the operation。

- [ ] **Step 7: Ingest sequentially and verify each file**

For each file:

1. Upload once to its batch Inbox。
2. Record returned Drive File ID and webViewLink。
3. Download original Drive bytes and recalculate SHA-256。
4. Verify MIME、size、dimensions and checksum。
5. Mark entry `verified` before continuing。
6. On failure, stop batch and move already-ingested files to batch quarantine according to rollback snapshots。

- [ ] **Step 8: Write disposition report**

Report every filename, checksum, comparison, disposition, Drive File ID when ingested, and reason。Explicitly state that PR #36 code／docs changes were not merged。

- [ ] **Step 9: Run GREEN and commit**

```bash
npm run test:drive-assets
npm run validate:drive-assets
node --test tests/project-drive-pr36-inventory.test.mjs
git add data/drive-assets docs/superpowers/reports tests/project-drive-pr36-inventory.test.mjs src/cards/drive-assets
git commit -m "feat: quarantine and extract PR 36 assets"
```

- [ ] **Step 10: Close PR #36 as superseded**

Only after all extracted files have verified Drive IDs, checksums, Registry records and rollback evidence:

- add a PR comment linking the disposition report and replacement implementation PR。
- close PR #36 without merging。
- preserve its branch until the Phase 2 implementation PR is merged。

---

### Task 9: Batch 3 Lazy-Activated Domain Topology

**Files:**
- Modify: `data/drive-assets/drive-folders.json`
- Create: `data/drive-assets/migrations/2026-08-07-phase2-batch3-lazy-topology.json`
- Test: `tests/project-drive-folder-assignment.test.mjs`

**Interfaces:**
- Creates only folders required by actual registered assets／evidence。
- Empty roots remain valid without speculative deep folders。

- [ ] **Step 1: Write lazy activation RED**

```js
test('does not require unused deep domain folders', () => {
  const issues = validateProjectAssetFolderAssignments(
    projectRegistryWithoutTestingOrReleaseAssets,
    folderRegistryWithOnlyActivatedDomains,
  );
  assert.equal(issues.some(({ code }) => code === 'missing-project-folder'), false);
});

test('requires a target folder once a physical asset activates a domain', () => {
  const issues = validateProjectAssetFolderAssignments(
    projectRegistryWithTestEvidence,
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

- [ ] **Step 3: Implement required-folder derivation**

```ts
export function deriveRequiredProjectFolderKeys(
  registry: ProjectAssetRegistry,
): readonly string[];
```

Rules:

- always require eight fixed roots and already governed Phase 1 folders。
- require `Asset_Control_Center` and `Game_Backgrounds/{10_Review,20_Approved}` because real resources exist。
- require an Inbox domain and batch folder only when one or more records point there。
- require `03`／`04`／`05` child folders only when a physical asset／evidence／release record uses that domain。
- do not require the entire target topology merely because it is documented。

- [ ] **Step 4: Create physical folders sequentially when required**

For each missing required folder:

1. planned folder Ledger entry with before `null`, expected after snapshot and rollback parent。
2. create under exact registered parent。
3. verify Folder ID、canonical name、parent and MIME。
4. write Folder Registry record。
5. mark entry verified。

Rollback moves newly created empty folders to `90_Archive/<Domain>/Topology_Rollback_<BatchId>`; never permanently deletes them。

- [ ] **Step 5: Run GREEN and commit**

```bash
npm run test:drive-assets
npm run validate:drive-assets
git add data/drive-assets src/cards/drive-assets tests/project-drive-folder-assignment.test.mjs
git commit -m "feat: activate Phase 2 Drive topology lazily"
```

---

### Task 10: Phase 2 Physical Audit、Readiness 與交付

**Files:**
- Create: `data/drive-assets/physical-audit-phase2-2026-08-07.json`
- Create: `docs/superpowers/reports/2026-08-07-drive-phase2-governance-report.md`
- Modify: `data/drive-assets/asset-control-center.json`
- Modify: `AGENTS.md`
- Modify: `docs/superpowers/specs/README.md`
- Modify: `docs/superpowers/reports/README.md`
- Test: `tests/project-drive-physical-audit.test.mjs`

**Interfaces:**
- Produces final machine-readable Phase 2 audit snapshot。
- Final readiness is true only when every listed Gate passes。

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

Compare actual Drive metadata against:

```text
drive-folders.json
idiom-card-assets.json
project-assets.json
all migrations/*.json
asset-control-center.json
project-inventory-2026-08-07.json
pr36-assets.json
```

Verify:

- every registered Drive File／Folder ID exists at expected parent。
- names、MIME、sizes、checksums and webViewLinks match。
- Approved folders contain no unregistered file。
- Review／Inbox／Archive assignments match lifecycle status。
- runtime derivative source bindings remain valid。
- all applied／verified mutation entries have rollback snapshots。
- control center snapshot counts equal Registry-derived counts。
- PR #36 is closed and no asset from it was merged with old code。

- [ ] **Step 4: Write final report**

Required final Gate table:

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

The report must distinguish architecture completion from visual approval; 7 backgrounds may remain Review。

- [ ] **Step 5: Update permanent Agent entry points**

Add to `AGENTS.md` and spec index:

```text
data/drive-assets/project-assets.json
data/drive-assets/project-inventory-2026-08-07.json
data/drive-assets/pr36-assets.json
data/drive-assets/physical-audit-phase2-2026-08-07.json
docs/superpowers/reports/2026-08-07-drive-phase2-governance-report.md
```

State explicitly that the Sheet is derived and GitHub Registries are canonical。

- [ ] **Step 6: Run complete verification**

```bash
npm install
./scripts/verify.sh
npm audit --audit-level=high
```

Record actual counts from the fresh output; do not copy Phase 1 counts。

- [ ] **Step 7: ChatGPT Audit**

Audit:

- all changed files against the approved spec。
- raw JSON malformed-input behavior。
- cross Registry uniqueness and source binding。
- Drive physical audit evidence。
- PR #36 closure evidence。
- dashboard freshness and source priority。
- no unrelated game／IndexedDB changes。

Fix Critical／Important findings in the same implementation PR and rerun full CI。

- [ ] **Step 8: Final merge Gate**

Require:

```text
latest head CI = success
behind_by = 0
unresolved review threads = 0
mergeable = true
Drive physical audit blocking drift = 0
```

Then Squash Merge the single Phase 2 implementation PR。

---

## Execution Sequence

```text
Task 1–5  Governance contracts and permanent validation
Task 6    Read-only inventory checkpoint
Task 7    Existing Control Center/background registration checkpoint
Task 8    PR #36 extraction checkpoint
Task 9    Lazy topology checkpoint
Task 10   Live audit, CI, ChatGPT Audit and Squash Merge
```

Drive mutation remains forbidden until Tasks 1–7 are GREEN and Batch 2 has a complete planned Ledger。Each mutation batch stops immediately on the first verification mismatch。
