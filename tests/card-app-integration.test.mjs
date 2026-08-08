import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { URL } from 'node:url';

const campaignSource = readFileSync(
  new URL('../src/app/CampaignGame.tsx', import.meta.url),
  'utf8'
);
const hookSource = readFileSync(
  new URL('../src/app/use-card-collection.ts', import.meta.url),
  'utf8'
);

test('keeps progress persistence before collection synchronization', () => {
  const normalized = campaignSource.replace(/\s+/gu, ' ');
  assert.match(
    normalized,
    /completion\.persisted \.then\(\(\) => cards\.syncAfterProgressSaved\(completion\.progress\)\)/u
  );
});

test('uses exact levels and generated difficulty data for per-level rewards', () => {
  assert.match(hookSource, /syncCardCollectionLevelRewards/u);
  assert.match(hookSource, /PUZZLE_LEVELS/u);
  assert.match(hookSource, /CHAPTER_ONE_CARD_DIFFICULTY_BY_ID/u);
  assert.doesNotMatch(hookSource, /countCompletedUniqueMainLevels/u);
});

test('loads active idioms only when formal definitions exist', () => {
  assert.match(hookSource, /IDIOM_CARD_DEFINITIONS\.length === 0/u);
  assert.match(hookSource, /EMPTY_ACTIVE_IDIOMS/u);
});

test('does not expose hidden score tickets or roll values from the hook', () => {
  const returned = hookSource.slice(hookSource.lastIndexOf('return Object.freeze'));
  assert.doesNotMatch(returned, /hiddenRewardScore/u);
  assert.doesNotMatch(returned, /srTickets/u);
  assert.doesNotMatch(returned, /ssrTickets/u);
  assert.doesNotMatch(returned, /rollValue/u);
  assert.match(returned, /latestResolvedGrantId/u);
});
