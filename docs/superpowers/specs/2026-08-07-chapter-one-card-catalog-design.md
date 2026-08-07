# 第一章成語圖卡主檔設計 v1.0

日期：2026-08-07  
Repository：`gshan1209-cell/Chinese-Idiom-Chain-Game`  
狀態：Approved

## 1. 目的

建立第一章 61 張成語圖卡的唯一資料主檔，集中管理成語內容、稀有度、專屬外框、卡片難易度、類別、圖卡文案、完整產圖提示語、主要角色性別、批次、SSR 史詩感要求與產製狀態。

Google Sheet `CICG_素材管理控制中心_v1.0` 提供人工管理入口；GitHub JSON 主檔與驗證腳本是可機器驗證來源。發生衝突時仍依：

```text
GitHub main → GitHub Actions → Repository 文件／資料 → Drive Approved → 聊天紀錄
```

## 2. 資料範圍

- 第一章固定 20 關、61 個不同 `idiomId`、61 個不同成語。
- 每個成語一筆卡片紀錄，不以整批素材取代逐卡資料。
- 卡片難易度與關卡難易度分開管理。
- 稀有度與難易度互相獨立。
- UR 僅保留給具有正式授權證據的 IP 聯名，不進第一章一般卡池。

## 3. 欄位模型

每張卡固定包含：

### 3.1 身分與關卡

- `cardId`
- `idiomId`
- `idiomText`
- `chapterId`
- `levelNumber`
- `placementOrder`
- `batchId`
- `cardVersion`

### 3.2 分級與元件

- `rarity`: `N | R | SR | SSR`
- `frameAssetId`: 必須與稀有度一一對應
- `cardDifficultyCode`: `E | D | C | B | A | S`
- `cardDifficultyLabel`: `入門 | 基礎 | 普通 | 進階 | 困難 | 極限`
- `levelDifficulty`: `easy | normal | hard`
- `categoryPrimary`
- `categorySecondary`
- `tags`
- `themeBadgeAssetId`

稀有度外框固定對應：

```text
N   → rarity-frame-n
R   → rarity-frame-r
SR  → rarity-frame-sr
SSR → rarity-frame-ssr
```

### 3.3 圖卡文案

- `bopomofo`
- `pinyin`
- `subtitle`
- `meaning`
- `allusionSummary`
- `exampleSentence`
- `mottoLines`
- `allusionSource`
- `copyReviewStatus`
- `licenseStatus`

### 3.4 完整產圖提示語

- `promptVersion`
- `promptStyleProfile`
- `promptCharacterBrief`
- `promptSceneBrief`
- `promptLayoutConstraints`
- `promptNegativeConstraints`
- `promptTemplateRef`
- `promptMaster`

`promptMaster` 必須是可直接送入產圖工具的完整提示語，不得只保存關鍵字或片段。主插圖不得烙入正式卡框、徽章、標籤、主標、注音、拼音、典故、箴言、來源或浮水印。

### 3.5 主要角色與性別配額

- `mainCharacterGender`: `female | male | mixed | group | none`
- `primaryVisualLead`: `female | male | neutral | none`
- `mainCharacterCount`
- `femaleQuotaChapter`
- `femaleQuotaBatch`

正式 Gate：

1. 第一章 61 張卡中，`primaryVisualLead = female` 至少 31 張。
2. 每個批次的女性主角卡不得低於該批卡數的 50%，奇數批次採向上取整。
3. 雙人或群像仍必須標記 `primaryVisualLead`。
4. `none` 只允許確實沒有擬人主角的情境，不得用來規避統計。

第一章預設分為 7 批：前 6 批各 10 張，第 7 批 1 張。單張尾批必須是女性主角卡，確保每批 Gate 可判定且全章至少 31 張女性主角卡。

### 3.6 SSR 史詩感

SSR 固定：

```text
visualTone = epic
compositionScale = grand
characterPresence = heroic
vfxIntensity = high
ssrEpicRequirement = required
```

SSR `promptMaster` 必須包含 `ssrEpicPromptBlock`，要求英雄級主角氣場、宏大場景、電影式構圖、傳奇光效、高張力決定性瞬間與高精緻日韓動漫手遊質感。只有華麗外框而主插圖平淡者不得送審。

### 3.7 產製治理

- `artworkStatus`
- `compositeStatus`
- `reviewStatus`
- `currentMaster`
- `templateVersion`
- `driveFileId`
- `driveUrl`
- `githubPath`
- `githubPr`
- `sha256`
- `owner`
- `lastVerifiedAt`
- `nextAction`
- `notes`

狀態流程：

```text
draft → copy-review → ready-for-art → artwork-review → ready-for-composite
→ composite-review → approved → current-master
```

## 4. 初始分級原則

- 稀有度依成語正面意義、激勵強度與精神象徵判定，不依題目難度。
- `SSR` 僅給予具有強烈正面精神、英雄成就或改變命運象徵的成語。
- `SR` 為高度正面、具成就感或深厚文化意象。
- `R` 為一般正面、實用或具明確故事畫面。
- `N` 為中性、警示、負面或日常描述。
- 難易度依詞義、字詞熟悉度、典故理解與教育門檻分為 E～S。

## 5. Google Sheet

在 `CICG_素材管理控制中心_v1.0` 新增 `Card_Catalog` 工作表：

- 一列一張卡。
- 凍結標題列。
- 保存與 GitHub 主檔對應的欄位。
- `Control_Center` 顯示總卡數、女性主角卡數／占比、各批女性 Gate、SSR 史詩提示語完整度與產製狀態。
- `Codebook_Agent` 登錄合法枚舉與欄位定義。
- 所有異動保留於 `Version_History`，不得覆寫歷史。

## 6. 自動驗證

CI 至少驗證：

1. 恰好 61 張卡，`cardId`、`idiomId`、`idiomText` 唯一。
2. 與第一章關卡的 61 個 placement 完全一致。
3. 稀有度、外框一一對應；不得出現 UR。
4. 卡片難易度代碼與名稱一一對應。
5. 每張卡都有類別、文案欄位與非空 `promptMaster`。
6. 全章與每批女性主角比例均達 50%。
7. SSR 具備固定視覺欄位、史詩提示語區塊與 SSR 專屬外框。
8. 未完成注音、拼音、授權或文案校訂的卡只能維持 Review／Draft，不得標記 Approved。

## 7. 非目標

本階段不產製 61 張圖片、不將 Review 圖卡加入正式卡池、不修改進度資料庫 schema，也不改變主玩法。