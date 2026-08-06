# 頑固伏字 Phase 3 交付報告

## 1. 交付摘要

本次完成第一章填字闖關的最高階選用玩法「頑固伏字」。模式在完成第 15 關後解鎖，並組合候選偽字、盤面伏字與頑固伏字三層陷阱；標準模式仍為預設。

完成項目：

- 完成第 15 關後解鎖「頑固伏字」。
- `trap-stubborn` 同時啟用候選偽字、盤面伏字與頑固伏字。
- 頑固伏字數量為 `clamp(ceil(fillableCellCount × 0.06), 1, 2)`。
- 同時最多顯示一個頑固伏字。
- 伏字只使用啟用中的本機成語字典安全字元。
- 排除本關答案、合法候選字、候選偽字、盤面伏字與重複字。
- 目標只選尚未填寫的合法空格，排除目前選取格、智慧跳格下一目標與其他陷阱保留格。
- 盤面剩餘未解格少於兩格時不再建立新的頑固伏字。
- 需要三次有效連擊才可拔除。
- 有效點擊最小間隔 80ms；連擊視窗 700ms。
- 小於 80ms 的快速重複點擊會被忽略；超過 700ms 會從 1/3 重新開始。
- 第三次有效點擊進入飛出狀態，動畫完成後才正式移除。
- 一般有效盤面操作會中斷未完成連擊，但不扣分、不記錯。
- 被頑固伏字占用的格子不允許直接放字，且不呼叫盤面放字引擎。
- 提示命中被占用格時會先安全清除伏字，再填入正確字，避免死局。
- 重玩、切換關卡或模式時重新建立三層陷阱，不沿用上一局狀態。
- 44px 觸控目標、Pointer Events、ARIA 連擊進度與 reduced-motion 已完成。
- 震動與短促 Web Audio 僅作為 best-effort 回饋，失敗時不影響遊戲。

## 2. 架構

### 純 TypeScript

- `src/domain/trap.ts`
  - `StubbornIntruder`
  - `StubbornIntruderSession`
  - 狀態：`scheduled / active / ejecting / removed`
- `src/traps/trap-mode.ts`
  - 定義四種模式的能力組合。
- `src/traps/trap-unlocks.ts`
  - 第 5／10／15 關解鎖規則。
- `src/traps/stubborn-intruder-engine.ts`
  - 安全生成、數量、門檻、三擊狀態機、盤面對帳、提示清除與冪等轉移。

### React 與瀏覽器

- `src/app/use-stubborn-intruders.ts`
  - 獨立管理頑固伏字 session。
- `src/app/use-puzzle-game.ts`
  - 依候選偽字 → 盤面伏字 → 頑固伏字順序協調保留資源。
  - 直接使用既有 `findNextPuzzleCell`，沒有複製智慧跳格規則。
- `src/app/StubbornIntruder.tsx`
  - Pointer Events、`performance.now()`、ARIA 進度與動畫完成通知。
- `src/app/LevelMap.tsx`
  - 第 15 關解鎖入口與鎖定原因。
- `src/app/PuzzleGame.tsx`、`PuzzleGame.css`
  - 真實格子 overlay、三階段裂痕／飛出與 reduced-motion。
- `src/app/trap-feedback.ts`
  - 玩家手勢內的 best-effort 音效與震動。

頑固伏字不進入 `PuzzleSession`；Puzzle engine 不知道陷阱存在。

## 3. 固定規則

```text
數量：clamp(ceil(fillableCellCount × 0.06), 1, 2)
有效連擊：3 次
最小有效點擊間隔：80ms
連擊視窗：700ms
同時可見：1 個
解鎖：完成第 15 關
```

點擊狀態：

```text
第一次有效點擊 → 1/3
80ms～700ms 內下一擊 → +1
小於 80ms → 忽略
超過 700ms → 重設為 1/3
第三次有效點擊 → ejecting
動畫完成 → removed
```

## 4. TDD 證據

每個 production 行為均先建立失敗測試，確認失敗原因後才加入最小實作。

| 階段 | RED 內容 | GREEN／完整回歸 |
|---|---|---|
| 模式組合與第 15 關解鎖 | 缺少 stubborn capability、解鎖與文案 | CI #257 |
| 安全生成與領域模型 | `stubborn-intruder-engine` 尚不存在 | CI #261 |
| 三擊與時間狀態機 | 缺少 hit／ejection／action exports | CI #264 |
| 盤面對帳與提示解死局 | 缺少 reconcile／block／hint exports | CI #266 |
| React 控制層 | hook 與協調流程尚不存在 | CI #271 |
| 玩家模式與 overlay UI | 模式入口、元件、樣式與回饋尚不存在 | CI #282 |
| 三層資源穩定性 | 已移除的較低層陷阱仍須保留整局規劃資源 | CI #283 |

Phase 1／2 的暫時性「stubborn 必須保持惰性」測試已依正式 Phase 3 規格更新；標準、候選與盤面模式的隔離 Gate 仍保留。

## 5. CI #283 驗證結果

GitHub Actions 在 PR 最新功能 HEAD 執行 `./scripts/verify.sh`：

- Node.js：22.16.0
- 成語資料：70 筆，checksum `1601ec3c7424...`
- 完整 Node 測試：239 項通過、0 失敗
- Trap：95 項通過、0 失敗
- Puzzle：37 項通過、0 失敗
- Progress：17 項通過、0 失敗
- Media：39 項通過、0 失敗
- TypeScript strict：通過
- ESLint：通過
- Vite production build：通過
- PWA Service Worker：成功產生
- PWA precache：12 entries，385.79 KiB
- npm audit：419 packages，0 vulnerabilities

## 6. 範圍審核

本次沒有修改：

```text
src/puzzle/levels.ts
src/progress/**
src/game/**
src/media/**
data/idioms.source.csv
```

因此以下永久規則保持不變：

- 第一章 20 關、61 個唯一成語。
- 每關可完整解答。
- 智慧自動跳格順序。
- 1～3 星評價。
- `cicg-progress` database version 1。
- 自由接龍與打地鼠計分。
- 媒體播放與 `cicg-media` 保存。

## 7. Google Drive 狀態

本功能不需要圖片或遠端音效，因此沒有新增或搬動 Drive 素材。

- 裂痕、晃動與飛出效果由 CSS 建立。
- 音效由 Web Audio 即時產生。
- 震動使用瀏覽器 Vibration API，若不支援則靜默降級。

## 8. 尚待後續

本次尚未產生下列實機證據：

- Android／iOS 真機三連擊觸控體驗。
- 不同瀏覽器的震動與音訊允許行為。
- 瀏覽器 E2E。
- Lighthouse 與完整離線 PWA 實機驗收。

上述項目不影響純 TypeScript 規則、CI 或離線主玩法，但正式發布前仍應補齊測試證據。
