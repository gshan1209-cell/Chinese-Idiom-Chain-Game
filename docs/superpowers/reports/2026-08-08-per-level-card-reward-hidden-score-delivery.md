# 每關贈卡與隱藏積分交付報告

日期：2026-08-08
Repository：`gshan1209-cell/Chinese-Idiom-Chain-Game`
分支：`feat/per-level-card-rewards`
PR：`#48`
對應規格：`docs/superpowers/specs/2026-08-08-card-reward-and-upgrade-system-design.md`
對應計畫：`docs/superpowers/plans/2026-08-08-per-level-card-reward-hidden-score.md`

## 1. 交付範圍

本階段已實作：

- 每個不同主線關卡首次完成建立一筆固定 Grant。
- 第一章 20 關固定全域 `campaignOrdinal = 1..20`。
- 一般關卡只使用該關成語，最低稀有度 N。
- 跨章全域第 10 關倍數使用已完成範圍，最低稀有度 R。
- 跨章全域第 100 關倍數使用已完成範圍，最低稀有度 SR。
- E／D／C／B／A／S 對應 1／2／3／4／5／6 隱藏積分。
- `SR tickets = min(hiddenRewardScore, 400)`。
- `SSR tickets = min(floor(hiddenRewardScore / 10), 100)`。
- 完全隨機且允許重複，不採未持有優先。
- 稀有度抽取與同稀有度權重選卡使用分離的注入式 RNG。
- 機率快照、抽取值與結果先保存，React 才能顯示安全狀態。
- `cicg-card-collection` 升級為 Version 2，新增 `upgrades` Store。
- Version 1 legacy milestone Grant 與 Inventory 無損遷移。
- 已解析 Grant 缺少 Inventory 時，依既有 `resolvedCardId` 與 `acquisitionId` 修復，不重新抽卡。
- Hook 不暴露隱藏積分、tickets 或 `rollValue`。
- Card Catalog seed 決定性產生第一章 61 筆難易度映射。

本階段未實作：

- 重複卡 10：1 升級。該功能已有 Approved 規格與獨立 Implementation Plan，留待第二階段。
- 正式收藏圖鑑、揭示動畫或正式 Approved 卡池素材。

## 2. 架構與資料邊界

- 領域規則位於 `src/cards` 純 TypeScript 模組。
- React 只呼叫已測試服務並回傳安全顯示欄位。
- `cicg-progress` 保持 Version 1，沒有加入卡牌欄位。
- 收藏同步維持「闖關進度保存成功後才執行」的順序。
- 收藏保存失敗不回滾已完成的闖關結果。
- `IDIOM_CARD_DEFINITIONS` 仍為空時，Grant 保持 `pending`，不偽造正式卡片。

## 3. TDD RED／GREEN 證據

### Task 1：全域關卡序號與隱藏積分

RED：

```bash
npm run compile:core && node --test tests/puzzle-levels.test.mjs
npm run compile:core && node --test tests/card-hidden-reward-score.test.mjs
```

觀察到 `campaignOrdinal` 與 scoring module 尚不存在的預期失敗。

GREEN：

```bash
npm run test:puzzle
npm run compile:core
node --test tests/card-hidden-reward-score.test.mjs
```

結果：Puzzle 38／38；隱藏積分 focused tests 全部通過。

### Task 2：每關 Grant 與 legacy coverage

RED：

```bash
npm run compile:core && node --test tests/card-level-reward-grants.test.mjs
```

觀察到 per-level grant module／types 尚不存在的預期失敗。

GREEN：

```bash
npm run compile:core && node --test tests/card-level-reward-grants.test.mjs
```

結果：穩定 ID、重複同步與 legacy 第 10 關只覆蓋全域序號 10 均通過。

### Task 3：範圍卡池與隱藏稀有度解析

RED：

```bash
npm run compile:core && node --test tests/card-level-reward-pool.test.mjs tests/card-reward-resolver.test.mjs
```

觀察到新 pool builder 與 hidden-ticket resolver 尚不存在的預期失敗。

GREEN：

```bash
npm run compile:core
node --test tests/card-level-reward-pool.test.mjs tests/card-reward-resolver.test.mjs
```

結果：擴大回歸 39／39。

固定案例：

```text
score 50 => SR 50/1000、SSR 5/1000、base 945/1000
ordinal 10 base => R
ordinal 100 base => SR
缺少 SSR 時可降至 SR，但不得低於 Grant floor
已持有卡仍可再次抽中
```

### Task 4：Collection Version 2 migration

RED：

```bash
npm run compile:core
node --test tests/card-collection-serialization.test.mjs tests/card-indexeddb-repository.test.mjs
```

觀察到 Version 2 schema、per-level Grant 與 `upgrades` Store 尚未支援的預期失敗。

GREEN：

```bash
npm run compile:core
node --test tests/card-collection-serialization.test.mjs tests/card-indexeddb-repository.test.mjs
```

結果：Version 1 fixture 保留 ownership 與 legacy Grant，輸出固定 Version 2；四 Store 交易測試通過。

### Task 5：依全域序號同步獎勵

RED：

```bash
npm run compile:core && node --test tests/card-collection-service.test.mjs
```

觀察到 `syncCardCollectionLevelRewards` 尚未匯出的預期失敗。

GREEN：

```bash
npm run compile:core && node --test tests/card-collection-service.test.mjs
```

結果：首次完成、重複同步、序號排序、legacy coverage、空池 pending 與 Inventory 修復全部通過。

### Task 6：Save-first React 接線與隱藏資料隔離

RED：

```bash
node --test tests/card-app-integration.test.mjs tests/card-difficulty-catalog.test.mjs
```

觀察到 generated difficulty map 與新 Hook signature 尚不存在的預期失敗。

GREEN：

```bash
npm run typecheck
node --test tests/card-app-integration.test.mjs tests/card-difficulty-catalog.test.mjs
npm run test:cards
```

結果：Hook 只暴露安全欄位；Card 回歸 149／149。

## 4. 本機驗證結果

在匯入與 GitHub Actions 相同依賴的隔離工作區執行：

```text
全部 Node tests：401／401
Card tests：149／149
Puzzle tests：38／38
TypeScript strict：PASS
ESLint：PASS
Production Vite／PWA Build：PASS
Drive registry validation：folders=60 assets=19 migrations=3
Theme badge validation：badges=9 approved-assets=9
```

Production Build 證據：

```text
Vite transformed modules：96
PWA mode：generateSW
PWA precache：12 entries
```

本機 `./scripts/verify.sh` 已完成當時版本的所有 397 項測試、TypeScript 與 ESLint，但執行器在最後一次重複 Build 階段達到工具時間上限，因此沒有取得 wrapper 的最終 exit code。此限制不會被誤報為完整 Gate 通過；正式合併 Gate 以 PR head 的 GitHub Actions `./scripts/verify.sh` 完整成功結果為準。

## 5. 合併前程式審核

審核發現 Version 2 probability snapshot parser 原先只驗證 tickets 總和，未完整驗證抽選結果的一致性。已依 TDD 補上四個永久 Gate：

- `rollValue` 必須對應正確的 `rolledRarity`。
- `resolvedRarity` 不得低於關卡最低保底。
- 非基礎票區不得解析到高於抽中稀有度的卡。
- 一般關基礎票區只允許 N／R；10／100 關基礎票區必須等於 R／SR。

修正後 Card tests 為 149／149，完整 Node tests 為 401／401。

## 6. GitHub Actions 與 Audit Gate

第一輪正式 PR head 驗證：

```text
CI Run ID：31248310876
CI Run Number：518
Head SHA：dc9f6913064a753b280a60cfa3ef3fca5a146d3b
Workflow：CI / verify
Command：./scripts/verify.sh
Conclusion：success
```

GitHub Actions 證據：

```text
npm install：added 418 packages
npm audit：419 packages audited，0 vulnerabilities
全部 Node tests：401／401
Card tests：149／149
Puzzle tests：38／38
TypeScript strict：PASS
ESLint：PASS
Production Vite／PWA Build：PASS
Vite transformed modules：96
PWA mode：generateSW
PWA precache：12 entries（412.91 KiB）
```

合併前永久 Gate：

- PR head CI 必須使用 `./scripts/verify.sh` 完整成功。
- `npm install`／`npm audit` 必須回報 0 vulnerabilities。
- `behind_by = 0`。
- unresolved review threads = 0。
- 暫時 source export workflow 不得存在於 PR 淨變更或 `main`。
- ChatGPT Audit 不得有 Critical／Important findings。

本次報告更新會產生新的 PR head，因此必須再執行一次不可變更的最終 CI；只有最新 head 全綠後才可 Squash Merge。Merge SHA 由 GitHub PR merge record 作為唯一正式證據，不回寫已合併前的分支文件。

## 7. Drive 漂移與素材

本階段沒有新增、移動、改名或刪除 Drive 素材。

已確認專案 Drive 固定頂層仍包含：

```text
00_Project_Management
01_Design_And_Specs
02_UI_UX_And_Visuals
03_Game_Content_And_Data
04_Testing_And_Evidence
05_Releases_And_Store_Assets
80_Inbox
90_Archive
```

本功能只修改程式、測試與 Repository 文件，不產生新的 Drive 漂移。

## 8. 已知限制與下一階段

- 正式 `IDIOM_CARD_DEFINITIONS` 尚未加入 Approved 卡片，因此玩家完成關卡後會取得可稽核的 `pending` Grant，而不是假的卡片結果。
- 玩家 UI 尚無收藏圖鑑與揭示動畫。
- 重複卡 10：1 升級仍未進入 production code；下一階段依 `docs/superpowers/plans/2026-08-08-duplicate-card-upgrade-system.md` 執行。
