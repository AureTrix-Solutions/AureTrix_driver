# SPRINT: sprint-27-docs-pages-verify-2

**GOAL:** Reconcile docs/pages/LayoutPreview.md with src/pages/LayoutPreview.vue — document the shipped custom-layouts feature (IndexedDB optgroup, loadCustomLayouts, productName selection) and fix all stale snippets/prose.
**DONE-CRITERIA (sprint):** All Task 1a–1d Done-when greps pass; Reviewer PASS over cumulative base..head; doc hands off free of inline-fixable defects.
**Started:** 2026-11-01  ·  **Status:** IN PROGRESS
<!-- revN (YYYY-MM-DD): <what changed>   ← log revisions here, newest last -->

## Checkpoint
- Branch: `sprint-27-docs-pages-verify-2`
- tsc baseline: N/A — docs-only sprint, code self-check gate SKIPPED (baseline file currently 0). Inline-defect duty still applies.
- Cleanup (from actual ls): `.scratch/` has pm-notes.md + review-notes.md (review-notes.md is stale sprint-26 leftover; PO may delete both freely). `_to_delete/` empty.

## ▶ RUN THIS
Next: WORKER fix-round — fix ONLY these (detail in docs/plans/reviews/review-layout-preview-docs.md):
- F1 (review file §Failed items): annotate the stale 1b criterion on review-file line 13 (`grep -c 'getLayoutConfig(keyCount'` "prints 1" → actual 2 after the planned 1d diagram edit) to match the L9/L14 annotation pattern, e.g. append `(was exactly 1 at 1b; now 2 after 1d diagram edit)`. Do NOT touch docs/pages/LayoutPreview.md — the doc itself passed all checks.
Then commit and flip Task 1 → IN-REVIEW for re-check of ONLY this item.

## Tasks
1. **LayoutPreview.md ↔ LayoutPreview.vue reconciliation** — [high-stakes] — STATUS: IN-PROGRESS
   - Reviewer verdict 2026-11-01: FAIL (1 item — F1, stale criterion in review file; doc content clean: 13/14 greps pass, snippets verbatim vs src, scope clean). ✓ 1a-1d all committed (62a07b1/7d12843/0a3b404/98d5e7d). Fix checklist in ▶ RUN THIS.

## Findings
(empty — append ONE line per out-of-scope defect/idea: what + where to verify)
