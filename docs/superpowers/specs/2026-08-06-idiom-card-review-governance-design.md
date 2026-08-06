# 成語圖卡審核治理規格 v1.0

日期：2026-08-06  
Repository：`gshan1209-cell/Chinese-Idiom-Chain-Game`  
狀態：Approved  
規範類型：圖卡內容、視覺、授權與發布 Gate；本文件不包含 production code

## 1. 目的

建立可追溯、可重複執行的圖卡審核流程，確保未校訂、未授權、未核准或格式錯誤的圖卡，不會進入：

- 每十關免費贈卡池
- 正式圖卡收藏頁
- 未來圖卡商店
- GitHub 正式卡表
- Google Drive Approved 素材區

核心原則：

> 自動預檢可以降低錯誤，內容與視覺審核可以確保品質；任何卡片只有在全部 Blocking Gate 通過並留下核准紀錄後，才可標記 Approved。

---

## 2. 必讀規格與優先序

審核前必須依序閱讀：

1. `docs/superpowers/specs/2026-08-06-idiom-card-rarity-standard-design.md`
2. 本文件
3. `docs/superpowers/specs/2026-08-06-idiom-card-collection-design.md`
4. 個別圖卡企劃、Prompt 與素材說明

若發生衝突，以前項文件優先。

---

## 3. 圖卡生命週期

```ts
export type CardReviewStatus =
  | 'draft'
  | 'submitted'
  | 'auto-check-failed'
  | 'content-review'
  | 'visual-review'
  | 'rights-review'
  | 'changes-requested'
  | 'approved'
  | 'rejected'
  | 'deprecated'
  | 'archived';
```

標準流程：

```text
Draft
→ Submitted
→ Automated Preflight
→ Content Review
→ Visual Review
→ Rights Review（需要時）
→ Final Approval
→ Approved
```

退回流程：

```text
任一 Gate 失敗
→ Changes Requested 或 Rejected
→ 建立新版本
→ 重新 Submitted
```

版本汰換：

```text
新版本 Approved
→ 舊 Active 版本 Deprecated
→ 舊素材移入 90_Archive
```

---

## 4. GitHub 與 Drive 分工

### 4.1 GitHub 保存

- 圖卡定義與唯一 ID
- 稀有度、難易度與判定理由
- 成語解釋、典故、來源與箴言
- 圖片檔名、Drive File ID 與 SHA-256
- 審核狀態、Finding、核准人與時間
- 卡池與取得方式
- UR 授權證據參照

建議位置：

```text
data/cards/
docs/card-reviews/
docs/superpowers/specs/
```

### 4.2 Google Drive 保存

```text
80_Inbox/Idiom_Cards
02_UI_UX_And_Visuals/Idiom_Cards/Approved
80_Inbox/Idiom_Cards/Changes_Requested
90_Archive/Idiom_Cards
```

規則：

- 新產圖先進 `80_Inbox/Idiom_Cards`。
- 只有 Approved 版本可移入正式 Approved 目錄。
- 退回修改不可覆蓋原檔，必須升版。
- 舊版與淘汰版移入 `90_Archive/Idiom_Cards`。

---

## 5. 檔案命名與版本

送審：

```text
CICG_IdiomCard_<成語>_<稀有度>_<難易度>_v<版本>_Review.png
```

核准：

```text
CICG_IdiomCard_<成語>_<稀有度>_<難易度>_v<版本>_Approved.png
```

例：

```text
CICG_IdiomCard_愚公移山_SSR_B_v1.0_Review.png
CICG_IdiomCard_愚公移山_SSR_B_v1.0_Approved.png
```

永久規則：

- 同一 `cardId` 同時只能有一個 Active Approved 版本。
- 已發布檔案不得原地覆蓋。
- 修改內容、稀有度、難易度、插圖或來源時必須增加版本。

---

## 6. 第一層：自動預檢

自動預檢失敗時，不得進入後續審核。

### 6.1 檔案檢查

- 格式為核准的 PNG 或 WebP
- 直式比例固定 `2:3`
- 建議至少 `1024 × 1536`
- 檔案可正常解碼
- 檔名符合規範
- 可產生 SHA-256
- 圖片沒有透明破損或異常裁切

### 6.2 必填資料

- 唯一 `cardId`
- `idiomId`
- 四字成語標題
- 白話解釋
- 稀有度
- 難易度
- 稀有度判定理由
- 典故摘要
- 典故來源
- 卡牌箴言
- Drive File ID
- 版本
- 審核狀態

### 6.3 卡面必要元素

- 四字成語主標
- 白話副標
- 左上稀有度
- 右上難易度
- 至少一位參與情境的人物
- 典故介紹
- 右下卡牌箴言
- 最下方小字單行典故來源

---

## 7. 第二層：內容審核

### 7.1 成語與解釋

- 必須是四字成語
- 必須使用繁體中文
- 不得有錯別字、簡體字或 AI 假文字
- 解釋符合主流、可信辭典用法
- 必須與啟用中的成語資料一致
- 不得加入會改變原意的過度延伸

### 7.2 典故與來源

必須確認：

- 來源典籍或可信辭典存在
- 朝代、作者、書名與卷次正確
- 傳說、寓言與史實清楚區分
- 白話改寫不得增加無根據細節
- 原典引文與白話整理必須分開
- 原創箴言不得冒充古籍原文

卡面來源格式：

```text
典故來源：朝代・作者《典籍名稱・卷次》
```

尚未完成來源校訂的圖卡不得 Approved。

### 7.3 難易度

難易度依普及度與理解門檻判定：

```text
E → D → C → B → A → S
```

不得依稀有度、畫面華麗度或角色強弱判定。

### 7.4 稀有度

必須依 `2026-08-06-idiom-card-rarity-standard-design.md` 審核。

- N～SSR 依正面意義、勵志程度、精神象徵、共鳴力與代表性判定。
- SSR 不得只因畫面豪華成立。
- UR 僅限正式授權 IP 聯名。
- UR 必須有 `licenseEvidenceId`。

---

## 8. 第三層：視覺審核

### 8.1 人物與情境

- 至少一位主要人物
- 人物必須實際參與成語情境
- 不得只是與成語無關的站立肖像
- 動作、表情、道具與場景需協助理解成語
- 手部、臉部、肢體與透視不得明顯變形

### 8.2 模板一致性

- 直式 `2:3`
- 左上顯示稀有度，例如 `SSR`
- 右上顯示難易度，例如 `A`
- 主標、副標、典故與箴言位置一致
- 典故來源只出現在最下方小字單行
- 邊框與資訊架構符合 Approved 標準模板

標準模板素材：

```text
CICG_CardTemplate_IdiomCard_v1.0_Approved.png
```

### 8.3 手機可讀性

- 縮圖仍可辨識四字成語
- 標題不得被人物或裝飾遮擋
- 文字與背景對比足夠
- 典故來源可小，但放大後必須可讀
- 文字不得溢出框線

### 8.4 原創與版權

禁止：

- 複製既有遊戲卡面
- 未授權使用角色、Logo 或品牌元素
- 使用可辨識真人肖像作為角色
- 高度模仿特定作品而造成混淆
- 使用來源不明或權利不清的素材

---

## 9. 第四層：權利與聯名審核

一般原創卡可標記 `rightsReviewRequired = false`，但仍須確認素材來源清楚。

UR 或任何外部 IP 聯名卡必須進入權利審核，並確認：

- 正式授權文件存在
- 授權對象與角色範圍吻合
- 可使用的名稱、Logo 與美術元素明確
- 地區、期間、通路與商業使用範圍有效
- 圖卡發布日落在授權期間內
- 授權證據可由 `licenseEvidenceId` 追溯

權利審核失敗時，不得用「僅供測試」規避正式素材 Gate；只能保留不含 IP 元素的內部概念文字，不得將未授權圖像納入專案正式素材。

---

## 10. 第五層：發布審核

只有同時符合下列條件的卡片可以發布：

```ts
card.enabled === true &&
card.reviewStatus === 'approved' &&
card.contentReviewPassed === true &&
card.visualReviewPassed === true &&
card.rightsReviewPassed === true &&
card.imageSha256 !== ''
```

### 10.1 免費里程碑卡池

另須符合：

```ts
card.acquisitionMethods.includes('milestone-reward') &&
card.rarity !== 'UR'
```

### 10.2 未來商店卡池

另須符合：

```ts
card.commercialUseApproved === true &&
card.purchasable === true &&
card.futureProductCode !== null
```

首版仍不得實作付款或真實商店。

---

## 11. 審核角色與責任

### 11.1 產製 Agent

- 建立企劃、Prompt、圖片與資料
- 上傳 `80_Inbox`
- 提交 Review 版本
- 不得自行把自己產製的圖卡直接標記為最終 Approved

### 11.2 自動驗證 Agent

- 檢查比例、尺寸、格式、檔名與欄位
- 檢查重複 ID、合法列舉與 SHA-256
- 產出可重現的預檢結果

### 11.3 內容審核者

- 審核成語解釋、難易度、典故與來源
- 審核稀有度判定理由
- 區分史實、傳說、白話改寫與原創箴言

### 11.4 視覺審核者

- 審核人物、情境、人體品質、模板一致性與可讀性
- 審核第三方標誌與近似作品風險

### 11.5 最終核准者

- 確認全部 Blocking Gate 已通過
- 留下核准身分、日期與版本
- 更新正式卡表
- 將素材移入 Approved 目錄

UR 額外需要可稽核的正式授權證據，任何 Agent 不得以自行判斷取代授權文件。

---

## 12. 審核結果與 Finding

```ts
export type CardReviewDecision =
  | 'approve'
  | 'request-changes'
  | 'reject';

export interface CardReviewFinding {
  readonly code: string;
  readonly severity: 'info' | 'warning' | 'blocking';
  readonly message: string;
  readonly evidenceReference: string | null;
}
```

### Approve

全部必要 Gate 通過。

### Request Changes

問題可修正，例如字體太小、典故文字需校正、難易度或稀有度需調整、人物變形或版面未符合模板。

### Reject

不適合繼續使用，例如來源無法確認、明顯侵權、主題與成語無關或檔案來源不明。

---

## 13. 審核紀錄模型

```ts
export interface IdiomCardReviewRecord {
  readonly cardId: string;
  readonly version: string;
  readonly status: CardReviewStatus;
  readonly driveFileId: string;
  readonly imageSha256: string;

  readonly automatedChecksPassed: boolean;
  readonly contentReviewPassed: boolean;
  readonly visualReviewPassed: boolean;
  readonly rightsReviewPassed: boolean;
  readonly productReviewPassed: boolean;

  readonly contentReviewer: string | null;
  readonly visualReviewer: string | null;
  readonly rightsReviewer: string | null;
  readonly finalApprover: string | null;

  readonly findings: readonly CardReviewFinding[];
  readonly submittedAt: string;
  readonly reviewedAt: string | null;
  readonly approvedAt: string | null;
}
```

---

## 14. Blocking Gate

以下任一問題存在時，不得核准：

- 成語錯字、簡體字或不是四字
- 典故來源不存在、未確認或與內容不符
- 原創文案冒充原典
- 稀有度與難易度混用
- SSR 只有視覺理由、沒有語義理由
- UR 缺少正式授權證據
- 卡面沒有人物或人物與成語無關
- 使用未授權角色、Logo 或可識別 IP 元素
- 嚴重人體變形或 AI 假文字
- 比例不是 `2:3`
- 不符合 Approved 模板結構
- `cardId` 或 Active Approved 版本重複
- Drive 檔案、SHA-256 與 GitHub 紀錄不一致

---

## 15. 永久測試要求

後續實作至少應測試：

1. 非 Approved 卡不得進入贈卡池。
2. 未校訂來源卡不得啟用。
3. `rarity` 與 `difficulty` 分欄保存。
4. SSR 缺少語義理由時驗證失敗。
5. UR 缺少 `licenseEvidenceId` 時驗證失敗。
6. 同一 `cardId` 不得重複。
7. 同一卡只能有一個 Active Approved 版本。
8. 圖片比例必須為 `2:3`。
9. 未核准商業用途不得設為可購買。
10. Deprecated 卡不得發給新玩家。
11. 已擁有舊版的玩家仍可安全查看。
12. Drive File ID 或 SHA-256 漂移時發布 Gate 失敗。

---

## 16. Agent 執行要求

Agent 不得只依聊天紀錄、單張圖片或舊 Prompt 判斷圖卡是否可用。

凡涉及圖卡產製、審核、收藏、卡池或商店，必須從以下入口開始：

```text
AGENTS.md
→ docs/superpowers/specs/README.md
→ 圖卡稀有度標準
→ 本審核治理規格
→ 圖卡收藏規格
```

未完成必讀與 Gate 檢查，不得把圖卡標記為 Approved。