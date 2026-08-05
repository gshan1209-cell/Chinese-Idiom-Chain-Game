import type {
  BonusDifficulty,
  BonusFeedback,
  BonusQuestion,
  BonusRewardType,
  BonusRound,
  BonusRoundPhase
} from '../../domain/bonus.js';

const ROUND_DURATION_MS = 15_000;
const FEEDBACK_DURATION_MS = 800;
const COMBO_STEP = 20;
const MAX_COMBO_BONUS = 200;

export interface WhackEngineDependencies {
  readonly now: () => number;
  readonly nextQuestion: (
    usedIdiomIds: ReadonlySet<string>,
    recentCorrectHoles: readonly number[]
  ) => BonusQuestion | null;
  readonly createRoundId?: () => string;
  readonly createSettlementId?: () => string;
}

function defaultRoundId(): string {
  return `bonus-round-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultSettlementId(): string {
  return `bonus-settlement-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function remaining(deadlineMs: number, nowMs: number): number {
  return Math.max(0, deadlineMs - nowMs);
}

function feedbackMessage(combo: number): string {
  if (combo >= 5) return '成語高手！';
  if (combo >= 3) return '一擊命中！';
  return '好眼力！';
}

function freezeRound(round: BonusRound): BonusRound {
  return Object.freeze({
    ...round,
    usedIdiomIds: new Set(round.usedIdiomIds),
    recentCorrectHoles: Object.freeze([...round.recentCorrectHoles]),
    feedback: round.feedback === null ? null : Object.freeze({ ...round.feedback })
  });
}

function settle(round: BonusRound, nowMs: number): BonusRound {
  if (round.phase === 'settled') return round;
  return freezeRound({
    ...round,
    phase: 'settled',
    phaseBeforePause: null,
    pausedAtMs: null,
    feedbackUntilMs: null,
    remainingMs: 0,
    question: null,
    settledAtMs: nowMs
  });
}

export function startWhackRound(
  rewardType: BonusRewardType,
  difficulty: BonusDifficulty,
  dependencies: WhackEngineDependencies
): BonusRound {
  const nowMs = dependencies.now();
  const usedIdiomIds = new Set<string>();
  const question = dependencies.nextQuestion(usedIdiomIds, []);
  return freezeRound({
    id: (dependencies.createRoundId ?? defaultRoundId)(),
    settlementId: (dependencies.createSettlementId ?? defaultSettlementId)(),
    rewardType,
    difficulty,
    phase: question === null ? 'settled' : 'active',
    phaseBeforePause: null,
    startedAtMs: nowMs,
    deadlineMs: nowMs + ROUND_DURATION_MS,
    pausedAtMs: null,
    feedbackUntilMs: null,
    remainingMs: question === null ? 0 : ROUND_DURATION_MS,
    question,
    usedIdiomIds,
    recentCorrectHoles: [],
    correctCount: 0,
    wrongCount: 0,
    combo: 0,
    maxCombo: 0,
    score: 0,
    feedback: null,
    settledAtMs: question === null ? nowMs : null
  });
}

function wrongPenalty(
  difficulty: BonusDifficulty
): { readonly score: number; readonly time: number; readonly resetCombo: boolean } {
  switch (difficulty) {
    case 'easy':
      return { score: 20, time: 0, resetCombo: false };
    case 'normal':
      return { score: 50, time: 0, resetCombo: true };
    case 'challenge':
      return { score: 50, time: 1_000, resetCombo: false };
    case 'extreme':
      return { score: 0, time: 1_000, resetCombo: true };
  }
}

export function answerWhackRound(
  round: BonusRound,
  questionId: string,
  holeIndex: number,
  dependencies: WhackEngineDependencies
): BonusRound {
  if (
    round.phase !== 'active' ||
    round.question === null ||
    round.question.id !== questionId ||
    round.remainingMs <= 0
  ) {
    return round;
  }

  const nowMs = dependencies.now();
  if (nowMs >= round.deadlineMs) return settle(round, nowMs);
  const choice = round.question.choices.find((item) => item.holeIndex === holeIndex);
  if (choice === undefined) return round;

  if (
    holeIndex === round.question.correctHoleIndex &&
    choice.character === round.question.answer
  ) {
    const combo = round.combo + 1;
    const scoreDelta = 100 + Math.min(round.combo * COMBO_STEP, MAX_COMBO_BONUS);
    const usedIdiomIds = new Set(round.usedIdiomIds);
    usedIdiomIds.add(round.question.idiomId);
    const recentCorrectHoles = [...round.recentCorrectHoles, holeIndex].slice(-2);
    const nextQuestion = dependencies.nextQuestion(usedIdiomIds, recentCorrectHoles);
    const correctState = freezeRound({
      ...round,
      question: nextQuestion,
      usedIdiomIds,
      recentCorrectHoles,
      correctCount: round.correctCount + 1,
      combo,
      maxCombo: Math.max(round.maxCombo, combo),
      score: round.score + scoreDelta,
      feedback: Object.freeze({
        kind: 'correct',
        message: feedbackMessage(combo),
        correctIdiomText: null
      }),
      remainingMs: remaining(round.deadlineMs, nowMs)
    });
    return nextQuestion === null ? settle(correctState, nowMs) : correctState;
  }

  const penalty = wrongPenalty(round.difficulty);
  const deadlineMs = round.deadlineMs - penalty.time;
  const remainingMs = remaining(deadlineMs, nowMs);
  const feedback: BonusFeedback = Object.freeze({
    kind: 'wrong',
    message: '再想一想',
    correctIdiomText: round.question.idiomText
  });
  const wrongState = freezeRound({
    ...round,
    phase: 'feedback',
    deadlineMs,
    feedbackUntilMs: nowMs + FEEDBACK_DURATION_MS,
    remainingMs,
    wrongCount: round.wrongCount + 1,
    combo: penalty.resetCombo ? 0 : round.combo,
    score: Math.max(0, round.score - penalty.score),
    feedback
  });
  return remainingMs <= 0 ? settle(wrongState, nowMs) : wrongState;
}

export function tickWhackRound(
  round: BonusRound,
  dependencies: WhackEngineDependencies
): BonusRound {
  if (round.phase === 'settled' || round.phase === 'paused') return round;
  const nowMs = dependencies.now();
  if (nowMs >= round.deadlineMs) return settle(round, nowMs);

  if (round.phase === 'feedback') {
    if (round.feedbackUntilMs !== null && nowMs < round.feedbackUntilMs) {
      const nextRemaining = remaining(round.deadlineMs, nowMs);
      return nextRemaining === round.remainingMs
        ? round
        : freezeRound({ ...round, remainingMs: nextRemaining });
    }
    const nextQuestion = dependencies.nextQuestion(
      round.usedIdiomIds,
      round.recentCorrectHoles
    );
    if (nextQuestion === null) return settle(round, nowMs);
    return freezeRound({
      ...round,
      phase: 'active',
      feedbackUntilMs: null,
      remainingMs: remaining(round.deadlineMs, nowMs),
      question: nextQuestion,
      feedback: null
    });
  }

  const nextRemaining = remaining(round.deadlineMs, nowMs);
  return nextRemaining === round.remainingMs
    ? round
    : freezeRound({ ...round, remainingMs: nextRemaining });
}

export function pauseWhackRound(round: BonusRound, nowMs: number): BonusRound {
  if (round.phase === 'settled' || round.phase === 'paused') return round;
  const phaseBeforePause: Exclude<BonusRoundPhase, 'paused'> = round.phase;
  return freezeRound({
    ...round,
    phase: 'paused',
    phaseBeforePause,
    pausedAtMs: nowMs,
    remainingMs: remaining(round.deadlineMs, nowMs)
  });
}

export function resumeWhackRound(round: BonusRound, nowMs: number): BonusRound {
  if (
    round.phase === 'settled' ||
    round.phase !== 'paused' ||
    round.pausedAtMs === null ||
    round.phaseBeforePause === null
  ) {
    return round;
  }
  const pauseDuration = Math.max(0, nowMs - round.pausedAtMs);
  return freezeRound({
    ...round,
    phase: round.phaseBeforePause,
    phaseBeforePause: null,
    deadlineMs: round.deadlineMs + pauseDuration,
    feedbackUntilMs:
      round.feedbackUntilMs === null
        ? null
        : round.feedbackUntilMs + pauseDuration,
    pausedAtMs: null,
    remainingMs: remaining(round.deadlineMs + pauseDuration, nowMs)
  });
}
