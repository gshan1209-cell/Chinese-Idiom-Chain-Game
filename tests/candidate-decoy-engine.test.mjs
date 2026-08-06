import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPuzzleBoard } from '../.test-dist/src/puzzle/puzzle-board.js';
import { getPuzzleLevel } from '../.test-dist/src/puzzle/levels.js';
import {
  beginCandidateDecoyEjection,
  candidateDecoyActivationThresholds,
  candidateDecoyCount,
  completeCandidateDecoyEjection,
  createCandidateDecoySession,
  getVisibleCandidateDecoys,
  recordValidCandidatePlacement
} from '../.test-dist/src/traps/candidate-decoy-engine.js';

function idiom(id, text, enabled = true) {
  return Object.freeze({
    id,
    text,
    firstChar: [...text][0],
    lastChar: [...text].at(-1),
    bopomofo: '',
    pinyin: '',
    meaning: '測試用成語',
    example: '',
    source: 'test',
    difficulty: 'easy',
    tags: Object.freeze([]),
    enabled,
    version: 1
  });
}

function levelOneBoard() {
  const level = getPuzzleLevel(1);
  assert.notEqual(level, null);
  return buildPuzzleBoard(level);
}

function decoySession(validPlacements = 0, mode = 'trap-candidates') {
  return createCandidateDecoySession({
    board: levelOneBoard(),
    idioms: [idiom('safe-1', '春夏秋冬')],
    mode,
    validPlacements,
    orderCharacters: (characters) => characters
  });
}

test('uses the fixed eighteen-percent count with a one-to-four clamp', () => {
  assert.equal(candidateDecoyCount(0), 0);
  assert.equal(candidateDecoyCount(1), 1);
  assert.equal(candidateDecoyCount(10), 2);
  assert.equal(candidateDecoyCount(17), 4);
  assert.equal(candidateDecoyCount(100), 4);
});

test('uses fixed progressive activation thresholds', () => {
  assert.deepEqual(candidateDecoyActivationThresholds(1, 10), [3]);
  assert.deepEqual(candidateDecoyActivationThresholds(2, 10), [2, 6]);
  assert.deepEqual(candidateDecoyActivationThresholds(3, 10), [2, 5, 7]);
  assert.deepEqual(candidateDecoyActivationThresholds(4, 10), [2, 4, 6, 8]);
});

test('standard mode creates no decoys', () => {
  const session = decoySession(0, 'standard');
  assert.equal(session.mode, 'standard');
  assert.deepEqual(session.decoys, []);
});

test('filters disabled idioms, level answers, legal candidates and duplicates', () => {
  const board = levelOneBoard();
  const session = createCandidateDecoySession({
    board,
    idioms: [
      idiom('safe-1', '春夏秋冬'),
      idiom('answer', board.level.placements[0].text),
      idiom('disabled', '東南西北', false),
      idiom('duplicate', '春春夏夏')
    ],
    mode: 'trap-candidates',
    orderCharacters: (characters) => characters
  });
  const forbidden = new Set([
    ...board.candidateCharacters,
    ...board.level.placements.flatMap((placement) => [...placement.text])
  ]);
  assert.equal(session.decoys.length > 0, true);
  assert.equal(session.decoys.every((decoy) => !forbidden.has(decoy.character)), true);
  assert.equal(new Set(session.decoys.map((decoy) => decoy.character)).size, session.decoys.length);
  assert.equal(session.decoys.every((decoy) => !'東南西北'.includes(decoy.character)), true);
});

test('reduces decoy count when safe characters are insufficient', () => {
  const board = levelOneBoard();
  const session = createCandidateDecoySession({
    board,
    idioms: [idiom('one-safe', '春春春春')],
    mode: 'trap-candidates',
    orderCharacters: (characters) => characters
  });
  assert.equal(session.decoys.length, 1);
  assert.equal(session.decoys[0].character, '春');
});

test('rejects an orderer that injects unsafe or duplicate characters', () => {
  const board = levelOneBoard();
  assert.throws(
    () => createCandidateDecoySession({
      board,
      idioms: [idiom('safe-1', '春夏秋冬')],
      mode: 'trap-candidates',
      orderCharacters: () => ['春', '春', '惡']
    }),
    /偽字排序結果無效/
  );
});

test('valid placement recording advances thresholds and activates due decoys', () => {
  const initial = decoySession();
  assert.equal(initial.decoys.every((decoy) => decoy.status === 'scheduled'), true);
  const firstThreshold = initial.decoys[0].activationAfterValidPlacements;
  let current = initial;
  for (let count = 0; count < firstThreshold; count += 1) {
    current = recordValidCandidatePlacement(current);
  }
  assert.equal(current.validPlacements, firstThreshold);
  assert.equal(current.decoys[0].status, 'active');
  assert.equal(initial.validPlacements, 0);
});

test('standard mode ignores placement recording', () => {
  const standard = decoySession(0, 'standard');
  assert.strictEqual(recordValidCandidatePlacement(standard), standard);
});

test('ejection is idempotent and requires animation completion', () => {
  const active = decoySession(100);
  const id = active.decoys[0].id;
  const ejecting = beginCandidateDecoyEjection(active, id);
  assert.equal(ejecting.decoys[0].status, 'ejecting');
  assert.strictEqual(beginCandidateDecoyEjection(ejecting, id), ejecting);
  assert.strictEqual(beginCandidateDecoyEjection(ejecting, 'missing'), ejecting);

  const removed = completeCandidateDecoyEjection(ejecting, id);
  assert.equal(removed.decoys[0].status, 'removed');
  assert.strictEqual(completeCandidateDecoyEjection(removed, id), removed);
});

test('visible decoys include active and ejecting but exclude scheduled and removed', () => {
  const active = decoySession(100);
  const ejecting = beginCandidateDecoyEjection(active, active.decoys[0].id);
  const visible = getVisibleCandidateDecoys(ejecting);
  assert.equal(visible.some((decoy) => decoy.status === 'ejecting'), true);
  assert.equal(visible.some((decoy) => decoy.status === 'active'), true);

  const removed = completeCandidateDecoyEjection(ejecting, active.decoys[0].id);
  assert.equal(
    getVisibleCandidateDecoys(removed).some((decoy) => decoy.status === 'removed'),
    false
  );
  assert.equal(
    getVisibleCandidateDecoys(decoySession()).some((decoy) => decoy.status === 'scheduled'),
    false
  );
});
