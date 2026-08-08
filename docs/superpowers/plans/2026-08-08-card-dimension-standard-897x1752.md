# Card Dimension Standard 897×1752 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `897 × 1752` the only canonical size for newly produced complete CICG card composites while preserving existing `1024 × 2000` assets as explicit legacy-compatible records.

**Architecture:** Add one canonical canvas-profile registry and a pure Node.js validator that classifies canonical, legacy-compatible, derivative, and invalid card canvases. Update generation/registration contracts to consume the profile rather than hard-coded dimensions, then migrate the current UR Review batch metadata without changing publication or formal UR-number gates.

**Tech Stack:** Node.js 22, ECMAScript modules, `node:test`, JSON registries, Markdown specifications, GitHub Actions.

## Global Constraints

- Canonical complete-card size is exactly `897 × 1752`.
- Canonical aspect-ratio identifier is `299:584`.
- Existing `1024 × 2000` assets remain valid only as `legacy-compatible`; new production at that size is rejected.
- Derivative exports must be integer multiples of `897 × 1752` and explicitly use `dimensionStatus: "derivative"`.
- Central illustration source remains `1024 × 1200`; this change only governs complete card composites.
- Dimension compliance does not bypass text, Renderer, content-review, Drive-evidence, IP-license, publication, or formal-card-number gates.
- Existing formal UR Registry counters must remain unchanged.
- Work remains on `feat/card-asset-registration-skill` / PR #51 to avoid a duplicate same-purpose PR; the previous audit becomes stale and must be rerun.

---

### Task 1: Add the canonical canvas profile and pure validation contract

**Files:**
- Create: `data/cards/card-canvas-profiles.json`
- Create: `scripts/card-canvas-profile.mjs`
- Create: `scripts/validate-card-canvas-profiles.mjs`
- Create: `tests/card-canvas-profile.test.mjs`
- Modify: `package.json`
- Modify: `scripts/verify.sh`

**Interfaces:**
- Produces: `validateCardCanvas(record, options)` returning `{ valid, profileId, dimensionStatus, reason }`.
- Produces: `data/cards/card-canvas-profiles.json` as the single source for canonical and legacy dimensions.
- Consumes: image metadata fields `widthPx`, `heightPx`, `dimensionStatus`, and optional `newProductionAllowed`.

- [ ] **Step 1: Write the failing tests**

Create `tests/card-canvas-profile.test.mjs` with explicit cases for:
- `897 × 1752` canonical succeeds.
- `1024 × 2000` new production fails.
- `1024 × 2000` with `legacy-compatible` and `newProductionAllowed: false` succeeds.
- `896 × 1752` fails.
- `1794 × 3504` with `derivative` succeeds.
- `1794 × 3504` without `derivative` fails.
- Registry current profile is `cicg-card-897x1752-v1`.
- Legacy profile forbids new production.

- [ ] **Step 2: Run the targeted test and confirm RED**

Run:

```bash
node --test tests/card-canvas-profile.test.mjs
```

Expected: FAIL because `scripts/card-canvas-profile.mjs` and `data/cards/card-canvas-profiles.json` do not exist.

- [ ] **Step 3: Implement the profile registry**

Create:

```json
{
  "schemaVersion": 1,
  "currentProfileId": "cicg-card-897x1752-v1",
  "profiles": [
    {
      "profileId": "cicg-card-897x1752-v1",
      "widthPx": 897,
      "heightPx": 1752,
      "aspectRatio": "299:584",
      "status": "canonical",
      "newProductionAllowed": true
    },
    {
      "profileId": "cicg-card-1024x2000-legacy-v1",
      "widthPx": 1024,
      "heightPx": 2000,
      "aspectRatio": "64:125",
      "status": "legacy-compatible",
      "newProductionAllowed": false
    }
  ]
}
```

- [ ] **Step 4: Implement the pure validator**

`validateCardCanvas(record, { productionIntent = "new" } = {})` must:
- accept exact canonical dimensions with `dimensionStatus: "canonical"`;
- accept exact legacy dimensions only when status is `legacy-compatible`, `newProductionAllowed` is false, and `productionIntent` is not `"new"`;
- accept integer scale factors `>= 2` only with `dimensionStatus: "derivative"`;
- reject approximate or one-axis-only matches;
- never infer approval, publication, license, or card-number status.

- [ ] **Step 5: Add the repository validator**

`scripts/validate-card-canvas-profiles.mjs` must validate:
- profile IDs are unique;
- current profile exists and is canonical;
- canonical dimensions are `897 × 1752`;
- legacy dimensions are `1024 × 2000` and prohibit new production;
- current UR asset records that declare canvas metadata satisfy the pure validator.

- [ ] **Step 6: Add scripts to permanent verification**

Add:

```json
"validate:card-canvas": "node scripts/validate-card-canvas-profiles.mjs"
```

Run it from `scripts/verify.sh` before tests.

- [ ] **Step 7: Run targeted verification and confirm GREEN**

Run:

```bash
node --test tests/card-canvas-profile.test.mjs
node scripts/validate-card-canvas-profiles.mjs
```

Expected: all tests pass and validator reports the canonical profile.

- [ ] **Step 8: Commit**

```bash
git add data/cards/card-canvas-profiles.json scripts/card-canvas-profile.mjs scripts/validate-card-canvas-profiles.mjs tests/card-canvas-profile.test.mjs package.json scripts/verify.sh
git commit -m "feat: define canonical 897x1752 card canvas"
```

---

### Task 2: Replace hard-coded complete-card dimensions in governed generation contracts

**Files:**
- Modify: `.agents/skills/generating-cicg-idiom-cards/SKILL.md`
- Modify: `.agents/skills/generating-cicg-ur-collaboration-cards/SKILL.md`
- Modify: `.agents/skills/registering-cicg-card-assets/SKILL.md`
- Modify: `docs/card-prompts/shared/ur-collaboration-master-prompt-v1.md`
- Create: `docs/superpowers/specs/2026-08-08-card-dimension-standard-897x1752-design.md`
- Create: `docs/superpowers/plans/2026-08-08-card-dimension-standard-897x1752.md`

**Interfaces:**
- Consumes: `data/cards/card-canvas-profiles.json`.
- Produces: governed instructions that reference `canvasProfile` rather than treating `1024 × 2000` as canonical.

- [ ] **Step 1: Add failing document-contract assertions**

Extend `tests/card-canvas-profile.test.mjs` to assert:
- all three skills reference `cicg-card-897x1752-v1`;
- the UR master prompt declares complete canvas `897 × 1752`;
- none of those files describes `1024 × 2000` as the current complete-card standard;
- central artwork remains `1024 × 1200`.

- [ ] **Step 2: Run the targeted test and confirm RED**

Run:

```bash
node --test tests/card-canvas-profile.test.mjs
```

Expected: FAIL because current skill and prompt files still state `1024 × 2000`.

- [ ] **Step 3: Update the general card skill**

Replace complete-composite rules with:
- canonical profile `cicg-card-897x1752-v1`;
- canonical dimensions `897 × 1752`;
- central artwork remains `1024 × 1200`;
- legacy `1024 × 2000` may be preserved but not newly produced;
- Renderer reads geometry tokens from the profile registry.

- [ ] **Step 4: Update the UR skill and master prompt geometry**

Use these exact canonical zones:

```text
Canvas       x=0, y=0,    width=897, height=1752
Header       x=0, y=0,    width=897, height=315
Main Artwork x=0, y=315,  width=897, height=1051
Footer       x=0, y=1366, width=897, height=386
```

Use scaled component boxes:

```text
UR badge           x=21–221,  y=16–286
idiom title        x=219–690, y=37–138
bopomofo[4]        x=244–662, y=145–203
spirit subtitle    x=226–685, y=223–289
collaboration tag  x=694–876, y=21–279

theme badge         x=25–263,  y=1381–1682, width=238, height=301
allusion panel      x=251–634, y=1386–1682, width=383, height=296
motto plaque        x=639–865, y=1508–1684, width=226, height=176
source line         x=156–349, y=1696–1740, width=193, height=44
card-number-plaque  x=359–538, y=1696–1740, width=179, height=44
```

Keep the motto plaque in the lower-right footer and do not reintroduce an attack-name label on the card face.

- [ ] **Step 5: Update registration skill fields**

Require:
- `canvasProfile`;
- `aspectRatio`;
- `dimensionStatus`;
- `sourceCanvasProfile` for derivatives;
- exact profile validation before registration.

- [ ] **Step 6: Save the approved design and this plan**

Write the approved design and implementation plan to the specified `docs/superpowers` paths without placeholders or contradictory dimensions.

- [ ] **Step 7: Run the document-contract test and confirm GREEN**

Run:

```bash
node --test tests/card-canvas-profile.test.mjs
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add .agents/skills docs/card-prompts/shared/ur-collaboration-master-prompt-v1.md docs/superpowers/specs/2026-08-08-card-dimension-standard-897x1752-design.md docs/superpowers/plans/2026-08-08-card-dimension-standard-897x1752.md tests/card-canvas-profile.test.mjs
git commit -m "docs: adopt 897x1752 card geometry"
```

---

### Task 3: Migrate the current UR Review asset metadata without weakening other gates

**Files:**
- Modify: `data/drive-assets/ur-card-assets-2026-08-08.json`
- Create: `data/drive-assets/ur-kimetsu-review-registration-draft-2026-08-08.json`
- Modify: `tests/card-canvas-profile.test.mjs`

**Interfaces:**
- Consumes: canonical canvas profile and pure validator.
- Produces: Review asset metadata with canonical dimensions separated from Renderer/content/license status.

- [ ] **Step 1: Add failing migration assertions**

Assert:
- the registered `897 × 1752` Shinobu composite has `canvasProfile: "cicg-card-897x1752-v1"` and `dimensionStatus: "canonical"`;
- its dimension mismatch blocker is removed;
- `canonicalRendererOutput` remains false until text is rebuilt by Renderer;
- publication remains `not-approved-for-publication`;
- formal card number remains null;
- the 13-card registration draft has zero formal UR counter delta;
- RV-UR-0009 remains blocked for visible title mismatch.

- [ ] **Step 2: Run the targeted test and confirm RED**

Run:

```bash
node --test tests/card-canvas-profile.test.mjs
```

Expected: FAIL because current registry still calls `897 × 1752` noncanonical and the draft is not committed.

- [ ] **Step 3: Migrate the verified Shinobu asset record**

Add:

```json
"canvasProfile": "cicg-card-897x1752-v1",
"aspectRatio": "299:584",
"dimensionStatus": "canonical",
"sourceCanvasProfile": null
```

Remove only the old dimension blocker. Keep content review and license blockers.

- [ ] **Step 4: Commit the 13-card pending registration draft**

Use real local byte metadata already calculated, but leave all unknown Drive IDs and prompt hashes null. Change every `897 × 1752` card from dimension-blocked to dimension-canonical while retaining:
- `canonicalRendererOutput: false`;
- text-verification blockers;
- `not-approved-for-publication`;
- `formalCardNumber: null`;
- zero formal Registry delta.

- [ ] **Step 5: Run migration assertions and validator**

Run:

```bash
node --test tests/card-canvas-profile.test.mjs
node scripts/validate-card-canvas-profiles.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add data/drive-assets/ur-card-assets-2026-08-08.json data/drive-assets/ur-kimetsu-review-registration-draft-2026-08-08.json tests/card-canvas-profile.test.mjs
git commit -m "feat: migrate UR review assets to canonical canvas"
```

---

### Task 4: Run full regression, update PR evidence, and re-audit

**Files:**
- Modify: PR #51 body/comment evidence only if verification succeeds.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: fresh CI evidence for the new PR head.

- [ ] **Step 1: Run the complete repository verification**

Run:

```bash
npm install
./scripts/verify.sh
npm audit
```

Record fresh counts; do not reuse earlier numbers.

- [ ] **Step 2: Confirm Registry invariants**

Verify:
- `raritySequences.UR.assignedCount` is unchanged;
- `raritySequences.UR.nextSequence` is unchanged;
- no `UR-####` was assigned;
- only Review identifiers appear in pending assets.

- [ ] **Step 3: Push and obtain PR-scoped CI**

Confirm:
- PR #51 head is the tested revision;
- `behind_by = 0`;
- Primary Verification is successful;
- unrelated temporary workflows are classified separately.

- [ ] **Step 4: Perform ChatGPT Audit**

Review:
- canonical/legacy/derivative behavior;
- no stale hard-coded current `1024 × 2000` contract;
- central artwork remains unaffected;
- all content/license/publication/card-number gates remain intact;
- Drive metadata is not claimed complete without real IDs.

- [ ] **Step 5: Leave the PR in the governance-required state**

Because Issue #52 governs consolidation, follow its current disposition:
- update the audit record;
- do not merge if #52 still requires a separate consolidation completion;
- otherwise Squash Merge only after all permanent gates are green.
