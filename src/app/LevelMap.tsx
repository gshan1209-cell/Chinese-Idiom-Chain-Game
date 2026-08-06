import { useState } from 'react';

import type { CampaignProgress } from '../domain/progress';
import type { PuzzlePlayMode } from '../domain/trap';
import { PUZZLE_LEVELS } from '../puzzle/levels';
import {
  getContinueLevelNumber,
  getTotalStars,
  isLevelUnlocked
} from '../progress/progress-engine';
import {
  getPuzzlePlayModeLockReason,
  isPuzzlePlayModeUnlocked
} from '../traps/trap-unlocks';
import './LevelMap.css';

export interface LevelMapProps {
  readonly progress: CampaignProgress;
  readonly loading: boolean;
  readonly storageWarning: string | null;
  readonly selectedPlayMode: PuzzlePlayMode;
  readonly onPlayModeChange: (mode: PuzzlePlayMode) => void;
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

function modeMessage(mode: PuzzlePlayMode): string {
  if (mode === 'standard') return '已選擇標準模式，不會出現陷阱。';
  if (mode === 'trap-candidates') {
    return '已選擇候選偽字，留意混入字牌中的多餘文字。';
  }
  if (mode === 'trap-board') {
    return '已選擇盤面伏字，候選區與空格都可能出現怪字。';
  }
  return '此模式尚未開放。';
}

export function LevelMap({
  progress,
  loading,
  storageWarning,
  selectedPlayMode,
  onPlayModeChange,
  onOpenLevel,
  onReset,
  onExit
}: LevelMapProps) {
  const [message, setMessage] = useState('選擇已解鎖的關卡，或繼續上次進度。');
  const continueLevel = getContinueLevelNumber(progress, PUZZLE_LEVELS.length);
  const totalStars = getTotalStars(progress);
  const candidateModeUnlocked = isPuzzlePlayModeUnlocked(progress, 'trap-candidates');
  const candidateLockReason = getPuzzlePlayModeLockReason(progress, 'trap-candidates');
  const boardModeUnlocked = isPuzzlePlayModeUnlocked(progress, 'trap-board');
  const boardLockReason = getPuzzlePlayModeLockReason(progress, 'trap-board');

  const chooseMode = (mode: PuzzlePlayMode) => {
    if (!isPuzzlePlayModeUnlocked(progress, mode)) {
      setMessage(getPuzzlePlayModeLockReason(progress, mode) ?? '此模式尚未解鎖。');
      return;
    }
    onPlayModeChange(mode);
    setMessage(modeMessage(mode));
  };

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

      <section className="play-mode-panel" aria-labelledby="play-mode-title">
        <div>
          <p className="eyebrow">本次遊玩</p>
          <h2 id="play-mode-title">選擇闖關模式</h2>
        </div>
        <div className="play-mode-grid">
          <button
            className={`play-mode-card ${selectedPlayMode === 'standard' ? 'selected' : ''}`}
            type="button"
            aria-pressed={selectedPlayMode === 'standard'}
            onClick={() => chooseMode('standard')}
          >
            <strong>標準模式</strong>
            <span>推薦預設 · 純成語填字</span>
          </button>
          <button
            className={`play-mode-card trap-mode ${selectedPlayMode === 'trap-candidates' ? 'selected' : ''}`}
            type="button"
            disabled={!candidateModeUnlocked}
            aria-pressed={selectedPlayMode === 'trap-candidates'}
            onClick={() => chooseMode('trap-candidates')}
          >
            <strong>候選偽字</strong>
            <span>{candidateModeUnlocked
              ? '字牌會逐步混入可踢出的偽字'
              : candidateLockReason}</span>
          </button>
          <button
            className={`play-mode-card trap-mode board-trap-mode ${selectedPlayMode === 'trap-board' ? 'selected' : ''}`}
            type="button"
            disabled={!boardModeUnlocked}
            aria-pressed={selectedPlayMode === 'trap-board'}
            onClick={() => chooseMode('trap-board')}
          >
            <strong>盤面伏字</strong>
            <span>{boardModeUnlocked
              ? '候選區與空格會逐步出現可拔除怪字'
              : boardLockReason}</span>
          </button>
        </div>
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
