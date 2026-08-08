---
name: generating-cicg-idiom-cards
description: Use when a Chinese-Idiom-Chain-Game project chat needs to generate, continue, review, repair, compose, export, approve, upload, or plan an idiom-card batch.
---

# Generating CICG Idiom Cards

## Overview

Use GitHub `main` and the batch-state file as the continuity layer. New cards use modular sources: illustration-only artwork, versioned components, structured data, and a derived composite. Never rely on chat memory or a flat PNG alone.

## Start Here

1. Read `AGENTS.md`.
2. Read `references/required-specs.md`.
3. Read `docs/card-prompts/state/current-batch.json`.
4. Read `data/cards/theme-badge-registry.json`.
5. Read `data/drive-assets/idiom-card-assets.json`.
6. Read the matching rarity template, idiom prompt, Manifest, and available Drive evidence.

If Repository files cannot be read, state that the continuation source is unavailable. Do not guess the previous batch.

## UR Collaboration Routing

When the request names an external IP and character, asks for rarity UR, or continues an existing UR collaboration card, read and use:

```text
.agents/skills/generating-cicg-ur-collaboration-cards/SKILL.md
```

The dedicated UR skill accepts IP and character as the only required user inputs, selects or validates the idiom, resolves the original difficulty and theme, enforces the license Gate, and preserves the v2.6.1 modular workflow.

圖片模型不得生成主標題或注音。Renderer 必須直接使用已驗證的 `bopomofo[4]` 文字節點。

注音必須恰好四筆並與四字成語逐字對齊；平假名、片假名、片假名擴充、半形片假名、羅馬拼音、漢字或近似假字都是 Blocking failure。

## Resume Decision

| Observed state | Required action |
|---|---|
| `activeBatchId` is not null | Continue from `nextAction`, `artworkStatus`, `compositionStatus`, and card status. |
| No active batch, user specifies cards | Create a modular batch before generation. |
| No active batch, user says “下一批” | Propose or create 10 non-duplicate modular cards using current specs. |
| GitHub state conflicts with Drive or Manifest | Report drift and stop completion claims until reconciled. |
| Artwork is generated but has no Drive ID | Treat artwork as not uploaded. |
| Composite is rendered but has no Drive ID | Treat composite as not uploaded. |
| Card is `changes-requested` | Repair artwork or composition; never skip directly to Approved. |
| Renderer is unavailable | Generate illustration-only artwork and mark composition pending／blocked; do not bake UI into canonical artwork. |

Do not ask the user to repost the full template or standards when the Repository already defines them.

## Production Contract

Before generation, each card must have:

- idiom
- four aligned Zhuyin readings
- optional data-layer Hanyu Pinyin for search or speech; Pinyin must not render on the card
- subtitle
- difficulty
- rarity and rationale
- `themeCategory` from the fixed nine-category registry
- `themeBadgeAssetId` resolved from the registry
- optional `secondaryThemeTags`, which must not render on the card
- allusion summary and source status
- motto
- character action and historical setting
- `renderMode`
- `layoutVersion`
- `componentSetVersion`
- artwork and composite filenames

When the user asks to generate an image, use the available image-generation tool. In ChatGPT, use `image_gen`; do not substitute a text prompt for the requested image.

For a modular card, image generation produces the `artwork` layer first:

```text
1024 × 1200 px
人物＋背景＋情境＋道具
no frame
no badges
no title／Zhuyin／Pinyin／subtitle
no allusion／motto／source text
```

Then compose the final `1024 × 2000 px` card with approved components and structured data.

Generate only Review assets unless an independent human approval is explicitly recorded. The producing Agent cannot self-approve its own artwork or composite.

## Theme Badge Contract v2.6

The lower-left category is not free text. It must resolve through:

```text
data/cards/theme-badge-registry.json
```

Allowed `themeCategory` values are exactly:

```text
military
governance
strategy
arts
perseverance
selfCultivation
relationships
cautionary
perspective
```

Display names are exactly:

```text
軍事、內政、智謀、文藝、勵志、修身、人際、警世、見識
```

Permanent rules:

- The image model must never draw or invent the theme badge inside the artwork.
- The composite renderer must resolve `displayName` and `assetId` from the Registry.
- `secondaryThemeTags` such as 專注、豪情、公義、新歲、自然 or 情感 are management/search metadata only and must not appear on the card.
- The same category must always use the same current Approved PNG, icon definition, background color, and Traditional Chinese label.
- The nine Approved masters are `1024 × 1280` RGBA transparent PNG assets stored in the Theme Badge Asset Registry.
- A missing, mismatched, non-current, non-transparent, or wrong-size badge blocks composition approval.
- The overview sheet is documentation only and must never be cropped into a card component.

## Modular Invariants

- New cards default to `renderMode: modular`.
- Existing indivisible PNG cards remain `flat-legacy` until intentionally migrated.
- Artwork is canonical visual source; Review／Approved composite PNG is derived output.
- Rarity, difficulty, theme badge, title, pronunciation, allusion, motto, source and frame must remain replaceable.
- Changing difficulty, rarity, or theme badge must not change `artworkAssetId`, artwork version, or artwork SHA-256.
- Unknown Drive IDs, checksums, approvals, source verification, or license evidence remain `null`.

## Permanent Gates

- Exact composite canvas `1024 × 2000 px`.
- Header `y = 0–359`, height `360 px`.
- Main artwork `y = 360–1559`, height `1200 px`.
- Footer `y = 1560–1999`, height `440 px`.
- Modular artwork source is `1024 × 1200 px` or verified safe for that slot.
- Traditional Chinese four-character idiom.
- First row below the title: four aligned Zhuyin groups.
- No Hanyu Pinyin or other Romanized pronunciation line on the card.
- Rarity at upper left; difficulty at upper right; theme badge at lower left; never mix them.
- New SSR cards use the v2.7 legendary iridescent golden-dragon badge: large dimensional gold `SSR`, purple-blue-magenta nebula core, and a purple diamond main gemstone.
- The SSR badge must differ clearly from SR in silhouette, material, light effects, and main gemstone; changing only letters, brightness, or saturation is a Blocking failure.
- SSR iridescence remains confined to the approved rarity frame/effects and must not recolor the theme badge.
- N／R／SR must not use the SSR badge or SSR full-rainbow frame.
- At least one person actively expresses the idiom.
- Full current Approved theme badge at lower left, with the exact Registry label.
- Section label is `典故`, not `典故說明`.
- Low-height, narrow, vertical motto plaque at lower right.
- One-line source at the bottom.
- N–SSR follow positive meaning and spiritual value.
- UR requires auditable licensed-IP evidence.
- Canonical artwork contains no formal card UI or text fields.

Use `references/review-checklist.md` after every generated artwork and composite. Any Blocking failure means `changes-requested`, not Approved.

## State Updates

Update `docs/card-prompts/state/current-batch.json` after:

- batch creation or cancellation
- content readiness
- artwork generation or review
- composition render or review
- independent approval
- Drive upload or movement
- completion or blocking

Update `docs/card-prompts/manifest.md` whenever an artwork, component, composite, Drive reference, checksum, version, or publication status changes.

## Completion Response

Report only evidence-backed facts:

- batch ID and card list
- render mode, layout version and component set
- artwork and composition status per card
- artwork and composite filenames
- actual artwork and composite dimensions
- Zhuyin review status
- theme category, exact Registry label, and resolved badge Asset ID
- SSR badge/frame review status when applicable
- Drive File IDs actually returned
- artwork and composite checksums actually calculated
- Manifest/state updates actually committed
- findings and exact next action

No Repository or Drive update means the batch is not fully handed off.
