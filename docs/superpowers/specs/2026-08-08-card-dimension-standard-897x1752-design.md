# CICG 圖卡尺寸標準變更規格 v1.0

- **專案：** Chinese-Idiom-Chain-Game
- **文件狀態：** 已實作，待最新 Primary CI 與 ChatGPT Audit
- **規格版本：** v1.0
- **適用範圍：** 完整成語圖卡 Composite、卡牌模板、Renderer 輸出與資產註冊
- **不適用範圍：** 中央插畫原圖、商店宣傳圖、印刷輸出與影片素材

## 1. 核准決策

CICG 完整直式圖卡的唯一現行新產圖標準為：

```text
Canvas Profile：cicg-card-897x1752-v1
Width：897 px
Height：1752 px
Aspect Ratio：299:584
dimensionStatus：canonical
```

原有 `1024 × 2000` 圖卡不作廢，但只能標記：

```text
Canvas Profile：cicg-card-1024x2000-legacy-v1
dimensionStatus：legacy-compatible
newProductionAllowed：false
```

不得再以 `1024 × 2000` 建立新的完整圖卡。

## 2. 設計理由

1. 現行圖像生成流程穩定輸出 `897 × 1752`。
2. 真實輸出與正式規格統一後，可消除長期尺寸漂移。
3. `897 × 1752` 與舊尺寸的視覺比例差異僅約 `0.0027%`，但仍採精確 Profile，不使用模糊容差。
4. 現有 UR Review 圖卡不再僅因 `897 × 1752` 被判為尺寸不合格。
5. 既有 `1024 × 2000` 資產無須強制重製，避免無效返工與畫質損失。

## 3. Canvas Profile Registry

唯一真實來源：

```text
data/cards/card-canvas-profiles.json
```

現行 Profile：

```json
{
  "profileId": "cicg-card-897x1752-v1",
  "widthPx": 897,
  "heightPx": 1752,
  "aspectRatio": "299:584",
  "status": "canonical",
  "newProductionAllowed": true
}
```

舊版相容 Profile：

```json
{
  "profileId": "cicg-card-1024x2000-legacy-v1",
  "widthPx": 1024,
  "heightPx": 2000,
  "aspectRatio": "64:125",
  "status": "legacy-compatible",
  "newProductionAllowed": false
}
```

需要高解析輸出時，只允許現行標準的整數倍數：

```text
2×：1794 × 3504
3×：2691 × 5256
```

衍生圖必須使用：

```text
dimensionStatus：derivative
sourceCanvasProfile：cicg-card-897x1752-v1
```

## 4. Canonical 判定

完整圖卡只有同時通過以下條件，才可成為完整 Canonical 成品：

1. 畫布恰好為 `897 × 1752`，並引用現行 Canvas Profile。
2. 成語、注音、典故、來源、標籤、箴言與卡號由正式 Renderer 組裝。
3. 文字來自受治理的結構化資料，而非圖片模型直接生成。
4. 模板、外框與元件版本為 current Approved。
5. SHA-256、檔案大小、MIME、Drive File ID 與父資料夾已驗證。
6. UR 卡另須通過 IP 授權、發布與正式卡號 Gate。

`dimensionStatus: canonical` 只代表尺寸 Gate 通過，不代表 `canonicalRendererOutput`、內容、授權或發布已核准。

## 5. 資產註冊欄位

現行完整圖卡：

```json
{
  "canvasProfile": "cicg-card-897x1752-v1",
  "widthPx": 897,
  "heightPx": 1752,
  "aspectRatio": "299:584",
  "dimensionStatus": "canonical",
  "sourceCanvasProfile": null
}
```

舊版相容圖卡：

```json
{
  "canvasProfile": "cicg-card-1024x2000-legacy-v1",
  "widthPx": 1024,
  "heightPx": 2000,
  "aspectRatio": "64:125",
  "dimensionStatus": "legacy-compatible",
  "sourceCanvasProfile": null,
  "newProductionAllowed": false
}
```

## 6. 驗證規則

新產圖只接受精確的：

```text
897 × 1752
```

下列新資產一律拒絕：

```text
896 × 1752
897 × 1751
898 × 1752
1024 × 2000
```

`1024 × 2000` 只有在保存既有資產且明確標示 `legacy-compatible`、`newProductionAllowed: false` 時才通過。

整數倍數只有在標記 `derivative` 並引用現行 Profile 時才通過。不得以比例接近或像素容差放行任意尺寸。

## 7. 現行版面幾何

```text
Canvas       x=0, y=0,    width=897, height=1752
Header       x=0, y=0,    width=897, height=315
Main Artwork x=0, y=315,  width=897, height=1051
Footer       x=0, y=1366, width=897, height=386
```

固定元件位置：

```text
UR badge           x=21–221,  y=16–286
idiom title        x=219–690, y=37–138
bopomofo[4]        x=244–662, y=145–203
spirit subtitle    x=226–685, y=223–289
collaboration tag  x=694–876, y=21–279

theme badge         x=25–263,  y=1381–1682, width=238, height=301
allusion panel      x=251–634, y=1386–1682, width=383, height=296
motto plaque        x=639–865, y=1508–1684, width=226, height=176
source line         x=156–349, y=1696–1740, width=193, height=44
card-number-plaque  x=359–538, y=1696–1740, width=179, height=44
```

畫布尺寸不允許容差；元件定位允許最多 `±2 px`。箴言區固定靠下。卡面不設招式名稱欄位。

中央插畫仍維持：

```text
1024 × 1200 px
```

此規格不得改變中央 artwork 的來源尺寸。

## 8. 既有資產遷移

### `897 × 1752`

- `dimensionStatus` 改為 `canonical`。
- 移除舊的「不是 1024 × 2000」尺寸阻擋。
- 不因此自動標記 `canonicalRendererOutput: true` 或 Approved。
- 文字校訂、Renderer、Drive、授權、發布與正式卡號 Gate 全數保留。

### `1024 × 2000`

- 保留原檔，不強制縮放或重製。
- 標記 `legacy-compatible`。
- 可作歷史模板、備份或已核准舊資產。
- 禁止用於新的完整卡產製。

### 其他尺寸

- 維持 `review`、`quarantined` 或 `noncanonical`。
- 需要正式使用時，由 Renderer 依現行 Profile 重建。

## 9. 鬼滅 UR Review 批次

13 張 `897 × 1752` Review 圖卡完成遷移後：

```text
dimensionStatus：canonical
canonicalRendererOutput：false
publicationStatus：not-approved-for-publication
formalCardNumber：null
```

仍存在的阻擋：

1. 圖片模型生成文字須由 Renderer 重建或逐項驗證。
2. 成語、注音、典故與來源仍依各內容包狀態校訂。
3. `RV-UR-0009` 顯示「豪氣千雲」，須修正為「豪氣干雲」。
4. 尚無可稽核 IP 授權證據。
5. 不得分配或消耗正式 `UR-####`。
6. 未取得真實 Drive File ID 的批次維持 `pending-drive-upload`。

## 10. Repository 影響範圍

本次同步更新：

```text
AGENTS.md
.agents/skills/generating-cicg-idiom-cards/SKILL.md
.agents/skills/generating-cicg-ur-collaboration-cards/SKILL.md
.agents/skills/registering-cicg-card-assets/SKILL.md

docs/card-prompts/shared/ur-collaboration-master-prompt-v1.md
docs/card-prompts/shared/CICG_UR_Kimetsu_Shinobu_MianLiCangZhen_FullPrompt_v1.0.md

data/cards/card-canvas-profiles.json
data/drive-assets/ur-card-assets-2026-08-08.json
data/drive-assets/ur-kimetsu-review-registration-draft-2026-08-08.json

scripts/card-canvas-profile.mjs
scripts/validate-card-canvas-profiles.mjs
scripts/verify.sh
tests/card-canvas-profile.test.mjs
package.json
```

完整卡尺寸不得分散硬編碼於 React、DOM、亂數流程或圖片模型 Prompt；由 Canvas Profile Registry 與 Renderer 治理。

## 11. TDD 驗收案例

1. `897 × 1752` 新圖卡通過。
2. `1024 × 2000` 新圖卡被拒絕。
3. `1024 × 2000` 舊資產以 `legacy-compatible` 通過。
4. `896 × 1752` 被拒絕。
5. `1794 × 3504` 以 `derivative` 通過。
6. 同一衍生尺寸未標示 `derivative` 時被拒絕。
7. 鬼滅 UR 批次移除舊尺寸阻擋。
8. 正式 UR Registry 序號維持不變。
9. 沒有授權時仍為 `not-approved-for-publication`。
10. 中央插畫規格仍為 `1024 × 1200`。

## 12. 完成條件

- [x] Canvas Profile Registry 已建立。
- [x] `897 × 1752` 已成為唯一新產圖標準。
- [x] `1024 × 2000` 已定義為 legacy-compatible。
- [x] Validator 與永久測試已加入。
- [x] Agent 入口、技能與母提示語已同步。
- [x] 13 張鬼滅 UR Review 草稿已移除尺寸阻擋。
- [x] 正式 UR 序號變更量維持零。
- [ ] 最新 Primary CI 全綠。
- [ ] ChatGPT Audit 完成。
- [ ] GitHub 與實際 Drive 上傳 metadata 完成對帳。

## 13. 不在本次範圍

- IP 正式授權
- 正式 `UR-####` 配號
- 卡面文字錯字重製
- 中央插畫尺寸變更
- 商店宣傳素材尺寸
- 印刷 DPI、出血與色彩模式
- 自動放大或 AI Upscale
