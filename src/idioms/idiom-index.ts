import type { Idiom } from '../domain/idiom.js';

const SINGLE_HAN_CHARACTER = /^[\p{Script=Han}]$/u;
const FOUR_HAN_CHARACTERS = /^[\p{Script=Han}]{4}$/u;
const EMPTY_IDIOMS: readonly Idiom[] = Object.freeze([]);

export interface IdiomIndex {
  readonly byId: ReadonlyMap<string, Idiom>;
  readonly byText: ReadonlyMap<string, Idiom>;
  readonly byFirstChar: ReadonlyMap<string, readonly Idiom[]>;
  readonly byLastChar: ReadonlyMap<string, readonly Idiom[]>;
}

function appendCandidate(
  index: Map<string, Idiom[]>,
  character: string,
  idiom: Idiom
): void {
  const candidates = index.get(character);
  if (candidates === undefined) {
    index.set(character, [idiom]);
    return;
  }
  candidates.push(idiom);
}

function freezeCandidateMap(source: ReadonlyMap<string, Idiom[]>): ReadonlyMap<string, readonly Idiom[]> {
  return new Map(
    [...source.entries()].map(([character, idioms]) => [
      character,
      Object.freeze([...idioms])
    ])
  );
}

function assertIdiomShape(idiom: Idiom): void {
  if (!FOUR_HAN_CHARACTERS.test(idiom.text)) {
    throw new Error(`成語必須是四個中文字：${idiom.text}`);
  }
  const characters = [...idiom.text];
  if (idiom.firstChar !== characters[0] || idiom.lastChar !== characters[3]) {
    throw new Error(`成語首尾字資料不一致：${idiom.text}`);
  }
}

export function createIdiomIndex(idioms: readonly Idiom[]): IdiomIndex {
  const seenIds = new Set<string>();
  const seenTexts = new Set<string>();
  const byId = new Map<string, Idiom>();
  const byText = new Map<string, Idiom>();
  const mutableFirstChar = new Map<string, Idiom[]>();
  const mutableLastChar = new Map<string, Idiom[]>();

  for (const idiom of idioms) {
    assertIdiomShape(idiom);

    if (seenIds.has(idiom.id)) {
      throw new Error(`重複 id：${idiom.id}`);
    }
    if (seenTexts.has(idiom.text)) {
      throw new Error(`重複成語：${idiom.text}`);
    }

    seenIds.add(idiom.id);
    seenTexts.add(idiom.text);

    if (!idiom.enabled) continue;

    byId.set(idiom.id, idiom);
    byText.set(idiom.text, idiom);
    appendCandidate(mutableFirstChar, idiom.firstChar, idiom);
    appendCandidate(mutableLastChar, idiom.lastChar, idiom);
  }

  return Object.freeze({
    byId,
    byText,
    byFirstChar: freezeCandidateMap(mutableFirstChar),
    byLastChar: freezeCandidateMap(mutableLastChar)
  });
}

export function getCandidatesByFirstChar(
  index: IdiomIndex,
  character: string
): readonly Idiom[] {
  const normalized = character.trim();
  if (!SINGLE_HAN_CHARACTER.test(normalized)) return EMPTY_IDIOMS;
  return index.byFirstChar.get(normalized) ?? EMPTY_IDIOMS;
}

export function getIdiomByText(index: IdiomIndex, text: string): Idiom | null {
  const normalized = text.trim();
  if (!FOUR_HAN_CHARACTERS.test(normalized)) return null;
  return index.byText.get(normalized) ?? null;
}
