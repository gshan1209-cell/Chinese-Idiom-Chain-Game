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
  usesCandidateDecoys
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

test('phase two mode capabilities are explicit', () => {
  assert.equal(usesCandidateDecoys('standard'), false);
  assert.equal(usesCandidateDecoys('trap-candidates'), true);
  assert.equal(usesCandidateDecoys('trap-board'), true);
  assert.equal(usesCandidateDecoys('trap-stubborn'), false);

  assert.equal(usesBoardIntruders('standard'), false);
  assert.equal(usesBoardIntruders('trap-candidates'), false);
  assert.equal(usesBoardIntruders('trap-board'), true);
  assert.equal(usesBoardIntruders('trap-stubborn'), false);
});

test('board mode composes candidate decoys while stubborn mode stays inert', () => {
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
  assert.deepEqual(stubbornMode.decoys, []);
  assert.strictEqual(recordValidCandidatePlacement(stubbornMode), stubbornMode);
});
