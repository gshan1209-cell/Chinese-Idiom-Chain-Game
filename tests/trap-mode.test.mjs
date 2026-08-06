import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPuzzleBoard } from '../.test-dist/src/puzzle/puzzle-board.js';
import { getPuzzleLevel } from '../.test-dist/src/puzzle/levels.js';
import {
  createCandidateDecoySession,
  recordValidCandidatePlacement
} from '../.test-dist/src/traps/candidate-decoy-engine.js';
import {
  usesBoardIntruders,
  usesCandidateDecoys,
  usesStubbornIntruders
} from '../.test-dist/src/traps/trap-mode.js';

function safeIdiom() {
  return Object.freeze({
    id: 'safe-idiom',
    text: '龘龖靐齉',
    firstChar: '龘',
    lastChar: '齉',
    bopomofo: '',
    pinyin: '',
    meaning: '測試用安全字元',
    example: '',
    source: 'test',
    difficulty: 'easy',
    tags: Object.freeze([]),
    enabled: true,
    version: 1
  });
}

test('phase three mode capabilities are explicit', () => {
  assert.equal(usesCandidateDecoys('standard'), false);
  assert.equal(usesCandidateDecoys('trap-candidates'), true);
  assert.equal(usesCandidateDecoys('trap-board'), true);
  assert.equal(usesCandidateDecoys('trap-stubborn'), true);

  assert.equal(usesBoardIntruders('standard'), false);
  assert.equal(usesBoardIntruders('trap-candidates'), false);
  assert.equal(usesBoardIntruders('trap-board'), true);
  assert.equal(usesBoardIntruders('trap-stubborn'), true);

  assert.equal(usesStubbornIntruders('standard'), false);
  assert.equal(usesStubbornIntruders('trap-candidates'), false);
  assert.equal(usesStubbornIntruders('trap-board'), false);
  assert.equal(usesStubbornIntruders('trap-stubborn'), true);
});

test('board mode composes candidate decoys and stubborn mode keeps them active', () => {
  const level = getPuzzleLevel(1);
  assert.notEqual(level, null);
  const board = buildPuzzleBoard(level);

  const boardMode = createCandidateDecoySession({
    board,
    idioms: [safeIdiom()],
    mode: 'trap-board',
    orderCharacters: (characters) => characters
  });
  assert.ok(boardMode.decoys.length > 0);
  assert.equal(recordValidCandidatePlacement(boardMode).validPlacements, 1);

  const stubbornMode = createCandidateDecoySession({
    board,
    idioms: [safeIdiom()],
    mode: 'trap-stubborn',
    orderCharacters: (characters) => characters
  });
  assert.ok(stubbornMode.decoys.length > 0);
  assert.equal(recordValidCandidatePlacement(stubbornMode).validPlacements, 1);
});
