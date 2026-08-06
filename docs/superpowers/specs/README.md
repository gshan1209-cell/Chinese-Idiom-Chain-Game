# CICG 規格索引與 Agent 必讀入口

本目錄是 Chinese-Idiom-Chain-Game 的正式設計規格入口。

所有 Agent 開始工作前，必須先讀取根目錄 `AGENTS.md`，再依任務類型讀取本索引列出的規格。聊天紀錄、單張圖片、舊 Prompt 或 Drive 檔名不能取代 GitHub 規格。

## 真實狀態優先序

```text
GitHub main
→ GitHub Actions
→ Repository 規格與計畫
→ Drive 已核准素材
→ 聊天紀錄
```

若目前工作位於尚未合併的 Approved 規格 PR，該 PR 分支中的最新規格可作為該功能實作依據，但實作前仍須同步最新 `main` 並確認沒有衝突。

---

## 成語圖卡系統

### 必讀順序

```text
1. 2026-08-06-idiom-card-rarity-standard-design.md
2. 2026-08-06-idiom-card-review-governance-design.md
3. 2026-08-06-idiom-card-collection-design.md
4. 個別圖卡企劃、Prompt、Implementation Plan 與素材證據
```

### 規格用途

| 規格 | 正式用途 |
|---|---|
| `2026-08-06-idiom-card-rarity-standard-design.md` | 定義 N／R／SR／SSR／UR、正面意義判定、UR 聯名授權 Gate |
| `2026-08-06-idiom-card-review-governance-design.md` | 定義預檢、內容、視覺、權利、發布與版本審核流程 |
| `2026-08-06-idiom-card-collection-design.md` | 定義每十關免費贈卡、收藏頁、資料模型與未來固定商品購買 |

### 規範優先序

發生衝突時：

```text
稀有度標準
→ 審核治理
→ 收藏與里程碑贈卡
→ 個別卡片企劃與 Prompt
```

目前明確覆寫：

- 收藏規格第 3.1 節的舊句「稀有度描述卡牌收藏價值與視覺規格」已被稀有度標準取代。
- 正確規則：N～SSR 主要依成語正面意義、勵志程度、精神象徵、共鳴力與代表性判定。
- UR 是正式授權 IP 聯名的例外等級，不得進入一般里程碑卡池。

---

## 圖卡永久 Gate 摘要

- 稀有度與難易度是兩套不同系統。
- `SSR` 不代表 `A` 或 `S`。
- `SSR` 必須有正面語義與精神價值理由，不能只因畫面華麗。
- `UR` 只保留給取得正式授權的外部 IP 聯名。
- 未授權的角色、名稱、Logo、服裝辨識元素與官方視覺不得進入正式素材。
- 圖卡必須為直式 `2:3`，且情境插圖必須有人物。
- 典故來源須完成校訂，並以卡面最下方小字單行呈現。
- 只有 `Approved` 圖卡可以進入正式收藏頁、免費卡池或未來商店。
- 未來付費取得預設採指定圖卡或固定內容卡包，不導入付費隨機抽卡。

---

## 素材位置

Google Drive 專案：

```text
04_Products/Chinese-Idiom-Chain-Game
```

圖卡素材治理：

```text
80_Inbox/Idiom_Cards
02_UI_UX_And_Visuals/Idiom_Cards/Approved
80_Inbox/Idiom_Cards/Changes_Requested
90_Archive/Idiom_Cards
```

核准標準模板：

```text
CICG_CardTemplate_IdiomCard_v1.0_Approved.png
```

GitHub 保存規格、資料定義、審核紀錄與素材參照；Drive 保存圖片與大型發布素材。

---

## Agent 禁止事項

- 未讀規格就自行定義稀有度或卡池。
- 只依聊天紀錄判定卡片 Approved。
- 把稀有度與難易度混為同一欄位。
- 自行把未授權聯名概念升級為 UR 正式卡。
- 直接覆蓋已發布圖卡。
- 將 Review、Rejected、Deprecated 或來源未校訂卡加入卡池。
- 在圖卡文件 PR 中順便修改主玩法、進度 Schema 或 production code。

---

## 規格維護規則

新增圖卡制度時：

1. 先確認是否應增補既有規格，避免建立互相重疊的標準。
2. 若新增永久規則，更新本索引與 `AGENTS.md`。
3. 若規則覆寫舊規格，必須寫明被覆寫的文件與章節。
4. 規格與 Implementation Plan 分開存放：

```text
docs/superpowers/specs/
docs/superpowers/plans/
```

5. 規格通過後，後續實作必須依 TDD：先 RED、再最小 GREEN、最後完整回歸。