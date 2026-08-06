# CICG 成語圖卡 SSR v2.8 虹彩外框增補規格

狀態：Approved  
日期：2026-08-06  
適用範圍：所有新產 SSR 成語圖卡 Composite

## 1. 目的

v2.8 在不改變 v2.6 固定幾何與 v2.7 傳奇金龍 SSR 徽章的前提下，新增 SSR 專屬虹彩霓虹外框，使 SSR 在整張卡片的第一眼辨識度明顯高於 SR。

本規格只覆寫 SSR Composite 的外框視覺。稀有度語義、難易度、中央 artwork、典故、主題徽章、箴言與來源仍由既有規格控制。

## 2. 固定幾何

```text
Canvas：1024 × 2000 px
Header：y = 0–359，360 px
Main artwork：y = 360–1559，1200 px
Footer：y = 1560–1999，440 px
```

不得以縮短中央主圖、擠壓 Footer 或改回 2:3 來容納外框。

## 3. SSR v2.8 外框標準

SSR Composite 必須使用 `frame-ssr-v2.8-rainbow-neon`：

- 以黑金古典卡框為主體，保留四角金屬雕花與內外雙層金線。
- 沿外框內緣加入連續但節制的虹彩霓虹光帶。
- 建議色序為青藍、電藍、紫、洋紅與少量翠綠，形成環繞式高階能量感。
- 上緣與左右側光帶可較明顯；下緣需避開典故來源，確保小字可讀。
- 四角與中央頂飾可增加短距離光暈，但不得形成大面積白色爆光。
- 外框仍必須保有傳統金屬雕花，不得改成純科幻矩形燈管。

## 4. SSR 徽章

左上仍使用 v2.7 核准的 `rarity-ssr-v2.7`：

- 完整金龍環抱大型立體金色 `SSR`。
- 紫、藍、洋紅星雲核心。
- 下端紫色菱形主寶石。
- 必須在輪廓、材質、光效與主寶石上明顯高於 SR。

v2.8 不重新定義稀有度徽章，不得以外框取代或縮小 SSR 徽章。

## 5. 顏色污染限制

v2.8 允許虹彩出現在外框光帶與極近距離光暈，但仍禁止：

- 把中央 artwork 全面染成虹彩或霓虹色。
- 把難易度徽章改成 SSR 虹彩；難易度維持自己的 E／D／C／B／A／S 色系。
- 把典故區、主題徽章、箴言牌匾或來源列全面染色。
- 讓光帶穿過主標、注音、拼音、副標、典故或箴言文字。
- 因過曝而降低手機尺寸下的文字可讀性。

## 6. 元件化要求

```text
rarityBadgeId: rarity-ssr-v2.7
frameId: frame-ssr-v2.8-rainbow-neon
difficultyBadgeId: difficulty-badge-v1.0
renderMode: modular
```

- 外框、稀有度徽章、難易度徽章與 artwork 必須保持獨立元件。
- 套用 v2.8 外框不得改變 `artworkAssetId` 或 artwork SHA-256。
- N／R／SR 不得使用 `frame-ssr-v2.8-rainbow-neon`。
- Approved Composite PNG 是 derived artifact，不得成為唯一 canonical source。

## 7. 發音與內容結構

Header 仍固定為：

1. 四字繁體中文成語主標。
2. 主標下方第一列：四組逐字對齊注音。
3. 第二列：小寫、帶聲調符號的漢語拼音。
4. 拼音下方：一句白話副標。
5. 左上：SSR v2.7 徽章。
6. 右上：獨立難易度徽章，中文名稱在上、英文字母在下。

Footer 仍固定包含：完整主題徽章、「典故」、精簡摘要、右下窄版直式箴言牌匾及最下方單行典故來源。

## 8. 核准模板證據

```text
File：CICG_CardTemplate_Rarity_SSR_v2.8_Approved.png
Drive File ID：1_PR-_mZXBkf7WJxXwq83AjaOvWpUJwbz
Dimensions：1024 × 2000 px
Header：360 px
Main artwork：1200 px
Footer：440 px
File size：3,480,599 bytes
SHA-256：8bf608d7ba64b1efe787b8f6e0939c55a7d7623d5d9a791e5a260a144a9b328e
```

## 9. 覆寫關係

- v2.8 覆寫 v2.7 中「虹彩只限左上徽章」的外框限制。
- v2.7 的傳奇金龍 SSR 徽章標準仍有效。
- v2.6 的尺寸、座標、注音與拼音規則仍有效。
- v2.1 的典故、主題徽章與低高度直式箴言結構仍有效。
- 稀有度判定仍依正面意義與精神象徵，不得因使用 v2.8 外框而把非 SSR 成語升級為 SSR。

## 10. Blocking Gate

下列任一情況為 Blocking failure：

- SSR 新卡未使用 v2.8 虹彩外框。
- 中央主圖不是 1200 px。
- N／R／SR 使用 SSR v2.8 外框。
- 外框虹彩遮擋文字或污染中央 artwork。
- 難易度徽章被改成稀有度配色，或與 SSR 徽章混為同一欄位。
- 只修改 Composite PNG，卻未保留可替換的 frame component 與 artwork 來源。
