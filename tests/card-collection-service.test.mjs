import test from 'node:test';
import assert from 'node:assert/strict';

import {
  syncCardCollectionMilestones
} from '../.test-dist/src/cards/collection-service.js';
import {
  createMemoryCardCollectionRepository
} from '../.test-dist/src/cards/collection-repository.js';

const NOW = '2026-08-06T13:30:00.000Z';
const ACTIVE_IDIOMS = Object.freeze([
  Object.freeze({ id: 'idiom-water-drops-stone', text: '水滴石穿' })
]);

function approvedCard(overrides = {}) {
  return {
    id: 'card-water-drops-stone',
    idiomId: 'idiom-water-drops-stone',
    title: '水滴石穿',
    bopomofo: ['ㄕㄨㄟˇ', 'ㄉㄧ', 'ㄕˊ', 'ㄔㄨㄢ'],
    pinyin: ['shuǐ', 'dī', 'shí', 'chuān'],
    subtitle: '持續累積，終能突破',
    rarity: 'SSR',
    difficulty: 'B',
    imageAsset: '/assets/cards/water-drops-stone.png',
    thumbnailAsset: '/assets/cards/water-drops-stone-thumb.png',
    storySummary: '水滴持續落下，終能穿石。',
    storySource: '《漢書》相關語意',
    motto: '日日不止，終有所成。',
    enabled: true,
    approvalStatus: 'Approved',
    sourceStatus: 'Approved',
    rarityApproved: true,
    releaseOrder: 1,
    startsAt: null,
    endsAt: null,
    acquisitionMethods: ['milestone-reward'],
    weight: 1,
    licenseEvidenceId: null,
    ...overrides
  };
}

function input(repository, completedUniqueMainLevels, overrides = {}) {
  return {
    repository,
    completedUniqueMainLevels,
    definitions: [],
    activeIdioms: ACTIVE_IDIOMS,
    random: { next: () => 0 },
    now: NOW,
    ...overrides
  };
}

test('nine completed levels create no grant', async () => {
  const repository = createMemoryCardCollectionRepository(NOW);
  const result = await syncCardCollectionMilestones(input(repository, 9));

  assert.equal(result.createdGrantCount, 0);
  assert.equal(result.pendingGrantCount, 0);
  assert.deepEqual(result.state.grants, []);
});

test('ten and twenty completed levels create pending grants when the official pool is empty', async () => {
  const repository = createMemoryCardCollectionRepository(NOW);
  const first = await syncCardCollectionMilestones(input(repository, 10));
  const second = await syncCardCollectionMilestones(input(repository, 20));

  assert.equal(first.createdGrantCount, 1);
  assert.equal(first.resolvedGrantCount, 0);
  assert.equal(first.pendingGrantCount, 1);
  assert.equal(second.createdGrantCount, 1);
  assert.equal(second.pendingGrantCount, 2);
  assert.deepEqual(second.state.grants.map((grant) => grant.rewardId), [
    'card-grant:main-levels:10',
    'card-grant:main-levels:20'
  ]);
});

test('old-player backfill and repeated synchronization stay idempotent', async () => {
  const repository = createMemoryCardCollectionRepository(NOW);
  const first = await syncCardCollectionMilestones(input(repository, 20));
  const repeated = await syncCardCollectionMilestones(input(repository, 20));

  assert.equal(first.createdGrantCount, 2);
  assert.equal(repeated.createdGrantCount, 0);
  assert.equal(repeated.state.grants.length, 2);
});

test('an approved card resolves and updates inventory inside one repository transaction', async () => {
  const repository = createMemoryCardCollectionRepository(NOW);
  const result = await syncCardCollectionMilestones(input(repository, 10, {
    definitions: [approvedCard()]
  }));
  const stored = await repository.load();

  assert.equal(result.createdGrantCount, 1);
  assert.equal(result.resolvedGrantCount, 1);
  assert.equal(result.pendingGrantCount, 0);
  assert.equal(result.state.grants[0].status, 'resolved');
  assert.equal(result.state.grants[0].resolvedCardId, 'card-water-drops-stone');
  assert.equal(result.state.inventory[0].ownedCount, 1);
  assert.deepEqual(stored, result.state);
});

test('replaying a resolved reward consumes no random input and never increments inventory', async () => {
  const repository = createMemoryCardCollectionRepository(NOW);
  await syncCardCollectionMilestones(input(repository, 10, {
    definitions: [approvedCard()]
  }));
  let calls = 0;
  const replay = await syncCardCollectionMilestones(input(repository, 10, {
    definitions: [approvedCard()],
    random: { next: () => { calls += 1; return 0.8; } },
    now: '2026-08-07T13:30:00.000Z'
  }));

  assert.equal(calls, 0);
  assert.equal(replay.createdGrantCount, 0);
  assert.equal(replay.resolvedGrantCount, 0);
  assert.equal(replay.state.inventory[0].ownedCount, 1);
});

test('invalid card definitions are reported and never used to fake a reward', async () => {
  const repository = createMemoryCardCollectionRepository(NOW);
  const result = await syncCardCollectionMilestones(input(repository, 10, {
    definitions: [approvedCard({ approvalStatus: 'Review' })]
  }));

  assert.ok(result.findings.some((finding) => finding.code === 'unapproved-asset'));
  assert.equal(result.pendingGrantCount, 1);
  assert.deepEqual(result.state.inventory, []);
});

test('transaction failure rejects without partially storing grant or inventory', async () => {
  const base = createMemoryCardCollectionRepository(NOW);
  const repository = {
    load: () => base.load(),
    clear: (now) => base.clear(now),
    transact: async () => {
      throw new Error('transaction failed');
    }
  };

  await assert.rejects(
    syncCardCollectionMilestones(input(repository, 10, {
      definitions: [approvedCard()]
    })),
    /transaction failed/
  );
  const stored = await base.load();
  assert.deepEqual(stored.grants, []);
  assert.deepEqual(stored.inventory, []);
});
