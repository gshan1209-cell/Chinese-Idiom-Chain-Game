import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateThemeBadgeRegistry } from '../.test-dist/src/cards/theme-badges/index.js';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const themeRegistryPath = resolve(repositoryRoot, 'data/cards/theme-badge-registry.json');
const driveAssetsPath = resolve(repositoryRoot, 'data/drive-assets/idiom-card-assets.json');

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function main() {
  const [themeRegistry, driveAssets] = await Promise.all([
    readJson(themeRegistryPath),
    readJson(driveAssetsPath),
  ]);
  const result = validateThemeBadgeRegistry(themeRegistry, driveAssets);

  if (result.errors.length > 0) {
    for (const error of result.errors) {
      console.error(`[theme-badges] FAIL ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `[theme-badges] PASS badges=${result.summary.badgeCount} approved-assets=${result.summary.approvedAssetCount}`,
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[theme-badges] FAIL read-error=${message}`);
  process.exitCode = 1;
});
