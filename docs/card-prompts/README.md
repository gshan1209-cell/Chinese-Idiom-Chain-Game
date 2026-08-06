# CICG 成語圖卡提示語素材庫

- 規範版本：v2.1
- 圖片保存：Google Drive
- 提示語保存：GitHub
- 舊圖狀態：Legacy / Review / Approved
- 典故狀態：Verified / NeedsReview

## 使用順序

1. 讀取 `shared/card-master-prompt.md`。
2. 讀取 `shared/negative-constraints.md`。
3. 套用 `templates/` 或 `idioms/` 中的單張提示語。
4. 產圖後先放入 Drive `80_Inbox`；核准後移入正式資料夾。
5. 更新 `manifest.md` 的 Drive URL、素材狀態與來源狀態。

## 目錄

```text
docs/card-prompts/
├─ README.md
├─ manifest.md
├─ shared/
├─ templates/
└─ idioms/
```

## 核心分工

- GitHub 保存可版本控制的提示語、卡面文案與素材索引。
- Google Drive 保存 PNG 圖片、歷史草稿與核准素材。
- 歷史圖片與備用素材必須以原始 PNG 逐檔上傳，不得使用 ZIP 或其他壓縮檔取代原圖。
- `N / R / SR / SSR` 只代表左上稀有度徽章，不代表不同外框。
- 左下主題徽章依類別固定圖示、色系與名稱。
- 未完成正式典故與授權校訂者一律標記 `NeedsReview`。
