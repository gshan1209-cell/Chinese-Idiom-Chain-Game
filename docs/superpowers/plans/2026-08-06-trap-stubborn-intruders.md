# 頑固伏字 Phase 3 Implementation Plan

> 狀態：Ready for TDD execution  
> 日期：2026-08-06  
> 分支：`feat/trap-stubborn-intruders`  
> 基準 main：`2de11185b060312ce3bdde19f865ffd13d311e9b`

## 目標

依已核准的 `docs/superpowers/specs/2026-08-06-trap-mode-design.md`，完成第一章填字闖關的 Phase 3「頑固伏字」。本模式在完成第 15 關後解鎖，組合候選偽字、盤面伏字與頑固伏字；頑固伏字必須連續有效點擊三次才拔除。

## 永久邊界

- 不修改 `PuzzleSession`、關卡、星級、分數、錯誤、提示券、自由接龍、打地鼠、媒體中心或進度 IndexedDB schema。
- 所有陷阱規則位於純 TypeScript；React 只負責呈現、事件與瀏覽器回饋。
- 頑固伏字永遠是獨立 overlay，不把假字寫入 `session.values`、`tileByCell` 或候選字牌。
- 標準、候選偽字與盤面伏字模式的既有行為不得退化。
- 同一時間最多一個頑固伏字可見。
- 正式遊戲仍可離線運作；音效與震動為 best-effort，失敗時靜默降級。

## 固定規則

```text
數量：clamp(ceil(fillableCellCount × 0.06), 1, 2)
有效連擊：3 次
連擊視窗：700ms
最小有效點擊間隔：80ms
同時可見上限：1
解鎖：完成第 15 關
```

目標格必須：

- 是尚未填字的可填格。
- 不與候選偽字、盤面伏字或另一個頑固伏字衝突。
- 不是目前選取格。
- 不是依智慧跳格規則推導出的下一目標格。
- 盤面剩餘未解格少於 2 格時不得生成新的頑固伏字。

點擊規則：

- 第一次有效點擊把連擊數設為 1。
- 與前次有效點擊相隔 `< 80ms`：忽略，不更新時間與連擊。
- 相隔 `80ms～700ms`：連擊數加一。
- 相隔 `> 700ms`：連擊重設為 1。
- 第三次有效點擊進入 `ejecting`，動畫完成後才標記 `removed`。
- 點擊不存在、已移除或已 ejecting 的 ID 必須冪等。
- 一般盤面操作會中斷未完成連擊，但不扣分、不記錯、不移除伏字。

安全規則：

- 玩家選取被頑固伏字占用的格子仍可看見選取狀態，但按合法字牌時必須先提示拔除，不呼叫 `placePuzzleTile`，不增加錯誤或分數變化。
- 提示若命中被占用格，必須先安全驅逐伏字，再由既有 `usePuzzleHint` 填入正確字，避免死局。
- 關卡完成、重玩、切換關卡或盤面目標失效時，所有剩餘頑固伏字安全移除或重設。

---

## Task 1：模式組合與第 15 關解鎖

### Files

- Modify: `src/traps/trap-mode.ts`
- Modify: `src/traps/trap-unlocks.ts`
- Modify: `tests/trap-mode.test.mjs`
- Modify: `tests/trap-unlocks.test.mjs`

### RED

新增測試：

1. `trap-stubborn` 同時啟用 candidate、board、stubborn 三種 capability。
2. 只完成第 14 關時仍鎖定。
3. 完成第 15 關後解鎖。
4. 鎖定原因使用繁體中文並明示第 15 關。
5. 其他三種模式 capability 與解鎖門檻保持不變。

執行：

```bash
npm run test:traps
```

確認 RED 只來自 stubborn capability 與 unlock 尚未實作。

### GREEN

- 在 `PuzzleTrapModeCapabilities` 增加 `usesStubbornIntruders`。
- `trap-stubborn` 回傳 candidate + board + stubborn 全部為 `true`。
- `trap-unlocks.ts` 使用既有完成紀錄判斷第 15 關。

重新執行完整 Trap 測試與 Repository Gate。

---

## Task 2：頑固伏字領域模型與安全生成

### Files

- Modify: `src/domain/trap.ts`
- Create: `src/traps/stubborn-intruder-engine.ts`
- Create: `tests/stubborn-intruder-engine.test.mjs`
- Modify: `tsconfig.core.json`
- Modify: `package.json`

### 領域契約

```ts
export type StubbornIntruderStatus =
  | 'scheduled'
  | 'active'
  | 'ejecting'
  | 'removed';

export interface StubbornIntruder {
  readonly id: string;
  readonly character: string;
  readonly targetCellKey: string;
  readonly activationAfterValidPlacements: number;
  readonly requiredHitCount: 3;
  readonly currentHitStreak: number;
  readonly lastAcceptedHitAtMs: number | null;
  readonly status: StubbornIntruderStatus;
}

export interface StubbornIntruderSession {
  readonly levelId: string;
  readonly mode: PuzzlePlayMode;
  readonly validPlacements: number;
  readonly actionCount: number;
  readonly intruders: readonly StubbornIntruder[];
}
```

### RED

測試至少鎖定：

1. 6% 數量與 1～2 上下限。
2. 只有 `trap-stubborn` 會建立頑固伏字。
3. 字元只取自啟用字典，排除答案、合法候選、candidate 與 board 已保留字元。
4. 目標只取空白可填格，排除 selected、next-auto、其他 overlay target。
5. 剩餘空格少於 2 時建立空 session。
6. 安全字或安全格不足時自動減量。
7. orderer 不得注入、刪除、重複或替換安全集合。
8. 相同輸入產生 deeply equal frozen session。

### GREEN

實作純函式：

- `calculateStubbornIntruderCount`
- `createStubbornIntruderSession`
- `getVisibleStubbornIntruders`
- `getStubbornIntruderAtCell`

不得引入 React、DOM、Web Audio、亂數全域狀態或 `Date.now()`。

---

## Task 3：三次連擊與計時狀態機

### Files

- Modify: `src/traps/stubborn-intruder-engine.ts`
- Modify: `tests/stubborn-intruder-engine.test.mjs`

### RED

以明確數值時間測試：

1. 第一次點擊為 `1/3`。
2. 79ms 點擊被忽略，lastAcceptedHitAtMs 不變。
3. 80ms 點擊被接受。
4. 700ms 點擊仍被接受。
5. 701ms 點擊重設為 `1/3`。
6. 第三次有效點擊進入 `ejecting`。
7. `ejecting`、`removed`、未知 ID 重複點擊均冪等。
8. `completeStubbornEjection` 只把 ejecting 轉成 removed。
9. 一般盤面操作把 active 的部分連擊歸零，但不改狀態與目標。
10. 同時只啟用一個到期伏字；完成移除後才允許下一個顯示。

### GREEN

實作：

- `recordStubbornValidPlacement`
- `recordStubbornPuzzleAction`
- `hitStubbornIntruder(session, id, nowMs)`
- `completeStubbornEjection`
- `activateNextDueStubbornIntruder`

所有轉移維持不可變、可重放、可測試。

---

## Task 4：盤面對帳、提示與死局保護

### Files

- Modify: `src/traps/stubborn-intruder-engine.ts`
- Create: `tests/stubborn-intruder-integration.test.mjs`
- Read/Reuse: `src/puzzle/puzzle-engine.ts`

### RED

測試：

1. 目標格被填入、變成 fixed 或關卡完成時，伏字安全轉成 ejecting／removed。
2. selected 或 next-auto 目標改變後，尚未顯示的 scheduled 伏字重新排除失效格。
3. `isStubbornTargetBlocked` 只阻擋 active/ejecting 目標，不阻擋 scheduled/removed。
4. 被阻擋時不呼叫 puzzle placement，不改 score、mistakes、values、tileByCell 或 navigation。
5. 提示命中 active 頑固伏字時，伏字先進入安全移除，提示仍只增加一次 hintsUsed 並填入正確字。
6. 清空、移除、選格、重排與其他有效盤面動作會中斷部分連擊。
7. 關卡完成後沒有任何 visible stubborn intruder。

### GREEN

- 使用 `findNextPuzzleCell` 推導需排除的 next-auto target；不得複製智慧跳格規則。
- 增加 `reconcileStubbornIntruders` 與必要的查詢純函式。
- 保持 Puzzle engine 完全不知道陷阱存在。

---

## Task 5：React hook 與 `usePuzzleGame` 整合

### Files

- Create: `src/app/use-stubborn-intruders.ts`
- Modify: `src/app/use-puzzle-game.ts`
- Create/Modify: `tests/stubborn-intruder-ui-contract.test.mjs`

### RED

架構契約：

1. hook 獨立擁有 stubborn session，不把欄位加入 `PuzzleSession`。
2. candidate → board → stubborn 依固定順序使用 reserved characters 與 target keys，三套陷阱互不衝突。
3. 只有 puzzle session 確實改變的合法放字才推進 stubborn placement counter。
4. 一般有效 puzzle action 中斷部分連擊。
5. 被占用的 selected cell 按字牌時不呼叫 `placePuzzleTile`。
6. hint 流程先安全驅逐再填字。
7. 同關重玩、新關卡與模式切換重設 stubborn session。
8. 字典載入失敗時安全保持零伏字。

### GREEN

hook 公開：

- `visibleIntruders`
- `reservedCharacters`
- `reservedTargetCellKeys`
- `hitIntruder(id, nowMs)`
- `completeEjection(id)`
- `recordValidPlacement(nextPuzzleSession)`
- `recordPuzzleAction(nextPuzzleSession)`
- `prepareHint(targetCellKey)`
- `isCellBlocked(cellKey)`

`usePuzzleGame` 只協調既有 puzzle engine 與三個陷阱 hook，不內嵌頑固規則。

---

## Task 6：玩家 UI、觸控與無障礙

### Files

- Create: `src/app/StubbornIntruder.tsx`
- Modify: `src/app/PuzzleGame.tsx`
- Modify: `src/app/PuzzleGame.css`
- Modify: `src/app/LevelMap.tsx`
- Modify: `src/app/LevelMap.css`
- Modify: `src/app/trap-feedback.ts`
- Modify: `tests/stubborn-intruder-ui-contract.test.mjs`

### RED

測試：

1. LevelMap 顯示「頑固伏字」，第 15 關前鎖定。
2. PuzzleGame 將 stubborn overlay 依 targetCellKey 放入真實格子的 overlay slot。
3. 元件使用 pointer event、停止冒泡並傳入 `performance.now()`。
4. ARIA label 顯示目前進度，例如「頑固伏字，已拔除 2/3」。
5. 觸控目標至少 44px。
6. 第 1、2 次有效點擊提供裂痕／晃動階段，第 3 次使用 ejecting 動畫。
7. `prefers-reduced-motion` 時不使用位移或強烈震動動畫。
8. 音效與震動只在玩家手勢內執行，所有失敗安全忽略。

### GREEN

- 元件不持有遊戲規則，只顯示 `currentHitStreak` 與 `status`。
- CSS 使用獨立 class，不覆寫 board/candidate overlay。
- LevelMap 模式文案明示「連點三次拔除」。
- Feedback 顯示 `1/3`、`2/3` 與成功拔除。

---

## Task 7：Phase 邊界、回歸、文件與交付

### Files

- Modify: `README.md`
- Create: `docs/superpowers/reports/2026-08-06-trap-stubborn-intruders-delivery.md`
- Modify/Add regression tests under `tests/`

### Regression Gate

- `standard`：沒有任何陷阱。
- `trap-candidates`：只有 candidate。
- `trap-board`：candidate + board，沒有 stubborn。
- `trap-stubborn`：candidate + board + stubborn。
- Phase 1/2 全部既有測試維持全綠。
- 第一章仍為 20 關、61 個唯一成語。
- `cicg-progress` version 1 不變。
- `cicg-media` 不變。
- 自由接龍與打地鼠不變。

### 最終驗證

```bash
npm install
npm run test:traps
./scripts/verify.sh
```

必須記錄：

- 完整 Node 測試數。
- Trap、Puzzle、Progress、Media 測試數。
- TypeScript strict。
- ESLint。
- Vite production build。
- PWA Service Worker 與 precache。
- npm audit。
- Google Drive 新增素材；預期為 0，因動畫與聲音均由 CSS／Web API 建立。

### 合併 Gate

```text
PR draft = false
behind_by = 0
latest HEAD CI = success
unresolved review threads = 0
scope diff only contains approved Phase 3 files
```

通過 ChatGPT Audit 後，以固定 HEAD SHA Squash Merge。
