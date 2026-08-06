# 成語圖卡收藏資料完整性增補

日期：2026-08-06  
狀態：Approved  
適用規格：`2026-08-06-idiom-card-collection-design.md`  
優先級：本增補與圖卡稀有度標準、圖卡審核治理規格及 v2.6 模板增補共同覆寫較早且衝突的收藏規格敘述

## 1. 圖卡定義必須包含逐字注音與漢語拼音

v2.6 正式卡面需要四筆逐字注音及四筆帶聲調漢語拼音。後續 production implementation 的 `IdiomCardDefinition` 應使用可驗證資料：

```ts
export interface IdiomCardDefinition {
  readonly id: string;
  readonly idiomId: string;
  readonly title: string;
  readonly bopomofo: readonly [string, string, string, string];
  readonly pinyin: readonly [string, string, string, string];
  // 其餘欄位沿用收藏規格
}
```

永久 Gate：

- `title` 必須是四個繁體中文字。
- `bopomofo` 必須恰好四筆，依序對應四個國字。
- `pinyin` 必須恰好四筆，依序對應四個國字。
- 每筆注音與拼音不得為空，正式發布前須完成校訂。
- 拼音必須使用小寫漢語拼音與聲調符號，例如 `yú`、`gōng`；禁止數字聲調，例如 `yu2`。
- v2.6 卡面與收藏頁詳細畫面依序顯示：四字主標、注音橫列、拼音橫列。
- 未完成注音或拼音校訂的圖卡不得標記 `Approved`，不得進入免費卡池、正式收藏頁或未來商店。
- 本文件只定義後續資料契約；本次文件任務不得直接修改既有 IndexedDB 進度 Schema。

## 2. 里程碑獎勵必須先保存再揭示

收藏規格第 4.3 節的發放順序修正為：

```text
主線關卡完成
→ 保存關卡進度
→ 顯示星級結算
→ 判定新十關里程碑
→ 建立唯一 rewardId 的 pending grant
→ 決定性解析 resolvedCardId
→ 在同一受保護寫入流程保存 grant 與收藏取得紀錄
→ 確認保存成功
→ 顯示圖卡揭示動畫
→ 將 grant 標記為 revealed
→ 返回地圖或下一關
```

永久 Gate：

- 不得先播放動畫再保存抽取結果。
- `rewardId`、`resolvedCardId` 與 `acquisitionId` 必須在動畫開始前固定。
- 重新整理、App 中斷、動畫跳過、多分頁或重複事件不得重新抽取。
- 保存失敗時保留可重試的 pending grant，不得顯示尚未持久化的圖卡為已取得。
- 同一 `rewardId` 重放時必須回傳同一 `resolvedCardId`，不得再次消耗 RNG。
- grant 與收藏紀錄若無法使用單一 IndexedDB transaction，必須使用可恢復的寫入佇列與冪等 acquisitionId，禁止部分成功後重複加卡。

## 3. 稀有度與素材核准連動

- `N / R / SR / SSR` 依正面意義與精神價值標準判定。
- `UR` 僅限具正式授權證據的 IP 聯名隱藏版本。
- 現有 Legacy 或 Review 圖片、來源為 `NeedsReview` 的卡片，以及尚未完成稀有度人工複核的卡片，不得進入合法里程碑卡池。
- 卡池為空時 grant 保持 pending，不得以測試圖、舊圖或未核准 Prompt 偽造獎勵。

## 4. 實作驗收測試

後續 production implementation 至少必須先建立下列失敗測試：

1. 四字圖卡缺少任一注音時驗證失敗。
2. 四字圖卡缺少任一拼音時驗證失敗。
3. 拼音使用數字聲調或缺少正式聲調符號時驗證失敗。
4. pending grant 解析後先持久化，再允許進入 reveal 狀態。
5. 保存失敗時不顯示已取得圖卡。
6. 同一 rewardId 重放不重新抽卡或重複增加 ownedCount。
7. 多分頁或重複完成事件只產生一筆里程碑 grant。
8. 空卡池保持 pending 且不建立虛假收藏項目。
9. NeedsReview、Legacy、Review 或未核准稀有度的卡片不進入正式卡池。
