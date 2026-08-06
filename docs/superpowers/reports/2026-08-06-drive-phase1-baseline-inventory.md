# Drive Phase 1 Baseline Inventory And Topology Report

日期：2026-08-07  
模式：Baseline inventory + governed folder topology establishment  
狀態：**TOPOLOGY READY — 素材搬移仍需 Migration Ledger Gate**

## 1. 執行範圍

本次延續唯讀 baseline，建立成語圖卡 Phase 1 的正式 Drive 資料夾拓樸，並將真實 Folder IDs 回寫 GitHub Registry。

本次 Drive mutation 僅限建立空資料夾：

- 沒有移動或重新命名任何檔案。
- 沒有複製、重新上傳或刪除素材。
- 沒有修改分享權限。
- 沒有把未驗證素材升格為 Approved。

## 2. Topology 結果

| 項目 | 數量 | 說明 |
|---|---:|---|
| Registry 資料夾總數 | 60 | 43 個正式 Phase 1 keys + 17 個既有 legacy／專案容器 |
| Phase 1 必要資料夾 | 43 | Validator 固定要求 |
| 已滿足的必要資料夾 | 43 | 全部使用真實 Drive Folder ID |
| 新建立資料夾 | 38 | 正式視覺樹、Inbox root、Archive 分類 |
| 沿用既有正式位置 | 1 | `90_Archive/Idiom_Cards` 保留原 Folder ID |
| missing-required-folder | 0 | Topology Gate 已解除 |
| 已驗證 Approved masters | 4 | N／R／SR／SSR 外框，尚未搬移 |
| 檔案搬移紀錄 | 0 | 第一個 move batch 尚未開始 |

原 baseline 判定 39 個 required keys 尚未登錄。執行前發現既有 `90_Archive/Idiom_Cards` 的名稱與 parent 已完全符合正式 archive root，因此採保留 File／Folder ID 的安全方案：

- 不建立第二個同名 archive root。
- 將原 `legacy.archive.idiom-cards` Registry key 升格為 `idiom-cards.archive`。
- 其下既有 `Templates_v2.5` 與 `Templates_v2.2` 保持原位，改由正式 archive root 管理。
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

## 4. 已驗證 Approved Masters

以下四張仍位於 `02_UI_UX_And_Visuals` 根目錄。其 SHA-256、size 與 PR #32 核准表已核對，但尚未執行搬移：

| Rarity | Drive File ID | Size | SHA-256 | 尺寸 |
|---|---|---:|---|---|
| N | `1KO7NHfipw-MlFfYLDaakHuupGjtrwYu8` | 2,285,281 | `17e6a6798e491ad2bad12b5746e7c3414078e456b83838db2e75aa0a7352ae65` | 1024 × 2000 |
| R | `18AgLp9b1hCrqawfsk5-OxPlmgSt93YGR` | 2,191,391 | `3620f4408b31055d0e6ea185fa08dd5be13a33687321191035ac0ba30b9fdf2d` | 1024 × 2000 |
| SR | `1cZPhfFv483bJAxk0kCBj6XS4V6Vyfx40` | 2,454,266 | `4976cd5ead7042edc24808183ea2415de1491ddd1d9d95b18d889fb0e95de073` | 1024 × 2000 |
| SSR | `1_PR-_mZXBkf7WJxXwq83AjaOvWpUJwbz` | 3,480,599 | `8bf608d7ba64b1efe787b8f6e0939c55a7d7623d5d9a791e5a260a144a9b328e` | 1024 × 2000 |

正式目的地：

```text
02_UI_UX_And_Visuals/Idiom_Cards/02_Components/01_Card_Frames/20_Approved
```

在搬移前仍必須建立 batch ledger、before／after／rollback snapshot，並確認原 File ID、size、checksum 與 webViewLink 不變。

## 5. Validator 與永久 CI Gate

目前已建立並啟用：

- 三份 JSON Schema。
- Asset／Folder／Migration validators。
- `npm run test:drive-assets`。
- `npm run validate:drive-assets`。
- `scripts/verify.sh` 永久執行 `npm run validate:drive-assets`。
- Baseline／topology regression test 要求：

```text
folders = 60
assets = 4
migration entries = 0
missing-required-folder = 0
folder issues = 0
asset issues = 0
migration issues = 0
```

任何 required folder 被刪除、ID 重複、parent 錯誤、生命週期 role 錯誤或 Registry 漂移，都會讓 CI 失敗。

## 6. Remaining Gate

Folder topology 已完成，但素材搬移仍維持 **BLOCKED**，直到下一批完成：

1. 建立 `2026-08-07-phase1-batch1-approved-rarity-frames.json`。
2. 對四張 Approved rarity frames 記錄完整 pre-move snapshot 與 rollback path。
3. 小批次原地 move，保留原 Drive File ID。
4. 驗證 parent、name、MIME、size、SHA-256 與 webViewLink。
5. 更新 Asset Registry 的 `parentFolderKey`。
6. 任一驗證失敗立即 rollback，不開始下一批。

Review、legacy 與未驗證檔案仍不得在 Batch 1 中混入。
