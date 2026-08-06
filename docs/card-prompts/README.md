# CICG 成語圖卡提示語與元件化素材庫

- 視覺規格：v2.7（SSR 徽章）／v2.6（尺寸與發音版面）
- 元件化架構：v1.0
- 圖片 master：Google Drive
- 提示語、資料、技能、狀態與資產索引：GitHub
- Render mode：`modular / flat-legacy`
- 典故狀態：`Verified / NeedsReview`
- 稀有度狀態：`Verified / NeedsReview`

## 新聊天／新 Agent 的正式入口

凡在本專案處理產圖、接續、修正、審核、組卡、匯出或上傳，必須先使用：

```text
.agents/skills/generating-cicg-idiom-cards/SKILL.md
```

並立即讀取：

```text
docs/card-prompts/state/current-batch.json
```

正式專案提示語：

```text
docs/card-prompts/PROJECT_PROMPT.md
```

簡短指令如「繼續產圖」、「下一批」、「修正上一批」、「審核圖卡」或「上傳素材」，必須依狀態檔接續，不得要求使用者重新貼完整規格。

---

## 每次產製前的使用順序

1. 同步 GitHub 最新 `main`。
2. 讀取 `AGENTS.md`。
3. 使用 Repository-local skill。
4. 讀取 `current-batch.json`。
5. 讀取 `references/required-specs.md`。
6. 讀取稀有度、審核、v2.6、v2.7 與元件化規格。
7. 讀取 `PROJECT_PROMPT.md` 與 `shared/card-master-prompt.md`。
8. 套用稀有度模板與單卡提示語。
9. 讀取 Manifest 與 Drive Approved master 證據。
10. 完成內容資料後先產 artwork，再由元件與 renderer 組成 composite。
11. 更新狀態檔；Drive、checksum、版本或發布狀態改變時同步更新 Manifest。

## 規範優先序

```text
GitHub 最新 main
→ 稀有度與審核治理
→ v2.7 SSR 徽章增補
→ v2.6 尺寸與發音版面增補
→ 元件化架構 v1.0
→ Repository-local skill 與 current-batch.json
→ PROJECT_PROMPT 與共用母提示語
→ 單卡 Prompt
→ Drive Approved master、Manifest 與審核證據
→ 舊圖片與聊天紀錄
```

---

## 元件化核心流程

新卡預設：

```text
renderMode = modular
```

舊整張 PNG：

```text
renderMode = flat-legacy
```

新卡正式流程：

```text
Structured Card Data
→ illustration-only Artwork
→ Approved Components
→ Render Plan
→ SVG／PWA View
→ Review／Approved Composite PNG
```

### Artwork

```text
尺寸：1024 × 1200 px
內容：人物、背景、情境、道具、光影
不得包含：卡框、徽章、標籤、主標、注音、拼音、副標、典故、箴言、來源
```

### Composite

```text
尺寸：1024 × 2000 px
Header：360 px
Artwork：1200 px
Footer：440 px
```

Composite 是 derived output，不能取代 artwork、component 與 structured data canonical source。

### 必須獨立的元件

```text
rarity-badge
difficulty-badge
theme-badge
title-block
pronunciation-block
subtitle-block
allusion-panel
motto-plaque
source-line
frame-skin
effect-overlay
```

修改難易度、徽章、文字或牌匾時，artwork asset ID 與 SHA-256 必須保持不變。

---

## 目錄

```text
.agents/skills/generating-cicg-idiom-cards/
├─ SKILL.md
└─ references/
   ├─ required-specs.md
   └─ review-checklist.md

docs/card-prompts/
├─ PROJECT_PROMPT.md
├─ README.md
├─ manifest.md
├─ state/
│  ├─ README.md
│  └─ current-batch.json
├─ shared/
├─ templates/
└─ idioms/
```

後續 production implementation 預計新增：

```text
src/cards/
src/app/cards/
data/cards/
public/cards/artworks/
public/cards/components/
```

---

## 固定版面 Gate

- Composite 固定 `1024 × 2000 px`。
- Header／Artwork／Footer 固定 `360 / 1200 / 440 px`。
- 四字主標下方依序為注音橫列與帶聲調漢語拼音橫列。
- 禁止數字聲調。
- 右上只顯示難易度。
- 左下保留完整主題徽章。
- 下方只使用「典故」。
- 右下使用低高度窄版直式箴言牌匾。
- 最下方為單行典故來源。
- SSR 使用 v2.7 傳奇級虹彩金龍徽章；N／R／SR 不得使用。
- 稀有度依正面意義與精神價值，不得依畫面華麗度決定。
- UR 只限正式授權 IP 聯名。

---

## Drive 素材分工

```text
80_Inbox/Idiom_Cards/Artworks
80_Inbox/Idiom_Cards/Components
80_Inbox/Idiom_Cards/Composites
02_UI_UX_And_Visuals/Idiom_Cards/Approved/Artworks
02_UI_UX_And_Visuals/Idiom_Cards/Approved/Components
02_UI_UX_And_Visuals/Idiom_Cards/Approved/Composites
90_Archive/Idiom_Cards
```

- Artwork、component、composite 必須分別保存原始檔。
- 不得以 ZIP 取代原圖。
- 未核准 master 不得進入正式 PWA runtime assets。
- 產製 Agent 不得自行最終核准。

目前核准 SSR 標準模板：

```text
CICG_CardTemplate_Rarity_SSR_v2.7_Approved.png
Drive File ID：1NoNZ2muThkzA7k22TF5W5foAD1gq8VpV
尺寸：1024 × 2000 px
SHA-256：cf8f8cb9c6f3cac5f4a115bcbcf53fb57162842dcf34e48173b84f902dcbf785
```