# 成語圖卡收藏、十關贈卡與未來購買設計規格

日期：2026-08-06  
Repository：`gshan1209-cell/Chinese-Idiom-Chain-Game`  
狀態：Approved  
建議實作分支：`feat/idiom-card-collection`  
任務類型：設計規格；本文件不包含 production code

## 1. 目標

為「中文成語填填字（CICG）」新增可長期擴充的成語圖卡收藏系統：

1. 玩家每完成 10 個不同的主線關卡，免費隨機獲得 1 張成語圖卡。
2. 提供獨立的「圖卡收藏」頁面，查看已取得、未取得、稀有度與收集進度。
3. 圖卡同時承載成語學習內容，包括白話解釋、典故、典故來源與卡牌箴言。
4. 首版維持離線優先，不新增登入、後端、付款或真實金流。
5. 架構預留未來直接購買指定圖卡或固定內容卡包。

核心原則：

> 免費里程碑可以隨機贈卡；未來付費取得預設採指定商品或固定內容卡包，不導入付費隨機抽卡。

圖卡收藏是附加蒐集與學習功能，不得取代縱橫成語填字主玩法，也不得成為通關必要條件。

---

## 2. 與既有系統的關係

本功能與下列系統互相獨立：

- 主線關卡與逐關解鎖
- 1～3 星評價
- 最佳分數、錯誤與提示紀錄
- 成就徽章
- 成就解鎖特效與飛鏢轉盤
- 自由接龍
- 成語打地鼠
- 推薦專區

永久限制：

- 圖卡取得不得修改關卡星級。
- 圖卡取得不得解鎖主線關卡。
- 未持有圖卡不得阻止玩家查看已完成關卡的成語解釋。
- 圖卡不得成為使用提示、繼續遊戲或離線遊玩的必要條件。
- 看廣告、點擊推薦內容不得取得圖卡、購買資格或額外抽取機會。

---

## 3. 名詞與兩套分級

### 3.1 圖卡稀有度

稀有度描述卡牌收藏價值與視覺規格，建議型別：

```ts
export type CardRarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR';
```

首批素材已採用 `SSR` 標示；實際啟用哪些稀有度由核准卡池決定。

### 3.2 成語難易度

難易度描述成語普及度與理解難度，與卡牌稀有度完全分離：

```ts
export type IdiomDifficultyGrade = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
```

建議定義：

| 等級 | 說明 |
|---|---|
| E | 非常普及，兒童也容易理解 |
| D | 常見基礎成語 |
| C | 一般生活與課文常見 |
| B | 需要一定閱讀經驗 |
| A | 較進階或典故性較強 |
| S | 罕見、艱深或高度典故化 |

永久 Gate：

```text
rarity !== difficulty
SSR 不代表 A
SSR 不代表 S
難易度不得依畫面華麗程度決定
```

---

## 4. 每十關免費贈卡規則

### 4.1 計算基準

里程碑只計算首次完成的不同主線關卡：

```text
completedUniqueMainLevels = 已完成的不同主線關卡數
milestone = floor(completedUniqueMainLevels / 10) × 10
```

目前第一章共 20 關，因此首版可觸發：

- 完成第 10 個不同關卡：1 次免費贈卡
- 完成第 20 個不同關卡：再 1 次免費贈卡

未來增加章節後，繼續以全主線累計的不同已完成關卡數計算，例如 30、40、50 關。

### 4.2 不列入計算

以下行為不得增加里程碑進度：

- 重玩已完成關卡
- 提升既有關卡星級
- 自由接龍
- 打地鼠
- 成就轉盤
- 查看圖卡
- 購買圖卡
- 開啟推薦專區
- 測試或管理員預覽模式

### 4.3 發放時機

免費圖卡只能在安全節點顯示：

```text
主線關卡完成
→ 保存關卡進度
→ 顯示星級結算
→ 判定新十關里程碑
→ 建立待揭示圖卡獎勵
→ 顯示圖卡揭示畫面
→ 保存收藏結果
→ 返回地圖或下一關
```

禁止在下列時機突然彈出：

- 填字盤面輸入中
- 智慧自動跳格執行中
- 提示、移除或重排中
- 自由接龍輸入中
- 打地鼠倒數或計時中
- 成就慶祝或飛鏢動畫中
- PWA 更新、離線或錯誤對話框上方

### 4.4 防重複發放

每個里程碑只可核發一次。

必須保存：

```ts
export interface CardMilestoneGrant {
  readonly milestoneLevelCount: number;
  readonly rewardId: string;
  readonly status: 'pending' | 'resolved' | 'revealed';
  readonly grantedAt: string;
  readonly resolvedCardId: string | null;
}
```

要求：

- 第 10 關的獎勵不得因重新整理再次核發。
- 已保存獎勵但動畫尚未播放時，不得重新抽取。
- 結果必須先保存，再播放翻卡動畫。
- 同一 `rewardId` 只能解析出一張圖卡。
- 多分頁或重複事件不得產生兩筆同里程碑獎勵。

---

## 5. 舊進度補發

當既有玩家首次升級至收藏功能時，可能已完成 10 或 20 關。

系統應計算：

```text
應有里程碑 − 已發放里程碑 = 待補發里程碑
```

補發規則：

- 每個未發放的十關里程碑各建立 1 筆待揭示獎勵。
- 不得因升級而遺失應得圖卡。
- 單次畫面最多立即揭示 3 張。
- 其餘保留於收藏頁的「待揭示圖卡」。
- 跳過動畫不等於放棄圖卡。

---

## 6. 免費隨機贈卡引擎

### 6.1 合法卡池

里程碑贈卡只能從符合下列條件的卡片抽取：

- `enabled === true`
- `acquisitionMethods` 包含 `milestone-reward`
- 圖卡素材已核准
- 成語資料存在於啟用來源
- 白話解釋與典故來源已通過內容校訂
- 發布時間已到
- 非購買專屬卡
- 非活動過期卡

### 6.2 未持有優先

推薦首版規則：

1. 先建立合法卡池。
2. 從合法卡池中找出尚未持有的圖卡。
3. 尚有未持有卡時，只從未持有池抽取。
4. 所有合法卡均已持有時，才允許抽到重複卡。

此規則可降低前期重複卡挫折感。

### 6.3 權重

免費里程碑卡池可依稀有度配置權重，但不得由 React 或 UI 決定。

建議將權重置於可審核設定：

```ts
export interface MilestoneCardPoolEntry {
  readonly cardId: string;
  readonly weight: number;
}
```

永久要求：

- `weight` 必須是大於 0 的有限整數。
- 禁止負數、`NaN` 或無限值。
- 同一張卡不得在同一卡池重複定義。
- 卡池為空時不得偽造圖卡。
- 卡池為空時將獎勵保留為 pending，等待未來新增合法素材。

### 6.4 決定性與測試

核心引擎不得直接散落使用 `Math.random()`。

建議介面：

```ts
export interface RandomSource {
  next(): number;
}

export function resolveMilestoneCardReward(
  definitions: readonly IdiomCardDefinition[],
  inventory: ReadonlyMap<string, PlayerCardInventoryItem>,
  rewardId: string,
  random: RandomSource,
): CardRewardResolution;
```

相同卡池、持有狀態與測試 RNG，必須得到相同結果。

---

## 7. 圖卡定義模型

```ts
export type CardAcquisitionMethod =
  | 'milestone-reward'
  | 'achievement-reward'
  | 'direct-purchase'
  | 'fixed-bundle'
  | 'event-reward'
  | 'manual-grant';

export interface IdiomCardDefinition {
  readonly id: string;
  readonly idiomId: string;
  readonly title: string;
  readonly subtitle: string;
  readonly rarity: CardRarity;
  readonly difficulty: IdiomDifficultyGrade;
  readonly imageAsset: string;
  readonly thumbnailAsset: string;
  readonly storySummary: string;
  readonly storySource: string;
  readonly motto: string;
  readonly enabled: boolean;
  readonly releaseOrder: number;
  readonly startsAt: string | null;
  readonly endsAt: string | null;
  readonly acquisitionMethods: readonly CardAcquisitionMethod[];
  readonly purchasable: boolean;
  readonly futureProductCode: string | null;
}
```

驗證規則：

- `id` 必須唯一。
- `idiomId` 必須指向啟用中的成語資料。
- `title` 必須是四字成語。
- `storySource` 不得為空。
- 原創卡牌箴言不得偽裝成古籍原文。
- 圖片路徑必須是本機核准資產。
- `purchasable === false` 時，`futureProductCode` 必須為 `null`。
- `direct-purchase` 或 `fixed-bundle` 首版不得啟用。

---

## 8. 玩家收藏模型

```ts
export interface PlayerCardInventoryItem {
  readonly cardId: string;
  readonly ownedCount: number;
  readonly firstOwnedAt: string;
  readonly lastOwnedAt: string;
  readonly acquisitionHistory: readonly CardAcquisitionRecord[];
}

export interface CardAcquisitionRecord {
  readonly acquisitionId: string;
  readonly method: CardAcquisitionMethod;
  readonly acquiredAt: string;
  readonly sourceReference: string;
}
```

要求：

- 首次取得時 `ownedCount = 1`。
- 重複取得時只增加數量，不建立重複卡片定義。
- `acquisitionId` 必須唯一，避免重放事件重複加卡。
- 收藏紀錄不得反向改寫關卡進度。

---

## 9. 圖卡揭示畫面

### 9.1 畫面流程

```text
暗色背景與光點聚集
→ 顯示卡背
→ 玩家點擊「揭示圖卡」
→ 卡片翻面
→ 顯示完整圖卡
→ 顯示稀有度與成語難易度
→ 顯示「已加入收藏」
→ 前往收藏 / 繼續遊戲
```

### 9.2 顯示資訊

揭示畫面至少包含：

- 完整圖卡圖像
- 四字成語
- 稀有度，例如 SSR
- 難易度，例如 A
- 新卡或重複卡標記
- 持有數量
- 「前往收藏」按鈕
- 「繼續遊戲」按鈕

### 9.3 動畫與無障礙

- 動畫可以略過。
- 略過動畫不得略過獎勵保存。
- `prefers-reduced-motion: reduce` 時改用淡入，禁止 3D 翻轉與快速閃光。
- 不使用高頻閃爍。
- 音效可關閉。
- 360px 寬度不得水平捲動。

---

## 10. 圖卡收藏頁

### 10.1 頁面名稱

導航名稱：

```text
圖卡收藏
```

頁面副標可使用：

```text
成語圖鑑
```

### 10.2 入口位置

可放在：

- 首頁次要功能區
- 關卡地圖
- 成就殿堂旁

遊戲進行中不得強制開啟收藏頁。

### 10.3 收藏頁摘要

必須顯示：

- 已取得不同圖卡數
- 已發布圖卡總數
- 收集完成百分比
- 重複卡總數
- 待揭示圖卡數

### 10.4 篩選與排序

至少支援：

- 全部／已取得／未取得
- 稀有度 N、R、SR、SSR、UR
- 難易度 E、D、C、B、A、S
- 成語名稱搜尋
- 取得時間排序
- 稀有度排序
- 難易度排序
- 發布順序排序

預設排序必須穩定且可預測。

### 10.5 已取得卡

顯示：

- 縮圖
- 成語名稱
- 稀有度
- 難易度
- 持有數量
- 首次取得日期

### 10.6 未取得卡

首版推薦：

- 顯示統一卡背或灰階輪廓。
- 不顯示完整插圖。
- 預設顯示 `???`，保留揭示驚喜。
- 可顯示稀有度輪廓，但不得洩漏購買專屬卡的未公開內容。

### 10.7 空狀態

尚未持有任何圖卡時顯示：

```text
完成 10 個不同的主線關卡，就能獲得第一張成語圖卡。
```

不得顯示付費催促或廣告導流。

---

## 11. 圖卡詳情頁

已取得圖卡可查看：

- 卡面大圖
- 四字成語
- 白話解釋
- 稀有度
- 難易度
- 典故故事
- 典故來源
- 卡牌箴言
- 首次取得日期
- 持有數量
- 取得方式

典故來源在卡面圖像上使用小字單行：

```text
典故來源：朝代・作者《典籍名稱・卷次》
```

系統詳情頁可另外以可讀文字顯示完整來源，不受卡面小字限制。

未取得圖卡不得查看完整卡面與完整典故內容，除非該成語內容已在主線完成頁依法公開；主線教育內容不得被收藏機制鎖住。

---

## 12. 圖卡視覺素材規格

核准標準模板：

```text
CICG_CardTemplate_IdiomCard_v1.0_Approved.png
```

固定規格：

- 直式 2:3。
- 高質感韓日動漫遊戲卡牌風格。
- 圖像情境必須有人物。
- 人物動作、道具與場景應直接表達成語情境。
- 左上為稀有度，例如 SSR。
- 右上為成語難易度，例如 A。
- 主標為四字成語。
- 副標為簡短白話解釋。
- 下方保留典故故事。
- 右下保留卡牌箴言。
- 典故來源以小字單行置於最下方。

素材命名：

```text
CICG_IdiomCard_<成語>_<稀有度>_<難易度>_v1.0_Review.png
CICG_IdiomCard_<成語>_<稀有度>_<難易度>_v1.0_Approved.png
```

Drive 流程：

```text
80_Inbox
→ 校訂與審核
→ 02_UI_UX_And_Visuals
→ 舊版移入 90_Archive
```

只有 `Approved` 素材可以進入正式卡池。

---

## 13. 儲存設計

不得修改既有 `cicg-progress` version 1 schema。

建議獨立資料庫：

```text
Database：cicg-card-collection
Version：1
Store：inventory
Store：milestones
Store：pending-rewards
Store：preferences
```

建議 key：

```text
inventory：player-card-inventory
milestones：main-campaign-card-milestones
pending-rewards：pending-card-rewards
preferences：card-collection-preferences
```

要求：

- 使用序列化寫入佇列，避免舊交易晚完成覆蓋新收藏。
- 儲存失敗時不得造成關卡完成失敗。
- 儲存失敗時顯示清楚警告並保留本次記憶體狀態。
- 首版收藏只存在目前瀏覽器與裝置。
- 不聲稱可跨裝置同步。

---

## 14. 未來購買設計

### 14.1 首版範圍

首版不得實作：

- 真實金流
- App Store／Google Play 內購
- 信用卡或第三方支付
- 後端商品服務
- 付費抽卡
- 購買抽取次數
- 看廣告換卡包
- 限時倒數促購

### 14.2 推薦的未來購買方式

未來付費功能預設只支援：

1. **指定圖卡直接購買**：購買前清楚看到成語、卡面與價格。
2. **固定內容卡包**：購買前列出包內全部圖卡，不使用隨機結果。

禁止預設採用：

- 付費隨機抽卡
- 未公開機率的卡包
- 以真實金錢購買隨機機會
- 誤導性稀有度或假限量

### 14.3 未來後端要求

真實購買必須另開規格，並具備：

- 使用者帳號或可靠的購買識別
- 伺服器端收據驗證
- 冪等交易 ID
- 防重複發放
- 退款與撤銷處理
- 購買紀錄
- 跨裝置恢復購買
- 家長控制與年齡適用性評估
- 平台商店政策與消費者保護檢查

不得直接信任可被修改的 IndexedDB 來證明付款或永久購買權益。

---

## 15. 與成就及飛鏢轉盤整合

首版保持分離：

### 成就徽章

- 條件式永久榮譽。
- 解鎖後有慶祝特效。
- 可進入飛鏢轉盤取得遊戲內道具。

### 成語圖卡

- 每完成 10 個不同主線關卡免費贈送。
- 主要用途為收藏與學習。
- 未來可直接購買指定卡或固定卡包。

未來可另開規格支援：

- 特定成就贈送指定圖卡。
- 完成某系列圖卡收藏後解鎖徽章。
- 飛鏢轉盤取得圖卡外框，而非直接取得未公開圖卡。

不得在本任務中混用成就資料庫與收藏資料庫。

---

## 16. 建議程式架構

```text
src/domain/card.ts
src/cards/card-catalog.ts
src/cards/card-validation.ts
src/cards/card-reward-engine.ts
src/cards/card-inventory-engine.ts
src/cards/card-milestone-engine.ts
src/cards/card-collection-repository.ts
src/app/CardRewardReveal.tsx
src/app/CardCollectionPage.tsx
src/app/CardDetailPage.tsx
```

### 16.1 純 TypeScript 責任

`src/cards` 負責：

- 圖卡定義驗證
- 里程碑判定
- 防重複核發
- 合法卡池建立
- 未持有優先
- 權重抽取
- 收藏合併
- 待揭示佇列
- 搜尋、篩選與穩定排序

不得依賴：

- React
- DOM
- CSS
- IndexedDB API 實作細節
- 畫面尺寸
- Web Audio
- `Math.random()` 的隱式全域呼叫

### 16.2 React 責任

React 只負責：

- 圖卡揭示畫面
- 收藏網格與篩選 UI
- 詳情頁呈現
- 玩家操作
- 無障礙標籤
- reduced-motion 效果
- 圖片載入錯誤 fallback

React 不得自行決定里程碑、卡池、抽取結果或收藏合併。

---

## 17. 離線與效能

- 已打包圖卡可離線查看。
- 首頁不得一次預載所有完整卡面。
- 收藏頁優先載入縮圖。
- 詳情頁才載入完整圖像。
- 圖片建議使用 WebP 或 AVIF，保留 PNG 核准母檔。
- 圖片失敗時顯示本機卡背 placeholder。
- 不得因新增大量圖卡造成主遊戲初始載入明顯變慢。
- Service Worker 更新不得清除玩家收藏紀錄。

---

## 18. 無障礙與手機規格

- 主要按鈕高度至少 56px。
- 卡片縮圖必須有成語或狀態替代文字。
- 稀有度與難易度不得只靠顏色區分。
- 360px 寬度不得水平捲動。
- 收藏網格在小螢幕至少維持清楚可點擊。
- 支援鍵盤操作與焦點順序。
- 支援 `prefers-reduced-motion`。
- 不自動播放長音效或影片。

---

## 19. TDD 測試要求

所有實作必須先寫失敗測試。

### 19.1 里程碑測試

1. 完成 9 個不同關卡不產生獎勵。
2. 完成第 10 個不同關卡產生 1 筆獎勵。
3. 重玩第 10 關不再次產生獎勵。
4. 完成第 20 個不同關卡產生第 2 筆獎勵。
5. 同一里程碑在多次事件中只核發一次。
6. 舊進度已完成 20 關時建立 10、20 兩筆補發。
7. 已發放第 10 關時只補發第 20 關。

### 19.2 卡池與抽取測試

1. 只使用 `enabled` 且允許 `milestone-reward` 的圖卡。
2. 未持有卡存在時不抽重複卡。
3. 全部持有後允許抽重複卡。
4. 相同測試 RNG 產生相同結果。
5. 無效權重被拒絕。
6. 空卡池保留 pending，不偽造結果。
7. 已解析 `rewardId` 不得重新抽取。

### 19.3 收藏測試

1. 首次取得建立 inventory。
2. 重複取得增加 `ownedCount`。
3. 相同 `acquisitionId` 不得重複增加。
4. 篩選與排序穩定。
5. 已取得與未取得數量正確。
6. 稀有度與難易度分別篩選。
7. 不修改 campaign progress。

### 19.4 React／E2E 測試

1. 第 10 個不同關卡完成後，先顯示星級結算再顯示圖卡獎勵。
2. 非里程碑關卡不顯示獎勵。
3. 圖卡結果在動畫前已保存。
4. 重新整理後顯示相同圖卡，不重新抽取。
5. 收藏頁顯示正確進度。
6. 未取得卡顯示卡背或 `???`。
7. 已取得卡可打開詳情。
8. 離線可查看已收藏卡。
9. 360px 無水平捲動。
10. 過程不出現廣告或付款入口。

---

## 20. 永久 Gate

```text
每 10 個不同主線關卡最多核發 1 次免費圖卡
重玩關卡新增里程碑獎勵數 = 0
付費隨機抽卡入口數 = 0
看廣告換圖卡入口數 = 0
圖卡影響星級數 = 0
圖卡影響關卡解鎖數 = 0
rarity 與 difficulty 混用數 = 0
未核准素材進入正式卡池數 = 0
```

---

## 21. 允許修改範圍

未來實作 PR 建議允許：

```text
src/domain/card.ts
src/cards/**
src/app/CardRewardReveal.tsx
src/app/CardCollectionPage.tsx
src/app/CardDetailPage.tsx
src/app 導航整合檔案
public/assets/cards/**
public/generated/idiom-cards.json
tests/card-*.test.mjs
e2e 圖卡收藏測試
README.md
docs/superpowers/plans/**
```

---

## 22. 禁止修改範圍

本功能不得順便修改：

- 第一章 20 關配置
- 61 個成語唯一性規則
- 智慧自動跳格
- 星級門檻
- `cicg-progress` schema
- 自由接龍規則
- 打地鼠狀態機
- 陷阱模式規則
- 廣告專區規則
- 成就徽章條件
- 飛鏢轉盤機率
- 真實付款或後端

---

## 23. 驗收條件

功能完成時必須同時符合：

- 每完成 10 個不同主線關卡免費獲得 1 張圖卡。
- 同一里程碑不會重複發放。
- 重玩關卡不增加免費圖卡。
- 圖卡結果先保存再播放動畫。
- 有完整的圖卡收藏頁與圖卡詳情頁。
- 已取得與未取得圖卡有清楚區別。
- 稀有度與難易度分開顯示。
- 優先發放未持有圖卡。
- 可離線保存與查看。
- 不引入廣告換圖卡。
- 不引入付費隨機抽卡。
- 不修改主線進度 schema、星級與關卡規則。
- 新增測試與既有完整回歸全部通過。
- TypeScript strict、ESLint、PWA production build 通過。
- npm audit 無新增漏洞。
- 分支相對最新 `main` 的 `behind_by = 0`。

---

## 24. PR 紀錄要求

實作 PR 必須記錄：

- 里程碑計算與防重複發放方式。
- 舊進度補發方式。
- 正式圖卡數量與卡池清單。
- 稀有度與難易度定義。
- Drive 核准素材位置。
- IndexedDB 名稱、版本、stores 與 keys。
- TDD RED 證據。
- 完整測試數量。
- TypeScript、ESLint、Build、PWA、npm audit 結果。
- 未導入付款、付費隨機抽卡、廣告換卡與後端。

CI 全綠並完成 ChatGPT Audit 後，才可 Squash Merge。
