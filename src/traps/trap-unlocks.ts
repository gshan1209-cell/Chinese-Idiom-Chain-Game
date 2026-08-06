import type { CampaignProgress } from '../domain/progress.js';
import type { PuzzlePlayMode } from '../domain/trap.js';

const REQUIRED_LEVEL = Object.freeze({
  'trap-candidates': 5,
  'trap-board': 10
} as const);

export function isPuzzlePlayModeUnlocked(
  progress: CampaignProgress,
  mode: PuzzlePlayMode
): boolean {
  if (mode === 'standard') return true;
  if (mode === 'trap-stubborn') return false;

  const requiredLevel = REQUIRED_LEVEL[mode];
  const levelId = `level-${String(requiredLevel).padStart(3, '0')}`;
  return progress.levelProgressById[levelId]?.completed === true;
}

export function getPuzzlePlayModeLockReason(
  progress: CampaignProgress,
  mode: PuzzlePlayMode
): string | null {
  if (mode === 'trap-stubborn') return '頑固伏字尚未開放。';
  if (isPuzzlePlayModeUnlocked(progress, mode)) return null;
  if (mode === 'standard') return null;

  const requiredLevel = REQUIRED_LEVEL[mode];
  const label = mode === 'trap-candidates' ? '候選偽字' : '盤面伏字';
  return `完成第 ${String(requiredLevel)} 關後解鎖${label}。`;
}
