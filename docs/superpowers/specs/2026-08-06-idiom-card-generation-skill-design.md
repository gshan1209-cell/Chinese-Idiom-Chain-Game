# 成語圖卡跨聊天產製技能設計 v1.0

日期：2026-08-06  
Repository：`gshan1209-cell/Chinese-Idiom-Chain-Game`  
狀態：Approved  
範圍：專案內 Agent 技能、批次狀態契約與文件入口；不包含 production code

## 1. 目的

讓 Chinese-Idiom-Chain-Game 專案內的任何新聊天，在收到「產生成語圖卡」、「繼續產圖」、「下一批」、「修正上一批」、「審核圖卡」或「上傳素材」等要求時，不依賴舊聊天記憶，而是從 GitHub `main` 取得最新規格、技能與批次狀態後接續工作。

本設計只適用於本專案，不建立跨所有 ChatGPT 專案的全域技能。

## 2. 核心架構

新增 Repository-local skill：

```text
.agents/skills/generating-cicg-idiom-cards/
├─ SKILL.md
└─ references/
   ├─ required-specs.md
   └─ review-checklist.md
```

新增跨聊天狀態：

```text
docs/card-prompts/state/
├─ README.md
└─ current-batch.json
```

更新入口：

```text
AGENTS.md
docs/card-prompts/README.md
```

## 3. 真實來源與讀取順序

每次技能觸發時，Agent 必須先同步或讀取最新 `main`，再依序讀取：

1. `AGENTS.md`
2. `.agents/skills/generating-cicg-idiom-cards/SKILL.md`
3. `.agents/skills/generating-cicg-idiom-cards/references/required-specs.md`
4. `docs/card-prompts/state/current-batch.json`
5. 與任務相關的最新 Approved 規格、母提示語、負面限制、單卡提示語與 Manifest
6. Drive 最新 Approved 模板與 Inbox 素材

真實狀態優先序：

```text
GitHub main
→ GitHub Actions
→ Repository Approved 規格與技能
→ current-batch.json
→ Drive Approved 素材
→ Manifest 與審核紀錄
→ 聊天紀錄
```

## 4. 技能觸發範圍

下列意圖必須觸發本技能：

- 建立、產生、繪製成語圖卡
- 接續上一批或下一批圖卡
- 修正、重產、審核、核准圖卡
- 上傳圖卡、整理 Drive、更新 Manifest
- 規劃圖卡批次、稀有度、難易度、典故、注音或箴言

不適用於一般遊戲程式開發、主線關卡、自由接龍、打地鼠或與圖卡無關的素材。

## 5. 接續契約

新聊天收到簡短指令時不得要求使用者重新貼完整規格。

Agent 應先讀取 `current-batch.json`：

- 有 Active Batch：依 `nextAction` 與卡片狀態接續。
- 沒有 Active Batch：建立或提議下一批，預設一批 10 張。
- 狀態檔與 Drive／Manifest 不一致：先回報漂移，不得猜測已完成。
- 使用者指定成語：以指定清單建立或更新批次。
- 使用者要求直接產圖且資料完整：使用可用圖片生成工具直接產製 Review 圖，不重問已由規格決定的版型。

## 6. 狀態模型

`current-batch.json` 固定使用可機器讀取的 JSON，至少包含：

```ts
export type CardProductionStatus =
  | 'planned'
  | 'content-ready'
  | 'generated'
  | 'changes-requested'
  | 'approved'
  | 'uploaded'
  | 'archived';

export interface CardBatchState {
  readonly schemaVersion: 1;
  readonly project: 'Chinese-Idiom-Chain-Game';
  readonly activeBatchId: string | null;
  readonly workflowStatus: 'ready' | 'in-progress' | 'blocked' | 'completed';
  readonly nextAction: string;
  readonly lastUpdatedAt: string;
  readonly cards: readonly CardProductionEntry[];
}
```

每張卡至少記錄：

- `cardId`
- 成語
- 稀有度
- 難易度
- 版本
- 狀態
- 圖片檔名
- Drive File ID／URL
- 來源與稀有度校訂狀態
- Findings
- 下一步

## 7. 狀態更新規則

每次發生下列事件後，必須更新狀態檔與必要的 Manifest：

- 批次建立或清單變更
- 內容資料完成
- 圖片生成
- 審核退回
- 圖片核准
- Drive 上傳或移動
- 批次完成或中止

禁止只在聊天中宣稱完成而不更新 Repository 狀態。

敏感或尚未取得的資料不得偽造；未知 Drive File ID 必須為 `null`。

## 8. 產圖與審核 Gate

技能不重複完整規格，而是強制讀取最新文件。最低永久 Gate：

- v2.1、直式 `2:3`、建議至少 `1024 × 1536`
- 四字繁體成語與逐字直立注音
- 禁止漢語拼音與其他羅馬拼音
- 左上稀有度、右上難易度，兩者分離
- 中央至少一名人物以動作表達成語
- 左下完整主題徽章
- 下方只使用「典故」
- 右下低高度窄版直式箴言牌匾
- 最下方單行典故來源
- N～SSR 依正面意義與精神價值判定
- UR 只限具有正式授權證據的 IP 聯名
- 未通過 Blocking Gate 的圖片只能標記 Review／Changes Requested

## 9. Agent 行為

- 新聊天不得把聊天摘要視為唯一真實來源。
- 不得要求使用者重新回答已由 Repository 決定的版型問題。
- 使用者要求產圖時，應使用可用圖片生成工具，不得只回傳 Prompt 代替成品。
- 產製 Agent 不得自行將自己的輸出直接標為最終 Approved。
- 無法讀取 GitHub、Drive 或指定素材時，必須明確指出缺少的證據。
- 所有圖片以原始 PNG 逐檔保存，不使用 ZIP／RAR／7z 取代。

## 10. 驗證情境

### 基線失敗

在本技能建立前，新聊天只有 `PROJECT_PROMPT.md` 與規格文件，沒有可被 Agent 搜尋的 `SKILL.md`，也沒有機器可讀的 Active Batch 狀態；因此使用者必須手動貼指令，Agent也無法可靠判斷上一批做到哪裡。

### 驗收情境

1. 使用者只說「繼續產圖」：Agent 讀取狀態並說明精確下一步。
2. 使用者說「下一批 10 張」：Agent 讀取規格、避免重複卡，建立新批次。
3. 狀態標示 generated、Drive ID 為 null：Agent 不得宣稱已上傳。
4. 圖片文字錯誤：Agent 將狀態改為 changes-requested，不得 Approved。
5. 使用者要求 UR 聯名但無授權證據：Agent 阻擋正式產製。
6. 使用者指定已核准清單直接產圖：Agent 不重問版型，直接依最新 Prompt 產製 Review 圖。

## 11. 非目標

- 不建立後端或雲端工作流服務。
- 不讓狀態檔取代 GitHub／Drive 真實證據。
- 不修改遊戲 production code、關卡或 IndexedDB Schema。
- 不建立跨其他專案的全域圖卡技能。
- 不將未產生、未上傳或未核准的素材標記為完成。