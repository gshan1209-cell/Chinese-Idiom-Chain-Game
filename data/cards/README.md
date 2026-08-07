# 成語圖卡資料入口

產製第一章圖卡前必讀：

1. `chapter-1-card-catalog.seed.csv`
2. `chapter-1-card-catalog-control-center.json`
3. `chapter-1-card-number-registry.json`
4. `../../docs/superpowers/specs/2026-08-07-chapter-one-card-catalog-design.md`
5. `../../docs/superpowers/specs/2026-08-06-idiom-card-modularization-design.md`

建立完整 JSON 與驗證：

```bash
npm run build:card-catalog
npm run test:card-catalog
```

不得自行更改單卡的稀有度、專屬外框、難易度、類別、主要角色性別、文案、完整提示語或正式卡號。需要調整時，先修改 Registry／seed／規格與測試，並同步 Google Sheet `Card_Catalog`。

## 稀有度卡號

第一章正式卡號依 `catalogOrder` 在各稀有度內獨立累加：

```text
N-001   ～ N-012
R-001   ～ R-018
SR-001  ～ SR-023
SSR-001 ～ SSR-008
```

- 格式固定為 `{rarity}-{sequence:000}`。
- 卡號以 `chapter-1-card-number-registry.json` 為準。
- 卡號指派後不得因重製、換圖、審核狀態、Drive 搬移或版本升級而改變。
- 非第一章 Card Catalog 的示範卡、測試卡與 Review 素材不占用正式序號；先完成 Catalog 納管後才能取得卡號。
- UR 保留給具可稽核正式授權的外部 IP 聯名，不得提前占號。

女性主要角色需同時滿足全章及每批至少 50%。SSR 必須使用專屬彩虹外框，且中央主圖符合 epic／grand／heroic／high-VFX 史詩感 Gate。

目前 61 張卡皆為 Draft，注音、拼音、來源與授權仍待正式校訂，不得加入 Approved 卡池。