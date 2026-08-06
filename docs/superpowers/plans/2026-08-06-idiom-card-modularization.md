# 成語圖卡元件化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立資料驅動、可替換元件、同時支援 PWA 顯示與固定 PNG 輸出的成語圖卡渲染基礎，使難易度、稀有度徽章與文字改版不需要重畫中央主插圖。

**Architecture:** 純 TypeScript 建立資料模型、v2.6 固定座標、元件解析與 immutable render plan；React 只將 render plan 畫成 SVG。PNG 由同一 SVG 轉成 1024 × 2000 Canvas；舊圖使用 `flat-legacy` fallback。

**Tech Stack:** TypeScript 6、React 19、SVG、Canvas、Node.js built-in test runner、Vite PWA；本計畫不新增第三方 runtime dependency。

## Global Constraints

- Composite 固定 `1024 × 2000 px`。
- Header／Artwork／Footer 固定 `360 / 1200 / 440 px`。
- Artwork canonical source 固定 `1024 × 1200 px` 或經驗證可安全裁切。
- 主標下方第一列為注音，第二列為小寫帶聲調漢語拼音。
- SSR 使用 v2.7 傳奇級虹彩金龍徽章；N／R／SR 不得使用。
- 稀有度與難易度分離。
- 新卡預設 `modular`；舊平面圖使用 `flat-legacy`。
- React 不得承載稀有度、授權、來源或卡池規則。
- Drive master 是視覺核准來源；Repository runtime derivative 必須可追溯。
- TDD：先 RED，再最小 GREEN，最後完整回歸。
- 不修改 `cicg-progress` IndexedDB Schema。

## Planned File Structure

```text
src/cards/
├─ domain/
│  ├─ card-types.ts
│  ├─ card-assets.ts
│  ├─ card-definition.ts
│  └─ component-registry.ts
├─ layout/
│  ├─ card-layout-v2_6.ts
│  └─ resolve-card-components.ts
├─ render/
│  ├─ card-render-plan.ts
│  ├─ build-card-render-plan.ts
│  └─ select-card-render-mode.ts
└─ validation/
   └─ validate-card-definition.ts

src/app/cards/
├─ IdiomCardCanvas.tsx
├─ IdiomCardView.tsx
├─ exportCardPng.ts
└─ components/
   ├─ RarityBadge.tsx
   ├─ DifficultyBadge.tsx
   ├─ ThemeBadge.tsx
   ├─ TitleAndPronunciation.tsx
   ├─ AllusionPanel.tsx
   ├─ MottoPlaque.tsx
   └─ SourceLine.tsx

data/cards/
├─ idiom-card-catalog.json
├─ card-component-registry.json
└─ card-assets.schema.json

public/cards/
├─ artworks/
└─ components/

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

### Task 1: 建立純 TypeScript 資料模型

**Files:**
- Create: `src/cards/domain/card-types.ts`
- Create: `src/cards/domain/card-assets.ts`
- Create: `src/cards/domain/card-definition.ts`
- Create: `src/cards/domain/component-registry.ts`
- Modify: `tsconfig.core.json`
- Modify: `package.json`
- Test: `tests/card-definition.test.mjs`

**Produces:** `CardRarity`, `IdiomDifficulty`, `CardRenderMode`, `CardAssetReference`, `IdiomCardDefinition`, `CardComponentRegistry`, `createCardDefinition()`

- [ ] **Step 1: Write the failing test**

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

- [ ] **Step 2: Verify RED**

```bash
npm run compile:core
node --test tests/card-definition.test.mjs
```

Expected: FAIL because the card domain modules do not exist.

- [ ] **Step 3: Wire compilation and test script**

Add `"src/cards/**/*.ts"` to `tsconfig.core.json` and add:

```json
"test:cards": "npm run compile:core && node --test tests/card-*.test.mjs"
```

Append `npm run test:cards` to the aggregate `test` script.

- [ ] **Step 4: Implement minimal readonly types and factory**

`createCardDefinition()` returns a frozen copy and does not infer rarity, difficulty, approval or license.

- [ ] **Step 5: Verify GREEN and commit**

```bash
npm run test:cards
npm run typecheck
npm run lint
git add src/cards/domain tests/card-definition.test.mjs tsconfig.core.json package.json
git commit -m "feat: add modular idiom card domain model"
```

---

### Task 2: 鎖定 v2.6 幾何與元件解析

**Files:**
- Create: `src/cards/layout/card-layout-v2_6.ts`
- Create: `src/cards/layout/resolve-card-components.ts`
- Test: `tests/card-layout.test.mjs`

**Produces:** `CARD_LAYOUT_V2_6`, `resolveCardComponents(card, registry)`

- [ ] **Step 1: Write failing geometry tests**

```js
assert.deepEqual(CARD_LAYOUT_V2_6.canvas, { width: 1024, height: 2000 });
assert.deepEqual(CARD_LAYOUT_V2_6.header, { x: 0, y: 0, width: 1024, height: 360 });
assert.deepEqual(CARD_LAYOUT_V2_6.artwork, { x: 0, y: 360, width: 1024, height: 1200 });
assert.deepEqual(CARD_LAYOUT_V2_6.footer, { x: 0, y: 1560, width: 1024, height: 440 });
```

Add tests proving SSR requires `rarity-ssr-v2.7`, and N／R／SR reject that badge.

- [ ] **Step 2: Verify RED**

```bash
npm run test:cards
```

- [ ] **Step 3: Implement immutable slot constants**

Export slots for rarity, title, bopomofo, pinyin, subtitle, difficulty, artwork, theme, allusion, motto and source.

- [ ] **Step 4: Implement component resolver**

Reject missing, deprecated or non-approved component assets. Never alter `artworkRef` while resolving components.

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
- Create: `src/cards/render/select-card-render-mode.ts`
- Test: `tests/card-render-plan.test.mjs`
- Test: `tests/card-legacy-fallback.test.mjs`

**Produces:** `IdiomCardRenderPlan`, `buildCardRenderPlan()`, `selectCardRenderMode()`

- [ ] **Step 1: Write failing layer-order and invariant tests**

Expected layer order:

```js
[
  'background', 'artwork', 'frame-skin', 'effect-overlay',
  'rarity-badge', 'difficulty-badge', 'title-block',
  'pronunciation-block', 'subtitle-block', 'theme-badge',
  'allusion-panel', 'motto-plaque', 'source-line'
]
```

Replacement invariant:

```js
assert.equal(after.sourceArtworkAssetId, before.sourceArtworkAssetId);
assert.equal(after.sourceArtworkSha256, before.sourceArtworkSha256);
assert.notEqual(after.componentVersions.difficulty, before.componentVersions.difficulty);
```

Mode selection:

```js
assert.equal(selectCardRenderMode(modularCard), 'modular');
assert.equal(selectCardRenderMode(legacyCard), 'flat-legacy');
```

Malformed modular cards must not silently fall back to legacy.

- [ ] **Step 2: Verify RED**

```bash
npm run test:cards
```

- [ ] **Step 3: Implement pure render-plan builder**

No DOM, React, random values or browser state. Freeze the returned plan and layer array.

- [ ] **Step 4: Verify and commit**

```bash
npm run test:cards
npm run typecheck
npm run lint
git add src/cards/render tests/card-render-plan.test.mjs tests/card-legacy-fallback.test.mjs
git commit -m "feat: build deterministic idiom card render plans"
```

---

### Task 4: 建立資料與資產驗證 Gate

**Files:**
- Create: `src/cards/validation/validate-card-definition.ts`
- Create: `data/cards/card-assets.schema.json`
- Create: `data/cards/card-component-registry.json`
- Create: `scripts/validate-card-assets.mjs`
- Create: `scripts/verify-card-assets.test.mjs`
- Test: `tests/card-validation.test.mjs`
- Modify: `package.json`
- Modify: `scripts/verify.sh`

**Produces:** `validateCardDefinition(card, registry)`, `npm run validate:card-assets`

- [ ] **Step 1: Write failing validation tests**

Blocking cases:

- title is not exactly four Traditional Chinese characters
- bopomofo or pinyin does not contain four items
- numbered Pinyin tone is used
- modular artwork is not 1024 × 1200
- approved asset lacks Drive ID or valid SHA-256
- SSR does not use v2.7 badge
- flat legacy card lacks `flatLegacyRef`

- [ ] **Step 2: Verify RED**

```bash
npm run test:cards
node --test scripts/verify-card-assets.test.mjs
```

- [ ] **Step 3: Implement structured findings**

```ts
export interface CardValidationFinding {
  readonly code: string;
  readonly severity: 'warning' | 'blocking';
  readonly message: string;
}
```

The CLI exits non-zero when a blocking finding exists.

- [ ] **Step 4: Wire verification**

Add:

```json
"validate:card-assets": "node scripts/validate-card-assets.mjs"
```

Call it from `scripts/verify.sh` before TypeScript and build gates.

- [ ] **Step 5: Verify and commit**

```bash
npm run test:cards
npm run validate:card-assets
./scripts/verify.sh
git add src/cards/validation data/cards scripts package.json tests/card-validation.test.mjs
git commit -m "feat: validate modular card definitions and assets"
```

---

### Task 5: 建立 React SVG renderer 與 legacy fallback

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

**Consumes:** validated `IdiomCardDefinition` and `IdiomCardRenderPlan`

- [ ] **Step 1: Implement SVG canvas from render plan**

Required root:

```tsx
<svg viewBox="0 0 1024 2000" role="img" aria-label={ariaLabel}>
```

Artwork uses `{ x: 0, y: 360, width: 1024, height: 1200 }`. All formal text remains live SVG text.

- [ ] **Step 2: Implement components without domain decisions**

Components receive already-resolved props. They must not infer rarity, approval, license, source status or card eligibility.

- [ ] **Step 3: Implement `IdiomCardView` mode switch**

- `modular`: render `IdiomCardCanvas`.
- `flat-legacy`: render approved legacy image.
- malformed modular input: render an explicit error state, not legacy fallback.

- [ ] **Step 4: Verify and commit**

```bash
npm run test:cards
npm run typecheck
npm run lint
npm run build
git add src/app/cards
git commit -m "feat: render modular and legacy idiom cards"
```

---

### Task 6: 加入瀏覽器端 PNG 輸出

**Files:**
- Create: `src/app/cards/exportCardPng.ts`
- Modify: `src/app/cards/IdiomCardCanvas.tsx`
- Modify: `tests/card-render-plan.test.mjs`

**Produces:** `getCardExportDimensions()`, `normalizeCardExportFilename()`, `exportCardPng()`

- [ ] **Step 1: Write failing pure contract tests**

```js
assert.deepEqual(getCardExportDimensions(), { width: 1024, height: 2000 });
assert.equal(normalizeCardExportFilename('愚公移山'), 'CICG_IdiomCard_愚公移山.png');
```

- [ ] **Step 2: Verify RED**

```bash
npm run test:cards
```

- [ ] **Step 3: Implement SVG-to-Canvas export**

```text
XMLSerializer
→ SVG Blob
→ Image decode
→ Canvas 1024 × 2000
→ canvas.toBlob('image/png')
```

Reject missing SVG, decode failure, unavailable context or null Blob. Do not add a runtime dependency.

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

### Task 7: 建立真實示範卡與替換證據

**Files:**
- Create: `data/cards/idiom-card-catalog.json`
- Add: approved runtime derivatives under `public/cards/artworks/` and `public/cards/components/`
- Modify: `data/cards/card-component-registry.json`
- Modify: `docs/card-prompts/manifest.md`
- Modify: `docs/card-prompts/state/current-batch.json`

**Produces:** one modular reference card and one flat-legacy fixture

- [ ] **Step 1: Obtain real Drive evidence**

For every master record actual Drive File ID, SHA-256, dimensions, version and review status. Stop if evidence is unavailable.

- [ ] **Step 2: Create the modular reference card**

Use `愚公移山` only after content review. Required values:

```text
layoutVersion: 2.6
componentSetVersion: 1.0
rarityBadgeId: rarity-ssr-v2.7
artwork: 1024 × 1200
composite: 1024 × 2000
```

- [ ] **Step 3: Prove replacement invariant**

Render B and A difficulty variants. Verify artwork ID and SHA-256 are identical; only difficulty data/component and final composite checksum differ.

- [ ] **Step 4: Update Manifest and state**

Record artwork and composite Drive references, checksums and statuses separately.

- [ ] **Step 5: Run full gate and commit**

```bash
./scripts/verify.sh
git add data/cards public/cards docs/card-prompts
git commit -m "test: add modular idiom card reference assets"
```

---

## Explicitly Out of Scope

Collection grid, detail page and milestone reward integration are not part of this renderer-foundation plan because their production files may not yet exist. After those features land, create a separate plan using their actual paths and reuse `src/app/cards/IdiomCardView.tsx`.

A headless batch exporter requiring Playwright or another new dependency also requires a separate dependency-reviewed plan.

## Final Verification

- [ ] Run:

```bash
./scripts/verify.sh
```

- [ ] Record current Node test totals and zero failures.
- [ ] Confirm TypeScript strict, ESLint, Vite build and PWA generation pass.
- [ ] Confirm `npm audit` reports zero vulnerabilities.
- [ ] Confirm `behind_by = 0`.
- [ ] Confirm unresolved review threads = 0.
- [ ] Confirm real Drive artwork／component／composite evidence.
- [ ] Perform ChatGPT Audit against the modularization spec.
- [ ] Squash Merge only after every gate passes.