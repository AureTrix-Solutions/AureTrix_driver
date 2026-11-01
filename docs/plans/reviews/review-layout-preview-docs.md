# REVIEW: layout-preview-docs

<!-- WORKER fills everything above the verdict line. REVIEWER fills the verdict section. -->

**SPRINT GOAL:** Reconcile docs/pages/LayoutPreview.md with src/pages/LayoutPreview.vue — document the shipped custom-layouts feature (IndexedDB optgroup, loadCustomLayouts, productName selection) and fix all stale snippets/prose.
**TASK:** LayoutPreview.md ↔ LayoutPreview.vue reconciliation (sub-tasks 1a→1d, cumulative review)  ·  **TAG:** [high-stakes]
**DONE WHEN:**
- 1a: `grep -n 'ref<any' docs/pages/LayoutPreview.md` returns nothing
- 1a: `grep -c 'layoutData' docs/pages/LayoutPreview.md` prints ≥2 (was exactly 2 at 1a; now 5 after 1d prose adds)
- 1a: `grep -c 'selectedLayout.value ?? 82' docs/pages/LayoutPreview.md` printed `2` at 1a (getKeyStyle + updateLayout remained until 1b)
- 1b: `grep -n 'selectedLayout.value ?? 82' docs/pages/LayoutPreview.md` returns nothing
- 1b: `grep -n 'rowLength' docs/pages/LayoutPreview.md` returns ≥1 line
- 1b: `grep -c 'getLayoutConfig(keyCount' docs/pages/LayoutPreview.md` prints `1` (was exactly 1 at 1b; now 2 after 1d diagram edit)
- 1c: `grep -c 'loadCustomLayouts' docs/pages/LayoutPreview.md` prints ≥2 (was exactly 2 at 1c; now 3 after 1d diagram edit)
- 1c: `grep -n 'isCustom' docs/pages/LayoutPreview.md` returns ≥1 line
- 1c: `grep -c 'onMounted(async' docs/pages/LayoutPreview.md` prints `1`
- 1c: `grep -n '#### 5\. \*\*Restore' docs/pages/LayoutPreview.md` returns exactly 1 line
- 1d: `grep -n 'Custom layout editor' docs/pages/LayoutPreview.md` returns nothing
- 1d: `grep -n 'optgroup' docs/pages/LayoutPreview.md` returns ≥1 line
- 1d: `grep -c 'LayoutStorageService' docs/pages/LayoutPreview.md` prints ≥2
- 1d: `grep -n 'getLayoutConfig(selectedLayout' docs/pages/LayoutPreview.md` returns nothing
<!-- If a criterion is revised after this file exists, UPDATE it here too — the Reviewer judges
     this file, not current-sprint.md. -->

## 📝 Worker notes & self-check
- 1a (commit 62a07b1): Component Setup snippet → `<script lang="ts">` w/ number|string|null selectedLayout, customLayouts, layoutData refs; gridStyle block → `computed<CSSProperties>` reading `layoutData.value` (both verbatim from src). Doc file is CRLF — python-based replacement used for the gridStyle block.
- 1b (commit 7d12843): getKeyStyle block → src version w/ rowLength guard + topGapPx; updateLayout block → src version w/ productName/keyCount split + 6-param getLayoutConfig call.
- 1c (commit 0a3b404): NEW `#### 4. **Load Custom Layouts**` subsection inserted verbatim (src:115-122); old §4 Restore renumbered → `#### 5.` with async onMounted/loadCustomLayouts/isCustom productName restore block (src:125-144).
- 1d (commit 98d5e7d): Edits 7-16 prose/diagram point edits — "Seven built-in layouts" + custom-layouts bullets (Key Features, UI Elements), refreshCustomLayouts + LayoutStorageService dependency lines, productName in Storage value/diagram/persistence/error-handling lines, deleted shipped "Custom layout editor" Future Enhancement, Developer Notes add-layouts line split built-in vs custom.
- All replacement text was grep/awk-verified against src/pages/LayoutPreview.vue + src/utils/layoutConfigs.ts + src/services/LayoutStorageService.ts at PM-open and applied verbatim; no re-derivation.
- Inline-defect scan at handoff: no external links, no TODO/TBD/FIXME, no trailing-whitespace anomalies; section numbering consistent (§1-§5 Implementation Details); doc 387 lines.
- Self-check vs sdk-reference-v2.md: N/A — docs-only task, no SDK claims touched (doc references getLayoutConfig/LayoutStorageService, both verified against repo source, not SDK).
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (untouched)
- typecheck/build: N/A — docs-only; code self-check gate SKIPPED per sprint checkpoint (baseline file currently 0).

## 🔍 Commits to review
Base: `a846953` (PM-open commit, branch point)   Head: `98d5e7d` (1d, final sub-task)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat a846953..98d5e7d     then      git diff a846953..98d5e7d
     A file touched outside this task's scope is a flag.
     NOTE: docs/plans/current-sprint.md appears in the diff — that is checkpoint/status
     bookkeeping by the Worker (per protocol), expected, not a scope violation. The only
     SOURCE-of-truth file edited is docs/pages/LayoutPreview.md. -->
Fix-round ranges (added on each re-review): none

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task (documentation only; no hardware behavior touched).

## ❓ Reviewer, please confirm
- [ ] meets every "DONE WHEN" criterion above (run each grep against current HEAD)
- [ ] diff scope matches the task (only docs/pages/LayoutPreview.md + current-sprint.md checkpoints; review file itself excluded)
- [ ] doc snippets match src/pages/LayoutPreview.vue verbatim (identifiers/values; condensed formatting allowed)
- [ ] no design-intent violation
- [ ] typecheck/build gate: N/A (docs-only)
- [ ] tag is correct: [high-stakes] (multi-part doc reconciliation, PM-assigned)

---
## ✅ REVIEWER VERDICT
<!-- After ONE verification pass, RULE. Output = PASS/FAIL + findings + Findings one-liners. -->
**Result:** FAIL  ·  **Date:** 2026-11-01  ·  **Fail count:** 1

All 14 grep criteria were re-run against HEAD (24180c5; doc identical to declared head 98d5e7d — `git diff 98d5e7d..24180c5 -- docs/pages/LayoutPreview.md` is empty). 13/14 PASS as annotated. Scope clean (only LayoutPreview.md + current-sprint.md checkpoints). All six snippet blocks verified verbatim against src/pages/LayoutPreview.vue L54-150 (identifiers/values identical; only allowed condensation: indent, trailing `;`, comment wording, ellipsis). Design-intent untouched. Tag [high-stakes] correct.

### Failed items (FAIL only)
**F1 — Stale criterion in THIS review file (self-created inconsistency; QA tier → FAIL, quick fix-round clears it).**
- Line 13: `- 1b: \`grep -c 'getLayoutConfig(keyCount' docs/pages/LayoutPreview.md\` prints \`1\`` — actual count at HEAD is **2** (doc L128 = updateLayout snippet, 1b; doc L202 = data-flow diagram line, a *planned* 1d edit per Worker notes: "productName in Storage value/diagram/persistence lines").
- Verified: at 1b commit 7d12843 the count WAS 1 (`git show 7d12843:docs/pages/LayoutPreview.md | grep -c 'getLayoutConfig(keyCount'` → 1). The criterion was accurate when written but the Worker's own 1d diagram edit made it stale — and the Worker annotated the two parallel criteria (L9 `layoutData` 2→5, L14 `loadCustomLayouts` 2→3) but missed this one.
- Per this file's own rule ("If a criterion is revised after this file exists, UPDATE it here too"), the revision never landed.
- **Fix (Worker, fix ONLY this):** annotate line 13 to match the L9/L14 pattern — e.g. append `(was exactly 1 at 1b; now 2 after 1d diagram edit)`. NO change to docs/pages/LayoutPreview.md — the doc content is correct; L202 `getLayoutConfig(keyCount, ..., productName) → layoutData` accurately reflects src.

### Findings (non-defect observations)
(none)
