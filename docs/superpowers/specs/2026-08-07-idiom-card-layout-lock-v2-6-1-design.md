# CICG 成語圖卡版型鎖定規範 v2.6.1

日期：2026-08-07  
狀態：User Approved Design／Written Spec Review Pending  
適用專案：`gshan1209-cell/Chinese-Idiom-Chain-Game`

## 1. 目的

本增補規範鎖定成語圖卡的固定幾何版型，防止產圖模型或合成流程自行改變卡面高度、區塊比例、元件位置、SSR 霓虹外框範圍或 Footer 配置。

本文件是 `CICG 成語圖卡標準規範 v2.6` 的幾何版型增補：

- v2.6 繼續管理九大主題徽章、稀有度、難易度、角色配額、資料欄位與產製流程。
- v2.6.1 專門管理畫布、區域、元件座標、裁切、安全區、圖層與禁止位移規則。
- 發生幾何衝突時，以 v2.6.1 為準。

使用者提供的「愚公移山」參考圖只用於確認視覺比例與相對位置，不作為可直接裁切、重繪或讀取文字內容的正式母件。參考圖中的漢語拼音不屬於新版卡面規格。

## 2. Canonical 畫布與座標系統

### 2.1 唯一正式尺寸

```text
width  = 1024 px
height = 2000 px
aspect = 0.512
origin = 左上角 (0, 0)
x 向右增加
y 向下增加
```

所有 Review、Approved、Current Master 合成圖均必須輸出為精確 `1024 × 2000 px`。

預覽畫面可等比例縮放整張卡，但不得改變 canonical 輸出尺寸，不得分別縮放寬度與高度。

### 2.2 三大固定區域

| 區域 | X | Y | Width | Height |
|---|---:|---:|---:|---:|
| Header | 0 | 0 | 1024 | 360 |
| Main Artwork | 0 | 360 | 1024 | 1200 |
| Footer | 0 | 1560 | 1024 | 440 |

永久規則：

- 任何稀有度均不得改變三區高度。
- SSR 霓虹外框不得擠壓或縮小任何區域。
- 文字過長時必須修改文案，不得增加 Header 或 Footer 高度。
- 單張卡不得自行重新分配三區比例。

## 3. Header 固定版型

### 3.1 元件 Bounding Box

| 元件 | X1 | Y1 | X2 | Y2 | Width | Height |
|---|---:|---:|---:|---:|---:|---:|
| 稀有度徽章 | 24 | 18 | 252 | 326 | 228 | 308 |
| 四字主標題 | 250 | 42 | 788 | 158 | 538 | 116 |
| 四組注音 | 278 | 166 | 756 | 232 | 478 | 66 |
| 簡短白話副標 | 258 | 254 | 782 | 330 | 524 | 76 |
| 難易度徽章 | 792 | 24 | 1000 | 318 | 208 | 294 |

座標採半開區間實作時，右界與下界分別視為 exclusive；視覺規格表以上述整數邊界表示。

### 3.2 主標題

- 固定四字、單行、水平置中。
- 不得換行、直排或侵入注音區。
- 使用核准繁體中文字體；不得由圖片模型生成文字。
- 使用固定 `textStyleId = idiom-title-v1`；禁止單卡自動縮字或非等比拉伸。
- 若文字超出 Bounding Box，屬 Blocking failure；必須修正 typography token，不得縮小整個 Header。

### 3.3 注音

- 只顯示四組逐字對齊的臺灣注音符號。
- 不顯示漢語拼音、日文假名、羅馬字或近似符號。
- 四組注音必須與四個成語字依序對齊。
- 使用固定 `textStyleId = zhuyin-row-v1`。
- 注音由結構化資料寫入，不得由圖片模型生成。

### 3.4 白話副標

- 固定單行。
- 建議不超過 14 個全形中文字元與標點。
- 使用固定 `textStyleId = subtitle-v1`；禁止單卡自動縮字。
- 超出時必須編修文案；不得換成兩行、不得向下侵入中央插畫。

### 3.5 稀有度與難易度

- 稀有度固定左上，難易度固定右上。
- 稀有度與難易度是兩套獨立系統，禁止互相改色或共用語意。
- 難易度徽章必須直接套用 current Approved 元件；不得由圖片模型重畫或依稀有度重新著色。
- 難易度文字與代碼固定：`E 入門`、`D 基礎`、`C 普通`、`B 進階`、`A 困難`、`S 極限`。
- 所有難易度元件共用相同 Bounding Box，不得因代碼或中文長度改變尺寸。

## 4. Main Artwork 固定槽位

### 4.1 Canonical artwork

```text
artwork source width  = 1024 px
artwork source height = 1200 px
render x = 0
render y = 360
```

中央插畫 canonical source 必須：

- 無文字。
- 無外框。
- 無稀有度、難易度或九大主題徽章。
- 無典故、箴言、來源或卡面 UI。
- 不含浮水印、Logo 或既有商業 IP 標誌。

### 4.2 裁切與縮放

唯一允許的配置模式：

```text
object-fit: cover
object-position: center
preserveAspectRatio: true
```

規則：

- 禁止非等比拉伸。
- 禁止為配合 Footer 而壓縮高度。
- 禁止為 SSR 霓虹框縮小中央插畫。
- 若來源不是 `1024 × 1200`，必須先通過 safe-crop 驗證；不能直接以整張完整卡圖充當 artwork。

### 4.3 主體安全區

全畫布座標：

```text
人物與主要動作安全區：x = 96–928, y = 430–1390
重要頭部最高點：不得進入 y < 420
重要手部、武器或道具最低點：不得進入 y > 1470
```

- 主角臉部不得被 Header 或 Footer 遮擋。
- 主要動作與成語核心象徵不得落入最外側 48 px 裝飾邊界。
- 群像卡仍必須有明確 primary visual lead。

## 5. Footer 固定版型

### 5.1 元件 Bounding Box

| 元件 | X1 | Y1 | X2 | Y2 | Width | Height |
|---|---:|---:|---:|---:|---:|---:|
| 九大主題徽章 | 28 | 1576 | 300 | 1920 | 272 | 344 |
| 典故區 | 286 | 1582 | 724 | 1920 | 438 | 338 |
| 箴言牌匾 | 730 | 1570 | 988 | 1922 | 258 | 352 |
| 典故來源列 | 178 | 1936 | 846 | 1986 | 668 | 50 |

九大主題徽章與典故區的裝飾 Bounding Box 可有最多 14 px 視覺 bleed；實際文字與圖示 content-safe box 不得重疊。

### 5.2 九大主題徽章

- 固定左下。
- 只允許從 `data/cards/theme-badge-registry.json` 解析 current Approved 母件。
- 等比例縮放、完整顯示金色外框、中央圖式與下方類別名稱。
- 禁止拉伸、裁切、換色、重畫、移除名稱牌或顯示 `secondaryThemeTags`。
- 同一類別必須永遠使用同一枚 Approved Asset ID。

### 5.3 典故區

- 區塊標題固定為 `典故`，不得寫成 `典故說明`。
- 內文最多四行。
- 使用固定 `textStyleId = allusion-body-v1`；禁止單卡自動縮字。
- 超出時必須精簡文案，不得拉高 Footer。
- 典故文字必須由結構化資料寫入，不得由圖片模型生成。

### 5.4 箴言牌匾

- 固定右下窄版深色金框牌匾。
- 固定三欄直式排版，由右至左閱讀。
- 使用固定 `textStyleId = motto-vertical-v1`。
- 文案通常三句，每句約四至六字並保留標點。
- 牌匾高度、寬度與位置不得隨文案增減。
- 文案過長時必須重寫，禁止增加欄數、縮字或改為橫排。

### 5.5 典故來源列

- 固定最底部單行。
- 使用固定 `textStyleId = source-line-v1`；禁止單卡自動縮字。
- 不得換行或侵入 Footer 其他區塊。
- 來源未完成校訂時，只能維持 Draft／Review，不得以臆測來源升格 Approved。

## 6. 稀有度外框與 SSR 霓虹 Overlay

### 6.1 全稀有度共同規則

- N、R、SR、SSR 各自使用 current Approved 專屬 full-canvas frame skin。
- 外框資產 canonical 尺寸必須為 `1024 × 2000 px` 或由 renderer 以固定座標無損對齊。
- 外框只改變視覺皮膚，不得改變任何內容 Bounding Box。

### 6.2 SSR Overlay

SSR 霓虹外框固定為全畫布透明 Overlay：

```text
x = 0
y = 0
width = 1024
height = 2000
```

固定要求：

- 使用 current Approved SSR v2.8 青藍、紫、洋紅、翠綠虹彩霓虹包框。
- Overlay 疊加後畫布仍為 `1024 × 2000`。
- 不得把內部內容縮小來替霓虹框騰空間。
- 不得改變 Header、Main Artwork、Footer 或任何元件位置。
- 不得把難易度徽章、九大主題徽章、典故區或箴言牌匾整體染成虹彩。

外框內側安全線：

```text
left   = 24 px
right  = 24 px
top    = 18 px
bottom = 18 px
```

霓虹光效向內延伸不得超過 `20 px`；若遮擋文字、徽章或人物核心動作，屬 Blocking failure。

## 7. 固定圖層順序

renderer 必須以可重現的固定順序合成：

```text
01 background / panel base
02 canonical artwork
03 Header / Footer structural panels
04 rarity frame skin
05 rarity badge
06 difficulty badge
07 theme badge
08 title / Zhuyin / subtitle
09 allusion / motto / source
10 approved edge highlights
11 SSR neon overlay（僅 SSR，最上層）
```

SSR neon overlay 雖位於最上層，但其不透明與光暈像素只能存在於核准的外框區域；不得覆蓋內容安全區。

圖片模型只負責第 02 層 artwork。其他層全部由 renderer 使用 Approved 資產與結構化資料合成。

任何一次性「直接生成整張完整卡面」均不符合 v2.6.1。

## 8. 確定性渲染與禁止行為

### 8.1 必須確定

相同輸入資料、相同 Asset ID 與相同 renderer 版本，輸出必須具有相同：

- 畫布尺寸。
- 區域高度。
- 元件座標。
- 元件縮放比例。
- `textStyleId`。
- 文字流向與對齊。
- 圖層順序。

不得使用單卡 auto-fit、隨機位置、生成式 UI 或依圖片內容自動重排。

### 8.2 永久禁止

- 讓圖片模型生成完整卡面。
- 一次生成十張拼圖總覽並視為單卡成品。
- 因 SSR、難度或文案改變卡面高度。
- 非等比拉伸中央插畫、徽章或外框。
- 把漢語拼音渲染到卡面。
- 自由移動稀有度、難易度或主題徽章。
- 用模型近似繪製 Approved 徽章或難度標籤。
- 將使用者參考圖中的文字、來源或錯誤元素直接當成正式資料。

## 9. 驗證 Gate

合成器與 CI 至少必須驗證：

1. 輸出精確為 `1024 × 2000 px`。
2. Header、Main Artwork、Footer 分界分別為 `360` 與 `1560`。
3. 所有元件 Bounding Box 與規格一致；允許的像素誤差不得超過 `±2 px`。
4. Main Artwork 保持等比、沒有拉伸。
5. 卡面沒有漢語拼音或其他羅馬字讀音列。
6. 稀有度、難易度、主題徽章位置正確且互不替代。
7. 難易度元件使用正確 current Approved Asset ID 與原始顏色。
8. 主題徽章使用與 `themeCategory` 相符的 current Approved Asset ID。
9. SSR 必須存在 approved full-canvas neon overlay，且沒有造成內容 reflow。
10. 典故最多四行、箴言固定三欄直式、來源固定一行。
11. 任何文字或重要人物區域不得超出 safe zone 或被外框遮擋。
12. Canonical artwork 不得含正式卡面文字、徽章或外框。
13. 同一輸入重複渲染的 geometry manifest 必須完全一致。

任一 Blocking Gate 失敗時：

```text
reviewStatus = changes-requested
currentMaster = false
approvalStatus != approved
```

## 10. 版本與導入順序

```text
v2.6：主規格與九大主題徽章系統
v2.6.1：固定幾何版型、座標、safe zone、圖層與 SSR Overlay
```

導入順序：

1. 將本規格加入 Agent required specs。
2. 建立 machine-readable layout contract。
3. 先寫座標與輸出尺寸失敗測試。
4. 建立 deterministic renderer。
5. 將 Approved frame、difficulty badge、theme badge 接入固定錨點。
6. 重製單張 Review 卡並執行像素 Gate。
7. 完整 CI 與 ChatGPT Audit 通過後，才可批次重製。

## 11. 驗收標準

本規格落地完成必須同時滿足：

- 任何稀有度輸出均維持 `1024 × 2000`。
- 三大區域高度固定為 `360／1200／440`。
- 所有元件均使用固定座標，不因成語、難度、稀有度或文案改變。
- SSR 霓虹框存在但不造成整體縮放或高度跑版。
- 難度與九大徽章只能套用 Approved 元件。
- 中央插畫與卡面 UI 完全分離。
- 一張單卡通過像素級 Review 後，才允許進入下一批產製。
