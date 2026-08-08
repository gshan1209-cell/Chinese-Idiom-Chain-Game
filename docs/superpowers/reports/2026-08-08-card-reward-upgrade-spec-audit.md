# 每關贈卡、隱藏積分與重複卡升級規格 ChatGPT Audit

日期：2026-08-08  
Repository：`gshan1209-cell/Chinese-Idiom-Chain-Game`  
PR：#47  
分支：`docs/card-milestone-upgrade-spec`  
Audit 結論：PASS（規格與計畫）

## 審核範圍

- `docs/superpowers/specs/2026-08-08-card-reward-and-upgrade-system-design.md`
- `docs/superpowers/plans/2026-08-08-per-level-card-reward-hidden-score.md`
- `docs/superpowers/plans/2026-08-08-duplicate-card-upgrade-system.md`
- `docs/superpowers/specs/README.md`
- `AGENTS.md`

本次只審核設計規格、Implementation Plans 與 Agent 永久入口；不宣稱 production code 已實作。

## 一致性審核

### 主線獎勵

- 每個不同主線關卡只在首次完成時建立一筆 per-level grant。
- 一般關候選只來自當關成語。
- 跨章 `campaignOrdinal` 每 10 關最低 R、每 100 關最低 SR。
- 第 100 關只發一張，不與第 10 關保底疊加。
- 重玩、升星、最佳紀錄更新不得再次發卡。

### 隱藏積分

- 難易度映射固定為 E=1、D=2、C=3、B=4、A=5、S=6。
- `srTickets = min(hiddenRewardScore, 400)`。
- `ssrTickets = min(floor(hiddenRewardScore / 10), 100)`。
- 50 分精確對應 SR 50／1000、SSR 5／1000、基礎區 945／1000。
- 隱藏積分跨章累積，不因每 10／100 關重置。
- 正式玩家 UI 不顯示積分、機率或 roll value。

### 隨機與卡池

- 取消未持有優先，已持有卡仍可被抽中。
- 先由隱藏積分解析稀有度，再在同稀有度候選中依正式 `weight` 抽卡。
- 目標稀有度缺席時只向下解析，不得低於該關保底。
- UR、Review、Legacy、NeedsReview 與未核准素材均被排除。
- 結果與機率快照先持久化，再播放揭示動畫。

### 重複卡升級

- 固定 10 N→1 R、10 R→1 SR、10 SR→1 SSR。
- 每個 card ID 至少保留一張。
- 素材可跨成語與已完成章節混合，但不得跨稀有度。
- 自動選材依可消耗數量降冪，再依 canonical 四位數 `cardNumber` 升冪。
- 產物限定已通關內容的下一稀有度，允許重複。
- SSR 不升 UR；UR 不作素材或產物。

### 資料與 migration

- `cicg-progress` 保持 Version 1。
- `cicg-card-collection` 規劃升至 Version 2，新增 `upgrades` store。
- Version 1 legacy grants 與 inventory 保留。
- legacy 十關 grant 僅覆蓋相應全域關卡，避免 per-level migration 重複發卡。
- 升級計畫兼容早期 Version 2 尚未保存 `consumedCount` 的資料，缺值安全視為 0。
- 扣料、產物 acquisition、upgrade record 與 metadata 使用同一 readwrite transaction。

## 計畫品質審核

- 已依 TDD 拆分 RED、GREEN、focused tests、full regression 與 commit 節點。
- 每個任務列出實際檔案、介面、命令與預期結果。
- 無 `TBD`、`TODO`、未定比例或模糊的「之後補上」。
- 兩份計畫邊界清楚：先完成 per-level rewards／hidden score／Version 2 migration，再完成 duplicate upgrade。
- 正式卡號排序已同步最新 `data/cards/card-number-registry.json` 四位數規範。

## 非本 PR 交付

以下項目必須由後續 implementation PR 依計畫完成，不能由本文件 PR 宣稱完成：

- production TypeScript 實作
- IndexedDB Version 2 真實 migration
- 收藏與升級 UI
- 新增測試與實際測試數量
- TypeScript、ESLint、PWA Build 與 npm audit 的實作交付證據

## 結論

規格內容、Agent 入口與兩份 Implementation Plans 相互一致，沒有未解決的範圍衝突或資料破壞設計。規格 Audit 判定 PASS，可在文件 PR CI 通過且 `behind_by = 0` 後合併，之後依兩階段計畫執行 TDD 實作。