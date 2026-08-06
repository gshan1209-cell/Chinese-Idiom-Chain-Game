# CICG 稀有度元件模板：SSR v2.8／Modular v1.0

## 引用規則

- `../shared/card-master-prompt.md`
- `../shared/negative-constraints.md`
- `../../superpowers/specs/2026-08-06-card-template-v2.6-dimension-and-pronunciation-amendment.md`
- `../../superpowers/specs/2026-08-06-card-template-v2.7-ssr-badge-amendment.md`
- `../../superpowers/specs/2026-08-06-card-template-v2.8-ssr-rainbow-frame-amendment.md`
- `../../superpowers/specs/2026-08-06-idiom-card-modularization-design.md`

## 模板資料

- rarity: SSR
- semanticRule: high-positive-meaning-and-spiritual-symbolism
- renderMode: modular
- layoutVersion: 2.6
- visualVersion: 2.8
- rarityBadgeId: rarity-ssr-v2.7
- frameId: frame-ssr-v2.8-rainbow-neon
- difficultyBadgeId: difficulty-badge-v1.0
- assetStatus: Approved
- compositeDimensions: 1024 × 2000 px
- artworkDimensions: 1024 × 1200 px
- headerHeight: 360 px
- mainArtworkHeight: 1200 px
- footerHeight: 440 px
- templateDriveFileId: 1_PR-_mZXBkf7WJxXwq83AjaOvWpUJwbz
- templateSha256: 8bf608d7ba64b1efe787b8f6e0939c55a7d7623d5d9a791e5a260a144a9b328e

## Canonical Artwork

先產生 `1024 × 1200 px` illustration-only artwork：

- 只包含人物、背景、情境、道具與光影。
- 不包含金龍徽章、虹彩外框、難易度、主標、注音、拼音、典故、箴言或來源。
- Artwork 使用獨立 asset ID、Drive File ID、SHA-256、版本與審核狀態。

## SSR v2.7 徽章元件

左上使用 `rarity-ssr-v2.7`：

- 完整金龍環抱大型立體金色 `SSR`。
- 核心為紫、藍、洋紅星雲寶石光。
- 下端固定紫色菱形主寶石。
- 必須在輪廓、材質、光效與主寶石上明顯高於 SR。

## SSR v2.8 外框元件

使用 `frame-ssr-v2.8-rainbow-neon`：

- 黑金古典雕花框為主體。
- 外框內緣加入青藍、電藍、紫、洋紅與少量翠綠的連續虹彩光帶。
- 上緣與左右側光帶較明顯，下緣必須確保來源小字清晰。
- 四角與頂飾可有短距離光暈，不得大面積白色過曝。
- 虹彩只能存在於 frame component 與極近距離光暈，不得烙入 canonical artwork。

N／R／SR 不得使用此 frame component。

## Composite 固定幾何

```text
Canvas：1024 × 2000 px
Header：y = 0–359，360 px
Main artwork：y = 360–1559，1200 px
Footer：y = 1560–1999，440 px
```

## 固定資訊結構

1. 左上：SSR v2.7 傳奇金龍徽章 component。
2. 上方中央：四字繁體中文成語主標。
3. 主標下方第一列：四組逐字對齊注音。
4. 第二列：小寫、帶聲調符號的漢語拼音。
5. 拼音下方：一句白話副標。
6. 右上：獨立難易度 component；中文名稱在上、英文字母在下。
7. 中央：獨立 `1024 × 1200` artwork。
8. 外圍：SSR v2.8 虹彩霓虹 frame component。
9. 左下：固定主題徽章 component。
10. 中下：「典故」與精簡摘要。
11. 右下：窄版深色金框直式箴言牌匾 component。
12. 最下方：單行典故來源 data layer。

## 色彩限制

- 不得把中央 artwork 全面染成霓虹或虹彩。
- 不得把難易度徽章改成 SSR 配色。
- 不得把典故區、主題徽章、箴言牌匾或來源列全面染色。
- 不得讓外框光帶穿過主標、注音、拼音、副標、典故或箴言。
- 手機尺寸下所有正式文字必須清楚可讀。

## 產製流程

```text
內容資料
→ illustration-only artwork
→ artwork 審核
→ rarity-ssr-v2.7
→ frame-ssr-v2.8-rainbow-neon
→ difficulty-badge-v1.0 與其他 Approved components
→ renderer 組卡
→ Review composite
→ 獨立核准
```

Renderer 尚未完成時，可以先產 artwork 並把 composition 標記 `pending`／`blocked`；不得退回把所有欄位烙進 canonical artwork。

## 驗收清單

- [ ] Artwork 是獨立 `1024 × 1200 px` 來源。
- [ ] Artwork 沒有任何正式 UI 或文字欄位。
- [ ] Composite 恰為 `1024 × 2000 px`。
- [ ] Header／Artwork／Footer 為 `360／1200／440 px`。
- [ ] 左上為 v2.7 傳奇金龍 SSR 徽章。
- [ ] 外圍為 v2.8 黑金古典＋虹彩霓虹 frame。
- [ ] SSR 與 SR 在徽章及整體 frame 辨識上明顯不同。
- [ ] 虹彩未污染中央 artwork、難易度、典故、主題徽章或箴言。
- [ ] 難易度中文名稱與英文字母正確。
- [ ] 修改 difficulty、rarity badge 或 frame 後 artwork ID 與 checksum 不變。
- [ ] 典故、直式箴言與來源皆存在。
