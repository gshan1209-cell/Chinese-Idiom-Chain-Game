# Drive Phase 1 Baseline Inventory Report

日期：2026-08-06  
模式：Read-only inventory  
狀態：**BLOCKED — 尚不可執行 Phase 1 move**

## 1. 掃描範圍

本次只讀掃描涵蓋：

- 專案根目錄 `Chinese-Idiom-Chain-Game`
- `02_UI_UX_And_Visuals`
- `80_Inbox`
- `90_Archive`
- 上述目錄內已知的圖卡、模板、待審批次與歷史備份容器

本次沒有建立、移動、重新命名、複製、刪除或改變任何 Drive 權限。

## 2. Baseline 統計

| 項目 | 數量 | 說明 |
|---|---:|---|
| 已發現資料夾 | 22 | 全部使用真實 Drive Folder ID 登錄 |
| 已發現檔案 | 118 | 涵蓋目前指定圖卡素材樹 |
| 根目錄直接視覺檔 | 9 | N／R／SR／SSR 正式外框及舊版模板等 |
| Legacy backup 內檔案 | 66 | 4 個直接檔案、2 個 badge reference、1 個 draft、59 個 template experiment |
| v2.1 容器內檔案 | 6 | 舊命名容器，尚未因資料夾名稱自動升格 |
| Pending Review 圖卡 | 30 | Batch 01～03，各 10 張 |
| Archive 內模板 | 7 | Templates v2.5 與 v2.2 |
| 檔名含 `Approved` | 24 | 檔名不是正式核准證據 |
| 已完成 checksum 與 PR 證據核對 | 4 | N／R／SR／SSR 外框 master |
| Phase 1 必要資料夾 | 43 | Validator 固定要求 |
| 已存在的必要資料夾 | 4 | `project.root`、`project.visuals`、`project.inbox`、`project.archive` |
| 尚未建立的必要資料夾 | 39 | 因此 move gate 必須維持 BLOCKED |

## 3. 已驗證 Approved Masters

以下四張已下載進唯讀 sandbox 計算 SHA-256，結果與 `docs/card-prompts/components/rarity-frame-registry-v1.md` 完全一致：

| Rarity | Drive File ID | Size | SHA-256 | 尺寸 |
|---|---|---:|---|---|
| N | `1KO7NHfipw-MlFfYLDaakHuupGjtrwYu8` | 2,285,281 | `17e6a6798e491ad2bad12b5746e7c3414078e456b83838db2e75aa0a7352ae65` | 1024 × 2000 |
| R | `18AgLp9b1hCrqawfsk5-OxPlmgSt93YGR` | 2,191,391 | `3620f4408b31055d0e6ea185fa08dd5be13a33687321191035ac0ba30b9fdf2d` | 1024 × 2000 |
| SR | `1cZPhfFv483bJAxk0kCBj6XS4V6Vyfx40` | 2,454,266 | `4976cd5ead7042edc24808183ea2415de1491ddd1d9d95b18d889fb0e95de073` | 1024 × 2000 |
| SSR | `1_PR-_mZXBkf7WJxXwq83AjaOvWpUJwbz` | 3,480,599 | `8bf608d7ba64b1efe787b8f6e0939c55a7d7623d5d9a791e5a260a144a9b328e` | 1024 × 2000 |

Registry 暫時記錄其實際 parent 為 `project.visuals`。Task 7 建立正式 `idiom-cards.components.card-frames.approved` 後，才可依 Migration Ledger 搬移並更新 parent key。

## 4. 漂移與風險

### 4.1 正式拓樸尚未存在

43 個 Phase 1 folder keys 中只有 4 個真實存在。不得以假 ID 或 placeholder 讓 CI 假性通過。

### 4.2 檔名不是核准證據

目前有 24 個檔名包含 `Approved`，但除上述四張外，尚未完成 checksum、版本、來源與核准證據核對。其餘檔案不得直接登錄為 current Approved master。

### 4.3 重複檔名

`CICG_CardTemplate_Rarity_SSR_v2.2_Approved.png` 在 Legacy backup 中存在兩個不同 Drive File ID，必須在後續分類時比較 checksum 與內容，不得只依檔名去重。

### 4.4 歷史容器混合多種生命週期

`02_UI_UX_And_Visuals` 同時包含正式外框、舊版模板、難易度標籤、Legacy backup 與 Review folder。未完成 Folder Topology 前不執行批次 move。

## 5. Validator 與 CI 狀態

已建立：

- 三份 JSON Schema
- `npm run test:drive-assets`
- `npm run validate:drive-assets`
- Folder／Asset／Migration validators
- Baseline Registry 與 read-only inventory ledger

目前 baseline 測試應確認：

```text
folders = 22
assets = 4
migration entries = 0
missing-required-folder = 39
other folder issues = 0
asset issues = 0
migration issues = 0
```

`npm run validate:drive-assets` 在 Task 7 建立 39 個真實資料夾前，應以 `missing-required-folder` 返回非零狀態。這是安全 Gate，不是測試故障。

因此 `scripts/verify.sh` 暫不加入強制 `validate:drive-assets`。Task 7 完成正式 topology、更新 Registry 並驗證 43／43 後，才啟用永久 CI Gate。

## 6. 下一步 Gate

Task 7 必須依序完成：

1. 建立 39 個尚缺的真實資料夾。
2. 將真實 Folder IDs 寫回 `drive-folders.json`。
3. 確認 `missing-required-folder = 0`。
4. 把 `npm run validate:drive-assets` 加入 `scripts/verify.sh`。
5. Registry、Ledger、rollback snapshot 全部通過後，才開始第一個小批次 move。

在上述條件完成前，Drive mutation gate 維持 **BLOCKED**。
