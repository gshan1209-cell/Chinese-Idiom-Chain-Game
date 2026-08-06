# 候選偽字陷阱模式 Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不修改既有關卡、星級、智慧跳格或 `cicg-progress` schema 的前提下，新增完成第 5 關後可選用的「候選偽字」陷阱模式。

**Architecture:** 陷阱資料與狀態集中於新的 `src/traps` 純 TypeScript 模組，完全不寫入 `PuzzleSession.values`、`tileByCell` 或合法候選字陣列。`CampaignGame` 管理本次遊玩的模式選擇，`usePuzzleGame` 只在合法字牌確實放入盤面後通知陷阱引擎推進；React 元件只呈現偽字、動畫、音效與點擊事件。

**Tech Stack:** React 19、TypeScript strict、Node test runner、CSS animations、Web Audio best-effort feedback、Vite PWA；不新增 runtime dependency、後端、登入或 IndexedDB schema。

## Global Constraints

- 標準模式永遠是預設，且不得產生任何陷阱。
- 「候選偽字」只有完成第一章第 5 關後才可選擇。
- 本階段只實作 `standard` 與 `trap-candidates`；`trap-board`、`trap-stubborn` 只保留型別與後續規格，不得提前實作。
- 候選偽字數量固定為 `clamp(ceil(fillableCellCount × 0.18), 1, 4)`；安全字不足時必須減少數量。
- 偽字只能來自本機已啟用成語字典，且不得出現在本關任何答案字元、合法候選字或同關其他偽字中。
- 插入門檻固定為：1 張 25%；2 張 20%、55%；3 張 15%、45%、70%；4 張 12%、35%、58%、78%。門檻以 `ceil(fillableCellCount × ratio)` 轉為合法放字次數，最低為 1。
- 只有成功放入可用合法字牌才推進門檻；點擊偽字、提示、移除、重排、清空及無效操作不得推進。
- 點擊偽字不得放入盤面、增加錯誤、扣分、增加提示、改變選取格、改變偏好 placement 或觸發智慧跳格。
- 偽字點擊後先進入 `ejecting`，動畫結束後才進入 `removed`。
- 陷阱不提供額外分數；標準模式與陷阱模式共用原星級規則。
- 不修改 `src/puzzle/levels.ts`、`src/progress/**`、`cicg-progress`、第一章 61 個成語唯一性或媒體功能。
- 所有 production 行為先寫失敗測試並確認 RED，再做最小 GREEN。

---

## File Structure

### Create

- `src/domain/trap.ts`：遊玩模式、候選偽字與陷阱 session 契約。
- `src/traps/trap-unlocks.ts`：依第一章完成紀錄判定模式是否解鎖。
- `src/traps/candidate-decoy-engine.ts`：安全字元、數量、門檻、啟動與驅逐純函式。
- `src/app/use-candidate-decoys.ts`：把字典載入結果與純引擎接到 React state。
- `src/app/CandidateDecoyTile.tsx`：候選偽字按鈕、動畫結束通知與無障礙標示。
- `src/app/trap-feedback.ts`：玩家主動點擊時的短促 Web Audio 回饋；失敗時靜默降級。
- `tests/trap-unlocks.test.mjs`：模式解鎖永久 Gate。
- `tests/candidate-decoy-engine.test.mjs`：安全生成、門檻與驅逐永久 Gate。
- `tests/candidate-decoy-ui-contract.test.mjs`：架構、事件隔離與 reduced-motion 契約。

### Modify

- `src/app/CampaignGame.tsx`：保存本次模式並傳入地圖與關卡。
- `src/app/LevelMap.tsx`：顯示標準／候選偽字模式選擇與鎖定原因。
- `src/app/PuzzleGame.tsx`：顯示模式標籤並把偽字混入候選區呈現。
- `src/app/use-puzzle-game.ts`：合法放字成功後才推進陷阱；公開偽字操作。
- `src/app/PuzzleGame.css`：偽字露餡、飛出、觸控尺寸與 reduced-motion。
- `package.json`：新增 `test:traps` 並納入完整 `test`。
- `tsconfig.core.json`：把 `src/traps/**/*.ts` 納入核心編譯。
- `README.md`：記錄可選陷阱模式、解鎖條件與公平規則。

---

### Task 1: 遊玩模式型別與解鎖 Gate

**Files:**
- Create: `src/domain/trap.ts`
- Create: `src/traps/trap-unlocks.ts`
- Create: `tests/trap-unlocks.test.mjs`
- Modify: `tsconfig.core.json`
- Modify: `package.json`

**Interfaces:**
- Consumes: `CampaignProgress` from `src/domain/progress.ts`。
- Produces: `PuzzlePlayMode`、`isPuzzlePlayModeUnlocked(progress, mode)`、`getPuzzlePlayModeLockReason(progress, mode)`。

- [ ] **Step 1: Write the failing unlock tests**

```js
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getPuzzlePlayModeLockReason,
  isPuzzlePlayModeUnlocked
} from '../.test-dist/src/traps/trap-unlocks.js';

function progressWithCompletedLevels(levelNumbers) {
  const levelProgressById = Object.fromEntries(levelNumbers.map((levelNumber) => [
    `level-${String(levelNumber).padStart(3, '0')}`,
    {
      levelId: `level-${String(levelNumber).padStart(3, '0')}`,
      completed: true,
      stars: 1,
      bestScore: 0,
      bestMistakes: 0,
      bestHintsUsed: 0,
      completionCount: 1,
      firstCompletedAt: '2026-08-06T00:00:00.000Z',
      lastCompletedAt: '2026-08-06T00:00:00.000Z'
    }
  ]));
  return {
    schemaVersion: 1,
    campaignId: 'chapter-1',
    highestUnlockedLevel: Math.max(1, ...levelNumbers.map((value) => value + 1)),
    lastPlayedLevel: 1,
    levelProgressById,
    updatedAt: '2026-08-06T00:00:00.000Z'
  };
}

test('standard mode is always unlocked', () => {
  assert.equal(isPuzzlePlayModeUnlocked(progressWithCompletedLevels([]), 'standard'), true);
});

test('candidate traps unlock only after level five is completed', () => {
  assert.equal(isPuzzlePlayModeUnlocked(progressWithCompletedLevels([1, 2, 3, 4]), 'trap-candidates'), false);
  assert.equal(isPuzzlePlayModeUnlocked(progressWithCompletedLevels([1, 2, 3, 4, 5]), 'trap-candidates'), true);
});

test('locked mode exposes a Traditional Chinese reason', () => {
  assert.equal(
    getPuzzlePlayModeLockReason(progressWithCompletedLevels([]), 'trap-candidates'),
    '完成第 5 關後解鎖候選偽字。'
  );
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `npm run compile:core && node --test tests/trap-unlocks.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/traps/trap-unlocks`.

- [ ] **Step 3: Add the domain contracts**

```ts
export type PuzzlePlayMode =
  | 'standard'
  | 'trap-candidates'
  | 'trap-board'
  | 'trap-stubborn';

export type CandidateDecoyStatus = 'scheduled' | 'active' | 'ejecting' | 'removed';

export interface CandidateDecoy {
  readonly id: string;
  readonly character: string;
  readonly activationAfterValidPlacements: number;
  readonly status: CandidateDecoyStatus;
}

export interface CandidateDecoySession {
  readonly levelId: string;
  readonly mode: PuzzlePlayMode;
  readonly validPlacements: number;
  readonly decoys: readonly CandidateDecoy[];
}
```

- [ ] **Step 4: Implement unlock rules without touching progress schema**

```ts
import type { CampaignProgress } from '../domain/progress.js';
import type { PuzzlePlayMode } from '../domain/trap.js';

const REQUIRED_LEVEL = Object.freeze({
  'trap-candidates': 5,
  'trap-board': 10,
  'trap-stubborn': 15
} as const);

export function isPuzzlePlayModeUnlocked(
  progress: CampaignProgress,
  mode: PuzzlePlayMode
): boolean {
  if (mode === 'standard') return true;
  const requiredLevel = REQUIRED_LEVEL[mode];
  const levelId = `level-${String(requiredLevel).padStart(3, '0')}`;
  return progress.levelProgressById[levelId]?.completed === true;
}

export function getPuzzlePlayModeLockReason(
  progress: CampaignProgress,
  mode: PuzzlePlayMode
): string | null {
  if (isPuzzlePlayModeUnlocked(progress, mode)) return null;
  const requiredLevel = REQUIRED_LEVEL[mode];
  const label = mode === 'trap-candidates'
    ? '候選偽字'
    : mode === 'trap-board'
      ? '盤面伏字'
      : '頑固伏字';
  return `完成第 ${String(requiredLevel)} 關後解鎖${label}。`;
}
```

- [ ] **Step 5: Wire the core compiler and test script**

Add `src/traps/**/*.ts` to `tsconfig.core.json` and add:

```json
"test:traps": "npm run compile:core && node --test tests/trap-*.test.mjs tests/candidate-decoy-*.test.mjs"
```

Insert `npm run test:traps` into the main `test` script before UI-independent bonus tests.

- [ ] **Step 6: Run GREEN and commit**

Run: `npm run test:traps && npm run typecheck && npm run lint`

Expected: unlock tests PASS; TypeScript and ESLint PASS.

```bash
git add src/domain/trap.ts src/traps/trap-unlocks.ts tests/trap-unlocks.test.mjs tsconfig.core.json package.json
git commit -m "feat: define trap play modes and unlock rules"
```

---

### Task 2: 安全候選偽字規劃引擎

**Files:**
- Create: `src/traps/candidate-decoy-engine.ts`
- Create: `tests/candidate-decoy-engine.test.mjs`

**Interfaces:**
- Consumes: `PuzzleBoard`、`Idiom`、`PuzzlePlayMode`。
- Produces: `createCandidateDecoySession(options)`、`candidateDecoyCount(fillableCellCount)`、`candidateDecoyActivationThresholds(total, fillableCellCount)`。

- [ ] **Step 1: Write failing generation tests**

Tests must construct a small board through the existing `buildPuzzleBoard()` and verify:

```js
test('uses the fixed eighteen-percent count with a one-to-four clamp', () => {
  assert.equal(candidateDecoyCount(1), 1);
  assert.equal(candidateDecoyCount(10), 2);
  assert.equal(candidateDecoyCount(17), 4);
  assert.equal(candidateDecoyCount(100), 4);
});

test('standard mode creates no decoys', () => {
  const session = createCandidateDecoySession({
    board,
    idioms,
    mode: 'standard',
    orderCharacters: (characters) => characters
  });
  assert.deepEqual(session.decoys, []);
});

test('filters disabled idioms, level answers, legal candidates and duplicates', () => {
  const session = createCandidateDecoySession({
    board,
    idioms: [
      enabledIdiom('safe-1', '春夏秋冬'),
      enabledIdiom('answer', board.level.placements[0].text),
      disabledIdiom('disabled', '東南西北')
    ],
    mode: 'trap-candidates',
    orderCharacters: (characters) => characters
  });
  const levelCharacters = new Set(board.level.placements.flatMap((placement) => [...placement.text]));
  assert.equal(session.decoys.every((decoy) => !levelCharacters.has(decoy.character)), true);
  assert.equal(new Set(session.decoys.map((decoy) => decoy.character)).size, session.decoys.length);
});

test('reduces decoy count when safe characters are insufficient', () => {
  const session = createCandidateDecoySession({
    board,
    idioms: [enabledIdiom('one-safe', '春春春春')],
    mode: 'trap-candidates',
    orderCharacters: (characters) => characters
  });
  assert.equal(session.decoys.length, 1);
});
```

- [ ] **Step 2: Run the focused tests and confirm RED**

Run: `npm run compile:core && node --test tests/candidate-decoy-engine.test.mjs`

Expected: FAIL because `candidate-decoy-engine` does not exist.

- [ ] **Step 3: Implement count and threshold helpers**

```ts
const THRESHOLD_RATIOS = Object.freeze({
  1: [0.25],
  2: [0.2, 0.55],
  3: [0.15, 0.45, 0.7],
  4: [0.12, 0.35, 0.58, 0.78]
} as const);

export function candidateDecoyCount(fillableCellCount: number): number {
  if (!Number.isInteger(fillableCellCount) || fillableCellCount < 1) return 0;
  return Math.min(4, Math.max(1, Math.ceil(fillableCellCount * 0.18)));
}

export function candidateDecoyActivationThresholds(
  total: number,
  fillableCellCount: number
): readonly number[] {
  if (total < 1 || total > 4) return Object.freeze([]);
  const ratios = THRESHOLD_RATIOS[total as 1 | 2 | 3 | 4];
  return Object.freeze(ratios.map((ratio) => Math.max(1, Math.ceil(fillableCellCount * ratio))));
}
```

- [ ] **Step 4: Implement safe character selection and immutable session creation**

`createCandidateDecoySession()` must:

1. Return zero decoys for `standard`.
2. Read only `idiom.enabled === true` entries.
3. Convert every enabled idiom to individual Han characters.
4. Remove every character found in `board.cells` answers and `board.candidateCharacters`.
5. De-duplicate before ordering.
6. Validate that the injected orderer returns only unique members of the safe input.
7. Take at most the calculated count.
8. Assign IDs `candidate-decoy-1`, `candidate-decoy-2`, etc.
9. Mark a decoy `active` when its threshold is already less than or equal to `validPlacements`; otherwise mark it `scheduled`.
10. Freeze the session, decoy array and every decoy object.

Use this exact signature:

```ts
export type CharacterOrderer = (
  characters: readonly string[]
) => readonly string[];

export interface CreateCandidateDecoySessionOptions {
  readonly board: PuzzleBoard;
  readonly idioms: readonly Idiom[];
  readonly mode: PuzzlePlayMode;
  readonly orderCharacters: CharacterOrderer;
  readonly validPlacements?: number;
}

export function createCandidateDecoySession(
  options: CreateCandidateDecoySessionOptions
): CandidateDecoySession;
```

- [ ] **Step 5: Run GREEN and commit**

Run: `npm run test:traps && npm run typecheck && npm run lint`

Expected: generation tests PASS with no mutation or unsafe character leaks.

```bash
git add src/traps/candidate-decoy-engine.ts tests/candidate-decoy-engine.test.mjs
git commit -m "feat: plan safe candidate decoy traps"
```

---

### Task 3: 合法操作門檻與驅逐狀態機

**Files:**
- Modify: `src/traps/candidate-decoy-engine.ts`
- Modify: `tests/candidate-decoy-engine.test.mjs`

**Interfaces:**
- Produces: `recordValidCandidatePlacement(session)`、`beginCandidateDecoyEjection(session, id)`、`completeCandidateDecoyEjection(session, id)`、`getVisibleCandidateDecoys(session)`。

- [ ] **Step 1: Add failing lifecycle tests**

```js
test('only valid placement recording advances thresholds', () => {
  const initial = createFourDecoySession();
  const afterOne = recordValidCandidatePlacement(initial);
  assert.equal(afterOne.validPlacements, 1);
  assert.equal(afterOne.decoys.filter((decoy) => decoy.status === 'active').length, 0);

  let current = afterOne;
  while (current.validPlacements < initial.decoys[0].activationAfterValidPlacements) {
    current = recordValidCandidatePlacement(current);
  }
  assert.equal(current.decoys[0].status, 'active');
});

test('ejection is idempotent and requires animation completion', () => {
  const active = sessionWithActiveDecoy();
  const ejecting = beginCandidateDecoyEjection(active, active.decoys[0].id);
  assert.equal(ejecting.decoys[0].status, 'ejecting');
  assert.strictEqual(beginCandidateDecoyEjection(ejecting, active.decoys[0].id), ejecting);
  const removed = completeCandidateDecoyEjection(ejecting, active.decoys[0].id);
  assert.equal(removed.decoys[0].status, 'removed');
});

test('visible decoys include active and ejecting but never scheduled or removed', () => {
  assert.deepEqual(
    getVisibleCandidateDecoys(mixedStatusSession()).map((decoy) => decoy.status),
    ['active', 'ejecting']
  );
});
```

- [ ] **Step 2: Run and confirm RED**

Run: `npm run test:traps`

Expected: FAIL because lifecycle exports are missing.

- [ ] **Step 3: Implement minimal immutable transitions**

```ts
export function recordValidCandidatePlacement(
  session: CandidateDecoySession
): CandidateDecoySession {
  if (session.mode === 'standard') return session;
  const validPlacements = session.validPlacements + 1;
  const decoys = session.decoys.map((decoy) =>
    decoy.status === 'scheduled' &&
    decoy.activationAfterValidPlacements <= validPlacements
      ? Object.freeze({ ...decoy, status: 'active' as const })
      : decoy
  );
  return Object.freeze({ ...session, validPlacements, decoys: Object.freeze(decoys) });
}
```

`beginCandidateDecoyEjection()` must only transition `active → ejecting`; `completeCandidateDecoyEjection()` must only transition `ejecting → removed`. Invalid IDs and repeated calls must return the same object reference.

- [ ] **Step 4: Run GREEN and commit**

Run: `npm run test:traps && npm run typecheck && npm run lint`

```bash
git add src/traps/candidate-decoy-engine.ts tests/candidate-decoy-engine.test.mjs
git commit -m "feat: add candidate decoy lifecycle"
```

---

### Task 4: React trap controller without puzzle-state coupling

**Files:**
- Create: `src/app/use-candidate-decoys.ts`
- Modify: `src/app/use-puzzle-game.ts`
- Create: `tests/candidate-decoy-ui-contract.test.mjs`

**Interfaces:**
- Consumes: current `PuzzleBoard`, selected `PuzzlePlayMode`, and loaded local dictionary idioms.
- Produces from `usePuzzleGame`: `playMode`、`candidateDecoys`、`chooseCandidateDecoy(id)`、`finishCandidateDecoyEjection(id)`。

- [ ] **Step 1: Write failing architecture contract tests**

The contract test must read source files and assert:

```js
test('candidate decoys remain outside PuzzleSession and puzzle engine', async () => {
  const domainPuzzle = await read('src/domain/puzzle.ts');
  const puzzleEngine = await read('src/puzzle/puzzle-engine.ts');
  assert.equal(domainPuzzle.includes('CandidateDecoy'), false);
  assert.equal(puzzleEngine.includes('candidate-decoy'), false);
});

test('only a changed puzzle session records a valid trap placement', async () => {
  const hook = await read('src/app/use-puzzle-game.ts');
  assert.match(hook, /result\.session !== current/);
  assert.match(hook, /recordValidPlacement\(\)/);
});

test('decoy clicks do not call placePuzzleTile or selectPuzzleCell', async () => {
  const hook = await read('src/app/use-puzzle-game.ts');
  const decoyHandler = hook.slice(hook.indexOf('chooseCandidateDecoy'));
  assert.equal(decoyHandler.includes('placePuzzleTile('), false);
  assert.equal(decoyHandler.includes('selectPuzzleCell('), false);
});
```

- [ ] **Step 2: Run and confirm RED**

Run: `npm run test:traps`

Expected: UI contract tests FAIL because the hook and integration do not exist.

- [ ] **Step 3: Implement `useCandidateDecoys`**

Use this public shape:

```ts
export interface UseCandidateDecoysOptions {
  readonly board: PuzzleBoard;
  readonly mode: PuzzlePlayMode;
  readonly idioms: readonly Idiom[];
}

export function useCandidateDecoys(options: UseCandidateDecoysOptions) {
  return {
    session,
    visibleDecoys: getVisibleCandidateDecoys(session),
    recordValidPlacement,
    beginEjection,
    completeEjection
  };
}
```

The hook must rebuild with `validPlacements = 0` when `board.level.id` or `mode` changes, but preserve the current valid placement count when the dictionary changes from empty to loaded for the same level and mode. Use a local Fisher–Yates character orderer; randomness remains outside the pure engine.

- [ ] **Step 4: Extend `usePuzzleGame`**

Change the signature to:

```ts
export function usePuzzleGame(
  initialLevelNumber = 1,
  playMode: PuzzlePlayMode = 'standard'
)
```

Keep the loaded dictionary payload as `readonly Idiom[]`, pass it to `useCandidateDecoys`, and in `chooseTile` call `recordValidPlacement()` only when `result.session !== current`. The decoy handler must only call `beginEjection(id)`, set neutral feedback such as `抓到偽字了！`, and leave `PuzzleSession` untouched.

- [ ] **Step 5: Run GREEN and commit**

Run: `npm run test:traps && npm run test:puzzle && npm run typecheck && npm run lint`

```bash
git add src/app/use-candidate-decoys.ts src/app/use-puzzle-game.ts tests/candidate-decoy-ui-contract.test.mjs
git commit -m "feat: connect candidate traps without mutating puzzle state"
```

---

### Task 5: 模式選擇、偽字 UI 與安全回饋

**Files:**
- Create: `src/app/CandidateDecoyTile.tsx`
- Create: `src/app/trap-feedback.ts`
- Modify: `src/app/CampaignGame.tsx`
- Modify: `src/app/LevelMap.tsx`
- Modify: `src/app/PuzzleGame.tsx`
- Modify: `src/app/PuzzleGame.css`
- Modify: `tests/candidate-decoy-ui-contract.test.mjs`

**Interfaces:**
- `CampaignGame` owns `playMode` state, defaulting to `standard`.
- `LevelMap` receives `selectedPlayMode` and `onPlayModeChange`.
- `PuzzleGame` receives `playMode` and passes it to `usePuzzleGame`.

- [ ] **Step 1: Add failing UI contract tests**

```js
test('campaign defaults to standard and passes the selected mode to map and puzzle', async () => {
  const source = await read('src/app/CampaignGame.tsx');
  assert.match(source, /useState<PuzzlePlayMode>\('standard'\)/);
  assert.match(source, /selectedPlayMode=\{playMode\}/);
  assert.match(source, /playMode=\{playMode\}/);
});

test('candidate tile completes removal only after animation end', async () => {
  const source = await read('src/app/CandidateDecoyTile.tsx');
  assert.match(source, /onAnimationEnd/);
  assert.match(source, /onEjectionComplete/);
});

test('reduced motion has a non-moving decoy treatment', async () => {
  const css = await read('src/app/PuzzleGame.css');
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /candidate-decoy/);
});
```

- [ ] **Step 2: Run and confirm RED**

Run: `npm run test:traps`

Expected: FAIL because UI component, mode props and CSS do not exist.

- [ ] **Step 3: Add mode selection to the map**

`CampaignGame` must reset the selected mode to `standard` when progress reset makes the current mode unavailable. `LevelMap` displays two large buttons:

- `標準模式` — always enabled and marked as recommended default.
- `候選偽字` — enabled only when `isPuzzlePlayModeUnlocked(progress, 'trap-candidates')` is true; otherwise disabled and shows `完成第 5 關後解鎖候選偽字。`.

The map must not expose board or stubborn modes in Phase 1.

- [ ] **Step 4: Add the candidate tile component**

```tsx
export interface CandidateDecoyTileProps {
  readonly decoy: CandidateDecoy;
  readonly onChoose: (id: string) => void;
  readonly onEjectionComplete: (id: string) => void;
}

export function CandidateDecoyTile({
  decoy,
  onChoose,
  onEjectionComplete
}: CandidateDecoyTileProps) {
  return (
    <button
      className={`candidate-tile candidate-decoy ${decoy.status}`}
      type="button"
      disabled={decoy.status === 'ejecting'}
      aria-label={`陷阱字 ${decoy.character}，點擊踢出`}
      onClick={() => onChoose(decoy.id)}
      onAnimationEnd={() => {
        if (decoy.status === 'ejecting') onEjectionComplete(decoy.id);
      }}
    >
      {decoy.character}
    </button>
  );
}
```

- [ ] **Step 5: Add best-effort click feedback**

`playCandidateDecoyEjectFeedback()` may create a short Web Audio oscillator only from the direct click handler. It must catch all construction, resume, scheduling and close failures, and must never reject or block the game. Do not add remote audio files or autoplay.

- [ ] **Step 6: Render legal tiles and decoys without changing legal tile data**

`PuzzleGame` keeps the existing `game.session.tiles.map(...)` unchanged and appends `game.candidateDecoys.map(...)` as separate `CandidateDecoyTile` components. The status area shows either `標準模式` or `候選偽字模式`; no score multiplier or star change is displayed.

- [ ] **Step 7: Add accessible animation CSS**

Required behavior:

- `active` decoys use a low-frequency subtle border pulse or small shake that exposes them without making text unreadable.
- `ejecting` decoys use a single 220–320ms translate/rotate/fade animation.
- Buttons retain the existing minimum touch target.
- `@media (prefers-reduced-motion: reduce)` disables shake/flight and uses opacity plus a dashed border change; the component still fires completion through a short CSS opacity transition or an explicit reduced-motion fallback timer in the component.
- No full-screen flash or rapid blinking.

- [ ] **Step 8: Run GREEN and commit**

Run: `npm run test:traps && npm run test:puzzle && npm run typecheck && npm run lint && npm run build`

```bash
git add src/app/CandidateDecoyTile.tsx src/app/trap-feedback.ts src/app/CampaignGame.tsx src/app/LevelMap.tsx src/app/PuzzleGame.tsx src/app/PuzzleGame.css tests/candidate-decoy-ui-contract.test.mjs
git commit -m "feat: add candidate decoy mode UI"
```

---

### Task 6: 完整回歸、文件與交付 Gate

**Files:**
- Modify: `README.md`
- Create: `docs/superpowers/reports/2026-08-06-trap-candidate-decoys-delivery.md`

**Interfaces:**
- No new runtime interfaces.

- [ ] **Step 1: Update README**

Document:

- standard remains default;
- candidate mode unlocks after completing level 5;
- one to four safe decoys appear progressively;
- catching a decoy never counts as a mistake, changes score, uses a hint or advances selection;
- board and stubborn traps remain unimplemented future phases.

- [ ] **Step 2: Run the full repository verification**

Run:

```bash
npm install
./scripts/verify.sh
npm audit
```

Expected:

- all existing 144 Node tests remain green;
- all new trap tests pass;
- TypeScript strict passes;
- ESLint passes;
- Vite production PWA build passes;
- npm audit reports 0 vulnerabilities.

- [ ] **Step 3: Perform scope audit**

Confirm the final diff does not modify:

```text
src/puzzle/levels.ts
src/progress/**
src/game/**
src/media/**
data/idioms.source.csv
```

Confirm standard mode produces zero decoys and the candidate trap never enters `PuzzleSession`.

- [ ] **Step 4: Write delivery report**

Record:

- RED and GREEN CI run numbers for every task;
- final test counts;
- TypeScript, ESLint, build, PWA and audit results;
- Drive status: approved card template exists but is not used by this feature; no trap sound or visual asset was added;
- browser-generated sound feedback is best-effort and no remote asset is required;
- Android/iOS real-device evidence remains a release follow-up.

- [ ] **Step 5: Final commit and PR update**

```bash
git add README.md docs/superpowers/reports/2026-08-06-trap-candidate-decoys-delivery.md
git commit -m "docs: record candidate decoy delivery"
```

Update the existing feature PR with exact test evidence. Merge only when:

```text
behind_by = 0
CI = success
unresolved review threads = 0
final HEAD unchanged
```

Use Squash Merge with a fixed `expected_head_sha`.

---

## Plan Self-Review

- Spec coverage: Phase 1 covers the complete candidate-decoy slice; board intruders and stubborn intruders are explicitly excluded and require separate plans.
- Placeholder scan: no TBD, TODO, “implement later” steps, or undefined neighboring interfaces remain.
- Type consistency: `PuzzlePlayMode`, `CandidateDecoy`, `CandidateDecoySession`, engine transitions, hook methods and component props use the same names across all tasks.
- Scope isolation: puzzle answers, legal tiles, progress schema, scoring, stars, media, free-form chain and whack-a-mole remain unchanged.
