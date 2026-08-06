import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPuzzleBoard } from '../.test-dist/src/puzzle/puzzle-board.js';
import { createPuzzleSession } from '../.test-dist/src/puzzle/puzzle-engine.js';
import { getPuzzleLevel } from '../.test-dist/src/puzzle/levels.js';
import {
  activateNextDueStubbornIntruder,
  completeStubbornEjection,
  createStubbornIntruderSession,
  getStubbornIntruderAtCell,
  getVisibleStubbornIntruders,
  hitStubbornIntruder,
  recordStubbornPuzzleAction,
  recordStubbornValidPlacement,
  stubbornIntruderCount
} from '../.test-dist/src/traps/stubborn-intruder-engine.js';

function idiom(id, text, enabled = true) {
  return Object.freeze({
    id,
    text,
    firstChar: [...text][0],
    lastChar: [...text].at(-1),
    bopomofo: '',
    pinyin: '',
    meaning: '測試用安全字元',
    example: '',
    source: 'test',
    difficulty: 'easy',
    tags: Object.freeze([]),
    enabled,
    version: 1
  });
}

function context(levelNumber = 20) {
  const level = getPuzzleLevel(levelNumber);
  assert.notEqual(level, null);
  const board = buildPuzzleBoard(level);
  const puzzleSession = createPuzzleSession(board, (tiles) => tiles);
  return { board, puzzleSession };
}

function safeIdioms() {
  return Object.freeze([
    idiom('safe-1', '龘龖靐齉'),
    idiom('safe-2', '爨麤灩灪'),
    idiom('safe-3', '籲纞虋讟'),
    idiom('disabled', '春夏秋冬', false)
  ]);
}

function createSession(overrides = {}) {
  const { board, puzzleSession } = context();
  return createStubbornIntruderSession({
    board,
    puzzleSession,
    idioms: safeIdioms(),
    mode: 'trap-stubborn',
    excludedCharacters: ['龘'],
    excludedTargetCellKeys: [board.fillableKeys[0]],
    selectedCellKey: puzzleSession.selectedCellKey,
    nextAutoCellKey: board.fillableKeys[1] ?? null,
    orderCharacters: (characters) => characters,
    orderCellKeys: (keys) => keys,
    ...overrides
  });
}

function activeSession() {
  const session = createSession({ validPlacements: 100 });
  assert.equal(getVisibleStubbornIntruders(session).length, 1);
  return session;
}

function twoIntruderSession() {
  return Object.freeze({
    levelId: 'level-test',
    mode: 'trap-stubborn',
    validPlacements: 20,
    actionCount: 20,
    intruders: Object.freeze([
      Object.freeze({
        id: 'stubborn-1',
        character: '甲',
        targetCellKey: '0:0',
        activationAfterValidPlacements: 5,
        requiredHitCount: 3,
        currentHitStreak: 0,
        lastAcceptedHitAtMs: null,
        status: 'active'
      }),
      Object.freeze({
        id: 'stubborn-2',
        character: '乙',
        targetCellKey: '0:1',
        activationAfterValidPlacements: 10,
        requiredHitCount: 3,
        currentHitStreak: 0,
        lastAcceptedHitAtMs: null,
        status: 'scheduled'
      })
    ])
  });
}

test('uses the fixed six-percent count with a one-to-two clamp', () => {
  assert.equal(stubbornIntruderCount(0), 0);
  assert.equal(stubbornIntruderCount(1), 1);
  assert.equal(stubbornIntruderCount(16), 1);
  assert.equal(stubbornIntruderCount(17), 2);
  assert.equal(stubbornIntruderCount(100), 2);
});

test('only stubborn mode creates stubborn intruders', () => {
  for (const mode of ['standard', 'trap-candidates', 'trap-board']) {
    assert.deepEqual(createSession({ mode }).intruders, []);
  }
  assert.ok(createSession().intruders.length > 0);
});

test('creates safe unique characters on safe unique empty targets', () => {
  const session = createSession();
  const { board, puzzleSession } = context();
  const characters = session.intruders.map((intruder) => intruder.character);
  const targets = session.intruders.map((intruder) => intruder.targetCellKey);
  const forbiddenCharacters = new Set([
    ...board.candidateCharacters,
    ...[...board.cells.values()].map((cell) => cell.answer),
    '龘'
  ]);
  const forbiddenTargets = new Set([
    board.fillableKeys[0],
    board.fillableKeys[1],
    puzzleSession.selectedCellKey
  ]);

  assert.ok(session.intruders.length <= 2);
  assert.equal(new Set(characters).size, characters.length);
  assert.equal(new Set(targets).size, targets.length);
  assert.equal(characters.every((character) => !forbiddenCharacters.has(character)), true);
  assert.equal(characters.every((character) => !'春夏秋冬'.includes(character)), true);
  assert.equal(targets.every((key) => board.fillableKeys.includes(key)), true);
  assert.equal(targets.every((key) => puzzleSession.values[key] === undefined), true);
  assert.equal(targets.every((key) => !forbiddenTargets.has(key)), true);
  assert.equal(session.intruders.every((intruder) => intruder.requiredHitCount === 3), true);
  assert.equal(session.intruders.every((intruder) => intruder.currentHitStreak === 0), true);
  assert.equal(session.intruders.every((intruder) => intruder.lastAcceptedHitAtMs === null), true);
  assert.equal(session.intruders.every((intruder) => intruder.status === 'scheduled'), true);
});

test('does not create new stubborn intruders with fewer than two empty cells', () => {
  const { board, puzzleSession } = context();
  const values = Object.freeze(Object.fromEntries(
    board.fillableKeys.slice(1).map((key) => [key, board.cells.get(key)?.answer ?? ''])
  ));
  const almostComplete = Object.freeze({ ...puzzleSession, values });

  const session = createStubbornIntruderSession({
    board,
    puzzleSession: almostComplete,
    idioms: safeIdioms(),
    mode: 'trap-stubborn',
    orderCharacters: (characters) => characters,
    orderCellKeys: (keys) => keys
  });

  assert.deepEqual(session.intruders, []);
});

test('reduces the plan when safe characters or targets are insufficient', () => {
  const { board, puzzleSession } = context();
  const oneCharacter = createStubbornIntruderSession({
    board,
    puzzleSession,
    idioms: [idiom('one', '龘龘龘龘')],
    mode: 'trap-stubborn',
    orderCharacters: (characters) => characters,
    orderCellKeys: (keys) => keys
  });
  assert.equal(oneCharacter.intruders.length, 1);

  const availableTargets = board.fillableKeys.slice(0, 2);
  const values = Object.freeze(Object.fromEntries(
    board.fillableKeys
      .filter((key) => !availableTargets.includes(key))
      .map((key) => [key, board.cells.get(key)?.answer ?? ''])
  ));
  const twoEmpty = Object.freeze({ ...puzzleSession, values, selectedCellKey: null });
  const oneSafeTarget = createStubbornIntruderSession({
    board,
    puzzleSession: twoEmpty,
    idioms: safeIdioms(),
    mode: 'trap-stubborn',
    excludedTargetCellKeys: [availableTargets[0]],
    orderCharacters: (characters) => characters,
    orderCellKeys: (keys) => keys
  });
  assert.equal(oneSafeTarget.intruders.length, 1);
  assert.equal(oneSafeTarget.intruders[0].targetCellKey, availableTargets[1]);
});

test('rejects orderers that change safe character or target permutations', () => {
  assert.throws(
    () => createSession({ orderCharacters: () => ['龖', '龖', '惡'] }),
    /頑固伏字字元排序結果無效/
  );
  assert.throws(
    () => createSession({ orderCellKeys: () => ['missing-cell'] }),
    /頑固伏字格排序結果無效/
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

test('visible and target queries include active and ejecting only', () => {
  const session = Object.freeze({
    levelId: 'level-test',
    mode: 'trap-stubborn',
    validPlacements: 4,
    actionCount: 7,
    intruders: Object.freeze([
      Object.freeze({
        id: 'scheduled', character: '甲', targetCellKey: '0:0',
        activationAfterValidPlacements: 8, requiredHitCount: 3,
        currentHitStreak: 0, lastAcceptedHitAtMs: null, status: 'scheduled'
      }),
      Object.freeze({
        id: 'active', character: '乙', targetCellKey: '0:1',
        activationAfterValidPlacements: 2, requiredHitCount: 3,
        currentHitStreak: 1, lastAcceptedHitAtMs: 100, status: 'active'
      }),
      Object.freeze({
        id: 'ejecting', character: '丙', targetCellKey: '0:2',
        activationAfterValidPlacements: 3, requiredHitCount: 3,
        currentHitStreak: 3, lastAcceptedHitAtMs: 300, status: 'ejecting'
      }),
      Object.freeze({
        id: 'removed', character: '丁', targetCellKey: '0:3',
        activationAfterValidPlacements: 1, requiredHitCount: 3,
        currentHitStreak: 0, lastAcceptedHitAtMs: null, status: 'removed'
      })
    ])
  });

  assert.deepEqual(
    getVisibleStubbornIntruders(session).map((intruder) => intruder.status),
    ['active', 'ejecting']
  );
  assert.equal(getStubbornIntruderAtCell(session, '0:1')?.id, 'active');
  assert.equal(getStubbornIntruderAtCell(session, '0:0'), null);
});

test('valid placements advance counters and activate at most one due intruder', () => {
  const initial = createSession();
  assert.ok(initial.intruders.length > 0);
  const threshold = initial.intruders[0].activationAfterValidPlacements;
  let current = initial;
  for (let count = 0; count < threshold; count += 1) {
    current = recordStubbornValidPlacement(current);
  }

  assert.equal(current.validPlacements, threshold);
  assert.equal(current.actionCount, threshold);
  assert.equal(getVisibleStubbornIntruders(current).length, 1);
  assert.equal(current.intruders[0].status, 'active');
});

test('hit timing accepts 80ms and 700ms boundaries while ignoring faster taps', () => {
  const initial = activeSession();
  const id = initial.intruders[0].id;
  const first = hitStubbornIntruder(initial, id, 1_000);
  assert.equal(first.intruders[0].currentHitStreak, 1);
  assert.equal(first.intruders[0].lastAcceptedHitAtMs, 1_000);

  const ignored = hitStubbornIntruder(first, id, 1_079);
  assert.strictEqual(ignored, first);

  const second = hitStubbornIntruder(first, id, 1_080);
  assert.equal(second.intruders[0].currentHitStreak, 2);
  assert.equal(second.intruders[0].lastAcceptedHitAtMs, 1_080);

  const third = hitStubbornIntruder(second, id, 1_780);
  assert.equal(third.intruders[0].currentHitStreak, 3);
  assert.equal(third.intruders[0].status, 'ejecting');
});

test('a tap after 701ms starts a new one-hit streak', () => {
  const initial = activeSession();
  const id = initial.intruders[0].id;
  const first = hitStubbornIntruder(initial, id, 2_000);
  const reset = hitStubbornIntruder(first, id, 2_701);

  assert.equal(reset.intruders[0].currentHitStreak, 1);
  assert.equal(reset.intruders[0].lastAcceptedHitAtMs, 2_701);
  assert.equal(reset.intruders[0].status, 'active');
});

test('ejection completion and repeated invalid hits are idempotent', () => {
  const initial = activeSession();
  const id = initial.intruders[0].id;
  const first = hitStubbornIntruder(initial, id, 100);
  const second = hitStubbornIntruder(first, id, 200);
  const ejecting = hitStubbornIntruder(second, id, 300);

  assert.strictEqual(hitStubbornIntruder(ejecting, id, 400), ejecting);
  assert.strictEqual(hitStubbornIntruder(ejecting, 'missing', 400), ejecting);

  const removed = completeStubbornEjection(ejecting, id);
  assert.equal(removed.intruders[0].status, 'removed');
  assert.equal(removed.intruders[0].currentHitStreak, 0);
  assert.equal(removed.intruders[0].lastAcceptedHitAtMs, null);
  assert.strictEqual(completeStubbornEjection(removed, id), removed);
});

test('ordinary puzzle actions reset partial streaks without removing intruders', () => {
  const initial = activeSession();
  const id = initial.intruders[0].id;
  const hit = hitStubbornIntruder(initial, id, 500);
  const reset = recordStubbornPuzzleAction(hit);

  assert.equal(reset.actionCount, initial.actionCount + 1);
  assert.equal(reset.intruders[0].status, 'active');
  assert.equal(reset.intruders[0].currentHitStreak, 0);
  assert.equal(reset.intruders[0].lastAcceptedHitAtMs, null);
});

test('removing the visible intruder allows one due scheduled intruder to activate', () => {
  const initial = twoIntruderSession();
  const id = initial.intruders[0].id;
  const first = hitStubbornIntruder(initial, id, 1_000);
  const second = hitStubbornIntruder(first, id, 1_100);
  const ejecting = hitStubbornIntruder(second, id, 1_200);
  const removed = completeStubbornEjection(ejecting, id);

  assert.equal(getVisibleStubbornIntruders(removed).length, 0);
  const activated = activateNextDueStubbornIntruder(removed);
  assert.equal(getVisibleStubbornIntruders(activated).length, 1);
  assert.equal(activated.intruders[1].status, 'active');
});
