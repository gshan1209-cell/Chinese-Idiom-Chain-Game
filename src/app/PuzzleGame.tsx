import { useEffect, useRef } from 'react';

import type { LevelCompletionResult } from '../domain/progress';
import { cellKey } from '../domain/puzzle';
import type { PuzzlePlayMode } from '../domain/trap';
import { calculateStars } from '../progress/progress-engine';
import { CandidateDecoyTile } from './CandidateDecoyTile';
import { playCandidateDecoyEjectFeedback } from './trap-feedback';
import { usePuzzleGame } from './use-puzzle-game';
import './PuzzleGame.css';

export interface PuzzleGameProps {
  readonly initialLevelNumber: number;
  readonly playMode: PuzzlePlayMode;
  readonly bestStars: number;
  readonly onExitToMap: () => void;
  readonly onLevelCompleted: (result: LevelCompletionResult) => void;
  readonly onOpenNextLevel: (levelNumber: number) => void;
}

function starText(stars: number): string {
  return `${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`;
}

export function PuzzleGame({
  initialLevelNumber,
  playMode,
  bestStars,
  onExitToMap,
  onLevelCompleted,
  onOpenNextLevel
}: PuzzleGameProps) {
  const game = usePuzzleGame(initialLevelNumber, playMode);
  const { board } = game.session;
  const cells = [];
  const reportedLevelRef = useRef<string | null>(null);
  const completionResult: LevelCompletionResult = {
    levelId: game.level.id,
    levelNumber: game.level.levelNumber,
    score: game.session.score,
    mistakes: game.session.mistakes,
    hintsUsed: game.session.hintsUsed
  };
  const earnedStars = calculateStars(completionResult);
  const displayedBestStars = Math.max(bestStars, earnedStars);

  useEffect(() => {
    if (game.session.status === 'playing') {
      reportedLevelRef.current = null;
      return;
    }
    if (reportedLevelRef.current === game.level.id) return;
    reportedLevelRef.current = game.level.id;
    onLevelCompleted({
      levelId: game.level.id,
      levelNumber: game.level.levelNumber,
      score: game.session.score,
      mistakes: game.session.mistakes,
      hintsUsed: game.session.hintsUsed
    });
  }, [
    game.level.id,
    game.level.levelNumber,
    game.session.hintsUsed,
    game.session.mistakes,
    game.session.score,
    game.session.status,
    onLevelCompleted
  ]);

  for (let row = 0; row < game.level.height; row += 1) {
    for (let column = 0; column < game.level.width; column += 1) {
      const key = cellKey(row, column);
      const cell = board.cells.get(key);
      if (cell === undefined) {
        cells.push(<span className="puzzle-gap" aria-hidden="true" key={key} />);
        continue;
      }
      const value = cell.fixed ? cell.answer : game.session.values[key] ?? '';
      const selected = game.session.selectedCellKey === key;
      const correct = value !== '' && value === cell.answer;
      const wrong = value !== '' && value !== cell.answer;
      cells.push(
        <button
          className={`puzzle-cell ${cell.fixed ? 'fixed' : ''} ${selected ? 'selected' : ''} ${correct ? 'correct' : ''} ${wrong ? 'wrong' : ''}`}
          type="button"
          key={key}
          disabled={cell.fixed || game.session.status === 'completed'}
          aria-label={`第 ${row + 1} 列第 ${column + 1} 格${value ? `，目前是${value}` : '，尚未填字'}`}
          aria-pressed={selected}
          onClick={() => game.selectCell(key)}
        >
          {value || '　'}
        </button>
      );
    }
  }

  const finalLevel = game.level.levelNumber === game.totalLevels;
  const modeLabel = playMode === 'trap-candidates' ? '候選偽字模式' : '標準模式';

  return (
    <main className="app-shell puzzle-shell">
      <header className="puzzle-header">
        <button className="text-action" type="button" onClick={() => onExitToMap()}>關卡地圖</button>
        <div>
          <p className="eyebrow">第一章 · {game.level.title}</p>
          <h1 className="puzzle-title">第 {game.level.levelNumber} 關</h1>
        </div>
        <button className="text-action" type="button" onClick={() => game.restartLevel()}>重玩</button>
      </header>

      <p className={`puzzle-mode-badge ${playMode === 'trap-candidates' ? 'trap' : 'standard'}`}>
        {modeLabel}
      </p>

      <section className="puzzle-stats" aria-label="關卡狀態">
        <span>進度 <strong>{game.level.levelNumber}/{game.totalLevels}</strong></span>
        <span>分數 <strong>{game.session.score}</strong></span>
        <span>提示 <strong>{game.session.hintsUsed}/{game.level.hintLimit}</strong></span>
      </section>

      <section className="puzzle-panel" aria-labelledby="puzzle-board-title">
        <h2 id="puzzle-board-title">把下方文字填入成語空格</h2>
        <div
          className="puzzle-board"
          style={{ gridTemplateColumns: `repeat(${game.level.width}, minmax(2.8rem, 1fr))` }}
        >
          {cells}
        </div>
        <p className={`puzzle-feedback ${game.feedback.tone}`} aria-live="polite">
          {game.feedback.message}
        </p>
      </section>

      {game.session.status === 'completed' ? (
        <section className="puzzle-complete" aria-labelledby="complete-title">
          <h2 id="complete-title">過關！本關成語</h2>
          <div className="completion-stars" aria-label={`本次獲得 ${earnedStars} 星`}>
            <strong aria-hidden="true">{starText(earnedStars)}</strong>
            <span>本次 {earnedStars} 星 · 最佳 {displayedBestStars} 星</span>
          </div>
          <div className="completed-idioms">
            {game.completedIdioms.map((idiom) => (
              <article key={idiom.id}>
                <strong>{idiom.text}</strong>
                <p>{idiom.meaning}</p>
              </article>
            ))}
          </div>
          <div className="completion-actions">
            <button className="secondary-action" type="button" onClick={() => onExitToMap()}>
              返回地圖
            </button>
            <button
              className="primary-action"
              type="button"
              onClick={() => finalLevel
                ? onExitToMap()
                : onOpenNextLevel(game.level.levelNumber + 1)}
            >
              {finalLevel ? '完成第一章' : '下一關'}
            </button>
          </div>
        </section>
      ) : (
        <section className="tile-panel" aria-labelledby="candidate-title">
          <h2 id="candidate-title">候選字</h2>
          <div className="candidate-grid">
            {game.session.tiles.map((tile) => (
              <button
                className="candidate-tile"
                type="button"
                key={tile.id}
                disabled={tile.usedBy !== null}
                onClick={() => game.chooseTile(tile.id)}
              >
                {tile.character}
              </button>
            ))}
            {game.candidateDecoys.map((decoy) => (
              <CandidateDecoyTile
                key={decoy.id}
                decoy={decoy}
                onChoose={(id) => {
                  playCandidateDecoyEjectFeedback();
                  game.chooseCandidateDecoy(id);
                }}
                onEjectionComplete={(id) => game.finishCandidateDecoyEjection(id)}
              />
            ))}
          </div>
          <div className="puzzle-actions">
            <button className="secondary-action" type="button" onClick={() => game.removeSelected()}>移除</button>
            <button className="secondary-action" type="button" onClick={() => game.hint()}>提示</button>
            <button className="secondary-action" type="button" onClick={() => game.shuffleTiles()}>重排</button>
            <button className="secondary-action" type="button" onClick={() => game.clear()}>清空</button>
          </div>
        </section>
      )}
    </main>
  );
}
