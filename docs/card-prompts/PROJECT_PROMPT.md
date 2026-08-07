# Chinese-Idiom-Chain-Game 成語圖卡產製專案提示語

版本：版型 v2.6.1／視覺 v2.7／主題徽章 v1.0／元件化 v1.0  
用途：讓新的 ChatGPT／Agent 對話依 GitHub `main` 接續產製可重組成語圖卡  
Repository：`gshan1209-cell/Chinese-Idiom-Chain-Game`  
Google Drive：`04_Products/Chinese-Idiom-Chain-Game`

---

## 1. 任務定位

延續既有 Chinese-Idiom-Chain-Game 圖卡系統，不重新設計卡牌制度，也不依賴舊聊天直接產圖。

新圖卡固定採 modular workflow：

```text
illustration-only artwork
+ current Approved components
+ structured card data
+ deterministic v2.6.1 render plan
= Review／Approved composite PNG
```

不得順便修改主玩法、關卡、進度 Schema、付款或其他無關 production code。

---

## 2. 每次新聊天與產圖前必做

先同步 GitHub 最新 `main`：

```bash
git fetch origin
git checkout main
git pull --ff-only origin main
git status
git log --oneline -10
```

檢查 Open PR、Issue、GitHub Actions，以及 GitHub／Drive 是否漂移。

依序讀取：

```text
1. AGENTS.md
2. .agents/skills/generating-cicg-idiom-cards/SKILL.md
3. docs/card-prompts/state/current-batch.json
4. docs/superpowers/specs/2026-08-07-idiom-card-standard-v2-6-design.md
5. docs/superpowers/specs/2026-08-07-idiom-card-layout-lock-v2-6-1-design.md
6. data/cards/theme-badge-registry.json
7. data/drive-assets/idiom-card-assets.json
8. docs/card-prompts/components/rarity-frame-registry-v1.md
9. docs/card-prompts/shared/card-master-prompt.md
10. docs/card-prompts/shared/negative-constraints.md
11. docs/card-prompts/manifest.md
12. Drive 最新 Approved artwork、component、template 與 Review 素材
```

`docs/superpowers/specs/2026-08-07-idiom-card-layout-lock-v2-6-1-design.md` 是 current geometry contract。發生畫布、區域高度、元件座標、裁切、圖層或 SSR overlay 衝突時，以 v2.6.1 為準。

真實狀態優先序：

```text
GitHub main
→ GitHub Actions
→ Repository 規格、Registry 與 state
→ Drive current Approved master
→ Manifest 與審核證據
→ 聊天紀錄與舊圖
```

---

## 3. v2.6.1 固定畫布與三區

Canonical composite 永遠是：

```text
Canvas       x=0, y=0,    width=1024, height=2000
Header       x=0, y=0,    width=1024, height=360
Main Artwork x=0, y=360,  width=1024, height=1200
Footer       x=0, y=1560, width=1024, height=440
格式：PNG
```

任何稀有度均不得改變 `360／1200／440` 三區高度。預覽可以等比例縮放整張卡，但 canonical 輸出不得改變長寬比或分別拉伸。

### 3.1 Header Bounding Box

```text
rarity badge x=24–252,   y=18–326
四字主標題   x=250–788,  y=42–158
四組注音     x=278–756,  y=166–232
白話副標     x=258–782,  y=254–330
difficulty   x=792–1000, y=24–318
```

- 主標題固定四字、單行、水平置中。
- 注音固定四組逐字對齊的臺灣注音。
- 漢語拼音可留在資料層，但不得顯示於卡面。
- 白話副標固定單行；過長時修改文案，不得增高 Header。
- 難易度徽章使用 current Approved 元件，所有代碼共用相同 Bounding Box，不得因稀有度重新著色。

### 3.2 Main Artwork

```text
source width  = 1024
source height = 1200
render x      = 0
render y      = 360
object-fit    = cover
object-position = center
preserveAspectRatio = true
```

人物與主要動作安全區：

```text
x = 96–928
y = 430–1390
重要頭部不得進入 y < 420
重要手部、武器或道具不得進入 y > 1470
```

圖片模型只能生成 1024 × 1200 px 的無文字 artwork。

不得讓圖片模型生成完整卡面。

Artwork 禁止包含卡框、稀有度、難易度、標題、注音、拼音、副標、主題徽章、典故、箴言、來源、Logo、浮水印或既有商業 IP 標誌。

### 3.3 Footer Bounding Box

```text
九大主題徽章 x=28–300,  y=1576–1920
典故區         x=286–724, y=1582–1920
箴言牌匾       x=730–988, y=1570–1922
典故來源列     x=178–846, y=1936–1986
```

- 主題徽章只能等比例縮放，不得裁切、拉伸、換色或重畫。
- 典故標題固定為「典故」，內文最多四行；過長時精簡文案。
- 箴言牌匾固定右下窄版深色金框、三欄直式、由右至左閱讀。
- 來源列固定最底部單行，不得換行。
- Footer 任何元件不得進入 `y < 1560`。

所有元件的 geometry 容許誤差最多 `±2 px`；超出即為 Blocking failure。

---

## 4. SSR 稀有度徽章與霓虹外框

SSR 必須同時使用：

1. v2.7 傳奇級虹彩金龍稀有度徽章。
2. v2.8 青藍、紫、洋紅、翠綠全框虹彩霓虹 overlay。
3. 英雄姿態、宏大場景、電影式構圖與高強度傳奇光效的中央 artwork。

SSR neon overlay 不得改變幾何、縮放內容或觸發 reflow。

SSR overlay 固定：

```text
x = 0
y = 0
width = 1024
height = 2000
layer = top overlay
```

- 霓虹光效向內延伸不得超過 `20 px`。
- 不得改變 Header、Main Artwork、Footer 或任何元件座標。
- 不得為霓虹框縮小內容或增加畫布高度。
- 不得全面染色 difficulty、theme badge、典故區或箴言牌匾。
- N／R／SR 不得使用 SSR 徽章或完整多色霓虹外框。

---

## 5. 九大主題徽章

左下類別只能由：

```text
data/cards/theme-badge-registry.json
```

解析以下九類：

```text
military        軍事
governance      內政
strategy        智謀
arts            文藝
perseverance    勵志
selfCultivation 修身
relationships   人際
cautionary      警世
perspective     見識
```

- `themeCategoryLabel` 與 `themeBadgeAssetId` 必須由 Registry 解析。
- `secondaryThemeTags` 只供管理與搜尋，不得顯示於卡面。
- 同一類別永遠使用同一枚 current Approved 母件。
- 圖片模型不得生成、改色或重畫主題徽章。

---

## 6. 固定圖層順序

Renderer 必須使用可重現的固定順序：

```text
01 background / panel base
02 canonical artwork
03 rarity frame skin
04 Header / Footer structural panels
05 rarity badge
06 difficulty badge
07 theme badge
08 title / Zhuyin / subtitle
09 allusion / motto / source
10 approved edge highlights
11 SSR neon overlay（僅 SSR，最上層）
```

只有第 02 層可以由圖片模型產生。其他層必須由 renderer 使用 Approved 資產與結構化資料合成。

相同資料、Asset ID 與 renderer 版本，輸出的 geometry manifest 必須完全一致。

---

## 7. 產圖前結構化資料

每張卡至少保存：

```text
idiom
bopomofo[4]
pinyin[4]（資料層，可供搜尋或語音，不渲染）
subtitle
rarity
rarityReason
difficultyCode
difficultyLabel
themeCategory
themeCategoryLabel
themeBadgeAssetId
secondaryThemeTags
allusionSummary
source
sourceStatus
motto
primaryVisualLead
characterAction
historicalSetting
renderMode = modular
layoutVersion = 2.6.1
componentSetVersion
artworkAssetId
artworkFilename
compositeFilename
artworkStatus
compositionStatus
```

來源、注音、稀有度理由或權利尚未校訂時標記 `NeedsReview`；只能產 Review artwork，不得宣稱 Approved。

---

## 8. 正式產製流程

```text
讀取 GitHub main 與 current state
→ 校訂內容與九大類別
→ 驗證 rarity／difficulty／themeCategory／gender quota
→ 生成 illustration-only artwork
→ 驗證 1024 × 1200 與 safe crop
→ 上傳 Drive Inbox 並登錄 File ID／SHA-256
→ renderer 依 v2.6.1 固定座標組成 Review composite
→ 驗證 1024 × 2000、geometry manifest、文字與元件
→ 獨立人工核准
→ 移入 Approved 並更新 Registry／Manifest／state
```

Renderer 尚未完成時：

- 可以先產 illustration-only artwork。
- `compositionStatus` 設為 `pending` 或 `blocked`。
- 不得退回用圖片模型直接生成完整卡面。
- 臨時 flat preview 只能視為不合格或 Review derivative，不能成為 canonical source。

---

## 9. 審核 Gate

### Artwork

- [ ] 恰為 `1024 × 1200 px`，或通過明確 safe-crop 驗證
- [ ] 無卡框、正式文字、徽章或 UI
- [ ] 至少一名人物以動作表達成語
- [ ] 無人體重大錯誤、時代矛盾、未授權 IP、Logo 或浮水印
- [ ] File ID、SHA-256、版本與狀態可追溯

### Composition

- [ ] 恰為 `1024 × 2000 px`
- [ ] Header／Artwork／Footer 固定為 `360／1200／440`
- [ ] 所有 Bounding Box 誤差不超過 `±2 px`
- [ ] 只顯示注音，不顯示拼音或羅馬字
- [ ] difficulty 與 rarity 分離且套用正確 Approved 元件
- [ ] theme badge 與 Registry 類別／Asset ID 完全一致
- [ ] SSR 使用正確金龍徽章、全框霓虹 overlay，且沒有 reflow
- [ ] 典故、箴言與來源沒有溢出、遮擋或換行錯誤
- [ ] 更換 difficulty／rarity／theme badge 後 artwork ID 與 checksum 不變

任一 Blocking Gate 失敗，不得 Approved。

---

## 10. Drive、版本與完成回報

- Artwork、component 與 composite 必須逐檔保存，不得只提供壓縮檔。
- 不得覆蓋已發布版本。
- Artwork 與 composite 使用不同 Drive File ID、SHA-256 與狀態欄位。
- Review、Rejected、Deprecated、來源未校訂或權利不清的卡不得進入正式卡池。
- 產製 Agent 不得自行最終核准。
- 每次批次建立、產圖、修正、核准、上傳或狀態改變後，更新 `docs/card-prompts/state/current-batch.json` 與 Manifest。

每批完成回報必須包含：

- 批次 ID 與成語清單
- `layoutVersion = 2.6.1`
- render mode、component set
- artwork／composition 狀態
- artwork／composite 檔名與實際尺寸
- Drive File ID 與 SHA-256
- 注音、來源、類別、稀有度與 SSR overlay 審核狀態
- Manifest／state 更新 commit
- findings 與下一步

沒有真實 Repository、Drive、CI 或 checksum 證據時，不得宣稱完整交付。
