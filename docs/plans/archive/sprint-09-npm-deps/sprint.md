# SPRINT: sprint-09-npm-deps (ARCHIVED)

**GOAL:** Clear `npm audit` (3 vulnerabilities: 1 moderate @vitest/mocker, 2 critical tinypool) by upgrading vitest 3.2.7 → ^5.0.3, with the repo still green and production deps untouched.
**DONE-CRITERIA (sprint):** `npm audit` reports 0 vulnerabilities; `npm run typecheck` = 0 errors (baseline); `npm run build` passes; vitest 5.x installed; `package.json` dependencies block byte-identical (@sparklinkplayjoy/sdk-keyboard still ^1.0.14).
**Started:** 2026-10-11  ·  **Closed:** 2026-10-11  ·  **Tasks:** 1  ·  **Signed off by:** PO (2026-10-11)

## Checkpoint
- Branch: `sprint-09-npm-deps`
- ✓ Task 1 DONE @ `358e230` — Reviewer PASS 2026-10-11 (all 5 Done-whens independently re-run; detail: review-vitest-5-upgrade.md in this folder). Not [hw].
- tsc baseline: 0 errors (docs/tsc-baseline.txt)
- Cleanup: no cleanup needed (Reviewer's actual ls: `.scratch/` holds only pm-notes.md — PM working file, PO may delete; `_to_delete/` empty/absent)

## ▶ RUN THIS
Next: PO — sprint's only task is DONE (Reviewer PASS). All sprint done-criteria met: audit 0 vulns, vitest 5.0.3, typecheck 0 err (baseline 0), build passes, dependencies block untouched. On acceptance, run PM-close: "Act as PM per CLAUDE.md. All tasks DONE; assemble work + QA verdicts vs the goal for my sign-off; on acceptance archive, on rejection revise."

## Tasks
1. ✓ **Upgrade vitest 3.2.7 → ^5.0.3** — [high-stakes] — DONE @ `358e230`, Reviewer PASS 2026-10-11 (review: review-vitest-5-upgrade.md in this folder). Not [hw].

## Findings
<!-- One line per out-of-scope bug/idea: DEFECT + WHERE TO VERIFY. PM routes these at next touchpoint. -->
(none)

## Close-out
- PM-close: all done-criteria re-verified by PM at close (audit 0 vulns; vitest 5.0.3; package.json diff vs main = 1 line; dependencies block intact).
- Docs scan: no doc outside the sprint files pins a vitest version (CLAUDE.md mentions are generic) — nothing to update.
- Findings routed: none (section empty; Reviewer findings: none).
