# CICG 成語圖卡提示語素材庫

- 規範版本：v2.1
- 圖片保存：Google Drive
- 提示語保存：GitHub
- 舊圖狀態：Legacy / Review / Approved
- 典故狀態：Verified / NeedsReview
- 稀有度狀態：Verified / NeedsReview

## 新聊天／新 Agent 的正式入口

需要在另一個聊天或 Agent 接續產圖時，必須先使用：

```text
docs/card-prompts/PROJECT_PROMPT.md
```

該文件是目前正式的成語圖卡產製專案提示語，包含：

- 最新規格讀取順序
- v2.1 版型 Gate
- 逐字直立注音與禁用羅馬拼音
- 稀有度與難易度標準
- UR 授權限制
- 產圖前內容表
- 產圖後審核清單
- Drive 與 Manifest 交付流程

不得再把舊聊天交接文字當作最高規格。

## 每次產圖前的使用順序

1. 更新並確認 GitHub 最新 `main`。
2. 讀取 `PROJECT_PROMPT.md`。
3. 讀取 `docs/superpowers/specs/2026-08-06-card-template-v2.1-layout-amendment.md`。
4. 讀取 `shared/card-master-prompt.md`。
5. 讀取 `shared/negative-constraints.md`。
6. 套用 `templates/` 對應稀有度模板。
7. 套用 `idioms/` 對應的單張提示語。
8. 讀取 `manifest.md`，確認版本、來源狀態與稀有度狀態。
9. 單張提示語未重複寫出的固定欄位，一律以較新的 Approved 規格與共用母提示語為準，不得自行省略。
10. 產圖後先放入 Drive `80_Inbox`；核准後才能移入正式資料夾。
11. 更新 `manifest.md` 的 Drive URL、素材狀態、來源狀態與稀有度狀態。

若 Repository 已有 `AGENTS.md` 或 `docs/superpowers/specs/README.md`，也必須先讀取其中的最新圖卡規格索引。

## 規範優先序

```text
GitHub 最新 main
→ 最新 Approved 規格與規格索引
→ v2.1 版面增補
→ PROJECT_PROMPT.md
→ 共用母提示語與負面限制
→ 單張成語提示語
→ Drive Approved 模板
→ 舊圖片與聊天紀錄
```

舊圖只能作為構圖參考，不得覆寫最新文字規格。

## 目錄

```text
docs/card-prompts/
├─ PROJECT_PROMPT.md
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

## 產圖前內容 Gate

每張圖卡至少確認：

- 成語與逐字注音
- 白話副標
- 難易度
- 稀有度與判定理由
- 主題類別與徽章
- 典故摘要與來源
- 卡牌箴言
- 人物、動作、場景與關鍵道具
- `Verified / NeedsReview` 狀態

來源、注音或稀有度仍為 `NeedsReview` 時，只能產製 Review 圖，不得宣稱 Approved 或可進正式卡池。

## 核心分工

- GitHub 保存可版本控制的提示語、卡面文案與素材索引。
- Google Drive 保存 PNG 圖片、歷史草稿與核准素材。
- 歷史圖片與備用素材必須以原始 PNG 逐檔上傳，不得使用 ZIP 或其他壓縮檔取代原圖。
- `N / R / SR / SSR` 只代表左上稀有度徽章，不代表不同外框。
- 左下主題徽章依類別固定圖示、色系與名稱。
- 未完成正式典故與授權校訂者一律標記 `NeedsReview`。
- 未依正面意義標準完成人工複核的稀有度一律標記 `NeedsReview`，不得視為正式卡池等級。
