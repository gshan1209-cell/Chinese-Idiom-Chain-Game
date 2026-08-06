import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  validateDriveAssetRegistry,
  validateDriveFolderRegistry,
  validateDriveMigrationLedger,
} from '../.test-dist/src/cards/drive-assets/index.js';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataRoot = resolve(repositoryRoot, 'data/drive-assets');
const foldersPath = resolve(dataRoot, 'drive-folders.json');
const assetsPath = resolve(dataRoot, 'idiom-card-assets.json');
const migrationsPath = resolve(dataRoot, 'migrations');

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function issueIdentifier(issue) {
  if ('assetId' in issue) {
    return issue.assetId ?? 'registry';
  }
  if ('folderKey' in issue) {
    return issue.folderKey ?? 'registry';
  }
  if ('driveResourceId' in issue) {
    return issue.driveResourceId ?? 'ledger';
  }
  return 'unknown';
}

async function main() {
  const folders = await readJson(foldersPath);
  const assets = await readJson(assetsPath);
  const migrationFilenames = (await readdir(migrationsPath))
    .filter((filename) => filename.endsWith('.json'))
    .sort();
  const migrations = await Promise.all(
    migrationFilenames.map((filename) => readJson(resolve(migrationsPath, filename))),
  );

  const issues = [
    ...validateDriveFolderRegistry(folders),
    ...validateDriveAssetRegistry(assets),
    ...migrations.flatMap((ledger) => validateDriveMigrationLedger(ledger)),
  ];

  if (issues.length > 0) {
    for (const validationIssue of issues) {
      console.error(
        `[drive-assets] FAIL ${validationIssue.code} id=${issueIdentifier(validationIssue)}`,
      );
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `[drive-assets] PASS folders=${folders.folders.length} assets=${assets.assets.length} migrations=${migrations.length}`,
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[drive-assets] FAIL read-error id=${message}`);
  process.exitCode = 1;
});
