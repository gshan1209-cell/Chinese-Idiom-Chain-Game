# Theme Badge System v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將九大主題徽章整理為可重複使用的透明 PNG 母件，完成 Drive Approved、SHA-256、GitHub Registry、CI 驗證與 v2.6 產圖入口註冊。

**Architecture:** 圖像本體以九枚獨立 `1024 × 1280` RGBA PNG 保存於 Drive Approved；GitHub 以通用 Drive Asset Registry 保存檔案證據，另以 `theme-badge-registry.json` 保存九類語意、圖式、底色與 asset 映射。Node／TypeScript 驗證器確保九類完整、唯一、Asset ID 正確、Drive 證據齊全，產圖 Agent 只能透過 Registry 解析徽章。

**Tech Stack:** Node.js 22、TypeScript strict、內建 `node:test`、Google Drive、Google Sheets、Image Generation／image editing、既有 Vite PWA CI。

## Global Constraints

- v2.5 保留為歷史 Approved 文件，不覆寫、不刪除。
- v2.6 完成 Drive 登錄、CI 與 ChatGPT Audit 後才成為 current standard。
- 九枚母件固定為 `1024 × 1280 px`、PNG、RGBA、透明背景。
- 背景不得保留棕色漸層、矩形陰影、浮水印或卡面內容。
- 同一類別只能有一枚 `currentApproved=true` 母件。
- 正式類別固定為 `military`、`governance`、`strategy`、`arts`、`perseverance`、`selfCultivation`、`relationships`、`cautionary`、`perspective`。
- 卡面只能讀取 Registry 中的 `themeCategoryLabel` 與 `themeBadgeAssetId`，不得由模型自由生成。
- 九枚徽章與稀有度、難易度、角色性別互相獨立。
- 本計畫不遷移第一章 61 張分類、不重製第一批圖卡；這兩項由後續獨立計畫處理。

---

## File Structure

### New files

- `data/cards/theme-badge-registry.json`：九大主題的 canonical 語意與 Asset 映射。
- `data/cards/theme-badge-registry.schema.json`：資料格式契約。
- `src/cards/theme-badges/theme-badge-types.ts`：TypeScript 型別與固定枚舉。
- `src/cards/theme-badges/validate-theme-badge-registry.ts`：純 TypeScript 驗證器。
- `src/cards/theme-badges/index.ts`：公開匯出入口。
- `scripts/validate-theme-badges.mjs`：CI CLI。
- `tests/theme-badge-registry.test.mjs`：永久 Gate 測試。
- `data/drive-assets/migrations/2026-08-07-theme-badge-system-v1.json`：Drive 搬移／核准證據。
- `docs/superpowers/reports/2026-08-07-theme-badge-system-v1-delivery.md`：交付與 Audit 證據。

### Modified files

- `data/drive-assets/idiom-card-assets.json`：新增九枚 Approved 母件與總覽圖。
- `package.json`：加入 `validate:theme-badges`、`test:theme-badges`。
- `scripts/verify.sh`：加入永久 Gate。
- `AGENTS.md`：產圖前必讀 Registry。
- `.agents/skills/generating-cicg-idiom-cards/SKILL.md`：禁止模型直接生成主題徽章。
- `docs/card-prompts/state/current-batch.json` 或目前等效狀態檔：登錄 v2.6 徽章系統狀態。
- Google Sheet `CICG_素材管理控制中心_v1.0`：新增九枚 Asset Register、Codebook 與版本紀錄。

---

### Task 1: 整理九枚透明 PNG 母件

**Files:**
- Produce: `/mnt/data/CICG_Component_ThemeBadge_Military_v1.0_Approved.png`
- Produce: `/mnt/data/CICG_Component_ThemeBadge_Governance_v1.0_Approved.png`
- Produce: `/mnt/data/CICG_Component_ThemeBadge_Strategy_v1.0_Approved.png`
- Produce: `/mnt/data/CICG_Component_ThemeBadge_Arts_v1.0_Approved.png`
- Produce: `/mnt/data/CICG_Component_ThemeBadge_Perseverance_v1.0_Approved.png`
- Produce: `/mnt/data/CICG_Component_ThemeBadge_SelfCultivation_v1.0_Approved.png`
- Produce: `/mnt/data/CICG_Component_ThemeBadge_Relationships_v1.0_Approved.png`
- Produce: `/mnt/data/CICG_Component_ThemeBadge_Cautionary_v1.0_Approved.png`
- Produce: `/mnt/data/CICG_Component_ThemeBadge_Perspective_v1.0_Approved.png`
- Produce: `/mnt/data/CICG_ThemeBadgeSystem_v1.0_Approved.png`

**Interfaces:**
- Consumes: 使用者已視覺核准的九枚徽章稿與 v2.6 規格。
- Produces: 九枚可直接套版的透明 PNG 與一張審核總覽圖。

- [ ] **Step 1: 盤點可用來源檔**

Run:

```bash
find /mnt/data -maxdepth 1 -type f -name '*.png' -printf '%f\t%s\n' | sort
```

Expected: 找到已命名的 `strategy`、`perseverance`、`selfCultivation`、`relationships`、`cautionary`、`perspective` 來源；若 `military`、`governance`、`arts` 只剩聊天內展示而沒有獨立檔案，僅重建缺少的三枚，不重新設計已核准圖式。

- [ ] **Step 2: 使用圖片編輯產出透明母件**

每枚編輯指令必須包含：

```text
保留核准徽章的金色圓形雲紋外框、中央圖式、固定寶石底色與下方繁體中文名稱牌；
移除所有棕色漸層背景與外部陰影矩形；
輸出完整不裁切的 1024×1280 RGBA 透明背景 PNG；
不得改變中央圖式、類別名稱、字形內容、底色或裝飾輪廓；
不得增加浮水印、Logo、卡框、稀有度或難易度文字。
```

Expected: 九枚母件皆為透明背景、圖式完整、文字正確。

- [ ] **Step 3: 建立總覽圖**

建立 `3 × 3` 九宮格總覽，每格只放一枚母件及其系統值／中文名稱；總覽圖只作文件與審核用途，不能被 renderer 裁切使用。

- [ ] **Step 4: 驗證像素、格式與透明度**

Run:

```bash
python - <<'PY'
from pathlib import Path
from PIL import Image

root = Path('/mnt/data')
files = sorted(root.glob('CICG_Component_ThemeBadge_*_v1.0_Approved.png'))
assert len(files) == 9, f'expected 9 masters, got {len(files)}'
for path in files:
    image = Image.open(path)
    assert image.size == (1024, 1280), (path.name, image.size)
    assert image.mode == 'RGBA', (path.name, image.mode)
    alpha = image.getchannel('A')
    lo, hi = alpha.getextrema()
    assert lo == 0 and hi == 255, (path.name, lo, hi)
    print(path.name, image.size, image.mode, alpha.getbbox())
PY
```

Expected: 9 files、`(1024, 1280)`、`RGBA`、alpha 同時包含 0 與 255。

- [ ] **Step 5: 人工視覺核對**

逐枚核對：

```text
軍事：劍與軍旗／#8E1E24／軍事
內政：玉璽與卷軸／#176B52／內政
智謀：羽扇與棋盤／#5A338A／智謀
文藝：毛筆與畫卷／#167A83／文藝
勵志：山路與旭日／#C77B1F／勵志
修身：蓮花與竹簡／#B95B79／修身
人際：相握之手／#9A5B22／人際
警世：警鐘與眼睛／#3F2B78／警世
見識：眼睛與遠山窗口／#1D5F9E／見識
```

Expected: 九枚均符合；任一文字、圖示或底色錯誤，該枚退回重新編輯，不得上傳 Approved。

---

### Task 2: 建立 Theme Badge Registry 的失敗測試與型別

**Files:**
- Create: `src/cards/theme-badges/theme-badge-types.ts`
- Create: `src/cards/theme-badges/validate-theme-badge-registry.ts`
- Create: `src/cards/theme-badges/index.ts`
- Create: `tests/theme-badge-registry.test.mjs`
- Create: `data/cards/theme-badge-registry.schema.json`

**Interfaces:**
- Consumes: `DriveAssetRegistry`、九大固定枚舉。
- Produces: `THEME_CATEGORIES`、`ThemeBadgeRecord`、`ThemeBadgeRegistry`、`validateThemeBadgeRegistry(registry, driveAssets)`。

- [ ] **Step 1: Write the failing test**

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  THEME_CATEGORIES,
  validateThemeBadgeRegistry,
} from '../.test-dist/src/cards/theme-badges/index.js';

const themeRegistry = JSON.parse(
  readFileSync(new URL('../data/cards/theme-badge-registry.json', import.meta.url), 'utf8'),
);
const driveAssets = JSON.parse(
  readFileSync(new URL('../data/drive-assets/idiom-card-assets.json', import.meta.url), 'utf8'),
);

test('theme badge registry contains exactly the nine approved categories', () => {
  const result = validateThemeBadgeRegistry(themeRegistry, driveAssets);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(
    themeRegistry.badges.map((badge) => badge.systemValue),
    [...THEME_CATEGORIES],
  );
});

test('rejects mismatched asset identity and category', () => {
  const invalid = JSON.parse(JSON.stringify(themeRegistry));
  invalid.badges[0].assetId = invalid.badges[1].assetId;
  const result = validateThemeBadgeRegistry(invalid, driveAssets);
  assert.ok(result.errors.some((error) => error.includes('assetId')));
});

test('rejects non-transparent or wrong-size masters', () => {
  const invalid = JSON.parse(JSON.stringify(themeRegistry));
  invalid.badges[0].pixelWidth = 900;
  invalid.badges[0].transparentBackground = false;
  const result = validateThemeBadgeRegistry(invalid, driveAssets);
  assert.ok(result.errors.some((error) => error.includes('1024')));
  assert.ok(result.errors.some((error) => error.includes('transparentBackground')));
});
```

- [ ] **Step 2: Run test to verify RED**

Run:

```bash
npm run compile:core
node --test tests/theme-badge-registry.test.mjs
```

Expected: FAIL，因 `src/cards/theme-badges` 與 registry 尚不存在。

- [ ] **Step 3: Implement fixed enums and types**

```ts
export const THEME_CATEGORIES = [
  'military',
  'governance',
  'strategy',
  'arts',
  'perseverance',
  'selfCultivation',
  'relationships',
  'cautionary',
  'perspective',
] as const;

export type ThemeCategory = (typeof THEME_CATEGORIES)[number];

export interface ThemeBadgeRecord {
  readonly systemValue: ThemeCategory;
  readonly displayName: string;
  readonly assetId: string;
  readonly iconDefinition: string;
  readonly backgroundHex: string;
  readonly version: '1.0';
  readonly pixelWidth: 1024;
  readonly pixelHeight: 1280;
  readonly mimeType: 'image/png';
  readonly transparentBackground: true;
}

export interface ThemeBadgeRegistry {
  readonly schemaVersion: 1;
  readonly updatedAt: string;
  readonly badges: readonly ThemeBadgeRecord[];
}
```

- [ ] **Step 4: Implement pure validator**

`validateThemeBadgeRegistry` 回傳：

```ts
export interface ThemeBadgeValidationResult {
  readonly errors: readonly string[];
  readonly summary: {
    readonly badgeCount: number;
    readonly approvedAssetCount: number;
  };
}
```

驗證：九類順序與唯一性、中文名稱、圖示定義、色碼、`1024 × 1280`、PNG、透明背景，以及對應 Drive asset 必須是 `theme-badge`、`approved`、`currentApproved=true`、相同尺寸與 Asset ID。

- [ ] **Step 5: Add JSON Schema**

Schema 固定九個 `systemValue`、`additionalProperties=false`，並要求上述全部欄位。

- [ ] **Step 6: Run test to confirm expected data dependency failure**

Run:

```bash
npm run compile:core
node --test tests/theme-badge-registry.test.mjs
```

Expected: 仍 FAIL，但原因改為 registry／Drive assets 尚未登錄，而不是 module missing。

- [ ] **Step 7: Commit**

```bash
git add src/cards/theme-badges tests/theme-badge-registry.test.mjs data/cards/theme-badge-registry.schema.json
git commit -m "test: define theme badge registry gates"
```

---

### Task 3: 上傳九枚母件至 Drive Approved

**Files:**
- Upload to Drive folder ID: `181mpCL3649D0EwZk7c4KWesxV229TZiV`
- Create: `data/drive-assets/migrations/2026-08-07-theme-badge-system-v1.json`

**Interfaces:**
- Consumes: Task 1 九枚透明 PNG。
- Produces: 九個穩定 Drive File ID、URL、sizeBytes、SHA-256。

- [ ] **Step 1: Compute local checksums before upload**

Run:

```bash
sha256sum /mnt/data/CICG_Component_ThemeBadge_*_v1.0_Approved.png
```

Expected: 九個不同 SHA-256。

- [ ] **Step 2: Upload all nine files**

目的地：

```text
02_UI_UX_And_Visuals/Idiom_Cards/02_Components/04_Theme_Badges/20_Approved
Drive folder ID：181mpCL3649D0EwZk7c4KWesxV229TZiV
```

使用原檔名逐一上傳，不建立 ZIP，不覆寫其他元件。

- [ ] **Step 3: Read back Drive metadata**

每枚讀取：

```text
id, name, mimeType, size, webViewLink, parents, createdTime, modifiedTime
```

Expected: 名稱逐字一致、`mimeType=image/png`、parent 為 Approved folder。

- [ ] **Step 4: Download/read back and verify checksum**

Drive 回讀檔案的 SHA-256 必須與 Step 1 本地值完全一致；不一致時刪除錯誤上傳並重新上傳，不得將不同 bytes 登錄成同一 master。

- [ ] **Step 5: Record migration ledger**

Ledger 固定：

```json
{
  "schemaVersion": 1,
  "batchId": "theme-badge-system-v1-2026-08-07",
  "phase": "phase2",
  "createdAt": "2026-08-07T00:00:00+08:00",
  "sourceCommit": "<implementation-branch-head-sha>",
  "status": "verified",
  "entries": []
}
```

九個 entries 皆為 `resourceKind=file`、`operation=move-and-rename` 或實際採用的上傳治理操作、`status=verified`，`after` 保存 parent、MIME、size、SHA 與 URL。

- [ ] **Step 6: Commit ledger after IDs are known**

```bash
git add data/drive-assets/migrations/2026-08-07-theme-badge-system-v1.json
git commit -m "docs: record theme badge Drive evidence"
```

---

### Task 4: 建立 canonical Registry 並使測試轉綠

**Files:**
- Create: `data/cards/theme-badge-registry.json`
- Modify: `data/drive-assets/idiom-card-assets.json`
- Create: `scripts/validate-theme-badges.mjs`
- Modify: `src/cards/theme-badges/index.ts`

**Interfaces:**
- Consumes: Task 3 的 Drive metadata 與 checksum。
- Produces: 九類 canonical Registry、CLI 驗證器。

- [ ] **Step 1: Add nine Drive Asset records**

每筆固定：

```json
{
  "assetId": "theme-badge-military-v1.0",
  "assetType": "theme-badge",
  "identity": "theme-badge-military",
  "version": "1.0",
  "status": "approved",
  "currentApproved": true,
  "filename": "CICG_Component_ThemeBadge_Military_v1.0_Approved.png",
  "driveFileId": "<actual-file-id>",
  "parentFolderKey": "idiom-cards.components.theme-badges.approved",
  "mimeType": "image/png",
  "sizeBytes": 1,
  "sha256": "<actual-sha256>",
  "widthPx": 1024,
  "heightPx": 1280,
  "webViewLink": "<actual-drive-url>",
  "supersedesAssetId": null,
  "supersededByAssetId": null,
  "approvalEvidenceIds": ["user-approved-v2.6", "theme-badge-system-v1-pr"],
  "licenseEvidenceId": null
}
```

其餘八筆依正式檔名／identity 建立。`sizeBytes` 必須填實際值，不得保留示例數字 `1`。

- [ ] **Step 2: Create canonical theme registry**

```json
{
  "schemaVersion": 1,
  "updatedAt": "2026-08-07T00:00:00+08:00",
  "badges": [
    {
      "systemValue": "military",
      "displayName": "軍事",
      "assetId": "theme-badge-military-v1.0",
      "iconDefinition": "劍與軍旗",
      "backgroundHex": "#8E1E24",
      "version": "1.0",
      "pixelWidth": 1024,
      "pixelHeight": 1280,
      "mimeType": "image/png",
      "transparentBackground": true
    }
  ]
}
```

依固定九類順序補齊其餘八筆。

- [ ] **Step 3: Implement CLI**

```js
import { readFileSync } from 'node:fs';
import { validateThemeBadgeRegistry } from '../.test-dist/src/cards/theme-badges/index.js';

const themeRegistry = JSON.parse(readFileSync('data/cards/theme-badge-registry.json', 'utf8'));
const driveAssets = JSON.parse(readFileSync('data/drive-assets/idiom-card-assets.json', 'utf8'));
const result = validateThemeBadgeRegistry(themeRegistry, driveAssets);

if (result.errors.length > 0) {
  for (const error of result.errors) console.error(`[theme-badges] FAIL ${error}`);
  process.exitCode = 1;
} else {
  console.log(`[theme-badges] PASS badges=${result.summary.badgeCount} approved=${result.summary.approvedAssetCount}`);
}
```

- [ ] **Step 4: Run focused tests**

Run:

```bash
npm run compile:core
node --test tests/theme-badge-registry.test.mjs
node scripts/validate-theme-badges.mjs
npm run validate:drive-assets
```

Expected:

```text
3+ theme badge tests passed
[theme-badges] PASS badges=9 approved=9
[drive-assets] PASS ... assets=<previous+9>
```

- [ ] **Step 5: Commit**

```bash
git add data/cards/theme-badge-registry.json data/drive-assets/idiom-card-assets.json scripts/validate-theme-badges.mjs src/cards/theme-badges
git commit -m "feat: register nine approved theme badges"
```

---

### Task 5: 接入永久 CI 與 Agent 入口

**Files:**
- Modify: `package.json`
- Modify: `scripts/verify.sh`
- Modify: `AGENTS.md`
- Modify: `.agents/skills/generating-cicg-idiom-cards/SKILL.md`
- Modify: `docs/card-prompts/state/current-batch.json` or the active equivalent state file

**Interfaces:**
- Consumes: `validate-theme-badges.mjs`。
- Produces: 每次 PR 都執行的永久 Gate，並讓其他聊天讀到同一標準。

- [ ] **Step 1: Add package scripts**

```json
{
  "scripts": {
    "validate:theme-badges": "npm run compile:core && node scripts/validate-theme-badges.mjs",
    "test:theme-badges": "npm run compile:core && node --test tests/theme-badge-registry.test.mjs"
  }
}
```

將 `test:theme-badges` 加入總 `npm test`。

- [ ] **Step 2: Add verify gate**

在 `scripts/verify.sh` 的資料／元件驗證區加入：

```bash
npm run validate:theme-badges
```

- [ ] **Step 3: Update AGENTS.md**

加入必讀順序：

```text
data/cards/theme-badge-registry.json
→ data/drive-assets/idiom-card-assets.json
→ v2.6 standard
```

以及硬性規則：

```text
主題徽章不得由圖片模型生成；只能套用 Registry 的 current Approved PNG。
secondaryThemeTags 不得顯示在卡面。
```

- [ ] **Step 4: Update image-generation skill**

明確分離：

```text
image generation：只生成無文字中央插畫
composition：套用外框、難易度、主題徽章與文字
```

- [ ] **Step 5: Update current state**

狀態需呈現：

```json
{
  "themeBadgeSystem": {
    "version": "1.0",
    "standardVersion": "2.6",
    "approvedBadgeCount": 9,
    "registryPath": "data/cards/theme-badge-registry.json",
    "readyForCatalogMigration": true
  }
}
```

- [ ] **Step 6: Run focused and full verification**

Run:

```bash
npm run test:theme-badges
npm run validate:theme-badges
./scripts/verify.sh
```

Expected: 所有既有測試、TypeScript strict、ESLint、PWA build、npm audit 與新 Gate 全部通過。

- [ ] **Step 7: Commit**

```bash
git add package.json scripts/verify.sh AGENTS.md .agents/skills/generating-cicg-idiom-cards/SKILL.md docs/card-prompts/state
git commit -m "feat: enforce v2.6 theme badge workflow"
```

---

### Task 6: 同步 Google Sheet 管理控制中心

**Files:**
- Update: Google Sheet `1JwdPPz4cjx94MYE5qXJt2GaE67e9HUlzXPY4OPb6S94`

**Interfaces:**
- Consumes: canonical Registry 與九個 Drive records。
- Produces: 人工可管理的九大徽章表與版本歷史。

- [ ] **Step 1: Add or update Theme_Badge_Registry worksheet**

欄位固定：

```text
system_value
display_name
asset_id
icon_definition
background_hex
version
approval_status
current_approved
drive_file_id
drive_url
sha256
pixel_width
pixel_height
mime_type
transparent_background
verified_at
notes
```

寫入九筆，不用公式推導 Asset ID 或色碼。

- [ ] **Step 2: Update Codebook_Agent**

登錄九個枚舉、正式中文名稱、禁止自由文字規則，以及 `secondaryThemeTags` 不進卡面。

- [ ] **Step 3: Update Asset_Register**

逐筆登錄九枚 Approved 母件與一張總覽圖；總覽圖 asset type 應為 `reference-only`，不得 `currentApproved` 成為卡面元件。

- [ ] **Step 4: Update Version_History**

新增：

```text
standard v2.6 written spec
nine theme badge masters approved
Drive IDs and checksums registered
GitHub PR / merge SHA
```

- [ ] **Step 5: Read back and verify**

Expected:

```text
Theme_Badge_Registry rows = 9
current_approved = TRUE for all 9
unique asset_id = 9
unique system_value = 9
transparent_background = TRUE for all 9
```

---

### Task 7: PR、CI、ChatGPT Audit 與 Squash Merge

**Files:**
- Create: `docs/superpowers/reports/2026-08-07-theme-badge-system-v1-delivery.md`

**Interfaces:**
- Consumes: Tasks 1–6 的所有證據。
- Produces: 合併至 `main` 的 current v2.6 Theme Badge System。

- [ ] **Step 1: Synchronize branch with latest main**

Run:

```bash
git fetch origin
git checkout <implementation-branch>
git rebase origin/main
```

Expected: 無衝突；PR `behind_by = 0`。

- [ ] **Step 2: Open one implementation PR**

Title:

```text
feat: 註冊 v2.6 九大主題徽章系統
```

PR body 記錄九個 Drive File ID、SHA-256、Sheet 範圍與實際驗證結果。

- [ ] **Step 3: Wait for GitHub Actions**

不得沿用舊測試數字。記錄最新：Node tests、theme badge tests、Drive validator、TypeScript、ESLint、Vite PWA build、npm audit。

- [ ] **Step 4: ChatGPT Audit**

Audit 必須核對：

```text
9 independent transparent PNG masters
9 unique system values
9 unique Approved Drive assets
9 checksum matches
1 current Approved asset per category
no background rectangles
no generated badge substitution in skill docs
Google Sheet matches GitHub registry
behind_by = 0
unresolved review threads = 0
```

- [ ] **Step 5: Write delivery report**

報告包含實際 CI 數字、PR、merge SHA、Drive 路徑與 `readyForCatalogMigration=true`。

- [ ] **Step 6: Squash merge**

僅在完整 CI、Audit 與 Sheet 回讀全部通過後執行 Squash Merge。

- [ ] **Step 7: Verify main**

確認 `main` 最新 commit 是合併 SHA，並再次讀取 `theme-badge-registry.json` 與 GitHub Actions conclusion=`success`。

---

## Follow-on Plan Boundary

本計畫合併後，再建立並執行獨立計畫：

```text
docs/superpowers/plans/2026-08-07-card-catalog-theme-migration-v2-6.md
```

該計畫負責：

1. 第一章 61 張卡重新判定九大 `themeCategory`。
2. `categoryPrimary／categorySecondary` 遷移為 `themeCategory／secondaryThemeTags`。
3. Card Catalog 與 Google Sheet 更新。
4. 產圖 composer 套用 Approved 徽章。
5. 重製第一批 10 張 Review 圖卡。

在 Theme Badge System v1 未合併 `main` 前，不得開始第一批重製。