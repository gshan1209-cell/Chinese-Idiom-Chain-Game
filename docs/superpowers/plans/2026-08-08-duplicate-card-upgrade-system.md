# Duplicate Card Upgrade System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add deterministic automatic material selection and atomic 10：1 upgrades from N→R, R→SR and SR→SSR, using only duplicate copies and only target cards already encountered in completed main levels.

**Architecture:** Pure TypeScript modules select materials, build the target pool and resolve the weighted result. The Version 2 repository created by the per-level reward plan stores immutable acquisition history, consumed-copy counts and upgrade records in one transaction. React renders a compact campaign-map panel and never performs selection, deduction or randomness.

**Tech Stack:** TypeScript 6 strict, React 19, IndexedDB Version 2, Node `node:test`, Vite PWA, ESLint.

## Global Constraints

- Depends on `docs/superpowers/plans/2026-08-08-per-level-card-reward-hidden-score.md`.
- Fixed ratios: 10 N→1 R, 10 R→1 SR, 10 SR→1 SSR.
- Each card ID always retains at least one owned copy.
- Materials can mix different idioms and completed chapters, but never different rarities.
- Automatic order: consumable count descending, then canonical four-digit `cardNumber` ascending from `data/cards/card-number-registry.json`.
- Results use only target-rarity cards from completed main-level content.
- Results are weighted, fully random and may duplicate owned cards.
- SSR cannot upgrade; UR is neither material nor result.
- Empty target pool means no deduction and no record.
- Deduction, result acquisition, upgrade record and metadata update are one IndexedDB transaction.
- Hidden reward score does not affect upgrades.
- No new runtime dependency.

---

## File Structure

**Create**

- `src/cards/upgrade-material-selector.ts`
- `src/cards/upgrade-pool.ts`
- `src/cards/upgrade-engine.ts`
- `src/cards/upgrade-service.ts`
- `src/app/cards/CardUpgradePanel.tsx`
- `src/app/cards/card-upgrade.css`
- `tests/card-upgrade-material-selector.test.mjs`
- `tests/card-upgrade-pool.test.mjs`
- `tests/card-upgrade-engine.test.mjs`
- `tests/card-upgrade-service.test.mjs`
- `tests/card-upgrade-ui-contract.test.mjs`

**Modify**

- `src/cards/card-types.ts`
- `src/cards/inventory-engine.ts`
- `src/cards/collection-serialization.ts`
- `src/cards/indexeddb-collection-repository.ts`
- `src/app/use-card-collection.ts`
- `src/app/CampaignGame.tsx`
- `src/app/LevelMap.tsx`
- `src/app/LevelMap.css`
- `tests/card-inventory-engine.test.mjs`
- `tests/card-collection-serialization.test.mjs`
- `tests/card-indexeddb-collection-repository.test.mjs`

---

### Task 1: Add Safe Duplicate Consumption to Version 2 Inventory

**Files:**
- Modify: `src/cards/card-types.ts`
- Modify: `src/cards/inventory-engine.ts`
- Modify: `src/cards/collection-serialization.ts`
- Test: `tests/card-inventory-engine.test.mjs`
- Test: `tests/card-collection-serialization.test.mjs`

**Interfaces:**
- Produces: `PlayerCardInventoryItem.consumedCount: number`
- Produces: `consumableCount(item): number`
- Produces: `consumeCardCopies(inventory, materials): readonly PlayerCardInventoryItem[]`
- Invariant: `ownedCount + consumedCount === acquisitionHistory.length`

- [ ] **Step 1: Write failing compatibility tests**

```js
test('version one inventory migrates with zero consumed copies', () => {
  const item = parseCardCollectionState(versionOneState, NOW).inventory[0];
  assert.equal(item.consumedCount, 0);
});

test('early version two inventory without consumedCount remains valid', () => {
  const item = parseCardCollectionState(versionTwoBeforeUpgradeState, NOW).inventory[0];
  assert.equal(item.consumedCount, 0);
  assert.equal(item.ownedCount, 3);
});

test('new version two inventory preserves acquisition arithmetic', () => {
  const item = parseCardCollectionState(versionTwoConsumedState, NOW).inventory[0];
  assert.equal(item.ownedCount + item.consumedCount, item.acquisitionHistory.length);
});
```

- [ ] **Step 2: Run tests and verify RED**

```bash
npm run compile:core
node --test tests/card-inventory-engine.test.mjs tests/card-collection-serialization.test.mjs
```

Expected: FAIL because `consumedCount` and consumption functions do not exist.

- [ ] **Step 3: Add the inventory invariant**

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

`applyCardAcquisition` increments `ownedCount`, appends the acquisition and leaves `consumedCount` unchanged.

- [ ] **Step 4: Implement immutable consumption**

```ts
export function consumeCardCopies(
  inventory: readonly PlayerCardInventoryItem[],
  materials: readonly CardUpgradeMaterial[]
): readonly PlayerCardInventoryItem[] {
  const quantityById = new Map(materials.map((item) => [item.cardId, item.quantity]));
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

- [ ] **Step 5: Implement serialization compatibility**

Parsing rules:

```text
Version 1 inventory: consumedCount defaults to 0
Version 2 written before this plan: missing consumedCount defaults to 0
New Version 2 writes: consumedCount is required and serialized explicitly
ownedCount >= 1
consumedCount >= 0
ownedCount + consumedCount === acquisitionHistory.length
```

A malformed item is skipped individually; other valid inventory must remain.

- [ ] **Step 6: Run focused tests and commit**

```bash
npm run compile:core
node --test tests/card-inventory-engine.test.mjs tests/card-collection-serialization.test.mjs
git add src/cards/card-types.ts src/cards/inventory-engine.ts src/cards/collection-serialization.ts tests/card-inventory-engine.test.mjs tests/card-collection-serialization.test.mjs
git commit -m "feat: track consumed duplicate card copies"
```

---

### Task 2: Select Ten Materials Deterministically

**Files:**
- Create: `src/cards/upgrade-material-selector.ts`
- Test: `tests/card-upgrade-material-selector.test.mjs`

**Interfaces:**

```ts
export interface CardNumberReference {
  readonly cardId: string;
  readonly cardNumber: string;
  readonly rarity: 'N' | 'R' | 'SR' | 'SSR' | 'UR';
}

export interface UpgradeMaterialSelection {
  readonly status: 'ready' | 'insufficient';
  readonly sourceRarity: 'N' | 'R' | 'SR';
  readonly availableCount: number;
  readonly requiredCount: 10;
  readonly materials: readonly CardUpgradeMaterial[];
}
```

- [ ] **Step 1: Write failing selection tests**

```js
test('uses duplicate count descending and canonical card number ascending', () => {
  const result = selectUpgradeMaterials(
    inventory([
      ['card-3', 6],
      ['card-8', 4],
      ['card-1', 3],
      ['card-10', 3]
    ]),
    references([
      ['card-3', 'N-0003'],
      ['card-8', 'N-0008'],
      ['card-1', 'N-0001'],
      ['card-10', 'N-0010']
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
less than 10 is insufficient
exactly 10 is ready
last card is partially consumed when needed
same input produces the same frozen result
missing canonical card number is a blocking error
```

- [ ] **Step 2: Run and verify RED**

```bash
npm run compile:core
node --test tests/card-upgrade-material-selector.test.mjs
```

- [ ] **Step 3: Implement the selector**

```ts
const UPGRADE_COST = 10 as const;

const candidates = inventory
  .map((item) => ({ item, reference: referenceById.get(item.cardId) }))
  .filter(({ item, reference }) =>
    reference?.rarity === sourceRarity && consumableCount(item) > 0
  )
  .sort((left, right) =>
    consumableCount(right.item) - consumableCount(left.item) ||
    left.reference.cardNumber.localeCompare(right.reference.cardNumber)
  );
```

Take only the quantity needed to reach 10. Do not use acquisition time, object insertion order or RNG as a tiebreaker.

- [ ] **Step 4: Run focused tests and commit**

```bash
npm run compile:core
node --test tests/card-upgrade-material-selector.test.mjs
git add src/cards/upgrade-material-selector.ts tests/card-upgrade-material-selector.test.mjs
git commit -m "feat: select duplicate card materials deterministically"
```

---

### Task 3: Build the Completed-Content Target Pool

**Files:**
- Create: `src/cards/upgrade-pool.ts`
- Test: `tests/card-upgrade-pool.test.mjs`

**Interfaces:**

```ts
export function targetRarityFor(source: 'N' | 'R' | 'SR'): 'R' | 'SR' | 'SSR';
export function buildUpgradeTargetPool(input: UpgradeTargetPoolInput): readonly IdiomCardDefinition[];
```

- [ ] **Step 1: Write failing target tests**

```js
test('maps each source rarity to exactly one next rarity', () => {
  assert.equal(targetRarityFor('N'), 'R');
  assert.equal(targetRarityFor('R'), 'SR');
  assert.equal(targetRarityFor('SR'), 'SSR');
});
```

Cover:

```text
completed chapter one and chapter two idioms combine
uncompleted idioms are excluded
only the exact target rarity remains
UR, Review, Legacy and NeedsReview are excluded
owned target cards remain eligible
empty target rarity returns an empty pool
cards without upgrade-reward acquisition permission are excluded
```

- [ ] **Step 2: Run and verify RED**

```bash
npm run compile:core
node --test tests/card-upgrade-pool.test.mjs
```

- [ ] **Step 3: Implement exact-rarity filtering**

```ts
export function targetRarityFor(source: CardUpgradeSourceRarity): CardUpgradeTargetRarity {
  if (source === 'N') return 'R';
  if (source === 'R') return 'SR';
  return 'SSR';
}
```

Reuse the formal approval allowlist, then require:

```text
card.rarity === targetRarity
completedIdiomIds.has(card.idiomId)
card.acquisitionMethods includes upgrade-reward
```

- [ ] **Step 4: Run focused tests and commit**

```bash
npm run compile:core
node --test tests/card-upgrade-pool.test.mjs
git add src/cards/upgrade-pool.ts tests/card-upgrade-pool.test.mjs
git commit -m "feat: build completed-content upgrade pools"
```

---

### Task 4: Execute the Upgrade in One Transaction

**Files:**
- Create: `src/cards/upgrade-engine.ts`
- Create: `src/cards/upgrade-service.ts`
- Modify: `src/cards/indexeddb-collection-repository.ts`
- Test: `tests/card-upgrade-engine.test.mjs`
- Test: `tests/card-upgrade-service.test.mjs`
- Test: `tests/card-indexeddb-collection-repository.test.mjs`

**Interfaces:**

```ts
export function resolveUpgradeResult(
  pool: readonly IdiomCardDefinition[],
  random: RandomSource
): IdiomCardDefinition;

export function executeCardUpgrade(
  input: ExecuteCardUpgradeInput
): Promise<CardUpgradeExecutionResult>;
```

- [ ] **Step 1: Write failing engine tests**

```js
test('uses formal weights and permits an already-owned result', () => {
  const selected = resolveUpgradeResult(
    [{ id: 'r-1', weight: 1 }, { id: 'r-2', weight: 3 }],
    randomSequence([0.75])
  );
  assert.equal(selected.id, 'r-2');
});
```

Also test empty pool and RNG outside `[0, 1)`.

- [ ] **Step 2: Write failing transaction tests**

Cover:

```text
10 N duplicates consume exactly 10 and add one R
result may duplicate an owned target
empty target pool changes nothing
insufficient materials changes nothing
stale preview returns upgrade-material-conflict
same upgradeId replay returns the saved record without RNG or deduction
request failure rolls back inventory, upgrade record and metadata
```

- [ ] **Step 3: Run and verify RED**

```bash
npm run compile:core
node --test tests/card-upgrade-engine.test.mjs tests/card-upgrade-service.test.mjs tests/card-indexeddb-collection-repository.test.mjs
```

- [ ] **Step 4: Implement weighted selection**

Use one injected RNG value and cumulative formal weights. Never inspect inventory when selecting the result.

- [ ] **Step 5: Implement the transaction**

Inside `repository.transact`:

```text
return an existing upgrade with the same upgradeId
rebuild automatic materials from current inventory
compare rebuilt materials with the confirmed preview
build the current completed-content target pool
resolve one target card
consume 10 material copies
apply one upgrade-reward acquisition
append one immutable upgrade record
update metadata
```

Use:

```ts
const acquisitionId = `card-acquisition:${upgradeId}`;
```

The repository must read and write `grants`, `inventory`, `metadata` and `upgrades` in the same readwrite transaction.

- [ ] **Step 6: Run focused tests and commit**

```bash
npm run compile:core
node --test tests/card-upgrade-engine.test.mjs tests/card-upgrade-service.test.mjs tests/card-indexeddb-collection-repository.test.mjs
git add src/cards/upgrade-engine.ts src/cards/upgrade-service.ts src/cards/indexeddb-collection-repository.ts tests/card-upgrade-engine.test.mjs tests/card-upgrade-service.test.mjs tests/card-indexeddb-collection-repository.test.mjs
git commit -m "feat: execute atomic duplicate card upgrades"
```

---

### Task 5: Expose a Safe Hook Controller

**Files:**
- Modify: `src/app/use-card-collection.ts`
- Test: `tests/card-upgrade-hook-contract.test.mjs`

**Interfaces:**

```ts
upgradePreviews: Readonly<Record<'N' | 'R' | 'SR', UpgradePreview>>
executeUpgrade(sourceRarity: 'N' | 'R' | 'SR'): Promise<CardUpgradeExecutionResult>
```

- [ ] **Step 1: Write the hook contract test**

```js
test('exposes preview and execution without manual material editing', () => {
  const source = readFileSync(new URL('../src/app/use-card-collection.ts', import.meta.url), 'utf8');
  assert.match(source, /upgradePreviews/);
  assert.match(source, /executeUpgrade/);
  assert.doesNotMatch(source, /setUpgradeMaterials/);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/card-upgrade-hook-contract.test.mjs
```

- [ ] **Step 3: Extend the hook**

After every reward sync or upgrade:

```text
store the latest saved CardCollectionState
build N, R and SR previews from current inventory
read canonical four-digit card numbers from the generated registry adapter
use completed main-level idiom IDs for target pools
generate upgradeId only on confirmation
enqueue executeCardUpgrade through the existing write queue
replace local state with the transaction result
```

Do not return hidden reward score, ticket counts, roll values or manual material setters.

- [ ] **Step 4: Verify and commit**

```bash
node --test tests/card-upgrade-hook-contract.test.mjs
npm run typecheck
npm run test:cards
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
- Test: `tests/card-upgrade-ui-contract.test.mjs`

- [ ] **Step 1: Write failing UI contract tests**

```js
test('communicates automatic selection and retained copies', () => {
  const source = readFileSync(new URL('../src/app/cards/CardUpgradePanel.tsx', import.meta.url), 'utf8');
  assert.match(source, /每張卡至少保留 1 張/);
  assert.match(source, /系統自動選擇/);
  assert.doesNotMatch(source, /checkbox|radio/);
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/card-upgrade-ui-contract.test.mjs
```

- [ ] **Step 3: Implement the panel**

Render one row per source rarity:

```text
N 重複卡 7/10 → R
R 重複卡 10/10 → SR [合成]
SR 重複卡 2/10 → SSR
```

Ready rows show the automatic material summary before confirmation. There are only confirm and cancel actions.

- [ ] **Step 4: Mount it without replacing the main game**

`CampaignGame` passes the controller into `LevelMap`. `LevelMap` places the panel after the chapter summary and before play-mode selection. The level grid remains the primary action.

- [ ] **Step 5: Add accessibility**

```text
44px minimum touch targets
visible disabled reasons
aria-live polite result message
reduced-motion removes animation only
no hidden score or probability text
```

- [ ] **Step 6: Verify and commit**

```bash
node --test tests/card-upgrade-ui-contract.test.mjs
npm run typecheck
npm run lint
npm run build
git add src/app/cards/CardUpgradePanel.tsx src/app/cards/card-upgrade.css src/app/CampaignGame.tsx src/app/LevelMap.tsx src/app/LevelMap.css tests/card-upgrade-ui-contract.test.mjs
git commit -m "feat: add duplicate card upgrade panel"
```

---

### Task 7: Complete Regression and Audit

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `docs/superpowers/specs/README.md`
- Create: `docs/superpowers/reports/2026-08-08-duplicate-card-upgrade-delivery.md`

- [ ] **Step 1: Update permanent documentation**

Document:

```text
10 duplicate N => 1 random R
10 duplicate R => 1 random SR
10 duplicate SR => 1 random SSR
one copy of each card ID is retained
materials mix across idioms and completed chapters
automatic order uses duplicate count then canonical four-digit card number
results use completed content, allow duplicates and exclude UR
hidden score does not affect upgrades
```

- [ ] **Step 2: Run the full gate**

```bash
npm install
./scripts/verify.sh
npm audit
```

Record the actual current Node, card and puzzle test counts, TypeScript strict, ESLint, PWA build and audit result. Do not reuse earlier counts.

- [ ] **Step 3: Run focused audit tests**

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

- [ ] **Step 4: Write delivery evidence**

Record:

```text
RED and GREEN commands
actual complete test counts
deterministic 5+3+2 selection example
retained-copy invariant
Version 1 and early-Version 2 consumedCount compatibility
empty-target rollback
idempotent upgradeId replay
four-store transaction rollback
TypeScript, ESLint, PWA and npm audit results
```

- [ ] **Step 5: Commit documentation**

```bash
git add README.md AGENTS.md docs/superpowers/specs/README.md docs/superpowers/reports/2026-08-08-duplicate-card-upgrade-delivery.md
git commit -m "docs: record duplicate card upgrade delivery"
```
