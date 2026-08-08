# 成語內容包標準 v1.0 設計規格

狀態：Approved  
日期：2026-08-08  
適用範圍：Chinese-Idiom-Chain-Game 的一般卡、UR 聯名卡與未來教育內容校訂流程。

## 1. 目標

建立一套可重複使用的成語內容包，讓成語文字、注音、現代釋義、典故摘要、原始來源、例句、主題分類與 Renderer 投影都由同一份結構化資料提供。

首份範例為「綿裡藏針」，但正式來源詞頭為「綿裡針」，內容包必須保存異形關係，避免把卡面顯示文字誤當成辭典正詞頭。

## 2. 單一真實來源

- `data/idioms/<status>/<slug>.json` 是機器可讀的唯一真實來源。
- `docs/idioms/<status>/<slug>-content-review-v1.0.md` 是人類校訂與稽核紀錄。
- 卡面提示語不得反向成為成語內容來源。
- Renderer 只讀取內容包的 `rendererProjection`，不得從自然語言提示語解析成語文字。
- 一般遊戲字典 `data/idioms.source.csv` 暫不在本階段修改；內容包核准後才進行正式資料遷移。

## 3. 目錄

```text
data/idioms/
├─ idiom-content-package.schema.json
├─ review/
└─ approved/

docs/idioms/
├─ README.md
├─ review/
└─ approved/
```

## 4. 固定欄位

每份內容包包含：

- `schemaVersion`
- `idiomId`
- `displayText`
- `traditionalText`
- `bopomofo[4]`
- `sourceHeadword`
- `variantRelation`
- `meaning`
- `allusionSummary`
- `primarySource`
- `supportingSources`
- `exampleSentence`
- `themeCategory`
- `difficulty`
- `positiveMeaningScore`
- `contentStatus`
- `reviewHistory`
- `rendererProjection`

## 5. 語義界線

### meaning

現代釋義。用於教學、遊戲完成畫面與內容校訂，不等於典故。

### allusionSummary

成語意象、來源背景與後來用法的摘要。不得加入 IP 劇情、角色設定或圖片內容。

### primarySource

保存朝代、作者、作品、篇章、短引文、來源網址與證據狀態。

### rendererProjection

只保存卡面需要的成語資料：

- `title`
- `bopomofo`
- `meaning`
- `allusionTitle`
- `allusionBody`
- `sourceLine`
- `themeCategory`

角色、IP、卡號與聯名箴言留在卡片資料層，不進入通用成語內容包。

## 6. 狀態

- `NeedsReview`：資料可供 Review 卡或內部設計使用，尚未完成正式校訂。
- `Approved`：文字、注音、來源與例句均經正式校訂，可供正式遊戲資料與 Renderer 使用。
- `Deprecated`：保留歷史稽核，但不得再作為新卡來源。

狀態移動規則：

```text
data/idioms/review    -> NeedsReview
data/idioms/approved  -> Approved
```

路徑與 `contentStatus` 必須一致。

## 7. 驗證 Gate

1. `displayText` 與 `traditionalText` 必須各為四個漢字。
2. `bopomofo` 必須恰好四組。
3. `variantRelation = variant_of` 時，`sourceHeadword` 不得等於 `displayText`。
4. `meaning`、`allusionSummary` 與 `primarySource` 必須獨立存在。
5. `allusionSummary` 不得與 `meaning` 完全相同。
6. `primarySource` 必須包含朝代、作者、作品、篇章、短引文與 HTTPS 來源。
7. `themeCategory` 必須對應 `data/cards/theme-badge-registry.json` 的核准項目。
8. `rendererProjection` 必須與上層成語、注音、釋義及主題一致。
9. `rendererProjection.allusionTitle` 固定為「典故」。
10. 典故與來源不得包含 IP 名稱、角色名稱或角色劇情。
11. Review 目錄內資料只能是 `NeedsReview`。
12. 核准前不得自動寫入 `data/idioms.source.csv`。

## 8. 首份範例：綿裡藏針

卡面顯示：

```text
綿裡藏針
ㄇㄧㄢˊ・ㄌㄧˇ・ㄘㄤˊ・ㄓㄣ
```

來源關係：

```json
{
  "displayText": "綿裡藏針",
  "sourceHeadword": "綿裡針",
  "variantRelation": "variant_of"
}
```

教育部《重編國語辭典修訂本》以「綿裡針」為詞頭，列出元代石君寶《曲江池》第二折用例，並記載「綿裡藏針」為異形說法。首份內容包因此維持 `NeedsReview`，待文字校訂完成後再移入 `approved`。

## 9. 非目標

本階段不：

- 修改遊戲 Runtime。
- 啟用「綿裡藏針」進入正式字典或主線卡池。
- 配置正式 UR 卡號。
- 變更 IP 授權狀態。
- 把角色設定寫入成語典故。
