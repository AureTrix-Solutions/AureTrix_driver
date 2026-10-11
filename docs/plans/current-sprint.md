# SPRINT: sprint-09-npm-deps

**GOAL:** Clear `npm audit` (3 vulnerabilities: 1 moderate @vitest/mocker, 2 critical tinypool) by upgrading vitest 3.2.7 → ^5.0.3, with the repo still green and production deps untouched.
**DONE-CRITERIA (sprint):** `npm audit` reports 0 vulnerabilities; `npm run typecheck` = 0 errors (baseline); `npm run build` passes; vitest 5.x installed; `package.json` dependencies block byte-identical (@sparklinkplayjoy/sdk-keyboard still ^1.0.14).
**Started:** 2026-10-11  ·  **Status:** ALL TASKS DONE — awaiting PO sign-off
<!-- revN (YYYY-MM-DD): <what changed>   ← log revisions here, newest last -->

## Checkpoint
- Branch: `sprint-09-npm-deps`
- ✓ Task 1 DONE @ `358e230` — Reviewer PASS 2026-10-11 (all 5 Done-whens independently re-run; detail: docs/plans/reviews/review-vitest-5-upgrade.md). Not [hw].
- tsc baseline: 0 errors (docs/tsc-baseline.txt)
- Cleanup: no cleanup needed (Reviewer's actual ls: `.scratch/` holds only pm-notes.md — PM working file, PO may delete; `_to_delete/` empty/absent)
<!-- Session-start check: on sprint branch (not main) + clean tree. Uncommitted changes → STOP, report.
     Updating a task's status REPLACES its one checkpoint line — never append a second paragraph. -->

## ▶ RUN THIS
Next: PO — sprint's only task is DONE (Reviewer PASS). All sprint done-criteria met: audit 0 vulns, vitest 5.0.3, typecheck 0 err (baseline 0), build passes, dependencies block untouched. On acceptance, run PM-close: "Act as PM per CLAUDE.md. All tasks DONE; assemble work + QA verdicts vs the goal for my sign-off; on acceptance archive, on rejection revise."

## Tasks
1. ✓ **Upgrade vitest 3.2.7 → ^5.0.3** — [high-stakes] — DONE @ `358e230`, Reviewer PASS 2026-10-11 (review: docs/plans/reviews/review-vitest-5-upgrade.md). Not [hw].

## Findings
<!-- One line per out-of-scope bug/idea: DEFECT + WHERE TO VERIFY. PM routes these at next touchpoint. -->
(none yet)
