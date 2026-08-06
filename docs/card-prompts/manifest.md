# CICG 成語圖卡提示語 Manifest v2.8

- 提示語根目錄：`docs/card-prompts/`
- 目前標準模板資料夾：https://drive.google.com/drive/folders/1cH0KYWGvUT5ci57HW8JBFv3v-8uG51IC
- v2.5 Archive：https://drive.google.com/drive/folders/18BsnJPuh-nar6fdtob4vJcgIl5VlonFN
- Legacy 備份根目錄：https://drive.google.com/drive/folders/1estQ2VP1tbQLI2VNbS3V2FvpDICjbOGO
- Legacy 圖片總數：62 張，全部以原始 PNG 逐檔保存，不使用 ZIP 或其他壓縮檔取代原圖。
- Legacy 說明文件：https://drive.google.com/file/d/1LavS5cnyE6T6Sur2KY0rG7Bgdcx9OGzq/view

## 固定幾何

```text
Canvas：1024 × 2000 px
Header：y = 0–359，360 px
Main artwork：y = 360–1559，1200 px
Footer：y = 1560–1999，440 px
```

主標下方第一列為逐字對齊注音；第二列為小寫、帶聲調符號的漢語拼音。

## v2.8 SSR Composite 標準

SSR 左上沿用 v2.7 傳奇級虹彩金龍徽章：完整金龍環抱大型立體金色 `SSR`，核心為紫、藍、洋紅星雲寶石光，下端配置紫色菱形主寶石。

SSR v2.8 新增 `frame-ssr-v2.8-rainbow-neon`：黑金古典雕花框保留，外框內緣加入青藍、電藍、紫、洋紅與少量翠綠的連續虹彩霓虹光帶。虹彩只允許存在於外框與極近距離光暈，不得污染中央 artwork、難易度徽章、典故、主題徽章、箴言或來源文字。

## 模板索引

| rarity | promptPath | driveImageUrl | assetStatus | dimensions | notes |
|---|---|---|---|---|---|
| N | `docs/card-prompts/templates/CICG_CardTemplate_Rarity_N_v2.1_Prompt.md` | https://drive.google.com/file/d/1SvFOcRz16rlWaxAf7u8fKl1JDAlPs-Sd/view | Approved | `1024 × 2000` | `CICG_CardTemplate_Rarity_N_v2.7_Approved.png`; Header `360 px`; Main `1200 px`; Footer `440 px`; flat visual reference，後續仍須抽離 modular components |
| R | `docs/card-prompts/templates/CICG_CardTemplate_Rarity_R_v2.1_Prompt.md` | https://drive.google.com/file/d/1lFaEbD2pxuLgDHwUa5bApEoe4GN07Mj2/view | Approved | `1024 × 2000` | `CICG_CardTemplate_Rarity_R_v2.7_Approved.png`; Header `360 px`; Main `1200 px`; Footer `440 px`; flat visual reference，後續仍須抽離 modular components |
| SR | `docs/card-prompts/templates/CICG_CardTemplate_Rarity_SR_v2.1_Prompt.md` | https://drive.google.com/file/d/1-sqXKjKTH9eLU8HwU7mvDCBFlEmDIt51/view | Approved | `1024 × 2000` | `CICG_CardTemplate_Rarity_SR_v2.7_Approved.png`; Header `360 px`; Main `1200 px`; Footer `440 px`; 不得使用 SSR v2.8 外框 |
| SSR | `docs/card-prompts/templates/CICG_CardTemplate_Rarity_SSR_v2.8_Prompt.md` | https://drive.google.com/file/d/1_PR-_mZXBkf7WJxXwq83AjaOvWpUJwbz/view | Approved | `1024 × 2000` | `CICG_CardTemplate_Rarity_SSR_v2.8_Approved.png`; Header `360 px`; Main `1200 px`; Footer `440 px`; size `3,480,599`; SHA-256 `8bf608d7ba64b1efe787b8f6e0939c55a7d7623d5d9a791e5a260a144a9b328e` |

v2.5 的 N／R／SR／SSR 模板均已移入 `90_Archive/Idiom_Cards/Templates_v2.5`。v2.6 與 v2.7 SSR 保留為歷史核准模板；新產 SSR 卡一律使用 v2.8 Composite 標準。

## 難易度標籤模板

| component | driveImageUrl | assetStatus | notes |
|---|---|---|---|
| E／D／C／B／A／S | https://drive.google.com/file/d/1azohQXFHLVP5scplRQuJa33h2pUU8qq4/view | Approved | `CICG_Difficulty_Badge_Template_E_to_S_v1.0_Approved.jpeg`; 中文名稱在上、英文字母在下；E 入門、D 基礎、C 普通、B 進階、A 困難、S 極限；與稀有度分離 |

## 成語圖卡索引

以下單卡 Prompt 檔名保留既有 v2.1 歷史版本，但產圖時必須套用 v2.6 全域尺寸與發音版面；SSR 新產圖檔名使用 `v2.8`，N／R／SR 使用其最新核准版本。

| idiom | rarity | difficulty | themeCategory | themeLabel | leadCharacter | promptPath | driveImageUrl | assetStatus | sourceStatus | notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 畫龍點睛 | SSR | A | arts | 文藝 | 女性畫師 | `docs/card-prompts/idioms/CICG_IdiomCard_畫龍點睛_SSR_A_v2.1_Prompt.md` | 待補 | Legacy | NeedsReview | 以 v2.8 SSR Composite 重製前完成來源、注音、拼音與文字校訂 |
| 胸有成竹 | SR | B | strategy | 智謀 | 男性文士 | `docs/card-prompts/idioms/CICG_IdiomCard_胸有成竹_SR_B_v2.1_Prompt.md` | 待補 | Legacy | NeedsReview | 以最新 SR 模板重製前完成來源、注音、拼音與文字校訂 |
| 守株待兔 | R | D | cautionary | 警世 | 男性農夫 | `docs/card-prompts/idioms/CICG_IdiomCard_守株待兔_R_D_v2.1_Prompt.md` | 待補 | Legacy | NeedsReview | 以最新 R 模板重製前完成來源、注音、拼音與文字校訂 |
| 畫蛇添足 | SR | C | cautionary | 警世 | 女性賓客 | `docs/card-prompts/idioms/CICG_IdiomCard_畫蛇添足_SR_C_v2.1_Prompt.md` | 待補 | Legacy | NeedsReview | 以最新 SR 模板重製前完成來源、注音、拼音與文字校訂 |
| 掩耳盜鈴 | R | C | cautionary | 警世 | 女性竊賊 | `docs/card-prompts/idioms/CICG_IdiomCard_掩耳盜鈴_R_C_v2.1_Prompt.md` | 待補 | Legacy | NeedsReview | 以最新 R 模板重製前完成來源、注音、拼音與文字校訂 |
| 刻舟求劍 | R | C | perspective | 見識 | 男性旅人 | `docs/card-prompts/idioms/CICG_IdiomCard_刻舟求劍_R_C_v2.1_Prompt.md` | 待補 | Legacy | NeedsReview | 以最新 R 模板重製前完成來源、注音、拼音與文字校訂 |
| 亡羊補牢 | SR | D | selfCultivation | 修身 | 女性牧人 | `docs/card-prompts/idioms/CICG_IdiomCard_亡羊補牢_SR_D_v2.1_Prompt.md` | 待補 | Legacy | NeedsReview | 以最新 SR 模板重製前完成來源、注音、拼音與文字校訂 |
| 對牛彈琴 | R | D | relationships | 人際 | 女性琴師 | `docs/card-prompts/idioms/CICG_IdiomCard_對牛彈琴_R_D_v2.1_Prompt.md` | 待補 | Legacy | NeedsReview | 以最新 R 模板重製前完成來源、注音、拼音與文字校訂 |
| 井底之蛙 | SR | C | perspective | 見識 | 女性旅者 | `docs/card-prompts/idioms/CICG_IdiomCard_井底之蛙_SR_C_v2.1_Prompt.md` | 待補 | Legacy | NeedsReview | 以最新 SR 模板重製前完成來源、注音、拼音與文字校訂 |
| 葉公好龍 | SR | B | cautionary | 警世 | 男性士人 | `docs/card-prompts/idioms/CICG_IdiomCard_葉公好龍_SR_B_v2.1_Prompt.md` | 待補 | Legacy | NeedsReview | 以最新 SR 模板重製前完成來源、注音、拼音與文字校訂 |
| 愚公移山 | SSR | B | perseverance | 勵志 | 老者與家人群像 | `docs/card-prompts/idioms/CICG_IdiomCard_愚公移山_SSR_B_v2.1_Prompt.md` | 待補 | Legacy | NeedsReview | v2.8 SSR 標準模板以本成語示範；正式單卡仍須獨立內容審核與 Review 檔名 |
| 破釜沉舟 | SSR | B | military | 軍事 | 男性將領與士兵群像 | `docs/card-prompts/idioms/CICG_IdiomCard_破釜沉舟_SSR_B_v2.1_Prompt.md` | 待補 | Legacy | NeedsReview | 以 v2.8 SSR Composite 重製前完成來源、注音、拼音與文字校訂 |
| 狐假虎威 | SR | C | strategy | 智謀 | 女性狐靈與猛虎 | `docs/card-prompts/idioms/CICG_IdiomCard_狐假虎威_SR_C_v2.1_Prompt.md` | 待補 | Legacy | NeedsReview | 以最新 SR 模板重製前完成來源、注音、拼音與文字校訂 |
| 自相矛盾 | SR | C | cautionary | 警世 | 女性商販 | `docs/card-prompts/idioms/CICG_IdiomCard_自相矛盾_SR_C_v2.1_Prompt.md` | 待補 | Legacy | NeedsReview | 以最新 SR 模板重製前完成來源、注音、拼音與文字校訂 |
| 水滴石穿 | SSR | B | perseverance | 勵志 | 女性修行者 | `docs/card-prompts/idioms/CICG_IdiomCard_水滴石穿_SSR_B_v2.1_Prompt.md` | 待補 | Legacy | NeedsReview | 以 v2.8 SSR Composite 重製前完成來源、注音、拼音與文字校訂 |
| 杯弓蛇影 | SR | B | cautionary | 警世 | 男性賓客 | `docs/card-prompts/idioms/CICG_IdiomCard_杯弓蛇影_SR_B_v2.1_Prompt.md` | 待補 | Legacy | NeedsReview | 以最新 SR 模板重製前完成來源、注音、拼音與文字校訂 |
| 盲人摸象 | SR | B | perspective | 見識 | 女性說書人與多人群像 | `docs/card-prompts/idioms/CICG_IdiomCard_盲人摸象_SR_B_v2.1_Prompt.md` | 待補 | Legacy | NeedsReview | 以最新 SR 模板重製前完成來源、注音、拼音與文字校訂 |
| 塞翁失馬 | SSR | B | perspective | 見識 | 老者與家人 | `docs/card-prompts/idioms/CICG_IdiomCard_塞翁失馬_SSR_B_v2.1_Prompt.md` | 待補 | Legacy | NeedsReview | 以 v2.8 SSR Composite 重製前完成來源、注音、拼音與文字校訂 |
| 一鳴驚人 | SSR | B | governance | 內政 | 男性君主 | `docs/card-prompts/idioms/CICG_IdiomCard_一鳴驚人_SSR_B_v2.1_Prompt.md` | 待補 | Legacy | NeedsReview | 以 v2.8 SSR Composite 重製前完成來源、注音、拼音與文字校訂 |
| 草木皆兵 | SSR | A | military | 軍事 | 男性敗軍將領 | `docs/card-prompts/idioms/CICG_IdiomCard_草木皆兵_SSR_A_v2.1_Prompt.md` | https://drive.google.com/file/d/16HD7CYyAJlQVlerR_h8DJkqkhgFwE4xh/view | Review | NeedsReview | 舊卡原圖已逐檔備份；正式發布前仍須依 v2.6 幾何與 v2.8 SSR Composite 重製及校訂 |
| 鶴立雞群 | SR | B | relationships | 人際 | 女性主角 | `docs/card-prompts/idioms/CICG_IdiomCard_鶴立雞群_SR_B_v2.1_Prompt.md` | 待補 | Legacy | NeedsReview | 以最新 SR 模板重製前完成來源、注音、拼音與文字校訂 |
| 望梅止渴 | SR | B | strategy | 智謀 | 男性統帥與疲憊士兵 | `docs/card-prompts/idioms/CICG_IdiomCard_望梅止渴_SR_B_v2.1_Prompt.md` | 待補 | Legacy | NeedsReview | 以最新 SR 模板重製前完成來源、注音、拼音與文字校訂 |

## Legacy 原圖素材備份

| collection | driveFolderUrl | pngCount | assetStatus | notes |
|---|---|---:|---|---|
| template-experiments | https://drive.google.com/drive/folders/15o4T3b-6ci2mm8wVHRAWFN73ny4VegYH | 59 | Legacy | `CICG_Legacy_Template_001.png` 至 `059.png`；全部為可直接預覽與下載的原始 PNG |
| idiom-card-drafts | https://drive.google.com/drive/folders/1sftr1bLMKrGk6tCccipE_Cb-Ijbt6Ot- | 1 | Review | `CICG_Legacy_IdiomCard_草木皆兵_001.png` 原始 PNG |
| badge-references | https://drive.google.com/drive/folders/1lVGaYqnWnROae-xNJsCFABpPOUDPjNWq | 2 | Legacy | `CICG_Legacy_BadgeReference_001.png`、`002.png` 原始 PNG |
| templates-v2.5 | https://drive.google.com/drive/folders/18BsnJPuh-nar6fdtob4vJcgIl5VlonFN | 4 | Archived | N／R／SR／SSR v2.5 原始 PNG；已被 v2.6 幾何標準取代 |

### 個別原圖連結

- 草木皆兵舊卡：https://drive.google.com/file/d/16HD7CYyAJlQVlerR_h8DJkqkhgFwE4xh/view
- 主題徽章參考 001：https://drive.google.com/file/d/1GAeZ-OhBzFK6WZWVoInqezJlDETUcILW/view
- 主題徽章參考 002：https://drive.google.com/file/d/1Y-rpWDqKMvjS96bWP5StAGOt21HcfeY0/view

## 素材保存規則

- 圖片須以原始 PNG 逐檔保存，禁止以 ZIP、RAR、7z 或其他壓縮封裝取代原圖。
- 原圖可以資料夾分類，但每張圖片必須能在 Drive 直接預覽與個別下載。
- 未核准圖片只標記 `Legacy` 或 `Review`，不得冒充目前正式成品。
- 新產正式圖卡必須實際驗證為 `1024 × 2000 px`，中央主圖區必須為 `1200 px`。
- 新產 SSR 必須通過 v2.8 虹彩外框 Gate 與 v2.7 傳奇金龍徽章 Gate。

## 發布限制

- 所有 22 張成語來源目前均為 `NeedsReview`。
- Legacy 與 Review 圖片只供構圖、版面、徽章與提示語參考，不是正式單卡成品。
- N／R／SR 的外框不得因稀有度全面變色；SSR v2.8 虹彩外框是唯一明確核准的例外。
- 難易度徽章、主圖、典故區、主題徽章與箴言牌匾不得被 SSR 虹彩配色取代。
- SSR 華麗度不能反向決定成語語義稀有度。
- 正式發布前必須完成來源、授權、繁體文字、注音、拼音、解釋與例句校訂。
