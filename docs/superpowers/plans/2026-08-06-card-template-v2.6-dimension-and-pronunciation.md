# Card Template v2.6 Dimension and Pronunciation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote the approved 1024 × 2000 idiom-card template, lock the central artwork to 1200 px, and replace the old no-romanization rule with a Zhuyin row followed by a tone-marked Hanyu Pinyin row.

**Architecture:** This is a docs-and-assets-only change. GitHub stores the normative layout contract, prompts, skill instructions, review checklist, and Drive references; Google Drive stores the approved PNG and archived superseded template.

**Tech Stack:** Markdown specifications, repository-local Agent skill, Google Drive PNG assets, SHA-256 verification.

## Global Constraints

- Exact canvas: `1024 × 2000 px`.
- Header: `360 px`, `y = 0–359`.
- Main artwork: `1200 px`, `y = 360–1559`.
- Footer: `440 px`, `y = 1560–1999`.
- Zhuyin is one row immediately below the four-character title.
- Tone-marked lowercase Hanyu Pinyin is one row immediately below Zhuyin.
- Existing rarity, difficulty, UR-license, source, theme-badge, motto, and review gates remain in force.
- No production code, dependency, level, progress-schema, or payment change.

---

### Task 1: Register the approved v2.6 asset

**Files:**
- Create: `docs/superpowers/specs/2026-08-06-card-template-v2.6-dimension-and-pronunciation-amendment.md`
- Modify: `docs/card-prompts/manifest.md`

**Interfaces:**
- Consumes: Drive File ID `1nfFsm6s03fl9XFq_sca98BIkfNLFTs07`.
- Produces: one auditable v2.6 template record with exact dimensions and SHA-256.

- [ ] **Step 1: Verify the local PNG**

Run:

```bash
python - <<'PY'
from pathlib import Path
from PIL import Image
import hashlib
p = Path('CICG_CardTemplate_Rarity_SSR_v2.6_Approved.png')
assert Image.open(p).size == (1024, 2000)
assert hashlib.sha256(p.read_bytes()).hexdigest() == 'b6579984b8ade9632ac9113f2a1365ed25b79ffac67c6f28fb2cd571fc058348'
print('template verified')
PY
```

Expected: `template verified`.

- [ ] **Step 2: Confirm Drive evidence**

Confirm the uploaded file is named:

```text
CICG_CardTemplate_Rarity_SSR_v2.6_Approved.png
```

and has Drive File ID:

```text
1nfFsm6s03fl9XFq_sca98BIkfNLFTs07
```

- [ ] **Step 3: Confirm superseded SSR v2.5 archive location**

Confirm the old SSR v2.5 template is under:

```text
90_Archive/Idiom_Cards/Templates_v2.5
```

- [ ] **Step 4: Commit the specification and Manifest evidence**

```bash
git add docs/superpowers/specs/2026-08-06-card-template-v2.6-dimension-and-pronunciation-amendment.md docs/card-prompts/manifest.md
git commit -m "docs: register v2.6 card template evidence"
```

---

### Task 2: Update normative entry points

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/superpowers/specs/README.md`
- Modify: `docs/card-prompts/README.md`

**Interfaces:**
- Consumes: v2.6 specification path and fixed layout contract.
- Produces: a single authoritative read order for all future Agents.

- [ ] **Step 1: Add v2.6 to every required-read list**

Place this file after the v2.1 historical amendment:

```text
docs/superpowers/specs/2026-08-06-card-template-v2.6-dimension-and-pronunciation-amendment.md
```

- [ ] **Step 2: Replace active 2:3 and no-Pinyin gates**

The active entry points must state:

```text
1024 × 2000 px
header 360 px
main artwork 1200 px
footer 440 px
Zhuyin row below title
Hanyu Pinyin row below Zhuyin
```

- [ ] **Step 3: Preserve historical context**

Keep v2.1 listed as a historical prerequisite, but explicitly state that v2.6 overrides its size, aspect-ratio, vertical-Zhuyin, and no-romanization clauses.

- [ ] **Step 4: Commit entry-point updates**

```bash
git add AGENTS.md docs/superpowers/specs/README.md docs/card-prompts/README.md
git commit -m "docs: point card generation to v2.6 layout"
```

---

### Task 3: Update the prompt stack

**Files:**
- Modify: `docs/card-prompts/PROJECT_PROMPT.md`
- Modify: `docs/card-prompts/shared/card-master-prompt.md`
- Modify: `docs/card-prompts/shared/negative-constraints.md`

**Interfaces:**
- Consumes: v2.6 coordinate and pronunciation contract.
- Produces: prompts that request the same geometry and text order.

- [ ] **Step 1: Set project prompt version to v2.6**

Replace the active template gate with the exact 1024 × 2000 coordinate contract.

- [ ] **Step 2: Add pronunciation data to the pre-generation content table**

Require:

```text
逐字注音：
漢語拼音：
```

- [ ] **Step 3: Update the master prompt**

Require the header order:

```text
四字主標
→ 注音橫列
→ 帶聲調漢語拼音橫列
→ 白話副標
```

- [ ] **Step 4: Update negative constraints**

Forbid missing or malformed Pinyin rather than forbidding all romanization:

```text
不得使用數字聲調
不得省略正式拼音聲調符號
不得把拼音放到注音上方
```

- [ ] **Step 5: Commit prompt updates**

```bash
git add docs/card-prompts/PROJECT_PROMPT.md docs/card-prompts/shared/card-master-prompt.md docs/card-prompts/shared/negative-constraints.md
git commit -m "docs: update prompts for v2.6 pronunciation layout"
```

---

### Task 4: Update the repository-local generation skill

**Files:**
- Modify: `.agents/skills/generating-cicg-idiom-cards/SKILL.md`
- Modify: `.agents/skills/generating-cicg-idiom-cards/references/required-specs.md`
- Modify: `.agents/skills/generating-cicg-idiom-cards/references/review-checklist.md`

**Interfaces:**
- Consumes: v2.6 spec and prompt-stack changes.
- Produces: consistent future behavior across new chats and Agents.

- [ ] **Step 1: Update the production contract**

Require four Zhuyin groups and four tone-marked Pinyin syllables.

- [ ] **Step 2: Update permanent gates**

Replace the v2.1 portrait 2:3 gate with the exact v2.6 coordinates.

- [ ] **Step 3: Update required-spec order**

Add the v2.6 amendment after the v2.1 historical amendment and state that v2.6 overrides conflicting layout clauses.

- [ ] **Step 4: Update review checks**

Add exact dimension, section-height, Zhuyin-row, and Pinyin-row checks.

- [ ] **Step 5: Commit skill updates**

```bash
git add .agents/skills/generating-cicg-idiom-cards
git commit -m "docs: teach card skill the v2.6 template"
```

---

### Task 5: Verify and deliver

**Files:**
- Verify: all modified Markdown files
- Verify: Drive v2.6 template and archive evidence

**Interfaces:**
- Consumes: all prior tasks.
- Produces: a docs-only PR ready for audit and squash merge.

- [ ] **Step 1: Search for active conflicting rules**

Run:

```bash
git grep -nE '1024 × 1536|直式 `2:3`|禁止.*羅馬拼音|No Hanyu Pinyin|No .*romanization' -- AGENTS.md docs/card-prompts .agents/skills docs/superpowers/specs/README.md
```

Expected: only historical or explicitly superseded references remain.

- [ ] **Step 2: Search for the new fixed contract**

Run:

```bash
git grep -nE '1024 × 2000|1200 px|y = 360–1559|漢語拼音' -- AGENTS.md docs/card-prompts .agents/skills docs/superpowers/specs
```

Expected: all active entry points and checklists contain the v2.6 contract.

- [ ] **Step 3: Run repository verification**

```bash
npm install
./scripts/verify.sh
```

Record the actual test, TypeScript, ESLint, build, PWA, and audit results. Do not reuse previous counts.

- [ ] **Step 4: Open the docs-only PR**

Use base `main` and head `docs/card-template-v2-6-1024x2000`.

- [ ] **Step 5: Confirm merge gates**

Confirm:

```text
behind_by = 0
CI = green
unresolved review threads = 0
Drive v2.6 File ID recorded
ChatGPT Audit completed
```

- [ ] **Step 6: Squash merge**

Merge only after all gates pass.
