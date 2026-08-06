import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('candidate decoys remain outside PuzzleSession and puzzle engine', async () => {
  const domainPuzzle = await read('src/domain/puzzle.ts');
  const puzzleEngine = await read('src/puzzle/puzzle-engine.ts');
  assert.equal(domainPuzzle.includes('CandidateDecoy'), false);
  assert.equal(puzzleEngine.includes('candidate-decoy'), false);
});

test('candidate decoy hook owns the independent trap session', async () => {
  const hook = await read('src/app/use-candidate-decoys.ts');
  assert.match(hook, /createCandidateDecoySession/);
  assert.match(hook, /recordValidCandidatePlacement/);
  assert.match(hook, /getVisibleCandidateDecoys/);
});

test('only a changed puzzle session records a valid trap placement', async () => {
  const hook = await read('src/app/use-puzzle-game.ts');
  assert.match(hook, /result\.session !== current/);
  assert.match(hook, /recordValidPlacement\(\)/);
});

test('decoy clicks never call puzzle placement or selection functions', async () => {
  const hook = await read('src/app/use-puzzle-game.ts');
  const start = hook.indexOf('const chooseCandidateDecoy');
  const end = hook.indexOf('const finishCandidateDecoyEjection', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const handler = hook.slice(start, end);
  assert.equal(handler.includes('placePuzzleTile('), false);
  assert.equal(handler.includes('selectPuzzleCell('), false);
  assert.match(handler, /beginEjection\(id\)/);
});

test('campaign defaults to standard and passes the selected mode to map and puzzle', async () => {
  const source = await read('src/app/CampaignGame.tsx');
  assert.match(source, /useState<PuzzlePlayMode>\('standard'\)/);
  assert.match(source, /selectedPlayMode=\{playMode\}/);
  assert.match(source, /playMode=\{playMode\}/);
});

test('level map only exposes standard and candidate modes with unlock protection', async () => {
  const source = await read('src/app/LevelMap.tsx');
  assert.match(source, /isPuzzlePlayModeUnlocked/);
  assert.match(source, />標準模式</);
  assert.match(source, />候選偽字</);
  assert.equal(source.includes('盤面伏字'), false);
  assert.equal(source.includes('頑固伏字'), false);
});

test('candidate tile completes removal only after animation end', async () => {
  const source = await read('src/app/CandidateDecoyTile.tsx');
  assert.match(source, /onAnimationEnd/);
  assert.match(source, /onEjectionComplete/);
});

test('reduced motion has a non-moving candidate decoy treatment', async () => {
  const css = await read('src/app/PuzzleGame.css');
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /candidate-decoy/);
});
