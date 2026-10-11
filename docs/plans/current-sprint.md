# SPRINT: sprint-08-types-dedupe

**GOAL:** Replace the hand-mirrored declarations in `src/types/types.ts` with types derived from the SDK's public type surface (PO-approved A1 + B1, 2026-10-11): `IDefKeyInfo` derived from the protocol-keyboard root import; `DksLayoutType`/`DksType` re-exported via a type-only deep-path import from sdk-keyboard.
**DONE-CRITERIA (sprint):** `npm run typecheck` clean (baseline 0), `npm run build` passes, all 13 consumer files import unchanged, and `src/types/types.ts` contains no literal `Layout_*` unions and no hand-written `keyValue` declaration. Reviewer PASS on the single [high-stakes] task.
**Started:** 2026-10-11  ·  **Status:** ALL TASKS DONE — awaiting PO sign-off (PM-close)

## Checkpoint
- Branch: `sprint-08-types-dedupe`
- tsc baseline: 0 errors (docs/tsc-baseline.txt — unchanged; Reviewer re-ran typecheck 0 + build ✓ 1.58s)
- Cleanup: `.scratch/` has pm-notes.md (PM working file, PO may delete); `_to_delete/` empty (from actual ls at PM-open)
<!-- Session-start check: on sprint branch (not main) + clean tree. Uncommitted changes → STOP, report.
     Updating a task's status REPLACES its one checkpoint line — never append a second paragraph. -->

## ▶ RUN THIS
Next: PM-CLOSE window — "Act as PM per CLAUDE.md. All tasks DONE; assemble work + QA verdicts vs the goal for my sign-off; on acceptance archive, on rejection revise." Route the Findings line below at close. No further Worker or Reviewer tasks.

## Tasks
1. ✓ **Dedupe src/types/types.ts against the SDK type surface** — [high-stakes] — DONE (Reviewer PASS 2026-10-11, 0 fails; Worker @ 8ae0faf; verdict + evidence in docs/plans/reviews/review-types-dedupe.md)

## Findings (raw — PM routes at close)
- Done-when greps that count a PHRASE (`grep -c "import type"`) also match the spec's own comment prose — this task's criterion computed 4 vs expected 2 while the code was correct; count STATEMENTS with an anchor (`^import type`) instead. Verify: Done-when block of sprint-08 Task 1 above + review-types-dedupe.md Evidence. (Reviewer, 2026-10-11.)

<!-- Keep this file under ~150 lines. SNAPSHOT, not a log. -->
