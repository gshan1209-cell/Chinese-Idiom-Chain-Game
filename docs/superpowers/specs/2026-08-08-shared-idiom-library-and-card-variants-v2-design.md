# 共用成語庫與聯名覆寫層設計 v2.0

## 目標

把鬼滅之刃 UR 卡使用的 13 個成語先建立為可跨版本共用的成語內容包，讓一般卡、主線關卡、其他聯名與 Renderer 共用同一份注音、釋義、典故、來源、例句、副標及五言箴言；角色、招式與 IP 文案則留在聯名覆寫層。

## 資料邊界

### 共用成語庫

路徑：

```text
data/idioms/<status>/<slug>.json
```

保存：

- 四字成語與四組注音
- 現代釋義
- 典故類型、完整典故與卡面短版典故
- 來源證據與一般例句
- 主題、難度、SR／SSR 基礎稀有度
- 一般版副標與五字四句箴言
- 一般 Renderer 投影

不得保存：

- IP 名稱
- 角色名稱、稱號或性格
- 招式名稱
- 聯名限定副標、箴言或構圖

### 聯名覆寫層

路徑：

```text
data/card-variants/<status>/<ip>/<slug>.json
```

保存：

- `idiomId` 引用
- IP、角色及稱號
- 角色核心性格
- 主要招式及校訂狀態
- 聯名限定副標與五字四句箴言
- 卡面演出方向
- UR 稀有度、授權與發布狀態

不得重複定義：

- 成語文字與注音
- 釋義、典故或來源
- 一般例句
- 主題、難度及基礎稀有度

## Schema

共用內容包升級為 `schemaVersion: 2`，新增：

- `allusionType`
- `cardAllusion`
- `baseRarity`
- `genericCardCopy`
- `publicationStatus`
- Renderer 的 `subtitle`、`maximLines` 與 `baseRarity`

聯名覆寫使用獨立 `card-variant.schema.json`。

## 驗證 Gate

1. 共用成語必須恰好四個漢字，注音恰好四組。
2. 一般版與聯名版箴言皆為四句，每句恰好五個漢字。
3. 共用內容不得出現 IP、角色或招式名稱。
4. 聯名覆寫必須引用存在的 `idiomId`。
5. 聯名覆寫不得重新定義釋義、典故或來源。
6. 沒有 `licenseEvidenceId` 時不得標記為可發布。
7. Review 目錄內容一律維持 `NeedsReview`。
8. 一般成語的 `baseRarity` 只允許 SR 或 SSR；UR 只屬聯名變體。
9. 來源不足或詞條地位未確認時，必須使用 `sourceStatus: NeedsReview`，不得虛構典故。
10. 同一驗證入口必須同時檢查共用成語庫與聯名覆寫層。

## 首批內容

共用成語 13 筆：

百折不撓、捨己為人、一鳴驚人、勇往直前、外冷內熱、綿裡藏針、光明磊落、豪氣干雲、心如止水、至情至性、矢志不渝、疾風勁草、悲天憫人。

鬼滅 UR 覆寫 13 筆，對應九柱與主角四人。

## 發布狀態

本批資料一律：

```text
contentStatus: NeedsReview
publicationStatus:
  共用成語：internal-review
  聯名覆寫：not-approved-for-publication
```

尚未分配正式 UR 卡號，也不得在缺乏可稽核 IP 授權證據時公開或商用。
