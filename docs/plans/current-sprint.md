# SPRINT: sprint-17-code-hygiene-2

**GOAL:** Clear four code-hygiene defects — clarify the getRm6X21Travel wrapper annotation, delete the dead KeyTravel baseLayout prop cascade, and make decryptSDKConfig replicate the SDK import's `keyboards.flat()` so nested-array repairs can't silently skip.
**DONE-CRITERIA (sprint):** All three tasks DONE (Reviewer PASS each); `npm run typecheck` 0 new errors (baseline 0); `npm run build` passes; the two backlog-only observations (superResponse, -Infinity edge) are routed, not coded.
**Started:** 2026-10-24  ·  **Status:** IN PROGRESS

## Checkpoint
- Branch: `sprint-17-code-hygiene-2`
- tsc baseline: 0 errors (docs/tsc-baseline.txt)
- Cleanup: .scratch/ has pm-notes.md + review-notes.md (PO may delete); _to_delete/ empty (from actual ls, task-3 Worker)

## ▶ RUN THIS
**ALL TASKS DONE — awaiting PO sign-off.** Next: PM-close — open a fresh PM window and paste:
  Act as PM per CLAUDE.md. All tasks DONE; assemble work + QA verdicts vs the goal for my sign-off; on acceptance archive, on rejection revise.

## Tasks
1. **getRm6X21Travel clarifying comment** — [high-stakes] — ✓ DONE 2026-10-24 (head `5fb626a`; Reviewer PASS, 0 fails — all 3 Done-when re-run green; see review-getRm6X21Travel-comment.md)

2. **Remove dead baseLayout prop cascade (KeyTravel → Performance binding)** — [high-stakes] — ✓ DONE 2026-10-24 (head `d85ad99`; Reviewer PASS, 0 fails — all 4 Done-when re-run green: greps 0/0/4, typecheck 0, build ✓, diff exactly 2 files −5/+0, no strays; see review-baseLayout-cascade.md)

3. **decryptSDKConfig replicates SDK import's keyboards.flat()** — [high-stakes] (SDK/import correctness) — ✓ DONE 2026-10-24 (head `e604c42`; Reviewer PASS, 0 fails — all 3 Done-when re-run green: grep one hit :861 inside decryptSDKConfig; `config.keyboards ?? []` count 5 unchanged; typecheck 0 errors / no `as any`; build ✓; diff exactly 1 file +5/−1, no strays; see review-decryptSDKConfig-flat.md)

## Findings
<!-- one line per out-of-scope defect: DEFECT + WHERE TO VERIFY, never a fix; PM routes at close -->

## Close-out (PM)
- [ ] All tasks DONE + done-criteria met + baseline final (0) + no waivers
- [ ] Findings routed to backlog
- [ ] Snapshot → docs/plans/archive/sprint-17-code-hygiene-2/sprint.md
- [ ] Review files git mv'd into the archive folder; pointers updated
- [ ] index.md row added (status = signed off)
- [ ] current-sprint.md reset to IDLE stub (live file)
- [ ] One close commit
