# 盤面伏字 Phase 2 交付報告

## 1. 交付摘要

本次完成第一章填字闖關的選用玩法「盤面伏字」。模式在完成第 10 關後解鎖，並組合既有候選偽字；標準模式仍為預設，頑固伏字在 Phase 2 保持關閉。

完成項目：

- 新增「盤面伏字」模式卡與第 10 關解鎖規則。
- `trap-board` 同時啟用候選偽字與盤面伏字。
- 伏字以獨立覆蓋層顯示在尚未填寫的合法空格。
- 伏字總數採 `clamp(ceil(fillableCellCount × 0.10), 1, 3)`。
- 同時最多顯示 2 個伏字。
- 伏字只使用本機已啟用成語字典中的安全字元。
- 排除本關答案、合法候選字、候選偽字保留字元、停用資料與重複字。
- 伏字依合法放字進度啟用，啟用後每隔 3、5 或 7 次有效操作短暫露餡。
- 每個伏字最多自然露餡 3 次；排程期間不提前累積露餡間隔。
- 玩家單擊、合法字牌或提示填入目標格都可驅逐伏字。
- 空格移除、空盤清除、無提示結果、選格、重排與點擊陷阱不推進露餡計數。
- 關卡完成時所有未完成陷阱立即取消，不阻擋結算。
- 重玩同一關會重建盤面伏字 session 並將計數歸零。
- 支援 44×44px 最小點擊區與 reduced-motion 無位移替代效果。
- 共用本機 Web Audio 短促驅逐音效；瀏覽器拒絕時靜默降級。

## 2. 架構與資料流

### 純 TypeScript

- `src/domain/trap.ts`
  - `BoardIntruderStatus`
  - `BoardIntruder`
  - `BoardIntruderSession`
- `src/traps/trap-mode.ts`
  - 集中定義各模式目前啟用的陷阱能力。
- `src/traps/trap-safe-characters.ts`
  - 候選偽字與盤面伏字共用安全字元過濾。
- `src/traps/board-intruder-engine.ts`
  - 數量、啟用門檻、目標格、自然露餡、驅逐、可見數量與完成 reconcile。
- `src/traps/trap-unlocks.ts`
  - 候選偽字第 5 關、盤面伏字第 10 關、頑固伏字保持關閉。

### React 與瀏覽器

- `src/app/use-board-intruders.ts`
  - 管理獨立伏字 session；重玩、模式切換與字典延遲載入都可安全重建。
- `src/app/use-candidate-decoys.ts`
  - 提供整局候選偽字保留字元，避免兩種陷阱使用相同字。
- `src/app/use-puzzle-game.ts`
  - 只有有效盤面操作才通知盤面伏字引擎；伏字事件不呼叫任何 Puzzle mutation。
- `src/app/BoardIntruder.tsx`
  - 全格覆蓋按鈕、事件攔截與動畫完成通知。
- `LevelMap`／`PuzzleGame`
  - 模式選擇、模式標籤、盤面 slot 與伏字覆蓋層。
- `src/app/trap-feedback.ts`
  - 候選偽字與盤面伏字共用 best-effort Web Audio 回饋。

資料流：

```text
玩家有效盤面操作
→ 原 Puzzle 引擎產生 next PuzzleSession
→ usePuzzleGame 通知 board hook
→ 純 TypeScript reconcile
→ React 只渲染 visible intruders
```

盤面伏字不寫入：

```text
PuzzleSession.values
PuzzleSession.tileByCell
PuzzleTile.usedBy
PuzzleSession.correctCells
PuzzleCell.answer
```

## 3. 規則與 Phase 邊界

### 模式能力

| 模式 | 候選偽字 | 盤面伏字 | Phase 2 是否可選 |
|---|---:|---:|---:|
| `standard` | 否 | 否 | 是 |
| `trap-candidates` | 是 | 否 | 第 5 關後 |
| `trap-board` | 是 | 是 | 第 10 關後 |
| `trap-stubborn` | 否 | 否 | 否 |

### 盤面伏字數量

```text
clamp(ceil(fillableCellCount × 0.10), 1, 3)
```

### 啟用門檻

| 伏字總數 | 合法放字進度 |
|---:|---|
| 1 | 35% |
| 2 | 25%、60% |
| 3 | 20%、50%、75% |

門檻使用 `ceil(fillableCellCount × ratio)`，最低為 1 次合法放字。

### 生命週期

```text
scheduled
  → active
  → revealing
  → active
  → ejecting
  → removed
```

補充：

- scheduled 目標格先被填入時直接 removed。
- active／revealing 目標格被填入時轉為 ejecting。
- 同時最多兩個 active／revealing／ejecting。
- 關卡完成時所有非 removed 狀態立即轉為 removed。
- 伏字啟用後才開始計算 3／5／7 次自然露餡間隔。

## 4. TDD RED／GREEN 證據

| 階段 | RED | GREEN／修正 |
|---|---:|---:|
| 模式能力與組合 | CI #194 | CI #198 |
| 解鎖與頑固模式邊界 | CI #199 | CI #200 |
| 安全字與決定性生成 | CI #202 | CI #206 |
| 生命週期與完成 reconcile | CI #207 | CI #208 |
| React 控制層與盤面隔離 | CI #209 | CI #213 |
| 玩家模式與盤面覆蓋 UI | CI #215 | CI #221 |
| 空操作防刷 | CI #222 | CI #223 |
| 真實 Puzzle／陷阱串接回歸 | — | CI #224 |

所有 production 行為均先建立精準失敗測試。中途遇到 Phase 1 過時斷言或測試過度攔截讀取行為時，只修正測試假設，不以 production code 配合錯誤測試。

## 5. 實作 HEAD 驗證

GitHub Actions CI #224 在實作 HEAD `68dfc5281161b75bc4ea05c119526d97123da8b3` 執行 `./scripts/verify.sh`：

- Node.js：22.16.0
- 成語資料建置：70 筆，checksum `1601ec3c7424`
- 完整 Node 測試：207 項通過、0 失敗
- Trap：63 項通過、0 失敗
- Puzzle：37 項通過、0 失敗
- Progress：17 項通過、0 失敗
- Media：39 項通過、0 失敗
- TypeScript strict：通過
- ESLint：通過
- Vite production build：通過
- PWA Service Worker：成功產生
- PWA precache：12 entries，373.83 KiB
- npm audit：419 packages，0 vulnerabilities

README 與本報告提交後，PR 最新文件 HEAD 仍須再通過一次同樹 CI；最終 run number 記錄在 PR 合併說明，避免為回填 run number 反覆改動文件 HEAD。

## 6. 未修改範圍

本次沒有修改：

```text
src/puzzle/levels.ts
src/progress/**
src/game/**
src/bonus/**
src/media/**
data/idioms.source.csv
```

因此以下永久規則保持不變：

- 第一章 20 關、61 個唯一成語。
- 每關可完整解答。
- 智慧自動跳格順序。
- 1～3 星評價與最佳紀錄。
- `cicg-progress` database version 1。
- 自由接龍與打地鼠規則。
- 媒體播放與 `cicg-media` 保存。

## 7. Google Drive 素材與授權狀態

Drive 目前沒有核准的盤面伏字圖片、遠端音效或動畫影片。本次未引用或搬動 Drive 素材。

本功能使用：

- CSS 盤面覆蓋層與動畫。
- 瀏覽器 Web Audio 即時短促音效。
- 本機已啟用成語字典的安全字元。

因此沒有新增第三方素材授權、遠端媒體或網路依賴。

## 8. 後續 Phase 3

尚未實作且不得視為本次交付內容：

- 頑固伏字模式。
- 伏字連續點擊拔除與點擊進度。
- 倒數提示、操作冷卻與高階視覺效果。
- Android／iOS 真機觸控、動畫與音訊證據。
- 瀏覽器 E2E 與 Lighthouse。

Phase 3 應另建 Implementation Plan 與 TDD 分支，不得混入本 PR。
