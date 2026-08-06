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
6. 2026-08-06-card-template-v2.1-layout-amendment.md
7. 2026-08-06-card-template-v2.6-dimension-and-pronunciation-amendment.md
8. 2026-08-06-card-template-v2.7-ssr-badge-amendment.md
9. 2026-08-06-idiom-card-modularization-design.md
10. 個別圖卡企劃、Prompt、Implementation Plan 與素材證據
```

跨聊天產圖、審核、上傳或批次接續時，另須先使用：

```text
.agents/skills/generating-cicg-idiom-cards/SKILL.md
docs/card-prompts/state/current-batch.json
```

## 規格用途

| 規格 | 正式用途 |
|---|---|
| `idiom-card-generation-skill-design` | Repository-local 產圖技能與跨聊天批次狀態 |
| `idiom-card-rarity-standard-design` | N／R／SR／SSR／UR 與正面意義判定 |
| `idiom-card-review-governance-design` | 內容、視覺、權利、發布與版本審核 |
| `idiom-card-collection-design` | 每十關贈卡、收藏頁與未來固定商品購買 |
| `idiom-card-collection-data-integrity-amendment` | 注音、拼音覆寫關係與先保存後揭示 |
| `card-collection-core-v1-design` | Grant、補發、決定性解析、Inventory 與獨立 IndexedDB |
| `card-template-v2.6-dimension-and-pronunciation-amendment` | `1024 × 2000`、1200px 主圖、注音與拼音 |
| `card-template-v2.7-ssr-badge-amendment` | SSR 傳奇級虹彩金龍徽章 |
| `idiom-card-modularization-design` | artwork、component、data、render plan 與 PNG 輸出 |

## 規範優先序

```text
GitHub main 與最新 Approved 規格
→ 稀有度標準
→ 審核治理
→ 收藏資料完整性增補
→ 收藏資料核心 v1
→ 收藏與里程碑贈卡
→ v2.7 SSR 徽章
→ v2.6 尺寸與發音
→ 元件化架構
→ v2.1 歷史版面
→ Repository-local skill 與批次狀態
→ 個別卡片企劃與 Prompt
```

## 收藏資料核心永久 Gate

- 每完成 10 個不同主線關卡建立固定 `rewardId`。
- 重玩、升星、自由接龍、打地鼠與陷阱模式不得增加里程碑數。
- `rewardId` 與 `acquisitionId` 必須冪等。
- 獎勵結果必須先持久化，UI 才能宣稱玩家已取得圖卡。
- Grant 與 Inventory 必須在 `cicg-card-collection` version 1 的同一 readwrite transaction 保存。
- 不得修改 `cicg-progress` version 1 或加入卡牌欄位。
- 正式卡必須同時有四字逐字注音與四字小寫帶聲調漢語拼音。
- `pinyin` 是唯一允許的正式拉丁發音欄位；數字聲調與其他未知羅馬拼音欄位拒絕。
- Review、Legacy、NeedsReview、未核准稀有度、遠端素材與模板空框不得進正式卡池。
- UR 只保留給具可稽核正式授權的 IP 聯名，且不得進一般十關卡池。
- 空白卡池保持 pending，不偽造圖卡，也不要求先載入字典。
- 已解析 Grant 若缺少 Inventory，依既有 `resolvedCardId` 與 `acquisitionId` 修復，不重新抽卡。
- 收藏保存失敗不得回滾已完成的闖關結果。

## 圖卡元件化永久 Gate

- 新 artwork 建議固定 `1024 × 1200 px`，只保存人物、背景、情境與道具。
- 卡框、稀有度、難易度、主題徽章、主標、注音、拼音、典故、箴言與來源由元件及資料層組合。
- 修改 difficulty 或 rarity badge 時，`artworkAssetId` 與 artwork SHA-256 必須不變。
- Canonical render surface 使用 `1024 × 2000` SVG 座標。
- Review／Approved PNG 是 derived artifact，不得成為唯一 canonical source。
- flat legacy 舊卡可顯示，但不得宣稱支援獨立元件替換。

## 圖卡視覺與內容永久 Gate

- 稀有度與難易度是兩套不同系統；SSR 不代表 A 或 S。
- N～SSR 依正面意義、精神價值、共鳴力與代表性判定。
- 正式圖卡固定 `1024 × 2000 px`，中央主圖區高度 `1200 px`。
- 主標下方依序顯示注音橫列與帶聲調漢語拼音橫列。
- SSR 左上使用 v2.7 傳奇級虹彩金龍徽章，且不得把虹彩污染到整張卡面。
- 典故來源必須校訂，箴言使用低高度直式牌匾。
- 只有 Approved 圖卡可以進正式收藏頁、免費卡池或未來商店。
- 產製 Agent 不得自行把自己的輸出標記為最終 Approved。

## 素材治理

```text
80_Inbox/Idiom_Cards/Artworks
80_Inbox/Idiom_Cards/Components
80_Inbox/Idiom_Cards/Composites
02_UI_UX_And_Visuals/Idiom_Cards/Approved/Artworks
02_UI_UX_And_Visuals/Idiom_Cards/Approved/Components
02_UI_UX_And_Visuals/Idiom_Cards/Approved/Composites
90_Archive/Idiom_Cards
```

核准 v2.7 SSR 模板：

```text
CICG_CardTemplate_Rarity_SSR_v2.7_Approved.png
Drive File ID：1NoNZ2muThkzA7k22TF5W5foAD1gq8VpV
SHA-256：cf8f8cb9c6f3cac5f4a115bcbcf53fb57162842dcf34e48173b84f902dcbf785
```

## 禁止事項

- 未讀規格就自行定義稀有度、卡池、產圖或組卡流程。
- 把 Review、Rejected、Deprecated 或來源未校訂卡加入卡池。
- 把未授權聯名概念升級為 UR 正式卡。
- 使用數字聲調、缺少注音／拼音，或輸出舊尺寸。
- 把正式 UI 永久烙入 modular artwork。
- 先播放獎勵動畫，再保存抽取與收藏結果。
- 在圖卡文件 PR 中順便修改主玩法或進度 schema。

新增或覆寫永久規則時，必須更新本索引與 `AGENTS.md`，並將規格、Implementation Plan 與交付報告分別放在：

```text
docs/superpowers/specs/
docs/superpowers/plans/
docs/superpowers/reports/
```
