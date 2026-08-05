import test from 'node:test';
import assert from 'node:assert/strict';

import {
  answerWhackRound,
  pauseWhackRound,
  resumeWhackRound,
  startWhackRound,
  tickWhackRound
} from '../.test-dist/src/game/bonus/whack-a-mole-engine.js';

function question(id = 'question-1', idiomId = 'idiom-1', correctHoleIndex = 0) {
  return Object.freeze({
    id,
    idiomId,
    idiomText: '畫龍點睛',
    prompt: '畫龍點＿',
    answer: '睛',
    correctHoleIndex,
    holeCount: 6,
    choices: Object.freeze([
      { holeIndex: correctHoleIndex, character: '睛' },
      { holeIndex: 1, character: '金' },
      { holeIndex: 2, character: '心' },
      { holeIndex: 3, character: '劍' }
    ])
  });
}

function dependencies(
  clock,
  sequence = [question(), question('question-2', 'idiom-2', 1)]
) {
  let index = 0;
  return {
    now: () => clock.now,
    nextQuestion: () => sequence[index++] ?? null,
    createRoundId: () => 'round-1',
    createSettlementId: () => 'settlement-1'
  };
}

test('正確命中得分，舊題快速連點不會重複計分', () => {
  const clock = { now: 1_000 };
  const deps = dependencies(clock);
  const round = startWhackRound('hint-ticket', 'normal', deps);
  assert.equal(round.remainingMs, 15_000);
  assert.equal(round.questionDeadlineMs, 3_000);

  const correct = answerWhackRound(round, 'question-1', 0, deps);
  assert.equal(correct.score, 100);
  assert.equal(correct.correctCount, 1);
  assert.equal(correct.combo, 1);
  assert.equal(answerWhackRound(correct, 'question-1', 0, deps), correct);
});

test('四種難度套用正確的錯誤處罰，答錯題目也不會重複出現', () => {
  const cases = [
    ['easy', 80, 3, 0],
    ['normal', 50, 0, 0],
    ['challenge', 50, 3, -1_000],
    ['extreme', 100, 0, -1_000]
  ];

  for (const [difficulty, score, combo, deadlineDelta] of cases) {
    const clock = { now: 1_000 };
    const deps = dependencies(clock, [question()]);
    let round = startWhackRound('shield', difficulty, deps);
    round = { ...round, score: 100, combo: 3 };
    const wrong = answerWhackRound(round, 'question-1', 1, deps);
    assert.equal(wrong.phase, 'feedback');
    assert.equal(wrong.usedIdiomIds.has('idiom-1'), true);
    assert.equal(wrong.feedbackUntilMs, 1_800);
    assert.equal(wrong.score, score);
    assert.equal(wrong.combo, combo);
    assert.equal(wrong.deadlineMs, 16_000 + deadlineDelta);
  }
});

test('每題依難度自動輪替，逾時題目不計入答錯', () => {
  const clock = { now: 1_000 };
  const deps = dependencies(clock);
  const round = startWhackRound('shield', 'normal', deps);

  clock.now = 3_000;
  const next = tickWhackRound(round, deps);
  assert.equal(next.question.id, 'question-2');
  assert.equal(next.usedIdiomIds.has('idiom-1'), true);
  assert.equal(next.wrongCount, 0);
  assert.equal(next.questionDeadlineMs, 5_000);
});

test('800ms 回饋後換題，第一次背景暫停會延後所有期限', () => {
  const clock = { now: 1_000 };
  const deps = dependencies(clock);
  const round = startWhackRound('shield', 'normal', deps);
  const wrong = answerWhackRound(round, 'question-1', 1, deps);

  clock.now = 1_800;
  const next = tickWhackRound(wrong, deps);
  assert.equal(next.phase, 'active');
  assert.equal(next.question.id, 'question-2');

  const paused = pauseWhackRound(next, 2_000);
  assert.equal(paused.phase, 'paused');
  assert.equal(paused.pauseCount, 1);
  const resumed = resumeWhackRound(paused, 5_000);
  assert.equal(resumed.deadlineMs, next.deadlineMs + 3_000);
  assert.equal(resumed.questionDeadlineMs, next.questionDeadlineMs + 3_000);
});

test('第二次切到背景視為放棄且回合立即結算', () => {
  const clock = { now: 1_000 };
  const deps = dependencies(clock);
  const round = startWhackRound('shield', 'normal', deps);
  const firstPause = pauseWhackRound(round, 1_500);
  const resumed = resumeWhackRound(firstPause, 2_500);
  const forfeited = pauseWhackRound(resumed, 3_000);

  assert.equal(forfeited.phase, 'settled');
  assert.equal(forfeited.remainingMs, 0);
  assert.equal(answerWhackRound(forfeited, 'question-1', 0, deps), forfeited);
});

test('總時間到期或沒有可用題目時安全結束', () => {
  const clock = { now: 1_000 };
  const deps = dependencies(clock);
  const round = startWhackRound('shield', 'normal', deps);
  clock.now = round.deadlineMs;
  const expired = tickWhackRound(round, deps);
  assert.equal(expired.phase, 'settled');

  const emptyDeps = dependencies({ now: 1_000 }, []);
  const empty = startWhackRound('shield', 'normal', emptyDeps);
  assert.equal(empty.phase, 'settled');
  assert.equal(empty.remainingMs, 0);
});
