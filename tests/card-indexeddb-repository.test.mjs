import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';

import {
  createIndexedDbCardCollectionRepository
} from '../.test-dist/src/cards/indexeddb-collection-repository.js';

const sourceUrl = new URL('../src/cards/indexeddb-collection-repository.ts', import.meta.url);

test('exports an IndexedDB repository factory', () => {
  assert.equal(typeof createIndexedDbCardCollectionRepository, 'function');
});

test('uses a separate version-one database with three exact stores', async () => {
  const source = await readFile(sourceUrl, 'utf8');

  assert.match(source, /const DATABASE_NAME = 'cicg-card-collection';/u);
  assert.match(source, /const DATABASE_VERSION = 1;/u);
  assert.match(source, /const GRANTS_STORE = 'grants';/u);
  assert.match(source, /const INVENTORY_STORE = 'inventory';/u);
  assert.match(source, /const METADATA_STORE = 'metadata';/u);
  assert.match(source, /const METADATA_KEY = 'collection';/u);
  assert.doesNotMatch(source, /cicg-progress/u);
  assert.doesNotMatch(source, /DATABASE_VERSION = 2/u);
});

test('transacts grants inventory and metadata atomically', async () => {
  const source = await readFile(sourceUrl, 'utf8');
  const normalized = source.replace(/\s+/gu, ' ');

  assert.match(
    normalized,
    /database\.transaction\( \[GRANTS_STORE, INVENTORY_STORE, METADATA_STORE\], 'readwrite' \)/u
  );
  assert.match(source, /transaction\.oncomplete\s*=/u);
  assert.match(source, /transaction\.onerror\s*=/u);
  assert.match(source, /transaction\.onabort\s*=/u);
  assert.match(source, /transaction\.abort\(\)/u);
});

test('creates every store during the version-one upgrade', async () => {
  const source = await readFile(sourceUrl, 'utf8');

  for (const store of ['GRANTS_STORE', 'INVENTORY_STORE', 'METADATA_STORE']) {
    assert.match(
      source,
      new RegExp(`createObjectStore\\(${store}\\)`, 'u'),
      store
    );
  }
});
