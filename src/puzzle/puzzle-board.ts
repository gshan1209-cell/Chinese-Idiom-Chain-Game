import {
  cellKey,
  type PuzzleBoard,
  type PuzzleCell,
  type PuzzleLevel,
  type PuzzlePlacement
} from '../domain/puzzle.js';

const FOUR_HAN = /^[\p{Script=Han}]{4}$/u;

function assertIntegerInRange(value: number, label: string, min: number): void {
  if (!Number.isInteger(value) || value < min) {
    throw new Error(`${label} 必須是大於等於 ${min} 的整數。`);
  }
}

function validatePlacement(level: PuzzleLevel, placement: PuzzlePlacement): void {
  if (!placement.id.trim() || !placement.idiomId.trim()) {
    throw new Error('placement id 與 idiomId 不可為空。');
  }
  if (!FOUR_HAN.test(placement.text)) {
    throw new Error(`成語「${placement.text}」必須是四個中文字。`);
  }
  assertIntegerInRange(placement.startRow, 'startRow', 0);
  assertIntegerInRange(placement.startColumn, 'startColumn', 0);

  const endRow = placement.startRow + (placement.direction === 'vertical' ? 3 : 0);
  const endColumn = placement.startColumn + (placement.direction === 'horizontal' ? 3 : 0);
  if (endRow >= level.height || endColumn >= level.width) {
    throw new Error(`placement「${placement.id}」超出盤面。`);
  }
}

function placementCoordinate(placement: PuzzlePlacement, index: number): readonly [number, number] {
  return placement.direction === 'horizontal'
    ? [placement.startRow, placement.startColumn + index]
    : [placement.startRow + index, placement.startColumn];
}

export function buildPuzzleBoard(level: PuzzleLevel): PuzzleBoard {
  assertIntegerInRange(level.width, 'width', 1);
  assertIntegerInRange(level.height, 'height', 1);
  if (level.placements.length < 2) throw new Error('每一關至少需要兩個成語。');

  const placementIds = new Set<string>();
  const mutableCells = new Map<string, {
    key: string;
    row: number;
    column: number;
    answer: string;
    placementIds: string[];
  }>();

  for (const placement of level.placements) {
    validatePlacement(level, placement);
    if (placementIds.has(placement.id)) throw new Error(`重複的 placement id：${placement.id}`);
    placementIds.add(placement.id);

    [...placement.text].forEach((character, characterIndex) => {
      const [row, column] = placementCoordinate(placement, characterIndex);
      const key = cellKey(row, column);
      const existing = mutableCells.get(key);
      if (existing !== undefined) {
        if (existing.answer !== character) {
          throw new Error(`交叉字衝突：${key} 同時出現「${existing.answer}」與「${character}」。`);
        }
        existing.placementIds.push(placement.id);
        return;
      }
      mutableCells.set(key, { key, row, column, answer: character, placementIds: [placement.id] });
    });
  }

  const fixedSet = new Set(level.fixedCells);
  for (const fixedKey of fixedSet) {
    if (!mutableCells.has(fixedKey)) throw new Error(`固定格 ${fixedKey} 不在盤面上。`);
  }

  const cells = new Map<string, PuzzleCell>();
  const fillableKeys: string[] = [];
  const candidateCharacters: string[] = [];

  for (const [key, cell] of [...mutableCells.entries()].sort((a, b) => {
    const rowDelta = a[1].row - b[1].row;
    return rowDelta !== 0 ? rowDelta : a[1].column - b[1].column;
  })) {
    const fixed = fixedSet.has(key);
    const immutableCell: PuzzleCell = Object.freeze({
      key,
      row: cell.row,
      column: cell.column,
      answer: cell.answer,
      fixed,
      placementIds: Object.freeze([...cell.placementIds])
    });
    cells.set(key, immutableCell);
    if (!fixed) {
      fillableKeys.push(key);
      candidateCharacters.push(cell.answer);
    }
  }

  if (fillableKeys.length === 0) throw new Error('關卡至少要有一個可填空格。');

  return Object.freeze({
    level,
    cells,
    fillableKeys: Object.freeze(fillableKeys),
    candidateCharacters: Object.freeze(candidateCharacters)
  });
}
