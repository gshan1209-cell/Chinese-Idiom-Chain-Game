# 成語打地鼠獎勵關卡 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在既有經典成語接龍中加入可累積能量、自選獎勵、15 秒補尾字打地鼠，以及可測試的提示券、護盾與雙倍分數資源。

**Architecture:** 延續現有純 TypeScript 遊戲引擎與 React UI 分離方式。能量、題目產生、倒數、命中判定與獎勵結算全部放在 `src/game/bonus`，React 只負責畫面、鍵盤／觸控事件與瀏覽器生命週期；既有 `GameSession` 透過 `BonusResources` 接收獎勵效果。

**Tech Stack:** React 19、TypeScript 6、Vite 8、Node.js 22 `node:test`、既有離線成語字典與 PWA。

## Global Constraints

- 獎勵關卡不取代既有經典接龍，只能在主線能量達到 100% 後由玩家自行啟動。
- 獎勵關卡基礎時間固定為 15,000ms，使用單調時鐘差值計算，不依賴固定計時器次數。
- 題型固定為四字成語補最後一字，每題至少 4 個候選字，且只能有一個正確答案。
- 手機使用 6 個洞位；寬度至少 768px 時使用 9 個洞位。
- 題目只使用本機已啟用成語；無法建立至少 3 個可靠干擾字時跳過該成語。
- 能量範圍固定為 0～100；一般答對 +15%，連擊達 3 題額外 +5%，連擊達 5 題以上再額外 +10%，困難成語額外 +5%。
- 使用提示後答對只取得基本 +15%，不得取得連擊或難度加成。
- 關卡完成後最多攜帶 50% 能量至下一局；中途重新開始不得攜帶能量。
- 提示券、護盾與雙倍分數不得無上限堆疊；護盾上限 3 層，雙倍分數以較長剩餘題數覆蓋。
- 經典模式不顯示「增加時間」選項，但引擎仍須支援該獎勵，供後續限時模式使用。
- App 切到背景時暫停獎勵關卡，回到前景後延後 deadline，玩家不因切換 App 損失秒數。
- 時間歸零、題庫耗盡或結算完成後不得再接受命中；同一輪獎勵只能發放一次。
- 所有主要按鈕高度至少 56px；地鼠洞位可點擊區域至少 72px；360px 寬度不得出現水平捲動。
- 必須支援觸控、滑鼠、數字鍵 1～9、`prefers-reduced-motion` 與 `aria-live`。
- 不新增後端、登入、雲端同步、廣告、內購、生成式 AI 或執行期網路題庫。

---

## File Structure

### New domain and engine files

- `src/domain/bonus.ts`：獎勵資源、題目、回合、結算與難度型別。
- `src/game/bonus/bonus-energy.ts`：能量累積、消耗與跨關保留。
- `src/game/bonus/question-generator.ts`：從 `IdiomIndex` 建立補尾字題目、干擾字與洞位配置。
- `src/game/bonus/whack-a-mole-engine.ts`：15 秒回合狀態機、暫停／恢復、命中、錯誤與防重複輸入。
- `src/game/bonus/reward-calculator.ts`：四種獎勵門檻、完美獎勵與資源套用。

### New React files

- `src/app/use-whack-a-mole.ts`：以 `requestAnimationFrame` 驅動純引擎，處理 `visibilitychange`。
- `src/app/bonus/EnergyMeter.tsx`：主線能量顯示與啟動按鈕。
- `src/app/bonus/RewardSelector.tsx`：提示券、雙倍分數、護盾與限時模式加時選擇。
- `src/app/bonus/MoleHole.tsx`：單一洞位按鈕與低刺激動畫。
- `src/app/bonus/WhackAMoleBoard.tsx`：題目、倒數、6／9 洞位、數字鍵操作。
- `src/app/bonus/BonusResult.tsx`：命中、失誤、連擊、分數與獎勵結算。

### Existing files to modify

- `src/domain/game.ts`：在 `GameSession` 加入 `bonusResources` 與本題提示旗標。
- `src/game/game-engine.ts`：套用能量、提示券、護盾、分數倍率與下一局保留。
- `src/app/use-classic-game.ts`：整合主線、獎勵選擇、打地鼠與結算畫面狀態。
- `src/app/App.tsx`：依畫面狀態呈現主線、獎勵選擇、打地鼠與結果。
- `src/app/App.css`：新增能量槽、洞位、地鼠、結果與響應式樣式。
- `package.json`：加入 bonus 測試指令並納入 `npm test`。
- `README.md`：更新完成範圍、玩法與驗證方式。

---

### Task 1: 建立獎勵領域型別與能量規則

**Files:**
- Create: `src/domain/bonus.ts`
- Create: `src/game/bonus/bonus-energy.ts`
- Create: `tests/bonus-energy.test.mjs`
- Modify: `package.json:8-25`

**Interfaces:**

```ts
export type BonusDifficulty = 'easy' | 'normal' | 'challenge' | 'extreme';
export type BonusRewardType = 'hint-ticket' | 'time' | 'score-multiplier' | 'shield';

export interface BonusResources {
  readonly energy: number;
  readonly hintTickets: number;
  readonly shieldLayers: number;
  readonly scoreMultiplierTurns: number;
  readonly timeBonusSeconds: number;
}

export interface EnergyGainInput {
  readonly currentEnergy: number;
  readonly combo: number;
  readonly difficulty: Difficulty;
  readonly usedHintForTurn: boolean;
}

export function createBonusResources(
  partial?: Partial<BonusResources>
): BonusResources;

export function gainTurnEnergy(input: EnergyGainInput): number;
export function spendFullEnergy(resources: BonusResources): BonusResources;
export function carryResourcesToNextLevel(resources: BonusResources): BonusResources;
```

- [ ] **Step 1: Write the failing energy tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  carryResourcesToNextLevel,
  createBonusResources,
  gainTurnEnergy,
  spendFullEnergy
} from '../.test-dist/src/game/bonus/bonus-energy.js';

test('一般答對增加 15 能量且最高為 100', () => {
  assert.equal(gainTurnEnergy({ currentEnergy: 0, combo: 1, difficulty: 'normal', usedHintForTurn: false }), 15);
  assert.equal(gainTurnEnergy({ currentEnergy: 95, combo: 1, difficulty: 'normal', usedHintForTurn: false }), 100);
});

test('連擊與困難成語加成可以累加', () => {
  assert.equal(gainTurnEnergy({ currentEnergy: 0, combo: 5, difficulty: 'hard', usedHintForTurn: false }), 35);
});

test('使用提示後答對只增加基本能量', () => {
  assert.equal(gainTurnEnergy({ currentEnergy: 20, combo: 8, difficulty: 'hard', usedHintForTurn: true }), 35);
});

test('啟動後能量歸零且下一關最多保留 50', () => {
  const full = createBonusResources({ energy: 100, shieldLayers: 2 });
  assert.equal(spendFullEnergy(full).energy, 0);
  assert.deepEqual(carryResourcesToNextLevel(full), { ...full, energy: 50 });
});
```

- [ ] **Step 2: Add the test script and verify RED**

```json
{
  "scripts": {
    "test:bonus-energy": "npm run compile:core && node --test tests/bonus-energy.test.mjs"
  }
}
```

Run: `npm run test:bonus-energy`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `bonus-energy.js`.

- [ ] **Step 3: Implement immutable resource creation and energy rules**

```ts
const MAX_ENERGY = 100;
const MAX_CARRY_ENERGY = 50;

export function gainTurnEnergy(input: EnergyGainInput): number {
  let gain = 15;
  if (!input.usedHintForTurn) {
    if (input.combo >= 3) gain += 5;
    if (input.combo >= 5) gain += 10;
    if (input.difficulty === 'hard') gain += 5;
  }
  return Math.min(MAX_ENERGY, input.currentEnergy + gain);
}
```

Implement `createBonusResources` with defaults `0`, validate all values as finite non-negative integers, clamp energy to `0..100`, shield layers to `0..3`, and freeze every returned object.

- [ ] **Step 4: Run the focused tests**

Run: `npm run test:bonus-energy`

Expected: all energy tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/domain/bonus.ts src/game/bonus/bonus-energy.ts tests/bonus-energy.test.mjs package.json
git commit -m "feat: add bonus energy domain rules"
```

---

### Task 2: 將能量與道具整合進經典遊戲引擎

**Files:**
- Modify: `src/domain/game.ts:1-39`
- Modify: `src/game/game-engine.ts:1-194`
- Modify: `tests/game-engine.test.mjs`

**Interfaces:**

```ts
export interface GameSession {
  // existing fields remain unchanged
  readonly bonusResources: BonusResources;
  readonly hintUsedForCurrentTurn: boolean;
}

export interface GameEngineOptions {
  readonly createSessionId?: () => string;
  readonly now?: () => string;
  readonly pickIndex?: (length: number) => number;
  readonly initialBonusResources?: BonusResources;
}

export function createNextClassicSession(
  previous: GameSession,
  index: IdiomIndex,
  options?: Omit<GameEngineOptions, 'initialBonusResources'>
): GameSession;
```

- [ ] **Step 1: Add failing tests for main-line resource behavior**

Add tests proving:

```js
assert.equal(correctOutcome.session.bonusResources.energy, 15);
assert.equal(comboFiveHardOutcome.session.bonusResources.energy, 35);
assert.equal(hintedCorrectOutcome.session.bonusResources.energy, 15);
assert.equal(hintedCorrectOutcome.session.hintUsedForCurrentTurn, false);
assert.equal(ticketHintOutcome.session.bonusResources.hintTickets, 0);
assert.equal(ticketHintOutcome.session.score, originalScore);
assert.equal(shieldedWrongOutcome.session.bonusResources.shieldLayers, 0);
assert.equal(shieldedWrongOutcome.session.combo, originalCombo);
assert.equal(multipliedOutcome.result.scoreDelta, normalScoreDelta * 2);
assert.equal(multipliedOutcome.session.bonusResources.scoreMultiplierTurns, 2);
assert.equal(nextSession.bonusResources.energy, 50);
```

Use deterministic sessions created with `initialBonusResources` instead of mutating frozen state.

- [ ] **Step 2: Run the game tests and verify RED**

Run: `npm run test:game`

Expected: TypeScript compilation fails because `GameSession` and `GameEngineOptions` do not contain the new fields.

- [ ] **Step 3: Extend the session factory**

Initialize new sessions with:

```ts
bonusResources: options.initialBonusResources ?? createBonusResources(),
hintUsedForCurrentTurn: false
```

`createNextClassicSession` must call `carryResourcesToNextLevel(previous.bonusResources)`; `createClassicSession` used for a manual restart must continue to start from empty resources.

- [ ] **Step 4: Apply resources in existing turn functions**

Implement these exact rules:

- Correct answer calculates the existing base score first, doubles it only when `scoreMultiplierTurns > 0`, then decrements multiplier turns by one.
- Correct answer calls `gainTurnEnergy` with the new combo, answer difficulty and `hintUsedForCurrentTurn`.
- Correct answer resets `hintUsedForCurrentTurn` to `false`.
- Wrong answer increments `wrongCount`; when a shield exists it consumes one layer and preserves combo, otherwise it follows the existing combo reset behavior.
- Requesting a hint consumes one `hintTicket` before charging 50 score.
- Requesting a hint sets `hintUsedForCurrentTurn` to `true`; repeated requests in the same turn may reveal another candidate but still consume the applicable ticket or score cost.

- [ ] **Step 5: Run focused and regression tests**

Run: `npm run test:game && npm run test:bonus-energy`

Expected: both commands PASS and all original classic-mode assertions remain green.

- [ ] **Step 6: Commit**

```bash
git add src/domain/game.ts src/game/game-engine.ts tests/game-engine.test.mjs
git commit -m "feat: integrate bonus resources with classic mode"
```

---

### Task 3: 建立補尾字題目與可靠干擾字產生器

**Files:**
- Create: `src/game/bonus/question-generator.ts`
- Create: `tests/bonus-question-generator.test.mjs`
- Modify: `package.json:8-26`

**Interfaces:**

```ts
export interface BonusQuestionChoice {
  readonly holeIndex: number;
  readonly character: string;
}

export interface BonusQuestion {
  readonly id: string;
  readonly idiomId: string;
  readonly idiomText: string;
  readonly prompt: string;
  readonly answer: string;
  readonly choices: readonly BonusQuestionChoice[];
  readonly correctHoleIndex: number;
}

export interface QuestionGeneratorOptions {
  readonly pickIndex?: (length: number) => number;
  readonly createQuestionId?: () => string;
}

export function createBonusQuestion(
  index: IdiomIndex,
  usedIdiomIds: ReadonlySet<string>,
  holeCount: 6 | 9,
  recentCorrectHoles: readonly number[],
  options?: QuestionGeneratorOptions
): BonusQuestion | null;
```

- [ ] **Step 1: Write failing generator tests**

Use a fixture containing at least six enabled idioms with distinct tail characters and one disabled idiom. Assert:

```js
assert.equal(question.prompt, '畫龍點＿');
assert.equal(question.answer, '睛');
assert.equal(question.choices.length, 4);
assert.equal(new Set(question.choices.map((choice) => choice.character)).size, 4);
assert.equal(question.choices.filter((choice) => choice.character === '睛').length, 1);
assert.equal(question.choices.some((choice) => choice.holeIndex >= 6), false);
assert.equal(question.correctHoleIndex === 2, false); // recent correct holes were [2, 2]
assert.equal(index.byText.has(`畫龍點${distractor}`), false);
```

Add separate tests for skipping used idioms, ignoring disabled idioms, returning `null` when fewer than three safe distractors exist, and producing 9-hole placements.

- [ ] **Step 2: Add the test script and verify RED**

```json
{
  "scripts": {
    "test:bonus-question": "npm run compile:core && node --test tests/bonus-question-generator.test.mjs"
  }
}
```

Run: `npm run test:bonus-question`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement candidate priority and validation**

For each selected idiom:

1. Build `prefix` from the first three Han characters.
2. Collect tail characters from enabled idioms with the same final bopomofo token.
3. Append tail characters with the same final pinyin token.
4. Append unique tail characters from idioms of the same difficulty.
5. Append remaining unique tail characters from the enabled dictionary.
6. Remove the true answer, duplicate characters, non-Han characters, and any character for which `index.byText.has(prefix + character)` is true.
7. Select the first three safe distractors after deterministic shuffle.
8. Pick four unique hole indexes and reject the same correct hole when the two most recent correct holes are identical.

The generator must freeze the question, choices and returned arrays.

- [ ] **Step 4: Run generator tests**

Run: `npm run test:bonus-question`

Expected: all generator tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/game/bonus/question-generator.ts tests/bonus-question-generator.test.mjs package.json
git commit -m "feat: generate safe idiom mole questions"
```

---

### Task 4: 建立可暫停且防重複輸入的打地鼠狀態機

**Files:**
- Create: `src/game/bonus/whack-a-mole-engine.ts`
- Create: `tests/whack-a-mole-engine.test.mjs`
- Modify: `src/domain/bonus.ts`
- Modify: `package.json:8-27`

**Interfaces:**

```ts
export type BonusRoundPhase = 'active' | 'feedback' | 'paused' | 'settled';

export interface WhackEngineDependencies {
  readonly now: () => number;
  readonly nextQuestion: (
    usedIdiomIds: ReadonlySet<string>,
    recentCorrectHoles: readonly number[]
  ) => BonusQuestion | null;
}

export function startWhackRound(
  rewardType: BonusRewardType,
  difficulty: BonusDifficulty,
  dependencies: WhackEngineDependencies
): BonusRound;

export function answerWhackRound(
  round: BonusRound,
  questionId: string,
  holeIndex: number,
  dependencies: WhackEngineDependencies
): BonusRound;

export function tickWhackRound(
  round: BonusRound,
  dependencies: WhackEngineDependencies
): BonusRound;

export function pauseWhackRound(round: BonusRound, nowMs: number): BonusRound;
export function resumeWhackRound(round: BonusRound, nowMs: number): BonusRound;
```

- [ ] **Step 1: Write failing round-engine tests**

Cover these exact behaviors:

```js
assert.equal(round.remainingMs, 15_000);
assert.equal(correct.score, 100);
assert.equal(correct.correctCount, 1);
assert.equal(correct.combo, 1);
assert.equal(staleDoubleTap, correct);
assert.equal(wrong.phase, 'feedback');
assert.equal(wrong.feedbackUntilMs, now + 800);
assert.equal(challengeWrong.deadlineMs, originalDeadline - 1_000);
assert.equal(extremeWrong.combo, 0);
assert.equal(paused.phase, 'paused');
assert.equal(resumed.deadlineMs, originalDeadline + pauseDuration);
assert.equal(expired.phase, 'settled');
```

Also prove that:

- easy wrong answer subtracts 20 and preserves combo;
- normal wrong answer subtracts 50 and resets combo;
- challenge wrong answer subtracts 50 and one second;
- extreme wrong answer subtracts one second and resets combo without an additional score deduction;
- score never falls below zero;
- `tickWhackRound` moves from 800ms feedback to the next question;
- no-question startup settles cleanly;
- settled rounds return the same object for answer, tick, pause and resume calls.

- [ ] **Step 2: Add the script and verify RED**

```json
{
  "scripts": {
    "test:bonus-round": "npm run compile:core && node --test tests/whack-a-mole-engine.test.mjs"
  }
}
```

Run: `npm run test:bonus-round`

Expected: FAIL because the round engine does not exist.

- [ ] **Step 3: Implement monotonic deadline and feedback phases**

Use `deadlineMs = startedAtMs + 15_000`. `remainingMs` is always `Math.max(0, deadlineMs - now())`. A correct answer immediately requests the next question. A wrong answer stores the correct full idiom and enters `feedback` until `now + 800`; only `tickWhackRound` may advance from feedback.

Reject input when any condition is true:

```ts
round.phase !== 'active' ||
round.question.id !== questionId ||
round.remainingMs <= 0
```

- [ ] **Step 4: Implement pause and resume**

`pauseWhackRound` records `pausedAtMs` without changing score or question. `resumeWhackRound` shifts `deadlineMs` and `feedbackUntilMs` by `nowMs - pausedAtMs`, then restores the phase that existed before pause.

- [ ] **Step 5: Run round tests**

Run: `npm run test:bonus-round`

Expected: all round state-machine tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/bonus.ts src/game/bonus/whack-a-mole-engine.ts tests/whack-a-mole-engine.test.mjs package.json
git commit -m "feat: add deterministic whack-a-mole engine"
```

---

### Task 5: 計算四種獎勵並安全套用到主線

**Files:**
- Create: `src/game/bonus/reward-calculator.ts`
- Create: `tests/bonus-reward.test.mjs`
- Modify: `src/domain/bonus.ts`
- Modify: `package.json:8-28`

**Interfaces:**

```ts
export interface BonusSettlement {
  readonly rewardType: BonusRewardType;
  readonly rewardAmount: number;
  readonly perfect: boolean;
  readonly perfectScoreBonus: number;
  readonly perfectEnergyBonus: number;
}

export function calculateBonusSettlement(round: BonusRound): BonusSettlement;

export function applyBonusSettlement(
  session: GameSession,
  settlement: BonusSettlement
): GameSession;
```

- [ ] **Step 1: Write failing threshold tests**

Assert the complete matrix:

- hint tickets: `0..2 => 0`, `3..5 => 1`, `6..8 => 2`, `9+ => 3`;
- time: `0..2 => 0`, `3..5 => 5`, `6..8 => 10`, `9+ => 15` seconds;
- score multiplier: fewer than 3 => 0 turns, 3+ => 3 turns, 9+ with zero mistakes => 5 turns;
- shield: `0..2 => 0`, `3..5 => 1`, `6+ => 2` layers;
- perfect requires `correctCount > 0 && wrongCount === 0`;
- perfect grants exactly 300 main-line score and 10 energy;
- shield is capped at 3;
- multiplier uses `Math.max(existingTurns, rewardAmount)` rather than addition;
- applying the same settlement twice is prevented by storing a settlement ID in the round and allowing only a newly settled round to be consumed once.

- [ ] **Step 2: Add the script and verify RED**

```json
{
  "scripts": {
    "test:bonus-reward": "npm run compile:core && node --test tests/bonus-reward.test.mjs"
  }
}
```

Run: `npm run test:bonus-reward`

Expected: FAIL because the calculator does not exist.

- [ ] **Step 3: Implement exact reward calculation**

Return frozen settlement objects. For perfect rounds, set `perfectScoreBonus: 300` and `perfectEnergyBonus: 10`; otherwise both values are zero. Internal打地鼠 score remains visible in results but is not copied wholesale into the main-line score.

- [ ] **Step 4: Implement immutable resource application**

`applyBonusSettlement` must update only the selected resource plus perfect bonuses:

```ts
energy: Math.min(100, current.energy + settlement.perfectEnergyBonus),
shieldLayers: Math.min(3, current.shieldLayers + shieldAward),
scoreMultiplierTurns: Math.max(current.scoreMultiplierTurns, multiplierAward),
timeBonusSeconds: current.timeBonusSeconds + timeAward
```

Hint tickets may accumulate because each one is consumed by a later hint request; the UI displays the count.

- [ ] **Step 5: Run reward and regression tests**

Run: `npm run test:bonus-reward && npm run test:game`

Expected: both commands PASS.

- [ ] **Step 6: Commit**

```bash
git add src/domain/bonus.ts src/game/bonus/reward-calculator.ts tests/bonus-reward.test.mjs package.json
git commit -m "feat: calculate and apply bonus rewards"
```

---

### Task 6: 建立 React 回合控制器與背景暫停機制

**Files:**
- Create: `src/app/use-whack-a-mole.ts`
- Modify: `src/app/use-classic-game.ts:1-170`

**Interfaces:**

```ts
export type BonusView = 'closed' | 'selecting' | 'playing' | 'result';

export interface WhackAMoleController {
  readonly view: BonusView;
  readonly round: BonusRound | null;
  readonly settlement: BonusSettlement | null;
  readonly availableRewards: readonly BonusRewardType[];
  openRewardSelector(): void;
  startRound(rewardType: BonusRewardType): void;
  hitHole(questionId: string, holeIndex: number): void;
  closeResult(): void;
  cancelSelection(): void;
}
```

`ClassicGameController` additionally exposes:

```ts
readonly bonus: WhackAMoleController;
continueGame(): void;
```

- [ ] **Step 1: Implement the hook around the pure engine**

Use one `requestAnimationFrame` loop only while `round.phase` is `active` or `feedback`. Each frame calls `tickWhackRound`; cancel the frame during cleanup, result view and unmount.

- [ ] **Step 2: Implement 6／9 hole selection**

Use `window.matchMedia('(min-width: 48rem)')`. The hook passes `6` below 768px and `9` at or above 768px to `createBonusQuestion`; subscribe to the media-query `change` event and remove the listener during cleanup.

- [ ] **Step 3: Implement background pause and resume**

Register one `document.visibilitychange` listener. When hidden, call `pauseWhackRound(round, performance.now())`; when visible, call `resumeWhackRound(round, performance.now())`. Remove the listener during cleanup.

- [ ] **Step 4: Integrate session resource transitions**

- `openRewardSelector` is enabled only when session energy is exactly 100 and the main session is active.
- `cancelSelection` returns to main-line play without spending energy.
- `startRound` first creates a valid round; only then replace session resources with `spendFullEnergy`.
- `availableRewards` for classic mode is `['hint-ticket', 'score-multiplier', 'shield']`.
- When the round reaches `settled`, calculate and apply the settlement once, then show the result view.
- `closeResult` clears round and settlement while preserving the updated main-line session.
- `continueGame` calls `createNextClassicSession`; `restartGame` continues to discard current resources.

- [ ] **Step 5: Run TypeScript and engine tests**

Run: `npm run typecheck && npm run test:game && npm run test:bonus-round && npm run test:bonus-reward`

Expected: all commands PASS without React hook dependency warnings.

- [ ] **Step 6: Commit**

```bash
git add src/app/use-whack-a-mole.ts src/app/use-classic-game.ts
git commit -m "feat: connect bonus round to classic controller"
```

---

### Task 7: 建立大字體打地鼠介面、鍵盤操作與低刺激動畫

**Files:**
- Create: `src/app/bonus/EnergyMeter.tsx`
- Create: `src/app/bonus/RewardSelector.tsx`
- Create: `src/app/bonus/MoleHole.tsx`
- Create: `src/app/bonus/WhackAMoleBoard.tsx`
- Create: `src/app/bonus/BonusResult.tsx`
- Modify: `src/app/App.tsx:1-170`
- Modify: `src/app/App.css:1-end`

**Interfaces:**

```ts
interface EnergyMeterProps {
  energy: number;
  disabled: boolean;
  onStart(): void;
}

interface WhackAMoleBoardProps {
  round: BonusRound;
  onHit(questionId: string, holeIndex: number): void;
}
```

- [ ] **Step 1: Add the energy meter to the main game screen**

Render a native `<progress max={100} value={energy}>` with visible percentage text. Show「啟動成語打地鼠」only at 100%; while below 100%, show「再累積 N%」。Display resource chips for hint tickets, shields and remaining multiplier turns.

- [ ] **Step 2: Add the reward selector**

Render three large cards in classic mode:

- `提示券`：下一次提示優先免費使用；
- `雙倍分數`：下一批正確答案取得 2 倍分數；
- `失誤護盾`：答錯時保留分數與連擊。

Include「稍後再玩」to call `cancelSelection`. Do not render the time reward in classic mode.

- [ ] **Step 3: Build accessible mole holes**

Each active hole is a `<button>` with:

```tsx
aria-label={`第 ${holeIndex + 1} 洞，候選字 ${character}`}
data-hole-index={holeIndex}
```

Sleeping holes are disabled and use `aria-label="目前沒有地鼠"`. The visible character is at least 40px. Do not use images or external assets.

- [ ] **Step 4: Add board keyboard controls**

While the board is mounted, listen for keys `1` through `9`. Convert the key to `holeIndex = Number(key) - 1`; call `onHit` only when that hole currently has an active choice. Remove the listener during cleanup.

- [ ] **Step 5: Add question, timer and feedback presentation**

- Show the prompt at least 44px.
- Show remaining time as one decimal place and a progress bar.
- Use `aria-live="polite"` for correct feedback and `role="status"` for the full correct idiom during the 800ms wrong-answer phase.
- Disable all holes in `feedback`, `paused` and `settled` phases.
- Use the phrases「好眼力！」「一擊命中！」「成語高手！」based on combo thresholds.

- [ ] **Step 6: Add responsive CSS**

Append styles with these concrete constraints:

```css
.mole-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem; }
.mole-hole { min-width: 0; min-height: 72px; touch-action: manipulation; }
.energy-panel, .bonus-panel, .bonus-result { border: 2px solid var(--line); border-radius: 1.4rem; }
```

At widths of 768px or more, keep three columns and allow nine holes. Under `prefers-reduced-motion: reduce`, remove bounce, shake and flame animation while retaining text and border feedback. No animation may flash more than three times per second.

- [ ] **Step 7: Wire App view switching**

`App.tsx` renders exactly one of these surfaces:

1. home;
2. classic main line;
3. reward selector;
4. whack-a-mole board;
5. bonus result.

The existing classic input and history remain mounted only in the classic main-line surface.

- [ ] **Step 8: Run build checks**

Run: `npm run typecheck && npm run lint && npm run build`

Expected: all commands PASS.

- [ ] **Step 9: Commit**

```bash
git add src/app/bonus src/app/App.tsx src/app/App.css
git commit -m "feat: add accessible idiom mole interface"
```

---

### Task 8: 更新文件、完成全面驗證與 PR 交付

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-08-05-whack-a-mole-bonus-design.md`
- Modify: `package.json`

- [ ] **Step 1: Add all bonus tests to the main test command**

The final `test` script must execute existing suites plus:

```json
"test:bonus-energy",
"test:bonus-question",
"test:bonus-round",
"test:bonus-reward"
```

Keep every focused script available for diagnosis.

- [ ] **Step 2: Update README behavior documentation**

Document:

- energy accumulation formula;
- 100% manual activation;
- three classic-mode reward choices;
- 15-second final-character questions;
- four bonus difficulties with standard as the default;
- background pause behavior;
- keyboard keys 1～9;
- the current dictionary remains development sample data.

Move the feature from「尚未實作」to「目前完成範圍」only after all verification commands pass.

- [ ] **Step 3: Run complete automated verification**

Run in this order:

```bash
npm install
npm run build:data
npm test
npm run typecheck
npm run lint
npm run build
./scripts/verify.sh
```

Expected:

- every command exits with status 0;
- no generated dictionary checksum mismatch;
- no failing Node tests;
- no TypeScript or ESLint errors;
- `dist/` contains the production PWA bundle.

- [ ] **Step 4: Perform browser acceptance checks**

Run:

```bash
npx vite preview --host 0.0.0.0
```

Verify at 360×800:

1. no horizontal scrollbar;
2. all main buttons are at least 56px high;
3. all mole buttons are at least 72px high;
4. six holes fit in two rows;
5. energy reaches 100 and does not exceed 100;
6. reward selection can be cancelled without spending energy;
7. stale double taps do not add score twice;
8. backgrounding pauses the countdown;
9. reduced-motion mode removes bounce and shake;
10. offline reload can still enter the bonus round after one complete online load.

Verify at 768×1024:

1. nine holes appear in three rows;
2. keys 1～9 activate the corresponding active holes;
3. reward result returns to the unchanged main-line chain state.

- [ ] **Step 5: Inspect the diff for scope and content safety**

Run:

```bash
git diff --check
git grep -nE 'TBD|TODO|FIXME|生成式 AI|fetch\("https?://' -- ':!docs/superpowers/plans/*'
```

Expected: `git diff --check` is empty; no unfinished markers, runtime AI generation, or external question-fetching code is present.

- [ ] **Step 6: Commit delivery documentation**

```bash
git add README.md docs/superpowers/specs/2026-08-05-whack-a-mole-bonus-design.md package.json
git commit -m "docs: document whack-a-mole bonus delivery"
```

- [ ] **Step 7: Push and update the existing PR**

```bash
git push origin feat/whack-a-mole-bonus
```

Update PR #2 with the final test counts, build result, browser acceptance matrix and any environment limitation. Do not open a second implementation PR for the same branch.

---

## Final Acceptance Matrix

| Requirement | Verification |
|---|---|
| Energy formula and 100 cap | `tests/bonus-energy.test.mjs` |
| Hint suppresses all extra energy | energy and game-engine tests |
| Cross-level 50 carry | energy and next-session tests |
| Safe single-answer questions | generator tests |
| Correct hole not repeated three times | generator tests |
| 15-second monotonic timer | round-engine tests |
| Easy／normal／challenge／extreme penalties | round-engine tests |
| 800ms wrong-answer reveal | round-engine tests |
| Double-tap protection | round-engine and browser acceptance |
| Pause on background | round-engine and browser acceptance |
| Hint／time／multiplier／shield thresholds | reward tests |
| Perfect 300 score and 10 energy | reward tests |
| One-time settlement | reward tests |
| 6 mobile／9 tablet holes | browser acceptance |
| Touch, mouse and keys 1～9 | browser acceptance |
| Large targets and reduced motion | CSS inspection and browser acceptance |
| Offline PWA play | production preview acceptance |
| No backend or runtime AI | diff and grep inspection |
