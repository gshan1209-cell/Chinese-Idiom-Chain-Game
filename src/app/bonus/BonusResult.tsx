import type { BonusRound, BonusSettlement } from '../../domain/bonus';

interface BonusResultProps {
  readonly round: BonusRound;
  readonly settlement: BonusSettlement;
  readonly onClose: () => void;
}

const REWARD_NAMES = {
  'hint-ticket': '提示券',
  time: '增加時間',
  'score-multiplier': '雙倍分數題數',
  shield: '失誤護盾'
} as const;

export function BonusResult({
  round,
  settlement,
  onClose
}: BonusResultProps) {
  return (
    <main className="app-shell bonus-screen">
      <section className="bonus-result" aria-labelledby="result-title">
        <p className="eyebrow">獎勵關卡完成</p>
        <h1 id="result-title">
          {settlement.perfect ? '百發百中！' : '打地鼠結算'}
        </h1>
        <div className="result-grid">
          <div><span>命中</span><strong>{round.correctCount}</strong></div>
          <div><span>失誤</span><strong>{round.wrongCount}</strong></div>
          <div><span>最高連擊</span><strong>{round.maxCombo}</strong></div>
          <div><span>關卡分數</span><strong>{round.score}</strong></div>
        </div>
        <div className="reward-summary" role="status">
          <span>{REWARD_NAMES[settlement.rewardType]}</span>
          <strong>+{settlement.rewardAmount}</strong>
        </div>
        {settlement.perfect ? (
          <p>完美獎勵：主線 +300 分、能量回補 10%。</p>
        ) : null}
        <button className="primary-action" type="button" onClick={onClose}>
          返回成語接龍
        </button>
      </section>
    </main>
  );
}
