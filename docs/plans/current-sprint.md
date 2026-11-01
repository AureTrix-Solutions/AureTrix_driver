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
Next: REVIEWER session — "follow docs/plans/reviews/review-layout-preview-docs.md". Review base `a846953` .. head `98d5e7d` (diff touches only docs/pages/LayoutPreview.md + this file's checkpoints). On PASS: flip Task 1 → DONE, advance ▶ RUN THIS to PM-close. On FAIL: detail in review file + fix checklist here.

## Tasks
1. **LayoutPreview.md ↔ LayoutPreview.vue reconciliation** — [high-stakes] — STATUS: IN-REVIEW
   - ✓ 1a (62a07b1) Component Setup + gridStyle · ✓ 1b (7d12843) getKeyStyle + updateLayout · ✓ 1c (0a3b404) NEW Load Custom Layouts §4 + Restore §5 · ✓ 1d (98d5e7d) Edits 7-16 prose/diagram. All 14 Done-when greps pass at head; inline-defect scan clean; doc 387 lines. Review file: `docs/plans/reviews/review-layout-preview-docs.md` (base a846953, head 98d5e7d).

## Findings
(empty — append ONE line per out-of-scope defect/idea: what + where to verify)
