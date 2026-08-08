# 每關贈卡與重複卡升級系統設計規格

日期：2026-08-08  
Repository：`gshan1209-cell/Chinese-Idiom-Chain-Game`  
狀態：Approved design  
任務類型：收藏獎勵規則、卡池解析、重複卡升級、IndexedDB 交易與 TDD；本文件不包含 production code

## 1. 目標

本規格取代舊版「每完成 10 個不同主線關卡贈送 1 張卡」規則，改為：

> 玩家每首次完成 1 個不同主線關卡，即取得 1 張由該關或已完成範圍卡池解析出的成語卡片。

同時建立：

1. 一般關卡的單關限定贈卡。
2. 每 10 關的 R 以上保底。
3. 每 100 關的 SR 以上保底。
4. 完全隨機、允許重複的抽取規則。
5. 重複卡 10：1 升級系統。
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

## 3. 每關贈卡規則

### 3.1 觸發條件

只在某個主線關卡由「未完成」首次轉為「已完成」時建立一次獎勵。

不得觸發：

- 重玩已完成關卡。
- 提高星級。
- 刷新最佳分數、錯誤數或提示數。
- 自由接龍、打地鼠、陷阱、收藏、購買、測試或預覽。

每個關卡使用固定獎勵 ID：

```text
card-grant:main-level:<chapterId>:<levelNumber>
```

例如：

```text
card-grant:main-level:chapter-1:1
card-grant:main-level:chapter-1:10
```

同一 `rewardId` 只能建立一次；重新載入、跨分頁競爭或重放不得重複發卡。

### 3.2 一般關卡卡池

不屬於 10 的倍數的關卡：

- 候選卡只來自該關實際 placement 使用的不同 `idiomId`。
- 同一成語在該關重複 placement 時只建立一個候選項目。
- 只納入 N、R、SR、SSR。
- 不要求最低稀有度，最低為 N。
- 允許抽到已持有卡片。

### 3.3 每 10 關保底

當全域主線序號為 10 的倍數但不是 100 的倍數時：

- 候選範圍為玩家從第 1 關至當前關已完成內容中出現過的全部不同 `idiomId`。
- 只保留稀有度 R、SR、SSR。
- 以已完成範圍作為保底池，不限當前單關。

例如：

```text
第 10 關：第 1～10 關出現過的 R／SR／SSR
第 20 關：第 1～20 關出現過的 R／SR／SSR
```

### 3.4 每 100 關保底

當全域主線序號為 100 的倍數時：

- 候選範圍為玩家從第 1 關至當前關已完成內容中出現過的全部不同 `idiomId`。
- 只保留稀有度 SR、SSR。
- 第 100、200、300……關同時也是 10 的倍數，但必須套用較高的 SR 以上保底，不再另發第二張卡。

### 3.5 卡池為空

如果正式核准卡片不足，導致當次候選池為空：

- 建立 `pending` grant。
- 不得降低最低稀有度。
- 不得改抽未完成關卡、其他章節未通關內容或 UR。
- 不得使用 Review、Legacy、NeedsReview、遠端圖片或模板空框偽造獎勵。
- 未來正式卡池更新後，可安全重試解析同一 grant。

---

## 4. 隨機解析規則

### 4.1 完全隨機並允許重複

本規格取消舊版「未持有卡優先」。

- 玩家是否已持有該卡，不影響候選資格。
- 每次解析都可抽到重複卡。
- 重複取得只增加 `ownedCount` 並新增唯一 acquisition 紀錄。
- 已解析 grant 永不重新抽取。

### 4.2 權重

先依關卡範圍與最低稀有度建立合法候選池，再使用卡片正式定義中的 `weight` 執行加權隨機。

- 不採各稀有度平均。
- 不因 SSR 數量較少就自動提高 SSR 機率。
- `weight` 必須是大於 0 的有限整數。
- RNG 必須由領域層注入，不得在 React 或 DOM callback 直接呼叫 `Math.random()`。
- 無效亂數值必須回傳可稽核錯誤，不得扣除或改寫獎勵。

### 4.3 先保存、後揭示

合法順序：

```text
建立 pending grant
→ 解析卡片
→ 原子保存 grant 與 inventory
→ UI 播放揭卡動畫
→ 標記 revealed
```

動畫中斷、頁面重整或裝置離線不得改變已保存結果。

---

## 5. 重複卡升級系統

### 5.1 固定升階比例

```text
10 張可消耗 N  → 1 張 R
10 張可消耗 R  → 1 張 SR
10 張可消耗 SR → 1 張 SSR
```

- SSR 是一般升級最高階。
- SSR 不可合成 UR。
- UR 不可作為素材，也不可作為一般升級產物。
- 不允許跨稀有度混合素材。

### 5.2 保留圖鑑本體

每種卡片至少保留 1 張。

```text
consumableCount = max(ownedCount - 1, 0)
```

只有 `consumableCount` 可作為素材。

因此：

- `ownedCount = 1`：不可消耗。
- `ownedCount = 4`：可消耗 3 張。
- 合成後不得使任何卡片的 `ownedCount` 低於 1。

### 5.3 可混合不同成語

同一次合成可使用多張不同成語的同稀有度重複卡，只要可消耗總數至少 10。

例如：

```text
N-003 可消耗 5
N-008 可消耗 3
N-001 可消耗 2
→ 合計 10，可合成 1 張 R
```

---

## 6. 自動選材規則

玩家不逐張選擇素材，由系統決定性地自動選滿 10 張。

排序固定為：

1. 可消耗數量由高至低。
2. 可消耗數量相同時，依正式卡號升冪。
3. 依序取用，直到累計 10 張。
4. 最後一張卡只取達成 10 所需的數量，不必消耗其全部多餘份數。

相同 inventory 與相同卡號 Registry 必須產生完全相同的素材清單，不使用亂數。

合成確認畫面只需顯示：

- 素材稀有度。
- 自動選出的卡號、卡名與數量。
- 合計 10 張。
- 可能取得的目標稀有度與候選範圍。

玩家可確認或取消，但不提供手動替換。

---

## 7. 升級產物卡池

### 7.1 已通關內容限定

升級產物只可從玩家所有已完成主線關卡中出現過的卡片建立候選池。

- N → R：只取已通關內容中的 R。
- R → SR：只取已通關內容中的 SR。
- SR → SSR：只取已通關內容中的 SSR。
- 未完成關卡不得提前進池。
- 已完成不同章節的內容可共同建立候選池。

### 7.2 跨章共用素材

所有章節取得的同稀有度重複卡可共同作為素材。

例如第一章 N 卡與第二章 N 卡可以混合完成一次 N → R 合成。

不建立章節專屬素材錢包，也不限制產物必須來自素材所在章節。

### 7.3 產物完全隨機並允許重複

升級候選池中不採未持有優先：

- 可抽到已持有目標卡。
- 重複 R、SR 可繼續成為下一階升級素材。
- 使用目標卡片正式 `weight` 加權解析。

### 7.4 無合法產物

如果可消耗素材已達 10 張，但已通關內容中沒有合法目標稀有度卡片：

- 合成不可執行。
- 不扣除素材。
- 不建立完成紀錄。
- UI 顯示「尚無可合成的目標卡片」。
- 不得降級、跨級或改抽其他稀有度。

---

## 8. 升級交易與紀錄

### 8.1 原子交易

一次合成必須在同一個 `cicg-card-collection` readwrite transaction 中完成：

1. 重新讀取最新 inventory。
2. 驗證素材仍足夠。
3. 重新建立決定性素材清單。
4. 驗證目標卡池非空。
5. 使用注入 RNG 解析產物。
6. 扣除 10 張素材。
7. 加入產物 inventory。
8. 寫入不可重複的 upgrade record。
9. 更新 metadata。

任一步驟失敗必須整筆回滾。

### 8.2 建議資料模型

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

取得方式新增：

```text
upgrade-reward
```

升級 acquisition 的 `sourceReference` 必須指向 `upgradeId`。

### 8.3 冪等與競爭保護

- 每次使用者確認合成時建立唯一 `upgradeId`。
- 相同 `upgradeId` 重放不得再次扣料或再次發卡。
- 多分頁同時合成時，以 transaction 內最新 inventory 為準。
- 若另一分頁已消耗素材，本次操作安全失敗，不得產生負數。

---

## 9. 舊資料與 migration

本功能不得修改既有 `cicg-progress`：

```text
Database：cicg-progress
Version：1
Store：campaigns
Key：chapter-1
```

收藏資料庫仍使用：

```text
Database：cicg-card-collection
```

由於收藏核心 v1 目前 stores 為 `grants`、`inventory`、`metadata`，升級紀錄需要新增持久化結構時，必須：

- 明確設計資料庫版本 migration。
- 不可直接覆寫或遺失既有 grants／inventory。
- migration 必須可重跑、可測試且具 rollback／失敗保護。
- 在 Implementation Plan 中決定新增 `upgrades` store 或採等價的版本化結構。

本設計不直接核准具體 IndexedDB version number；該項屬於實作計畫與 schema migration 高風險 Gate，實作前需明確列出。

---

## 10. UI 行為

### 10.1 關卡完成

- 關卡進度先保存成功。
- 再同步建立或解析該關卡贈卡。
- 收藏失敗不得回滾闖關結果。
- 若 grant 為 pending，顯示「卡片獎勵待補發」，不得顯示偽造卡面。
- 已解析後播放單張揭卡動畫。

### 10.2 合成入口

收藏頁依稀有度顯示：

- 可消耗重複卡總數。
- `目前數量 / 10`。
- 可合成時啟用按鈕。
- 無合法目標卡池時禁用並顯示原因。

### 10.3 動畫

- 動畫不得承擔扣料、抽卡或保存規則。
- reduced-motion 模式提供簡化揭示。
- 中斷動畫後重新進入仍顯示已保存結果。

---

## 11. 錯誤處理

至少需要可區分：

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

錯誤不得造成：

- 關卡進度遺失。
- 素材扣除但沒有產物。
- 產物加入但素材未扣除。
- 同一獎勵或升級重複發放。
- `ownedCount` 小於 1 或出現負數。

---

## 12. TDD 與永久 Gate

### 12.1 每關贈卡

- 每個不同關卡首次完成只建立一個 rewardId。
- 重玩與升星不重複贈卡。
- 一般關只使用該關 idiomId。
- 第 10 關使用已完成範圍 R+。
- 第 100 關使用已完成範圍 SR+，不額外再發第 10 關保底卡。
- UR、Review、Legacy、NeedsReview 與不允許 milestone 取得的卡被排除。
- 卡池為空時保持 pending，不降級。
- 已持有卡不被排除。

### 12.2 升級素材

- 每張卡至少保留 1 張。
- 混合不同卡可湊滿 10。
- 不同稀有度不可混合。
- 自動選材先依可消耗數量降冪，再依卡號升冪。
- 相同狀態產生相同素材清單。
- 不足 10 張時不可合成。

### 12.3 升級產物

- 只使用所有已通關內容中的目標稀有度。
- 跨章已通關內容可以共同進池。
- 未通關內容不進池。
- 允許產物重複。
- 無目標卡時不扣素材。
- N→R、R→SR、SR→SSR 固定 10：1。
- SSR 與 UR 不可作為一般升級來源。

### 12.4 交易與冪等

- 扣料、產物入庫與 upgrade record 同 transaction。
- 任一步驟失敗完整回滾。
- 相同 upgradeId 重放不重複套用。
- 多分頁競爭不得造成負數或重複產物。
- 關卡保存成功、收藏保存失敗時，關卡結果仍保留。

### 12.5 完整回歸

實作 PR 必須重新執行：

```bash
npm install
./scripts/verify.sh
npm audit
```

並記錄實際 Node tests、Card tests、Puzzle tests、TypeScript strict、ESLint、Vite／PWA Build 與 npm audit 結果，不得沿用舊數字。

---

## 13. 非目標

本階段不包含：

- 付費隨機抽卡。
- 卡片分解成貨幣。
- 玩家指定合成產物。
- 手動挑選升級素材。
- 保底累積次數或 pity counter。
- SSR 升 UR。
- 未授權 IP 聯名。
- 後端、登入、雲端同步或跨裝置合併。
- 修改成語本身的正式語義稀有度。

---

## 14. 最終鎖定摘要

```text
每首次完成 1 個主線關卡：贈 1 張卡
一般關：該關成語卡池，N+
10 倍數關：第 1 關至當前已完成範圍，R+
100 倍數關：第 1 關至當前已完成範圍，SR+
完全隨機，可重複，使用正式 weight
UR 永久排除

10 多餘 N  → 1 隨機 R
10 多餘 R  → 1 隨機 SR
10 多餘 SR → 1 隨機 SSR
每種卡至少保留 1 張
素材可跨成語、跨章混合
系統自動選材：多餘數量降冪、卡號升冪
產物限定所有已通關內容，完全隨機且可重複
扣料、抽取、入庫、紀錄必須原子化
```
