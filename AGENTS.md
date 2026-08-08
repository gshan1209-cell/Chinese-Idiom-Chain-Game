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

接著檢查：

- `README.md`、`package.json`
- `docs/superpowers/specs/`
- `docs/superpowers/plans/`
- Open PR、Issue、GitHub Actions
- Google Drive 最新核准素材
- GitHub 與 Drive 是否版本漂移

真實狀態優先序：

```text
GitHub main
→ GitHub Actions
→ Repository 規格、Registry 與計畫
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

打地鼠只能掛載於自由接龍，不得進入主線關卡地圖、填字盤面或星級流程。

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
src/cards        圖卡資料、獎勵、收藏、升級、版面與 render plan
src/app          React UI 與瀏覽器事件
src/app/cards    圖卡顯示、收藏與升級 UI adapter
```

- 領域規則使用純 TypeScript。
- React 只負責畫面、瀏覽器事件與呼叫已測試服務。
- 不得把核心規則寫進 DOM、動畫 callback 或不可測試的亂數流程。
- 圖卡 React 元件不得重新判定稀有度、難易度、來源、授權、卡池資格、隱藏積分或升級素材。
- `cicg-progress` 保持 Version 1；未經明確 migration 核准不得加入卡牌欄位。

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

## 4. 第一章與遊戲永久規則

- 第一章固定 20 關。
- 第一章固定 61 個 placement、61 個不同 `idiomId`、61 個不同成語文字。
- 第一章成語不得跨關重複。
- 每關必須可完整解答。
- 關卡成語必須存在於啟用中的來源 CSV。
- 智慧自動跳格必須由純 TypeScript 領域邏輯決定，不得寫進 React、DOM 或亂數流程。
- 自動跳格順序固定為：目前方向下一格 → 相交成語 → 直接相連成語 → 全盤最近空格 → 填完後巡回錯誤格。

闖關進度：

```text
Database：cicg-progress
Version：1
Store：campaigns
Key：chapter-1
```

星級：

```text
三星：0 提示、0 錯誤
二星：最多 1 次提示、2 次錯誤
一星：完成關卡
```

---

## 5. 成語圖卡任務必讀

凡涉及下列任一工作：

- 圖卡企劃、Prompt 或素材產製
- 產生成語圖卡、繼續產圖或下一批
- 修正上一批、審核或上傳圖卡
- 圖卡元件、模板、renderer 或 PNG 輸出
- 稀有度、難易度、卡號或主題徽章
- 收藏頁、每關贈卡、隱藏積分、卡池、重複卡升級或卡包
- Drive 圖卡素材盤點、搬移、改名、歸檔或漂移修復
- UR 聯名

必須先讀取：

```text
1. .agents/skills/generating-cicg-idiom-cards/SKILL.md
2. docs/card-prompts/state/current-batch.json
3. data/cards/card-number-registry.json
4. data/cards/theme-badge-registry.json
5. data/drive-assets/idiom-card-assets.json
```

凡指定外部 IP 與角色、要求 UR 卡或接續 UR 聯名卡時，還必須讀取：

```text
.agents/skills/generating-cicg-ur-collaboration-cards/SKILL.md
```

當使用者只說「繼續產圖」、「下一批」、「修正上一批」、「審核圖卡」或「上傳素材」時，Agent 必須依 GitHub `main`、狀態檔、Registry、Manifest 與 Drive 證據接續，不得要求使用者重新貼完整規格。

若狀態檔與 Drive／Manifest／Registry 不一致，必須先回報漂移，不得猜測已完成。

### 5.1 圖卡規格讀取順序

```text
1. docs/superpowers/specs/2026-08-06-idiom-card-rarity-standard-design.md
2. docs/superpowers/specs/2026-08-06-idiom-card-review-governance-design.md
3. docs/superpowers/specs/2026-08-06-idiom-card-collection-design.md
4. docs/superpowers/specs/2026-08-06-idiom-card-collection-data-integrity-amendment.md
5. docs/superpowers/specs/2026-08-06-card-collection-core-v1-design.md
6. docs/superpowers/specs/2026-08-08-card-reward-and-upgrade-system-design.md
7. docs/superpowers/specs/2026-08-08-project-wide-four-digit-card-numbering-design.md
8. data/cards/card-number-registry.json
9. docs/superpowers/specs/2026-08-06-card-template-v2.1-layout-amendment.md
10. docs/superpowers/specs/2026-08-06-card-template-v2.6-dimension-and-pronunciation-amendment.md
11. docs/superpowers/specs/2026-08-06-card-template-v2.7-ssr-badge-amendment.md
12. docs/superpowers/specs/2026-08-06-card-rarity-frame-system-amendment.md
13. docs/superpowers/specs/2026-08-06-idiom-card-modularization-design.md
14. docs/superpowers/specs/2026-08-06-drive-asset-governance-design.md
15. docs/superpowers/specs/2026-08-07-idiom-card-standard-v2-6-design.md
16. docs/superpowers/specs/2026-08-07-idiom-card-layout-lock-v2-6-1-design.md
17. docs/superpowers/specs/2026-08-08-ur-collaboration-card-standard-v1-0-design.md（UR 任務）
18. docs/superpowers/specs/2026-08-08-ur-collaboration-generation-skill-and-zhuyin-gate-design.md（UR 任務）
19. docs/card-prompts/PROJECT_PROMPT.md
```

`v2.6.1` 是 current geometry contract；發生畫布、區域高度、元件位置、裁切、圖層或 SSR overlay 衝突時，以 v2.6.1 為準。

### 5.2 v2.6.1 永久版型規則

```text
Canvas       x=0, y=0,    width=1024, height=2000
Header       x=0, y=0,    width=1024, height=360
Main Artwork x=0, y=360,  width=1024, height=1200
Footer       x=0, y=1560, width=1024, height=440
```

固定 Bounding Box：

```text
rarity badge    x=24–252,  y=18–326
title           x=250–788, y=42–158
Zhuyin          x=278–756, y=166–232
subtitle        x=258–782, y=254–330
difficulty      x=792–1000,y=24–318
theme badge     x=28–300,  y=1576–1920
allusion panel  x=286–724, y=1582–1920
motto plaque    x=730–988, y=1570–1922
source line     x=178–846, y=1936–1986
card number     x=410–614, y=1936–1986
```

- 所有元件必須使用 v2.6.1 Bounding Box，實際幾何允許誤差最多 `±2 px`。
- 任何稀有度均不得改變 `360／1200／440` 三區高度。
- 圖片模型只能生成 `1024 × 1200 px`、無文字、無 UI、無外框的 artwork。
- 圖片模型不得生成主標題、注音、卡號或完整卡面。
- Renderer 必須使用已驗證的 `bopomofo[4]` 與 canonical `cardNumber`。
- 注音固定四筆逐字對齊；日文假名、拼音、羅馬字與近似假字均為 Blocking failure。
- 日文假名 finding code 為 `japanese-kana-in-bopomofo`；其他不合法注音為 `invalid-bopomofo`。
- 漢語拼音可留在資料層，但不得顯示於卡面。
- 中央 artwork 只允許等比 `cover + center crop`，禁止拉伸或壓縮。
- SSR 霓虹框是 `1024 × 2000` full-canvas top overlay，不得造成 reflow。
- SSR 霓虹光效向內延伸不得超過 `20 px`，不得全面染色其他元件。
- 相同資料、Asset ID 與 renderer 版本必須產生相同 geometry manifest。

### 5.3 稀有度、難易度、卡號與 SSR

- 稀有度與難易度分欄保存，彼此獨立。
- N～SSR 依成語正面意義、勵志程度、精神象徵、共鳴力與代表性判定。
- UR 只保留給具有可稽核正式授權的外部 IP 聯名。
- N、R、SR、SSR 各自使用 current Approved 專屬外框。
- SSR 必須具備金龍稀有度徽章、v2.8 全框虹彩霓虹 overlay 與史詩級構圖。
- N／R／SR 不得使用 SSR 徽章或完整多色虹彩外框。
- 右上難易度元件不得因稀有度改色；UR 省略難易度徽章並使用 IP 專屬聯名標籤。
- 正式卡號唯一來源為 `data/cards/card-number-registry.json`。
- 卡號格式固定 `{rarity}-{sequence:0000}`，各稀有度全專案獨立流水，章節不得重置。
- 已分配或退役的卡號不得改寫或重用。
- 沒有可稽核授權的 UR 不得消耗正式 `UR-####` 卡號。

### 5.4 九大主題徽章

左下類別只能從：

```text
data/cards/theme-badge-registry.json
```

解析：

```text
軍事、內政、智謀、文藝、勵志、修身、人際、警世、見識
```

- `secondaryThemeTags` 只供管理與搜尋，不得顯示於卡面。
- 同一類別永遠使用同一枚 current Approved 透明 PNG 母件。
- 圖片模型不得生成、改色或重畫主題徽章。

### 5.5 角色與審核

- 第一章 61 張中，女性主要視覺角色至少 31 張。
- 每個產製批次女性主要視覺角色至少 50%，奇數張向上取整。
- 新卡預設 `renderMode = modular`。
- Review／Approved composite 是 derived output，不能成為唯一 canonical source。
- 產製 Agent 不得自行把自己的輸出標記為最終 Approved。
- 來源、授權、Drive File ID、SHA-256 或獨立核准不足時，只能維持 Draft／Review。

### 5.6 每關贈卡、隱藏積分與升級永久規則

每個主線關卡必須具備跨章永久 `campaignOrdinal`。

```text
一般關：首次完成後，從該關出現過的成語抽 1 張，最低 N
全域 10 倍數關：從已完成範圍抽 1 張，最低 R
全域 100 倍數關：從已完成範圍抽 1 張，最低 SR
```

- 第 100 關只發一張，不另外疊加第 10 關獎勵。
- 重玩、升星或刷新最佳紀錄不得再次發卡。
- 抽卡完全隨機並允許重複；不採未持有優先。
- UR 永久排除一般主線贈卡與一般升級。
- 卡池為空時 grant 保持 `pending`，不得降到該關保底以下。

隱藏積分：

```text
E=1、D=2、C=3、B=4、A=5、S=6
SR tickets  = min(hiddenRewardScore, 400)
SSR tickets = min(floor(hiddenRewardScore / 10), 100)
```

- 前十關合計 50 分時：SR 50／1000、SSR 5／1000。
- 隱藏積分跨章累積，不因每 10／100 關重置。
- 正式玩家 UI 不得顯示積分、機率或 roll value。
- 機率快照與卡片結果必須先持久化，再播放動畫。

重複卡升級：

```text
10 張可消耗 N  → 1 張隨機 R
10 張可消耗 R  → 1 張隨機 SR
10 張可消耗 SR → 1 張隨機 SSR
```

- 每種卡至少保留 1 張，只能消耗 `ownedCount - 1`。
- 素材可混合不同成語與已完成章節，但不得混合不同稀有度。
- 自動選材先依可消耗數量降冪，再依 canonical 四位數卡號升冪。
- 產物只來自已通關內容的下一稀有度，完全隨機且可重複。
- 無合法產物時不得扣除素材。
- 扣料、入庫、upgrade record 與 metadata 必須在同一 readwrite transaction。

收藏資料庫：

```text
Database：cicg-card-collection
Version：2
Stores：grants、inventory、metadata、upgrades
```

- Version 1 legacy grants 與 inventory 必須無損保留。
- legacy 十關 grant 已覆蓋的關卡不得在 migration 時重複發卡。
- `cicg-progress` 仍維持 Version 1，不得因收藏功能修改。

---

## 6. GitHub 與 Drive 分工

GitHub 存放：

- 程式碼、測試與 CI
- CSV、JSON、Schema、Registry
- 技術規格與 Implementation Plan
- 圖卡技能、批次狀態、render plan、Manifest
- Drive File ID、Folder ID、SHA-256、版本、Migration Ledger 與 drift report

Drive 存放：

- UI／UX 圖、Logo、Icon、背景
- 成語圖卡 artwork、component master 與 composite PNG
- 音效、影片、校訂與授權文件
- 實機測試證據與發布交付物

Drive 固定頂層：

```text
00_Project_Management
01_Design_And_Specs
02_UI_UX_And_Visuals
03_Game_Content_And_Data
04_Testing_And_Evidence
05_Releases_And_Store_Assets
80_Inbox
90_Archive
```

- Inbox 只作 intake，不得直接進 Approved。
- 同一 `assetType + identity` 最多只有一個 current Approved master。
- 搬移必須保留 File ID，並驗證 parent、checksum、大小、MIME 與 URL。
- 舊版移入 Archive，不永久刪除。
- Blocking drift 未解決時，不得核准、發布或開始下一批。

---

## 7. 分支、PR 與合併

使用：

```text
feat/<功能>
fix/<問題>
docs/<文件>
test/<驗證>
```

禁止：

- 直接在 `main` 開發
- 同一任務重複開 PR
- 未同步 `main` 就繼續舊分支
- 加入未核准功能
- 刪除測試或永久 Gate
- 關閉 TypeScript strict
- 大範圍關閉 ESLint

PR 合併前必須確認：

- `behind_by = 0`
- 最新 head CI 全綠
- 測試數量、TypeScript、Lint、Build、PWA 與 npm audit 有證據
- Drive 新增或移動素材有紀錄
- unresolved review threads = 0
- ChatGPT Audit 通過

通過後優先使用 Squash Merge。