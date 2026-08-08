# UR 聯名卡技能與注音 Gate ChatGPT Audit

日期：2026-08-08  
PR：#44  
分支：`feat/ur-collaboration-skill-zhuyin-gate`  
基準 main：`5bdfd6eed30ec104ce9cd8212b01262312d7af94`

## 1. 稽核範圍

本次稽核確認：

- 新增 Repository-local UR 聯名卡技能。
- 使用者最小輸入只有 IP 名稱與角色正式名稱。
- 未指定成語時，技能依角色核心行動、啟用成語、來源可校訂性與重複狀態自動選擇。
- 成語原始難度保留於資料層；UR 卡面省略難度徽章並使用 IP 專屬聯名標籤。
- 圖片模型只產生 `1024 × 1200 px` 無文字 artwork。
- Renderer 維持 v2.6.1 `1024 × 2000 px`、`360／1200／440` 與 `±2 px` 幾何。
- 注音固定由結構化 `bopomofo[4]` 文字節點渲染。
- 平假名、片假名、片假名擴充與半形片假名使用專屬 finding 阻擋。
- 缺少可稽核授權證據時只可 Draft／Review，不得 Approved、發布或進正式卡池。
- UR 仍排除於一般里程碑免費卡池，且沒有變更 IndexedDB Schema。

## 2. TDD 證據

### RED

GitHub Actions CI #487：`failure`

預期且已確認的四個失敗：

1. Validator 尚未回傳 `japanese-kana-in-bopomofo`。
2. `.agents/skills/generating-cicg-ur-collaboration-cards/SKILL.md` 尚不存在，造成三項技能契約測試失敗。

RED 結果證明測試確實覆蓋新行為，而不是在既有實作上誤綠。

### GREEN

GitHub Actions CI #494：`success`

- 全部 Node tests：`357 / 357` 通過。
- Card tests：`106 / 106` 通過。
- Puzzle tests：`37 / 37` 通過。
- 新增日文假名案例：平假名、片假名、注音混入平假名、半形片假名全部通過阻擋測試。
- 新增 UR 技能契約：入口路由、最小輸入、自動成語、Renderer-only 注音、授權 Review Gate 全部通過。
- Drive Registry：`folders=60 assets=19 migrations=3` 通過。
- Theme Badge Registry：`badges=9 approved-assets=9` 通過。
- 第一章 Card Catalog：61 筆 canonical record，永久 Gate `8 / 8` 通過。
- TypeScript strict：通過。
- ESLint：通過。
- Vite production build：通過。
- PWA：`12 entries`，precache `403.40 KiB`，`sw.js` 與 Workbox 產生成功。
- `npm audit`：`0 vulnerabilities`。

## 3. 實作審核

### Validator

- 新增 Unicode 日文假名範圍：
  - `U+3040–U+309F`
  - `U+30A0–U+30FF`
  - `U+31F0–U+31FF`
  - `U+FF65–U+FF9F`
- 日文假名優先回傳 `japanese-kana-in-bopomofo`。
- 其他錯誤仍回傳 `invalid-bopomofo`。
- 既有正確四筆臺灣注音維持通過。

### 技能

- 新技能 frontmatter、觸發條件與最小輸入明確。
- 不要求使用者重貼可由 Repository 解析的資料。
- 無 Renderer、Approved 元件、標籤、字型或授權證據時會保留 `pending`／`blocked`／`Review`，不會降級為模型生成完整卡面。
- 產製 Agent 不得自行核准輸出。

### 文件一致性

以下入口已一致登錄：

- `AGENTS.md`
- 一般成語圖卡技能
- UR 聯名卡專屬技能
- UR 正式母提示語
- UR 標準 v1.1
- UR 技能與注音 Gate 規格
- Required Specifications

## 4. 風險與結論

- 本次沒有宣稱任何外部 IP 已正式授權。
- 本次沒有加入或移動 Drive 圖像資產。
- 本次沒有修改主玩法、進度 Schema、收藏 Schema、付費、後端或正式卡池內容。
- GitHub Actions 顯示 `actions/checkout@v4` 與 `actions/setup-node@v4` 的 Node 20 runtime deprecation 警告；實際專案驗證使用 Node `22.16.0`，不影響本次結果，但後續可另案升級 Actions major version。

結論：**PASS**。UR 聯名卡技能與臺灣注音防日文化 Gate 符合核准規格，可進入最終 CI、PR 收斂與 Squash Merge。
