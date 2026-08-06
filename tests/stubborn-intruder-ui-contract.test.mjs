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
  assert.match(source, /recordValidStubbornPlacement\(result\.session,/);
  assert.match(source, /recordStubbornPuzzleAction\(next,/);
  assert.match(source, /recordStubbornPuzzleAction\(result\.session,/);
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

test('level map exposes stubborn mode with level fifteen unlock messaging', async () => {
  const source = await read('src/app/LevelMap.tsx');
  assert.match(source, /isPuzzlePlayModeUnlocked\(progress, 'trap-stubborn'\)/);
  assert.match(source, /getPuzzlePlayModeLockReason\(progress, 'trap-stubborn'\)/);
  assert.match(source, /chooseMode\('trap-stubborn'\)/);
  assert.match(source, /頑固伏字/);
  assert.match(source, /連點三次拔除/);
});

test('stubborn intruder uses pointer timing, accessible progress and animation completion', async () => {
  const source = await read('src/app/StubbornIntruder.tsx');
  assert.match(source, /onPointerDown/);
  assert.match(source, /event\.stopPropagation\(\)/);
  assert.match(source, /event\.preventDefault\(\)/);
  assert.match(source, /performance\.now\(\)/);
  assert.match(source, /已拔除.*\/3/);
  assert.match(source, /onAnimationEnd/);
  assert.match(source, /currentHitStreak/);
});

test('puzzle board renders stubborn overlays in their real cell slots', async () => {
  const source = await read('src/app/PuzzleGame.tsx');
  assert.match(source, /import \{ StubbornIntruder \}/);
  assert.match(source, /stubbornIntruderByCell/);
  assert.match(source, /game\.stubbornIntruders/);
  assert.match(source, /game\.hitStubborn/);
  assert.match(source, /game\.finishStubbornEjection/);
});

test('stubborn styling guarantees touch size, hit stages and reduced motion', async () => {
  const source = await read('src/app/PuzzleGame.css');
  assert.match(source, /\.stubborn-intruder/);
  assert.match(source, /min-width:\s*44px/);
  assert.match(source, /min-height:\s*44px/);
  assert.match(source, /\.hit-1/);
  assert.match(source, /\.hit-2/);
  assert.match(source, /\.stubborn-intruder\.ejecting/);
  const reduced = source.slice(source.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(reduced, /\.stubborn-intruder/);
  assert.match(reduced, /transform:\s*none/);
});

test('stubborn feedback remains best effort inside player gestures', async () => {
  const source = await read('src/app/trap-feedback.ts');
  assert.match(source, /playStubbornHitFeedback/);
  assert.match(source, /navigator\.vibrate/);
  assert.match(source, /try \{/);
  assert.match(source, /catch \{/);
});
