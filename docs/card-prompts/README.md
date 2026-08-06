# CICG 成語圖卡提示語素材庫

- 規範版本：v2.1
- 圖片保存：Google Drive
- 提示語保存：GitHub
- 舊圖狀態：Legacy / Review / Approved
- 典故狀態：Verified / NeedsReview
- 稀有度狀態：Verified / NeedsReview

## 使用順序

1. 讀取 `shared/card-master-prompt.md`。
2. 讀取 `shared/negative-constraints.md`。
3. 套用 `templates/` 或 `idioms/` 中的單張提示語。
4. 單張提示語未重複寫出的固定欄位，一律以共用母提示語為準，不得自行省略。
5. 產圖後先放入 Drive `80_Inbox`；核准後移入正式資料夾。
6. 更新 `manifest.md` 的 Drive URL、素材狀態、來源狀態與稀有度狀態。

## 目錄

```text
docs/card-prompts/
├─ README.md
├─ manifest.md
├─ shared/
├─ templates/
└─ idioms/
```

## 最新固定版型 Gate

- 四字成語旁必須放置逐字直立注音；不得顯示漢語拼音或其他羅馬拼音。
- 下方區塊標題使用「典故」，不得顯示「典故說明」四字標籤。
- 左下主題徽章、固定圖示、底色與完整類別名稱必須保留。
- 右下箴言使用獨立窄版深色金框直式牌匾，由右至左閱讀；牌匾高度必須貼合文字並下降，不得留下大面積空白或壓縮主插圖。
- 稀有度依成語的正面意義、激勵強度與收藏定位判定，不得依難易度、人氣或畫面華麗程度判定。
- `UR` 僅預留經正式授權的 IP 聯名隱藏版本；一般成語卡與目前模板不得自行使用 UR。

## 核心分工

- GitHub 保存可版本控制的提示語、卡面文案與素材索引。
- Google Drive 保存 PNG 圖片、歷史草稿與核准素材。
- 歷史圖片與備用素材必須以原始 PNG 逐檔上傳，不得使用 ZIP 或其他壓縮檔取代原圖。
- `N / R / SR / SSR` 只代表左上稀有度徽章，不代表不同外框。
- 左下主題徽章依類別固定圖示、色系與名稱。
- 未完成正式典故與授權校訂者一律標記 `NeedsReview`。
- 未依正面意義標準完成人工複核的稀有度一律標記 `NeedsReview`，不得視為正式卡池等級。
