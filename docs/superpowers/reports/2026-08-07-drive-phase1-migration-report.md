# Drive Phase 1 Migration And Drift Audit Report

日期：2026-08-07  
範圍：成語圖卡 Drive Phase 1  
狀態：**實體遷移完成；最新完整 CI 驗證待確認**

## 1. Phase 1 結果總覽

| 項目 | 結果 |
|---|---:|
| Folder Registry | 60 folders |
| Phase 1 required folder keys | 43 / 43 |
| 新建立資料夾 | 38 |
| 沿用既有正式 archive root | 1 |
| Asset Registry | 9 assets |
| Current Approved masters | 4 |
| Review assets | 1 |
| Quarantined file assets | 4 |
| Batch 1 verified migration entries | 4 |
| Batch 2 verified migration entries | 9 |
| 未驗證 applied migrations | 0 |
| Missing rollback snapshots | 0 |
| Duplicate current Approved | 0 |
| Unregistered files in Approved | 0 |

所有機器可讀真實狀態以以下路徑為準：

```text
data/drive-assets/drive-folders.json
data/drive-assets/idiom-card-assets.json
data/drive-assets/migrations/
data/drive-assets/physical-audit-2026-08-07.json
```

文件不得複製完整 Folder ID 表；Folder Registry 是唯一 canonical mapping。

## 2. 正式拓樸

```text
02_UI_UX_And_Visuals/
└─ Idiom_Cards/
   ├─ 00_Readme_And_Shortcuts/
   ├─ 01_Artworks/{10_Review,20_Approved}/
   ├─ 02_Components/
   │  ├─ 01_Card_Frames/{10_Review,20_Approved}/
   │  ├─ 02_Rarity_Badges/{10_Review,20_Approved}/
   │  ├─ 03_Difficulty_Badges/{10_Review,20_Approved}/
   │  ├─ 04_Theme_Badges/{10_Review,20_Approved}/
   │  ├─ 05_Motto_Plaques/{10_Review,20_Approved}/
   │  └─ 06_Effect_Overlays/{10_Review,20_Approved}/
   ├─ 03_Templates/{10_Review,20_Approved}/
   ├─ 04_Composites/{10_Review,20_Approved}/
   └─ 05_Reference_Only/

80_Inbox/
└─ Idiom_Cards/

90_Archive/
└─ Idiom_Cards/
   ├─ 01_Artworks/
   ├─ 02_Components/
   ├─ 03_Templates/
   ├─ 04_Composites/
   ├─ 05_Legacy_Flat_Cards/
   └─ 06_Rejected_And_Unverifiable/
```

既有 `90_Archive/Idiom_Cards` 名稱與 parent 已符合正式用途，因此保留原 Folder ID，沒有建立同名重複 archive root。

## 3. Batch 1：Approved Rarity Frames

Ledger：

```text
data/drive-assets/migrations/
2026-08-07-phase1-batch1-approved-rarity-frames.json
```

目的地：

```text
idiom-cards.components.card-frames.approved
```

| Rarity | Canonical filename | Drive File ID | Size | SHA-256 |
|---|---|---|---:|---|
| N | `CICG_Component_RarityFrame_N_v1.0_Approved.png` | `1KO7NHfipw-MlFfYLDaakHuupGjtrwYu8` | 2,285,281 | `17e6a6798e491ad2bad12b5746e7c3414078e456b83838db2e75aa0a7352ae65` |
| R | `CICG_Component_RarityFrame_R_v1.0_Approved.png` | `18AgLp9b1hCrqawfsk5-OxPlmgSt93YGR` | 2,191,391 | `3620f4408b31055d0e6ea185fa08dd5be13a33687321191035ac0ba30b9fdf2d` |
| SR | `CICG_Component_RarityFrame_SR_v1.0_Approved.png` | `1cZPhfFv483bJAxk0kCBj6XS4V6Vyfx40` | 2,454,266 | `4976cd5ead7042edc24808183ea2415de1491ddd1d9d95b18d889fb0e95de073` |
| SSR | `CICG_Component_RarityFrame_SSR_v2.8_Approved.png` | `1_PR-_mZXBkf7WJxXwq83AjaOvWpUJwbz` | 3,480,599 | `8bf608d7ba64b1efe787b8f6e0939c55a7d7623d5d9a791e5a260a144a9b328e` |

四張檔案均以原 File ID 完成 move-and-rename；搬移與重新命名後重新下載原始檔，MIME、size、SHA-256 與 webViewLink 均保持不變。

## 4. Batch 2：Review 與 Legacy 隔離

Ledger：

```text
data/drive-assets/migrations/
2026-08-07-phase1-batch2-review-and-legacy.json
```

共 9 個 verified entries：

### 正式 Review

- `CICG_Component_DifficultyBadge_E-S_v1.0_Review.jpeg`
  - status：`review`
  - currentApproved：`false`
  - 403,355 bytes
  - SHA-256：`1e0f12baaf9e245ecdad7e2735b9240454b54f9ee363d279f6b0cbc6fbeabc10`
- `CICG_Card_Templates_v2.6_Review`
  - 以原 Folder ID 移入 Templates Review
  - 直接子項數量搬移前後均為 0

### Inbox 隔離

以下缺少足以升格或歸檔的完整證據，因此只移入 governed Inbox：

- `CICG_Idiom_Cards_Pending_Review_2026-08-06`
- `CICG_Legacy_Card_Assets_Backup`
- `CICG_Card_Templates_v2.1_Approved`
- N／R／SR／SSR 四張 v2.7 template files

四張 v2.7 檔案雖保留舊檔名中的 `Approved`，Registry 狀態明確為：

```text
status = quarantined
currentApproved = false
parentFolderKey = idiom-cards.inbox
```

不得由檔名反推正式核准狀態。

## 5. Live Drive Drift Audit

2026-08-07 重新掃描結果：

### Visuals root

`02_UI_UX_And_Visuals` 直接子項只剩：

```text
Idiom_Cards
```

舊模板、Review、Legacy Backup、難易度標籤及 v2.7 templates 均已離開未治理根目錄。

### Approved folders

- Card Frames Approved：正好 4 張已登錄 canonical masters。
- Artworks Approved：空。
- Rarity Badges Approved：空。
- Difficulty Badges Approved：空。
- Theme Badges Approved：空。
- Motto Plaques Approved：空。
- Effect Overlays Approved：空。
- Templates Approved：空。
- Composites Approved：空。

因此：

```text
Unregistered files in Approved = 0
Duplicate current Approved = 0
```

### Review folders

- Difficulty Badges Review：正好 1 張已登錄 Review asset。
- Templates Review：正好 1 個已登錄 v2.6 Review container。

### Governed Inbox

直接子項正好 7 個：

- 3 個隔離容器
- 4 張 quarantined v2.7 template files

與 Asset／Folder Registries 一致。

## 6. 尚待逐檔治理的素材

以下資產已被安全隔離或保留於 Archive，但尚未逐檔 checksum、分類與判定：

- Pending Review：3 批 × 10 張，共 30 張。
- Legacy Backup：7 個直接子項，包含 badge references、drafts、experiments 與舊 master。
- v2.1 container：6 個直接子項。
- Archive `Templates_v2.5`：4 張。
- Archive `Templates_v2.2`：3 張。

它們不在任何 Approved folder，因此目前不構成正式發布漂移；後續仍必須逐批建立 Ledger，不得整批直接升格或永久刪除。

## 7. 永久驗證 Gate

`./scripts/verify.sh` 已執行：

```bash
npm run validate:drive-assets
```

CLI 使用 `readdir(migrationsPath)` 自動發現並驗證 `data/drive-assets/migrations/` 下所有 JSON Ledgers，不依賴手動維護單一檔名。

Physical audit regression test 會核對：

- 60 個 folders
- 9 個 assets
- 4 個 current Approved masters
- 1 個 Review asset
- 4 個 quarantined assets
- Batch 0／1／2 三份 Ledgers
- Batch 1 共 4 個 verified entries
- Batch 2 共 9 個 verified entries
- Visuals root、Approved、Review 與 Inbox 的 audited state

## 8. 完成條件狀態

| Gate | 狀態 |
|---|---|
| Blocking drift = 0 | PASS |
| Duplicate current Approved = 0 | PASS |
| Unverified applied migrations = 0 | PASS |
| Missing rollback snapshots = 0 | PASS |
| Unregistered files in Approved = 0 | PASS |
| Latest full repository verify | **PENDING** |

在最新 commit 的完整 CI／repository verify 證據出現前，不宣稱 Phase 1 PR 可合併，也不把 Phase 2 Ready 設為 true。
