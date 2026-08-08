# 成語內容包與卡牌變體

本目錄保存成語內容的機器資料與人類校訂紀錄。

## 單一真實來源

```text
data/idioms/<status>/<slug>.json
```

共用成語 JSON 是注音、釋義、典故、來源、例句、一般副標、一般箴言、難度與基礎稀有度的唯一真實來源。Markdown 只負責說明與稽核，不得覆蓋 JSON。

## 兩層資料模型

### 共用成語庫

```text
data/idioms/review/
data/idioms/approved/
```

可供一般卡、主線關卡、其他聯名與 Renderer 共用。

`baseRarity` 只描述成語本體的 SR／SSR 水準，不代表卡面一定是聯名卡。

### 聯名覆寫層

```text
data/card-variants/review/<ip>/
data/card-variants/approved/<ip>/
```

只保存角色、招式、聯名副標、聯名箴言與卡面演出。它必須引用共用 `idiomId`，不得重複定義成語典故或來源。

UR 是聯名版本稀有度，只能存在於變體層。

## 狀態與路徑

| 路徑 | contentStatus | 用途 |
|---|---|---|
| `data/idioms/review/` | `NeedsReview` | 待校訂的一般成語內容 |
| `data/idioms/approved/` | `Approved` | 正式遊戲與一般 Renderer |
| `data/card-variants/review/` | `NeedsReview` | 待授權、待校訂的聯名覆寫 |
| `data/card-variants/approved/` | `Approved` | 已完成授權與內容 Gate 的聯名覆寫 |

## 共用內容必須分開

- `meaning`：現代釋義。
- `allusionType`：典故或語源類型。
- `allusionSummary`：完整典故／語源說明。
- `cardAllusion`：卡面短版典故。
- `primarySource`：來源證據。
- `genericCardCopy`：一般版本副標與五言四句箴言。
- `rendererProjection`：一般卡可直接使用的投影資料。

## 永久 Gate

1. 成語四字、注音四組。
2. 一般與聯名箴言皆為四句，每句五字。
3. 共用內容禁止 IP、角色或招式名稱。
4. 聯名覆寫必須引用有效 `idiomId`。
5. 聯名覆寫不得定義 `meaning`、`allusionSummary` 或 `primarySource`。
6. 沒有 `licenseEvidenceId` 不得核准聯名發布。
7. 詞條或典源尚未確認時使用 `sourceStatus: NeedsReview`，不得杜撰。

## 驗證

```bash
npm run validate:idiom-content
npm run test:idiom-content
```

CLI 會同時驗證共用成語庫與聯名覆寫層。

## 首批 v2 內容

```text
13 份共用成語內容包
13 份鬼滅 UR Review 覆寫
```

所有內容目前均為 `NeedsReview`，未分配正式 UR 卡號。
