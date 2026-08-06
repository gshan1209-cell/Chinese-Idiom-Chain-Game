# Drive Phase 1 Baseline Inventory And Topology Report

日期：2026-08-07  
模式：Baseline inventory + governed folder topology + approved-frame Batch 1  
狀態：**TOPOLOGY READY／BATCH 1 VERIFIED**

## 1. 執行範圍

本階段完成：

- 成語圖卡 Phase 1 正式資料夾拓樸。
- 真實 Drive Folder IDs 回寫 GitHub Registry。
- 永久 `validate:drive-assets` CI Gate。
- 四張已驗證 N／R／SR／SSR rarity frame masters 的第一個安全搬移批次。

未進行：

- Review cards 搬移。
- Legacy templates 搬移或刪除。
- Difficulty badge 自動升格。
- 未驗證素材的 Approved 判定。
- 權限修改、重新上傳或永久刪除。

## 2. Topology 結果

| 項目 | 數量 | 說明 |
|---|---:|---|
| Registry 資料夾總數 | 60 | 43 個正式 Phase 1 keys + 17 個 legacy／project containers |
| Phase 1 必要資料夾 | 43 | Validator 固定要求 |
| 已滿足的必要資料夾 | 43 | 全部使用真實 Drive Folder ID |
| 新建立資料夾 | 38 | 正式視覺樹、Inbox root、Archive 分類 |
| 沿用既有正式位置 | 1 | `90_Archive/Idiom_Cards` 保留原 Folder ID |
| missing-required-folder | 0 | Topology Gate 已解除 |
| 已驗證 Approved masters | 4 | N／R／SR／SSR 外框 |
| 已驗證 move entries | 4 | Batch 1 全部 verified |

原 baseline 判定 39 個 required keys 尚未登錄。執行前發現既有 `90_Archive/Idiom_Cards` 的名稱與 parent 已完全符合正式 archive root，因此採保留 Folder ID 的安全方案：

- 不建立第二個同名 archive root。
- 將原 `legacy.archive.idiom-cards` Registry key 升格為 `idiom-cards.archive`。
- 其下既有 `Templates_v2.5` 與 `Templates_v2.2` 保持原位。
- 實際新增 38 個資料夾，另 1 個 required key 由既有資料夾納管。

## 3. 正式 Phase 1 結構

```text
02_UI_UX_And_Visuals/
└─ Idiom_Cards/
   ├─ 00_Readme_And_Shortcuts/
   ├─ 01_Artworks/
   │  ├─ 10_Review/
   │  └─ 20_Approved/
   ├─ 02_Components/
   │  ├─ 01_Card_Frames/
   │  │  ├─ 10_Review/
   │  │  └─ 20_Approved/
   │  ├─ 02_Rarity_Badges/
   │  │  ├─ 10_Review/
   │  │  └─ 20_Approved/
   │  ├─ 03_Difficulty_Badges/
   │  │  ├─ 10_Review/
   │  │  └─ 20_Approved/
   │  ├─ 04_Theme_Badges/
   │  │  ├─ 10_Review/
   │  │  └─ 20_Approved/
   │  ├─ 05_Motto_Plaques/
   │  │  ├─ 10_Review/
   │  │  └─ 20_Approved/
   │  └─ 06_Effect_Overlays/
   │     ├─ 10_Review/
   │     └─ 20_Approved/
   ├─ 03_Templates/
   │  ├─ 10_Review/
   │  └─ 20_Approved/
   ├─ 04_Composites/
   │  ├─ 10_Review/
   │  └─ 20_Approved/
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

完整 Folder ID 對應以 `data/drive-assets/drive-folders.json` 為唯一機器可讀 Registry。

## 4. Batch 1：Approved Rarity Frames

四張 current Approved masters 已逐張原地 move 到：

```text
02_UI_UX_And_Visuals/Idiom_Cards/
02_Components/01_Card_Frames/20_Approved
```

目的 Registry key：`idiom-cards.components.card-frames.approved`  
目的 Drive Folder ID：`1RtNhgm93m0EXq3fNJlvuVuIwbWQhL4mj`

| Rarity | Drive File ID | Size | SHA-256 |
|---|---|---:|---|
| N | `1KO7NHfipw-MlFfYLDaakHuupGjtrwYu8` | 2,285,281 | `17e6a6798e491ad2bad12b5746e7c3414078e456b83838db2e75aa0a7352ae65` |
| R | `18AgLp9b1hCrqawfsk5-OxPlmgSt93YGR` | 2,191,391 | `3620f4408b31055d0e6ea185fa08dd5be13a33687321191035ac0ba30b9fdf2d` |
| SR | `1cZPhfFv483bJAxk0kCBj6XS4V6Vyfx40` | 2,454,266 | `4976cd5ead7042edc24808183ea2415de1491ddd1d9d95b18d889fb0e95de073` |
| SSR | `1_PR-_mZXBkf7WJxXwq83AjaOvWpUJwbz` | 3,480,599 | `8bf608d7ba64b1efe787b8f6e0939c55a7d7623d5d9a791e5a260a144a9b328e` |

每張搬移後皆重新下載原始檔計算 SHA-256，並確認：

- Drive File ID 不變。
- Parent 改為正式 Approved folder。
- Name、MIME、size、checksum 與 webViewLink 不變。
- 沒有重新上傳或建立第二份 current master。

完整證據：

- `data/drive-assets/migrations/2026-08-07-phase1-batch1-approved-rarity-frames.json`
- `docs/superpowers/reports/2026-08-07-drive-phase1-migration-report.md`

## 5. Validator 與永久 CI Gate

目前 `scripts/verify.sh` 永久執行：

```bash
npm run validate:drive-assets
```

Regression expectations：

```text
folders = 60
assets = 4
required folders = 43 / 43
folder issues = 0
asset issues = 0
Batch 0 ledger issues = 0
Batch 1 verified entries = 4
Batch 1 ledger issues = 0
```

任何 required folder 被刪除、Folder ID 重複、parent 錯誤、生命週期 role 錯誤、Approved master 漂移或 Ledger 不完整，都會讓 CI 失敗。

## 6. 下一階段 Gate

後續 Review／Legacy 搬移仍維持 **BLOCKED**，直到每個候選素材完成：

1. 資產類型與 canonical role 分類。
2. 原始檔 checksum 與尺寸盤點。
3. 核准、Review、Archive 或 unverifiable 證據判定。
4. 唯一 current Approved 檢查。
5. 完整 before／after／rollback Ledger。
6. 小批次逐檔 move 與驗證。

檔名含 `Approved`、版本字樣或位於舊 Approved 容器，均不得單獨作為正式核准證據。
