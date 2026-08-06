import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPuzzleBoard } from '../.test-dist/src/puzzle/puzzle-board.js';
import {
  createPuzzleSession,
  usePuzzleHint
} from '../.test-dist/src/puzzle/puzzle-engine.js';
import { getPuzzleLevel } from '../.test-dist/src/puzzle/levels.js';
import {
  clearStubbornIntruderForHint,
  isStubbornTargetBlocked,
  reconcileStubbornIntruders
} from '../.test-dist/src/traps/stubborn-intruder-engine.js';

function context() {
  const level = getPuzzleLevel(20);
  assert.notEqual(level, null);
  const board = buildPuzzleBoard(level);
  const puzzleSession = createPuzzleSession(board, (tiles) => tiles);
  const first = board.fillableKeys[0];
  const second = board.fillableKeys[1];
  assert.notEqual(first, undefined);
  assert.notEqual(second, undefined);
  return { board, puzzleSession, first, second };
}

function intruder(id, targetCellKey, status = 'active') {
  return Object.freeze({
    id,
    character: id === 'first' ? '甲' : '乙',
    targetCellKey,
    activationAfterValidPlacements: 1,
    requiredHitCount: 3,
    currentHitStreak: status === 'active' ? 1 : 0,
    lastAcceptedHitAtMs: status === 'active' ? 100 : null,
    status
  });
}

function trapSession(first, second) {
  return Object.freeze({
    levelId: 'level-020',
    mode: 'trap-stubborn',
    validPlacements: 10,
    actionCount: 10,
    intruders: Object.freeze([
      intruder('first', first, 'active'),
      intruder('second', second, 'scheduled')
    ])
  });
}

test('filled targets eject visible intruders and remove scheduled intruders', () => {
  const { puzzleSession, first, second } = context();
  const values = Object.freeze({
    ...puzzleSession.values,
    [first]: '甲',
    [second]: '乙'
  });
  const filled = Object.freeze({ ...puzzleSession, values });
  const reconciled = reconcileStubbornIntruders(
    trapSession(first, second),
    filled
  );

  assert.equal(reconciled.intruders[0].status, 'ejecting');
  assert.equal(reconciled.intruders[0].currentHitStreak, 0);
  assert.equal(reconciled.intruders[1].status, 'removed');
});

test('completed puzzles remove all stubborn overlays immediately', () => {
  const { puzzleSession, first, second } = context();
  const completed = Object.freeze({ ...puzzleSession, status: 'completed' });
  const reconciled = reconcileStubbornIntruders(
    trapSession(first, second),
    completed
  );

  assert.equal(
    reconciled.intruders.every((item) => item.status === 'removed'),
    true
  );
});

test('scheduled targets that become selected or reserved are removed safely', () => {
  const { puzzleSession, first, second } = context();
  const reconciled = reconcileStubbornIntruders(
    trapSession(first, second),
    puzzleSession,
    [second]
  );

  assert.equal(reconciled.intruders[0].status, 'active');
  assert.equal(reconciled.intruders[1].status, 'removed');
});

test('only active and ejecting target cells block normal placement', () => {
  const { first, second } = context();
  const session = Object.freeze({
    ...trapSession(first, second),
    intruders: Object.freeze([
      intruder('active', first, 'active'),
      intruder('ejecting', second, 'ejecting'),
      intruder('scheduled', '9:9', 'scheduled'),
      intruder('removed', '9:8', 'removed')
    ])
  });

  assert.equal(isStubbornTargetBlocked(session, first), true);
  assert.equal(isStubbornTargetBlocked(session, second), true);
  assert.equal(isStubbornTargetBlocked(session, '9:9'), false);
  assert.equal(isStubbornTargetBlocked(session, '9:8'), false);
});

test('hint preparation removes the blocking intruder without mutating puzzle state', () => {
  const { puzzleSession, first, second } = context();
  const traps = trapSession(first, second);
  const snapshot = JSON.stringify(puzzleSession);
  const cleared = clearStubbornIntruderForHint(traps, first);

  assert.equal(cleared.intruders[0].status, 'removed');
  assert.equal(cleared.intruders[0].currentHitStreak, 0);
  assert.equal(cleared.intruders[0].lastAcceptedHitAtMs, null);
  assert.equal(JSON.stringify(puzzleSession), snapshot);
});

test('existing hint engine still fills exactly once after trap preparation', () => {
  const { puzzleSession, first, second } = context();
  const traps = clearStubbornIntruderForHint(trapSession(first, second), first);
  const result = usePuzzleHint(puzzleSession);

  assert.equal(traps.intruders[0].status, 'removed');
  assert.equal(result.session.hintsUsed, puzzleSession.hintsUsed + 1);
  assert.notEqual(result.hintedCellKey, null);
  assert.equal(result.session.mistakes, puzzleSession.mistakes);
});
