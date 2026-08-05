import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isSoundEnabled,
  playButtonClick,
  playCorrect,
  playHint,
  playLevelComplete,
  playMoleHit,
  playTileClick,
  playWrong,
  setSoundEnabled,
  toggleSound
} from '../.test-dist/src/sound/sound-effects.js';

test('isSoundEnabled defaults to true and can be toggled', () => {
  setSoundEnabled(true);
  assert.equal(isSoundEnabled(), true);

  const toggled = toggleSound();
  assert.equal(toggled, false);
  assert.equal(isSoundEnabled(), false);

  setSoundEnabled(true);
  assert.equal(isSoundEnabled(), true);
});

test('sound functions do not throw in node test environment without audio context', () => {
  setSoundEnabled(true);
  assert.doesNotThrow(() => {
    playTileClick();
    playCorrect();
    playWrong();
    playLevelComplete();
    playMoleHit();
    playHint();
    playButtonClick();
  });
});
