import { useCallback, useState } from 'react';
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
} from '../sound/sound-effects.js';

export function useSoundEffects() {
  const [enabled, setEnabledState] = useState<boolean>(() => isSoundEnabled());

  const handleToggle = useCallback(() => {
    const newState = toggleSound();
    setEnabledState(newState);
    if (newState) {
      playButtonClick();
    }
  }, []);

  const handleSetEnabled = useCallback((value: boolean) => {
    setSoundEnabled(value);
    setEnabledState(value);
  }, []);

  return {
    isSoundEnabled: enabled,
    toggleSound: handleToggle,
    setSoundEnabled: handleSetEnabled,
    playTileClick,
    playCorrect,
    playWrong,
    playLevelComplete,
    playMoleHit,
    playHint,
    playButtonClick
  };
}
