# Per-Level Card Reward and Hidden Score Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace ten-level milestone grants with one idempotent reward per first-time main-level completion, including global 10／100-level rarity floors, hidden-score SR／SSR probabilities, and safe Version 1 → 2 collection migration.

**Architecture:** Keep all reward, score, pool and migration rules in pure TypeScript under `src/cards`. `PuzzleLevel` supplies immutable global ordering, while the generated card catalog supplies E–S difficulty. React only calls the collection service after progress persistence and renders saved outcomes. IndexedDB Version 2 preserves Version 1 data and adds an empty `upgrades` store for the dependent upgrade plan.

**Tech Stack:** TypeScript 6 strict, React 19, IndexedDB, Node `node:test`, Vite PWA, ESLint.

## Global Constraints

- Main gameplay remains the crossword campaign; this feature must not alter stars, unlocking, hints, mistakes, score, navigation, traps, classic chain, mole bonus, or media.
- `cicg-progress` remains Version 1 and must not receive card fields.
- `cicg-card-collection` upgrades to Version 2 with stores `grants`, `inventory`, `metadata`, `upgrades`.
- General levels use current-level idioms with minimum N; global multiples of 10 use completed-range R+; global multiples of 100 use completed-range SR+.
- Each first-time completed main level yields at most one reward; replay and star improvement yield none.
- Hidden score uses E=1, D=2, C=3, B=4, A=5, S=6 and never appears in player UI.
- `srTickets = min(hiddenRewardScore, 400)` and `ssrTickets = min(floor(hiddenRewardScore / 10), 100)` on a 1000-ticket roll.
- Fully random rewards allow duplicates; UR, Review, Legacy and NeedsReview cards never enter the pool.
- Reward result and probability snapshot must persist before reveal UI.
- No new runtime dependency.

---

## File Structure

**Create**

- `src/cards/hidden-reward-score.ts` — difficulty scoring, per-level score and cumulative score snapshots.
- `src/cards/level-reward-grants.ts` — per-level IDs, completed-level ordering, legacy coverage and missing grant creation.
- `src/cards/level-reward-pool.ts` — scope and minimum-rarity filtering.
- `tests/card-hidden-reward-score.test.mjs` — scoring and ticket boundaries.
- `tests/card-level-reward-grants.test.mjs` — one-grant-per-level and legacy migration behavior.
- `tests/card-level-reward-pool.test.mjs` — current-level and completed-range pools.

**Modify**

- `src/domain/puzzle.ts` — add immutable `campaignOrdinal`.
- `src/puzzle/levels.ts` — assign chapter-one ordinals 1–20.
- `src/cards/card-types.ts` — Version 2 grant, score snapshot, probability snapshot, acquisition and state types.
- `src/cards/card-pool.ts` — retain formal approval allowlist; delegate scope filtering to `level-reward-pool.ts`.
- `src/cards/reward-resolver.ts` — remove unowned preference and implement tier roll plus weighted same-rarity selection.
- `src/cards/collection-serialization.ts` — parse Version 1 legacy state and Version 2 per-level state without data loss.
- `src/cards/indexeddb-collection-repository.ts` — Version 2 open/migration and `upgrades` store.
- `src/cards/collection-service.ts` — synchronize per-level grants in ordinal order.
- `src/app/use-card-collection.ts` — pass levels, progress and card-catalog difficulty references.
- `src/app/CampaignGame.tsx` — retain save-first ordering and expose saved reward status only.
- `tests/puzzle-levels.test.mjs`
- `tests/card-reward-resolver.test.mjs`
- `tests/card-collection-serialization.test.mjs`
- `tests/card-indexeddb-collection-repository.test.mjs`
- `tests/card-collection-service.test.mjs`

---

### Task 1: Lock Global Level Identity and Difficulty Score Inputs

**Files:**
- Modify: `src/domain/puzzle.ts`
- Modify: `src/puzzle/levels.ts`
- Modify: `tests/puzzle-levels.test.mjs`
- Create: `src/cards/hidden-reward-score.ts`
- Create: `tests/card-hidden-reward-score.test.mjs`

**Interfaces:**
- Produces: `PuzzleLevel.campaignOrdinal: number`
- Produces: `scoreDifficulty(code: IdiomDifficultyGrade): number`
- Produces: `calculateLevelHiddenScore(level, difficultyById): number`
- Produces: `calculateCompletedScoreSnapshots(levels, completedLevelIds, difficultyById): ReadonlyMap<string, CardRewardScoreSnapshot>`

- [ ] **Step 1: Add failing ordinal tests**

```js
test('locks chapter-one global campaign ordinals to 1 through 20', () => {
  assert.deepEqual(
    PUZZLE_LEVELS.map((level) => level.campaignOrdinal),
    Array.from({ length: 20 }, (_, index) => index + 1)
  );
  assert.equal(new Set(PUZZLE_LEVELS.map((level) => level.campaignOrdinal)).size, 20);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm run compile:core && node --test tests/puzzle-levels.test.mjs`

Expected: FAIL because `campaignOrdinal` is missing.

- [ ] **Step 3: Add the domain field and chapter-one values**

```ts
export interface PuzzleLevel {
  readonly id: string;
  readonly chapterId: string;
  readonly levelNumber: number;
  readonly campaignOrdinal: number;
  // existing fields remain unchanged
}
```

In `makeLevel`:

```ts
campaignOrdinal: levelNumber,
```

- [ ] **Step 4: Add failing hidden-score tests**

```js
test('scores E through S as one through six', () => {
  assert.deepEqual(
    ['E', 'D', 'C', 'B', 'A', 'S'].map(scoreDifficulty),
    [1, 2, 3, 4, 5, 6]
  );
});

test('counts duplicate idiom ids once inside one level', () => {
  const level = {
    id: 'level-001', chapterId: 'chapter-1', levelNumber: 1, campaignOrdinal: 1,
    placements: [
      { idiomId: 'a' },
      { idiomId: 'b' },
      { idiomId: 'a' }
    ]
  };
  assert.equal(calculateLevelHiddenScore(level, new Map([['a', 'E'], ['b', 'E']])), 2);
});
```

- [ ] **Step 5: Run score tests and verify RED**

Run: `npm run compile:core && node --test tests/card-hidden-reward-score.test.mjs`

Expected: FAIL because the scoring module does not exist.

- [ ] **Step 6: Implement the pure scoring module**

```ts
const SCORE_BY_DIFFICULTY = Object.freeze({ E: 1, D: 2, C: 3, B: 4, A: 5, S: 6 });

export function scoreDifficulty(code: IdiomDifficultyGrade): number {
  return SCORE_BY_DIFFICULTY[code];
}

export function calculateLevelHiddenScore(
  level: Pick<PuzzleLevel, 'placements'>,
  difficultyById: ReadonlyMap<string, IdiomDifficultyGrade>
): number {
  const ids = new Set(level.placements.map((placement) => placement.idiomId));
  let total = 0;
  for (const idiomId of ids) {
    const difficulty = difficultyById.get(idiomId);
    if (difficulty === undefined) throw new Error(`missing-card-difficulty:${idiomId}`);
    total += scoreDifficulty(difficulty);
  }
  return total;
}
```

`calculateCompletedScoreSnapshots` must sort completed levels by `campaignOrdinal`, include every completed level in the running total, and freeze `{ levelHiddenScore, hiddenRewardScore }` by level ID.

- [ ] **Step 7: Run focused tests and commit**

Run:

```bash
npm run test:puzzle
npm run compile:core
node --test tests/card-hidden-reward-score.test.mjs
```

Commit:

```bash
git add src/domain/puzzle.ts src/puzzle/levels.ts src/cards/hidden-reward-score.ts tests/puzzle-levels.test.mjs tests/card-hidden-reward-score.test.mjs
git commit -m "feat: add campaign ordinals and hidden reward scores"
```

---

### Task 2: Define Version 2 Per-Level Grant Contracts

**Files:**
- Modify: `src/cards/card-types.ts`
- Create: `src/cards/level-reward-grants.ts`
- Modify: `src/cards/milestone-grants.ts`
- Create: `tests/card-level-reward-grants.test.mjs`

**Interfaces:**
- Produces: `CardRewardScoreSnapshot`
- Produces: `CardRewardProbabilitySnapshot`
- Produces: `CardLevelGrant`
- Produces: `levelRewardId(chapterId, levelNumber): string`
- Produces: `createMissingLevelGrants(input): readonly CardLevelGrant[]`
- Retains: legacy `milestoneRewardId` and parsing helpers for migration only.

- [ ] **Step 1: Write failing per-level ID and replay tests**

```js
test('creates one stable reward id per main level', () => {
  assert.equal(levelRewardId('chapter-1', 7), 'card-grant:main-level:chapter-1:7');
});

test('does not recreate an existing per-level grant', () => {
  const existing = [pendingLevelGrant('chapter-1', 1, 1, 2, 2)];
  assert.equal(createMissingLevelGrants({ completedLevels: [level1], existing, legacyGrants: [], scoreSnapshots }).length, 0);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npm run compile:core && node --test tests/card-level-reward-grants.test.mjs`

Expected: FAIL because per-level grant types and functions are absent.

- [ ] **Step 3: Replace the grant contract without deleting legacy support**

```ts
export interface CardRewardScoreSnapshot {
  readonly levelHiddenScore: number;
  readonly hiddenRewardScore: number;
}

export interface CardRewardProbabilitySnapshot {
  readonly srTickets: number;
  readonly ssrTickets: number;
  readonly baseTickets: number;
  readonly minimumRarity: 'N' | 'R' | 'SR';
  readonly rolledRarity: 'N' | 'R' | 'SR' | 'SSR';
  readonly resolvedRarity: 'N' | 'R' | 'SR' | 'SSR';
  readonly rollValue: number;
}

export interface CardLevelGrant {
  readonly rewardId: string;
  readonly chapterId: string;
  readonly levelNumber: number;
  readonly campaignOrdinal: number;
  readonly scoreSnapshot: CardRewardScoreSnapshot;
  readonly probabilitySnapshot: CardRewardProbabilitySnapshot | null;
  readonly status: 'pending' | 'resolved' | 'revealed';
  readonly createdAt: string;
  readonly resolvedAt: string | null;
  readonly revealedAt: string | null;
  readonly resolvedCardId: string | null;
  readonly acquisitionId: string | null;
  readonly legacyCoverage: boolean;
}
```

Set `CardAcquisitionRecord.method` to `'level-reward' | 'milestone-reward' | 'upgrade-reward'`.

- [ ] **Step 4: Implement missing-grant creation and legacy coverage**

Rules:

```text
legacy main-levels:10 covers campaignOrdinal 10
legacy main-levels:20 covers campaignOrdinal 20
all other completed ordinals receive per-level grants
```

The function must iterate completed levels by ordinal and must not infer completion from count alone.

- [ ] **Step 5: Add migration behavior tests**

```js
test('legacy milestone 10 covers only global ordinal 10', () => {
  const missing = createMissingLevelGrants({
    completedLevels: levels1Through10,
    existing: [],
    legacyGrants: [legacyGrant(10)],
    scoreSnapshots
  });
  assert.deepEqual(missing.map((grant) => grant.campaignOrdinal), [1,2,3,4,5,6,7,8,9]);
});
```

- [ ] **Step 6: Run focused tests and commit**

Run: `npm run compile:core && node --test tests/card-level-reward-grants.test.mjs`

Commit:

```bash
git add src/cards/card-types.ts src/cards/level-reward-grants.ts src/cards/milestone-grants.ts tests/card-level-reward-grants.test.mjs
git commit -m "feat: define per-level card grants"
```

---

### Task 3: Build Scoped Pools and Hidden-Tier Resolution

**Files:**
- Create: `src/cards/level-reward-pool.ts`
- Modify: `src/cards/card-pool.ts`
- Modify: `src/cards/reward-resolver.ts`
- Create: `tests/card-level-reward-pool.test.mjs`
- Modify: `tests/card-reward-resolver.test.mjs`

**Interfaces:**
- Produces: `minimumRarityForOrdinal(ordinal): 'N' | 'R' | 'SR'`
- Produces: `buildLevelRewardPool(input): readonly IdiomCardDefinition[]`
- Produces: `calculateRewardTickets(hiddenRewardScore): RewardTickets`
- Produces: `resolvePendingLevelGrant(grant, pool, random, now): CardRewardResolution`

- [ ] **Step 1: Write failing scope and floor tests**

```js
test('ordinary level uses only idioms from that level', () => {
  assert.deepEqual(buildLevelRewardPool(inputForOrdinal7).map((card) => card.id), ['card-a', 'card-b']);
});

test('global level 10 uses completed-range R plus', () => {
  assert.ok(buildLevelRewardPool(inputForOrdinal10).every((card) => ['R','SR','SSR'].includes(card.rarity)));
});

test('global level 100 uses completed-range SR plus', () => {
  assert.ok(buildLevelRewardPool(inputForOrdinal100).every((card) => ['SR','SSR'].includes(card.rarity)));
});
```

- [ ] **Step 2: Run pool tests and verify RED**

Run: `npm run compile:core && node --test tests/card-level-reward-pool.test.mjs`

- [ ] **Step 3: Implement formal allowlist plus level scoping**

`buildMilestoneCardPool` becomes a compatibility wrapper. The new pool builder first applies the existing approval allowlist, then filters by eligible idiom IDs and floor.

```ts
export function minimumRarityForOrdinal(ordinal: number): MinimumRewardRarity {
  if (ordinal % 100 === 0) return 'SR';
  if (ordinal % 10 === 0) return 'R';
  return 'N';
}
```

- [ ] **Step 4: Write ticket boundary tests**

```js
test('score 50 creates exactly 50 SR and 5 SSR tickets', () => {
  assert.deepEqual(calculateRewardTickets(50), {
    srTickets: 50,
    ssrTickets: 5,
    baseTickets: 945
  });
});

test('caps SR and SSR tickets', () => {
  assert.deepEqual(calculateRewardTickets(5000), {
    srTickets: 400,
    ssrTickets: 100,
    baseTickets: 500
  });
});
```

- [ ] **Step 5: Replace unowned-first resolution with rarity-first resolution**

```ts
export function calculateRewardTickets(hiddenRewardScore: number): RewardTickets {
  if (!Number.isInteger(hiddenRewardScore) || hiddenRewardScore < 0) {
    throw new Error('invalid-hidden-score');
  }
  const ssrTickets = Math.min(Math.floor(hiddenRewardScore / 10), 100);
  const srTickets = Math.min(hiddenRewardScore, 400);
  return Object.freeze({ ssrTickets, srTickets, baseTickets: 1000 - ssrTickets - srTickets });
}
```

Use one RNG value for `rollValue`. Resolve rarity by the ticket ranges, then descend `SSR → SR → R → N` without crossing the grant floor. Use a second injected RNG value for weighted card selection inside the resolved rarity. Do not inspect inventory when building candidates.

- [ ] **Step 6: Add exact resolution tests**

Cover:

```text
score 50 + roll 0.000 → SSR
score 50 + roll 0.005 → SR
score 50 + roll 0.055 → base
ordinal 10 base → R
ordinal 100 base → SR
missing SSR at ordinal 100 → SR
missing floor rarity → pending
owned card remains eligible
invalid RNG → no mutation
```

- [ ] **Step 7: Run focused tests and commit**

Run:

```bash
npm run compile:core
node --test tests/card-level-reward-pool.test.mjs tests/card-reward-resolver.test.mjs
```

Commit:

```bash
git add src/cards/level-reward-pool.ts src/cards/card-pool.ts src/cards/reward-resolver.ts tests/card-level-reward-pool.test.mjs tests/card-reward-resolver.test.mjs
git commit -m "feat: resolve hidden-score card rewards"
```

---

### Task 4: Migrate Collection Persistence to Version 2

**Files:**
- Modify: `src/cards/collection-serialization.ts`
- Modify: `src/cards/indexeddb-collection-repository.ts`
- Modify: `tests/card-collection-serialization.test.mjs`
- Modify: `tests/card-indexeddb-collection-repository.test.mjs`

**Interfaces:**
- Produces: `CardCollectionMetadata.schemaVersion: 2`
- Produces: `CardCollectionState.upgrades: readonly CardUpgradeRecord[]`
- Reads: legacy Version 1 milestone grants and acquisition records.
- Creates IndexedDB store: `upgrades`.

- [ ] **Step 1: Write failing Version 1 preservation tests**

```js
test('parses version-one milestone state into version-two state without dropping ownership', () => {
  const parsed = parseCardCollectionState(versionOneFixture, NOW);
  assert.equal(parsed.metadata.schemaVersion, 2);
  assert.equal(parsed.inventory[0].ownedCount, 1);
  assert.equal(parsed.grants[0].rewardId, 'card-grant:main-levels:10');
  assert.deepEqual(parsed.upgrades, []);
});
```

- [ ] **Step 2: Run serialization test and verify RED**

Run: `npm run compile:core && node --test tests/card-collection-serialization.test.mjs`

- [ ] **Step 3: Implement dual-version parsing**

Requirements:

- Version 1 accepts only the old milestone shape and `'milestone-reward'` acquisitions.
- Version 2 accepts legacy grants plus new per-level grants.
- Pending per-level grants require `scoreSnapshot` and `probabilitySnapshot: null`.
- Resolved per-level grants require an internally consistent probability snapshot and `'level-reward'` acquisition.
- Malformed individual entries are skipped without discarding other valid entries.
- Returned state is always frozen Version 2.

- [ ] **Step 4: Write failing IndexedDB upgrade tests**

```js
test('upgrades database version one to two and preserves three existing stores', async () => {
  const repository = createIndexedDbCardCollectionRepository(factory, NOW);
  const state = await repository.load();
  assert.equal(state.metadata.schemaVersion, 2);
  assert.equal(factory.database.objectStoreNames.contains('upgrades'), true);
});
```

- [ ] **Step 5: Upgrade the database**

```ts
const DATABASE_VERSION = 2;
const UPGRADES_STORE = 'upgrades';
const ALL_STORES = Object.freeze([
  GRANTS_STORE,
  INVENTORY_STORE,
  METADATA_STORE,
  UPGRADES_STORE
]);
```

Create only missing stores inside `onupgradeneeded`; never clear Version 1 stores during upgrade. Extend read and replacement functions to include upgrades.

- [ ] **Step 6: Run persistence tests and commit**

Run:

```bash
npm run compile:core
node --test tests/card-collection-serialization.test.mjs tests/card-indexeddb-collection-repository.test.mjs
```

Commit:

```bash
git add src/cards/collection-serialization.ts src/cards/indexeddb-collection-repository.ts tests/card-collection-serialization.test.mjs tests/card-indexeddb-collection-repository.test.mjs
git commit -m "feat: migrate card collection storage to version two"
```

---

### Task 5: Synchronize Rewards in Global Ordinal Order

**Files:**
- Modify: `src/cards/collection-service.ts`
- Modify: `tests/card-collection-service.test.mjs`

**Interfaces:**
- Consumes: `PuzzleLevel[]`, `CampaignProgress`, validated definitions, difficulty map and `RandomSource`.
- Produces: `syncCardCollectionLevelRewards(input): Promise<CardCollectionSyncResult>`.

- [ ] **Step 1: Write failing service tests**

Cover the following exact cases:

```text
first completion of level 1 creates and resolves one grant
repeat sync does not add a second grant or consume RNG
completed levels 1 and 2 create two grants in ordinal order
legacy grant 10 suppresses only per-level ordinal 10
pending empty-pool grants preserve score snapshots
resolved grant missing inventory is repaired without RNG
```

Example:

```js
test('syncs one grant for each completed level in ordinal order', async () => {
  const result = await syncCardCollectionLevelRewards(inputForCompletedLevels([1, 2]));
  assert.deepEqual(result.state.grants.map((grant) => grant.campaignOrdinal), [1, 2]);
  assert.equal(result.createdGrantCount, 2);
});
```

- [ ] **Step 2: Run service tests and verify RED**

Run: `npm run compile:core && node --test tests/card-collection-service.test.mjs`

- [ ] **Step 3: Implement the service orchestration**

Required sequence inside one repository transaction:

```text
validate card definitions
derive completed levels from progress and PUZZLE_LEVELS
calculate score snapshots in campaignOrdinal order
create missing per-level grants excluding legacy-covered ordinals
for each pending grant build its scoped pool
resolve and apply acquisition
repair resolved grants missing inventory
sort legacy grants first by their legacy count, then per-level grants by ordinal
return counts and findings
```

Do not use `completedUniqueMainLevels` as sufficient input; the service needs exact completed IDs.

- [ ] **Step 4: Run focused tests and commit**

Run: `npm run compile:core && node --test tests/card-collection-service.test.mjs`

Commit:

```bash
git add src/cards/collection-service.ts tests/card-collection-service.test.mjs
git commit -m "feat: sync one card reward per completed level"
```

---

### Task 6: Wire Save-First React Integration Without Exposing Hidden Data

**Files:**
- Modify: `src/app/use-card-collection.ts`
- Modify: `src/app/CampaignGame.tsx`
- Test: `tests/card-app-integration.test.mjs`

**Interfaces:**
- Produces from hook: `pendingGrantCount`, `latestResolvedGrantId`, `storageWarning`, `syncAfterProgressSaved`, `clearCollection`.
- Does not expose: hidden score, ticket counts or roll value.

- [ ] **Step 1: Add a source-level integration test**

```js
test('keeps progress persistence before collection synchronization', () => {
  const source = readFileSync(new URL('../src/app/CampaignGame.tsx', import.meta.url), 'utf8');
  assert.match(source, /completion\.persisted\s*\.then\(\(\) => cards\.syncAfterProgressSaved/);
});

test('does not return hidden score or probability from the hook', () => {
  const source = readFileSync(new URL('../src/app/use-card-collection.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /hiddenRewardScore\s*,/);
  assert.doesNotMatch(source, /ssrTickets\s*,/);
});
```

- [ ] **Step 2: Run and verify RED where signatures changed**

Run: `node --test tests/card-app-integration.test.mjs`

- [ ] **Step 3: Update the hook**

- Load active idioms only when validated card definitions are non-empty.
- Load the generated card-catalog difficulty mapping once and memoize it.
- Pass exact `progress`, `PUZZLE_LEVELS`, difficulty map and RNG into `syncCardCollectionLevelRewards`.
- Keep `COLLECTION_STORAGE_WARNING` unchanged.
- Return only display-safe state.

- [ ] **Step 4: Keep completion ordering unchanged**

`CampaignGame.completeLevel` must remain:

```ts
const completion = campaign.completeLevel(result);
void completion.persisted
  .then(() => cards.syncAfterProgressSaved(completion.progress))
  .catch(() => undefined);
```

- [ ] **Step 5: Run typecheck, focused tests and commit**

Run:

```bash
npm run typecheck
node --test tests/card-app-integration.test.mjs
npm run test:cards
```

Commit:

```bash
git add src/app/use-card-collection.ts src/app/CampaignGame.tsx tests/card-app-integration.test.mjs
git commit -m "feat: connect per-level card rewards after progress save"
```

---

### Task 7: Documentation, Full Regression and Audit Evidence

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `docs/superpowers/specs/README.md`
- Create: `docs/superpowers/reports/2026-08-08-per-level-card-reward-hidden-score-delivery.md`

**Interfaces:**
- Documents Version 2, per-level rewards, global floors, hidden probability privacy and legacy behavior.

- [ ] **Step 1: Update permanent documentation**

Required text facts:

```text
one first-completion reward per main level
global ordinal 10 => R+
global ordinal 100 => SR+
E/D/C/B/A/S => 1/2/3/4/5/6 hidden points
score 50 => SR 50/1000 and SSR 5/1000
hidden values are not displayed
cicg-card-collection Version 2
legacy ten-level grants are preserved and covered levels are not duplicated
```

- [ ] **Step 2: Run complete verification**

```bash
npm install
./scripts/verify.sh
npm audit
```

Expected:

```text
all Node tests pass
all card tests pass
all puzzle tests pass
TypeScript strict passes
ESLint passes
Vite PWA build passes
npm audit reports 0 vulnerabilities
```

Record actual counts from this run; do not reuse PR #44 counts.

- [ ] **Step 3: Inspect generated PWA output and Git status**

```bash
git status --short
find dist -maxdepth 2 -type f | sort
```

Confirm no untracked generated source data or accidental Drive assets are included.

- [ ] **Step 4: Write delivery and ChatGPT Audit evidence**

The report must list:

- RED and GREEN commands.
- Actual test counts.
- Version 1 migration fixture result.
- Score-50 probability test result.
- Ordinal 10 and 100 floor tests.
- Progress-save-before-collection evidence.
- Known limitation that formal card pool remains pending until card definitions are Approved.

- [ ] **Step 5: Commit documentation**

```bash
git add README.md AGENTS.md docs/superpowers/specs/README.md docs/superpowers/reports/2026-08-08-per-level-card-reward-hidden-score-delivery.md
git commit -m "docs: record per-level card reward delivery"
```
