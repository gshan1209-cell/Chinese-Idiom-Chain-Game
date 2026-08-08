---
name: generating-cicg-ur-collaboration-cards
description: Use when a Chinese-Idiom-Chain-Game request names an external IP and character and asks to generate, continue, repair, review, or compose a UR collaboration idiom card.
---

# Generating CICG UR Collaboration Cards

## Overview

Use this skill for a single UR external-IP collaboration card. The skill accepts an IP and character, prepares the idiom content, generates illustration-only artwork, and coordinates the approved modular card composition workflow.

必填輸入只有 IP 名稱與角色正式名稱。使用者可另外指定成語；未指定成語時自動從啟用中的四字成語選擇最符合角色核心行動、來源可校訂且未重複者。

## Required Reading

Before deciding or generating anything, read the latest GitHub `main` in this order:

1. `AGENTS.md`
2. `.agents/skills/generating-cicg-idiom-cards/SKILL.md`
3. `docs/card-prompts/state/current-batch.json`
4. `docs/superpowers/specs/2026-08-07-idiom-card-layout-lock-v2-6-1-design.md`
5. `docs/superpowers/specs/2026-08-08-ur-collaboration-card-standard-v1-0-design.md`
6. `docs/superpowers/specs/2026-08-08-ur-collaboration-generation-skill-and-zhuyin-gate-design.md`
7. `docs/superpowers/specs/2026-08-08-project-wide-four-digit-card-numbering-design.md`
8. `docs/card-prompts/shared/ur-collaboration-master-prompt-v1.md`
9. `data/cards/card-number-registry.json`
10. `data/cards/theme-badge-registry.json`
11. `data/cards/chapter-1-card-number-registry.json`
12. `data/drive-assets/idiom-card-assets.json`
13. Card Catalog, Manifest, matching collaboration-label Registry, Drive evidence, and license records

If Repository, Registry, Catalog, state, Manifest, or Drive evidence conflicts, report drift and stop approval claims. Do not reconstruct truth from a previous chat or a flat PNG.

## Inputs

Required:

```text
ipName
characterName
```

Optional:

```text
idiom
licenseEvidenceId
existingCardId
existingArtworkAssetId
existingCollaborationLabelAssetId
existingCardNumberPlaqueAssetId
```

Do not ask the user to manually provide fields that can be resolved from current Repository data. Automatically prepare or resolve:

- four-character idiom
- `bopomofo[4]`
- data-layer Pinyin where the existing schema requires it; it never renders on the card
- original idiom difficulty
- UR rarity and Review identifier or licensed four-digit card number
- `themeCategory`, exact Registry label, and `themeBadgeAssetId`
- idiom meaning, original allusion, verified source status
- one-line spirit subtitle and three-column motto
- character action, setting, composition-safe pose, and character effects
- IP-specific collaboration-label asset and status
- `cardNumberPlaqueAssetId`
- artwork and composite filenames

## Idiom Selection

When the user does not specify an idiom:

1. Inspect active idioms, Card Catalog, Canonical Card Number Registry, active batch, Manifest, and prior UR collaboration records.
2. Exclude non-four-character, disabled, duplicate, unverified, or semantically unsuitable idioms.
3. Match the idiom to the character's observable values and actions, not popularity, combat power, or visual spectacle.
4. Prefer an idiom that the character can express through one clear action in the central illustration.
5. Preserve the idiom's own meaning, allusion, source, difficulty, and theme category. Never rewrite those fields as franchise lore.
6. Record the selection reason before generation.

If no eligible idiom has verified Traditional Chinese text, four aligned Zhuyin readings, and a source that can remain at least `NeedsReview`, stop content readiness instead of inventing one.

## UR and License Gate

UR is reserved for external-IP collaboration cards. `licenseEvidenceId` must resolve to auditable authorization before a card can enter formal numbering, Approved, or publication workflows.

沒有可稽核 `licenseEvidenceId` 時不得指派任何正式 `UR-####` 卡號，只能使用不占序列的 Review 識別碼，並且不得標記 Approved、發布、上架、加入正式收藏或移入 Drive Approved。

A chat image, franchise name, user approval, public character image, or generated artwork is not license evidence. Keep unknown evidence fields `null`.

UR 永遠排除於一般里程碑免費卡池；this skill must not add `milestone-reward` eligibility or alter the collection database schema.

## Project-Wide Four-Digit UR Card Number Gate

Canonical source:

```text
data/cards/card-number-registry.json
```

Formal UR card numbers are independent, project-wide, and four-digit:

```text
UR-0001
UR-0002
UR-0003
```

Permanent rules:

- Format is exactly `{rarity}-{sequence:0000}`.
- The UR counter never resets for a new IP, character, chapter, batch, or release.
- Formal assigned or retired numbers are immutable and never reused.
- The image model must not generate, guess, redraw, or repair a card number.
- The Renderer must read `cardNumber` from the Canonical Registry.
- Every formal UR composite contains exactly one `bottom-center card-number-plaque = {{CARD_NUMBER}}`.
- The plaque uses `x=410–614, y=1936–1986` inside the original v2.6.1 source-line outer slot.
- The plaque may show only the four-digit Registry value; it cannot show IP, character, difficulty, version, or other text.
- A Review identifier is not a formal card number and never consumes `UR-####`.

## Difficulty and Collaboration Label

- Resolve and retain the idiom's original E–S difficulty in structured data.
- UR cards do not render the difficulty badge.
- The v2.6.1 difficulty Bounding Box is occupied by a versioned IP-specific collaboration-label component.
- Each IP needs its own approved visual language and label master; changing only text on a generic plaque is insufficient.
- The label displays only the IP name and official character name.
- The bottom of the card must not repeat the character name.
- If no current Approved label master exists, create or request a Review component and keep composition `pending` or `blocked`; never fake an Approved Asset ID.

## Taiwanese Zhuyin Gate

Every four-character idiom requires exactly four non-empty Zhuyin entries, and the four entries must be 四筆逐字對齊 with the title.

Allowed characters in each entry are limited to Bopomofo `U+3105–U+312F` and tone marks `U+02D9`, `U+02CA`, `U+02C7`, `U+02CB`.

圖片模型不得生成主標題、注音或卡號。Renderer 必須直接使用已驗證的 `bopomofo[4]` 文字節點與 Canonical Registry 的 `cardNumber`。

The Zhuyin field must not contain:

- 平假名 `U+3040–U+309F`
- 片假名 `U+30A0–U+30FF`
- 片假名擴充 `U+31F0–U+31FF`
- 半形片假名 `U+FF65–U+FF9F`
- Latin letters, Hanyu Pinyin, other romanization, Han characters, Japanese readings, decorative symbols, replacement glyphs, or model-invented lookalikes

Any Japanese kana produces the Blocking finding:

```text
japanese-kana-in-bopomofo
```

Other malformed, missing, misaligned, or non-Bopomofo values produce:

```text
invalid-bopomofo
```

The production 字型必須完整覆蓋臺灣注音；字型缺字、方框、錯誤 fallback、無法確認的近似字形或 fallback 成日文字型時，stop composition and set `compositionStatus` to `changes-requested` or `blocked`.

Visual inspection supplements but never replaces structured-data and render-plan validation.

## Artwork Generation

When the user asks to generate the card or image, use the available image-generation tool. In ChatGPT, use `image_gen`; do not return only a prompt.

圖片模型只生成 1024 × 1200 px 的 illustration-only artwork：人物、背景、情境、道具與角色特效。

不得讓圖片模型生成完整卡面。The artwork must contain no:

- title, Zhuyin, Pinyin, subtitle, card number, or any other text
- frame, UR badge, difficulty badge, collaboration label, theme badge, or card-number-plaque
- allusion, motto, source, official logo, imitation logo, copyright line, or watermark
- multi-card overview, mockup, packaging, or montage

Generate one artwork at a time. Keep the head, face, hands, primary weapon, and key action clear; reserve the upper-right collaboration-label safe area and the Footer crop boundary.

## Composition

Compose only through the approved renderer and versioned components:

```text
Canvas       1024 × 2000
Header       360 px
Main Artwork 1200 px
Footer       440 px
Geometry     ±2 px
```

The canonical artwork is placed with proportional cover and center crop. The Renderer supplies the title, validated `bopomofo[4]`, spirit subtitle, UR badge, IP label, approved theme badge, idiom allusion, source, motto, UR overlay, and one bottom-center four-digit `card-number-plaque`.

The bottom outer source slot remains `x=178–846, y=1936–1986`, partitioned as:

```text
source-line          x=178–398, y=1936–1986
card-number-plaque   x=410–614, y=1936–1986
```

If the Renderer, Approved UR components, IP-specific label, validated Zhuyin, canonical card number, number plaque, or font coverage is unavailable, keep `compositionStatus` as `pending`, `changes-requested`, or `blocked`. Do not fall back to a model-generated full card.

## Review and State

The producing Agent creates Review assets only and cannot independently approve its own output.

After content preparation, artwork generation, card-number assignment, repair, composition, upload, approval, retirement, or blocking:

- update `data/cards/card-number-registry.json` when and only when a formal number is lawfully assigned or retired
- update `docs/card-prompts/state/current-batch.json`
- update `docs/card-prompts/manifest.md`
- record actual card number or Review identifier, Asset IDs, Drive File IDs, checksums, dimensions, status, and findings
- never invent numbers, IDs, SHA-256 values, approvals, sources, or license evidence

Upload new work only to the governed Review／Pending location until independent approval exists.

## Completion Report

Report only evidence-backed facts:

- IP and official character name
- selected idiom and selection reason
- four Zhuyin entries and Gate result
- data-layer idiom difficulty
- formal four-digit card number or Review identifier
- UR status and `licenseEvidenceId` state
- theme category, exact label, and theme badge Asset ID
- collaboration-label and card-number-plaque Asset IDs and lifecycle states
- artwork and composite filenames, actual dimensions, and statuses
- actual Drive File IDs and SHA-256 values
- Registry, Manifest, and state commit
- Blocking findings and exact next action

No Repository, Renderer, Drive, checksum, canonical card number, or license evidence means that part is not complete.
