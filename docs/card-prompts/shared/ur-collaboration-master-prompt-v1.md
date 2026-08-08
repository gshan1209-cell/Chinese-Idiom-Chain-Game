# UR 聯名成語圖卡正式母提示語 v1.2

用途：正式授權外部 IP 聯名 UR 卡之內容準備、中央插畫生成與模板組裝。  
幾何基準：`layoutVersion = 2.6.1`  
規格來源：

```text
docs/superpowers/specs/2026-08-08-ur-collaboration-card-standard-v1-0-design.md
docs/superpowers/specs/2026-08-08-project-wide-four-digit-card-numbering-design.md
data/cards/card-number-registry.json
```

> 本文件不能取代授權證據。未具可稽核正式授權時，只能產生 Draft／Review 素材，不得指派正式 `UR-####`、Approved 或公開發布。

## 1. 變數

```text
{{CARD_NUMBER}}
{{IDIOM}}
{{ZHUYIN}}
{{SPIRIT_LINE}}
{{IP_NAME}}
{{CHARACTER_NAME}}
{{THEME_CATEGORY}}
{{IDIOM_MEANING}}
{{IDIOM_STORY}}
{{SOURCE}}
{{MAXIM_RIGHT}}
{{MAXIM_CENTER}}
{{MAXIM_LEFT}}
{{SCENE_DESCRIPTION}}
{{CHARACTER_EFFECT}}
{{COLLABORATION_LABEL_ASSET_ID}}
{{CARD_NUMBER_PLAQUE_ASSET_ID}}
{{LICENSE_EVIDENCE_ID}}
```

## 2. 中央插畫生成提示語

```text
產生一張 1024 × 1200 px 的直式中央角色插畫，作為 Chinese-Idiom-Chain-Game UR 聯名成語卡的 Main Artwork。

聯名作品：{{IP_NAME}}
主要角色：{{CHARACTER_NAME}}
成語主題：{{IDIOM}}
精神核心：{{SPIRIT_LINE}}
角色情境：{{SCENE_DESCRIPTION}}
角色特效：{{CHARACTER_EFFECT}}

角色必須以具體行動呈現「{{IDIOM}}」的精神，不能只站立擺姿勢。角色外觀、服裝、髮型、武器、代表色、性格與特效必須符合已核准的角色設定與授權素材。

構圖要求：
- 單一主要角色。
- 角色占畫面約 55% 至 70%。
- 半身至全身動態構圖。
- 臉部、雙手與主要武器清楚完整。
- 重要頭部不得靠近頂端。
- 右上保留聯名標籤安全區，不放置臉部或主要武器。
- 下方保留 Footer 安全區。
- 視覺動線由角色臉部延伸至武器與專屬特效。
- 背景必須服務成語情境。

美術要求：
高精緻日韓動漫手遊插畫、收藏級 UR 角色立繪、電影級光影、清晰五官、精緻材質、自然人體結構、強烈景深、動態粒子、高反差但保留暗部細節。

圖片模型不得生成主標題、注音或卡號。

只生成中央插畫，不得生成：
- 完整卡面
- 卡框或霓虹外框
- UR 徽章
- 難度徽章
- 聯名標籤
- 主題徽章
- card-number-plaque
- 任何文字、注音、拼音、假名、數字或符號
- 典故、箴言、來源
- Logo、浮水印或版權文字
- 多張卡片拼圖
```

## 3. IP 專屬聯名標籤

正式生產優先直接使用該 IP 的 Approved 母件，不得由圖片模型自由重設計。每個聯名 IP 必須有獨立視覺語言；不得只在共用標籤上替換文字。

鬼滅之刃角色版本固定：

```text
上方主要直式文字：鬼滅之刃
下方獨立小牌直式文字：{{CHARACTER_NAME}}
```

只能替換角色名稱，不得加入「聯名限定」「角色名」「限定版」「UR」、官方 Logo、仿官方 Logo或其他文字。不得改變標籤高度、寬度、材質、花卉、寶石、色彩與裝飾位置。

## 4. 臺灣注音資料與 Renderer Gate

Renderer 必須直接使用已驗證的 `bopomofo[4]` 文字節點。

```text
- 四字成語必須恰好四筆非空注音並逐字對齊。
- 只允許 Bopomofo U+3105–U+312F 與聲調 U+02D9、U+02CA、U+02C7、U+02CB。
- 平假名、片假名、片假名擴充、半形片假名、漢語拼音、羅馬字、漢字、近似假字與亂碼一律禁止。
- 出現任何日文假名時記錄 japanese-kana-in-bopomofo。
- 其他缺字、多字、錯位或非注音字元記錄 invalid-bopomofo。
- 正式字型必須完整覆蓋臺灣注音；缺字、方框或錯誤 fallback 時停止組裝。
```

注音驗證失敗時，`compositionStatus` 必須是 `changes-requested` 或 `blocked`，不得標記 Approved。

## 5. 全專案四碼 UR 卡號 Gate

正式卡號格式固定為：

```text
UR-0001
UR-0002
UR-0003
```

規則：

- 格式為 `{rarity}-{sequence:0000}`，數字固定四碼。
- UR 使用全專案獨立序列，新 IP 或新章節都不得歸零。
- Renderer 只能從 `data/cards/card-number-registry.json` 取得 `cardNumber`。
- 沒有可稽核 `{{LICENSE_EVIDENCE_ID}}` 時不得指派 `UR-####`，只能使用不占正式序列的 Review 識別碼。
- 正式號碼一經指派不得變更或回收。
- 圖片模型不得生成、猜測、重畫或修補卡號。
- 卡面只能由 Renderer 顯示一個正式卡號。

## 6. 完整卡面組裝提示語

```text
使用已核准的 Chinese-Idiom-Chain-Game UR 聯名卡模板，組裝一張 1024 × 2000 px 的正式 Review composite。

嚴格使用 v2.6.1 固定幾何：
Canvas       x=0, y=0,    width=1024, height=2000
Header       x=0, y=0,    width=1024, height=360
Main Artwork x=0, y=360,  width=1024, height=1200
Footer       x=0, y=1560, width=1024, height=440
所有座標、尺寸與間距誤差不得超過 ±2 px。

資料：
卡號：{{CARD_NUMBER}}
卡號牌匾 Asset ID：{{CARD_NUMBER_PLAQUE_ASSET_ID}}
稀有度：UR
成語：{{IDIOM}}
注音：{{ZHUYIN}}
精神短句：{{SPIRIT_LINE}}
聯名 IP：{{IP_NAME}}
角色名稱：{{CHARACTER_NAME}}
聯名標籤 Asset ID：{{COLLABORATION_LABEL_ASSET_ID}}
授權證據：{{LICENSE_EVIDENCE_ID}}
主題類別：{{THEME_CATEGORY}}
成語本義：{{IDIOM_MEANING}}
典故：{{IDIOM_STORY}}
正式來源：{{SOURCE}}
箴言最右欄：{{MAXIM_RIGHT}}
箴言中央欄：{{MAXIM_CENTER}}
箴言最左欄：{{MAXIM_LEFT}}

組裝規則：
1. 左上使用 Approved UR 虹彩龍紋徽章。
2. 全畫布套用 Approved UR 虹彩霓虹 Overlay，Overlay 只能覆蓋，不得造成 reflow。
3. 中上顯示四字成語「{{IDIOM}}」。
4. 主標題下顯示四組逐字對齊且通過 Gate 的正確臺灣注音「{{ZHUYIN}}」。
5. 注音下顯示單行精神短句「{{SPIRIT_LINE}}」。
6. UR 卡省略難度徽章。
7. 原 difficulty Bounding Box 套用該 IP 專屬聯名標籤。
8. 鬼滅之刃標籤上段顯示「鬼滅之刃」，下段小牌顯示「{{CHARACTER_NAME}}」。
9. 聯名標籤不得顯示「聯名限定」或其他補充文字。
10. Main Artwork 使用已核准的 1024 × 1200 px illustration-only artwork。
11. 左下只能使用 Registry 解析的 Approved 主題徽章「{{THEME_CATEGORY}}」。
12. Footer 中央顯示成語本義、典故與正式來源。
13. 典故只能描述成語本身，不得改寫成角色故事。
14. 右下使用固定三欄直式箴言牌匾，由右至左排列。
15. 最底部只能有一個 canonical card-number-plaque，位於 bottom-center，內容固定為「{{CARD_NUMBER}}」。
16. 最底部不得重複顯示角色名稱、聯名名稱、難度、版本或第二組卡號。
17. `source-line` 與卡號牌匾共用 v2.6.1 原 source-line 外框，內部分割為：source-line x=178–398, y=1936–1986；card-number-plaque x=410–614, y=1936–1986。
18. 卡號必須是 Canonical Registry 的四碼值；Review 識別碼不得冒充正式 `UR-####`。
19. 不得加入官方 Logo、仿官方 Logo、浮水印、星級、能力值、技能值或屬性欄。
20. 最終輸出為 1024 × 2000 px PNG。
21. 未具授權證據時，輸出狀態只能為 Review，不得標記 Approved，也不得分配正式 UR 卡號。
22. 注音不得來自圖片模型、OCR 或人工目測轉錄；只能來自已驗證結構化資料。
```

## 7. 統一負面提示語

```text
禁止錯字、簡體字、假注音、漢語拼音、羅馬拼音、平假名、片假名、片假名擴充、半形片假名、日文音節、亂碼、重複文字、五字成語、缺字或多字。
禁止把成語典故改寫成聯名角色劇情，禁止虛構來源、偽造古籍引文或猜測授權狀態。
禁止難度徽章、難度字母、星級、能力值、技能值、屬性欄、額外聯名標籤、底部角色名稱、官方 Logo、仿官方 Logo 或浮水印。
禁止圖片模型生成卡號、三碼卡號、錯誤稀有度前綴、未授權 UR 正式號、第二組卡號或額外卡號牌匾。
禁止改變 Header、Main Artwork、Footer 的 360／1200／440 高度，禁止壓縮 Footer、拉長 Header、拉伸 artwork、移動 UR 徽章、改變聯名標籤比例或移動主題徽章與箴言牌匾。
禁止一次生成多張卡、拼圖、展示牆、桌面 Mockup、手持卡片、包裝盒或傾斜透視。
```

## 8. 炭治郎 Review 示範資料

```text
CARD_NUMBER = REVIEW-KIMETSU-TANJIRO-0001
IDIOM = 百折不撓
ZHUYIN = ㄅㄞˇ ㄓㄜˊ ㄅㄨˋ ㄋㄠˊ
SPIRIT_LINE = 屢敗不餒，終能成功。
IP_NAME = 鬼滅之刃
CHARACTER_NAME = 竈門炭治郎
THEME_CATEGORY = perseverance／勵志
LICENSE_EVIDENCE_ID = null
IDIOM_MEANING = 形容意志堅強，即使屢遭挫折，也不屈服退縮。
IDIOM_STORY = 使用經校訂的成語原始典故，不得改寫成鬼滅之刃劇情。
SOURCE = 經來源校訂後填入；未確認前標記 NeedsReview。
MAXIM_RIGHT = 百折不回，
MAXIM_CENTER = 初心不改；
MAXIM_LEFT = 終見光明。
SCENE_DESCRIPTION = 竈門炭治郎在月夜戰場揮舞日輪刀，以持續迎戰與堅毅神情呈現百折不撓精神，右上保留聯名標籤安全區。
CHARACTER_EFFECT = 水之呼吸形成具有方向性的水流刀勢，不包含文字或 Logo。
```

此示範沒有授權證據，因此使用 Review 識別碼，不占用 `UR-0001`。正式授權通過後，才由 Canonical Registry 分配下一個可用的四碼 UR 卡號。

## 9. 完成條件

只有在下列證據全部存在時，才能宣稱正式交付：

- artwork 實際尺寸與 SHA-256
- composite 實際尺寸與 geometry manifest
- Drive File ID
- Approved component Asset ID
- Canonical Registry 四碼卡號
- 正確注音與來源校訂
- 可稽核正式授權證據
- 獨立人工核准紀錄
- Manifest、Registry 與 current-batch state 已同步