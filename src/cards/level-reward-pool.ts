import type { PuzzleLevel } from '../domain/puzzle.js';
import { buildMilestoneCardPool } from './card-pool.js';
import type {
  IdiomCardDefinition,
  MinimumRewardRarity,
  RewardRarity
} from './card-types.js';

const RARITY_RANK: Readonly<Record<RewardRarity, number>> = Object.freeze({
  N: 0,
  R: 1,
  SR: 2,
  SSR: 3
});

export function minimumRarityForOrdinal(
  ordinal: number
): MinimumRewardRarity {
  if (ordinal % 100 === 0) return 'SR';
  if (ordinal % 10 === 0) return 'R';
  return 'N';
}

export type LevelRewardCardDefinition = IdiomCardDefinition & {
  readonly rarity: RewardRarity;
};

export interface BuildLevelRewardPoolInput {
  readonly definitions: readonly IdiomCardDefinition[];
  readonly targetLevel: Pick<PuzzleLevel, 'campaignOrdinal' | 'placements'>;
  readonly completedLevels: readonly Pick<
    PuzzleLevel,
    'campaignOrdinal' | 'placements'
  >[];
}

function eligibleIdiomIds(
  input: BuildLevelRewardPoolInput
): ReadonlySet<string> {
  const isGlobalFloor = input.targetLevel.campaignOrdinal % 10 === 0;
  const levels = isGlobalFloor
    ? input.completedLevels.filter(
      (level) => level.campaignOrdinal <= input.targetLevel.campaignOrdinal
    )
    : [input.targetLevel];

  return new Set(
    levels.flatMap((level) => level.placements.map((placement) => placement.idiomId))
  );
}

export function buildLevelRewardPool(
  input: BuildLevelRewardPoolInput
): readonly LevelRewardCardDefinition[] {
  const minimumRarity = minimumRarityForOrdinal(
    input.targetLevel.campaignOrdinal
  );
  const minimumRank = RARITY_RANK[minimumRarity];
  const idiomIds = eligibleIdiomIds(input);

  return Object.freeze(
    buildMilestoneCardPool(input.definitions).filter(
      (card): card is LevelRewardCardDefinition =>
        idiomIds.has(card.idiomId) &&
        card.rarity !== 'UR' &&
        RARITY_RANK[card.rarity] >= minimumRank
    )
  );
}
