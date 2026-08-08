import test from 'node:test';
import assert from 'node:assert/strict';

import {
  syncCardCollectionLevelRewards,
  syncCardCollectionMilestones
} from '../.test-dist/src/cards/collection-service.js';
import {
  createMemoryCardCollectionRepository
} from '../.test-dist/src/cards/collection-repository.js';

const NOW = '2026-08-06T13:30:00.000Z';

const LEVEL_TEXTS = Object.freeze([
  '一心一意', '意氣風發', '發揚光大', '大公無私', '私心雜念',
  '念念不忘', '忘恩負義', '義不容辭', '辭舊迎新', '新陳代謝'
]);

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

test('repairs a resolved grant missing inventory without rerolling the card', async () => {
  const rewardId = 'card-grant:main-levels:10';
  const acquisitionId = `card-acquisition:${rewardId}`;
  const repository = createMemoryCardCollectionRepository(NOW, {
    grants: [{
      rewardId,
      milestoneLevelCount: 10,
      status: 'resolved',
      createdAt: NOW,
      resolvedAt: NOW,
      revealedAt: null,
      resolvedCardId: 'card-water-drops-stone',
      acquisitionId
    }],
    inventory: [],
    metadata: { schemaVersion: 1, updatedAt: NOW }
  });
  let calls = 0;

  const result = await syncCardCollectionMilestones(input(repository, 10, {
    definitions: [approvedCard()],
    random: { next: () => { calls += 1; return 0.9; } },
    now: '2026-08-07T13:30:00.000Z'
  }));

  assert.equal(calls, 0);
  assert.equal(result.createdGrantCount, 0);
  assert.equal(result.resolvedGrantCount, 0);
  assert.equal(result.state.grants[0].resolvedCardId, 'card-water-drops-stone');
  assert.equal(result.state.inventory[0].cardId, 'card-water-drops-stone');
  assert.equal(result.state.inventory[0].ownedCount, 1);
  assert.equal(result.state.inventory[0].acquisitionHistory[0].acquisitionId, acquisitionId);
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


function rewardLevel(number, idiomId = `idiom-${number}`) {
  return Object.freeze({
    id: `level-${String(number).padStart(3, '0')}`,
    chapterId: 'chapter-1',
    levelNumber: number,
    campaignOrdinal: number,
    placements: Object.freeze([Object.freeze({ idiomId })])
  });
}

function completedProgress(levels) {
  return Object.freeze({
    schemaVersion: 1,
    campaignId: 'chapter-1',
    highestUnlockedLevel: Math.min(levels.length + 1, 20),
    lastPlayedLevel: levels.at(-1)?.levelNumber ?? 1,
    levelProgressById: Object.freeze(Object.fromEntries(levels.map((level) => [
      level.id,
      Object.freeze({
        levelId: level.id,
        completed: true,
        stars: 1,
        bestScore: 100,
        bestMistakes: 0,
        bestHintsUsed: 0,
        completionCount: 1,
        firstCompletedAt: NOW,
        lastCompletedAt: NOW
      })
    ]))),
    updatedAt: NOW
  });
}

function levelCard(number, overrides = {}) {
  const idiomId = `idiom-${number}`;
  return approvedCard({
    id: `card-${number}`,
    idiomId,
    title: LEVEL_TEXTS[number - 1],
    rarity: 'N',
    difficulty: 'E',
    acquisitionMethods: ['milestone-reward'],
    ...overrides
  });
}

function levelRewardInput(repository, levels, overrides = {}) {
  const activeIdioms = levels.map((level) => Object.freeze({
    id: level.placements[0].idiomId,
    text: LEVEL_TEXTS[level.levelNumber - 1]
  }));
  return {
    repository,
    levels,
    progress: completedProgress(levels),
    definitions: levels.map((level) => levelCard(level.levelNumber)),
    activeIdioms,
    difficultyById: new Map(levels.map((level) => [
      level.placements[0].idiomId,
      'E'
    ])),
    random: { next: () => 0.9 },
    now: NOW,
    ...overrides
  };
}

test('first completion of level one creates and resolves one per-level grant', async () => {
  const repository = createMemoryCardCollectionRepository(NOW);
  const levels = [rewardLevel(1)];
  const values = [0.9, 0];
  const result = await syncCardCollectionLevelRewards(levelRewardInput(
    repository,
    levels,
    { random: { next: () => values.shift() } }
  ));

  assert.equal(result.createdGrantCount, 1);
  assert.equal(result.resolvedGrantCount, 1);
  assert.equal(result.pendingGrantCount, 0);
  assert.equal(result.state.grants[0].campaignOrdinal, 1);
  assert.equal(result.state.inventory[0].acquisitionHistory[0].method, 'level-reward');
});

test('repeat level sync creates no grant and consumes no random input', async () => {
  const repository = createMemoryCardCollectionRepository(NOW);
  const levels = [rewardLevel(1)];
  const values = [0.9, 0];
  await syncCardCollectionLevelRewards(levelRewardInput(
    repository,
    levels,
    { random: { next: () => values.shift() } }
  ));
  let calls = 0;

  const repeated = await syncCardCollectionLevelRewards(levelRewardInput(
    repository,
    levels,
    { random: { next: () => { calls += 1; return 0; } } }
  ));

  assert.equal(calls, 0);
  assert.equal(repeated.createdGrantCount, 0);
  assert.equal(repeated.state.inventory[0].ownedCount, 1);
});

test('completed levels one and two create grants in global ordinal order', async () => {
  const repository = createMemoryCardCollectionRepository(NOW);
  const levels = [rewardLevel(2), rewardLevel(1)];
  const values = [0.9, 0, 0.9, 0];

  const result = await syncCardCollectionLevelRewards(levelRewardInput(
    repository,
    levels,
    { random: { next: () => values.shift() } }
  ));

  assert.deepEqual(
    result.state.grants.map((grant) => grant.campaignOrdinal),
    [1, 2]
  );
  assert.equal(result.createdGrantCount, 2);
});

test('legacy milestone ten suppresses only per-level ordinal ten', async () => {
  const levels = Array.from({ length: 10 }, (_, index) => rewardLevel(index + 1));
  const repository = createMemoryCardCollectionRepository(NOW, {
    grants: [{
      rewardId: 'card-grant:main-levels:10',
      milestoneLevelCount: 10,
      status: 'pending',
      createdAt: NOW,
      resolvedAt: null,
      revealedAt: null,
      resolvedCardId: null,
      acquisitionId: null
    }],
    inventory: [],
    metadata: { schemaVersion: 1, updatedAt: NOW }
  });

  const result = await syncCardCollectionLevelRewards(levelRewardInput(
    repository,
    levels,
    { definitions: [] }
  ));

  const perLevel = result.state.grants.filter((grant) => 'campaignOrdinal' in grant);
  assert.deepEqual(perLevel.map((grant) => grant.campaignOrdinal), [1,2,3,4,5,6,7,8,9]);
  assert.equal(result.state.grants[0].rewardId, 'card-grant:main-levels:10');
});

test('pending empty-pool grants preserve hidden score snapshots', async () => {
  const repository = createMemoryCardCollectionRepository(NOW);
  const levels = [rewardLevel(1), rewardLevel(2)];

  const result = await syncCardCollectionLevelRewards(levelRewardInput(
    repository,
    levels,
    { definitions: [] }
  ));

  assert.deepEqual(result.state.grants.map((grant) => grant.scoreSnapshot), [
    { levelHiddenScore: 1, hiddenRewardScore: 1 },
    { levelHiddenScore: 1, hiddenRewardScore: 2 }
  ]);
  assert.equal(result.pendingGrantCount, 2);
});

test('resolved per-level grant missing inventory is repaired without RNG', async () => {
  const level = rewardLevel(1);
  const rewardId = 'card-grant:main-level:chapter-1:1';
  const acquisitionId = `card-acquisition:${rewardId}`;
  const repository = createMemoryCardCollectionRepository(NOW, {
    grants: [{
      rewardId,
      chapterId: 'chapter-1',
      levelNumber: 1,
      campaignOrdinal: 1,
      scoreSnapshot: { levelHiddenScore: 1, hiddenRewardScore: 1 },
      probabilitySnapshot: {
        levelHiddenScore: 1,
        hiddenRewardScore: 1,
        srTickets: 1,
        ssrTickets: 0,
        baseTickets: 999,
        minimumRarity: 'N',
        rolledRarity: 'N',
        resolvedRarity: 'N',
        rollValue: 900
      },
      status: 'resolved',
      createdAt: NOW,
      resolvedAt: NOW,
      revealedAt: null,
      resolvedCardId: 'card-1',
      acquisitionId,
      legacyCoverage: false
    }],
    inventory: [],
    upgrades: [],
    metadata: { schemaVersion: 2, updatedAt: NOW }
  });
  let calls = 0;

  const result = await syncCardCollectionLevelRewards(levelRewardInput(
    repository,
    [level],
    { random: { next: () => { calls += 1; return 0; } } }
  ));

  assert.equal(calls, 0);
  assert.equal(result.state.inventory[0].cardId, 'card-1');
  assert.equal(result.state.inventory[0].acquisitionHistory[0].acquisitionId, acquisitionId);
});
