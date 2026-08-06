# 刻舟求劍｜CICG 成語卡牌提示語 v2.1

## 引用規則
- `../shared/card-master-prompt.md`
- `../shared/negative-constraints.md`

## 基本資料
- idiom: 刻舟求劍
- rarity: R
- difficulty: C
- themeCategory: perspective
- themeLabel: 見識
- themeIcon: 眼睛與遠山窗口
- themeColor: 寶石藍 `#1D5F9E`
- leadCharacter: 男性旅人
- sourceStatus: NeedsReview
- assetStatus: Legacy
- driveImageUrl: 待補

## 典故查核
- 標準含義：比喻拘泥不變的方法，不懂環境已經改變。
- 典故屬性：寓言
- 時代與人物：戰國；楚國乘船者。
- 來源格式：典故來源：戰國・呂不韋編《呂氏春秋・察今》
- 校訂備註：正式發布前須依啟用來源 CSV 與校訂文件確認篇章、異文與卡面文字。

## 卡面文案
- 成語標題：刻舟求劍
- 白話副標：位置會變，方法也要跟著變
- 典故摘要：旅人的劍掉入水中，他只在船舷刻下記號，等船靠岸才從刻痕處下水找劍，卻忽略船已前進。
- 卡牌箴言：境隨時變，／法須應勢，／莫守舊痕。
- 典故來源：典故來源：戰國・呂不韋編《呂氏春秋・察今》

## 視覺構圖
男性旅人在疾行木船上刻下明顯記號，身體探向水面；水下寶劍沉在遠後方，船流與方向線呈現位置變化。剖面式構圖同時顯示船上與水下。左下固定寶石藍見識徽章。

## 正式產圖提示語
生成直式 2:3 繁體中文 CICG 卡牌「刻舟求劍」。固定深色金框；左上藍色 R 稀有度徽章只影響徽章；右上只顯示「難易度」與 C。中央以剖面敘事呈現旅人在船舷刻記號，而寶劍已沉在船後方水底，讓觀者一眼理解位置已變。左下固定寶石藍 `#1D5F9E`「見識」徽章，圖示為眼睛與遠山窗口，下方完整顯示類別。典故區放摘要；右下直式箴言「境隨時變，／法須應勢，／莫守舊痕。」最下方顯示來源。外框、主圖與類別徽章不得隨 R 改色。

## 負面限制
套用共用負面限制；不得讓劍仍在刻痕正下方，不得使用現代引擎船，不得把見識徽章與 R 徽章混用。

## 驗收清單
- [ ] 稀有度只影響左上 R 徽章。
- [ ] 右上為難易度 C。
- [ ] 見識徽章為 `#1D5F9E`。
- [ ] 船前進、刻痕與劍位置錯開清楚。
- [ ] sourceStatus: NeedsReview。
- [ ] assetStatus: Legacy。

## 素材連結
- promptPath: `docs/card-prompts/idioms/CICG_IdiomCard_刻舟求劍_R_C_v2.1_Prompt.md`
- driveImageUrl: 待補
- assetStatus: Legacy
- sourceStatus: NeedsReview
