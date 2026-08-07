# CICG 成語圖卡標準規範 v2.6 設計

日期：2026-08-07  
狀態：User Approved／Written Spec Review  
適用專案：`gshan1209-cell/Chinese-Idiom-Chain-Game`

## 1. 目的

v2.6 將「九大主題徽章」納入正式圖卡元件系統，修正目前第一章卡片主檔以任意細分類作為卡面標籤的錯誤，並固定圖卡採用「中央插畫生成＋核准元件程式化合成」流程。

本規範同時明確處理 v2.5 與目前專案核准決策之間的衝突：

- N／R／SR／SSR 使用各自的核准專屬外框。
- 第一章與每個產製批次的女性主要角色比例均不得低於 50%。
- 拼音可保存於資料層，但不得顯示在卡面。
- 左下角只能顯示九大正式主題之一，不得顯示自由文字細分類。

## 2. 版本與真實狀態

### 2.1 版本關係

```text
v2.5：保留為歷史 Approved 文件，不覆寫、不刪除
v2.6：完成實作、Drive 登錄、CI 與 Audit 後，成為唯一 current standard
```

在 v2.6 尚未完成技術登錄前：

- 九枚徽章視覺稿屬「使用者視覺核准」。
- 不得宣稱已完成 Drive Approved、SHA-256 或 Registry 登錄。
- 既有錯誤圖卡只能維持 Review，不得升格 Approved。

### 2.2 衝突處理

v2.6 完成後，以下規則優先於 v2.5：

1. 固定畫布採 `1024 × 2000 px`，不再以模糊的 2:3 描述作為渲染依據。
2. N／R／SR／SSR 使用不同專屬外框；不採用「全稀有度共用同一外框」規則。
3. 全章及每批女性主要角色均至少 50%；不採用「每批不強制比例」規則。
4. 卡面主題分類只能來自九大主題，不得由 `categoryPrimary` 或模型自由生成。

真實狀態優先順序維持：

```text
GitHub main
→ GitHub Actions
→ Repository 文件與 Registry
→ Drive Approved 素材
→ 聊天紀錄
```

## 3. 圖卡固定結構

### 3.1 畫布與區域

- 畫布：`1024 × 2000 px`
- Header：`360 px`
- 中央插畫：`1200 px`，位於 `y=360–1559`
- Footer：`440 px`
- 版面錨點必須由核准 layout template 定義，單張卡不得自行調整。

### 3.2 固定顯示順序

```text
四字成語
→ 四字完整注音
→ 簡短白話解釋
→ 中央情境插畫
→ 左下主題徽章與完整類別名稱
→ 典故內容
→ 右下卡牌箴言
→ 最下方典故來源
```

漢語拼音只保留於資料層供搜尋、語音與後台使用，不進入卡面渲染。

### 3.3 三套獨立識別系統

- 左上：稀有度徽章／專屬稀有度外框
- 右上：難易度 `E／D／C／B／A／S`
- 左下：九大主題徽章

三套系統不得互相改色、替代或共用語意。

## 4. 九大主題徽章

### 4.1 正式枚舉

| `themeCategory` | 顯示名稱 | 固定中央圖式 | 固定底色 |
|---|---|---|---|
| `military` | 軍事 | 劍與軍旗 | `#8E1E24` |
| `governance` | 內政 | 玉璽與卷軸 | `#176B52` |
| `strategy` | 智謀 | 羽扇與棋盤 | `#5A338A` |
| `arts` | 文藝 | 毛筆與畫卷 | `#167A83` |
| `perseverance` | 勵志 | 山路與旭日 | `#C77B1F` |
| `selfCultivation` | 修身 | 蓮花與竹簡 | `#B95B79` |
| `relationships` | 人際 | 相對作揖的兩人或相握之手 | `#9A5B22` |
| `cautionary` | 警世 | 警鐘與眼睛 | `#3F2B78` |
| `perspective` | 見識 | 眼睛與遠山窗口 | `#1D5F9E` |

### 4.2 共通視覺規則

九枚母件必須：

- 使用相同輪廓、金色圓形邊框、雲紋與系列裝飾。
- 以「中央圖式＋固定底色」雙重辨識，不得只靠顏色。
- 中央圖式採金色、象牙白或高明度材質，縮小後仍可辨識。
- 徽章下方逐字顯示完整繁體中文類別名稱。
- 同一類別永遠使用同一枚 current Approved 母件。
- 不得因稀有度、難易度、角色性別或單卡畫風改變徽章。
- 不得使用固定毛筆、竹簡、鎬子或其他無分類意義圖案替代。

### 4.3 資產技術規格

每枚正式母件：

- Canonical master：`1024 × 1280 px`
- 格式：透明背景 PNG、RGBA
- 徽章主體完整置中，不裁切金色外框、雲紋或下方名稱牌
- 背景區域必須全透明，不保留棕色漸層或卡面背景
- 不得含陰影矩形、浮水印、額外文字或成語內容
- 卡面渲染時按 layout template 的固定左下錨點等比例縮放，不允許拉伸

### 4.4 正式檔名

```text
CICG_Component_ThemeBadge_Military_v1.0_Approved.png
CICG_Component_ThemeBadge_Governance_v1.0_Approved.png
CICG_Component_ThemeBadge_Strategy_v1.0_Approved.png
CICG_Component_ThemeBadge_Arts_v1.0_Approved.png
CICG_Component_ThemeBadge_Perseverance_v1.0_Approved.png
CICG_Component_ThemeBadge_SelfCultivation_v1.0_Approved.png
CICG_Component_ThemeBadge_Relationships_v1.0_Approved.png
CICG_Component_ThemeBadge_Cautionary_v1.0_Approved.png
CICG_Component_ThemeBadge_Perspective_v1.0_Approved.png
```

總覽規範圖：

```text
CICG_ThemeBadgeSystem_v1.0_Approved.png
```

總覽圖只供審核與文件使用；卡面合成必須讀取九枚獨立透明 PNG，不得從總覽圖裁切。

## 5. 資料模型

### 5.1 正式欄位

```text
themeCategory
themeCategoryLabel
themeBadgeAssetId
secondaryThemeTags
```

規則：

- `themeCategory` 只能使用九個英文枚舉值。
- `themeCategoryLabel` 必須由 Registry 解析，不得人工自由填寫。
- `themeBadgeAssetId` 必須指向該類別 current Approved 母件。
- `secondaryThemeTags` 是零至多個搜尋標籤，不得渲染在卡面。

### 5.2 舊欄位遷移

```text
categoryPrimary   → deprecated
categorySecondary → deprecated
```

遷移時不得直接把舊值顯示在卡面。每張卡必須依「標準解釋、典故與主要學習目的」重新判定九大主題。

例如：

- `專注`、`責任`、`誠信`：只能作為 `secondaryThemeTags`。
- `態度`、`品德`、`心理`、`自然`：不是正式卡面類別，必須重新映射。
- `豪情`、`公義`、`新歲`：屬模型臨時創作，禁止進入正式欄位。

### 5.3 Registry 欄位

每枚徽章 Registry 至少保存：

```text
assetId
componentType = theme-badge
systemValue
displayName
iconDefinition
backgroundHex
version
approvalStatus
currentApproved
driveFileId
driveUrl
sha256
pixelWidth
pixelHeight
mimeType
transparentBackground
createdAt
verifiedAt
```

沒有 Drive File ID、SHA-256 或 `currentApproved=true` 的素材，不得被 renderer 使用。

## 6. 分類判定流程

每張卡依序執行：

1. 確認成語標準解釋與典故。
2. 判斷玩家最應理解的核心學習面向。
3. 從九類中選擇唯一 `themeCategory`。
4. 若兩類皆合理，優先選寓意最直接者，而非故事表面場景、角色職業或稀有度。
5. 其他合理面向寫入 `secondaryThemeTags`。
6. 文案審核表確認類別、固定圖式、底色與 Asset ID 後，才能進入產圖。

## 7. 稀有度、難易度與角色規則

### 7.1 稀有度外框

```text
N   → rarity-frame-n
R   → rarity-frame-r
SR  → rarity-frame-sr
SSR → rarity-frame-ssr
```

不同稀有度必須使用各自 current Approved 外框；主題徽章不隨外框改色。

### 7.2 難易度

```text
E 入門
D 基礎
C 普通
B 進階
A 困難
S 極限
```

難易度與稀有度、主題類別互相獨立。

### 7.3 女性角色配額

- 第一章 61 張卡中，女性主要視覺角色至少 31 張。
- 每個產製批次女性主要視覺角色至少 50%，奇數張向上取整。
- 雙人與群像仍必須標記主要視覺領袖。
- 典故有明確史實人物時可尊重史實；寓言與泛用情境不得一律預設為男性。

### 7.4 SSR 史詩感

SSR 固定要求：

```text
visualTone = epic
compositionScale = grand
characterPresence = heroic
vfxIntensity = high
ssrEpicRequirement = required
```

SSR 中央插畫必須具有英雄氣勢、宏大場景、電影式構圖、傳奇光效與決定性瞬間，不能只依賴彩虹外框。

## 8. 正式產製流程

```text
讀取 GitHub main 的 Card Catalog 與 Asset Registry
→ 驗證 themeCategory／rarity／difficulty／gender quota
→ 只生成無文字、無框、無徽章的中央情境插畫
→ 套用該稀有度 current Approved 專屬外框
→ 套用固定難易度元件
→ 依 themeCategory 套用 current Approved 主題徽章
→ 程式化寫入成語、注音、白話解釋、典故、箴言及來源
→ 執行文字與資產驗證
→ 輸出 Review 圖卡
→ 人工審核
→ 登錄 Drive File ID 與 SHA-256
→ Approved／Current Master
```

生成式圖片工具不得一次生成完整卡面，也不得負責成語、注音、難易度、主題類別或典故文字。

## 9. 驗證 Gate

CI 與產圖驗證器必須拒絕：

1. `themeCategory` 不在九大清單中。
2. `themeCategoryLabel` 與正式顯示名稱不一致。
3. `themeBadgeAssetId` 與類別不相符。
4. 徽章沒有 `currentApproved=true`、Drive File ID 或 SHA-256。
5. 卡面顯示 `secondaryThemeTags`。
6. 卡面出現「專注、豪情、公義、新歲、品德、自然」等非正式類別名稱。
7. 同類別使用不同圖式、底色或中文名稱。
8. 主題徽章由圖片模型直接生成，而非套用核准元件。
9. 圖卡缺少主題徽章或完整類別名稱。
10. 背景不是透明、尺寸不符或徽章主體遭裁切。
11. 卡面出現羅馬拼音、錯誤注音或近似符號。
12. 稀有度使用錯誤專屬外框。
13. 全章或單一批次女性主要角色比例不足 50%。
14. SSR 缺少史詩感欄位或史詩提示語。

## 10. Drive 與 GitHub 治理

### 10.1 Drive

九枚母件先放 `80_Inbox`，完成以下檢查後才移至正式 Approved 元件目錄：

- 圖式與色碼正確
- 正確繁體中文
- 透明背景
- 統一尺寸
- 無裁切、無多餘背景
- 使用者核准
- File ID 與 SHA-256 記錄完成

舊版、錯誤徽章及生成背景版移入 `90_Archive`，不得與 current Approved 母件混放。

### 10.2 GitHub

至少更新：

```text
data/drive-assets/idiom-card-assets.json
data/cards/chapter-1-card-catalog.seed.csv
data/cards/chapter-1-card-catalog.schema.json
scripts/build-card-catalog.mjs
scripts/validate-card-catalog.mjs
tests/chapter-one-card-catalog.test.mjs
.agents/skills/generating-cicg-idiom-cards/SKILL.md
AGENTS.md
PROJECT_PROMPT.md
```

Google Sheet `Card_Catalog` 與 `Codebook_Agent` 必須同步，但仍是 GitHub canonical data 的人工管理投影。

## 11. 遷移順序

```text
1. 核准並提交 v2.6 規格
2. 將九枚視覺稿整理成透明統一母件
3. 產生九徽章總覽規範圖
4. 上傳 Drive 80_Inbox 並技術審核
5. 使用者核准後移入 Approved
6. Registry 登錄 File ID／SHA-256
7. 將第一章 61 張重新映射為九大主題
8. 遷移 Card_Catalog 與 Google Sheet
9. 新增永久 CI Gate
10. ChatGPT Audit 與 Squash Merge
11. 依新規範重製第一批 10 張圖卡
```

## 12. 非目標

本階段不修改主玩法、不修改 IndexedDB 進度 schema、不核准未校訂典故、不產製 UR 聯名卡，也不將目前錯誤的第一批圖卡升格為 Approved。

## 13. 驗收標準

v2.6 只有在以下條件全數成立後才能標記 `current standard`：

- 九枚徽章均為透明 `1024 × 1280` PNG。
- 九枚徽章均有固定 Drive File ID 與 SHA-256。
- Asset Registry 九筆均 `approvalStatus=approved` 且 `currentApproved=true`。
- 61 張第一章卡全部使用合法 `themeCategory` 與相符 Asset ID。
- `categoryPrimary／categorySecondary` 不再被 renderer 或卡面讀取。
- 九大類別、女性配額、稀有度外框與 SSR 史詩規則均有自動測試。
- 完整 CI、Drive Asset Validator、TypeScript strict、ESLint、PWA Build 與 npm audit 全部通過。
- ChatGPT Audit 通過並 Squash Merge 至 `main`。
