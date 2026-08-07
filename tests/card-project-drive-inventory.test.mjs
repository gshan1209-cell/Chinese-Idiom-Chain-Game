import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';

const inventoryUrl = new URL(
  '../data/drive-assets/project-inventory-2026-08-07.json',
  import.meta.url,
);
const schemaUrl = new URL(
  '../data/drive-assets/project-inventory.schema.json',
  import.meta.url,
);

async function readJson(url) {
  return JSON.parse(await readFile(url, 'utf8'));
}

test('defines an immutable Phase 2 inventory schema', async () => {
  const schema = await readJson(schemaUrl);
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.deepEqual(schema.required, [
    'schemaVersion',
    'capturedAt',
    'sourceCommit',
    'complete',
    'roots',
    'resources',
    'orphanResourceIds',
    'warnings',
  ]);
});

test('captures all eight fixed project roots', async () => {
  const inventory = await readJson(inventoryUrl);
  assert.equal(inventory.schemaVersion, 1);
  assert.equal(inventory.complete, true);
  assert.match(inventory.sourceCommit, /^[a-f0-9]{40}$/);
  assert.deepEqual(
    inventory.roots.map(({ name }) => name).sort(),
    [
      '00_Project_Management',
      '01_Design_And_Specs',
      '02_UI_UX_And_Visuals',
      '03_Game_Content_And_Data',
      '04_Testing_And_Evidence',
      '05_Releases_And_Store_Assets',
      '80_Inbox',
      '90_Archive',
    ].sort(),
  );
});

test('records the known Phase 2 resources without declaring them approved', async () => {
  const inventory = await readJson(inventoryUrl);
  assert.ok(inventory.resources.some(({ name }) => name === 'Asset_Control_Center'));
  assert.ok(inventory.resources.some(({ name }) => name === 'Game_Backgrounds'));
  assert.equal(
    inventory.resources.filter(({ name }) => /^CICG_BG_\d+_/.test(name)).length,
    7,
  );
  assert.equal(
    inventory.resources.filter(({ name }) => /^CICG_BG_\d+_/.test(name))
      .some(({ lifecycleClaim }) => lifecycleClaim === 'approved'),
    false,
  );
});

test('records empty project roots and the existing Phase 1 entry points', async () => {
  const inventory = await readJson(inventoryUrl);
  const resources = new Map(inventory.resources.map((resource) => [resource.name, resource]));
  assert.equal(resources.get('03_Game_Content_And_Data')?.directChildCount, 0);
  assert.equal(resources.get('04_Testing_And_Evidence')?.directChildCount, 0);
  assert.equal(resources.get('05_Releases_And_Store_Assets')?.directChildCount, 0);
  assert.ok(inventory.resources.some(({ name, parentDriveId }) => (
    name === 'Idiom_Cards'
    && parentDriveId === '1cH0KYWGvUT5ci57HW8JBFv3v-8uG51IC'
  )));
  assert.ok(inventory.resources.some(({ name, parentDriveId }) => (
    name === 'Idiom_Cards'
    && parentDriveId === '1h_yncfl1MHcZy7IKrP3dGfmNC5lVGfuV'
  )));
  assert.ok(inventory.resources.some(({ name, parentDriveId }) => (
    name === 'Idiom_Cards'
    && parentDriveId === '1nqvBeExct6jW_1TJ-be_eGZ-wJIK-TJr'
  )));
});

test('inventory resources use stable evidence fields', async () => {
  const inventory = await readJson(inventoryUrl);
  for (const resource of inventory.resources) {
    assert.ok(['file', 'folder'].includes(resource.resourceKind));
    assert.equal(typeof resource.driveResourceId, 'string');
    assert.equal(typeof resource.name, 'string');
    assert.ok(resource.parentDriveId === null || typeof resource.parentDriveId === 'string');
    assert.equal(typeof resource.mimeType, 'string');
    assert.ok(resource.sizeBytes === null || Number.isInteger(resource.sizeBytes));
    assert.equal(typeof resource.modifiedTime, 'string');
    assert.equal(typeof resource.webViewLink, 'string');
    assert.ok(resource.folderKey === null || typeof resource.folderKey === 'string');
    assert.ok(resource.assetRecordId === null || typeof resource.assetRecordId === 'string');
    assert.ok(['none', 'review', 'approved', 'inbox', 'archive', 'reference'].includes(
      resource.lifecycleClaim,
    ));
  }
});
