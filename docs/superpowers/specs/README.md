# CICG 規格索引與 Agent 必讀入口

本目錄是 Chinese-Idiom-Chain-Game 的正式設計規格入口。所有 Agent 開始工作前必須先讀取根目錄 `AGENTS.md`，再依任務類型讀取本索引；聊天紀錄、單張圖片、舊 Prompt 或 Drive 檔名不能取代 GitHub 規格。

## 真實狀態優先序

```text
GitHub main
→ GitHub Actions
→ Repository 規格與計畫
→ Drive 已核准素材
→ 聊天紀錄
```

---

## 成語圖卡必讀順序

```text
0. 2026-08-06-idiom-card-generation-skill-design.md
1. 2026-08-06-idiom-card-rarity-standard-design.md
2. 2026-08-06-idiom-card-review-governance-design.md
3. 2026-08-06-idiom-card-collection-design.md
4. 2026-08-06-idiom-card-collection-data-integrity-amendment.md
5. 2026-08-06-card-collection-core-v1-design.md
6. 2026-08-08-card-reward-and-upgrade-system-design.md
7. 2026-08-08-project-wide-four-digit-card-numbering-design.md
8. 2026-08-06-card-template-v2.1-layout-amendment.md
9. 2026-08-06-card-template-v2.6-dimension-and-pronunciation-amendment.md
10. 2026-08-06-card-template-v2.7-ssr-badge-amendment.md
11. 2026-08-06-card-rarity-frame-system-amendment.md
12. 2026-08-06-idiom-card-modularization-design.md
13. 2026-08-06-drive-asset-governance-design.md
14. 個別圖卡企劃、Prompt、Implementation Plan 與素材證據
```

跨聊天產圖、審核、上傳或批次接續時，另須先使用：

```text
.agents/skills/generating-cicg-idiom-cards/SKILL.md
docs/card-prompts/state/current-batch.json
data/cards/card-number-registry.json
```

## 規格用途

| 規格 | 正式用途 |
|---|---|
| `idiom-card-generation-skill-design` | Repository-local 產圖技能與跨聊天批次狀態 |
| `idiom-card-rarity-standard-design` | N／R／SR／SSR／UR 與正面意義判定 |
| `idiom-card-review-governance-design` | 內容、視覺、權利、發布與版本審核 |
| `idiom-card-collection-design` | 收藏頁與歷史十關贈卡設計背景 |
| `idiom-card-collection-data-integrity-amendment` | 注音、拼音覆寫關係與先保存後揭示 |
| `card-collection-core-v1-design` | 歷史 Grant、Inventory 與 Version 1 IndexedDB 基礎 |
| `card-reward-and-upgrade-system-design` | 每關贈卡、10／100 關保底、隱藏積分、Version 2 migration 與 10：1 升級 |
| `project-wide-four-digit-card-numbering-design` | N／R／SR／SSR／UR 全專案四位數永久卡號 |
| `card-template-v2.6-dimension-and-pronunciation-amendment` | `1024 × 2000`、1200px 主圖與發音資料 |
| `card-template-v2.7-ssr-badge-amendment` | SSR 傳奇級虹彩金龍徽章 |
| `card-rarity-frame-system-amendment` | N 深翡翠、R 霜藍鋼銀、SR 皇家紫晶、SSR v2.8 虹彩霓虹外框 |
| `idiom-card-modularization-design` | artwork、component、data、render plan 與 PNG 輸出 |
| `drive-asset-governance-design` | Drive 資產分層、生命週期、Registry、Migration Ledger 與漂移 Gate |

## 規範優先序

```text
GitHub main 與最新 Approved 規格
→ 每關贈卡、隱藏積分與重複卡升級系統
→ 全專案四位數卡號 Registry
→ 稀有度標準
→ 審核治理
→ 收藏資料完整性增補
→ 收藏資料核心 v1（歷史相容）
→ v2.7 SSR 徽章
→ 四階稀有度外框系統
→ v2.6 尺寸與發音
→ 元件化架構
→ Drive 素材治理
→ v2.1 歷史版面
→ Repository-local skill 與批次狀態
→ 個別卡片企劃與 Prompt
```

## 收藏獎勵與升級永久 Gate

- 每個不同主線關卡首次完成建立固定 per-level `rewardId`；重玩、升星、自由接龍、打地鼠與陷阱不得再發卡。
- 一般關只從該關出現過的成語抽卡。
- 跨章全域序號每 10 關最低 R；每 100 關最低 SR；第 100 關只發一張。
- 隱藏積分依 Card Catalog 難易度：E=1、D=2、C=3、B=4、A=5、S=6。
- `srTickets = min(hiddenRewardScore, 400)`；`ssrTickets = min(floor(hiddenRewardScore / 10), 100)`。
- 前十關合計 50 分時，SR 為 50／1000、SSR 為 5／1000。
- 隱藏積分、機率與 roll value 不得顯示於正式玩家 UI。
- 獎勵完全隨機、允許重複；先判定稀有度，再在該稀有度內依正式 `weight` 抽取。
- UR、Review、Legacy、NeedsReview、未核准稀有度、遠端素材與模板空框不得進正式卡池。
- 結果與機率快照必須先持久化，UI 才能播放揭示動畫。
- `cicg-card-collection` 升級至 Version 2，stores 為 `grants`、`inventory`、`metadata`、`upgrades`。
- Version 1 legacy milestone grants 必須保留，且不得與 per-level migration 重複發卡。
- 10 張可消耗 N→1 張 R、10 R→1 SR、10 SR→1 SSR；SSR 不升 UR。
- 每種卡至少保留 1 張，只能消耗 `ownedCount - 1`。
- 自動選材先依可消耗數量降冪，再依 `data/cards/card-number-registry.json` 的 canonical 四位數 `cardNumber` 升冪。
- 素材可跨成語與已完成章節混合；產物只來自已通關內容的下一稀有度，可抽到重複卡。
- 扣料、入庫、upgrade record 與 metadata 必須在同一 readwrite transaction 完成。
- 收藏保存失敗不得回滾已完成的闖關結果。

## 圖卡元件化永久 Gate

- 新 artwork 建議固定 `1024 × 1200 px`，只保存人物、背景、情境與道具。
- 卡框、稀有度、難易度、主題徽章、主標、注音、典故、箴言、來源與卡號由元件及資料層組合。
- 修改 difficulty、rarity badge、frame 或 card-number plaque 時，`artworkAssetId` 與 artwork SHA-256 必須不變。
- Canonical render surface 使用 `1024 × 2000` SVG 座標。
- Review／Approved PNG 是 derived artifact，不得成為唯一 canonical source。
- flat legacy 舊卡可顯示，但不得宣稱支援獨立元件替換。

## 圖卡視覺與內容永久 Gate

- 稀有度與難易度是兩套不同系統；SSR 不代表 A 或 S。
- N～SSR 依正面意義、精神價值、共鳴力與代表性判定。
- 正式圖卡固定 `1024 × 2000 px`，中央主圖區高度 `1200 px`。
- 注音由 Renderer 使用已驗證資料；圖片模型不得生成主標、注音或卡號。
- SSR 左上使用 v2.7 傳奇級虹彩金龍徽章。
- N 外框使用深翡翠古金；R 使用霜藍鋼銀；SR 使用皇家紫晶；SSR v2.8 使用完整多色虹彩霓虹框。
- 完整多色虹彩包框只允許 SSR；N／R／SR 必須維持各自單一主色層級。
- 稀有度外框不得改寫或自動重染右上難易度元件。
- 正式卡號唯一來源為 `data/cards/card-number-registry.json`，格式為 `{rarity}-{sequence:0000}`。
- 只有 Approved 圖卡可以進正式收藏、獎勵池或未來商店。
- 產製 Agent 不得自行把自己的輸出標記為最終 Approved。

## Drive 素材治理永久 Gate

- 固定頂層 `00`～`05`、`80_Inbox`、`90_Archive` 不重新命名。
- 成語圖卡採 type-first：Artwork、Component、Template、Composite 分類後，各自設 `10_Review` 與 `20_Approved`。
- 所有新素材先進 `80_Inbox/Idiom_Cards/<BatchId>`，不得直接進 Approved。
- 舊版、Rejected、Unverifiable 與 Legacy 移入 `90_Archive/Idiom_Cards`，不永久刪除。
- 同一 `assetType + identity` 最多只有一個 `currentApproved = true` 的 Approved master。
- Drive move 必須保留原 File ID；不得以同名重新上傳假裝搬移。
- 搬移前必須有 Asset Registry、Folder Registry、Migration Ledger 與 rollback path。
- 搬移後必須驗證 parent Folder ID、File ID、checksum、大小、MIME type 與 webViewLink。
- Published 只記錄在 GitHub metadata；不得為發布狀態複製第二份 source master。
- Blocking drift 未解決時，不得核准新 composite、打包進 PWA 或啟動下一批搬移。

目標結構摘要：

```text
80_Inbox/Idiom_Cards/<BatchId>/

02_UI_UX_And_Visuals/Idiom_Cards/
├─ 01_Artworks/{10_Review,20_Approved}
├─ 02_Components/<ComponentType>/{10_Review,20_Approved}
├─ 03_Templates/{10_Review,20_Approved}
├─ 04_Composites/{10_Review,20_Approved}
└─ 05_Reference_Only

90_Archive/Idiom_Cards/
```

完整結構、生命週期與搬移 Gate：

```text
docs/superpowers/specs/2026-08-06-drive-asset-governance-design.md
```

Drive governance canonical entry points：

```text
data/drive-assets/drive-folders.json
data/drive-assets/idiom-card-assets.json
data/drive-assets/migrations/
data/drive-assets/physical-audit-2026-08-07.json
```

- `drive-folders.json` 是 Folder ID 與 parent 關係的唯一 canonical mapping。
- `idiom-card-assets.json` 是 current Approved、Review、Quarantined 與其他資產狀態的唯一 machine-readable Registry。
- `migrations/` 下每一份 JSON Ledger 都必須由永久 CLI 自動發現及驗證。

核准四階外框 master：

```text
N：CICG_Component_RarityFrame_N_v1.0_Approved.png
R：CICG_Component_RarityFrame_R_v1.0_Approved.png
SR：CICG_Component_RarityFrame_SR_v1.0_Approved.png
SSR：CICG_Component_RarityFrame_SSR_v2.8_Approved.png
```

完整 Drive File ID、checksum、元件 ID 與唯一正式位置：

```text
docs/card-prompts/components/rarity-frame-registry-v1.md
data/drive-assets/idiom-card-assets.json
```

## 禁止事項

- 未讀規格就自行定義稀有度、卡池、產圖、組卡或 Drive 搬移流程。
- 把 Review、Rejected、Deprecated 或來源未校訂卡加入卡池。
- 把未授權聯名概念升級為 UR 正式卡。
- 顯示隱藏積分、SR／SSR 精確機率或 roll value。
- 重玩關卡再次發卡，或讓每章重置第 10／100 關保底。
- 把唯一持有卡作為升級素材，或允許 SSR 升 UR。
- 使用非 canonical 卡號作為自動選材排序依據。
- 先播放獎勵／升級動畫，再保存抽取、扣料與收藏結果。
- 在圖卡文件 PR 中順便修改主玩法或 `cicg-progress` schema。
- 沒有 Migration Ledger 就移動、改名、歸檔或重新上傳受管 Drive 素材。

新增或覆寫永久規則時，必須更新本索引與 `AGENTS.md`，並將規格、Implementation Plan 與交付報告分別放在：

```text
docs/superpowers/specs/
docs/superpowers/plans/
docs/superpowers/reports/
```