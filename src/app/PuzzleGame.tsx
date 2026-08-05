import { cellKey } from '../domain/puzzle';
import { usePuzzleGame } from './use-puzzle-game';
import './PuzzleGame.css';

export interface PuzzleGameProps {
  readonly onExit: () => void;
}

export function PuzzleGame({ onExit }: PuzzleGameProps) {
  const game = usePuzzleGame();
  const { board } = game.session;
  const cells = [];

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

  return (
    <main className="app-shell puzzle-shell">
      <header className="puzzle-header">
        <button className="text-action" type="button" onClick={onExit}>返回首頁</button>
        <div>
          <p className="eyebrow">第一章 · {game.level.title}</p>
          <h1 className="puzzle-title">第 {game.level.levelNumber} 關</h1>
        </div>
        <button className="text-action" type="button" onClick={game.restartLevel}>重玩</button>
      </header>

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
          <div className="completed-idioms">
            {game.completedIdioms.map((idiom) => (
              <article key={idiom.id}>
                <strong>{idiom.text}</strong>
                <p>{idiom.meaning}</p>
              </article>
            ))}
          </div>
          <button className="primary-action" type="button" onClick={game.nextLevel}>
            {game.levelIndex === game.totalLevels - 1 ? '重新第一關' : '下一關'}
          </button>
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
          </div>
          <div className="puzzle-actions">
            <button className="secondary-action" type="button" onClick={game.removeSelected}>移除</button>
            <button className="secondary-action" type="button" onClick={game.hint}>提示</button>
            <button className="secondary-action" type="button" onClick={game.shuffleTiles}>重排</button>
            <button className="secondary-action" type="button" onClick={game.clear}>清空</button>
          </div>
        </section>
      )}
    </main>
  );
}
