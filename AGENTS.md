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
- 產生成語圖卡、繼續產圖或下一批
- 修正上一批、審核或上傳圖卡
- 稀有度或難易度
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

當使用者只說「繼續產圖」、「下一批」、「修正上一批」、「審核圖卡」或「上傳素材」時，Agent 必須先依狀態檔接續，不得要求使用者重新貼完整規格。

若狀態檔與 Drive／Manifest 不一致，必須先回報漂移，不得猜測已完成。

圖卡規格依序閱讀：

```text
1. docs/superpowers/specs/2026-08-06-idiom-card-rarity-standard-design.md
2. docs/superpowers/specs/2026-08-06-idiom-card-review-governance-design.md
3. docs/superpowers/specs/2026-08-06-idiom-card-collection-design.md
4. docs/superpowers/specs/2026-08-06-idiom-card-collection-data-integrity-amendment.md
5. docs/superpowers/specs/2026-08-06-card-template-v2.1-layout-amendment.md
6. docs/superpowers/specs/2026-08-06-card-template-v2.6-dimension-and-pronunciation-amendment.md
7. docs/superpowers/specs/2026-08-06-card-template-v2.7-ssr-badge-amendment.md
8. docs/card-prompts/PROJECT_PROMPT.md
```

v2.1 保留為歷史版面基礎；v2.6 覆寫尺寸、比例、注音位置與禁止羅馬拼音條款；v2.7 只覆寫 SSR 左上稀有度徽章的視覺標準。

發生衝突時，較新的 Approved 規格優先；技能與狀態檔不能取代 Drive、Manifest、來源、授權或核准證據。

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
- 四字主標下方第一列為四組逐字對齊注音；第二列為小寫、帶聲調符號的漢語拼音。
- 新產 SSR 圖卡必須使用 v2.7 傳奇級虹彩金龍徽章：大型立體金色 SSR、紫藍洋紅星雲核心與紫色菱形主寶石。
- SSR 徽章必須與 SR 在輪廓、材質、光效與主寶石上明顯區隔；只改文字、亮度或飽和度視為 Blocking failure。
- SSR 虹彩只限左上徽章，不得全面染色外框、難易度框、主圖、典故區、主題徽章或箴言牌匾。
- N／R／SR 不得套用 v2.7 SSR 徽章。
- 圖卡必須使用繁體中文、人物情境與最下方單行典故來源。
- 使用者要求正式產圖時，應使用可用的圖片生成工具，不得只回傳 Prompt 代替成品。
- 產製 Agent 不得自行把自己的輸出直接標記為最終 Approved。
- 產圖、審核、上傳或批次狀態改變後，必須更新 `current-batch.json`；Drive 或發布狀態變更時同步更新 Manifest。

---

## 5. GitHub 與 Drive 分工

GitHub 存放：

- 程式碼、測試與 CI
- CSV、JSON、Schema
- 技術規格與 Implementation Plan
- 圖卡技能、批次狀態、定義、稀有度理由與審核紀錄
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
