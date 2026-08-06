# Required Specifications

Read the latest version from GitHub `main`. Later Approved specifications override older prompts and images.

## Required order

1. `AGENTS.md`
2. `docs/superpowers/specs/README.md`
3. `docs/superpowers/specs/2026-08-06-idiom-card-rarity-standard-design.md`
4. `docs/superpowers/specs/2026-08-06-idiom-card-review-governance-design.md`
5. `docs/superpowers/specs/2026-08-06-idiom-card-collection-design.md`
6. `docs/superpowers/specs/2026-08-06-idiom-card-collection-data-integrity-amendment.md`
7. `docs/superpowers/specs/2026-08-06-card-template-v2.1-layout-amendment.md`
8. `docs/card-prompts/PROJECT_PROMPT.md`
9. `docs/card-prompts/shared/card-master-prompt.md`
10. `docs/card-prompts/shared/negative-constraints.md`
11. Matching file under `docs/card-prompts/templates/`
12. Matching file under `docs/card-prompts/idioms/`
13. `docs/card-prompts/manifest.md`
14. `docs/card-prompts/state/current-batch.json`
15. Drive Approved template and relevant Inbox／Review assets

## Truth priority

```text
GitHub main
→ GitHub Actions
→ Approved specifications and this skill
→ current-batch.json
→ Drive Approved assets
→ Manifest and review records
→ chat history
```

## Conflict rules

- Rarity standard overrides an older rarity label in a card prompt.
- Review governance overrides an older asset status.
- v2.1 layout amendment overrides older visual layouts.
- A Drive image cannot override a newer written specification.
- `current-batch.json` records workflow continuity but cannot prove an upload, approval, license, or source verification without matching evidence.