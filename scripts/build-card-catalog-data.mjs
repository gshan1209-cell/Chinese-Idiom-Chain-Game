import { fileURLToPath, URL } from 'node:url';

import { writeChapterOneCardCatalog } from './build-card-catalog.mjs';

const canonicalPath = fileURLToPath(
  new URL('../data/cards/chapter-1-card-catalog.json', import.meta.url)
);

const generatedCatalog = writeChapterOneCardCatalog();
writeChapterOneCardCatalog({ outputPath: canonicalPath });

console.log(`Emitted ${generatedCatalog.cards.length} canonical chapter-one card records.`);
