# Chinese-Idiom-Chain-Game

**中文成語填填字（CICG）**是一款手機優先、大字體、繁體中文、離線優先、可安裝 PWA 的成語填字闖關遊戲。

主玩法是第一章 20 關縱橫成語填字；自由接龍、成語打地鼠、成語電台與影音中心均為附加功能。主線另提供完成第 5／10／15 關後解鎖的三階段陷阱玩法，以及每完成 10 個不同主線關卡建立一筆圖卡收藏獎勵的資料核心。

## 目前完成範圍

- React + TypeScript strict + Vite PWA。
- 70 筆繁體中文開發示範成語、JSON Schema、索引與 SHA-256 驗證。
- 第一章 20 關、61 個 placement、61 個不同 `idiomId`、61 個不同成語文字。
- 純 TypeScript 填字盤面、智慧自動跳格與 session 引擎。
- 關卡地圖、逐關解鎖、1～3 星、最佳紀錄與 IndexedDB 本機保存。
- 候選偽字：完成第 5 關後解鎖。
- 盤面伏字：完成第 10 關後解鎖。
- 頑固伏字：完成第 15 關後解鎖，三次有效連擊拔除。
- 自由接龍、能量槽、15 秒成語打地鼠與四種難度。
- HTTPS 成語電台、可見 YouTube iframe、媒體互斥播放與本機備份。
- 圖卡收藏資料核心 v1：每十關里程碑、舊進度補發、決定性解析、冪等 inventory 與原子化 IndexedDB 交易。
- Android／Chromium 安裝提示、iPhone／iPad 加入主畫面與離線更新提示。

## 尚未實作

- 第二章與更多關卡。
- 正式核准的成語圖卡卡池。
- 圖卡收藏圖鑑、卡片詳細頁與揭示動畫。
- 圖卡購買、固定內容卡包、登入、雲端備份與跨裝置同步。
- 60 秒限時模式、選擇題模式、成語小冊與完整設定頁。
- 核准後的正式內建電台／YouTube 清單。
- Lighthouse、瀏覽器 E2E、Android／iOS 實機與完整離線 PWA 驗收。

## 快速啟動

需求：Node.js `>=22.13.0`、npm `>=10`。

```bash
./start.sh
```

預設位置：`http://localhost:5173`

```bash
./test.sh              # 建置資料並執行全部核心測試
./build.sh             # 建立正式 PWA 產物
./scripts/verify.sh    # test、typecheck、lint、build
```

## 成語填字闖關

- 上方顯示由 2～4 個成語交叉組成的方格。
- 點選可填格，或依智慧自動跳轉順序連續輸入候選字。
- 正確格顯示綠色；錯字保留並顯示紅色。
- 盤面未填滿時先尋找下一空格；填滿後巡回錯誤格。
- 提示填入一格正確答案；重排只改變候選字順序。
- 全部完成後顯示本關成語與解釋。

### 闖關保存

- 第 1 關永遠解鎖；完成第 N 關後解鎖第 N+1 關。
- 三星：0 提示、0 錯誤。
- 二星：最多 1 次提示、2 次錯誤。
- 一星：完成關卡。
- 重玩只保存更佳星級、最高分、最少錯誤與最少提示。

```text
Database：cicg-progress
Version：1
Store：campaigns
Key：chapter-1
```

收藏功能不修改上述 schema。

## 三階段陷阱模式

陷阱是主線的選用玩法，標準模式永遠是預設。

### 候選偽字

- 完成第 5 關後解鎖。
- 安全偽字只使用啟用字典，排除答案與合法候選字。
- 只有成功放入合法字牌才推進偽字出現。
- 點擊偽字不填盤面、不記錯、不扣分、不消耗提示。

### 盤面伏字

- 完成第 10 關後解鎖，並保留候選偽字。
- 以獨立 overlay 覆蓋合法空格，不寫入 `PuzzleSession`。
- 可單擊拔除；放字或提示命中目標格時也會安全驅逐。
- 完成關卡時所有未處理伏字立即取消，不阻擋結算。

### 頑固伏字

- 完成第 15 關後解鎖，組合三層陷阱。
- 同時最多顯示一個，需三次有效連擊拔除。
- 最小有效點擊間隔 80ms；連擊視窗 700ms。
- 被占用格不允許一般放字；提示會先清除伏字再填入答案。
- 支援 44px 觸控、Pointer Events、ARIA 進度與 reduced-motion。

## 圖卡收藏資料核心 v1

完成不同主線關卡數達 10、20、30……時，建立固定且不可重複的獎勵：

```text
card-grant:main-levels:10
card-grant:main-levels:20
```

規則：

- 只計算首次完成的不同主線關卡；重玩與升星不增加里程碑。
- 舊玩家載入後會依已保存進度補建缺少的里程碑 Grant。
- 正式卡片必須有四字逐字注音與四字帶聲調漢語拼音。
- Review、Legacy、NeedsReview、未核准稀有度、遠端素材與模板空框不得進池。
- UR 僅保留給具正式授權證據的 IP 聯名，且不進一般十關卡池。
- 未持有卡優先；核心使用注入 RNG，不直接散落呼叫 `Math.random()`。
- `rewardId` 與 `acquisitionId` 均具冪等保護。
- Grant 與 inventory 在同一 IndexedDB readwrite transaction 保存。
- 已解析 Grant 若缺少 inventory，可依既有卡片與 acquisitionId 修復，不重新抽卡。
- 空白正式卡池不需載入字典，仍可離線建立 pending Grant。
- 關卡進度保存成功後才同步收藏；收藏失敗不回滾闖關結果。

```text
Database：cicg-card-collection
Version：1
Stores：grants、inventory、metadata
Metadata key：collection
```

目前 `IDIOM_CARD_DEFINITIONS` 為空陣列，因此第 10／20 關獎勵會安全保持 `pending`，不會使用未核准圖片冒充已取得圖卡。

## 自由接龍與成語打地鼠

- 下一個成語第一字必須等於目前成語最後一字。
- 只接受啟用中的四字成語，同一局不能重複。
- 基礎分 100；連擊加成每次增加 20，上限 200。
- 能量滿後由玩家自行啟動 15 秒打地鼠。
- 手機 6 洞、桌面 9 洞，支援觸控、滑鼠與數字鍵。
- 獎勵包含提示券、雙倍分數與失誤護盾。

## 成語電台與 YouTube 影音中心

- 首次開啟不會自動發聲，必須由玩家主動播放。
- HTTPS 收音機可跨首頁、闖關與自由接龍持續播放。
- 打地鼠期間音量降至最新基準音量的 30%，結束後恢復。
- 收音機與 YouTube 互斥播放。
- YouTube 使用可見的官方 16:9 iframe，不抽取或下載音訊。
- 離線或網路來源失敗不影響成語遊戲。

```text
Database：cicg-media
Version：1
Stores：library、preferences
```

## 成語資料

人工來源：`data/idioms.source.csv`

```bash
npm run build:data
```

> [!WARNING]
> 現有 70 筆內容是開發示範資料。正式教育產品發布前，必須完成來源授權、文字、注音、拼音、解釋與例句校訂。

## 架構

```text
src/domain       領域型別與遊戲契約
src/idioms       字典索引與載入
src/puzzle       填字關卡、盤面與導航
src/progress     星級、解鎖與闖關 IndexedDB
src/traps        三階段陷阱純 TypeScript 引擎
src/cards        圖卡定義、里程碑、Inventory 與收藏 IndexedDB
src/game         自由接龍
src/bonus        打地鼠
src/media        媒體清單、播放政策與 IndexedDB
src/app          React UI 與瀏覽器事件 Hook
src/pwa          PWA 安裝與裝置判斷
```

領域規則維持純 TypeScript；React 只負責畫面、瀏覽器事件與協調安全保存節點。

## 驗證

Pull Request CI 執行 `./scripts/verify.sh`，包含資料建置、全部 Node 測試、TypeScript strict、ESLint 與 production PWA build。

永久 Gate 包含：

- 第一章 20 關、61 個唯一 `idiomId` 與 61 個唯一成語文字。
- Puzzle 導航、逐關可完成性與進度保存。
- 三階段陷阱解鎖、安全字／安全格、操作隔離、重玩重設與 reduced-motion。
- 媒體 URL 安全、播放互斥、打地鼠降音、本機保存與可見 iframe。
- 圖卡定義 allowlist、注音／拼音、核准 Gate、里程碑補發、決定性解析、冪等 inventory、snapshot 隔離、原子 IndexedDB transaction 與闖關保存順序。

## 文件

- [開發規格書](docs/specs/chinese-idiom-chain-game-v1.0-spec.md)
- [成語電台與 YouTube 影音中心設計規格](docs/superpowers/specs/2026-08-06-media-center-design.md)
- [進階陷阱模式設計規格](docs/superpowers/specs/2026-08-06-trap-mode-design.md)
- [頑固伏字交付報告](docs/superpowers/reports/2026-08-06-trap-stubborn-intruders-delivery.md)
- [圖卡收藏與十關贈卡設計規格](docs/superpowers/specs/2026-08-06-idiom-card-collection-design.md)
- [收藏資料核心 v1 設計規格](docs/superpowers/specs/2026-08-06-card-collection-core-v1-design.md)
- [收藏資料核心 v1 Implementation Plan](docs/superpowers/plans/2026-08-06-card-collection-core-v1.md)
- [收藏資料核心 v1 交付報告](docs/superpowers/reports/2026-08-06-card-collection-core-v1-delivery.md)
