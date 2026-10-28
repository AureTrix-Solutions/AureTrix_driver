# REVIEW: export-side suite (Task 1, sub-tasks 1a–1e cumulative)

<!-- WORKER fills everything above the verdict line. REVIEWER fills the verdict section.
     The PO's hardware verdict is RECORDED BY AN AGENT from the PO's plain-language outcome —
     the PO does not hand-edit this file. -->

**SPRINT GOAL:** Lock the ExportService software contract with headless vitest suites — export-side gathering, import-side decrypt/repairs, and a full export→encrypt→import round-trip (backlog `### testing` Phase 2 only; Phase 3 stays in backlog).
**TASK:** Task 1 — Export-side suite (exportProfile + gatherKeyboardSnapshot + per-key gather details), executed as sequential sub-tasks 1a–1e, one commit each  ·  **TAG:** [high-stakes] (no [hw])
**DONE WHEN:**
- 1a: typecheck 0; lint 0; `grep -c "vi.fn()" src/services/__tests__/exportservice-helpers.ts` ≥ 35
- 1b: typecheck 0; lint 0; `grep -c "^export" src/services/__tests__/exportservice-helpers.ts` ≥ 12
- 1c: `npx vitest run src/services/__tests__/ExportService.export.test.ts` exit 0; typecheck 0
- 1d: vitest file exit 0; typecheck 0
- 1e: vitest file exit 0; typecheck 0; lint 0; IN-REVIEW with this review file (sprint goal + Task-1 Done-when list + base/head hashes + Hardware check 'n/a — headless suite, no device behavior claimed')

## 📝 Worker notes & self-check
- Helpers (`exportservice-helpers.ts`, 1a+1b): `buildKeyboardServiceMock()` (35 vi.fn methods, signatures grep-confirmed against KeyboardService.ts) + `applyExportDefaults(ks)` (V7–V9 export happy path) + exported V1–V7 constants and builders (`makeLightMode`, `makeKeyboardEntry`, `makeConfig`, `makeEncryptedFile`, `makeLocalStorage`).
- Test file (`ExportService.export.test.ts`, 1c+1d+1e, 42 tests / 538 lines): F1 mock header + `runExport` fake-timer helper; exportProfile happy/Error/gather-throw/temp-switch-throw; snapshot choreography (temp switch, finally-restore, logo/special restore gating, restore-on-midway-throw); error paths with exact console.error text; gatherLightingConfig per-read defaults; gatherDeviceInfo ROES/TOP_DEAD fallbacks; restore payload details; per-key gather details (retry THROW → 3 calls/key F2, resolved-Error pass-through, globalTravelCache read-once + Error→re-read, touchMode mapping, ADVANCED_KEY_MODE_MAP 7/9 edges, dks both-gate F8, dbN Error→0, mt delay 150 AS-IS + mtorTgl Error→0, fn-bindings V12).
- Self-check vs sdk-reference-v2.md: §5.2 advancedKeyMode enum (map edges 7/9), §7 macro readback absence (empty library) — consistent with existing code comments and PM-verified facts F2/F8/V9–V12 in current-sprint.md. All assertions were re-verified against ExportService.ts source THIS session before writing (retryWithBackoff loop bounds, cache guard, both-gate, delay AS-IS).
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (tests pin exactly this — resolved Errors pass through without retry; only throws retry)
- typecheck/build: typecheck exit 0 (baseline 0 → 0, no unmasking). Build not run — test-only change, cannot affect the build. Gates: file 42/42, full suite 65/65 (5 files), lint exit 0.
- Note on 1e spec wording: spec said "3 calls total" for the reject path — source `retryWithBackoff(fn, maxRetries=2)` attempts 3× PER CALL SITE; with 2 keys that is 6 calls total (3 for key 65, 3 for key 66). Test pins 6 with a comment. This is the source-faithful reading; flagged here for the Reviewer rather than silently deviating.

## 🔍 Commits to review
Base: `b47d2b7` (branch point / merge-base with main)   Head: `5d77876` (Task 1e)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat b47d2b7..5d77876     then      git diff b47d2b7..5d77876
     A file touched outside this task's scope is a flag.
     Intermediate commits: 2167022 (PM-open plan), 0941737 (1a), ece55c1 (1a checkpoint),
     bae0c64 (1b), acdaf35 (1b checkpoint), 6643861 (1c), 4308fbe (1c checkpoint),
     520beea (1d), 4c93005 (1d checkpoint). -->
Fix-round ranges (added on each re-review):

## 🖥️ Hardware check ([hw] tasks only)
n/a — headless suite, no device behavior claimed. All KeyboardService interactions are mocked; the tests pin SOFTWARE contracts (call shapes, retry semantics, gate conditions, payload mapping) only.

**Hardware verdict (agent records from the PO's plain-language outcome):**
- n/a

## ❓ Reviewer, please confirm
- [ ] meets every "DONE WHEN" criterion above
- [ ] diff scope matches the task (no stray files)
- [ ] no design-intent violation
- [ ] typecheck/build gate met where it applies (no newly introduced errors; unmasked ones recorded/deferred) — or N/A
- [ ] tag is correct (high-stakes where required) — else auto-FAIL

---
## ✅ REVIEWER VERDICT
**Result:** PASS  ·  **Date:** 2026-10-27  ·  **Fail count:** 0

Reviewed cumulative base `b47d2b7`..head `5d77876` (10 commits, incl. PM-open plan commit and 5× checkpoint commits; deliverables: `exportservice-helpers.ts` +352, `ExportService.export.test.ts` +538). One independent read pass of both files + ExportService.ts, then re-ran all gates.

### Done-when criteria (all rerun by Reviewer)
- 1a: `grep -c "vi.fn()" exportservice-helpers.ts` = **35** (≥35 ✓); typecheck 0 ✓; lint 0 ✓
- 1b: `grep -c "^export" exportservice-helpers.ts` = **20** (≥12 ✓); typecheck 0 ✓; lint 0 ✓
- 1c/1d/1e: `npx vitest run src/services/__tests__/ExportService.export.test.ts` → **42/42 passed, exit 0** ✓; `npm run typecheck` exit 0 ✓; `npm run lint` exit 0 ✓; full `npm run test:run` → **65/65 passed, exit 0** ✓
- Review file present with sprint goal + Done-when list + hashes + Hardware check "n/a — headless suite, no device behavior claimed" ✓

### Correctness spot-checks (test assertions vs ExportService.ts source)
- **Worker-flagged deviation RESOLVED in Worker's favor:** spec 1e said retry-throw → "3 calls total"; the test pins **3 calls PER KEY (6 total, 2 keys)**. Source is authoritative: `retryWithBackoff` loops `attempt <= maxRetries(2)` = 3 attempts per call site, and `gatherPerformanceData` calls it per key. The spec line was wrong; the test is source-faithful. Not a defect.
- Resolved-Error pass-through (no retry): `retryWithBackoff` only retries on *throw*; resolved `Error` instances return untouched → getRtTravel called once per key. Test matches.
- `globalTravelCache`: `null`-check + Error-not-cached → re-read per key, `?? 0` fallback. Test matches.
- TouchMode seed: `isGlobalTriggering: true` survives an Error from getTouchMode (guard skips assignment). Test matches.
- F8 dks both-gate: `!(dksAll instanceof Error) && dksAll && !(trpsAll instanceof Error) && trpsAll` → trpsAll Error omits dks only; mpt/socd untouched. Test matches.
- mt delay pinned **150 AS-IS** (no ÷10) — the round-trip bug class the plan warned about. Test matches.
- F-D7-2 pre-switch source for light.main, temp-switch/finally-restore choreography, RESTORE_MAIN payload (V1 minus dynamicColorId), logo type-normalization, verbatim special restore, console.error text per branch — all verified line-for-line against source.
- Mock header matches F1: 35 methods 1:1, explicit vitest imports, fake-timer `runExport` pattern, spy restore in afterEach, `unstubAllGlobals`.

### Findings (non-defect observations, alongside PASS)
1. **F-D7-2 main-source assertion is weak in the happy fixture:** `getLighting` returns V1 on every call, so deleting `light.main = convert(originalLighting)` in `gatherLightingConfig` would NOT fail any test — re-read and pre-switch sources are indistinguishable. A variant where the second `getLighting` call returns a different value would pin it. Spec 1c dictated exactly this assertion, so not a FAIL item → routed to `## Findings` in current-sprint.md for PM routing (Task 2 or backlog).
2. `makeKeyboardEntry` selects customKeys via `overrides.keyValue === 66` — couples the builder to canonical key values; fine for this fixture set.

No inline-fixable defects (QA tier) found at IN-REVIEW: files read clean, lint 0, typecheck 0.

### Failed items (FAIL only)
None — PASS.
