# 成語圖卡四階稀有度外框視覺系統增補

狀態：Approved  
日期：2026-08-06  
適用範圍：N／R／SR／SSR 成語圖卡的 `frame-skin` 與 `effect-overlay`  
覆寫範圍：只覆寫各稀有度的外框視覺；不改變稀有度語意、難易度、版面座標、注音、拼音、典故或卡池規則。

---

## 1. 目的

建立四階稀有度外框的明確辨識層級，使玩家不必只看左上字母，也能從卡框材質、主色、光效與能量強度辨識 N／R／SR／SSR。

稀有度仍依《成語圖卡稀有度標準設計》判定，外框華麗度不得反向決定稀有度。

---

## 2. 固定幾何

最終 composite 仍遵守 v2.6：

```text
Canvas：1024 × 2000 px
Header：y = 0–359，360 px
Main artwork：y = 360–1559，1200 px
Footer：y = 1560–1999，440 px
```

外框只能包覆卡面邊界與既有裝飾區，不得縮短、侵入或遮擋 1200 px 主圖區、主標、注音、拼音、典故、箴言與來源。

---

## 3. 四階外框標準

### 3.1 N｜深翡翠古金框

元件 ID：`frame-n-v1.0-emerald-antique-gold`

- 主色：深翡翠綠、墨綠、古金。
- 材質：沉穩金屬雕花與低反差暗紋。
- 光效：只允許極細綠色或金色輪廓光，不使用霓虹光帶。
- 視覺定位：基礎收藏、克制、耐看、清楚但不搶主圖。
- 禁止：紫色星雲、完整虹彩、強烈外發光、SSR 金龍輪廓。

### 3.2 R｜霜藍鋼銀框

元件 ID：`frame-r-v1.0-frost-blue-steel`

- 主色：深海藍、霜藍、鋼銀。
- 材質：冷色金屬、冰晶感雕花與細緻藍色能量線。
- 光效：可使用單色藍光，但不得形成完整霓虹包框。
- 視覺定位：比 N 更銳利、專業、有層次。
- 禁止：翡翠綠主框、皇家紫主框、SSR 多色虹彩。

### 3.3 SR｜皇家紫晶框

元件 ID：`frame-sr-v1.0-royal-violet`

- 主色：深紫、紫晶、少量金色。
- 材質：紫晶金屬、皇家雕花與有限度星光。
- 光效：可使用藍紫雙色微光或局部寶石光，但不得包覆整張卡成為多色虹彩。
- 視覺定位：華麗、稀有、具有收藏感，但必須明顯低於 SSR。
- 禁止：完整虹彩外框、SSR 傳奇金龍徽章、紫藍洋紅星雲大面積外溢。

### 3.4 SSR｜傳奇虹彩霓虹框

元件 ID：`frame-ssr-v2.8-rainbow-neon`

- 主色：青藍、紫、洋紅、翠綠的完整虹彩光帶，搭配金色主框。
- 材質：高階金屬、虹彩能量與傳奇級光效。
- 光效：四階中唯一允許完整多色霓虹包框；必須控制亮度，保留主圖與文字可讀性。
- 左上徽章仍使用 v2.7 傳奇級虹彩金龍 SSR 徽章。
- 視覺定位：四階最高、招牌收藏與宣傳主視覺。
- 禁止：把整張 artwork 染成虹彩、讓外框光效遮蓋人物、標題、難易度、典故或箴言。

SSR v2.8 只升級外框與整體光效。v2.7 的 SSR 徽章語意、輪廓、星雲核心與紫色主寶石規則仍然有效。

---

## 4. 難易度元件必須獨立

稀有度外框不得改寫難易度。右上難易度標籤使用獨立元件：

```text
E 入門
D 基礎
C 普通
B 進階
A 困難
S 極限
```

固定規則：

- 難易度標籤放在右上。
- 稀有度徽章放在左上。
- 難易度顏色與字母由 difficulty component 決定，不跟著 rarity frame 自動改色。
- SSR 不代表 A 或 S；N 也可以搭配高難度。

---

## 5. 元件化與來源分離

本規格遵守 modular architecture：

```text
illustration-only artwork
+ frame-skin
+ effect-overlay
+ rarity-badge
+ difficulty-badge
+ structured text data
= derived composite PNG
```

永久 Gate：

- 外框不能烙入 canonical artwork。
- 更換稀有度外框或難易度標籤時，`artworkAssetId`、artwork version 與 artwork SHA-256 必須不變。
- `frame-skin` 與 `effect-overlay` 必須可獨立版本化。
- Approved composite 不能成為唯一 canonical source。
- 目前 Drive 圖像為核准視覺 master／組卡參考；renderer 使用前仍須依元件化規格抽取或重建可替換元件。

---

## 6. Drive 核准證據

標準模板資料夾：

```text
https://drive.google.com/drive/folders/1cH0KYWGvUT5ci57HW8JBFv3v-8uG51IC
```

| rarity | filename | Drive File ID | dimensions | SHA-256 |
|---|---|---|---|---|
| N | `CICG_CardFrame_Rarity_N_v1.0_Approved.png` | `1KO7NHfipw-MlFfYLDaakHuupGjtrwYu8` | `1024 × 2000` | `17e6a6798e491ad2bad12b5746e7c3414078e456b83838db2e75aa0a7352ae65` |
| R | `CICG_CardFrame_Rarity_R_v1.0_Approved.png` | `18AgLp9b1hCrqawfsk5-OxPlmgSt93YGR` | `1024 × 2000` | `3620f4408b31055d0e6ea185fa08dd5be13a33687321191035ac0ba30b9fdf2d` |
| SR | `CICG_CardFrame_Rarity_SR_v1.0_Approved.png` | `1cZPhfFv483bJAxk0kCBj6XS4V6Vyfx40` | `1024 × 2000` | `4976cd5ead7042edc24808183ea2415de1491ddd1d9d95b18d889fb0e95de073` |
| SSR | `CICG_CardTemplate_Rarity_SSR_v2.8_Approved.png` | `1_PR-_mZXBkf7WJxXwq83AjaOvWpUJwbz` | `1024 × 2000` | `8bf608d7ba64b1efe787b8f6e0939c55a7d7623d5d9a791e5a260a144a9b328e` |

N／R／SR v2.7 與 SSR v2.7 保留為歷史 Approved 參考，不再作為新產 composite 的最新外框標準。

---

## 7. 審核 Gate

任一項失敗皆為 Blocking：

- [ ] 稀有度外框與卡片 rarity 一致。
- [ ] 難易度標籤與 rarity frame 完全分離。
- [ ] N 無強烈霓虹或虹彩。
- [ ] R 以霜藍鋼銀為主，未誤用綠框或紫框。
- [ ] SR 以皇家紫晶為主，未使用完整多色虹彩。
- [ ] SSR 使用完整虹彩霓虹框與 v2.7 金龍徽章。
- [ ] 外框未侵入 1200 px artwork 區或遮擋文字。
- [ ] 更換 frame／difficulty 後 artwork ID 與 checksum 不變。
- [ ] Drive File ID、尺寸、版本與 SHA-256 可追溯。

---

## 8. 版本與命名

```text
frame-n-v1.0-emerald-antique-gold
frame-r-v1.0-frost-blue-steel
frame-sr-v1.0-royal-violet
frame-ssr-v2.8-rainbow-neon
```

新產圖卡的 `componentSetVersion` 必須能解析到上述 frame ID。若 renderer 尚未支援，composition 保持 `pending` 或 `blocked`，不得把外框重新烙入 canonical artwork。
