import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath, URL } from 'node:url';

function pathFor(relativePath) {
  return fileURLToPath(new URL(`../${relativePath}`, import.meta.url));
}

function readSource(relativePath) {
  const path = pathFor(relativePath);
  assert.ok(existsSync(path), `${relativePath} must exist`);
  return readFileSync(path, 'utf8');
}

test('mounts one MediaProvider above all app modes and exposes the media entry', () => {
  const source = readSource('src/app/App.tsx');
  assert.match(source, /import \{ MediaProvider \} from '\.\/media\/MediaProvider';/);
  assert.equal((source.match(/<MediaProvider\b/g) ?? []).length, 1);
  assert.match(source, /<MediaProvider bonusActive=\{game\.bonus\.view === 'playing'\}>/);
  assert.match(source, /<AppContent\b/);
  assert.match(source, />成語電台／影音</);
});

test('keeps whack-a-mole controller free from direct media control', () => {
  const source = readSource('src/app/use-whack-a-mole.ts');
  assert.doesNotMatch(source, /HTMLAudioElement|new Audio\(|<iframe|\.volume\s*=/);
});

test('uses a visible official YouTube iframe with required attributes', () => {
  const source = readSource('src/app/media/YouTubePlayer.tsx');
  assert.match(source, /<iframe/);
  assert.match(source, /title=/);
  assert.match(source, /allow=/);
  assert.match(source, /referrerPolicy="strict-origin-when-cross-origin"/);
  assert.match(source, /allowFullScreen/);
  assert.match(source, /loading="lazy"/);
  assert.match(source, /youtube\.com\/embed/);
  assert.doesNotMatch(source, /display:\s*none|hidden=\{true\}/);
});

test('unmounts the YouTube iframe whenever playback is paused', () => {
  const source = readSource('src/app/media/MediaLibraryPanel.tsx');
  assert.match(
    source,
    /media\.playback\.youtubePlaying\s*&&\s*media\.activeItem !== null/
  );
});

test('reserves a visible 16:9 player and mobile safe-area space', () => {
  const css = readSource('src/app/media/media.css');
  assert.match(css, /min-width:\s*200px/);
  assert.match(css, /min-height:\s*200px/);
  assert.match(css, /aspect-ratio:\s*16\s*\/\s*9/);
  assert.match(css, /env\(safe-area-inset-bottom/);
});

test('provider owns one audio element and IndexedDB fallback behavior', () => {
  const source = readSource('src/app/media/MediaProvider.tsx');
  assert.match(source, /new Audio\(\)/);
  assert.match(source, /createIndexedDbMediaRepository/);
  assert.match(source, /createMemoryMediaRepository/);
  assert.match(source, /BONUS_STARTED/);
  assert.match(source, /BONUS_ENDED/);
});
