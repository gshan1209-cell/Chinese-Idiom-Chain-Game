# Drive Phase 2 全專案素材治理設計

日期：2026-08-07  
狀態：Review  
範圍：Chinese-Idiom-Chain-Game 全專案 Google Drive 素材治理

## 1. 背景

Phase 1 已完成成語圖卡素材治理，建立 Folder Registry、Asset Registry、Migration Ledger、rollback snapshot、physical audit 與永久 CI Gate。Phase 2 將相同治理能力擴展到整個專案 Drive，但不得把圖卡專屬模型硬套到所有素材類型。

最新盤點顯示：

- GitHub `main` 已合併 PR #35，Phase 2 Readiness 為 `true`。
- Drive 固定頂層 `00`～`05`、`80_Inbox`、`90_Archive` 均存在。
- `00_Project_Management` 已新增 `Asset_Control_Center`，其中包含 `CICG_素材管理控制中心_v1.0` Google Sheet。
- `02_UI_UX_And_Visuals` 除既有 `Idiom_Cards` 外，已新增 `Game_Backgrounds`。
- `Game_Backgrounds/10_Review` 已有 7 張背景圖；`20_Approved` 目前為空。
- `03_Game_Content_And_Data`、`04_Testing_And_Evidence`、`05_Releases_And_Store_Assets` 目前根層為空。
- GitHub PR #36 含 13 張 PNG，但同時混入舊版智慧跳格程式與文件變更，且以舊 `main` 為基底，不能直接合併。
- Open Issue #33 已被後續 PR #32／#35 實質處理，但尚未完成 Issue 狀態收斂。

## 2. 目標

Phase 2 必須達成：

1. 建立全專案 Drive 的唯讀 inventory 與 drift report。
2. 讓人類可從 Asset Control Center 快速掌握素材狀態。
3. 讓 Agent 以 GitHub machine-readable Registry、Schema 與 CLI 取得可信狀態。
4. 為非圖卡素材建立可擴充、type-first 的治理拓樸。
5. 區分 source master、review asset、approved master、runtime derivative、evidence 與 release artifact。
6. 每次只執行小批次 mutation，並保留完整 rollback path。
7. 收斂 PR #36，不讓二進位素材與過時程式碼一起進入 `main`。

## 3. 非目標

本階段不做：

- 不人工核准 7 張背景圖的視覺品質。
- 不產製缺少的 Logo、Icon、卡牌插畫、商店圖或影片。
- 不改主玩法、IndexedDB Schema、卡池、關卡或 PWA 行為。
- 不把 Drive source master 全量複製進 GitHub。
- 不一次搬完所有歷史素材。
- 不永久刪除任何素材。

## 4. 真實狀態優先序

```text
GitHub main
→ GitHub Actions
→ GitHub Registry／Schema／Reports
→ Drive Approved source masters
→ Asset Control Center derived dashboard
→ PR／Review／Inbox
→ Local-only files
→ 聊天紀錄
```

Asset Control Center 是人類操作入口與衍生報表，不得覆寫 GitHub Registry 的 canonical status、checksum、Folder ID 或 current master 判定。

## 5. 雙入口治理模型

### 5.1 Human Entry：Asset Control Center

固定位置：

```text
00_Project_Management/Asset_Control_Center/
```

用途：

- KPI、缺口、阻擋與下一步摘要。
- 依 domain、priority、lifecycle、owner 與 drift state 篩選。
- 顯示 GitHub PR、Drive File、Registry 與 evidence 連結。
- 保存 Snapshot Log 與 Version History，禁止覆蓋歷史。

限制：

- Sheet 不得自行把 Review 改成 Approved。
- Sheet 中的 `github_main_sha`、數量與 drift 狀態都必須可由 Registry／GitHub 狀態重新生成。
- Sheet 與 Registry 衝突時，Sheet 標記 `stale-dashboard`，不得反向修改 Registry。

### 5.2 Agent Entry：GitHub Registry

Phase 2 新增非圖卡素材 Registry：

```text
data/drive-assets/project-assets.json
data/drive-assets/project-asset.schema.json
```

既有圖卡 Registry 保持：

```text
data/drive-assets/idiom-card-assets.json
```

Folder Registry 繼續使用單一 canonical 檔：

```text
data/drive-assets/drive-folders.json
```

Migration Ledger 繼續集中於：

```text
data/drive-assets/migrations/
```

永久 CLI 必須交叉驗證：

- Folder ID、parent 與 lifecycle role。
- Asset `domain + assetType + identity + version`。
- Drive File ID 跨所有 Asset Registries 唯一。
- 同一 asset family 最多一個 current Approved master。
- Asset status 與 parent folder lifecycle 一致。
- Runtime derivative 必須指回 Approved source master。
- Dashboard snapshot 不得宣稱比 Registry 更新。

## 6. 素材分層

### 6.1 Source Master

高解析度原始素材，存放於 Drive。可能是 PNG、SVG、音訊、影片、Google Doc、Google Sheet 或校訂文件。

### 6.2 Runtime Derivative

遊戲實際載入的最佳化衍生檔，可在核准後提交 GitHub `public/assets/`，但必須：

- 來源為 Approved source master。
- 登錄 `sourceAssetId`、source SHA-256 與 derivative SHA-256。
- 有明確尺寸、壓縮與檔案大小預算。
- 不得反向成為唯一 source master。
- Source master 被取代時，runtime derivative 必須重新驗證。

### 6.3 Evidence

測試截圖、實機錄影、校訂紀錄、授權文件與核准證據。Evidence 不使用 `currentApproved`；採 immutable、dated、verified 模型。

### 6.4 Release Artifact

商店圖、發布包、release manifest、驗收清單與交付壓縮檔。Release artifact 必須綁定版本與 commit SHA，不得直接取代 source master。

## 7. Phase 2 Domain

非圖卡資產使用下列 domain：

```text
project-management
design-spec
branding
background
ui-component
map-progress
item-icon
bonus-mode
pwa-icon
game-content
localization
license-evidence
test-evidence
release-store
runtime-derivative
```

`idiom-card` 繼續由既有專屬 Registry 管理，不併入通用 Registry。

## 8. 目標 Drive 拓樸

固定頂層不得重新命名。

### 8.1 Project Management

```text
00_Project_Management/
├─ Asset_Control_Center/
├─ Approval_Records/
├─ Decision_Records/
└─ Release_Checklists/
```

### 8.2 Design and Specs

```text
01_Design_And_Specs/
├─ 01_Visual/
├─ 02_Game_Content/
├─ 03_Audio_And_Video/
├─ 04_PWA_And_Store/
└─ 90_Superseded/
```

設計文件不只靠檔名標示 Approved；正式狀態仍由 Registry／evidence 決定。

### 8.3 UI／UX and Visuals

```text
02_UI_UX_And_Visuals/
├─ Idiom_Cards/                       # Phase 1，保持不變
├─ Game_Backgrounds/{10_Review,20_Approved}
├─ Branding/{10_Review,20_Approved}
├─ UI_Components/{10_Review,20_Approved}
├─ Map_And_Progress/{10_Review,20_Approved}
├─ Item_Icons/{10_Review,20_Approved}
├─ Bonus_Mode/{10_Review,20_Approved}
└─ PWA_Icons/{10_Review,20_Approved}
```

### 8.4 Game Content and Data

```text
03_Game_Content_And_Data/
├─ 01_Idiom_Sources/
├─ 02_Chapter_Data/
├─ 03_Pronunciation_Meaning_Examples/
├─ 04_Localization/
└─ 05_Licensing_And_Corrections/
```

資料內容不以 Drive 取代 GitHub CSV／JSON。Drive 只保存校訂、授權與人工審核文件；GitHub 仍是 runtime data source。

### 8.5 Testing and Evidence

```text
04_Testing_And_Evidence/
├─ 01_Device_Screenshots/
├─ 02_Offline_And_PWA/
├─ 03_Accessibility/
├─ 04_Performance/
├─ 05_Content_QA/
└─ 06_Asset_QA/
```

Evidence 採日期／版本批次，不建立可被誤認為 source master 的 Approved 副本。

### 8.6 Releases and Store Assets

```text
05_Releases_And_Store_Assets/
├─ 01_Release_Manifests/
├─ 02_PWA_Packages/
├─ 03_Store_Listings/
├─ 04_Store_Screenshots/
├─ 05_Promo_Video/
└─ 06_Delivery_Bundles/
```

### 8.7 Inbox and Archive

```text
80_Inbox/<Domain>/<YYYY-MM-DD>_<BatchId>/
90_Archive/<Domain>/<AssetFamily>/
```

新素材一律先進 Inbox。已知類型但待審核素材可從 Inbox 搬到對應 `10_Review`；未知或證據不足素材留在 Inbox。舊版與不可驗證素材進 Archive，不永久刪除。

## 9. PR #36 收斂策略

PR #36 不可直接 merge，原因：

- 13 張 PNG 與舊版智慧跳格程式／文件混在同一 PR。
- Base 已落後最新 `main`。
- 二進位 source masters 應先由 Drive 管理，而不是直接以 Git branch 充當 Inbox。
- `card_frame_ssr.png` 與現有 SSR v2.8 Approved frame 可能形成重複 current master。
- `campaign_map_bg.png` 與 Drive `Game_Backgrounds/10_Review` 候選衝突。

推薦處理：

1. 對 13 張 PNG 建立唯讀 inventory、尺寸、SHA-256 與用途對照。
2. 與 Drive 已有候選逐項比對，禁止同名或語意相近即視為相同。
3. 僅將未重複且仍有價值的 source asset 搬入 `80_Inbox/<Domain>/<BatchId>`。
4. 保留 PR #36 branch 作為短期 evidence，直到 Drive File ID、checksum 與 Registry 完成。
5. 完成移轉後關閉 PR #36，標記 superseded；不得把其舊程式差異帶入新 PR。
6. 未來需要 runtime derivative 時，從 Approved Drive master 另開乾淨、最小的 runtime-assets PR。

## 10. 執行批次

### Batch 0：Read-only Inventory

- 遞迴盤點所有頂層 domain。
- 產出 folder／file counts、MIME、size、modified time 與 orphan list。
- 比較 Asset Control Center、GitHub Registry、Drive 與 Open PR。
- 不建立資料夾、不搬檔、不重新命名。

### Batch 1：Control Center 與 Backgrounds 納管

- 將 `Asset_Control_Center`、`Game_Backgrounds` 與 7 張 Review 背景寫入 Registry。
- 建立 dashboard freshness Gate。
- 不進行視覺 Approved 判定。

### Batch 2：PR #36 Quarantine／Extraction

- 建立 13 張素材 inventory。
- 比對 Drive 候選與既有 Approved master。
- 只將安全候選移入 Drive Inbox。
- 完成 evidence 後關閉 PR #36。

### Batch 3：空白領域拓樸

- 建立 `03`、`04`、`05` 的最小必要子目錄。
- 建立 Folder Registry 與 rollback ledger。
- 不預先建立未使用的深層結構。

### Batch 4 之後：小批分類

每批上限：

```text
10 files 或 1 logical asset family
```

每批均須 RED／GREEN 驗證、Migration Ledger、physical audit 與 rollback path。

## 11. Validation Gate

永久驗證至少包含：

- `project-assets.json` runtime shape 與 Schema。
- Asset identity、version、status、source／derivative 關係。
- 跨 Registry Drive File ID 唯一性。
- Folder canonical name、parent 與 lifecycle role。
- Approved master 唯一性。
- Review／Inbox／Archive folder assignment。
- Evidence immutable fields。
- Release artifact 綁定 commit SHA 與 release version。
- Dashboard freshness 與 source priority。
- Migration `before／after／rollback` snapshot。
- Physical audit 與 Registry 對齊。

任何 blocking drift 存在時：

- 不得核准新 source master。
- 不得提交 runtime derivative。
- 不得製作 release bundle。
- 不得開始下一個 mutation batch。

## 12. 錯誤處理

- Drive API 讀取失敗：標記 inventory incomplete，不推測缺失內容。
- File checksum 無法取得：資產保持 Review／Inbox，不升 Approved。
- Dashboard 與 Registry 衝突：Dashboard 標記 stale，Registry 不自動回寫。
- Move 驗證失敗：停止批次並執行 rollback。
- Rollback 失敗：立即標記 blocking drift，禁止後續 mutation。
- Source／derivative 關係不明：保留於 Inbox，不打包進 PWA。

## 13. 成功條件

Phase 2 架構完成需同時滿足：

```text
全專案 read-only inventory = complete
project-assets Registry = valid
Folder Registry = valid
Asset Control Center freshness = PASS
PR #36 = safely superseded or reduced to a clean approved scope
Blocking drift = 0
Duplicate current Approved = 0
Unverified applied migrations = 0
Full repository verify = PASS
ChatGPT Audit = PASS
behind_by = 0
```

完成架構不代表所有素材都已 Approved；未審核素材可持續存在於 Review／Inbox，只要狀態、位置與 evidence 可稽核。
