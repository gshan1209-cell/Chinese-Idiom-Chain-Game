# Phase 5 Campaign Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 為第一章 20 關加入 IndexedDB 進度保存、星級、解鎖、關卡地圖與繼續闖關。

**Architecture:** 進度規則採純 TypeScript `progress-engine`，瀏覽器持久化由獨立 IndexedDB repository 實作，React hook 僅協調非同步載入與保存。關卡地圖與填字遊戲透過明確 props 溝通，鎖定規則在領域層與 UI handler 雙重檢查。所有 IndexedDB mutation 透過寫入佇列序列化，避免舊交易覆蓋新進度。

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

- [x] Write failing tests for initial unlock, all star thresholds, sequential unlock, level 20 cap, best-record preservation, total stars, continue level and invalid level rejection.
- [x] Confirm RED through GitHub Actions: missing `progress-engine.js` while all prior tests remain green.
- [x] Implement immutable domain types and pure functions.
- [x] Re-run progress tests and confirm pass.

### Task 2: 儲存資料解析與 IndexedDB Repository

**Files:**
- Create: `src/progress/progress-serialization.ts`
- Create: `src/progress/progress-repository.ts`
- Create: `src/progress/indexeddb-progress-repository.ts`
- Create: `tests/progress-serialization.test.mjs`

- [x] Write failing tests for valid round-trip, malformed object fallback, unsupported schema fallback, out-of-range clamping, invalid record removal and chapter-size changes.
- [x] Confirm RED through GitHub Actions: missing `progress-serialization.js`.
- [x] Implement strict unknown-data parsing without unsafe assertions.
- [x] Implement `load`, `save` and `clear` using `cicg-progress/campaigns/chapter-1`.
- [x] Reject request, transaction, open and blocked failures with meaningful errors.
- [x] Re-run serialization and TypeScript tests and confirm pass.

### Task 3: React Campaign Progress Hook

**Files:**
- Create: `src/app/use-campaign-progress.ts`

- [x] Implement immediate in-memory initial progress.
- [x] Load persisted data only while the component remains active.
- [x] Reject locked or invalid level starts and persist `lastPlayedLevel`.
- [x] Update completion state immediately before asynchronous persistence.
- [x] Retain playable memory state and expose a warning on storage failure.
- [x] Keep callbacks stable and external side effects outside React state updaters.

### Task 4: 關卡地圖與 Campaign 容器

**Files:**
- Create: `src/app/LevelMap.tsx`
- Create: `src/app/LevelMap.css`
- Create: `src/app/CampaignGame.tsx`
- Modify: `src/app/App.tsx`

- [x] Build 20 level cards with title, difficulty, lock state and 0–3 best stars.
- [x] Show unlocked count, total stars out of 60 and last-played level.
- [x] Add `繼續闖關` using the progress engine.
- [x] Reject locked-card opening in the handler and show a clear message.
- [x] Add storage warning and confirmed reset action.
- [x] Route the home primary action through `CampaignGame` while retaining classic mode.

### Task 5: Controlled PuzzleGame 與完成結果回報

**Files:**
- Modify: `src/app/use-puzzle-game.ts`
- Modify: `src/app/PuzzleGame.tsx`
- Modify: `src/app/PuzzleGame.css`

- [x] Create a requested level session from `initialLevelNumber`.
- [x] Report each completion exactly once per play attempt with effect/ref protection.
- [x] Replace campaign play exit with `關卡地圖`.
- [x] Show earned stars, updated best stars, return-map and next-level actions.
- [x] Show `完成第一章` on level 20 and prevent navigation past the chapter.
- [x] Run puzzle, progress, TypeScript and ESLint verification.

### Task 5.1: Code Review Hardening — IndexedDB Write Ordering

**Files:**
- Create: `src/progress/progress-write-queue.ts`
- Create: `tests/progress-write-queue.test.mjs`
- Modify: `src/app/use-campaign-progress.ts`
- Modify: `package.json`

- [x] Trace the stale-write risk to independent asynchronous repository mutations.
- [x] Write RED tests reproducing delayed first writes and failure recovery.
- [x] Confirm RED: 64 existing tests pass and only the missing queue module fails.
- [x] Implement a serial Promise queue that continues after rejected writes.
- [x] Route save and clear operations through the same queue.
- [x] Confirm GREEN through GitHub Actions with 66 tests and the full repository gate.

### Task 6: Scripts、文件與完整驗證

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-08-05-phase-5-campaign-progress.md`

- [x] Include progress engine, serialization and write-queue tests in `npm test`.
- [x] Update README completed scope, progress rules, IndexedDB storage, architecture and remaining work.
- [x] Record implementation and review evidence in this plan.
- [x] Run the final latest-head `./scripts/verify.sh` through GitHub Actions and confirm 66 tests, typecheck, lint, shell checks and PWA build.
- [x] Compare the final branch to `main` and confirm `behind_by: 0`.
- [x] Update PR #3 with exact scope, verification evidence and limitations; mark ready for review.
- [x] Confirm the final GitHub Actions `verify` succeeds before squash merge.

## Closure Record

- Pull Request: `#3 feat: add persistent campaign progress and level map`
- PR head verified: `4df03845afa76a0716bdf75a96e4e70046966b7a`
- Verification: 66/66 Node tests, TypeScript strict, ESLint, data build, shell checks, npm audit and PWA production build passed.
- Drift check before merge: `ahead 25 / behind 0`.
- Merge method: squash.
- Main merge commit: `a85301563e858a702443b738e74b4d36e71aa9fe`.
- Merged at: `2026-08-05T12:30:41Z`.
