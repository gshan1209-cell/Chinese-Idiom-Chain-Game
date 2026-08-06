import './bonus/bonus.css';

import {
  useState,
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type SetStateAction
} from 'react';

import { BonusResult } from './bonus/BonusResult';
import { EnergyMeter } from './bonus/EnergyMeter';
import { RewardSelector } from './bonus/RewardSelector';
import { WhackAMoleBoard } from './bonus/WhackAMoleBoard';
import { CampaignGame } from './CampaignGame';
import { MediaLauncher } from './media/MediaLauncher';
import { MediaProvider } from './media/MediaProvider';
import { PwaInstallCard } from './PwaInstallCard';
import { useClassicGame } from './use-classic-game';

const featureCards = [
  { icon: '關', title: '二十關闖關', description: '逐關解鎖縱橫成語填字，累積每關一到三星。' },
  { icon: '存', title: '本機保存', description: '解鎖、星級與最佳成績保存在目前裝置。' },
  { icon: '樂', title: '趣味附加', description: '自由接龍累積能量，再挑戰十五秒成語打地鼠。' }
] as const;

type AppMode = 'home' | 'campaign' | 'classic';
type ClassicGameController = ReturnType<typeof useClassicGame>;

interface AppContentProps {
  readonly mode: AppMode;
  readonly setMode: Dispatch<SetStateAction<AppMode>>;
  readonly game: ClassicGameController;
}

function AppContent({ mode, setMode, game }: AppContentProps) {
  if (mode === 'campaign') {
    return <CampaignGame onExit={() => setMode('home')} />;
  }

  if (mode === 'classic' && game.session !== null) {
    const session = game.session;
    const bonus = game.bonus;

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

    if (
      bonus.view === 'result' &&
      bonus.round !== null &&
      bonus.settlement !== null
    ) {
      return (
        <BonusResult
          round={bonus.round}
          settlement={bonus.settlement}
          onClose={() => bonus.closeResult()}
        />
      );
    }

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
            <p className="eyebrow">其他玩法 · 自由接龍＋打地鼠</p>
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

        <EnergyMeter
          resources={session.bonusResources}
          disabled={session.result !== null}
          onStart={() => bonus.openRewardSelector()}
        />

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
              <div className="action-row completion-actions">
                <button className="primary-action" type="button" onClick={() => game.continueGame()}>
                  下一輪接龍
                </button>
                <button className="secondary-action" type="button" onClick={() => game.restartGame()}>
                  全新開始
                </button>
              </div>
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
                <button className="secondary-action" type="button" onClick={() => game.requestHint()}>
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
          {game.loading ? '自由接龍載入中…' : '其他玩法：自由接龍＋打地鼠'}
        </button>
        <MediaLauncher>成語電台／影音</MediaLauncher>
        {game.loadError !== null ? (
          <button className="text-action" type="button" onClick={() => game.retryLoad()}>
            重新載入成語字典
          </button>
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
        <p>成語遊戲可離線使用；電台與 YouTube 為選用的網路功能。</p>
      </footer>
    </main>
  );
}

export function App() {
  const [mode, setMode] = useState<AppMode>('home');
  const game = useClassicGame();

  return (
    <MediaProvider bonusActive={game.bonus.view === 'playing'}>
      <AppContent mode={mode} setMode={setMode} game={game} />
    </MediaProvider>
  );
}
