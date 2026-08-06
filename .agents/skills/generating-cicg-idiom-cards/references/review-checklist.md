# Idiom Card Review Checklist

A card cannot become Approved while any Blocking item fails.

## Content

- [ ] Exactly four Traditional Chinese idiom characters
- [ ] Correct Zhuyin for all four characters
- [ ] Zhuyin appears as one aligned row immediately below the title
- [ ] Correct lowercase tone-marked Hanyu Pinyin for all four syllables
- [ ] Pinyin appears as one row immediately below Zhuyin
- [ ] No numbered tones and no missing tone marks
- [ ] Subtitle matches the idiom meaning
- [ ] Difficulty follows familiarity and comprehension threshold
- [ ] Rarity follows positive meaning and spiritual value
- [ ] Rarity rationale is recorded
- [ ] Allusion type, summary, and source are accurate
- [ ] Original motto is not presented as a classical quotation

## Modular source separation

Apply to `renderMode === 'modular'`.

- [ ] Artwork is an independent source asset, not only a flat card crop
- [ ] Artwork source is `1024 × 1200 px` or verified safe for the v2.6 artwork slot
- [ ] Artwork contains no frame, rarity badge, difficulty badge, title, Zhuyin, Pinyin, subtitle, theme badge, allusion, motto, or source line
- [ ] Artwork has its own asset ID, version, Drive File ID, SHA-256, dimensions, and review status
- [ ] Frame, rarity, difficulty, theme, pronunciation, allusion, motto, and source are separate components or live data layers
- [ ] Composite PNG is recorded as a derived output, not the only canonical source
- [ ] Changing difficulty leaves artwork asset ID and artwork SHA-256 unchanged
- [ ] Changing rarity badge leaves artwork asset ID and artwork SHA-256 unchanged
- [ ] Component set, layout, rarity badge, and artwork versions are recorded independently
- [ ] Unapproved artwork or component master is not included in formal PWA runtime assets

## Dimensions and layout

- [ ] Exact composite canvas is `1024 × 2000 px`
- [ ] Header is `y = 0–359`, height `360 px`
- [ ] Main artwork is `y = 360–1559`, height `1200 px`
- [ ] Footer is `y = 1560–1999`, height `440 px`
- [ ] Rarity appears only at upper left
- [ ] Difficulty appears only at upper right
- [ ] Main illustration is the largest visual area
- [ ] At least one person actively expresses the idiom
- [ ] Full fixed theme badge appears at lower left
- [ ] Story section label is exactly `典故`
- [ ] Motto uses a low-height narrow vertical plaque at lower right
- [ ] Motto plaque does not intrude into the 1200 px main-art region
- [ ] Source is one small line at the bottom
- [ ] Text is readable on a mobile-sized card

## SSR v2.7 badge

Apply this section only when `rarity === 'SSR'`.

- [ ] Upper-left badge uses the legendary iridescent golden-dragon design
- [ ] Large dimensional gold `SSR` lettering is present
- [ ] Purple-blue-magenta nebula gemstone core is present
- [ ] Purple diamond main gemstone anchors the lower badge
- [ ] Badge differs clearly from SR in silhouette, material, light effects, and main gemstone
- [ ] Badge does not cover the title, Zhuyin, Pinyin, or subtitle
- [ ] Iridescent treatment does not recolor the outer frame, difficulty panel, main artwork, story panel, theme badge, or motto plaque
- [ ] N／R／SR cards do not use the SSR v2.7 badge
- [ ] Badge component version is independently traceable from the artwork version

## Quality and rights

- [ ] No fake text, Simplified Chinese, overflow, or cropped required fields
- [ ] No major hand, face, limb, or perspective deformation
- [ ] Clothing, architecture, props, and setting are not clearly anachronistic
- [ ] No third-party logo, watermark, protected character, or confusing imitation
- [ ] UR has auditable license evidence and permitted usage scope

## Workflow evidence

- [ ] Filename follows the latest standard: SSR composite uses `v2.7`; N／R／SR use their latest approved version
- [ ] Artwork and composite filenames are recorded separately
- [ ] Actual artwork and composite PNG dimensions were verified after generation
- [ ] `current-batch.json` matches artwork, composition, approval, and upload status
- [ ] Artwork Drive File ID is present only after confirmed artwork upload
- [ ] Composite Drive File ID is present only after confirmed composite upload
- [ ] Manifest is updated when artwork, component, composite, Drive, checksum, or publication status changes
- [ ] Producer and final approver are not represented as the same unverified action
- [ ] `flat-legacy` cards are explicitly marked and are not described as modular

## Decision

- All Blocking checks pass: eligible for independent final approval.
- Repairable artwork failure: set artwork to `changes-requested`.
- Repairable composition failure: set composition to `changes-requested`.
- Renderer unavailable: keep composition `pending` or `blocked`; do not bake UI into canonical artwork.
- Unverifiable source or rights: keep blocked or reject; do not publish.