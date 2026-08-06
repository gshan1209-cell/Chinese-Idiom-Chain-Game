# 候選偽字陷阱模式 Phase 1 交付報告

## 1. 交付摘要

本次完成可選用的「候選偽字」陷阱模式，並保持標準模式為預設。功能只掛載於第一章填字闖關，不修改關卡資料、星級規則、智慧跳格、自由接龍、打地鼠、媒體中心或既有進度 schema。

完成項目：

- 完成第 5 關後解鎖候選偽字模式。
- 標準模式永遠可用，且不產生任何陷阱。
- 每關依可填格數產生 1～4 張安全偽字；安全字不足時自動減量。
- 偽字只取自本機已啟用成語字典。
- 排除本關答案字元、合法候選字與重複字。
- 偽字依合法放字進度逐步出現，不在開局一次顯示。
- 點擊偽字只進入飛出動畫，不寫入盤面、不增加錯誤、不扣分、不消耗提示，也不觸發智慧跳格。
- 動畫完成後才將偽字標記為移除。
- 重玩同一關時，偽字進度、已移除狀態與合法放字計數全部重設。
- 支援 reduced-motion 無位移淡出替代效果。
- 玩家主動點擊時提供 best-effort Web Audio 短促回饋；瀏覽器拒絕時靜默降級。

## 2. 架構

### 純 TypeScript

- `src/domain/trap.ts`
  - `PuzzlePlayMode`
  - `CandidateDecoy`
  - `CandidateDecoySession`
- `src/traps/trap-unlocks.ts`
  - 模式解鎖與繁體中文鎖定原因。
- `src/traps/candidate-decoy-engine.ts`
  - 數量、門檻、安全字過濾、不可變 session 與驅逐狀態機。

### React 與瀏覽器

- `src/app/use-candidate-decoys.ts`
  - 管理獨立陷阱 session；偽字不進入 `PuzzleSession`。
- `src/app/use-puzzle-game.ts`
  - 只有合法字牌確實改變 puzzle session 時才推進陷阱。
- `src/app/CandidateDecoyTile.tsx`
  - 呈現 active／ejecting 狀態，動畫結束後通知引擎。
- `src/app/trap-feedback.ts`
  - 玩家手勢內的短促本機音效，所有失敗均安全忽略。
- `CampaignGame`／`LevelMap`／`PuzzleGame`
  - 模式選擇、鎖定提示、模式標籤與偽字呈現。

## 3. 規則

### 數量

```text
clamp(ceil(fillableCellCount × 0.18), 1, 4)
```

### 插入門檻

| 偽字總數 | 合法放字進度 |
|---:|---|
| 1 | 25% |
| 2 | 20%、55% |
| 3 | 15%、45%、70% |
| 4 | 12%、35%、58%、78% |

門檻使用 `ceil(fillableCellCount × ratio)`，最低為 1 次合法放字。

### 不推進門檻的操作

- 點擊偽字
- 提示
- 移除
- 重排
- 清空
- 無效字牌操作

## 4. TDD 證據

| 階段 | RED | GREEN／修正 |
|---|---:|---:|
| 模式契約與解鎖 | CI #161 | CI #163 |
| 安全偽字生成 | CI #165 | CI #166 |
| 生命週期狀態機 | CI #167 | CI #168 發現測試 fixture 假設錯誤；CI #169 通過 |
| React 控制層 | CI #171 | CI #173 功能與型別通過但測試 Lint 失敗；CI #174 通過 |
| 玩家模式與偽字 UI | CI #181 | CI #182 |
| 同關重玩重設 | CI #183 | CI #184 |

每一個 production 行為均先建立失敗測試；失敗原因確認後才加入最小實作。

## 5. CI #184 驗證結果

GitHub Actions 在 PR 合併樹執行 `./scripts/verify.sh`：

- Node.js：22.16.0
- 成語資料建置：70 筆，checksum `1601ec3c7424...`
- 完整 Node 測試：166 項通過、0 失敗
- Trap：22 項通過、0 失敗
- Puzzle：37 項通過、0 失敗
- Media：39 項通過、0 失敗
- TypeScript strict：通過
- ESLint：通過
- Vite production build：通過
- PWA Service Worker：成功產生
- PWA precache：12 entries，364.19 KiB
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

Drive 已有核准的成語圖卡標準模板，但本功能不需要圖卡，因此未引用或搬動該素材。

本次沒有新增：

- 遠端音效
- 陷阱圖片
- 動畫影片
- 授權媒體

飛出效果由 CSS 建立，短促聲音由瀏覽器 Web Audio 即時產生。

## 8. 後續範圍

尚未實作且不得視為本次交付內容：

- Phase 2 盤面伏字。
- Phase 3 頑固伏字與連續點擊拔除。
- Android／iOS 真機動態效果、觸控與音訊證據。
- 瀏覽器 E2E 與 Lighthouse。

上述項目應各自建立 Implementation Plan 與 TDD 分支，不得混入本次 PR。
