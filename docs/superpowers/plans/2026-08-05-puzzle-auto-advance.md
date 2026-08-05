# 成語填字輸入格智慧自動跳轉 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓玩家在填字主玩法中每放入一個候選字後，自動選到下一個可輸入格；無論填對或填錯都跳格，先走完所有空格，之後再巡回紅色錯誤格。

**Architecture:** 跳轉規則維持在純 TypeScript `puzzle-engine`，`PuzzleSession` 新增 `preferredPlacementId` 保存目前成語方向。React 不新增判斷，只依 Session 的 `selectedCellKey` 呈現高亮格；既有關卡、進度、IndexedDB、自由接龍與打地鼠模組不變。

**Tech Stack:** TypeScript 6、Node.js built-in test runner、React 19、Vite 8。

## Global Constraints

- 任一有效候選字成功寫入目前格後，不論正確或錯誤，都必須自動跳格。
- 盤面仍有空白可填格時，不得提前跳回已有文字的錯誤格。
- 優先沿目前 placement 正向前進；再轉相交 placement；再找直接相連 placement；最後找全盤最近空格。
- 最近格使用曼哈頓距離；距離相同時依 row、column 升冪決定。
- 所有空格填滿後，才依 row、column 順序巡回錯誤格。
- 固定提示格與已填正確格不得成為一般跳轉目標。
- 關卡完成時 `selectedCellKey` 與 `preferredPlacementId` 都必須為 `null`。
- 不修改 IndexedDB progress schema、星級規則、關卡資料、自由接龍或打地鼠功能。
- 提示功能維持既有行為：提示填入哪一格，就選取該格；本次不把提示改成自動前進。
- 不增加新套件。
- 所有變更必須通過 `npm run test`、`npm run typecheck`、`npm run lint`、`npm run build`。

---

## File Map

- Modify: `src/domain/puzzle.ts` — 在 `PuzzleSession` 增加方向偏好欄位。
- Modify: `src/puzzle/puzzle-engine.ts` — 推導 placement、尋找下一格、整合放字／選格／提示／移除／清空流程。
- Modify: `tests/puzzle-engine.test.mjs` — 新增智慧跳格、交叉轉向、最近格、錯字巡回與完成狀態測試。
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
  - `placementCellKeys(placement: PuzzlePlacement): readonly string[]`
  - `derivePreferredPlacementId(session: PuzzleSession, key: string): string | null`

- [ ] **Step 1: 寫初始方向的失敗測試**

在 `tests/puzzle-engine.test.mjs` 新增：

```js
test('new session selects the first fillable cell and derives a placement direction', () => {
  const current = session();
  assert.equal(current.selectedCellKey, '0:1');
  assert.equal(current.preferredPlacementId, 'p1');
});
```

- [ ] **Step 2: 執行單一測試，確認 RED**

```bash
npm run compile:core && node --test --test-name-pattern="new session selects" tests/puzzle-engine.test.mjs
```

Expected: FAIL，因為 `preferredPlacementId` 尚不存在。

- [ ] **Step 3: 擴充 `PuzzleSession` 型別**

在 `src/domain/puzzle.ts` 的 `PuzzleSession` 增加：

```ts
readonly preferredPlacementId: string | null;
```

- [ ] **Step 4: 實作 placement 座標與方向排序 helper**

在 `src/puzzle/puzzle-engine.ts` 從 `../domain/puzzle.js` 匯入 `PuzzlePlacement`，新增：

```ts
function placementCellKeys(placement: PuzzlePlacement): readonly string[] {
  return Object.freeze([...placement.text].map((_, index) =>
    placement.direction === 'horizontal'
      ? `${placement.startRow}:${placement.startColumn + index}`
      : `${placement.startRow + index}:${placement.startColumn}`
  ));
}

function placementById(session: PuzzleSession, placementId: string): PuzzlePlacement | undefined {
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

function directionRank(direction: PuzzlePlacement['direction']): number {
  return direction === 'horizontal' ? 0 : 1;
}

function derivePreferredPlacementId(
  session: PuzzleSession,
  key: string
): string | null {
  const cell = session.board.cells.get(key);
  if (cell === undefined || cell.fixed || cell.placementIds.length === 0) return null;

  const ranked = cell.placementIds
    .map((placementId) => {
      const placement = placementById(session, placementId);
      return placement === undefined
        ? null
        : {
            placementId,
            placement,
            unresolved: unresolvedCountForPlacement(session, placementId)
          };
    })
    .filter((candidate) => candidate !== null)
    .sort((left, right) =>
      right.unresolved - left.unresolved
      || directionRank(left.placement.direction) - directionRank(right.placement.direction)
      || left.placementId.localeCompare(right.placementId)
    );

  return ranked[0]?.placementId ?? null;
}
```

- [ ] **Step 5: 初始化 Session 時寫入偏好方向**

`createPuzzleSession` 先建立 `preferredPlacementId: null` 的 base Session，再推導第一格：

```ts
const firstKey = board.fillableKeys[0] ?? null;
const baseSession: PuzzleSession = Object.freeze({
  board,
  values: Object.freeze({}),
  tileByCell: Object.freeze({}),
  tiles: orderedTiles,
  selectedCellKey: firstKey,
  preferredPlacementId: null,
  status: 'playing',
  score: 0,
  mistakes: 0,
  hintsUsed: 0,
  correctCells: 0
});

return firstKey === null
  ? baseSession
  : Object.freeze({
      ...baseSession,
      preferredPlacementId: derivePreferredPlacementId(baseSession, firstKey)
    });
```

- [ ] **Step 6: 手動選格與清空時重新推導方向**

`selectPuzzleCell`：

```ts
return Object.freeze({
  ...session,
  selectedCellKey: key,
  preferredPlacementId: derivePreferredPlacementId(session, key)
});
```

`clearPuzzleEntries` 建立清空後 base Session，再用第一個可填格推導方向。

- [ ] **Step 7: 執行 puzzle engine 測試**

```bash
npm run compile:core && node --test tests/puzzle-engine.test.mjs
```

Expected: PASS，既有測試不退化。

- [ ] **Step 8: Commit**

```bash
git add src/domain/puzzle.ts src/puzzle/puzzle-engine.ts tests/puzzle-engine.test.mjs
git commit -m "feat: track preferred puzzle placement"
```

---

### Task 2: 同方向前進與一般跳轉目標

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

- [ ] **Step 1: 寫填對與填錯都前進的失敗測試**

```js
test('placing a correct tile advances to the next empty cell', () => {
  let current = selectPuzzleCell(session(), '0:1');
  const result = placePuzzleTile(current, tileFor(current, '心').id);
  assert.equal(result.correct, true);
  assert.equal(result.session.selectedCellKey, '0:2');
  assert.equal(result.session.preferredPlacementId, 'p1');
});

test('placing a wrong tile keeps the red value and still advances', () => {
  let current = selectPuzzleCell(session(), '0:1');
  const result = placePuzzleTile(current, tileFor(current, '風').id);
  assert.equal(result.correct, false);
  assert.equal(result.session.values['0:1'], '風');
  assert.equal(result.session.selectedCellKey, '0:2');
  assert.equal(result.session.preferredPlacementId, 'p1');
});
```

- [ ] **Step 2: 寫略過固定格與已填正確格的失敗測試**

```js
test('auto advance skips fixed cells and already correct cells', () => {
  let current = session();
  current = selectPuzzleCell(current, '0:2');
  current = placePuzzleTile(current, tileFor(current, '一').id).session;
  current = selectPuzzleCell(current, '0:1');
  const result = placePuzzleTile(current, tileFor(current, '心').id);
  assert.equal(result.session.selectedCellKey, '0:3');
});
```

- [ ] **Step 3: 執行新增測試，確認 RED**

```bash
npm run compile:core && node --test --test-name-pattern="advances|auto advance" tests/puzzle-engine.test.mjs
```

Expected: FAIL，現有引擎仍停留在原格。

- [ ] **Step 4: 建立跳轉目標判斷**

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

一般跳轉階段只能使用 `isEmptyTarget`。

- [ ] **Step 5: 實作 preferred placement 正向搜尋**

在 `findNextPuzzleCell` 第一階段：

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

- [ ] **Step 6: 在 `placePuzzleTile` 寫入後呼叫跳轉**

順序固定為：

1. 釋放目前格原字牌。
2. 寫入新字牌、`values` 與 `tileByCell`。
3. 計算正誤、分數、錯誤次數與完成狀態。
4. completed 時設為 `selectedCellKey: null`、`preferredPlacementId: null`。
5. playing 時呼叫 `findNextPuzzleCell`，把結果寫回 Session。

無效字牌、已使用字牌、無選取格或 completed Session 不得跳轉。

- [ ] **Step 7: 執行 puzzle engine 測試**

```bash
npm run compile:core && node --test tests/puzzle-engine.test.mjs
```

Expected: PASS。

- [ ] **Step 8: Commit**

```bash
git add src/puzzle/puzzle-engine.ts tests/puzzle-engine.test.mjs
git commit -m "feat: auto advance within puzzle placement"
```

---

### Task 3: 交叉轉向與直接相連 placement

**Files:**
- Modify: `src/puzzle/puzzle-engine.ts`
- Test: `tests/puzzle-engine.test.mjs`

**Interfaces:**
- Consumes: `findNextPuzzleCell()` 第一階段、`PuzzleCell.placementIds`。
- Produces: 交叉 placement 與直接相連 placement 的決定性搜尋。

- [ ] **Step 1: 建立有效的三成語交叉測試盤面**

在 `tests/puzzle-engine.test.mjs` 新增：

```js
const crossLevel = {
  id: 'level-099', chapterId: 'chapter-1', levelNumber: 99, title: '交叉測試',
  width: 7, height: 4,
  placements: [
    { id: 'h1', idiomId: 'h1', text: '一心一意', direction: 'horizontal', startRow: 0, startColumn: 0 },
    { id: 'v1', idiomId: 'v1', text: '意氣風發', direction: 'vertical', startRow: 0, startColumn: 3 },
    { id: 'h2', idiomId: 'h2', text: '發人深省', direction: 'horizontal', startRow: 3, startColumn: 3 }
  ],
  fixedCells: ['0:0'], difficulty: 'easy', hintLimit: 3
};

function crossSession() {
  return createPuzzleSession(buildPuzzleBoard(crossLevel), (items) => items);
}

function fillCorrectExcept(current, excludedKeys) {
  for (const key of current.board.fillableKeys) {
    if (excludedKeys.includes(key)) continue;
    const answer = current.board.cells.get(key)?.answer;
    assert.ok(answer);
    current = selectPuzzleCell(current, key);
    current = placePuzzleTile(current, tileFor(current, answer).id).session;
  }
  return current;
}
```

此盤面交叉關係固定為：`h1` 的「意」與 `v1` 起點相交；`v1` 的「發」與 `h2` 起點相交。

- [ ] **Step 2: 寫交叉轉向失敗測試**

```js
test('when preferred placement has no empty cells, auto advance switches at the crossing', () => {
  let current = crossSession();
  current = fillCorrectExcept(current, ['0:3', '1:3']);
  current = selectPuzzleCell(current, '0:3');
  const result = placePuzzleTile(current, tileFor(current, '意').id);
  assert.equal(result.session.selectedCellKey, '1:3');
  assert.equal(result.session.preferredPlacementId, 'v1');
});
```

- [ ] **Step 3: 寫交叉 placement 反向 fallback 測試**

```js
test('crossing placement falls back to its first empty cell when no forward cell remains', () => {
  let current = crossSession();
  current = fillCorrectExcept(current, ['1:3', '3:4']);
  current = selectPuzzleCell(current, '3:3');
  const result = placePuzzleTile(current, tileFor(current, '發').id);
  assert.equal(result.session.selectedCellKey, '3:4');
  assert.equal(result.session.preferredPlacementId, 'h2');
});
```

- [ ] **Step 4: 執行交叉測試，確認 RED**

```bash
npm run compile:core && node --test --test-name-pattern="crossing" tests/puzzle-engine.test.mjs
```

Expected: FAIL。

- [ ] **Step 5: 實作交叉 placement 搜尋**

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

- [ ] **Step 6: 實作直接相連 placement 搜尋**

新增：

```ts
function connectedPlacementIds(session: PuzzleSession, placementId: string): readonly string[] {
  const result = new Set<string>();
  for (const cell of session.board.cells.values()) {
    if (!cell.placementIds.includes(placementId)) continue;
    for (const candidateId of cell.placementIds) {
      if (candidateId !== placementId) result.add(candidateId);
    }
  }
  return Object.freeze([...result].sort());
}

function manhattanDistance(from: PuzzleCell, to: PuzzleCell): number {
  return Math.abs(from.row - to.row) + Math.abs(from.column - to.column);
}
```

候選 placement id 依序取：preferred placement 的鄰居，再取 current cell 所屬 placements 的鄰居；使用 `Set` 去重。候選格只取空白格，依「距離、row、column、placement id」排序，第一個即為第三階段結果。

- [ ] **Step 7: 執行 puzzle engine 測試**

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

### Task 4: 全盤最近空格與錯誤格巡回

**Files:**
- Modify: `src/puzzle/puzzle-engine.ts`
- Test: `tests/puzzle-engine.test.mjs`

**Interfaces:**
- Consumes: `isEmptyTarget()`、`isWrongTarget()`、`manhattanDistance()`。
- Produces: 完整五階段跳轉與完成後空選取狀態。

- [ ] **Step 1: 建立全盤 fallback 測試盤面**

```js
const fallbackLevel = {
  id: 'level-098', chapterId: 'chapter-1', levelNumber: 98, title: '最近格測試',
  width: 8, height: 5,
  placements: [
    { id: 'top', idiomId: 'top', text: '一心一意', direction: 'horizontal', startRow: 0, startColumn: 0 },
    { id: 'bottom', idiomId: 'bottom', text: '四通八達', direction: 'horizontal', startRow: 4, startColumn: 4 }
  ],
  fixedCells: ['0:0', '4:4'], difficulty: 'easy', hintLimit: 3
};

function fallbackSession() {
  return createPuzzleSession(buildPuzzleBoard(fallbackLevel), (items) => items);
}
```

- [ ] **Step 2: 寫全盤最近空格失敗測試**

```js
test('when no connected empty cell exists, selects the nearest board empty cell', () => {
  let current = fallbackSession();
  current = fillCorrectExcept(current, ['4:5', '4:6', '4:7']);
  const navigation = findNextPuzzleCell(current, '0:3', 'top');
  assert.equal(navigation.cellKey, '4:5');
  assert.equal(navigation.preferredPlacementId, 'bottom');
});
```

- [ ] **Step 3: 寫距離相同時 row／column tie-break 測試**

建立 `tieLevel`：

```js
const tieLevel = {
  id: 'level-097', chapterId: 'chapter-1', levelNumber: 97, title: '排序測試',
  width: 5, height: 4,
  placements: [
    { id: 'source', idiomId: 'source', text: '一心一意', direction: 'horizontal', startRow: 2, startColumn: 0 },
    { id: 'target', idiomId: 'target', text: '四通八達', direction: 'vertical', startRow: 0, startColumn: 4 }
  ],
  fixedCells: ['2:0', '0:4'], difficulty: 'easy', hintLimit: 3
};
```

填滿除 `1:4`、`3:4` 外的所有可填格，從 `2:2` 呼叫 `findNextPuzzleCell`；兩格距離皆為 3，斷言選 `1:4`。再建立同 row 的等距候選，斷言 column 較小者優先。

- [ ] **Step 4: 寫「先空格、後錯字」失敗測試**

```js
test('does not revisit a wrong cell while any empty cell remains', () => {
  let current = session();
  current = selectPuzzleCell(current, '0:1');
  current = placePuzzleTile(current, tileFor(current, '風').id).session;
  assert.notEqual(current.selectedCellKey, '0:1');
  assert.equal(current.values[current.selectedCellKey], undefined);
});

test('after all fillable cells contain text, revisits the first wrong cell', () => {
  let current = session();
  for (const key of current.board.fillableKeys) {
    const answer = current.board.cells.get(key)?.answer;
    assert.ok(answer);
    current = selectPuzzleCell(current, key);
    const available = current.tiles.find((tile) => tile.usedBy === null);
    assert.ok(available);
    current = placePuzzleTile(current, available.id).session;
  }
  const wrongKeys = current.board.fillableKeys
    .filter((key) => current.values[key] !== current.board.cells.get(key)?.answer)
    .sort((left, right) => {
      const [leftRow, leftColumn] = left.split(':').map(Number);
      const [rightRow, rightColumn] = right.split(':').map(Number);
      return leftRow - rightRow || leftColumn - rightColumn;
    });
  assert.ok(wrongKeys.length > 0);
  assert.equal(current.status, 'playing');
  assert.equal(current.selectedCellKey, wrongKeys[0]);
});
```

- [ ] **Step 5: 擴充完成測試**

在既有 `completes the level...` 測試增加：

```js
assert.equal(current.selectedCellKey, null);
assert.equal(current.preferredPlacementId, null);
```

- [ ] **Step 6: 執行新增測試，確認 RED**

```bash
npm run compile:core && node --test --test-name-pattern="nearest|wrong cell|completed|tie" tests/puzzle-engine.test.mjs
```

Expected: FAIL。

- [ ] **Step 7: 實作全盤最近空格 fallback**

在 `findNextPuzzleCell` 第四階段：

```ts
const origin = session.board.cells.get(currentCellKey);
const emptyTargets = [...session.board.cells.values()]
  .filter((cell) => isEmptyTarget(session, cell.key))
  .sort((left, right) =>
    (origin === undefined ? 0 : manhattanDistance(origin, left))
      - (origin === undefined ? 0 : manhattanDistance(origin, right))
    || left.row - right.row
    || left.column - right.column
  );

const nearest = emptyTargets[0];
if (nearest !== undefined) {
  return Object.freeze({
    cellKey: nearest.key,
    preferredPlacementId: derivePreferredPlacementId(session, nearest.key)
  });
}
```

- [ ] **Step 8: 空白格耗盡後巡回錯誤格**

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

- [ ] **Step 9: completed Session 強制清空選取與方向**

`withCompletionState` 回傳：

```ts
return Object.freeze({
  ...session,
  correctCells,
  status,
  selectedCellKey: status === 'completed' ? null : session.selectedCellKey,
  preferredPlacementId: status === 'completed' ? null : session.preferredPlacementId
});
```

- [ ] **Step 10: 執行 puzzle engine 全測試**

```bash
npm run compile:core && node --test tests/puzzle-engine.test.mjs
```

Expected: PASS。

- [ ] **Step 11: Commit**

```bash
git add src/puzzle/puzzle-engine.ts tests/puzzle-engine.test.mjs
git commit -m "feat: complete puzzle auto advance flow"
```

---

### Task 5: 覆蓋、提示、移除與清空的一致性

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

```js
test('manual selection prefers the placement with more unresolved cells', () => {
  let current = crossSession();
  current = fillCorrectExcept(current, ['0:3', '1:3', '2:3']);
  current = selectPuzzleCell(current, '0:3');
  assert.equal(current.preferredPlacementId, 'v1');
});

test('manual selection prefers horizontal when unresolved counts tie', () => {
  const current = selectPuzzleCell(crossSession(), '0:3');
  assert.equal(current.preferredPlacementId, 'h1');
});
```

- [ ] **Step 3: 寫移除、提示與清空方向測試**

```js
test('removing a cell selects it and re-derives its placement', () => {
  let current = selectPuzzleCell(session(), '0:1');
  current = placePuzzleTile(current, tileFor(current, '心').id).session;
  const removed = removePuzzleCell(current, '0:1');
  assert.equal(removed.selectedCellKey, '0:1');
  assert.equal(removed.preferredPlacementId, 'p1');
});

test('hint keeps the hinted cell selected and derives its placement', () => {
  const hinted = usePuzzleHint(session());
  assert.equal(hinted.hintedCellKey, '0:1');
  assert.equal(hinted.session.selectedCellKey, '0:1');
  assert.equal(hinted.session.preferredPlacementId, 'p1');
});

test('clear resets selection and placement to the first fillable cell', () => {
  let current = selectPuzzleCell(session(), '0:2');
  current = placePuzzleTile(current, tileFor(current, '一').id).session;
  const cleared = clearPuzzleEntries(current);
  assert.equal(cleared.selectedCellKey, '0:1');
  assert.equal(cleared.preferredPlacementId, 'p1');
});
```

- [ ] **Step 4: 執行新增測試，確認 RED**

```bash
npm run compile:core && node --test --test-name-pattern="replacing|manual selection|removing|hint keeps|clear resets" tests/puzzle-engine.test.mjs
```

Expected: 至少一項 FAIL。

- [ ] **Step 5: 同步所有狀態操作**

- `removePuzzleCell`：選取被移除格，並用清除後 Session 推導 `preferredPlacementId`。
- `usePuzzleHint`：維持 hinted cell 為選取格，推導該格方向；若提示完成關卡，兩欄位都為 `null`。
- `clearPuzzleEntries`：回到第一個可填格並推導方向。
- `selectPuzzleCell`：每次手動點格都重新推導方向。

不得在 React 層修補 Session。

- [ ] **Step 6: 執行全部 puzzle 測試**

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

```bash
npm run test:puzzle
```

Expected: 所有 puzzle board、engine、levels 測試通過，0 failure。

- [ ] **Step 3: 執行完整測試**

```bash
npm run test
```

Expected: 所有 data、index、game、loader、PWA、puzzle、progress、bonus 測試通過，0 failure。

- [ ] **Step 4: 執行 strict typecheck**

```bash
npm run typecheck
```

Expected: exit 0，無 TypeScript error。

- [ ] **Step 5: 執行 ESLint**

```bash
npm run lint
```

Expected: exit 0，0 errors。

- [ ] **Step 6: 執行 production build**

```bash
npm run build
```

Expected: exit 0，產生 Vite PWA production bundle。

- [ ] **Step 7: 比對分支**

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

PR 說明必須列出：

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
