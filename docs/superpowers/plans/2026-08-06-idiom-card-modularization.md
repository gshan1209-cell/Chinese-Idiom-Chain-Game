# 成語圖卡元件化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立資料驅動、可替換元件、同時支援 PWA 顯示與固定 PNG 輸出的成語圖卡渲染架構，使難易度、稀有度徽章與文字改版不需要重畫中央主插圖。

**Architecture:** 使用純 TypeScript 建立卡片資料、元件註冊表、v2.6 固定座標與 immutable render plan；React 只負責把 render plan 畫成 SVG。PNG 輸出由同一 SVG 轉成 1024 × 2000 Canvas，舊卡透過 `flat-legacy` fallback 顯示。

**Tech Stack:** TypeScript 6、React 19、SVG、Canvas、Node.js built-in test runner、Vite PWA；第一階段不新增第三方 runtime dependency。

## Global Constraints

- 正式畫布固定 `1024 × 2000 px`。
- Header `360 px`、Artwork `1200 px`、Footer `440 px`。
- 主標下方第一列為四組注音，第二列為小寫帶聲調漢語拼音。
- SSR 新卡使用 v2.7 傳奇級虹彩金龍徽章；N／R／SR 不得使用。
- 稀有度與難易度分離；徽章視覺不能反向決定語義稀有度。
- 新卡預設 `renderMode: 'modular'`；舊平面圖使用 `flat-legacy`。
- React 不得承載稀有度、授權、來源或卡池規則。
- Drive master 是視覺核准來源；Repository runtime derivative 必須可追溯。
- 所有功能與 Bug 修正依 TDD：RED → 最小 GREEN → 完整回歸。
- 不修改既有 `cicg-progress` IndexedDB Schema。

---

## File Structure

```text
src/cards/
├─ domain/
│  ├─ card-types.ts
│  ├─ card-definition.ts
│  ├─ card-assets.ts
│  └─ component-registry.ts
├─ layout/
│  ├─ card-layout-v2_6.ts
│  └─ resolve-card-components.ts
├─ render/
│  ├─ card-render-plan.ts
│  └─ build-card-render-plan.ts
└─ validation/
   └─ validate-card-definition.ts

src/app/cards/
├─ IdiomCardCanvas.tsx
├─ IdiomCardView.tsx
├─ components/
│  ├─ RarityBadge.tsx
│  ├─ DifficultyBadge.tsx
│  ├─ ThemeBadge.tsx
│  ├─ TitleAndPronunciation.tsx
│  ├─ AllusionPanel.tsx
│  ├─ MottoPlaque.tsx
│  └─ SourceLine.tsx
└─ exportCardPng.ts

public/cards/
├─ artworks/
└─ components/

data/cards/
├─ idiom-card-catalog.json
├─ card-component-registry.json
└─ card-assets.schema.json

scripts/
├─ validate-card-assets.mjs
└─ verify-card-assets.test.mjs

tests/
├─ card-definition.test.mjs
├─ card-layout.test.mjs
├─ card-render-plan.test.mjs
├─ card-validation.test.mjs
└─ card-legacy-fallback.test.mjs
```

---

### Task 1: 建立純 TypeScript 卡片資料模型

**Files:**
- Create: `src/cards/domain/card-types.ts`
- Create: `src/cards/domain/card-assets.ts`
- Create: `src/cards/domain/card-definition.ts`
- Create: `src/cards/domain/component-registry.ts`
- Modify: `tsconfig.core.json`
- Modify: `package.json`
- Test: `tests/card-definition.test.mjs`

**Interfaces:**
- Produces: `CardRarity`, `IdiomDifficulty`, `CardRenderMode`, `CardAssetReference`, `IdiomCardDefinition`, `CardComponentRegistry`
- Consumed by: Tasks 2–7

- [ ] **Step 1: Write failing model tests**

Create `tests/card-definition.test.mjs` that imports compiled modules from `.test-dist/src/cards/domain/` and asserts:

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { createCardDefinition } from '../.test-dist/src/cards/domain/card-definition.js';

test('keeps artwork and component versions independent', () => {
  const card = createCardDefinition({
    cardId: 'idiom-yu-gong-yi-shan',
    idiomId: 'yu-gong-yi-shan',
    title: '愚公移山',
    bopomofo: ['ㄩˊ', 'ㄍㄨㄥ', 'ㄧˊ', 'ㄕㄢ'],
    pinyin: ['yú', 'gōng', 'yí', 'shān'],
    subtitle: '憑堅定意志克服長久困難。',
    rarity: 'SSR',
    difficulty: 'B',
    themeId: 'inspiration',
    allusionSummary: '愚公決心移走阻路高山。',
    allusionSource: '戰國・列禦寇《列子・湯問》',
    mottoLines: ['信念不移，', '萬難可破，', '終見天開。'],
    renderMode: 'modular',
    layoutVersion: '2.6',
    componentSetVersion: '1.0',
    artworkRef: {
      assetId: 'artwork-yu-gong-yi-shan',
      version: '1.0',
      sourceDriveFileId: 'drive-artwork-id',
      sourceSha256: 'a'.repeat(64),
      runtimePath: '/cards/artworks/yu-gong-yi-shan.webp',
      width: 1024,
      height: 1200,
      mimeType: 'image/webp',
      status: 'approved'
    },
    frameSkinId: 'frame-v2.6',
    rarityBadgeId: 'rarity-ssr-v2.7',
    difficultyBadgeId: 'difficulty-v1',
    themeBadgeId: 'theme-inspiration-v1',
    mottoPlaqueId: 'motto-v1',
    effectOverlayId: null,
    flatLegacyRef: null
  });

  assert.equal(card.artworkRef.version, '1.0');
  assert.equal(card.rarityBadgeId, 'rarity-ssr-v2.7');
});
```

- [ ] **Step 2: Run test and verify RED**

Run:

```bash
npm run compile:core
node --test tests/card-definition.test.mjs
```

Expected: FAIL because `src/cards/domain/card-definition.ts` does not exist.

- [ ] **Step 3: Add `src/cards` to core compilation**

Update `tsconfig.core.json` include list:

```json
"src/cards/**/*.ts"
```

Add to `package.json`:

```json
"test:cards": "npm run compile:core && node --test tests/card-*.test.mjs"
```

Append `npm run test:cards` to the aggregate `test` script.

- [ ] **Step 4: Implement minimal strict types and factory**

Implement readonly types exactly as defined in the modularization spec. `createCardDefinition()` returns a frozen shallow copy and does not infer rarity or difficulty.

- [ ] **Step 5: Run focused and full verification**

```bash
npm run test:cards
npm run typecheck
npm run lint
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/cards tests/card-definition.test.mjs tsconfig.core.json package.json
git commit -m "feat: add modular idiom card domain model"
```

---

### Task 2: 鎖定 v2.6 幾何與元件解析

**Files:**
- Create: `src/cards/layout/card-layout-v2_6.ts`
- Create: `src/cards/layout/resolve-card-components.ts`
- Test: `tests/card-layout.test.mjs`

**Interfaces:**
- Consumes: `IdiomCardDefinition`, `CardComponentRegistry`
- Produces: `CARD_LAYOUT_V2_6`, `resolveCardComponents(card, registry)`

- [ ] **Step 1: Write failing geometry tests**

Assert exact constants:

```js
assert.deepEqual(CARD_LAYOUT_V2_6.canvas, { width: 1024, height: 2000 });
assert.deepEqual(CARD_LAYOUT_V2_6.header, { x: 0, y: 0, width: 1024, height: 360 });
assert.deepEqual(CARD_LAYOUT_V2_6.artwork, { x: 0, y: 360, width: 1024, height: 1200 });
assert.deepEqual(CARD_LAYOUT_V2_6.footer, { x: 0, y: 1560, width: 1024, height: 440 });
```

Add a resolver test proving `rarity === 'SSR'` requires `rarity-ssr-v2.7` and rejects an SR-like badge ID.

- [ ] **Step 2: Run test and verify RED**

```bash
npm run test:cards
```

Expected: FAIL because layout modules are missing.

- [ ] **Step 3: Implement immutable layout constants**

Use `as const` and export slot rectangles for:

- rarity
- title
- bopomofo
- pinyin
- subtitle
- difficulty
- artwork
- theme
- allusion
- motto
- source

- [ ] **Step 4: Implement component resolver**

Rules:

- Resolve IDs from the registry without changing `artworkRef`.
- Reject missing or non-approved component assets.
- Require `rarity-ssr-v2.7` or a later explicitly approved SSR badge.
- Reject v2.7 SSR badge on N／R／SR.

- [ ] **Step 5: Verify and commit**

```bash
npm run test:cards
npm run typecheck
npm run lint
git add src/cards/layout tests/card-layout.test.mjs
git commit -m "feat: add card layout and component resolver"
```

---

### Task 3: 建立 deterministic Render Plan

**Files:**
- Create: `src/cards/render/card-render-plan.ts`
- Create: `src/cards/render/build-card-render-plan.ts`
- Test: `tests/card-render-plan.test.mjs`

**Interfaces:**
- Consumes: validated card, resolved components, `CARD_LAYOUT_V2_6`
- Produces: `IdiomCardRenderPlan`

- [ ] **Step 1: Write failing layer-order test**

Expected layer order:

```js
[
  'background',
  'artwork',
  'frame-skin',
  'effect-overlay',
  'rarity-badge',
  'difficulty-badge',
  'title-block',
  'pronunciation-block',
  'subtitle-block',
  'theme-badge',
  'allusion-panel',
  'motto-plaque',
  'source-line'
]
```

Also test replacing difficulty from B to A:

```js
assert.equal(after.sourceArtworkAssetId, before.sourceArtworkAssetId);
assert.notEqual(after.componentVersions.difficulty, before.componentVersions.difficulty);
```

- [ ] **Step 2: Run RED**

```bash
npm run test:cards
```

- [ ] **Step 3: Implement render-plan builder**

Requirements:

- Pure function, no DOM, no React, no random values.
- Preserve source artwork asset ID and version.
- Include exact slot rectangle and z-order for every layer.
- Exclude optional `effect-overlay` when null without changing other z-order semantics.
- Freeze returned arrays and top-level object.

- [ ] **Step 4: Verify and commit**

```bash
npm run test:cards
npm run typecheck
npm run lint
git add src/cards/render tests/card-render-plan.test.mjs
git commit -m "feat: build deterministic idiom card render plans"
```

---

### Task 4: 建立卡片定義與資產驗證 Gate

**Files:**
- Create: `src/cards/validation/validate-card-definition.ts`
- Create: `data/cards/card-assets.schema.json`
- Create: `data/cards/card-component-registry.json`
- Create: `scripts/validate-card-assets.mjs`
- Create: `scripts/verify-card-assets.test.mjs`
- Test: `tests/card-validation.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `validateCardDefinition(card, registry)`, CLI asset validator

- [ ] **Step 1: Write failing validation tests**

Test Blocking failures for:

- title is not exactly four Traditional Chinese characters
- bopomofo length is not four
- pinyin length is not four
- numbered tone is used
- modular artwork is not 1024 × 1200
- approved asset has missing Drive ID or invalid SHA-256
- SSR uses non-v2.7 badge
- flat legacy card has no legacy asset

- [ ] **Step 2: Run RED**

```bash
npm run test:cards
node --test scripts/verify-card-assets.test.mjs
```

- [ ] **Step 3: Implement pure validator and CLI**

Return structured findings:

```ts
export interface CardValidationFinding {
  readonly code: string;
  readonly severity: 'warning' | 'blocking';
  readonly message: string;
}
```

The CLI exits non-zero when any blocking finding exists.

- [ ] **Step 4: Wire scripts**

Add:

```json
"validate:card-assets": "node scripts/validate-card-assets.mjs"
```

Call it from `scripts/verify.sh` after data validation and before TypeScript/build.

- [ ] **Step 5: Verify and commit**

```bash
npm run test:cards
npm run validate:card-assets
./scripts/verify.sh
git add src/cards/validation data/cards scripts package.json tests/card-validation.test.mjs
git commit -m "feat: validate modular card definitions and assets"
```

---

### Task 5: 建立 React SVG 元件與 modular／legacy 顯示

**Files:**
- Create: `src/app/cards/IdiomCardCanvas.tsx`
- Create: `src/app/cards/IdiomCardView.tsx`
- Create: `src/app/cards/components/RarityBadge.tsx`
- Create: `src/app/cards/components/DifficultyBadge.tsx`
- Create: `src/app/cards/components/ThemeBadge.tsx`
- Create: `src/app/cards/components/TitleAndPronunciation.tsx`
- Create: `src/app/cards/components/AllusionPanel.tsx`
- Create: `src/app/cards/components/MottoPlaque.tsx`
- Create: `src/app/cards/components/SourceLine.tsx`
- Test: `tests/card-legacy-fallback.test.mjs`

**Interfaces:**
- Consumes: `IdiomCardDefinition`, `IdiomCardRenderPlan`
- Produces: `<IdiomCardView />`, `<IdiomCardCanvas />`

- [ ] **Step 1: Write failing mode-selection test**

Extract a pure helper in `src/cards/render/select-card-render-mode.ts` and test:

```js
assert.equal(selectCardRenderMode(modularCard), 'modular');
assert.equal(selectCardRenderMode(legacyCard), 'flat-legacy');
```

A malformed modular card must not silently fall back to legacy.

- [ ] **Step 2: Run RED**

```bash
npm run test:cards
```

- [ ] **Step 3: Implement SVG canvas**

Requirements:

- `<svg viewBox="0 0 1024 2000">`
- Artwork rendered into `{x: 0, y: 360, width: 1024, height: 1200}`.
- Text remains live SVG text, not embedded in artwork.
- Component props come from render plan only.
- Use `aria-label` with idiom title and meaning.
- Preserve large mobile-readable typography.

- [ ] **Step 4: Implement legacy fallback**

`flat-legacy` renders its approved flat image directly. It must not pretend to support component replacement.

- [ ] **Step 5: Run verification and commit**

```bash
npm run test:cards
npm run typecheck
npm run lint
npm run build
git add src/app/cards src/cards/render/select-card-render-mode.ts tests/card-legacy-fallback.test.mjs
git commit -m "feat: render modular and legacy idiom cards"
```

---

### Task 6: 加入瀏覽器端 PNG 輸出

**Files:**
- Create: `src/app/cards/exportCardPng.ts`
- Modify: `src/app/cards/IdiomCardCanvas.tsx`
- Test: `tests/card-render-plan.test.mjs`

**Interfaces:**
- Produces: `exportCardPng(svgElement, filename): Promise<Blob>`

- [ ] **Step 1: Add failing export-contract tests**

Keep the test pure by extracting:

```ts
export function getCardExportDimensions(): { readonly width: 1024; readonly height: 2000 }
```

Test exact dimensions and filename normalization.

- [ ] **Step 2: Run RED**

```bash
npm run test:cards
```

- [ ] **Step 3: Implement SVG-to-Canvas export**

Workflow:

```text
XMLSerializer
→ SVG Blob
→ Image decode
→ Canvas 1024 × 2000
→ canvas.toBlob('image/png')
```

Reject when:

- SVG is missing
- image decoding fails
- canvas context is unavailable
- output Blob is null

Do not introduce a new runtime dependency.

- [ ] **Step 4: Verify and commit**

```bash
npm run test:cards
npm run typecheck
npm run lint
npm run build
git add src/app/cards/exportCardPng.ts src/app/cards/IdiomCardCanvas.tsx tests/card-render-plan.test.mjs
git commit -m "feat: export modular idiom cards as png"
```

---

### Task 7: 建立第一組元件與示範卡驗證

**Files:**
- Create: `data/cards/idiom-card-catalog.json`
- Add: Approved runtime derivatives under `public/cards/`
- Modify: `data/cards/card-component-registry.json`
- Modify: `docs/card-prompts/manifest.md`
- Modify: `docs/card-prompts/state/current-batch.json`

**Interfaces:**
- Produces: one modular demonstration card and one flat-legacy fixture

- [ ] **Step 1: Prepare Drive evidence**

For every artwork/component master, record:

- Drive File ID
- SHA-256
- width and height
- review status
- version

Do not proceed with invented placeholders.

- [ ] **Step 2: Create one modular example**

Recommended example: `愚公移山`.

Required versions:

```text
layoutVersion: 2.6
componentSetVersion: 1.0
rarityBadgeId: rarity-ssr-v2.7
artwork: 1024 × 1200
composite: 1024 × 2000
```

- [ ] **Step 3: Prove component replacement invariant**

Render the same card twice with difficulty B and A. Verify:

- artwork SHA-256 unchanged
- artwork asset ID unchanged
- only difficulty data/component differs
- final PNGs are 1024 × 2000

- [ ] **Step 4: Update Manifest and state**

Record artwork and composite Drive references separately. Do not merge their status fields.

- [ ] **Step 5: Run full gate and commit**

```bash
./scripts/verify.sh
git add data/cards public/cards docs/card-prompts
git commit -m "test: add modular idiom card reference assets"
```

---

### Task 8: Integrate with collection and reward surfaces

**Files:**
- Modify the actual collection/reward files created by the card-collection implementation
- Reuse: `src/app/cards/IdiomCardView.tsx`
- Test: add focused tests beside the collection implementation

**Interfaces:**
- Consumes: card ownership and approved catalog entries
- Produces: shared card rendering in collection grid, detail view, and reward reveal

- [ ] **Step 1: Confirm collection implementation exists**

If the collection feature is not yet implemented, stop this task and create a separate dependent plan. Do not invent file paths or mix collection implementation into renderer foundation.

- [ ] **Step 2: Replace flat-card-only display with `IdiomCardView`**

Rules:

- `modular` uses SVG renderer.
- `flat-legacy` uses approved legacy asset.
- Review or blocked cards remain excluded from player-facing pools.

- [ ] **Step 3: Verify no domain rule moved into React**

Card eligibility, rarity, milestone selection and approval remain in pure TypeScript/domain services.

- [ ] **Step 4: Run full verification and commit**

```bash
./scripts/verify.sh
git add src tests
git commit -m "feat: use modular cards in collection surfaces"
```

---

## Final Verification

- [ ] Run full repository verification:

```bash
./scripts/verify.sh
```

- [ ] Confirm `npm audit` reports zero vulnerabilities.
- [ ] Confirm exact Node test totals from the current run; do not reuse old counts.
- [ ] Confirm TypeScript strict, ESLint, Vite build and PWA generation pass.
- [ ] Confirm `behind_by = 0` before merge.
- [ ] Confirm unresolved review threads = 0.
- [ ] Confirm Drive artwork/component/composite evidence is recorded.
- [ ] Perform ChatGPT Audit against the modularization spec.
- [ ] Squash Merge only after all gates pass.

## Implementation Notes

- Tasks 1–6 form the renderer foundation and can be delivered before the collection feature.
- Task 7 requires real approved Drive assets and must not use invented evidence.
- Task 8 is dependency-gated and should remain separate if the collection implementation is not present.
- A future headless batch exporter may add Playwright or another approved tool in a separate dependency-reviewed plan; it is not required for the first browser-side implementation.