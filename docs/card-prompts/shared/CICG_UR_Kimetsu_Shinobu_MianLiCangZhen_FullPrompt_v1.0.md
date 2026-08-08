# CICG UR 聯名卡完整提示語｜綿裡藏針・蝶柱胡蝶忍

## 使用目的

本文件用於 Chinese-Idiom-Chain-Game 的 UR 聯名設計參考。正式發布仍受 IP 授權 Gate 管制；未提供可稽核 `licenseEvidenceId` 前，只能作為 `approved-design-reference`，不得配置正式 `UR-####`。

成語文字的唯一真實來源為：

```text
data/idioms/review/mian-li-cang-zhen.json
```

本提示語不得覆蓋或反向取代成語內容包。

## A. 中央角色插畫工作流（Canonical Artwork Workflow）

正式聯名模式不得要求圖片模型自行重建受保護角色、官方 Logo 或服裝設定。中央插畫必須使用已核准且可稽核的授權素材與角色設定：

```yaml
artworkMode: licensed-reference-only
requiredInputs:
  - licenseEvidenceId
  - approvedCharacterReferenceAssetId
  - approvedCostumeReferenceAssetId
  - approvedWeaponReferenceAssetId
  - approvedIpLogoAssetId
output:
  width: 1024
  height: 1200
  containsText: false
  containsLogo: false
  containsFrame: false
```

在授權證據缺失時，只能保留現有 Review 圖作設計參考，或改用不帶任何《鬼滅之刃》名稱、Logo、角色相貌與專屬服裝的原創蝴蝶劍士插畫。任何生成插畫都不得包含文字、日文假名、中文、英文字母、Logo、UR 徽章、卡號、主題徽章、典故、箴言、外框或浮水印。

## B. Renderer 固定資料

```yaml
canvasProfile: cicg-card-897x1752-v1
canvas:
  width: 897
  height: 1752
  aspectRatio: 299:584
  dimensionStatus: canonical
layoutVersion: 2.6.1
rarity: UR
ipName: 鬼滅之刃
characterTitle: 蝶柱
characterName: 胡蝶忍
idiomContentPackagePath: data/idioms/review/mian-li-cang-zhen.json
idiomContentStatus: NeedsReview
idiom: 綿裡藏針
bopomofo:
  - ㄇㄧㄢˊ
  - ㄌㄧˇ
  - ㄘㄤˊ
  - ㄓㄣ
spiritSubtitle: 外柔內銳，笑裡藏鋒
themeCategory: 智謀
difficultyBadge: omitted
collaborationLabel:
  top: governed-ip-logo
  middle: 蝶柱
  bottom: 胡蝶忍
allusionTitle: 典故
allusionBody: 元代石君寶《曲江池》第二折以綿絮藏針為喻，描寫柔和表象之下暗藏尖銳力量，後演變為「綿裡藏針」的說法。
allusionSource: 典出：元・石君寶《曲江池》第二折
allusionSourceStatus: verified-dictionary-evidence
motto:
  - 笑裡藏鋒芒
  - 蝶影巡幽夜
  - 柔羽掩寒針
  - 一刃斬魑魎
reviewIdentifier: RV-UR-0002
formalCardNumber: null
licenseEvidenceId: null
lifecycleStatus: approved-design-reference
publicationStatus: not-approved-for-publication
```

## C. 成語內容界線

- `meaning` 是現代釋義，不渲染在 UR Footer 的典故區。
- `allusionBody` 必須來自內容包的 `rendererProjection.allusionBody`。
- `allusionSource` 必須來自內容包的 `rendererProjection.sourceLine`。
- 角色與 IP 劇情不得寫入成語典故。
- 若內容包仍是 `NeedsReview`，本卡只能維持 Review，不得宣稱成語文字已正式校訂。

## D. 版面固定規則

- Canvas Profile：`cicg-card-897x1752-v1`。
- Canvas：897 × 1752 px。
- Header：315 px；Main Artwork：1051 px；Footer：386 px。
- 左上使用核准的立體虹彩金屬 UR 徽章。
- 右上只放 IP Logo、角色稱號與角色姓名；UR 不顯示任何難易度字母或 S 標籤。
- 左下只放核准的「智謀」主題徽章；不得出現「類別」標題、難易度、S、SSR 或其他文字。
- 典故區只顯示「典故」、典故內容與來源，不顯示「本義」。
- 箴言靠下排列，四欄直排、由右至左，每欄 5 個繁體中文字，共 20 字；牌匾尺寸 226 × 176 px。
- 卡面不得顯示招式名稱或型名。
- 正式卡號只由 `data/cards/card-number-registry.json` 提供；無授權時保持空值。
- 圖片模型不得生成完整卡面；正式成品須由 Renderer 合成核准元件與結構化文字。
- 既有 1024 × 2000 完整卡只可保留為 `legacy-compatible`，不得作為新產圖尺寸。

## E. 負面提示語

禁止：錯字、簡體字、日文假名、羅馬拼音、假注音、額外角色、多手指、畸形手部、模糊臉部、裁切武器、低解析度、過度曝光、髒污噪點、文字浮水印、模型自製 Logo、模型自製 UR 徽章、模型自製主題徽章、左下角 S 標籤、右上難易度徽章、招式名稱欄位、橫式箴言、三欄箴言、大面積 Footer 留白。

## F. 本次實際資產狀態

```yaml
sourceFile: /mnt/data/綿裡藏針_蝶柱夜庭秘刃.png
actualWidthPx: 897
actualHeightPx: 1752
canvasProfile: cicg-card-897x1752-v1
aspectRatio: 299:584
dimensionStatus: canonical
sizeBytes: 2955527
sha256: f84b7508353a1c9152cddfd88b21c2b4f82bef6ea0921e185b643dfe1f1599e5
status: approved-design-reference
canonicalRendererOutput: false
blockingReasons:
  - 圖面文字仍由圖片模型生成，必須由正式 Renderer 重建或逐項驗證
  - 成語內容包仍為 NeedsReview
  - 尚無可稽核 IP 授權證據
  - 不得用於正式商業發布或配置 UR-####
```
