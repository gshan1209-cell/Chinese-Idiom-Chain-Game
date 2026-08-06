# CICG Card Template — R v2.6／Modular v1.0

套用：

- `docs/superpowers/specs/2026-08-06-card-template-v2.6-dimension-and-pronunciation-amendment.md`
- `docs/superpowers/specs/2026-08-06-idiom-card-modularization-design.md`
- `docs/card-prompts/shared/card-master-prompt.md`
- `docs/card-prompts/shared/negative-constraints.md`

## Canonical Artwork

先產生 `1024 × 1200 px` illustration-only artwork。不得包含卡框、R 徽章、難易度、標題、注音、拼音、典故、箴言或來源。

## Composite

```text
Canvas：1024 × 2000 px
Header：360 px
Main artwork：1200 px
Footer：440 px
```

左上 `rarity-badge`：`R`，藍色寶石或金屬材質，適量局部光效。

其餘外框、難易度框、中央主圖、主題徽章、典故區、箴言牌匾與來源列不得因 R 稀有度改色。

主標下方依序顯示：

1. 四組逐字對齊注音橫列。
2. 四音節小寫、帶聲調漢語拼音橫列。
3. 白話副標。

R 表示具實用教育價值的一般稀有卡，不得以人物強弱或畫面華麗度自行升級。

更換難易度、R 徽章版本或文字時，不得修改 artwork asset ID 或 checksum。