# 成語內容包

本目錄保存成語內容的機器資料與人類校訂紀錄。

## 單一真實來源

```text
data/idioms/<status>/<slug>.json
```

Markdown 只負責說明與稽核，不得覆蓋 JSON 內容。

## 狀態與路徑

| 路徑 | contentStatus | 用途 |
|---|---|---|
| `data/idioms/review/` | `NeedsReview` | 內部設計、Review 圖卡、待校訂內容 |
| `data/idioms/approved/` | `Approved` | 正式遊戲資料與 Renderer |
| 歷史封存 | `Deprecated` | 稽核使用，不得建立新卡 |

## 必須分開的內容

- `meaning`：現代釋義。
- `allusionSummary`：典故意象、來源背景與用法演變。
- `primarySource`：朝代、作者、作品、篇章、短引文與網址。
- `rendererProjection`：卡面需要的純成語資料。

角色、IP、卡號、稀有度與聯名箴言不屬於通用成語內容包。

## 新增流程

1. 在 `data/idioms/review/` 建立 JSON。
2. 在 `docs/idioms/review/` 建立對應校訂紀錄。
3. 執行：

```bash
npm run validate:idiom-content
npm run test:idiom-content
```

4. 完成文字與來源校訂後，同一 PR 將 JSON 與 Markdown 移入 `approved/`，並把 `contentStatus` 改為 `Approved`。
5. 只有 Approved 內容才可遷移到正式字典或正式卡池。

## 命名

```text
data/idioms/review/<romanized-slug>.json
docs/idioms/review/<romanized-slug>-content-review-v<version>.md
```

首份範例：

```text
data/idioms/review/mian-li-cang-zhen.json
docs/idioms/review/mian-li-cang-zhen-content-review-v1.0.md
```
