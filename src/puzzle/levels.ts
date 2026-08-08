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
  37: { id: 'idiom-0037', text: '吉祥如意' },
  38: { id: 'idiom-0038', text: '意氣用事' },
  39: { id: 'idiom-0039', text: '事必躬親' },
  40: { id: 'idiom-0040', text: '親力親為' },
  41: { id: 'idiom-0041', text: '為人師表' },
  42: { id: 'idiom-0042', text: '表裡如一' },
  43: { id: 'idiom-0043', text: '一鳴驚人' },
  44: { id: 'idiom-0044', text: '人傑地靈' },
  45: { id: 'idiom-0045', text: '靈丹妙藥' },
  46: { id: 'idiom-0046', text: '藥到病除' },
  47: { id: 'idiom-0047', text: '除舊布新' },
  48: { id: 'idiom-0048', text: '新婚燕爾' },
  49: { id: 'idiom-0049', text: '爾虞我詐' },
  50: { id: 'idiom-0050', text: '山高水長' },
  51: { id: 'idiom-0051', text: '長驅直入' },
  52: { id: 'idiom-0052', text: '入木三分' },
  53: { id: 'idiom-0053', text: '分秒必爭' },
  54: { id: 'idiom-0054', text: '爭先恐後' },
  55: { id: 'idiom-0055', text: '後生可畏' },
  56: { id: 'idiom-0056', text: '畏首畏尾' },
  57: { id: 'idiom-0057', text: '尾大不掉' },
  58: { id: 'idiom-0058', text: '掉以輕心' },
  59: { id: 'idiom-0059', text: '心曠神怡' },
  60: { id: 'idiom-0060', text: '怡然自得' },
  61: { id: 'idiom-0061', text: '得心應手' },
  62: { id: 'idiom-0062', text: '手到擒來' },
  63: { id: 'idiom-0063', text: '來日方長' },
  64: { id: 'idiom-0064', text: '長話短說' },
  65: { id: 'idiom-0065', text: '說一不二' },
  66: { id: 'idiom-0066', text: '二話不說' },
  67: { id: 'idiom-0067', text: '說長道短' },
  68: { id: 'idiom-0068', text: '短兵相接' },
  69: { id: 'idiom-0069', text: '接二連三' },
  70: { id: 'idiom-0070', text: '三思而行' }
});

const LEVEL_CHAINS: readonly (readonly number[])[] = Object.freeze([
  [1, 2],
  [3, 4],
  [5, 6],
  [7, 8],
  [9, 10],
  [11, 12, 13],
  [14, 15, 16],
  [17, 18, 19],
  [20, 21, 22],
  [23, 24, 25],
  [26, 27, 28],
  [33, 34, 35],
  [36, 37, 38, 39],
  [29, 30, 31, 32],
  [40, 41, 42],
  [43, 44, 45, 46],
  [47, 48, 49],
  [50, 51, 52, 53],
  [54, 55, 56, 57],
  [58, 59, 60, 61]
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
    campaignOrdinal: levelNumber,
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
