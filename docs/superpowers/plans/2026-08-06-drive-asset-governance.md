# Drive 素材治理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立可驗證的 Drive Asset Registry、Folder Registry、Migration Ledger 與漂移檢查，先完成成語圖卡 Phase 1 安全治理，再判定是否可啟動 Phase 2。

**Architecture:** GitHub `main` 保存結構化 metadata、Schema、純 TypeScript validator、CLI、Migration Ledger 與報告；Google Drive 保存二進位 master、Review、Approved 與 Archive。所有 move／rename 都先寫入 Ledger，使用原 File ID 原地移動，再驗證 parent、name、MIME、size、checksum 與 webViewLink；失敗立即依 rollback snapshot 還原。

**Tech Stack:** Node.js `>=22.13.0`、TypeScript `6.0.3` strict、Node test runner、JSON／JSON Schema、GitHub Actions、Google Drive metadata／move API。

## Global Constraints

- 保留 Drive 固定頂層 `00_Project_Management`、`01_Design_And_Specs`、`02_UI_UX_And_Visuals`、`03_Game_Content_And_Data`、`04_Testing_And_Evidence`、`05_Releases_And_Store_Assets`、`80_Inbox`、`90_Archive`。
- Phase 1 只治理成語圖卡；Phase 2 只能在 Blocking drift 為 0 後啟動。
- 新素材一律先進 `80_Inbox/Idiom_Cards/<YYYY-MM-DD>_<BatchId>`，不得直接進 Approved。
- 同一 `assetType + identity` 最多一個 `currentApproved = true` master。
- `published` 只記錄 metadata，不複製第二份 canonical master。
- Move／rename 必須保留原 Drive File ID；不得以重新上傳取代搬移。
- 每批搬移必須先有完整 Ledger、pre-move snapshot 與 rollback path。
- 本計畫不永久刪除任何 Drive 檔案或資料夾；舊版只進 Archive。
- 檔名中的 `Approved` 不能單獨證明核准。
- Artwork、Component、Template、Composite 與 Reference 必須分開管理。
- Composite 不得成為唯一 canonical source。
- 不修改主玩法、關卡資料、`cicg-progress`、`cicg-card-collection` 或其他 IndexedDB Schema。
- 程式修改一律 TDD：RED → GREEN → 完整回歸。

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
data/drive-assets/migrations/2026-08-06-phase1-batch1-approved-rarity-frames.json
data/drive-assets/migrations/2026-08-06-phase1-batch2-review-and-legacy.json
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

---

### Task 1: 建立純 TypeScript Governance Contract

**Files:**
- Create: `src/cards/drive-assets/drive-asset-types.ts`
- Create: `src/cards/drive-assets/index.ts`
- Test: `tests/card-drive-asset-registry.test.mjs`

**Interfaces:**
- Produces: `DriveAssetRecord`、`DriveFolderRecord`、`DriveMigrationEntry`、`DriveMigrationLedger`。
- Later tasks must import these names from `src/cards/drive-assets/index.ts`。

- [ ] **Step 1: Write the failing export test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DRIVE_ASSET_STATUSES,
  DRIVE_ASSET_TYPES,
} from '../.core-dist/cards/drive-assets/index.js';

test('exports the approved Drive governance vocabularies', () => {
  assert.deepEqual(DRIVE_ASSET_TYPES, [
    'artwork', 'card-frame', 'rarity-badge', 'difficulty-badge',
    'theme-badge', 'motto-plaque', 'effect-overlay', 'template',
    'composite', 'reference-only', 'legacy-flat-card',
  ]);
  assert.deepEqual(DRIVE_ASSET_STATUSES, [
    'intake', 'classified', 'review', 'changes-requested',
    'approved', 'published', 'archived', 'quarantined',
    'rejected', 'unverifiable',
  ]);
});
```

- [ ] **Step 2: Run RED**

```bash
npm run compile:core
node --test tests/card-drive-asset-registry.test.mjs
```

Expected: FAIL because the module does not exist。

- [ ] **Step 3: Implement the exact contracts**

```ts
export const DRIVE_ASSET_TYPES = [
  'artwork', 'card-frame', 'rarity-badge', 'difficulty-badge',
  'theme-badge', 'motto-plaque', 'effect-overlay', 'template',
  'composite', 'reference-only', 'legacy-flat-card',
] as const;

export const DRIVE_ASSET_STATUSES = [
  'intake', 'classified', 'review', 'changes-requested',
  'approved', 'published', 'archived', 'quarantined',
  'rejected', 'unverifiable',
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
  readonly lifecycleRole: 'root' | 'container' | 'inbox' | 'review' | 'approved' | 'archive' | 'reference';
}

export interface DriveFolderRegistry {
  readonly schemaVersion: 1;
  readonly updatedAt: string;
  readonly folders: readonly DriveFolderRecord[];
}

export interface DriveResourceSnapshot {
  readonly name: string;
  readonly parentFolderId: string;
  readonly mimeType: string;
  readonly sizeBytes: number | null;
  readonly sha256: string | null;
  readonly webViewLink: string;
}

export interface DriveMigrationEntry {
  readonly resourceKind: 'file' | 'folder';
  readonly assetId: string | null;
  readonly driveResourceId: string;
  readonly operation: 'move' | 'move-and-rename' | 'archive';
  readonly before: DriveResourceSnapshot;
  readonly after: DriveResourceSnapshot;
  readonly rollback: DriveResourceSnapshot;
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

For `resourceKind = 'file'`，`sizeBytes` and `sha256` are mandatory；for folders they must be `null` and MIME must be `application/vnd.google-apps.folder`。

- [ ] **Step 4: Run GREEN**

```bash
npm run compile:core
node --test tests/card-drive-asset-registry.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add src/cards/drive-assets tests/card-drive-asset-registry.test.mjs
git commit -m "feat: add Drive governance contracts"
```

---

### Task 2: 實作 Asset Registry Validation

**Files:**
- Create: `src/cards/drive-assets/validate-drive-asset-registry.ts`
- Modify: `src/cards/drive-assets/index.ts`
- Test: `tests/card-drive-asset-registry.test.mjs`

**Interfaces:**
- Produces: `validateDriveAssetRegistry(registry): readonly DriveRegistryIssue[]`。

- [ ] **Step 1: Add failing tests**

```js
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

test('rejects duplicate current Approved masters', () => {
  const issues = validateDriveAssetRegistry({
    schemaVersion: 1,
    updatedAt: '2026-08-06T14:00:00+08:00',
    assets: [approved, { ...approved, assetId: 'frame-n-v1.1', version: '1.1' }],
  });
  assert.ok(issues.some(({ code }) => code === 'duplicate-current-approved'));
});

test('rejects Approved assets without checksum and evidence', () => {
  const issues = validateDriveAssetRegistry({
    schemaVersion: 1,
    updatedAt: '2026-08-06T14:00:00+08:00',
    assets: [{ ...approved, sha256: '', approvalEvidenceIds: [] }],
  });
  assert.deepEqual(issues.map(({ code }) => code).sort(), [
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

- [ ] **Step 3: Implement stable all-errors validation**

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
```

Exact gates:

- unique `assetId` and `driveFileId`。
- `version` matches `/^\d+\.\d+$/`。
- `sha256` matches `/^[a-f0-9]{64}$/`。
- Approved／published require `approvalEvidenceIds.length > 0`。
- published requires `currentApproved = true`。
- `identity` beginning `ur-` requires `licenseEvidenceId`。
- each `assetType + identity` has at most one current Approved master。
- supersedes／supersededBy IDs exist and point back consistently。
- issues sort by `code` then `assetId`；content errors return issues instead of throwing。

- [ ] **Step 4: Run GREEN and commit**

```bash
npm run compile:core
node --test tests/card-drive-asset-registry.test.mjs
git add src/cards/drive-assets tests/card-drive-asset-registry.test.mjs
git commit -m "feat: validate Drive asset registry"
```

---

### Task 3: 實作 Folder Topology Validation

**Files:**
- Create: `src/cards/drive-assets/validate-drive-folder-registry.ts`
- Modify: `src/cards/drive-assets/index.ts`
- Test: `tests/card-drive-folder-registry.test.mjs`

**Interfaces:**
- Produces: `REQUIRED_PHASE1_FOLDER_KEYS` and `validateDriveFolderRegistry()`。

- [ ] **Step 1: Write failing topology tests**

```js
test('requires the full Phase 1 folder graph', () => {
  const issues = validateDriveFolderRegistry({
    schemaVersion: 1,
    updatedAt: '2026-08-06T14:00:00+08:00',
    folders: [],
  });
  assert.ok(issues.some(({ code }) => code === 'missing-required-folder'));
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
  assert.ok(issues.some(({ code }) => code === 'duplicate-drive-folder-id'));
});
```

- [ ] **Step 2: Run RED**

```bash
npm run compile:core
node --test tests/card-drive-folder-registry.test.mjs
```

- [ ] **Step 3: Implement required intermediate and leaf keys**

Required graph:

```text
project.root
project.visuals
project.inbox
project.archive
idiom-cards.root
idiom-cards.shortcuts
idiom-cards.artworks
idiom-cards.artworks.review
idiom-cards.artworks.approved
idiom-cards.components
idiom-cards.components.card-frames
idiom-cards.components.card-frames.review
idiom-cards.components.card-frames.approved
idiom-cards.components.rarity-badges
idiom-cards.components.rarity-badges.review
idiom-cards.components.rarity-badges.approved
idiom-cards.components.difficulty-badges
idiom-cards.components.difficulty-badges.review
idiom-cards.components.difficulty-badges.approved
idiom-cards.components.theme-badges
idiom-cards.components.theme-badges.review
idiom-cards.components.theme-badges.approved
idiom-cards.components.motto-plaques
idiom-cards.components.motto-plaques.review
idiom-cards.components.motto-plaques.approved
idiom-cards.components.effect-overlays
idiom-cards.components.effect-overlays.review
idiom-cards.components.effect-overlays.approved
idiom-cards.templates
idiom-cards.templates.review
idiom-cards.templates.approved
idiom-cards.composites
idiom-cards.composites.review
idiom-cards.composites.approved
idiom-cards.reference-only
idiom-cards.inbox
idiom-cards.archive
idiom-cards.archive.artworks
idiom-cards.archive.components
idiom-cards.archive.templates
idiom-cards.archive.composites
idiom-cards.archive.legacy-flat-cards
idiom-cards.archive.rejected-unverifiable
```

Validate unique key、unique Folder ID、known parent、no cycle、and lifecycle role consistent with suffix。

- [ ] **Step 4: Run GREEN and commit**

```bash
npm run compile:core
node --test tests/card-drive-folder-registry.test.mjs
git add src/cards/drive-assets tests/card-drive-folder-registry.test.mjs
git commit -m "feat: validate Drive folder topology"
```

---

### Task 4: 實作 Migration Ledger／Rollback Validation

**Files:**
- Create: `src/cards/drive-assets/validate-drive-migration-ledger.ts`
- Modify: `src/cards/drive-assets/index.ts`
- Test: `tests/card-drive-migration-ledger.test.mjs`

**Interfaces:**
- Produces: `validateDriveMigrationLedger()`。

- [ ] **Step 1: Write failing snapshot tests**

```js
test('blocks a file move without rollback metadata', () => {
  const issues = validateDriveMigrationLedger({
    schemaVersion: 1,
    batchId: 'phase1-batch1-approved-rarity-frames',
    phase: 'phase1',
    createdAt: '2026-08-06T14:00:00+08:00',
    sourceCommit: 'b73c444be304b8550b4c1696a562e0a6fe9863c3',
    status: 'in-progress',
    entries: [{
      resourceKind: 'file',
      assetId: 'frame-n-v1.0-emerald-antique-gold',
      driveResourceId: '1KO7NHfipw-MlFfYLDaakHuupGjtrwYu8',
      operation: 'move-and-rename',
      before: null,
      after: null,
      rollback: null,
      status: 'applied',
      blockingReason: null,
    }],
  });
  assert.ok(issues.some(({ code }) => code === 'missing-snapshot'));
});
```

- [ ] **Step 2: Run RED**

```bash
npm run compile:core
node --test tests/card-drive-migration-ledger.test.mjs
```

- [ ] **Step 3: Implement exact gates**

- `sourceCommit` matches `/^[a-f0-9]{40}$/`。
- `driveResourceId` unique per batch。
- before／after／rollback required for every non-blocked entry。
- rollback equals before exactly。
- file snapshots require positive size and 64-char SHA-256。
- folder snapshots require Google folder MIME and null size/checksum。
- verified move preserves resource ID、MIME、size、checksum、webViewLink and changes parent。
- blocked entry requires non-empty reason and must not claim applied metadata。
- ledger is verified only when all mutated entries are verified。

- [ ] **Step 4: Run GREEN and commit**

```bash
npm run compile:core
node --test tests/card-drive-migration-ledger.test.mjs
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

**Interfaces:**
- Command: `npm run validate:drive-assets`。
- Exit 0 only when all registries and ledgers pass。

- [ ] **Step 1: Write failing package-script test**

```js
import { readFile } from 'node:fs/promises';
const packageJson = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
);
assert.equal(
  packageJson.scripts['validate:drive-assets'],
  'npm run compile:core && node scripts/validate-drive-assets.mjs',
);
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/card-drive-asset-registry.test.mjs
```

- [ ] **Step 3: Implement schemas and deterministic CLI**

Each JSON Schema uses draft 2020-12、`additionalProperties: false`、the exact required fields from Task 1、enum values from constants, and these patterns:

```json
{
  "version": { "type": "string", "pattern": "^[0-9]+\\.[0-9]+$" },
  "sha256": { "type": "string", "pattern": "^[a-f0-9]{64}$" },
  "sourceCommit": { "type": "string", "pattern": "^[a-f0-9]{40}$" }
}
```

CLI reads exactly:

```js
const files = {
  folders: 'data/drive-assets/drive-folders.json',
  assets: 'data/drive-assets/idiom-card-assets.json',
  migrations: 'data/drive-assets/migrations',
};
```

It imports validators from `.core-dist/cards/drive-assets/index.js`，sorts issues by code and identifier, and prints one of:

```text
[drive-assets] PASS folders=<n> assets=<n> migrations=<n>
[drive-assets] FAIL <code> id=<asset-or-resource-id>
```

No new dependency is added；TypeScript validators are executable truth, JSON Schema is interoperability documentation。

Add:

```json
{
  "validate:drive-assets": "npm run compile:core && node scripts/validate-drive-assets.mjs",
  "test:drive-assets": "npm run compile:core && node --test tests/card-drive-*.test.mjs"
}
```

Insert `npm run test:drive-assets` into `npm test` and `npm run validate:drive-assets` into `scripts/verify.sh` after tests。

- [ ] **Step 4: Run GREEN and commit**

```bash
npm run test:drive-assets
npm run validate:drive-assets
./scripts/verify.sh
git add package.json scripts/verify.sh scripts/validate-drive-assets.mjs \
  data/drive-assets/*.schema.json tests/card-drive-*.test.mjs
git commit -m "test: add Drive governance validation gate"
```

---

### Task 6: 建立 Read-only Baseline Inventory

**Files:**
- Create: `data/drive-assets/drive-folders.json`
- Create: `data/drive-assets/idiom-card-assets.json`
- Create: `data/drive-assets/migrations/2026-08-06-phase1-batch0-inventory.json`
- Create: `docs/superpowers/reports/2026-08-06-drive-phase1-baseline-inventory.md`

**Interfaces:**
- Batch 0 performs no Drive mutation；its ledger has `status = verified` and `entries = []`。
- Inventory facts live in Folder／Asset Registries and the report。

- [ ] **Step 1: Add failing known-ID tests**

Require root folders:

```js
assert.equal(byKey.get('project.root').driveFolderId, '1uF6Gzt8RnLkGAk02e_PXhnMcTHQQ72Nw');
assert.equal(byKey.get('project.visuals').driveFolderId, '1cH0KYWGvUT5ci57HW8JBFv3v-8uG51IC');
assert.equal(byKey.get('project.inbox').driveFolderId, '1h_yncfl1MHcZy7IKrP3dGfmNC5lVGfuV');
assert.equal(byKey.get('project.archive').driveFolderId, '1nqvBeExct6jW_1TJ-be_eGZ-wJIK-TJr');
```

Require known assets to appear exactly once:

```text
N frame   1KO7NHfipw-MlFfYLDaakHuupGjtrwYu8
R frame   18AgLp9b1hCrqawfsk5-OxPlmgSt93YGR
SR frame  1cZPhfFv483bJAxk0kCBj6XS4V6Vyfx40
SSR frame 1_PR-_mZXBkf7WJxXwq83AjaOvWpUJwbz
Difficulty badge sheet 1azohQXFHLVP5scplRQuJa33h2pUU8qq4
```

- [ ] **Step 2: Run RED**

```bash
npm run test:drive-assets
```

- [ ] **Step 3: Perform read-only Drive scan**

List and fetch metadata for all direct children under `02_UI_UX_And_Visuals`、`80_Inbox`、`90_Archive`，then recursively inspect:

```text
1zA5wEA4KOKj9G-gpum6f8xe0RgpiyBe_  CICG_Card_Templates_v2.6_Review
1estQ2VP1tbQLI2VNbS3V2FvpDICjbOGO  CICG_Legacy_Card_Assets_Backup
1vAc0oT3CUvbG-5isbOdA5K4lpuOd_-gB  CICG_Card_Templates_v2.1_Approved
1-uFlkMnGlllroZ1UBoBVfFb12A-NpvNP  CICG_Idiom_Cards_Pending_Review_2026-08-06
1HTMdGnQrx9KPdOMOiM30UOIPLRyhb179  Idiom_Cards
```

For every file capture ID、name、parents、MIME、size、webViewLink、createdTime、modifiedTime。Approved records require independently verified checksum and formal GitHub evidence；otherwise retain Review／quarantined status even when filename contains `Approved`。

- [ ] **Step 4: Seed registries and report**

The four rarity frames use PR #32 Registry evidence and existing verified checksums。The difficulty badge sheet is initially `review` unless a formal GitHub registry with checksum and approval evidence is found during the scan；its filename alone cannot promote it。

Report exact counts、orphans、duplicates、unverified checksum、unregistered Approved-folder files and a final `Phase 1 move gate: PASS|BLOCKED`。

- [ ] **Step 5: Run GREEN and commit**

```bash
npm run validate:drive-assets
npm run test:drive-assets
git add data/drive-assets docs/superpowers/reports/2026-08-06-drive-phase1-baseline-inventory.md
git commit -m "docs: record Drive Phase 1 baseline inventory"
```

---

### Task 7: 建立並登錄 Phase 1 Folder Topology

**Files:**
- Modify: `data/drive-assets/drive-folders.json`
- Modify: `docs/superpowers/reports/2026-08-06-drive-phase1-baseline-inventory.md`

- [ ] **Step 1: Confirm the pre-move gate**

```bash
npm run validate:drive-assets
```

Expected: PASS and no Blocking drift affecting the four registered rarity frames。

- [ ] **Step 2: Create parent-before-child folders**

Under `02_UI_UX_And_Visuals/Idiom_Cards` create:

```text
00_Readme_And_Shortcuts
01_Artworks/10_Review
01_Artworks/20_Approved
02_Components/01_Card_Frames/10_Review
02_Components/01_Card_Frames/20_Approved
02_Components/02_Rarity_Badges/10_Review
02_Components/02_Rarity_Badges/20_Approved
02_Components/03_Difficulty_Badges/10_Review
02_Components/03_Difficulty_Badges/20_Approved
02_Components/04_Theme_Badges/10_Review
02_Components/04_Theme_Badges/20_Approved
02_Components/05_Motto_Plaques/10_Review
02_Components/05_Motto_Plaques/20_Approved
02_Components/06_Effect_Overlays/10_Review
02_Components/06_Effect_Overlays/20_Approved
03_Templates/10_Review
03_Templates/20_Approved
04_Composites/10_Review
04_Composites/20_Approved
05_Reference_Only
```

Also create:

```text
80_Inbox/Idiom_Cards
90_Archive/Idiom_Cards/01_Artworks
90_Archive/Idiom_Cards/02_Components
90_Archive/Idiom_Cards/03_Templates
90_Archive/Idiom_Cards/04_Composites
90_Archive/Idiom_Cards/05_Legacy_Flat_Cards
90_Archive/Idiom_Cards/06_Rejected_And_Unverifiable
```

Before every create，list the parent and reuse an exact-name existing folder to prevent duplicates。

- [ ] **Step 3: Verify and register every Folder ID**

Fetch metadata and assert exact name、folder MIME、single intended parent and list-child capability。Write every intermediate and leaf ID into `drive-folders.json`。

- [ ] **Step 4: Run gates and commit**

```bash
npm run validate:drive-assets
npm run test:drive-assets
git add data/drive-assets/drive-folders.json docs/superpowers/reports/2026-08-06-drive-phase1-baseline-inventory.md
git commit -m "docs: register Drive Phase 1 folder topology"
```

---

### Task 8: 搬移四個已納管稀有度外框 Batch 1

**Files:**
- Create: `data/drive-assets/migrations/2026-08-06-phase1-batch1-approved-rarity-frames.json`
- Modify: `data/drive-assets/idiom-card-assets.json`
- Modify: `docs/card-prompts/components/rarity-frame-registry-v1.md`
- Create: `docs/superpowers/reports/2026-08-06-drive-phase1-migration-report.md`

**Interfaces:**
- Drive call: `update_file(fileId, name, addParents, removeParents)`。
- Batch only contains the four rarity frames already registered by PR #32。

- [ ] **Step 1: Write the complete planned Ledger before Drive mutation**

| Asset | File ID | Canonical filename |
|---|---|---|
| N frame | `1KO7NHfipw-MlFfYLDaakHuupGjtrwYu8` | `CICG_Component_RarityFrame_N_v1.0_Approved.png` |
| R frame | `18AgLp9b1hCrqawfsk5-OxPlmgSt93YGR` | `CICG_Component_RarityFrame_R_v1.0_Approved.png` |
| SR frame | `1cZPhfFv483bJAxk0kCBj6XS4V6Vyfx40` | `CICG_Component_RarityFrame_SR_v1.0_Approved.png` |
| SSR frame | `1_PR-_mZXBkf7WJxXwq83AjaOvWpUJwbz` | `CICG_Component_RarityFrame_SSR_v2.8_Approved.png` |

All target parents are `idiom-cards.components.card-frames.approved`。Populate live before、expected after and exact rollback snapshots。

- [ ] **Step 2: Validate planned Ledger**

```bash
npm run validate:drive-assets
```

- [ ] **Step 3: Move sequentially, stop on first mismatch**

For each entry:

1. Refetch metadata immediately before move。
2. Compare every pre-move field with Ledger。
3. On mismatch mark blocked and stop。
4. Move／rename using the same File ID。
5. Refetch metadata。
6. Verify File ID、MIME、size、checksum、webViewLink unchanged and parent/name exact。
7. Mark verified before processing the next entry。

- [ ] **Step 4: Update GitHub registries after live verification**

Update filenames and parent folder keys in JSON and `rarity-frame-registry-v1.md`；preserve component IDs、checksums and approval evidence。

- [ ] **Step 5: Run full gates and commit**

```bash
npm run validate:drive-assets
npm run test:drive-assets
./scripts/verify.sh
git add data/drive-assets docs/card-prompts/components/rarity-frame-registry-v1.md \
  docs/superpowers/reports/2026-08-06-drive-phase1-migration-report.md
git commit -m "docs: record approved rarity frame migration"
```

---

### Task 9: 整理 Review、Inbox 與 Legacy Batch 2

**Files:**
- Create: `data/drive-assets/migrations/2026-08-06-phase1-batch2-review-and-legacy.json`
- Modify: `data/drive-assets/idiom-card-assets.json`
- Modify: `docs/superpowers/reports/2026-08-06-drive-phase1-migration-report.md`

- [ ] **Step 1: Classify only Batch 0 verified resources**

Exact rules:

- v2.6 Review templates → `03_Templates/10_Review`。
- pending review files → `80_Inbox/Idiom_Cards/<original-batch-name>` until individually classified。
- difficulty badge sheet remains `03_Difficulty_Badges/10_Review` unless a formal checksum＋approval registry exists；rename status suffix to `Review` when moved。
- style references／mockups → `05_Reference_Only`。
- flat historical cards → Archive `05_Legacy_Flat_Cards`。
- superseded templates with bidirectional `supersededByAssetId` → Archive `03_Templates/<identity>/<version>`。
- damaged、duplicate、source-unknown、rights-unknown → quarantined in Inbox；only assets with a recorded rejection reason enter `06_Rejected_And_Unverifiable`。

- [ ] **Step 2: Write and validate the complete Ledger**

Every file or folder has exact before／after／rollback metadata。Folder entries use null size/checksum and folder MIME；file entries require size/checksum。

- [ ] **Step 3: Apply sequentially with the Task 8 protocol**

No parallel moves。Folder moves preserve Folder ID and require recursive child recount after move。

- [ ] **Step 4: Add physical-state consistency tests**

Assert:

```text
Approved folder → status approved|published and currentApproved true
Review/Inbox/Archive → currentApproved false
No asset ID appears in two lifecycle folders
No File ID appears twice in Registry
```

- [ ] **Step 5: Run full gates and commit**

```bash
npm run validate:drive-assets
npm run test:drive-assets
./scripts/verify.sh
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

- [ ] **Step 1: Re-scan all governed folders**

Compare live Drive metadata against Registries and report missing files、parent/name mismatch、checksum/size/MIME mismatch、duplicate current Approved、missing evidence、unregistered files in Approved and unverified migrations。

- [ ] **Step 2: Compute exact readiness**

`Phase 2 Ready = true` only when:

```text
Blocking drift = 0
Duplicate current Approved = 0
Unverified applied migrations = 0
Missing rollback snapshots = 0
Unregistered files in Approved = 0
Full repository verify = PASS
```

Otherwise set false and list exact blocking IDs。

- [ ] **Step 3: Update permanent entry points**

AGENTS and spec index point to:

```text
data/drive-assets/drive-folders.json
data/drive-assets/idiom-card-assets.json
data/drive-assets/migrations/
```

Folder IDs must not be copied into multiple documents when Folder Registry is canonical。

- [ ] **Step 4: Run final verification**

```bash
npm install
./scripts/verify.sh
git status --short
git diff --check
```

- [ ] **Step 5: Commit**

```bash
git add AGENTS.md docs/superpowers/specs/README.md docs/superpowers/reports
git commit -m "docs: complete Drive Phase 1 governance audit"
```

---

## PR and Merge Gate

- [ ] Sync with latest `main` and require `behind_by = 0`。
- [ ] Use one implementation PR unless a blocked migration requires a new corrective attempt。
- [ ] Record latest test count、TypeScript strict、ESLint、Vite PWA Build、PWA precache and npm audit。
- [ ] Record every created Folder ID and moved File ID in reports／PR body。
- [ ] Require zero unresolved review threads。
- [ ] ChatGPT Audit compares Registries、Ledgers、live Drive metadata and CI。
- [ ] Squash Merge only after every Gate passes。

## Rollback Protocol

1. Stop the batch immediately。
2. Restore original name and parent with the same File／Folder ID。
3. Refetch and verify original metadata。
4. Mark entry `rolled-back` and batch `blocked`。
5. Commit the failed-attempt Ledger and exact finding；never erase evidence。
6. Open a new validation attempt only after identifying the root cause。

## Out of Scope

- Permanent Drive deletion。
- Sharing／ownership changes。
- Re-encoding or replacing binary bytes。
- Producing new artwork／composites。
- Implementing modular renderer。
- Phase 2 physical migration before readiness passes。
- Any progress schema、collection schema or main gameplay change。
