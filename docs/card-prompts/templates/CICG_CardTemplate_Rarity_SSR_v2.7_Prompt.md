# CICG 稀有度元件模板：SSR v2.7／Modular v1.0

## 引用規則

- `../shared/card-master-prompt.md`
- `../shared/negative-constraints.md`
- `../../superpowers/specs/2026-08-06-card-template-v2.6-dimension-and-pronunciation-amendment.md`
- `../../superpowers/specs/2026-08-06-card-template-v2.7-ssr-badge-amendment.md`
- `../../superpowers/specs/2026-08-06-idiom-card-modularization-design.md`

## 模板資料

- rarity: SSR
- semanticRule: high-positive-meaning-and-spiritual-symbolism
- renderMode: modular
- layoutVersion: 2.6
- rarityBadgeId: rarity-ssr-v2.7
- assetStatus: Approved
- compositeDimensions: 1024 × 2000 px
- artworkDimensions: 1024 × 1200 px
- headerHeight: 360 px
- mainArtworkHeight: 1200 px
- footerHeight: 440 px
- templateDriveFileId: 1NoNZ2muThkzA7k22TF5W5foAD1gq8VpV
- templateSha256: cf8f8cb9c6f3cac5f4a115bcbcf53fb57162842dcf34e48173b84f902dcbf785

## Canonical Artwork

先產生 `1024 × 1200 px` illustration-only artwork：

- 只包含人物、背景、情境、道具與光影。
- 不包含金龍徽章、卡框、難易度、主標、注音、拼音、典故、箴言或來源。
- Artwork 使用獨立 asset ID、Drive File ID、SHA-256、版本與審核狀態。

## SSR v2.7 可替換徽章元件

左上使用 `rarity-ssr-v2.7` 傳奇級虹彩金龍徽章：

- 完整金龍環抱 SSR 字樣。
- SSR 為大尺寸立體金字，具有暖金高光與深色陰影。
- 核心為紫、藍、洋紅星雲寶石光。
- 下端固定紫色菱形主寶石。
- 可加入金色火焰、羽翼或流線雕紋，但不得遮擋主標、注音或拼音。
- 必須在輪廓、材質、光效與主寶石上明顯高於 SR。

徽章是獨立 component，不得烙入 artwork。替換徽章版本時不得修改 artwork asset ID 或 checksum。

不得把外框、難易度框、主插圖、典故區、主題徽章或箴言牌匾全面染成虹彩。

## Composite 固定幾何

```text
Canvas：1024 × 2000 px
Header：y = 0–359，360 px
Main artwork：y = 360–1559，1200 px
Footer：y = 1560–1999，440 px
```

## 固定資訊結構

1. 左上：SSR v2.7 徽章 component。
2. 上方中央：四字繁體中文成語主標。
3. 主標下方第一列：四組逐字對齊注音。
4. 第二列：小寫、帶聲調符號的漢語拼音。
5. 拼音下方：一句白話副標。
6. 右上：難易度 component。
7. 中央：獨立 1024 × 1200 artwork。
8. 左下：固定主題徽章 component。
9. 中下：「典故」與精簡摘要。
10. 右下：窄版深色金框直式箴言牌匾 component。
11. 最下方：單行典故來源 data layer。

## 產製流程

```text
內容資料
→ illustration-only artwork
→ artwork 審核
→ rarity-ssr-v2.7 與其他 Approved components
→ renderer 組卡
→ Review composite
→ 獨立核准
```

Renderer 尚未完成時，可以先產 artwork 並把 composition 標記 `pending`／`blocked`；不得退回把所有欄位烙進 canonical artwork。

## 驗收清單

- [ ] Artwork 是獨立 `1024 × 1200 px` 來源。
- [ ] Artwork 沒有任何正式 UI 或文字欄位。
- [ ] Composite 恰為 1024 × 2000 px。
- [ ] Header／Artwork／Footer 為 360／1200／440 px。
- [ ] 左上為傳奇級虹彩金龍 SSR 徽章 component。
- [ ] SSR 與 SR 在輪廓、材質、星雲核心與紫色主寶石上明顯不同。
- [ ] 徽章未遮擋主標、注音、拼音或副標。
- [ ] 其餘卡面沒有被 SSR 虹彩色全面污染。
- [ ] 稀有度與難易度保持分離。
- [ ] 修改 difficulty 或徽章後 artwork ID 與 checksum 不變。
- [ ] 典故、直式箴言與來源皆存在。