# Drive Phase 2 全專案唯讀基線盤點

日期：2026-08-07  
狀態：**Batch 0 Read-only Inventory Complete**  
來源 commit：`efcc5a5ad2d119eac4c87f1a56ae7747f4a1b8f7`

## 1. 執行範圍

本批次只讀取 Google Drive metadata 與直接子項，不建立、搬移、重新命名、重新上傳、刪除或核准任何素材。

機器可讀快照：

```text
data/drive-assets/project-inventory-2026-08-07.json
```

對應 Schema：

```text
data/drive-assets/project-inventory.schema.json
```

成語圖卡深層樹已由 Phase 1 Registry 與 physical audit 管理，本次只記錄三個正式入口，不複製第二份深層清冊：

```text
data/drive-assets/drive-folders.json
data/drive-assets/idiom-card-assets.json
data/drive-assets/physical-audit-2026-08-07.json
```

## 2. 頂層盤點

| Drive 根目錄 | 直接子項 | 狀態 |
|---|---:|---|
| `00_Project_Management` | 1 | 有 `Asset_Control_Center` |
| `01_Design_And_Specs` | 2 | 兩份既有 Google Docs |
| `02_UI_UX_And_Visuals` | 2 | `Idiom_Cards`、`Game_Backgrounds` |
| `03_Game_Content_And_Data` | 0 | 空白，維持 lazy activation |
| `04_Testing_And_Evidence` | 0 | 空白，維持 lazy activation |
| `05_Releases_And_Store_Assets` | 0 | 空白，維持 lazy activation |
| `80_Inbox` | 1 | Phase 1 `Idiom_Cards` 入口 |
| `90_Archive` | 1 | Phase 1 `Idiom_Cards` 入口 |

八個固定根目錄全部存在且可讀，沒有部分回傳或不可讀警告。

## 3. 資源統計

| 項目 | 數量 |
|---|---:|
| 已記錄 resources | 26 |
| Folder resources | 15 |
| File resources | 11 |
| Review 背景圖 | 7 |
| Approved 背景圖 | 0 |
| Batch 0 尚未登錄的 Phase 2 Drive resources | 15 |
| Empty domain roots | 3 |

檔案總大小：

```text
21,596,019 bytes
```

其中：

- 7 張背景圖：`16,550,798 bytes`
- Control Center Sheet、兩份設計文件與背景提示語：`5,045,221 bytes`

## 4. Phase 2 已知資源

### Asset Control Center

```text
Folder ID：16p7x1-uISZShEkppN68Fwqn-epm44Uok
Sheet ID：1JwdPPz4cjx94MYE5qXJt2GaE67e9HUlzXPY4OPb6S94
```

目前是 human-facing derived dashboard；正式 Registry 狀態仍以 GitHub 為準。

### Game Backgrounds

```text
Game_Backgrounds：1v-xm8k4ufmr5J4bxCldce7YYU8SZuL1T
10_Review：1i1OZ7qWPhu-YY2bbPUGXb5KHaOLh3NAI
20_Approved：1VX-nfxg0JUiuw-oBJkTVtLwNJR3auB3_
```

`10_Review` 有 7 張 PNG：

1. Home
2. Campaign Map
3. Puzzle
4. Level Complete
5. Classic Chain
6. Whack-a-Mole
7. Media Center

全部保持 `Review`；`20_Approved` 為空。本批次沒有進行視覺核准。

### Design and Specs

`01_Design_And_Specs` 目前有兩份 Google Docs。檔名中的 `Approved` 不構成核准證據，因此本次只標示為 reference candidate，等待後續 Project Asset Registry 分類。

## 5. 漂移與待處理項目

### Drive-only／未登錄資源

Batch 0 找到 15 個尚未納入 Phase 2 Folder／Asset Registry 的 Drive resources，主要包括：

- Asset Control Center folder 與 Sheet
- Game Backgrounds folder、Review／Approved folders
- 背景提示語 Google Doc
- 7 張 Review 背景圖
- 兩份 Design／Spec Google Docs

這些不是 blocking corruption，而是 Task 6 的正式納管輸入。

### GitHub-only 候選

PR #36 仍有 13 張 PNG，只存在於舊 PR branch，且與過時的智慧跳格程式／文件混在同一 PR。本批次沒有把它們視為 Drive resources，也沒有合併 PR #36。

### Candidate conflict

PR #36 的 `campaign_map_bg.png` 與 Drive Review 的 Campaign Map 背景具有相同用途，但尚未完成 checksum 與視覺比較。兩者均不得自動升格為 current Approved master。

PR #36 的 `card_frame_ssr.png` 亦必須與既有 SSR v2.8 Approved master 做 exact checksum 比對，禁止建立第二個 current master。

## 6. Batch 0 Gate 結果

```text
Fixed roots readable = PASS
Inventory complete = true
Partial folder listings = 0
Drive mutations = 0
Background visual approvals = 0
PR #36 merge = blocked
Ready for Task 6 Registry onboarding = true
```

下一批只納管現有 Asset Control Center、Game Background folders 與 7 張 Review 背景；不移動檔案、不批准背景，也不建立空白領域的深層資料夾。
