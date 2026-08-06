# CICG 成語卡牌共用母提示語 v2.7／Modular v1.0

## 使用前置 Gate

本母提示語不得單獨使用。產製前依序讀取：

```text
1. AGENTS.md
2. .agents/skills/generating-cicg-idiom-cards/SKILL.md
3. docs/card-prompts/state/current-batch.json
4. docs/card-prompts/PROJECT_PROMPT.md
5. docs/superpowers/specs/2026-08-06-card-template-v2.6-dimension-and-pronunciation-amendment.md
6. docs/superpowers/specs/2026-08-06-card-template-v2.7-ssr-badge-amendment.md
7. docs/superpowers/specs/2026-08-06-idiom-card-modularization-design.md
8. docs/card-prompts/shared/negative-constraints.md
9. 對應稀有度模板
10. 對應成語單卡提示語
11. docs/card-prompts/manifest.md
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
- Logo、浮水印、未授權 IP

Artwork 是可重用 canonical visual source。

### B. Derived Composite

由 renderer 使用 artwork、Approved components 與 structured data 組成：

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
- 不得出現卡框、徽章、標籤、文字欄、Logo、浮水印或第三方角色。

---

## Composite 固定版型

Renderer 必須按以下順序組合：

1. `frame-skin`
2. `artwork`：`x = 0–1023`、`y = 360–1559`
3. `effect-overlay`（可選）
4. 左上 `rarity-badge`
5. 右上 `difficulty-badge`
6. 四字繁體中文主標
7. 四組逐字對齊注音橫列
8. 四個小寫帶聲調漢語拼音音節
9. 精簡白話副標
10. 左下 `theme-badge`
11. 中下 `allusion-panel`，標題只使用「典故」
12. 右下低高度窄版直式 `motto-plaque`
13. 最下方單行 `source-line`

### SSR v2.7

SSR 使用：

- 傳奇級虹彩金龍輪廓
- 大型立體金色 `SSR`
- 紫藍洋紅星雲核心
- 紫色菱形主寶石

不得用 SR 類似輪廓只改字母、亮度或飽和度。虹彩只限左上徽章。

---

## Structured Data 必填

```text
成語
四組注音
四個帶聲調漢語拼音音節
白話副標
難易度
稀有度與判定理由
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
```

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
- 沒有任何正式 UI、文字欄或卡框。
- 人物動作與成語一致。
- 沒有重大人體錯誤、時代矛盾、第三方 Logo、浮水印或未授權 IP。

### Composite

- 實際尺寸恰為 `1024 × 2000 px`。
- 三區高度為 `360 / 1200 / 440 px`。
- 注音與拼音正確，無數字聲調。
- 右上只顯示難易度。
- 左下主題徽章完整。
- 下方標題只使用「典故」。
- 箴言為低高度直式窄牌匾。
- 典故來源為最下方單行。
- SSR 徽章符合 v2.7。
- 修改 difficulty／rarity badge 後 artwork asset ID 與 checksum 不變。

未通過任一項時，只能標記 `Review` 或 `Changes Requested`。

---

## Renderer 未完成時

- 先產生 illustration-only artwork。
- 在 `current-batch.json` 將 composition 標記 `pending` 或 `blocked`。
- 不得把 UI 烙入 canonical artwork 作為替代。
- 臨時 flat preview 只能作為 Review derivative，並保留獨立 artwork source。