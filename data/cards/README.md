# 成語圖卡資料入口

產製圖卡前必讀：

1. `card-number-registry.json`
2. `chapter-1-card-catalog.seed.csv`
3. `chapter-1-card-catalog-control-center.json`
4. `chapter-1-card-number-registry.json`
5. `../../docs/superpowers/specs/2026-08-08-project-wide-four-digit-card-numbering-design.md`
6. `../../docs/superpowers/specs/2026-08-07-chapter-one-card-catalog-design.md`
7. `../../docs/superpowers/specs/2026-08-06-idiom-card-modularization-design.md`

建立完整 JSON 與驗證：

```bash
npm run build:card-catalog
npm run test:card-catalog
```

不得自行更改單卡的稀有度、專屬外框、難易度、類別、主要角色性別、文案、完整提示語或正式卡號。需要調整時，先修改 Canonical Registry／seed／規格與測試，並同步 Google Sheet `Card_Catalog`。

## 全專案四碼稀有度卡號

正式卡號以 `card-number-registry.json` 為唯一真實來源，各稀有度在全專案內獨立累加：

```text
N-0001、N-0002……
R-0001、R-0002……
SR-0001、SR-0002……
SSR-0001、SSR-0002……
UR-0001、UR-0002……
```

- 格式固定為 `{rarity}-{sequence:0000}`。
- scope 固定為 `project-wide-per-rarity`；新章節不得歸零。
- `chapter-1-card-number-registry.json` 只是第一章相容投影，不得獨立指派號碼。
- 卡號指派後不得因重製、換圖、審核狀態、Drive 搬移或版本升級而改變。
- 正式卡退休或下架後號碼永久保留，不回收、不補洞。
- 稀有度變更時，舊號標記 retired，新稀有度由自己的序列分配新號。
- 圖片模型不得生成或猜測卡號；Renderer 只能從 Canonical Registry 讀取 `cardNumber`。
- 每張 N／R／SR／SSR／UR composite 的最下方中央固定顯示唯一的 `bottom-center card-number-plaque = {{CARD_NUMBER}}`。
- UR 未取得可稽核正式授權前只可使用 Review 識別碼，不得占用 `UR-####` 正式序列。

第一章既有 61 張卡只增加一個前導零，數值與排序不變：

```text
N-001   → N-0001
R-018   → R-0018
SR-023  → SR-0023
SSR-008 → SSR-0008
```

女性主要角色需同時滿足全章及每批至少 50%。SSR 必須使用專屬彩虹外框，且中央主圖符合 epic／grand／heroic／high-VFX 史詩感 Gate。

目前 61 張卡皆為 Draft，注音、拼音、來源與授權仍待正式校訂，不得加入 Approved 卡池。