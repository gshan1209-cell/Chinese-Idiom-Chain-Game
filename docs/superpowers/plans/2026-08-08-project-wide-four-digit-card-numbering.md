# Project-Wide Four-Digit Card Numbering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all formal card numbers to project-wide, per-rarity, four-digit immutable sequences and require a bottom-center number plaque on every rarity card.

**Architecture:** Add a project-wide canonical Registry and Schema while retaining the chapter-one Registry as a compatibility projection. Permanent Node tests validate four-digit formatting, independent rarity sequences, projection parity, UR licensing, and prompt/skill rendering rules. Renderer-facing documents consume the canonical Registry and never let the image model generate card numbers.

**Tech Stack:** JSON Schema 2020-12, Node.js test runner, Markdown production specifications, GitHub Actions.

## Global Constraints

- Format is exactly `{rarity}-{sequence:0000}`.
- Supported rarities are `N`, `R`, `SR`, `SSR`, and `UR`.
- Sequences are project-wide and independent per rarity.
- Existing chapter-one numeric sequence values remain unchanged; only one leading zero is added.
- Assigned or retired formal numbers are immutable and never reused.
- UR formal numbers require auditable license evidence.
- All card composites render the Registry number in a bottom-center plaque.
- Canonical artwork contains no card number or UI text.
- Existing `1024 × 2000`, `360 / 1200 / 440`, and `±2 px` geometry remains unchanged.

---

### Task 1: Add RED permanent numbering and prompt tests

**Files:**
- Modify: `tests/chapter-one-card-catalog.test.mjs`
- Create: `tests/card-numbering-standard.test.mjs`

**Interfaces:**
- Consumes: current three-digit chapter Registry and current prompt files.
- Produces: failing expectations for the canonical project Registry, four-digit chapter projection, independent rarity counters, and bottom-center plaque wording.

- [ ] **Step 1: Write failing tests**

Add assertions that:

```js
assert.equal(registry.numberingPolicy.format, '{rarity}-{sequence:0000}');
assert.equal(registry.numberingPolicy.scope, 'project-wide-per-rarity');
assert.match(card.cardNumber, /^(N|R|SR|SSR|UR)-\d{4}$/u);
```

Add a new test that reads:

```text
data/cards/card-number-registry.json
data/cards/card-number-registry.schema.json
docs/card-prompts/shared/card-master-prompt.md
docs/card-prompts/shared/ur-collaboration-master-prompt-v1.md
.agents/skills/generating-cicg-ur-collaboration-cards/SKILL.md
```

and checks canonical Registry presence, projection parity, `bottom-center` card-number plaque requirements, and absence of the old prohibition against bottom card numbers.

- [ ] **Step 2: Run RED CI**

Open a draft PR after committing only the tests. Expected result: CI fails because the canonical project Registry does not exist and existing Registry/prompt values still use three digits or prohibit a bottom card number.

- [ ] **Step 3: Record RED evidence**

Record the workflow run number and exact failed assertions in the PR body.

### Task 2: Create canonical project-wide Registry and Schema

**Files:**
- Create: `data/cards/card-number-registry.json`
- Create: `data/cards/card-number-registry.schema.json`
- Modify: `data/cards/chapter-1-card-number-registry.json`
- Modify: `data/cards/chapter-1-card-number-registry.schema.json`

**Interfaces:**
- Produces: canonical `cards[]` entries with `chapterId`, `catalogOrder`, `rarity`, `sequence`, `cardNumber`, and lifecycle status.
- Produces: `raritySequences` with `assignedCount` and `nextSequence` for all five rarities.

- [ ] **Step 1: Add the canonical Registry**

Use:

```json
{
  "schemaVersion": 1,
  "registryId": "cicg-project-card-numbers",
  "numberingPolicy": {
    "format": "{rarity}-{sequence:0000}",
    "scope": "project-wide-per-rarity",
    "sequenceStartsAt": 1,
    "immutableAfterAssignment": true,
    "reuseRetiredNumbers": false,
    "supportedRarities": ["N", "R", "SR", "SSR", "UR"],
    "licenseGateRequiredFor": ["UR"]
  }
}
```

Migrate all 61 chapter-one cards to four digits without changing their numeric value or ordering.

- [ ] **Step 2: Add Schema validation**

Require:

```text
^(N|R|SR|SSR|UR)-[0-9]{4}$
```

Require card-number prefix and rarity consistency through permanent tests, and define `sequence` as integer `1..9999`.

- [ ] **Step 3: Update chapter-one projection**

Set schema version 2, add `canonicalRegistryPath`, use project-wide scope and four-digit values, and keep all 61 entries synchronized with the canonical chapter-one subset.

- [ ] **Step 4: Run targeted tests**

Run `npm run test:card-catalog` and the new card-numbering test. Expected: data tests pass; prompt tests may still fail until Task 3.

### Task 3: Update production prompts, skills, and data entry docs

**Files:**
- Modify: `data/cards/README.md`
- Modify: `docs/card-prompts/shared/card-master-prompt.md`
- Modify: `docs/card-prompts/shared/ur-collaboration-master-prompt-v1.md`
- Modify: `.agents/skills/generating-cicg-ur-collaboration-cards/SKILL.md`
- Modify: `.agents/skills/generating-cicg-idiom-cards/SKILL.md`
- Modify: `.agents/skills/generating-cicg-idiom-cards/references/required-specs.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: canonical Registry `cardNumber`.
- Produces: Renderer-only bottom-center plaque instruction for every rarity.

- [ ] **Step 1: Replace three-digit examples and chapter-only scope**

Document:

```text
N-0001 / R-0001 / SR-0001 / SSR-0001 / UR-0001
```

and state that chapters do not reset counters.

- [ ] **Step 2: Add universal bottom-center plaque rule**

Add a fixed renderer layer after the source line or within the reserved bottom-center footer slot:

```text
bottom-center card-number-plaque = {{CARD_NUMBER}}
```

The plaque may contain only the Registry number. It must not contain character, IP, difficulty, or version text.

- [ ] **Step 3: Fix UR contradiction**

Replace the rule forbidding an extra bottom card number with a rule forbidding any *additional* number outside the single canonical plaque.

- [ ] **Step 4: Preserve image-model prohibition**

Keep card numbers excluded from illustration generation. Only Renderer structured text may show them.

- [ ] **Step 5: Run targeted tests**

Expected: all card-numbering and card-catalog tests pass.

### Task 4: Complete audit and regression verification

**Files:**
- Create: `docs/superpowers/reports/2026-08-08-project-wide-four-digit-card-numbering-audit.md`
- Update: PR body with RED/GREEN evidence.

**Interfaces:**
- Produces: audit evidence and merge-ready PR.

- [ ] **Step 1: Run full verification**

Run the repository CI equivalent of:

```bash
npm install
./scripts/verify.sh
```

Record Node/Card/Puzzle test totals, TypeScript strict, ESLint, Vite/PWA Build, and npm audit.

- [ ] **Step 2: Verify merge gates**

Confirm:

```text
behind_by = 0
latest HEAD CI = success
unresolved review threads = 0
blocking findings = 0
```

- [ ] **Step 3: Write ChatGPT Audit**

Audit Registry parity, migration preservation, prompt wording, UR licensing behavior, and absence of gameplay or IndexedDB changes.

- [ ] **Step 4: Squash Merge**

Merge only after the latest HEAD verification succeeds.