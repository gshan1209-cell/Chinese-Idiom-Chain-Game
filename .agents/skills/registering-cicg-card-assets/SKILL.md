---
name: registering-cicg-card-assets
description: Use when a Chinese-Idiom-Chain-Game card image, prompt, template, or component must be uploaded, registered, archived, marked for formal use, or reconciled between GitHub and Google Drive.
---

# Registering CICG Card Assets

## Overview

Use one atomic flow: verify local bytes, validate the governed canvas profile, apply lifecycle gates, upload image and prompt together, then register only the real Drive metadata. Never invent IDs, hashes, approvals, licenses, or card numbers.

## Required Reading

Read current GitHub `main`:

1. `AGENTS.md`
2. `.agents/skills/generating-cicg-idiom-cards/SKILL.md`
3. For UR: `.agents/skills/generating-cicg-ur-collaboration-cards/SKILL.md`
4. `data/cards/card-canvas-profiles.json`
5. `data/cards/card-number-registry.json`
6. `data/drive-assets/idiom-card-assets.json`
7. Matching asset registry and `docs/card-prompts/state/current-batch.json`

## Canonical Canvas Contract

New complete-card composites use:

```text
canvasProfile: cicg-card-897x1752-v1
widthPx: 897
heightPx: 1752
aspectRatio: 299:584
dimensionStatus: canonical
```

Existing `1024 × 2000` composites may remain only as:

```text
canvasProfile: cicg-card-1024x2000-legacy-v1
dimensionStatus: legacy-compatible
newProductionAllowed: false
```

High-resolution exports must be integer multiples of `897 × 1752`, use `dimensionStatus: derivative`, and set `sourceCanvasProfile: cicg-card-897x1752-v1`.

Canvas compliance is independent from Renderer, text, source, license, publication, and formal card-number approval.

## Single Registration Flow

1. **Resolve input** — local image path, prompt content/path, idiom, rarity, theme, character/IP, target Drive folder.
2. **Verify bytes** — confirm file exists; record MIME, byte size, width, height, lowercase SHA-256, `canvasProfile`, `aspectRatio`, `dimensionStatus`, and optional `sourceCanvasProfile`.
3. **Validate dimensions** — new complete-card output must match `cicg-card-897x1752-v1` exactly. Preserve `1024 × 2000` only as explicit legacy; never accept approximate dimensions by tolerance.
4. **Apply gates** — UR without auditable `licenseEvidenceId` is `review` or `approved-design-reference`, remains `not-approved-for-publication`, and must not consume `UR-####`.
5. **Deduplicate** — search existing GitHub asset records by SHA-256. If found, stop duplicate upload and return the existing record.
6. **Upload together** — image and complete prompt go to the same Drive folder with governed filenames.
7. **Register** — only after Drive returns real IDs and links, write one asset record containing both files and lifecycle status.
8. **Verify** — read back Drive metadata, validate JSON, confirm Registry counters did not change unlawfully, and report exact evidence.

## Minimal Naming

```text
Image:  CICG_<Rarity>_<IP>_<Character>_<Idiom>_<Role>_v<Version>.png
Prompt: CICG_<Rarity>_<IP>_<Character>_<Idiom>_FullPrompt_v<Version>.md
```

## Required Record Fields

```text
assetId, status, filename, driveFileId, webViewLink,
mimeType, sizeBytes, sha256, widthPx, heightPx,
canvasProfile, aspectRatio, dimensionStatus, sourceCanvasProfile,
idiom, rarity, themeCategory, licenseEvidenceId, publicationStatus
```

Prompt records omit pixel dimensions and canvas fields and use their own SHA-256.

## Blocking Failures

- Missing or unreadable local file
- Fake or absent Drive File ID after claimed upload
- Missing SHA-256 or dimensions for an image
- Missing or invalid canvas profile metadata
- New complete-card asset not exactly `897 × 1752`
- `1024 × 2000` registered as new production rather than `legacy-compatible`
- Derivative dimensions not an integer multiple of `897 × 1752`
- Image and prompt uploaded to different folders
- Duplicate SHA-256 registered twice
- UR formal number assigned without auditable license evidence
- Claiming `approved` or publication permission from chat approval alone

## Completion Report

Report only verified facts:

- Branch and commit/PR
- Image and prompt Drive IDs and links
- Filename, byte size, dimensions, canvas profile, dimension status, and SHA-256
- Registration file path
- Lifecycle, license, and publication status
- Whether formal card-number Registry changed
