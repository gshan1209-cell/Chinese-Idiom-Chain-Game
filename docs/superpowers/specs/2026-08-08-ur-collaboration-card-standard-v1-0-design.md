# UR 聯名成語圖卡標準 v1.2

狀態：Approved Design Standard  
日期：2026-08-08  
適用範圍：外部 IP 聯名 UR 成語圖卡之內容設計、Review 產製、模板組裝與審核  
幾何基準：`v2.6.1`，但本文件明列的 UR 專屬 Footer 規則優先

## 1. 定位與授權 Gate

UR 僅供外部 IP 聯名成語卡使用。正式 `Approved`、公開發布、商店素材、正式收藏與 `UR-####` 卡號，必須具有可稽核正式授權證據。

沒有授權證據時：

- 只允許產製 Draft／Review。
- 不得占用正式 `UR-####`。
- 不得移入 Drive Approved。
- 不得宣稱官方合作、正式授權或可公開商用。
- IP Logo、角色名稱與角色形象只能存在於受治理的 Review 素材，並維持 `licenseEvidenceStatus = missing` 或 `NeedsReview`。

UR 卡固定採 modular workflow：

```text
illustration-only artwork
+ Approved／Review UR components
+ IP-specific collaboration label
+ structured idiom data
+ deterministic render plan
= Review／Approved composite PNG
```

圖片模型不得直接生成 canonical 完整卡面。

## 2. 固定畫布與三區

```text
Canvas       x=0, y=0,    width=1024, height=2000
Header       x=0, y=0,    width=1024, height=360
Main Artwork x=0, y=360,  width=1024, height=1200
Footer       x=0, y=1560, width=1024, height=440
```

規則：

- 所有固定元件座標、寬高與間距誤差不得超過 `±2 px`。
- 不得因 UR、角色插畫、聯名標籤或霓虹 Overlay 改變三區高度。
- 不得壓縮 Footer、拉伸畫布、縮小 Main Artwork 或觸發 reflow。
- UR 專屬箴言牌匾高度依本文件第 8 節覆寫一般卡規格。

## 3. UR 專屬外框與稀有度徽章

### 3.1 全畫布虹彩霓虹外框

UR 必須使用 current Approved 的全畫布虹彩霓虹 Overlay：

```text
x=0
y=0
width=1024
height=2000
layer=top overlay
```

視覺要求：

- 外框具青綠、青藍、紫、洋紅、紅、橙金等連續虹彩光帶。
- 四角與邊線具有清楚霓虹包框與收藏卡級發光效果。
- 霓虹只能作為 Overlay，不得推動、縮放或重新排版內部內容。
- 不得把主題徽章、典故區、箴言牌匾與聯名標籤整體染成虹彩。
- 不得遮蔽角色臉部、成語主標題、注音、來源或 Review 標記。

### 3.2 UR 虹彩龍紋徽章

左上稀有度徽章固定使用 current Approved UR 母件：

```text
x=24–252
y=18–326
width=228
height=308
```

必備特徵：

- 立體金屬浮雕。
- 龍紋或同級史詩圖騰。
- 金色立體外框。
- UR 字樣具有七彩虹彩反光、寶石光澤與明確景深。
- 視覺層級必須高於 SSR，但不得侵入主標題與 Main Artwork 安全區。

圖片模型不得自行重畫 UR 徽章。

## 4. Header 固定內容

```text
rarity badge       x=24–252,   y=18–326
四字主標題         x=250–788,  y=42–158
四組注音           x=278–756,  y=166–232
成語精神短句       x=258–782,  y=254–330
collaboration tag  x=792–1000, y=24–318
```

固定規則：

- 中上只顯示一個四字繁體中文成語。
- 主標題下顯示四組逐字對齊的臺灣正體注音。
- 注音下顯示單行精神短句。
- UR 不顯示難度徽章；原 difficulty Bounding Box 改掛 IP 專屬聯名標籤。
- 卡面不得顯示漢語拼音、羅馬拼音、日文假名、簡體字或亂碼。

## 5. 成語與角色配對規則

使用者只指定 IP 與角色時，產製流程必須自動挑選最符合該角色核心性格、價值觀、行動模式或代表性能力的四字成語。

選擇順序：

1. 必須恰好四個繁體漢字。
2. 必須存在於啟用中的成語資料，或能以正式來源進入 `NeedsReview`。
3. 必須能由角色的一個清楚行動或情境表現。
4. 必須符合角色本質，不得只因畫面華麗、戰力高或人氣高而配對。
5. 必須保留成語自己的正式意義、典故與來源，不得改寫成 IP 劇情。
6. 必須避免與既有 UR 卡重複，除非另有核准的同成語異版規則。

範例：

```text
角色：胡蝶忍
角色職稱：蝶柱
候選成語：綿裡藏針
配對理由：外表溫和、言語柔婉，行動與用毒能力內藏鋒芒，符合柔中有剛、表柔內銳的核心特質。
```

此範例只確認角色配對方向；典故與來源仍須由正式成語資料校訂，不得依聊天內容或圖片文字直接核准。

## 6. IP 專屬聯名標籤

每個 IP 必須有獨立且可版本化的聯名標籤母件，不能只在通用牌匾上替換文字。

聯名標籤固定保留：

- IP 識別區。
- 角色職稱。
- 角色正式名稱。
- Review／Approved lifecycle 狀態所需的獨立標記。

鬼滅之刃角色版本固定結構：

```text
頂部：經授權或受治理 Review 的 IP Logo Asset
中段：角色職稱
下段：角色正式名稱
範例：蝶柱－胡蝶忍
```

永久規則：

- 不顯示「聯名卡」。
- 不顯示「角色名」「聯名限定」「限定版」等說明字樣。
- 必須保留 IP Logo 的指定位置與比例。
- IP Logo 必須來自 versioned Asset ID，圖片模型不得重畫、仿製或在 artwork 內生成。
- 沒有授權證據時，Logo 與標籤只能維持 Review，不得公開發布或標記 Approved。
- 卡片最底部不得再次顯示角色名稱或 IP 名稱。

## 7. Main Artwork

Canonical artwork 固定為：

```text
1024 × 1200 px
人物＋背景＋情境＋道具＋角色特效
no frame
no rarity badge
no collaboration tag
no theme badge
no title／Zhuyin／subtitle
no allusion／motto／source
no card number
no logo／watermark
```

角色必須以具體行動表現成語精神，不能只站立擺姿勢。角色外觀、服裝、武器、髮型、代表色、性格與特效必須符合已核准的角色設定與授權素材。

安全區：

```text
人物與主要動作：x=96–928, y=430–1390
重要頭部不得進入 y<420
重要手部、武器與道具不得進入 y>1470
右上聯名標籤區不得放置臉部或主要武器
```

## 8. UR Footer 專屬版型

### 8.1 固定元件

```text
九大主題徽章 x=28–300,  y=1576–1920, width=272, height=344
典故區         x=286–724, y=1582–1920, width=438, height=338
箴言牌匾       x=730–988, y=1722–1922, width=258, height=200
典故來源列     x=178–398, y=1936–1986, width=220, height=50
卡號牌匾       x=410–614, y=1936–1986, width=204, height=50
```

UR 箴言牌匾 `258 × 200 px` 是本文件核准的專屬覆寫，取代一般卡 `258 × 352 px` 箴言牌匾；其底部與典故區底部維持視覺對齊，且不得侵入來源列或卡號牌匾。

### 8.2 主題徽章

- 左下只能使用 `data/cards/theme-badge-registry.json` 的 current Approved 九大主題徽章。
- `themeCategory` 必須依成語本身判定，不得依角色職稱或 IP 陣營判定。
- 同一主題必須使用相同 Asset ID，不得由圖片模型重畫或改色。

### 8.3 典故區

典故區只顯示：

1. `典故` 標題。
2. 成語原本的典故內容。
3. 校訂後的正式來源。

不得顯示：

- `本義` 標題。
- 本義段落。
- 角色劇情。
- IP 世界觀改寫。
- 模型虛構古籍、人物或引文。

`idiomMeaning` 可保留於資料層與內容校訂流程，但 UR 卡面 Footer 不渲染本義。

### 8.4 五言絕句箴言

UR 箴言固定為四欄直式、由右至左閱讀：

```text
motto[0] = 最右欄，5 個繁體漢字
motto[1] = 次右欄，5 個繁體漢字
motto[2] = 次左欄，5 個繁體漢字
motto[3] = 最左欄，5 個繁體漢字
總計     = 20 個繁體漢字
```

規則：

- 每句恰好五個漢字。
- 固定四句，共二十個漢字。
- 卡面不加行內標點，避免破壞五字計數與直式節奏。
- 牌匾內應均衡填滿，不得保留大面積空白。
- 不得改成三欄、橫排、六字句或自由詩。
- 文案必須呼應角色與成語精神，但不得冒充成語典故。

胡蝶忍 Review 範例：

```text
笑裡藏鋒芒
蝶影巡幽夜
柔羽掩寒針
一刃斬魍魎
```

範例文案仍需獨立文字審核，不構成 IP 授權證據。

## 9. 結構化資料

每張 UR 卡至少保存：

```text
cardNumber
reviewIdentifier
idiom
bopomofo[4]
subtitle
rarity = UR
licensedIpId
licenseEvidenceStatus
ipLogoAssetId
collaborationLabelAssetId
characterId
characterTitle
characterDisplayName
themeCategory
themeBadgeAssetId
idiomMeaning
allusionSummary
source
sourceStatus
motto[4]
artworkAssetId
layoutVersion = 2.6.1
urStandardVersion = 1.2
componentSetVersion
renderMode = modular
artworkStatus
compositionStatus
```

來源、授權、Drive File ID、SHA-256、Asset ID 或獨立核准證據不足時，欄位保持 `null`／`NeedsReview`，不得猜測。

## 10. 臺灣注音永久 Gate

### 10.1 資料規則

- 四字成語必須恰好有四筆非空 `bopomofo[4]`。
- 四筆注音必須與四個漢字逐字對齊。
- 注音只能來自已校訂的結構化成語資料。
- 圖片模型、OCR、日文讀音、人工目測猜測均不得成為核准來源。
- 漢語拼音可以保留於資料層，但不得渲染於卡面。

### 10.2 字元白名單

每筆注音只允許：

```text
Bopomofo       U+3105–U+312F
輕聲           U+02D9
二聲           U+02CA
三聲           U+02C7
四聲           U+02CB
```

### 10.3 Blocking failure

以下任一內容都是 Blocking failure：

```text
平假名         U+3040–U+309F
片假名         U+30A0–U+30FF
片假名擴充     U+31F0–U+31FF
半形片假名     U+FF65–U+FF9F
拉丁字母、漢語拼音、羅馬拼音、漢字、裝飾符號、近似假字或亂碼
```

Finding code：

```text
日文假名：japanese-kana-in-bopomofo
其他錯誤：invalid-bopomofo
```

注音 Gate 失敗時：

```text
compositionStatus = changes-requested 或 blocked
approvalStatus    = 不得為 Approved
```

## 11. 卡號與 Review identifier

正式卡號唯一來源：

```text
data/cards/card-number-registry.json
```

正式格式：

```text
UR-0001
UR-0002
UR-0003
```

規則：

- UR 使用全專案獨立四碼序列，章節、IP、角色與批次都不得歸零。
- 正式號碼一經指派或退役，不得改寫或重用。
- 沒有可稽核授權時，只能顯示不占正式序列的 Review identifier。
- `RV-UR-####`、`UR-REVIEW-####` 等 Review 格式必須由受治理狀態檔或 Registry 提供，不得由圖片模型自行產生。
- Review identifier 不得冒充正式 `UR-####`。
- 卡面底部只顯示一個卡號或 Review identifier 牌匾。

## 12. 審核 Gate

### Artwork Gate

- 恰為 `1024 × 1200 px`。
- 無文字、卡框、徽章、標籤、Logo、卡號或浮水印。
- 單一主要角色，以行動表現成語。
- 角色與核准設定一致。
- 通過 safe-crop 與人體結構檢查。

### Composition Gate

- 恰為 `1024 × 2000 px`。
- `360／1200／440` 三區固定。
- 所有 Bounding Box 誤差不超過 `±2 px`。
- 全框使用 Approved UR 虹彩霓虹 Overlay。
- 左上使用 Approved 立體虹彩 UR 徽章。
- 主標題恰為四字成語。
- 注音為四筆正確臺灣注音，不含日文或拼音。
- 右上聯名標籤保留 IP Logo，並顯示角色職稱與角色名，不顯示「聯名卡」。
- 主題徽章 Asset ID 與 Registry 一致。
- 典故區只顯示成語典故與來源，不顯示本義。
- 箴言牌匾恰為 `258 × 200 px`。
- 箴言為四欄直式、每欄五字、共二十字。
- 最底部沒有重複角色名稱或第二組卡號。
- Overlay 無 reflow、遮蔽或錯誤染色。
- 有可稽核授權證據後才可 Approved。

任一 Blocking Gate 失敗，狀態必須為 `changes-requested` 或 `blocked`。

## 13. 胡蝶忍 Review 版型實例

```text
IP：鬼滅之刃
角色職稱：蝶柱
角色：胡蝶忍
成語：綿裡藏針
精神短句：笑裡藏鋒，柔中帶刃。
主題：依正式成語資料判定；目前 Review 候選為智謀
聯名標籤：保留 IP Logo／蝶柱／胡蝶忍
典故區：只顯示正式典故與來源
箴言：四句五言，共二十字
卡號：未授權時只使用受治理 Review identifier
```

此實例只作內容編排、角色配對與模板位置基準，不構成授權、來源核准、Approved Asset 或正式卡號證據。

## 14. 永久禁止事項

- 禁止讓圖片模型生成完整卡面。
- 禁止使用五字以上或非四字成語當主標題。
- 禁止日文假名、漢語拼音、羅馬拼音或假注音。
- 禁止把角色故事當成成語典故。
- 禁止在典故區顯示本義。
- 禁止三欄箴言或超過 200 px 的 UR 箴言牌匾。
- 禁止聯名標籤顯示「聯名卡」。
- 禁止移除 IP Logo 後只留通用文字牌。
- 禁止未授權卡占用正式 `UR-####`。
- 禁止圖片模型自行生成卡號、Logo、UR 徽章、主題徽章或聯名標籤。
