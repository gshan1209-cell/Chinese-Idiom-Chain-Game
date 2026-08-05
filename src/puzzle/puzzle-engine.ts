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
    .map((id) => board.level.placements.find((placement) => placement.id === id))
    .filter((placement): placement is PuzzlePlacement => placement !== undefined);

  if (candidates.length === 0) return null;

  const scored = candidates.map((placement) => {
    const placementKeys = getPlacementCellKeys(placement);
    const unresolvedCount = placementKeys.filter((key) => {
      const candidateCell = board.cells.get(key);
      if (candidateCell === undefined || candidateCell.fixed) return false;
      return values[key] !== candidateCell.answer;
    }).length;
    return { placement, unresolvedCount };
  });

  scored.sort((left, right) => {
    if (right.unresolvedCount !== left.unresolvedCount) {
      return right.unresolvedCount - left.unresolvedCount;
    }
    if (left.placement.direction !== right.placement.direction) {
      return left.placement.direction === 'horizontal' ? -1 : 1;
    }
    return left.placement.id.localeCompare(right.placement.id);
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
    board.fillableKeys.every((key) => session.values[key] === board.cells.get(key)?.answer);

  if (isCompleted) {
    return Object.freeze({ cellKey: null, preferredPlacementId: null });
  }

  const isEmptyCell = (key: string): boolean =>
    fillableKeysSet.has(key) && session.values[key] === undefined;

  const hasAnyEmptyCell = board.fillableKeys.some(isEmptyCell);

  if (!hasAnyEmptyCell) {
    const errorCellKeys = board.fillableKeys.filter(
      (key) =>
        session.values[key] !== undefined &&
        session.values[key] !== board.cells.get(key)?.answer
    );

    if (errorCellKeys.length === 0) {
      return Object.freeze({ cellKey: null, preferredPlacementId: null });
    }

    const sortedErrorCells = errorCellKeys
      .map((key) => board.cells.get(key))
      .filter((candidate): candidate is PuzzleCell => candidate !== undefined)
      .sort((left, right) => left.row - right.row || left.column - right.column);

    const targetKey = sortedErrorCells[0]?.key ?? null;
    if (targetKey === null) {
      return Object.freeze({ cellKey: null, preferredPlacementId: null });
    }
    return Object.freeze({
      cellKey: targetKey,
      preferredPlacementId: derivePreferredPlacementId(board, session.values, targetKey)
    });
  }

  // Stage 1: same placement forward.
  const currentPlacement = preferredPlacementId
    ? board.level.placements.find((placement) => placement.id === preferredPlacementId)
    : undefined;

  if (currentPlacement !== undefined) {
    const keys = getPlacementCellKeys(currentPlacement);
    const currentIndex = keys.indexOf(currentCellKey);
    if (currentIndex !== -1) {
      for (let index = currentIndex + 1; index < keys.length; index += 1) {
        const key = keys[index];
        if (key !== undefined && isEmptyCell(key)) {
          return Object.freeze({
            cellKey: key,
            preferredPlacementId: currentPlacement.id
          });
        }
      }
    }
  }

  // Stage 2: another placement crossing the current cell.
  const currentCell = board.cells.get(currentCellKey);
  const currentPlacementIds = currentCell?.placementIds ?? [];
  const crossingPlacements = currentPlacementIds
    .filter((placementId) => placementId !== preferredPlacementId)
    .map((placementId) =>
      board.level.placements.find((placement) => placement.id === placementId)
    )
    .filter((placement): placement is PuzzlePlacement => placement !== undefined);

  for (const crossingPlacement of crossingPlacements) {
    const keys = getPlacementCellKeys(crossingPlacement);
    const currentIndex = keys.indexOf(currentCellKey);
    if (currentIndex === -1) continue;

    for (let index = currentIndex + 1; index < keys.length; index += 1) {
      const key = keys[index];
      if (key !== undefined && isEmptyCell(key)) {
        return Object.freeze({
          cellKey: key,
          preferredPlacementId: crossingPlacement.id
        });
      }
    }

    for (const key of keys) {
      if (isEmptyCell(key)) {
        return Object.freeze({
          cellKey: key,
          preferredPlacementId: crossingPlacement.id
        });
      }
    }
  }

  // Stage 3: placements directly connected to a placement containing the current cell.
  const placementsContainingCurrentCell = currentPlacementIds
    .map((placementId) =>
      board.level.placements.find((placement) => placement.id === placementId)
    )
    .filter((placement): placement is PuzzlePlacement => placement !== undefined);

  const connectedPlacementIds = new Set<string>();
  for (const sourcePlacement of placementsContainingCurrentCell) {
    const sourceKeys = new Set(getPlacementCellKeys(sourcePlacement));
    for (const candidatePlacement of board.level.placements) {
      if (candidatePlacement.id === sourcePlacement.id) continue;
      if (getPlacementCellKeys(candidatePlacement).some((key) => sourceKeys.has(key))) {
        connectedPlacementIds.add(candidatePlacement.id);
      }
    }
  }

  const currentRow = currentCell?.row ?? 0;
  const currentColumn = currentCell?.column ?? 0;
  const connectedEmptyCells: Array<{
    readonly cell: PuzzleCell;
    readonly distance: number;
    readonly placementId: string;
  }> = [];

  for (const placementId of connectedPlacementIds) {
    const placement = board.level.placements.find(
      (candidate) => candidate.id === placementId
    );
    if (placement === undefined) continue;

    for (const key of getPlacementCellKeys(placement)) {
      if (!isEmptyCell(key)) continue;
      const candidateCell = board.cells.get(key);
      if (candidateCell === undefined) continue;
      connectedEmptyCells.push({
        cell: candidateCell,
        distance:
          Math.abs(candidateCell.row - currentRow) +
          Math.abs(candidateCell.column - currentColumn),
        placementId
      });
    }
  }

  connectedEmptyCells.sort(
    (left, right) =>
      left.distance - right.distance ||
      left.cell.row - right.cell.row ||
      left.cell.column - right.cell.column ||
      left.placementId.localeCompare(right.placementId)
  );

  const connectedTarget = connectedEmptyCells[0];
  if (connectedTarget !== undefined) {
    return Object.freeze({
      cellKey: connectedTarget.cell.key,
      preferredPlacementId: connectedTarget.placementId
    });
  }

  // Stage 4: nearest empty cell anywhere on the board.
  const allEmptyCells: Array<{ readonly cell: PuzzleCell; readonly distance: number }> = [];
  for (const key of board.fillableKeys) {
    if (!isEmptyCell(key)) continue;
    const candidateCell = board.cells.get(key);
    if (candidateCell === undefined) continue;
    allEmptyCells.push({
      cell: candidateCell,
      distance:
        Math.abs(candidateCell.row - currentRow) +
        Math.abs(candidateCell.column - currentColumn)
    });
  }

  allEmptyCells.sort(
    (left, right) =>
      left.distance - right.distance ||
      left.cell.row - right.cell.row ||
      left.cell.column - right.cell.column
  );

  const nearestTarget = allEmptyCells[0]?.cell;
  if (nearestTarget !== undefined) {
    return Object.freeze({
      cellKey: nearestTarget.key,
      preferredPlacementId: derivePreferredPlacementId(
        board,
        session.values,
        nearestTarget.key
      )
    });
  }

  return Object.freeze({ cellKey: null, preferredPlacementId: null });
}

function withCompletionState(
  session: Omit<PuzzleSession, 'status' | 'correctCells'>
): PuzzleSession {
  const correctCells = session.board.fillableKeys.filter(
    (key) => session.values[key] === session.board.cells.get(key)?.answer
  ).length;
  const status =
    correctCells === session.board.fillableKeys.length ? 'completed' : 'playing';
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
  return {
    tiles: Object.freeze(nextTiles),
    tileByCell: immutableRecord(nextTileByCell)
  };
}

export function createPuzzleSession(
  board: PuzzleBoard,
  orderTiles: TileOrderer
): PuzzleSession {
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
  return Object.freeze({
    ...session,
    selectedCellKey: key,
    preferredPlacementId: derivePreferredPlacementId(session.board, session.values, key)
  });
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
      session: Object.freeze({
        ...next,
        selectedCellKey: null,
        preferredPlacementId: null
      }),
      correct,
      cellKey: key
    });
  }

  const navigation = findNextPuzzleCell(next, key, session.preferredPlacementId);
  return Object.freeze({
    session: Object.freeze({
      ...next,
      selectedCellKey: navigation.cellKey,
      preferredPlacementId: navigation.preferredPlacementId
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

  return Object.freeze({
    ...next,
    selectedCellKey: key,
    preferredPlacementId: derivePreferredPlacementId(session.board, next.values, key)
  });
}

export function usePuzzleHint(session: PuzzleSession): HintResult {
  if (session.status === 'completed' || session.hintsUsed >= session.board.level.hintLimit) {
    return Object.freeze({ session, hintedCellKey: null });
  }
  const key = session.board.fillableKeys.find(
    (candidateKey) =>
      session.values[candidateKey] !== session.board.cells.get(candidateKey)?.answer
  );
  if (key === undefined) return Object.freeze({ session, hintedCellKey: null });
  const answer = session.board.cells.get(key)?.answer;
  if (answer === undefined) return Object.freeze({ session, hintedCellKey: null });

  const released = releaseCellTile(session.tiles, session.tileByCell, key);
  const tile =
    released.tiles.find(
      (candidate) => candidate.usedBy === null && candidate.character === answer
    ) ?? released.tiles.find((candidate) => candidate.character === answer);
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
      session: Object.freeze({
        ...next,
        selectedCellKey: null,
        preferredPlacementId: null
      }),
      hintedCellKey: key
    });
  }

  return Object.freeze({
    session: Object.freeze({
      ...next,
      selectedCellKey: key,
      preferredPlacementId: derivePreferredPlacementId(session.board, next.values, key)
    }),
    hintedCellKey: key
  });
}

export function clearPuzzleEntries(session: PuzzleSession): PuzzleSession {
  const tiles = session.tiles.map((tile) => Object.freeze({ ...tile, usedBy: null }));
  const initialKey = session.board.fillableKeys[0] ?? null;

  return Object.freeze({
    ...session,
    values: Object.freeze({}),
    tileByCell: Object.freeze({}),
    tiles: Object.freeze(tiles),
    selectedCellKey: initialKey,
    preferredPlacementId: derivePreferredPlacementId(session.board, {}, initialKey),
    status: 'playing',
    score: 0,
    correctCells: 0
  });
}

export function reorderPuzzleTiles(
  session: PuzzleSession,
  orderTiles: TileOrderer
): PuzzleSession {
  const ordered = [...orderTiles(session.tiles)];
  if (ordered.length !== session.tiles.length) {
    throw new Error('候選字排序不可改變字數。');
  }
  const originalIds = [...session.tiles].map((tile) => tile.id).sort();
  const orderedIds = ordered.map((tile) => tile.id).sort();
  if (originalIds.some((id, index) => id !== orderedIds[index])) {
    throw new Error('候選字排序不可新增或移除字牌。');
  }
  return Object.freeze({ ...session, tiles: Object.freeze(ordered) });
}
