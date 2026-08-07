# 第一章成語圖卡主檔交付紀錄

日期：2026-08-07  
分支：`feat/chapter-one-card-catalog`  
Pull Request：`#38`

## 已交付

- 第一章 61 張卡的 seed catalog。
- 每張卡的稀有度、專屬外框、E～S 難易度、主要／次要類別。
- 圖卡解釋、例句、箴言、來源待校訂狀態。
- 每張卡可直接使用的完整產圖提示語與人工覆寫欄位。
- 主要角色性別與全章／逐批女性配額 Gate。
- SSR 的 epic／grand／heroic／high-VFX 史詩感 Gate。
- Node 驗證器與七項專用測試。
- Google Sheet `Card_Catalog` 與 `Card_Dashboard`。
- `Codebook_Agent` 與 `Version_History` 登錄。

## Google Sheet 回讀結果

```text
總卡數：61
女性主角：31（50.81967213%）
全章女性配額：PASS
batch-01～batch-06：每批 10 張／女性 5 張／PASS
batch-07：1 張／女性 1 張／PASS
N：12
R：18
SR：23
SSR：8
SSR 史詩提示語完整：8/8
完整產圖提示語：61/61
Draft：61
Approved：0
```

Google Sheet：

- Spreadsheet ID：`1JwdPPz4cjx94MYE5qXJt2GaE67e9HUlzXPY4OPb6S94`
- `Card_Catalog` Sheet ID：`1976080701`
- `Card_Dashboard` Sheet ID：`1976080702`

## 安全狀態

全部卡片仍維持：

```text
copy_review_status = draft
license_status = pending
review_status = draft
current_master = false
```

因此不會進入正式卡池，也不會以未校訂內容冒充 Approved 成品。

## GitHub Actions 驗證

最新同步 `main` 後的 CI #423 執行完整 `./scripts/verify.sh` 並通過：

```text
Node tests：346 passed／0 failed
其中 Card Catalog：7 passed／0 failed
Drive Asset Validator：PASS（folders=60 assets=9 migrations=3）
TypeScript strict：PASS
ESLint：PASS
Vite production PWA build：PASS
PWA generateSW：PASS，precache 12 entries（403.12 KiB）
npm audit：0 vulnerabilities
behind_by：0
Review threads：0
```

驗證分支 SHA：`0c253cf561049537ab75f605b008a9dd0947b97e`。