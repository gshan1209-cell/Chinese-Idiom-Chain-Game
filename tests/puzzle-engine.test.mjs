import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPuzzleBoard } from '../.test-dist/src/puzzle/puzzle-board.js';
import {
  clearPuzzleEntries,
  createPuzzleSession,
  derivePreferredPlacementId,
  findNextPuzzleCell,
  placePuzzleTile,
  removePuzzleCell,
  reorderPuzzleTiles,
  selectPuzzleCell,
  usePuzzleHint
} from '../.test-dist/src/puzzle/puzzle-engine.js';

const level = {
  id: 'level-001', chapterId: 'chapter-1', levelNumber: 1, title: '初試身手',
  width: 4, height: 4,
  placements: [
    { id: 'p1', idiomId: 'idiom-0001', text: '一心一意', direction: 'horizontal', startRow: 0, startColumn: 0 },
    { id: 'p2', idiomId: 'idiom-0002', text: '意氣風發', direction: 'vertical', startRow: 0, startColumn: 3 }
  ],
  fixedCells: ['0:0', '1:3'], difficulty: 'easy', hintLimit: 3
};

function session() {
  return createPuzzleSession(buildPuzzleBoard(level), (items) => items);
}

function tileFor(current, char) {
  const tile = current.tiles.find((item) => item.character === char && item.usedBy === null);
  assert.ok(tile, `missing tile ${char}`);
  return tile;
}

test('places a selected candidate tile into the selected empty cell', () => {
  const selected = selectPuzzleCell(session(), '0:1');
  const tile = tileFor(selected, '心');
  const result = placePuzzleTile(selected, tile.id);
  assert.equal(result.session.values['0:1'], '心');
  assert.equal(result.correct, true);
  assert.equal(result.session.score, 20);
});

test('keeps a wrong character visible and records a mistake', () => {
  const selected = selectPuzzleCell(session(), '0:1');
  const tile = tileFor(selected, '風');
  const result = placePuzzleTile(selected, tile.id);
  assert.equal(result.session.values['0:1'], '風');
  assert.equal(result.correct, false);
  assert.equal(result.session.mistakes, 1);
  assert.equal(result.session.status, 'playing');
});

test('removing a cell returns its tile to the candidate pool', () => {
  const selected = selectPuzzleCell(session(), '0:1');
  const tile = tileFor(selected, '心');
  const placed = placePuzzleTile(selected, tile.id).session;
  const removed = removePuzzleCell(placed, '0:1');
  assert.equal(removed.values['0:1'], undefined);
  assert.equal(removed.tiles.find((item) => item.id === tile.id)?.usedBy, null);
});

test('hint fills one unresolved cell with the correct character', () => {
  const hinted = usePuzzleHint(session());
  assert.equal(hinted.hintedCellKey, '0:1');
  assert.equal(hinted.session.values['0:1'], '心');
  assert.equal(hinted.session.hintsUsed, 1);
  assert.equal(hinted.session.score, 0);
});

test('completes the level when every fillable cell is correct', () => {
  let current = session();
  for (const key of current.board.fillableKeys) {
    const answer = current.board.cells.get(key)?.answer;
    assert.ok(answer);
    current = selectPuzzleCell(current, key);
    current = placePuzzleTile(current, tileFor(current, answer).id).session;
  }
  assert.equal(current.status, 'completed');
  assert.equal(current.correctCells, current.board.fillableKeys.length);
  assert.equal(current.selectedCellKey, null);
  assert.equal(current.preferredPlacementId, null);
});

test('clearPuzzleEntries removes all player entries but preserves score floor', () => {
  let current = session();
  current = selectPuzzleCell(current, '0:1');
  current = placePuzzleTile(current, tileFor(current, '心').id).session;
  const cleared = clearPuzzleEntries(current);
  assert.deepEqual(cleared.values, {});
  assert.equal(cleared.score, 0);
  assert.equal(cleared.status, 'playing');
  assert.equal(cleared.selectedCellKey, '0:1');
  assert.equal(cleared.preferredPlacementId, 'p1');
});

test('reorderPuzzleTiles changes visual order without changing tile usage', () => {
  const current = session();
  const reversed = reorderPuzzleTiles(current, (items) => [...items].reverse());
  assert.deepEqual(reversed.tiles.map((tile) => tile.id), [...current.tiles].reverse().map((tile) => tile.id));
  assert.deepEqual(reversed.values, current.values);
});

test('hint recovers the correct tile even when it is used in another wrong cell', () => {
  let current = session();
  current = selectPuzzleCell(current, '0:2');
  current = placePuzzleTile(current, tileFor(current, '心').id).session;
  const hinted = usePuzzleHint(current);
  assert.equal(hinted.hintedCellKey, '0:1');
  assert.equal(hinted.session.values['0:1'], '心');
  assert.equal(hinted.session.values['0:2'], undefined);
});

// Auto-advance & Navigation Tests (Task 1 to Task 5)

test('Task 1: session initializes selectedCellKey and preferredPlacementId', () => {
  const s = session();
  assert.equal(s.selectedCellKey, '0:1');
  assert.equal(s.preferredPlacementId, 'p1');
});

test('Task 1: manual selection derives direction based on unresolved cells and horizontal priority', () => {
  // Crossing level test
  const crossLevel = {
    id: 'cross-lvl', chapterId: 'ch1', levelNumber: 1, title: '交叉測試',
    width: 4, height: 4,
    placements: [
      { id: 'v1', idiomId: 'i1', text: '一心一意', direction: 'vertical', startRow: 0, startColumn: 0 },
      { id: 'h1', idiomId: 'i2', text: '一氣呵成', direction: 'horizontal', startRow: 0, startColumn: 0 }
    ],
    fixedCells: [], difficulty: 'easy', hintLimit: 3
  };
  const board = buildPuzzleBoard(crossLevel);
  let s = createPuzzleSession(board, (items) => items);
  
  // Both v1 and h1 have 4 unresolved cells. 0:0 is a crossing cell. Equal unresolved -> horizontal (h1) priority.
  s = selectPuzzleCell(s, '0:0');
  assert.equal(s.preferredPlacementId, 'h1');
});

test('Task 2: correct tile placement advances to next empty cell in same placement and skips filled/fixed cells', () => {
  let s = session(); // p1 fillable: 0:1, 0:2, 0:3 ('0:0' is fixed)
  assert.equal(s.selectedCellKey, '0:1');
  
  // Place correct tile '心' into 0:1 -> auto advance to 0:2
  const tile1 = tileFor(s, '心');
  s = placePuzzleTile(s, tile1.id).session;
  assert.equal(s.selectedCellKey, '0:2');
  assert.equal(s.preferredPlacementId, 'p1');

  // Place correct tile '一' into 0:2 -> auto advance to 0:3
  const tile2 = tileFor(s, '一');
  s = placePuzzleTile(s, tile2.id).session;
  assert.equal(s.selectedCellKey, '0:3');
});

test('Task 2: wrong tile placement keeps wrong character but still advances', () => {
  let s = session();
  const wrongTile = tileFor(s, '風');
  s = placePuzzleTile(s, wrongTile.id).session;
  assert.equal(s.values['0:1'], '風');
  assert.equal(s.mistakes, 1);
  assert.equal(s.selectedCellKey, '0:2');
});

test('Task 3: switches to crossing placement when current placement has no more empty cells', () => {
  let s = session(); // p1: 0:0(fixed), 0:1, 0:2, 0:3. p2: 0:3, 1:3(fixed), 2:3, 3:3.
  // Pre-fill 0:2
  s = selectPuzzleCell(s, '0:2');
  s = placePuzzleTile(s, tileFor(s, '一').id).session;

  // Now select 0:1 and fill it
  s = selectPuzzleCell(s, '0:1');
  s = placePuzzleTile(s, tileFor(s, '心').id).session;

  // Now 0:1 and 0:2 are filled, so filling 0:3 (the crossing cell between p1 and p2) leaves p1 with 0 empty cells.
  // It should switch to crossing placement p2!
  assert.equal(s.selectedCellKey, '0:3');
  s = placePuzzleTile(s, tileFor(s, '意').id).session;

  // After 0:3 is filled, p2's remaining empty cells are 2:3 (since 1:3 is fixed).
  assert.equal(s.selectedCellKey, '2:3');
  assert.equal(s.preferredPlacementId, 'p2');
});

test('Task 4: nearest empty cell fallback using Manhattan distance and tie-breaking', () => {
  const multiLevel = {
    id: 'multi-lvl', chapterId: 'ch1', levelNumber: 1, title: '多成語',
    width: 5, height: 5,
    placements: [
      { id: 'p1', idiomId: 'i1', text: '一心一意', direction: 'horizontal', startRow: 0, startColumn: 0 },
      { id: 'p2', idiomId: 'i2', text: '發憤圖強', direction: 'horizontal', startRow: 4, startColumn: 0 }
    ],
    fixedCells: ['0:0', '0:1', '0:2', '0:3', '4:0'], difficulty: 'easy', hintLimit: 3
  };
  const board = buildPuzzleBoard(multiLevel);
  let s = createPuzzleSession(board, (items) => items);
  // All cells in p1 are fixed. Fillable cell is 4:1 (in p2).
  assert.equal(s.selectedCellKey, '4:1');
  assert.equal(s.preferredPlacementId, 'p2');
});

test('Task 4: error cell loop when no empty cells remain but errors exist', () => {
  let s = session();
  // Intentionally fill cells with wrong tiles
  s = selectPuzzleCell(s, '0:1');
  s = placePuzzleTile(s, tileFor(s, '風').id).session; // wrong for 0:1 ('心')
  s = selectPuzzleCell(s, '0:2');
  s = placePuzzleTile(s, tileFor(s, '發').id).session; // wrong for 0:2 ('一')
  s = selectPuzzleCell(s, '0:3');
  s = placePuzzleTile(s, tileFor(s, '意').id).session;
  s = selectPuzzleCell(s, '2:3');
  s = placePuzzleTile(s, tileFor(s, '一').id).session;
  s = selectPuzzleCell(s, '3:3');
  s = placePuzzleTile(s, tileFor(s, '心').id).session;
  
  // Now 0 empty cells remain, but there are errors (status is playing).
  // Auto-advance should land on the first error cell sorted by row asc, col asc (0:1).
  assert.equal(s.status, 'playing');
  assert.equal(s.selectedCellKey, '0:1');
});

test('Task 5: overwriting a wrong cell releases tile and auto advances', () => {
  let s = session();
  // Place wrong tile into 0:1
  const wrongTile = tileFor(s, '風');
  s = placePuzzleTile(s, wrongTile.id).session;
  assert.equal(s.selectedCellKey, '0:2');

  // Select 0:1 again to overwrite
  s = selectPuzzleCell(s, '0:1');
  assert.equal(s.values['0:1'], '風');

  // Overwrite with correct tile '心'
  const correctTile = tileFor(s, '心');
  s = placePuzzleTile(s, correctTile.id).session;
  assert.equal(s.values['0:1'], '心');
  // Auto advance should move to 0:2
  assert.equal(s.selectedCellKey, '0:2');
});

test('Task 5: removePuzzleCell re-selects target cell and derives direction', () => {
  let s = session();
  s = placePuzzleTile(s, tileFor(s, '心').id).session;
  assert.equal(s.selectedCellKey, '0:2');

  const removed = removePuzzleCell(s, '0:1');
  assert.equal(removed.selectedCellKey, '0:1');
  assert.equal(removed.preferredPlacementId, 'p1');
});

test('exported pure functions findNextPuzzleCell and derivePreferredPlacementId execute correctly', () => {
  const s = session();
  const nav = findNextPuzzleCell(s, '0:1', 'p1');
  assert.equal(nav.cellKey, '0:2');
  assert.equal(nav.preferredPlacementId, 'p1');

  const pref = derivePreferredPlacementId(s.board, s.values, '0:1');
  assert.equal(pref, 'p1');
});
