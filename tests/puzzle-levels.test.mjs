import assert from 'node:assert/strict';
import test from 'node:test';

import { PUZZLE_LEVELS } from '../.test-dist/src/puzzle/levels.js';
import { buildPuzzleBoard } from '../.test-dist/src/puzzle/puzzle-board.js';
import { createPuzzleSession, placePuzzleTile, selectPuzzleCell } from '../.test-dist/src/puzzle/puzzle-engine.js';

test('provides exactly twenty sequential levels', () => {
  assert.equal(PUZZLE_LEVELS.length, 20);
  assert.deepEqual(PUZZLE_LEVELS.map((level) => level.levelNumber), Array.from({ length: 20 }, (_, i) => i + 1));
  assert.equal(new Set(PUZZLE_LEVELS.map((level) => level.id)).size, 20);
});

test('uses sixty-one unique idioms across chapter one', () => {
  const placements = PUZZLE_LEVELS.flatMap((level) => level.placements);
  const ids = placements.map((placement) => placement.idiomId);
  const texts = placements.map((placement) => placement.text);

  assert.equal(placements.length, 61);
  assert.equal(new Set(ids).size, 61, 'chapter one repeats an idiomId');
  assert.equal(new Set(texts).size, 61, 'chapter one repeats an idiom text');
});

test('every level builds a valid connected crossword board', () => {
  for (const level of PUZZLE_LEVELS) {
    const board = buildPuzzleBoard(level);
    assert.ok([...board.cells.values()].some((cell) => cell.placementIds.length > 1), `${level.id} needs crossing`);
    assert.ok(level.fixedCells.length >= 2, `${level.id} needs fixed clues`);
    assert.equal(board.candidateCharacters.length, board.fillableKeys.length);
    assert.ok(board.fillableKeys.length >= 5);
  }
});

test('difficulty and idiom count increase across the chapter', () => {
  assert.ok(PUZZLE_LEVELS.slice(0, 5).every((level) => level.placements.length === 2));
  assert.ok(PUZZLE_LEVELS.slice(5, 12).every((level) => level.placements.length === 3));
  assert.ok(PUZZLE_LEVELS.slice(12).every((level) => level.placements.length >= 3));
  assert.equal(PUZZLE_LEVELS[0]?.difficulty, 'easy');
  assert.equal(PUZZLE_LEVELS[19]?.difficulty, 'hard');
});

test('all placements form a real chain at their crossings', () => {
  for (const level of PUZZLE_LEVELS) {
    for (let index = 1; index < level.placements.length; index += 1) {
      const previous = level.placements[index - 1];
      const current = level.placements[index];
      assert.ok(previous && current);
      assert.equal([...previous.text][3], [...current.text][0], `${level.id} chain ${index}`);
    }
  }
});

test('every level can be completed using its candidate pool', () => {
  for (const level of PUZZLE_LEVELS) {
    let session = createPuzzleSession(buildPuzzleBoard(level), (items) => items);
    for (const key of session.board.fillableKeys) {
      const answer = session.board.cells.get(key)?.answer;
      assert.ok(answer);
      const tile = session.tiles.find((candidate) => candidate.usedBy === null && candidate.character === answer);
      assert.ok(tile, `${level.id} missing candidate ${answer}`);
      session = selectPuzzleCell(session, key);
      session = placePuzzleTile(session, tile.id).session;
    }
    assert.equal(session.status, 'completed', `${level.id} should complete`);
  }
});
