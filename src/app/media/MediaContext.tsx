import { createContext, useContext } from 'react';

import type {
  CreateCustomMediaItemInput,
  MediaImportSummary,
  MediaLibraryItem,
  MediaState
} from '../../media/media-types';
import type { MediaPlaybackState } from '../../media/media-playback-policy';

export interface MediaController {
  readonly state: MediaState;
  readonly playback: MediaPlaybackState;
  readonly activeItem: MediaLibraryItem | null;
  readonly panelOpen: boolean;
  readonly isOnline: boolean;
  readonly hydrated: boolean;
  readonly notice: string | null;
  openPanel(): void;
  closePanel(): void;
  clearNotice(): void;
  addCustomItem(input: CreateCustomMediaItemInput): MediaLibraryItem;
  removeItem(itemId: string): void;
  toggleFavorite(itemId: string): void;
  moveCustomItem(itemId: string, direction: -1 | 1): void;
  playItem(itemId: string): Promise<void>;
  playPrevious(): Promise<void>;
  playNext(): Promise<void>;
  pauseAll(): void;
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  setDockCollapsed(collapsed: boolean): void;
  exportBackup(): void;
  importBackup(json: string): MediaImportSummary;
}

export const MediaContext = createContext<MediaController | null>(null);

export function useMedia(): MediaController {
  const value = useContext(MediaContext);
  if (value === null) {
    throw new Error('useMedia 必須在 MediaProvider 內使用。');
  }
  return value;
}
