# Theme Badge System v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將九大主題徽章整理為可重複使用的透明 PNG 母件，完成 Drive Approved、SHA-256、GitHub Registry、CI 驗證與 v2.6 產圖入口註冊。

**Architecture:** 圖像本體以九枚獨立 `1024 × 1280` RGBA PNG 保存於 Drive Approved；GitHub 以通用 Drive Asset Registry 保存檔案證據，另以 `theme-badge-registry.json` 保存九類語意、圖式、底色與 asset 映射。Node／TypeScript 驗證器確保九類完整、唯一、Asset ID 正確、Drive 證據齊全，產圖 Agent 只能透過 Registry 解析徽章。

**Tech Stack:** Node.js 22、TypeScript strict、內建 `node:test`、Python 3＋Pillow（一次性圖像尺寸／alpha 驗證）、Google Drive、Google Sheets、Image Generation／image editing、既有 Vite PWA CI。

## Global Constraints

- v2.5 保留為歷史 Approved 文件，不覆寫、不刪除。
- v2.6 完成 Drive 登錄、CI 與 ChatGPT Audit 後才成為 current standard。
- 九枚母件固定為 `1024 × 1280 px`、PNG、RGBA、透明背景。
- 背景不得保留棕色漸層、矩形陰影、浮水印或卡面內容。
- 同一類別只能有一枚 `currentApproved=true` 母件。
- 正式類別固定為 `military`、`governance`、`strategy`、`arts`、`perseverance`、`selfCultivation`、`relationships`、`cautionary`、`perspective`。
- 卡面只能讀取 Registry 中的 `displayName` 與 `assetId`，不得由模型自由生成。
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
- `data/drive-assets/migrations/2026-08-07-theme-badge-system-v1.json`：Review → Approved 搬移證據。
- `docs/superpowers/reports/2026-08-07-theme-badge-system-v1-delivery.md`：交付與 Audit 證據。

### Modified files

- `data/drive-assets/idiom-card-assets.json`：新增九枚 Approved 母件與一張 reference-only 總覽圖。
- `package.json`：加入 `validate:theme-badges`、`test:theme-badges`。
- `scripts/verify.sh`：加入永久 Gate。
- `AGENTS.md`：產圖前必讀 Registry。
- `.agents/skills/generating-cicg-idiom-cards/SKILL.md`：禁止模型直接生成主題徽章。
- `docs/card-prompts/state/chapter-one-card-catalog-current.json`：登錄 v2.6 徽章系統狀態。
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

Expected: 已命名來源至少包含 `strategy`、`perseverance`、`selfCultivation`、`relationships`、`cautionary`、`perspective`；缺少獨立來源檔的 `military`、`governance`、`arts` 僅依已核准畫面重建，不改變圖式。

- [ ] **Step 2: 使用圖片編輯移除背景**

每枚編輯指令固定為：

```text
保留核准徽章的金色圓形雲紋外框、中央圖式、固定寶石底色與下方繁體中文名稱牌；
移除所有棕色漸層背景與外部陰影矩形；
輸出 RGBA 透明背景 PNG；
不得改變中央圖式、類別名稱、字形內容、底色或裝飾輪廓；
不得增加浮水印、Logo、卡框、稀有度或難易度文字。
```

- [ ] **Step 3: 使用 Pillow 正規化畫布**

將透明結果等比例縮放並置中於 `1024 × 1280` 透明畫布，不裁切徽章外框或名稱牌：

```python
from pathlib import Path
from PIL import Image

TARGET = (1024, 1280)
for source in Path('/mnt/data/theme-badge-edits').glob('*.png'):
    image = Image.open(source).convert('RGBA')
    bbox = image.getbbox()
    if bbox is None:
        raise ValueError(f'empty image: {source.name}')
    subject = image.crop(bbox)
    subject.thumbnail((920, 1160), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', TARGET, (0, 0, 0, 0))
    x = (TARGET[0] - subject.width) // 2
    y = (TARGET[1] - subject.height) // 2
    canvas.alpha_composite(subject, (x, y))
    canvas.save(Path('/mnt/data') / source.name, optimize=True)
```

- [ ] **Step 4: 建立總覽圖**

使用九枚正規化母件建立 `3 × 3` 九宮格，總覽圖只作文件與審核用途，不能被 renderer 裁切使用。

- [ ] **Step 5: 驗證像素、格式與透明度**

Run:

```bash
python - <<'PY'
from pathlib import Path
from PIL import Image

files = sorted(Path('/mnt/data').glob('CICG_Component_ThemeBadge_*_v1.0_Approved.png'))
assert len(files) == 9, f'expected 9 masters, got {len(files)}'
for path in files:
    image = Image.open(path)
    assert image.size == (1024, 1280), (path.name, image.size)
    assert image.mode == 'RGBA', (path.name, image.mode)
    alpha = image.getchannel('A')
    lo, hi = alpha.getextrema()
    assert lo == 0 and hi == 255, (path.name, lo, hi)
    assert alpha.getbbox() is not None, path.name
    print(path.name, image.size, image.mode)
PY
```

Expected: 9 files、`(1024, 1280)`、`RGBA`，alpha 同時包含 0 與 255。

- [ ] **Step 6: 人工視覺核對**

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

任一文字、圖示或底色錯誤，該枚退回重新編輯，不得進 Drive Approved。

---

### Task 2: 建立 Registry 的 RED 測試與型別

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

```ts
export interface ThemeBadgeValidationResult {
  readonly errors: readonly string[];
  readonly summary: {
    readonly badgeCount: number;
    readonly approvedAssetCount: number;
  };
}
```

驗證九類順序與唯一性、中文名稱、圖式定義、色碼、`1024 × 1280`、PNG、透明背景，以及對應 Drive asset 必須是 `theme-badge`、`approved`、`currentApproved=true`、相同尺寸與正確 identity。

- [ ] **Step 5: Add JSON Schema**

Schema 固定九個 `systemValue`、`additionalProperties=false`，並要求全部欄位。

- [ ] **Step 6: Run test to confirm the data dependency failure**

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

### Task 3: Review 上傳、技術驗證與 Approved 搬移

**Files:**
- Upload Review folder ID: `1W9aY_1VBdqQOZrVuAEqOYrLmRWZl7rpD`
- Move to Approved folder ID: `181mpCL3649D0EwZk7c4KWesxV229TZiV`
- Create: `data/drive-assets/migrations/2026-08-07-theme-badge-system-v1.json`

**Interfaces:**
- Consumes: Task 1 的九枚母件與一張總覽圖。
- Produces: 十個穩定 Drive File ID、URL、sizeBytes、SHA-256 與 Review → Approved 證據。

- [ ] **Step 1: Compute local checksums**

```bash
sha256sum /mnt/data/CICG_Component_ThemeBadge_*_v1.0_Approved.png \
  /mnt/data/CICG_ThemeBadgeSystem_v1.0_Approved.png
```

Expected: 十個不同 SHA-256。

- [ ] **Step 2: Upload all ten files to Review**

目的地：

```text
02_UI_UX_And_Visuals/Idiom_Cards/02_Components/04_Theme_Badges/10_Review
Drive folder ID：1W9aY_1VBdqQOZrVuAEqOYrLmRWZl7rpD
```

不建立 ZIP，不覆寫其他元件。

- [ ] **Step 3: Read back Review metadata**

每枚讀取：

```text
id, name, mimeType, size, webViewLink, parents, createdTime, modifiedTime
```

Expected: 名稱逐字一致、`mimeType=image/png`、parent 為 Review folder。

- [ ] **Step 4: Verify uploaded bytes**

下載或串流回讀十個檔案，重新計算 SHA-256；每個值必須與 Step 1 完全一致。

- [ ] **Step 5: Move all ten files to Approved**

使用同一個 Drive File ID，`addParents=181mpCL3649D0EwZk7c4KWesxV229TZiV`，`removeParents=1W9aY_1VBdqQOZrVuAEqOYrLmRWZl7rpD`。搬移後再次讀取 metadata，確認 parent 只有 Approved folder。

- [ ] **Step 6: Record verified migration ledger**

建立 ledger 前執行：

```bash
git rev-parse HEAD
```

將輸出的完整 SHA 寫入 `sourceCommit`。Ledger 固定：

```text
batchId = theme-badge-system-v1-2026-08-07
phase = phase2
status = verified
entries = 10
operation = move-and-rename
entry status = verified
```

每筆 `before` 指向 Review parent，每筆 `after` 指向 Approved parent，並保存實際名稱、MIME、size、SHA 與 URL。

- [ ] **Step 7: Commit ledger**

```bash
git add data/drive-assets/migrations/2026-08-07-theme-badge-system-v1.json
git commit -m "docs: record theme badge Drive evidence"
```

---

### Task 4: 建立 canonical Registry 並轉綠

**Files:**
- Create: `data/cards/theme-badge-registry.json`
- Modify: `data/drive-assets/idiom-card-assets.json`
- Create: `scripts/validate-theme-badges.mjs`
- Modify: `src/cards/theme-badges/index.ts`

**Interfaces:**
- Consumes: Task 3 的十個 Drive metadata 與 checksum。
- Produces: 九類 canonical Registry、十筆 Drive Asset records、CLI 驗證器。

- [ ] **Step 1: Add nine theme-badge Drive records**

固定 identity／assetId：

```text
theme-badge-military-v1.0         → theme-badge-military
theme-badge-governance-v1.0       → theme-badge-governance
theme-badge-strategy-v1.0         → theme-badge-strategy
theme-badge-arts-v1.0             → theme-badge-arts
theme-badge-perseverance-v1.0     → theme-badge-perseverance
theme-badge-self-cultivation-v1.0 → theme-badge-self-cultivation
theme-badge-relationships-v1.0    → theme-badge-relationships
theme-badge-cautionary-v1.0       → theme-badge-cautionary
theme-badge-perspective-v1.0      → theme-badge-perspective
```

每筆從 Task 3 metadata 精確複製 `driveFileId`、`sizeBytes`、`webViewLink`，從 Task 3 checksum 精確複製 `sha256`；固定 `assetType=theme-badge`、`status=approved`、`currentApproved=true`、`parentFolderKey=idiom-cards.components.theme-badges.approved`、`widthPx=1024`、`heightPx=1280`。

- [ ] **Step 2: Add overview reference record**

```text
assetId = theme-badge-system-overview-v1.0
assetType = reference-only
identity = theme-badge-system-overview
status = approved
currentApproved = false
filename = CICG_ThemeBadgeSystem_v1.0_Approved.png
```

其 Drive 證據同樣使用 Task 3 的實際值。

- [ ] **Step 3: Create canonical theme registry**

依固定順序寫入九筆：

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

其餘八筆使用 v2.6 規格中的正式值，不得從圖片內容 OCR 推導。

- [ ] **Step 4: Implement CLI**

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

- [ ] **Step 5: Run focused tests**

```bash
npm run compile:core
node --test tests/theme-badge-registry.test.mjs
node scripts/validate-theme-badges.mjs
npm run validate:drive-assets
```

Expected:

```text
theme badge tests passed
[theme-badges] PASS badges=9 approved=9
Drive asset count equals the pre-change count plus 10
```

- [ ] **Step 6: Commit**

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
- Modify: `docs/card-prompts/state/chapter-one-card-catalog-current.json`

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

產圖前必讀順序：

```text
data/cards/theme-badge-registry.json
→ data/drive-assets/idiom-card-assets.json
→ docs/superpowers/specs/2026-08-07-idiom-card-standard-v2-6-design.md
```

硬性規則：

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

加入：

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

```bash
npm run test:theme-badges
npm run validate:theme-badges
./scripts/verify.sh
```

Expected: 所有既有測試、TypeScript strict、ESLint、PWA build、npm audit 與新 Gate 全部通過。

- [ ] **Step 7: Commit**

```bash
git add package.json scripts/verify.sh AGENTS.md .agents/skills/generating-cicg-idiom-cards/SKILL.md docs/card-prompts/state/chapter-one-card-catalog-current.json
git commit -m "feat: enforce v2.6 theme badge workflow"
```

---

### Task 6: 同步 Google Sheet 管理控制中心

**Files:**
- Update: Google Sheet `1JwdPPz4cjx94MYE5qXJt2GaE67e9HUlzXPY4OPb6S94`

**Interfaces:**
- Consumes: canonical Registry 與十個 Drive records。
- Produces: 人工可管理的九大徽章表與版本歷史。

- [ ] **Step 1: Add `Theme_Badge_Registry` worksheet**

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

逐筆登錄九枚 Approved 母件與一張總覽圖；總覽圖使用 `reference-only`，`currentApproved=false`。

- [ ] **Step 4: Update Version_History**

記錄 v2.6 written spec、九枚母件、Drive IDs／checksums、GitHub PR 與 merge SHA。

- [ ] **Step 5: Read back and verify**

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

- [ ] **Step 1: Create isolated implementation branch**

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git checkout -b feat/theme-badge-system-v1
```

- [ ] **Step 2: Execute Tasks 1–6 with TDD commits**

每個 Task 依本計畫自己的 RED／GREEN／commit 步驟執行，不把所有變更壓成一個未驗證 commit。

- [ ] **Step 3: Synchronize latest main before PR completion**

```bash
git fetch origin
git rebase origin/main
```

Expected: 無衝突；PR `behind_by = 0`。

- [ ] **Step 4: Open one implementation PR**

Title:

```text
feat: 註冊 v2.6 九大主題徽章系統
```

PR body 記錄十個 Drive File ID、SHA-256、Sheet 範圍與實際驗證結果。

- [ ] **Step 5: Wait for GitHub Actions**

不得沿用舊測試數字。記錄最新 Node tests、theme badge tests、Drive validator、TypeScript、ESLint、Vite PWA build、npm audit。

- [ ] **Step 6: ChatGPT Audit**

```text
9 independent transparent PNG masters
9 unique system values
9 unique Approved Drive theme-badge assets
1 Approved reference-only overview
10 checksum matches
1 current Approved asset per category
no background rectangles
no generated badge substitution in skill docs
Google Sheet matches GitHub registry
behind_by = 0
unresolved review threads = 0
```

- [ ] **Step 7: Write delivery report**

報告包含實際 CI 數字、PR、merge SHA、Drive 路徑與 `readyForCatalogMigration=true`。

- [ ] **Step 8: Squash merge and verify main**

僅在完整 CI、Audit 與 Sheet 回讀全部通過後 Squash Merge；再確認 `main` 的 Registry 與 Actions conclusion=`success`。

---

## Follow-on Plan Boundary

本計畫合併後，再建立並執行：

```text
docs/superpowers/plans/2026-08-07-card-catalog-theme-migration-v2-6.md
```

後續計畫負責：

1. 第一章 61 張卡重新判定九大 `themeCategory`。
2. `categoryPrimary／categorySecondary` 遷移為 `themeCategory／secondaryThemeTags`。
3. Card Catalog 與 Google Sheet 更新。
4. 產圖 composer 套用 Approved 徽章。
5. 重製第一批 10 張 Review 圖卡。

在 Theme Badge System v1 未合併 `main` 前，不得開始第一批重製。