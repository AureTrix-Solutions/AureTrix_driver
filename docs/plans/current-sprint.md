# SPRINT: sprint-24-sdk-ref-s9-verify

**GOAL:** Reconcile docs/sdk-reference-v2.md §9 (Config import/export & firmware) with the current implementation — repair drift from the sprint-12/21 ExportService work. PM-open swept every §9 claim against installed sdk-keyboard 1.0.20 (locked; protocol-keyboard 1.0.6): 4 in-§9 drifts found → Task 1; all other §9 claims RE-VERIFIED HOLD; out-of-§9 drift routed to backlog.md (Document issues) at PM-open.
**DONE-CRITERIA (sprint):** Task 1's 4 edits applied exactly as specced; `git show --stat` touches ONLY docs/sdk-reference-v2.md; every Done-when grep passes; Reviewer PASS. Docs-only sprint → typecheck/build gate N/A (no .ts/.vue touched), but hand off free of inline-fixable defects.

<!-- rev0 (2026-10-29): sprint opened by PM. Full claim sweep + bundle re-verification done at PM-open (evidence was in .scratch/pm-notes.md — private, recreated per PM session; the verified FACTS live in the Task 1 spec below). -->
<!-- rev1 (2026-11-01): F1 upheld and revised — Done-when 5's bare `all three import sites` → 0 grep was unsatisfiable in scope (§13.7's own intro :3783 keeps the phrase; out of scope + already backlogged under Document issues). Grep re-scoped to the E4 anchor: old anchor → 0 AND new anchor → 1 (both re-verified this session). No Worker edit was needed. -->

## Checkpoint
- Branch: `sprint-24-sdk-ref-s9-verify` — clean at PM-open; base HEAD `59baae1`
- tsc baseline: 0 errors (docs/tsc-baseline.txt) — gate N/A (docs-only)
- Cleanup (actual `ls` at PM-open): `.scratch/` has pm-notes.md (PO may delete); `_to_delete/` empty (only .gitkeep)
- rev1 (2026-11-01, PM revision session): F1 upheld — Done-when 5 revised to the E4-anchor grep (old → 0 AND new → 1, both re-verified on tree); residual at :3783 = §13.7 intro, covered by the existing backlog Document-issues item, no new entry. Task 1 → IN-REVIEW; review-s9-verify.md created (Base `59baae1` → Head `563e0a0`); ▶ RUN THIS → Reviewer. Session start: tree clean, HEAD `5d56f8d`.

## ▶ RUN THIS
> **ALL TASKS DONE — awaiting PO sign-off.** No task remains; do NOT start new work.
> Next step is **PM-close**: "Act as PM per CLAUDE.md. All tasks DONE; assemble work + QA verdicts vs the
> goal for my sign-off; on acceptance archive, on rejection revise." (Reviewer PASS on the sole task;
> docs-only sprint → no [hw] gate, no typecheck/build gate.)

## Tasks
1. ✓ **Apply the 4 in-§9 drift fixes to docs/sdk-reference-v2.md** — [high-stakes] — **DONE** (Reviewer **PASS** 2026-11-01, 0 fails; 7/7 Done-when criteria met incl. criterion 5 as revised by rev1). E1–E4 in `563e0a0` (ONLY docs/sdk-reference-v2.md; 3 hunks, all inside §9 :2226–:2508; :154 + §13.7 untouched). E1's SDK behavioral claim independently re-verified against installed bundle 1.0.20 + `.d.ts` (`export.d.ts:22 private setMacro;` sync vs `higherKey.d.ts:26 …Promise<any>` async) — the rewrite is correct. Detail: docs/plans/reviews/review-s9-verify.md. Cleanup: `.scratch/` = pm-notes.md + review-notes.md (PO may delete); `_to_delete/` empty.

## Findings (raw — PM routes at close)
- F1 (WRONG DONE-CRITERION — this sprint, Task 1): Done-when `grep -cF "all three import sites" docs/sdk-reference-v2.md → 0` is unsatisfiable within Task 1's scope. E4 replaces that phrase only at its §9.2 anchor (:2399); a second, distinct occurrence lives in §13.7's own intro (`grep -n "all three import sites" docs/sdk-reference-v2.md` → :3783), which E4 explicitly declares out of scope and Done-when 7 forbids touching. Verify: after applying E4 verbatim the grep returns 1 (commit `563e0a0`). Criterion needs PM revision (scope the grep to the E4 anchor phrase), not a Worker edit. → **ROUTED (rev1, 2026-11-01): revised in place — Done-when 5 now greps the E4 anchor (old → 0 AND new → 1); residual :3783 is §13.7's own intro, already covered by the backlog Document-issues item; no new backlog entry.**
- F2 (REVIEWER — stale line numbers in the BACKLOG entry itself, not a code defect): backlog.md's `[docs] sdk-reference-v2.md stale app line-refs` item cites the §13.7 `ExportService.ts:3` refs "at :3839 and :3955", but Task 1's edits added **+6 net lines** to §9 (11 insertions − 5 deletions), so both have drifted to **:3845 and :3961**. Sub-item (b)'s count refs (:179/:3773/:3777) may have drifted too. Verify: `grep -nE '^#+ 13\.7' docs/sdk-reference-v2.md` (→ :3779) then `grep -nF "ExportService.ts:3" docs/sdk-reference-v2.md`. Not a Task 1 failure — the edits are correct and §13.7 was properly untouched; this is the backlog pointer having gone stale under a doc edit, which is the general rot the entry itself warns about ("Verify each against current source before editing").
<!-- Out-of-§9 drift found at PM-open was routed DIRECTLY to backlog.md (Document issues) — PM is sole backlog writer; no need to re-route at close. -->
