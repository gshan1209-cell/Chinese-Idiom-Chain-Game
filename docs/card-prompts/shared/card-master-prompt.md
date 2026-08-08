# CICG 成語卡牌共用母提示語 v2.7／Modular v1.1

## 使用前置 Gate

本母提示語不得單獨使用。產製前依序讀取：

```text
1. AGENTS.md
2. .agents/skills/generating-cicg-idiom-cards/SKILL.md
3. docs/card-prompts/state/current-batch.json
4. docs/card-prompts/PROJECT_PROMPT.md
5. docs/superpowers/specs/2026-08-08-project-wide-four-digit-card-numbering-design.md
6. data/cards/card-number-registry.json
7. docs/superpowers/specs/2026-08-06-card-template-v2.6-dimension-and-pronunciation-amendment.md
8. docs/superpowers/specs/2026-08-06-card-template-v2.7-ssr-badge-amendment.md
9. docs/superpowers/specs/2026-08-06-idiom-card-modularization-design.md
10. docs/card-prompts/shared/negative-constraints.md
11. 對應稀有度模板
12. 對應成語單卡提示語
13. docs/card-prompts/manifest.md
```

較新的 Approved 規格優先。`NeedsReview` 內容只能產 Review 資產。

---

## 產製目標

每張新卡建立兩類不同資產：

### A. Canonical Artwork

```text
1024 × 1200 px
人物＋背景＋情境＋道具＋光影
```

Artwork 必須完全排除：

- 卡框
- 稀有度徽章
- 難易度標籤
- 成語主標
- 注音
- 漢語拼音
- 白話副標
- 主題徽章
- 典故區
- 箴言與牌匾
- 典故來源
- 正式卡號與 card-number-plaque
- Logo、浮水印、未授權 IP

**圖片模型不得生成卡號。** `cardNumber` 只能由 Renderer 讀取 `data/cards/card-number-registry.json` 後渲染。

Artwork 是可重用 canonical visual source。

### B. Derived Composite

由 Renderer 使用 artwork、Approved components 與 structured data 組成：

```text
1024 × 2000 px
Header：360 px
Artwork：1200 px
Footer：440 px
```

Composite 是 Review／Approved 交付圖，不是唯一來源。

---

## Artwork 生成提示語骨架

建立一張高質感韓日動漫遊戲插畫風格的繁體中文成語情境主圖素材，但畫面本身不得包含任何卡牌 UI 或正式文字。

必要要求：

- 畫布 `1024 × 1200 px`。
- 至少一名人物實際參與成語事件。
- 人物以動作、表情、道具與環境直接表達成語。
- 不得只畫正面站立肖像。
- 重要人物、手部、道具與事件轉折不得被裁切。
- 歷史題材的服飾、建築與道具符合典故時代。
- 人物性別、年齡、構圖與動作依單卡企劃安排。
- 系列批次不得長期重複同一臉型、性別、姿勢或構圖。
- 不得出現卡框、徽章、標籤、文字欄、卡號、Logo、浮水印或第三方角色。

---

## Composite 固定版型

Renderer 必須按以下順序組合：

1. `frame-skin`
2. `artwork`：`x = 0–1023`、`y = 360–1559`
3. `effect-overlay`（可選）
4. 左上 `rarity-badge`
5. 右上 `difficulty-badge`；UR 改用 IP 專屬聯名標籤
6. 四字繁體中文主標
7. 四組逐字對齊注音橫列
8. 四個小寫帶聲調漢語拼音音節僅限資料層；卡面不得顯示
9. 精簡白話副標
10. 左下 `theme-badge`
11. 中下 `allusion-panel`，標題只使用「典故」
12. 右下低高度窄版直式 `motto-plaque`
13. 最下方左側單行 `source-line`
14. 最下方中央唯一的 `bottom-center card-number-plaque = {{CARD_NUMBER}}`

`source-line` 與 `card-number-plaque` 共用原 v2.6.1 `source line x=178–846, y=1936–1986` 外框空間，內部分割為：

```text
source-line          x=178–398, y=1936–1986
card-number-plaque   x=410–614, y=1936–1986
```

不得改變 `1024 × 2000`、`360／1200／440` 或其他 v2.6.1 Bounding Box。卡號牌匾只能顯示 Canonical Registry 的四碼正式卡號，不得顯示角色名、IP 名稱、難度、版本或其他文字。

### 全專案四碼卡號

```text
N-0001
R-0001
SR-0001
SSR-0001
UR-0001
```

- 格式固定為 `{rarity}-{sequence:0000}`。
- N／R／SR／SSR／UR 各自使用獨立的全專案流水序列。
- 新章節不歸零。
- 正式號碼一經指派不得變更或回收。
- Renderer 只能使用 `data/cards/card-number-registry.json` 的 `cardNumber`。
- 卡面只允許一個 canonical `card-number-plaque`，禁止額外卡號。
- UR 沒有可稽核 `licenseEvidenceId` 時不得指派 `UR-####`，只能使用不占號的 Review 識別碼。

### SSR v2.7

SSR 使用：

- 傳奇級虹彩金龍輪廓
- 大型立體金色 `SSR`
- 紫藍洋紅星雲核心
- 紫色菱形主寶石

不得用 SR 類似輪廓只改字母、亮度或飽和度。虹彩只限 Approved 稀有度框與效果層，不得污染主題徽章。

---

## Structured Data 必填

```text
成語
四組注音
四個帶聲調漢語拼音音節（資料層限定）
白話副標
難易度
稀有度與判定理由
cardNumber
主題類別
典故摘要與來源
三句箴言
renderMode
layoutVersion
componentSetVersion
artworkAssetId
rarityBadgeId
difficultyBadgeId
themeBadgeId
mottoPlaqueId
cardNumberPlaqueId
```

- `cardNumber` 必須符合 `^(N|R|SR|SSR|UR)-[0-9]{4}$`，或在未授權 UR Review 階段使用明確非正式 Review 識別碼。
- 難易度依普及度與理解門檻。
- 稀有度依正面意義、激勵強度、精神象徵與收藏定位。
- 視覺華麗度不能決定語義稀有度。
- UR 只限正式授權聯名。

---

## 九類主題徽章

| 類別 | 圖示 | 固定底色 |
|---|---|---|
| 軍事 | 劍與軍旗 | 深緋紅 `#8E1E24` |
| 內政 | 玉璽與卷軸 | 玉石綠 `#176B52` |
| 智謀 | 羽扇與棋盤 | 皇家紫 `#5A338A` |
| 文藝 | 毛筆與畫卷 | 青藍色 `#167A83` |
| 勵志 | 山路與旭日 | 暖橙金 `#C77B1F` |
| 修身 | 蓮花與竹簡 | 蓮花粉 `#B95B79` |
| 人際 | 作揖雙人或相握之手 | 琥珀棕 `#9A5B22` |
| 警世 | 警鐘與眼睛 | 靛紫色 `#3F2B78` |
| 見識 | 眼睛與遠山窗口 | 寶石藍 `#1D5F9E` |

---

## Blocking Gate

### Artwork

- 實際尺寸為 `1024 × 1200 px` 或已驗證可安全裁切。
- 沒有任何正式 UI、文字欄、卡號或卡框。
- 人物動作與成語一致。
- 沒有重大人體錯誤、時代矛盾、第三方 Logo、浮水印或未授權 IP。

### Composite

- 實際尺寸恰為 `1024 × 2000 px`。
- 三區高度為 `360 / 1200 / 440 px`。
- 注音正確且逐字對齊；卡面不顯示拼音。
- 右上 N～SSR 只顯示難易度；UR 只顯示 IP 專屬聯名標籤。
- 左下主題徽章完整。
- 下方標題只使用「典故」。
- 箴言為低高度直式窄牌匾。
- 來源位於底部左側子區。
- `bottom-center card-number-plaque` 恰好一個，內容與 Registry 四碼卡號完全一致。
- SSR 徽章符合 v2.7。
- 修改 difficulty／rarity badge 或卡號牌匾後 artwork asset ID 與 checksum 不變。

未通過任一項時，只能標記 `Review` 或 `Changes Requested`。

---

## Renderer 未完成時

- 先產生 illustration-only artwork。
- 在 `current-batch.json` 將 composition 標記 `pending` 或 `blocked`。
- 不得把 UI、卡號或文字烙入 canonical artwork 作為替代。
- 臨時 flat preview 只能作為 Review derivative，並保留獨立 artwork source。