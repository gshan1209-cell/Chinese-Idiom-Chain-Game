import { useState } from 'react';

import type { CampaignProgress } from '../domain/progress';
import { PUZZLE_LEVELS } from '../puzzle/levels';
import {
  getContinueLevelNumber,
  getTotalStars,
  isLevelUnlocked
} from '../progress/progress-engine';
import './LevelMap.css';

export interface LevelMapProps {
  readonly progress: CampaignProgress;
  readonly loading: boolean;
  readonly storageWarning: string | null;
  readonly onOpenLevel: (levelNumber: number) => void;
  readonly onReset: () => void;
  readonly onExit: () => void;
}

const difficultyLabels = {
  easy: '入門',
  normal: '進階',
  hard: '挑戰'
} as const;

function starText(stars: number): string {
  return `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`;
}

export function LevelMap({
  progress,
  loading,
  storageWarning,
  onOpenLevel,
  onReset,
  onExit
}: LevelMapProps) {
  const [message, setMessage] = useState('選擇已解鎖的關卡，或繼續上次進度。');
  const continueLevel = getContinueLevelNumber(progress, PUZZLE_LEVELS.length);
  const totalStars = getTotalStars(progress);

  const openLevel = (levelNumber: number) => {
    if (!isLevelUnlocked(progress, levelNumber)) {
      setMessage(`第 ${levelNumber} 關尚未解鎖，請先完成前一關。`);
      return;
    }
    setMessage(`正在開啟第 ${levelNumber} 關。`);
    onOpenLevel(levelNumber);
  };

  return (
    <main className="app-shell level-map-shell">
      <header className="level-map-header">
        <button className="text-action" type="button" onClick={onExit}>返回首頁</button>
        <div>
          <p className="eyebrow">第一章 · 成語之路</p>
          <h1 className="level-map-title">闖關地圖</h1>
        </div>
        <button className="text-action" type="button" onClick={onReset}>重設進度</button>
      </header>

      {storageWarning === null ? null : (
        <p className="storage-warning" role="status">⚠ {storageWarning}</p>
      )}

      <section className="chapter-summary" aria-label="第一章進度">
        <div><span>已解鎖</span><strong>{progress.highestUnlockedLevel}/20</strong></div>
        <div><span>總星數</span><strong>{totalStars}/60</strong></div>
        <div><span>上次關卡</span><strong>第 {continueLevel} 關</strong></div>
      </section>

      <button
        className="primary-action continue-action"
        type="button"
        disabled={loading}
        onClick={() => openLevel(continueLevel)}
      >
        {loading ? '讀取進度中…' : `繼續闖關：第 ${continueLevel} 關`}
      </button>

      <p className="level-map-message" aria-live="polite">{message}</p>

      <section className="level-grid" aria-label="第一章二十關">
        {PUZZLE_LEVELS.map((level) => {
          const unlocked = isLevelUnlocked(progress, level.levelNumber);
          const record = progress.levelProgressById[level.id];
          const stars = record?.stars ?? 0;
          return (
            <button
              className={`level-card ${unlocked ? 'unlocked' : 'locked'} ${record === undefined ? '' : 'completed'}`}
              type="button"
              key={level.id}
              aria-disabled={!unlocked}
              aria-label={`第 ${level.levelNumber} 關，${level.title}，${unlocked ? `已解鎖，${stars} 星` : '尚未解鎖'}`}
              onClick={() => openLevel(level.levelNumber)}
            >
              <span className="level-number">{unlocked ? level.levelNumber : '🔒'}</span>
              <strong>{level.title}</strong>
              <span className="level-difficulty">{difficultyLabels[level.difficulty]}</span>
              <span className="level-stars" aria-hidden="true">{starText(stars)}</span>
              {record === undefined ? null : (
                <small>最高 {record.bestScore} 分</small>
              )}
            </button>
          );
        })}
      </section>
    </main>
  );
}
