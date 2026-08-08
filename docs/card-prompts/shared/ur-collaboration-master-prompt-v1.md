# UR 聯名成語圖卡正式母提示語 v1.3

用途：外部 IP 聯名 UR 卡之角色成語配對、內容準備、中央插畫生成與模板組裝。  
幾何基準：`layoutVersion = 2.6.1`  
UR 標準：`urStandardVersion = 1.2`

規格來源：

```text
docs/superpowers/specs/2026-08-08-ur-collaboration-card-standard-v1-0-design.md
docs/superpowers/specs/2026-08-08-project-wide-four-digit-card-numbering-design.md
data/cards/card-number-registry.json
data/cards/theme-badge-registry.json
```

> 未具可稽核正式授權時，只能產生 Draft／Review 素材，不得指派正式 `UR-####`、標記 Approved、公開發布或移入 Drive Approved。

## 1. 輸入與變數

使用者必填：

```text
{{IP_NAME}}
{{CHARACTER_NAME}}
```

由技能與資料層解析：

```text
{{CHARACTER_TITLE}}
{{IDIOM}}
{{ZHUYIN_1}}
{{ZHUYIN_2}}
{{ZHUYIN_3}}
{{ZHUYIN_4}}
{{SPIRIT_LINE}}
{{THEME_CATEGORY}}
{{IDIOM_STORY}}
{{SOURCE}}
{{MOTTO_1}}
{{MOTTO_2}}
{{MOTTO_3}}
{{MOTTO_4}}
{{SCENE_DESCRIPTION}}
{{CHARACTER_EFFECT}}
{{IP_LOGO_ASSET_ID}}
{{COLLABORATION_LABEL_ASSET_ID}}
{{THEME_BADGE_ASSET_ID}}
{{CARD_NUMBER_PLAQUE_ASSET_ID}}
{{CARD_NUMBER_OR_REVIEW_ID}}
{{LICENSE_EVIDENCE_ID}}
```

## 2. 角色成語配對

未指定成語時：

1. 只選恰好四個繁體漢字的成語。
2. 依角色核心性格、價值觀、行動方式、代表能力與可視化情境配對。
3. 不得只依人氣、戰力、服裝顏色或畫面華麗度選擇。
4. 成語必須存在於啟用資料，或能以正式來源維持 `NeedsReview`。
5. 保留成語自己的典故、來源、難度與主題，不得改寫成 IP 劇情。
6. 生成前記錄角色配對理由。

## 3. 中央插畫生成提示語

```text
產生一張 1024 × 1200 px 的直式中央角色插畫，作為 Chinese-Idiom-Chain-Game UR 聯名成語卡的 Main Artwork。

聯名作品：{{IP_NAME}}
角色職稱：{{CHARACTER_TITLE}}
主要角色：{{CHARACTER_NAME}}
成語主題：{{IDIOM}}
精神核心：{{SPIRIT_LINE}}
角色情境：{{SCENE_DESCRIPTION}}
角色特效：{{CHARACTER_EFFECT}}

角色必須以一個清楚行動呈現「{{IDIOM}}」的精神，不能只站立擺姿勢。角色外觀、服裝、髮型、武器、代表色、性格與特效須符合已核准角色設定與授權素材。

構圖要求：
- 單一主要角色。
- 角色占畫面約 55% 至 70%。
- 半身至全身動態構圖。
- 臉部、雙手與主要武器清楚完整。
- 右上保留聯名標籤安全區。
- 下方保留 Footer 裁切安全區。
- 背景服務成語情境。

美術要求：
高精緻日韓動漫手遊插畫、收藏級 UR 角色立繪、電影級光影、精緻材質、自然人體結構、動態粒子、高反差並保留暗部細節。

只生成中央插畫，絕對不得生成：
- 完整卡面、卡框或霓虹外框
- UR 徽章、聯名標籤、IP Logo、主題徽章
- 主標題、注音、拼音、假名、精神短句
- 典故、來源、箴言、卡號
- 浮水印、版權文字、多張卡片或 Mockup
```

## 4. 臺灣注音 Gate

Renderer 只使用結構化資料中的四筆注音：

```text
{{ZHUYIN_1}}
{{ZHUYIN_2}}
{{ZHUYIN_3}}
{{ZHUYIN_4}}
```

規則：

- 恰好四筆非空注音，逐字對齊四字成語。
- 只允許 Bopomofo `U+3105–U+312F` 與聲調 `U+02D9`、`U+02CA`、`U+02C7`、`U+02CB`。
- 禁止平假名、片假名、漢語拼音、羅馬字、漢字、近似假字與亂碼。
- 日文假名 finding：`japanese-kana-in-bopomofo`。
- 其他錯誤 finding：`invalid-bopomofo`。
- 圖片模型、OCR 與人工目測猜測不得提供 canonical 注音。

Gate 失敗時，`compositionStatus` 必須為 `changes-requested` 或 `blocked`。

## 5. UR 完整卡面組裝

```text
使用 Chinese-Idiom-Chain-Game UR v1.2 模板與 Renderer，組裝一張 1024 × 2000 px 的 Review／Approved composite。

Canvas       x=0, y=0,    width=1024, height=2000
Header       x=0, y=0,    width=1024, height=360
Main Artwork x=0, y=360,  width=1024, height=1200
Footer       x=0, y=1560, width=1024, height=440
Geometry tolerance = ±2 px
```

### 5.1 UR 視覺元件

1. 左上套用 current Approved 立體虹彩龍紋 UR 徽章。
2. 全畫布套用 current Approved UR 虹彩霓虹 Overlay。
3. 外框具青綠、青藍、紫、洋紅、紅與橙金連續光帶。
4. Overlay 只能覆蓋，不能造成 reflow、縮小內容、染色全部 Footer 或遮蔽文字與臉部。
5. 圖片模型不得生成、重畫或修補徽章與外框。

### 5.2 Header

```text
UR badge           x=24–252,   y=18–326
idiom title        x=250–788,  y=42–158
bopomofo[4]        x=278–756,  y=166–232
spirit subtitle    x=258–782,  y=254–330
collaboration tag  x=792–1000, y=24–318
```

- 成語主標題固定四字。
- 注音固定四組臺灣正體注音。
- UR 不顯示難度徽章。
- 右上使用 IP 專屬聯名標籤。

### 5.3 聯名標籤

```text
頂部：{{IP_LOGO_ASSET_ID}}
中段：{{CHARACTER_TITLE}}
下段：{{CHARACTER_NAME}}
```

規則：

- 必須保留 IP Logo 的位置與比例。
- 顯示角色職稱與角色正式名稱。
- 不得顯示「聯名卡」「角色名」「聯名限定」「限定版」。
- Logo 與標籤只能使用 versioned Asset，不得由圖片模型重畫或仿製。
- 無授權證據時，只能維持 Review，不得公開發布或 Approved。
- 卡片最底部不得重複 IP 或角色名稱。

### 5.4 Footer

```text
theme badge       x=28–300,  y=1576–1920, width=272, height=344
allusion panel    x=286–724, y=1582–1920, width=438, height=338
motto plaque      x=730–988, y=1722–1922, width=258, height=200
source line       x=178–398, y=1936–1986, width=220, height=50
number plaque     x=410–614, y=1936–1986, width=204, height=50
```

主題徽章：

- 只能使用 `{{THEME_BADGE_ASSET_ID}}`。
- `themeCategory` 依成語本身判定，不依 IP 陣營或角色職稱判定。

典故區只顯示：

```text
典故
{{IDIOM_STORY}}
來源：{{SOURCE}}
```

禁止顯示本義段落，禁止把角色劇情寫成典故，禁止虛構來源。

### 5.5 五言絕句箴言

箴言牌匾固定 `258 × 200 px`，四欄直式、由右至左：

```text
最右欄：{{MOTTO_1}}
次右欄：{{MOTTO_2}}
次左欄：{{MOTTO_3}}
最左欄：{{MOTTO_4}}
```

每句恰好 5 個繁體漢字，四句共 20 個漢字；卡面不加行內標點，不得使用舊版三欄排版，不得留下大面積空白。

### 5.6 卡號

- 正式卡號只能從 `data/cards/card-number-registry.json` 取得。
- 正式格式固定 `UR-####`。
- 沒有 `{{LICENSE_EVIDENCE_ID}}` 時只能使用受治理的 Review identifier。
- `RV-UR-####` 或 `UR-REVIEW-####` 不占正式序列，也不得冒充正式卡號。
- 圖片模型不得生成、猜測或重畫卡號。
- 卡面只能顯示一個 `{{CARD_NUMBER_OR_REVIEW_ID}}` 牌匾。

## 6. 統一負面提示語

```text
禁止完整卡面由圖片模型一次生成。
禁止五字成語、非四字主標題、簡體字、錯字、假注音、漢語拼音、羅馬拼音、平假名、片假名與亂碼。
禁止把成語典故改寫成角色劇情，禁止虛構古籍、人物、引文、來源、授權、Asset ID、Drive ID、SHA-256 或 Approved 狀態。
禁止在典故區顯示本義。
禁止三欄箴言、橫排箴言、非五字句、少於或多於 20 個漢字、超過 200 px 的 UR 箴言牌匾或大面積空白。
禁止聯名標籤顯示「聯名卡」，禁止移除 IP Logo，禁止底部重複角色名稱。
禁止圖片模型生成 UR 徽章、虹彩外框、IP Logo、聯名標籤、主題徽章、典故、箴言、來源或卡號。
禁止改變 Header／Main Artwork／Footer 的 360／1200／440 高度，禁止壓縮 Footer、拉伸 artwork 或移動固定元件。
禁止一次生成多張卡、拼圖、展示牆、桌面 Mockup、手持卡片、包裝盒或傾斜透視。
```

## 7. Review 完成回報

每張只回報證據支持的欄位：

- IP、角色職稱與角色正式名稱
- 四字成語與角色配對理由
- 四筆注音與 Gate 結果
- themeCategory 與 theme badge Asset ID
- 典故來源與校訂狀態
- 四句五言箴言
- IP Logo 與聯名標籤 Asset ID／狀態
- Review identifier 或正式 `UR-####`
- Artwork／Composite 檔名、尺寸與狀態
- Drive File ID、SHA-256、Registry／Manifest commit
- Blocking findings 與下一步

沒有證據的欄位不得宣稱完成。
