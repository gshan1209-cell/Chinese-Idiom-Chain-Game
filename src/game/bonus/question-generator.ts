import type { BonusQuestion, BonusQuestionChoice } from '../../domain/bonus.js';
import type { Idiom } from '../../domain/idiom.js';
import type { IdiomIndex } from '../../idioms/idiom-index.js';

const HAN = /^[\p{Script=Han}]$/u;

export interface QuestionGeneratorOptions {
  readonly pickIndex?: (length: number) => number;
  readonly createQuestionId?: () => string;
}

function defaultPickIndex(length: number): number {
  return Math.floor(Math.random() * length);
}

function defaultQuestionId(): string {
  return `bonus-question-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function finalToken(value: string): string {
  const tokens = value.trim().split(/\s+/).filter(Boolean);
  return tokens.at(-1)?.toLocaleLowerCase() ?? '';
}

function pickAndRemove<T>(values: T[], pickIndex: (length: number) => number): T {
  const selectedIndex = pickIndex(values.length);
  if (!Number.isInteger(selectedIndex) || selectedIndex < 0 || selectedIndex >= values.length) {
    throw new Error(`選取索引超出範圍：${selectedIndex}`);
  }
  const selected = values.splice(selectedIndex, 1)[0];
  if (selected === undefined) throw new Error('無法選取題目資料。');
  return selected;
}

function shuffled<T>(values: readonly T[], pickIndex: (length: number) => number): T[] {
  const pool = [...values];
  const result: T[] = [];
  while (pool.length > 0) result.push(pickAndRemove(pool, pickIndex));
  return result;
}

function addTail(target: string[], seen: Set<string>, idiom: Idiom): void {
  const tail = idiom.lastChar;
  if (!HAN.test(tail) || seen.has(tail)) return;
  seen.add(tail);
  target.push(tail);
}

function safeDistractors(
  index: IdiomIndex,
  idiom: Idiom,
  pickIndex: (length: number) => number
): string[] {
  const prefix = [...idiom.text].slice(0, 3).join('');
  const all = [...index.byId.values()];
  const bopomofo = finalToken(idiom.bopomofo);
  const pinyin = finalToken(idiom.pinyin);
  const prioritized: string[] = [];
  const seen = new Set<string>([idiom.lastChar]);

  if (bopomofo !== '') {
    for (const candidate of all) {
      if (candidate.id !== idiom.id && finalToken(candidate.bopomofo) === bopomofo) {
        addTail(prioritized, seen, candidate);
      }
    }
  }
  if (pinyin !== '') {
    for (const candidate of all) {
      if (candidate.id !== idiom.id && finalToken(candidate.pinyin) === pinyin) {
        addTail(prioritized, seen, candidate);
      }
    }
  }
  for (const candidate of all) {
    if (candidate.id !== idiom.id && candidate.difficulty === idiom.difficulty) {
      addTail(prioritized, seen, candidate);
    }
  }
  for (const candidate of all) {
    if (candidate.id !== idiom.id) addTail(prioritized, seen, candidate);
  }

  return shuffled(
    prioritized.filter((character) => !index.byText.has(`${prefix}${character}`)),
    pickIndex
  ).slice(0, 3);
}

function chooseCorrectHole(
  holeCount: 6 | 9,
  recentCorrectHoles: readonly number[],
  pickIndex: (length: number) => number
): number {
  const holes = Array.from({ length: holeCount }, (_, index) => index);
  const last = recentCorrectHoles.at(-1);
  const previous = recentCorrectHoles.at(-2);
  const forbidden = last !== undefined && last === previous ? last : null;
  const candidates = forbidden === null ? holes : holes.filter((hole) => hole !== forbidden);
  return candidates[pickIndex(candidates.length)] ?? candidates[0] ?? 0;
}

export function createBonusQuestion(
  index: IdiomIndex,
  usedIdiomIds: ReadonlySet<string>,
  holeCount: 6 | 9,
  recentCorrectHoles: readonly number[],
  options: QuestionGeneratorOptions = {}
): BonusQuestion | null {
  const pickIndex = options.pickIndex ?? defaultPickIndex;
  const candidates = shuffled(
    [...index.byId.values()].filter((idiom) => !usedIdiomIds.has(idiom.id)),
    pickIndex
  );

  for (const idiom of candidates) {
    const characters = [...idiom.text];
    const answer = characters[3];
    if (answer === undefined || !HAN.test(answer)) continue;
    const distractors = safeDistractors(index, idiom, pickIndex);
    if (distractors.length < 3) continue;

    const correctHoleIndex = chooseCorrectHole(holeCount, recentCorrectHoles, pickIndex);
    const availableHoles = Array.from({ length: holeCount }, (_, hole) => hole).filter(
      (hole) => hole !== correctHoleIndex
    );
    const distractorHoles = shuffled(availableHoles, pickIndex).slice(0, 3);
    const choices: BonusQuestionChoice[] = [
      { holeIndex: correctHoleIndex, character: answer },
      ...distractors.map((character, index) => ({
        holeIndex: distractorHoles[index] ?? availableHoles[index] ?? index,
        character
      }))
    ].sort((left, right) => left.holeIndex - right.holeIndex);

    return Object.freeze({
      id: (options.createQuestionId ?? defaultQuestionId)(),
      idiomId: idiom.id,
      idiomText: idiom.text,
      prompt: `${characters.slice(0, 3).join('')}＿`,
      answer,
      choices: Object.freeze(choices.map((choice) => Object.freeze(choice))),
      correctHoleIndex,
      holeCount
    });
  }

  return null;
}
