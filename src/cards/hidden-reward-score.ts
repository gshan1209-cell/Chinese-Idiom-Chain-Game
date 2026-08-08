import type { CardRewardScoreSnapshot, IdiomDifficultyGrade } from './card-types.js';
import type { PuzzleLevel } from '../domain/puzzle.js';

const SCORE_BY_DIFFICULTY: Readonly<Record<IdiomDifficultyGrade, number>> = Object.freeze({
  E: 1,
  D: 2,
  C: 3,
  B: 4,
  A: 5,
  S: 6
});

export function scoreDifficulty(code: IdiomDifficultyGrade): number {
  return SCORE_BY_DIFFICULTY[code];
}

export function calculateLevelHiddenScore(
  level: Pick<PuzzleLevel, 'placements'>,
  difficultyById: ReadonlyMap<string, IdiomDifficultyGrade>
): number {
  const idiomIds = new Set(level.placements.map((placement) => placement.idiomId));
  let total = 0;

  for (const idiomId of idiomIds) {
    const difficulty = difficultyById.get(idiomId);
    if (difficulty === undefined) {
      throw new Error(`missing-card-difficulty:${idiomId}`);
    }
    total += scoreDifficulty(difficulty);
  }

  return total;
}

export function calculateCompletedScoreSnapshots(
  levels: readonly Pick<PuzzleLevel, 'id' | 'campaignOrdinal' | 'placements'>[],
  completedLevelIds: ReadonlySet<string>,
  difficultyById: ReadonlyMap<string, IdiomDifficultyGrade>
): ReadonlyMap<string, CardRewardScoreSnapshot> {
  const snapshots = new Map<string, CardRewardScoreSnapshot>();
  let hiddenRewardScore = 0;

  const completedLevels = [...levels]
    .filter((level) => completedLevelIds.has(level.id))
    .sort((left, right) => left.campaignOrdinal - right.campaignOrdinal);

  for (const level of completedLevels) {
    const levelHiddenScore = calculateLevelHiddenScore(level, difficultyById);
    hiddenRewardScore += levelHiddenScore;
    snapshots.set(level.id, Object.freeze({ levelHiddenScore, hiddenRewardScore }));
  }

  return snapshots;
}
