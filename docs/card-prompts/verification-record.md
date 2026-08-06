# CICG 成語圖卡提示語素材庫驗證紀錄

## 文件範圍

- 共用規則：3 份（README、母提示語、負面限制）
- 稀有度徽章模板提示語：4 份
- 成語圖卡提示語：22 份
- Manifest：1 份
- 設計規格與實作計畫：各 1 份

## GitHub 一致性檢查

- 分支：`docs/card-prompt-library-v1`
- 與 `main` 比較：`behind_by = 0`
- `docs/card-prompts/idioms/`：22 份提示語
- `docs/card-prompts/templates/`：4 份提示語
- 所有成語提示語均標示 `sourceStatus: NeedsReview` 與 `assetStatus: Legacy`
- 四種稀有度只改變左上稀有度徽章；固定外框、主圖、難易度框與主題徽章不隨稀有度改色

## Google Drive 備份

Legacy 備份根目錄：
https://drive.google.com/drive/folders/1estQ2VP1tbQLI2VNbS3V2FvpDICjbOGO

- `template-experiments`：4 個 ZIP，共 59 張歷史模板／構圖試驗圖
- `idiom-card-drafts`：1 個 ZIP，共 1 張可辨識成語草稿
- `badge-references`：1 個 ZIP，共 2 張徽章參考圖；另個別上傳 1 張便於預覽
- 圖片去重總數：62 張
- `README_Legacy_Assets.txt` 已上傳並標示所有素材均非正式 v2.1 成品

## 驗證限制

本次透過 GitHub Contents API 建立文件，並使用 GitHub compare API 與 Google Drive list-folder 驗證遠端內容及結構。容器環境無法解析 `github.com`，因此未能在本機 clone Repository 或執行 `./scripts/verify.sh`；完整 Repository Gate 交由此 PR 的 GitHub Actions 執行，不沿用過往測試數字。

## 發布限制

目前 22 張成語的典故來源皆為 `NeedsReview`，不得宣稱完成正式授權、文字校訂或可直接發布。正式產圖前仍須核對啟用來源 CSV、授權文件、繁體文字、注音、解釋與例句。
