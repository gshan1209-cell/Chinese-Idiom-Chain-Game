# CICG 圖卡尺寸標準變更規格 v1.0

- **專案：** Chinese-Idiom-Chain-Game
- **文件狀態：** 設計已核准，待 Repository 實作
- **規格版本：** v1.0
- **適用範圍：** 完整成語圖卡 Composite、卡牌模板、Renderer 輸出與資產註冊
- **不適用範圍：** 中央插畫原圖、商店宣傳圖、印刷輸出與影片素材

---

## 1. 變更決策

CICG 完整直式圖卡的唯一現行標準尺寸調整為：

```text
Width：897 px
Height：1752 px
Aspect Ratio：299:584
```

新建的完整圖卡、模板、Renderer 輸出與資產註冊，全部以 `897 × 1752` 為標準。

原有 `1024 × 2000` 圖卡不作廢，但降為：

```text
legacy-compatible
```

不得再將 `1024 × 2000` 作為新產圖的預設尺寸。

---

## 2. 設計理由

1. 現行圖像生成流程穩定輸出 `897 × 1752`。
2. 將真實輸出升級為標準，可消除規格與實際資產長期漂移。
3. `897 × 1752` 與舊尺寸的視覺比例極為接近，比例差異約 `0.0027%`。
4. 新標準可直接用於目前 UR Review 圖卡，不再僅因尺寸被判定不合格。
5. 既有高解析資產不需強制重製，避免無效返工與畫質損失。

---

## 3. 尺寸 Profile

### 3.1 現行標準

```json
{
  "profileId": "cicg-card-897x1752-v1",
  "widthPx": 897,
  "heightPx": 1752,
  "aspectRatio": "299:584",
  "status": "canonical"
}
```

### 3.2 舊版相容

```json
{
  "profileId": "cicg-card-1024x2000-legacy-v1",
  "widthPx": 1024,
  "heightPx": 2000,
  "status": "legacy-compatible",
  "newProductionAllowed": false
}
```

### 3.3 高解析衍生版本

需要高解析匯出時，應使用新標準的整數倍數，避免產生新的比例分支：

```text
2×：1794 × 3504
3×：2691 × 5256
```

這些尺寸只能標記為 `derivative`，不能取代主要標準。

---

## 4. Canonical 判定規則

完整圖卡只有同時通過以下條件，才可標記為 Canonical：

1. 尺寸恰好為 `897 × 1752`。
2. 文字由正式 Renderer 組裝，而非由圖片模型直接生成。
3. 成語、注音、典故、來源、標籤與卡號均來自結構化資料。
4. 模板、外框與元件版本均為目前核准版本。
5. 資產 SHA-256、檔案大小、MIME 與 Drive File ID 已完成驗證。
6. UR 卡必須通過授權與正式卡號 Gate，才可進入公開發布狀態。

尺寸符合不等於內容、授權與發布已核准。

---

## 5. 資產註冊欄位

完整圖卡資產紀錄新增或統一使用：

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

舊圖卡使用：

```json
{
  "canvasProfile": "cicg-card-1024x2000-legacy-v1",
  "widthPx": 1024,
  "heightPx": 2000,
  "dimensionStatus": "legacy-compatible",
  "sourceCanvasProfile": null
}
```

衍生圖使用：

```json
{
  "canvasProfile": "cicg-card-897x1752-v1",
  "dimensionStatus": "derivative",
  "sourceCanvasProfile": "cicg-card-897x1752-v1"
}
```

---

## 6. 驗證規則

### 新資產

新建完整圖卡必須精確符合：

```text
897 × 1752
```

以下尺寸均應被新資產 Gate 拒絕：

```text
896 × 1752
897 × 1751
898 × 1752
1024 × 2000
```

### 舊資產

`1024 × 2000` 只有在符合以下條件時可保留：

```text
dimensionStatus = legacy-compatible
newProductionAllowed = false
```

不得透過寬鬆容差，將任意近似尺寸視為 Canonical。

### 衍生資產

僅接受 `897 × 1752` 的整數倍數，且必須標記為 `derivative`。

---

## 7. 版面與座標處理

本規格只改變完整畫布尺寸，不重新定義卡面內容結構。

以下規則維持現有核准模板：

- UR 標誌位置
- 成語主標題與注音
- 聯名角色標籤
- 左下角單一主題類別標籤
- 典故與來源區
- 箴言區靠下
- 底部中央 Review／正式卡號牌匾

現有以 `1024 × 2000` 為基礎的像素座標，不得直接硬編碼沿用。  
Renderer 應改讀新尺寸的 Design Tokens，或依新 Profile 重新建立座標。

禁止在 React、DOM 或圖片模型 Prompt 中分散寫死尺寸。

---

## 8. 既有資產遷移

### 8.1 `897 × 1752` 圖卡

目前已產生的 `897 × 1752` 圖卡：

- 移除「尺寸不符 1024 × 2000」阻擋原因。
- `dimensionStatus` 改為 `canonical-dimension`。
- 不會因此自動升級為正式 Approved。
- 仍須保留文字校訂、Renderer 重建、授權與發布 Gate。

### 8.2 `1024 × 2000` 圖卡

- 保留原檔，不強制縮圖。
- 登記為 `legacy-compatible`。
- 可繼續作為歷史模板、備份或核准資產。
- 新批次不得再以該尺寸輸出。

### 8.3 不符合兩種尺寸的資產

- 維持 `review`、`quarantined` 或 `noncanonical`。
- 不因比例接近而自動放行。
- 需要正式使用時，應由 Renderer 依新 Profile 重建。

---

## 9. 本批鬼滅 UR 圖卡影響

13 張 `897 × 1752` Review 圖卡完成規格更新後：

```text
dimensionStatus：canonical-dimension
canonicalRendererOutput：仍為 false
publicationStatus：not-approved-for-publication
formalCardNumber：null
```

尺寸阻擋會解除，但以下阻擋仍存在：

1. 圖片模型生成的文字尚未全面由 Renderer 取代。
2. 部分成語、注音、典故或來源仍需校訂。
3. `RV-UR-0009` 圖面顯示「豪氣千雲」，應修正為「豪氣干雲」。
4. 尚無可稽核的 IP 授權證據。
5. 不得分配或消耗正式 `UR-####`。

---

## 10. Repository 受影響範圍

實作時至少檢查與更新：

```text
AGENTS.md

.agents/skills/generating-cicg-idiom-cards/SKILL.md
.agents/skills/generating-cicg-ur-collaboration-cards/SKILL.md
.agents/skills/registering-cicg-card-assets/SKILL.md

docs/card-prompts/shared/ur-collaboration-master-prompt-v1.md
docs/superpowers/specs/
docs/superpowers/plans/

data/drive-assets/
data/cards/
data/card-variants/
docs/card-prompts/state/current-batch.json

scripts/validate-*.mjs
tests/*card*.test.mjs
tests/*asset*.test.mjs
```

不得只修改單一提示語或單一 JSON，必須同步更新文件、資料、驗證器與測試。

---

## 11. TDD 驗收案例

實作前先建立失敗測試：

1. `897 × 1752` 新圖卡通過尺寸 Gate。
2. `1024 × 2000` 新圖卡被拒絕。
3. `1024 × 2000` 舊資產在 `legacy-compatible` 狀態下通過。
4. `896 × 1752` 被拒絕。
5. `1794 × 3504` 在 `derivative` 狀態下通過。
6. `1794 × 3504` 未標記 `derivative` 時被拒絕。
7. 現有鬼滅 UR 註冊草稿移除舊尺寸阻擋。
8. 尺寸變更不得修改 UR 正式序號。
9. 沒有授權證據時，發布狀態仍必須是 `not-approved-for-publication`。

---

## 12. 完成條件

尺寸標準變更完成須同時符合：

- [ ] 所有現行規格文件以 `897 × 1752` 為唯一新產圖標準。
- [ ] 舊 `1024 × 2000` 資產被標記為 `legacy-compatible`。
- [ ] Validator 與永久測試已更新。
- [ ] 產圖 Prompt、模板與註冊技能沒有舊尺寸殘留。
- [ ] 13 張鬼滅 UR 圖卡已移除尺寸不符阻擋。
- [ ] 正式 UR Registry 的 `assignedCount` 與 `nextSequence` 未被改動。
- [ ] TypeScript、ESLint、Build、PWA、npm audit 與完整 CI 全綠。
- [ ] GitHub 與 Drive 的尺寸 metadata 一致。

---

## 13. 不在本次範圍

本次不處理：

- IP 正式授權
- 正式 `UR-####` 配號
- 卡面文字錯字重製
- 中央插畫尺寸
- 商店宣傳素材尺寸
- 印刷 DPI、出血與色彩模式
- 自動放大或 AI Upscale
