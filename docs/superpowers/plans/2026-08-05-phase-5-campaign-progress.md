# Phase 5 Campaign Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 為第一章 20 關加入 IndexedDB 進度保存、星級、解鎖、關卡地圖與繼續闖關。

**Architecture:** 進度規則採純 TypeScript `progress-engine`，瀏覽器持久化由獨立 IndexedDB repository 實作，React hook 僅協調非同步載入與保存。關卡地圖與填字遊戲透過明確 props 溝通，鎖定規則在領域層與 UI handler 雙重檢查。

**Tech Stack:** React 19、TypeScript、原生 IndexedDB、Node test、Vite PWA。

## Global Constraints

- 正式環境不新增第三方依賴。
- Database 固定為 `cicg-progress`，version `1`，object store `campaigns`。
- 第一章 campaign key 固定為 `chapter-1`。
- 第 1 關永遠解鎖；完成第 N 關解鎖第 N+1 關。
- 三星為零提示零錯誤；二星為提示不超過一次且錯誤不超過兩次；完成至少一星。
- 儲存失敗不得阻擋遊戲。
- 重玩不得覆蓋更佳星級或最高分。
- 所有既有 49 項測試必須保留。

---

### Task 1: 進度領域模型與純函式引擎

**Files:**
- Create: `src/domain/progress.ts`
- Create: `src/progress/progress-engine.ts`
- Create: `tests/progress-engine.test.mjs`
- Modify: `tsconfig.core.json`

**Interfaces:**
- Produces: `CampaignProgress`, `LevelCompletionResult`, `createInitialCampaignProgress(totalLevels, now)`, `calculateStars(result)`, `isLevelUnlocked(progress, levelNumber)`, `recordLevelStarted(progress, levelNumber, totalLevels, now)`, `recordLevelCompletion(progress, result, totalLevels, now)`, `getContinueLevelNumber(progress, totalLevels)`, `getTotalStars(progress)`.

- [ ] Write failing tests for initial unlock, all star thresholds, sequential unlock, level 20 cap, best-record preservation, total stars, continue level and invalid level rejection.
- [ ] Run `npm run compile:core && node --test tests/progress-engine.test.mjs`; expect module-not-found failure.
- [ ] Implement immutable domain types and pure functions. Clamp persisted level numbers to `1..totalLevels`; throw for direct API calls with invalid level numbers.
- [ ] Re-run the progress tests; expect all pass.
- [ ] Commit `feat: add campaign progress engine`.

### Task 2: 儲存資料解析與 IndexedDB Repository

**Files:**
- Create: `src/progress/progress-serialization.ts`
- Create: `src/progress/progress-repository.ts`
- Create: `src/progress/indexeddb-progress-repository.ts`
- Create: `tests/progress-serialization.test.mjs`

**Interfaces:**
- Consumes: `CampaignProgress`, `createInitialCampaignProgress`.
- Produces: `parseCampaignProgress(value, totalLevels, now): CampaignProgress`, `CampaignProgressRepository`, `createIndexedDbProgressRepository(indexedDB): CampaignProgressRepository`.

- [ ] Write failing tests for valid round-trip, malformed object fallback, unsupported schema fallback, out-of-range level clamping, invalid level-record removal and total-level changes.
- [ ] Run the serialization test; expect module-not-found failure.
- [ ] Implement strict unknown-data parsing without unsafe type assertions.
- [ ] Implement repository methods `load(totalLevels)`, `save(progress)`, `clear()` using database `cicg-progress`, store `campaigns`, key `chapter-1`.
- [ ] Make every transaction reject with a meaningful Error on request, transaction or open failure.
- [ ] Re-run serialization and TypeScript tests; expect pass.
- [ ] Commit `feat: add indexeddb progress repository`.

### Task 3: React Campaign Progress Hook

**Files:**
- Create: `src/app/use-campaign-progress.ts`

**Interfaces:**
- Consumes: `CampaignProgressRepository`, progress engine functions and `PUZZLE_LEVELS.length`.
- Produces: `{ progress, loading, storageWarning, startLevel, completeLevel, clearProgress }`.

- [ ] Implement lazy initial in-memory progress so rendering never waits for IndexedDB.
- [ ] On mount, load persisted data and replace in-memory progress only while active.
- [ ] `startLevel(levelNumber)` must reject locked or out-of-range levels and persist `lastPlayedLevel`.
- [ ] `completeLevel(result)` must update progress immediately, then save asynchronously.
- [ ] On save/load failure, retain current progress and expose `storageWarning`.
- [ ] Ensure callbacks are stable with `useCallback` and no state updater performs external side effects.
- [ ] Run `npm run typecheck` and `npm run lint`; expect pass.
- [ ] Commit `feat: add campaign progress hook`.

### Task 4: 關卡地圖與 Campaign 容器

**Files:**
- Create: `src/app/LevelMap.tsx`
- Create: `src/app/LevelMap.css`
- Create: `src/app/CampaignGame.tsx`
- Modify: `src/app/App.tsx`

**Interfaces:**
- Consumes: `CampaignProgress`, `PUZZLE_LEVELS`, `isLevelUnlocked`, `getContinueLevelNumber`, `getTotalStars`.
- Produces: a campaign screen that switches between map and controlled `PuzzleGame`.

- [ ] Build a 20-card map displaying level number, title, difficulty, lock state and best 0–3 stars.
- [ ] Add chapter summary showing unlocked count and total stars out of 60.
- [ ] Add `繼續闖關` using `getContinueLevelNumber`.
- [ ] Locked card clicks must show a message and never call `onOpenLevel`.
- [ ] Add storage-warning banner and reset-progress action with browser confirmation.
- [ ] Change home primary action from direct puzzle session to `CampaignGame`; keep classic mode unchanged.
- [ ] Run TypeScript and ESLint.
- [ ] Commit `feat: add campaign level map`.

### Task 5: Controlled PuzzleGame 與完成結果回報

**Files:**
- Modify: `src/app/use-puzzle-game.ts`
- Modify: `src/app/PuzzleGame.tsx`
- Modify: `src/app/PuzzleGame.css`

**Interfaces:**
- `PuzzleGameProps`: `initialLevelNumber`, `onExitToMap`, `onLevelCompleted(result)`, `onOpenNextLevel(nextLevelNumber)`.
- `LevelCompletionResult`: `{ levelId, levelNumber, score, mistakes, hintsUsed }`.

- [ ] Let `usePuzzleGame(initialLevelNumber)` create the requested session and expose `openLevelNumber`.
- [ ] Detect completion transition with an effect/ref and call `onLevelCompleted` exactly once per play attempt.
- [ ] Replace `返回首頁` with `關卡地圖` inside campaign play.
- [ ] Completion panel shows earned stars, best stars after save, `返回地圖`, and `下一關`; final level shows `完成第一章`.
- [ ] Prevent direct next navigation beyond level 20.
- [ ] Run all puzzle and progress tests, then typecheck and lint.
- [ ] Commit `feat: connect puzzle completion to campaign progress`.

### Task 6: Scripts、文件與完整驗證

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-08-05-phase-5-campaign-progress.md`

**Interfaces:**
- Adds `test:progress` and includes it in `test`.

- [ ] Add progress-engine and serialization tests to `npm test`.
- [ ] Update README completed scope, progress rules, IndexedDB storage and remaining work.
- [ ] Mark plan checkboxes complete only after their evidence exists.
- [ ] Run `./scripts/verify.sh`; expect data build, all tests, typecheck, lint, shell check and PWA build to pass.
- [ ] Compare branch to `main`; require `behind_by: 0`.
- [ ] Open PR with exact test counts and limitations.
- [ ] Merge only after GitHub Actions `verify` succeeds.
