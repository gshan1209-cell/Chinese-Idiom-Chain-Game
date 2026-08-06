import assert from 'node:assert/strict';
import test from 'node:test';

import { buildPuzzleBoard } from '../.test-dist/src/puzzle/puzzle-board.js';
import {
  createPuzzleSession,
  placePuzzleTile,
  selectPuzzleCell,
  usePuzzleHint
} from '../.test-dist/src/puzzle/puzzle-engine.js';
import { getPuzzleLevel } from '../.test-dist/src/puzzle/levels.js';
import {
  beginBoardIntruderEjection,
  createBoardIntruderSession,
  recordBoardPuzzleAction,
  recordValidBoardPlacement
} from '../.test-dist/src/traps/board-intruder-engine.js';
import {
  createCandidateDecoySession
} from '../.test-dist/src/traps/candidate-decoy-engine.js';

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

function context(levelNumber = 1) {
  const level = getPuzzleLevel(levelNumber);
  assert.notEqual(level, null);
  const board = buildPuzzleBoard(level);
  const session = createPuzzleSession(board, (tiles) => tiles);
  return { board, session };
}

function activeTrapSession(board, targetCellKey, extras = []) {
  return Object.freeze({
    levelId: board.level.id,
    mode: 'trap-board',
    validPlacements: 1,
    actionCount: 1,
    intruders: Object.freeze([
      Object.freeze({
        id: 'board-intruder-1',
        character: '龘',
        targetCellKey,
        activationAfterValidPlacements: 1,
        revealIntervalActions: 3,
        nextRevealAtActionCount: 4,
        revealCount: 0,
        status: 'active'
      }),
      ...extras
    ])
  });
}

function correctTileFor(session, key) {
  const answer = session.board.cells.get(key)?.answer;
  assert.notEqual(answer, undefined);
  const tile = session.tiles.find(
    (candidate) => candidate.usedBy === null && candidate.character === answer
  );
  assert.notEqual(tile, undefined);
  return tile;
}

test('legal tile fills an intruder target without adding a mistake and starts ejection', () => {
  const { board, session } = context();
  const target = session.selectedCellKey;
  assert.notEqual(target, null);
  const tile = correctTileFor(session, target);
  const trap = activeTrapSession(board, target);

  const result = placePuzzleTile(session, tile.id);
  assert.equal(result.session.values[target], board.cells.get(target)?.answer);
  assert.equal(result.session.mistakes, session.mistakes);

  const nextTrap = recordValidBoardPlacement(trap, result.session);
  assert.equal(nextTrap.intruders[0].status, 'ejecting');
});

test('hint fills an intruder target once and starts ejection without adding mistakes', () => {
  const { board, session } = context();
  const result = usePuzzleHint(session);
  assert.notEqual(result.hintedCellKey, null);
  const trap = activeTrapSession(board, result.hintedCellKey);

  const nextTrap = recordBoardPuzzleAction(trap, result.session);
  assert.equal(result.session.hintsUsed, session.hintsUsed + 1);
  assert.equal(result.session.mistakes, session.mistakes);
  assert.equal(nextTrap.intruders[0].status, 'ejecting');
});

test('manual intruder click changes only trap state', () => {
  const { board, session } = context();
  const target = session.selectedCellKey;
  assert.notEqual(target, null);
  const trap = activeTrapSession(board, target);
  const snapshot = {
    selectedCellKey: session.selectedCellKey,
    preferredPlacementId: session.preferredPlacementId,
    score: session.score,
    mistakes: session.mistakes,
    hintsUsed: session.hintsUsed,
    values: session.values
  };

  const nextTrap = beginBoardIntruderEjection(trap, 'board-intruder-1');
  assert.equal(nextTrap.intruders[0].status, 'ejecting');
  assert.deepEqual({
    selectedCellKey: session.selectedCellKey,
    preferredPlacementId: session.preferredPlacementId,
    score: session.score,
    mistakes: session.mistakes,
    hintsUsed: session.hintsUsed,
    values: session.values
  }, snapshot);
});

test('final correct tile completes the level and removes every remaining intruder', () => {
  const { board } = context();
  let session = createPuzzleSession(board, (tiles) => tiles);

  while (session.correctCells < board.fillableKeys.length - 1) {
    const target = session.selectedCellKey;
    assert.notEqual(target, null);
    const tile = correctTileFor(session, target);
    session = placePuzzleTile(session, tile.id).session;
  }

  const remainingKey = board.fillableKeys.find(
    (key) => session.values[key] !== board.cells.get(key)?.answer
  );
  assert.notEqual(remainingKey, undefined);
  session = selectPuzzleCell(session, remainingKey);
  const finalTile = correctTileFor(session, remainingKey);
  const trap = activeTrapSession(board, remainingKey, [
    Object.freeze({
      id: 'board-intruder-2',
      character: '龖',
      targetCellKey: board.fillableKeys.find((key) => key !== remainingKey),
      activationAfterValidPlacements: 99,
      revealIntervalActions: 5,
      nextRevealAtActionCount: null,
      revealCount: 0,
      status: 'scheduled'
    })
  ]);

  const result = placePuzzleTile(session, finalTile.id);
  assert.equal(result.session.status, 'completed');
  const completedTrap = recordValidBoardPlacement(trap, result.session);
  assert.equal(
    completedTrap.intruders.every((intruder) => intruder.status === 'removed'),
    true
  );
});

test('candidate and board traps reserve disjoint characters in board mode', () => {
  const { board, session } = context(20);
  const idioms = Object.freeze([
    idiom('safe-1', '龘龖靐齉'),
    idiom('safe-2', '爨麤灩灪'),
    idiom('safe-3', '籲纞虋讟')
  ]);
  const candidates = createCandidateDecoySession({
    board,
    idioms,
    mode: 'trap-board',
    orderCharacters: (characters) => characters
  });
  const reserved = candidates.decoys.map((decoy) => decoy.character);
  const boardTraps = createBoardIntruderSession({
    board,
    puzzleSession: session,
    idioms,
    mode: 'trap-board',
    excludedCharacters: reserved,
    orderCharacters: (characters) => characters,
    orderCellKeys: (keys) => keys
  });
  const candidateSet = new Set(reserved);
  assert.equal(
    boardTraps.intruders.every((intruder) => !candidateSet.has(intruder.character)),
    true
  );
});

test('standard and candidate-only modes create no board overlays', () => {
  const { board, session } = context();
  for (const mode of ['standard', 'trap-candidates']) {
    const traps = createBoardIntruderSession({
      board,
      puzzleSession: session,
      idioms: [idiom('safe', '龘龖靐齉')],
      mode,
      orderCharacters: (characters) => characters,
      orderCellKeys: (keys) => keys
    });
    assert.deepEqual(traps.intruders, []);
  }
});

test('replaying the same level creates fresh board trap counters', () => {
  const first = context();
  const initial = createBoardIntruderSession({
    board: first.board,
    puzzleSession: first.session,
    idioms: [idiom('safe', '龘龖靐齉')],
    mode: 'trap-board',
    orderCharacters: (characters) => characters,
    orderCellKeys: (keys) => keys,
    validPlacements: 4,
    actionCount: 9
  });
  assert.equal(initial.validPlacements, 4);
  assert.equal(initial.actionCount, 9);

  const replay = context();
  const fresh = createBoardIntruderSession({
    board: replay.board,
    puzzleSession: replay.session,
    idioms: [idiom('safe', '龘龖靐齉')],
    mode: 'trap-board',
    orderCharacters: (characters) => characters,
    orderCellKeys: (keys) => keys
  });
  assert.equal(fresh.validPlacements, 0);
  assert.equal(fresh.actionCount, 0);
  assert.equal(fresh.intruders.every((intruder) => intruder.status === 'scheduled'), true);
});

test('stubborn mode composes phase one and phase two traps', () => {
  const { board, session } = context();
  const idioms = [idiom('safe', '龘龖靐齉')];
  const candidates = createCandidateDecoySession({
    board,
    idioms,
    mode: 'trap-stubborn',
    orderCharacters: (characters) => characters
  });
  const boardTraps = createBoardIntruderSession({
    board,
    puzzleSession: session,
    idioms,
    mode: 'trap-stubborn',
    excludedCharacters: candidates.decoys.map((decoy) => decoy.character),
    orderCharacters: (characters) => characters,
    orderCellKeys: (keys) => keys
  });

  assert.ok(candidates.decoys.length > 0);
  assert.ok(boardTraps.intruders.length > 0);
  const candidateCharacters = new Set(candidates.decoys.map((decoy) => decoy.character));
  assert.equal(
    boardTraps.intruders.every((intruder) => !candidateCharacters.has(intruder.character)),
    true
  );
});
