# UR 聯名成語圖卡正式母提示語 v1.4

用途：外部 IP 聯名 UR 卡之角色成語配對、共用成語內容引用、中央插畫生成與 Renderer 模板組裝。  
幾何基準：`layoutVersion = 2.6.1`  
UR 標準：`urStandardVersion = 1.2`

> 未具可稽核正式授權時，只能產生 Draft／Review 素材，不得指派正式 `UR-####`、標記 Approved、公開發布或移入 Drive Approved。

## 1. Required sources

```text
docs/superpowers/specs/2026-08-08-ur-collaboration-card-standard-v1-0-design.md
docs/superpowers/specs/2026-08-08-project-wide-four-digit-card-numbering-design.md
data/idioms/<status>/<slug>.json
data/card-variants/<status>/<ip>/<slug>.json
data/cards/card-number-registry.json
data/cards/theme-badge-registry.json
```

共用成語包提供注音、釋義、典故、來源、一般副標與一般箴言；聯名覆寫只提供角色、主要招式、專屬副標、專屬箴言與卡面演出，不得重複定義典故。

## 2. Inputs

使用者必填：

```text
{{IP_NAME}}
{{CHARACTER_NAME}}
```

由資料層解析：

```text
{{CHARACTER_TITLE}}
{{IDIOM}}
{{BOPOMOFO}}
{{SPIRIT_LINE}}
{{THEME_CATEGORY}}
{{IDIOM_STORY}}
{{SOURCE}}
{{MOTTO_1}}
{{MOTTO_2}}
{{MOTTO_3}}
{{MOTTO_4}}
{{PRIMARY_MOVE}}
{{SCENE_DESCRIPTION}}
{{CHARACTER_EFFECT}}
{{IP_LOGO_ASSET_ID}}
{{COLLABORATION_LABEL_ASSET_ID}}
{{THEME_BADGE_ASSET_ID}}
{{CARD_NUMBER_PLAQUE_ASSET_ID}}
{{CARD_NUMBER}}
{{CARD_NUMBER_OR_REVIEW_ID}}
{{LICENSE_EVIDENCE_ID}}
```

## 3. Character and idiom selection

未指定成語時，自動依角色核心性格、價值觀、重大選擇與成長歷程挑選四字成語。主要招式只負責視覺演出，不得反向主導選詞。

規則：

1. 成語恰好四個繁體漢字。
2. 不受現有庫存限制，但成語本體須達 SR 或 SSR 水準。
3. 保留成語自己的典故、來源、難度與主題。
4. 不得把 IP 劇情、角色經歷或招式寫成成語典故。
5. 來源不足時維持 `NeedsReview`，不得虛構。

## 4. Central artwork prompt

```text
產生一張 1024 × 1200 px 的直式中央角色插畫，作為 Chinese-Idiom-Chain-Game UR 聯名成語卡的 Main Artwork。

聯名作品：{{IP_NAME}}
角色職稱：{{CHARACTER_TITLE}}
主要角色：{{CHARACTER_NAME}}
成語主題：{{IDIOM}}
精神核心：{{SPIRIT_LINE}}
主要招式：{{PRIMARY_MOVE}}
角色情境：{{SCENE_DESCRIPTION}}
角色特效：{{CHARACTER_EFFECT}}

角色必須以清楚行動呈現成語精神。主要招式用於動作、攻擊動線與特效設計，但不得照搬動畫截圖或官方構圖。

構圖：單一主要角色；角色占畫面約 55% 至 70%；半身至全身動態構圖；臉部、雙手與主要武器完整；保留右上標籤安全區與 Footer 裁切安全區。

美術：高精緻日韓動漫手遊插畫、收藏級 UR 角色立繪、電影級光影、精緻材質、自然人體、動態粒子、高反差且保留暗部細節。

只生成中央插畫，不得生成完整卡面、卡框、UR 徽章、聯名標籤、IP Logo、主題徽章、文字、典故、來源、箴言、卡號、浮水印或 Mockup。
```

## 5. Taiwanese Zhuyin gate

圖片模型不得生成主標題、注音或卡號。Renderer 必須直接使用結構化資料中的 `bopomofo[4]`。
注音必須恰好四筆並與四字成語逐字對齊；字型缺字或字型覆蓋不完整均屬 Blocking failure。

只允許 Bopomofo `U+3105–U+312F` 與聲調 `U+02D9`、`U+02CA`、`U+02C7`、`U+02CB`。
禁止平假名、片假名、片假名擴充、半形片假名、漢語拼音、羅馬字、漢字、近似假字與亂碼。

Finding codes：

```text
japanese-kana-in-bopomofo
invalid-bopomofo
```

Gate 失敗時，`compositionStatus` 必須為 `changes-requested` 或 `blocked`。

## 6. Renderer composite

```text
Canvas       x=0, y=0,    width=1024, height=2000
Header       x=0, y=0,    width=1024, height=360
Main Artwork x=0, y=360,  width=1024, height=1200
Footer       x=0, y=1560, width=1024, height=440
Geometry tolerance = ±2 px
```

### 6.1 UR visual components

1. 左上使用 current Approved 立體虹彩金屬 UR 徽章。
2. 全畫布套用 current Approved UR 虹彩霓虹 Overlay。
3. Overlay 不得造成 reflow、縮小內容、染色整個 Footer 或遮蔽文字與臉部。
4. 圖片模型不得重畫徽章、外框、Logo、聯名標籤或主題徽章。

### 6.2 Header

```text
UR badge           x=24–252,   y=18–326
idiom title        x=250–788,  y=42–158
bopomofo[4]        x=278–756,  y=166–232
spirit subtitle    x=258–782,  y=254–330
collaboration tag  x=792–1000, y=24–318
```

成語固定四字；注音固定四組；UR 不顯示難度徽章。

### 6.3 Collaboration label

```text
頂部：{{IP_LOGO_ASSET_ID}}
中段：{{CHARACTER_TITLE}}
下段：{{CHARACTER_NAME}}
```

保留 IP Logo 比例；顯示職稱與角色正式名稱；不得顯示「聯名卡」「角色名」「聯名限定」或「限定版」。Logo 與標籤只能使用 versioned Asset。

### 6.4 Footer

```text
theme badge         x=28–300,  y=1576–1920, width=272, height=344
allusion panel      x=286–724, y=1582–1920, width=438, height=338
motto plaque        x=730–988, y=1722–1922, width=258, height=200
source line         x=178–398, y=1936–1986, width=220, height=50
card-number-plaque  x=410–614, y=1936–1986, width=204, height=50, bottom-center
```

主題依成語判定，不依 IP 陣營或角色職稱判定。

典故區只顯示：

```text
典故
{{IDIOM_STORY}}
來源：{{SOURCE}}
```

禁止顯示本義段落，禁止把角色劇情寫成典故，禁止虛構來源。

### 6.5 Five-character quatrain

箴言牌匾固定 `258 × 200 px`，四欄直式、由右至左：

```text
最右欄：{{MOTTO_1}}
次右欄：{{MOTTO_2}}
次左欄：{{MOTTO_3}}
最左欄：{{MOTTO_4}}
```

每句恰好五個繁體漢字，四句共二十字；不加行內標點，不得三欄、橫排或留大面積空白。

### 6.6 Project-wide four-digit card number

正式卡號只能從 `data/cards/card-number-registry.json` 取得，格式固定為四碼／four-digit `UR-####`。
Renderer 必須放置唯一 `bottom-center card-number-plaque = {{CARD_NUMBER}}`；`cardNumber` 不得來自圖片模型或人工猜測。
最底部只能有一個 canonical card-number-plaque，內容只能是 Registry 正式卡號或受治理 Review identifier。

沒有 `{{LICENSE_EVIDENCE_ID}}` 時只能使用 `{{CARD_NUMBER_OR_REVIEW_ID}}` 中的 Review identifier；`RV-UR-####` 與 `UR-REVIEW-####` 不占正式序列。

## 7. Negative prompt

```text
禁止完整卡面由圖片模型一次生成。
禁止五字成語、非四字主標題、簡體字、錯字、假注音、漢語拼音、羅馬拼音、平假名、片假名與亂碼。
禁止把成語典故改寫成角色劇情，禁止虛構古籍、人物、引文、來源、授權、Asset ID、Drive ID、SHA-256 或 Approved 狀態。
禁止在典故區顯示本義。
禁止三欄箴言、橫排箴言、非五字句、少於或多於二十字、超過 200 px 的箴言牌匾或大面積空白。
禁止聯名標籤顯示「聯名卡」，禁止移除 IP Logo。
禁止圖片模型生成 UR 徽章、虹彩外框、IP Logo、聯名標籤、主題徽章、典故、箴言、來源或卡號。
禁止改變 Header／Main Artwork／Footer 的 360／1200／440 高度。
禁止一次生成多張卡、拼圖、展示牆、桌面 Mockup、手持卡片、包裝盒或傾斜透視。
```

## 8. Review report

每張只回報證據支持的欄位：IP、角色、成語與配對理由、四筆注音與 Gate、主題與 Asset ID、典故來源、五言四句、Logo／標籤狀態、Review identifier 或正式卡號、Artwork／Composite 尺寸、Drive ID、SHA-256、Registry／Manifest commit、findings 與下一步。

沒有證據的欄位不得宣稱完成。
