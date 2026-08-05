import type { BonusRewardType } from '../../domain/bonus';

interface RewardSelectorProps {
  readonly rewards: readonly BonusRewardType[];
  readonly unavailableReason: string | null;
  readonly onSelect: (reward: BonusRewardType) => void;
  readonly onCancel: () => void;
}

const REWARD_COPY: Readonly<
  Record<BonusRewardType, { title: string; description: string; icon: string }>
> = {
  'hint-ticket': {
    title: '提示券',
    description: '下一次提示優先免費使用。',
    icon: '燈'
  },
  time: {
    title: '增加時間',
    description: '為限時模式增加可用秒數。',
    icon: '時'
  },
  'score-multiplier': {
    title: '雙倍分數',
    description: '下一批正確答案取得 2 倍分數。',
    icon: '倍'
  },
  shield: {
    title: '失誤護盾',
    description: '答錯時保留分數與連擊。',
    icon: '盾'
  }
};

export function RewardSelector({
  rewards,
  unavailableReason,
  onSelect,
  onCancel
}: RewardSelectorProps) {
  const unavailable = unavailableReason !== null;
  return (
    <main className="app-shell bonus-screen">
      <section className="bonus-panel" aria-labelledby="reward-title">
        <p className="eyebrow">能量已滿</p>
        <h1 id="reward-title" className="bonus-title">
          選擇這次獎勵
        </h1>
        <p>接著進入 15 秒補字打地鼠，命中越多，獎勵越高。</p>
        {unavailableReason !== null ? (
          <p className="bonus-unavailable" role="alert">
            {unavailableReason}
          </p>
        ) : null}
        <div className="reward-grid">
          {rewards.map((reward) => {
            const copy = REWARD_COPY[reward];
            return (
              <button
                className="reward-card"
                type="button"
                key={reward}
                disabled={unavailable}
                onClick={() => onSelect(reward)}
              >
                <span aria-hidden="true">{copy.icon}</span>
                <strong>{copy.title}</strong>
                <small>{copy.description}</small>
              </button>
            );
          })}
        </div>
        <button className="secondary-action" type="button" onClick={onCancel}>
          稍後再玩
        </button>
      </section>
    </main>
  );
}
