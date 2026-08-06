# 成語圖卡元件化架構設計 v1.0

日期：2026-08-06  
Repository：`gshan1209-cell/Chinese-Idiom-Chain-Game`  
狀態：Approved  
規範類型：圖卡資產、資料、渲染與輸出架構；本文件不包含 production code

## 1. 目的

將成語圖卡由「單張不可拆平面 PNG」改為「主插圖、版型、可替換元件與卡片資料分離」的非破壞式架構。

完成後，修改難易度標籤、稀有度徽章、主題徽章、標題、注音、漢語拼音、典故、箴言、來源或外框時，不得要求重新繪製中央人物情境主圖。

本規格適用於：

- 新成語圖卡素材產製
- Repository-local 產圖技能與跨聊天狀態
- 圖卡收藏頁與獎勵揭示畫面
- 圖卡預覽、審核與版本管理
- 固定 PNG 輸出
- 未來指定圖卡購買與固定內容卡包
- 舊平面圖卡逐步遷移

---

## 2. 與既有規格的關係

本規格不覆寫成語內容、稀有度語義、審核或版面尺寸，只定義如何把它們拆成可替換來源。

仍須遵守：

1. `2026-08-06-idiom-card-rarity-standard-design.md`
2. `2026-08-06-idiom-card-review-governance-design.md`
3. `2026-08-06-idiom-card-collection-design.md`
4. `2026-08-06-idiom-card-collection-data-integrity-amendment.md`
5. `2026-08-06-card-template-v2.6-dimension-and-pronunciation-amendment.md`
6. `2026-08-06-card-template-v2.7-ssr-badge-amendment.md`

目前正式幾何基準：

```text
畫布：1024 × 2000 px
上方資訊區：y = 0–359，高度 360 px
中央主圖區：y = 360–1559，高度 1200 px
下方內容區：y = 1560–1999，高度 440 px
```

SSR 新產圖卡另須使用 v2.7 傳奇級虹彩金龍徽章。

發生衝突時：

```text
GitHub main 與最新 Approved 規格
→ 稀有度與審核治理
→ v2.7 SSR 徽章增補
→ v2.6 尺寸與發音版面增補
→ 本元件化架構
→ Repository-local skill、Prompt 與批次狀態
→ 個別圖卡企劃
```

---

## 3. 核心決策

### 3.1 四層模型

每張 modular 圖卡固定拆成：

```text
Artwork Layer
+ Template Layer
+ Component Layer
+ Data Layer
= Rendered Card
```

### 3.2 Canonical Source 與 Derived Output

Canonical Source：

- 無卡框與文字的中央人物情境主插圖
- 可版本化模板與元件
- 結構化卡片資料
- 元件註冊表與可稽核資產參照

Derived Output：

- 遊戲內 SVG／DOM 畫面
- 收藏頁縮圖
- 獎勵揭示畫面
- 審核用 Review PNG
- 核准用 Approved PNG

Derived Output 可以重新產生；Canonical Source 不得因輸出改版而遺失。

### 3.3 新卡預設 modular

新建圖卡預設：

```ts
renderMode: 'modular'
```

舊有整張 PNG：

```ts
renderMode: 'flat-legacy'
```

不得要求一次性重製全部舊卡。舊卡只在內容修正、重大改版或正式發布需要時遷移。

### 3.4 文字不得烙入主插圖

下列內容不得成為 `artwork` 主圖的一部分：

- 稀有度徽章
- 難易度標籤
- 成語主標
- 注音
- 漢語拼音
- 白話副標
- 主題徽章
- 典故文字
- 箴言文字與牌匾
- 典故來源
- 外框與資訊區裝飾

主插圖可以包含成語情境中的自然文字道具，但不得用它承擔正式卡面欄位。

---

## 4. 分層責任

### 4.1 Artwork Layer

只負責：

- 人物
- 背景
- 情境
- 道具
- 光影
- 氣氛

正式 modular 主插圖規格：

```text
建議來源尺寸：1024 × 1200 px
正式占位：x = 0–1023、y = 360–1559
格式：PNG 或高品質 WebP
不得包含卡框、標籤、正式文字欄位或浮水印
```

主插圖必須能在不修改內容的前提下搭配不同難易度、徽章版本與文字資料重新輸出。

### 4.2 Template Layer

負責固定幾何與槽位：

- 1024 × 2000 畫布
- Header／Artwork／Footer 區域
- 主標、注音、拼音、副標槽位
- 稀有度與難易度槽位
- 主題徽章槽位
- 典故、箴言與來源槽位
- 外框與共用底板

Template 不得把單卡文字、難易度字母或特定成語烙死。

### 4.3 Component Layer

第一批正式元件：

```text
rarity-badge
difficulty-badge
theme-badge
title-block
pronunciation-block
subtitle-block
allusion-panel
motto-plaque
source-line
frame-skin
effect-overlay
```

其中：

- `pronunciation-block` 同時處理四組注音與四個帶聲調漢語拼音音節。
- `rarity-badge` 依稀有度與版本解析；SSR 使用 v2.7 徽章。
- `difficulty-badge` 是可資料驅動的共用元件，不需要為 E～S 重畫中央主圖。
- `theme-badge` 依九類主題與固定色票解析。
- `motto-plaque` 保持低高度、窄版、深色金框、直式由右至左。

### 4.4 Data Layer

每張卡片的語義與顯示資料由結構化資料保存，不依賴圖片辨識。

```ts
export type CardRarity = 'N' | 'R' | 'SR' | 'SSR' | 'UR';
export type IdiomDifficulty = 'E' | 'D' | 'C' | 'B' | 'A' | 'S';
export type CardRenderMode = 'flat-legacy' | 'modular';

export interface IdiomCardDefinition {
  readonly cardId: string;
  readonly idiomId: string;
  readonly title: string;
  readonly bopomofo: readonly [string, string, string, string];
  readonly pinyin: readonly [string, string, string, string];
  readonly subtitle: string;
  readonly rarity: CardRarity;
  readonly difficulty: IdiomDifficulty;
  readonly themeId: string;
  readonly allusionSummary: string;
  readonly allusionSource: string;
  readonly mottoLines: readonly [string, string, string];
  readonly renderMode: CardRenderMode;
  readonly layoutVersion: '2.6';
  readonly componentSetVersion: string;
  readonly artworkRef: CardAssetReference;
  readonly frameSkinId: string;
  readonly rarityBadgeId: string;
  readonly difficultyBadgeId: string;
  readonly themeBadgeId: string;
  readonly mottoPlaqueId: string;
  readonly effectOverlayId: string | null;
  readonly flatLegacyRef: CardAssetReference | null;
}
```

---

## 5. 資產參照與元件註冊表

### 5.1 資產參照

```ts
export interface CardAssetReference {
  readonly assetId: string;
  readonly version: string;
  readonly sourceDriveFileId: string;
  readonly sourceSha256: string;
  readonly runtimePath: string | null;
  readonly width: number;
  readonly height: number;
  readonly mimeType: 'image/png' | 'image/webp' | 'image/svg+xml';
  readonly status: 'review' | 'approved' | 'deprecated' | 'archived';
}
```

未知 Drive File ID 或 SHA-256 不得自行填入。

### 5.2 元件註冊表

```ts
export interface CardComponentRegistry {
  readonly registryVersion: string;
  readonly frameSkins: Readonly<Record<string, CardAssetReference>>;
  readonly rarityBadges: Readonly<Record<string, CardAssetReference>>;
  readonly difficultyBadges: Readonly<Record<string, CardAssetReference>>;
  readonly themeBadges: Readonly<Record<string, CardAssetReference>>;
  readonly mottoPlaques: Readonly<Record<string, CardAssetReference>>;
  readonly effectOverlays: Readonly<Record<string, CardAssetReference>>;
}
```

元件版本獨立於整張卡版本：

```text
layoutVersion = 2.6
componentSetVersion = 1.0
rarityBadgeId = rarity-ssr-v2.7
artworkRef.version = 1.0
```

因此只更新 `difficulty-badge-v2` 時，不需改動 `artworkRef`。

---

## 6. Canonical Render Plan

渲染前先由純 TypeScript 產生不可變 Render Plan：

```ts
export interface IdiomCardRenderPlan {
  readonly canvas: { readonly width: 1024; readonly height: 2000 };
  readonly layoutVersion: '2.6';
  readonly layers: readonly IdiomCardRenderLayer[];
  readonly sourceCardId: string;
  readonly sourceArtworkAssetId: string;
  readonly componentVersions: Readonly<Record<string, string>>;
}
```

固定圖層順序：

```text
1. background
2. artwork
3. frame-skin
4. effect-overlay
5. rarity-badge
6. difficulty-badge
7. title-block
8. pronunciation-block
9. subtitle-block
10. theme-badge
11. allusion-panel
12. motto-plaque
13. source-line
```

元件改版只能替換其對應 layer，不得暗中替換 artwork。

---

## 7. 遊戲內與 PNG 輸出

### 7.1 Canonical 顯示面

推薦以 SVG 作為 canonical render surface：

```text
viewBox="0 0 1024 2000"
```

理由：

- 同一座標可用於 React 顯示與 PNG 輸出。
- 文字、注音、拼音與標籤保持可替換。
- 可保留手機縮放清晰度。
- 元件邊界與圖層順序可測試。

### 7.2 React 分工

純規則與 render plan 放在 `src/cards`。

React 元件放在：

```text
src/app/cards/
```

React 不得重新判定稀有度、難易度、授權或卡池資格，只消費已驗證資料與 render plan。

### 7.3 PNG 輸出

PNG 輸出固定：

```text
1024 × 2000 px
PNG
```

流程：

```text
IdiomCardDefinition
→ Layout Resolver
→ Component Resolver
→ SVG Render Plan
→ SVG Preview
→ Canvas Rasterization
→ Review／Approved PNG
```

PNG 是 derived output，不是後續改版唯一來源。

---

## 8. GitHub、Drive 與 PWA 分工

### 8.1 Drive

Drive 保存視覺 master：

```text
80_Inbox/Idiom_Cards/Artworks
80_Inbox/Idiom_Cards/Components
80_Inbox/Idiom_Cards/Composites
02_UI_UX_And_Visuals/Idiom_Cards/Approved/Artworks
02_UI_UX_And_Visuals/Idiom_Cards/Approved/Components
02_UI_UX_And_Visuals/Idiom_Cards/Approved/Composites
90_Archive/Idiom_Cards
```

### 8.2 GitHub

GitHub 保存：

- TypeScript 資料模型與純規則
- React／SVG renderer
- 元件註冊表與卡片定義
- JSON Schema 與驗證腳本
- Drive File ID、SHA-256、尺寸、版本與狀態
- runtime derivative 的 manifest
- 規格、計畫、審核紀錄與批次狀態

### 8.3 PWA runtime derivative

離線 PWA 使用的圖像可由 Approved Drive master 產生 runtime derivative：

```text
public/cards/artworks/
public/cards/components/
```

規則：

- Drive master 是視覺核准來源。
- Repository runtime derivative 必須與 Drive master SHA-256／版本可追溯。
- 不得將未核准 Inbox 資產打包進正式 PWA。

---

## 9. 檔案命名

主插圖：

```text
CICG_Artwork_<成語>_v<版本>_Review.png
CICG_Artwork_<成語>_v<版本>_Approved.png
```

元件：

```text
CICG_Component_RarityBadge_<稀有度>_v<版本>.svg
CICG_Component_DifficultyBadge_v<版本>.svg
CICG_Component_ThemeBadge_<主題>_v<版本>.svg
CICG_Component_MottoPlaque_v<版本>.svg
```

最終合成圖沿用現有外部命名：

```text
CICG_IdiomCard_<成語>_<稀有度>_<難易度>_v<卡面版本>_Review.png
CICG_IdiomCard_<成語>_<稀有度>_<難易度>_v<卡面版本>_Approved.png
```

內部 manifest 必須另外保存 layout、component、badge 與 artwork 的獨立版本。

---

## 10. 產圖流程

新卡固定流程：

```text
內容資料校訂
→ 產生 illustration-only artwork
→ 上傳 Artwork 到 Drive 80_Inbox
→ Artwork 視覺審核
→ 選擇 Approved 元件版本
→ Renderer 合成 Review 卡面
→ 內容／版面／權利審核
→ 獨立最終核准
→ 輸出 Approved PNG
→ 更新 Manifest 與 current-batch.json
```

圖片生成工具的主要任務改為產生 `artwork`，不得要求它永久烙入標題、注音、拼音、難易度或徽章。

Renderer 尚未完成時：

- 可以先產生 illustration-only artwork。
- `compositionStatus` 必須標記為 `blocked` 或 `pending`。
- 不得為了暫時方便退回單一不可拆 canonical PNG。
- 臨時平面預覽若存在，只能標記為 Review derivative。

---

## 11. 跨聊天狀態 v2

`current-batch.json` 的 schema 升級為 2，批次層級新增：

```text
defaultRenderMode
layoutVersion
componentSetVersion
```

單卡層級新增：

```text
renderMode
artworkStatus
compositionStatus
artworkFilename
compositeFilename
artworkDriveFileId
compositeDriveFileId
artworkAssetId
componentSetVersion
rarityBadgeId
```

推薦狀態：

```text
artworkStatus: planned | generated | changes-requested | approved | uploaded
compositionStatus: pending | rendered | changes-requested | approved | uploaded | blocked
```

`generated`、`rendered`、`approved`、`uploaded` 仍是不同證據狀態，不得合併。

---

## 12. 舊卡遷移策略

### 12.1 Legacy 保留

舊卡保留：

```ts
renderMode: 'flat-legacy'
```

並記錄：

- 原始 Drive File ID
- SHA-256
- 卡面版本
- 來源與核准狀態

### 12.2 遷移觸發條件

只有下列情況需優先轉 modular：

- 圖卡內容或來源需要修正
- 難易度、稀有度或徽章需要改版
- 正式收藏功能準備上線
- 卡片需要多語系、無障礙或動態字級
- 舊平面圖文字品質不合格

### 12.3 遷移方式

若舊平面圖無法無損分離：

- 不以低品質裁切假裝 canonical component。
- 保留舊圖為歷史版本。
- 重新產生或重製 illustration-only artwork。
- 使用最新 renderer 輸出新版本。

---

## 13. 審核 Gate

### 13.1 Artwork Gate

- [ ] 主圖為 `1024 × 1200 px` 或可無損裁切至該比例。
- [ ] 無正式卡框、標籤、主標、注音、拼音或來源文字。
- [ ] 至少一名人物以動作表達成語。
- [ ] 無未授權 IP、Logo、浮水印與明顯人體錯誤。
- [ ] 角色、場景、服飾與典故時代不矛盾。

### 13.2 Component Gate

- [ ] 難易度標籤可獨立替換。
- [ ] 稀有度徽章可獨立替換。
- [ ] 主題徽章、箴言牌匾與來源行可獨立替換。
- [ ] SSR 使用 `rarity-ssr-v2.7` 或較新 Approved 元件。
- [ ] 元件版本、Drive File ID 與 SHA-256 可追溯。

### 13.3 Composition Gate

- [ ] 最終輸出恰為 `1024 × 2000 px`。
- [ ] Header／Artwork／Footer 座標符合 v2.6。
- [ ] 更換 difficulty 後 `artworkAssetId` 不變。
- [ ] 更換 rarity badge 後 `artworkAssetId` 不變。
- [ ] 所有正式文字來自 Data Layer。
- [ ] 無文字溢出、遮擋、假字或錯誤聲調。
- [ ] Producer 未自行將自己的輸出標記最終 Approved。

任一 Blocking Gate 失敗時，不得進入 Approved。

---

## 14. 驗收條件

元件化實作完成時，必須以證據證明：

1. 把難易度由 B 改為 A，只改變 difficulty component 與資料，不改 artwork checksum。
2. 把 SR 徽章改為 SSR v2.7，只改變 rarity component；語義稀有度仍須另外通過審核。
3. 修改注音、拼音、副標、典故或來源，不重畫人物情境主圖。
4. 同一 `IdiomCardDefinition` 可渲染收藏頁與輸出 PNG。
5. PNG 尺寸與三區座標符合 v2.6。
6. `flat-legacy` 卡仍可安全顯示。
7. 未核准元件或 artwork 不會進入正式 PWA。
8. 重新輸出結果可追溯到相同 artwork、layout 與 component versions。

---

## 15. 非目標

本次 docs-only 規格不包含：

- 立即重製所有舊圖
- 修改 `cicg-progress` IndexedDB Schema
- 實作付款、後端或付費隨機抽卡
- 將打地鼠或附加玩法接入圖卡渲染器
- 在本 PR 中加入 React、TypeScript 或圖片資產
- 自動核准任何既有圖片

後續 production implementation 必須使用 TDD，另依 Implementation Plan 建立功能分支。