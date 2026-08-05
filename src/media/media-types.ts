export type MediaItemType =
  | 'radio'
  | 'youtube-video'
  | 'youtube-playlist';

export type ParsedMediaSource =
  | Readonly<{
      type: 'radio';
      canonicalUrl: string;
    }>
  | Readonly<{
      type: 'youtube-video';
      canonicalUrl: string;
      youtubeVideoId: string;
    }>
  | Readonly<{
      type: 'youtube-playlist';
      canonicalUrl: string;
      youtubePlaylistId: string;
    }>;

export class MediaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MediaValidationError';
  }
}
