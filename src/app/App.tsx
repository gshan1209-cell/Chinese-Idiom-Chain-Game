import type { ChangeEvent, FormEvent } from 'react';

import { useClassicGame } from './use-classic-game';

const featureCards = [
  { icon: '字', title: '超大字體', description: '手機直式畫面也能清楚閱讀與操作。' },
  { icon: '離', title: '離線遊玩', description: '首次完整載入後，不連網也能繼續練習。' },
  { icon: '學', title: '邊玩邊學', description: '答題同時累積成語接龍能力。' }
] as const;

export function App() {
  const game = useClassicGame();

  if (game.session !== null) {
    const session = game.session;
    const recentHistory = session.history.slice(-6);
    const completed = session.result === 'completed';

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      game.submitAnswer();
    };

    return (
      <main className="app-shell game-shell">
        <header className="game-header">
          <div>
            <p className="eyebrow">經典模式</p>
            <h1 className="game-title">中文成語接龍</h1>
          </div>
          <button className="text-action" type="button" onClick={game.restartGame}>
            重新開始
          </button>
        </header>

        <section className="score-board" aria-label="本局成績">
          <div><span>分數</span><strong>{session.score}</strong></div>
          <div><span>連擊</span><strong>{session.combo}</strong></div>
          <div><span>已接</span><strong>{session.correctCount}</strong></div>
        </section>

        <section className="game-card" aria-labelledby="current-idiom-label">
          <p id="current-idiom-label" className="game-label">目前成語</p>
          <p className="current-idiom">{session.previousIdiom.text}</p>
          <p className="required-char">
            下一個成語要從 <strong>{session.previousIdiom.lastChar}</strong> 開始
          </p>

          {completed ? (
            <div className="completion-panel" role="status">
              <h2>接龍完成！</h2>
              <p>這條路徑已沒有未使用的接續成語。</p>
              <button className="primary-action" type="button" onClick={game.restartGame}>
                再玩一局
              </button>
            </div>
          ) : (
            <form className="answer-form" onSubmit={handleSubmit}>
              <label htmlFor="idiom-answer">輸入四字成語</label>
              <input
                id="idiom-answer"
                className="idiom-input"
                value={game.input}
                onChange={(event: ChangeEvent<HTMLInputElement>) => game.setInput(event.target.value)}
                maxLength={4}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder={`${session.previousIdiom.lastChar}○○○`}
                aria-describedby="answer-feedback"
              />
              <div className="action-row">
                <button className="primary-action" type="submit">送出答案</button>
                <button className="secondary-action" type="button" onClick={game.requestHint}>
                  給我提示
                </button>
              </div>
            </form>
          )}

          <div
            id="answer-feedback"
            className={`feedback ${game.feedback?.tone ?? 'info'}`}
            aria-live="polite"
          >
            {game.feedback?.message ?? '請接出下一個四字成語。'}
          </div>

          {game.hintText !== null && !completed ? (
            <div className="hint-card" role="status">
              <span>提示答案</span>
              <strong>{game.hintText}</strong>
            </div>
          ) : null}
        </section>

        <section className="history-card" aria-labelledby="history-title">
          <h2 id="history-title">本局足跡</h2>
          <div className="history-list">
            {recentHistory.map((idiom, index) => (
              <span className="history-chip" key={`${idiom.id}-${index}`}>
                {idiom.text}
              </span>
            ))}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="page-title">
        <span className="phase-badge">離線 PWA · 經典模式</span>
        <div className="seal" aria-hidden="true">成</div>
        <p className="eyebrow">看得清楚，離線也能玩</p>
        <h1 id="page-title">中文成語接龍</h1>
        <p className="hero-copy">依照上一個成語的最後一字，接出下一個四字成語。</p>

        {game.loadError !== null ? (
          <div className="load-error" role="alert">
            <p>{game.loadError}</p>
            <button className="secondary-action" type="button" onClick={game.retryLoad}>
              重新載入字典
            </button>
          </div>
        ) : (
          <button
            className="primary-action"
            type="button"
            disabled={!game.canStart}
            onClick={game.startGame}
          >
            {game.loading ? '字典載入中…' : '開始遊戲'}
          </button>
        )}
        <p className="phase-note">不需登入，遊戲資料只在目前裝置執行</p>
      </section>

      <section className="feature-grid" aria-label="產品特色">
        {featureCards.map((feature) => (
          <article className="feature-card" key={feature.title}>
            <span className="feature-icon" aria-hidden="true">{feature.icon}</span>
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>

      <footer className="site-footer">
        <p>目前不使用 AI Token，也不會上傳玩家輸入。</p>
      </footer>
    </main>
  );
}
