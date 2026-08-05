import type {
  HintResult,
  PlaceTileResult,
  PuzzleBoard,
  PuzzleSession,
  PuzzleTile
} from '../domain/puzzle.js';

export type TileOrderer = (items: readonly PuzzleTile[]) => readonly PuzzleTile[];

function immutableRecord<T>(record: Record<string, T>): Readonly<Record<string, T>> {
  return Object.freeze({ ...record });
}

function withCompletionState(session: Omit<PuzzleSession, 'status' | 'correctCells'>): PuzzleSession {
  const correctCells = session.board.fillableKeys.filter(
    (key) => session.values[key] === session.board.cells.get(key)?.answer
  ).length;
  const status = correctCells === session.board.fillableKeys.length ? 'completed' : 'playing';
  return Object.freeze({ ...session, correctCells, status });
}

function releaseCellTile(
  tiles: readonly PuzzleTile[],
  tileByCell: Readonly<Record<string, string>>,
  key: string
): { tiles: readonly PuzzleTile[]; tileByCell: Readonly<Record<string, string>> } {
  const existingTileId = tileByCell[key];
  if (existingTileId === undefined) return { tiles, tileByCell };
  const nextTiles = tiles.map((tile) =>
    tile.id === existingTileId ? Object.freeze({ ...tile, usedBy: null }) : tile
  );
  const nextTileByCell = { ...tileByCell };
  delete nextTileByCell[key];
  return { tiles: Object.freeze(nextTiles), tileByCell: immutableRecord(nextTileByCell) };
}

export function createPuzzleSession(board: PuzzleBoard, orderTiles: TileOrderer): PuzzleSession {
  const initialTiles = board.candidateCharacters.map((character, index) =>
    Object.freeze({ id: `tile-${index + 1}`, character, usedBy: null })
  );
  const orderedTiles = Object.freeze([...orderTiles(initialTiles)]);
  if (orderedTiles.length !== initialTiles.length) {
    throw new Error('候選字排序不可改變字數。');
  }
  return Object.freeze({
    board,
    values: Object.freeze({}),
    tileByCell: Object.freeze({}),
    tiles: orderedTiles,
    selectedCellKey: board.fillableKeys[0] ?? null,
    status: 'playing',
    score: 0,
    mistakes: 0,
    hintsUsed: 0,
    correctCells: 0
  });
}

export function selectPuzzleCell(session: PuzzleSession, key: string): PuzzleSession {
  const cell = session.board.cells.get(key);
  if (cell === undefined || cell.fixed || session.status === 'completed') return session;
  return Object.freeze({ ...session, selectedCellKey: key });
}

export function placePuzzleTile(session: PuzzleSession, tileId: string): PlaceTileResult {
  const key = session.selectedCellKey;
  if (key === null || session.status === 'completed') {
    return Object.freeze({ session, correct: false, cellKey: null });
  }
  const cell = session.board.cells.get(key);
  const tile = session.tiles.find((candidate) => candidate.id === tileId);
  if (cell === undefined || cell.fixed || tile === undefined || tile.usedBy !== null) {
    return Object.freeze({ session, correct: false, cellKey: key });
  }

  const released = releaseCellTile(session.tiles, session.tileByCell, key);
  const nextTiles = released.tiles.map((candidate) =>
    candidate.id === tile.id ? Object.freeze({ ...candidate, usedBy: key }) : candidate
  );
  const values = { ...session.values, [key]: tile.character };
  const tileByCell = { ...released.tileByCell, [key]: tile.id };
  const correct = tile.character === cell.answer;
  const scoreDelta = correct ? 20 : -10;

  const next = withCompletionState({
    ...session,
    values: immutableRecord(values),
    tileByCell: immutableRecord(tileByCell),
    tiles: Object.freeze(nextTiles),
    selectedCellKey: key,
    score: Math.max(0, session.score + scoreDelta),
    mistakes: session.mistakes + (correct ? 0 : 1)
  });
  return Object.freeze({ session: next, correct, cellKey: key });
}

export function removePuzzleCell(session: PuzzleSession, key: string): PuzzleSession {
  const cell = session.board.cells.get(key);
  if (cell === undefined || cell.fixed) return session;
  const released = releaseCellTile(session.tiles, session.tileByCell, key);
  const values = { ...session.values };
  delete values[key];
  return withCompletionState({
    ...session,
    values: immutableRecord(values),
    tileByCell: released.tileByCell,
    tiles: released.tiles,
    selectedCellKey: key,
    score: Math.max(0, session.score - 5)
  });
}

export function usePuzzleHint(session: PuzzleSession): HintResult {
  if (session.status === 'completed' || session.hintsUsed >= session.board.level.hintLimit) {
    return Object.freeze({ session, hintedCellKey: null });
  }
  const key = session.board.fillableKeys.find(
    (candidateKey) => session.values[candidateKey] !== session.board.cells.get(candidateKey)?.answer
  );
  if (key === undefined) return Object.freeze({ session, hintedCellKey: null });
  const answer = session.board.cells.get(key)?.answer;
  if (answer === undefined) return Object.freeze({ session, hintedCellKey: null });

  const released = releaseCellTile(session.tiles, session.tileByCell, key);
  const tile =
    released.tiles.find((candidate) => candidate.usedBy === null && candidate.character === answer) ??
    released.tiles.find((candidate) => candidate.character === answer);
  if (tile === undefined) return Object.freeze({ session, hintedCellKey: null });

  const values = { ...session.values };
  const tileByCell = { ...released.tileByCell };
  if (tile.usedBy !== null) {
    delete values[tile.usedBy];
    delete tileByCell[tile.usedBy];
  }
  values[key] = answer;
  tileByCell[key] = tile.id;

  const nextTiles = released.tiles.map((candidate) =>
    candidate.id === tile.id ? Object.freeze({ ...candidate, usedBy: key }) : candidate
  );
  const next = withCompletionState({
    ...session,
    values: immutableRecord(values),
    tileByCell: immutableRecord(tileByCell),
    tiles: Object.freeze(nextTiles),
    selectedCellKey: key,
    score: Math.max(0, session.score - 30),
    hintsUsed: session.hintsUsed + 1
  });
  return Object.freeze({ session: next, hintedCellKey: key });
}

export function clearPuzzleEntries(session: PuzzleSession): PuzzleSession {
  const tiles = session.tiles.map((tile) => Object.freeze({ ...tile, usedBy: null }));
  return Object.freeze({
    ...session,
    values: Object.freeze({}),
    tileByCell: Object.freeze({}),
    tiles: Object.freeze(tiles),
    selectedCellKey: session.board.fillableKeys[0] ?? null,
    status: 'playing',
    score: 0,
    correctCells: 0
  });
}

export function reorderPuzzleTiles(session: PuzzleSession, orderTiles: TileOrderer): PuzzleSession {
  const ordered = [...orderTiles(session.tiles)];
  if (ordered.length !== session.tiles.length) throw new Error('候選字排序不可改變字數。');
  const originalIds = [...session.tiles].map((tile) => tile.id).sort();
  const orderedIds = ordered.map((tile) => tile.id).sort();
  if (originalIds.some((id, index) => id !== orderedIds[index])) {
    throw new Error('候選字排序不可新增或移除字牌。');
  }
  return Object.freeze({ ...session, tiles: Object.freeze(ordered) });
}
