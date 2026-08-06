# 盤面伏字 Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在第一章填字闖關新增完成第 10 關後可選用的「盤面伏字」模式，讓安全假字以獨立覆蓋層出現在尚未填寫的格子上，單擊或填入合法字牌即可驅逐，且不污染 `PuzzleSession`、錯誤、提示、分數、星級或智慧跳格。

**Architecture:** 延續 Phase 1 的獨立陷阱 session。純 TypeScript 引擎建立決定性的盤面伏字計畫、限制同時可見數量、依合法放字進度啟用、以玩家有效操作驅動露餡，並依最新 `PuzzleSession` 對已填格與完成狀態進行 reconcile。React 只管理 hook、事件攔截、盤面覆蓋層、CSS 動畫與本機 Web Audio 回饋。

**Tech Stack:** TypeScript 6 strict、React 19、Node.js `node:test`、Vite 8、vite-plugin-pwa、GitHub Actions。

## Global Constraints

- Node.js 必須為 `>=22.13.0`，npm 必須為 `>=10`。
- 不新增 runtime 或 dev dependency。
- 標準模式陷阱數量永遠為 0。
- `trap-board` 組合既有候選偽字與本次盤面伏字；`trap-stubborn` 本階段保持惰性且不得出現在玩家模式選單。
- 盤面伏字不得寫入 `PuzzleSession.values`、`tileByCell`、`PuzzleTile.usedBy`、`correctCells` 或 `PuzzleCell.answer`。
- 不修改第一章 20 關、61 個唯一成語、來源 CSV、智慧跳格演算法、星級門檻或 `cicg-progress` schema。
- 盤面伏字總數為 `clamp(ceil(fillableCellCount × 0.10), 1, 3)`；同時最多 2 個可見伏字。
- 伏字只可目標尚未填寫的 `fillableKeys`，不得目標固定格、已填格或已完成盤面。
- 伏字字元只來自已啟用本機成語字典，且不得是本關答案、合法候選字、候選偽字保留字元或同關其他伏字字元。
- 核心引擎不得直接使用 React、DOM、Web Audio、IndexedDB、`Date.now()` 或 `Math.random()`；排序由呼叫端注入。
- 自然露餡只由有效盤面操作計數驅動，不建立無限制 timer；本階段不實作規格中的可選 5 秒停滯提示。
- 點擊盤面伏字不得選取下方格、填字、增加錯誤、扣分、增加提示或觸發智慧跳格。
- 合法字牌與提示可正常填入伏字目標格，伏字改為 `ejecting`；關卡完成時所有未完成陷阱立即取消。
- 點擊區域至少 44×44px；360px 寬度不得新增水平捲動。
- 無 Drive 核准陷阱素材，本階段沿用 CSS 與短促 Web Audio；不得加入遠端媒體。

---

## File Structure

### 新增

- `src/traps/trap-mode.ts`：定義各遊玩模式目前啟用的陷阱能力，集中 Phase 邊界。
- `src/traps/trap-safe-characters.ts`：建立可供候選偽字與盤面伏字共用的安全字元集合。
- `src/traps/board-intruder-engine.ts`：盤面伏字數量、目標格、門檻、露餡、驅逐與 reconcile 純函式。
- `src/app/use-board-intruders.ts`：管理獨立盤面伏字 session，處理關卡／模式／字典延遲載入重建。
- `src/app/BoardIntruder.tsx`：盤面覆蓋按鈕、事件攔截、露餡與驅逐動畫完成通知。
- `tests/board-intruder-engine.test.mjs`：純引擎生成與生命週期測試。
- `tests/board-intruder-integration.test.mjs`：React 控制層與 `PuzzleSession` 隔離契約測試。
- `tests/board-intruder-ui-contract.test.mjs`：模式選單、覆蓋層、事件攔截與 reduced-motion 契約測試。
- `docs/superpowers/reports/2026-08-06-board-intruders-delivery.md`：TDD、CI、範圍與 Drive 狀態交付報告。

### 修改

- `src/domain/trap.ts`：新增盤面伏字領域型別。
- `src/traps/trap-unlocks.ts`：加入第 10 關解鎖規則。
- `src/traps/candidate-decoy-engine.ts`：使用共用安全字元工具，讓 `trap-board` 組合候選偽字。
- `src/app/use-candidate-decoys.ts`：輸出同局保留的候選偽字字元。
- `src/app/use-puzzle-game.ts`：把成功放字、提示、移除與清空同步給盤面伏字 hook。
- `src/app/PuzzleGame.tsx`：在盤面格上方渲染伏字覆蓋層並顯示模式名稱。
- `src/app/PuzzleGame.css`：格子容器、伏字狀態、動畫與 reduced-motion。
- `src/app/LevelMap.tsx`：顯示已解鎖的盤面伏字模式。
- `src/app/LevelMap.css`：三模式卡片的手機版排列。
- `src/app/trap-feedback.ts`：將候選偽字音效函式泛化為所有陷阱共用驅逐音效。
- `tests/trap-unlocks.test.mjs`：第 10 關解鎖與頑固模式未開放測試。
- `tests/candidate-decoy-phase-boundary.test.mjs`：更新模式組合邊界。
- `package.json`：把 `board-intruder-*.test.mjs` 納入永久 Trap Gate。
- `README.md`：標記 Phase 2 完成與操作規則。

---

### Task 1: 模式能力與解鎖邊界

**Files:**
- Create: `src/traps/trap-mode.ts`
- Modify: `src/traps/trap-unlocks.ts`
- Modify: `src/traps/candidate-decoy-engine.ts`
- Modify: `tests/trap-unlocks.test.mjs`
- Modify: `tests/candidate-decoy-phase-boundary.test.mjs`

**Interfaces:**
- Produces: `usesCandidateDecoys(mode: PuzzlePlayMode): boolean`
- Produces: `usesBoardIntruders(mode: PuzzlePlayMode): boolean`
- Produces: `isPuzzlePlayModeUnlocked(progress, 'trap-board') === true` only after level 10 is completed.
- Guarantees: `trap-stubborn` remains inactive and unavailable during Phase 2.

- [ ] **Step 1: Write failing mode-composition tests**

Add tests that assert:

```js
assert.equal(usesCandidateDecoys('standard'), false);
assert.equal(usesCandidateDecoys('trap-candidates'), true);
assert.equal(usesCandidateDecoys('trap-board'), true);
assert.equal(usesCandidateDecoys('trap-stubborn'), false);
assert.equal(usesBoardIntruders('standard'), false);
assert.equal(usesBoardIntruders('trap-candidates'), false);
assert.equal(usesBoardIntruders('trap-board'), true);
assert.equal(usesBoardIntruders('trap-stubborn'), false);
```

Update the Phase boundary test so `trap-board` is expected to create candidate decoys, while `trap-stubborn` still creates none and ignores candidate progress.

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
npm run compile:core
node --test tests/trap-unlocks.test.mjs tests/candidate-decoy-phase-boundary.test.mjs
```

Expected: FAIL because `src/traps/trap-mode.ts` does not exist, `trap-board` remains candidate-inert, and no level-10 unlock rule exists.

- [ ] **Step 3: Add minimal mode helpers**

Create:

```ts
import type { PuzzlePlayMode } from '../domain/trap.js';

export function usesCandidateDecoys(mode: PuzzlePlayMode): boolean {
  return mode === 'trap-candidates' || mode === 'trap-board';
}

export function usesBoardIntruders(mode: PuzzlePlayMode): boolean {
  return mode === 'trap-board';
}
```

Replace the candidate engine's direct `mode !== 'trap-candidates'` guards with `!usesCandidateDecoys(mode)`.

Extend `trap-unlocks.ts` so:

```ts
standard: always unlocked
trap-candidates: completed level 5
trap-board: completed level 10
trap-stubborn: false with reason '頑固伏字尚未開放。'
```

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the same command. Expected: all mode and unlock tests PASS; existing candidate generation tests remain unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/traps/trap-mode.ts src/traps/trap-unlocks.ts src/traps/candidate-decoy-engine.ts tests/trap-unlocks.test.mjs tests/candidate-decoy-phase-boundary.test.mjs
git commit -m "feat: define board trap mode boundary"
```

---

### Task 2: 安全字元共用與盤面伏字計畫生成

**Files:**
- Create: `src/traps/trap-safe-characters.ts`
- Create: `src/traps/board-intruder-engine.ts`
- Modify: `src/domain/trap.ts`
- Modify: `src/traps/candidate-decoy-engine.ts`
- Create: `tests/board-intruder-engine.test.mjs`
- Modify: `package.json`
- Modify: `tsconfig.core.json`

**Interfaces:**
- Consumes: `usesBoardIntruders(mode)` from Task 1.
- Produces: `buildSafeTrapCharacters(board, idioms, excludedCharacters): readonly string[]`
- Produces: `boardIntruderCount(fillableCellCount): number`
- Produces: `boardIntruderActivationThresholds(total, fillableCellCount): readonly number[]`
- Produces: `createBoardIntruderSession(options): BoardIntruderSession`

Add domain types:

```ts
export type BoardIntruderStatus =
  | 'scheduled'
  | 'active'
  | 'revealing'
  | 'ejecting'
  | 'removed';

export interface BoardIntruder {
  readonly id: string;
  readonly character: string;
  readonly targetCellKey: string;
  readonly activationAfterValidPlacements: number;
  readonly revealIntervalActions: number;
  readonly nextRevealAtActionCount: number;
  readonly revealCount: number;
  readonly status: BoardIntruderStatus;
}

export interface BoardIntruderSession {
  readonly levelId: string;
  readonly mode: PuzzlePlayMode;
  readonly validPlacements: number;
  readonly actionCount: number;
  readonly intruders: readonly BoardIntruder[];
}
```

Use these exact activation ratios:

```ts
1 intruder: [0.35]
2 intruders: [0.25, 0.60]
3 intruders: [0.20, 0.50, 0.75]
```

Use reveal intervals `[3, 5, 7]` by intruder index.

- [ ] **Step 1: Write failing generation tests**

Cover:

```js
assert.equal(boardIntruderCount(1), 1);
assert.equal(boardIntruderCount(20), 2);
assert.equal(boardIntruderCount(30), 3);
assert.deepEqual(boardIntruderActivationThresholds(2, 20), [5, 12]);
```

Build a real first-chapter board and assert:

- standard and candidate-only modes create zero board intruders;
- `trap-board` creates at most three intruders;
- every target belongs to `board.fillableKeys` and has no player value;
- target keys and characters are unique;
- characters exclude every board answer, legal candidate character, supplied candidate-decoy reserved character, and disabled dictionary entry;
- insufficient safe characters or cells reduces the count rather than using unsafe data;
- invalid character or cell orderers that inject, omit or duplicate entries throw a Traditional Chinese error;
- same ordered inputs create deeply equal sessions.

- [ ] **Step 2: Run the generation test and verify RED**

Run:

```bash
npm run compile:core
node --test tests/board-intruder-engine.test.mjs
```

Expected: FAIL with missing `board-intruder-engine` and domain exports.

- [ ] **Step 3: Extract the shared safety utility**

Implement:

```ts
export function buildSafeTrapCharacters(
  board: PuzzleBoard,
  idioms: readonly Idiom[],
  excludedCharacters: readonly string[] = Object.freeze([])
): readonly string[]
```

The function must exclude:

```ts
new Set([
  ...board.candidateCharacters,
  ...[...board.cells.values()].map((cell) => cell.answer),
  ...excludedCharacters
])
```

Only enabled idioms contribute characters. Return a frozen de-duplicated array. Refactor candidate generation to use this helper without changing its existing output contract.

- [ ] **Step 4: Implement minimal board plan generation**

Implement `createBoardIntruderSession` with options:

```ts
export interface CreateBoardIntruderSessionOptions {
  readonly board: PuzzleBoard;
  readonly puzzleSession: PuzzleSession;
  readonly idioms: readonly Idiom[];
  readonly mode: PuzzlePlayMode;
  readonly excludedCharacters?: readonly string[];
  readonly orderCharacters: CharacterOrderer;
  readonly orderCellKeys: CellKeyOrderer;
  readonly validPlacements?: number;
  readonly actionCount?: number;
}
```

Rules:

1. Return an empty frozen session unless `usesBoardIntruders(mode)`.
2. Eligible targets are `board.fillableKeys` whose `puzzleSession.values[key]` is empty.
3. Validate both injected orderers are exact permutations with no duplicates or foreign values.
4. Total is the minimum of count formula, safe characters and eligible targets.
5. Pair ordered safe characters and target keys by index.
6. Use the fixed activation ratios and reveal intervals.
7. Initial status is `active` only when threshold is already met and fewer than two earlier entries are visible; otherwise `scheduled`.
8. Return fully frozen objects and arrays.

- [ ] **Step 5: Add the test command to the permanent Gate**

Update:

```json
"test:traps": "npm run compile:core && node --test tests/trap-*.test.mjs tests/candidate-decoy-*.test.mjs tests/board-intruder-*.test.mjs"
```

Add `src/traps/**/*.ts` and the new domain types to the existing core compile coverage without broadening unrelated directories.

- [ ] **Step 6: Run generation and all existing Trap tests**

Run:

```bash
npm run test:traps
```

Expected: candidate, unlock, Phase boundary and new generation tests all PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/trap.ts src/traps/trap-safe-characters.ts src/traps/board-intruder-engine.ts src/traps/candidate-decoy-engine.ts tests/board-intruder-engine.test.mjs package.json tsconfig.core.json
git commit -m "feat: generate safe board intruder plans"
```

---

### Task 3: 盤面伏字生命週期、露餡與 reconcile

**Files:**
- Modify: `src/traps/board-intruder-engine.ts`
- Modify: `tests/board-intruder-engine.test.mjs`

**Interfaces:**
- Produces: `recordValidBoardPlacement(session, puzzleSession): BoardIntruderSession`
- Produces: `recordBoardPuzzleAction(session, puzzleSession): BoardIntruderSession`
- Produces: `reconcileBoardIntruders(session, puzzleSession): BoardIntruderSession`
- Produces: `beginBoardIntruderEjection(session, id): BoardIntruderSession`
- Produces: `completeBoardIntruderEjection(session, puzzleSession, id): BoardIntruderSession`
- Produces: `completeBoardIntruderReveal(session, id): BoardIntruderSession`
- Produces: `getVisibleBoardIntruders(session): readonly BoardIntruder[]`

- [ ] **Step 1: Write failing lifecycle tests**

Cover these state transitions:

```text
scheduled --threshold reached--> active
active --natural reveal due--> revealing
revealing --animation complete--> active
active/revealing --player click--> ejecting
active/revealing --target filled--> ejecting
ejecting --animation complete--> removed
scheduled --target filled before activation--> removed
any nonremoved --puzzle completed--> removed
```

Assert:

- `recordValidBoardPlacement` increments both `validPlacements` and `actionCount` exactly once.
- `recordBoardPuzzleAction` increments only `actionCount`.
- invalid or repeated IDs return the original session object.
- no more than two statuses among `active`, `revealing`, `ejecting` are visible simultaneously.
- completing one ejection may activate the next due scheduled intruder if its target is still empty.
- at most one intruder enters `revealing` for an action.
- reveal occurs after the configured 3, 5 or 7 action interval and no more than three times per intruder.
- clicking a `revealing` intruder is allowed and moves it directly to `ejecting`.
- completion removes scheduled, active, revealing and ejecting entries so traps cannot block level completion.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
npm run compile:core
node --test tests/board-intruder-engine.test.mjs
```

Expected: generation tests pass; lifecycle tests fail because transition functions are missing.

- [ ] **Step 3: Implement immutable reconcile helpers**

Use internal helpers:

```ts
function isVisibleStatus(status: BoardIntruderStatus): boolean {
  return status === 'active' || status === 'revealing' || status === 'ejecting';
}

function isCellEmpty(puzzleSession: PuzzleSession, key: string): boolean {
  return (puzzleSession.values[key] ?? '') === '';
}
```

`reconcileBoardIntruders` must:

1. remove every nonremoved intruder when `puzzleSession.status === 'completed'`;
2. change active/revealing intruders on newly filled targets to `ejecting`;
3. change scheduled intruders on filled targets to `removed`;
4. activate due scheduled entries in array order while visible count is below two;
5. never retarget an intruder, preserving deterministic plans.

- [ ] **Step 4: Implement action and reveal transitions**

`recordValidBoardPlacement` increments both counters, reconciles, then starts at most one due reveal. `recordBoardPuzzleAction` increments only `actionCount`, reconciles, then starts at most one due reveal.

`completeBoardIntruderReveal` must:

```ts
status: 'active'
revealCount: revealCount + 1
nextRevealAtActionCount: nextRevealAtActionCount + revealIntervalActions
```

Do not increment beyond three natural reveals.

- [ ] **Step 5: Implement ejection transitions**

`beginBoardIntruderEjection` accepts `active` or `revealing`. `completeBoardIntruderEjection` accepts only `ejecting`, changes it to `removed`, then calls reconcile so a due scheduled intruder can fill the visible slot.

- [ ] **Step 6: Run Trap Gate**

Run:

```bash
npm run test:traps
```

Expected: all generation and lifecycle tests PASS; no candidate regression.

- [ ] **Step 7: Commit**

```bash
git add src/traps/board-intruder-engine.ts tests/board-intruder-engine.test.mjs
git commit -m "feat: add board intruder lifecycle"
```

---

### Task 4: React 控制層與 PuzzleSession 隔離

**Files:**
- Create: `src/app/use-board-intruders.ts`
- Modify: `src/app/use-candidate-decoys.ts`
- Modify: `src/app/use-puzzle-game.ts`
- Create: `tests/board-intruder-integration.test.mjs`

**Interfaces:**
- Consumes: all board engine functions from Tasks 2 and 3.
- Produces from candidate hook: `reservedCharacters: readonly string[]`
- Produces from board hook: `visibleIntruders`, `recordValidPlacement(nextPuzzleSession)`, `recordPuzzleAction(nextPuzzleSession)`, `beginEjection(id)`, `completeEjection(id, puzzleSession)`, `completeReveal(id)`.
- Produces from `usePuzzleGame`: `boardIntruders`, `chooseBoardIntruder`, `finishBoardIntruderEjection`, `finishBoardIntruderReveal`.

- [ ] **Step 1: Write failing integration contract tests**

Read source files and assert:

- `use-board-intruders.ts` owns `BoardIntruderSession` and imports no puzzle mutation function.
- `board-intruder-engine.ts` never writes `PuzzleSession.values`, `tileByCell`, `tiles`, `selectedCellKey`, `mistakes`, `hintsUsed`, `score` or `correctCells`.
- `usePuzzleGame.chooseTile` notifies both candidate and board hooks only when `placePuzzleTile` returns a different session.
- board intruder click handlers call no `placePuzzleTile`, `selectPuzzleCell`, `removePuzzleCell` or `usePuzzleHint` function.
- hint, successful remove and state-changing clear call `recordPuzzleAction`; shuffle and selection do not.
- a new `PuzzleBoard` instance resets board intruder state even when replaying the same level.
- dictionary late-load rebuild preserves counters for the current board, but a mode or board change resets them.

- [ ] **Step 2: Run focused test and verify RED**

Run:

```bash
npm run compile:core
node --test tests/board-intruder-integration.test.mjs
```

Expected: FAIL because the hook and controller integration do not exist.

- [ ] **Step 3: Expose reserved candidate characters**

In `use-candidate-decoys.ts`, return a frozen list derived from all scheduled, active and ejecting candidate decoys, not only visible ones:

```ts
const reservedCharacters = useMemo(
  () => Object.freeze(state.session.decoys
    .filter((decoy) => decoy.status !== 'removed')
    .map((decoy) => decoy.character)),
  [state.session]
);
```

This prevents Phase 2 from selecting a character reserved for a candidate decoy that has not appeared yet.

- [ ] **Step 4: Implement `useBoardIntruders`**

Mirror the existing candidate hook pattern with a state object containing:

```ts
board
contextKey = `${levelId}:${mode}:${excludedCharacters.join('')}`
dictionaryReady
session
```

Use injected browser-side shufflers for characters and cell keys. On same-board dictionary readiness, preserve `validPlacements` and `actionCount`; on new board or mode, reset both to zero. Visible intruders must be returned only while the hook state's board and context match current props.

- [ ] **Step 5: Integrate successful puzzle mutations**

Refactor each callback so it calculates the next puzzle session before setting state.

For tile placement:

```ts
const result = placePuzzleTile(current, tileId);
if (result.session !== current) {
  recordValidPlacement();
  recordValidBoardPlacement(result.session);
}
setSession(result.session);
```

For hint, remove and clear, call `recordPuzzleAction(nextSession)` only when the puzzle session actually changes. The board hook uses the supplied next session to auto-eject intruders on newly filled cells and cancel all traps on completion.

- [ ] **Step 6: Add board-only handlers**

Add handlers that only update board trap state and feedback:

```ts
chooseBoardIntruder(id)
finishBoardIntruderEjection(id)
finishBoardIntruderReveal(id)
```

Click feedback: `抓到盤面怪字了！`  
Auto-fill behavior must not claim a manual catch.

- [ ] **Step 7: Run integration and Trap tests**

Run:

```bash
node --test tests/board-intruder-integration.test.mjs
npm run test:traps
```

Expected: all tests PASS.

- [ ] **Step 8: Commit**

```bash
git add src/app/use-board-intruders.ts src/app/use-candidate-decoys.ts src/app/use-puzzle-game.ts tests/board-intruder-integration.test.mjs
git commit -m "feat: integrate board intruders with puzzle actions"
```

---

### Task 5: 玩家模式選擇與盤面覆蓋 UI

**Files:**
- Create: `src/app/BoardIntruder.tsx`
- Modify: `src/app/PuzzleGame.tsx`
- Modify: `src/app/PuzzleGame.css`
- Modify: `src/app/LevelMap.tsx`
- Modify: `src/app/LevelMap.css`
- Modify: `src/app/trap-feedback.ts`
- Create: `tests/board-intruder-ui-contract.test.mjs`

**Interfaces:**
- Consumes: `BoardIntruder` and the board handlers from Task 4.
- Produces: a full-cell overlay button that stops pointer events from reaching the base puzzle cell.
- Produces: three visible mode cards: standard, candidate decoys, board intruders.

- [ ] **Step 1: Write failing UI contract tests**

Assert source and CSS contain:

- `LevelMap` renders `trap-board` with title `盤面伏字` and a completed-level-10 lock reason.
- `trap-stubborn` is not rendered.
- `PuzzleGame` maps visible intruders by `targetCellKey` and wraps each real cell in `.puzzle-cell-slot`.
- `BoardIntruder` is a `<button type="button">` with `onClick={(event) => { event.stopPropagation(); ... }}`.
- clicking overlay never invokes `game.selectCell`.
- reveal animation completion calls `finishBoardIntruderReveal`; ejection completion calls `finishBoardIntruderEjection`.
- the overlay has an accessible label naming the fake character and removal action.
- `.board-intruder` has `min-width: 44px` and `min-height: 44px` or fills a cell whose minimum is at least 44px.
- `@media (prefers-reduced-motion: reduce)` removes transform-based reveal/ejection and uses opacity/border treatment.
- 360px mode cards use one-column layout.

- [ ] **Step 2: Run UI contract test and verify RED**

Run:

```bash
node --test tests/board-intruder-ui-contract.test.mjs
```

Expected: FAIL because the component, mode card and CSS do not exist.

- [ ] **Step 3: Implement generic trap eject feedback**

Rename or add:

```ts
export function playTrapEjectFeedback(): void
```

Reuse the existing short Web Audio implementation. Update `CandidateDecoyTile` call sites to use the generic function. Do not add remote files or change media playback state.

- [ ] **Step 4: Implement `BoardIntruder`**

Render:

```tsx
<button
  className={`board-intruder ${intruder.status}`}
  type="button"
  aria-label={`怪字 ${intruder.character}，按下可拔除`}
  onClick={(event) => {
    event.stopPropagation();
    if (intruder.status === 'active' || intruder.status === 'revealing') onChoose(intruder.id);
  }}
  onAnimationEnd={() => {
    if (intruder.status === 'revealing') onRevealComplete(intruder.id);
    if (intruder.status === 'ejecting') onEjectionComplete(intruder.id);
  }}
>
  {intruder.character}
</button>
```

Do not place any trap rule, count or target selection in this component.

- [ ] **Step 5: Wrap board cells and render overlays**

Build a map:

```ts
const boardIntruderByCell = new Map(
  game.boardIntruders.map((intruder) => [intruder.targetCellKey, intruder])
);
```

For every real board cell, render a `.puzzle-cell-slot` containing the existing base button and, when present, one `BoardIntruder`. Base button behavior and value calculation stay unchanged.

- [ ] **Step 6: Add mode card and labels**

Level Map:

```text
標準模式
候選偽字
盤面伏字
```

`盤面伏字` is disabled until level 10 completion. Selecting it uses the existing mode state; no progress schema write is added.

Puzzle badge labels:

```ts
standard -> 標準模式
trap-candidates -> 候選偽字模式
trap-board -> 盤面伏字模式
trap-stubborn -> 頑固伏字模式
```

The last mapping is defensive only; no stubborn card is visible.

- [ ] **Step 7: Add CSS and reduced-motion behavior**

Use absolute overlay positioning within `.puzzle-cell-slot`. Active intruders resemble normal text but have a subtle non-color-only outline. Revealing state moves at most 2px for 180–260ms. Ejecting state moves/fades out. Reduced motion removes movement and uses a 250ms border/opacity pulse plus fade.

- [ ] **Step 8: Run UI and full Trap tests**

Run:

```bash
node --test tests/board-intruder-ui-contract.test.mjs
npm run test:traps
npm run typecheck
npm run lint
```

Expected: all PASS.

- [ ] **Step 9: Commit**

```bash
git add src/app/BoardIntruder.tsx src/app/PuzzleGame.tsx src/app/PuzzleGame.css src/app/LevelMap.tsx src/app/LevelMap.css src/app/trap-feedback.ts tests/board-intruder-ui-contract.test.mjs
git commit -m "feat: render removable board intruders"
```

---

### Task 6: Completion safeguards, documentation and final Repository Gate

**Files:**
- Modify: `tests/board-intruder-engine.test.mjs`
- Modify: `tests/board-intruder-integration.test.mjs`
- Modify: `README.md`
- Create: `docs/superpowers/reports/2026-08-06-board-intruders-delivery.md`

**Interfaces:**
- Guarantees: level completion, hint, scoring, progress persistence and Phase 1 behavior remain unchanged.
- Produces: final evidence record with exact CI counts and merge readiness.

- [ ] **Step 1: Add final regression tests**

Add end-to-end pure/controller scenarios:

1. active intruder target receives a legal tile: puzzle value is correct, mistakes unchanged, intruder becomes `ejecting`;
2. hint fills an intruder target: `hintsUsed` increases exactly once, intruder becomes `ejecting`, mistakes unchanged;
3. clicking an intruder leaves `selectedCellKey`, `preferredPlacementId`, score, mistakes and hints unchanged;
4. final correct tile completes the level and every intruder becomes `removed` immediately;
5. candidate decoys and board intruders reserve unique characters in `trap-board` mode;
6. standard and candidate-only modes produce zero board overlays;
7. replaying the same level creates a new empty board intruder session;
8. `trap-stubborn` remains absent from UI and creates no Phase 1 or Phase 2 traps.

- [ ] **Step 2: Run focused and full local Gate**

Run:

```bash
npm install
./scripts/verify.sh
```

Record exact counts for:

```text
all Node tests
Trap tests
Puzzle tests
Progress tests
Media tests
TypeScript strict
ESLint
Vite production build
PWA Service Worker and precache
npm audit
```

Expected: zero failures and zero vulnerabilities.

- [ ] **Step 3: Update README**

Move `盤面伏字` from “尚未實作” to completed scope and document:

- level-10 unlock;
- `trap-board` includes candidate decoys;
- count formula and max two visible;
- single-click removal;
- legal tile/hint auto-ejection;
- no score, mistake, hint or navigation side effects;
- CSS/Web Audio fallback and no Drive asset dependency;
- stubborn intruders remain future work.

- [ ] **Step 4: Write delivery report**

Create the report with:

```markdown
# 盤面伏字 Phase 2 交付報告

## 交付摘要
## 架構與資料流
## 規則與 Phase 邊界
## TDD RED/GREEN 證據
## 最終 CI 結果
## 未修改範圍
## Google Drive 素材與授權狀態
## 後續 Phase 3
```

Use actual run numbers, test counts, HEAD SHA and PWA sizes. Do not write estimates.

- [ ] **Step 5: Review scope and diff**

Verify no changes under:

```text
src/puzzle/levels.ts
src/progress/**
src/game/**
src/bonus/**
src/media/**
data/idioms.source.csv
```

Verify branch relative to `main` has `behind_by = 0` and no unrelated files.

- [ ] **Step 6: Run final same-tree CI**

Push the documentation HEAD, wait for GitHub Actions, then confirm the exact PR merge tree passes `./scripts/verify.sh`. Do not reuse an earlier green run after documentation or code changes.

- [ ] **Step 7: ChatGPT Audit and Squash Merge**

Confirm:

```text
PR is not draft
mergeable = true
behind_by = 0
unresolved review threads = 0
latest HEAD CI = success
expected_head_sha matches current PR HEAD
```

Then Squash Merge with title:

```text
feat: 新增盤面伏字陷阱模式
```

- [ ] **Step 8: Post-merge verification**

Confirm `main` contains `src/traps/board-intruder-engine.ts`, `src/app/BoardIntruder.tsx`, the delivery report, and no open PR remains for the same task.
