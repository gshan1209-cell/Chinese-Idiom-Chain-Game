import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';

import {
  validateDriveRegistryCrossLinks,
  validateProjectAssetFolderAssignments,
  validateProjectAssetRegistry,
} from '../.test-dist/src/cards/drive-assets/index.js';

const projectRegistryUrl = new URL(
  '../data/drive-assets/project-assets.json',
  import.meta.url,
);
const projectSchemaUrl = new URL(
  '../data/drive-assets/project-asset.schema.json',
  import.meta.url,
);
const folderRegistryUrl = new URL(
  '../data/drive-assets/drive-folders.json',
  import.meta.url,
);
const idiomRegistryUrl = new URL(
  '../data/drive-assets/idiom-card-assets.json',
  import.meta.url,
);
const batchLedgerUrl = new URL(
  '../data/drive-assets/migrations/2026-08-07-phase2-batch1-control-center-backgrounds.json',
  import.meta.url,
);

async function readJson(url) {
  return JSON.parse(await readFile(url, 'utf8'));
}

const expectedBackgrounds = new Map([
  ['bg-home-portrait@1.0-review', {
    driveFileId: '1Ygo9pJmQoRvdUalyrk-Ukd-LsoiA5jL7',
    sha256: '5b6301397f7ac4c1ea9a66a1ee0ea2e80843ddd31b9d75e0220b5465dde93b73',
    sizeBytes: 2147544,
  }],
  ['bg-campaign-map-portrait@1.0-review', {
    driveFileId: '1JfSu6hoG628J4I0hNfbAZrqBzcQ2KTny',
    sha256: 'a26325eaaaf67633a7b976e97c18a29c905e563198af50acc12f64f7997008c3',
    sizeBytes: 2802331,
  }],
  ['bg-puzzle-portrait@1.0-review', {
    driveFileId: '1Y7vNUwGO-gC99XwabunRxPJhNl4F-6Pm',
    sha256: '480518e23a7c4c67991341b53fc777c8152be675f53c114553016ded7560c0da',
    sizeBytes: 2299453,
  }],
  ['bg-level-complete-portrait@1.0-review', {
    driveFileId: '1wRlN-boi2UAkdSaQFceAb1x76mcltbgH',
    sha256: '67d571698d6cc709046e711b792299aadb17c785692b6d9582df3d0d46953132',
    sizeBytes: 2151977,
  }],
  ['bg-classic-chain-portrait@1.0-review', {
    driveFileId: '1Ik-tQ43n2yCnq-cWyvWkvHOpxrOn5NH4',
    sha256: '08d853cb3aac001fabddde3b80c1ceecd46439abdf2f3c1c15555703a8ac4dfa',
    sizeBytes: 2434893,
  }],
  ['bg-whackamole-portrait@1.0-review', {
    driveFileId: '1aM0tJt5V5WruaSAT_VnKgjpBu8Gr_vxN',
    sha256: 'f11f43c00d1a65ef3fe6b34e4b3b09404aca83d518a46c8a1b5cc7b20a3ae54d',
    sizeBytes: 2468559,
  }],
  ['bg-media-center-portrait@1.0-review', {
    driveFileId: '1DmeiHJvSsv8Sh1LqFEn5Bh7CN6_JW3yq',
    sha256: '2ed72f5f752ea863d7a7fe690bb71d575732bd27d4cf929476a451784c070d9d',
    sizeBytes: 2246041,
  }],
]);

test('defines the generic project asset registry schema', async () => {
  const schema = await readJson(projectSchemaUrl);
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(schema.required, ['schemaVersion', 'updatedAt', 'assets']);
});

test('registers one dashboard and exactly seven review backgrounds', async () => {
  const registry = await readJson(projectRegistryUrl);
  assert.equal(registry.schemaVersion, 1);
  assert.equal(registry.assets.filter(({ role }) => role === 'dashboard').length, 1);

  const backgrounds = registry.assets.filter(({ domain }) => domain === 'background');
  assert.equal(backgrounds.length, 7);
  assert.ok(backgrounds.every(({ lifecycleStatus, approvalStatus, currentMaster }) => (
    lifecycleStatus === 'review'
    && approvalStatus === 'pending'
    && currentMaster === false
  )));

  for (const background of backgrounds) {
    const expected = expectedBackgrounds.get(background.recordId);
    assert.ok(expected, `unexpected background record ${background.recordId}`);
    assert.equal(background.driveFileId, expected.driveFileId);
    assert.equal(background.sha256, expected.sha256);
    assert.equal(background.sizeBytes, expected.sizeBytes);
    assert.equal(background.widthPx, 941);
    assert.equal(background.heightPx, 1672);
    assert.equal(background.parentFolderKey, 'visuals.game-backgrounds.review');
  }
});

test('registers the four existing Phase 2 folders without changing Drive parents', async () => {
  const folderRegistry = await readJson(folderRegistryUrl);
  const folders = new Map(folderRegistry.folders.map((folder) => [folder.folderKey, folder]));

  assert.deepEqual(folders.get('project.management.asset-control-center'), {
    folderKey: 'project.management.asset-control-center',
    driveFolderId: '16p7x1-uISZShEkppN68Fwqn-epm44Uok',
    name: 'Asset_Control_Center',
    parentFolderKey: 'project.management',
    lifecycleRole: 'container',
  });
  assert.deepEqual(folders.get('visuals.game-backgrounds'), {
    folderKey: 'visuals.game-backgrounds',
    driveFolderId: '1v-xm8k4ufmr5J4bxCldce7YYU8SZuL1T',
    name: 'Game_Backgrounds',
    parentFolderKey: 'project.visuals',
    lifecycleRole: 'container',
  });
  assert.equal(
    folders.get('visuals.game-backgrounds.review')?.driveFolderId,
    '1i1OZ7qWPhu-YY2bbPUGXb5KHaOLh3NAI',
  );
  assert.equal(
    folders.get('visuals.game-backgrounds.approved')?.driveFolderId,
    '1VX-nfxg0JUiuw-oBJkTVtLwNJR3auB3_',
  );
});

test('the real project registry passes standalone and cross-registry gates', async () => {
  const [projectRegistry, folderRegistry, idiomRegistry] = await Promise.all([
    readJson(projectRegistryUrl),
    readJson(folderRegistryUrl),
    readJson(idiomRegistryUrl),
  ]);

  assert.deepEqual(validateProjectAssetRegistry(projectRegistry), []);
  assert.deepEqual(
    validateProjectAssetFolderAssignments(projectRegistry, folderRegistry),
    [],
  );
  assert.deepEqual(
    validateDriveRegistryCrossLinks(projectRegistry, idiomRegistry),
    [],
  );
});

test('Batch 1 is verified as a no-move registration batch', async () => {
  const ledger = await readJson(batchLedgerUrl);
  assert.equal(ledger.status, 'verified');
  assert.deepEqual(ledger.entries, []);
  assert.equal(ledger.batchType, 'registration-only');
  assert.equal(ledger.driveMutationCount, 0);
});
