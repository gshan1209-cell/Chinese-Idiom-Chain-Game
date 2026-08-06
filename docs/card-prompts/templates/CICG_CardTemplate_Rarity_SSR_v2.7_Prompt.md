# CICG 稀有度徽章模板：SSR v2.7

## 引用規則

- `../shared/card-master-prompt.md`
- `../shared/negative-constraints.md`
- `../../superpowers/specs/2026-08-06-card-template-v2.6-dimension-and-pronunciation-amendment.md`
- `../../superpowers/specs/2026-08-06-card-template-v2.7-ssr-badge-amendment.md`

## 模板資料

- rarity: SSR
- semanticRule: high-positive-meaning-and-spiritual-symbolism
- assetStatus: Approved
- dimensions: 1024 × 2000 px
- mainArtworkHeight: 1200 px
- driveFileId: 1NoNZ2muThkzA7k22TF5W5foAD1gq8VpV
- driveImageUrl: https://drive.google.com/file/d/1NoNZ2muThkzA7k22TF5W5foAD1gq8VpV/view
- sha256: 8e21a8b84aa21ad5ff457cfe31e1cd5adbca941fd1c2fbcaed830502a6294c59

## SSR 唯一視覺差異

左上使用「傳奇級虹彩金龍徽章」：

- 完整金龍環抱 SSR 字樣。
- SSR 為大尺寸立體金字，具有暖金高光與深色陰影。
- 核心為紫、藍、洋紅星雲寶石光。
- 下端固定一顆紫色菱形主寶石。
- 可加入金色火焰、羽翼或流線雕紋，但不得遮擋主標、注音或拼音。
- 必須在輪廓、材質、光效與主寶石上明顯高於 SR。

不得把外框、難易度框、主插圖、典故區、主題徽章或箴言牌匾全面染成虹彩。

## 固定幾何

```text
Canvas：1024 × 2000 px
Header：y = 0–359，360 px
Main artwork：y = 360–1559，1200 px
Footer：y = 1560–1999，440 px
```

## 固定資訊結構

1. 左上：SSR 傳奇級虹彩金龍徽章。
2. 上方中央：四字繁體中文成語主標。
3. 主標下方第一列：四組逐字對齊注音。
4. 第二列：小寫、帶聲調符號的漢語拼音。
5. 拼音下方：一句白話副標。
6. 右上：難易度與 E／D／C／B／A／S。
7. 中央：1200 px 人物情境主插圖。
8. 左下：固定主題徽章。
9. 中下：「典故」與精簡摘要。
10. 右下：窄版深色金框直式箴言牌匾。
11. 最下方：單行典故來源。

## 正式產圖提示語

生成一張 `1024 × 2000 px` 的 CICG SSR 成語卡牌。嚴格使用 v2.6 固定座標：上方資訊區 360 px、中央主圖區 1200 px、下方內容區 440 px。左上使用傳奇級虹彩金龍 SSR 徽章：完整金龍環抱大型立體金色 SSR 字樣，內部具有紫藍洋紅星雲寶石光，下端配置紫色菱形主寶石，金色火焰與流線雕紋形成高階輪廓；徽章必須明顯高於 SR，但不得遮擋主標、注音或拼音。上方中央放四字繁體中文成語，下一列放逐字對齊注音，再下一列放小寫帶聲調漢語拼音，之後放精簡白話副標。右上只顯示難易度。中央 1200 px 主插圖至少一名人物以動作、表情、道具與場景直接表達成語。左下保留固定主題徽章，中下只標「典故」，右下放低高度窄版深色金框直式箴言牌匾，最下方放單行典故來源。除左上 SSR 徽章外，外框、難易度框、主圖、典故區與主題徽章不得套用虹彩色系。

## 驗收清單

- [ ] 圖片尺寸恰為 1024 × 2000 px。
- [ ] 中央主圖實際高度為 1200 px。
- [ ] 左上為傳奇級虹彩金龍 SSR 徽章。
- [ ] SSR 與 SR 在輪廓、材質、星雲核心與紫色主寶石上明顯不同。
- [ ] 徽章未遮擋主標、注音、拼音或副標。
- [ ] 其餘卡面沒有被 SSR 虹彩色全面污染。
- [ ] 稀有度與難易度保持分離。
- [ ] 典故、直式箴言與來源皆存在。
