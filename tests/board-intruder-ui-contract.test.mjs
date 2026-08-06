import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

async function read(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('level map renders the level-ten board trap without exposing stubborn mode', async () => {
  const source = await read('src/app/LevelMap.tsx');
  assert.match(source, /isPuzzlePlayModeUnlocked\(progress, 'trap-board'\)/);
  assert.match(source, /getPuzzlePlayModeLockReason\(progress, 'trap-board'\)/);
  assert.match(source, /chooseMode\('trap-board'\)/);
  assert.match(source, />盤面伏字</);
  assert.equal(source.includes("chooseMode('trap-stubborn')"), false);
  assert.equal(source.includes('>頑固伏字<'), false);
});

test('puzzle board renders one overlay slot per real cell and maps intruders by target', async () => {
  const source = await read('src/app/PuzzleGame.tsx');
  assert.match(source, /BoardIntruder/);
  assert.match(source, /boardIntruderByCell/);
  assert.match(source, /targetCellKey/);
  assert.match(source, /puzzle-cell-slot/);
  assert.match(source, /game\.boardIntruders/);
  assert.match(source, /game\.chooseBoardIntruder/);
  assert.match(source, /game\.finishBoardIntruderReveal/);
  assert.match(source, /game\.finishBoardIntruderEjection/);
});

test('board intruder overlay stops events and waits for animation completion', async () => {
  const source = await read('src/app/BoardIntruder.tsx');
  assert.match(source, /<button/);
  assert.match(source, /type="button"/);
  assert.match(source, /event\.stopPropagation\(\)/);
  assert.match(source, /status === 'active' \|\| intruder\.status === 'revealing'/);
  assert.match(source, /onRevealComplete/);
  assert.match(source, /onEjectionComplete/);
  assert.match(source, /onAnimationEnd/);
  assert.match(source, /怪字 \$\{intruder\.character\}，按下可拔除/);
  assert.equal(source.includes('selectCell('), false);
});

test('puzzle badge names all defensive mode values', async () => {
  const source = await read('src/app/PuzzleGame.tsx');
  assert.match(source, /standard.*標準模式/s);
  assert.match(source, /trap-candidates.*候選偽字模式/s);
  assert.match(source, /trap-board.*盤面伏字模式/s);
  assert.match(source, /trap-stubborn.*頑固伏字模式/s);
});

test('board intruder styles provide a large target and reduced-motion alternative', async () => {
  const css = await read('src/app/PuzzleGame.css');
  assert.match(css, /\.puzzle-cell-slot/);
  assert.match(css, /\.board-intruder/);
  assert.match(css, /min-width:\s*44px/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /\.board-intruder\.revealing/);
  assert.match(css, /\.board-intruder\.ejecting/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  const reducedMotion = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
  assert.match(reducedMotion, /board-intruder/);
  assert.match(reducedMotion, /transform:\s*none/);
});

test('mobile mode cards collapse to one column', async () => {
  const css = await read('src/app/LevelMap.css');
  const mobile = css.slice(css.indexOf('@media (max-width: 36rem)'));
  assert.match(mobile, /\.play-mode-grid/);
  assert.match(mobile, /grid-template-columns:\s*1fr/);
});

test('trap feedback is shared by candidate and board intruders', async () => {
  const feedback = await read('src/app/trap-feedback.ts');
  const puzzle = await read('src/app/PuzzleGame.tsx');
  assert.match(feedback, /playTrapEjectFeedback/);
  assert.match(puzzle, /playTrapEjectFeedback/);
});
