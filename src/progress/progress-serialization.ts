import type {
  CampaignProgress,
  LevelProgress,
  LevelStars
} from '../domain/progress.js';
import { createInitialCampaignProgress } from './progress-engine.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return isInteger(value) && value >= 0;
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function clampLevel(value: number, totalLevels: number): number {
  return Math.max(1, Math.min(totalLevels, value));
}

function levelNumberFromId(levelId: string): number | null {
  const match = /^level-(\d{3})$/.exec(levelId);
  if (match === null) return null;
  const number = Number(match[1]);
  return Number.isInteger(number) ? number : null;
}

function parseLevelProgress(
  value: unknown,
  totalLevels: number
): LevelProgress | null {
  if (!isRecord(value)) return null;
  if (
    typeof value.levelId !== 'string'
    || value.completed !== true
    || !isInteger(value.stars)
    || value.stars < 1
    || value.stars > 3
    || !isNonNegativeInteger(value.bestScore)
    || !isNonNegativeInteger(value.bestMistakes)
    || !isNonNegativeInteger(value.bestHintsUsed)
    || !isInteger(value.completionCount)
    || value.completionCount < 1
    || !isTimestamp(value.firstCompletedAt)
    || !isTimestamp(value.lastCompletedAt)
  ) {
    return null;
  }

  const levelNumber = levelNumberFromId(value.levelId);
  if (levelNumber === null || levelNumber < 1 || levelNumber > totalLevels) return null;

  return Object.freeze({
    levelId: value.levelId,
    completed: true,
    stars: value.stars as LevelStars,
    bestScore: value.bestScore,
    bestMistakes: value.bestMistakes,
    bestHintsUsed: value.bestHintsUsed,
    completionCount: value.completionCount,
    firstCompletedAt: value.firstCompletedAt,
    lastCompletedAt: value.lastCompletedAt
  });
}

export function parseCampaignProgress(
  value: unknown,
  totalLevels: number,
  now: string
): CampaignProgress {
  if (
    !Number.isInteger(totalLevels)
    || totalLevels < 1
    || !isRecord(value)
    || value.schemaVersion !== 1
    || value.campaignId !== 'chapter-1'
    || !isInteger(value.highestUnlockedLevel)
    || !isInteger(value.lastPlayedLevel)
    || !isRecord(value.levelProgressById)
    || !isTimestamp(value.updatedAt)
  ) {
    return createInitialCampaignProgress(totalLevels, now);
  }

  const parsedLevels: Record<string, LevelProgress> = {};
  for (const [key, candidate] of Object.entries(value.levelProgressById)) {
    const parsed = parseLevelProgress(candidate, totalLevels);
    if (parsed !== null && parsed.levelId === key) {
      parsedLevels[key] = parsed;
    }
  }

  const highestUnlockedLevel = clampLevel(value.highestUnlockedLevel, totalLevels);
  const lastPlayedLevel = Math.min(
    highestUnlockedLevel,
    clampLevel(value.lastPlayedLevel, totalLevels)
  );

  return Object.freeze({
    schemaVersion: 1,
    campaignId: 'chapter-1',
    highestUnlockedLevel,
    lastPlayedLevel,
    levelProgressById: Object.freeze(parsedLevels),
    updatedAt: value.updatedAt
  });
}
