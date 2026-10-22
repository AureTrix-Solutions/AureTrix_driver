# REVIEW: vue-tsc-gate — Task 1 (gate install + shim retirement + re-base)

**SPRINT GOAL:** Give `.vue` files a real automated type/undefined-reference gate — install vue-tsc, make `npm run typecheck` use it, and clear every error it unmasks so the gate lands at zero.
**TASK:** Install vue-tsc + make it the typecheck gate (Task 1 of sprint-13-vue-tsc)  ·  **TAG:** [high-stakes]
**DONE WHEN:**
- `ls node_modules/.bin | grep -c vue-tsc` → `1`
- `grep -n '"typecheck"' package.json` → `"typecheck": "vue-tsc --noEmit",`
- `ls src/types/vue-shim.d.ts` → No such file; `ls _to_delete/vue-shim.d.ts` → exists
- `npm run typecheck 2>&1 | grep -c "error TS"` → N (N ≥ 101), and `head -1 docs/tsc-baseline.txt` → that same N
- `npm run lint` exit 0 AND `npm run build` exit 0

## 📝 Worker notes & self-check
- Installed `vue-tsc@^3.3.13` (-D) → resolved 3.3.13 with TypeScript **5.9.3** (verified via `node -e`; the TS-7 `ERR_PACKAGE_PATH_NOT_EXPORTED` hazard did NOT occur). Flipped `package.json:11` to `"typecheck": "vue-tsc --noEmit"`. `git mv src/types/vue-shim.d.ts _to_delete/vue-shim.d.ts`.
- Re-based `docs/tsc-baseline.txt` first line `0` → `101`, kept history lines, appended RE-BASED history line + per-code breakdown. This is the sanctioned unmasking re-base (CLAUDE.md self-check gate), not a ratchet-up violation.
- N = **101** errors across **14 files** — exact match with the PM dryrun, so Task 2's expected counts need NO delta adjustment. Per-file list: `.scratch/vue-tsc-files.txt`; full output: `.scratch/vue-tsc-run.txt`.
- Spec edit 5 recorded: `npm run typecheck 2>&1 | grep "error TS" | grep -c "main.ts\|router/index.ts"` → **0**. No `.ts`-side errors were unmasked by the shim removal; 2a needs no adjustment.
- Self-check vs sdk-reference-v2.md: N/A — Task 1 changes no SDK-facing code (tooling/config only).
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (untouched)
- typecheck/build: typecheck = 101 errors (expected unmasked N=101; baseline re-based to match; zero newly introduced — all 101 are the dryrun-predicted .vue set). `npm run lint` → exit 0. `npm run build` → exit 0 (✓ built in 4.24s).
- Cleanup (from actual `ls`): `.scratch/` holds `handoff.md`, `pm-notes.md`, `vue-tsc-dryrun.txt`, `vue-tsc-files.txt`, `vue-tsc-run.txt` (PO may delete). `_to_delete/` holds `vue-shim.d.ts` (PO must `git rm` when ready — it is tracked as of head).

## 🔍 Commits to review
Base: `8c79c16` (branch point / last reviewed)   Head: `65b0b3e` (this task)
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — Task 1 is not [hw] (no device behavior touched).

## ❓ Reviewer, please confirm
- [ ] meets every "DONE WHEN" criterion above
- [ ] diff scope matches the task (no stray files)
- [ ] no design-intent violation
- [ ] typecheck/build gate met where it applies (no newly introduced errors; unmasked ones recorded/deferred)
- [ ] tag is correct (high-stakes where required)

---
## ✅ REVIEWER VERDICT
**Result:** (pending)  ·  **Date:** —  ·  **Fail count:** —

### Failed items (FAIL only)
—
