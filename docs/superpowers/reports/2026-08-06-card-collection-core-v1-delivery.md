# 收藏資料核心 v1 交付報告

日期：2026-08-06  
分支：`feat/card-collection-core-v1`  
Pull Request：#22

## 1. 交付摘要

本次完成成語圖卡收藏系統的資料核心，不建立收藏圖鑑或翻卡動畫。

完成項目：

- 每完成 10 個不同主線關卡建立固定里程碑 Grant。
- 第一章支援第 10／20 關兩筆獎勵。
- 舊玩家依已保存關卡進度補建缺少的 Grant。
- 重玩、升星與重複同步不會建立重複獎勵。
- 空白正式卡池時 Grant 保持 `pending`。
- 決定性、可注入 RNG 的未持有優先加權解析。
- 固定 `rewardId` 與 `acquisitionId`。
- Inventory 對相同 acquisition 保持冪等。
- 已解析 Grant 若缺少 Inventory，可依既有資料修復，不重新抽卡。
- Snapshot schema version 1 嚴格解析、損壞項目隔離與深層不可變複製。
- 記憶體 Repository、寫入 queue 與失敗後續行。
- 獨立 IndexedDB 三-store 單一 readwrite transaction。
- 關卡進度保存成功後才同步收藏。
- 收藏失敗不回滾關卡完成、星級或解鎖。
- 空白正式卡池不依賴字典載入，可離線建立 pending Grant。
- 字典載入失敗後清除 Promise 快取，允許後續重試。

## 2. 正式資料模型

### 圖卡發音與核准

正式圖卡必須包含：

```ts
bopomofo: readonly [string, string, string, string];
pinyin: readonly [string, string, string, string];
```

永久 Gate：

- `pinyin` 使用小寫、帶正式聲調符號的漢語拼音。
- 數字聲調與未知羅馬拼音欄位拒絕。
- Review、Legacy、NeedsReview、未核准稀有度與遠端素材不得進池。
- UR 需正式授權證據，且不進一般十關卡池。
- 首版 `IDIOM_CARD_DEFINITIONS` 保持空陣列。

### 里程碑識別

```text
card-grant:main-levels:10
card-grant:main-levels:20
```

Acquisition ID：

```text
card-acquisition:<rewardId>
```

## 3. 保存架構

```text
Database：cicg-card-collection
Version：1
Stores：grants、inventory、metadata
Metadata key：collection
```

`transact()` 在同一個 IndexedDB readwrite transaction 中：

1. 讀取三個 stores。
2. 解析目前 snapshot。
3. 同步執行 operation 一次。
4. 寫回 grants、inventory 與 metadata。
5. 只有 `transaction.oncomplete` 才回傳成功。
6. error、abort 或 operation 例外均拒絕，不宣稱玩家已取得圖卡。

既有闖關資料保持不變：

```text
Database：cicg-progress
Version：1
Store：campaigns
Key：chapter-1
```

## 4. TDD 證據

| 階段 | RED | GREEN |
|---|---:|---:|
| 圖卡定義、發音、核准與卡池 Gate | CI #298 | CI #309 |
| 里程碑、解析與 Inventory | CI #312 | CI #317 |
| Snapshot、記憶體 Repository 與 queue | CI #323 | CI #326 |
| IndexedDB 原子交易 | CI #327 | CI #329 |
| 收藏服務與闖關保存順序 | CI #332 | CI #335 |
| 空卡池離線與已解析 Grant 修復 | CI #338 | CI #339 |

每個 RED 均先確認既有測試保持綠色，新失敗只指向尚未實作或刻意補強的行為。

## 5. CI #339 驗證結果

CI #339 在功能 HEAD `140c51c3db7dedfbf518d9b3da8bf406a4754c35` 成功執行完整 Repository Gate。

- Card tests：50／50 通過。
- 完整 Node 測試：289 項通過、0 失敗；此數字由同一 CI 的既有 239 項群組與新增 50 項 Card 群組加總。
- TypeScript strict：通過。
- ESLint：通過。
- Vite production build：通過。
- PWA Service Worker：成功產生。
- npm install audit：0 vulnerabilities。

文件最新 HEAD 仍須再執行一次完整 CI，最終合併以該次結果為準。

## 6. GitHub／Drive 狀態

### GitHub

功能完成時分支相對最新 `main`：

```text
behind_by = 0
```

功能差異集中於 `src/cards`、闖關保存協調、Card 測試及文件。

### Google Drive

Drive 有核准模板與元件化素材治理，但現有成語卡仍缺少可直接進正式里程碑卡池的完整 Approved 證據。Review／Legacy 圖片不會被本功能使用。

因此目前：

```ts
export const IDIOM_CARD_DEFINITIONS = [];
```

玩家完成第 10／20 關後只會安全取得 pending Grant，不會看見或持有偽造圖卡。

## 7. 範圍審核

本次沒有修改：

```text
src/puzzle/levels.ts
src/puzzle/navigation.ts
src/game/**
src/bonus/**
src/media/**
data/idioms.source.csv
```

`src/domain/progress.ts` 沒有加入任何卡牌欄位，`cicg-progress` 仍是 version 1。

## 8. 尚待後續

- 核准首批正式成語圖卡資料與 PWA runtime assets。
- 圖卡收藏圖鑑頁。
- 待揭示清單與翻卡動畫。
- 卡片詳細學習頁。
- Android／iOS 真機 IndexedDB、多分頁與離線補發證據。
- 瀏覽器 E2E、Lighthouse 與完整 PWA 實機驗收。
- 未來指定圖卡或固定內容卡包；不導入付費隨機抽卡。
