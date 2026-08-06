# CICG 成語圖卡提示語素材庫

- 規範版本：v2.1
- 圖片保存：Google Drive
- 提示語保存：GitHub
- 舊圖狀態：Legacy / Review / Approved
- 典故狀態：Verified / NeedsReview
- 稀有度狀態：Verified / NeedsReview

## 新聊天／新 Agent 的正式入口

凡在 Chinese-Idiom-Chain-Game 專案內處理下列任務：

- 產生成語圖卡
- 繼續產圖
- 下一批圖卡
- 修正上一批
- 審核、核准或上傳圖卡
- 規劃圖卡批次

必須先使用 Repository-local skill：

```text
.agents/skills/generating-cicg-idiom-cards/SKILL.md
```

並立即讀取跨聊天狀態：

```text
docs/card-prompts/state/current-batch.json
```

技能與狀態檔讓新聊天能從 GitHub `main` 接續，不需要使用者重新貼完整規格。

`current-batch.json` 只記錄接續狀態，不能取代 Drive File ID、Manifest、來源校訂、授權或最終核准證據。

正式專案提示語仍保存於：

```text
docs/card-prompts/PROJECT_PROMPT.md
```

不得再把舊聊天交接文字當作最高規格。

## 每次產圖前的使用順序

1. 更新並確認 GitHub 最新 `main`。
2. 讀取 `AGENTS.md`。
3. 使用 `.agents/skills/generating-cicg-idiom-cards/SKILL.md`。
4. 讀取 `docs/card-prompts/state/current-batch.json`。
5. 讀取技能列出的 `references/required-specs.md`。
6. 讀取 `PROJECT_PROMPT.md`。
7. 讀取 `docs/superpowers/specs/2026-08-06-card-template-v2.1-layout-amendment.md`。
8. 讀取 `shared/card-master-prompt.md`。
9. 讀取 `shared/negative-constraints.md`。
10. 套用 `templates/` 對應稀有度模板。
11. 套用 `idioms/` 對應的單張提示語。
12. 讀取 `manifest.md`，確認版本、來源狀態與稀有度狀態。
13. 單張提示語未重複寫出的固定欄位，以較新的 Approved 規格與共用母提示語為準。
14. 產圖後先放入 Drive `80_Inbox`；核准後才能移入正式資料夾。
15. 更新 `current-batch.json`；Drive 或發布狀態變更時同步更新 `manifest.md`。

## 簡短接續指令

使用者只說下列短句時，Agent 不得要求重新貼完整規格：

```text
繼續產圖
下一批
修正上一批
審核圖卡
上傳素材
```

Agent 必須先讀取 `current-batch.json`，再依 `activeBatchId`、`nextAction` 與每張卡狀態接續。

若狀態檔與 Drive／Manifest 不一致，先回報漂移，不得猜測已完成。

## 規範優先序

```text
GitHub 最新 main
→ 最新 Approved 規格與規格索引
→ Repository-local skill
→ current-batch.json
→ v2.1 版面增補
→ PROJECT_PROMPT.md
→ 共用母提示語與負面限制
→ 單張成語提示語
→ Drive Approved 模板與 Manifest 證據
→ 舊圖片與聊天紀錄
```

舊圖只能作為構圖參考，不得覆寫最新文字規格。

## 目錄

```text
.agents/skills/generating-cicg-idiom-cards/
├─ SKILL.md
└─ references/
   ├─ required-specs.md
   └─ review-checklist.md

docs/card-prompts/
├─ PROJECT_PROMPT.md
├─ README.md
├─ manifest.md
├─ state/
│  ├─ README.md
│  └─ current-batch.json
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

- GitHub 保存可版本控制的提示語、卡面文案、技能、狀態與素材索引。
- Google Drive 保存 PNG 圖片、歷史草稿與核准素材。
- 歷史圖片與備用素材必須以原始 PNG 逐檔上傳，不得使用 ZIP 或其他壓縮檔取代原圖。
- `N / R / SR / SSR` 只代表左上稀有度徽章，不代表不同外框。
- 左下主題徽章依類別固定圖示、色系與名稱。
- 未完成正式典故與授權校訂者一律標記 `NeedsReview`。
- 未依正面意義標準完成人工複核的稀有度一律標記 `NeedsReview`，不得視為正式卡池等級。
- 產製 Agent 不得自行把自己的輸出直接標為最終 Approved。