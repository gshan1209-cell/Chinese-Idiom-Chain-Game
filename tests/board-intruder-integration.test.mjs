import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('board intruder hook owns an independent session without puzzle mutations', async () => {
  const source = await read('src/app/use-board-intruders.ts');
  assert.match(source, /createBoardIntruderSession/);
  assert.match(source, /recordValidBoardPlacement/);
  assert.match(source, /recordBoardPuzzleAction/);
  assert.match(source, /getVisibleBoardIntruders/);
  assert.equal(source.includes("../puzzle/puzzle-engine"), false);
  assert.equal(source.includes('placePuzzleTile('), false);
  assert.equal(source.includes('selectPuzzleCell('), false);
  assert.equal(source.includes('removePuzzleCell('), false);
  assert.equal(source.includes('usePuzzleHint('), false);
});

test('board intruder engine never mutates puzzle session fields', async () => {
  const source = await read('src/traps/board-intruder-engine.ts');
  for (const assignment of [
    /\.values\[[^\]]+\]\s*=/,
    /\.tileByCell\[[^\]]+\]\s*=/,
    /\.tiles\[[^\]]+\]\s*=/,
    /\.selectedCellKey\s*=/,
    /\.mistakes\s*=/,
    /\.hintsUsed\s*=/,
    /\.score\s*=/,
    /\.correctCells\s*=/
  ]) {
    assert.doesNotMatch(source, assignment);
  }
});

test('candidate hook exposes stable reserved characters for board traps', async () => {
  const source = await read('src/app/use-candidate-decoys.ts');
  assert.match(source, /reservedCharacters/);
  assert.match(source, /state\.session\.decoys/);
  assert.match(source, /Object\.freeze/);
});

test('successful tile placement notifies both trap systems with the next puzzle session', async () => {
  const source = await read('src/app/use-puzzle-game.ts');
  assert.match(source, /useBoardIntruders/);
  const start = source.indexOf('const chooseTile');
  const end = source.indexOf('const chooseCandidateDecoy', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const handler = source.slice(start, end);
  assert.match(handler, /result\.session !== current/);
  assert.match(handler, /recordValidPlacement\(\)/);
  assert.match(handler, /recordValidBoardPlacement\(result\.session\)/);
});

test('state-changing hint remove and clear notify board actions while selection and shuffle do not', async () => {
  const source = await read('src/app/use-puzzle-game.ts');
  for (const handlerName of ['removeSelected', 'hint', 'clear']) {
    const start = source.indexOf(`const ${handlerName}`);
    const end = source.indexOf('\n  const ', start + 1);
    assert.notEqual(start, -1, handlerName);
    const handler = source.slice(start, end === -1 ? undefined : end);
    assert.match(handler, /recordBoardPuzzleAction/);
    assert.match(handler, /next !== current|result\.session !== current/);
  }
  for (const handlerName of ['selectCell', 'shuffleTiles']) {
    const start = source.indexOf(`const ${handlerName}`);
    const end = source.indexOf('\n  const ', start + 1);
    const handler = source.slice(start, end === -1 ? undefined : end);
    assert.equal(handler.includes('recordBoardPuzzleAction'), false, handlerName);
  }
});

test('board intruder handlers never call puzzle placement or selection functions', async () => {
  const source = await read('src/app/use-puzzle-game.ts');
  const start = source.indexOf('const chooseBoardIntruder');
  const end = source.indexOf('const removeSelected', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const handlers = source.slice(start, end);
  for (const mutation of [
    'placePuzzleTile(',
    'selectPuzzleCell(',
    'removePuzzleCell(',
    'usePuzzleHint('
  ]) {
    assert.equal(handlers.includes(mutation), false, mutation);
  }
  assert.match(handlers, /beginBoardEjection\(id\)/);
  assert.match(handlers, /completeBoardEjection\(id, session\)/);
  assert.match(handlers, /completeBoardReveal\(id\)/);
});

test('new boards reset board traps while dictionary readiness preserves counters', async () => {
  const source = await read('src/app/use-board-intruders.ts');
  assert.match(source, /current\.board !== board/);
  assert.match(source, /contextChanged \? 0 : current\.session\.validPlacements/);
  assert.match(source, /contextChanged \? 0 : current\.session\.actionCount/);
  assert.match(source, /state\.board === board/);
});
