import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HAN_IDIOM_PATTERN = /^[\p{Script=Han}]{4}$/u;
const DIFFICULTIES = new Set(['easy', 'normal', 'hard']);
const EXPECTED_HEADERS = [
  'id',
  'text',
  'bopomofo',
  'pinyin',
  'meaning',
  'example',
  'source',
  'difficulty',
  'tags',
  'enabled',
  'version'
];

export function validateIdiomRecord(record, rowNumber) {
  if (!HAN_IDIOM_PATTERN.test(record.text ?? '')) {
    throw new Error(`第 ${rowNumber} 列：成語文字必須是四個中文字。`);
  }

  if (typeof record.id !== 'string' || record.id.trim() === '') {
    throw new Error(`第 ${rowNumber} 列：id 為必填欄位。`);
  }

  if (typeof record.meaning !== 'string' || record.meaning.trim() === '') {
    throw new Error(`第 ${rowNumber} 列：meaning 為必填欄位。`);
  }

  if (!DIFFICULTIES.has(record.difficulty)) {
    throw new Error(`第 ${rowNumber} 列：difficulty 必須是 easy、normal 或 hard。`);
  }

  if (typeof record.enabled !== 'boolean') {
    throw new Error(`第 ${rowNumber} 列：enabled 必須是布林值。`);
  }

  if (!Number.isInteger(record.version) || record.version < 1) {
    throw new Error(`第 ${rowNumber} 列：version 必須是正整數。`);
  }

  return record;
}

function parseCsvRows(input) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === ',' && !quoted) {
      row.push(field);
      field = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') {
        index += 1;
      }
      row.push(field);
      if (row.some((value) => value.trim() !== '')) {
        rows.push(row);
      }
      row = [];
      field = '';
      continue;
    }

    field += char;
  }

  if (quoted) {
    throw new Error('CSV 格式錯誤：引號未正確結束。');
  }

  row.push(field);
  if (row.some((value) => value.trim() !== '')) {
    rows.push(row);
  }

  return rows;
}

function parseBoolean(value, rowNumber) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`第 ${rowNumber} 列：enabled 必須是 true 或 false。`);
}

function parseVersion(value, rowNumber) {
  const version = Number(value);
  if (!Number.isInteger(version) || version < 1) {
    throw new Error(`第 ${rowNumber} 列：version 必須是正整數。`);
  }
  return version;
}

export function parseCsv(input) {
  const rows = parseCsvRows(input.replace(/^\uFEFF/, ''));
  if (rows.length === 0) return [];

  const headers = rows[0].map((value) => value.trim());
  if (headers.join(',') !== EXPECTED_HEADERS.join(',')) {
    throw new Error(`CSV 欄位必須依序為：${EXPECTED_HEADERS.join(',')}`);
  }

  return rows.slice(1).map((values, rowIndex) => {
    const rowNumber = rowIndex + 2;
    if (values.length !== EXPECTED_HEADERS.length) {
      throw new Error(
        `第 ${rowNumber} 列：欄位數量應為 ${EXPECTED_HEADERS.length}，實際為 ${values.length}。`
      );
    }

    const record = Object.fromEntries(
      EXPECTED_HEADERS.map((header, index) => [header, values[index]?.trim() ?? ''])
    );

    return validateIdiomRecord(
      {
        id: record.id,
        text: record.text,
        bopomofo: record.bopomofo,
        pinyin: record.pinyin,
        meaning: record.meaning,
        example: record.example,
        source: record.source,
        difficulty: record.difficulty,
        tags: record.tags === '' ? [] : record.tags.split('|').map((tag) => tag.trim()),
        enabled: parseBoolean(record.enabled, rowNumber),
        version: parseVersion(record.version, rowNumber)
      },
      rowNumber
    );
  });
}

function appendToIndex(index, key, id) {
  if (!index[key]) index[key] = [];
  index[key].push(id);
}

export function buildDictionary(records) {
  const ids = new Set();
  const texts = new Set();
  const idioms = [];
  const firstCharIndex = {};
  const lastCharIndex = {};

  records.forEach((inputRecord, index) => {
    const record = validateIdiomRecord(inputRecord, index + 2);

    if (ids.has(record.id)) {
      throw new Error(`重複 id：${record.id}`);
    }
    if (texts.has(record.text)) {
      throw new Error(`重複成語：${record.text}`);
    }

    ids.add(record.id);
    texts.add(record.text);

    const firstChar = [...record.text][0];
    const lastChar = [...record.text].at(-1);
    const idiom = {
      ...record,
      firstChar,
      lastChar
    };
    idioms.push(idiom);

    if (record.enabled) {
      appendToIndex(firstCharIndex, firstChar, record.id);
      appendToIndex(lastCharIndex, lastChar, record.id);
    }
  });

  return { idioms, firstCharIndex, lastCharIndex };
}

export async function writeDictionaryArtifacts({ sourcePath, outputDirectory }) {
  const csv = await readFile(sourcePath, 'utf8');
  const records = parseCsv(csv);
  const dictionary = buildDictionary(records);
  const dictionaryVersion = Math.max(...dictionary.idioms.map((idiom) => idiom.version), 1);
  const idiomsPayload = {
    schemaVersion: 1,
    dictionaryVersion,
    count: dictionary.idioms.length,
    idioms: dictionary.idioms
  };
  const indexPayload = {
    schemaVersion: 1,
    dictionaryVersion,
    firstCharIndex: dictionary.firstCharIndex,
    lastCharIndex: dictionary.lastCharIndex
  };
  const idiomsJson = `${JSON.stringify(idiomsPayload, null, 2)}\n`;
  const indexJson = `${JSON.stringify(indexPayload, null, 2)}\n`;
  const checksum = createHash('sha256').update(idiomsJson).update(indexJson).digest('hex');
  const manifest = {
    schemaVersion: 1,
    dictionaryVersion,
    idiomCount: dictionary.idioms.length,
    checksum,
    files: {
      idioms: `idioms.v${dictionaryVersion}.json`,
      index: `idiom-index.v${dictionaryVersion}.json`
    }
  };

  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(path.join(outputDirectory, manifest.files.idioms), idiomsJson),
    writeFile(path.join(outputDirectory, manifest.files.index), indexJson),
    writeFile(path.join(outputDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  ]);

  return manifest;
}

async function main() {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const manifest = await writeDictionaryArtifacts({
    sourcePath: path.join(projectRoot, 'data', 'idioms.source.csv'),
    outputDirectory: path.join(projectRoot, 'public', 'generated')
  });
  console.log(
    `成語資料建置完成：v${manifest.dictionaryVersion}，共 ${manifest.idiomCount} 筆，checksum ${manifest.checksum.slice(0, 12)}。`
  );
}

const isDirectExecution =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
