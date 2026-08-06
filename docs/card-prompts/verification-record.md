# CICG 成語圖卡提示語素材庫驗證紀錄

## 文件範圍

- 共用規則：3 份（README、母提示語、負面限制）
- 稀有度徽章模板提示語：4 份
- 成語圖卡提示語：22 份
- Manifest：1 份
- 設計規格與實作計畫：各 1 份

## GitHub 一致性檢查

- 分支：`docs/card-prompt-library-v1`
- `docs/card-prompts/idioms/`：22 份提示語
- `docs/card-prompts/templates/`：4 份提示語
- 所有成語提示語均標示 `sourceStatus: NeedsReview` 與 `assetStatus: Legacy` 或 `Review`
- 四種一般稀有度只改變左上稀有度徽章；固定外框、主圖、難易度框與主題徽章不隨稀有度改色
- 四字成語旁的逐字直立注音、羅馬拼音禁用、典故標題、右下箴言低高度牌匾等固定欄位由共用母提示語強制套用
- `UR` 只預留正式授權的 IP 聯名隱藏版本，目前一般模板與成語提示語不得使用
- 現有 22 張稀有度仍須依「正面意義與激勵強度」完成人工複核；在完成前不得視為正式卡池等級

## Google Drive 備份

Legacy 備份根目錄：
https://drive.google.com/drive/folders/1estQ2VP1tbQLI2VNbS3V2FvpDICjbOGO

- `template-experiments`：59 張歷史模板／構圖試驗原始 PNG，逐檔保存
- `idiom-card-drafts`：1 張「草木皆兵」舊卡原始 PNG，逐檔保存
- `badge-references`：2 張徽章參考原始 PNG，逐檔保存
- 圖片去重總數：62 張
- 已刪除先前建立的 ZIP；不得使用 ZIP、RAR、7z 或其他壓縮檔取代原始圖片
- 每張圖片均可在 Drive 直接預覽與個別下載
- `README_Legacy_Assets.txt` 已上傳並標示所有素材均非正式 v2.1 成品

## 驗證限制

本次透過 GitHub Contents API 建立與修正文檔，並使用 GitHub compare API、GitHub Actions 與 Google Drive 搜尋驗證遠端內容及結構。容器環境無法解析 `github.com`，因此未能在本機 clone Repository；完整 Repository Gate 以本 PR 最新 HEAD 的 GitHub Actions 結果為準，不沿用過往測試數字。

## 發布限制

目前 22 張成語的典故來源皆為 `NeedsReview`，現有稀有度也尚未全部完成最新正面意義標準複核。不得宣稱完成正式授權、文字校訂、正式稀有度核准或可直接發布。正式產圖前仍須核對啟用來源 CSV、授權文件、繁體文字、逐字注音、解釋、例句與稀有度判定。
