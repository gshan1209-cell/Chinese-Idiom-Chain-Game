export type MediaItemType =
  | 'radio'
  | 'youtube-video'
  | 'youtube-playlist';

export type MediaItemOrigin = 'built-in' | 'custom';

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

export interface MediaLibraryItem {
  readonly id: string;
  readonly type: MediaItemType;
  readonly title: string;
  readonly sourceUrl: string;
  readonly canonicalUrl: string;
  readonly category: string;
  readonly origin: MediaItemOrigin;
  readonly enabled: boolean;
  readonly createdAt?: string;
  readonly homepageUrl?: string;
  readonly youtubeVideoId?: string;
  readonly youtubePlaylistId?: string;
}

export interface CreateCustomMediaItemInput {
  readonly id: string;
  readonly type: MediaItemType;
  readonly title: string;
  readonly category: string;
  readonly sourceUrl: string;
  readonly homepageUrl?: string;
}

export interface MediaPreferences {
  readonly volume: number;
  readonly muted: boolean;
  readonly dockCollapsed: boolean;
  readonly lastSelectedItemId: string | null;
}

export interface MediaState {
  readonly library: readonly MediaLibraryItem[];
  readonly favoriteIds: readonly string[];
  readonly preferences: MediaPreferences;
}

export interface MediaBackupInput {
  readonly state: MediaState;
  readonly exportedAt: string;
}

export interface MediaImportSummary {
  readonly added: number;
  readonly skipped: number;
  readonly failed: number;
}

export interface MediaImportResult {
  readonly state: MediaState;
  readonly summary: MediaImportSummary;
}

export class MediaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MediaValidationError';
  }
}
