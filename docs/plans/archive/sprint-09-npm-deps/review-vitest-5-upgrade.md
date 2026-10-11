# REVIEW: vitest-5-upgrade

**SPRINT GOAL:** Clear `npm audit` (3 vulnerabilities: 1 moderate @vitest/mocker, 2 critical tinypool) by upgrading vitest 3.2.7 → ^5.0.3, with the repo still green and production deps untouched.
**TASK:** Upgrade vitest 3.2.7 → ^5.0.3 (clears all 3 audit vulns)  ·  **TAG:** [high-stakes]
**DONE WHEN:**
- `npm audit` output contains `found 0 vulnerabilities`
- `node -p "require('./node_modules/vitest/package.json').version"` prints `5.x` (≥5.0.3)
- `npx vitest --version` prints `vitest/5.` prefix
- `npm run typecheck` → 0 errors; `npm run build` → exit 0
- `git diff HEAD -- package.json` shows ONLY the vitest line changed (`"vitest": "^3.2.4"` → `"vitest": "^5.0.3"`); the `dependencies` block is untouched

## 📝 Worker notes & self-check
- Ran `npm install -D vitest@^5.0.3`; npm wrote package.json + package-lock.json (no hand edits). All 5 Done-when checks pass: audit `found 0 vulnerabilities`; installed vitest `5.0.3`; CLI `vitest/5.0.3 win32-x64 node-v22.19.0`; typecheck 0 errors; build exit 0.
- Note for Reviewer: the first `npm run build` run died with a Node Segmentation fault mid-transform (vite 7.3.7 client build). Immediate retry passed clean (BUILD_OK). Flagging as environment flakiness, not a regression from this change (change is devDependency-only; vite/esbuild/rollup versions unchanged by the install).
- Self-check vs sdk-reference-v2.md: N/A — no SDK surface touched (devDependency version bump only).
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (untouched) — no src/ files in diff.
- typecheck/build: ACTIVE gate — 0 errors before, 0 errors after (docs/tsc-baseline.txt = 0, no unmasking). `npm run build` exit 0. package.json diff = exactly one line (`"vitest": "^3.2.4"` → `"vitest": "^5.0.3"`); `dependencies` block byte-identical (@sparklinkplayjoy/sdk-keyboard ^1.0.14).

## 🔍 Commits to review
Base: `50aef6d` (PM-open)   Head: `358e230` (this task)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat 50aef6d..358e230     then      git diff 50aef6d..358e230
     Expected scope: package.json (1 line), package-lock.json (vitest tree), current-sprint.md
     (status/checkpoint), this review file. Anything else is a flag. -->
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task (devDependency bump; no hardware behavior touched).

## ❓ Reviewer, please confirm
- [x] meets every "DONE WHEN" criterion above
- [x] diff scope matches the task (no stray files)
- [x] no design-intent violation
- [x] typecheck/build gate met where it applies (no newly introduced errors; unmasked ones recorded/deferred) — or N/A
- [x] tag is correct (high-stakes where required) — else auto-FAIL

---
## ✅ REVIEWER VERDICT
**Result:** PASS  ·  **Date:** 2026-10-11  ·  **Fail count:** 0

### Independent re-run (Reviewer commands + output)
1. `npm audit` → `found 0 vulnerabilities` ✓
2. `node -p "require('./node_modules/vitest/package.json').version"` → `5.0.3` ✓
3. `npx vitest --version` → `vitest/5.0.3 win32-x64 node-v22.19.0` ✓
4. `npm run typecheck` → exit 0, no errors (baseline docs/tsc-baseline.txt = 0, no unmasking) ✓; `npm run build` → exit 0, built in 1.58s, first try — no segfault reproduced ✓
5. `git diff 50aef6d..358e230 -- package.json` → exactly one line changed (`"vitest": "^3.2.4"` → `"vitest": "^5.0.3"`); `dependencies` block untouched ✓

### Diff scope
`git diff --stat 50aef6d..358e230`: package.json (1 line), package-lock.json (vitest tree only — all 25 changed packages are vitest-5 transitive deps incl. tinypool/vite-node/@vitest/*), current-sprint.md (status). No stray files; no src/ files touched → design intent (filters:[], usagePage 65440, wrappers return Error) trivially preserved. Tag [high-stakes] correct (lockfile-wide dependency change).

### Worker's segfault note
Worker flagged a first-run Node segfault during `npm run build`. Reviewer's build ran clean on first attempt; flake not reproducible and change is devDependency-only. Non-blocking; noted for PO awareness.

### Findings
(none)
