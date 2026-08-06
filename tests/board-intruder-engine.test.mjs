import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPuzzleBoard } from '../.test-dist/src/puzzle/puzzle-board.js';
import { createPuzzleSession } from '../.test-dist/src/puzzle/puzzle-engine.js';
import { getPuzzleLevel } from '../.test-dist/src/puzzle/levels.js';
import {
  boardIntruderActivationThresholds,
  boardIntruderCount,
  createBoardIntruderSession
} from '../.test-dist/src/traps/board-intruder-engine.js';

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

function boardContext(levelNumber = 1) {
  const level = getPuzzleLevel(levelNumber);
  assert.notEqual(level, null);
  const board = buildPuzzleBoard(level);
  const puzzleSession = createPuzzleSession(board, (tiles) => tiles);
  return { board, puzzleSession };
}

function safeIdioms() {
  return [
    idiom('safe-1', '春夏秋冬'),
    idiom('safe-2', '東南西北'),
    idiom('safe-3', '風花雪月'),
    idiom('disabled', '金木水火', false)
  ];
}

function createSession(overrides = {}) {
  const { board, puzzleSession } = boardContext();
  return createBoardIntruderSession({
    board,
    puzzleSession,
    idioms: safeIdioms(),
    mode: 'trap-board',
    excludedCharacters: ['春'],
    orderCharacters: (characters) => characters,
    orderCellKeys: (keys) => keys,
    ...overrides
  });
}

test('uses the fixed ten-percent count with a one-to-three clamp', () => {
  assert.equal(boardIntruderCount(0), 0);
  assert.equal(boardIntruderCount(1), 1);
  assert.equal(boardIntruderCount(10), 1);
  assert.equal(boardIntruderCount(20), 2);
  assert.equal(boardIntruderCount(30), 3);
  assert.equal(boardIntruderCount(100), 3);
});

test('uses fixed progressive activation thresholds', () => {
  assert.deepEqual(boardIntruderActivationThresholds(1, 20), [7]);
  assert.deepEqual(boardIntruderActivationThresholds(2, 20), [5, 12]);
  assert.deepEqual(boardIntruderActivationThresholds(3, 20), [4, 10, 15]);
});

test('board and stubborn modes create board intruders', () => {
  const { board, puzzleSession } = boardContext();
  for (const mode of ['standard', 'trap-candidates']) {
    const session = createBoardIntruderSession({
      board,
      puzzleSession,
      idioms: safeIdioms(),
      mode,
      orderCharacters: (characters) => characters,
      orderCellKeys: (keys) => keys
    });
    assert.deepEqual(session.intruders, []);
  }

  assert.ok(createSession().intruders.length > 0);
  assert.ok(createSession({ mode: 'trap-stubborn' }).intruders.length > 0);
});

test('creates unique safe characters on unique empty fillable targets', () => {
  const session = createSession();
  const { board, puzzleSession } = boardContext();
  const targetKeys = session.intruders.map((intruder) => intruder.targetCellKey);
  const characters = session.intruders.map((intruder) => intruder.character);
  const forbidden = new Set([
    ...board.candidateCharacters,
    ...[...board.cells.values()].map((cell) => cell.answer),
    '春'
  ]);

  assert.ok(session.intruders.length <= 3);
  assert.equal(new Set(targetKeys).size, targetKeys.length);
  assert.equal(new Set(characters).size, characters.length);
  assert.equal(targetKeys.every((key) => board.fillableKeys.includes(key)), true);
  assert.equal(targetKeys.every((key) => puzzleSession.values[key] === undefined), true);
  assert.equal(characters.every((character) => !forbidden.has(character)), true);
  assert.equal(characters.every((character) => !'金木水火'.includes(character)), true);
  assert.equal(session.intruders.every((intruder) => intruder.status === 'scheduled'), true);
  assert.equal(session.intruders.every((intruder) => intruder.nextRevealAtActionCount === null), true);
});

test('reduces the plan when safe characters or empty cells are insufficient', () => {
  const { board, puzzleSession } = boardContext();
  const oneCharacter = createBoardIntruderSession({
    board,
    puzzleSession,
    idioms: [idiom('one-safe', '春春春春')],
    mode: 'trap-board',
    orderCharacters: (characters) => characters,
    orderCellKeys: (keys) => keys
  });
  assert.equal(oneCharacter.intruders.length, 1);

  const almostFullValues = Object.freeze(Object.fromEntries(
    board.fillableKeys.slice(1).map((key) => [key, board.cells.get(key)?.answer ?? ''])
  ));
  const oneEmptyCell = Object.freeze({ ...puzzleSession, values: almostFullValues });
  const oneTarget = createBoardIntruderSession({
    board,
    puzzleSession: oneEmptyCell,
    idioms: safeIdioms(),
    mode: 'trap-board',
    orderCharacters: (characters) => characters,
    orderCellKeys: (keys) => keys
  });
  assert.equal(oneTarget.intruders.length, 1);
  assert.equal(oneTarget.intruders[0].targetCellKey, board.fillableKeys[0]);
});

test('rejects character and cell orderers that change the safe permutations', () => {
  assert.throws(
    () => createSession({ orderCharacters: () => ['春', '春', '惡'] }),
    /陷阱字排序結果無效/
  );
  assert.throws(
    () => createSession({ orderCellKeys: () => ['missing-cell'] }),
    /伏字格排序結果無效/
  );
});

test('same ordered inputs create deeply equal frozen sessions', () => {
  const first = createSession();
  const second = createSession();
  assert.deepEqual(first, second);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.intruders), true);
  assert.equal(first.intruders.every(Object.isFrozen), true);
});
