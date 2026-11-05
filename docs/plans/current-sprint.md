# SPRINT: sprint-31-docs-pages-verify-6

**GOAL:** SingleKeyTravel.md matches the current SingleKeyTravel.vue — fix all PM-verified drift (phantom baseLayout prop + binding, dead update-overlay emit, wrong event payloads, phantom 300ms/null overlay flow, stale code snippets, overlay-scope claims, re-click matrix row).
**DONE-CRITERIA (sprint):** All Task 1 sub-task Done-when greps green; Reviewer PASS on review-singlekeytravel.md; PO sign-off.
**Started:** 2026-11-04  ·  **Status:** IN PROGRESS

## Checkpoint
- Branch: `sprint-31-docs-pages-verify-6`
- tsc baseline: 0 errors (docs/tsc-baseline.txt) — docs-only sprint; self-check gate SKIPPED (no source changes)
- Cleanup (actual `ls`, after 1d): `.scratch/` = pm-notes.md only (PM's, PO may delete); `_to_delete/` = empty, nothing to git rm
- Split rationale: 4 sub-tasks × (≤11 edits, ≤35 new lines authored) → sequential 1a→1b→1c→1d, ONE Reviewer over cumulative base..head after 1d
- PM research banked in `.scratch/pm-notes.md` F5–F26 (private). Specs below are final — Worker APPLIES, does not re-derive. Line refs below drift as edits land — grep the quoted text, don't trust numbers.

## ▶ RUN THIS
Next: Reviewer window — "follow docs/plans/reviews/review-singlekeytravel.md" (ONE pass over cumulative diff d5ce52c..8e2d320; re-run all four Done-when sets; note the two 1b snapshot-superseded criteria documented in the review file). On PASS → parent DONE, advance to PM-close; on FAIL → fix checklist here.

## Tasks
1. **Fix SingleKeyTravel.md drift (24 edits, docs-only)** — [high-stakes] — STATUS: IN-REVIEW (review-singlekeytravel.md written; base `d5ce52c`, head `8e2d320`; Reviewer runs ONCE over cumulative diff)
   - Files: `docs/pages/SingleKeyTravel.md` ONLY. No src edits anywhere in this sprint.

   **1a.** ✓ DONE (`74bea7a`) — 10 edits; D1 grep nothing, D2 NEVER emitted =1
   **1b.** ✓ DONE (`2afbca1`) — updateSingleKeyAll snippet verbatim from .vue (dedent-4, diff-clean). Its two "=2/=1" count criteria were snapshots superseded by 1c (final 3/0 — both per plan's "fixed in 1c" annotation; documented in review file, not a defect)
   **1c.** ✓ DONE (`61f9e4f`) — 6 edits; D1 grep nothing, D2 console.error =3 ≥2
   **1d.** ✓ DONE (`8e2d320`) — 7 edits verbatim (workflows 5×, matrix re-click row, KeyTravel.vue binding, Event-Flow scope line); D1 grep nothing (exit 1), handleModeChange =1, wc =620 ∈ 590–650; docs-only so self-check gate skipped; cleanup (actual ls): .scratch/=pm-notes.md, _to_delete/=empty

## Findings
- (PM-open) KeyTravel.vue `setSingleOverlay` param typed `(data: {travel; pressDead; releaseDead} | null)` but child emits boolean — stale annotation; relay still works (re-emits arg unchanged). Verify: grep `const setSingleOverlay` in src/components/performance/KeyTravel.vue. Route to the KeyTravel.md backlog row at PM-close.

## Close checklist (PM-close only)
1. All tasks DONE + Reviewer PASS + PO sign-off  2. Route Findings → backlog  3. Snapshot → archive/sprint-31-docs-pages-verify-6/sprint.md  4. git mv review file into archive  5. Repoint backlog pointers  6. index.md row 31 = `signed off`  7. Reset this file to IDLE stub (verbatim from template)  8. One close commit
