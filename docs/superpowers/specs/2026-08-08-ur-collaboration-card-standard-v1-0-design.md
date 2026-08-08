# UR 聯名成語圖卡標準 v1.0

狀態：Approved Design Standard  
日期：2026-08-08  
適用範圍：正式授權外部 IP 聯名 UR 成語圖卡  
幾何基準：`v2.6.1`

## 1. 定位

UR 僅供具有可稽核正式授權證據的外部 IP 聯名卡使用。未具授權證據時，任何 UR 圖像與 Composite 只能維持 Draft／Review，不得進入 Approved、正式卡池、商店素材或公開發布流程。

UR 卡延續 modular workflow：

```text
illustration-only artwork
+ Approved UR components
+ IP-specific collaboration label
+ structured idiom data
+ deterministic v2.6.1 render plan
= Review／Approved composite PNG
```

圖片模型不得直接生成 canonical 完整卡面。

## 2. 固定幾何

```text
Canvas       x=0, y=0,    width=1024, height=2000
Header       x=0, y=0,    width=1024, height=360
Main Artwork x=0, y=360,  width=1024, height=1200
Footer       x=0, y=1560, width=1024, height=440
```

所有固定元件座標、寬高與間距誤差不得超過 `±2 px`。不得因 UR、聯名標籤、角色插畫或 Overlay 改變三區高度、壓縮 Footer、拉伸畫布或觸發 reflow。

## 3. Header

- 左上：Approved UR 虹彩龍紋稀有度徽章。
- 中上：四字繁體中文成語主標題。
- 主標題下：四組逐字對齊的正確臺灣注音。
- 注音下：單行成語精神短句。
- 右上：該 IP 專屬聯名標籤。
- UR 卡省略難度徽章；原 difficulty Bounding Box 改掛聯名標籤。
- 卡面不得顯示漢語拼音、羅馬拼音、日文假名或亂碼。

UR 專屬 Header Bounding Box：

```text
rarity badge       x=24–252,   y=18–326
四字主標題         x=250–788,  y=42–158
四組注音           x=278–756,  y=166–232
成語精神短句       x=258–782,  y=254–330
collaboration tag  x=792–1000, y=24–318
```

## 4. IP 專屬聯名標籤

每個外部 IP 必須有獨立且可版本化的專屬標籤母件，不得共用一個通用聯名標籤後只換文字。

鬼滅之刃標籤母件固定特徵：

- 黑色漆面中央底板。
- 古金色立體雕花框。
- 頂部紅色寶石。
- 紫藤花、紫藤藤蔓與月霧裝飾。
- 底部藍色寶石與尖形收尾。
- 上段直式文字：`鬼滅之刃`。
- 下段獨立小牌：角色正式名稱。

不得加入：

- `聯名限定`
- `角色名`
- `限定版`
- `UR`
- 官方 Logo 或仿官方 Logo
- 卡片最底部重複角色名稱

標籤必須由 Approved 透明元件疊加，圖片模型不得在 artwork 中繪製或重設計。

## 5. Main Artwork

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
no logo／watermark
```

角色必須以具體行動表現成語精神，不能只站立擺姿勢。角色外觀、服裝、武器、髮型、代表色與性格須符合已核准的角色設定與授權素材。

安全區：

```text
人物與主要動作：x=96–928, y=430–1390
重要頭部不得進入 y<420
重要手部、武器與道具不得進入 y>1470
右上聯名標籤區不得放置臉部或主要武器
```

## 6. Footer

```text
九大主題徽章 x=28–300,  y=1576–1920
典故區         x=286–724, y=1582–1920
箴言牌匾       x=730–988, y=1570–1922
典故來源列     x=178–846, y=1936–1986
```

- 左下只能使用 `data/cards/theme-badge-registry.json` 的九大 Approved 主題徽章。
- 典故區只描述成語原本本義、典故與正式來源，不得改寫成聯名角色劇情。
- 典故標題固定為 `典故`。
- 右下箴言固定三欄直式、由右至左閱讀，每欄一句並保留標點。
- 最底部不得再次顯示角色名稱、聯名名稱或額外卡號。

## 7. UR Overlay

UR 使用 Approved 全畫布虹彩霓虹 Overlay：

```text
x=0
y=0
width=1024
height=2000
layer=top overlay
```

Overlay 只能覆蓋，不能：

- 改變任何元件 Bounding Box。
- 縮小內容或增加畫布高度。
- 改變 Header／Artwork／Footer 高度。
- 重新著色主題徽章、典故區或箴言牌匾。
- 遮蔽角色臉部、主標題、注音或來源。

## 8. 結構化資料

每張 UR 卡至少保存：

```text
cardNumber
idiom
bopomofo[4]
subtitle
rarity = UR
licensedIpId
licenseEvidenceStatus
collaborationLabelAssetId
characterId
characterDisplayName
themeCategory
themeBadgeAssetId
idiomMeaning
allusionSummary
source
sourceStatus
motto[3]
artworkAssetId
layoutVersion = 2.6.1
componentSetVersion
renderMode = modular
artworkStatus
compositionStatus
```

來源、授權、Drive File ID、SHA-256 或獨立核准證據不足時，對應欄位保持 `null`／`NeedsReview`，不得猜測。

## 9. 審核 Gate

### Artwork Gate

- 恰為 `1024 × 1200 px`。
- 無文字、卡框、徽章、標籤、Logo 或浮水印。
- 單一主要角色，以行動表現成語。
- 角色與授權設定一致。
- 通過 safe-crop 與人體結構檢查。

### Composition Gate

- 恰為 `1024 × 2000 px`。
- `360／1200／440` 三區固定。
- 所有 Bounding Box 誤差不超過 `±2 px`。
- 只顯示繁體中文與正確注音。
- UR 無難度徽章；右上為正確 IP 專屬聯名標籤。
- 主題徽章 Asset ID 與 Registry 一致。
- 典故屬於成語本身，來源已校訂。
- 最底部沒有重複角色名稱。
- Overlay 無 reflow、遮蔽或錯誤染色。
- 有可稽核授權證據後才可 Approved。

任一 Blocking Gate 失敗，狀態必須為 `changes-requested` 或 `blocked`。

## 10. 首個已核准版型實例

鬼滅之刃 UR 聯名卡版型：

```text
成語：百折不撓
角色：竈門炭治郎
主題：勵志
聯名標籤：鬼滅之刃／竈門炭治郎
卡面底部：不得再顯示角色名稱
```

此實例只作內容編排與標籤位置基準，不構成授權證據，也不得直接作為 canonical component 或 artwork source。