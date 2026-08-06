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
src/domain    領域模型
src/idioms    成語資料
src/game      自由接龍
src/puzzle    填字盤面與導航
src/progress  闖關進度與 IndexedDB
src/bonus     打地鼠
src/pwa       PWA
src/app       React UI
```

- 領域規則使用純 TypeScript。
- React 只負責畫面與瀏覽器事件。
- 不得把核心規則寫進 DOM、動畫 callback 或不可測試的亂數流程。
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
- 稀有度或難易度
- 圖卡審核
- 每十關免費贈卡
- 收藏頁或卡池
- 圖卡購買或卡包
- UR 或外部 IP 聯名

必須依序閱讀：

```text
1. docs/superpowers/specs/2026-08-06-idiom-card-rarity-standard-design.md
2. docs/superpowers/specs/2026-08-06-idiom-card-review-governance-design.md
3. docs/superpowers/specs/2026-08-06-idiom-card-collection-design.md
```

發生衝突時，以上順序即為規範優先序。

永久規則：

- N～SSR 主要依成語正面意義、勵志程度、精神象徵、共鳴力與代表性判定。
- 稀有度不得只依畫面華麗度、成語艱深度或角色強弱判定。
- 稀有度與難易度分欄保存。
- SSR 是高正面價值與高精神象徵卡。
- UR 只保留給取得正式授權的外部 IP 聯名。
- 未取得可稽核授權前，不得製作、發布、發放或販售正式 UR 聯名卡。
- Review、Rejected、Deprecated、來源未校訂或權利不清的卡不得進入正式卡池。
- 圖卡必須符合 Approved 模板、直式 `2:3`、繁體中文、人物情境與最下方單行典故來源。

Agent 不得自行把自己產製的圖卡直接標記為最終 Approved。

---

## 5. GitHub 與 Drive 分工

GitHub 存放：

- 程式碼、測試與 CI
- CSV、JSON、Schema
- 技術規格與 Implementation Plan
- 圖卡定義、稀有度理由與審核紀錄
- Drive File ID、SHA-256 與版本參照

Drive 存放：

- UI／UX 圖
- Logo、Icon、背景
- 成語圖卡圖片
- 音效與影片
- 校訂與授權文件
- 實機測試證據
- 發布交付物

圖卡素材路徑：

```text
80_Inbox/Idiom_Cards
02_UI_UX_And_Visuals/Idiom_Cards/Approved
80_Inbox/Idiom_Cards/Changes_Requested
90_Archive/Idiom_Cards
```

新素材先進 Inbox；核准後移入 Approved；舊版移入 Archive。

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

規格 PR 保持 docs-only，不得順便加入 production code。

PR 合併前必須確認：

- 與 main 無落後或已完成同步
- CI 全綠
- 測試、TypeScript、Lint、Build、PWA 與 npm audit 結果有紀錄
- Drive 新增或移動素材有紀錄
- ChatGPT Audit 已完成

通過後優先使用 Squash Merge。