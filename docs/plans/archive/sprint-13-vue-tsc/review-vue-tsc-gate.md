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
- [x] meets every "DONE WHEN" criterion above
- [x] diff scope matches the task (no stray files)
- [x] no design-intent violation
- [x] typecheck/build gate met where it applies (no newly introduced errors; unmasked ones recorded/deferred)
- [x] tag is correct (high-stakes where required)

---
## ✅ REVIEWER VERDICT
**Result:** PASS  ·  **Date:** 2026-10-22  ·  **Fail count:** 0

Verified independently (all commands rerun this session against head `93ab32b`, tree clean, branch `sprint-13-vue-tsc`):

| Criterion | Result | Evidence |
|---|---|---|
| vue-tsc binary installed | PASS (see obs O1) | `ls node_modules/.bin \| grep vue-tsc` → 3 entries (`vue-tsc`, `.cmd`, `.ps1`) — the Windows npm shim triple; binary present |
| `"typecheck": "vue-tsc --noEmit",` | PASS | package.json line 11; diff shows exactly this flip, nothing else in scripts |
| shim retired | PASS | `src/types/vue-shim.d.ts` → No such file; `_to_delete/vue-shim.d.ts` exists AND is tracked (`git ls-files` returns it); rename is content-identical (`git diff --stat` shows 0 changes) |
| N errors, baseline head-1 = N | PASS | `npm run typecheck` → 101 `error TS` lines across 14 distinct files; `head -1 docs/tsc-baseline.txt` → `101`; per-file list byte-identical to Worker's `.scratch/vue-tsc-files.txt`; per-code breakdown in baseline line 7 exactly matches fresh `uniq -c` (TS7053×26 … TS7005×1, sums to 101) |
| lint exit 0, build exit 0 | PASS | both rerun this session: `lint exit=0`, `build exit=0` |

Diff-scope audit: `8c79c16..65b0b3e` touches only the 5 spec'd files (shim rename, current-sprint.md, tsc-baseline.txt, package-lock.json, package.json); `65b0b3e..93ab32b` is the Worker's status/review-file commit. No stray files, no source changes. package.json diff = exactly 2 hunks (typecheck flip + `"vue-tsc": "^3.3.13"` devDep). Resolved versions match Worker notes: typescript 5.9.3, vue-tsc 3.3.13 — the TS-7 `ERR_PACKAGE_PATH_NOT_EXPORTED` hazard did not occur. Baseline history lines preserved byte-identical; re-base 0→101 is the sanctioned unmasking per CLAUDE.md self-check gate (shim removal makes .vue errors visible for the first time), not a ratchet-up violation. Spec-edit-5 rerun: 0 `.ts`-side errors unmasked → Task 2a needs no delta. Design intent untouched (no filters/usagePage/wrapper changes in diff). Tag [high-stakes] correct — infrastructure/tooling change.

### Failed items (FAIL only)
—

### Reviewer observations (non-defect; PASS stands)
- **O1** — Done-when bullet 1 (`grep -c vue-tsc` → `1`) is Windows-fragile: npm writes three shim files per bin (`vue-tsc`, `.cmd`, `.ps1`), so the literal count is 3 on this platform. Intent (binary installed) unambiguously met; no action needed for this task. Routed as a Findings line so future Done-when criteria use `grep -q`/non-empty instead of `grep -c` → 1 for bin checks.
- **O2** — Baseline line 7 points the per-file list at `.scratch/vue-tsc-run.txt`; `.scratch/` is gitignored and PO-emptied, so that pointer dies at next cleanup. The file exists now and holds all 101 errors (verified), and the review file + commit message carry the durable record — acceptable, no fix required.

Reviewer status mechanics (this session): Task 1 → DONE (collapsed to ✓ in current-sprint.md), ▶ RUN THIS advanced to Task 2a, Findings line added for O1, all committed.
