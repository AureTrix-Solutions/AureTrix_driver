# SPRINT: sprint-02-npm-cleanup

**GOAL:** Finish the pnpm→npm migration: package.json, lockfiles, and contributor docs all speak npm and point at the AureTrix-Solutions repo.
**DONE-CRITERIA (sprint):** No pnpm references remain in package.json, package-lock.json, README.md, or .github/CONTRIBUTING.md (the harmless `.gitignore` pnpm-debug glob stays); pnpm lockfiles moved to `_to_delete/`; `npm install` + `npm run build` pass on the regenerated lockfile; typecheck still ≤ 23.
**Started:** 2026-10-09  ·  **Status:** IN PROGRESS

## Checkpoint
- Branch: `sprint-02-npm-cleanup`
- tsc baseline: 23 errors (docs/tsc-baseline.txt) — this sprint touches no source, so it must stay 23
- Cleanup: `.scratch/` empty; `_to_delete/` holds pnpm-lock.yaml + pnpm-workspace.yaml (PO must `git rm`)
- PM-open: backlog item "npm cleanup" removed from backlog.md; sprint planned from it
<!-- Session-start check: on sprint branch (not main) + clean tree. Uncommitted changes → STOP, report.
     Do NOT record or update a commit hash here — git log is the source of truth.
     Updating a task's status REPLACES its one checkpoint line — never append a second paragraph.
     On resume, trust this checkpoint as the plan; consult only the compiler for results. -->

## ▶ RUN THIS
ALL TASKS DONE — awaiting PO sign-off; next session: PM-close ("Act as PM per CLAUDE.md. All tasks DONE; assemble work + QA verdicts vs the goal for my sign-off").

## Tasks
✓ 1. **package.json + lockfile migration** — DONE (2026-10-09, Reviewer PASS — review-npm-lockfile.md; `_to_delete/` awaits PO `git rm`)
✓ 2. **README + CONTRIBUTING pnpm→npm and URL fixes** — DONE (2026-10-09; grep gate 0 hits both files; cleanup from `ls`: `.scratch/` empty, `_to_delete/` = pnpm-lock.yaml + pnpm-workspace.yaml awaiting PO `git rm`)

<!-- STATUS values:
     PENDING → IN-PROGRESS → (DONE | IN-REVIEW → DONE)
     high-stakes:  IN-REVIEW → DONE (PASS) | → IN-PROGRESS (FAIL)
     Collapse a finished task to one line:  ✓ 1. <title> — DONE (YYYY-MM-DD) -->

## Findings (raw — PM routes at close)
- `npm install` reports 3 audit vulnerabilities (1 moderate, 2 critical), pre-existing in the dep graph — verify with `npm audit`; out of this sprint's migration scope.

<!-- Keep this file under ~150 lines. It is a SNAPSHOT, not a log. Overwrite, don't append. -->
