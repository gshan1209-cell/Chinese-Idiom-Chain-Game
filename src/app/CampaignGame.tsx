import { useState } from 'react';

import type { LevelCompletionResult } from '../domain/progress';
import { PUZZLE_LEVELS } from '../puzzle/levels';
import { LevelMap } from './LevelMap';
import { PuzzleGame } from './PuzzleGame';
import { useCampaignProgress } from './use-campaign-progress';

export interface CampaignGameProps {
  readonly onExit: () => void;
}

type CampaignScreen = 'map' | 'play';

export function CampaignGame({ onExit }: CampaignGameProps) {
  const campaign = useCampaignProgress();
  const [screen, setScreen] = useState<CampaignScreen>('map');
  const [activeLevelNumber, setActiveLevelNumber] = useState(1);

  const openLevel = (levelNumber: number) => {
    if (campaign.loading) return;
    campaign.startLevel(levelNumber);
    setActiveLevelNumber(levelNumber);
    setScreen('play');
  };

  const completeLevel = (result: LevelCompletionResult) => {
    campaign.completeLevel(result);
  };

  const resetProgress = () => {
    if (!globalThis.confirm('確定要清除第一章全部星級與解鎖進度嗎？')) return;
    campaign.clearProgress();
    setActiveLevelNumber(1);
    setScreen('map');
  };

  if (screen === 'play') {
    const level = PUZZLE_LEVELS[activeLevelNumber - 1];
    if (level === undefined) throw new Error('找不到目前闖關關卡。');
    return (
      <PuzzleGame
        key={activeLevelNumber}
        initialLevelNumber={activeLevelNumber}
        bestStars={campaign.progress.levelProgressById[level.id]?.stars ?? 0}
        onExitToMap={() => setScreen('map')}
        onLevelCompleted={completeLevel}
        onOpenNextLevel={openLevel}
      />
    );
  }

  return (
    <LevelMap
      progress={campaign.progress}
      loading={campaign.loading}
      storageWarning={campaign.storageWarning}
      onOpenLevel={openLevel}
      onReset={resetProgress}
      onExit={onExit}
    />
  );
}
