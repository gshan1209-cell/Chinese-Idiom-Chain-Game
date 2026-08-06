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
- 自然露餡必須在伏字啟用後再經過 3、5 或 7 次有效操作，不能因排程期間累積的操作而立即露餡。
- 點擊盤面伏字不得選取下方格、填字、增加錯誤、扣分、增加提示或觸發智慧跳格。
- 合法字牌與提示可正常填入伏字目標格，伏字改為 `ejecting`；關卡完成時所有未完成陷阱立即取消。
- 點擊區域至少 44×44px；360px 寬度不得新增水平捲動。
- 無 Drive 核准陷阱素材，本階段沿用 CSS 與短促 Web Audio；不得加入遠端媒體。

---

## File Structure

### 新增

- `src/traps/trap-mode.ts`：集中各模式目前啟用的陷阱能力。
- `src/traps/trap-safe-characters.ts`：候選偽字與盤面伏字共用的安全字元集合。
- `src/traps/board-intruder-engine.ts`：數量、目標格、門檻、露餡、驅逐與 reconcile 純函式。
- `src/app/use-board-intruders.ts`：管理獨立盤面伏字 session。
- `src/app/BoardIntruder.tsx`：盤面覆蓋按鈕、事件攔截與動畫完成通知。
- `tests/board-intruder-engine.test.mjs`：純引擎測試。
- `tests/board-intruder-integration.test.mjs`：React 控制層與盤面隔離契約。
- `tests/board-intruder-ui-contract.test.mjs`：模式選單、覆蓋層、事件與 reduced-motion 契約。
- `docs/superpowers/reports/2026-08-06-board-intruders-delivery.md`：交付報告。

### 修改

- `src/domain/trap.ts`
- `src/traps/trap-unlocks.ts`
- `src/traps/candidate-decoy-engine.ts`
- `src/app/use-candidate-decoys.ts`
- `src/app/use-puzzle-game.ts`
- `src/app/PuzzleGame.tsx`
- `src/app/PuzzleGame.css`
- `src/app/LevelMap.tsx`
- `src/app/LevelMap.css`
- `src/app/trap-feedback.ts`
- `tests/trap-unlocks.test.mjs`
- `tests/candidate-decoy-phase-boundary.test.mjs`
- `package.json`
- `README.md`

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
- Produces: `isPuzzlePlayModeUnlocked(progress, 'trap-board') === true` only after level 10 completion.

- [ ] **Step 1: Write failing tests**

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

Also assert `trap-board` creates candidate decoys, while `trap-stubborn` creates none and ignores candidate progress. Add progress fixtures immediately before and after level 10 completion.

- [ ] **Step 2: Verify RED**

```bash
npm run compile:core
node --test tests/trap-unlocks.test.mjs tests/candidate-decoy-phase-boundary.test.mjs
```

Expected: missing `trap-mode.ts`, `trap-board` candidate behavior and level-10 unlock failures.

- [ ] **Step 3: Implement minimal mode helpers**

```ts
import type { PuzzlePlayMode } from '../domain/trap.js';

export function usesCandidateDecoys(mode: PuzzlePlayMode): boolean {
  return mode === 'trap-candidates' || mode === 'trap-board';
}

export function usesBoardIntruders(mode: PuzzlePlayMode): boolean {
  return mode === 'trap-board';
}
```

Use `usesCandidateDecoys` in candidate session creation and placement recording. Extend unlock rules:

```text
standard: always unlocked
trap-candidates: completed level 5
trap-board: completed level 10
trap-stubborn: false, reason 頑固伏字尚未開放。
```

- [ ] **Step 4: Verify GREEN**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/traps/trap-mode.ts src/traps/trap-unlocks.ts src/traps/candidate-decoy-engine.ts tests/trap-unlocks.test.mjs tests/candidate-decoy-phase-boundary.test.mjs
git commit -m "feat: define board trap mode boundary"
```

---

### Task 2: 安全字元與盤面伏字計畫生成

**Files:**
- Create: `src/traps/trap-safe-characters.ts`
- Create: `src/traps/board-intruder-engine.ts`
- Modify: `src/domain/trap.ts`
- Modify: `src/traps/candidate-decoy-engine.ts`
- Create: `tests/board-intruder-engine.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `usesBoardIntruders(mode)`.
- Produces: `buildSafeTrapCharacters(board, idioms, excludedCharacters): readonly string[]`
- Produces: `boardIntruderCount(fillableCellCount): number`
- Produces: `boardIntruderActivationThresholds(total, fillableCellCount): readonly number[]`
- Produces: `createBoardIntruderSession(options): BoardIntruderSession`

Add:

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
  readonly nextRevealAtActionCount: number | null;
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

Activation ratios:

```text
1: 35%
2: 25%, 60%
3: 20%, 50%, 75%
```

Reveal intervals by index: `3, 5, 7` actions after activation.

- [ ] **Step 1: Write failing generation tests**

```js
assert.equal(boardIntruderCount(1), 1);
assert.equal(boardIntruderCount(20), 2);
assert.equal(boardIntruderCount(30), 3);
assert.deepEqual(boardIntruderActivationThresholds(2, 20), [5, 12]);
```

Assert:

- standard and candidate-only modes create zero intruders;
- `trap-board` creates at most three;
- targets are unique, empty `fillableKeys`;
- characters are unique and exclude answers, legal candidates, candidate-decoy reserved characters and disabled entries;
- insufficient safe characters or cells reduces count;
- injected orderers must be exact permutations;
- same ordered inputs produce deeply equal frozen sessions;
- scheduled intruders have `nextRevealAtActionCount === null`;
- initially active intruders use `actionCount + revealIntervalActions`.

- [ ] **Step 2: Verify RED**

```bash
npm run compile:core
node --test tests/board-intruder-engine.test.mjs
```

Expected: missing engine and domain exports.

- [ ] **Step 3: Extract shared safe-character function**

```ts
export function buildSafeTrapCharacters(
  board: PuzzleBoard,
  idioms: readonly Idiom[],
  excludedCharacters: readonly string[] = Object.freeze([])
): readonly string[]
```

Exclude:

```ts
new Set([
  ...board.candidateCharacters,
  ...[...board.cells.values()].map((cell) => cell.answer),
  ...excludedCharacters
])
```

Only enabled idioms contribute characters. Return frozen unique characters. Refactor candidate generation to use this function with no output change.

- [ ] **Step 4: Implement plan generation**

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

1. Empty frozen session unless `usesBoardIntruders(mode)`.
2. Eligible cells are empty `board.fillableKeys`.
3. Validate both orderers as exact permutations without duplicates or foreign values.
4. Total is minimum of formula, safe characters and eligible cells.
5. Pair ordered characters and cells by index.
6. At most two entries start visible.
7. Active entries set `nextRevealAtActionCount = actionCount + interval`; scheduled entries set it to `null`.

- [ ] **Step 5: Add permanent Trap Gate**

```json
"test:traps": "npm run compile:core && node --test tests/trap-*.test.mjs tests/candidate-decoy-*.test.mjs tests/board-intruder-*.test.mjs"
```

`tsconfig.core.json` already includes `src/traps/**/*.ts`; do not modify it.

- [ ] **Step 6: Verify GREEN**

```bash
npm run test:traps
```

Expected: all existing and generation tests PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/trap.ts src/traps/trap-safe-characters.ts src/traps/board-intruder-engine.ts src/traps/candidate-decoy-engine.ts tests/board-intruder-engine.test.mjs package.json
git commit -m "feat: generate safe board intruder plans"
```

---

### Task 3: 生命週期、露餡與 reconcile

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

State graph:

```text
scheduled --threshold reached--> active
active --reveal due--> revealing
revealing --animation complete--> active
active/revealing --click--> ejecting
active/revealing --target filled--> ejecting
ejecting --animation complete--> removed
scheduled --target filled before activation--> removed
any nonremoved --puzzle completed--> removed
```

Assert:

- valid placement increments `validPlacements` and `actionCount` once;
- other state-changing puzzle action increments only `actionCount`;
- invalid/repeated IDs return the original object;
- visible statuses `active|revealing|ejecting` never exceed two;
- only one intruder reveals at a time;
- activation sets `nextRevealAtActionCount = current actionCount + interval`;
- reveal occurs 3, 5 or 7 actions after activation, never while scheduled;
- each intruder naturally reveals at most three times;
- clicking a revealing intruder starts ejection;
- completion removes every remaining intruder.

- [ ] **Step 2: Verify RED**

```bash
npm run compile:core
node --test tests/board-intruder-engine.test.mjs
```

Expected: generation passes; transition functions are missing.

- [ ] **Step 3: Implement reconcile**

```ts
function isVisibleStatus(status: BoardIntruderStatus): boolean {
  return status === 'active' || status === 'revealing' || status === 'ejecting';
}

function isCellEmpty(session: PuzzleSession, key: string): boolean {
  return (session.values[key] ?? '') === '';
}
```

`reconcileBoardIntruders`:

1. completed puzzle -> every nonremoved entry becomes `removed`;
2. filled active/revealing target -> `ejecting`;
3. filled scheduled target -> `removed`;
4. activate due scheduled entries in array order while visible count is below two;
5. activation assigns `nextRevealAtActionCount = actionCount + revealIntervalActions`;
6. never retarget.

- [ ] **Step 4: Implement action and reveal transitions**

`recordValidBoardPlacement` increments both counters; `recordBoardPuzzleAction` increments only `actionCount`. Both reconcile first, then start at most one due natural reveal.

`completeBoardIntruderReveal`:

```ts
status: 'active'
revealCount: revealCount + 1
nextRevealAtActionCount:
  revealCount + 1 >= 3
    ? null
    : actionCount + revealIntervalActions
```

- [ ] **Step 5: Implement ejection transitions**

`beginBoardIntruderEjection` accepts active or revealing. `completeBoardIntruderEjection` accepts only ejecting, marks removed, then reconciles to fill an available visible slot.

- [ ] **Step 6: Verify GREEN**

```bash
npm run test:traps
```

- [ ] **Step 7: Commit**

```bash
git add src/traps/board-intruder-engine.ts tests/board-intruder-engine.test.mjs
git commit -m "feat: add board intruder lifecycle"
```

---

### Task 4: React 控制層與盤面隔離

**Files:**
- Create: `src/app/use-board-intruders.ts`
- Modify: `src/app/use-candidate-decoys.ts`
- Modify: `src/app/use-puzzle-game.ts`
- Create: `tests/board-intruder-integration.test.mjs`

**Interfaces:**
- Candidate hook produces: `reservedCharacters: readonly string[]`.
- Board hook produces: `visibleIntruders`, `recordValidPlacement(nextPuzzleSession)`, `recordPuzzleAction(nextPuzzleSession)`, `beginEjection(id)`, `completeEjection(id, puzzleSession)`, `completeReveal(id)`.
- `usePuzzleGame` produces: `boardIntruders`, `chooseBoardIntruder`, `finishBoardIntruderEjection`, `finishBoardIntruderReveal`.

- [ ] **Step 1: Write failing integration tests**

Assert:

- board hook owns `BoardIntruderSession` and imports no puzzle mutation function;
- board engine never writes puzzle values, tiles, selection, score, mistakes, hints or correct count;
- successful tile placement notifies candidate and board hooks exactly once;
- invalid placement notifies neither;
- board intruder click handlers call no puzzle mutation/selection function;
- state-changing hint, remove and clear call board action; selection and shuffle do not;
- replaying the same level with a new board resets the trap session;
- dictionary late-load preserves current-board counters;
- mode or board change resets counters.

- [ ] **Step 2: Verify RED**

```bash
npm run compile:core
node --test tests/board-intruder-integration.test.mjs
```

- [ ] **Step 3: Expose candidate reserved characters**

```ts
const reservedCharacters = useMemo(
  () => Object.freeze(state.session.decoys
    .filter((decoy) => decoy.status !== 'removed')
    .map((decoy) => decoy.character)),
  [state.session]
);
```

Use all nonremoved entries, including scheduled ones.

- [ ] **Step 4: Implement `useBoardIntruders`**

State contains:

```text
board
contextKey = levelId:mode:excludedCharacters
dictionaryReady
session
```

Inject browser-side shufflers for characters/cell keys. Same-board dictionary readiness preserves counters; board/mode change resets them. Visible intruders are returned only when state board and context match props.

- [ ] **Step 5: Integrate puzzle actions**

Tile placement:

```ts
const result = placePuzzleTile(current, tileId);
if (result.session !== current) {
  recordValidCandidatePlacement();
  recordValidBoardPlacement(result.session);
}
setSession(result.session);
```

Hint, successful remove and state-changing clear call `recordBoardPuzzleAction(nextSession)` only when session changes. Shuffle and selection do not count. The supplied next puzzle session performs auto-ejection and completion cancellation.

- [ ] **Step 6: Add trap-only handlers**

```text
chooseBoardIntruder(id)
finishBoardIntruderEjection(id)
finishBoardIntruderReveal(id)
```

They update only board-trap state and feedback. Manual click message: `抓到盤面怪字了！`.

- [ ] **Step 7: Verify GREEN**

```bash
node --test tests/board-intruder-integration.test.mjs
npm run test:traps
```

- [ ] **Step 8: Commit**

```bash
git add src/app/use-board-intruders.ts src/app/use-candidate-decoys.ts src/app/use-puzzle-game.ts tests/board-intruder-integration.test.mjs
git commit -m "feat: integrate board intruders with puzzle actions"
```

---

### Task 5: 模式選擇與盤面覆蓋 UI

**Files:**
- Create: `src/app/BoardIntruder.tsx`
- Modify: `src/app/PuzzleGame.tsx`
- Modify: `src/app/PuzzleGame.css`
- Modify: `src/app/LevelMap.tsx`
- Modify: `src/app/LevelMap.css`
- Modify: `src/app/trap-feedback.ts`
- Create: `tests/board-intruder-ui-contract.test.mjs`

**Interfaces:**
- `BoardIntruder` consumes a `BoardIntruder` record and choose/reveal/ejection callbacks.
- Produces a full-cell overlay button that stops events from reaching the base puzzle cell.

- [ ] **Step 1: Write failing UI contract tests**

Assert:

- Level Map renders `盤面伏字` for `trap-board`, disabled before level 10 completion;
- `trap-stubborn` is absent;
- Puzzle Game maps intruders by `targetCellKey` and wraps each cell in `.puzzle-cell-slot`;
- overlay uses `<button type="button">` and `event.stopPropagation()`;
- overlay click never calls `game.selectCell`;
- reveal/ejection animation ends call the matching handlers;
- aria-label names the fake character and removal action;
- hit area is at least 44×44px;
- reduced-motion removes transform-based reveal/ejection;
- 360px mode cards use one column.

- [ ] **Step 2: Verify RED**

```bash
node --test tests/board-intruder-ui-contract.test.mjs
```

- [ ] **Step 3: Generalize trap feedback**

```ts
export function playTrapEjectFeedback(): void
```

Reuse the existing short Web Audio implementation. Update candidate and board call sites. Do not alter media playback state.

- [ ] **Step 4: Implement overlay component**

```tsx
<button
  className={`board-intruder ${intruder.status}`}
  type="button"
  aria-label={`怪字 ${intruder.character}，按下可拔除`}
  onClick={(event) => {
    event.stopPropagation();
    if (intruder.status === 'active' || intruder.status === 'revealing') {
      onChoose(intruder.id);
    }
  }}
  onAnimationEnd={() => {
    if (intruder.status === 'revealing') onRevealComplete(intruder.id);
    if (intruder.status === 'ejecting') onEjectionComplete(intruder.id);
  }}
>
  {intruder.character}
</button>
```

- [ ] **Step 5: Render overlay above base cells**

```ts
const boardIntruderByCell = new Map(
  game.boardIntruders.map((intruder) => [intruder.targetCellKey, intruder])
);
```

Each real grid item becomes `.puzzle-cell-slot` containing the unchanged base cell button plus at most one overlay.

- [ ] **Step 6: Add mode card and labels**

Visible cards:

```text
標準模式
候選偽字
盤面伏字
```

Badge mapping includes a defensive `trap-stubborn -> 頑固伏字模式`, but no stubborn card is rendered.

- [ ] **Step 7: Add CSS**

Use absolute overlay positioning. Revealing moves at most 2px for 180–260ms. Ejecting moves/fades. Reduced motion uses a 250ms border/opacity pulse and fade with no translation/rotation. Keep 44px hit area and mobile one-column mode cards.

- [ ] **Step 8: Verify GREEN**

```bash
node --test tests/board-intruder-ui-contract.test.mjs
npm run test:traps
npm run typecheck
npm run lint
```

- [ ] **Step 9: Commit**

```bash
git add src/app/BoardIntruder.tsx src/app/PuzzleGame.tsx src/app/PuzzleGame.css src/app/LevelMap.tsx src/app/LevelMap.css src/app/trap-feedback.ts tests/board-intruder-ui-contract.test.mjs
git commit -m "feat: render removable board intruders"
```

---

### Task 6: Completion safeguards, documentation and final Gate

**Files:**
- Modify: `tests/board-intruder-engine.test.mjs`
- Modify: `tests/board-intruder-integration.test.mjs`
- Modify: `README.md`
- Create: `docs/superpowers/reports/2026-08-06-board-intruders-delivery.md`

- [ ] **Step 1: Add final regression scenarios**

1. legal tile fills an active intruder target: answer is written, mistakes unchanged, intruder becomes ejecting;
2. hint fills an intruder target: `hintsUsed` increases once, mistakes unchanged, intruder ejects;
3. clicking an intruder preserves selection, preferred placement, score, mistakes and hints;
4. final correct tile completes level and all intruders become removed;
5. candidate and board traps reserve unique characters in `trap-board`;
6. standard/candidate modes show zero board overlays;
7. replay creates a fresh board trap session;
8. `trap-stubborn` creates no Phase 1 or Phase 2 traps and is absent from UI.

- [ ] **Step 2: Run full Repository Gate**

```bash
npm install
./scripts/verify.sh
```

Record exact test counts, TypeScript, ESLint, Vite/PWA output and npm audit result.

- [ ] **Step 3: Update README**

Document level-10 unlock, candidate+board composition, formula, max two visible, single-click removal, legal tile/hint auto-ejection, no scoring/navigation side effects, CSS/Web Audio fallback and stubborn mode remaining future work.

- [ ] **Step 4: Write delivery report**

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

Use actual run numbers, counts, HEAD SHA and PWA sizes only.

- [ ] **Step 5: Scope audit**

No changes under:

```text
src/puzzle/levels.ts
src/progress/**
src/game/**
src/bonus/**
src/media/**
data/idioms.source.csv
```

Require `behind_by = 0` and no unrelated files.

- [ ] **Step 6: Final same-tree CI**

Push documentation HEAD and confirm GitHub Actions executes `./scripts/verify.sh` on the latest PR merge tree. Do not reuse an earlier run.

- [ ] **Step 7: ChatGPT Audit and Squash Merge**

```text
PR draft = false
mergeable = true
behind_by = 0
unresolved review threads = 0
latest HEAD CI = success
expected_head_sha = current PR HEAD
```

Squash title: `feat: 新增盤面伏字陷阱模式`.

- [ ] **Step 8: Post-merge verification**

Confirm `main` contains the board engine, overlay component, delivery report, and no open duplicate PR.
