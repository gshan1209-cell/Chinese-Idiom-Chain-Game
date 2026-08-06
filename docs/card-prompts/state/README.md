# 成語圖卡跨聊天批次狀態 v2

`current-batch.json` 是成語圖卡產製工作的接續狀態，不是發布、授權、checksum 或上傳證據。

新聊天在處理「繼續產圖」、「下一批」、「修正上一批」、「審核圖卡」、「組卡」或「上傳素材」前，必須先讀取：

```text
.agents/skills/generating-cicg-idiom-cards/SKILL.md
docs/card-prompts/state/current-batch.json
```

## 批次層級欄位

```text
schemaVersion
project
defaultRenderMode
layoutVersion
componentSetVersion
activeBatchId
workflowStatus
nextAction
lastUpdatedAt
cards
```

初始預設：

```text
schemaVersion = 2
defaultRenderMode = modular
layoutVersion = 2.6
componentSetVersion = 1.0
```

## 合法工作流狀態

```text
ready
in-progress
blocked
completed
```

## 單卡主要狀態

```text
planned
content-ready
artwork-generated
artwork-approved
composition-rendered
changes-requested
approved
uploaded
archived
```

不得跳過必要 Gate：

```text
planned
→ content-ready
→ artwork-generated
→ artwork-approved（獨立 artwork 審核後）
→ composition-rendered
→ changes-requested（有問題時）
→ composition-rendered（修正後）
→ approved（獨立最終核准後）
→ uploaded（對應資產確認 Drive 上傳後）
→ archived（版本淘汰時）
```

## Artwork 與 Composition 子狀態

```text
artworkStatus:
planned | generated | changes-requested | approved | uploaded

compositionStatus:
pending | rendered | changes-requested | approved | uploaded | blocked
```

`artwork-generated` 不代表已組卡。

`composition-rendered` 不代表已核准或已上傳。

Renderer 尚未完成時，允許：

```text
artworkStatus = generated / approved / uploaded
compositionStatus = pending / blocked
```

不得因此把所有 UI 烙入 canonical artwork。

## 單卡必填欄位

```text
cardId
idiom
rarity
difficulty
version
renderMode
layoutVersion
componentSetVersion
rarityBadgeId
status
artworkStatus
compositionStatus
artworkAssetId
artworkFilename
compositeFilename
artworkDriveFileId
compositeDriveFileId
artworkSha256
compositeSha256
sourceReviewStatus
rarityReviewStatus
findings
nextAction
```

未知值使用 `null`，不得猜測。

## 元件化證據規則

- 新卡預設 `renderMode = modular`。
- 舊整張 PNG 明確標記 `flat-legacy`。
- Artwork 與 composite 使用不同檔名、Drive File ID、SHA-256 與狀態。
- 修改 difficulty 或 rarity badge 時，artwork asset ID 與 checksum 必須不變。
- `rarityBadgeId`、`componentSetVersion` 與 `layoutVersion` 必須可追溯。
- Composite 是 derived output，不得取代 artwork／component／data canonical source。

## 更新時機

下列事件後必須更新狀態檔：

- 建立、替換或取消批次
- 完成單卡內容資料
- Artwork 生成、重產、退回、核准或上傳
- Component set 或 badge version 改變
- Composition render、退回、核准或上傳
- 批次完成或阻塞原因改變

Drive、checksum、版本或發布狀態變更時，同步更新 `docs/card-prompts/manifest.md`。

## 安全規則

- 未上傳不得填寫 Drive File ID。
- 未計算不得填寫 SHA-256。
- 未校訂來源或稀有度不得標記 `Verified`。
- Producer 不得自行將 artwork 或 composite 標記最終 Approved。
- 狀態檔與 Drive／Manifest 不一致時，先回報漂移並修正。
- 歷史聊天只能協助理解，不得覆寫 GitHub `main` 與可稽核證據。

## 完成批次

批次所有預定交付完成後：

- `workflowStatus` 設為 `completed`
- `nextAction` 說明是否建立下一批
- 保留本批紀錄直到下一批正式建立
- 歷史詳情由 Manifest、Git commit、審核紀錄與 Drive 保存