import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeHttpsUrl,
  parseMediaSource
} from '../.test-dist/src/media/media-url-parser.js';

test('normalizes an HTTPS radio URL while retaining path and query', () => {
  assert.equal(
    normalizeHttpsUrl('  https://RADIO.example/live.mp3?token=abc#player  '),
    'https://radio.example/live.mp3?token=abc'
  );
});

test('parses YouTube short links into a canonical video URL', () => {
  assert.deepEqual(
    parseMediaSource('https://youtu.be/dQw4w9WgXcQ?t=4', 'youtube-video'),
    {
      type: 'youtube-video',
      canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      youtubeVideoId: 'dQw4w9WgXcQ'
    }
  );
});

test('parses YouTube playlist URLs into a canonical playlist URL', () => {
  assert.deepEqual(
    parseMediaSource(
      'https://www.youtube.com/playlist?list=PL1234567890_abc',
      'youtube-playlist'
    ),
    {
      type: 'youtube-playlist',
      canonicalUrl: 'https://www.youtube.com/playlist?list=PL1234567890_abc',
      youtubePlaylistId: 'PL1234567890_abc'
    }
  );
});

test('uses the requested YouTube type when a URL contains video and playlist IDs', () => {
  const input = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL1234567890_abc';
  assert.equal(parseMediaSource(input, 'youtube-video').type, 'youtube-video');
  assert.equal(parseMediaSource(input, 'youtube-playlist').type, 'youtube-playlist');
});

test('parses shorts and embed URLs from official YouTube hosts', () => {
  assert.equal(
    parseMediaSource(
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      'youtube-video'
    ).youtubeVideoId,
    'dQw4w9WgXcQ'
  );
  assert.equal(
    parseMediaSource(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
      'youtube-video'
    ).youtubeVideoId,
    'dQw4w9WgXcQ'
  );
});

test('rejects non-HTTPS, dangerous schemes and embedded HTML', () => {
  assert.throws(() => parseMediaSource('http://radio.example/live', 'radio'));
  assert.throws(() => parseMediaSource('javascript:alert(1)', 'radio'));
  assert.throws(() => parseMediaSource('data:text/plain,hello', 'radio'));
  assert.throws(() => parseMediaSource('file:///tmp/audio.mp3', 'radio'));
  assert.throws(() => parseMediaSource('blob:https://example.com/id', 'radio'));
  assert.throws(() =>
    parseMediaSource(
      '<iframe src="https://youtube.com/embed/dQw4w9WgXcQ"></iframe>',
      'youtube-video'
    )
  );
});

test('rejects credentials, oversized input and non-official YouTube hosts', () => {
  assert.throws(() =>
    parseMediaSource('https://user:pass@example.com/live', 'radio')
  );
  assert.throws(() => parseMediaSource(`https://example.com/${'a'.repeat(2050)}`, 'radio'));
  assert.throws(() =>
    parseMediaSource(
      'https://example.com/watch?v=dQw4w9WgXcQ',
      'youtube-video'
    )
  );
});

test('rejects malformed YouTube IDs', () => {
  assert.throws(() =>
    parseMediaSource('https://youtu.be/not-valid', 'youtube-video')
  );
  assert.throws(() =>
    parseMediaSource(
      'https://www.youtube.com/playlist?list=short',
      'youtube-playlist'
    )
  );
});

test('parses radio sources without YouTube-specific fields', () => {
  assert.deepEqual(
    parseMediaSource('https://radio.example/live.mp3#player', 'radio'),
    {
      type: 'radio',
      canonicalUrl: 'https://radio.example/live.mp3'
    }
  );
});
