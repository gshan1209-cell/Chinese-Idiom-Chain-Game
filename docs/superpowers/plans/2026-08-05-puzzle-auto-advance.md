# 成語填字輸入格智慧自動跳轉 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓玩家在填字主玩法中每放入一個候選字後，自動選到下一個可輸入格；無論填對或填錯都跳格，先走完所有空格，之後再巡回紅色錯誤格。

**Architecture:** 跳轉規則維持在純 TypeScript `puzzle-engine`，`PuzzleSession` 新增 `preferredPlacementId` 保存目前成語方向。React 不新增判斷，只依 Session 的 `selectedCellKey` 繼續呈現高亮格；既有關卡、進度、IndexedDB、自由接龍與打地鼠模組不變。

**Tech Stack:** TypeScript 6、Node.js built-in test runner、React 19、Vite 8。

## Global Constraints

- 任一有效候選字成功寫入目前格後，不論正確或錯誤，都必須自動跳格。
- 盤面仍有空白可填格時，不得提前跳回已有文字的錯誤格。
- 優先沿目前 placement 正向前進；再轉相交 placement；再找相連候選；最後找全盤最近空格。
- 最近格使用曼哈頓距離；距離相同時依 row、column 升冪決定。
- 所有空格填滿後，才依 row、column 順序巡回錯誤格。
- 固定提示格與已填正確格不得成為一般跳轉目標。
- 關卡完成時 `selectedCellKey` 與 `preferredPlacementId` 都必須為 `null`。
- 不修改 IndexedDB progress schema、星級規則、關卡資料、自由接龍或打地鼠功能。
- 不增加新套件。
- 所有變更必須通過 `npm run test`、`npm run typecheck`、`npm run lint`、`npm run build`。

---

## File Map

- Modify: `src/domain/puzzle.ts` — 在 `PuzzleSession` 增加方向偏好欄位。
- Modify: `src/puzzle/puzzle-engine.ts` — 推導 placement、尋找下一格、整合放字／選格／提示／清空流程。
- Modify: `tests/puzzle-engine.test.mjs` — 新增智慧跳格、交叉轉向、錯字巡回與完成狀態測試。
- Modify: `README.md` — 補充自動跳格操作規則。

---

### Task 1: Session 方向偏好與初始選取

**Files:**
- Modify: `src/domain/puzzle.ts`
- Modify: `src/puzzle/puzzle-engine.ts`
- Test: `tests/puzzle-engine.test.mjs`

**Interfaces:**
- Consumes: `PuzzleBoard.level.placements`、`PuzzleCell.placementIds`、`PuzzleSession.selectedCellKey`。
- Produces:
  - `PuzzleSession.preferredPlacementId: string | null`
  - `derivePreferredPlacementId(session, cellKey): string | null`（可為 `puzzle-engine.ts` 內部函式）

- [ ] **Step 1: 在測試 helper 中加入方向偏好斷言**

在 `tests/puzzle-engine.test.mjs` 新增：

```js
test('new session selects the first fillable cell and derives a placement direction', () => {
  const current = session();
  assert.equal(current.selectedCellKey, '0:1');
  assert.equal(current.preferredPlacementId, 'p1');
});
```

- [ ] **Step 2: 執行單一測試，確認 RED**

Run:

```bash
npm run compile:core && node --test --test-name-pattern="new session selects" tests/puzzle-engine.test.mjs
```

Expected: FAIL，因為 `preferredPlacementId` 尚不存在。

- [ ] **Step 3: 擴充 `PuzzleSession` 型別**

在 `src/domain/puzzle.ts` 的 `PuzzleSession` 增加：

```ts
readonly preferredPlacementId: string | null;
```

- [ ] **Step 4: 實作 placement 查找與方向推導 helper**

在 `src/puzzle/puzzle-engine.ts` 新增純函式：

```ts
function placementById(session: PuzzleSession, placementId: string) {
  return session.board.level.placements.find((placement) => placement.id === placementId);
}

function unresolvedCountForPlacement(
  session: PuzzleSession,
  placementId: string
): number {
  const placement = placementById(session, placementId);
  if (placement === undefined) return 0;
  return placementCellKeys(placement).filter((key) => {
    const cell = session.board.cells.get(key);
    return cell !== undefined
      && !cell.fixed
      && session.values[key] !== cell.answer;
  }).length;
}

function derivePreferredPlacementId(
  session: PuzzleSession,
  key: string
): string | null {
  const cell = session.board.cells.get(key);
  if (cell === undefined || cell.fixed || cell.placementIds.length === 0) return null;
  const ranked = [...cell.placementIds]
    .map((placementId) => ({
      placementId,
      placement: placementById(session, placementId),
      unresolved: unresolvedCountForPlacement(session, placementId)
    }))
    .filter((candidate) => candidate.placement !== undefined)
    .sort((left, right) =>
      right.unresolved - left.unresolved
      || (left.placement?.direction === 'horizontal' ? -1 : 1)
      || left.placementId.localeCompare(right.placementId)
    );
  return ranked[0]?.placementId ?? null;
}
```

同檔新增 `placementCellKeys(placement)`，依四字成語的 row／column 產生四個 key。

- [ ] **Step 5: 初始化、手動選格與清空時更新偏好**

調整：

```ts
createPuzzleSession(...)
selectPuzzleCell(session, key)
clearPuzzleEntries(session)
```

要求：

```ts
selectedCellKey: firstKey,
preferredPlacementId: firstKey === null
  ? null
  : derivePreferredPlacementId(baseSession, firstKey)
```

`selectPuzzleCell` 手動點格時重新推導方向；`clearPuzzleEntries` 回到第一個可填格並重新推導。

- [ ] **Step 6: 執行 puzzle engine 測試**

Run:

```bash
npm run compile:core && node --test tests/puzzle-engine.test.mjs
```

Expected: PASS，且既有測試不退化。

- [ ] **Step 7: Commit**

```bash
git add src/domain/puzzle.ts src/puzzle/puzzle-engine.ts tests/puzzle-engine.test.mjs
git commit -m "feat: track preferred puzzle placement"
```

---

### Task 2: 同方向前進、固定格與正確格略過

**Files:**
- Modify: `src/puzzle/puzzle-engine.ts`
- Test: `tests/puzzle-engine.test.mjs`

**Interfaces:**
- Consumes: `PuzzleSession.preferredPlacementId`、`placementCellKeys()`。
- Produces:

```ts
export interface PuzzleNavigationResult {
  readonly cellKey: string | null;
  readonly preferredPlacementId: string | null;
}

export function findNextPuzzleCell(
  session: PuzzleSession,
  currentCellKey: string,
  preferredPlacementId: string | null
): PuzzleNavigationResult;
```

- [ ] **Step 1: 寫同方向與略過規則的失敗測試**

新增：

```js
test('placing any tile advances to the next empty cell in the preferred placement', () => {
  let current = selectPuzzleCell(session(), '0:1');
  const wrongTile = tileFor(current, '風');
  const result = placePuzzleTile(current, wrongTile.id);
  assert.equal(result.correct, false);
  assert.equal(result.session.values['0:1'], '風');
  assert.equal(result.session.selectedCellKey, '0:2');
  assert.equal(result.session.preferredPlacementId, 'p1');
});

test('auto advance skips fixed cells and already correct cells', () => {
  let current = session();
  current = selectPuzzleCell(current, '0:2');
  current = placePuzzleTile(current, tileFor(current, '一').id).session;
  current = selectPuzzleCell(current, '0:1');
  const result = placePuzzleTile(current, tileFor(current, '心').id);
  assert.equal(result.session.selectedCellKey, '0:3');
});
```

- [ ] **Step 2: 執行新增測試，確認 RED**

Run:

```bash
npm run compile:core && node --test --test-name-pattern="auto advance|placing any tile" tests/puzzle-engine.test.mjs
```

Expected: FAIL，現有引擎仍停留在原格。

- [ ] **Step 3: 建立可跳轉目標判斷**

在 `src/puzzle/puzzle-engine.ts` 新增：

```ts
function isEmptyTarget(session: PuzzleSession, key: string): boolean {
  const cell = session.board.cells.get(key);
  return cell !== undefined
    && !cell.fixed
    && session.values[key] === undefined;
}

function isWrongTarget(session: PuzzleSession, key: string): boolean {
  const cell = session.board.cells.get(key);
  const value = session.values[key];
  return cell !== undefined
    && !cell.fixed
    && value !== undefined
    && value !== cell.answer;
}
```

注意：一般跳轉階段只使用 `isEmptyTarget`，錯誤格巡回留到 Task 4。

- [ ] **Step 4: 實作 preferred placement 正向搜尋**

`findNextPuzzleCell` 第一階段：

```ts
const preferred = preferredPlacementId === null
  ? undefined
  : placementById(session, preferredPlacementId);
const preferredKeys = preferred === undefined ? [] : placementCellKeys(preferred);
const currentIndex = preferredKeys.indexOf(currentCellKey);
const forwardTarget = preferredKeys
  .slice(Math.max(0, currentIndex + 1))
  .find((key) => isEmptyTarget(session, key));

if (forwardTarget !== undefined) {
  return Object.freeze({
    cellKey: forwardTarget,
    preferredPlacementId: preferred?.id ?? null
  });
}
```

- [ ] **Step 5: 在 `placePuzzleTile` 中於成功寫入後呼叫跳轉**

流程必須是：

```ts
1. 釋放原字牌
2. 寫入新字牌與 values
3. 計算 correct、score、mistakes、status
4. 若 completed：selectedCellKey = null、preferredPlacementId = null
5. 否則呼叫 findNextPuzzleCell
6. 將 navigation 結果寫回 Session
```

無效字牌、已使用字牌、無選取格或 completed session 不得跳轉。

- [ ] **Step 6: 執行 puzzle engine 測試**

Run:

```bash
npm run compile:core && node --test tests/puzzle-engine.test.mjs
```

Expected: PASS。

- [ ] **Step 7: Commit**

```bash
git add src/puzzle/puzzle-engine.ts tests/puzzle-engine.test.mjs
git commit -m "feat: auto advance within puzzle placement"
```

---

### Task 3: 交叉轉向與相連 placement 搜尋

**Files:**
- Modify: `src/puzzle/puzzle-engine.ts`
- Test: `tests/puzzle-engine.test.mjs`

**Interfaces:**
- Consumes: `findNextPuzzleCell()` 第一階段、`PuzzleCell.placementIds`。
- Produces: 交叉 placement 與直接相連 placement 的決定性搜尋。

- [ ] **Step 1: 建立可覆蓋交叉情境的測試關卡**

在 `tests/puzzle-engine.test.mjs` 新增獨立 `crossLevel` 與 `crossSession()`：

```js
const crossLevel = {
  id: 'level-099', chapterId: 'chapter-1', levelNumber: 99, title: '交叉測試',
  width: 5, height: 5,
  placements: [
    { id: 'h1', idiomId: 'h1', text: '一心一意', direction: 'horizontal', startRow: 1, startColumn: 0 },
    { id: 'v1', idiomId: 'v1', text: '意氣風發', direction: 'vertical', startRow: 1, startColumn: 3 },
    { id: 'h2', idiomId: 'h2', text: '發人深省', direction: 'horizontal', startRow: 4, startColumn: 3 }
  ],
  fixedCells: ['1:0'], difficulty: 'easy', hintLimit: 3
};
```

若盤面交叉字不一致，調整測試成語與座標，直到 `buildPuzzleBoard(crossLevel)` 成功；測試資料必須明確保證交叉字一致。

- [ ] **Step 2: 寫交叉轉向失敗測試**

```js
test('when preferred placement has no empty cells, auto advance switches at the crossing', () => {
  let current = crossSession();
  current = fillCorrectExcept(current, ['1:3', '2:3']);
  current = selectPuzzleCell(current, '1:3');
  const result = placePuzzleTile(current, tileFor(current, '意').id);
  assert.equal(result.session.selectedCellKey, '2:3');
  assert.equal(result.session.preferredPlacementId, 'v1');
});
```

另新增：交叉 placement 正向無空格時，依 placement 內順序選第一個其他空格。

- [ ] **Step 3: 執行交叉測試，確認 RED**

Run:

```bash
npm run compile:core && node --test --test-name-pattern="crossing|switches" tests/puzzle-engine.test.mjs
```

Expected: FAIL。

- [ ] **Step 4: 實作交叉 placement 搜尋**

在 `findNextPuzzleCell` 第二階段：

```ts
const currentCell = session.board.cells.get(currentCellKey);
const crossingPlacementIds = currentCell?.placementIds.filter(
  (placementId) => placementId !== preferredPlacementId
) ?? [];

for (const placementId of crossingPlacementIds) {
  const placement = placementById(session, placementId);
  if (placement === undefined) continue;
  const keys = placementCellKeys(placement);
  const crossingIndex = keys.indexOf(currentCellKey);
  const forward = keys.slice(Math.max(0, crossingIndex + 1))
    .find((key) => isEmptyTarget(session, key));
  const fallback = keys.find((key) => isEmptyTarget(session, key));
  const target = forward ?? fallback;
  if (target !== undefined) {
    return Object.freeze({ cellKey: target, preferredPlacementId: placementId });
  }
}
```

- [ ] **Step 5: 實作直接相連 placement 搜尋**

建立 placement graph：兩個 placement 只要共享一個 `PuzzleCell.placementIds` 即視為直接相連。搜尋順序：

1. preferred placement 的直接鄰居。
2. current cell 所屬 placement 的直接鄰居。
3. 去除重複 placement id。
4. 候選只包含空白格。
5. 依曼哈頓距離、row、column、placement id 排序。

使用：

```ts
function manhattanDistance(from: PuzzleCell, to: PuzzleCell): number {
  return Math.abs(from.row - to.row) + Math.abs(from.column - to.column);
}
```

- [ ] **Step 6: 補上距離相同的穩定排序測試**

建立兩個等距空格，斷言 row 較小者優先；row 相同時 column 較小者優先。

- [ ] **Step 7: 執行 puzzle engine 測試**

Run:

```bash
npm run compile:core && node --test tests/puzzle-engine.test.mjs
```

Expected: PASS。

- [ ] **Step 8: Commit**

```bash
git add src/puzzle/puzzle-engine.ts tests/puzzle-engine.test.mjs
git commit -m "feat: navigate puzzle crossings"
```

---

### Task 4: 全盤最近空格、錯誤格巡回與完成狀態

**Files:**
- Modify: `src/puzzle/puzzle-engine.ts`
- Test: `tests/puzzle-engine.test.mjs`

**Interfaces:**
- Consumes: `isEmptyTarget()`、`isWrongTarget()`、`findNextPuzzleCell()`。
- Produces: 完整五階段跳轉與完成後空選取狀態。

- [ ] **Step 1: 寫全盤最近空格測試**

新增：

```js
test('when no connected empty cell exists, selects the nearest board empty cell', () => {
  const current = makeDisconnectedNavigationSession();
  const navigation = findNextPuzzleCell(current, '2:2', null);
  assert.equal(navigation.cellKey, '1:2');
});
```

測試資料需同時有兩個以上候選，以驗證曼哈頓距離與 row／column tie-break。

- [ ] **Step 2: 寫「先空格、後錯字」失敗測試**

```js
test('does not revisit a wrong cell while any empty cell remains', () => {
  let current = session();
  current = selectPuzzleCell(current, '0:1');
  current = placePuzzleTile(current, tileFor(current, '風').id).session;
  assert.notEqual(current.selectedCellKey, '0:1');
  assert.equal(current.values[current.selectedCellKey], undefined);
});

test('after all fillable cells contain text, revisits the first wrong cell', () => {
  const current = fillEveryCellWithAtLeastOneWrongAnswer();
  assert.equal(current.status, 'playing');
  assert.equal(current.selectedCellKey, firstWrongKeyByRowColumn(current));
});
```

- [ ] **Step 3: 寫完成後取消選取測試**

擴充既有完成測試：

```js
assert.equal(current.status, 'completed');
assert.equal(current.selectedCellKey, null);
assert.equal(current.preferredPlacementId, null);
```

- [ ] **Step 4: 執行新增測試，確認 RED**

Run:

```bash
npm run compile:core && node --test --test-name-pattern="nearest|wrong cell|completed" tests/puzzle-engine.test.mjs
```

Expected: FAIL。

- [ ] **Step 5: 實作全盤最近空格 fallback**

在 `findNextPuzzleCell` 第四階段：

```ts
const currentCell = session.board.cells.get(currentCellKey);
const emptyTargets = [...session.board.cells.values()]
  .filter((cell) => isEmptyTarget(session, cell.key))
  .sort((left, right) =>
    (currentCell === undefined ? 0 : manhattanDistance(currentCell, left))
      - (currentCell === undefined ? 0 : manhattanDistance(currentCell, right))
    || left.row - right.row
    || left.column - right.column
  );

if (emptyTargets[0] !== undefined) {
  const target = emptyTargets[0];
  return Object.freeze({
    cellKey: target.key,
    preferredPlacementId: derivePreferredPlacementId(session, target.key)
  });
}
```

- [ ] **Step 6: 只有空白格耗盡後才巡回錯誤格**

第五階段：

```ts
const wrongTargets = [...session.board.cells.values()]
  .filter((cell) => isWrongTarget(session, cell.key))
  .sort((left, right) => left.row - right.row || left.column - right.column);

const firstWrong = wrongTargets[0];
if (firstWrong !== undefined) {
  return Object.freeze({
    cellKey: firstWrong.key,
    preferredPlacementId: derivePreferredPlacementId(session, firstWrong.key)
  });
}

return Object.freeze({ cellKey: null, preferredPlacementId: null });
```

- [ ] **Step 7: 完成狀態強制清空選取與方向**

`withCompletionState` 或 `placePuzzleTile` 建立 completed Session 時：

```ts
selectedCellKey: status === 'completed' ? null : session.selectedCellKey,
preferredPlacementId: status === 'completed' ? null : session.preferredPlacementId
```

不得讓 `usePuzzleHint`、`removePuzzleCell` 或 `clearPuzzleEntries` 產生 completed 且仍有選取格的 Session。

- [ ] **Step 8: 執行 puzzle engine 全測試**

Run:

```bash
npm run compile:core && node --test tests/puzzle-engine.test.mjs
```

Expected: PASS。

- [ ] **Step 9: Commit**

```bash
git add src/puzzle/puzzle-engine.ts tests/puzzle-engine.test.mjs
git commit -m "feat: complete puzzle auto advance flow"
```

---

### Task 5: 覆蓋、提示、移除與清空的方向一致性

**Files:**
- Modify: `src/puzzle/puzzle-engine.ts`
- Test: `tests/puzzle-engine.test.mjs`

**Interfaces:**
- Consumes: `derivePreferredPlacementId()`、`findNextPuzzleCell()`。
- Produces: 所有 Session 操作後一致的 `selectedCellKey`／`preferredPlacementId`。

- [ ] **Step 1: 寫覆蓋錯字後跳轉測試**

```js
test('replacing a wrong tile releases the old tile and continues auto advance', () => {
  let current = session();
  current = selectPuzzleCell(current, '0:1');
  const wrong = tileFor(current, '風');
  current = placePuzzleTile(current, wrong.id).session;
  current = selectPuzzleCell(current, '0:1');
  const correct = tileFor(current, '心');
  const result = placePuzzleTile(current, correct.id);
  assert.equal(result.session.tiles.find((tile) => tile.id === wrong.id)?.usedBy, null);
  assert.notEqual(result.session.selectedCellKey, '0:1');
});
```

- [ ] **Step 2: 寫手動選交叉格方向推導測試**

新增兩項：

1. 未完成數較多的 placement 優先。
2. 未完成數相同時 horizontal placement 優先。

- [ ] **Step 3: 寫移除與提示後方向一致性測試**

要求：

- `removePuzzleCell(session, key)` 選取被移除格，並重新推導其 `preferredPlacementId`。
- `usePuzzleHint(session)` 填入提示格後，若關卡未完成，使用 `findNextPuzzleCell` 移到下一個空格；若完成則兩欄位皆為 `null`。
- `clearPuzzleEntries(session)` 選第一個可填格並重新推導方向。

- [ ] **Step 4: 執行新增測試，確認 RED**

Run:

```bash
npm run compile:core && node --test --test-name-pattern="replacing|manual|hint|clear" tests/puzzle-engine.test.mjs
```

Expected: 至少一項 FAIL。

- [ ] **Step 5: 實作操作後的方向同步**

避免在 React 層修正。所有狀態變化都由 `puzzle-engine.ts` 回傳完整 Session：

```ts
removePuzzleCell -> selectedCellKey = key, preferredPlacementId = derivePreferredPlacementId(...)
usePuzzleHint -> completed ? null/null : findNextPuzzleCell(...)
clearPuzzleEntries -> firstKey + derivePreferredPlacementId(...)
```

- [ ] **Step 6: 執行全部 puzzle 測試**

Run:

```bash
npm run test:puzzle
```

Expected: PASS。

- [ ] **Step 7: Commit**

```bash
git add src/puzzle/puzzle-engine.ts tests/puzzle-engine.test.mjs
git commit -m "test: cover puzzle navigation state transitions"
```

---

### Task 6: 文件、完整 Gate 與交付

**Files:**
- Modify: `README.md`
- Verify: all project files

**Interfaces:**
- Consumes: 完成的自動跳格行為。
- Produces: 使用說明與可合併的完整驗證證據。

- [ ] **Step 1: 更新 README 操作規則**

在「成語填字闖關規則」加入：

```markdown
- 每放入一個候選字後會自動移到下一個空格；填錯的字會保留紅色，但不會中斷連續輸入。
- 系統會先走完所有空格，全部填滿後才自動回到錯誤格修正。
```

- [ ] **Step 2: 執行核心 puzzle 測試**

Run:

```bash
npm run test:puzzle
```

Expected: 所有 puzzle board、engine、levels 測試通過，0 failure。

- [ ] **Step 3: 執行完整測試**

Run:

```bash
npm run test
```

Expected: 所有 data、index、game、loader、PWA、puzzle、progress、bonus 測試通過，0 failure。

- [ ] **Step 4: 執行 strict typecheck**

Run:

```bash
npm run typecheck
```

Expected: exit 0，無 TypeScript error。

- [ ] **Step 5: 執行 ESLint**

Run:

```bash
npm run lint
```

Expected: exit 0，0 errors。

- [ ] **Step 6: 執行 production build**

Run:

```bash
npm run build
```

Expected: exit 0，產生 Vite PWA production bundle。

- [ ] **Step 7: 比對分支**

Run:

```bash
git fetch origin
git rev-list --left-right --count origin/main...HEAD
```

Expected: behind 為 `0`；若 main 有新提交，先整合再重跑完整 Gate。

- [ ] **Step 8: Commit 文件**

```bash
git add README.md
git commit -m "docs: explain puzzle auto advance"
```

- [ ] **Step 9: 更新 PR 驗證摘要**

PR 說明需列出：

- 新增測試數與總測試通過數。
- typecheck、lint、production build 結果。
- branch ahead／behind。
- 實機尚未驗證的項目不得宣稱已完成。

---

## Final Review Checklist

- [ ] `PuzzleSession` 所有建立點都提供 `preferredPlacementId`。
- [ ] 填對與填錯都會跳格。
- [ ] 有空白格時不會跳回錯字格。
- [ ] 不會跳到固定格或已填正確格。
- [ ] 同方向、交叉、相連、全盤最近、錯字巡回五階段順序明確。
- [ ] 曼哈頓距離 tie-break 可重現。
- [ ] 手動選格、覆蓋、提示、移除、清空後方向一致。
- [ ] completed Session 的選取格與方向皆為 `null`。
- [ ] React、progress schema、關卡資料與其他遊戲模式未被不必要修改。
- [ ] 全部 Repository Gate 通過後才可合併。
