# REVIEW: test-infra

**SPRINT GOAL:** Stand up the test foundation — vitest config (node env, aliases reused), `test:run` script, CI test step — and cover the Tier A pure-logic modules (keyUnits, useBatchProcessing, keyCategories, layoutConfigs) with tests, keeping typecheck at 0 and CI green.
**TASK:** Phase 0 — test infra (sub-tasks 1a vitest config + smoke test; 1b test:run script + CI step)  ·  **TAG:** [high-stakes]
**DONE WHEN:**
1a:
- `npx vitest run` → exit 0, 1 file passed
- `grep -n "vitest/config" vite.config.ts` → 1 hit
- `npm run typecheck` → 0 errors
- `npm run build` → succeeds (config change can affect build)
- `npm run lint` → exit 0

1b:
- `npm run test:run` → exit 0, 1 file passed
- `grep -n "test:run" package.json .github/workflows/ci.yml` → 1 hit each
- typecheck 0; lint exit 0

## 📝 Worker notes & self-check
- 1a: `vite.config.ts` import flipped `'vite'` → `'vitest/config'`; `test: { environment: 'node', ... }` block added after `preview`; `src/__tests__/smoke.test.ts` created exactly per spec (asserts `uToMm(1)` = 19.05, proving alias resolution + real module value).
- **DEVIATION (1a), for your ruling:** the spec's `test:{environment:'node'}` shipped with ONE added line — `exclude: [...configDefaults.exclude, '.scratch/**']` — and `configDefaults` added to the `vitest/config` import. Reason: zero-config vitest was collecting the PM's gitignored `.scratch/probe*.test.ts` (3 files ran, not 1). Worker never deletes, so exclusion was the only in-scope fix. It restores the spec's "1 file passed" Done-when literally and keeps future `.scratch` probes out of the suite.
- 1b: `"test:run": "vitest run",` inserted after `"test"` in package.json; `- run: npm run test:run` inserted between lint and build in ci.yml. No deviations.
- Self-check vs sdk-reference-v2.md: N/A — no SDK claims in this task (config/CI only).
- Design intent preserved: filters:[] ☑ untouched · usagePage 65440 ☑ untouched · wrappers return Error ☑ untouched — no service/hardware code changed in this task.
- typecheck/build: gate ACTIVE (1a touched .ts). At 1b close, all re-run: `npm run typecheck` = 0 errors (baseline docs/tsc-baseline.txt = 0, unchanged); `npm run build` ✓ (at 1a); `npm run lint` exit 0; `npm run test:run` exit 0, "Test Files 1 passed (1)". Exit codes explicitly verified (TSC_OK / LINT_OK / TEST_OK).

## 🔍 Commits to review
Base: `beca01b` (branch point per PM spec)   Head: `f526813` (Task 1b)
Note for scope check: the range also contains PM-open planning commits `76c88a2` + `68c8e14` (docs/plans/* only — current-sprint.md, backlog.md). These are expected in-range planning files, NOT Worker scope violations. Worker source edits are in `9379b3e` (1a) and `f526813` (1b) only.
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task (no hardware-facing code).

## ❓ Reviewer, please confirm
- [x] meets every "DONE WHEN" criterion above (1a and 1b) — all rerun independently: `npx vitest run` exit 0 "Test Files 1 passed (1)"; `npm run test:run` exit 0; `grep -n "vitest/config" vite.config.ts` 1 hit; `grep -n "test:run" package.json .github/workflows/ci.yml` 1 hit each; typecheck 0; lint exit 0; build exit 0
- [x] diff scope matches the task (no stray files; PM planning commits noted above are in-scope for the range) — `git diff --stat beca01b..f526813`: exactly the 4 worker files (ci.yml, package.json, smoke.test.ts, vite.config.ts) + PM planning files (current-sprint.md, backlog.md), as the note predicted
- [x] no design-intent violation — no service/hardware code in diff
- [x] the 1a DEVIATION (`.scratch/**` exclusion) is ACCEPTED — see ruling below
- [x] typecheck/build gate met (1a touched .ts) — typecheck 0 errors, build ✓, both rerun by Reviewer
- [x] tag is correct — [high-stakes] appropriate (config + CI infra)

### Deviation ruling
The added `exclude: [...configDefaults.exclude, '.scratch/**']` (+ `configDefaults` import) is ACCEPTED. It was the only in-scope fix available (Worker never deletes; the PM's probe files are gitignored and live outside Worker reach), it restores the spec's own "1 file passed" Done-when literally, and it keeps future `.scratch` probes out of the suite permanently. Scope-minimal; no behavior beyond test collection.

### Smoke-test value check
`uToMm(1)` = 19.05 confirmed against source (`KEY_SIZE_MAP` row `{ units: 1, mm: 19.05 }`, fallback `units * 19.05`) — the assertion pins a real module value via the `@utils` alias, as specced.

---
## ✅ REVIEWER VERDICT
**Result:** PASS  ·  **Date:** 2026-10-24  ·  **Fail count:** 0

Task 1 (Phase 0 test infra, 1a+1b) passes code review on the cumulative diff base `beca01b` → head `f526813`. Not a [hw] task → DONE (no HW-TEST stage). Findings: none (no defects, no out-of-scope observations worth routing).

