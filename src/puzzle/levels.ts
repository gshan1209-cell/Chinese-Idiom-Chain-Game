import type { PuzzleDifficulty, PuzzleLevel, PuzzlePlacement } from '../domain/puzzle.js';

interface IdiomSeed {
  readonly id: string;
  readonly text: string;
}

const IDIOMS: Readonly<Record<number, IdiomSeed>> = Object.freeze({
  1: { id: 'idiom-0001', text: '一心一意' },
  2: { id: 'idiom-0002', text: '意氣風發' },
  3: { id: 'idiom-0003', text: '發揚光大' },
  4: { id: 'idiom-0004', text: '大公無私' },
  5: { id: 'idiom-0005', text: '私心雜念' },
  6: { id: 'idiom-0006', text: '念念不忘' },
  7: { id: 'idiom-0007', text: '忘恩負義' },
  8: { id: 'idiom-0008', text: '義不容辭' },
  9: { id: 'idiom-0009', text: '辭舊迎新' },
  10: { id: 'idiom-0010', text: '新陳代謝' },
  11: { id: 'idiom-0011', text: '謝天謝地' },
  12: { id: 'idiom-0012', text: '地久天長' },
  13: { id: 'idiom-0013', text: '長年累月' },
  14: { id: 'idiom-0014', text: '月下老人' },
  15: { id: 'idiom-0015', text: '人山人海' },
  16: { id: 'idiom-0016', text: '海闊天空' },
  17: { id: 'idiom-0017', text: '空前絕後' },
  18: { id: 'idiom-0018', text: '後來居上' },
  19: { id: 'idiom-0019', text: '上行下效' },
  20: { id: 'idiom-0020', text: '效犬馬力' },
  21: { id: 'idiom-0021', text: '力爭上游' },
  22: { id: 'idiom-0022', text: '游刃有餘' },
  23: { id: 'idiom-0023', text: '餘音繞梁' },
  24: { id: 'idiom-0024', text: '梁上君子' },
  25: { id: 'idiom-0025', text: '子虛烏有' },
  26: { id: 'idiom-0026', text: '有始有終' },
  27: { id: 'idiom-0027', text: '終身大事' },
  28: { id: 'idiom-0028', text: '事半功倍' },
  29: { id: 'idiom-0029', text: '意想不到' },
  30: { id: 'idiom-0030', text: '到此為止' },
  31: { id: 'idiom-0031', text: '止於至善' },
  32: { id: 'idiom-0032', text: '善始善終' },
  33: { id: 'idiom-0033', text: '人定勝天' },
  34: { id: 'idiom-0034', text: '天長地久' },
  35: { id: 'idiom-0035', text: '久別重逢' },
  36: { id: 'idiom-0036', text: '逢凶化吉' },
  37: { id: 'idiom-0037', text: '吉祥如意' }
});

const LEVEL_CHAINS: readonly (readonly number[])[] = Object.freeze([
  [1, 2], [2, 3], [3, 4], [4, 5], [5, 6],
  [6, 7, 8], [8, 9, 10], [10, 11, 12], [12, 13, 14], [14, 15, 16],
  [16, 17, 18], [18, 19, 20], [20, 21, 22, 23], [23, 24, 25, 26],
  [26, 27, 28], [29, 30, 31, 32], [32, 27, 28], [33, 34, 35, 36],
  [36, 37, 29, 30], [7, 8, 9, 10]
]);

function placementFor(seed: IdiomSeed, index: number, levelNumber: number): PuzzlePlacement {
  const positions = [
    { direction: 'horizontal' as const, startRow: 0, startColumn: 0 },
    { direction: 'vertical' as const, startRow: 0, startColumn: 3 },
    { direction: 'horizontal' as const, startRow: 3, startColumn: 3 },
    { direction: 'vertical' as const, startRow: 3, startColumn: 6 }
  ];
  const position = positions[index];
  if (position === undefined) throw new Error('單一關卡最多支援四個成語。');
  return Object.freeze({
    id: `level-${String(levelNumber).padStart(3, '0')}-p${index + 1}`,
    idiomId: seed.id,
    text: seed.text,
    ...position
  });
}

function difficultyFor(levelNumber: number): PuzzleDifficulty {
  if (levelNumber <= 7) return 'easy';
  if (levelNumber <= 15) return 'normal';
  return 'hard';
}

function makeLevel(chain: readonly number[], index: number): PuzzleLevel {
  const levelNumber = index + 1;
  const seeds = chain.map((number) => {
    const seed = IDIOMS[number];
    if (seed === undefined) throw new Error(`找不到成語種子 ${number}`);
    return seed;
  });
  const placements = seeds.map((seed, placementIndex) => placementFor(seed, placementIndex, levelNumber));
  const hasFourth = placements.length === 4;
  const width = placements.length >= 3 ? 7 : 4;
  const height = hasFourth ? 7 : 4;
  return Object.freeze({
    id: `level-${String(levelNumber).padStart(3, '0')}`,
    chapterId: 'chapter-1',
    levelNumber,
    title: levelNumber <= 5 ? '初試身手' : levelNumber <= 12 ? '漸入佳境' : '博學多聞',
    width,
    height,
    placements: Object.freeze(placements),
    fixedCells: Object.freeze(['0:0', '1:3']),
    difficulty: difficultyFor(levelNumber),
    hintLimit: levelNumber <= 5 ? 3 : 2
  });
}

export const PUZZLE_LEVELS: readonly PuzzleLevel[] = Object.freeze(
  LEVEL_CHAINS.map((chain, index) => makeLevel(chain, index))
);

export function getPuzzleLevel(levelNumber: number): PuzzleLevel | null {
  return PUZZLE_LEVELS[levelNumber - 1] ?? null;
}
