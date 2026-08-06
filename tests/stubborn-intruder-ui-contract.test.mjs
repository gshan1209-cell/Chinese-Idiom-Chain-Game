import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('stubborn hook owns an independent session and pure engine coordination', async () => {
  const source = await read('src/app/use-stubborn-intruders.ts');
  assert.match(source, /useState<StubbornIntruderHookState>/);
  assert.match(source, /createStubbornIntruderSession/);
  assert.match(source, /recordStubbornValidPlacement/);
  assert.match(source, /recordStubbornPuzzleAction/);
  assert.match(source, /hitStubbornIntruder/);
  assert.match(source, /clearStubbornIntruderForHint/);
  assert.match(source, /reconcileStubbornIntruders/);
  assert.match(source, /getVisibleStubbornIntruders/);
  assert.equal(source.includes('placePuzzleTile('), false);
  assert.equal(source.includes('usePuzzleHint('), false);
});

test('puzzle coordinator reserves candidate then board resources before stubborn generation', async () => {
  const source = await read('src/app/use-puzzle-game.ts');
  const candidateIndex = source.indexOf('useCandidateDecoys({');
  const boardIndex = source.indexOf('useBoardIntruders({');
  const stubbornIndex = source.indexOf('useStubbornIntruders({');
  assert.ok(candidateIndex >= 0);
  assert.ok(boardIndex > candidateIndex);
  assert.ok(stubbornIndex > boardIndex);
  assert.match(source, /excludedCharacters:\s*stubbornExcludedCharacters/);
  assert.match(source, /excludedTargetCellKeys:\s*boardReservedTargetCellKeys/);
  assert.match(source, /findNextPuzzleCell/);
});

test('blocked stubborn targets stop normal tile placement before puzzle engine runs', async () => {
  const source = await read('src/app/use-puzzle-game.ts');
  const chooseTile = source.slice(
    source.indexOf('const chooseTile'),
    source.indexOf('const chooseCandidateDecoy')
  );
  assert.match(chooseTile, /isStubbornCellBlocked\(current\.selectedCellKey\)/);
  assert.match(chooseTile, /頑固伏字要連點三次才能拔除/);
  assert.ok(
    chooseTile.indexOf('isStubbornCellBlocked') < chooseTile.indexOf('placePuzzleTile')
  );
});

test('successful placements and effective actions notify stubborn engine only after puzzle changes', async () => {
  const source = await read('src/app/use-puzzle-game.ts');
  assert.match(source, /recordValidStubbornPlacement\(result\.session\)/);
  assert.match(source, /recordStubbornPuzzleAction\(next\)/);
  assert.match(source, /recordStubbornPuzzleAction\(result\.session\)/);
  assert.match(source, /recordStubbornPuzzleAction\(next\)/);
});

test('hint clears its stubborn target before committing the filled puzzle session', async () => {
  const source = await read('src/app/use-puzzle-game.ts');
  const hint = source.slice(
    source.indexOf('const hint'),
    source.indexOf('const clear')
  );
  assert.match(hint, /prepareStubbornHint\(result\.hintedCellKey\)/);
  assert.ok(
    hint.indexOf('prepareStubbornHint') < hint.indexOf('setSession(result.session)')
  );
});

test('stubborn handlers never call puzzle placement or selection functions', async () => {
  const source = await read('src/app/use-puzzle-game.ts');
  const start = source.indexOf('const hitStubborn');
  const end = source.indexOf('const removeSelected');
  const handlers = source.slice(start, end);
  assert.match(handlers, /hitStubbornIntruder/);
  assert.match(handlers, /finishStubbornEjection/);
  assert.equal(handlers.includes('placePuzzleTile('), false);
  assert.equal(handlers.includes('selectPuzzleCell('), false);
});
