import { useEffect, useState } from 'react';

import type { LevelCompletionResult } from '../domain/progress';
import type { IdiomIndex } from '../idioms/idiom-index';
import { loadDictionary } from '../idioms/load-dictionary';
import { PUZZLE_LEVELS } from '../puzzle/levels';
import { BonusResult } from './bonus/BonusResult';
import { RewardSelector } from './bonus/RewardSelector';
import { WhackAMoleBoard } from './bonus/WhackAMoleBoard';
import { LevelMap } from './LevelMap';
import { PuzzleGame } from './PuzzleGame';
import { useCampaignProgress } from './use-campaign-progress';
import { useWhackAMole } from './use-whack-a-mole';

export interface CampaignGameProps {
  readonly onExit: () => void;
}

type CampaignScreen = 'map' | 'play';

export function CampaignGame({ onExit }: CampaignGameProps) {
  const campaign = useCampaignProgress();
  const [screen, setScreen] = useState<CampaignScreen>('map');
  const [activeLevelNumber, setActiveLevelNumber] = useState(1);
  const [index, setIndex] = useState<IdiomIndex | null>(null);

  useEffect(() => {
    loadDictionary()
      .then((res) => setIndex(res.index))
      .catch(() => {
        // Fallback or ignore dictionary load error
      });
  }, []);

  const bonus = useWhackAMole({
    session: null,
    index,
    setSession: () => {},
    ignoreEnergy: true
  });

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

  if (bonus.view === 'selecting') {
    return (
      <RewardSelector
        rewards={bonus.availableRewards}
        unavailableReason={bonus.unavailableReason}
        onSelect={(reward) => bonus.startRound(reward)}
        onCancel={() => bonus.cancelSelection()}
      />
    );
  }

  if (bonus.view === 'playing' && bonus.round !== null) {
    return (
      <WhackAMoleBoard
        round={bonus.round}
        onHit={(questionId, holeIndex) => bonus.hitHole(questionId, holeIndex)}
      />
    );
  }

  if (bonus.view === 'result' && bonus.round !== null && bonus.settlement !== null) {
    return (
      <BonusResult
        round={bonus.round}
        settlement={bonus.settlement}
        onClose={() => bonus.closeResult()}
      />
    );
  }

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
      onOpenWhackAMole={() => bonus.openRewardSelector()}
      onReset={resetProgress}
      onExit={onExit}
    />
  );
}
