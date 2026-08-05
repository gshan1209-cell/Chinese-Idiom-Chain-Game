import type {
  HintResult,
  PlaceTileResult,
  PuzzleBoard,
  PuzzleCell,
  PuzzlePlacement,
  PuzzleSession,
  PuzzleTile
} from '../domain/puzzle.js';
import { cellKey } from '../domain/puzzle.js';

export type TileOrderer = (items: readonly PuzzleTile[]) => readonly PuzzleTile[];

export interface PuzzleNavigationResult {
  readonly cellKey: string | null;
  readonly preferredPlacementId: string | null;
}

function immutableRecord<T>(record: Record<string, T>): Readonly<Record<string, T>> {
  return Object.freeze({ ...record });
}

function getPlacementCellKeys(placement: PuzzlePlacement): string[] {
  const keys: string[] = [];
  for (let i = 0; i < placement.text.length; i++) {
    const r = placement.direction === 'horizontal' ? placement.startRow : placement.startRow + i;
    const c = placement.direction === 'horizontal' ? placement.startColumn + i : placement.startColumn;
    keys.push(cellKey(r, c));
  }
  return keys;
}

export function derivePreferredPlacementId(
  board: PuzzleBoard,
  values: Readonly<Record<string, string>>,
  cellKeyStr: string | null
): string | null {
  if (cellKeyStr === null) return null;
  const cell = board.cells.get(cellKeyStr);
  if (cell === undefined || cell.placementIds.length === 0) return null;
  if (cell.placementIds.length === 1) return cell.placementIds[0] ?? null;

  const candidates = cell.placementIds
    .map((id) => board.level.placements.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  if (candidates.length === 0) return null;

  const scored = candidates.map((placement) => {
    const pKeys = getPlacementCellKeys(placement);
    const unresolvedCount = pKeys.filter((k) => {
      const c = board.cells.get(k);
      if (c === undefined || c.fixed) return false;
      return values[k] !== c.answer;
    }).length;
    return { placement, unresolvedCount };
  });

  scored.sort((a, b) => {
    if (b.unresolvedCount !== a.unresolvedCount) {
      return b.unresolvedCount - a.unresolvedCount;
    }
    if (a.placement.direction !== b.placement.direction) {
      return a.placement.direction === 'horizontal' ? -1 : 1;
    }
    return a.placement.id.localeCompare(b.placement.id);
  });

  return scored[0]?.placement.id ?? null;
}

export function findNextPuzzleCell(
  session: PuzzleSession,
  currentCellKey: string,
  preferredPlacementId: string | null
): PuzzleNavigationResult {
  const board = session.board;
  const fillableKeysSet = new Set(board.fillableKeys);

  const isCompleted =
    session.status === 'completed' ||
    board.fillableKeys.every((k) => session.values[k] === board.cells.get(k)?.answer);

  if (isCompleted) {
    return Object.freeze({ cellKey: null, preferredPlacementId: null });
  }

  const isEmptyCell = (k: string): boolean => fillableKeysSet.has(k) && session.values[k] === undefined;

  const hasAnyEmptyCell = board.fillableKeys.some(isEmptyCell);

  if (!hasAnyEmptyCell) {
    const errorCellKeys = board.fillableKeys.filter(
      (k) => session.values[k] !== undefined && session.values[k] !== board.cells.get(k)?.answer
    );

    if (errorCellKeys.length === 0) {
      return Object.freeze({ cellKey: null, preferredPlacementId: null });
    }

    const sortedErrorCells = errorCellKeys
      .map((k) => board.cells.get(k))
      .filter((c): c is PuzzleCell => c !== undefined)
      .sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.column - b.column;
      });

    const targetKey = sortedErrorCells[0]?.key ?? null;
    if (targetKey === null) {
      return Object.freeze({ cellKey: null, preferredPlacementId: null });
    }
    const targetPrefId = derivePreferredPlacementId(board, session.values, targetKey);
    return Object.freeze({ cellKey: targetKey, preferredPlacementId: targetPrefId });
  }

  // Stage 1: Same placement forward
  const currentPlacement = preferredPlacementId
    ? board.level.placements.find((p) => p.id === preferredPlacementId)
    : undefined;

  if (currentPlacement !== undefined) {
    const keys = getPlacementCellKeys(currentPlacement);
    const curIdx = keys.indexOf(currentCellKey);
    if (curIdx !== -1) {
      for (let i = curIdx + 1; i < keys.length; i++) {
        const k = keys[i];
        if (k !== undefined && isEmptyCell(k)) {
          return Object.freeze({ cellKey: k, preferredPlacementId: currentPlacement.id });
        }
      }
    }
  }

  // Stage 2: Crossing placement
  const curCell = board.cells.get(currentCellKey);
  const curPlacementIds = curCell?.placementIds ?? [];
  const crossPlacements = curPlacementIds
    .filter((id) => id !== preferredPlacementId)
    .map((id) => board.level.placements.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  for (const crossP of crossPlacements) {
    const keys = getPlacementCellKeys(crossP);
    const curIdx = keys.indexOf(currentCellKey);
    if (curIdx !== -1) {
      for (let i = curIdx + 1; i < keys.length; i++) {
        const k = keys[i];
        if (k !== undefined && isEmptyCell(k)) {
          return Object.freeze({ cellKey: k, preferredPlacementId: crossP.id });
        }
      }
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (k !== undefined && isEmptyCell(k)) {
          return Object.freeze({ cellKey: k, preferredPlacementId: crossP.id });
        }
      }
    }
  }

  // Stage 3: Directly connected placements
  const allCurrentPlacements = curPlacementIds
    .map((id) => board.level.placements.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  const connectedPlacementIds = new Set<string>();
  for (const cp of allCurrentPlacements) {
    const cpKeys = new Set(getPlacementCellKeys(cp));
    for (const p of board.level.placements) {
      if (p.id !== cp.id) {
        const pKeys = getPlacementCellKeys(p);
        if (pKeys.some((k) => cpKeys.has(k))) {
          connectedPlacementIds.add(p.id);
        }
      }
    }
  }

  const curRow = curCell ? curCell.row : 0;
  const curCol = curCell ? curCell.column : 0;

  const connectedEmptyCells: Array<{ cell: PuzzleCell; distance: number }> = [];
  for (const pId of connectedPlacementIds) {
    const p = board.level.placements.find((item) => item.id === pId);
    if (p === undefined) continue;
    const keys = getPlacementCellKeys(p);
    for (const k of keys) {
      if (isEmptyCell(k)) {
        const c = board.cells.get(k);
        if (c !== undefined) {
          const dist = Math.abs(c.row - curRow) + Math.abs(c.column - curCol);
          connectedEmptyCells.push({ cell: c, distance: dist });
        }
      }
    }
  }

  if (connectedEmptyCells.length > 0) {
    connectedEmptyCells.sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      if (a.cell.row !== b.cell.row) return a.cell.row - b.cell.row;
      return a.cell.column - b.cell.column;
    });

    const targetKey = connectedEmptyCells[0]?.cell.key ?? null;
    if (targetKey !== null) {
      const targetPrefId = derivePreferredPlacementId(board, session.values, targetKey);
      return Object.freeze({ cellKey: targetKey, preferredPlacementId: targetPrefId });
    }
  }

  // Stage 4: All-board nearest empty cell
  const allEmptyCells: Array<{ cell: PuzzleCell; distance: number }> = [];
  for (const k of board.fillableKeys) {
    if (isEmptyCell(k)) {
      const c = board.cells.get(k);
      if (c !== undefined) {
        const dist = Math.abs(c.row - curRow) + Math.abs(c.column - curCol);
        allEmptyCells.push({ cell: c, distance: dist });
      }
    }
  }

  if (allEmptyCells.length > 0) {
    allEmptyCells.sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      if (a.cell.row !== b.cell.row) return a.cell.row - b.cell.row;
      return a.cell.column - b.cell.column;
    });

    const targetKey = allEmptyCells[0]?.cell.key ?? null;
    if (targetKey !== null) {
      const targetPrefId = derivePreferredPlacementId(board, session.values, targetKey);
      return Object.freeze({ cellKey: targetKey, preferredPlacementId: targetPrefId });
    }
  }

  return Object.freeze({ cellKey: null, preferredPlacementId: null });
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

  const initialKey = board.fillableKeys[0] ?? null;
  const preferredPlacementId = derivePreferredPlacementId(board, {}, initialKey);

  return Object.freeze({
    board,
    values: Object.freeze({}),
    tileByCell: Object.freeze({}),
    tiles: orderedTiles,
    selectedCellKey: initialKey,
    preferredPlacementId,
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
  const preferredPlacementId = derivePreferredPlacementId(session.board, session.values, key);
  return Object.freeze({ ...session, selectedCellKey: key, preferredPlacementId });
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
    preferredPlacementId: session.preferredPlacementId,
    score: Math.max(0, session.score + scoreDelta),
    mistakes: session.mistakes + (correct ? 0 : 1)
  });

  if (next.status === 'completed') {
    return Object.freeze({
      session: Object.freeze({ ...next, selectedCellKey: null, preferredPlacementId: null }),
      correct,
      cellKey: key
    });
  }

  const nav = findNextPuzzleCell(next, key, session.preferredPlacementId);
  return Object.freeze({
    session: Object.freeze({
      ...next,
      selectedCellKey: nav.cellKey,
      preferredPlacementId: nav.preferredPlacementId
    }),
    correct,
    cellKey: key
  });
}

export function removePuzzleCell(session: PuzzleSession, key: string): PuzzleSession {
  const cell = session.board.cells.get(key);
  if (cell === undefined || cell.fixed) return session;
  const released = releaseCellTile(session.tiles, session.tileByCell, key);
  const values = { ...session.values };
  delete values[key];

  const next = withCompletionState({
    ...session,
    values: immutableRecord(values),
    tileByCell: released.tileByCell,
    tiles: released.tiles,
    selectedCellKey: key,
    preferredPlacementId: session.preferredPlacementId,
    score: Math.max(0, session.score - 5)
  });

  if (next.status === 'completed') {
    return Object.freeze({ ...next, selectedCellKey: null, preferredPlacementId: null });
  }

  const preferredPlacementId = derivePreferredPlacementId(session.board, next.values, key);
  return Object.freeze({ ...next, selectedCellKey: key, preferredPlacementId });
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
    preferredPlacementId: session.preferredPlacementId,
    score: Math.max(0, session.score - 30),
    hintsUsed: session.hintsUsed + 1
  });

  if (next.status === 'completed') {
    return Object.freeze({
      session: Object.freeze({ ...next, selectedCellKey: null, preferredPlacementId: null }),
      hintedCellKey: key
    });
  }

  const preferredPlacementId = derivePreferredPlacementId(session.board, next.values, key);
  return Object.freeze({
    session: Object.freeze({ ...next, selectedCellKey: key, preferredPlacementId }),
    hintedCellKey: key
  });
}

export function clearPuzzleEntries(session: PuzzleSession): PuzzleSession {
  const tiles = session.tiles.map((tile) => Object.freeze({ ...tile, usedBy: null }));
  const initialKey = session.board.fillableKeys[0] ?? null;
  const preferredPlacementId = derivePreferredPlacementId(session.board, {}, initialKey);

  return Object.freeze({
    ...session,
    values: Object.freeze({}),
    tileByCell: Object.freeze({}),
    tiles: Object.freeze(tiles),
    selectedCellKey: initialKey,
    preferredPlacementId,
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
