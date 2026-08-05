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

const crossFallbackLevel = {
  id: 'cross-fallback', chapterId: 'chapter-1', levelNumber: 91, title: '交叉回找',
  width: 4, height: 4,
  placements: [
    { id: 'h', idiomId: 'h', text: '甲乙丙丁', direction: 'horizontal', startRow: 2, startColumn: 0 },
    { id: 'v', idiomId: 'v', text: '戊己丙庚', direction: 'vertical', startRow: 0, startColumn: 2 }
  ],
  fixedCells: ['2:0', '2:1', '2:3', '3:2'], difficulty: 'easy', hintLimit: 3
};

const connectedLevel = {
  id: 'connected', chapterId: 'chapter-1', levelNumber: 92, title: '直接相連',
  width: 4, height: 4,
  placements: [
    { id: 'a', idiomId: 'a', text: '甲乙丙丁', direction: 'horizontal', startRow: 0, startColumn: 0 },
    { id: 'b', idiomId: 'b', text: '丁戊己庚', direction: 'vertical', startRow: 0, startColumn: 3 },
    { id: 'c', idiomId: 'c', text: '辛壬癸戊', direction: 'horizontal', startRow: 1, startColumn: 0 }
  ],
  fixedCells: ['0:0', '0:1'], difficulty: 'easy', hintLimit: 3
};

const rowTieLevel = {
  id: 'row-tie', chapterId: 'chapter-1', levelNumber: 93, title: '列排序',
  width: 5, height: 4,
  placements: [
    { id: 'source', idiomId: 'source', text: '甲乙丙丁', direction: 'horizontal', startRow: 2, startColumn: 0 },
    { id: 'target', idiomId: 'target', text: '戊己庚辛', direction: 'vertical', startRow: 0, startColumn: 4 }
  ],
  fixedCells: [], difficulty: 'easy', hintLimit: 3
};

const columnTieLevel = {
  id: 'column-tie', chapterId: 'chapter-1', levelNumber: 94, title: '欄排序',
  width: 6, height: 5,
  placements: [
    { id: 'source', idiomId: 'source', text: '甲乙丙丁', direction: 'horizontal', startRow: 0, startColumn: 1 },
    { id: 'left', idiomId: 'left', text: '戊己庚辛', direction: 'vertical', startRow: 1, startColumn: 1 },
    { id: 'right', idiomId: 'right', text: '壬癸子丑', direction: 'vertical', startRow: 1, startColumn: 5 }
  ],
  fixedCells: [], difficulty: 'easy', hintLimit: 3
};

function session() {
  return createPuzzleSession(buildPuzzleBoard(level), (items) => items);
}

function tileFor(current, character) {
  const tile = current.tiles.find((item) => item.character === character && item.usedBy === null);
  assert.ok(tile, `missing tile ${character}`);
  return tile;
}

function correctValues(board, excludedKeys = []) {
  const excluded = new Set(excludedKeys);
  return Object.freeze(Object.fromEntries(
    board.fillableKeys
      .filter((key) => !excluded.has(key))
      .map((key) => [key, board.cells.get(key)?.answer])
  ));
}

function withValues(current, values, selectedCellKey = current.selectedCellKey, preferredPlacementId = current.preferredPlacementId) {
  return Object.freeze({
    ...current,
    values: Object.freeze({ ...values }),
    selectedCellKey,
    preferredPlacementId,
    status: 'playing'
  });
}

function fillCorrectExcept(current, excludedKeys) {
  const excluded = new Set(excludedKeys);
  for (const key of current.board.fillableKeys) {
    if (excluded.has(key)) continue;
    const answer = current.board.cells.get(key)?.answer;
    assert.ok(answer);
    current = selectPuzzleCell(current, key);
    current = placePuzzleTile(current, tileFor(current, answer).id).session;
  }
  return current;
}

test('places a selected candidate tile into the selected empty cell', () => {
  const selected = selectPuzzleCell(session(), '0:1');
  const result = placePuzzleTile(selected, tileFor(selected, '心').id);
  assert.equal(result.session.values['0:1'], '心');
  assert.equal(result.correct, true);
  assert.equal(result.session.score, 20);
});

test('keeps a wrong character visible and records a mistake', () => {
  const selected = selectPuzzleCell(session(), '0:1');
  const result = placePuzzleTile(selected, tileFor(selected, '風').id);
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
  assert.equal(hinted.session.selectedCellKey, '0:1');
  assert.equal(hinted.session.preferredPlacementId, 'p1');
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

test('clearPuzzleEntries removes all player entries and resets navigation', () => {
  let current = session();
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
  let current = selectPuzzleCell(session(), '0:2');
  current = placePuzzleTile(current, tileFor(current, '心').id).session;
  const hinted = usePuzzleHint(current);
  assert.equal(hinted.hintedCellKey, '0:1');
  assert.equal(hinted.session.values['0:1'], '心');
  assert.equal(hinted.session.values['0:2'], undefined);
});

test('new session selects the first fillable cell and derives its placement', () => {
  const current = session();
  assert.equal(current.selectedCellKey, '0:1');
  assert.equal(current.preferredPlacementId, 'p1');
});

test('manual crossing selection prefers horizontal when unresolved counts tie', () => {
  const current = selectPuzzleCell(session(), '0:3');
  assert.equal(current.preferredPlacementId, 'p1');
});

test('manual crossing selection prefers the placement with more unresolved cells', () => {
  const current = withValues(session(), { '0:1': '心', '0:2': '一' });
  const selected = selectPuzzleCell(current, '0:3');
  assert.equal(selected.preferredPlacementId, 'p2');
});

test('correct placement advances within the preferred placement and skips filled cells', () => {
  let current = selectPuzzleCell(session(), '0:2');
  current = placePuzzleTile(current, tileFor(current, '一').id).session;
  current = selectPuzzleCell(current, '0:1');
  current = placePuzzleTile(current, tileFor(current, '心').id).session;
  assert.equal(current.selectedCellKey, '0:3');
  assert.equal(current.preferredPlacementId, 'p1');
});

test('wrong placement keeps the wrong value and still advances to an empty cell', () => {
  const current = session();
  const result = placePuzzleTile(current, tileFor(current, '風').id);
  assert.equal(result.session.values['0:1'], '風');
  assert.equal(result.session.selectedCellKey, '0:2');
  assert.notEqual(result.session.selectedCellKey, '0:1');
});

test('invalid tile placement does not advance navigation', () => {
  const current = session();
  const result = placePuzzleTile(current, 'missing-tile');
  assert.equal(result.session, current);
  assert.equal(result.session.selectedCellKey, '0:1');
});

test('finishing the preferred placement switches to the crossing placement', () => {
  let current = selectPuzzleCell(session(), '0:2');
  current = placePuzzleTile(current, tileFor(current, '一').id).session;
  current = selectPuzzleCell(current, '0:1');
  current = placePuzzleTile(current, tileFor(current, '心').id).session;
  assert.equal(current.selectedCellKey, '0:3');
  current = placePuzzleTile(current, tileFor(current, '意').id).session;
  assert.equal(current.selectedCellKey, '2:3');
  assert.equal(current.preferredPlacementId, 'p2');
});

test('crossing placement falls back to an earlier empty cell when forward cells are unavailable', () => {
  let current = createPuzzleSession(buildPuzzleBoard(crossFallbackLevel), (items) => items);
  current = Object.freeze({ ...current, selectedCellKey: '2:2', preferredPlacementId: 'h' });
  current = placePuzzleTile(current, tileFor(current, '丙').id).session;
  assert.equal(current.selectedCellKey, '0:2');
  assert.equal(current.preferredPlacementId, 'v');
});

test('directly connected placement remains the preferred direction at a downstream crossing', () => {
  let current = createPuzzleSession(buildPuzzleBoard(connectedLevel), (items) => items);
  current = withValues(current, { '0:2': '丙', '0:3': '丁' }, '0:2', 'a');
  const navigation = findNextPuzzleCell(current, '0:2', 'a');
  assert.equal(navigation.cellKey, '1:3');
  assert.equal(navigation.preferredPlacementId, 'b');
});

test('nearest empty fallback uses row as the first tie breaker', () => {
  let current = createPuzzleSession(buildPuzzleBoard(rowTieLevel), (items) => items);
  current = withValues(
    current,
    correctValues(current.board, ['1:4', '3:4']),
    '2:2',
    'source'
  );
  const navigation = findNextPuzzleCell(current, '2:2', 'source');
  assert.equal(navigation.cellKey, '1:4');
});

test('nearest empty fallback uses column when distance and row tie', () => {
  let current = createPuzzleSession(buildPuzzleBoard(columnTieLevel), (items) => items);
  current = withValues(
    current,
    correctValues(current.board, ['2:1', '2:5']),
    '0:3',
    'source'
  );
  const navigation = findNextPuzzleCell(current, '0:3', 'source');
  assert.equal(navigation.cellKey, '2:1');
});

test('does not revisit a wrong cell while an empty cell remains', () => {
  let current = session();
  current = placePuzzleTile(current, tileFor(current, '風').id).session;
  assert.equal(current.values['0:1'], '風');
  assert.notEqual(current.selectedCellKey, '0:1');
  assert.equal(current.values[current.selectedCellKey], undefined);
});

test('after every fillable cell has text, revisits the first wrong cell by row and column', () => {
  const current = withValues(session(), {
    '0:1': '風',
    '0:2': '發',
    '0:3': '意',
    '2:3': '一',
    '3:3': '心'
  }, '3:3', 'p2');
  const navigation = findNextPuzzleCell(current, '3:3', 'p2');
  assert.equal(navigation.cellKey, '0:1');
});

test('replacing a wrong tile releases it and continues auto advance', () => {
  let current = session();
  const wrong = tileFor(current, '風');
  current = placePuzzleTile(current, wrong.id).session;
  current = selectPuzzleCell(current, '0:1');
  current = placePuzzleTile(current, tileFor(current, '心').id).session;
  assert.equal(current.tiles.find((tile) => tile.id === wrong.id)?.usedBy, null);
  assert.equal(current.selectedCellKey, '0:2');
});

test('removing a cell selects it and re-derives its placement', () => {
  let current = session();
  current = placePuzzleTile(current, tileFor(current, '心').id).session;
  const removed = removePuzzleCell(current, '0:1');
  assert.equal(removed.selectedCellKey, '0:1');
  assert.equal(removed.preferredPlacementId, 'p1');
});

test('a completing hint clears navigation state', () => {
  let current = fillCorrectExcept(session(), ['0:1']);
  const hinted = usePuzzleHint(current);
  assert.equal(hinted.session.status, 'completed');
  assert.equal(hinted.session.selectedCellKey, null);
  assert.equal(hinted.session.preferredPlacementId, null);
});

test('exported navigation functions are deterministic for the same input', () => {
  const current = session();
  const first = findNextPuzzleCell(current, '0:1', 'p1');
  const second = findNextPuzzleCell(current, '0:1', 'p1');
  assert.deepEqual(first, second);
  assert.equal(derivePreferredPlacementId(current.board, current.values, '0:1'), 'p1');
});
