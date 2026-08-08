import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

import { writeChapterOneCardCatalog } from './build-card-catalog.mjs';

const difficultyModulePath = fileURLToPath(
  new URL('../src/cards/generated-card-difficulties.ts', import.meta.url)
);

const canonicalPath = fileURLToPath(
  new URL('../data/cards/chapter-1-card-catalog.json', import.meta.url)
);



function writeDifficultyModule(cards) {
  const entries = cards.map((card) =>
    `  ['${card.idiomId}', '${card.cardDifficultyCode}']`
  ).join(',\n');
  const content = `import type { IdiomDifficultyGrade } from './card-types.js';

const ENTRIES = Object.freeze([
${entries}
] as const satisfies readonly (readonly [string, IdiomDifficultyGrade])[]);

export const CHAPTER_ONE_CARD_DIFFICULTY_BY_ID: ReadonlyMap<
  string,
  IdiomDifficultyGrade
> = Object.freeze(new Map(ENTRIES));
`;
  mkdirSync(dirname(difficultyModulePath), { recursive: true });
  writeFileSync(difficultyModulePath, content, 'utf8');
}

const generatedCatalog = writeChapterOneCardCatalog();
writeDifficultyModule(generatedCatalog.cards);
writeChapterOneCardCatalog({ outputPath: canonicalPath });

console.log(`Emitted ${generatedCatalog.cards.length} canonical chapter-one card records.`);
