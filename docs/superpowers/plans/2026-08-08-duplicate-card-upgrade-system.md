# Duplicate Card Upgrade System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic automatic material selection and atomic 10：1 upgrades from N→R, R→SR and SR→SSR, using only duplicate copies and only target cards already seen in completed main levels.

**Architecture:** Build pure TypeScript modules for material selection, target-pool construction and weighted resolution. The Version 2 repository created by the per-level reward plan stores immutable acquisition history, consumed-copy counts and upgrade records in one transaction. React exposes a compact upgrade panel on the campaign map; it never performs selection, deduction or random resolution.

**Tech Stack:** TypeScript 6 strict, React 19, IndexedDB Version 2, Node `node:test`, Vite PWA, ESLint.

## Global Constraints

- This plan depends on `2026-08-08-per-level-card-reward-hidden-score.md` and its Version 2 state.
- Upgrade ratios are fixed: 10 N→1 R, 10 R→1 SR, 10 SR→1 SSR.
- Every card ID must retain at least one owned copy.
- Materials may combine different idioms and different completed chapters, but never different rarities.
- Material selection is automatic: consumable count descending, then permanent card number ascending.
- Upgrade results use only target-rarity cards appearing in completed main levels.
- Upgrade results are fully random, weighted by formal `weight`, and may duplicate owned cards.
- SSR cannot upgrade; UR is neither material nor result.
- No valid target pool means no deduction and no record.
- Deduction, result acquisition, upgrade record and metadata update are one IndexedDB transaction.
- Hidden reward score is unrelated to upgrade probabilities.
- No new runtime dependency.

---

## File Structure

**Create**

- `src/cards/upgrade-material-selector.ts` — consumable counts and deterministic 10-card selection.
- `src/cards/upgrade-pool.ts` — completed-content target pool by exact rarity.
- `src/cards/upgrade-engine.ts` — target rarity mapping, weighted result selection and immutable inventory mutation.
- `src/cards/upgrade-service.ts` — repository transaction, idempotency and conflict handling.
- `src/app/cards/CardUpgradePanel.tsx` — display-safe summary and confirm/cancel interaction.
- `src/app/cards/card-upgrade.css` — mobile-first upgrade panel styling.
- `tests/card-upgrade-material-selector.test.mjs`
- `tests/card-upgrade-pool.test.mjs`
- `tests/card-upgrade-engine.test.mjs`
- `tests/card-upgrade-service.test.mjs`
- `tests/card-upgrade-ui-contract.test.mjs`

**Modify**

- `src/cards/card-types.ts` — consumed-copy invariant and upgrade result types.
- `src/cards/inventory-engine.ts` — preserve acquisition history while applying consumption.
- `src/cards/collection-serialization.ts` — Version 2 `consumedCount` and upgrade validation.
- `src/cards/indexeddb-collection-repository.ts` — read/write upgrade records already provisioned by Version 2.
- `src/app/use-card-collection.ts` — load state, preview upgrades and execute confirmed upgrade.
- `src/app/CampaignGame.tsx` — pass card upgrade controller to map.
- `src/app/LevelMap.tsx` — render the upgrade panel without hidden probability data.
- `src/app/LevelMap.css`
- `tests/card-inventory-engine.test.mjs`
- `tests/card-collection-serialization.test.mjs`
- `tests/card-indexeddb-collection-repository.test.mjs`

---

### Task 1: Establish the Consumable-Copy Inventory Invariant

**Files:**
- Modify: `src/cards/card-types.ts`
- Modify: `src/cards/inventory-engine.ts`
- Modify: `src/cards/collection-serialization.ts`
- Modify: `tests/card-inventory-engine.test.mjs`
- Modify: `tests/card-collection-serialization.test.mjs`

**Interfaces:**
- Adds: `PlayerCardInventoryItem.consumedCount: number`
- Produces: `consumableCount(item): number`
- Produces: `consumeCardCopies(inventory, materials): readonly PlayerCardInventoryItem[]`
- Invariant: `ownedCount + consumedCount === acquisitionHistory.length`

- [ ] **Step 1: Write failing migration and invariant tests**

```js
test('migrates old inventory with zero consumed copies', () => {
  const item = parseCardCollectionState(versionOneState, NOW).inventory[0];
  assert.equal(item.consumedCount, 0);
  assert.equal(item.ownedCount + item.consumedCount, item.acquisitionHistory.length);
});

test('reports only copies above the retained first copy as consumable', () => {
  assert.equal(consumableCount(inventoryItem({ ownedCount: 1, consumedCount: 0 })), 0);
  assert.equal(consumableCount(inventoryItem({ ownedCount: 4, consumedCount: 0 })), 3);
});
```

- [ ] **Step 2: Run and verify RED**

Run:

```bash
npm run compile:core
node --test tests/card-inventory-engine.test.mjs tests/card-collection-serialization.test.mjs
```

Expected: FAIL because `consumedCount` and consumption functions are absent.

- [ ] **Step 3: Add the Version 2 invariant**

```ts
export interface PlayerCardInventoryItem {
  readonly cardId: string;
  readonly ownedCount: number;
  readonly consumedCount: number;
  readonly firstOwnedAt: string;
  readonly lastOwnedAt: string;
  readonly acquisitionHistory: readonly CardAcquisitionRecord[];
}

export function consumableCount(item: PlayerCardInventoryItem): number {
  return Math.max(item.ownedCount - 1, 0);
}
```

`applyCardAcquisition` increments `ownedCount` and appends history but leaves `consumedCount` unchanged.

- [ ] **Step 4: Implement immutable consumption**

```ts
export function consumeCardCopies(
  inventory: readonly PlayerCardInventoryItem[],
  materials: readonly CardUpgradeMaterial[]
): readonly PlayerCardInventoryItem[] {
  const quantityById = new Map(materials.map((material) => [material.cardId, material.quantity]));
  return Object.freeze(inventory.map((item) => {
    const quantity = quantityById.get(item.cardId) ?? 0;
    if (quantity === 0) return item;
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > consumableCount(item)) {
      throw new Error('upgrade-material-conflict');
    }
    return Object.freeze({
      ...item,
      ownedCount: item.ownedCount - quantity,
      consumedCount: item.consumedCount + quantity
    });
  }));
}
```

- [ ] **Step 5: Tighten serialization validation**

Version 1 input defaults `consumedCount` to 0. Version 2 input requires:

```text
consumedCount is a non-negative integer
ownedCount is a positive integer
ownedCount + consumedCount equals acquisitionHistory.length
```

- [ ] **Step 6: Run focused tests and commit**

Run:

```bash
npm run compile:core
node --test tests/card-inventory-engine.test.mjs tests/card-collection-serialization.test.mjs
```

Commit:

```bash
git add src/cards/card-types.ts src/cards/inventory-engine.ts src/cards/collection-serialization.ts tests/card-inventory-engine.test.mjs tests/card-collection-serialization.test.mjs
git commit -m "feat: track consumed duplicate card copies"
```

---

### Task 2: Select Ten Materials Deterministically

**Files:**
- Create: `src/cards/upgrade-material-selector.ts`
- Create: `tests/card-upgrade-material-selector.test.mjs`

**Interfaces:**
- Produces: `CardNumberReference { cardId, cardNumber, rarity }`
- Produces: `selectUpgradeMaterials(inventory, cards, sourceRarity): UpgradeMaterialSelection`

- [ ] **Step 1: Write failing selection tests**

```js
test('selects highest duplicate counts first and breaks ties by card number', () => {
  const result = selectUpgradeMaterials(
    inventory([
      ['card-3', 6],
      ['card-8', 4],
      ['card-1', 3],
      ['card-10', 3]
    ]),
    cardNumbers([
      ['card-3', 'N-003'],
      ['card-8', 'N-008'],
      ['card-1', 'N-001'],
      ['card-10', 'N-010']
    ]),
    'N'
  );
  assert.deepEqual(result.materials, [
    { cardId: 'card-3', quantity: 5 },
    { cardId: 'card-8', quantity: 3 },
    { cardId: 'card-1', quantity: 2 }
  ]);
});
```

Also test:

```text
ownedCount 1 contributes zero
other rarities are ignored
less than 10 returns status insufficient
exactly 10 is ready
the final selected card is partially consumed when needed
same inputs always produce the same frozen result
```

- [ ] **Step 2: Run and verify RED**

Run: `npm run compile:core && node --test tests/card-upgrade-material-selector.test.mjs`

- [ ] **Step 3: Implement the selector**

```ts
const UPGRADE_COST = 10;

export function selectUpgradeMaterials(
  inventory: readonly PlayerCardInventoryItem[],
  cards: readonly CardNumberReference[],
  sourceRarity: CardUpgradeSourceRarity
): UpgradeMaterialSelection {
  const referenceById = new Map(cards.map((card) => [card.cardId, card]));
  const candidates = inventory
    .map((item) => ({ item, reference: referenceById.get(item.cardId) }))
    .filter(({ item, reference }) =>
      reference?.rarity === sourceRarity && consumableCount(item) > 0
    )
    .sort((left, right) =>
      consumableCount(right.item) - consumableCount(left.item) ||
      left.reference.cardNumber.localeCompare(right.reference.cardNumber)
    );
  // take only the quantity required to reach ten
}
```

Do not use acquisition dates, insertion order or RNG as a tiebreaker.

- [ ] **Step 4: Run focused tests and commit**

Run: `npm run compile:core && node --test tests/card-upgrade-material-selector.test.mjs`

Commit:

```bash
git add src/cards/upgrade-material-selector.ts tests/card-upgrade-material-selector.test.mjs
git commit -m "feat: select duplicate card materials deterministically"
```

---

### Task 3: Build Completed-Content Target Pools

**Files:**
- Create: `src/cards/upgrade-pool.ts`
- Create: `tests/card-upgrade-pool.test.mjs`

**Interfaces:**
- Produces: `targetRarityFor(source): 'R' | 'SR' | 'SSR'`
- Produces: `buildUpgradeTargetPool(input): readonly IdiomCardDefinition[]`

- [ ] **Step 1: Write failing target-rarity tests**

```js
test('maps upgrade source rarity to the next formal rarity', () => {
  assert.equal(targetRarityFor('N'), 'R');
  assert.equal(targetRarityFor('R'), 'SR');
  assert.equal(targetRarityFor('SR'), 'SSR');
});
```

- [ ] **Step 2: Write completed-content filtering tests**

Cover:

```text
N upgrade includes only R cards
R upgrade includes only SR cards
SR upgrade includes only SSR cards
completed chapter one and chapter two idioms combine
uncompleted-level idioms are excluded
UR, Review, Legacy and NeedsReview are excluded
owned target cards remain eligible
a missing target rarity returns an empty pool
```

- [ ] **Step 3: Run and verify RED**

Run: `npm run compile:core && node --test tests/card-upgrade-pool.test.mjs`

- [ ] **Step 4: Implement exact-rarity completed-content filtering**

```ts
export function targetRarityFor(
  source: CardUpgradeSourceRarity
): CardUpgradeTargetRarity {
  if (source === 'N') return 'R';
  if (source === 'R') return 'SR';
  return 'SSR';
}
```

Reuse the formal approval allowlist from `card-pool.ts`, then filter by:

```text
card.rarity === targetRarity
completedIdiomIds.has(card.idiomId)
card.acquisitionMethods includes upgrade-reward or the approved shared reward method
```

The final acquisition method policy must be represented explicitly in card definitions; do not silently treat direct-purchase-only cards as upgrade rewards.

- [ ] **Step 5: Run focused tests and commit**

Run: `npm run compile:core && node --test tests/card-upgrade-pool.test.mjs`

Commit:

```bash
git add src/cards/upgrade-pool.ts tests/card-upgrade-pool.test.mjs
git commit -m "feat: build completed-content upgrade pools"
```

---

### Task 4: Resolve and Apply an Upgrade Atomically

**Files:**
- Create: `src/cards/upgrade-engine.ts`
- Create: `src/cards/upgrade-service.ts`
- Create: `tests/card-upgrade-engine.test.mjs`
- Create: `tests/card-upgrade-service.test.mjs`
- Modify: `src/cards/indexeddb-collection-repository.ts`
- Modify: `tests/card-indexeddb-collection-repository.test.mjs`

**Interfaces:**
- Produces: `resolveUpgradeResult(pool, random): IdiomCardDefinition`
- Produces: `executeCardUpgrade(input): Promise<CardUpgradeExecutionResult>`
- Uses: `upgradeId` and `card-acquisition:<upgradeId>` for idempotency.

- [ ] **Step 1: Write failing weighted-result tests**

```js
test('uses formal target-card weights and permits owned results', () => {
  const selected = resolveUpgradeResult(
    [{ id: 'r-1', weight: 1 }, { id: 'r-2', weight: 3 }],
    randomSequence([0.75])
  );
  assert.equal(selected.id, 'r-2');
});
```

Also test invalid RNG and empty pool.

- [ ] **Step 2: Write failing service transaction tests**

Cover:

```text
ready N materials consume exactly 10 and add one R
result may duplicate an owned card
no target pool returns upgrade-target-pool-empty without changes
insufficient materials returns insufficient-upgrade-materials
stale preview returns upgrade-material-conflict
same upgradeId replay returns existing record without deduction or RNG
transaction failure rolls back materials, result and record
```

- [ ] **Step 3: Run and verify RED**

Run:

```bash
npm run compile:core
node --test tests/card-upgrade-engine.test.mjs tests/card-upgrade-service.test.mjs
```

- [ ] **Step 4: Implement weighted selection**

Use one injected RNG value in `[0, 1)` and the same cumulative-weight algorithm used for reward cards. Do not consult inventory.

- [ ] **Step 5: Implement the repository transaction**

Inside `repository.transact`:

```text
return existing upgrade when upgradeId already exists
rebuild material selection from current inventory
compare rebuilt materials with confirmed preview
build target pool from current completed-level set
resolve target card
consume materials
apply upgrade-reward acquisition
append frozen upgrade record
update Version 2 metadata
return the saved record and state
```

Use:

```ts
const acquisitionId = `card-acquisition:${upgradeId}`;
```

`CardUpgradeRecord.materials` must store the exact automatic selection. The record is immutable after commit.

- [ ] **Step 6: Verify the `upgrades` store participates in the same transaction**

The repository replacement function writes grants, inventory, metadata and upgrades before transaction completion. Any request error aborts all four stores.

- [ ] **Step 7: Run focused tests and commit**

Run:

```bash
npm run compile:core
node --test tests/card-upgrade-engine.test.mjs tests/card-upgrade-service.test.mjs tests/card-indexeddb-collection-repository.test.mjs
```

Commit:

```bash
git add src/cards/upgrade-engine.ts src/cards/upgrade-service.ts src/cards/indexeddb-collection-repository.ts tests/card-upgrade-engine.test.mjs tests/card-upgrade-service.test.mjs tests/card-indexeddb-collection-repository.test.mjs
git commit -m "feat: execute atomic duplicate card upgrades"
```

---

### Task 5: Expose a Safe Upgrade Controller from the Hook

**Files:**
- Modify: `src/app/use-card-collection.ts`
- Test: `tests/card-upgrade-hook-contract.test.mjs`

**Interfaces:**
- Produces: `upgradePreviews` for N, R and SR.
- Produces: `executeUpgrade(sourceRarity): Promise<CardUpgradeExecutionResult>`.
- Exposes no manual material mutation and no hidden reward probability fields.

- [ ] **Step 1: Write hook contract tests**

```js
test('the hook exposes preview and execution but no manual material selector', () => {
  const source = readFileSync(new URL('../src/app/use-card-collection.ts', import.meta.url), 'utf8');
  assert.match(source, /upgradePreviews/);
  assert.match(source, /executeUpgrade/);
  assert.doesNotMatch(source, /setUpgradeMaterials/);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/card-upgrade-hook-contract.test.mjs`

- [ ] **Step 3: Extend the hook state**

After every reward sync or upgrade:

- Store the latest loaded `CardCollectionState`.
- Build three deterministic previews from state, card-number registry and completed idiom IDs.
- Generate `upgradeId` only when the user confirms, using a supplied ID factory at the hook boundary.
- Enqueue `executeCardUpgrade` through the existing collection write queue.
- Refresh state from the saved execution result.
- Keep storage failures non-blocking to campaign progress.

- [ ] **Step 4: Run hook contract, typecheck and card tests**

```bash
node --test tests/card-upgrade-hook-contract.test.mjs
npm run typecheck
npm run test:cards
```

- [ ] **Step 5: Commit**

```bash
git add src/app/use-card-collection.ts tests/card-upgrade-hook-contract.test.mjs
git commit -m "feat: expose card upgrade controller"
```

---

### Task 6: Add the Campaign-Map Upgrade Panel

**Files:**
- Create: `src/app/cards/CardUpgradePanel.tsx`
- Create: `src/app/cards/card-upgrade.css`
- Modify: `src/app/CampaignGame.tsx`
- Modify: `src/app/LevelMap.tsx`
- Modify: `src/app/LevelMap.css`
- Create: `tests/card-upgrade-ui-contract.test.mjs`

**Interfaces:**
- Consumes: three `UpgradePreview` values and `onConfirm(sourceRarity)`.
- Shows: retained-copy rule, automatic material summary, progress `/10`, target rarity and disabled reason.
- Does not show: hidden score, reward ticket counts, roll values or manual material controls.

- [ ] **Step 1: Write UI contract tests**

```js
test('upgrade panel communicates automatic selection and retained first copies', () => {
  const source = readFileSync(new URL('../src/app/cards/CardUpgradePanel.tsx', import.meta.url), 'utf8');
  assert.match(source, /每張卡至少保留 1 張/);
  assert.match(source, /系統自動選擇/);
  assert.doesNotMatch(source, /checkbox|radio/);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/card-upgrade-ui-contract.test.mjs`

- [ ] **Step 3: Build the mobile-first panel**

The panel renders one row per source rarity:

```text
N 重複卡 7/10 → R
R 重複卡 10/10 → SR [合成]
SR 重複卡 2/10 → SSR
```

On confirm-ready rows, first show the automatic material summary and ask for explicit confirmation. The panel does not permit changing quantities.

- [ ] **Step 4: Mount it on the campaign map**

`CampaignGame` passes the controller into `LevelMap`. `LevelMap` places the panel after the chapter summary and before play-mode selection so it remains an auxiliary feature and does not replace the level grid.

- [ ] **Step 5: Add accessible behavior**

- Buttons have target-rarity labels.
- Disabled reasons are visible text.
- Success and failure use `aria-live="polite"`.
- Reduced motion removes upgrade animation but not saved state.
- Touch targets are at least 44px.

- [ ] **Step 6: Run UI contract, typecheck and build**

```bash
node --test tests/card-upgrade-ui-contract.test.mjs
npm run typecheck
npm run lint
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/app/cards/CardUpgradePanel.tsx src/app/cards/card-upgrade.css src/app/CampaignGame.tsx src/app/LevelMap.tsx src/app/LevelMap.css tests/card-upgrade-ui-contract.test.mjs
git commit -m "feat: add duplicate card upgrade panel"
```

---

### Task 7: Full Regression, Documentation and Audit

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `docs/superpowers/specs/README.md`
- Create: `docs/superpowers/reports/2026-08-08-duplicate-card-upgrade-delivery.md`

- [ ] **Step 1: Update permanent documentation**

Document exactly:

```text
10 duplicate N => 1 random R
10 duplicate R => 1 random SR
10 duplicate SR => 1 random SSR
one copy of every card ID is retained
materials combine across idioms and completed chapters
automatic order is duplicate count descending then card number ascending
results use completed content, allow duplicates and exclude UR
hidden score does not affect upgrades
```

- [ ] **Step 2: Run the complete verification gate**

```bash
npm install
./scripts/verify.sh
npm audit
```

Record current actual counts; do not reuse earlier CI numbers.

- [ ] **Step 3: Run upgrade-focused tests separately for audit evidence**

```bash
npm run compile:core
node --test \
  tests/card-upgrade-material-selector.test.mjs \
  tests/card-upgrade-pool.test.mjs \
  tests/card-upgrade-engine.test.mjs \
  tests/card-upgrade-service.test.mjs \
  tests/card-upgrade-hook-contract.test.mjs \
  tests/card-upgrade-ui-contract.test.mjs
```

- [ ] **Step 4: Write delivery and ChatGPT Audit evidence**

The report must include:

- RED and GREEN commands.
- Actual complete test counts.
- Deterministic selection example `5 + 3 + 2`.
- Retained-copy invariant evidence.
- Empty-target rollback evidence.
- Idempotent `upgradeId` replay evidence.
- Four-store transaction rollback evidence.
- TypeScript, ESLint, PWA build and npm audit results.

- [ ] **Step 5: Commit documentation**

```bash
git add README.md AGENTS.md docs/superpowers/specs/README.md docs/superpowers/reports/2026-08-08-duplicate-card-upgrade-delivery.md
git commit -m "docs: record duplicate card upgrade delivery"
```
