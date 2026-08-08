---
name: generating-cicg-ur-collaboration-cards
description: Use when a Chinese-Idiom-Chain-Game request names an external IP and character and asks to generate, continue, repair, review, or compose a UR collaboration idiom card.
---

# Generating CICG UR Collaboration Cards

## Overview

Use this skill for one external-IP UR idiom card at a time. Required user input is only the IP name and official character name; the workflow resolves the character title, best-fitting four-character idiom, validated Taiwanese Zhuyin, theme, allusion, source, five-character-quatrain motto, artwork, Review identifier or licensed card number, and modular composition.

The image model only generates illustration-only artwork. It never generates the canonical full card.

## Required Reading

Before deciding, generating, repairing, reviewing, uploading, or composing anything, read current GitHub `main` in this order:

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
11. `data/cards/card-number-registry.json`
12. `data/cards/theme-badge-registry.json`
13. `data/drive-assets/idiom-card-assets.json`
14. Matching Card Catalog, Manifest, IP-label Registry, Drive evidence, license records, and Approved component records

The UR standard file path is unchanged, but its current document version is **v1.2**. Its UR-specific rules override conflicting older wording about the collaboration label, allusion body, motto columns, and motto height.

If Repository, Registry, Catalog, Manifest, state, or Drive evidence conflicts, report drift and stop approval claims. Never reconstruct truth from a previous chat, a flattened PNG, or model-generated text.

## Inputs

Required:

```text
ipName
characterName
```

Optional:

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

Resolve from Repository data whenever possible:

- official character title and display name
- suitable four-character idiom
- `bopomofo[4]`
- original idiom difficulty in data only
- UR rarity and Review identifier or licensed `UR-####`
- `themeCategory` and `themeBadgeAssetId`
- original allusion and verified source
- one-line spirit subtitle
- four-line five-character motto, total 20 Han characters
- character action, setting, safe composition, and effects
- IP Logo Asset ID and IP-specific collaboration-label Asset ID
- artwork and composite filenames and statuses

Do not ask the user to provide values that current governed data can resolve. Never invent sources, license evidence, Asset IDs, checksums, approvals, or card numbers.

## Character-Based Idiom Selection

When the user does not specify an idiom:

1. Inspect active idioms, current batch, Card Catalog, card-number Registry, Manifest, and previous UR records.
2. Exclude disabled, duplicate, non-four-character, semantically unsuitable, or untraceable entries.
3. Match the idiom to the character's observable personality, values, choices, methods, and signature actions.
4. Prefer an idiom expressible through one clear illustration action or situation.
5. Preserve the idiom's own meaning, allusion, source, difficulty, and theme; never rewrite them as franchise lore.
6. Record the selection reason before generation.

Popularity, combat strength, costume color, and visual spectacle alone are not valid selection reasons.

Example:

```text
Character: 胡蝶忍
Title: 蝶柱
Idiom candidate: 綿裡藏針
Reason: 溫和外表與輕柔言行之下藏有銳利決斷與致命用毒能力，符合表柔內銳的角色核心。
```

This example does not approve the idiom source or license status; those remain independently gated.

## UR License and Number Gate

UR is reserved for external-IP collaboration cards. Formal `Approved`, publication, store use, collection eligibility, and `UR-####` require an auditable `licenseEvidenceId`.

Without valid license evidence:

- use Draft／Review only
- do not assign or consume formal `UR-####`
- do not move assets to Drive Approved
- do not claim official collaboration or commercial permission
- keep IP Logo and character assets in governed Review status

A franchise name, public image, chat approval, generated artwork, or user-provided reference is not license evidence.

Canonical formal card number source:

```text
data/cards/card-number-registry.json
```

Formal format:

```text
UR-0001
UR-0002
UR-0003
```

Review identifiers such as `RV-UR-####` or `UR-REVIEW-####` do not consume the formal sequence and must come from governed state or Registry data. The image model must never generate, guess, redraw, or repair any identifier.

## UR Visual Standard

### Canvas

```text
Canvas       1024 × 2000
Header       360 px
Main Artwork 1200 px
Footer       440 px
Geometry     ±2 px
```

### UR Frame and Badge

- Apply the current Approved full-canvas rainbow neon Overlay.
- The border must visibly carry continuous cyan, green, blue, purple, magenta, red, and orange-gold light.
- Overlay cannot cause reflow, shrink content, recolor all Footer components, or cover text and faces.
- Use the current Approved three-dimensional rainbow-metallic UR dragon emblem at the upper left.
- The image model must not recreate the frame or badge.

### Header

```text
rarity badge       x=24–252,   y=18–326
idiom title        x=250–788,  y=42–158
bopomofo[4]        x=278–756,  y=166–232
spirit subtitle    x=258–782,  y=254–330
collaboration tag  x=792–1000, y=24–318
```

- Title is exactly four Traditional Chinese characters.
- Zhuyin is exactly four validated entries aligned character by character.
- UR does not render the difficulty badge.
- The upper-right slot uses the IP-specific label.

## Collaboration Label

Each IP needs a versioned label master. For the current Demon Slayer character layout, the label contains:

```text
Top: governed IP Logo Asset
Middle: official character title
Bottom: official character name
Example: 蝶柱－胡蝶忍
```

Permanent rules:

- retain the IP Logo location and aspect ratio
- display the character title and official name
- never display `聯名卡`
- never display `角色名`, `聯名限定`, or `限定版`
- never repeat the IP or character name at the bottom of the card
- the image model must not draw, imitate, or repair the Logo or label
- without license evidence, the label remains Review and cannot be publicly released or Approved

## Taiwanese Zhuyin Gate

Every four-character idiom requires exactly four non-empty `bopomofo[4]` entries aligned with the title.

Allowed characters in each entry:

```text
Bopomofo U+3105–U+312F
Tone marks U+02D9 U+02CA U+02C7 U+02CB
```

Blocking content:

- Hiragana `U+3040–U+309F`
- Katakana `U+30A0–U+30FF`
- Katakana extensions `U+31F0–U+31FF`
- half-width Katakana `U+FF65–U+FF9F`
- Latin letters, Hanyu Pinyin, romanization, Han characters, decorative lookalikes, missing glyphs, or乱码

Finding codes:

```text
japanese-kana-in-bopomofo
invalid-bopomofo
```

The Renderer must use validated structured text and a font with complete Taiwanese Bopomofo coverage. The image model, OCR, and visual guessing cannot supply canonical Zhuyin.

Any failure sets `compositionStatus` to `changes-requested` or `blocked` and prevents Approved.

## Artwork Generation

When the user asks to generate the card or image, use the available image-generation tool for the central artwork only.

Canonical artwork:

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

Generate one artwork at a time. Keep the face, hands, primary weapon, and key action clear; reserve the upper-right label safe zone and Footer crop boundary.

Never ask the image model to draw the complete card, even when the user provides a full-card reference.

## UR Footer Composition

UR v1.2 Footer geometry:

```text
theme badge       x=28–300,  y=1576–1920, width=272, height=344
allusion panel    x=286–724, y=1582–1920, width=438, height=338
motto plaque      x=730–988, y=1722–1922, width=258, height=200
source line       x=178–398, y=1936–1986, width=220, height=50
number plaque     x=410–614, y=1936–1986, width=204, height=50
```

The `258 × 200 px` motto plaque is a UR-specific override and replaces the older 352 px height.

### Theme badge

- Resolve from `data/cards/theme-badge-registry.json`.
- Theme follows the idiom, not the franchise faction or character title.
- Use the current Approved component; never repaint it with the image model.

### Allusion panel

Render only:

1. `典故`
2. the idiom's original allusion content
3. its verified source

Do not render `本義` or an idiom-meaning paragraph on the UR card. `idiomMeaning` may remain in structured data but is not displayed.

Never turn character events or franchise lore into the idiom allusion.

### Five-character-quatrain motto

Render four vertical columns from right to left:

```text
motto[0] rightmost: 5 Traditional Chinese Han characters
motto[1]:           5 Traditional Chinese Han characters
motto[2]:           5 Traditional Chinese Han characters
motto[3] leftmost:  5 Traditional Chinese Han characters
Total:              20 Han characters
```

Rules:

- no inline punctuation on the card
- no three-column legacy layout
- no extra blank lower area
- no horizontal layout
- the verse reflects the character and idiom spirit but is not historical evidence

## Composition Workflow

The Renderer supplies:

- validated four-character title
- validated `bopomofo[4]`
- one-line spirit subtitle
- Approved／Review UR badge and rainbow Overlay
- governed IP Logo and collaboration-label component
- Registry-resolved theme badge
- original idiom allusion and source only
- four-column five-character motto
- exactly one formal card number or Review identifier plaque

The Renderer places the 1024 × 1200 artwork by proportional cover and center crop. If the Renderer, components, fonts, Registry values, or evidence are unavailable, keep the composition pending or blocked. Never fall back to a model-generated full card.

## Review and State

The producing Agent can create Review assets but cannot independently approve its own output.

After content preparation, artwork generation, composition, repair, upload, approval, blocking, or retirement, update the governed records as applicable:

- `docs/card-prompts/state/current-batch.json`
- `docs/card-prompts/manifest.md`
- `data/cards/card-number-registry.json` only for lawful formal assignment or retirement
- card catalog and Drive asset manifest

Record actual values only:

- Review identifier or formal card number
- Asset IDs and lifecycle states
- Drive File IDs
- dimensions
- SHA-256
- source and license evidence states
- validation findings

## Completion Report

Report:

- IP, character title, and official character name
- selected idiom and selection reason
- four Zhuyin entries and Gate result
- theme category and theme badge Asset ID
- allusion source status
- four five-character motto lines
- IP Logo and collaboration-label Asset IDs and statuses
- Review identifier or licensed formal number
- artwork and composite filenames and dimensions
- Drive IDs, checksums, Registry／Manifest commit when actually available
- Blocking findings and exact next action

No evidence means that item is not complete.
