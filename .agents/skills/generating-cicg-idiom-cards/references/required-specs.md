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
9. `docs/superpowers/specs/2026-08-06-card-template-v2.7-ssr-badge-amendment.md`
10. `docs/superpowers/specs/2026-08-06-card-rarity-frame-system-amendment.md`
11. `docs/superpowers/specs/2026-08-06-idiom-card-modularization-design.md`
12. `docs/superpowers/specs/2026-08-07-idiom-card-standard-v2-6-design.md`
13. `docs/superpowers/specs/2026-08-07-idiom-card-layout-lock-v2-6-1-design.md`
14. `docs/superpowers/specs/2026-08-08-project-wide-four-digit-card-numbering-design.md`
15. `data/cards/card-number-registry.json`
16. `docs/superpowers/specs/2026-08-08-ur-collaboration-card-standard-v1-0-design.md`（UR／聯名任務必讀）
17. `docs/superpowers/specs/2026-08-08-ur-allusion-inline-source-amendment.md`（UR／聯名任務必讀，覆寫獨立來源列）
18. `docs/superpowers/specs/2026-08-08-ur-collaboration-generation-skill-and-zhuyin-gate-design.md`（UR／聯名任務必讀）
19. `.agents/skills/generating-cicg-ur-collaboration-cards/SKILL.md`（UR／聯名任務必讀）
20. `docs/card-prompts/PROJECT_PROMPT.md`
21. `docs/card-prompts/shared/card-master-prompt.md`
22. `docs/card-prompts/shared/ur-collaboration-master-prompt-v1.md`（UR／聯名任務必讀）
23. `docs/card-prompts/shared/negative-constraints.md`
24. Matching file under `docs/card-prompts/templates/`
25. Matching file under `docs/card-prompts/idioms/`
26. `docs/card-prompts/manifest.md`
27. `docs/card-prompts/state/current-batch.json`
28. `docs/card-prompts/components/rarity-frame-registry-v1.md`
29. Drive Approved artwork, components, templates, composites, and relevant Inbox／Review assets

## Truth priority

```text
GitHub main
→ GitHub Actions
→ Approved specifications and this skill
→ v2.6.1 geometry contract
→ project-wide four-digit Card Number Registry
→ UR collaboration skill and standard when rarity is UR
→ UR allusion inline-source amendment
→ Taiwanese Zhuyin structured-data and Renderer Gate
→ rarity and review governance
→ v2.7 SSR badge amendment when rarity is SSR
→ four-tier rarity frame system
→ v2.6 dimension and pronunciation amendment
→ modularization architecture
→ current-batch.json
→ Drive Approved masters
→ Manifest, component registries, and review records
→ chat history
```

## Conflict rules

- Rarity standard overrides an older rarity label in a card prompt.
- Review governance overrides an older asset status.
- v2.6.1 controls canvas, section heights, outer Bounding Boxes, crop, layers and geometry for every rarity, including UR.
- `data/cards/card-number-registry.json` is the only assignment authority for formal card numbers.
- Formal card number format is `{rarity}-{sequence:0000}`; N／R／SR／SSR／UR each use an independent `project-wide-per-rarity` sequence and chapters never reset counters.
- Assigned and retired numbers are immutable and never reused.
- `chapter-1-card-number-registry.json` is a compatibility projection and must equal the canonical `chapter-1` subset.
- Every composite contains exactly one Renderer-owned `bottom-center card-number-plaque = {{CARD_NUMBER}}`; the image model must not generate card numbers.
- The bottom card-number plaque uses four digits and may contain no IP, character, difficulty, version, or other text.
- Without auditable `licenseEvidenceId`, UR cannot receive a formal `UR-####` number and must use a non-consuming Review identifier.
- UR collaboration standard applies only when rarity is UR and auditable licensed-IP evidence exists.
- A request naming an external IP and character routes through `.agents/skills/generating-cicg-ur-collaboration-cards/SKILL.md`.
- UR omits the difficulty badge from the card face and uses the existing upper-right difficulty Bounding Box for the versioned IP-specific collaboration label; difficulty may remain in data but does not render on UR.
- Every collaboration IP requires its own versioned label master. A generic label with only swapped text is not sufficient.
- The collaboration label may display the IP name and character name only. The bottom of the card must not repeat the character name.
- UR allusion, meaning and source remain idiom content. They must not be rewritten as character or franchise story.
- `2026-08-08-ur-allusion-inline-source-amendment.md` overrides conflicting wording in the UR standard, UR skill and UR master prompt: the card must show a complete allusion summary, then `出處：{{SOURCE}}` as the final line inside the same allusion panel.
- UR cards must not render a separate source field, source plaque or bottom source line; the former source-line slot remains decorative or transparent only.
- A missing allusion, an allusion panel containing only the idiom name or meaning, or a source rendered outside the allusion panel is a Blocking failure.
- A generated collaboration image or chat approval is not license evidence. Without auditable authorization, UR assets remain Draft／Review and cannot be Approved or published.
- Four-character idioms require exactly four aligned `bopomofo[4]` entries from structured data.
- Images must not contain title or Zhuyin. Renderer text nodes are the only canonical card-face pronunciation source.
- Hiragana, Katakana, Katakana extensions, halfwidth Katakana, Pinyin, romanization, Han characters, lookalikes or malformed symbols in `bopomofo` are Blocking failures.
- Japanese kana uses finding `japanese-kana-in-bopomofo`; other malformed Zhuyin uses `invalid-bopomofo`.
- Missing font coverage, replacement boxes, or fallback to a Japanese font blocks composition approval.
- v2.7 overrides older SSR badge visuals only; it does not alter semantic rarity, dimensions, pronunciation, or non-SSR badges.
- Four-tier rarity frame specification controls `frame-skin` and `effect-overlay`: N emerald antique gold, R frost blue steel, SR royal violet, SSR v2.8 rainbow neon.
- SSR v2.8 expands iridescence to the outer frame and effect overlay, but the v2.7 legendary golden-dragon badge remains mandatory.
- Difficulty badges remain independent of rarity frames and must not be automatically recolored by rarity.
- v2.6 overrides v2.1 for canvas size, aspect ratio, section coordinates, Zhuyin placement, and Hanyu Pinyin display.
- v2.1 remains the historical source for the `典故` label, fixed theme badge, and narrow vertical motto plaque where newer specs do not replace them.
- Modularization defines the separation between canonical artwork, replaceable components, structured data, render plan, and derived composite PNG.
- New modular artwork must not contain frame, rarity, difficulty, collaboration label, title, pronunciation, story, motto, source, card number, Logo or watermark.
- Changing difficulty, rarity badge, frame, collaboration label, theme badge or card-number plaque must not change the artwork asset ID or checksum.
- A Drive image cannot override a newer written specification.
- `current-batch.json` records workflow continuity but cannot prove an upload, approval, license, source verification, card number, or checksum without matching evidence.
