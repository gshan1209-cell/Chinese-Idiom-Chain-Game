import type {
  CampaignProgress,
  LevelCompletionResult,
  LevelProgress,
  LevelStars
} from '../domain/progress.js';

function assertTotalLevels(totalLevels: number): void {
  if (!Number.isInteger(totalLevels) || totalLevels < 1) {
    throw new Error('總關卡數必須是正整數。');
  }
}

function assertLevelNumber(levelNumber: number, totalLevels: number): void {
  assertTotalLevels(totalLevels);
  if (!Number.isInteger(levelNumber) || levelNumber < 1 || levelNumber > totalLevels) {
    throw new Error(`關卡範圍必須介於 1 到 ${totalLevels}。`);
  }
}

function freezeLevelProgress(progress: LevelProgress): LevelProgress {
  return Object.freeze({ ...progress });
}

function freezeCampaignProgress(progress: CampaignProgress): CampaignProgress {
  const levelProgressById = Object.freeze(
    Object.fromEntries(
      Object.entries(progress.levelProgressById).map(([key, value]) => [
        key,
        freezeLevelProgress(value)
      ])
    )
  );

  return Object.freeze({
    ...progress,
    levelProgressById
  });
}

function validateCompletionResult(result: LevelCompletionResult, totalLevels: number): void {
  assertLevelNumber(result.levelNumber, totalLevels);
  if (result.levelId !== `level-${String(result.levelNumber).padStart(3, '0')}`) {
    throw new Error('關卡編號與關卡 ID 不一致。');
  }
  for (const [label, value] of [
    ['分數', result.score],
    ['錯誤次數', result.mistakes],
    ['提示次數', result.hintsUsed]
  ] as const) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`${label}必須是非負整數。`);
    }
  }
}

export function createInitialCampaignProgress(
  totalLevels: number,
  now: string
): CampaignProgress {
  assertTotalLevels(totalLevels);
  return freezeCampaignProgress({
    schemaVersion: 1,
    campaignId: 'chapter-1',
    highestUnlockedLevel: 1,
    lastPlayedLevel: 1,
    levelProgressById: {},
    updatedAt: now
  });
}

export function calculateStars(result: LevelCompletionResult): LevelStars {
  if (result.hintsUsed === 0 && result.mistakes === 0) return 3;
  if (result.hintsUsed <= 1 && result.mistakes <= 2) return 2;
  return 1;
}

export function isLevelUnlocked(
  progress: CampaignProgress,
  levelNumber: number
): boolean {
  return Number.isInteger(levelNumber)
    && levelNumber >= 1
    && levelNumber <= progress.highestUnlockedLevel;
}

export function recordLevelStarted(
  progress: CampaignProgress,
  levelNumber: number,
  totalLevels: number,
  now: string
): CampaignProgress {
  assertLevelNumber(levelNumber, totalLevels);
  if (!isLevelUnlocked(progress, levelNumber)) {
    throw new Error('這一關尚未解鎖。');
  }
  return freezeCampaignProgress({
    ...progress,
    lastPlayedLevel: levelNumber,
    updatedAt: now
  });
}

export function recordLevelCompletion(
  progress: CampaignProgress,
  result: LevelCompletionResult,
  totalLevels: number,
  now: string
): CampaignProgress {
  validateCompletionResult(result, totalLevels);
  if (!isLevelUnlocked(progress, result.levelNumber)) {
    throw new Error('這一關尚未解鎖。');
  }

  const previous = progress.levelProgressById[result.levelId];
  const stars = calculateStars(result);
  const nextLevelProgress: LevelProgress = {
    levelId: result.levelId,
    completed: true,
    stars: previous === undefined ? stars : Math.max(previous.stars, stars) as LevelStars,
    bestScore: previous === undefined ? result.score : Math.max(previous.bestScore, result.score),
    bestMistakes: previous === undefined
      ? result.mistakes
      : Math.min(previous.bestMistakes, result.mistakes),
    bestHintsUsed: previous === undefined
      ? result.hintsUsed
      : Math.min(previous.bestHintsUsed, result.hintsUsed),
    completionCount: (previous?.completionCount ?? 0) + 1,
    firstCompletedAt: previous?.firstCompletedAt ?? now,
    lastCompletedAt: now
  };
  const nextUnlockedLevel = Math.min(totalLevels, result.levelNumber + 1);

  return freezeCampaignProgress({
    ...progress,
    highestUnlockedLevel: Math.max(progress.highestUnlockedLevel, nextUnlockedLevel),
    lastPlayedLevel: nextUnlockedLevel,
    levelProgressById: {
      ...progress.levelProgressById,
      [result.levelId]: nextLevelProgress
    },
    updatedAt: now
  });
}

export function getContinueLevelNumber(
  progress: CampaignProgress,
  totalLevels: number
): number {
  assertTotalLevels(totalLevels);
  return Math.max(
    1,
    Math.min(totalLevels, progress.highestUnlockedLevel, progress.lastPlayedLevel)
  );
}

export function getTotalStars(progress: CampaignProgress): number {
  return Object.values(progress.levelProgressById)
    .reduce((total, level) => total + level.stars, 0);
}
