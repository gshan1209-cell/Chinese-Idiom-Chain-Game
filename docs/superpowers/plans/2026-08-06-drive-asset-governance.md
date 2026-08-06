# Drive 素材治理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立可驗證的 Drive 素材 Registry、Folder Registry、Migration Ledger 與漂移檢查，先完成成語圖卡 Phase 1 安全搬移，再產出 Phase 2 全專案擴展的 readiness report。

**Architecture:** GitHub `main` 保存結構化資產真相、Schema、純 TypeScript 驗證器、CLI 與搬移 Ledger；Google Drive 保存二進位 master、Review、Approved 與 Archive。所有 Drive move／rename 都必須先有 pre-move snapshot，使用原 File ID 原地移動，再以 metadata、parent、size、MIME type、webViewLink 與 checksum 驗證，失敗時依 Ledger rollback。

**Tech Stack:** Node.js `>=22.13.0`、TypeScript `6.0.3` strict、Node test runner、JSON／JSON Schema、GitHub Actions、Google Drive files metadata／move API。

## Global Constraints

- 保留 Drive 固定頂層 `00_Project_Management`、`01_Design_And_Specs`、`02_UI_UX_And_Visuals`、`03_Game_Content_And_Data`、`04_Testing_And_Evidence`、`05_Releases_And_Store_Assets`、`80_Inbox`、`90_Archive`。
- Phase 1 只治理成語圖卡；Phase 2 只能在 Phase 1 沒有 Blocking drift 後啟動。
- 新素材一律先進 `80_Inbox/Idiom_Cards/<YYYY-MM-DD>_<BatchId>`，不得從 Inbox 直接進 Approved。
- 同一 `assetType + identity` 最多只能有一個 `current Approved` master。
- `published` 只記錄 metadata，不複製第二份 canonical master。
- 搬移與重新命名必須保留原 Drive File ID；不得以重新上傳取代 move。
- 所有搬移都必須先建立 Migration Ledger 與 rollback path。
- 舊版只移入 `90_Archive`，本計畫不得永久刪除任何 Drive 素材。
- 檔名中的 `Approved` 不能單獨證明核准；Registry、Drive metadata、checksum 與審核證據必須一致。
- Component、Template、Artwork 與 Composite 必須分開保存；Composite 不得成為唯一 canonical source。
- 修改難易度、稀有度徽章或外框，不得改變 artwork File ID 與 artwork SHA-256。
- 未取得正式授權的 UR／外部 IP 資產不得進 Approved、發布或商店素材。
- 不修改主玩法、關卡資料、`cicg-progress`、`cicg-card-collection` 或其他 IndexedDB Schema。
- 所有程式修改遵循 TDD：RED → GREEN → 完整回歸。

---

## File Map

### Create

```text
src/cards/drive-assets/drive-asset-types.ts
src/cards/drive-assets/validate-drive-asset-registry.ts
src/cards/drive-assets/validate-drive-folder-registry.ts
src/cards/drive-assets/validate-drive-migration-ledger.ts
src/cards/drive-assets/index.ts
scripts/validate-drive-assets.mjs
tests/card-drive-asset-registry.test.mjs
tests/card-drive-folder-registry.test.mjs
tests/card-drive-migration-ledger.test.mjs
data/drive-assets/drive-asset.schema.json
data/drive-assets/drive-folder.schema.json
data/drive-assets/drive-migration.schema.json
data/drive-assets/drive-folders.json
data/drive-assets/idiom-card-assets.json
data/drive-assets/migrations/2026-08-06-phase1-batch0-inventory.json
data/drive-assets/migrations/2026-08-06-phase1-batch1-approved-components.json
docs/superpowers/reports/2026-08-06-drive-phase1-baseline-inventory.md
docs/superpowers/reports/2026-08-06-drive-phase1-migration-report.md
docs/superpowers/reports/2026-08-06-drive-phase2-readiness.md
```

### Modify

```text
package.json
scripts/verify.sh
AGENTS.md
docs/superpowers/specs/README.md
docs/card-prompts/components/rarity-frame-registry-v1.md
```

### Responsibilities

- `drive-asset-types.ts`：唯一的 Registry／Folder／Migration TypeScript contract。
- `validate-drive-asset-registry.ts`：資產欄位、狀態、唯一 current Approved、取代關係與 Drive ID Gate。
- `validate-drive-folder-registry.ts`：Folder key、parent key、Drive Folder ID 與目標拓樸 Gate。
- `validate-drive-migration-ledger.ts`：pre／post metadata、rollback 與 batch 狀態 Gate。
- `scripts/validate-drive-assets.mjs`：讀取 GitHub JSON 並執行三類 validator；不得直接呼叫 Drive 或改檔。
- `data/drive-assets/*.json`：GitHub 中可稽核的 canonical metadata。
- `migrations/*.json`：每批 Drive 實體操作的不可變 Ledger。
- `reports/*.md`：人類可讀的盤點、搬移證據與 Phase 2 Gate。

---

### Task 1: 建立 Drive Registry 純 TypeScript Contract

**Files:**
- Create: `src/cards/drive-assets/drive-asset-types.ts`
- Create: `src/cards/drive-assets/index.ts`
- Test: `tests/card-drive-asset-registry.test.mjs`

**Interfaces:**
- Produces: `DriveAssetRecord`, `DriveAssetRegistry`, `DriveFolderRecord`, `DriveFolderRegistry`, `DriveMigrationEntry`, `DriveMigrationLedger`。
- Later tasks consume these exact names；不得另建平行型別。

- [ ] **Step 1: Write the failing type-and-shape test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DRIVE_ASSET_STATUSES,
  DRIVE_ASSET_TYPES,
} from '../.core-dist/cards/drive-assets/index.js';

test('Drive governance exports the approved closed vocabularies', () => {
  assert.deepEqual(DRIVE_ASSET_TYPES, [
    'artwork',
    'card-frame',
    'rarity-badge',
    'difficulty-badge',
    'theme-badge',
    'motto-plaque',
    'effect-overlay',
    'template',
    'composite',
    'reference-only',
    'legacy-flat-card',
  ]);
  assert.deepEqual(DRIVE_ASSET_STATUSES, [
    'intake',
    'classified',
    'review',
    'changes-requested',
    'approved',
    'published',
    'archived',
    'quarantined',
    'rejected',
    'unverifiable',
  ]);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
npm run compile:core
node --test tests/card-drive-asset-registry.test.mjs
```

Expected: FAIL because `cards/drive-assets/index.js` does not exist.

- [ ] **Step 3: Implement the minimum shared types**

```ts
export const DRIVE_ASSET_TYPES = [
  'artwork',
  'card-frame',
  'rarity-badge',
  'difficulty-badge',
  'theme-badge',
  'motto-plaque',
  'effect-overlay',
  'template',
  'composite',
  'reference-only',
  'legacy-flat-card',
] as const;

export const DRIVE_ASSET_STATUSES = [
  'intake',
  'classified',
  'review',
  'changes-requested',
  'approved',
  'published',
  'archived',
  'quarantined',
  'rejected',
  'unverifiable',
] as const;

export type DriveAssetType = (typeof DRIVE_ASSET_TYPES)[number];
export type DriveAssetStatus = (typeof DRIVE_ASSET_STATUSES)[number];

export interface DriveAssetRecord {
  readonly assetId: string;
  readonly assetType: DriveAssetType;
  readonly identity: string;
  readonly version: string;
  readonly status: DriveAssetStatus;
  readonly currentApproved: boolean;
  readonly filename: string;
  readonly driveFileId: string;
  readonly parentFolderKey: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly sha256: string;
  readonly widthPx: number | null;
  readonly heightPx: number | null;
  readonly webViewLink: string;
  readonly supersedesAssetId: string | null;
  readonly supersededByAssetId: string | null;
  readonly approvalEvidenceIds: readonly string[];
  readonly licenseEvidenceId: string | null;
}

export interface DriveAssetRegistry {
  readonly schemaVersion: 1;
  readonly updatedAt: string;
  readonly assets: readonly DriveAssetRecord[];
}

export interface DriveFolderRecord {
  readonly folderKey: string;
  readonly driveFolderId: string;
  readonly name: string;
  readonly parentFolderKey: string | null;
  readonly lifecycleRole: 'root' | 'inbox' | 'review' | 'approved' | 'archive' | 'reference';
}

export interface DriveFolderRegistry {
  readonly schemaVersion: 1;
  readonly updatedAt: string;
  readonly folders: readonly DriveFolderRecord[];
}

export interface DriveFileSnapshot {
  readonly name: string;
  readonly parentFolderId: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly sha256: string;
  readonly webViewLink: string;
}

export interface DriveMigrationEntry {
  readonly assetId: string;
  readonly driveFileId: string;
  readonly operation: 'move' | 'move-and-rename' | 'archive';
  readonly before: DriveFileSnapshot;
  readonly after: DriveFileSnapshot;
  readonly rollback: DriveFileSnapshot;
  readonly status: 'planned' | 'applied' | 'verified' | 'rolled-back' | 'blocked';
  readonly blockingReason: string | null;
}

export interface DriveMigrationLedger {
  readonly schemaVersion: 1;
  readonly batchId: string;
  readonly phase: 'phase1' | 'phase2';
  readonly createdAt: string;
  readonly sourceCommit: string;
  readonly status: 'planned' | 'in-progress' | 'verified' | 'rolled-back' | 'blocked';
  readonly entries: readonly DriveMigrationEntry[];
}
```

`index.ts` 只 re-export 上述型別與 constants。

- [ ] **Step 4: Run the focused test and verify GREEN**

```bash
npm run compile:core
node --test tests/card-drive-asset-registry.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cards/drive-assets tests/card-drive-asset-registry.test.mjs
git commit -m "feat: add Drive asset governance contracts"
```

---

### Task 2: 實作 Asset Registry Validation Gate

**Files:**
- Create: `src/cards/drive-assets/validate-drive-asset-registry.ts`
- Modify: `src/cards/drive-assets/index.ts`
- Test: `tests/card-drive-asset-registry.test.mjs`

**Interfaces:**
- Consumes: `DriveAssetRegistry` from Task 1。
- Produces: `validateDriveAssetRegistry(registry): readonly DriveRegistryIssue[]`。

- [ ] **Step 1: Add failing tests for blocking rules**

```js
import { validateDriveAssetRegistry } from '../.core-dist/cards/drive-assets/index.js';

const approved = {
  assetId: 'frame-n-v1.0-emerald-antique-gold',
  assetType: 'card-frame',
  identity: 'rarity-frame-n',
  version: '1.0',
  status: 'approved',
  currentApproved: true,
  filename: 'CICG_Component_RarityFrame_N_v1.0_Approved.png',
  driveFileId: '1KO7NHfipw-MlFfYLDaakHuupGjtrwYu8',
  parentFolderKey: 'idiom-cards.components.card-frames.approved',
  mimeType: 'image/png',
  sizeBytes: 2285281,
  sha256: '17e6a6798e491ad2bad12b5746e7c3414078e456b83838db2e75aa0a7352ae65',
  widthPx: 1024,
  heightPx: 2000,
  webViewLink: 'https://drive.google.com/file/d/1KO7NHfipw-MlFfYLDaakHuupGjtrwYu8/view',
  supersedesAssetId: null,
  supersededByAssetId: null,
  approvalEvidenceIds: ['pr-32'],
  licenseEvidenceId: null,
};

test('rejects two current Approved masters in one asset family', () => {
  const issues = validateDriveAssetRegistry({
    schemaVersion: 1,
    updatedAt: '2026-08-06T14:00:00+08:00',
    assets: [approved, { ...approved, assetId: 'frame-n-v1.1', version: '1.1' }],
  });
  assert.ok(issues.some((issue) => issue.code === 'duplicate-current-approved'));
});

test('rejects Approved assets without checksum or approval evidence', () => {
  const issues = validateDriveAssetRegistry({
    schemaVersion: 1,
    updatedAt: '2026-08-06T14:00:00+08:00',
    assets: [{ ...approved, sha256: '', approvalEvidenceIds: [] }],
  });
  assert.deepEqual(issues.map((issue) => issue.code).sort(), [
    'approved-missing-evidence',
    'invalid-sha256',
  ]);
});
```

- [ ] **Step 2: Run RED**

```bash
npm run compile:core
node --test tests/card-drive-asset-registry.test.mjs
```

Expected: FAIL because `validateDriveAssetRegistry` is not exported.

- [ ] **Step 3: Implement deterministic validation**

```ts
export interface DriveRegistryIssue {
  readonly code:
    | 'duplicate-asset-id'
    | 'duplicate-drive-file-id'
    | 'duplicate-current-approved'
    | 'invalid-version'
    | 'invalid-sha256'
    | 'approved-missing-evidence'
    | 'published-not-approved'
    | 'ur-missing-license'
    | 'broken-supersession';
  readonly assetId: string | null;
  readonly message: string;
}

export function validateDriveAssetRegistry(
  registry: DriveAssetRegistry,
): readonly DriveRegistryIssue[] {
  // Use Maps keyed by assetId, driveFileId, and `${assetType}:${identity}`.
  // Return all issues in stable code/assetId order; never throw for content errors.
}
```

Implement exact gates:

- `assetId` unique。
- `driveFileId` unique unless the records are the same `assetId`。
- `version` matches `/^\d+\.\d+$/`。
- `sha256` matches `/^[a-f0-9]{64}$/`。
- `status === 'approved' || status === 'published'` requires non-empty `approvalEvidenceIds`。
- `status === 'published'` requires `currentApproved === true`。
- `identity` beginning `ur-` requires non-null `licenseEvidenceId`。
- each `assetType + identity` has at most one `currentApproved`。
- supersedes／supersededBy IDs must exist and point back consistently。

- [ ] **Step 4: Run GREEN**

```bash
npm run compile:core
node --test tests/card-drive-asset-registry.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/cards/drive-assets tests/card-drive-asset-registry.test.mjs
git commit -m "feat: validate Drive asset registry"
```

---

### Task 3: 實作 Folder Registry 與目標拓樸 Gate

**Files:**
- Create: `src/cards/drive-assets/validate-drive-folder-registry.ts`
- Modify: `src/cards/drive-assets/index.ts`
- Test: `tests/card-drive-folder-registry.test.mjs`

**Interfaces:**
- Produces: `validateDriveFolderRegistry(registry): readonly DriveFolderIssue[]`。
- Folder keys become the only values accepted by asset `parentFolderKey`。

- [ ] **Step 1: Write failing topology tests**

```js
import { validateDriveFolderRegistry } from '../.core-dist/cards/drive-assets/index.js';

test('requires all Phase 1 canonical folders exactly once', () => {
  const issues = validateDriveFolderRegistry({
    schemaVersion: 1,
    updatedAt: '2026-08-06T14:00:00+08:00',
    folders: [],
  });
  assert.ok(issues.some((issue) => issue.code === 'missing-required-folder'));
});

test('rejects duplicate Drive folder IDs', () => {
  const issues = validateDriveFolderRegistry({
    schemaVersion: 1,
    updatedAt: '2026-08-06T14:00:00+08:00',
    folders: [
      { folderKey: 'project.root', driveFolderId: 'same', name: 'root', parentFolderKey: null, lifecycleRole: 'root' },
      { folderKey: 'project.inbox', driveFolderId: 'same', name: '80_Inbox', parentFolderKey: 'project.root', lifecycleRole: 'inbox' },
    ],
  });
  assert.ok(issues.some((issue) => issue.code === 'duplicate-drive-folder-id'));
});
```

- [ ] **Step 2: Run RED**

```bash
npm run compile:core
node --test tests/card-drive-folder-registry.test.mjs
```

- [ ] **Step 3: Implement required folder keys**

Required keys must include:

```ts
export const REQUIRED_PHASE1_FOLDER_KEYS = [
  'project.root',
  'project.visuals',
  'project.inbox',
  'project.archive',
  'idiom-cards.root',
  'idiom-cards.artworks.review',
  'idiom-cards.artworks.approved',
  'idiom-cards.components.card-frames.review',
  'idiom-cards.components.card-frames.approved',
  'idiom-cards.components.rarity-badges.review',
  'idiom-cards.components.rarity-badges.approved',
  'idiom-cards.components.difficulty-badges.review',
  'idiom-cards.components.difficulty-badges.approved',
  'idiom-cards.components.theme-badges.review',
  'idiom-cards.components.theme-badges.approved',
  'idiom-cards.components.motto-plaques.review',
  'idiom-cards.components.motto-plaques.approved',
  'idiom-cards.components.effect-overlays.review',
  'idiom-cards.components.effect-overlays.approved',
  'idiom-cards.templates.review',
  'idiom-cards.templates.approved',
  'idiom-cards.composites.review',
  'idiom-cards.composites.approved',
  'idiom-cards.reference-only',
  'idiom-cards.inbox',
  'idiom-cards.archive',
  'idiom-cards.archive.legacy-flat-cards',
  'idiom-cards.archive.rejected-unverifiable',
] as const;
```

Validate unique `folderKey`、unique `driveFolderId`、known parent、no parent cycle、required lifecycle role alignment。

- [ ] **Step 4: Run GREEN**

```bash
npm run compile:core
node --test tests/card-drive-folder-registry.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add src/cards/drive-assets tests/card-drive-folder-registry.test.mjs
git commit -m "feat: validate Drive folder topology"
```

---

### Task 4: 實作 Migration Ledger 與 Rollback Gate

**Files:**
- Create: `src/cards/drive-assets/validate-drive-migration-ledger.ts`
- Modify: `src/cards/drive-assets/index.ts`
- Test: `tests/card-drive-migration-ledger.test.mjs`

**Interfaces:**
- Produces: `validateDriveMigrationLedger(ledger): readonly DriveMigrationIssue[]`。

- [ ] **Step 1: Write failing rollback tests**

```js
import { validateDriveMigrationLedger } from '../.core-dist/cards/drive-assets/index.js';

test('blocks applied moves without an exact rollback snapshot', () => {
  const issues = validateDriveMigrationLedger({
    schemaVersion: 1,
    batchId: 'phase1-batch1-approved-components',
    phase: 'phase1',
    createdAt: '2026-08-06T14:00:00+08:00',
    sourceCommit: 'b73c444be304b8550b4c1696a562e0a6fe9863c3',
    status: 'in-progress',
    entries: [{
      assetId: 'frame-n-v1.0-emerald-antique-gold',
      driveFileId: '1KO7NHfipw-MlFfYLDaakHuupGjtrwYu8',
      operation: 'move-and-rename',
      before: null,
      after: null,
      rollback: null,
      status: 'applied',
      blockingReason: null,
    }],
  });
  assert.ok(issues.some((issue) => issue.code === 'missing-snapshot'));
});
```

- [ ] **Step 2: Run RED**

```bash
npm run compile:core
node --test tests/card-drive-migration-ledger.test.mjs
```

- [ ] **Step 3: Implement exact ledger validation**

Gates:

- `sourceCommit` must match `/^[a-f0-9]{40}$/`。
- `driveFileId` unique per batch。
- `before`、`after`、`rollback` required for planned/applicable operations。
- `rollback` must equal `before` for name、parent、MIME、size、checksum、link。
- `verified` entry requires same File ID before/after, changed parent when operation is move, unchanged MIME、size、checksum、webViewLink。
- `blocked` entry requires non-empty `blockingReason`。
- ledger can be `verified` only if every entry is `verified` or intentionally `blocked` with no Drive mutation。

- [ ] **Step 4: Run GREEN**

```bash
npm run compile:core
node --test tests/card-drive-migration-ledger.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add src/cards/drive-assets tests/card-drive-migration-ledger.test.mjs
git commit -m "feat: validate Drive migration ledger"
```

---

### Task 5: 建立 JSON Schema、CLI 與 CI Gate

**Files:**
- Create: `data/drive-assets/drive-asset.schema.json`
- Create: `data/drive-assets/drive-folder.schema.json`
- Create: `data/drive-assets/drive-migration.schema.json`
- Create: `scripts/validate-drive-assets.mjs`
- Modify: `package.json`
- Modify: `scripts/verify.sh`
- Test: `tests/card-drive-asset-registry.test.mjs`
- Test: `tests/card-drive-folder-registry.test.mjs`
- Test: `tests/card-drive-migration-ledger.test.mjs`

**Interfaces:**
- CLI command: `npm run validate:drive-assets`。
- Exit `0` only when Asset Registry、Folder Registry、all Migration Ledgers pass。
- Exit `1` and print stable one-line issues otherwise。

- [ ] **Step 1: Add failing package-script assertion**

Extend a test to load `package.json` and assert:

```js
assert.equal(
  packageJson.scripts['validate:drive-assets'],
  'npm run compile:core && node scripts/validate-drive-assets.mjs',
);
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/card-drive-asset-registry.test.mjs
```

- [ ] **Step 3: Add schemas and CLI**

The CLI must:

```js
const files = {
  folders: 'data/drive-assets/drive-folders.json',
  assets: 'data/drive-assets/idiom-card-assets.json',
  migrationsDir: 'data/drive-assets/migrations',
};
```

It imports validators from `.core-dist/cards/drive-assets/index.js`, reads every JSON file deterministically, sorts issues by `code` then identifier, prints:

```text
[drive-assets] PASS folders=28 assets=5 migrations=2
```

or:

```text
[drive-assets] FAIL duplicate-current-approved asset=frame-n-v1.1
```

Do not add a runtime dependency such as Ajv in this phase；JSON Schema is documentation／tool interoperability, and TypeScript validators are the executable source of truth。

Add scripts:

```json
{
  "validate:drive-assets": "npm run compile:core && node scripts/validate-drive-assets.mjs",
  "test:drive-assets": "npm run compile:core && node --test tests/card-drive-*.test.mjs"
}
```

Insert `npm run test:drive-assets` into the existing `test` chain and `npm run validate:drive-assets` into `scripts/verify.sh` after `npm run test`。

- [ ] **Step 4: Run focused and full GREEN**

```bash
npm run test:drive-assets
npm run validate:drive-assets
./scripts/verify.sh
```

Expected: all pass；no existing test is removed。

- [ ] **Step 5: Commit**

```bash
git add package.json scripts/verify.sh scripts/validate-drive-assets.mjs \
  data/drive-assets/*.schema.json tests/card-drive-*.test.mjs
git commit -m "test: add Drive asset governance gate"
```

---

### Task 6: 建立 Phase 1 Baseline Registries 與 Read-only Inventory

**Files:**
- Create: `data/drive-assets/drive-folders.json`
- Create: `data/drive-assets/idiom-card-assets.json`
- Create: `data/drive-assets/migrations/2026-08-06-phase1-batch0-inventory.json`
- Create: `docs/superpowers/reports/2026-08-06-drive-phase1-baseline-inventory.md`

**Interfaces:**
- Asset Registry seeds only facts verified from GitHub `main` and Drive metadata。
- Unknown checksum／dimension／approval evidence must block the record；never fabricate values。

- [ ] **Step 1: Write failing fixture tests**

Add tests that require these root folder IDs:

```js
assert.equal(byKey.get('project.root').driveFolderId, '1uF6Gzt8RnLkGAk02e_PXhnMcTHQQ72Nw');
assert.equal(byKey.get('project.visuals').driveFolderId, '1cH0KYWGvUT5ci57HW8JBFv3v-8uG51IC');
assert.equal(byKey.get('project.inbox').driveFolderId, '1h_yncfl1MHcZy7IKrP3dGfmNC5lVGfuV');
assert.equal(byKey.get('project.archive').driveFolderId, '1nqvBeExct6jW_1TJ-be_eGZ-wJIK-TJr');
```

Require these five known assets:

- N frame File ID `1KO7NHfipw-MlFfYLDaakHuupGjtrwYu8`
- R frame File ID `18AgLp9b1hCrqawfsk5-OxPlmgSt93YGR`
- SR frame File ID `1cZPhfFv483bJAxk0kCBj6XS4V6Vyfx40`
- SSR v2.8 frame File ID `1_PR-_mZXBkf7WJxXwq83AjaOvWpUJwbz`
- Difficulty badge File ID `1azohQXFHLVP5scplRQuJa33h2pUU8qq4`

- [ ] **Step 2: Run RED**

```bash
npm run test:drive-assets
```

Expected: FAIL because registry files do not exist。

- [ ] **Step 3: Perform read-only Drive inventory**

For each existing item under `02_UI_UX_And_Visuals`、`80_Inbox` and `90_Archive`:

1. `list_folder` to capture direct children。
2. `get_file_metadata` for ID、name、parents、MIME、size、webViewLink、createdTime、modifiedTime。
3. For files registered as Approved, download or use existing verified checksum evidence；when checksum cannot be independently verified, set migration entry to `blocked` and do not move。
4. Recursively list these known folders before classification:
   - `CICG_Card_Templates_v2.6_Review` (`1zA5wEA4KOKj9G-gpum6f8xe0RgpiyBe_`)
   - `CICG_Legacy_Card_Assets_Backup` (`1estQ2VP1tbQLI2VNbS3V2FvpDICjbOGO`)
   - `CICG_Card_Templates_v2.1_Approved` (`1vAc0oT3CUvbG-5isbOdA5K4lpuOd_-gB`)
   - `CICG_Idiom_Cards_Pending_Review_2026-08-06` (`1-uFlkMnGlllroZ1UBoBVfFb12A-NpvNP`)
   - `Idiom_Cards` (`1HTMdGnQrx9KPdOMOiM30UOIPLRyhb179`)

- [ ] **Step 4: Seed exact registries and inventory report**

`batch0` is read-only：every entry operation is represented as classification metadata, status `verified` only means inventory metadata was verified；it must not claim a Drive move。

The report must include:

- counts by asset type and lifecycle state。
- duplicate File IDs or duplicate `current Approved` findings。
- orphan files not represented in GitHub。
- registry entries whose Drive metadata cannot be verified。
- explicit `Blocking drift` table。
- conclusion `Phase 1 move gate: PASS` or `BLOCKED`。

- [ ] **Step 5: Run GREEN**

```bash
npm run validate:drive-assets
npm run test:drive-assets
```

- [ ] **Step 6: Commit**

```bash
git add data/drive-assets docs/superpowers/reports/2026-08-06-drive-phase1-baseline-inventory.md
git commit -m "docs: record Drive Phase 1 baseline inventory"
```

---

### Task 7: 建立 Phase 1 目標資料夾並回填 Folder Registry

**Files:**
- Modify: `data/drive-assets/drive-folders.json`
- Modify: `docs/superpowers/reports/2026-08-06-drive-phase1-baseline-inventory.md`

**Interfaces:**
- Google Drive `create_folder(name, parent_folder)` returns the canonical Folder ID。
- Folder Registry must be updated before any asset move。

- [ ] **Step 1: Confirm precondition**

```bash
npm run validate:drive-assets
```

Expected: PASS, with move gate not blocked by missing checksum or duplicate Approved assets。

- [ ] **Step 2: Create folders in parent-before-child order**

Create exactly:

```text
02_UI_UX_And_Visuals/Idiom_Cards
02_UI_UX_And_Visuals/Idiom_Cards/00_Readme_And_Shortcuts
02_UI_UX_And_Visuals/Idiom_Cards/01_Artworks/10_Review
02_UI_UX_And_Visuals/Idiom_Cards/01_Artworks/20_Approved
02_UI_UX_And_Visuals/Idiom_Cards/02_Components/01_Card_Frames/10_Review
02_UI_UX_And_Visuals/Idiom_Cards/02_Components/01_Card_Frames/20_Approved
02_UI_UX_And_Visuals/Idiom_Cards/02_Components/02_Rarity_Badges/10_Review
02_UI_UX_And_Visuals/Idiom_Cards/02_Components/02_Rarity_Badges/20_Approved
02_UI_UX_And_Visuals/Idiom_Cards/02_Components/03_Difficulty_Badges/10_Review
02_UI_UX_And_Visuals/Idiom_Cards/02_Components/03_Difficulty_Badges/20_Approved
02_UI_UX_And_Visuals/Idiom_Cards/02_Components/04_Theme_Badges/10_Review
02_UI_UX_And_Visuals/Idiom_Cards/02_Components/04_Theme_Badges/20_Approved
02_UI_UX_And_Visuals/Idiom_Cards/02_Components/05_Motto_Plaques/10_Review
02_UI_UX_And_Visuals/Idiom_Cards/02_Components/05_Motto_Plaques/20_Approved
02_UI_UX_And_Visuals/Idiom_Cards/02_Components/06_Effect_Overlays/10_Review
02_UI_UX_And_Visuals/Idiom_Cards/02_Components/06_Effect_Overlays/20_Approved
02_UI_UX_And_Visuals/Idiom_Cards/03_Templates/10_Review
02_UI_UX_And_Visuals/Idiom_Cards/03_Templates/20_Approved
02_UI_UX_And_Visuals/Idiom_Cards/04_Composites/10_Review
02_UI_UX_And_Visuals/Idiom_Cards/04_Composites/20_Approved
02_UI_UX_And_Visuals/Idiom_Cards/05_Reference_Only
80_Inbox/Idiom_Cards
90_Archive/Idiom_Cards/01_Artworks
90_Archive/Idiom_Cards/02_Components
90_Archive/Idiom_Cards/03_Templates
90_Archive/Idiom_Cards/04_Composites
90_Archive/Idiom_Cards/05_Legacy_Flat_Cards
90_Archive/Idiom_Cards/06_Rejected_And_Unverifiable
```

Before each create, list the parent and reuse an exact-name existing folder instead of creating a duplicate。

- [ ] **Step 3: Verify every folder**

For every returned Folder ID, fetch metadata and assert:

- MIME is `application/vnd.google-apps.folder`。
- name exactly matches the plan。
- single intended parent ID。
- current user can list children。

- [ ] **Step 4: Update Folder Registry and run gate**

```bash
npm run validate:drive-assets
npm run test:drive-assets
```

- [ ] **Step 5: Commit**

```bash
git add data/drive-assets/drive-folders.json docs/superpowers/reports/2026-08-06-drive-phase1-baseline-inventory.md
git commit -m "docs: register Drive Phase 1 folder topology"
```

---

### Task 8: 搬移與標準化已核准元件 Batch 1

**Files:**
- Create: `data/drive-assets/migrations/2026-08-06-phase1-batch1-approved-components.json`
- Modify: `data/drive-assets/idiom-card-assets.json`
- Modify: `docs/card-prompts/components/rarity-frame-registry-v1.md`
- Create: `docs/superpowers/reports/2026-08-06-drive-phase1-migration-report.md`

**Interfaces:**
- Drive operation uses `update_file(fileId, name, addParents, removeParents)`。
- Same File ID before and after is mandatory。

- [ ] **Step 1: Create the planned Ledger before touching Drive**

Batch entries:

| asset | File ID | target | canonical filename |
|---|---|---|---|
| N rarity frame | `1KO7NHfipw-MlFfYLDaakHuupGjtrwYu8` | Card Frames Approved | `CICG_Component_RarityFrame_N_v1.0_Approved.png` |
| R rarity frame | `18AgLp9b1hCrqawfsk5-OxPlmgSt93YGR` | Card Frames Approved | `CICG_Component_RarityFrame_R_v1.0_Approved.png` |
| SR rarity frame | `1cZPhfFv483bJAxk0kCBj6XS4V6Vyfx40` | Card Frames Approved | `CICG_Component_RarityFrame_SR_v1.0_Approved.png` |
| SSR rarity frame | `1_PR-_mZXBkf7WJxXwq83AjaOvWpUJwbz` | Card Frames Approved | `CICG_Component_RarityFrame_SSR_v2.8_Approved.png` |
| E–S difficulty badge sheet | `1azohQXFHLVP5scplRQuJa33h2pUU8qq4` | Difficulty Badges Approved | `CICG_Component_DifficultyBadge_E-S_v1.0_Approved.jpeg` |

Each entry’s `before` and `rollback` must be populated from live metadata；`after` uses the exact target Folder ID from Task 7。

- [ ] **Step 2: Validate the planned Ledger**

```bash
npm run validate:drive-assets
```

Expected: PASS with batch status `planned`。

- [ ] **Step 3: Apply one file at a time**

For each entry:

1. Refetch live metadata immediately before move。
2. Compare with Ledger `before`; on mismatch set entry `blocked` and stop the batch。
3. Call Drive `update_file` with the same File ID、canonical name、target parent and source parent removal。
4. Refetch metadata immediately after move。
5. Verify File ID、MIME、size、webViewLink unchanged and target parent exact。
6. Mark entry `verified` before continuing to the next file。

No parallel moves。

- [ ] **Step 4: Update registries only after Drive verification**

Update filename and `parentFolderKey` in `idiom-card-assets.json` and `rarity-frame-registry-v1.md`。Preserve existing component IDs、checksums and approval evidence。

- [ ] **Step 5: Run all gates**

```bash
npm run validate:drive-assets
npm run test:drive-assets
./scripts/verify.sh
```

- [ ] **Step 6: Commit verified evidence**

```bash
git add data/drive-assets docs/card-prompts/components/rarity-frame-registry-v1.md \
  docs/superpowers/reports/2026-08-06-drive-phase1-migration-report.md
git commit -m "docs: record approved component Drive migration"
```

---

### Task 9: 整理 Review、Inbox 與 Legacy 資產 Batch 2

**Files:**
- Create: `data/drive-assets/migrations/2026-08-06-phase1-batch2-review-and-legacy.json`
- Modify: `data/drive-assets/idiom-card-assets.json`
- Modify: `docs/superpowers/reports/2026-08-06-drive-phase1-migration-report.md`

**Interfaces:**
- Only assets classified and verified in Batch 0 may enter this Ledger。
- No file becomes Approved in this task。

- [ ] **Step 1: Build deterministic classification from Batch 0**

Use these mappings:

- current v2.6 Review templates → `03_Templates/10_Review`。
- pending review batches → `80_Inbox/Idiom_Cards/<original-batch-name>` until each file is classified。
- style references／competitor screenshots／mockups → `05_Reference_Only`。
- flat historical cards → `90_Archive/Idiom_Cards/05_Legacy_Flat_Cards`。
- superseded templates with verified `supersededByAssetId` → `90_Archive/Idiom_Cards/03_Templates/<identity>/<version>`。
- damaged、duplicate、source-unknown or rights-unknown assets → `90_Archive/Idiom_Cards/06_Rejected_And_Unverifiable` only after the reason is recorded；otherwise remain quarantined in Inbox。

- [ ] **Step 2: Write and validate the full Ledger before moving**

Every entry must have exact source parent、target parent、name、size、MIME、checksum and rollback snapshot。

- [ ] **Step 3: Apply sequentially with stop-on-first-drift**

Use the same six-step move protocol as Task 8。Folder moves must also preserve folder ID and be followed by recursive child recount。

- [ ] **Step 4: Prove no false Approved state**

Run a test that asserts every asset under an Approved folder has `status` of `approved` or `published` and `currentApproved === true`；every Review／Inbox／Archive asset must have `currentApproved === false`。

- [ ] **Step 5: Run full verification**

```bash
npm run validate:drive-assets
npm run test:drive-assets
./scripts/verify.sh
```

- [ ] **Step 6: Commit**

```bash
git add data/drive-assets docs/superpowers/reports/2026-08-06-drive-phase1-migration-report.md
git commit -m "docs: record Review and legacy Drive migration"
```

---

### Task 10: 完成 Phase 1 Drift Audit 與 Phase 2 Readiness

**Files:**
- Create: `docs/superpowers/reports/2026-08-06-drive-phase2-readiness.md`
- Modify: `AGENTS.md`
- Modify: `docs/superpowers/specs/README.md`
- Modify: `docs/superpowers/reports/2026-08-06-drive-phase1-migration-report.md`

**Interfaces:**
- Phase 2 readiness is a decision record, not permission to move Phase 2 files automatically。

- [ ] **Step 1: Re-scan Phase 1 Drive folders**

Compare live Drive metadata against GitHub registries and report:

- missing Drive files。
- parent mismatches。
- filename mismatches。
- checksum／size／MIME mismatches。
- duplicate current Approved families。
- Approved files without evidence。
- registered assets not present in Drive。
- unregistered files inside governed folders。

- [ ] **Step 2: Set exact readiness result**

`Phase 2 Ready = true` only when all are true:

```text
Blocking drift = 0
Duplicate current Approved = 0
Unverified applied migrations = 0
Missing rollback snapshots = 0
Unregistered files in Approved folders = 0
Full repository verify = PASS
```

Otherwise `Phase 2 Ready = false` and list the exact blocking asset／folder IDs。

- [ ] **Step 3: Update permanent agent entry points**

Add exact Registry paths and the rule that Drive operations must use the latest verified Ledger；do not paste transient Folder IDs into multiple documents when `drive-folders.json` is the canonical registry。

- [ ] **Step 4: Run final verification**

```bash
npm install
./scripts/verify.sh
git status --short
git diff --check
```

Expected:

- tests、TypeScript strict、ESLint、Vite PWA Build、npm audit all pass。
- no uncommitted generated files。
- no Drive deletion operation occurred。

- [ ] **Step 5: Commit**

```bash
git add AGENTS.md docs/superpowers/specs/README.md docs/superpowers/reports
git commit -m "docs: complete Drive Phase 1 governance audit"
```

---

## PR and Merge Gate

- [ ] Sync branch with latest `main`; require `behind_by = 0`。
- [ ] Open one implementation PR；do not split Drive moves into unrelated PRs unless a Blocking drift requires a separate corrective attempt。
- [ ] Record exact test count from the latest run；do not reuse historical totals。
- [ ] Record TypeScript strict、ESLint、Vite PWA Build、PWA precache and npm audit results。
- [ ] Record every created Drive Folder ID and every moved File ID in the PR body or linked migration report。
- [ ] Require zero unresolved review threads。
- [ ] Run ChatGPT Audit against Registry、Folder Registry、Migration Ledgers、live Drive metadata and CI。
- [ ] Squash Merge only after all gates pass。

## Rollback Protocol

When any post-move verification fails:

1. Stop the current batch immediately；do not move the next entry。
2. Use the same File ID and Ledger `rollback` snapshot to restore original name and parent。
3. Refetch metadata and verify original parent、name、MIME、size、checksum and webViewLink。
4. Mark entry `rolled-back` and batch `blocked`。
5. Commit the failed-attempt Ledger and exact finding；do not erase evidence。
6. Open a new validation attempt only after the root cause is identified。

## Out of Scope

- Permanent deletion of Drive files or folders。
- Changing Drive sharing permissions or ownership。
- Re-encoding、compressing or replacing binary asset bytes。
- Producing new card artwork or composites。
- Implementing the modular card renderer。
- Phase 2 physical migration before the readiness Gate passes。
- Any progress schema、card collection schema or main gameplay change。
