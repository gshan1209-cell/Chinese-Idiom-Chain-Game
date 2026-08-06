# 成語圖卡四階稀有度外框交付紀錄

日期：2026-08-06  
狀態：Approved visual masters uploaded；GitHub docs pending PR merge

## 核准內容

- N：深翡翠古金框
- R：霜藍鋼銀框
- SR：皇家紫晶框
- SSR：v2.8 完整多色虹彩霓虹框
- SSR 左上徽章仍使用 v2.7 傳奇級虹彩金龍標準
- 難易度元件與 rarity frame 完全分離

## 固定尺寸

```text
Canvas：1024 × 2000 px
Header：360 px
Artwork：1200 px
Footer：440 px
```

## Drive 證據

目標資料夾：`1cH0KYWGvUT5ci57HW8JBFv3v-8uG51IC`

| rarity | filename | Drive File ID | size bytes | SHA-256 |
|---|---|---|---:|---|
| N | `CICG_CardFrame_Rarity_N_v1.0_Approved.png` | `1KO7NHfipw-MlFfYLDaakHuupGjtrwYu8` | 2,285,281 | `17e6a6798e491ad2bad12b5746e7c3414078e456b83838db2e75aa0a7352ae65` |
| R | `CICG_CardFrame_Rarity_R_v1.0_Approved.png` | `18AgLp9b1hCrqawfsk5-OxPlmgSt93YGR` | 2,191,391 | `3620f4408b31055d0e6ea185fa08dd5be13a33687321191035ac0ba30b9fdf2d` |
| SR | `CICG_CardFrame_Rarity_SR_v1.0_Approved.png` | `1cZPhfFv483bJAxk0kCBj6XS4V6Vyfx40` | 2,454,266 | `4976cd5ead7042edc24808183ea2415de1491ddd1d9d95b18d889fb0e95de073` |
| SSR | `CICG_CardTemplate_Rarity_SSR_v2.8_Approved.png` | `1_PR-_mZXBkf7WJxXwq83AjaOvWpUJwbz` | 3,480,599 | `8bf608d7ba64b1efe787b8f6e0939c55a7d7623d5d9a791e5a260a144a9b328e` |

## GitHub 文件

- `docs/superpowers/specs/2026-08-06-card-rarity-frame-system-amendment.md`
- `docs/card-prompts/components/rarity-frame-registry-v1.md`
- `docs/superpowers/specs/README.md`
- `.agents/skills/generating-cicg-idiom-cards/references/required-specs.md`
- `AGENTS.md`

## 後續工程

本批交付的是 Approved visual master／組卡參考。正式 renderer 仍應將 frame 與 effect overlay 抽取為可替換元件，並以測試驗證：

- rarity 只解析對應 frame ID
- difficulty badge 不被 rarity 自動改色
- 更換 frame 後 artwork ID 與 checksum 不變
- N／R／SR 不會取得 SSR 完整虹彩包框
- SSR 保留 v2.7 金龍徽章並使用 v2.8 虹彩外框
