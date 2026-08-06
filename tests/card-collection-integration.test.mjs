import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';

const campaignUrl = new URL('../src/app/CampaignGame.tsx', import.meta.url);
const progressHookUrl = new URL('../src/app/use-campaign-progress.ts', import.meta.url);
const collectionHookUrl = new URL('../src/app/use-card-collection.ts', import.meta.url);
const progressDomainUrl = new URL('../src/domain/progress.ts', import.meta.url);
const progressRepositoryUrl = new URL(
  '../src/progress/indexeddb-progress-repository.ts',
  import.meta.url
);

test('campaign owns card collection synchronization outside puzzle gameplay', async () => {
  const campaign = await readFile(campaignUrl, 'utf8');
  const collectionHook = await readFile(collectionHookUrl, 'utf8');

  assert.match(campaign, /import \{ useCardCollection \}/u);
  assert.match(campaign, /const cards = useCardCollection\(/u);
  assert.match(campaign, /cards\.syncAfterProgressSaved\(completion\.progress\)/u);
  assert.match(collectionHook, /syncCardCollectionMilestones/u);
  assert.match(collectionHook, /IDIOM_CARD_DEFINITIONS/u);
});

test('collection synchronization runs only after progress persistence succeeds', async () => {
  const campaign = await readFile(campaignUrl, 'utf8');
  const normalized = campaign.replace(/\s+/gu, ' ');

  assert.match(
    normalized,
    /const completion = campaign\.completeLevel\(result\); void completion\.persisted \.then\(\(\) => cards\.syncAfterProgressSaved\(completion\.progress\)\) \.catch\(\(\) => undefined\);/u
  );
});

test('campaign progress exposes an awaitable persistence result without card fields', async () => {
  const hook = await readFile(progressHookUrl, 'utf8');
  const domain = await readFile(progressDomainUrl, 'utf8');

  assert.match(hook, /readonly progress: CampaignProgress;/u);
  assert.match(hook, /readonly persisted: Promise<void>;/u);
  assert.match(hook, /return Object\.freeze\(\{ progress: next, persisted \}\);/u);
  assert.doesNotMatch(domain, /cardGrant|cardInventory|collectionGrant|resolvedCardId/u);
});

test('collection storage failure is isolated from already completed campaign state', async () => {
  const campaign = await readFile(campaignUrl, 'utf8');
  const collectionHook = await readFile(collectionHookUrl, 'utf8');

  assert.match(campaign, /\.catch\(\(\) => undefined\)/u);
  assert.match(collectionHook, /COLLECTION_STORAGE_WARNING/u);
  assert.match(collectionHook, /setStorageWarning\(COLLECTION_STORAGE_WARNING\)/u);
});

test('existing campaign IndexedDB remains version one and card-free', async () => {
  const repository = await readFile(progressRepositoryUrl, 'utf8');

  assert.match(repository, /const DATABASE_NAME = 'cicg-progress';/u);
  assert.match(repository, /const DATABASE_VERSION = 1;/u);
  assert.match(repository, /const STORE_NAME = 'campaigns';/u);
  assert.match(repository, /const CAMPAIGN_KEY = 'chapter-1';/u);
  assert.doesNotMatch(repository, /cicg-card-collection|grants|inventory/u);
});
