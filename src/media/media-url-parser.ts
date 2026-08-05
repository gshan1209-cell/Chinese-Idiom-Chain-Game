import {
  MediaValidationError,
  type MediaItemType,
  type ParsedMediaSource
} from './media-types.js';

const MAX_URL_LENGTH = 2048;
const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const PLAYLIST_ID_PATTERN = /^[A-Za-z0-9_-]{10,80}$/;
const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com'
]);

function fail(message: string): never {
  throw new MediaValidationError(message);
}

function requirePattern(
  value: string | null | undefined,
  pattern: RegExp,
  message: string
): string {
  if (value === null || value === undefined || !pattern.test(value)) {
    fail(message);
  }
  return value;
}

export function normalizeHttpsUrl(input: string): string {
  const trimmed = input.trim();
  if (trimmed.length === 0) fail('請輸入完整網址。');
  if (trimmed.length > MAX_URL_LENGTH) fail('網址長度超過限制。');
  if (trimmed.includes('<') || trimmed.includes('>')) {
    fail('請貼上網址，不要貼入 HTML 程式碼。');
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    fail('網址格式無法辨識。');
  }

  if (url.protocol !== 'https:') {
    fail('媒體來源只接受 HTTPS 網址。');
  }
  if (url.username.length > 0 || url.password.length > 0) {
    fail('網址不能包含帳號或密碼。');
  }

  url.hash = '';
  return url.toString();
}

function readVideoId(url: URL): string {
  if (url.hostname === 'youtu.be') {
    return requirePattern(
      url.pathname.split('/').filter(Boolean)[0],
      VIDEO_ID_PATTERN,
      'YouTube 影片 ID 格式不正確。'
    );
  }

  const queryId = url.searchParams.get('v');
  if (queryId !== null) {
    return requirePattern(
      queryId,
      VIDEO_ID_PATTERN,
      'YouTube 影片 ID 格式不正確。'
    );
  }

  const segments = url.pathname.split('/').filter(Boolean);
  if (segments[0] === 'shorts' || segments[0] === 'embed') {
    return requirePattern(
      segments[1],
      VIDEO_ID_PATTERN,
      'YouTube 影片 ID 格式不正確。'
    );
  }

  return fail('找不到可播放的 YouTube 影片 ID。');
}

function readPlaylistId(url: URL): string {
  return requirePattern(
    url.searchParams.get('list'),
    PLAYLIST_ID_PATTERN,
    'YouTube 播放清單 ID 格式不正確。'
  );
}

export function parseMediaSource(
  input: string,
  requestedType: MediaItemType
): ParsedMediaSource {
  const normalized = normalizeHttpsUrl(input);
  const url = new URL(normalized);

  if (requestedType === 'radio') {
    return Object.freeze({
      type: 'radio',
      canonicalUrl: normalized
    });
  }

  if (!YOUTUBE_HOSTS.has(url.hostname)) {
    fail('YouTube 來源只接受官方網域。');
  }

  if (requestedType === 'youtube-video') {
    const youtubeVideoId = readVideoId(url);
    return Object.freeze({
      type: 'youtube-video',
      canonicalUrl: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
      youtubeVideoId
    });
  }

  const youtubePlaylistId = readPlaylistId(url);
  return Object.freeze({
    type: 'youtube-playlist',
    canonicalUrl: `https://www.youtube.com/playlist?list=${youtubePlaylistId}`,
    youtubePlaylistId
  });
}
