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
**Result:** PASS / PASS (pending hw) / FAIL  ·  **Date:** YYYY-MM-DD  ·  **Fail count:** <n>

### Failed items (FAIL only)
