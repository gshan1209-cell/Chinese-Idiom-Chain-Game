export type Difficulty = 'easy' | 'normal' | 'hard';

export interface Idiom {
  readonly id: string;
  readonly text: string;
  readonly firstChar: string;
  readonly lastChar: string;
  readonly bopomofo: string;
  readonly pinyin: string;
  readonly meaning: string;
  readonly example: string;
  readonly source: string;
  readonly difficulty: Difficulty;
  readonly tags: readonly string[];
  readonly enabled: boolean;
  readonly version: number;
}

export interface IdiomDictionaryPayload {
  readonly schemaVersion: number;
  readonly dictionaryVersion: number;
  readonly count: number;
  readonly idioms: readonly Idiom[];
}

export interface IdiomIndexPayload {
  readonly schemaVersion: number;
  readonly dictionaryVersion: number;
  readonly firstCharIndex: Readonly<Record<string, readonly string[]>>;
  readonly lastCharIndex: Readonly<Record<string, readonly string[]>>;
}
