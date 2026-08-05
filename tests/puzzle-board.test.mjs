import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPuzzleBoard } from '../.test-dist/src/puzzle/puzzle-board.js';

const baseLevel = {
  id: 'level-001',
  chapterId: 'chapter-1',
  levelNumber: 1,
  title: '初試身手',
  width: 4,
  height: 4,
  placements: [
    { id: 'p1', idiomId: 'idiom-0001', text: '一心一意', direction: 'horizontal', startRow: 0, startColumn: 0 },
    { id: 'p2', idiomId: 'idiom-0002', text: '意氣風發', direction: 'vertical', startRow: 0, startColumn: 3 }
  ],
  fixedCells: ['0:0', '1:3'],
  difficulty: 'easy',
  hintLimit: 3
};

test('buildPuzzleBoard merges matching crossing cells', () => {
  const board = buildPuzzleBoard(baseLevel);
  const crossing = board.cells.get('0:3');
  assert.equal(crossing?.answer, '意');
  assert.deepEqual(crossing?.placementIds, ['p1', 'p2']);
  assert.equal(board.cells.size, 7);
});

test('buildPuzzleBoard rejects conflicting crossing characters', () => {
  const bad = {
    ...baseLevel,
    placements: [baseLevel.placements[0], { ...baseLevel.placements[1], text: '人山人海' }]
  };
  assert.throws(() => buildPuzzleBoard(bad), /交叉字衝突/);
});

test('buildPuzzleBoard rejects placement outside board', () => {
  const bad = {
    ...baseLevel,
    placements: [{ ...baseLevel.placements[0], startColumn: 1 }, baseLevel.placements[1]]
  };
  assert.throws(() => buildPuzzleBoard(bad), /超出盤面/);
});

test('buildPuzzleBoard rejects non-four-character idiom', () => {
  const bad = {
    ...baseLevel,
    placements: [{ ...baseLevel.placements[0], text: '一心' }, baseLevel.placements[1]]
  };
  assert.throws(() => buildPuzzleBoard(bad), /四個中文字/);
});

test('buildPuzzleBoard derives fillable cells and candidate characters', () => {
  const board = buildPuzzleBoard(baseLevel);
  assert.equal(board.fillableKeys.length, 5);
  assert.equal(board.candidateCharacters.length, 5);
  assert.deepEqual([...board.candidateCharacters].sort(), ['一', '心', '意', '發', '風'].sort());
});
