# 成語圖卡跨聊天批次狀態

`current-batch.json` 是成語圖卡產製工作的接續狀態，不是發布、授權或上傳證據。

新聊天在處理「繼續產圖」、「下一批」、「修正上一批」、「審核圖卡」或「上傳素材」前，必須先讀取：

```text
.agents/skills/generating-cicg-idiom-cards/SKILL.md
docs/card-prompts/state/current-batch.json
```

## 合法工作流狀態

```text
ready
in-progress
blocked
completed
```

## 合法單卡狀態

```text
planned
content-ready
generated
changes-requested
approved
uploaded
archived
```

狀態不得跳過必要 Gate：

```text
planned
→ content-ready
→ generated
→ changes-requested（有問題時）
→ generated（修正後）
→ approved（獨立核准後）
→ uploaded（確認 Drive 上傳後）
→ archived（版本淘汰時）
```

`generated` 只代表圖片已產生，不代表已上傳或核准。

`approved` 需要符合圖卡審核治理規格並有獨立核准證據。

`uploaded` 必須有真實 `driveFileId` 或可追溯 Drive URL。

## 必填欄位

批次層級：

- `schemaVersion`
- `project`
- `activeBatchId`
- `workflowStatus`
- `nextAction`
- `lastUpdatedAt`
- `cards`

單卡層級：

- `cardId`
- `idiom`
- `rarity`
- `difficulty`
- `version`
- `status`
- `imageFilename`
- `driveFileId`
- `driveUrl`
- `sourceReviewStatus`
- `rarityReviewStatus`
- `findings`
- `nextAction`

## 更新時機

下列事件發生後，必須更新狀態檔：

- 建立、替換或取消批次
- 完成單卡內容資料
- 圖片生成或重產
- 審核退回或核准
- Drive 上傳、移動或封存
- 批次完成或阻塞原因改變

Drive 或發布狀態變更時，同步更新 `docs/card-prompts/manifest.md`。

## 安全規則

- 未知值使用 `null`，不得自行猜測。
- 未上傳不得填寫 Drive File ID。
- 未校訂來源或稀有度不得標記 `Verified`。
- 產製 Agent 不得自行將自己的圖片標記最終 Approved。
- 狀態檔與 Drive／Manifest 不一致時，先回報漂移並修正，不得宣稱完成。
- 歷史聊天只能協助理解，不得覆寫 GitHub `main` 與可稽核證據。

## 完成批次

批次所有卡片完成預定交付後：

- `workflowStatus` 設為 `completed`
- `nextAction` 說明是否建立下一批
- 保留本批卡片紀錄，直到下一批正式建立
- 建立下一批時更換 `activeBatchId` 與 `cards`，歷史細節應由 Manifest、Git commit 與 Drive 保存