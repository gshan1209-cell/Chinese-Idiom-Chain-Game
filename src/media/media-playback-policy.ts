export type ActiveMediaSource = 'radio' | 'youtube' | null;

export interface InitialPlaybackPreferences {
  readonly volume: number;
  readonly muted: boolean;
}

export interface MediaPlaybackState {
  readonly activeSource: ActiveMediaSource;
  readonly activeItemId: string | null;
  readonly radioPlaying: boolean;
  readonly youtubePlaying: boolean;
  readonly baseVolume: number;
  readonly effectiveVolume: number;
  readonly muted: boolean;
  readonly bonusActive: boolean;
}

export type MediaPlaybackAction =
  | Readonly<{ type: 'PLAY_RADIO'; itemId: string }>
  | Readonly<{ type: 'PLAY_YOUTUBE'; itemId: string }>
  | Readonly<{ type: 'PAUSE_ALL' }>
  | Readonly<{ type: 'SET_SELECTED_ITEM'; itemId: string | null }>
  | Readonly<{ type: 'SET_BASE_VOLUME'; volume: number }>
  | Readonly<{ type: 'SET_MUTED'; muted: boolean }>
  | Readonly<{ type: 'BONUS_STARTED' }>
  | Readonly<{ type: 'BONUS_ENDED' }>;

function clampVolume(volume: number): number {
  if (!Number.isFinite(volume)) return 0;
  return Math.min(1, Math.max(0, volume));
}

function effectiveVolume(
  baseVolume: number,
  muted: boolean,
  bonusActive: boolean
): number {
  if (muted) return 0;
  return baseVolume * (bonusActive ? 0.3 : 1);
}

function freezeState(
  input: Omit<MediaPlaybackState, 'effectiveVolume'>
): MediaPlaybackState {
  return Object.freeze({
    ...input,
    effectiveVolume: effectiveVolume(
      input.baseVolume,
      input.muted,
      input.bonusActive
    )
  });
}

export function createInitialPlaybackState(
  preferences: InitialPlaybackPreferences
): MediaPlaybackState {
  return freezeState({
    activeSource: null,
    activeItemId: null,
    radioPlaying: false,
    youtubePlaying: false,
    baseVolume: clampVolume(preferences.volume),
    muted: preferences.muted,
    bonusActive: false
  });
}

export function reducePlaybackState(
  state: MediaPlaybackState,
  action: MediaPlaybackAction
): MediaPlaybackState {
  switch (action.type) {
    case 'PLAY_RADIO':
      return freezeState({
        ...state,
        activeSource: 'radio',
        activeItemId: action.itemId,
        radioPlaying: true,
        youtubePlaying: false
      });
    case 'PLAY_YOUTUBE':
      return freezeState({
        ...state,
        activeSource: 'youtube',
        activeItemId: action.itemId,
        radioPlaying: false,
        youtubePlaying: true
      });
    case 'PAUSE_ALL':
      return freezeState({
        ...state,
        activeSource: null,
        radioPlaying: false,
        youtubePlaying: false
      });
    case 'SET_SELECTED_ITEM':
      return freezeState({
        ...state,
        activeSource: null,
        activeItemId: action.itemId,
        radioPlaying: false,
        youtubePlaying: false
      });
    case 'SET_BASE_VOLUME':
      return freezeState({
        ...state,
        baseVolume: clampVolume(action.volume)
      });
    case 'SET_MUTED':
      return freezeState({ ...state, muted: action.muted });
    case 'BONUS_STARTED':
      return freezeState({ ...state, bonusActive: true });
    case 'BONUS_ENDED':
      return freezeState({ ...state, bonusActive: false });
  }
}
