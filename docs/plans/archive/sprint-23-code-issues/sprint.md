# SPRINT 23 ARCHIVE: sprint-23-code-issues

**Goal:** Fix the two sprint-22 code issues pinned AS-IS by tests: travelProfilesStore id collision (Date.now ids) and MappedKeyboard.batchSetKey swallowing resolved Errors.
**Started:** 2026-10-29  ·  **Closed:** 2026-10-29  ·  **Tasks:** 2 (all DONE)  ·  **Signed off by:** PO (2026-10-29)
**QA:** Per-task Reviewer PASS, 0 fails each. Task 1: base `a945680` .. head `1688d4a` (review-travel-uuid-ids.md). Task 2: base `3e98a41` .. head `22dee80` (review-batch-setkey-resolved-errors.md). Final suite rerun at close: 14 files / 175 tests green; typecheck exit 0 (baseline 0 held); lint exit 0. Neither task was [hw]; design intent untouched (wrapper still returns Error, consumer detects it).
**Findings routed to backlog.md at close:** none — Findings section empty; the two sprint-22 Code-issues items are resolved by this sprint (backlog Code issues stays empty).
**Clerical note:** task-1 review file's verdict line is dated 2026-07-06 (Reviewer typo; review commit 3e98a41 is 2026-10-29). Verdict itself (PASS, 0 fails) unaffected; left as-written at PO sign-off.

---

Snapshot of docs/plans/current-sprint.md as of close:

**DONE-CRITERIA (sprint):** Both AS-IS pin tests inverted to the fixed behavior and green; `npm run test:run`, `npm run typecheck`, `npm run lint` all pass; Reviewer PASS on both tasks.

## Checkpoint
- Branch: `sprint-23-code-issues`
- tsc baseline: 0 errors (docs/tsc-baseline.txt) — gate: no new errors; both tasks are logic changes expected to keep 0
- Cleanup: .scratch/ has pm-notes.md (gitignored, PO may delete); _to_delete/ empty (only .gitkeep) — from actual ls at PM-open

## ▶ RUN THIS
ALL TASKS DONE (task 2 Reviewer PASS 2026-10-29) — awaiting PO sign-off. PO: exercise both fixes if desired, then run PM-close — "Act as PM per CLAUDE.md. All tasks DONE; assemble work + QA verdicts vs the goal for my sign-off; on acceptance archive, on rejection revise."

## Tasks
1. **travelProfilesStore: UUID ids** — [high-stakes] — STATUS: DONE
   - ✓ Reviewer PASS 2026-07-06 (0 fails): all 4 Done-when commands rerun green (Date.now grep empty · randomUUID count 1 · 12/12 tests · typecheck 0); diff scope = exactly the 2 task files; AS-IS pin correctly inverted; design intent untouched. Commit 1688d4a; detail in review-travel-uuid-ids.md (this folder).

2. **batchSetKey: detect resolved Errors** — [high-stakes] — STATUS: DONE
   - ✓ Reviewer PASS 2026-10-29 (0 fails): all 4 Done-when commands rerun green (instanceof-Error grep = 3 · batch-watch 8/8 · full suite 175/175 (14 files) · typecheck 0); diff scope = exactly the 2 task files; AS-IS pin correctly inverted to detected-behavior; design intent untouched (wrapper unmodified, consumer detects returned Error). Commit 22dee80; detail in review-batch-setkey-resolved-errors.md (this folder).

## Findings
<!-- Out-of-scope bugs/ideas: ONE line each (defect + where to verify). No fixes here. -->
(none yet)
