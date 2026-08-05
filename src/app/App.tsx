const featureCards = [
  {
    icon: '字',
    title: '超大字體',
    description: '手機直式畫面也能清楚閱讀與操作。'
  },
  {
    icon: '離',
    title: '離線遊玩',
    description: '首次完整載入後，不連網也能繼續練習。'
  },
  {
    icon: '學',
    title: '邊玩邊學',
    description: '每次答題都能查看解釋、例句與來源。'
  }
] as const;

export function App() {
  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="page-title">
        <span className="phase-badge">PWA 基礎版 · Phase 0–1</span>
        <div className="seal" aria-hidden="true">
          成
        </div>
        <p className="eyebrow">看得清楚，離線也能玩</p>
        <h1 id="page-title">中文成語接龍</h1>
        <p className="hero-copy">
          依照上一個成語的最後一字，接出下一個四字成語。
        </p>

        <button className="primary-action" type="button" disabled aria-describedby="phase-note">
          開始遊戲
        </button>
        <p id="phase-note" className="phase-note">
          遊戲引擎將於 Phase 2 開放
        </p>
      </section>

      <section className="feature-grid" aria-label="產品特色">
        {featureCards.map((feature) => (
          <article className="feature-card" key={feature.title}>
            <span className="feature-icon" aria-hidden="true">
              {feature.icon}
            </span>
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>

      <footer className="site-footer">
        <p>目前不需登入、不使用 AI Token，也不會上傳玩家輸入。</p>
      </footer>
    </main>
  );
}
