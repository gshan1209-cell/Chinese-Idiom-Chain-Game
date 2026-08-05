# 成語填字輸入格智慧自動跳轉 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 讓玩家每放入一個候選字後，自動選到下一個可輸入格；無論填對或填錯都跳格，先走完所有空格，之後再巡回紅色錯誤格。

**Architecture:** 跳轉規則維持在純 TypeScript `puzzle-engine`，`PuzzleSession` 新增 `preferredPlacementId` 保存目前成語方向。React 不新增判斷，只依 Session 的 `selectedCellKey` 呈現高亮格；關卡、進度、IndexedDB、自由接龍與打地鼠模組不變。

**Tech Stack:** TypeScript 6、Node.js built-in test runner、React 19、Vite 8。

## Global Constraints

- 任一有效候選字成功寫入目前格後，不論正確或錯誤，都必須自動跳格。
- 仍有空白可填格時，不得提前跳回已有文字的錯誤格。
- 順序固定為：目前 placement 正向 → 當前交叉 placement → 直接相連 placement → 全盤最近空格 → 第一個錯誤格。
- 最近格使用曼哈頓距離；距離相同時依 row、column 升冪決定。
- 固定提示格與已填正確格不得成為一般跳轉目標。
- 關卡完成時 `selectedCellKey` 與 `preferredPlacementId` 都為 `null`。
- 提示維持既有行為：提示填入哪一格，就選取該格；本次不讓提示自動前進。
- 不修改 progress schema、星級規則、關卡資料、自由接龍或打地鼠。
- 不增加新套件。
- 必須通過 `npm run test`、`npm run typecheck`、`npm run lint`、`npm run build`。

## File Map

- Modify: `src/domain/puzzle.ts` — 增加 Session 方向偏好欄位。
- Modify: `src/puzzle/puzzle-engine.ts` — placement 推導、跳格純函式與狀態整合。
- Modify: `tests/puzzle-engine.test.mjs` — 所有新規則的 TDD 測試。
- Modify: `README.md` — 說明自動跳格。

---

### Task 1: Session 方向偏好

**Files:**
- Modify: `src/domain/puzzle.ts`
- Modify: `src/puzzle/puzzle-engine.ts`
- Test: `tests/puzzle-engine.test.mjs`

**Interfaces:**
- Produces:

```ts
readonly preferredPlacementId: string | null;
```

以及 `puzzle-engine.ts` 內部函式：

```ts
placementCellKeys(placement: PuzzlePlacement): readonly string[]
derivePreferredPlacementId(session: PuzzleSession, key: string): string | null
```

- [ ] **Step 1: 寫失敗測試**

```js
test('new session derives a placement for the first fillable cell', () => {
  const current = session();
  assert.equal(current.selectedCellKey, '0:1');
  assert.equal(current.preferredPlacementId, 'p1');
});
```

- [ ] **Step 2: 驗證 RED**

```bash
npm run compile:core && node --test --test-name-pattern="derives a placement" tests/puzzle-engine.test.mjs
```

Expected: FAIL，`preferredPlacementId` 尚不存在。

- [ ] **Step 3: 擴充領域型別**

在 `PuzzleSession` 增加：

```ts
readonly preferredPlacementId: string | null;
```

- [ ] **Step 4: 實作 placement helper**

```ts
function placementCellKeys(placement: PuzzlePlacement): readonly string[] {
  return Object.freeze([...placement.text].map((_, index) =>
    placement.direction === 'horizontal'
      ? `${placement.startRow}:${placement.startColumn + index}`
      : `${placement.startRow + index}:${placement.startColumn}`
  ));
}

function placementById(
  session: PuzzleSession,
  placementId: string
): PuzzlePlacement | undefined {
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
  if (cell === undefined || cell.fixed) return null;

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

- [ ] **Step 5: 初始化、手動選格與清空時寫入偏好**

`createPuzzleSession` 先建立 `preferredPlacementId: null` 的 base Session，再以第一個可填格推導；`selectPuzzleCell` 每次手動選格重新推導；`clearPuzzleEntries` 清空後回到第一個可填格並重新推導。

- [ ] **Step 6: 驗證 GREEN**

```bash
npm run compile:core && node --test tests/puzzle-engine.test.mjs
```

- [ ] **Step 7: Commit**

```bash
git add src/domain/puzzle.ts src/puzzle/puzzle-engine.ts tests/puzzle-engine.test.mjs
git commit -m "feat: track preferred puzzle placement"
```

---

### Task 2: 同方向自動前進

**Files:**
- Modify: `src/puzzle/puzzle-engine.ts`
- Test: `tests/puzzle-engine.test.mjs`

**Interfaces:**

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

- [ ] **Step 1: 寫填對、填錯都前進的失敗測試**

```js
test('correct tile advances to the next empty cell', () => {
  let current = selectPuzzleCell(session(), '0:1');
  const result = placePuzzleTile(current, tileFor(current, '心').id);
  assert.equal(result.correct, true);
  assert.equal(result.session.selectedCellKey, '0:2');
  assert.equal(result.session.preferredPlacementId, 'p1');
});

test('wrong tile remains visible and still advances', () => {
  let current = selectPuzzleCell(session(), '0:1');
  const result = placePuzzleTile(current, tileFor(current, '風').id);
  assert.equal(result.correct, false);
  assert.equal(result.session.values['0:1'], '風');
  assert.equal(result.session.selectedCellKey, '0:2');
});
```

- [ ] **Step 2: 寫略過正確格的失敗測試**

```js
test('auto advance skips fixed and already correct cells', () => {
  let current = session();
  current = selectPuzzleCell(current, '0:2');
  current = placePuzzleTile(current, tileFor(current, '一').id).session;
  current = selectPuzzleCell(current, '0:1');
  const result = placePuzzleTile(current, tileFor(current, '心').id);
  assert.equal(result.session.selectedCellKey, '0:3');
});
```

- [ ] **Step 3: 驗證 RED**

```bash
npm run compile:core && node --test --test-name-pattern="advances|auto advance" tests/puzzle-engine.test.mjs
```

- [ ] **Step 4: 實作目標判斷**

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

- [ ] **Step 5: 實作目前 placement 正向搜尋**

```ts
const preferred = preferredPlacementId === null
  ? undefined
  : placementById(session, preferredPlacementId);
const keys = preferred === undefined ? [] : placementCellKeys(preferred);
const currentIndex = keys.indexOf(currentCellKey);
const target = keys
  .slice(Math.max(0, currentIndex + 1))
  .find((key) => isEmptyTarget(session, key));

if (target !== undefined) {
  return Object.freeze({ cellKey: target, preferredPlacementId: preferred?.id ?? null });
}
```

- [ ] **Step 6: 整合 `placePuzzleTile`**

有效字牌寫入後依序：釋放舊字牌 → 寫入新值 → 算正誤與完成狀態 → completed 則 `null/null` → playing 則呼叫 `findNextPuzzleCell`。無效操作不得跳轉。

- [ ] **Step 7: 驗證 GREEN**

```bash
npm run compile:core && node --test tests/puzzle-engine.test.mjs
```

- [ ] **Step 8: Commit**

```bash
git add src/puzzle/puzzle-engine.ts tests/puzzle-engine.test.mjs
git commit -m "feat: auto advance within puzzle placement"
```

---

### Task 3: 交叉與直接相連 placement

**Files:**
- Modify: `src/puzzle/puzzle-engine.ts`
- Test: `tests/puzzle-engine.test.mjs`

**Fixtures:**

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

- [ ] **Step 1: 寫保留原方向後轉入交叉成語的失敗測試**

```js
test('finishing the preferred placement switches to the crossing placement', () => {
  let current = crossSession();
  current = selectPuzzleCell(current, '0:1');
  current = placePuzzleTile(current, tileFor(current, '心').id).session;
  current = placePuzzleTile(current, tileFor(current, '一').id).session;
  assert.equal(current.selectedCellKey, '0:3');
  assert.equal(current.preferredPlacementId, 'h1');

  const result = placePuzzleTile(current, tileFor(current, '意').id);
  assert.equal(result.session.selectedCellKey, '1:3');
  assert.equal(result.session.preferredPlacementId, 'v1');
});
```

- [ ] **Step 2: 寫交叉 placement 正向無空格時的 fallback 測試**

```js
test('crossing placement falls back to an earlier empty cell', () => {
  let current = fillCorrectExcept(crossSession(), ['1:3']);
  const navigation = findNextPuzzleCell(current, '3:3', 'h2');
  assert.equal(navigation.cellKey, '1:3');
  assert.equal(navigation.preferredPlacementId, 'v1');
});
```

- [ ] **Step 3: 寫直接相連 placement 測試**

```js
test('non-crossing endpoint moves to a directly connected placement', () => {
  let current = fillCorrectExcept(crossSession(), ['1:3']);
  const navigation = findNextPuzzleCell(current, '3:6', 'h2');
  assert.equal(navigation.cellKey, '1:3');
  assert.equal(navigation.preferredPlacementId, 'v1');
});
```

- [ ] **Step 4: 驗證 RED**

```bash
npm run compile:core && node --test --test-name-pattern="crossing|directly connected" tests/puzzle-engine.test.mjs
```

- [ ] **Step 5: 實作當前交叉 placement 搜尋**

```ts
const currentCell = session.board.cells.get(currentCellKey);
const alternateIds = currentCell?.placementIds.filter(
  (placementId) => placementId !== preferredPlacementId
) ?? [];

for (const placementId of alternateIds) {
  const placement = placementById(session, placementId);
  if (placement === undefined) continue;
  const placementKeys = placementCellKeys(placement);
  const crossingIndex = placementKeys.indexOf(currentCellKey);
  const forward = placementKeys.slice(Math.max(0, crossingIndex + 1))
    .find((key) => isEmptyTarget(session, key));
  const fallback = placementKeys.find((key) => isEmptyTarget(session, key));
  const target = forward ?? fallback;
  if (target !== undefined) {
    return Object.freeze({ cellKey: target, preferredPlacementId: placementId });
  }
}
```

- [ ] **Step 6: 實作直接相連 placement 搜尋**

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

候選 id 順序：preferred placement 的鄰居，再加入 current cell 所屬 placement 的鄰居，以 `Set` 去重。建立候選：

```ts
const connectedCandidates = connectedIds.flatMap((placementId) => {
  const placement = placementById(session, placementId);
  if (placement === undefined) return [];
  return placementCellKeys(placement)
    .filter((key) => isEmptyTarget(session, key))
    .map((key) => ({ placementId, cell: session.board.cells.get(key) }))
    .filter((candidate) => candidate.cell !== undefined);
});

connectedCandidates.sort((left, right) =>
  (currentCell === undefined ? 0 : manhattanDistance(currentCell, left.cell))
    - (currentCell === undefined ? 0 : manhattanDistance(currentCell, right.cell))
  || left.cell.row - right.cell.row
  || left.cell.column - right.cell.column
  || left.placementId.localeCompare(right.placementId)
);
```

第一個候選即第三階段結果。

- [ ] **Step 7: 驗證 GREEN**

```bash
npm run compile:core && node --test tests/puzzle-engine.test.mjs
```

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

**Fixtures:**

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

const rowTieLevel = {
  id: 'level-097', chapterId: 'chapter-1', levelNumber: 97, title: '列排序測試',
  width: 5, height: 4,
  placements: [
    { id: 'source', idiomId: 'source', text: '一心一意', direction: 'horizontal', startRow: 2, startColumn: 0 },
    { id: 'target', idiomId: 'target', text: '四通八達', direction: 'vertical', startRow: 0, startColumn: 4 }
  ],
  fixedCells: ['2:0', '0:4'], difficulty: 'easy', hintLimit: 3
};

const columnTieLevel = {
  id: 'level-096', chapterId: 'chapter-1', levelNumber: 96, title: '欄排序測試',
  width: 6, height: 5,
  placements: [
    { id: 'source', idiomId: 'source', text: '一心一意', direction: 'horizontal', startRow: 0, startColumn: 0 },
    { id: 'left', idiomId: 'left', text: '四通八達', direction: 'vertical', startRow: 1, startColumn: 1 },
    { id: 'right', idiomId: 'right', text: '春風化雨', direction: 'vertical', startRow: 1, startColumn: 5 }
  ],
  fixedCells: ['0:0', '1:1', '1:5'], difficulty: 'easy', hintLimit: 3
};
```

- [ ] **Step 1: 寫最近格失敗測試**

```js
test('selects the nearest board empty cell when no connected target exists', () => {
  let current = createPuzzleSession(buildPuzzleBoard(fallbackLevel), (items) => items);
  current = fillCorrectExcept(current, ['4:5', '4:6', '4:7']);
  const navigation = findNextPuzzleCell(current, '0:3', 'top');
  assert.equal(navigation.cellKey, '4:5');
  assert.equal(navigation.preferredPlacementId, 'bottom');
});
```

- [ ] **Step 2: 寫 row tie-break 失敗測試**

填滿 `rowTieLevel` 除 `1:4`、`3:4` 外的可填格；從 `2:2` 呼叫 `findNextPuzzleCell`。兩格距離同為 3，斷言：

```js
assert.equal(navigation.cellKey, '1:4');
```

- [ ] **Step 3: 寫 column tie-break 失敗測試**

填滿 `columnTieLevel` 除 `2:1`、`2:5` 外的可填格；從 `0:3` 呼叫 `findNextPuzzleCell`。兩格距離同為 4、row 同為 2，斷言：

```js
assert.equal(navigation.cellKey, '2:1');
```

- [ ] **Step 4: 寫先空格、後錯字的失敗測試**

```js
test('does not revisit a wrong cell while an empty cell remains', () => {
  let current = session();
  current = selectPuzzleCell(current, '0:1');
  current = placePuzzleTile(current, tileFor(current, '風').id).session;
  assert.notEqual(current.selectedCellKey, '0:1');
  assert.equal(current.values[current.selectedCellKey], undefined);
});

test('after every fillable cell has text, revisits the first wrong cell', () => {
  let current = session();
  const keys = [...current.board.fillableKeys];
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    current = selectPuzzleCell(current, key);
    const answer = current.board.cells.get(key)?.answer;
    const tile = index === 0
      ? current.tiles.find((candidate) => candidate.usedBy === null && candidate.character !== answer)
      : current.tiles.find((candidate) => candidate.usedBy === null);
    assert.ok(tile);
    current = placePuzzleTile(current, tile.id).session;
  }

  const wrongKeys = keys
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

```js
assert.equal(current.status, 'completed');
assert.equal(current.selectedCellKey, null);
assert.equal(current.preferredPlacementId, null);
```

- [ ] **Step 6: 驗證 RED**

```bash
npm run compile:core && node --test --test-name-pattern="nearest|tie|wrong cell|completed" tests/puzzle-engine.test.mjs
```

- [ ] **Step 7: 實作全盤最近空格**

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

- [ ] **Step 9: completed Session 清空選取**

`withCompletionState` 在 `status === 'completed'` 時將兩欄設為 `null`。

- [ ] **Step 10: 驗證 GREEN**

```bash
npm run compile:core && node --test tests/puzzle-engine.test.mjs
```

- [ ] **Step 11: Commit**

```bash
git add src/puzzle/puzzle-engine.ts tests/puzzle-engine.test.mjs
git commit -m "feat: complete puzzle auto advance flow"
```

---

### Task 5: 覆蓋與其他 Session 操作

**Files:**
- Modify: `src/puzzle/puzzle-engine.ts`
- Test: `tests/puzzle-engine.test.mjs`

- [ ] **Step 1: 寫覆蓋錯字測試**

```js
test('replacing a wrong tile releases it and continues auto advance', () => {
  let current = selectPuzzleCell(session(), '0:1');
  const wrong = tileFor(current, '風');
  current = placePuzzleTile(current, wrong.id).session;
  current = selectPuzzleCell(current, '0:1');
  const result = placePuzzleTile(current, tileFor(current, '心').id);
  assert.equal(result.session.tiles.find((tile) => tile.id === wrong.id)?.usedBy, null);
  assert.notEqual(result.session.selectedCellKey, '0:1');
});
```

- [ ] **Step 2: 寫手動交叉格方向測試**

```js
test('manual crossing selection prefers more unresolved cells', () => {
  let current = fillCorrectExcept(crossSession(), ['0:3', '1:3', '2:3']);
  current = selectPuzzleCell(current, '0:3');
  assert.equal(current.preferredPlacementId, 'v1');
});

test('manual crossing selection prefers horizontal on a tie', () => {
  const current = selectPuzzleCell(crossSession(), '0:3');
  assert.equal(current.preferredPlacementId, 'h1');
});
```

- [ ] **Step 3: 寫移除、提示、清空測試**

```js
test('removing a cell selects it and re-derives placement', () => {
  let current = selectPuzzleCell(session(), '0:1');
  current = placePuzzleTile(current, tileFor(current, '心').id).session;
  const removed = removePuzzleCell(current, '0:1');
  assert.equal(removed.selectedCellKey, '0:1');
  assert.equal(removed.preferredPlacementId, 'p1');
});

test('hint keeps the hinted cell selected and derives placement', () => {
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

- [ ] **Step 4: 驗證 RED**

```bash
npm run compile:core && node --test --test-name-pattern="replacing|manual crossing|removing|hint keeps|clear resets" tests/puzzle-engine.test.mjs
```

- [ ] **Step 5: 同步狀態**

- `removePuzzleCell`：選取被移除格並重新推導方向。
- `usePuzzleHint`：維持 hinted cell 為選取格並推導方向；若提示完成關卡則 `null/null`。
- `clearPuzzleEntries`：第一個可填格＋重新推導。
- `selectPuzzleCell`：每次手動點格重新推導。

- [ ] **Step 6: 驗證 GREEN**

```bash
npm run test:puzzle
```

- [ ] **Step 7: Commit**

```bash
git add src/puzzle/puzzle-engine.ts tests/puzzle-engine.test.mjs
git commit -m "test: cover puzzle navigation state transitions"
```

---

### Task 6: 文件與完整 Gate

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新 README**

在「成語填字闖關規則」加入：

```markdown
- 每放入一個候選字後會自動移到下一個空格；填錯的字會保留紅色，但不會中斷連續輸入。
- 系統會先走完所有空格，全部填滿後才自動回到錯誤格修正。
```

- [ ] **Step 2: 執行 puzzle 測試**

```bash
npm run test:puzzle
```

Expected: 0 failure。

- [ ] **Step 3: 執行完整測試**

```bash
npm run test
```

Expected: 0 failure。

- [ ] **Step 4: 執行 typecheck**

```bash
npm run typecheck
```

Expected: exit 0。

- [ ] **Step 5: 執行 lint**

```bash
npm run lint
```

Expected: 0 errors。

- [ ] **Step 6: 執行 production build**

```bash
npm run build
```

Expected: exit 0，產生 PWA bundle。

- [ ] **Step 7: 檢查分支漂移**

```bash
git fetch origin
git rev-list --left-right --count origin/main...HEAD
```

Expected: behind 為 `0`；若不為 0，先整合 main，再重跑完整 Gate。

- [ ] **Step 8: Commit 文件**

```bash
git add README.md
git commit -m "docs: explain puzzle auto advance"
```

- [ ] **Step 9: 更新 PR 驗證摘要**

列出新增測試數、總通過數、typecheck、lint、build、ahead／behind；未做實機操作時不得宣稱實機驗收完成。

## Final Review Checklist

- [ ] 所有 `PuzzleSession` 建立點都有 `preferredPlacementId`。
- [ ] 填對與填錯都會跳格。
- [ ] 有空白格時不會跳回錯字格。
- [ ] 不會跳到固定格或已填正確格。
- [ ] 五階段順序固定且可重現。
- [ ] row、column tie-break 都有測試。
- [ ] 手動選格、覆蓋、提示、移除、清空後方向一致。
- [ ] completed Session 的兩個選取欄位皆為 `null`。
- [ ] React、progress schema、關卡資料與其他模式未被不必要修改。
- [ ] 完整 Repository Gate 通過後才合併。
