# Theme Badge System v1 — ChatGPT Audit

日期：2026-08-07  
PR：`#40`  
分支：`feat/theme-badge-system-v1`  
Audit 結論：**PASS，等待最新 head CI 與 behind_by=0 後可 Squash Merge**

## 1. 範圍審核

本 PR 僅處理：

- 成語圖卡 v2.6 書面規格與 Implementation Plan
- 九大主題徽章 Registry、Schema、純 TypeScript 驗證器與 CLI
- 九枚 Approved Drive 元件與一張文件總覽圖的 Asset Registry
- 永久 CI Gate、Agent 入口規則與跨聊天狀態
- Google Sheet Asset Register、Codebook 與 Version History

未修改主玩法、IndexedDB progress schema、第一章關卡、卡池資格或 React 遊戲流程。第一章 61 張分類遷移與 Batch 01 重製明確留給下一個獨立任務。

## 2. 規格一致性

九個 `themeCategory` 固定且完整：

```text
military
governance
strategy
arts
perseverance
selfCultivation
relationships
cautionary
perspective
```

對應中文名稱、圖式、底色與 Asset ID 由 `data/cards/theme-badge-registry.json` 鎖定。`secondaryThemeTags` 只供管理與搜尋，不得渲染於卡面；圖片模型不得生成正式徽章或類別文字。

九枚母件均為 `1024 × 1280`、`image/png`、RGBA 透明背景；總覽圖只供文件審核，Theme Badge Registry 不包含總覽圖，因此 renderer 無法把總覽圖解析為卡面元件。

## 3. TDD 與測試證據

Git 歷史顯示 `tests/theme-badge-registry.test.mjs` 先於型別、驗證器與 Registry 提交。第一個 RED CI 先由測試檔缺少 `node:url` 匯入而停止；修正測試後，既有 Drive baseline 又因合法新增 10 筆資產而顯示 `19 !== 9`，其後以具體 Asset ID 斷言更新基線，而非只放寬數字。

PR head CI #471 成功，job `92790147737`：

```text
Drive Asset Validator: PASS folders=60 assets=19 migrations=3
Theme Badge Validator: PASS badges=9 approved-assets=9
Node tests: 350 passed, 0 failed
Theme Badge tests: 4 passed, 0 failed
Puzzle tests: 37 passed, 0 failed
Card tests: 100 passed, 0 failed
Card Catalog tests: 7 passed, 0 failed
TypeScript strict: PASS
ESLint: PASS
Vite production build: PASS
PWA generateSW: PASS, 12 precache entries, 403.12 KiB
npm audit: 0 vulnerabilities
```

最新 audit 文件提交後仍須以 PR 最新 head 的 workflow 為最終證據。

## 4. Drive 與 Registry 審核

- 九枚母件與總覽圖位於 `idiom-cards.components.theme-badges.approved`。
- 九枚母件各自具有唯一 Drive File ID、SHA-256、尺寸、MIME、approval evidence 與 `currentApproved=true`。
- 總覽圖使用獨立 identity `theme-badge-system-overview`，不出現在九大 Theme Badge Registry。
- 排查期間建立的空白 `30_Reference` 資料夾已永久刪除。
- Drive Validator 對 60 folders、19 assets、3 ledgers 全部通過。

## 5. Google Sheet 審核

`CICG_素材管理控制中心_v1.0` 已完成：

- `Asset_Register`：`theme-badge-set` 更新為 9／9，並新增九枚母件與總覽圖逐筆資料。
- `Codebook_Agent`：新增四個正式卡片欄位與 Registry 規則。
- `Version_History`：逐筆保存 File ID、尺寸、SHA-256、PR 與核准證據。

抽樣回讀 `Asset_Register!A8:AD8` 與 `A41:AD50`，欄位順序、File ID、SHA-256 與類別資料一致。

## 6. Review Findings

### Blocking

無。

### Non-blocking

1. GitHub Actions 顯示 `actions/checkout@v4` 與 `actions/setup-node@v4` 的 Node 20 runtime 已被 runner 強制使用 Node 24；工作流程本身設定 Node `22.16.0` 並成功執行。這是第三方 Action runtime 警告，不影響本 PR。
2. `npm install` 顯示 `glob@11.1.0` deprecation warning，但 `npm audit` 為 0 vulnerabilities；不在本功能範圍內升級依賴。

## 7. PR Gate

合併前必須同時滿足：

- PR 最新 head CI success
- `behind_by = 0`
- review threads = 0 unresolved
- review comments 無 blocking findings
- PR 由 Draft 轉 Ready
- 使用 Squash Merge

上述 Gate 完成後，本功能可結案；下一個最小可驗證階段是第一章 61 張 `themeCategory` 遷移與永久分類 Gate。
