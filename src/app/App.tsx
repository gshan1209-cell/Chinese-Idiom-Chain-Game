import { useState, type ChangeEvent, type FormEvent } from 'react';

import { CampaignGame } from './CampaignGame';
import { PwaInstallCard } from './PwaInstallCard';
import { useClassicGame } from './use-classic-game';

const featureCards = [
  { icon: '關', title: '二十關闖關', description: '逐關解鎖縱橫成語填字，累積每關一到三星。' },
  { icon: '存', title: '本機保存', description: '解鎖、星級與最佳成績保存在目前裝置。' },
  { icon: '學', title: '邊玩邊學', description: '過關後查看本關成語與解釋。' }
] as const;

type AppMode = 'home' | 'campaign' | 'classic';

export function App() {
  const [mode, setMode] = useState<AppMode>('home');
  const game = useClassicGame();

  if (mode === 'campaign') {
    return <CampaignGame onExit={() => setMode('home')} />;
  }

  if (mode === 'classic' && game.session !== null) {
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
            <p className="eyebrow">其他玩法 · 自由接龍</p>
            <h1 className="game-title">中文成語接龍</h1>
          </div>
          <button className="text-action" type="button" onClick={() => setMode('home')}>
            返回首頁
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
              <button className="primary-action" type="button" onClick={() => game.restartGame()}>再玩一局</button>
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
                <button className="secondary-action" type="button" onClick={() => game.requestHint()}>給我提示</button>
              </div>
            </form>
          )}

          <div id="answer-feedback" className={`feedback ${game.feedback?.tone ?? 'info'}`} aria-live="polite">
            {game.feedback?.message ?? '請接出下一個四字成語。'}
          </div>
          {game.hintText !== null && !completed ? (
            <div className="hint-card" role="status"><span>提示答案</span><strong>{game.hintText}</strong></div>
          ) : null}
        </section>

        <section className="history-card" aria-labelledby="history-title">
          <h2 id="history-title">本局足跡</h2>
          <div className="history-list">
            {recentHistory.map((idiom: { id: string; text: string }, index: number) => (
              <span className="history-chip" key={`${idiom.id}-${index}`}>{idiom.text}</span>
            ))}
          </div>
        </section>
      </main>
    );
  }

  const startClassic = () => {
    game.startGame();
    setMode('classic');
  };

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="page-title">
        <span className="phase-badge">20 關 · 星級解鎖 · 離線 PWA</span>
        <div className="seal" aria-hidden="true">填</div>
        <p className="eyebrow">大字體成語填字闖關</p>
        <h1 id="page-title">中文成語填填字</h1>
        <p className="hero-copy">完成縱橫交錯的成語方格，解鎖下一關並累積三星紀錄。</p>

        <button className="primary-action" type="button" onClick={() => setMode('campaign')}>
          進入闖關地圖
        </button>
        <button
          className="secondary-action"
          type="button"
          disabled={!game.canStart}
          onClick={startClassic}
          style={{ marginTop: '1rem', width: 'min(100%, 22rem)' }}
        >
          {game.loading ? '自由接龍載入中…' : '其他玩法：自由接龍'}
        </button>
        {game.loadError !== null ? (
          <button className="text-action" type="button" onClick={() => game.retryLoad()}>重新載入成語字典</button>
        ) : null}
        <p className="phase-note">不需登入，闖關進度只保存在目前裝置，不會上傳玩家操作</p>
      </section>

      <PwaInstallCard />

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
        <p>目前使用本機成語資料，不使用 AI Token，也不會上傳玩家操作。</p>
      </footer>
    </main>
  );
}
