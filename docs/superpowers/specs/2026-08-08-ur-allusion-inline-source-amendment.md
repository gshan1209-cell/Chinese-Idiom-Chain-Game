# UR 聯名成語圖卡典故與來源內嵌增補規範 v1.0

狀態：Approved Design Amendment  
日期：2026-08-08  
適用範圍：所有 UR 聯名成語圖卡  
覆寫對象：UR 標準、UR 產圖技能與 UR 母提示語中任何「獨立來源列」或「僅顯示成語名稱／簡短本義」的舊規則

## 1. 核心決議

UR 卡的典故區必須同時包含：

1. `典故` 標題。
2. 可獨立理解的完整典故摘要。
3. 典故正文最後一行的來源。

來源不得再拆成獨立欄位、獨立牌匾或 Footer 底部來源列。

典故區不得只顯示：

- 成語名稱。
- 成語本義。
- 一句空泛描述。
- `成語常用義` 占位文字。
- `待補`、`TBD` 或其他 placeholder。

## 2. 固定幾何

典故內容與來源共用同一個典故區：

```text
allusion panel
x = 286–724
y = 1582–1920
width  = 438 px
height = 338 px
```

取消 UR 卡面上的獨立來源列：

```text
source line x=178–398, y=1936–1986  ← 不再渲染文字
```

卡號牌匾位置維持不變：

```text
card-number plaque
x = 410–614
y = 1936–1986
width  = 204 px
height = 50 px
```

被取消的來源列區域只可保留模板裝飾或透明背景，不得放入來源、角色名、IP 名稱、難度、版本或第二組卡號。

## 3. 典故內容格式

卡面固定順序：

```text
典故
{{ALLUSION_SUMMARY}}
出處：{{SOURCE}}
```

排版要求：

- 典故正文必須是成語原本的歷史背景、語源演變或可校訂的形成脈絡。
- 正文建議 3–5 行；來源固定為正文後最後一行。
- `出處：` 與來源不得另開獨立元件。
- 來源行可使用較小字級，但必須清楚可讀。
- 文字過長時編修為完整摘要，不得刪成只有成語名或一句本義。
- 不得把角色劇情、IP 世界觀或戰鬥情節寫成典故。
- 不得虛構古籍、作者、年代、引文或來源。

若成語沒有可確認的單一歷史故事，必須依已校訂資料描述其語源或用法形成脈絡；來源未完成校訂時維持 Review，並在資料層標記 `sourceStatus = NeedsReview`，不得自行猜測。

## 4. Renderer 與資料規則

Renderer 必須從結構化資料讀取：

```text
allusionSummary
source
sourceStatus
```

並在同一個 `allusion panel` 內依序渲染正文與最後一行來源。

圖片模型不得生成、重寫、修補或猜測典故與來源。

`idiomMeaning` 可保留於資料層，但 UR 卡面不顯示獨立本義段落。

## 5. 驗證 Gate

以下任一情況屬 Blocking failure：

- 典故正文缺失。
- 典故區只顯示成語名稱。
- 典故區只顯示本義或角色描述。
- 來源缺失或被拆成獨立欄位。
- 使用 placeholder、亂碼或模型虛構來源。
- 典故與來源超出典故區或侵入箴言、主題徽章、卡號牌匾。

Finding code：

```text
missing-allusion-content
allusion-placeholder-only
source-not-inline
unverified-allusion-source
```

任一 Gate 失敗時：

```text
compositionStatus = changes-requested 或 blocked
approvalStatus    = 不得為 Approved
```

## 6. 第一批 UR 角色圖卡處置

2026-08-08 首批產出的胡蝶忍、煉獄杏壽郎、富岡義勇、甘露寺蜜璃與時透無一郎 Composite，若典故區只有成語名稱、本義短句或獨立來源列，均視為 `changes-requested` 草稿，不得登記為正式模板、Approved Composite 或正式卡池素材。

重製時必須套用本增補規範。