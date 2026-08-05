import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPuzzleBoard } from '../.test-dist/src/puzzle/puzzle-board.js';
import {
  clearPuzzleEntries,
  createPuzzleSession,
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
});

test('clearPuzzleEntries removes all player entries but preserves score floor', () => {
  let current = session();
  current = selectPuzzleCell(current, '0:1');
  current = placePuzzleTile(current, tileFor(current, '心').id).session;
  const cleared = clearPuzzleEntries(current);
  assert.deepEqual(cleared.values, {});
  assert.equal(cleared.score, 0);
  assert.equal(cleared.status, 'playing');
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
