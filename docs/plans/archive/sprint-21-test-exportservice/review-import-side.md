# REVIEW: import-side + round-trip suite (Task 2) + F-D7-2 non-vacuity fix (Task 1f)

<!-- WORKER fills everything above the verdict line. REVIEWER fills the verdict section. -->

**SPRINT GOAL:** Lock the ExportService software contract with headless vitest suites — export-side gathering, import-side decrypt/repairs, and a full export→encrypt→import round-trip (backlog `### testing` Phase 2 only; Phase 3 stays in backlog).
**TASK:** Task 2 — Import-side + round-trip suite (2a–2e)  ·  folded in: Task 1f — F-D7-2 non-vacuity fix (one additive export-side test, no source changes)  ·  **TAG:** [high-stakes]
**DONE WHEN:**
- 2a (importProfile happy + guards): appended its — happy path `{success:true}`, setLighting #1 = PRE_SWITCH_EXPECTED (V5), MacroList restored `'["local"]'`, repairs ran (setDksTravel(65,33,'Layout_DB3'), setDp/setDr, setSpecialLighting(SDK_FORMAT_STATIC), setSocd 7-field '1.0.7', setEND({key:65,dks:3,delay:250},'1.0.7'), setCustomLighting ×2, setLighting LAST = SDK_FORMAT_STATIC, saveCustomLighting). vitest exit 0; typecheck 0.
- 2b (failure paths): importConfig Error → `{success:false,error:message}` + MacroList RESTORED; `{success:false,error:'boom'}` → 'boom' + restored; `{success:false}` no error → 'Import failed'; null MacroList snapshot → removeItem; garbage file.text() → decrypt null → `{success:true}`, NO repair setters, MacroList still restored; pre-switch getLighting Error → import CONTINUES. vitest exit 0; typecheck 0.
- 2c (decrypt + RGB state machine): nested keyboards array flattened (observed via repair setters hitting both keys); repairCustomRgb size-0 path (NO setCustomLighting, NO extra getLighting probes); ensureCustomModeReady SUCCESS / RETRY (re-command V5-shape + 400ms) / EXHAUSTED (console.error 'Custom mode not confirmed', writes proceed); writeVerifiedCustomRgb VERIFY-FAIL (×3 calls + exact message) / VERIFY-OK / readback-Error; F2-2 sequential single-key order. vitest exit 0; typecheck 0.
- 2d (repair gates): deadband gate both sides (isGlobalTriggering false → NO setDp; press non-number → NO setDp; press 0 + global true → setDp(key,0) FIRES, press-before-release); socd gate ('mt'/non-number delay → NO setSocd; 'socd' → setSocd verbatim ×1); end gate ('dks' → NO setEND; delay 65535 → FIRES unfiltered, PM ruling); dksDb3 (absent → NO setDksTravel; 0 → fires); specialLighting (other absent → NO setSpecialLighting); mainLighting (main absent → setLighting EXACTLY ×1 = PRE_SWITCH); setter-Error sweep (all 8 reject → per-key console.error strings, still `{success:true}`). vitest exit 0; typecheck 0; lint 0.
- 2e (round-trip): ExportService.roundtrip.test.ts — THE HEADLINE full cycle (exportProfile capture → real-CryptoJS encrypted File FROM THE CAPTURED CONFIG → fresh import phase): every repaired value equals the exported value (setDksTravel(65,33,'Layout_DB3'), setDp(65,30)/setDr(65,40), setSocd 7-field delay 150, setEND({key:65,dks:3,delay:250}) NOT scaled, setCustomLighting keys 65+66 {r:1,g:2,b:3}, setSpecialLighting/setLighting = SDK_FORMAT_STATIC, setLogoLighting NOT called import-side, MacroList preserved); mt-delay pin (captured mt.delay 150 AS-IS + test-side decrypt of the FILE → 150); nested-`keyboards` variant proving flat(). vitest exit 0; typecheck 0; lint 0.
- Task 1f (folded): export-side it pinning `light.main` = LIGHT_STATIC_CFG from the PRE-switch snapshot (getLighting seeded twice: V1 static snapshot → custom re-read); Reviewer RE-RUNS the mutation check: commenting `light.main = this.convertLightingToConfig(originalLighting)` in ExportService.ts (grep it) must fail ONLY the new test (`mode:'custom'` leaks vs `'static'`), then restore.
<!-- If a criterion is revised after this file exists, UPDATE it here too — the Reviewer judges
     this file, not current-sprint.md. -->

## 📝 Worker notes & self-check
- 2a–2d appended to `src/services/__tests__/ExportService.import.test.ts` (27 its); 2e created `src/services/__tests__/ExportService.roundtrip.test.ts` (3 its: headline, nested flat(), mt-delay pin incl. test-side real-CryptoJS decrypt of the file). 1f added one it to `src/services/__tests__/ExportService.export.test.ts` (+12 lines). Helpers/ExportService.ts untouched (test-only sprint).
- Spec deviations recorded (2b): pre-switch getLighting Error path skips the pre-switch setLighting SILENTLY — the 'Failed to switch to custom mode:' console.error is setLighting-Error-only; the getLighting-Error test asserts console.error not called and import continues. 2e note: export phase overrides getPerformanceMode per key (65→advancedKeyMode 5 'end', 66→8 'socd') so the round-tripped config itself carries the repair gates; it#1 asserts captured advancedType 'end'/'socd' before import.
- Self-check vs sdk-reference-v2.md: no new SDK claims — 2e reuses already-verified cipher facts (real CryptoJS AES, key `fDPy6vvnpPsYm2T0g1bh`, `{data:...}` envelope — F1/2a, bundle-verified) and helpers' makeEncryptedFile (verified against the bundle at Task-1 helpers build).
- Design intent preserved: filters:[] ☐ (untouched) · usagePage 65440 ☐ (untouched) · wrappers return Error ☐ (untouched — tests only; mocks RESOLVE Error instances per convention, never throw)
- typecheck/build: `npm run typecheck` exit 0, baseline stays 0 (docs/tsc-baseline.txt). `npm run lint` exit 0. Full suite `npm run test:run` 96/96 (7 files). Build not run — test-only change, cannot affect it.

## 🔍 Commits to review
Base: `210c88c` (Task-1f parent / last reviewed)   Head: `b2605f6` (Task 2e)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat 210c88c..b2605f6     then      git diff 210c88c..b2605f6
     A file touched outside this task's scope is a flag. -->
Diff scope (verified): 4 files — docs/plans/current-sprint.md, ExportService.export.test.ts (+12, 1f), ExportService.import.test.ts (+659, 2a–2d), ExportService.roundtrip.test.ts (+171, 2e). No source files touched.
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
n/a — headless suite; mocks pin SOFTWARE contracts only, no device behavior verified.

## ❓ Reviewer, please confirm
- [x] meets every "DONE WHEN" criterion above — 1f (+12 lines, PRE_SWITCH/POST_CUSTOM seeds, light.main pin) and 2a–2e all verified line-by-line against the diff; every named assertion present with the exact spec'd values (setSocd 7-field EXPECTED_ADV.socd '1.0.7', setEND {key:65,dks:3,delay:250}, mt delay 150 AS-IS in capture AND in the test-side real-CryptoJS decrypt of the encrypted file, nested flat() via repairs on both keys, ensureCustomModeReady SUCCESS/RETRY-400ms/EXHAUSTED with exact log text, writeVerifiedCustomRgb FAIL/OK-after-retry/readback-Error exact messages, 2d gate its deadband/socd/end/db3/light-both-sides + setter-Error sweep)
- [x] diff scope matches the task (no stray files) — `git diff --stat 210c88c..b2605f6`: exactly 4 files (current-sprint.md, export.test.ts +12, import.test.ts +659, roundtrip.test.ts +171); NO source files touched
- [x] no design-intent violation — test-only change; wrappers-return-Error contract is what the sweep/guard its pin, nothing bypasses it; no device filters or usagePage changes
- [x] typecheck/build gate met — `npm run typecheck` exit 0, `npm run lint` exit 0 (re-run by Reviewer); full suite `npx vitest run` 96/96 across 7 files
- [x] tag is correct — [high-stakes] (logic/behavior pinning, multi-file); matches the work
- [x] Task-1f mutation check RE-RUN — commented ExportService.ts:491 `light.main = this.convertLightingToConfig(originalLighting);` → export suite: 1 failed | 42 passed, the ONLY failure being `F-D7-2 pinned: light.main converts the PRE-switch snapshot, not the post-switch re-read` → restored byte-identical (`git status --short` + `git diff --stat` both empty; re-run 43/43). Non-vacuity proven.

---
## ✅ REVIEWER VERDICT
<!-- After ONE verification pass, RULE. Don't keep investigating. A runtime/behavior question goes
     to the PO hardware check, not more static analysis. Output = PASS/FAIL + findings + your own
     Findings one-liners (into current-sprint.md). Do NOT plan task order/parallelism. -->
**Result:** PASS  ·  **Date:** 2026-10-28  ·  **Fail count:** 0

### Failed items (FAIL only)
None.

### Evidence summary (Reviewer-run)
- `npx vitest run` → Test Files 7 passed, Tests 96 passed.
- `npm run typecheck` → exit 0; `npm run lint` → exit 0.
- Mutation check (1f): comment source line → only the F-D7-2 test fails → restore → tree byte-identical, 43/43.

### Findings (non-defect observations, for the PM/backlog)
1. The 2b pre-switch getLighting-Error test (import.test.ts `pre-switch getLighting Error → setLighting NOT called…`) pins NO console.error on that path, while the sibling setLighting-Error test pins `"Failed to switch to custom mode:"`. A spec-2b misread would easily "fix" the log assertion onto the wrong branch — verify: grep `Failed to switch to custom mode` in ExportService.ts and confirm it sits in the setLighting-error catch only.
2. The mt-delay pin asserts `EXPECTED_ADV.mt` on BOTH the captured config and the decrypted file, but EXPECTED_ADV.mt.delay is the same 150 either way — a future ÷10 regression at export would be caught, but a ×10 at import-decrypt would not (decrypt is test-side real CryptoJS, so import-side scaling bugs are out of this suite's reach by design). Verify: grep `mt.delay` / `÷` / `/ 10` in ExportService.ts import path if Phase 3 ever touches delay conversion.
3. Hardware check: n/a — headless suite, no [hw] tag; mocks pin SOFTWARE contracts only.
