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
8. `docs/superpowers/specs/2026-08-06-card-template-v2.6-dimension-and-pronunciation-amendment.md`
9. `docs/card-prompts/PROJECT_PROMPT.md`
10. `docs/card-prompts/shared/card-master-prompt.md`
11. `docs/card-prompts/shared/negative-constraints.md`
12. Matching file under `docs/card-prompts/templates/`
13. Matching file under `docs/card-prompts/idioms/`
14. `docs/card-prompts/manifest.md`
15. `docs/card-prompts/state/current-batch.json`
16. Drive Approved template and relevant Inbox／Review assets

## Truth priority

```text
GitHub main
→ GitHub Actions
→ Approved specifications and this skill
→ v2.6 dimension and pronunciation amendment
→ current-batch.json
→ Drive Approved assets
→ Manifest and review records
→ chat history
```

## Conflict rules

- Rarity standard overrides an older rarity label in a card prompt.
- Review governance overrides an older asset status.
- v2.6 overrides v2.1 for canvas size, aspect ratio, section coordinates, Zhuyin placement, and Hanyu Pinyin display.
- v2.1 remains the historical source for the `典故` label, fixed theme badge, and narrow vertical motto plaque where v2.6 does not replace them.
- A Drive image cannot override a newer written specification.
- `current-batch.json` records workflow continuity but cannot prove an upload, approval, license, or source verification without matching evidence.
