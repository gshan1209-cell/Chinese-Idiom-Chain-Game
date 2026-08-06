import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPuzzleBoard } from '../.test-dist/src/puzzle/puzzle-board.js';
import { getPuzzleLevel } from '../.test-dist/src/puzzle/levels.js';
import {
  createCandidateDecoySession,
  recordValidCandidatePlacement
} from '../.test-dist/src/traps/candidate-decoy-engine.js';

function enabledIdiom() {
  return Object.freeze({
    id: 'safe-idiom',
    text: '春夏秋冬',
    firstChar: '春',
    lastChar: '冬',
    bopomofo: '',
    pinyin: '',
    meaning: '測試用成語',
    example: '',
    source: 'test',
    difficulty: 'easy',
    tags: Object.freeze([]),
    enabled: true,
    version: 1
  });
}

test('stubborn mode creates no candidate decoys and ignores candidate progress in phase two', () => {
  const level = getPuzzleLevel(1);
  assert.notEqual(level, null);
  const board = buildPuzzleBoard(level);
  const session = createCandidateDecoySession({
    board,
    idioms: [enabledIdiom()],
    mode: 'trap-stubborn',
    orderCharacters: (characters) => characters
  });

  assert.deepEqual(session.decoys, []);
  assert.strictEqual(recordValidCandidatePlacement(session), session);
});
