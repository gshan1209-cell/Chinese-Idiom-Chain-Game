# CICG UR 聯名卡完整提示語｜綿裡藏針・蝶柱胡蝶忍

## 使用目的

本文件用於 Chinese-Idiom-Chain-Game 的 UR 聯名設計參考。正式發布仍受 IP 授權 Gate 管制；未提供可稽核 `licenseEvidenceId` 前，只能作為 `approved-design-reference`，不得配置正式 `UR-####`。

## A. 中央角色插畫提示語（Canonical Artwork Prompt）

製作一張 1024 × 1200 px、無文字、無 UI、無卡框的高質感日韓動漫手遊插畫。主角為《鬼滅之刃》蝶柱胡蝶忍，單一主要角色，正面至四分之三身構圖，紫色眼睛，黑紫漸層髮色，蝴蝶髮飾，穿著蝶翼紋羽織與鬼殺隊制服。角色神情溫柔平靜，但眼神具有銳利決斷感，呈現「外柔內剛、笑裡藏鋒」的氣質。

場景為月夜紫藤庭園與日式宅邸，背景有滿月、紫藤花串、柔霧、石燈籠、飛舞蝴蝶與紫粉色光粒。角色握持細長日輪刀，刀身帶紫色毒霧與細緻能量軌跡，姿勢優雅而具威脅感。整體使用深紫、靛藍、桃紅、青綠與金色點綴，光影精緻、景深明確、人物臉部與雙手清晰，衣料與金屬質感細膩，具有頂級角色卡插畫完成度。

構圖須保留上方標題安全區、右上聯名標籤安全區與下方 Footer 裁切安全區。不可出現文字、日文假名、中文、英文字母、Logo、UR 徽章、卡號、主題徽章、典故、箴言、外框或浮水印。

## B. Renderer 固定資料

```yaml
canvas:
  width: 1024
  height: 2000
layoutVersion: 2.6.1
rarity: UR
ipName: 鬼滅之刃
characterTitle: 蝶柱
characterName: 胡蝶忍
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
allusionBody: 比喻外表柔和，內心卻銳利剛強；亦指柔和言行中暗藏警策或鋒芒。
allusionSource: 元・石君寶《曲江池》
motto:
  - 笑裡藏鋒芒
  - 蝶影巡幽夜
  - 柔羽掩寒針
  - 一刃斬魑魎
reviewIdentifier: null
formalCardNumber: null
licenseEvidenceId: null
lifecycleStatus: approved-design-reference
publicationStatus: not-approved-for-publication
```

## C. 版面固定規則

- Canvas：1024 × 2000 px。
- Header：360 px；Main Artwork：1200 px；Footer：440 px。
- 左上使用核准的立體虹彩金屬 UR 徽章。
- 右上只放 IP Logo、角色稱號與角色姓名；UR 不顯示任何難易度字母或 S 標籤。
- 左下只放核准的「智謀」主題徽章；不得出現「類別」標題、難易度、S、SSR 或其他文字。
- 典故區只顯示「典故」、典故內容與來源，不顯示「本義」。
- 箴言為四欄直排、由右至左，每欄 5 個繁體中文字，共 20 字；牌匾尺寸 258 × 200 px。
- 正式卡號只由 `data/cards/card-number-registry.json` 提供；無授權時保持空值。
- 圖片模型不得生成完整卡面；正式成品須由 Renderer 合成核准元件與結構化文字。

## D. 負面提示語

禁止：錯字、簡體字、日文假名、羅馬拼音、假注音、額外角色、多手指、畸形手部、模糊臉部、裁切武器、低解析度、過度曝光、髒污噪點、文字浮水印、模型自製 Logo、模型自製 UR 徽章、模型自製主題徽章、左下角 S 標籤、右上難易度徽章、橫式箴言、三欄箴言、大面積 Footer 留白。

## E. 本次實際資產狀態

```yaml
sourceFile: /mnt/data/imagegen.png
actualWidthPx: 897
actualHeightPx: 1752
sizeBytes: 2984122
sha256: 63aadecb7903e4946b6437558f59245caad2399ef8553f3f3780e226ca5a0752
status: approved-design-reference
canonicalRendererOutput: false
blockingReasons:
  - 實際尺寸不是 1024 × 2000
  - 尚無可稽核 IP 授權證據
  - 不得用於正式商業發布或配置 UR-####
```
