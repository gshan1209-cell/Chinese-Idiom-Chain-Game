# CICG 稀有度外框元件註冊表 v1

狀態：Approved  
規格：`docs/superpowers/specs/2026-08-06-card-rarity-frame-system-amendment.md`

## Geometry

```text
Composite：1024 × 2000 px
Header：360 px
Artwork slot：1200 px
Footer：440 px
```

## Approved visual masters

| rarity | component ID | filename | Drive File ID | SHA-256 | visual role |
|---|---|---|---|---|---|
| N | `frame-n-v1.0-emerald-antique-gold` | `CICG_CardFrame_Rarity_N_v1.0_Approved.png` | `1KO7NHfipw-MlFfYLDaakHuupGjtrwYu8` | `17e6a6798e491ad2bad12b5746e7c3414078e456b83838db2e75aa0a7352ae65` | 深翡翠、古金、克制微光 |
| R | `frame-r-v1.0-frost-blue-steel` | `CICG_CardFrame_Rarity_R_v1.0_Approved.png` | `18AgLp9b1hCrqawfsk5-OxPlmgSt93YGR` | `3620f4408b31055d0e6ea185fa08dd5be13a33687321191035ac0ba30b9fdf2d` | 霜藍、鋼銀、單色藍光 |
| SR | `frame-sr-v1.0-royal-violet` | `CICG_CardFrame_Rarity_SR_v1.0_Approved.png` | `1cZPhfFv483bJAxk0kCBj6XS4V6Vyfx40` | `4976cd5ead7042edc24808183ea2415de1491ddd1d9d95b18d889fb0e95de073` | 皇家紫晶、有限藍紫微光 |
| SSR | `frame-ssr-v2.8-rainbow-neon` | `CICG_CardTemplate_Rarity_SSR_v2.8_Approved.png` | `1_PR-_mZXBkf7WJxXwq83AjaOvWpUJwbz` | `8bf608d7ba64b1efe787b8f6e0939c55a7d7623d5d9a791e5a260a144a9b328e` | 完整虹彩霓虹包框、最高光效 |

## Governed Drive location

四張 current Approved masters 已於 Batch 1 原地搬移至：

```text
02_UI_UX_And_Visuals/
└─ Idiom_Cards/
   └─ 02_Components/
      └─ 01_Card_Frames/
         └─ 20_Approved/
```

Registry key：`idiom-cards.components.card-frames.approved`  
Drive Folder ID：`1RtNhgm93m0EXq3fNJlvuVuIwbWQhL4mj`  
Migration Ledger：`data/drive-assets/migrations/2026-08-07-phase1-batch1-approved-rarity-frames.json`

搬移保留原 Drive File ID、檔名、MIME、size、SHA-256 與 webViewLink；沒有重新上傳或複製第二份 master。

## Renderer contract

- `frameSkinId` 與 `effectOverlayId` 必須獨立於 `artworkAssetId`。
- 外框 master 不能成為 canonical artwork。
- N／R／SR／SSR frame 依卡片 rarity 決定，不依 difficulty 決定。
- 難易度使用獨立 `difficultyBadgeId`，不得被 frame 自動改色。
- SSR 繼續使用 v2.7 傳奇金龍稀有度徽章；v2.8 只新增完整虹彩外框與效果層。
- 更換 frame 或 difficulty 時，artwork ID、版本與 SHA-256 必須保持不變。

## Status note

目前四張檔案是 Approved 視覺 master／組卡參考。正式 renderer 使用前，仍應抽取為可替換 `frame-skin` 與 `effect-overlay`，並保存透明區、safe area、版本與 checksum。
