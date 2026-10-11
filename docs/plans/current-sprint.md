# SPRINT: sprint-07-tsc-errors

**GOAL:** Drive the tsc baseline from 23 errors to 0 — add the missing `*.vue` ambient shim (kills 18 TS2307) and migrate both stores' `persist.paths` → `persist.pick` for pinia-plugin-persistedstate v4 (kills 2 TS2769 + 3 cascaded TS2339), then re-baseline docs/tsc-baseline.txt to 0.
**DONE-CRITERIA (sprint):** `npm run typecheck` reports 0 errors; docs/tsc-baseline.txt records baseline 0; persistence behavior byte-identical (PO decision 2026-10-11: preserve current).
**Started:** 2026-10-11  ·  **Status:** ALL TASKS DONE — awaiting PO sign-off
<!-- revN (YYYY-MM-DD): <what changed>   ← log revisions here, newest last -->

## Checkpoint
- Branch: `sprint-07-tsc-errors`
- tsc baseline: 0 errors — typecheck reports 0, docs/tsc-baseline.txt re-ratcheted 23 → 0 (Task 2)
- Cleanup (actual ls at Reviewer close): `.scratch/` has only pm-notes.md (PM's own working file); `_to_delete/` has only .gitkeep. No cleanup needed.
<!-- Session-start check: on sprint branch (not main) + clean tree. Uncommitted changes → STOP, report.
     Do NOT record or update a commit hash here — git log is the source of truth.
     Updating a task's status REPLACES its one checkpoint line — never append a second paragraph.
     On resume, trust this checkpoint as the plan; consult only the compiler for results. -->

## ▶ RUN THIS
ALL TASKS DONE — awaiting PO sign-off. Next: PO reviews the sprint goal vs the work (Task 1 ✓ shim, Task 2 ✓ Reviewer PASS); on acceptance open a PM-close window — "Act as PM per CLAUDE.md. All tasks DONE; assemble work + QA verdicts vs the goal for my sign-off; on acceptance archive, on rejection revise."

## Tasks

1. ✓ **Add the `*.vue` ambient module shim** — [trivial] — DONE (shim created; typecheck 23 → 5, TS2307 = 0, remaining 5 = exactly the predicted 2× TS2769 + 3× TS2339)

2. ✓ **Migrate `persist.paths` → `persist.pick` in both stores + re-baseline to 0** — [high-stakes] — DONE (Reviewer PASS 2026-10-11, fail count 0 — all criteria re-verified independently; detail in docs/plans/reviews/review-persist-pick.md)

## Findings
<!-- raw lines only — defect + where to verify; PM routes them at next touchpoint -->
- (none yet)
