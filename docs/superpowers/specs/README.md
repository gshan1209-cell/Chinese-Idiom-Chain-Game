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

### 跨聊天產製入口

凡涉及產生、接續、修正、審核、上傳、元件化或輸出成語圖卡，必須先使用：

```text
.agents/skills/generating-cicg-idiom-cards/SKILL.md
```

並讀取：

```text
docs/card-prompts/state/current-batch.json
```

簡短指令如「繼續產圖」、「下一批」、「修正上一批」、「審核圖卡」或「上傳素材」，必須由狀態檔接續，不得要求使用者重新貼完整規格。

### 必讀順序

```text
0. 2026-08-06-idiom-card-generation-skill-design.md
1. 2026-08-06-idiom-card-rarity-standard-design.md
2. 2026-08-06-idiom-card-review-governance-design.md
3. 2026-08-06-idiom-card-collection-design.md
4. 2026-08-06-idiom-card-collection-data-integrity-amendment.md
5. 2026-08-06-card-template-v2.1-layout-amendment.md
6. 2026-08-06-card-template-v2.6-dimension-and-pronunciation-amendment.md
7. 2026-08-06-card-template-v2.7-ssr-badge-amendment.md
8. 2026-08-06-idiom-card-modularization-design.md
9. 個別圖卡企劃、Prompt、Implementation Plan 與素材證據
```

### 規格用途

| 規格 | 正式用途 |
|---|---|
| `2026-08-06-idiom-card-generation-skill-design.md` | 定義 Repository-local 產圖技能、跨聊天批次狀態與接續契約 |
| `2026-08-06-idiom-card-rarity-standard-design.md` | 定義 N／R／SR／SSR／UR、正面意義判定、UR 聯名授權 Gate |
| `2026-08-06-idiom-card-review-governance-design.md` | 定義預檢、內容、視覺、權利、發布與版本審核流程 |
| `2026-08-06-idiom-card-collection-design.md` | 定義每十關免費贈卡、收藏頁、資料模型與未來固定商品購買 |
| `2026-08-06-idiom-card-collection-data-integrity-amendment.md` | 定義逐字注音與先保存、後揭示的冪等獎勵交易；其中禁止拼音顯示的舊條款由 v2.6 覆寫 |
| `2026-08-06-card-template-v2.1-layout-amendment.md` | 歷史版型基礎：典故區、主題徽章與低高度直式箴言 |
| `2026-08-06-card-template-v2.6-dimension-and-pronunciation-amendment.md` | 鎖定 `1024 × 2000`、中央主圖 `1200 px`、注音橫列與帶聲調漢語拼音橫列 |
| `2026-08-06-card-template-v2.7-ssr-badge-amendment.md` | 鎖定 SSR 傳奇級虹彩金龍徽章，使 SSR 與 SR 在輪廓、材質、星雲核心及主寶石上明顯區隔 |
| `2026-08-06-idiom-card-modularization-design.md` | 定義 artwork、template、component、data、render plan、PNG 輸出與 flat-legacy 遷移架構 |

### 規範優先序

發生衝突時：

```text
GitHub main 與最新 Approved 規格
→ 稀有度標準
→ 審核治理
→ 收藏資料完整性增補
→ 收藏與里程碑贈卡
→ v2.7 SSR 徽章增補
→ v2.6 尺寸與發音版面增補
→ 元件化架構
→ v2.1 歷史版面增補
→ Repository-local skill 與批次狀態
→ 個別卡片企劃與 Prompt
```

技能與 `current-batch.json` 用於接續工作，不能取代 Drive File ID、Manifest、來源、授權或最終核准證據。

目前明確覆寫與新增：

- 收藏規格第 3.1 節的舊句「稀有度描述卡牌收藏價值與視覺規格」已被稀有度標準取代。
- 正確規則：N～SSR 主要依成語正面意義、勵志程度、精神象徵、共鳴力與代表性判定。
- UR 是正式授權 IP 聯名的例外等級，不得進入一般里程碑卡池。
- v2.6 正式圖卡尺寸固定為 `1024 × 2000 px`，不再使用 `2:3` 或 `1024 × 1536`。
- v2.6 上方資訊區為 `360 px`、中央主圖區為 `1200 px`、下方內容區為 `440 px`。
- v2.6 主標下方第一列為逐字對齊注音，第二列為小寫、帶聲調符號的漢語拼音。
- v2.7 只覆寫 SSR 左上徽章：使用傳奇級虹彩金龍、立體金色 SSR、紫藍洋紅星雲核心與紫色菱形主寶石。
- SSR v2.7 必須一眼明顯高於 SR，不能只把 SR 徽章文字改成 SSR 或單純提高亮度。
- 新建圖卡預設使用 `modular`；舊整張 PNG 使用 `flat-legacy`。
- canonical artwork 只保存人物、背景、情境與道具，不得烙入卡框、標籤或正式文字欄位。
- 難易度、稀有度、主題徽章、主標、注音、拼音、典故、箴言與來源必須由元件及資料層組合。
- Review／Approved PNG 是可重新輸出的 derived artifact，不得成為唯一來源。
- 里程碑圖卡必須先固定並持久化 rewardId、resolvedCardId 與 acquisitionId，確認成功後才播放揭示動畫。

---

## 圖卡元件化永久 Gate

- 新 artwork 建議固定為 `1024 × 1200 px`，對應中央主圖區。
- artwork 不得包含卡框、稀有度、難易度、成語主標、注音、拼音、副標、典故、箴言或來源。
- `rarity-badge`、`difficulty-badge`、`theme-badge`、`pronunciation-block`、`motto-plaque` 與 `source-line` 必須可獨立替換。
- 修改 difficulty 或 rarity badge 時，`artworkAssetId` 與 artwork SHA-256 必須不變。
- Canonical render surface 使用 `1024 × 2000` SVG 座標，React 與 PNG 輸出共用同一 render plan。
- Drive 保存 artwork／component／composite master；GitHub 保存資料、註冊表、版本、Drive File ID、SHA-256 與 runtime derivative。
- 未核准 Drive master 不得進入正式 PWA runtime assets。
- Renderer 尚未完成時，可以先產 illustration-only artwork；不得因暫時缺少 renderer 而重新把 UI 烙進 canonical artwork。
- flat legacy 舊卡可繼續顯示，但不宣稱支援獨立元件替換。

---

## 圖卡既有永久 Gate 摘要

- 稀有度與難易度是兩套不同系統。
- `SSR` 不代表 `A` 或 `S`。
- `SSR` 必須有正面語義與精神價值理由，不能只因畫面華麗。
- `UR` 只保留給取得正式授權的外部 IP 聯名。
- 未授權的角色、名稱、Logo、服裝辨識元素與官方視覺不得進入正式素材。
- 圖卡固定為 `1024 × 2000 px`，且情境插圖必須有人物。
- 中央主圖區固定 `y = 360–1559`，高度 `1200 px`。
- 四字主標下方必須依序顯示注音橫列與帶聲調漢語拼音橫列。
- SSR 左上必須使用 v2.7 傳奇級虹彩金龍徽章，並與 SR 在輪廓、材質、星雲核心及紫色主寶石上明顯區隔。
- SSR 虹彩只限左上徽章，不得污染外框、難易度框、主圖、典故區、主題徽章或箴言牌匾。
- 典故來源須完成校訂，並以卡面最下方小字單行呈現。
- 右下箴言使用貼合文字的低高度直式牌匾，不得留下大面積空白。
- 只有 `Approved` 圖卡可以進入正式收藏頁、免費卡池或未來商店。
- 產製 Agent 不得自行將自己的圖片標記為最終 Approved。
- 圖片、審核、上傳或批次狀態改變後，必須更新 `current-batch.json`。
- 里程碑獎勵必須先保存結果，再播放圖卡揭示動畫。
- 未來付費取得預設採指定圖卡或固定內容卡包，不導入付費隨機抽卡。

---

## 素材位置

Google Drive 專案：

```text
04_Products/Chinese-Idiom-Chain-Game
```

圖卡素材治理：

```text
80_Inbox/Idiom_Cards/Artworks
80_Inbox/Idiom_Cards/Components
80_Inbox/Idiom_Cards/Composites
02_UI_UX_And_Visuals/Idiom_Cards/Approved/Artworks
02_UI_UX_And_Visuals/Idiom_Cards/Approved/Components
02_UI_UX_And_Visuals/Idiom_Cards/Approved/Composites
90_Archive/Idiom_Cards
```

核准 v2.7 SSR 標準模板：

```text
CICG_CardTemplate_Rarity_SSR_v2.7_Approved.png
Drive File ID：1NoNZ2muThkzA7k22TF5W5foAD1gq8VpV
尺寸：1024 × 2000 px
上方資訊區：360 px
中央主圖區：1200 px
下方內容區：440 px
檔案大小：3,427,910 bytes
SHA-256：cf8f8cb9c6f3cac5f4a115bcbcf53fb57162842dcf34e48173b84f902dcbf785
```

v2.6 SSR 保留為歷史核准模板；新產 SSR 圖卡以 v2.7 為準。N／R／SR 不得套用 v2.7 SSR 傳奇金龍徽章。

GitHub 保存規格、技能、批次狀態、資料定義、審核紀錄與素材參照；Drive 保存圖片與大型發布素材。

---

## Agent 禁止事項

- 未讀規格與技能就自行定義稀有度、卡池、產圖或組卡流程。
- 只依聊天紀錄判定卡片 Approved 或上一批進度。
- 狀態檔與 Drive／Manifest 不一致時猜測完成。
- 把稀有度與難易度混為同一欄位。
- 自行把未授權聯名概念升級為 UR 正式卡。
- 省略主標下方的注音橫列或漢語拼音橫列。
- 使用數字聲調或省略正式拼音聲調符號。
- 將正式圖卡輸出為 `1024 × 1536` 或 `2:3`。
- 新產 SSR 圖卡沿用 SR 徽章輪廓，或只以亮度／飽和度差異冒充 v2.7。
- 將 SSR 虹彩色系套用到整張卡面。
- 把卡框、標籤與正式文字欄位永久烙入 modular artwork。
- 修改難易度或徽章時重畫或偷偷替換 artwork。
- 把 Review／Approved composite PNG 當成唯一 canonical source。
- 先播放圖卡獎勵動畫，再保存抽取與收藏結果。
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