import type { Idiom } from '../domain/idiom.js';
import type { PuzzleBoard } from '../domain/puzzle.js';

export function buildSafeTrapCharacters(
  board: PuzzleBoard,
  idioms: readonly Idiom[],
  excludedCharacters: readonly string[] = Object.freeze([])
): readonly string[] {
  const forbidden = new Set<string>([
    ...board.candidateCharacters,
    ...[...board.cells.values()].map((cell) => cell.answer),
    ...excludedCharacters
  ]);
  const safe = new Set<string>();

  for (const idiom of idioms) {
    if (!idiom.enabled) continue;
    for (const character of idiom.text) {
      if (!forbidden.has(character)) safe.add(character);
    }
  }

  return Object.freeze([...safe]);
}
