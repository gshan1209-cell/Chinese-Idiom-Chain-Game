# 第一章成語圖卡主檔 ChatGPT Audit

日期：2026-08-07  
Pull Request：`#38`  
Audit 結果：`PASS`

## 範圍

本次 Audit 僅驗證第一章圖卡資料治理、Google Sheet 管理入口與永久 Gate；不將 Draft 圖卡升格為 Approved，也不產製或核准 61 張成品圖片。

## Audit Findings

### 1. 第一章內容一致性：PASS

- Catalog 固定 61 張。
- `cardId`、`idiomId`、成語文字均要求唯一。
- 專用測試確認 61 張資料與第一章 20 關 placements 完全一致。

### 2. 稀有度與專屬外框：PASS

```text
N   → rarity-frame-n
R   → rarity-frame-r
SR  → rarity-frame-sr
SSR → rarity-frame-ssr
```

第一章不得使用 UR；UR 仍只保留給具有正式授權證據的 IP 聯名。

### 3. 卡片難易度與類別：PASS

- 卡片難易度使用 E／D／C／B／A／S。
- 名稱固定為入門／基礎／普通／進階／困難／極限。
- 卡片難易度與關卡 easy／normal／hard 分開保存。
- 61 張均具有主要及次要類別。

### 4. 完整提示語：PASS

- Google Sheet 顯示 61／61 具完整提示語。
- Validator 要求每筆提示語包含成語、角色、場景、風格、1024×1200 主插圖尺寸、1024×2000 卡片定位與禁止烙入卡面文字等限制。
- 提供 `prompt_master_override` 供人工核准後覆寫，不破壞歷史欄位。

### 5. 女性主要角色配額：PASS

- 全章女性主要角色 31／61，比例 50.81967213%。
- batch-01～batch-06 各 5／10。
- batch-07 為 1／1。
- 全章與所有批次 Gate 均為 PASS。

### 6. SSR 史詩感：PASS

- SSR 共 8 張。
- 8／8 具 `ssrEpicPromptBlock`。
- Validator 固定要求：`epic`、`grand`、`heroic`、`high` VFX。
- SSR 不得只依賴彩虹外框，中央插畫必須呈現英雄氣勢、宏大場景、電影式構圖、傳奇光效與決定性瞬間。

### 7. 發布安全：PASS

61 張目前全部維持：

```text
copy_review_status = draft
license_status = pending
review_status = draft
current_master = false
```

缺少四字注音、四字帶聲調拼音、正式來源校訂、授權證據或 Drive checksum 時，Validator 不允許標記 Approved／Current Master。

### 8. GitHub／Drive／Sheet 一致性：PASS

- `Card_Catalog`：61 張。
- `Card_Dashboard`：總數、稀有度、難度、女性配額、SSR 與產製狀態均與 Repository 控制檔一致。
- Google Sheet 只作人工管理投影；GitHub main、Actions、Repository 資料仍具有較高真實狀態優先級。

### 9. CI 與分支狀態：PASS

CI #423：

```text
346 tests passed／0 failed
TypeScript strict PASS
ESLint PASS
Vite PWA Build PASS
npm audit 0 vulnerabilities
behind_by = 0
unresolved review threads = 0
```

## 結論

PR #38 符合本階段規格，可進入 Squash Merge。後續圖片產製仍須逐張依 `Card_Catalog` 的稀有度外框、性別、完整提示語與 SSR 史詩規則執行，並經 Review 後才可升格 Approved。