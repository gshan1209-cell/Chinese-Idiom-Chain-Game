# CICG 成語圖卡版型鎖定 v2.6.1 — ChatGPT Audit

日期：2026-08-07  
PR：`#41`  
分支：`docs/idiom-card-layout-lock-v2-6-1`  
Audit 結論：**PASS；等待本 Audit 提交後的最新 head CI、behind_by=0 與 review threads=0 即可 Squash Merge**

## 1. 審核範圍

本 PR 僅處理：

- 已由使用者核准的 v2.6.1 幾何版型增補規格。
- `AGENTS.md` 的圖卡必讀順序與永久版型規則。
- `docs/card-prompts/PROJECT_PROMPT.md` 的新聊天接續契約。
- `docs/card-prompts/state/current-batch.json` 的 current layout standard。
- 跨入口一致性永久測試。
- Implementation Plan、RED 記錄與本 Audit。

未修改 React、遊戲領域邏輯、第一章關卡、IndexedDB progress schema、圖卡 renderer、Drive 資產或正式圖卡內容。

## 2. Current Standard 一致性

以下四個入口使用同一 canonical spec path：

```text
docs/superpowers/specs/2026-08-07-idiom-card-layout-lock-v2-6-1-design.md
```

- `AGENTS.md`：在 `PROJECT_PROMPT.md` 之前讀取 v2.6.1，並明定幾何衝突以 v2.6.1 為準。
- `PROJECT_PROMPT.md`：新聊天必須先讀 GitHub `main`、Agent Skill、state 與 v2.6.1。
- `current-batch.json`：`layoutVersion = 2.6.1`，`currentLayoutStandard` 精確指向上述路徑。
- v2.6.1 spec：固定 `1024 × 2000`，Header／Main Artwork／Footer 為 `360／1200／440`。

因此，任何依專案入口流程讀取 GitHub `main` 的新聊天，會將 v2.6.1 當成 current geometry contract；這不代表未讀取 Repository 的任意聊天能憑空取得規格。

## 3. 永久規則審核

已確認入口文件明確禁止：

- 圖片模型直接生成完整卡面。
- 一次生成十張拼圖總覽作為單卡成品。
- 漢語拼音或其他羅馬字讀音顯示於卡面。
- 因 SSR、難度或文案改變卡片高度、三區比例或元件座標。
- 對中央 artwork、徽章或外框做非等比拉伸。

固定契約包括：

```text
Canvas       1024 × 2000
Header       y=0–359, height=360
Main Artwork y=360–1559, height=1200
Footer       y=1560–1999, height=440
geometry tolerance = ±2 px
```

SSR neon overlay 固定為 `1024 × 2000` 最上層 overlay，不得縮小內容、改變三區高度、移動元件或觸發 reflow。

## 4. TDD 證據

先提交：

```text
tests/card-layout-standard.test.mjs
```

### RED

CI #475／Run `31179106448`／Job `92867858348` 按預期失敗：

- AGENTS 尚未指向 v2.6.1。
- PROJECT_PROMPT 尚未指向 v2.6.1，且仍保留舊卡面拼音條款。
- state 仍為 `layoutVersion = 2.6`。

### GREEN 修正

最小更新三個入口與 state 後，CI #478 的新版 Gate 與 102 項 Card tests 已通過；唯一失敗是 ESLint 不接受隱含 Node `URL` 全域。其後只加入：

```js
import { URL } from 'node:url';
```

未放寬任何版型斷言。

## 5. 最新完整驗證

CI #479／Run `31180068624`／Job `92870955913`：**SUCCESS**

```text
Drive Asset Validator: PASS folders=60 assets=19 migrations=3
Theme Badge Validator: PASS badges=9 approved-assets=9
Card layout entry tests: 2 passed, 0 failed
Card tests: 102 passed, 0 failed
Puzzle tests: 37 passed, 0 failed
Theme Badge tests: 4 passed, 0 failed
Card Catalog tests: 7 passed, 0 failed
Trap tests: 95 passed, 0 failed
TypeScript strict: PASS
ESLint: PASS
Vite production build: PASS
PWA generateSW: PASS, 12 precache entries, 403.12 KiB
npm audit: 0 vulnerabilities
```

資料建置亦成功輸出：

```text
70 筆成語，checksum 1601ec3c7424
61 筆第一章 canonical card records
```

## 6. Review Findings

### Blocking

無。

### Non-blocking

1. GitHub Actions 提示 `actions/checkout@v4` 與 `actions/setup-node@v4` 的 Node 20 runtime 已由 runner 強制切換 Node 24；專案測試實際使用 Node `22.16.0` 並成功。
2. `npm install` 顯示 `glob@11.1.0` deprecation warning，但 `npm audit` 為 0 vulnerabilities；不屬於本文件同步任務。
3. v2.6.1 規格首行的歷史狀態文字仍含 `Written Spec Review Pending`；使用者已在本任務中明確核准，且 `AGENTS.md`、`PROJECT_PROMPT.md` 與 state 已將它註冊為 current standard。此文字不影響 Gate 或新聊天解析，但後續可在規格狀態治理任務統一正規化。

## 7. 合併 Gate

合併前必須重新確認：

```text
latest PR head CI = success
behind_by = 0
unresolved review threads = 0
blocking findings = 0
PR draft = false
merge method = squash
```

上述條件完成後，PR #41 可合併；合併後需從 `main` 回讀 spec、AGENTS、PROJECT_PROMPT 與 state，確認 `layoutVersion = 2.6.1`。
