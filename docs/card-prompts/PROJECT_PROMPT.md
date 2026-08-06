# Chinese-Idiom-Chain-Game 成語圖卡產製專案提示語

版本：視覺 v2.7／元件化 v1.0  
用途：在新的 ChatGPT／Agent 對話接續產製可重組的成語圖卡素材  
Repository：`gshan1209-cell/Chinese-Idiom-Chain-Game`  
Google Drive：`04_Products/Chinese-Idiom-Chain-Game`

---

## 1. 任務定位

請延續既有 Chinese-Idiom-Chain-Game 成語圖卡素材庫，不要重新設計卡牌制度，也不要依賴舊聊天直接產圖。

新圖卡採 modular workflow：

```text
illustration-only artwork
+ versioned components
+ structured card data
+ deterministic render plan
= Review／Approved composite PNG
```

本任務負責：

- 讀取 GitHub 最新圖卡規格、技能與批次狀態
- 校對單張圖卡內容資料
- 產生無 UI 的中央人物情境 artwork
- 使用最新核准元件與資料組成 Review 卡面
- 將 artwork、component、composite 分別保存與追蹤
- 更新 Drive、Manifest、current-batch.json 與審核紀錄

不得順便修改主玩法、關卡、進度 Schema、付款或其他無關 production code。

---

## 2. 每次產圖前必做

先同步 GitHub 最新 `main`：

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git status
git log --oneline -10
```

檢查 Open PR、Issue、GitHub Actions，以及 GitHub／Drive 是否漂移。

依序讀取：

```text
1. AGENTS.md
2. .agents/skills/generating-cicg-idiom-cards/SKILL.md
3. .agents/skills/generating-cicg-idiom-cards/references/required-specs.md
4. docs/card-prompts/state/current-batch.json
5. docs/superpowers/specs/README.md
6. docs/superpowers/specs/2026-08-06-idiom-card-rarity-standard-design.md
7. docs/superpowers/specs/2026-08-06-idiom-card-review-governance-design.md
8. docs/superpowers/specs/2026-08-06-card-template-v2.6-dimension-and-pronunciation-amendment.md
9. docs/superpowers/specs/2026-08-06-card-template-v2.7-ssr-badge-amendment.md
10. docs/superpowers/specs/2026-08-06-idiom-card-modularization-design.md
11. docs/card-prompts/shared/card-master-prompt.md
12. docs/card-prompts/shared/negative-constraints.md
13. docs/card-prompts/templates/ 對應稀有度模板
14. docs/card-prompts/idioms/ 對應成語單卡提示語
15. docs/card-prompts/manifest.md
16. Drive 最新 Approved artwork、component、template 與 Review 素材
```

v2.6 定義尺寸、座標、注音與拼音；v2.7 定義 SSR 徽章；元件化 v1.0 定義來源分層與組卡流程。

---

## 3. 真實規範優先序

```text
GitHub 最新 main
→ 最新 Approved 稀有度與審核治理
→ v2.7 SSR 徽章增補（SSR 適用）
→ v2.6 尺寸與發音版面增補
→ 元件化架構 v1.0
→ Repository-local skill 與批次狀態
→ 共用母提示語、負面限制與單卡 Prompt
→ Drive Approved master 與 Manifest 證據
→ 舊圖片與聊天紀錄
```

舊 flat 圖片只能作為歷史或構圖參考，不能覆寫最新規格，也不能取代 artwork／component／data canonical source。

---

## 4. 正式版面 Gate

最終 composite 固定：

```text
畫布：1024 × 2000 px
上方資訊區：y = 0–359，高度 360 px
中央主圖區：y = 360–1559，高度 1200 px
下方內容區：y = 1560–1999，高度 440 px
格式：PNG
```

固定內容：

1. 左上稀有度徽章：`N / R / SR / SSR`。
2. 上方中央四字繁體中文成語。
3. 主標下第一列：四組逐字對齊注音。
4. 第二列：小寫、帶聲調符號的漢語拼音。
5. 拼音下方：一句精簡白話副標。
6. 右上：只顯示「難易度」與 `E / D / C / B / A / S`。
7. 中央主插圖：固定 `1024 × 1200 px` 區域，至少一名人物以動作表達成語。
8. 左下：固定主題徽章與完整類別名稱。
9. 下方故事區：標題只使用「典故」。
10. 右下：低高度窄版深色金框直式箴言牌匾，由右至左閱讀。
11. 最下方：極小單行典故來源。

典故來源格式：

```text
典故來源：朝代・作者《典籍名稱・卷次》
```

### SSR v2.7 專用徽章

當 `rarity === 'SSR'`：

- 使用傳奇級虹彩金龍徽章。
- 大型立體金色 `SSR`。
- 紫、藍、洋紅星雲核心。
- 下端紫色菱形主寶石。
- 與 SR 在輪廓、材質、光效與主寶石上明顯不同。
- 虹彩只限左上徽章，不得污染整張卡。
- N／R／SR 不得使用此徽章。

核准 SSR 模板證據：

```text
CICG_CardTemplate_Rarity_SSR_v2.7_Approved.png
Drive File ID：1NoNZ2muThkzA7k22TF5W5foAD1gq8VpV
尺寸：1024 × 2000 px
SHA-256：cf8f8cb9c6f3cac5f4a115bcbcf53fb57162842dcf34e48173b84f902dcbf785
```

---

## 5. 元件化來源規則

### 5.1 Artwork

圖片生成工具優先產生 artwork，不直接產生 canonical flat card。

Artwork 固定要求：

```text
尺寸：1024 × 1200 px
內容：人物、背景、情境、道具、光影
禁止：卡框、稀有度、難易度、主標、注音、拼音、副標、主題徽章、典故、箴言、來源、Logo、浮水印
```

Artwork 檔名：

```text
CICG_Artwork_<成語>_v<版本>_Review.png
```

### 5.2 可替換元件

以下必須獨立於 artwork：

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

修改難易度、稀有度徽章、文字或牌匾時，不能重新繪製或偷偷替換 artwork。

### 5.3 Structured Data

每張卡至少保存：

```text
renderMode
layoutVersion
componentSetVersion
artworkAssetId
artworkVersion
rarityBadgeId
difficultyBadgeId
themeBadgeId
mottoPlaqueId
成語
注音
漢語拼音
副標
難易度
稀有度與理由
典故與來源
箴言
```

### 5.4 Derived Composite

最終 Review／Approved PNG 是 derived output，可以由相同來源重新產生。

```text
CICG_IdiomCard_<成語>_<稀有度>_<難易度>_v<卡面版本>_Review.png
```

Composite 不得成為唯一 canonical source。

---

## 6. 稀有度與難易度

難易度：

```text
E → D → C → B → A → S
```

稀有度與難易度完全分離。N～SSR 主要依：

- 正面意義
- 激勵強度
- 人格力量
- 精神象徵
- 玩家共鳴
- 收藏定位

不得以艱深度、知名度、角色強弱、特效數量或畫面華麗度直接決定稀有度。

`UR` 只保留給具有可稽核正式授權的外部 IP 聯名。未授權不得使用角色、品牌名稱、Logo、可識別服裝、武器或官方視覺元素。

---

## 7. 產圖前內容表

每張卡先整理：

```text
成語：
逐字注音：
漢語拼音：
白話副標：
難易度：
稀有度：
稀有度理由：
主題類別：
典故摘要：
典故來源：
來源狀態：Verified / NeedsReview
卡牌箴言：
人物設定與動作：
場景、時代與道具：
renderMode：modular / flat-legacy
layoutVersion：2.6
componentSetVersion：
rarityBadgeId：
artworkFilename：
compositeFilename：
artworkStatus：
compositionStatus：
```

要求：

- 注音、拼音、來源與稀有度未完成校對時標記 `NeedsReview`。
- `NeedsReview` 可以產 Review artwork，但不得宣稱 Approved。
- 原創箴言不得冒充古籍原文。
- 傳說、寓言、後世記載與史實必須清楚區分。

---

## 8. 正式產製流程

```text
內容校訂
→ 產生 illustration-only artwork
→ artwork 審核與 Drive Inbox 上傳
→ 解析 Approved 元件版本
→ renderer 組成 Review composite
→ 尺寸／內容／視覺／權利審核
→ 獨立核准
→ Approved composite 與 runtime derivative
→ 更新 Manifest 與 current-batch.json
```

執行要求：

1. 圖片生成後驗證 artwork 實際尺寸。
2. Renderer 輸出後驗證 composite 為 `1024 × 2000 px`。
3. SSR 逐張檢查 v2.7 徽章。
4. 每張 artwork 使用專屬人物、動作與場景。
5. 文字、徽章或版面錯誤只修元件／資料／composition，不重畫合格 artwork。
6. Artwork 本身有內容、人體或權利問題時才重產 artwork。

Renderer 尚未完成時：

- 可以先產 illustration-only artwork。
- `compositionStatus` 設為 `pending` 或 `blocked`。
- 不得為了立即得到成品而把所有 UI 永久烙進 canonical artwork。
- 臨時 flat preview 只能視為 Review derivative。

---

## 9. 審核清單

### Artwork

- [ ] 實際為 `1024 × 1200 px` 或可安全裁切至該尺寸
- [ ] 無卡框、標籤或正式文字欄位
- [ ] 至少一名人物參與成語事件
- [ ] 無人體重大錯誤、時代矛盾、未授權 IP、Logo 或浮水印
- [ ] Artwork File ID、SHA-256、版本與狀態可追溯

### Composition

- [ ] Composite 恰為 `1024 × 2000 px`
- [ ] Header／Artwork／Footer 尺寸正確
- [ ] 注音與拼音正確，沒有數字聲調
- [ ] 難易度與稀有度分離
- [ ] SSR 徽章符合 v2.7
- [ ] 主題徽章、典故、箴言與來源位置正確
- [ ] 無假字、溢出或遮擋
- [ ] 更換 difficulty／rarity badge 後 artwork ID 與 checksum 不變

任一 Blocking Gate 失敗不得 Approved。

---

## 10. Drive 與檔名

Drive 路徑：

```text
80_Inbox/Idiom_Cards/Artworks
80_Inbox/Idiom_Cards/Components
80_Inbox/Idiom_Cards/Composites
02_UI_UX_And_Visuals/Idiom_Cards/Approved/Artworks
02_UI_UX_And_Visuals/Idiom_Cards/Approved/Components
02_UI_UX_And_Visuals/Idiom_Cards/Approved/Composites
90_Archive/Idiom_Cards
```

規則：

- 原始 artwork、component 與 composite 必須逐檔保存，不得只提供壓縮檔。
- 不得覆蓋已發布版本。
- Artwork 與 composite 使用不同 Drive File ID 與狀態欄位。
- 上傳或核准後更新 Manifest 與 `current-batch.json`。

---

## 11. 禁止事項

- 禁止以舊聊天覆寫 GitHub 最新規格。
- 禁止把所有 UI 與文字烙進 modular artwork。
- 禁止只保存 final flat PNG 而遺失 artwork／components／data。
- 禁止修改難易度或徽章時重畫合格 artwork。
- 禁止把 Preview／Review composite 當成 Approved canonical source。
- 禁止輸出錯誤尺寸並宣稱符合標準。
- 禁止省略注音或拼音列。
- 禁止數字聲調。
- 禁止取消主題徽章或把「典故」改為「典故說明」。
- 禁止未授權 IP。
- 禁止產製 Agent自行最終核准。

---

## 12. 完成回報

每批回報：

- 批次 ID 與成語清單
- render mode、layout、component set
- artwork／composition 狀態
- artwork／composite 檔名與實際尺寸
- 各自 Drive File ID 與 SHA-256
- 注音、拼音、來源、稀有度與 SSR 徽章審核狀態
- Manifest／current-batch 更新 commit
- findings 與下一步

沒有真實 Repository、Drive 或 checksum 證據時，不得宣稱完整交付。