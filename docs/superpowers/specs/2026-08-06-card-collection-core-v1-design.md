# 收藏資料核心 v1 設計規格

日期：2026-08-06  
Repository：`gshan1209-cell/Chinese-Idiom-Chain-Game`  
狀態：Approved for written review  
建議實作分支：`feat/card-collection-core-v1`  
任務類型：資料核心、里程碑獎勵、IndexedDB 交易與 TDD；本文件不包含 production code

## 1. 目標

本階段建立成語圖卡收藏系統的可靠資料基礎，讓玩家每完成 10 個不同主線關卡時取得一筆可追蹤、可重試、不可重複發放的圖卡獎勵。

本階段完成：

1. 圖卡定義與正式卡池驗證。
2. 第 10／20 關里程碑計算與舊進度補發。
3. 唯一 `rewardId`、pending grant、決定性解析與冪等收藏紀錄。
4. 獨立 IndexedDB `cicg-card-collection` version 1。
5. grant 與 inventory 在同一受保護 transaction 內保存。
6. 重複完成事件、多分頁競爭與 App 中斷後的安全重試。
7. 空卡池時保留 pending，不使用未核准素材偽造獎勵。

本階段不建立收藏圖鑑頁、翻卡動畫、正式卡面 UI、購買、卡包、後端或雲端同步。

核心原則：

> 獎勵結果必須先持久化，UI 才能宣稱玩家已取得圖卡。

---

## 2. 現況與限制

### 2.1 GitHub 與 Drive 現況

- 最新正式卡面標準為 v2.6：`1024 × 2000 px`、中央主圖區 `1200 px`、主標下方依序顯示注音橫列與帶聲調漢語拼音橫列。
- Drive 仍保存 N／R／SR／SSR 的 v2.1 Approved 模板，作為歷史版型與稀有度徽章參考；不得覆寫 v2.6 最新規格。
- 現有 22 張成語卡在 Manifest 中仍為 `Legacy` 或 `Review`。
- 現有成語卡來源狀態仍為 `NeedsReview`。
- 未完成注音、拼音、來源、文字、稀有度與素材人工核准的圖卡不得進入正式卡池。
- Approved 模板是版面框架，不是可發放圖卡。

因此本階段正式卡池初始值固定為空陣列。

### 2.2 不修改既有進度 schema

既有闖關資料保持：

```text
Database：cicg-progress
Version：1
Store：campaigns
Key：chapter-1
```

收藏功能不得把 grant、inventory 或收藏 metadata 寫入 `CampaignProgress`。

### 2.3 與主玩法隔離

收藏功能不得：

- 修改關卡星級。
- 解鎖或封鎖主線關卡。
- 影響智慧自動跳格。
- 影響提示、錯誤、分數或最佳紀錄。
- 影響自由接龍、打地鼠、陷阱模式或媒體中心。
- 成為離線遊戲或查看關卡成語解釋的必要條件。

---

## 3. 模組架構

```text
src/cards/
├─ card-types.ts
├─ card-definitions.ts
├─ card-definition-validator.ts
├─ card-pool.ts
├─ milestone-grants.ts
├─ reward-resolver.ts
├─ inventory-engine.ts
├─ collection-serialization.ts
├─ collection-repository.ts
├─ indexeddb-collection-repository.ts
├─ collection-write-queue.ts
└─ collection-service.ts
```

責任分離：

- `card-types.ts`：領域型別，不依賴 React、DOM 或 IndexedDB。
- `card-definition-validator.ts`：正式卡片 allowlist、注音、拼音、核准、來源與權重驗證。
- `card-pool.ts`：建立合法里程碑卡池。
- `milestone-grants.ts`：計算應有里程碑、固定 ID 與補發差集。
- `reward-resolver.ts`：以注入 RNG 執行未持有優先與加權解析。
- `inventory-engine.ts`：冪等套用 acquisition。
- `collection-serialization.ts`：嚴格解析 version 1 持久化資料。
- `collection-repository.ts`：Repository 與 transaction 介面。
- `indexeddb-collection-repository.ts`：`cicg-card-collection` 實作。
- `collection-write-queue.ts`：同一 App 實例內序列化寫入。
- `collection-service.ts`：協調里程碑同步、解析與持久化，不承擔 UI。

React 只在安全節點呼叫服務並呈現狀態，不實作里程碑或抽卡規則。

---

## 4. 圖卡定義

```ts
export type CardRarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR';

export type IdiomDifficultyGrade = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';

export type CardAcquisitionMethod =
  | 'milestone-reward'
  | 'achievement-reward'
  | 'direct-purchase'
  | 'fixed-bundle'
  | 'event-reward'
  | 'manual-grant';

export type CardApprovalStatus =
  | 'Approved'
  | 'Review'
  | 'Legacy'
  | 'Rejected';

export type CardSourceStatus = 'Approved' | 'NeedsReview' | 'Rejected';

export interface IdiomCardDefinition {
  readonly id: string;
  readonly idiomId: string;
  readonly title: string;
  readonly bopomofo: readonly [string, string, string, string];
  readonly pinyin: readonly [string, string, string, string];
  readonly subtitle: string;
  readonly rarity: CardRarity;
  readonly difficulty: IdiomDifficultyGrade;
  readonly imageAsset: string;
  readonly thumbnailAsset: string;
  readonly storySummary: string;
  readonly storySource: string;
  readonly motto: string;
  readonly enabled: boolean;
  readonly approvalStatus: CardApprovalStatus;
  readonly sourceStatus: CardSourceStatus;
  readonly rarityApproved: boolean;
  readonly releaseOrder: number;
  readonly startsAt: string | null;
  readonly endsAt: string | null;
  readonly acquisitionMethods: readonly CardAcquisitionMethod[];
  readonly weight: number;
  readonly licenseEvidenceId: string | null;
}
```

### 4.1 定義驗證

正式卡片資料採嚴格 allowlist。`pinyin` 是 v2.6 唯一允許的漢語拼音欄位；`romanization`、`englishPronunciation`、`phoneticLatin` 或其他任意羅馬拼音欄位一律拒絕。

每筆卡片必須符合：

- `id` 非空且全卡池唯一。
- `idiomId` 指向啟用中的成語資料。
- `title` 恰好四個繁體中文字，且與對應成語文字一致。
- `bopomofo` 恰好四筆，依序對應四個國字，每筆非空。
- `pinyin` 恰好四筆，依序對應四個國字。
- `pinyin` 必須使用小寫漢語拼音與正式聲調符號；禁止數字聲調、全大寫、無分字串接或省略核准讀音。
- 注音與拼音都必須與核准來源一致，不得由 UI 即時計算或猜測。
- 不得包含 `pinyin` 以外的羅馬拼音欄位。
- `subtitle`、`storySummary`、`storySource`、`motto` 非空。
- `imageAsset` 與 `thumbnailAsset` 必須是 Repository 內核准的本機資產路徑，不接受遠端 URL、`data:`、`blob:` 或任意 HTML。
- `enabled === true`。
- `approvalStatus === 'Approved'`。
- `sourceStatus === 'Approved'`。
- `rarityApproved === true`。
- `acquisitionMethods` 包含 `milestone-reward`。
- `weight` 為大於 0 的有限整數。
- `releaseOrder` 為非負有限整數。
- `startsAt`／`endsAt` 為 `null` 或合法 ISO-8601；目前時間必須落在有效期間內。
- `UR` 必須有非空且可稽核的 `licenseEvidenceId`；N／R／SR／SSR 的 `licenseEvidenceId` 預設為 `null`。

正式卡池建立時排除任何驗證失敗項目，並回傳可稽核 findings；不得因單一卡片失敗而偽造替代卡。

### 4.2 首版卡片資料

```ts
export const IDIOM_CARD_DEFINITIONS: readonly IdiomCardDefinition[] = [];
```

在首張正式卡完成來源、注音、拼音、稀有度與素材核准前，該陣列保持空白。

---

## 5. 里程碑與固定識別

只計算已完成的不同主線關卡：

```text
completedUniqueMainLevels = 已完成且 completionCount > 0 的不同主線 level 數量
```

應有里程碑：

```text
10, 20, 30, ... <= floor(completedUniqueMainLevels / 10) × 10
```

第一章 20 關，因此首版最多產生：

```text
main-levels:10
main-levels:20
```

固定獎勵 ID：

```text
card-grant:main-levels:10
card-grant:main-levels:20
```

重玩、升星、自由接龍、打地鼠、陷阱模式、收藏頁、購買、推薦內容與測試預覽不得增加 `completedUniqueMainLevels`。

### 5.1 舊玩家補發

載入闖關進度與收藏資料後計算：

```text
應有里程碑 rewardId − 已存在 rewardId = 待建立 grants
```

例如已完成 20 關但收藏資料庫不存在，建立：

```text
card-grant:main-levels:10
card-grant:main-levels:20
```

重新載入或重複同步不得建立重複資料。

---

## 6. Grant 模型與狀態機

```ts
export type CardGrantStatus = 'pending' | 'resolved' | 'revealed';

export interface CardMilestoneGrant {
  readonly rewardId: string;
  readonly milestoneLevelCount: number;
  readonly status: CardGrantStatus;
  readonly createdAt: string;
  readonly resolvedAt: string | null;
  readonly revealedAt: string | null;
  readonly resolvedCardId: string | null;
  readonly acquisitionId: string | null;
}
```

合法轉移：

```text
不存在 → pending → resolved → revealed
```

永久規則：

- 不允許跳過 `pending`。
- 空卡池或沒有合法卡片時保持 `pending`。
- `resolvedCardId` 與 `acquisitionId` 必須同時存在或同時為 `null`。
- `resolvedAt` 只在成功持久化解析結果時寫入。
- `revealedAt` 只在未來 UI 完成或跳過揭示流程後寫入。
- `revealed` 只代表 UI 已處理，不影響圖卡所有權。
- 已解析 grant 不重新消耗 RNG，也不得更換卡片。
- 相同 `rewardId` 的重放必須回傳既有 grant。

固定 acquisition ID：

```text
card-acquisition:<rewardId>
```

例如：

```text
card-acquisition:card-grant:main-levels:10
```

---

## 7. 玩家收藏模型

```ts
export interface CardAcquisitionRecord {
  readonly acquisitionId: string;
  readonly method: 'milestone-reward';
  readonly acquiredAt: string;
  readonly sourceReference: string;
}

export interface PlayerCardInventoryItem {
  readonly cardId: string;
  readonly ownedCount: number;
  readonly firstOwnedAt: string;
  readonly lastOwnedAt: string;
  readonly acquisitionHistory: readonly CardAcquisitionRecord[];
}
```

規則：

- 首次取得建立 `ownedCount = 1`。
- 重複取得同一卡片只增加 `ownedCount`。
- `firstOwnedAt` 永不改寫。
- `lastOwnedAt` 使用最新成功 acquisition 時間。
- 任一 inventory 項目中不得出現重複 `acquisitionId`。
- 同一 `acquisitionId` 重放時回傳原 inventory，不增加數量。
- `sourceReference` 固定使用對應 `rewardId`。
- 收藏資料不得反向修改闖關進度。

---

## 8. 正式卡池與決定性解析

### 8.1 合法池

里程碑卡池只包含通過第 4 節全部驗證的卡片。

現有 Review、Legacy、NeedsReview、未核准稀有度、未校訂注音／拼音、模板空框與遠端素材都不得進入卡池。

### 8.2 未持有優先

解析順序：

1. 建立合法池。
2. 找出 inventory 中 `ownedCount === 0` 或不存在的卡片。
3. 未持有池非空時，只從未持有池抽取。
4. 所有合法卡都已持有時，才從完整合法池抽取重複卡。
5. 卡池空白時回傳未解析結果，grant 保持 `pending`。

### 8.3 RNG 介面

核心禁止直接呼叫 `Math.random()`：

```ts
export interface RandomSource {
  next(): number;
}
```

`next()` 必須回傳有限數字且符合：

```text
0 <= value < 1
```

非法 RNG 值不得解析 grant。

相同合法池、inventory、rewardId 與測試 RNG 必須得到相同結果。

### 8.4 加權

- 依 `weight` 建立累積區間。
- 權重總和必須為安全有限整數。
- 同一 `cardId` 在卡池中只能出現一次。
- 不得讓 React 或 UI 修改權重。

---

## 9. IndexedDB 設計

```text
Database：cicg-card-collection
Version：1
```

Object stores：

```text
grants
Key：rewardId

inventory
Key：cardId

metadata
Key：collection
```

`metadata/collection` 保存：

```ts
export interface CardCollectionMetadata {
  readonly schemaVersion: 1;
  readonly updatedAt: string;
}
```

### 9.1 Transaction 邊界

建立 pending grant：

```text
readwrite transaction：grants
```

解析 grant 並加入收藏：

```text
readwrite transaction：grants + inventory + metadata
```

同一 transaction 內依序：

1. 重新讀取 `rewardId`。
2. 若已 resolved／revealed，回傳既有結果且不呼叫 RNG。
3. 若不存在，先建立 pending grant。
4. 驗證合法卡池並解析卡片。
5. 重新讀取目標 inventory。
6. 依 `acquisitionId` 執行冪等更新。
7. 寫入 inventory。
8. 寫入 resolved grant。
9. 更新 metadata。
10. 等待 transaction `complete` 後才向上層回報成功。

任一步失敗必須中止整個 transaction，不允許 grant resolved 但 inventory 未寫入，或 inventory 已增加但 grant 仍 pending。

### 9.2 多分頁競爭

IndexedDB readwrite transaction 必須在 transaction 內重新讀取目前 grant 與 acquisition，不得只信任 transaction 外的快照。

兩個分頁同時處理相同 `rewardId` 時：

- 第一個成功 transaction 建立或解析 grant。
- 第二個 transaction 讀到既有 grant 後直接回傳。
- 最終只存在一筆 grant 與一筆相同 acquisition。

App 內另使用序列化 write queue，避免同一實例內的非必要競爭。

---

## 10. Repository 與服務介面

```ts
export interface CardCollectionSnapshot {
  readonly grants: ReadonlyMap<string, CardMilestoneGrant>;
  readonly inventory: ReadonlyMap<string, PlayerCardInventoryItem>;
  readonly metadata: CardCollectionMetadata;
}

export interface CardCollectionRepository {
  load(): Promise<CardCollectionSnapshot>;
  ensurePendingGrants(
    grants: readonly CardMilestoneGrant[]
  ): Promise<CardCollectionSnapshot>;
  resolveGrant(
    rewardId: string,
    definitions: readonly IdiomCardDefinition[],
    random: RandomSource,
    resolvedAt: string
  ): Promise<CardCollectionSnapshot>;
  markRevealed(rewardId: string, revealedAt: string): Promise<CardCollectionSnapshot>;
  clear(): Promise<void>;
}
```

`resolveGrant` 必須在 Repository transaction 內完成最終重讀、解析與寫入，避免 service 先解析再分離保存造成競爭。

服務層介面：

```ts
export interface CardCollectionService {
  loadAndSyncMilestones(
    progress: CampaignProgress,
    now: string
  ): Promise<CardCollectionSnapshot>;
  resolvePendingRewards(now: string): Promise<CardCollectionSnapshot>;
}
```

本階段 `resolvePendingRewards` 面對空卡池時只回傳 pending snapshot。

---

## 11. 與闖關進度整合

安全順序固定為：

```text
關卡完成
→ 計算並保存 CampaignProgress
→ 確認 progress repository save 成功
→ 呼叫 collection service 同步里程碑
→ 收藏同步成功或失敗皆不回滾已完成關卡
```

現有 `useCampaignProgress.completeLevel()` 需要在實作階段提供可等待的保存結果或完成通知，不能只依賴 fire-and-forget 的記憶體狀態就宣稱里程碑已持久化。

限制：

- 不修改 `CampaignProgress` 型別或序列化格式。
- 不提高 `cicg-progress` database version。
- 收藏保存失敗時，關卡星級與解鎖仍有效。
- 下次載入時依已保存闖關進度重新補發缺少的 pending grants。
- 收藏失敗不得顯示已取得圖卡。

本階段 React 最多暴露：

```ts
export interface CardCollectionStatus {
  readonly loading: boolean;
  readonly pendingGrantCount: number;
  readonly resolvedUnrevealedCount: number;
  readonly storageWarning: string | null;
}
```

不建立收藏頁或翻卡畫面。

---

## 12. 序列化與損壞資料

持久化資料採嚴格 schema version 1。

要求：

- 未知頂層 schema version 拒絕載入為有效收藏。
- grant 狀態與欄位組合不一致時隔離該紀錄。
- inventory 的 `ownedCount` 必須等於唯一 acquisition 數量。
- 重複 acquisition 只保留一筆並產生 finding，不重複加卡。
- 日期欄位必須是合法 ISO-8601。
- Map、陣列與回傳物件都必須建立隔離副本，避免外部修改 Repository 內部狀態。
- 可解析資料得以保留；損壞紀錄不得被當作已取得卡片或已發放里程碑。
- 發現損壞資料時回傳 storage warning，遊戲仍可使用。

---

## 13. 錯誤處理

| 狀況 | 固定行為 |
|---|---|
| IndexedDB 不可用 | 闖關照常，收藏狀態只在記憶體顯示警告，不宣稱永久取得 |
| 卡池空白 | Grant 保持 pending，不建立 inventory |
| 圖卡定義無效 | 排除該卡並回傳 finding |
| RNG 非法 | 不解析 grant，保持 pending |
| 重複 rewardId | 回傳既有 grant |
| 重複 acquisitionId | 不增加 ownedCount |
| Transaction 失敗 | 整筆回滾，不顯示已取得圖卡 |
| Collection database blocked | 顯示收藏保存警告，下次載入重試 |
| 舊資料損壞 | 隔離損壞紀錄，保留可解析資料並警告 |
| 關卡保存成功但收藏保存失敗 | 關卡結果有效，下次載入依進度補發 |

---

## 14. TDD 驗收 Gate

實作必須依序先建立失敗測試，再加入最小 production code。

至少包含：

1. 完成 9 個不同主線關卡不建立 grant。
2. 完成 10 關只建立 `card-grant:main-levels:10`。
3. 完成 20 關建立兩筆不同 grant。
4. 重玩與升星不增加 grant。
5. 已完成 20 關的舊玩家可補發第 10／20 關 grant。
6. 重複同步不建立重複 grant。
7. 多分頁競爭只保存一筆相同 rewardId。
8. 正式卡池空白時 grant 保持 pending。
9. Review、Legacy、NeedsReview 或未核准稀有度卡不得進池。
10. 四字圖卡缺少任一注音或拼音時驗證失敗。
11. 正式 `pinyin` 四字對齊且使用小寫聲調符號時通過。
12. 數字聲調、錯誤分字、未知羅馬拼音欄位或未知資料欄位被拒絕。
13. 遠端圖片 URL 或非本機核准資產被拒絕。
14. 非正整數權重被拒絕。
15. UR 缺少授權證據時被拒絕。
16. 未持有卡優先於重複卡。
17. 注入相同 RNG 時解析結果一致。
18. RNG 非法時保持 pending。
19. 同一 rewardId 重放不再次消耗 RNG。
20. Grant 與 inventory 在同一 transaction 成功。
21. Transaction 失敗時不產生部分收藏。
22. 重複 acquisitionId 不增加 ownedCount。
23. Inventory 的 `ownedCount` 與唯一 acquisition 數量一致。
24. 收藏失敗不影響已保存關卡完成紀錄。
25. App 重開後依 progress 補發遺漏 grant。
26. 不修改 `cicg-progress` database version 1。
27. 收藏核心不依賴 React、DOM、CSS 或隱式 `Math.random()`。
28. `IDIOM_CARD_DEFINITIONS` 初始保持空白。
29. 模板空框、Review 圖與 v1.0 圖卡不得成為可發放卡片。
30. v2.6 發音欄位規則覆寫早期「禁止拼音」條款。

最終必須重新執行：

```bash
npm install
./scripts/verify.sh
```

並記錄完整測試數量、TypeScript strict、ESLint、Vite PWA Build 與 npm audit 結果。

---

## 15. 交付範圍

### 本階段包含

- 純 TypeScript 圖卡資料與驗證。
- 空白正式卡片定義清單。
- 里程碑與補發引擎。
- 決定性獎勵解析。
- Inventory 冪等更新。
- 獨立 IndexedDB Repository。
- Grant＋inventory 原子 transaction。
- 寫入佇列與多分頁保護。
- 闖關保存完成後的收藏同步。
- 儲存失敗警告與下次補發。
- 完整 TDD 與交付報告。

### 本階段不包含

- 正式圖卡素材或正式卡池內容。
- 收藏圖鑑頁面。
- 翻卡與稀有度動畫。
- 卡牌詳細頁。
- 卡牌購買、卡包或金流。
- 付費隨機抽卡。
- 廣告換卡。
- 登入、雲端同步或後端。
- 修改闖關進度 schema。
- 使用 Review、Legacy、v1.0 或模板圖片作為獎勵。

---

## 16. 完成定義

本階段只有在以下條件全部成立時才可宣告完成：

- 第 4～13 節規則均由純 TypeScript／Repository 實作覆蓋。
- 卡池空白時第 10／20 關 grants 能可靠保持 pending。
- 同一 rewardId 與 acquisitionId 在重放及多分頁情境下保持冪等。
- Grant 與 inventory 不會部分成功。
- 收藏保存失敗不破壞主線進度。
- `cicg-progress` 仍為 version 1。
- 沒有未核准圖卡被視為正式收藏。
- 注音與 v2.6 正式拼音欄位均有嚴格 Gate。
- 全部新增與既有測試、TypeScript、ESLint、Build、PWA、npm audit 通過。
- 合併前分支 `behind_by = 0`，且沒有未解決 review threads。
- 完成交付報告與 ChatGPT Audit 後才可 Squash Merge。
