import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';

import { validateAssetControlCenterSnapshot } from '../.test-dist/src/cards/drive-assets/index.js';

async function readJson(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, import.meta.url), 'utf8'));
}

test('the real control center snapshot is derived from current registries', async () => {
  const [controlCenter, projectRegistry, idiomRegistry] = await Promise.all([
    readJson('../data/drive-assets/asset-control-center.json'),
    readJson('../data/drive-assets/project-assets.json'),
    readJson('../data/drive-assets/idiom-card-assets.json'),
  ]);

  assert.deepEqual(
    validateAssetControlCenterSnapshot(
      controlCenter,
      projectRegistry,
      idiomRegistry,
      {
        currentMainSha: 'efcc5a5ad2d119eac4c87f1a56ae7747f4a1b8f7',
        openAssetPrs: [36, 39],
      },
    ),
    [],
  );
  assert.equal(controlCenter.currentSnapshot.trackedLogicalAssets, 18);
  assert.equal(controlCenter.currentSnapshot.approvedCurrentMasters, 5);
  assert.equal(controlCenter.currentSnapshot.reviewOrPrItems, 8);
  assert.equal(controlCenter.currentSnapshot.missingP0Assets, 0);
});
