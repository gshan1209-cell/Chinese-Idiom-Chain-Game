# AGENTS.md — Chinese-Idiom-Chain-Game

本文件是 Agent 進入本 Repository 的第一個必讀入口。

## 1. 開始工作前

先取得最新狀態：

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git status
git log --oneline -10
```

接著閱讀：

```text
README.md
docs/superpowers/specs/README.md
docs/superpowers/specs/ 中與任務相關的 Approved 規格
docs/superpowers/plans/ 中與任務相關的 Implementation Plan
```

並檢查：

- Open PR、Issue、GitHub Actions
- Google Drive 最新核准素材
- GitHub 與 Drive 是否版本漂移

真實狀態優先序：

```text
GitHub main
→ GitHub Actions
→ Repository 規格與計畫
→ Drive 已核准素材
→ 聊天紀錄
```

不得只依聊天摘要或舊快照直接修改。

---

## 2. 產品定位

本專案為：

```text
手機優先
大字體
繁體中文
離線優先
可安裝 PWA
縱橫成語填字闖關遊戲
```

自由接龍、成語打地鼠、媒體中心、陷阱模式、成就與圖卡收藏均為附加功能，不得取代主玩法。

---

## 3. 架構與開發原則

```text
src/domain       共用領域模型
src/idioms       成語資料
src/game         自由接龍
src/puzzle       填字盤面與導航
src/progress     闖關進度與 IndexedDB
src/bonus        打地鼠
src/pwa          PWA
src/cards        圖卡資料、版面、元件解析與 render plan
src/app          React UI 與瀏覽器事件
src/app/cards    圖卡 React／SVG 顯示與 PNG 輸出 adapter
```

- 領域規則使用純 TypeScript。
- React 只負責畫面與瀏覽器事件。
- 不得把核心規則寫進 DOM、動畫 callback 或不可測試的亂數流程。
- 圖卡 React 元件不得重新判定稀有度、難易度、來源、授權或卡池資格。
- 不得直接修改既有 `cicg-progress` Schema，除非任務明確核准 Schema migration。

所有功能與 Bug 修正使用 TDD：

1. 先寫失敗測試。
2. 確認 RED 原因正確。
3. 寫最小實作。
4. 確認 GREEN。
5. 執行完整回歸。

開始修改前：

```bash
npm install
./scripts/verify.sh
```

不得沿用舊測試數量或舊 CI 結果宣稱本次通過。

---

## 4. 成語圖卡任務必讀

凡涉及下列任一工作：

- 圖卡企劃、Prompt 或素材產製
- 產生成語圖卡、繼續產圖或下一批
- 修正上一批、審核或上傳圖卡
- 圖卡元件、模板、renderer 或 PNG 輸出
- 稀有度、稀有度外框或難易度
- Drive 圖卡素材盤點、搬移、改名、歸檔或漂移修復
- 每十關免費贈卡
- 收藏頁或卡池
- 圖卡購買或卡包
- UR 或外部 IP 聯名

必須先使用 Repository-local skill：

```text
.agents/skills/generating-cicg-idiom-cards/SKILL.md
```

接著讀取跨聊天狀態：

```text
docs/card-prompts/state/current-batch.json
```

當使用者只說「繼續產圖」、「下一批」、「修正上一批」、「審核圖卡」、「上傳素材」或「繼續整理 Drive」時，Agent 必須先依狀態檔、Drive Registry、active migration ledger 與 drift report 接續，不得要求使用者重新貼完整規格。

若狀態檔與 Drive／Manifest／Registry 不一致，必須先回報漂移，不得猜測已完成。

圖卡規格依序閱讀：

```text
1. docs/superpowers/specs/2026-08-06-idiom-card-rarity-standard-design.md
2. docs/superpowers/specs/2026-08-06-idiom-card-review-governance-design.md
3. docs/superpowers/specs/2026-08-06-idiom-card-collection-design.md
4. docs/superpowers/specs/2026-08-06-idiom-card-collection-data-integrity-amendment.md
5. docs/superpowers/specs/2026-08-06-card-template-v2.1-layout-amendment.md
6. docs/superpowers/specs/2026-08-06-card-template-v2.6-dimension-and-pronunciation-amendment.md
7. docs/superpowers/specs/2026-08-06-card-template-v2.7-ssr-badge-amendment.md
8. docs/superpowers/specs/2026-08-06-card-rarity-frame-system-amendment.md
9. docs/superpowers/specs/2026-08-06-idiom-card-modularization-design.md
10. docs/superpowers/specs/2026-08-06-drive-asset-governance-design.md
11. docs/superpowers/specs/2026-08-07-idiom-card-standard-v2-6-design.md
12. docs/card-prompts/PROJECT_PROMPT.md
```

v2.1 保留為歷史版面基礎；2026-08-06 的 v2.6 修正尺寸與注音定位；2026-08-07 的 v2.6 正式規範進一步覆寫卡面拼音、九大主題徽章與元件化合成流程。v2.7 只覆寫 SSR 左上稀有度徽章的視覺標準；四階外框規格定義 N／R／SR／SSR 的 frame-skin 與 effect-overlay；元件化規格定義來源資產、資料、元件、render plan 與 derived PNG 的分工；Drive 素材治理規格定義 type-first 結構、生命週期、Registry、Migration Ledger 與 drift Gate。

發生衝突時，較新的 Approved 規格優先；技能與狀態檔不能取代 Drive、Manifest、Registry、來源、授權或核准證據。

永久規則：

- N～SSR 主要依成語正面意義、勵志程度、精神象徵、共鳴力與代表性判定。
- 稀有度不得只依畫面華麗度、成語艱深度或角色強弱判定。
- 稀有度與難易度分欄保存。
- SSR 是高正面價值與高精神象徵卡。
- UR 只保留給取得正式授權的外部 IP 聯名。
- 未取得可稽核授權前，不得製作、發布、發放或販售正式 UR 聯名卡。
- Review、Rejected、Deprecated、來源未校訂或權利不清的卡不得進入正式卡池。
- 正式圖卡固定為 `1024 × 2000 px`。
- 上方資訊區固定 `360 px`、中央主圖區固定 `1200 px`、下方內容區固定 `440 px`。
- 四字主標下方只顯示四組逐字對齊注音；漢語拼音可保留於資料層供搜尋或語音使用，但不得進入卡面渲染。
- 新產 SSR 圖卡必須使用 v2.7 傳奇級虹彩金龍徽章：大型立體金色 SSR、紫藍洋紅星雲核心與紫色菱形主寶石。
- SSR 徽章必須與 SR 在輪廓、材質、光效與主寶石上明顯區隔；只改文字、亮度或飽和度視為 Blocking failure。
- N 外框固定為深翡翠古金；R 為霜藍鋼銀；SR 為皇家紫晶；SSR v2.8 為完整青藍、紫、洋紅、翠綠虹彩霓虹包框。
- 完整多色虹彩包框只允許 SSR；N／R／SR 必須維持各自單一主色層級。
- SSR v2.8 可把虹彩用於外框與 effect overlay，但不得把 canonical artwork、難易度框、典故區、主題徽章或箴言牌匾全面染色。
- N／R／SR 不得套用 v2.7 SSR 徽章或 v2.8 SSR 完整虹彩外框。
- 稀有度外框不得改寫難易度；右上 difficulty badge 必須是獨立元件。
- 左下主題類別只能讀取 `data/cards/theme-badge-registry.json` 的九大正式類別：軍事、內政、智謀、文藝、勵志、修身、人際、警世、見識。
- `secondaryThemeTags` 只供管理與搜尋，不得顯示在卡面；「專注、豪情、公義、新歲」等自由文字不得取代正式類別。
- 產圖模型不得在中央插畫中自行生成主題徽章、類別名稱、稀有度、難易度或任何正式卡面文字。
- 合成時必須依 `themeCategory` 解析 current Approved `themeBadgeAssetId`；缺少、錯配、尺寸錯誤或非透明母件均屬 Blocking failure。
- 九枚主題徽章母件固定為 `1024 × 1280 px` RGBA 透明 PNG；總覽圖只供文件審核，不得裁切作為卡面元件。
- 新建圖卡預設 `renderMode = modular`；舊整張 PNG 使用 `flat-legacy`。
- 中央主插圖必須保存為獨立 artwork，不得烙入稀有度、難易度、主標、注音、拼音、典故、箴言或來源。
- 難易度、稀有度、外框、主題徽章、文字、箴言牌匾與來源必須能獨立替換。
- Review／Approved PNG 是 derived output，不得成為唯一 canonical source。
- 修改難易度、徽章或外框時，`artworkAssetId` 與 artwork checksum 必須維持不變。
- 圖卡必須使用繁體中文、人物情境與最下方單行典故來源。
- 使用者要求正式產圖時，應使用可用的圖片生成工具；在 modular workflow 中優先產生 illustration-only artwork，再由 renderer 組卡。
- Renderer 尚未完成時可先產 artwork，但不得退回把所有 UI 永久烙入 canonical artwork。
- 產製 Agent 不得自行把自己的輸出直接標記為最終 Approved。
- 產圖、審核、上傳或批次狀態改變後，必須更新 `current-batch.json`；Drive 或發布狀態變更時同步更新 Manifest 或對應元件註冊表。

---

## 5. GitHub 與 Drive 分工

GitHub 存放：

- 程式碼、測試與 CI
- CSV、JSON、Schema
- 技術規格與 Implementation Plan
- 圖卡技能、批次狀態、定義、元件註冊表與 render plan
- 稀有度理由與審核紀錄
- Drive File ID、Folder ID、SHA-256、版本、Migration Ledger 與 drift report
- Approved master 產生的 PWA runtime derivative 與追溯 manifest

Drive 存放：

- UI／UX 圖
- Logo、Icon、背景
- 成語圖卡 artwork、component master 與 composite PNG
- 音效與影片
- 校訂與授權文件
- 實機測試證據
- 發布交付物

成語圖卡目標結構：

```text
80_Inbox/Idiom_Cards/<BatchId>/

02_UI_UX_And_Visuals/Idiom_Cards/
├─ 01_Artworks/{10_Review,20_Approved}
├─ 02_Components/<ComponentType>/{10_Review,20_Approved}
├─ 03_Templates/{10_Review,20_Approved}
├─ 04_Composites/{10_Review,20_Approved}
└─ 05_Reference_Only

90_Archive/Idiom_Cards/
```

Drive 永久 Gate：

- 固定頂層 `00`～`05`、`80_Inbox`、`90_Archive` 不重新命名。
- Inbox 只作 intake，不得直接進 Approved。
- 同一 `assetType + identity` 最多只有一個 current Approved master。
- Published 只記錄 metadata，不複製第二份 source master。
- 搬移前必須有 Asset Registry、Folder Registry、Migration Ledger 與 rollback path。
- 搬移時必須保留 File ID，不得以同名重新上傳模擬 move。
- 搬移後驗證 parent Folder ID、File ID、checksum、大小、MIME type 與 webViewLink。
- 舊版移入 Archive，不永久刪除。
- Blocking drift 未解決時，不得核准、發布、打包或開始下一批搬移。

Drive governance canonical entry points：

```text
data/drive-assets/drive-folders.json
data/drive-assets/idiom-card-assets.json
data/drive-assets/migrations/
data/drive-assets/physical-audit-2026-08-07.json
```

- Folder Registry 是 Folder ID 與 parent 關係的唯一 canonical mapping；其他文件不得複製完整 Folder ID 表。
- Asset Registry 是 Approved、Review、Quarantined 與其他素材狀態的唯一 machine-readable Registry。
- `scripts/validate-drive-assets.mjs` 必須自動發現並驗證 `migrations/` 下全部 JSON Ledgers。
- 最新 drift 與 readiness 讀取：

```text
docs/superpowers/reports/2026-08-07-drive-phase1-migration-report.md
docs/superpowers/reports/2026-08-07-drive-phase2-readiness.md
```

四階外框元件註冊表：

```text
docs/card-prompts/components/rarity-frame-registry-v1.md
```

九大主題徽章註冊表：

```text
data/cards/theme-badge-registry.json
```

---

## 6. 分支與 PR

使用：

```text
feat/<功能>
fix/<問題>
docs/<文件>
test/<驗證>
```

禁止：

- 直接在 main 開發
- 同一任務重複開 PR
- 未同步 main 就繼續舊分支
- 加入未核准功能
- 刪除測試或永久 Gate
- 關閉 TypeScript strict
- 大範圍關閉 ESLint

規格 PR 保持 docs-only，不得順便加入 production code 或直接搬動 Drive 素材。

PR 合併前必須確認：

- 與 main 無落後或已完成同步
- CI 全綠
- 測試、TypeScript、Lint、Build、PWA 與 npm audit 結果有紀錄
- Drive 新增或移動素材有紀錄
- ChatGPT Audit 已完成

通過後優先使用 Squash Merge。
