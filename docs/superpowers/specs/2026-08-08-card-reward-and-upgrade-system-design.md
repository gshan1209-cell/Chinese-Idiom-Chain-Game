# 每關贈卡與重複卡升級系統設計規格

日期：2026-08-08  
Repository：`gshan1209-cell/Chinese-Idiom-Chain-Game`  
狀態：Draft for written review  
任務類型：收藏獎勵規則、卡池解析、重複卡升級、IndexedDB 交易與 TDD；本文件不包含 production code

## 1. 目標

本規格取代舊版「每完成 10 個不同主線關卡贈送 1 張卡」規則：

> 玩家每首次完成 1 個不同主線關卡，即取得 1 張由該關或已完成範圍卡池解析出的成語卡片。

並建立：

1. 一般關卡的單關限定贈卡。
2. 每 10 關的 R 以上保底。
3. 每 100 關的 SR 以上保底。
4. 完全隨機、允許重複的抽取規則。
5. 重複卡固定 10：1 升級系統。
6. 自動且決定性的素材選擇。
7. 跨章共用素材與已通關內容限定產物卡池。
8. 原子化扣料、解析、入庫與可恢復紀錄。

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

若本文件與舊版「每十關贈卡」規格衝突，以本文件為準。

不變規則：

- N～SSR 的語義稀有度不可因合成而改寫。
- UR 只保留給具可稽核正式授權的外部 IP 聯名。
- UR 不得進入一般主線贈卡或一般升級系統。
- 只有 Approved、來源核准、稀有度核准且允許對應取得方式的卡片可進正式卡池。

---

## 3. 關卡識別與全域主線序號

每個主線關卡必須同時具備：

```ts
interface MainCampaignLevelIdentity {
  readonly chapterId: string;
  readonly levelNumber: number;       // 章內關卡編號
  readonly campaignOrdinal: number;   // 跨章永久全域序號
}
```

`campaignOrdinal` 是 1、2、3……的跨章連續序號，也是判斷第 10／100 關保底的唯一依據。

永久規則：

- 第一章第 1～20 關的 `campaignOrdinal` 為 1～20。
- 第二章若承接第一章，章內第 1 關的 `campaignOrdinal` 應為 21，而不是重新計算為 1。
- 每章不得自行重新觸發「第 10 關」或「第 100 關」保底。
- `campaignOrdinal` 一旦發布不得因插關或排序調整而改寫；未來若需要插入內容，必須另做資料 migration 設計。

每個關卡固定獎勵 ID：

```text
card-grant:main-level:<chapterId>:<levelNumber>
```

同一 `rewardId` 只能建立一次。

---

## 4. 每關贈卡規則

### 4.1 觸發條件

只在某個主線關卡由「未完成」首次轉為「已完成」時建立一次獎勵。

不得觸發：

- 重玩已完成關卡。
- 提高星級。
- 刷新最佳分數、錯誤數或提示數。
- 自由接龍、打地鼠、陷阱、收藏、購買、測試或預覽。

重新載入、舊進度補發、跨分頁競爭或重放都不得重複發卡。

### 4.2 一般關卡

當 `campaignOrdinal` 不是 10 的倍數時：

- 候選卡只來自該關實際 placement 使用的不同 `idiomId`。
- 同一成語在該關重複 placement 時只建立一個候選項目。
- 只納入 N、R、SR、SSR。
- 最低稀有度為 N。
- 允許抽到已持有卡片。

### 4.3 每 10 關保底

當 `campaignOrdinal % 10 === 0` 且 `campaignOrdinal % 100 !== 0`：

- 候選範圍為全域序號 1 至當前序號之間，玩家已完成內容中出現過的全部不同 `idiomId`。
- 只保留 R、SR、SSR。
- 以已完成範圍作為保底池，不限當前單關。

### 4.4 每 100 關保底

當 `campaignOrdinal % 100 === 0`：

- 候選範圍為全域序號 1 至當前序號之間，玩家已完成內容中出現過的全部不同 `idiomId`。
- 只保留 SR、SSR。
- 同時命中 10 倍數規則時，只套用較高的 SR 以上保底，不額外再發第二張卡。

### 4.5 卡池為空

若正式核准卡片不足：

- 建立 `pending` grant。
- 不得降低最低稀有度。
- 不得改抽未完成關卡、未通關內容、其他稀有度或 UR。
- 不得使用 Review、Legacy、NeedsReview、遠端圖片或模板空框偽造獎勵。
- 正式卡池更新後，可安全重試解析同一 grant。

---

## 5. 隨機解析

### 5.1 完全隨機並允許重複

本規格取消舊版「未持有卡優先」。

- 是否已持有該卡，不影響候選資格。
- 每次解析都可抽到重複卡。
- 重複取得增加 `ownedCount`，並新增唯一 acquisition 紀錄。
- 已解析 grant 永不重新消耗 RNG，也不得更換卡片。

### 5.2 正式權重

先依範圍和最低稀有度建立合法池，再使用卡片定義中的 `weight` 加權抽取。

- 不採各稀有度平均。
- 不因 SSR 數量較少而自動提高 SSR 機率。
- `weight` 必須是大於 0 的有限整數。
- RNG 必須由純 TypeScript 領域層注入，不得在 React 或 DOM callback 直接呼叫 `Math.random()`。
- 無效亂數值不得改寫 grant 或 inventory。

### 5.3 先保存、後揭示

```text
建立 pending grant
→ 解析卡片
→ 原子保存 grant 與 inventory
→ 播放揭卡動畫
→ 標記 revealed
```

動畫中斷、重整或離線不得改變已保存結果。

---

## 6. 重複卡升級

### 6.1 固定比例

```text
10 張可消耗 N  → 1 張 R
10 張可消耗 R  → 1 張 SR
10 張可消耗 SR → 1 張 SSR
```

- SSR 是一般升級最高階。
- SSR 不可合成 UR。
- UR 不可作為素材或一般升級產物。
- 不允許跨稀有度混合素材。

### 6.2 保留圖鑑本體

每種卡至少保留 1 張：

```text
consumableCount = max(ownedCount - 1, 0)
```

合成後任何卡片的 `ownedCount` 都不得小於 1。

### 6.3 混合不同成語

同一次合成可使用不同成語的同稀有度重複卡，只要可消耗總數至少 10。

---

## 7. 自動選材

玩家不逐張選擇，由系統決定性選滿 10 張。

排序固定為：

1. `consumableCount` 由高至低。
2. 數量相同時依正式卡號升冪。
3. 依序取用至累計 10 張。
4. 最後一張卡只取達成 10 所需的數量。

相同 inventory 與卡號 Registry 必須產生相同素材清單，不使用亂數。

確認畫面顯示素材卡號、卡名、數量、合計與目標稀有度；玩家只能確認或取消，不提供手動替換。

---

## 8. 升級產物卡池

### 8.1 已通關內容限定

- N → R：只取所有已通關內容中的 R。
- R → SR：只取所有已通關內容中的 SR。
- SR → SSR：只取所有已通關內容中的 SSR。
- 未通關內容不得提前進池。
- 不同章節的已通關內容可共同進池。

### 8.2 跨章共用素材

所有章節取得的同稀有度重複卡可共同作為素材，不建立章節專屬素材錢包。

### 8.3 產物允許重複

- 不採未持有優先。
- 可抽到已持有目標卡。
- 重複 R、SR 可繼續成為下一階素材。
- 使用目標卡片正式 `weight` 加權解析。

### 8.4 無合法產物

若素材已達 10，但已通關內容中沒有合法目標稀有度卡：

- 合成不可執行。
- 不扣除素材。
- 不建立完成紀錄。
- UI 顯示「尚無可合成的目標卡片」。
- 不得降級、跨級或改抽其他稀有度。

---

## 9. 原子交易與資料模型

一次合成必須在同一個 `cicg-card-collection` readwrite transaction 中：

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

建議型別：

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

取得方式新增 `upgrade-reward`，其 `sourceReference` 指向 `upgradeId`。

冪等規則：

- 相同 `upgradeId` 重放不得再次扣料或發卡。
- 多分頁同時合成時，以 transaction 內最新 inventory 為準。
- 若素材已被另一分頁消耗，本次安全失敗，不得產生負數。

---

## 10. Schema migration Gate

不得修改既有闖關資料：

```text
Database：cicg-progress
Version：1
Store：campaigns
Key：chapter-1
```

收藏仍使用 `cicg-card-collection`。若新增 `upgrades` store 或擴充 acquisition method，實作前必須在 Implementation Plan 明確設計：

- 新收藏資料庫版本。
- grants／inventory／metadata 的無損 migration。
- migration 重跑與中斷保護。
- 失敗 rollback。
- 舊版資料載入測試。

本文件不直接核准具體 IndexedDB version number；修改收藏 schema 屬高風險實作 Gate。

---

## 11. UI 與錯誤處理

關卡完成順序：

```text
先保存闖關結果
→ 再同步收藏獎勵
```

收藏失敗不得回滾闖關結果。若 grant 為 pending，顯示「卡片獎勵待補發」，不得顯示偽造卡面。

收藏頁顯示：

- 各稀有度可消耗重複卡總數。
- `目前數量 / 10`。
- 可合成按鈕。
- 無合法目標池時的禁用原因。

動畫不得承擔扣料、抽卡或保存；reduced-motion 提供簡化揭示。

至少區分：

```text
reward-pool-empty
reward-pending
invalid-random-value
insufficient-upgrade-materials
upgrade-target-pool-empty
upgrade-material-conflict
upgrade-already-applied
collection-transaction-failed
```

---

## 12. TDD 與永久 Gate

### 每關贈卡

- 每個不同關卡首次完成只建立一個 rewardId。
- 重玩與升星不贈卡。
- 一般關只使用該關 idiomId。
- 全域第 10 關使用已完成範圍 R+。
- 全域第 100 關使用已完成範圍 SR+，且只發一張。
- 每章不重新計算 10／100。
- UR、Review、Legacy、NeedsReview 被排除。
- 卡池空時保持 pending，不降級。
- 已持有卡不被排除。

### 升級素材

- 每張卡至少保留 1 張。
- 不同成語可混合湊 10。
- 不同稀有度不可混合。
- 自動選材依多餘數量降冪、卡號升冪。
- 相同狀態產生相同清單。
- 不足 10 張不可合成。

### 升級產物

- 只使用所有已通關內容中的目標稀有度。
- 跨章已通關內容可以共同進池。
- 未通關內容不進池。
- 允許產物重複。
- 無目標卡時不扣素材。
- 固定 N→R、R→SR、SR→SSR 10：1。
- SSR 與 UR 不可作為一般升級來源。

### 交易與回歸

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

並記錄實際 Node tests、Card tests、Puzzle tests、TypeScript strict、ESLint、Vite／PWA Build 與 npm audit 結果，不得沿用舊數字。

---

## 13. 非目標

- 付費隨機抽卡。
- 卡片分解貨幣。
- 玩家指定產物。
- 手動選擇素材。
- pity counter。
- SSR 升 UR。
- 未授權 IP 聯名。
- 後端、登入、雲端同步。
- 改寫成語的正式語義稀有度。

---

## 14. 鎖定摘要

```text
每首次完成 1 個主線關卡：贈 1 張卡
一般關：該關成語，N+
全域 10 倍數關：已完成範圍，R+
全域 100 倍數關：已完成範圍，SR+
每關最多一張；完全隨機、可重複、使用正式 weight
UR 永久排除

10 多餘 N  → 1 隨機 R
10 多餘 R  → 1 隨機 SR
10 多餘 SR → 1 隨機 SSR
每種卡至少保留 1 張
素材可跨成語、跨章混合
自動選材：多餘數量降冪、卡號升冪
產物限定所有已通關內容，完全隨機且可重複
扣料、抽取、入庫、紀錄必須原子化
```
