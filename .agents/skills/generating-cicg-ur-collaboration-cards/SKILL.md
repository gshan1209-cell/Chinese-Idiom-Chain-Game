---
name: generating-cicg-ur-collaboration-cards
description: Use when a Chinese-Idiom-Chain-Game request names an external IP and character and asks to generate, continue, repair, review, or compose a UR collaboration idiom card.
---

# Generating CICG UR Collaboration Cards

## 路由契約

本技能專用於外部 IP 聯名角色的 UR 成語卡，一次處理一位角色與一個四字成語。
必填輸入只有 IP 名稱與角色正式名稱；其餘能由受治理資料解析的欄位不得反問使用者。
未指定成語時自動依角色核心性格、價值觀、重大選擇、成長歷程與代表行動挑選最貼合的四字成語。

圖片模型只產生中央插畫，不得生成完整卡面。完整卡面必須由 Renderer、結構化資料與已核准元件組裝。

## 開始前必讀

1. `AGENTS.md`
2. `.agents/skills/generating-cicg-idiom-cards/SKILL.md`
3. `.agents/skills/generating-cicg-idiom-cards/references/required-specs.md`
4. `docs/card-prompts/state/current-batch.json`
5. `docs/superpowers/specs/2026-08-07-idiom-card-standard-v2-6-design.md`
6. `docs/superpowers/specs/2026-08-07-idiom-card-layout-lock-v2-6-1-design.md`
7. `docs/superpowers/specs/2026-08-08-ur-collaboration-card-standard-v1-0-design.md`
8. `docs/superpowers/specs/2026-08-08-ur-collaboration-generation-skill-and-zhuyin-gate-design.md`
9. `docs/superpowers/specs/2026-08-08-project-wide-four-digit-card-numbering-design.md`
10. `docs/card-prompts/shared/ur-collaboration-master-prompt-v1.md`
11. `data/idioms/idiom-content-package.schema.json`
12. `data/card-variants/card-variant.schema.json`
13. `data/cards/card-number-registry.json`
14. `data/cards/theme-badge-registry.json`
15. `data/drive-assets/idiom-card-assets.json`
16. 對應成語內容包、聯名覆寫、Card Catalog、Manifest、授權與 Drive 證據

Repository、Registry、Catalog、Manifest、Drive 或授權證據衝突時，停止 Approved、發布與完成宣稱；不得從聊天記憶、扁平 PNG 或模型生成文字反推正式資料。

## 輸入

必填：

```text
ipName
characterName
```

選填：

```text
characterTitle
idiom
licenseEvidenceId
existingCardId
existingArtworkAssetId
existingCollaborationLabelAssetId
existingIpLogoAssetId
existingCardNumberPlaqueAssetId
```

## 共用成語與聯名覆寫邊界

一般卡與聯名卡共用：

```text
data/idioms/<status>/<slug>.json
```

共用成語內容包是注音、釋義、典故、來源、例句、主題、難度、SR／SSR 基礎稀有度、一般副標與一般箴言的唯一真實來源。

IP 專屬內容只放在：

```text
data/card-variants/<status>/<ip>/<slug>.json
```

聯名覆寫只保存角色核心、主要招式、專屬副標、專屬五言四句與卡面演出；不得重複定義成語釋義、典故或來源。

## 角色成語選擇

未指定成語時依下列順序自動選擇：

1. 角色最穩定且最具辨識度的核心性格。
2. 面對危機時的重大選擇與行動。
3. 成長歷程與克服的弱點。
4. 代表招式只負責視覺演出，不反向決定成語。
5. 成語恰好四個繁體漢字，且有可靠來源或明確維持 `NeedsReview`。
6. 不受現有庫存限制，但成語本體須達 SR 或 SSR 水準；UR 只屬聯名變體。
7. 保留成語自己的典故、來源、難度與主題，不得改寫成角色劇情。

人氣、戰力、服裝顏色或畫面華麗度不能單獨作為選詞理由。

## 授權與發布 Gate

沒有可稽核授權時只能維持 Review，不得標記 Approved、公開發布、商用或移入 Drive Approved。
沒有可稽核的 `licenseEvidenceId` 時不得指派或消耗正式 `UR-####`。
UR 不得進入里程碑獎勵卡池、一般抽卡卡池或正式收藏卡池，直到授權與 Registry Gate 全部通過。

作品名稱、公開圖片、聊天核准、模型生成圖或使用者提供參考圖都不是授權證據。

## 專案級四碼卡號契約

正式卡號唯一來源：

```text
data/cards/card-number-registry.json
```

正式格式為四碼／four-digit `UR-####`。Renderer 必須在 bottom-center 放置唯一 `card-number-plaque = {{CARD_NUMBER}}`，其中 `cardNumber` 只能取自 Registry。
Review identifier 可使用 `RV-UR-####` 或 `UR-REVIEW-####`，但不得消耗正式序列或冒充正式卡號。
圖片模型不得生成、猜測、重畫或修補卡號。

## 臺灣注音 Gate

圖片模型不得生成主標題、注音或卡號。Renderer 必須直接使用已驗證的 `bopomofo[4]` 結構化文字。
注音必須恰好四筆非空資料並與四字成語逐字對齊。
字型缺字或字型覆蓋不完整均屬 Blocking failure，Renderer 不得以圖片模型、OCR 或人工目測猜測補字。

每筆只允許：

```text
Bopomofo U+3105–U+312F
Tone marks U+02D9 U+02CA U+02C7 U+02CB
```

禁止平假名、片假名、片假名擴充、半形片假名、漢語拼音、羅馬字、漢字、近似假字、缺字與亂碼。

Finding codes：

```text
japanese-kana-in-bopomofo
invalid-bopomofo
```

任何失敗都必須設為 `changes-requested` 或 `blocked`，不得進入 Approved。

## 中央插畫

```text
1024 × 1200 px
single primary character
character action + setting + props + effects
no text
no frame
no UR badge
no collaboration label
no IP Logo
no theme badge
no allusion
no motto
no source
no card number
no watermark
```

角色必須以清楚行動表現成語精神。保留臉部、雙手、主要武器、右上聯名標籤安全區與 Footer 裁切安全區。官方招式名稱可作資料欄位，但卡面演出必須重新構圖，不照搬動畫截圖或官方構圖。

## UR 組裝幾何

```text
Canvas       1024 × 2000
Header       y=0–359, height=360
Main Artwork y=360–1559, height=1200
Footer       y=1560–1999, height=440
Geometry tolerance ±2 px
```

Header：

```text
UR badge           x=24–252,   y=18–326
idiom title        x=250–788,  y=42–158
bopomofo[4]        x=278–756,  y=166–232
spirit subtitle    x=258–782,  y=254–330
collaboration tag  x=792–1000, y=24–318
```

UR 不顯示難度徽章。右上聯名標籤使用受治理 IP Logo、角色職稱與正式名稱，不得顯示「聯名卡」「角色名」「聯名限定」或「限定版」。

使用 current Approved 虹彩霓虹 Overlay 與立體虹彩金屬 UR 徽章。圖片模型不得重畫外框、徽章、Logo、標籤或主題徽章。

Footer：

```text
theme badge         x=28–300,  y=1576–1920, width=272, height=344
allusion panel      x=286–724, y=1582–1920, width=438, height=338
motto plaque        x=730–988, y=1722–1922, width=258, height=200
source line         x=178–398, y=1936–1986, width=220, height=50
card-number-plaque  x=410–614, y=1936–1986, width=204, height=50, bottom-center
```

典故區只顯示「典故」、成語自己的卡面短版典故與來源。不得顯示本義段落，也不得把角色劇情當成語典故。
箴言固定四欄直式、由右至左，每句五個繁體漢字，共二十字；不加行內標點，不得使用三欄、橫排或大面積留白。

## 組裝責任

Renderer 負責四字成語、`bopomofo[4]`、精神副標、UR 徽章與 Overlay、IP Logo 與聯名標籤、Registry 主題徽章、共用成語典故與來源、角色專屬五言四句，以及唯一 bottom-center card-number-plaque。

Renderer、字型、Registry、元件或證據不可用時，保持 pending／blocked；不得退回模型生成完整卡面。

## Review 與狀態

產製 Agent 可建立 Review 素材，但不得自行核准自己的輸出。依實際結果更新：

- `docs/card-prompts/state/current-batch.json`
- `docs/card-prompts/manifest.md`
- `data/cards/card-number-registry.json`，僅限合法正式指派或退役
- 共用成語內容包與聯名覆寫
- Card Catalog 與 Drive Asset Manifest

只記錄真實值：Review identifier／正式卡號、Asset ID、Drive File ID、尺寸、SHA-256、來源、授權與 findings。

## 完成回報

回報 IP、角色職稱與正式名稱、成語與配對理由、四筆注音與 Gate、主題與徽章 Asset ID、典故來源狀態、五言四句、Logo／標籤狀態、Review identifier 或正式卡號、Artwork／Composite 尺寸、Drive ID、SHA-256、Registry／Manifest commit、阻擋事項與下一步。

沒有證據的欄位不得宣稱完成。
