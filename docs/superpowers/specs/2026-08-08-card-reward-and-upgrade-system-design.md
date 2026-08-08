# 每關贈卡、保底、隱藏積分與重複卡升級系統設計規格

日期：2026-08-08  
Repository：`gshan1209-cell/Chinese-Idiom-Chain-Game`  
狀態：Approved  
任務類型：收藏獎勵、卡池解析、隱藏機率、重複卡升級、IndexedDB migration 與 TDD

## 1. 目標

本規格正式取代舊版「每完成 10 個不同主線關卡贈送 1 張卡」規則。

> 玩家每首次完成 1 個不同主線關卡，即取得 1 張成語卡片；越後面的關卡因成語數量與難度提高，隱藏積分越高，SR／SSR 越容易出現。

同時建立：

1. 一般關卡的單關限定贈卡。
2. 全域每 10 關的 R 以上保底。
3. 全域每 100 關的 SR 以上保底。
4. 完全隨機、允許重複的抽取規則。
5. 不顯示於玩家介面的隱藏積分與千分制機率快照。
6. 重複卡固定 10：1 升級系統。
7. 自動且決定性的素材選擇。
8. 跨章共用素材與已通關內容限定產物池。
9. 原子化扣料、解析、入庫與可恢復紀錄。

本系統不得影響主線星級、關卡解鎖、提示、錯誤、分數、智慧自動跳格、陷阱模式、自由接龍、打地鼠或媒體中心。

---

## 2. 規範優先序

```text
本文件
→ 收藏資料核心 v1
→ 圖卡稀有度標準
→ 圖卡審核治理規格
→ 卡號 Registry、卡片 Catalog 與正式卡池資料
```

若本文件與舊版「每十關贈卡」「未持有優先」或一般全卡池規則衝突，以本文件為準。

永久不變規則：

- N～SSR 的語義稀有度不可因合成而改寫。
- UR 只保留給具可稽核正式授權的外部 IP 聯名。
- UR 不得進入一般主線贈卡、隱藏積分抽取或一般升級系統。
- 只有 Approved、來源核准、稀有度核准且允許對應取得方式的卡片可進正式卡池。

---

## 3. 關卡識別與全域主線序號

每個主線關卡必須同時具備：

```ts
interface MainCampaignLevelIdentity {
  readonly chapterId: string;
  readonly levelNumber: number;
  readonly campaignOrdinal: number;
}
```

`campaignOrdinal` 是跨章永久連續序號，也是判斷第 10／100 關保底的唯一依據。

- 第一章 1～20 關的 `campaignOrdinal` 為 1～20。
- 第二章第 1 關承接為 21，不重新計算為 1。
- 每章不得自行重新觸發第 10 或第 100 關保底。
- 已發布的 `campaignOrdinal` 不得因插關或排序調整而改寫。

每個關卡固定獎勵 ID：

```text
card-grant:main-level:<chapterId>:<levelNumber>
```

同一 `rewardId` 只能建立一次。

---

## 4. 每關贈卡與保底

### 4.1 觸發條件

只在主線關卡由未完成首次轉為已完成時建立一次獎勵。

不得觸發：

- 重玩已完成關卡。
- 提高星級或刷新最佳成績。
- 自由接龍、打地鼠、陷阱、收藏、購買、測試或預覽。

重新載入、舊進度補發、多分頁競爭或重放都不得重複發卡。

### 4.2 一般關卡

當 `campaignOrdinal` 不是 10 的倍數：

- 候選範圍只包含該關 placement 使用的不同 `idiomId`。
- 同一成語在同關重複 placement 時只算一次。
- 最低稀有度為 N。
- 只允許 N、R、SR、SSR。

### 4.3 每 10 關保底

當：

```text
campaignOrdinal % 10 === 0
campaignOrdinal % 100 !== 0
```

- 候選範圍為全域第 1 關至當前關已完成內容中出現過的不同 `idiomId`。
- 最低稀有度為 R。
- 可取得 R、SR、SSR。

### 4.4 每 100 關保底

當：

```text
campaignOrdinal % 100 === 0
```

- 候選範圍為全域第 1 關至當前關已完成內容中出現過的不同 `idiomId`。
- 最低稀有度為 SR。
- 可取得 SR、SSR。
- 同時命中 10 倍數規則時，只發 1 張並套用 SR 以上保底。

### 4.5 卡池為空

若正式核准卡片不足：

- 建立 `pending` grant。
- 不得降低該關最低保底。
- 不得抽未通關內容或 UR。
- 不得以 Review、Legacy、NeedsReview、遠端圖片或模板空框偽造獎勵。
- 正式卡池更新後可重試同一 grant。

---

## 5. 隱藏積分

### 5.1 積分來源

每個關卡以不同成語的卡片難易度累加：

| 卡片難易度 | 分數 |
|---|---:|
| E | 1 |
| D | 2 |
| C | 3 |
| B | 4 |
| A | 5 |
| S | 6 |

正式來源為 Card Catalog 的 `cardDifficultyCode`，不是卡片稀有度，也不是關卡的 `easy／normal／hard` 顯示標籤。

```ts
const HIDDEN_SCORE_BY_DIFFICULTY = {
  E: 1,
  D: 2,
  C: 3,
  B: 4,
  A: 5,
  S: 6
} as const;
```

同一關內只計算不同 `idiomId`。例如第一關有兩個 E 級成語：

```text
1 + 1 = 2 分
```

### 5.2 累積方式

```text
hiddenRewardScore
= 所有首次完成主線關卡之 levelHiddenScore 總和
```

- 採跨章全域累積，不因每 10 關、每 100 關或章節切換重置。
- 重玩、升星或刷新最佳紀錄不增加分數。
- 本次獎勵使用包含剛完成關卡在內的累積分數。
- 隱藏積分不得顯示在正式玩家 UI。

### 5.3 千分制 SR／SSR 機率

```ts
ssrTickets = Math.min(Math.floor(hiddenRewardScore / 10), 100);
srTickets = Math.min(hiddenRewardScore, 400);
baseTickets = 1000 - ssrTickets - srTickets;
```

因此當前十關合計 50 分：

```text
SSR = 5 / 1000 = 0.5%
SR  = 50 / 1000 = 5%
基礎區 = 945 / 1000 = 94.5%
```

機率上限：

```text
SSR 最高 100 / 1000 = 10%
SR 最高 400 / 1000 = 40%
```

### 5.4 千分制抽選順序

RNG 必須產生 `0 <= value < 1`，再轉成：

```ts
rollValue = Math.floor(value * 1000);
```

判定：

```text
0 <= rollValue < ssrTickets
→ SSR

ssrTickets <= rollValue < ssrTickets + srTickets
→ SR

其餘
→ 基礎稀有度
```

基礎稀有度依關卡保底決定：

| 關卡類型 | 基礎稀有度 |
|---|---|
| 一般關 | N／R 候選中的正式權重抽取 |
| 10 倍數關 | R |
| 100 倍數關 | SR |

一般關的基礎區只在該關 N／R 合法候選中依正式 `weight` 抽取；不因 N 或 R 卡數量不同而做稀有度平均。

### 5.5 目標稀有度缺席

若抽中目標稀有度，但合法候選中沒有該稀有度，依序向下尋找，不得低於該關保底：

```text
SSR → SR → R → N
```

例如：

- 一般關抽中 SSR，但本關只有 R：取得 R。
- 第 10 關抽中 SSR，但已完成範圍只有 R：取得 R。
- 第 100 關抽中 SSR，但範圍沒有 SSR：取得 SR。

若連最低保底稀有度都沒有合法候選，grant 保持 `pending`。

### 5.6 機率快照

每筆 grant 必須保存解析當下的不可變快照：

```ts
interface CardRewardProbabilitySnapshot {
  readonly levelHiddenScore: number;
  readonly hiddenRewardScore: number;
  readonly srTickets: number;
  readonly ssrTickets: number;
  readonly baseTickets: number;
  readonly minimumRarity: 'N' | 'R' | 'SR';
  readonly rolledRarity: 'N' | 'R' | 'SR' | 'SSR';
  readonly resolvedRarity: 'N' | 'R' | 'SR' | 'SSR';
  readonly rollValue: number;
}
```

- 已解析 grant 永不重算積分、機率或卡片。
- Card Catalog 日後調整難度，不得改寫既有快照。
- 舊玩家 migration 依全域序號重建一次歷史 grant 與快照，保存後即鎖定。
- 機率快照可供測試與稽核，但正式玩家 UI 不顯示。

---

## 6. 完全隨機與卡片權重

本規格取消「未持有卡優先」。

- 是否已持有不影響候選資格。
- 每次解析都可抽到重複卡。
- 重複取得增加 `ownedCount` 並新增唯一 acquisition。
- 先由隱藏積分決定目標／解析稀有度，再在該稀有度合法候選中使用卡片正式 `weight` 加權抽取。
- `weight` 必須是大於 0 的有限整數。
- RNG 必須由純 TypeScript 領域層注入，不得在 React、DOM 或動畫 callback 直接呼叫 `Math.random()`。
- 無效 RNG 不得改寫 grant 或 inventory。

合法保存順序：

```text
建立 pending grant
→ 產生並保存機率快照與卡片結果
→ 原子保存 grant 與 inventory
→ 播放揭卡動畫
→ 標記 revealed
```

---

## 7. 重複卡升級

### 7.1 固定比例

```text
10 張可消耗 N  → 1 張 R
10 張可消耗 R  → 1 張 SR
10 張可消耗 SR → 1 張 SSR
```

- SSR 是一般升級最高階。
- SSR 不可合成 UR。
- UR 不可作為素材或一般升級產物。
- 不允許跨稀有度混合素材。

### 7.2 保留圖鑑本體

每種卡至少保留 1 張：

```text
consumableCount = max(ownedCount - 1, 0)
```

合成後任何卡片 `ownedCount` 不得低於 1。

### 7.3 混合不同成語

同一次合成可使用不同成語的同稀有度重複卡，只要可消耗總數至少 10。

---

## 8. 自動選材

玩家不逐張選擇，由系統決定性選滿 10 張：

1. `consumableCount` 由高至低。
2. 數量相同時依正式卡號升冪。
3. 依序取用至累計 10 張。
4. 最後一張卡只取達成 10 所需數量。

相同 inventory 與卡號 Registry 必須產生相同素材清單，不使用亂數。

玩家只能確認或取消，不提供手動替換。

---

## 9. 升級產物卡池

### 9.1 已通關內容限定

- N → R：只取所有已通關內容中的 R。
- R → SR：只取所有已通關內容中的 SR。
- SR → SSR：只取所有已通關內容中的 SSR。
- 未通關內容不得提前進池。
- 不同章節的已通關內容可共同進池。

### 9.2 跨章共用素材

所有章節取得的同稀有度重複卡可共同作為素材，不建立章節專屬素材錢包。

### 9.3 產物允許重複

- 不採未持有優先。
- 可抽到已持有目標卡。
- 重複 R、SR 可繼續成為下一階素材。
- 使用目標卡片正式 `weight` 加權解析。

### 9.4 無合法產物

若素材達 10，但已通關內容中沒有合法目標稀有度卡：

- 合成不可執行。
- 不扣除素材。
- 不建立完成紀錄。
- 不得降級、跨級或抽其他稀有度。

---

## 10. 原子交易與資料模型

一次合成必須在同一個 `cicg-card-collection` readwrite transaction 中完成：

1. 讀取最新 inventory。
2. 驗證素材。
3. 重建決定性素材清單。
4. 驗證目標池。
5. 使用注入 RNG 解析產物。
6. 扣除 10 張素材。
7. 加入產物 inventory。
8. 寫入不可重複的 upgrade record。
9. 更新 metadata。

任一步驟失敗必須整筆回滾。

```ts
export type CardUpgradeSourceRarity = 'N' | 'R' | 'SR';
export type CardUpgradeTargetRarity = 'R' | 'SR' | 'SSR';

export interface CardUpgradeMaterial {
  readonly cardId: string;
  readonly quantity: number;
}

export interface CardUpgradeRecord {
  readonly upgradeId: string;
  readonly sourceRarity: CardUpgradeSourceRarity;
  readonly targetRarity: CardUpgradeTargetRarity;
  readonly materials: readonly CardUpgradeMaterial[];
  readonly resultCardId: string;
  readonly acquisitionId: string;
  readonly createdAt: string;
}
```

取得方式新增 `upgrade-reward`，`sourceReference` 指向 `upgradeId`。

- 相同 `upgradeId` 重放不得再次扣料或發卡。
- 多分頁同時合成時，以 transaction 內最新 inventory 為準。
- 素材已被其他分頁消耗時安全失敗，不得產生負數。

---

## 11. 收藏資料庫 migration Gate

既有闖關資料不得修改：

```text
Database：cicg-progress
Version：1
Store：campaigns
Key：chapter-1
```

收藏資料庫升級核准為：

```text
Database：cicg-card-collection
Version：2
Stores：grants、inventory、metadata、upgrades
```

Version 1 → 2 migration 必須：

- 保留既有 grants、inventory、metadata。
- 新增 `upgrades` store。
- 將舊 `card-grant:main-levels:<10n>` grant 視為 legacy milestone grant，保留但不再新增。
- 依已完成關卡建立缺少的 per-level grants；不得重複發放已由 legacy grant 取得的卡片。
- migration 中斷後重開必須安全重跑。
- 失敗不得破壞 Version 1 既有資料。

舊里程碑 grant 的防重策略：依已存在的 milestoneLevelCount，將對應全域序號中最後一關標記為已由 legacy reward 覆蓋；其餘已完成關卡建立 per-level grant。此規則必須由 migration 測試鎖定。

---

## 12. UI 與錯誤處理

關卡完成順序：

```text
先保存闖關結果
→ 再同步收藏獎勵
```

收藏失敗不得回滾闖關結果。grant 為 pending 時顯示「卡片獎勵待補發」，不得顯示偽造卡面。

收藏頁顯示：

- 各稀有度可消耗重複卡總數。
- `目前數量 / 10`。
- 可合成按鈕。
- 自動選材摘要。
- 無合法目標池時的禁用原因。

正式 UI 不顯示：

- `hiddenRewardScore`。
- SR／SSR 實際機率。
- `rollValue`。

動畫不得承擔扣料、抽卡或保存；reduced-motion 提供簡化揭示。

至少區分：

```text
reward-pool-empty
reward-pending
invalid-random-value
invalid-hidden-score
insufficient-upgrade-materials
upgrade-target-pool-empty
upgrade-material-conflict
upgrade-already-applied
collection-transaction-failed
```

---

## 13. TDD 與永久 Gate

### 每關贈卡與保底

- 每個不同關卡首次完成只建立一個 per-level rewardId。
- 重玩與升星不贈卡。
- 一般關只使用該關 idiomId。
- 全域第 10 關使用已完成範圍 R+。
- 全域第 100 關使用已完成範圍 SR+ 且只發一張。
- 每章不重新計算 10／100。
- UR、Review、Legacy、NeedsReview 被排除。
- 合法最低保底池為空時保持 pending。
- 已持有卡不被排除。

### 隱藏積分與機率

- E／D／C／B／A／S 分別為 1／2／3／4／5／6 分。
- 第一關兩個 E 成語為 2 分。
- 前十關合計 50 分時，SR 為 50／1000，SSR 為 5／1000。
- SR 上限 400／1000，SSR 上限 100／1000。
- 積分跨章累積且不重置。
- 重玩不增加積分。
- 第 10 關基礎區不得低於 R。
- 第 100 關基礎區不得低於 SR。
- 目標稀有度缺席時只向下解析且不低於保底。
- 快照保存後不受 Catalog 後續修改影響。
- 正式 UI 不顯示積分與機率。

### 升級素材與產物

- 每張卡至少保留 1 張。
- 不同成語可混合湊 10。
- 不同稀有度不可混合。
- 自動選材依多餘數量降冪、卡號升冪。
- 只使用已通關內容中的目標稀有度。
- 跨章已通關內容可共同進池。
- 產物允許重複。
- 無目標卡時不扣素材。
- 固定 N→R、R→SR、SR→SSR 10：1。

### Migration、交易與回歸

- Version 1 → 2 無損保留資料並新增 upgrades store。
- legacy milestone grants 不重複發卡。
- 扣料、入庫與 upgrade record 同 transaction。
- 任一步驟失敗完整回滾。
- 相同 upgradeId 重放不重複套用。
- 多分頁競爭不得造成負數或重複產物。
- 關卡保存成功、收藏保存失敗時，關卡結果仍保留。

實作 PR 必須重新執行：

```bash
npm install
./scripts/verify.sh
npm audit
```

並記錄實際 Node tests、Card tests、Puzzle tests、TypeScript strict、ESLint、Vite／PWA Build 與 npm audit 結果。

---

## 14. 非目標

- 付費隨機抽卡。
- 顯示隱藏積分或精確機率。
- 卡片分解貨幣。
- 玩家指定產物。
- 手動選擇素材。
- pity counter。
- SSR 升 UR。
- 未授權 IP 聯名。
- 後端、登入、雲端同步。
- 改寫成語正式語義稀有度。

---

## 15. 鎖定摘要

```text
每首次完成 1 個主線關卡：贈 1 張卡
一般關：該關成語，N+
全域 10 倍數關：已完成範圍，R+
全域 100 倍數關：已完成範圍，SR+
每關最多一張；完全隨機、允許重複

隱藏積分：E=1、D=2、C=3、B=4、A=5、S=6
SR 籤數=min(隱藏積分, 400)
SSR 籤數=min(floor(隱藏積分/10), 100)
前十關 50 分：SR 50/1000、SSR 5/1000
正式玩家 UI 不顯示積分或機率

10 多餘 N  → 1 隨機 R
10 多餘 R  → 1 隨機 SR
10 多餘 SR → 1 隨機 SSR
每種卡至少保留 1 張
素材可跨成語、跨章混合
自動選材：多餘數量降冪、卡號升冪
產物限定所有已通關內容，完全隨機且可重複

cicg-card-collection 升級至 Version 2
新增 upgrades store
所有 grant、機率快照、扣料、入庫與紀錄具冪等與原子保護
```