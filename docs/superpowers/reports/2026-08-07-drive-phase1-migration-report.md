# Drive Phase 1 Migration Report

日期：2026-08-07  
Batch：`phase1-batch1-approved-rarity-frames`  
狀態：**VERIFIED**

## 1. 範圍

本批次只處理四張已在 GitHub Registry 納管、已具 PR #32 核准證據及 SHA-256 的 N／R／SR／SSR rarity frame masters。

未包含：

- Difficulty badge reference
- Review cards
- Legacy templates
- 未驗證檔名含 `Approved` 的其他素材
- Artwork、Composite 或其他 component 類型

## 2. 搬移路徑

來源：

```text
02_UI_UX_And_Visuals
```

目的：

```text
02_UI_UX_And_Visuals/
└─ Idiom_Cards/
   └─ 02_Components/
      └─ 01_Card_Frames/
         └─ 20_Approved
```

目的 Registry key：`idiom-cards.components.card-frames.approved`  
目的 Drive Folder ID：`1RtNhgm93m0EXq3fNJlvuVuIwbWQhL4mj`

## 3. 驗證結果

| Rarity | Drive File ID | Size | SHA-256 | 結果 |
|---|---|---:|---|---|
| N | `1KO7NHfipw-MlFfYLDaakHuupGjtrwYu8` | 2,285,281 | `17e6a6798e491ad2bad12b5746e7c3414078e456b83838db2e75aa0a7352ae65` | Verified |
| R | `18AgLp9b1hCrqawfsk5-OxPlmgSt93YGR` | 2,191,391 | `3620f4408b31055d0e6ea185fa08dd5be13a33687321191035ac0ba30b9fdf2d` | Verified |
| SR | `1cZPhfFv483bJAxk0kCBj6XS4V6Vyfx40` | 2,454,266 | `4976cd5ead7042edc24808183ea2415de1491ddd1d9d95b18d889fb0e95de073` | Verified |
| SSR | `1_PR-_mZXBkf7WJxXwq83AjaOvWpUJwbz` | 3,480,599 | `8bf608d7ba64b1efe787b8f6e0939c55a7d7623d5d9a791e5a260a144a9b328e` | Verified |

每張檔案均依序完成：

1. Pre-move metadata snapshot。
2. 原 File ID 原地 move。
3. Parent、name、MIME、size 與 webViewLink 驗證。
4. 重新下載原始檔並計算 SHA-256。
5. 通過後才處理下一張。

四張檔案均保持：

- Drive File ID 不變
- 檔名不變
- MIME `image/png` 不變
- size 不變
- SHA-256 不變
- webViewLink 不變
- 未重新上傳
- 未建立第二份 current master

## 4. GitHub 同步

已更新：

- `data/drive-assets/idiom-card-assets.json`
- `data/drive-assets/migrations/2026-08-07-phase1-batch1-approved-rarity-frames.json`
- `docs/card-prompts/components/rarity-frame-registry-v1.md`
- `tests/card-drive-approved-frame-migration.test.mjs`

Migration Ledger 保留完整 `before`、`after` 與 `rollback` snapshot，ledger 與四個 entries 均為 `verified`。

## 5. 後續 Gate

本批次成功不代表其他素材可以直接搬移。下一批仍須先完成：

- 資產分類與 checksum
- 檔案角色判定
- Review／Approved／Archive 目的地
- 核准或 unverifiable 證據
- 完整 rollback Ledger

不得只依檔名中的 `Approved`、版本字樣或所在舊資料夾判定正式狀態。
