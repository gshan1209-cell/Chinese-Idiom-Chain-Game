# Phase 4 Idiom Crossword Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 將「縱橫成語填字闖關」升級為首頁主玩法，完成關卡模型、盤面引擎、候選字填格、提示、過關與第一批 20 關。

**Architecture:** 關卡資料與遊戲邏輯採純 TypeScript，React 只負責呈現與互動。每關由成語 placement 定義，盤面建置器負責驗證交叉字一致、產生可填格與候選字；session 引擎負責選格、填字、移除、提示、完成判定。自由接龍保留為次要模式，不刪除既有引擎。

**Tech Stack:** React 19、TypeScript、Node test、Vite PWA、本機 JSON 關卡資料。

## Global Constraints

- 主玩法為點選候選中文字填入縱橫方格，不使用鍵盤輸入。
- 方格與候選字按鈕在手機上至少 48px，主要文字維持大字體。
- MVP 不含登入、金流、多人連線、廣告與 AI 生成內容。
- 關卡資料必須可離線載入並由 TypeScript 驗證。
- 所有交叉格的答案必須一致；重複座標不得出現衝突字。
- 提示只填入一格正確答案，且不覆蓋已正確填入的格子。
- 第一批提供 20 關；示範成語沿用現有資料，正式發布前仍需完成授權與校訂。

---

### Task 1: 關卡領域模型與盤面建置器

**Files:**
- Create: `src/domain/puzzle.ts`
- Create: `src/puzzle/puzzle-board.ts`
- Create: `tests/puzzle-board.test.mjs`

- [ ] 先寫失敗測試：兩個 placement 正確交叉時共用同一格。
- [ ] 寫失敗測試：交叉字衝突時拒絕建立關卡。
- [ ] 寫失敗測試：超出盤面與非四字成語 placement 被拒絕。
- [ ] 實作 `buildPuzzleBoard(level)` 與不可變 cell map。
- [ ] 執行測試並確認通過。

### Task 2: 填字 session 引擎

**Files:**
- Create: `src/puzzle/puzzle-engine.ts`
- Create: `tests/puzzle-engine.test.mjs`

- [ ] 先寫失敗測試：點選空格後填入候選字。
- [ ] 先寫失敗測試：錯字可顯示錯誤但不結束關卡。
- [ ] 先寫失敗測試：移除字後候選字回到字池。
- [ ] 先寫失敗測試：提示填入一個尚未完成的正確格。
- [ ] 先寫失敗測試：全部正確後狀態為 completed。
- [ ] 實作 session 純函式與分數／提示計數。

### Task 3: 第一批 20 關與資料驗證

**Files:**
- Create: `src/puzzle/levels.ts`
- Create: `tests/puzzle-levels.test.mjs`

- [ ] 建立 20 關，前 5 關 2 個成語，後續逐步增加到 3–4 個成語。
- [ ] 每關至少有一個交叉格、至少兩個固定提示字。
- [ ] 驗證 level id、順序、候選字數量、placement 與盤面一致性。
- [ ] 確認 20 關全部可建立盤面且可解。

### Task 4: React 闖關介面

**Files:**
- Create: `src/app/PuzzleGame.tsx`
- Create: `src/app/use-puzzle-game.ts`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.css`

- [ ] 首頁主按鈕改為「開始闖關」。
- [ ] 建立關卡頂部列、盤面、候選字池、提示／清除／重排按鈕。
- [ ] 已填正確、錯誤、目前選取與固定格有清楚視覺狀態。
- [ ] 完成關卡後顯示成語清單與「下一關」。
- [ ] 自由接龍保留為次要入口。

### Task 5: 測試、腳本與文件

**Files:**
- Modify: `package.json`
- Modify: `tsconfig.core.json`
- Modify: `README.md`

- [ ] 新增 puzzle board／engine／levels 測試命令。
- [ ] 執行所有既有測試與新增測試。
- [ ] 執行核心 TypeScript 型別檢查與 Shell 語法檢查。
- [ ] 更新 README，將成語填字闖關列為主玩法。
- [ ] 合併前確認功能分支 ahead 1、behind 0。
