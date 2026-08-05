import type { IdiomDictionaryPayload } from '../domain/idiom.js';
import type { Idiom } from '../domain/idiom.js';
import { createIdiomIndex, type IdiomIndex } from './idiom-index.js';

interface DictionaryResponse {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
}

export type DictionaryFetcher = (url: string) => Promise<DictionaryResponse>;

export interface DictionaryLoadResult {
  readonly payload: IdiomDictionaryPayload;
  readonly index: IdiomIndex;
}

interface DictionaryManifest {
  readonly dictionaryVersion: number;
  readonly files: {
    readonly idioms: string;
  };
}

const DIFFICULTIES = new Set(['easy', 'normal', 'hard']);
const FOUR_HAN_CHARACTERS = /^[\p{Script=Han}]{4}$/u;

function defaultFetcher(url: string): Promise<DictionaryResponse> {
  const runtime = globalThis as unknown as { fetch(input: string): Promise<DictionaryResponse> };
  if (typeof runtime.fetch !== 'function') {
    return Promise.reject(new Error('目前環境不支援載入成語字典。'));
  }
  return runtime.fetch(url);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseManifest(value: unknown): DictionaryManifest {
  if (!isRecord(value) || !Number.isInteger(value.dictionaryVersion) || !isRecord(value.files)) {
    throw new Error('字典資訊格式錯誤。');
  }
  const idioms = value.files.idioms;
  if (typeof idioms !== 'string' || idioms.trim() === '' || idioms.includes('/') || idioms.includes('..')) {
    throw new Error('字典資訊格式錯誤。');
  }
  return {
    dictionaryVersion: value.dictionaryVersion as number,
    files: { idioms }
  };
}

function parseTags(value: unknown): readonly string[] | null {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) return null;
  return Object.freeze([...value]);
}

function parseIdiom(value: unknown): Idiom | null {
  if (!isRecord(value)) return null;
  const tags = parseTags(value.tags);
  if (
    typeof value.id !== 'string' ||
    typeof value.text !== 'string' ||
    !FOUR_HAN_CHARACTERS.test(value.text) ||
    typeof value.firstChar !== 'string' ||
    typeof value.lastChar !== 'string' ||
    value.firstChar !== [...value.text][0] ||
    value.lastChar !== [...value.text].at(-1) ||
    typeof value.bopomofo !== 'string' ||
    typeof value.pinyin !== 'string' ||
    typeof value.meaning !== 'string' ||
    value.meaning.trim() === '' ||
    typeof value.example !== 'string' ||
    typeof value.source !== 'string' ||
    typeof value.difficulty !== 'string' ||
    !DIFFICULTIES.has(value.difficulty) ||
    tags === null ||
    typeof value.enabled !== 'boolean' ||
    !Number.isInteger(value.version) ||
    (value.version as number) < 1
  ) {
    return null;
  }

  return Object.freeze({
    id: value.id,
    text: value.text,
    firstChar: value.firstChar,
    lastChar: value.lastChar,
    bopomofo: value.bopomofo,
    pinyin: value.pinyin,
    meaning: value.meaning,
    example: value.example,
    source: value.source,
    difficulty: value.difficulty as Idiom['difficulty'],
    tags,
    enabled: value.enabled,
    version: value.version as number
  });
}

function parsePayload(value: unknown): IdiomDictionaryPayload {
  if (
    !isRecord(value) ||
    !Number.isInteger(value.schemaVersion) ||
    !Number.isInteger(value.dictionaryVersion) ||
    !Number.isInteger(value.count) ||
    !Array.isArray(value.idioms)
  ) {
    throw new Error('字典資料格式錯誤。');
  }

  const idioms = value.idioms.map((item) => {
    const idiom = parseIdiom(item);
    if (idiom === null) {
      throw new Error('字典資料格式錯誤。');
    }
    return idiom;
  });
  if (value.count !== idioms.length) {
    throw new Error(`字典筆數不一致：標示 ${String(value.count)} 筆，實際 ${idioms.length} 筆。`);
  }

  return Object.freeze({
    schemaVersion: value.schemaVersion,
    dictionaryVersion: value.dictionaryVersion,
    count: value.count,
    idioms: Object.freeze(idioms)
  });
}

async function fetchJson(fetcher: DictionaryFetcher, url: string, label: string): Promise<unknown> {
  const response = await fetcher(url);
  if (!response.ok) {
    throw new Error(`${label}載入失敗（HTTP ${response.status}）。`);
  }
  try {
    return await response.json();
  } catch {
    throw new Error(`${label}不是有效的 JSON。`);
  }
}

export async function loadDictionary(
  fetcher: DictionaryFetcher = defaultFetcher
): Promise<DictionaryLoadResult> {
  const manifest = parseManifest(
    await fetchJson(fetcher, '/generated/manifest.json', '字典資訊')
  );
  const payload = parsePayload(
    await fetchJson(fetcher, `/generated/${manifest.files.idioms}`, '成語字典')
  );

  if (payload.dictionaryVersion !== manifest.dictionaryVersion) {
    throw new Error('字典版本不一致，請重新整理後再試。');
  }

  let index: IdiomIndex;
  try {
    index = createIdiomIndex(payload.idioms);
  } catch {
    throw new Error('字典資料格式錯誤。');
  }
  if (index.byId.size === 0) {
    throw new Error('字典中沒有可使用的成語。');
  }

  return Object.freeze({ payload, index });
}
