# 成語圖卡資料入口

產製第一章圖卡前必讀：

1. `chapter-1-card-catalog.seed.csv`
2. `chapter-1-card-catalog-control-center.json`
3. `../../docs/superpowers/specs/2026-08-07-chapter-one-card-catalog-design.md`
4. `../../docs/superpowers/specs/2026-08-06-idiom-card-modularization-design.md`

建立完整 JSON 與驗證：

```bash
npm run build:card-catalog
npm run test:card-catalog
```

不得自行更改單卡的稀有度、專屬外框、難易度、類別、主要角色性別、文案或完整提示語。需要調整時，先修改 seed／規格與測試，並同步 Google Sheet `Card_Catalog`。

女性主要角色需同時滿足全章及每批至少 50%。SSR 必須使用專屬彩虹外框，且中央主圖符合 epic／grand／heroic／high-VFX 史詩感 Gate。

目前 61 張卡皆為 Draft，注音、拼音、來源與授權仍待正式校訂，不得加入 Approved 卡池。