import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPuzzleBoard } from '../.test-dist/src/puzzle/puzzle-board.js';
import { createPuzzleSession } from '../.test-dist/src/puzzle/puzzle-engine.js';
import { getPuzzleLevel } from '../.test-dist/src/puzzle/levels.js';
import {
  beginBoardIntruderEjection,
  completeBoardIntruderEjection,
  completeBoardIntruderReveal,
  getVisibleBoardIntruders,
  reconcileBoardIntruders,
  recordBoardPuzzleAction,
  recordValidBoardPlacement
} from '../.test-dist/src/traps/board-intruder-engine.js';

function puzzleContext() {
  const level = getPuzzleLevel(20);
  assert.notEqual(level, null);
  const board = buildPuzzleBoard(level);
  const puzzleSession = createPuzzleSession(board, (tiles) => tiles);
  return { board, puzzleSession };
}

function intruder(index, targetCellKey, overrides = {}) {
  return Object.freeze({
    id: `board-intruder-${String(index)}`,
    character: ['春', '夏', '秋'][index - 1] ?? '冬',
    targetCellKey,
    activationAfterValidPlacements: index,
    revealIntervalActions: [3, 5, 7][index - 1] ?? 3,
    nextRevealAtActionCount: null,
    revealCount: 0,
    status: 'scheduled',
    ...overrides
  });
}

function trapSession(overrides = {}) {
  const { board } = puzzleContext();
  const keys = board.fillableKeys;
  const intruders = overrides.intruders ?? Object.freeze([
    intruder(1, keys[0]),
    intruder(2, keys[1]),
    intruder(3, keys[2])
  ]);
  return Object.freeze({
    levelId: board.level.id,
    mode: 'trap-board',
    validPlacements: 0,
    actionCount: 0,
    intruders,
    ...overrides
  });
}

test('valid placement advances both counters and activates due intruders after the action', () => {
  const { puzzleSession } = puzzleContext();
  const initial = trapSession({
    validPlacements: 2,
    actionCount: 2,
    intruders: Object.freeze([
      intruder(1, puzzleSession.board.fillableKeys[0], {
        activationAfterValidPlacements: 3
      })
    ])
  });

  const next = recordValidBoardPlacement(initial, puzzleSession);
  assert.equal(next.validPlacements, 3);
  assert.equal(next.actionCount, 3);
  assert.equal(next.intruders[0].status, 'active');
  assert.equal(next.intruders[0].nextRevealAtActionCount, 6);
  assert.equal(initial.intruders[0].status, 'scheduled');
});

test('other puzzle actions advance only action count and reveal at most one due intruder', () => {
  const { puzzleSession } = puzzleContext();
  const keys = puzzleSession.board.fillableKeys;
  const initial = trapSession({
    validPlacements: 4,
    actionCount: 2,
    intruders: Object.freeze([
      intruder(1, keys[0], {
        status: 'active',
        nextRevealAtActionCount: 3
      }),
      intruder(2, keys[1], {
        status: 'active',
        nextRevealAtActionCount: 3
      })
    ])
  });

  const next = recordBoardPuzzleAction(initial, puzzleSession);
  assert.equal(next.validPlacements, 4);
  assert.equal(next.actionCount, 3);
  assert.deepEqual(next.intruders.map((item) => item.status), ['revealing', 'active']);
});

test('reconcile ejects visible intruders, removes scheduled filled targets and clears completion', () => {
  const { puzzleSession } = puzzleContext();
  const keys = puzzleSession.board.fillableKeys;
  const initial = trapSession({
    validPlacements: 3,
    intruders: Object.freeze([
      intruder(1, keys[0], { status: 'active', nextRevealAtActionCount: 3 }),
      intruder(2, keys[1], { status: 'revealing', nextRevealAtActionCount: 5 }),
      intruder(3, keys[2], { status: 'scheduled' })
    ])
  });
  const values = Object.freeze({
    [keys[0]]: '甲',
    [keys[1]]: '乙',
    [keys[2]]: '丙'
  });
  const filled = Object.freeze({ ...puzzleSession, values });

  const reconciled = reconcileBoardIntruders(initial, filled);
  assert.deepEqual(
    reconciled.intruders.map((item) => item.status),
    ['ejecting', 'ejecting', 'removed']
  );

  const completed = reconcileBoardIntruders(
    reconciled,
    Object.freeze({ ...filled, status: 'completed' })
  );
  assert.equal(completed.intruders.every((item) => item.status === 'removed'), true);
});

test('manual ejection is idempotent and completing it opens a due visible slot', () => {
  const { puzzleSession } = puzzleContext();
  const keys = puzzleSession.board.fillableKeys;
  const initial = trapSession({
    validPlacements: 5,
    actionCount: 5,
    intruders: Object.freeze([
      intruder(1, keys[0], { status: 'active', nextRevealAtActionCount: 8 }),
      intruder(2, keys[1], { status: 'active', nextRevealAtActionCount: 10 }),
      intruder(3, keys[2], {
        activationAfterValidPlacements: 3,
        status: 'scheduled'
      })
    ])
  });

  const ejecting = beginBoardIntruderEjection(initial, 'board-intruder-1');
  assert.equal(ejecting.intruders[0].status, 'ejecting');
  assert.strictEqual(beginBoardIntruderEjection(ejecting, 'board-intruder-1'), ejecting);
  assert.strictEqual(beginBoardIntruderEjection(ejecting, 'missing'), ejecting);

  const removed = completeBoardIntruderEjection(
    ejecting,
    puzzleSession,
    'board-intruder-1'
  );
  assert.equal(removed.intruders[0].status, 'removed');
  assert.equal(removed.intruders[2].status, 'active');
  assert.equal(removed.intruders[2].nextRevealAtActionCount, 12);
  assert.strictEqual(
    completeBoardIntruderEjection(removed, puzzleSession, 'board-intruder-1'),
    removed
  );
});

test('reveal completion returns active state and stops after three natural reveals', () => {
  const { puzzleSession } = puzzleContext();
  const key = puzzleSession.board.fillableKeys[0];
  const revealing = trapSession({
    actionCount: 10,
    intruders: Object.freeze([
      intruder(1, key, {
        status: 'revealing',
        revealCount: 1,
        nextRevealAtActionCount: 10
      })
    ])
  });
  const second = completeBoardIntruderReveal(revealing, 'board-intruder-1');
  assert.equal(second.intruders[0].status, 'active');
  assert.equal(second.intruders[0].revealCount, 2);
  assert.equal(second.intruders[0].nextRevealAtActionCount, 13);

  const thirdInput = trapSession({
    actionCount: 13,
    intruders: Object.freeze([
      intruder(1, key, {
        status: 'revealing',
        revealCount: 2,
        nextRevealAtActionCount: 13
      })
    ])
  });
  const third = completeBoardIntruderReveal(thirdInput, 'board-intruder-1');
  assert.equal(third.intruders[0].revealCount, 3);
  assert.equal(third.intruders[0].nextRevealAtActionCount, null);
  assert.strictEqual(completeBoardIntruderReveal(third, 'board-intruder-1'), third);
});

test('visible intruders include active, revealing and ejecting but never scheduled or removed', () => {
  const { puzzleSession } = puzzleContext();
  const keys = puzzleSession.board.fillableKeys;
  const session = trapSession({
    intruders: Object.freeze([
      intruder(1, keys[0], { status: 'active' }),
      intruder(2, keys[1], { status: 'revealing' }),
      intruder(3, keys[2], { status: 'ejecting' }),
      intruder(4, keys[3], { status: 'scheduled' }),
      intruder(5, keys[4], { status: 'removed' })
    ])
  });

  assert.deepEqual(
    getVisibleBoardIntruders(session).map((item) => item.status),
    ['active', 'revealing', 'ejecting']
  );
});
