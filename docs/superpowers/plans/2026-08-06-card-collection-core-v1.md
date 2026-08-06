# 收藏資料核心 v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立每十個不同主線關卡一筆、可補發、可重試、不可重複核發的成語圖卡收藏資料核心，並在正式卡池空白時安全保留 pending grant。

**Architecture:** 所有里程碑、卡池、解析與 inventory 規則放在 `src/cards/` 純 TypeScript 模組；React 只在闖關進度保存後呼叫收藏服務。收藏資料使用獨立 `cicg-card-collection` IndexedDB version 1，Repository 以單一 readwrite transaction 同步 grants、inventory 與 metadata，不修改 `cicg-progress` schema。

**Tech Stack:** TypeScript 6 strict、Node.js `node:test`、React 19、IndexedDB、Vite PWA、ESLint 10。

## Global Constraints

- 標準模式與主線填字仍是核心玩法；收藏不得改寫星級、關卡解鎖、智慧跳格、提示、錯誤或分數。
- `cicg-progress` 必須維持 database version `1`、store `campaigns`、key `chapter-1`。
- 新資料庫固定為 `cicg-card-collection` version `1`，stores 為 `grants`、`inventory`、`metadata`。
- `IdiomCardDefinition` 必須同時包含四筆逐字 `bopomofo` 與四筆小寫、帶聲調符號的 `pinyin`。
- `pinyin` 是唯一允許的正式拉丁發音欄位；數字聲調與其他未知羅馬拼音欄位一律拒絕。
- Review、Legacy、NeedsReview、未核准稀有度、遠端素材與模板空框不得進正式卡池。
- `UR` 僅保留給有正式授權證據的 IP 聯名，且不得進一般十關里程碑卡池。
- 首版 `IDIOM_CARD_DEFINITIONS` 必須保持空陣列。
- grant／inventory 未持久化成功前，任何 UI 不得宣稱玩家已取得圖卡。
- 不新增後端、登入、雲端同步、金流、付費隨機抽卡或廣告換卡。
- 所有 production 行為先建立可觀察 RED，再提交最小 GREEN，最後執行 `./scripts/verify.sh`。

---

## File Map

### New production files

- `src/cards/card-types.ts`：圖卡、grant、inventory、snapshot 與 Repository 型別。
- `src/cards/card-definitions.ts`：正式圖卡定義空陣列。
- `src/cards/card-definition-validator.ts`：嚴格 allowlist、發音、核准、來源、素材與權重驗證。
- `src/cards/card-pool.ts`：建立合法里程碑卡池並排除 UR。
- `src/cards/milestone-grants.ts`：完成關卡數、里程碑 ID、補發差集與 pending grant。
- `src/cards/reward-resolver.ts`：注入 RNG、未持有優先與加權解析。
- `src/cards/inventory-engine.ts`：冪等 acquisition 與 ownedCount 更新。
- `src/cards/collection-serialization.ts`：version 1 snapshot 嚴格解析與不可變複製。
- `src/cards/collection-repository.ts`：原子 transaction Repository 介面與記憶體實作。
- `src/cards/indexeddb-collection-repository.ts`：三 stores 的單一 IndexedDB transaction 實作。
- `src/cards/collection-write-queue.ts`：同一 App 內序列化寫入。
- `src/cards/collection-service.ts`：里程碑建立、pending 解析與持久化協調。
- `src/app/use-card-collection.ts`：載入／同步收藏狀態與保存警告。

### Modified production files

- `src/app/use-campaign-progress.ts`：提供可等待的進度保存結果，不改 `CampaignProgress`。
- `src/app/CampaignGame.tsx`：關卡完成後先保存進度，再同步收藏。
- `tsconfig.core.json`：確認 `src/cards/**/*.ts` 被核心測試編譯；若目前 include 已涵蓋 `src/**/*.ts` 則不修改。
- `package.json`：新增 `test:cards` 並納入完整 `test`。

### Test files

- `tests/card-definition-validator.test.mjs`
- `tests/card-milestone-grants.test.mjs`
- `tests/card-reward-resolver.test.mjs`
- `tests/card-inventory-engine.test.mjs`
- `tests/card-collection-serialization.test.mjs`
- `tests/card-collection-repository.test.mjs`
- `tests/card-collection-service.test.mjs`
- `tests/card-collection-integration.test.mjs`

---

### Task 1: 圖卡領域模型與正式定義 Gate

**Files:**
- Create: `src/cards/card-types.ts`
- Create: `src/cards/card-definitions.ts`
- Create: `src/cards/card-definition-validator.ts`
- Create: `src/cards/card-pool.ts`
- Create: `tests/card-definition-validator.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces:
  - `validateIdiomCardDefinitions(input, activeIdioms, at): CardDefinitionValidationResult`
  - `buildMilestoneCardPool(definitions): readonly IdiomCardDefinition[]`
  - `IDIOM_CARD_DEFINITIONS: readonly IdiomCardDefinition[]`

- [ ] **Step 1: Write the failing validator tests**

Create tests that import modules which do not yet exist and assert:

```js
const valid = {
  id: 'card-water-drops-stone',
  idiomId: 'idiom-water-drops-stone',
  title: '水滴石穿',
  bopomofo: ['ㄕㄨㄟˇ', 'ㄉㄧ', 'ㄕˊ', 'ㄔㄨㄢ'],
  pinyin: ['shuǐ', 'dī', 'shí', 'chuān'],
  subtitle: '持續累積，終能突破',
  rarity: 'SSR',
  difficulty: 'B',
  imageAsset: '/assets/cards/water-drops-stone.png',
  thumbnailAsset: '/assets/cards/water-drops-stone-thumb.png',
  storySummary: '水滴持續落下，終能穿石。',
  storySource: '《漢書》相關語意',
  motto: '日日不止，終有所成。',
  enabled: true,
  approvalStatus: 'Approved',
  sourceStatus: 'Approved',
  rarityApproved: true,
  releaseOrder: 1,
  startsAt: null,
  endsAt: null,
  acquisitionMethods: ['milestone-reward'],
  weight: 1,
  licenseEvidenceId: null
};
```

Assertions:

- valid N／R／SR／SSR card passes.
- missing one bopomofo or pinyin entry fails.
- `shui3`, `SHUǏ`, empty pinyin, unknown `romanization` and unknown fields fail.
- title not matching enabled idiom text fails.
- remote URL, `data:`, `blob:`, path traversal and non-card asset path fail.
- Review／Legacy／NeedsReview／unapproved rarity／zero or fractional weight fail.
- UR without license fails.
- UR with license may validate as a definition but is excluded from milestone pool.
- duplicate `id` fails.
- `IDIOM_CARD_DEFINITIONS` is exactly `[]`.

- [ ] **Step 2: Run RED**

Run:

```bash
npm run compile:core
node --test tests/card-definition-validator.test.mjs
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/cards/card-definition-validator`.

- [ ] **Step 3: Implement minimal domain types**

Define exact types:

```ts
export type CardRarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR';
export type IdiomDifficultyGrade = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
export type CardAcquisitionMethod =
  | 'milestone-reward'
  | 'achievement-reward'
  | 'direct-purchase'
  | 'fixed-bundle'
  | 'event-reward'
  | 'manual-grant';

export interface ActiveIdiomReference {
  readonly id: string;
  readonly text: string;
}

export interface IdiomCardDefinition {
  readonly id: string;
  readonly idiomId: string;
  readonly title: string;
  readonly bopomofo: readonly [string, string, string, string];
  readonly pinyin: readonly [string, string, string, string];
  readonly subtitle: string;
  readonly rarity: CardRarity;
  readonly difficulty: IdiomDifficultyGrade;
  readonly imageAsset: string;
  readonly thumbnailAsset: string;
  readonly storySummary: string;
  readonly storySource: string;
  readonly motto: string;
  readonly enabled: boolean;
  readonly approvalStatus: 'Approved' | 'Review' | 'Legacy' | 'Rejected';
  readonly sourceStatus: 'Approved' | 'NeedsReview' | 'Rejected';
  readonly rarityApproved: boolean;
  readonly releaseOrder: number;
  readonly startsAt: string | null;
  readonly endsAt: string | null;
  readonly acquisitionMethods: readonly CardAcquisitionMethod[];
  readonly weight: number;
  readonly licenseEvidenceId: string | null;
}

export interface CardDefinitionFinding {
  readonly index: number;
  readonly cardId: string | null;
  readonly code: string;
  readonly message: string;
}

export interface CardDefinitionValidationResult {
  readonly validDefinitions: readonly IdiomCardDefinition[];
  readonly findings: readonly CardDefinitionFinding[];
}
```

- [ ] **Step 4: Implement strict validation and pool filtering**

Use an exact allowed-key set. Validate arrays as exactly four strings. Validate pinyin with lowercase tone-mark letters only. Asset paths must start with `/assets/cards/`, reject `..`, protocols and HTML delimiters. Validate ISO windows against injected `at`.

`buildMilestoneCardPool()` must additionally require:

```ts
card.rarity !== 'UR' &&
card.enabled &&
card.approvalStatus === 'Approved' &&
card.sourceStatus === 'Approved' &&
card.rarityApproved &&
card.acquisitionMethods.includes('milestone-reward')
```

- [ ] **Step 5: Add test script and run GREEN**

Add:

```json
"test:cards": "npm run compile:core && node --test tests/card-*.test.mjs"
```

Insert `npm run test:cards` into the complete `test` chain.

Run:

```bash
npm run test:cards
npm run typecheck
npm run lint
```

Expected: all Task 1 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/cards tests/card-definition-validator.test.mjs package.json
git commit -m "feat: add approved idiom card definition gates"
```

---

### Task 2: 里程碑、補發、解析與 Inventory 冪等規則

**Files:**
- Create: `src/cards/milestone-grants.ts`
- Create: `src/cards/reward-resolver.ts`
- Create: `src/cards/inventory-engine.ts`
- Create: `tests/card-milestone-grants.test.mjs`
- Create: `tests/card-reward-resolver.test.mjs`
- Create: `tests/card-inventory-engine.test.mjs`

**Interfaces:**
- Consumes: `IdiomCardDefinition` from Task 1.
- Produces:
  - `countCompletedUniqueMainLevels(progress): number`
  - `createMissingMilestoneGrants(completedCount, existing, now): readonly CardMilestoneGrant[]`
  - `resolvePendingGrant(grant, pool, inventory, random, now): CardRewardResolution`
  - `applyCardAcquisition(inventory, cardId, record): readonly PlayerCardInventoryItem[]`

- [ ] **Step 1: Write milestone RED tests**

Tests must assert:

```js
assert.deepEqual(listMilestoneLevelCounts(9), []);
assert.deepEqual(listMilestoneLevelCounts(10), [10]);
assert.deepEqual(listMilestoneLevelCounts(20), [10, 20]);
```

Use a `CampaignProgress` fixture with repeated completions and higher stars to prove only distinct keys with `completed: true` count. Existing reward ID `card-grant:main-levels:10` must prevent duplicate creation.

- [ ] **Step 2: Run RED**

```bash
npm run compile:core
node --test tests/card-milestone-grants.test.mjs
```

Expected: module not found.

- [ ] **Step 3: Implement grant types and milestone functions**

Add to `card-types.ts`:

```ts
export type CardGrantStatus = 'pending' | 'resolved' | 'revealed';

export interface CardMilestoneGrant {
  readonly rewardId: string;
  readonly milestoneLevelCount: number;
  readonly status: CardGrantStatus;
  readonly createdAt: string;
  readonly resolvedAt: string | null;
  readonly revealedAt: string | null;
  readonly resolvedCardId: string | null;
  readonly acquisitionId: string | null;
}
```

Create fixed helpers:

```ts
milestoneRewardId(10) === 'card-grant:main-levels:10';
milestoneAcquisitionId(rewardId) === `card-acquisition:${rewardId}`;
```

- [ ] **Step 4: Write resolver and inventory RED tests**

Use deterministic RNG fixtures:

```js
const random = { next: () => 0 };
```

Assertions:

- empty pool returns unchanged pending grant and does not call RNG.
- unowned cards are selected before owned cards.
- weighted boundaries select deterministically.
- RNG `< 0`, `>= 1`, `NaN` or infinity returns an error result without resolving.
- resolved grant replay returns same card and does not call RNG.
- duplicate acquisition ID does not increase `ownedCount`.
- new acquisition creates count 1; later distinct acquisition increments count.

- [ ] **Step 5: Implement resolver and inventory engine**

Define:

```ts
export interface RandomSource { next(): number; }

export interface CardAcquisitionRecord {
  readonly acquisitionId: string;
  readonly method: 'milestone-reward';
  readonly acquiredAt: string;
  readonly sourceReference: string;
}

export interface PlayerCardInventoryItem {
  readonly cardId: string;
  readonly ownedCount: number;
  readonly firstOwnedAt: string;
  readonly lastOwnedAt: string;
  readonly acquisitionHistory: readonly CardAcquisitionRecord[];
}
```

Never call global `Math.random()` in core modules.

- [ ] **Step 6: Run GREEN and commit**

```bash
npm run test:cards
npm run typecheck
npm run lint
git add src/cards tests/card-*.test.mjs
git commit -m "feat: add idempotent card milestone rewards"
```

---

### Task 3: Snapshot 解析、記憶體 Repository 與寫入 Queue

**Files:**
- Create: `src/cards/collection-serialization.ts`
- Create: `src/cards/collection-repository.ts`
- Create: `src/cards/collection-write-queue.ts`
- Create: `tests/card-collection-serialization.test.mjs`
- Create: `tests/card-collection-repository.test.mjs`

**Interfaces:**
- Produces:
  - `createEmptyCardCollectionState(now): CardCollectionState`
  - `parseCardCollectionState(value, now): CardCollectionState`
  - `CardCollectionRepository.transact(operation)`
  - `createMemoryCardCollectionRepository(initial?)`
  - `createCollectionWriteQueue()`

- [ ] **Step 1: Write serialization RED tests**

Define snapshot:

```ts
export interface CardCollectionMetadata {
  readonly schemaVersion: 1;
  readonly updatedAt: string;
}

export interface CardCollectionState {
  readonly grants: readonly CardMilestoneGrant[];
  readonly inventory: readonly PlayerCardInventoryItem[];
  readonly metadata: CardCollectionMetadata;
}
```

Tests must reject or isolate duplicate reward IDs, duplicate card IDs, invalid state combinations, duplicate acquisition IDs and unknown schema versions. Returned arrays and nested records must be cloned/frozen so caller mutation cannot alter stored state.

- [ ] **Step 2: Run RED**

```bash
npm run compile:core
node --test tests/card-collection-serialization.test.mjs
```

- [ ] **Step 3: Implement strict parser and cloning**

Invalid entire top-level shapes return `createEmptyCardCollectionState(now)`. Invalid individual grant or inventory entries are excluded. `resolved` and `revealed` grants require non-null `resolvedCardId`, `acquisitionId` and `resolvedAt`; pending grants require all three to be null.

- [ ] **Step 4: Write Repository and queue RED tests**

Repository contract:

```ts
export interface CardCollectionTransactionResult<T> {
  readonly state: CardCollectionState;
  readonly value: T;
}

export interface CardCollectionRepository {
  load(): Promise<CardCollectionState>;
  transact<T>(
    operation: (current: CardCollectionState) => CardCollectionTransactionResult<T>
  ): Promise<T>;
  clear(now: string): Promise<void>;
}
```

Tests assert sequential operations, atomic exception behavior, cloned state and queue continuation after a failure.

- [ ] **Step 5: Implement memory Repository and queue**

The memory repository only replaces stored state after `operation` returns successfully. If it throws, stored state remains unchanged.

- [ ] **Step 6: Run GREEN and commit**

```bash
npm run test:cards
npm run typecheck
npm run lint
git add src/cards tests/card-collection-*.test.mjs
git commit -m "feat: add atomic card collection repository contracts"
```

---

### Task 4: IndexedDB 原子交易

**Files:**
- Create: `src/cards/indexeddb-collection-repository.ts`
- Extend: `tests/card-collection-repository.test.mjs`

**Interfaces:**
- Consumes: Repository contract from Task 3.
- Produces: `createIndexedDbCardCollectionRepository(factory, now): CardCollectionRepository`.

- [ ] **Step 1: Write IndexedDB source-contract RED tests**

Because Node does not provide browser IndexedDB, add architecture tests that read source and require exact constants:

```ts
const DATABASE_NAME = 'cicg-card-collection';
const DATABASE_VERSION = 1;
const GRANTS_STORE = 'grants';
const INVENTORY_STORE = 'inventory';
const METADATA_STORE = 'metadata';
const METADATA_KEY = 'collection';
```

Require a single `database.transaction([GRANTS_STORE, INVENTORY_STORE, METADATA_STORE], 'readwrite')` for `transact()`. Require `transaction.oncomplete` to resolve and `onerror`／`onabort` to reject. Assert source does not contain `cicg-progress` or version 2.

- [ ] **Step 2: Run RED**

```bash
npm run compile:core
node --test tests/card-collection-repository.test.mjs
```

Expected: indexed repository module missing.

- [ ] **Step 3: Implement IndexedDB Repository**

Open database version 1 and create three object stores during upgrade. For `transact()`:

1. Start one readwrite transaction across all stores.
2. Read grants, inventory and metadata within that transaction.
3. Parse and freeze current state.
4. Execute the synchronous operation exactly once.
5. Clear and repopulate grants／inventory, then put metadata under key `collection`.
6. Only resolve the operation value on `transaction.oncomplete`.
7. Close database on success, error or abort.

Do not `await` between transaction reads and writes; use request callbacks so the transaction remains active.

- [ ] **Step 4: Run GREEN and commit**

```bash
npm run test:cards
npm run typecheck
npm run lint
git add src/cards/indexeddb-collection-repository.ts tests/card-collection-repository.test.mjs
git commit -m "feat: persist card grants and inventory atomically"
```

---

### Task 5: 收藏同步服務與闖關安全整合

**Files:**
- Create: `src/cards/collection-service.ts`
- Create: `src/app/use-card-collection.ts`
- Create: `tests/card-collection-service.test.mjs`
- Create: `tests/card-collection-integration.test.mjs`
- Modify: `src/app/use-campaign-progress.ts`
- Modify: `src/app/CampaignGame.tsx`

**Interfaces:**
- Produces:
  - `syncCardCollectionMilestones(input): Promise<CardCollectionSyncResult>`
  - `useCardCollection(progress): { pendingGrantCount; storageWarning; syncAfterProgressSaved; clearCollection }`

- [ ] **Step 1: Write service RED tests**

Input:

```ts
export interface SyncCardCollectionInput {
  readonly repository: CardCollectionRepository;
  readonly completedUniqueMainLevels: number;
  readonly definitions: readonly IdiomCardDefinition[];
  readonly activeIdioms: readonly ActiveIdiomReference[];
  readonly random: RandomSource;
  readonly now: string;
}
```

Result:

```ts
export interface CardCollectionSyncResult {
  readonly state: CardCollectionState;
  readonly createdGrantCount: number;
  readonly resolvedGrantCount: number;
  readonly pendingGrantCount: number;
  readonly findings: readonly CardDefinitionFinding[];
}
```

Assertions:

- 9 levels creates no grant.
- 10 creates one pending grant with empty pool.
- 20 creates two pending grants.
- old-player sync creates missing 10／20 grants.
- repeated sync creates no duplicates.
- approved test pool resolves and applies inventory within one transaction.
- transaction failure rejects and leaves repository state unchanged.
- same reward replay does not consume RNG or increment inventory.

- [ ] **Step 2: Run RED**

```bash
npm run compile:core
node --test tests/card-collection-service.test.mjs
```

- [ ] **Step 3: Implement collection service**

Inside `repository.transact()`:

1. Create missing pending grants.
2. Validate definitions and build legal pool.
3. Resolve each pending grant in milestone order.
4. Apply acquisition immediately to the working inventory.
5. Return one updated immutable state.
6. Set metadata `updatedAt` to injected `now` only when state changed.

- [ ] **Step 4: Write React integration RED tests**

Static contract tests must require:

- `CampaignGame` creates and uses `useCardCollection`.
- `completeLevel` awaits or receives a promise representing progress save before calling `syncAfterProgressSaved`.
- collection failure is caught separately and never rolls back the already completed campaign progress.
- no card fields are added to `CampaignProgress`.
- `indexeddb-progress-repository.ts` still contains database version 1.

- [ ] **Step 5: Make campaign progress persistence awaitable**

Change `persist(next)` to return `Promise<void>` while keeping current UI state update immediate. `completeLevel(result)` returns:

```ts
{
  readonly progress: CampaignProgress;
  readonly persisted: Promise<void>;
}
```

Repository unavailable returns a rejected or resolved-with-warning promise chosen consistently by tests; campaign progress remains in memory either way.

- [ ] **Step 6: Implement `useCardCollection` and Campaign coordination**

`CampaignGame.completeLevel` flow:

```ts
const completion = campaign.completeLevel(result);
void completion.persisted.then(
  () => cards.syncAfterProgressSaved(completion.progress),
  () => undefined
);
```

If progress persistence fails, do not sync collection yet; next app load derives missing grants from persisted progress after progress storage recovers. Collection storage failure only sets a collection warning and does not alter campaign progress.

Use `IDIOM_CARD_DEFINITIONS` empty array and a browser RNG adapter outside the pure core. Core modules still never call `Math.random()`.

- [ ] **Step 7: Run GREEN and complete regression**

```bash
npm run test:cards
npm test
npm run typecheck
npm run lint
npm run build
npm audit --audit-level=high
```

Expected: all tests pass, production PWA builds, audit reports zero vulnerabilities.

- [ ] **Step 8: Commit**

```bash
git add src/cards src/app tests package.json
git commit -m "feat: synchronize card milestones after campaign saves"
```

---

### Task 6: Documentation, Audit and Merge Gate

**Files:**
- Modify: `README.md`
- Create: `docs/superpowers/reports/2026-08-06-card-collection-core-v1-delivery.md`
- Modify: `docs/superpowers/specs/2026-08-06-card-collection-core-v1-design.md` only if implementation evidence requires a non-behavioral correction.

- [ ] **Step 1: Update README with honest completion state**

Document:

- collection data core implemented.
- first chapter supports milestone grants at 10 and 20 distinct completed levels.
- official card pool is currently empty, so grants stay pending.
- collection page and reveal animation remain unimplemented.
- separate IndexedDB name/version/stores.

- [ ] **Step 2: Write delivery report**

Include exact RED／GREEN CI run numbers, final test counts, TypeScript, ESLint, build, PWA, audit, changed files, `behind_by`, review threads, Drive state and explicit out-of-scope items.

- [ ] **Step 3: Run final same-tree verification**

```bash
./scripts/verify.sh
npm audit --audit-level=high
```

Record only fresh output from the final HEAD.

- [ ] **Step 4: Audit scope**

Confirm no changes to:

```text
src/puzzle/levels.ts
src/puzzle/navigation.ts
src/game/**
src/bonus/**
src/media/**
data/idioms.source.csv
```

Confirm `src/domain/progress.ts` still has `schemaVersion: 1` with no card fields.

- [ ] **Step 5: PR finalization**

- synchronize latest `main` if `behind_by > 0`.
- re-run CI after synchronization.
- update PR body with evidence.
- verify unresolved review threads = 0.
- mark ready for review.
- Squash Merge using fixed expected HEAD SHA.

---

## Plan Self-Review

- Spec coverage: data model, pronunciation, pool gates, milestones, backfill, deterministic resolution, idempotent inventory, atomic persistence, multi-tab transaction, progress isolation, empty pool, errors and CI are each assigned to a task.
- Placeholder scan: no `TBD`, `TODO`, “similar to”, or unspecified validation steps remain.
- Type consistency: `CardCollectionState`, `CardCollectionRepository.transact`, `SyncCardCollectionInput` and fixed reward/acquisition IDs use one spelling throughout.
- Scope: collection page, card detail, reveal animation, approved production assets, purchase and cloud sync are excluded from this plan.

## Execution Decision

依本專案已確立的工作方式，採 **Inline Execution**：在同一個 PR #22 依 Task 1～6 分段 TDD 執行，每個 RED／GREEN 都保留 GitHub Actions 證據，完成後 ChatGPT Audit 與固定 HEAD Squash Merge。
