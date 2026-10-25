# REVIEW: tier-a-tests

<!-- WORKER fills everything above the verdict line. REVIEWER fills the verdict section. -->

**SPRINT GOAL:** Stand up the test foundation — vitest config (node env, aliases reused), `test:run` script, CI test step — and cover the Tier A pure-logic modules (keyUnits, useBatchProcessing, keyCategories, layoutConfigs) with tests, keeping typecheck at 0 and CI green.
**TASK:** Task 2 — Phase 1 Tier A pure-logic tests, sub-tasks 2a→2f (cumulative review over the whole task)  ·  **TAG:** [high-stakes]
**DONE WHEN:**
- 2a: `npx vitest run src/utils/__tests__/keyUnits.test.ts` → pass; typecheck 0; lint exit 0
- 2b: `src/composables/__tests__/useBatchProcessing.test.ts` — chunking/detection per spec (number array order + call count, object array passes physicalKeyValue only, empty array 0 calls); file passes; typecheck 0; lint exit 0
- 2c: same file — fake-timer delay gating (advanceTimersByTimeAsync 99 → still 1 call; +1 → all 3) and intra-batch concurrency (both updateFns started before either resolves); delay after EVERY batch incl. last (probe P14); file passes; gates green
- 2d: `src/utils/__tests__/keyCategories.test.ts` — categories order/16 entries, Special `{0:' ',1:'Fn'}`, non-empty string labels, no id reuse, seen.size===250, exact per-category counts (probe P6); file passes; gates green
- 2e: `src/utils/__tests__/layoutConfigs.test.ts` — priority chain P1 (IndexedDB custom via vi.mock fixture) > P2 (sharedLayout 'Slice75 HE' 6×15) > P3 (layoutMap[61] 5×14) > P4 (fallback 6×1); file passes; gates green
- 2f: same file — geometry: 61-key row 0 (14 entries; [0,0,72,72]/[76,0,72,72]/[988,0,136,72]); 61-key row 4 probe P8 exact + gaps [0,0,0,0,0]; 67-key 5×15 with row-4 gap-shift probe P17 exact; getPaddedKeySizes(null)/([]) → [[19.05]]×6; file passes; gates green
- Sprint-level: `npm run test:run` exits 0 with 5 test files passing; typecheck 0 (baseline docs/tsc-baseline.txt = 0); lint exit 0
- Every expected value is probe-verified in `.scratch/pm-notes.md` — Reviewer must confirm values were used as-is, never recomputed

## 📝 Worker notes & self-check
- Wrote 5 test files across 6 commits (2a–2f; 2b+2c and 2e+2f share files), all expected values taken verbatim from the plan's probe-verified numbers — none recomputed.
- Deviation (applies to 2e/2f): the plan's `getLayoutConfig(0,null,null,null,null,...)` calls pass `undefined` instead of `null` in the tests — the signature's optional params reject `null` under TS strict (TS2345). Behavior identical; P3 case `(61,undefined,undefined,undefined,undefined)` exercises the same no-productName path.
- Self-check vs sdk-reference-v2.md: N/A — Tier A tests cover pure-logic utils/composables only; no SDK calls touched.
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (untouched) — no service/hardware code modified.
- typecheck/build: `npm run typecheck` = 0 errors (baseline 0, unchanged). build: not run — test-only changes cannot affect the vite build (vitest config already excluded .scratch probes in Task 1).
- Gates after 2f: layoutConfigs.test.ts 8/8 pass; full suite 5 files / 24 tests pass; typecheck 0; lint exit 0.

## 🔍 Commits to review
Base: `b5ec520` (Task 1 → DONE; branch point)   Head: `f9cdacd` (Task 2f)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat b5ec520..f9cdacd     then      git diff b5ec520..f9cdacd
     A file touched outside this task's scope is a flag.
     Expected touched: the 5 test files + docs/plans/current-sprint.md checkpoint commits (9dc063e, 40b5268). -->
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task. No hardware-affecting code changed.

## ❓ Reviewer, please confirm
- [ ] meets every "DONE WHEN" criterion above
- [ ] diff scope matches the task (no stray files)
- [ ] no design-intent violation
- [ ] typecheck/build gate met where it applies (no newly introduced errors; unmasked ones recorded/deferred) — or N/A
- [ ] tag is correct (high-stakes where required) — else auto-FAIL
- [ ] probe values used as-is (spot-check several expected values against `.scratch/pm-notes.md`)
- [ ] the 2e/2f `null`→`undefined` deviation is acceptable (TS2345 under strict; same code path)

---
## ✅ REVIEWER VERDICT
**Result:** —  ·  **Date:** —  ·  **Fail count:** —
