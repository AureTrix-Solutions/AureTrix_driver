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
Next: Task 2 — README + CONTRIBUTING pnpm→npm and URL fixes. Do this task, then stop.

## Tasks
✓ 1. **package.json + lockfile migration** — DONE (2026-10-09, Reviewer PASS — review-npm-lockfile.md; `_to_delete/` awaits PO `git rm`)
2. **README + CONTRIBUTING pnpm→npm and URL fixes** — [trivial] — STATUS: PENDING
   - Trivial rationale: docs-only; every edit listed with verified line content; no source file needs opening.
   - Done when: `grep -riE "pnpm|BlastHappy82" README.md .github/CONTRIBUTING.md` → 0 hits (fork-placeholder `YOUR_USERNAME` at CONTRIBUTING.md:34 stays).
   - Files: `README.md`, `.github/CONTRIBUTING.md`
   - Edits — README.md (APPLY):
     1. L7, L46, L220: `BlastHappy82/AureTrix_driver` → `AureTrix-Solutions/AureTrix_driver` (keep L46's `.git` suffix and L220's `/issues` suffix)
     2. L37: `- **pnpm** v9 or higher (recommended) or npm` → `- **npm** (bundled with Node.js)`
     3. L52: `pnpm install` → `npm install`
     4. L57: `pnpm dev` → `npm run dev`
     5. L63: `pnpm build` → `npm run build`
     6. L110: `- **Package Manager**: pnpm` → `- **Package Manager**: npm`
   - Edits — .github/CONTRIBUTING.md (APPLY):
     7. L18: CoC URL `BlastHappy82/AureTrix_driver?tab=coc-ov-file` → `AureTrix-Solutions/AureTrix_driver?tab=coc-ov-file`
     8. L39: upstream remote `BlastHappy82/AureTrix_driver.git` → `AureTrix-Solutions/AureTrix_driver.git`
     9. L25: same prereq swap as README L37
     10. L46/51/57/62: `pnpm install`→`npm install`, `pnpm dev`→`npm run dev`, `pnpm test`→`npm test`, `pnpm build`→`npm run build`
   - Canonical remote (verified in .git/config): `https://github.com/AureTrix-Solutions/AureTrix_driver.git`
   - Scope: CONTRIBUTING.md wasn't in the backlog worklist but carries the identical defect — PO confirmed inclusion at plan time (2026-10-09). Settled; do not re-ask.
   - Commit `sprint-02-npm-cleanup: Task 2 docs pnpm→npm + URL fixes`; mark DONE (trivial, self-check = the grep gate).
   - On DONE: flag "ALL TASKS DONE — awaiting PO sign-off" in the checkpoint and stop; advance ▶ RUN THIS to "await PM-close".

<!-- STATUS values:
     PENDING → IN-PROGRESS → (DONE | IN-REVIEW → DONE)
     high-stakes:  IN-REVIEW → DONE (PASS) | → IN-PROGRESS (FAIL)
     Collapse a finished task to one line:  ✓ 1. <title> — DONE (YYYY-MM-DD) -->

## Findings (raw — PM routes at close)
- `npm install` reports 3 audit vulnerabilities (1 moderate, 2 critical), pre-existing in the dep graph — verify with `npm audit`; out of this sprint's migration scope.

<!-- Keep this file under ~150 lines. It is a SNAPSHOT, not a log. Overwrite, don't append. -->
