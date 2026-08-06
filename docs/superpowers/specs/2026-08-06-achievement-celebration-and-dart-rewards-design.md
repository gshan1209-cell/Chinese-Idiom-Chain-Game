# 成就解鎖特效與飛鏢轉盤獎勵設計規格

日期：2026-08-06  
Repository：`gshan1209-cell/Chinese-Idiom-Chain-Game`  
狀態：Approved  
建議實作分支：`feat/achievement-celebration-rewards`  
任務類型：設計規格；本文件不包含 production code

## 1. 目標

當玩家首次取得成就徽章時，提供具有儀式感的完整獲獎流程：

1. 顯示徽章解鎖特效畫面。
2. 進入飛鏢轉盤式獲獎環節。
3. 取得一般、稀有或傳說級遊戲內道具。
4. 將獎勵安全保存，之後可在收藏或道具頁查看。

核心原則：

> 徽章是永久成就；飛鏢轉盤是額外獎勵。動畫可以略過，但徽章與獎勵結果不能遺失或重複發放。

本功能不得在填字、自由接龍或打地鼠進行中突然打斷玩家。

## 2. 與既有成就規格的關係

本文件是下列規格的子規格：

```text
docs/superpowers/specs/2026-08-06-achievement-badges-and-benefits-design.md
```

既有永久原則保持不變：

- 徽章解鎖後永久保留。
- 徽章不因領取或使用獎勵而消失。
- 成就分數首版只有展示用途，沒有現金價值。
- 真實折價券、實體小物或外部福利不得只依賴本機 IndexedDB 發放。
- 未來若接真實福利，必須由後端核發、驗證、防重複兌換並留下稽核紀錄。

本文件只規範首版離線可用的遊戲內獎勵。

## 3. 安全觸發節點

### 3.1 可以顯示完整獲獎流程

- 填字關卡完成並顯示星級結算後。
- 自由接龍一局正式結束後。
- 打地鼠回合完全結束並返回自由接龍後。
- 玩家在成就殿堂主動點擊「領取待領獎勵」。

### 3.2 禁止顯示

- 填字盤面仍在輸入時。
- 智慧自動跳格執行期間。
- 提示、移除、重排或陷阱動畫進行中。
- 自由接龍等待玩家輸入時。
- 打地鼠倒數或回合計時中。
- PWA 更新提示、離線提示或錯誤對話框上方。

若在不安全節點解鎖成就，只能寫入待慶祝佇列，不得直接彈出畫面。

## 4. 完整使用者流程

```text
成就條件成立
→ 原子化保存徽章解鎖
→ 建立待慶祝項目
→ 到達安全節點
→ 顯示徽章解鎖特效
→ 玩家點擊「開始獲獎」
→ 顯示飛鏢轉盤
→ 系統先決定並保存獎勵結果
→ 播放飛鏢投擲動畫
→ 顯示命中結果
→ 保存已領取狀態
→ 返回原本流程
```

若同一次結算解鎖多枚徽章：

- 先以一個畫面顯示全部新徽章。
- 每枚新徽章提供一次獲獎機會。
- 單次流程最多立即進行 3 次。
- 超過 3 次的部分保存為待領取，不得遺失。

## 5. 徽章解鎖特效畫面

### 5.1 必要內容

- 主標題：`成就解鎖！`
- 徽章圖示。
- 徽章名稱。
- 徽章簡介。
- 徽章稀有度。
- 本枚徽章提供的成就分數。
- `開始獲獎` 按鈕。
- `略過動畫` 按鈕。

略過只略過視覺動畫，不得略過獎勵領取流程或造成獎勵消失。

### 5.2 動畫建議

```text
背景柔和變暗
→ 徽章從中央淡入並放大
→ 光圈展開
→ 少量星光或紙屑
→ 顯示名稱與說明
→ 按鈕出現
```

限制：

- 不得高速閃爍。
- 不得使用全螢幕白色閃光。
- 不得播放超過 4 秒且無法略過的動畫。
- 不得阻止瀏覽器返回或造成焦點陷阱。

### 5.3 Reduced Motion

當 `prefers-reduced-motion: reduce`：

- 徽章只淡入，不做大幅縮放。
- 取消粒子飛散。
- 光圈改為靜態邊框亮起。
- 獎勵流程與結果保持不變。

## 6. 飛鏢轉盤互動

### 6.1 表現方式

採用「固定圓盤＋飛鏢投擲」方案：

- 圓盤顯示獎勵區塊。
- 玩家點擊 `開始投擲`。
- 系統播放短促蓄力效果。
- 飛鏢飛向已決定的獎勵區塊。
- 命中後顯示獎勵結果。

圓盤可以旋轉作為視覺效果，但最終結果不得由 CSS 動畫角度或 DOM 狀態決定。

### 6.2 結果決定時機

使用者點擊 `開始投擲` 後，必須依序：

1. 由純 TypeScript 獎勵引擎決定結果。
2. 先將結果寫入待領獎紀錄。
3. 寫入成功後才播放投擲動畫。
4. 動畫結束後標記為已展示。

如此即使應用程式在動畫期間關閉，重新開啟後仍能恢復並顯示同一個獎勵，不得重新抽取。

### 6.3 防重抽規則

以下操作不得改變既定結果：

- 重新整理頁面。
- 關閉並重開 PWA。
- 切換背景分頁。
- 點擊返回。
- 略過動畫。
- 網路中斷。

每個 `rewardSpinId` 只能產生一個結果。

## 7. 獎勵池

### 7.1 稀有度

```ts
export type RewardRarity = 'common' | 'rare' | 'legendary';
```

首版建議權重：

| 稀有度 | 權重 |
|---|---:|
| 一般 | 75 |
| 稀有 | 20 |
| 傳說 | 5 |

UI 必須在規則說明頁清楚公開目前稀有度比例。

### 7.2 一般獎勵

- 提示券 ×1。
- 提示券 ×2。
- 失誤護盾 ×1。
- 雙倍分數券 ×1。
- 未來限時模式加時券 ×1。

### 7.3 稀有獎勵

- 稀有徽章外框。
- 稀有玩家稱號。
- 稀有盤面視覺效果。
- 稀有收藏圖卡。
- 稀有道具箱。

### 7.4 傳說獎勵

- 傳說徽章外框。
- 傳說玩家稱號。
- 傳說盤面視覺效果。
- 限定收藏圖卡。
- 傳說道具箱。

首版傳說獎勵仍只有遊戲內收藏或功能用途，不得代表現金、折價券或可交易價值。

### 7.5 重複收藏品

收藏型獎勵若已擁有：

- 不得建立重複且無意義的相同紀錄。
- 建議轉換為指定數量的遊戲內碎片或替代功能型道具。
- 轉換規則必須固定並寫入資料，不得由 UI 隨機決定。

## 8. 保底機制

首版加入稀有保底：

```text
連續 10 次沒有取得稀有或傳說
→ 第 11 次至少取得稀有
```

規則：

- 取得稀有或傳說後，保底計數歸零。
- 一般獎勵使計數加一。
- 保底只提高最低稀有度，不保證傳說。
- 保底計數必須和獎勵結果一起原子化保存。
- 重設第一章進度不得清除保底計數。

## 9. 非賭博與公平限制

本功能屬於免費成就獎勵，不得設計成付費抽獎。

永久禁止：

- 花錢購買轉盤次數。
- 看廣告換取轉盤次數。
- 點擊推薦內容換取轉盤次數。
- 使用真實貨幣提高稀有率。
- 將獎勵轉售或兌換現金。
- 將折價券直接放入本機隨機獎勵池。
- 使用逼迫式倒數要求立刻抽取。
- 未公開稀有度比例。

玩家未立即抽取時，獲獎機會應安全保存，之後可在成就殿堂領取。

## 10. 領域模型建議

```ts
export interface AchievementCelebrationQueueItem {
  readonly id: string;
  readonly achievementId: string;
  readonly unlockedAt: string;
  readonly rewardSpinIds: readonly string[];
  readonly status: 'pending' | 'presenting' | 'completed';
}

export type RewardRarity = 'common' | 'rare' | 'legendary';

export type RewardType =
  | 'hint-ticket'
  | 'mistake-shield'
  | 'double-score'
  | 'time-boost'
  | 'badge-frame'
  | 'player-title'
  | 'board-effect'
  | 'collectible'
  | 'item-box';

export interface RewardDefinition {
  readonly id: string;
  readonly name: string;
  readonly rarity: RewardRarity;
  readonly type: RewardType;
  readonly amount: number;
  readonly weight: number;
  readonly enabled: boolean;
}

export interface RewardSpin {
  readonly id: string;
  readonly achievementId: string;
  readonly status: 'available' | 'resolved' | 'presented' | 'claimed';
  readonly resolvedRewardId: string | null;
  readonly resolvedAt: string | null;
  readonly claimedAt: string | null;
}

export interface RewardInventory {
  readonly consumables: Readonly<Record<string, number>>;
  readonly collectibles: readonly string[];
  readonly rarePityCount: number;
}
```

## 11. 架構邊界

建議新增：

```text
src/achievements/achievement-celebration-engine.ts
src/rewards/reward-catalog.ts
src/rewards/reward-engine.ts
src/rewards/reward-inventory.ts
src/rewards/reward-repository.ts
src/app/AchievementCelebration.tsx
src/app/RewardDartWheel.tsx
src/app/RewardResultDialog.tsx
```

### 11.1 純 TypeScript 責任

- 建立慶祝佇列。
- 建立轉盤機會。
- 稀有度與品項選擇。
- 保底計數。
- 重複收藏品替代規則。
- 獎勵發放。
- 防重複領取。
- 中斷恢復。
- 決定性測試注入。

不得依賴：

- React。
- DOM。
- CSS 動畫。
- `window`。
- Web Audio。
- 畫面尺寸。

### 11.2 React 責任

- 特效與轉盤呈現。
- 按鈕與焦點管理。
- 音效播放。
- Reduced Motion 替代效果。
- 動畫完成通知。
- 顯示已由引擎決定的結果。

React 不得自行抽取或更改獎勵。

## 12. 隨機與測試要求

production 可使用安全的注入式隨機來源，但核心引擎不得直接散落 `Math.random()`。

建議介面：

```ts
export interface RandomSource {
  next(): number;
}
```

測試可注入固定序列，驗證：

- 權重邊界。
- 稀有度分布選擇。
- 保底生效。
- 中斷恢復。
- 相同已解析轉盤不重抽。

不得用動畫停止角度作為獎勵來源。

## 13. IndexedDB 建議

不修改既有：

```text
Database：cicg-progress
Version：1
Store：campaigns
```

延續成就系統獨立資料庫：

```text
Database：cicg-achievements
Version：1
Stores：
- achievement-progress
- celebration-queue
- reward-spins
- reward-inventory
```

如既有成就實作最終採不同 store 命名，Implementation Plan 必須先依已合併程式調整，但不得把具有真實價值的福利資料存成本機可信來源。

### 13.1 原子化要求

以下資料必須以同一序列化 mutation 保存：

- `RewardSpin.status = resolved`
- `resolvedRewardId`
- 保底計數更新
- 庫存增加或收藏品寫入

避免獎勵已顯示但庫存未寫入，或重新整理後再次領取。

## 14. 音效規格

### 14.1 徽章解鎖

- 短促上升音。
- 徽章亮起時清亮提示音。
- 音量不得突然高於遊戲其他音效。

### 14.2 飛鏢投擲

- 蓄力：極短的拉力音。
- 飛行：`咻`。
- 命中：`碰`或清脆撞擊音。
- 稀有：追加一個亮音。
- 傳說：追加較完整但不超過 2 秒的慶祝音。

### 14.3 使用者設定

- 音效必須可關閉。
- 關閉音效後不得偷偷播放。
- 首次使用 Web Audio 必須由玩家操作啟動。
- 不得自動播放背景音樂。

## 15. 無障礙

- 所有按鈕高度至少 56px。
- 轉盤結果必須以文字與 ARIA live region 宣告，不得只靠顏色或動畫。
- 稀有度必須有文字標籤。
- 鍵盤可完成開始、略過、繼續與返回。
- 焦點不可落在不可見元素。
- 動畫期間仍提供可辨識的取消或略過操作。
- 360px 寬度不得出現水平捲動。

## 16. TDD 測試要求

### 16.1 純 TypeScript

至少驗證：

1. 首次解鎖徽章建立一個慶祝佇列項目。
2. 同一徽章再次達成不重複建立首次獲獎機會。
3. 每枚新徽章建立一次轉盤機會。
4. 單次最多立即呈現三次，超過部分仍保存。
5. 獎勵結果只來自啟用中的合法獎勵池。
6. 權重邊界選擇正確。
7. 第 11 次保底至少為稀有。
8. 稀有或傳說使保底計數歸零。
9. 已解析的轉盤重新載入後結果不變。
10. 同一轉盤不能重複發放庫存。
11. 重複收藏品依固定規則轉換。
12. 略過動畫不影響獎勵。
13. 儲存中斷後可以恢復同一結果。
14. 重設第一章進度不刪除待領取獎勵與保底計數。

### 16.2 React／E2E

至少驗證：

1. 遊戲進行中不顯示慶祝畫面。
2. 關卡結算後才顯示新徽章。
3. 徽章畫面顯示名稱、圖示與稀有度。
4. 玩家可略過動畫。
5. 點擊開始投擲後顯示飛鏢動畫。
6. 動畫停止位置與預先解析結果一致。
7. 重新整理後恢復同一個待領結果。
8. 一般、稀有與傳說結果有文字差異。
9. 關閉音效後不播放聲音。
10. Reduced Motion 不播放大幅飛行與粒子動畫。
11. 返回原流程後關卡與星級狀態不變。
12. 離線狀態仍可完成首版遊戲內獎勵流程。

## 17. 永久 Gate

```text
付費轉盤次數 = 0
看廣告取得轉盤次數 = 0
推薦點擊取得轉盤次數 = 0
本機隨機發放真實折價券 = 0
同一 rewardSpinId 重複發放 = 0
動畫中斷造成獎勵遺失 = 0
遊戲進行中強制彈出慶祝畫面 = 0
```

## 18. 禁止修改範圍

本任務不得修改：

- 第一章 20 關與 61 個唯一成語。
- 智慧自動跳格規則。
- 星級門檻。
- `cicg-progress` schema。
- 自由接龍核心規則。
- 打地鼠狀態機。
- 陷阱模式規則。
- 推薦專區零干擾原則。
- 成語來源 CSV。
- 登入、後端、付款或真實折價券。

## 19. 驗收條件

完成時必須同時符合：

- 首次取得徽章時有完整特效畫面。
- 獲獎流程只在安全節點出現。
- 玩家可略過動畫但不能遺失獎勵。
- 飛鏢結果由純 TypeScript 引擎決定並先保存。
- 重新整理不能重抽或重複領取。
- 可取得一般、稀有與傳說遊戲內道具。
- 第 11 次有稀有保底。
- 不提供付費抽取或廣告換抽取。
- 不以本機資料發放真實折價券。
- 不影響關卡、星級、進度、自由接龍、打地鼠或陷阱模式。
- 新增測試與完整既有回歸全部通過。
- TypeScript strict、ESLint、PWA production build 通過。
- npm audit 無新增漏洞。
- 分支相對最新 `main` 的 `behind_by = 0`。

## 20. PR 紀錄要求

實作 PR 必須記錄：

- 新增的徽章慶祝流程。
- 飛鏢結果保存與防重抽策略。
- 獎勵池與公開機率。
- 保底測試證據。
- 中斷恢復與防重複領取測試。
- 音效與 Reduced Motion 驗證。
- 未導入付費抽取、廣告抽取、後端或真實折價券。
- 完整測試數量。
- TypeScript、ESLint、Build、PWA、npm audit 結果。
- 新增特效與音效素材的 Drive 位置。

CI 全綠並完成 ChatGPT Audit 後，才可 Squash Merge。
