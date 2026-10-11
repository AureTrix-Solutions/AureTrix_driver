# SPRINT: sprint-09-npm-deps

**GOAL:** Clear `npm audit` (3 vulnerabilities: 1 moderate @vitest/mocker, 2 critical tinypool) by upgrading vitest 3.2.7 → ^5.0.3, with the repo still green and production deps untouched.
**DONE-CRITERIA (sprint):** `npm audit` reports 0 vulnerabilities; `npm run typecheck` = 0 errors (baseline); `npm run build` passes; vitest 5.x installed; `package.json` dependencies block byte-identical (@sparklinkplayjoy/sdk-keyboard still ^1.0.14).
**Started:** 2026-10-11  ·  **Status:** IN PROGRESS
<!-- revN (YYYY-MM-DD): <what changed>   ← log revisions here, newest last -->

## Checkpoint
- Branch: `sprint-09-npm-deps`
- tsc baseline: 0 errors (docs/tsc-baseline.txt)
- Cleanup: no cleanup needed (actual ls: `.scratch/` holds only pm-notes.md — PM working file; `_to_delete/` does not exist)
<!-- Session-start check: on sprint branch (not main) + clean tree. Uncommitted changes → STOP, report.
     Updating a task's status REPLACES its one checkpoint line — never append a second paragraph. -->

## ▶ RUN THIS
Next: Task 1 — Upgrade vitest to ^5.0.3 and verify audit-clean + green repo. Do this task, then stop.

## Tasks
1. **Upgrade vitest 3.2.7 → ^5.0.3 (clears all 3 audit vulns)** — [high-stakes] — STATUS: IN-PROGRESS (Worker: running `npm install -D vitest@^5.0.3`)
   - Done when: `npm audit` output contains `found 0 vulnerabilities`
   - Done when: `node -p "require('./node_modules/vitest/package.json').version"` prints `5.x` (≥5.0.3)
   - Done when: `npx vitest --version` prints `vitest/5.` prefix
   - Done when: `npm run typecheck` → 0 errors; `npm run build` → exit 0
   - Done when: `git diff HEAD -- package.json` shows ONLY the vitest line changed (`"vitest": "^3.2.4"` → `"vitest": "^5.0.3"`); the `dependencies` block is untouched
   - Files: `package.json`, `package-lock.json` (both written by npm — no hand edits)

   **PM research (apply, don't re-derive):**
   - Verified 2026-10-11 via `npm audit`: 3 vulns — @vitest/mocker 2.1.0–4.1.10 moderate (GHSA-82fw-gwwq-j7x9, path traversal), tinypool ≤2.1.1 critical ×2 (GHSA-5gmw-xhrv-c9v3 / GHSA-85c8-ppgw-ccpr, prototype-pollution → RCE). vitest flagged only transitively. ALL dev-chain; prod deps clean.
   - No in-range fix exists: vulnerable range ends at vitest 4.1.10, fix ships in 5.0.3 (latest 5.x). Major bump REQUIRED.
   - Backlog's "weigh --force against pinned SDK" is RESOLVED: @sparklinkplayjoy/* is not implicated and not touched. Use **`npm install -D vitest@^5.0.3`** (repo convention = caret ranges), NOT `npm audit fix --force` (opaque, may bump more than the verified chain).
   - Peer/engine checks verified from registry: vitest@5.0.3 peer `vite ^6.4.0||^7.0.0||^8.0.0` — installed vite 7.3.7 satisfies, NO vite bump. engines node `^22.12.0||^24||>=26` — env is v22.19.0, OK. @vue/test-utils@2.4.6 declares no peers → no conflict.
   - Breaking-change surface ≈ empty: ZERO test files in repo (Glob `**/*.{test,spec}.*` = no matches); `vitest` appears in NO source/config file (only package.json script + devDep); tsconfig `types:["vite/client"]`, `include:["src/**/*"]` → typecheck cannot see vitest types.
   - Expected post-task typecheck count: **0** (unchanged baseline).
   - Procedure: `npm install -D vitest@^5.0.3` → run the five Done-when commands → commit `sprint-09-npm-deps: Task 1 vitest ^5.0.3, audit clean` → then IN-REVIEW mechanics below.
   - Reviewer: independent window per review file; reruns the Done-when commands against the committed diff. NEVER marks DONE for a FAIL.

   On completion (PASS route): Worker sets IN-REVIEW + writes `docs/plans/reviews/review-vitest5.md` from `docs/plans/templates/review-template.md`, beginning with the sprint goal (one line) + the five Done-when criteria + Base/Head hashes (Base = the PM-open commit, Head = Task 1 commit). Hardware check section: N/A — no [hw] tag, dev-tooling only (state that).

## Findings
<!-- One line per out-of-scope bug/idea: DEFECT + WHERE TO VERIFY. PM routes these at next touchpoint. -->
(none yet)
