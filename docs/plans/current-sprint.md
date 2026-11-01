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
Next: REVIEWER re-check — "follow docs/plans/reviews/review-layout-preview-docs.md". Re-check ONLY the F1 fix (review-file line 13 annotation); all other items already PASSED 2026-11-01. Fix commit: review file only, docs/pages/LayoutPreview.md untouched. On PASS → Task 1 DONE + advance.

## Tasks
1. **LayoutPreview.md ↔ LayoutPreview.vue reconciliation** — [high-stakes] — STATUS: IN-REVIEW
   - Fix-round done 2026-11-01: F1 fixed — review-file L13 annotated `(was exactly 1 at 1b; now 2 after 1d diagram edit)`; grep count = 2 at HEAD confirmed. docs/pages/LayoutPreview.md untouched. ✓ 1a-1d (62a07b1/7d12843/0a3b404/98d5e7d). Awaiting Reviewer F1-only re-check.

## Findings
(empty — append ONE line per out-of-scope defect/idea: what + where to verify)
