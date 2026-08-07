# Theme Badge System v1 Delivery Report

日期：2026-08-07  
分支：`feat/theme-badge-system-v1`  
PR：`#40`  
規格版本：成語圖卡標準規範 `v2.6`

## 1. 交付範圍

本次建立九大主題徽章的正式元件系統：

- 軍事：劍與軍旗／`#8E1E24`
- 內政：玉璽與卷軸／`#176B52`
- 智謀：羽扇與棋盤／`#5A338A`
- 文藝：毛筆與畫卷／`#167A83`
- 勵志：山路與旭日／`#C77B1F`
- 修身：蓮花與竹簡／`#B95B79`
- 人際：相握之手／`#9A5B22`
- 警世：警鐘與眼睛／`#3F2B78`
- 見識：眼睛與遠山窗口／`#1D5F9E`

九枚母件均為 `1024 × 1280 px`、PNG、RGBA、透明背景；另有一張 `3072 × 3840 px` 九宮格總覽圖，只供文件審核，不得裁切作為卡面元件。

## 2. Drive Approved 證據

Approved Folder：`idiom-cards.components.theme-badges.approved`  
Drive Folder ID：`181mpCL3649D0EwZk7c4KWesxV229TZiV`

| systemValue | Drive File ID | SHA-256 |
|---|---|---|
| military | `1RwJnE5p8FBntNc2-4E77rNHDkeL2WULL` | `25eb2ca58528e963627a5509bf7af27caa1b8e71754ee6140824e678a0db1c57` |
| governance | `18ToyA7isbH7C1gOVttbIKElvq9mR9s7_` | `6bd0ae768fc2c3c05440cc64e484e33e1e12d4f93981670441600164acecec6c` |
| strategy | `1J319MdLw79Wdp-CrQDEJiGT7QyhOxSDy` | `253129112e31db2a14190f0e71b997285aa353b9f8e60b325127a152a19e9377` |
| arts | `1WVsSDyPArPNWgjAJ1mV1HIJMziZ3WjFi` | `dea43666a1e962263064a0863645961e582ef7f3940aa6b76fac7274932954d3` |
| perseverance | `1WYscZjC7qT2gkutWDzP6qmvGGEx4_6UE` | `276b8a770f3072e56778652f53f96f8f2cee00d3daba6e6a9208779d63bc000f` |
| selfCultivation | `1uhYlV1ps74r73fOZXvL1qmFQ90Y-8pUu` | `3c14c3e267434e972b54f11240672dfb2bc6d26d235ac29a7df77af26c88f6ba` |
| relationships | `1eu4mLWRZ8TA6KkAvQEQn_nmbORCTtyja` | `efc5d9e4f60490ea20acba7064b32325884784e142b7d77b1607164e8a812efc` |
| cautionary | `19-r45YVVskAaxvgPemfhFyrsSRHy3-fY` | `bd5209c887e3232668934b6ff8fc57eaaf753a18bdcbba0d0ff2a99ec448064c` |
| perspective | `1-OVHbBFfWYaBU3_JJECmnaLq3EwFxrLz` | `de01832d7b12da28d3a9423430e009258d9bab75b77055c60da4c85078049402` |
| overview | `1s-cNroYhFxsfcWjV7D-0ajsbTMflNnDX` | `63b18776a0ea99bb582c1f30044b3a2cd05268c5c811a4748b0dab53c6e3df14` |

排查期間誤建的空白 `30_Reference` 資料夾已永久刪除，未留下未註冊 Drive 漂移。

## 3. GitHub Canonical Sources

- `data/cards/theme-badge-registry.json`
- `data/cards/theme-badge-registry.schema.json`
- `data/drive-assets/idiom-card-assets.json`
- `src/cards/theme-badges/theme-badge-types.ts`
- `src/cards/theme-badges/validate-theme-badge-registry.ts`
- `src/cards/theme-badges/index.ts`
- `scripts/validate-theme-badges.mjs`
- `tests/theme-badge-registry.test.mjs`

產圖 Agent 與 renderer 只能從 `theme-badge-registry.json` 解析正式中文名稱與 Asset ID；圖片模型不得直接生成徽章、類別名稱或其他正式卡面 UI。

## 4. TDD 與永久 Gate

RED：先加入 `tests/theme-badge-registry.test.mjs`；初次 CI 因測試未匯入 `node:url` 而失敗，證明新測試已進入執行路徑。  
GREEN：完成固定九類枚舉、純 TypeScript 驗證器、Drive Asset 對照、JSON Schema、專用 CLI 與 `verify.sh` Gate。

永久檢查包含：

- 九類數量、順序與唯一性
- 固定中文名稱、圖式與色碼
- `themeCategory` 與 `themeBadgeAssetId` 一一對應
- Drive asset 必須是 `theme-badge`、`approved`、`currentApproved=true`
- 尺寸固定 `1024 × 1280`
- MIME 固定 `image/png`
- 透明背景固定為 `true`
- 非正式名稱如「專注」不得成為卡面類別

CI #469 已驗證：

```text
[drive-assets] PASS folders=60 assets=19 migrations=3
[theme-badges] PASS badges=9 approved-assets=9
```

最終合併 Gate 仍以 PR #40 最新 head 所綁定的 GitHub Actions 結果為準。

## 5. Google Sheet

`CICG_素材管理控制中心_v1.0` 已更新：

- `Asset_Register`：原 `theme-badge-set` 從 8 枚缺失修正為 9／9 Approved，新增九枚母件與總覽圖逐筆紀錄。
- `Codebook_Agent`：新增 `themeCategory`、`themeCategoryLabel`、`themeBadgeAssetId`、`secondaryThemeTags`、`theme_badge_registry`。
- `Version_History`：新增九枚母件與總覽圖的 File ID、尺寸、SHA-256 與核准證據。

## 6. 非本次範圍

本次不直接遷移第一章 61 張卡的舊分類，也不重製第一批 10 張圖卡。下一個獨立任務必須先將 `categoryPrimary/categorySecondary` 遷移為：

```text
themeCategory
themeCategoryLabel
themeBadgeAssetId
secondaryThemeTags
```

完成 61 張分類 Gate 後，才能使用本次九枚 Approved 母件重製 Batch 01。
