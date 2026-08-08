import type { PuzzleLevel } from '../domain/puzzle.js';
import type {
  CardLevelGrant,
  CardMilestoneGrant,
  CardRewardScoreSnapshot
} from './card-types.js';

export function levelRewardId(chapterId: string, levelNumber: number): string {
  return `card-grant:main-level:${chapterId}:${String(levelNumber)}`;
}

export function levelAcquisitionId(rewardId: string): string {
  return `card-acquisition:${rewardId}`;
}

export interface CreateMissingLevelGrantsInput {
  readonly completedLevels: readonly Pick<
    PuzzleLevel,
    'id' | 'chapterId' | 'levelNumber' | 'campaignOrdinal'
  >[];
  readonly existing: readonly CardLevelGrant[];
  readonly legacyGrants: readonly CardMilestoneGrant[];
  readonly scoreSnapshots: ReadonlyMap<string, CardRewardScoreSnapshot>;
  readonly now: string;
}

function createPendingLevelGrant(
  level: Pick<PuzzleLevel, 'id' | 'chapterId' | 'levelNumber' | 'campaignOrdinal'>,
  scoreSnapshot: CardRewardScoreSnapshot,
  now: string
): CardLevelGrant {
  return Object.freeze({
    rewardId: levelRewardId(level.chapterId, level.levelNumber),
    chapterId: level.chapterId,
    levelNumber: level.levelNumber,
    campaignOrdinal: level.campaignOrdinal,
    scoreSnapshot: Object.freeze({ ...scoreSnapshot }),
    probabilitySnapshot: null,
    status: 'pending',
    createdAt: now,
    resolvedAt: null,
    revealedAt: null,
    resolvedCardId: null,
    acquisitionId: null,
    legacyCoverage: false
  });
}

export function createMissingLevelGrants(
  input: CreateMissingLevelGrantsInput
): readonly CardLevelGrant[] {
  const existingIds = new Set(input.existing.map((grant) => grant.rewardId));
  const legacyCoveredOrdinals = new Set(
    input.legacyGrants.map((grant) => grant.milestoneLevelCount)
  );
  const missing: CardLevelGrant[] = [];

  const completedLevels = [...input.completedLevels].sort(
    (left, right) => left.campaignOrdinal - right.campaignOrdinal
  );

  for (const level of completedLevels) {
    const rewardId = levelRewardId(level.chapterId, level.levelNumber);
    if (existingIds.has(rewardId) || legacyCoveredOrdinals.has(level.campaignOrdinal)) {
      continue;
    }

    const scoreSnapshot = input.scoreSnapshots.get(level.id);
    if (scoreSnapshot === undefined) {
      throw new Error(`missing-score-snapshot:${level.id}`);
    }

    missing.push(createPendingLevelGrant(level, scoreSnapshot, input.now));
  }

  return Object.freeze(missing);
}
