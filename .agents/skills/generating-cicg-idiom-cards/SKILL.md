---
name: generating-cicg-idiom-cards
description: Use when a Chinese-Idiom-Chain-Game project chat needs to generate, continue, review, repair, approve, upload, or plan an idiom-card batch.
---

# Generating CICG Idiom Cards

## Overview

Use GitHub `main` and the batch-state file as the continuity layer. Never rely on chat memory alone.

## Start Here

1. Read `AGENTS.md`.
2. Read `references/required-specs.md`.
3. Read `docs/card-prompts/state/current-batch.json`.
4. Read the matching rarity template, idiom prompt, Manifest, and available Drive evidence.

If Repository files cannot be read, state that the continuation source is unavailable. Do not guess the previous batch.

## Resume Decision

| Observed state | Required action |
|---|---|
| `activeBatchId` is not null | Continue from `nextAction` and each card's status. |
| No active batch, user specifies cards | Create that batch before generation. |
| No active batch, user says “下一批” | Propose or create 10 non-duplicate cards using current specs. |
| GitHub state conflicts with Drive or Manifest | Report drift and stop completion claims until reconciled. |
| Card is `generated` but has no Drive ID | Treat it as not uploaded. |
| Card is `changes-requested` | Repair or regenerate; never skip directly to Approved. |

Do not ask the user to repost the full template or standards when the Repository already defines them.

## Production Contract

Before generation, each card must have: idiom, four aligned Zhuyin readings, four tone-marked Hanyu Pinyin syllables, subtitle, difficulty, rarity, rarity rationale, theme badge, allusion summary, source status, motto, character action, historical setting, and Review filename.

When the user asks to generate an image, use the available image-generation tool. In ChatGPT, use `image_gen`; do not substitute a text prompt for the requested image.

Generate only Review assets unless an independent human approval is explicitly recorded. The producing Agent cannot self-approve its own image.

## Permanent Gates

- v2.6 exact canvas `1024 × 2000 px`.
- Header `y = 0–359`, height `360 px`.
- Main artwork `y = 360–1559`, height `1200 px`.
- Footer `y = 1560–1999`, height `440 px`.
- Traditional Chinese four-character idiom.
- First row below the title: four aligned Zhuyin groups.
- Second row below Zhuyin: lowercase tone-marked Hanyu Pinyin.
- No numbered tones and no missing tone marks in Approved assets.
- Rarity at upper left; difficulty at upper right; never mix them.
- At least one person actively expresses the idiom.
- Full theme badge at lower left.
- Section label is `典故`, not `典故說明`.
- Low-height, narrow, vertical motto plaque at lower right.
- One-line source at the bottom.
- N–SSR follow positive meaning and spiritual value.
- UR requires auditable licensed-IP evidence.

Use `references/review-checklist.md` after every generated image. Any Blocking failure means `changes-requested`, not Approved.

## State Updates

Update `docs/card-prompts/state/current-batch.json` after batch creation, content readiness, generation, review, approval, Drive upload, movement, completion, or cancellation. Update `docs/card-prompts/manifest.md` whenever a Drive reference or published asset status changes.

Unknown values stay `null`. Never invent a Drive File ID, approval, source verification, or license evidence.

## Completion Response

Report only evidence-backed facts:

- batch ID and card list
- current status per card
- generated filenames
- actual image size and main-art height
- Zhuyin and Pinyin review status
- Drive File IDs actually returned
- Manifest/state updates actually committed
- findings and exact next action

No Repository or Drive update means the batch is not fully handed off.
