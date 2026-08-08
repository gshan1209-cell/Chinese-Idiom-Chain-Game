---
name: registering-cicg-card-assets
description: Use when a Chinese-Idiom-Chain-Game card image, prompt, template, or component must be uploaded, registered, archived, marked for formal use, or reconciled between GitHub and Google Drive.
---

# Registering CICG Card Assets

## Overview

Use one atomic flow: verify local bytes, apply lifecycle gates, upload image and prompt together, then register only the real Drive metadata. Never invent IDs, hashes, approvals, licenses, or card numbers.

## Required Reading

Read current GitHub `main`:

1. `AGENTS.md`
2. `.agents/skills/generating-cicg-idiom-cards/SKILL.md`
3. For UR: `.agents/skills/generating-cicg-ur-collaboration-cards/SKILL.md`
4. `data/cards/card-number-registry.json`
5. `data/drive-assets/idiom-card-assets.json`
6. Matching asset registry and `docs/card-prompts/state/current-batch.json`

## Single Registration Flow

1. **Resolve input** — local image path, prompt content/path, idiom, rarity, theme, character/IP, target Drive folder.
2. **Verify bytes** — confirm file exists; record MIME, byte size, width, height, and lowercase SHA-256.
3. **Apply gates** — UR without auditable `licenseEvidenceId` is `review` or `approved-design-reference`, remains `not-approved-for-publication`, and must not consume `UR-####`.
4. **Deduplicate** — search existing GitHub asset records by SHA-256. If found, stop duplicate upload and return the existing record.
5. **Upload together** — image and complete prompt go to the same Drive folder with governed filenames.
6. **Register** — only after Drive returns real IDs and links, write one asset record containing both files and lifecycle status.
7. **Verify** — read back Drive metadata, validate JSON, confirm Registry counters did not change unlawfully, and report exact evidence.

## Minimal Naming

```text
Image:  CICG_<Rarity>_<IP>_<Character>_<Idiom>_<Role>_v<Version>.png
Prompt: CICG_<Rarity>_<IP>_<Character>_<Idiom>_FullPrompt_v<Version>.md
```

## Required Record Fields

```text
assetId, status, filename, driveFileId, webViewLink,
mimeType, sizeBytes, sha256, widthPx, heightPx,
idiom, rarity, themeCategory, licenseEvidenceId, publicationStatus
```

Prompt records omit pixel dimensions and use their own SHA-256.

## Blocking Failures

- Missing or unreadable local file
- Fake or absent Drive File ID after claimed upload
- Missing SHA-256 or dimensions for an image
- Image and prompt uploaded to different folders
- Duplicate SHA-256 registered twice
- UR formal number assigned without auditable license evidence
- Claiming `approved` or publication permission from chat approval alone

## Completion Report

Report only verified facts:

- Branch and commit/PR
- Image and prompt Drive IDs and links
- Filename, byte size, dimensions, SHA-256
- Registration file path
- Lifecycle, license, and publication status
- Whether formal card-number Registry changed
