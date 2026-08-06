# Chinese-Idiom-Chain-Game Drive 素材治理設計 v1.0

狀態：Design Approved  
範圍：Google Drive 素材庫治理  
Repository：`gshan1209-cell/Chinese-Idiom-Chain-Game`  
Drive 根目錄：`04_Products/Chinese-Idiom-Chain-Game`

---

## 1. 目的

本規格建立可長期維護的 Google Drive 素材治理方式，先以成語圖卡作為示範區，再將同一套結構擴展至整個專案。

主要目標：

- 將 artwork、component、template、composite 與歷史成品分開管理。
- 將 Inbox、Review、Approved 與 Archive 物理隔離。
- 讓每個 Drive File ID 都能在 GitHub 中找到版本、狀態、checksum 與用途。
- 確保未來修改難易度、稀有度外框或其他元件時，不需要重畫中央 artwork。
- 防止 Drive 與 GitHub 因不同 Agent、不同聊天或不同批次而再次漂移。
- 保留既有 File ID 與分享連結，搬移時不以重新上傳取代原檔。

本規格不改變主玩法、關卡、成語資料、收藏 IndexedDB 或 PWA production code。

---

## 2. 現況與問題

專案根目錄目前已具備固定頂層：

```text
00_Project_Management
01_Design_And_Specs
02_UI_UX_And_Visuals
03_Game_Content_And_Data
04_Testing_And_Evidence
05_Releases_And_Store_Assets
80_Inbox
90_Archive
```

這個頂層結構保留，不重新命名。

目前主要問題集中在 `02_UI_UX_And_Visuals`：

- 完整模板、稀有度外框、難易度標籤、Review 資料夾與 Legacy Backup 混在同一層。
- 檔名中的 `Approved` 與實際所在資料夾不一定能證明正式核准。
- 同一資產家族可能同時存在 v2.6、v2.7、v2.8，但缺少唯一 current version 指標。
- component master 與完整 composite 的角色不清楚。
- GitHub Manifest、component registry 與 Drive 實際內容容易不同步。
- 批次 Review 資料夾以時間或修正主題命名，但缺少機器可讀的 migration ledger。
- Legacy、Rejected、Deprecated 與 Approved 尚未形成一致生命週期。

截至本規格撰寫時，四階稀有度外框與 SSR v2.8 已由 GitHub PR #32 納管；後續 Drive 搬移不得反向改寫該正式規格。

---

## 3. 真實狀態與分工

### 3.1 優先序

```text
GitHub main
→ GitHub Actions
→ Repository 規格、Registry、Manifest 與 Migration Ledger
→ Drive Approved master 與可稽核審核證據
→ Drive Review／Inbox 素材
→ 聊天紀錄與舊檔名
```

### 3.2 GitHub 保存

- 資產 ID、類型、版本與生命週期狀態。
- Drive File ID、Folder ID、檔名、尺寸、MIME type、檔案大小與 SHA-256。
- artwork、component、template、composite 的依賴關係。
- 審核結果、授權證據 ID、取代關係與發布狀態。
- 搬移前後路徑與 Migration Ledger。
- 可驗證 Schema、檢查腳本與漂移報告。

### 3.3 Drive 保存

- 原始 PNG、JPEG、SVG、音效、影片及其他大型二進位素材。
- Approved master。
- Review 版本與修改證據。
- 歷史、停用、拒絕與替代版本。
- 商店、發布與實機驗證交付物。

### 3.4 禁止雙主檔

Drive 同一資產不得同時保留兩個 current Approved master。需要發布或商店格式時，輸出檔放到 `05_Releases_And_Store_Assets`，但原始 master 仍只有一個。

---

## 4. 兩階段治理

### Phase 1：成語圖卡示範區

處理：

- Artwork
- Card Frame
- Rarity Badge
- Difficulty Badge
- Theme Badge
- Motto Plaque
- Effect Overlay
- Card Template
- Composite
- Reference／Mockup
- Legacy Flat Card

Phase 1 必須先完成清冊、目標結構、搬移 Ledger 與 GitHub／Drive 漂移驗證，才可開始移動檔案。

### Phase 2：全專案擴展

Phase 1 驗證通過後，將相同治理方式套用到：

- UI 畫面、Logo、Icon、背景與動態視覺。
- 音效、音樂與影片。
- 校訂、來源與授權文件。
- 實機測試、截圖、錄影與驗證證據。
- Release、Store Listing 與行銷素材。

Phase 2 不得在 Phase 1 尚有 Blocking drift 時啟動。

---

## 5. Phase 1 目標 Drive 結構

頂層結構保留。成語圖卡正式資產放在：

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
```

### 5.1 為什麼採 type-first

本設計採「資產類型優先、狀態次目錄」，而不是在頂層建立一個巨大 `Review` 與 `Approved`。

原因：

- artwork、component 與 composite 的用途和驗收條件不同。
- 同類元件較容易比較版本與視覺差異。
- 每一類仍具備 Review／Approved 的物理隔離。
- 未來可對不同資產類型套用不同驗證腳本。
- 搬移與批次審核時不必在大型資料夾中搜尋所有檔案。

### 5.2 80_Inbox

所有新素材仍先進：

```text
80_Inbox/
└─ Idiom_Cards/
   └─ <YYYY-MM-DD>_<BatchId>/
      ├─ Artworks/
      ├─ Components/
      ├─ Templates/
      ├─ Composites/
      └─ Intake_Notes/
```

Inbox 只表示「尚未完成分類」，不表示 Review、Approved 或可發布。

完成 intake 後：

- 可審素材移到對應 `10_Review`。
- 無法分類、損壞、重複或來源不明者留在 batch 並標記 `quarantined`。
- 不得從 Inbox 直接移到 Approved。

### 5.3 90_Archive

歷史與停用素材放在：

```text
90_Archive/
└─ Idiom_Cards/
   ├─ 01_Artworks/
   ├─ 02_Components/
   ├─ 03_Templates/
   ├─ 04_Composites/
   ├─ 05_Legacy_Flat_Cards/
   └─ 06_Rejected_And_Unverifiable/
```

Archive 下依資產家族與版本保存，例如：

```text
90_Archive/Idiom_Cards/02_Components/Card_Frames/SSR/v2.7/
```

歸檔不是刪除。檔案移入 Archive 後仍保留原 Drive File ID 與 GitHub 歷史紀錄。

---

## 6. 資產類型定義

### Artwork

- 主要人物、背景、道具、情境與光影。
- 建議 `1024 × 1200 px`。
- 不得包含卡框、稀有度、難易度、主標、注音、拼音、典故、箴言或來源。

### Component

可替換的視覺元件：

- Card Frame
- Rarity Badge
- Difficulty Badge
- Theme Badge
- Motto Plaque
- Effect Overlay

每個 component 必須有獨立 component ID、版本與 checksum。

### Template

- 用來展示完整 layout、slot、位置與視覺標準。
- Template 可以包含示範內容，但不得成為特定成語的 canonical artwork。
- Template 不等於可直接進卡池的正式卡。

### Composite

- Artwork、component 與結構化 data 的 derived output。
- 正式輸出固定 `1024 × 2000 px`。
- Composite 不得成為唯一 canonical source。

### Reference Only

- 競品分析、風格探索、構圖草稿、色彩研究與 mockup。
- 不得標成 Approved runtime asset。
- 第三方參考素材不得打包進 PWA 或對外發布。

### Legacy Flat Card

- 所有 UI 與 artwork 已壓成單張不可拆圖片的歷史卡。
- 可保留顯示與比較，但不得宣稱支援元件替換。

---

## 7. 生命週期

正式狀態：

```text
intake
→ classified
→ review
→ changes-requested
→ review
→ approved
→ published（metadata only）
→ archived
```

例外狀態：

```text
quarantined
rejected
unverifiable
```

### 7.1 Physical folder 與 metadata

- `intake`、`quarantined`：`80_Inbox`。
- `review`、`changes-requested`：對應 `10_Review`。
- `approved`、`published`：對應 `20_Approved`；published 只記錄在 GitHub，不複製 master。
- `archived`、`rejected`、`unverifiable`：`90_Archive` 對應區域。

### 7.2 Approval Gate

檔案只有同時符合下列條件才可進 `20_Approved`：

- GitHub Registry 已建立唯一 asset ID。
- Drive File ID、檔名、尺寸、MIME type、檔案大小與 checksum 已記錄。
- 對應內容、視覺、權利與技術驗證已通過。
- producer 與 final approver 不是同一個未驗證動作。
- 沒有另一個同資產家族的 current Approved 版本。
- 舊版已安排在同一 migration batch 歸檔。

檔名含有 `Approved` 但不符合上述條件時，仍不是 Approved。

---

## 8. 檔名規範

通用格式：

```text
CICG_<AssetType>_<Identity>_v<Major.Minor>_<Status>.<ext>
```

範例：

```text
CICG_Artwork_愚公移山_v1.0_Review.png
CICG_Component_RarityFrame_SSR_v2.8_Approved.png
CICG_Component_DifficultyBadge_E-S_v1.0_Approved.svg
CICG_Template_Rarity_SSR_v2.8_Approved.png
CICG_Composite_愚公移山_SSR_B_v1.0_Review.png
```

規則：

- 使用 ASCII 類型名稱與可辨識 identity。
- 版本必須明示，不使用 `final`、`final2`、`new`、`最新版`。
- Status 只允許 `Review`、`Approved`、`Legacy`、`Rejected`。
- 真實生命週期仍以 GitHub Registry 為準，檔名不能單獨證明狀態。
- 移動檔案時原則上不重新上傳，以保留 File ID。

---

## 9. GitHub 資產登錄設計

Implementation Phase 預計建立：

```text
data/drive-assets/
├─ drive-folders.json
├─ idiom-card-assets.json
├─ drive-asset.schema.json
└─ migrations/
   └─ <YYYY-MM-DD>-idiom-card-phase1.json

docs/drive-assets/
├─ README.md
└─ latest-drift-report.md
```

### 9.1 Asset record

每筆資產至少包含：

```json
{
  "assetId": "component-rarity-frame-ssr-v2.8",
  "assetType": "card-frame",
  "identity": "rarity-ssr",
  "version": "2.8",
  "status": "approved",
  "isCurrent": true,
  "driveFileId": "1_PR-_mZXBkf7WJxXwq83AjaOvWpUJwbz",
  "driveFolderId": "<approved-folder-id>",
  "filename": "CICG_CardTemplate_Rarity_SSR_v2.8_Approved.png",
  "mimeType": "image/png",
  "width": 1024,
  "height": 2000,
  "sizeBytes": 3480599,
  "sha256": "<64-hex>",
  "dependsOn": [],
  "replacesAssetId": "component-rarity-frame-ssr-v2.7",
  "licenseEvidenceId": null,
  "approvedAt": "<ISO-8601>",
  "approvedByEvidence": "<review-record-id>"
}
```

### 9.2 唯一 current 約束

同一組：

```text
assetType + identity
```

最多只能有一筆：

```text
status = approved
isCurrent = true
```

舊版本不刪除，改為 `isCurrent = false` 並移入 Archive。

### 9.3 Folder registry

`drive-folders.json` 保存所有受管資料夾：

- logical path
- Drive Folder ID
- purpose
- accepted asset types
- accepted statuses
- parent folder ID
- active／deprecated 狀態

Agent 不得只靠資料夾名稱猜測 Folder ID。

---

## 10. Migration Ledger

每次搬移必須先建立不可含糊的 Ledger：

```json
{
  "migrationId": "2026-08-06-idiom-card-phase1-batch-01",
  "status": "planned",
  "items": [
    {
      "assetId": "component-rarity-frame-n-v1.0",
      "driveFileId": "1KO7NHfipw-MlFfYLDaakHuupGjtrwYu8",
      "beforeFolderId": "1cH0KYWGvUT5ci57HW8JBFv3v-8uG51IC",
      "afterFolderId": "<target-folder-id>",
      "action": "move",
      "preMoveVerified": false,
      "postMoveVerified": false
    }
  ]
}
```

狀態：

```text
planned
→ preflight-passed
→ moving
→ verification-pending
→ completed
```

失敗時：

```text
blocked
rollback-required
```

### 10.1 Preflight

搬移前逐檔確認：

- File ID 與預期一致。
- 檔名、大小與 checksum 一致。
- 原資料夾與目標資料夾已登錄。
- 沒有未完成的同資產 migration。
- GitHub `main` 已納管該資產版本。
- 分享與下載權限不會因移動而失效。

### 10.2 Post-move

搬移後逐檔確認：

- File ID 沒有改變。
- 新 parent Folder ID 正確。
- webViewLink 仍可使用。
- checksum、大小與 MIME type 未改變。
- Registry、Manifest、component registry 與 Ledger 一致。
- 舊路徑沒有留下第二份 current master。

未完成 post-move 驗證前，Ledger 不得標記 completed。

---

## 11. Phase 1 搬移批次

採小批次，避免一次搬動所有素材。

### Batch 0：只讀盤點

- 掃描 `02_UI_UX_And_Visuals`、`80_Inbox` 與 `90_Archive/Idiom_Cards`。
- 建立 Folder Registry 與 Asset Inventory。
- 不搬檔、不改名、不刪除。
- 輸出 duplicate、orphan、unregistered 與 status mismatch 報告。

### Batch 1：已納管 Approved components

優先處理已在 GitHub 登錄的：

- N／R／SR rarity frames。
- SSR v2.8 rarity frame／template master。
- SSR v2.7 rarity badge master。
- Difficulty badge master。

搬移前須確認 component 類型；完整 template 不得誤放到 component 資料夾。

### Batch 2：Approved templates

- 確定 current template family。
- 舊 v2.1、v2.6、v2.7 非 current 版本移入 Archive。
- 保留 File ID 與 replaces 關係。

### Batch 3：Review batches

整理目前以 `Batch_01`、`Batch_02`、`Batch_03` 等命名的 Review 素材：

- 先逐檔分類為 artwork、component、template 或 composite。
- 不因 batch 名稱直接判定資產類型。
- 狀態不明者留在 Inbox／quarantined。

### Batch 4：Legacy backup

- 現有 Legacy 原圖維持原始 PNG。
- 建立可搜尋的 Asset Inventory。
- 分成 template experiments、flat cards、badge references 等類型。
- 不把 Legacy 內容升級為 Approved。

### Batch 5：漂移收斂與 Phase 1 Gate

- Drive Folder Registry 全部存在且 ID 正確。
- Approved assets 全部有 GitHub record。
- 每個資產家族只有一個 current Approved。
- Review、Approved、Archive 沒有狀態錯置。
- 所有 migration ledger completed 或明確 blocked。

通過後才可啟動 Phase 2。

---

## 12. 漂移偵測

至少檢查：

### Drive-only

Drive 有檔案，但 GitHub 無 asset record。

### GitHub-only

Registry 有 asset record，但 Drive File ID 不存在或無法存取。

### Parent drift

Drive File ID 正確，但 parent Folder ID 與 Folder Registry 不符。

### Metadata drift

檔名、尺寸、大小、MIME type 或 checksum 不符。

### Status drift

Registry 狀態與實際資料夾不符。

### Version drift

同一資產家族存在多個 current Approved，或 newer Approved 未取代舊版。

### Dependency drift

Composite 所引用的 artwork／component 版本不存在、未核准或已被取代。

Blocking drift 未解決時：

- 不得核准新 composite。
- 不得加入正式 PWA。
- 不得搬移下一批。
- 不得宣稱 Drive 整理完成。

---

## 13. 多 Agent 與跨聊天規則

- 每次 Drive 操作前先讀 GitHub 最新 `main`。
- 同時間只能有一個 active migration ledger 修改同一資產家族。
- Agent 必須以 Drive File ID 操作，不以同名檔案猜測。
- Agent 不得建立同名替代檔來模擬 move。
- 搬移、改名、核准或歸檔後，必須在同一任務更新 GitHub record。
- 新聊天收到「繼續整理 Drive」時，先讀取 active migration ledger 與 latest drift report。
- 無法確認操作結果時標記 blocked，不得猜測完成。

---

## 14. 第二階段共用模式

Phase 2 每個資產領域使用相同基本結構：

```text
<Domain>/
├─ 10_Review/
└─ 20_Approved/
```

新素材入口：

```text
80_Inbox/<Domain>/<BatchId>/
```

舊版出口：

```text
90_Archive/<Domain>/
```

領域示例：

- `UI_Screens`
- `Logos_And_Icons`
- `Backgrounds`
- `Audio`
- `Video`
- `Testing_Evidence`
- `Licensing_And_Content_Review`
- `Store_Assets`

Release export 不取代 source master。

---

## 15. 安全與回復

- 本治理不執行永久刪除。
- 搬移以保留原 File ID 的 Drive move 為原則。
- 重新上傳只適用於檔案內容真的改變，且必須建立新版本與新 asset record。
- 任何 delete、清空 Trash、改變共用權限或無法回復的批次操作，都必須另行取得使用者確認。
- Migration 發生錯誤時，依 Ledger 的 `beforeFolderId` 回復。
- 回復後仍需執行 drift check，不得只移回檔案就宣稱復原完成。

---

## 16. 驗收條件

### Phase 1 規格與結構

- [ ] 所有目標 Folder ID 已登錄。
- [ ] Artwork、Component、Template、Composite 與 Reference 完全分離。
- [ ] Review、Approved 與 Archive 物理分離。
- [ ] `80_Inbox` 只作 intake，不直接核准。
- [ ] 每個 Approved asset 有唯一 asset ID、File ID 與 checksum。
- [ ] 每個資產家族最多一個 current Approved。
- [ ] 舊版移入 Archive，未永久刪除。
- [ ] File ID 在搬移前後不變。
- [ ] GitHub Registry、Manifest、Folder Registry 與 Drive 一致。
- [ ] latest drift report 沒有 Blocking finding。

### Phase 2 啟動 Gate

- [ ] Phase 1 所有 migration ledger 已 completed 或明確 blocked 且不影響正式資產。
- [ ] 成語圖卡示範區連續兩次 drift check 無 Blocking finding。
- [ ] 新聊天能依 GitHub 狀態接續 Drive 整理。
- [ ] 未核准素材無法進 PWA、卡池、商店或 Release。

---

## 17. 明確不做

本規格與第一份 Implementation Plan 不包含：

- 永久刪除任何 Drive 檔案。
- 修改 Drive 共用權限。
- 重新繪製、重產或核准圖卡。
- 修改圖卡 renderer production code。
- 修改收藏、進度或主玩法 Schema。
- 將所有舊素材一次搬完。
- 以聊天紀錄取代 GitHub Registry。

---

## 18. 後續文件

使用者核准本書面規格後，建立：

```text
docs/superpowers/plans/2026-08-06-drive-asset-governance.md
```

Implementation Plan 必須分開處理：

1. Registry 與 Schema。
2. Read-only inventory／drift scanner。
3. Drive 目標資料夾建立。
4. Batch 0 只讀盤點。
5. 小批次搬移與 post-move verification。
6. Phase 1 驗收。
7. Phase 2 擴展計畫。

不得在沒有 inventory、ledger 與 rollback path 的情況下直接搬移現有素材。
