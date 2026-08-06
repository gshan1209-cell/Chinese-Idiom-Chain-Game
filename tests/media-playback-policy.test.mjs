import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createInitialPlaybackState,
  reducePlaybackState
} from '../.test-dist/src/media/media-playback-policy.js';

test('radio and YouTube playback are mutually exclusive', () => {
  let state = createInitialPlaybackState({ volume: 0.8, muted: false });
  state = reducePlaybackState(state, { type: 'PLAY_RADIO', itemId: 'r1' });
  assert.equal(state.activeSource, 'radio');
  assert.equal(state.radioPlaying, true);
  assert.equal(state.youtubePlaying, false);

  state = reducePlaybackState(state, { type: 'PLAY_YOUTUBE', itemId: 'y1' });
  assert.equal(state.activeSource, 'youtube');
  assert.equal(state.radioPlaying, false);
  assert.equal(state.youtubePlaying, true);
  assert.equal(state.activeItemId, 'y1');
});

test('bonus rounds duck the latest base volume and restore it afterward', () => {
  let state = createInitialPlaybackState({ volume: 0.8, muted: false });
  state = reducePlaybackState(state, { type: 'PLAY_RADIO', itemId: 'r1' });
  state = reducePlaybackState(state, { type: 'BONUS_STARTED' });
  assert.equal(state.effectiveVolume, 0.24);

  state = reducePlaybackState(state, {
    type: 'SET_BASE_VOLUME',
    volume: 0.5
  });
  assert.equal(state.baseVolume, 0.5);
  assert.equal(state.effectiveVolume, 0.15);

  state = reducePlaybackState(state, { type: 'BONUS_ENDED' });
  assert.equal(state.effectiveVolume, 0.5);
});

test('repeated bonus start and end actions are idempotent', () => {
  let state = createInitialPlaybackState({ volume: 0.7, muted: false });
  state = reducePlaybackState(state, { type: 'BONUS_STARTED' });
  const started = state;
  state = reducePlaybackState(state, { type: 'BONUS_STARTED' });
  assert.deepEqual(state, started);

  state = reducePlaybackState(state, { type: 'BONUS_ENDED' });
  const ended = state;
  state = reducePlaybackState(state, { type: 'BONUS_ENDED' });
  assert.deepEqual(state, ended);
});

test('mute overrides ducking and volume is clamped to zero through one', () => {
  let state = createInitialPlaybackState({ volume: 2, muted: false });
  assert.equal(state.baseVolume, 1);
  state = reducePlaybackState(state, { type: 'BONUS_STARTED' });
  state = reducePlaybackState(state, { type: 'SET_MUTED', muted: true });
  assert.equal(state.effectiveVolume, 0);

  state = reducePlaybackState(state, {
    type: 'SET_BASE_VOLUME',
    volume: -2
  });
  assert.equal(state.baseVolume, 0);
  assert.equal(state.effectiveVolume, 0);
});

test('pause stops playback but keeps the selected item available to resume', () => {
  let state = createInitialPlaybackState({ volume: 0.6, muted: true });
  state = reducePlaybackState(state, { type: 'PLAY_YOUTUBE', itemId: 'y1' });
  state = reducePlaybackState(state, { type: 'PAUSE_ALL' });

  assert.equal(state.activeSource, null);
  assert.equal(state.activeItemId, 'y1');
  assert.equal(state.radioPlaying, false);
  assert.equal(state.youtubePlaying, false);
  assert.equal(state.baseVolume, 0.6);
  assert.equal(state.muted, true);
});

test('YouTube is represented only as visible player state, not hidden audio', () => {
  const state = reducePlaybackState(
    createInitialPlaybackState({ volume: 0.5, muted: false }),
    { type: 'PLAY_YOUTUBE', itemId: 'y1' }
  );

  assert.equal(state.activeSource, 'youtube');
  assert.equal('youtubeAudioOnly' in state, false);
  assert.ok(Object.isFrozen(state));
});
