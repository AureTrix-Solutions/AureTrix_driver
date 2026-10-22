# REVIEW: d6-deadcode

**SPRINT GOAL:** Make export→import a true full-keyboard recovery: live-read the dead-shape fields (D1), fix advanced-key export shapes incl. DB3 carry (D2/D2b), make import macro-safe (D5), repair what SDK import silently drops — DB3 + special lighting + socd/end delay — via app-side decrypt (D7), delete the dead code (D6), and fix the exportConfig contract violation.
**TASK:** Task 5 — D6: dead-code deletion + applyImportedConfig collapse  ·  **TAG:** [high-stakes] (no [hw] tag on this task; see Hardware check note below)
**DONE WHEN:**
- `grep -n "withCustomModeForExport\|applyLightingZones\|applyImportedConfig" src/services/ExportService.ts` → nothing
- `grep -c "finally" src/services/ExportService.ts` ≥ 3 (baseline 2)
- `grep -c "convertLightConfigToSDKFormat" src/services/ExportService.ts` ≥ 2
- `grep -c "saveCustomLighting" src/services/ExportService.ts` ≥ 1
- typecheck 0; lint 0 (no-unused-vars is "error" — orphaned imports fail the build; check none left)

## 📝 Worker notes & self-check
- DELETED `withCustomModeForExport` (~94 lines incl. its lighting snapshot/restore `finally`) and `applyLightingZones` (~42 lines) — both grep-verified zero call sites across src/ BEFORE deletion (only decls + one stale docstring mention). COLLAPSED `applyImportedConfig` inline into `importProfile` at the exact call site: 1s sleep + `saveCustomLighting` + `instanceof Error` → console.error kept verbatim (the deleted method logged, never threw, on save failure; the removed try/catch wrapper only re-threw unexpected throws, which importProfile's own outer catch — verified present — already handles). File 1101 → 960 lines (−141; diff: 24 ins, 165 del).
- F-R1 hardening: MacroList restore moved into a `finally` wrapping the `importConfig` call + both result checks, so it runs on EVERY return path (the two failure returns included). Marked in-file with an `F-R1:` comment. Behavior on the success path is byte-identical; no failure-path hardware test needed per spec.
- Inline-fixable defect cleared (QA tier): `repairCustomRgb` docstring referenced `applyImportedConfig` — reworded to "before importProfile's saveCustomLighting commit" so no stale reference survives.
- KEEP-verbatim anchors untouched (diff shows zero hunks in these regions): `convertLightConfigToSDKFormat` (+ its `LightModeConfigs` import :6 — still live, grep-verified :549/:559/:631), `ILightMode` import (:101/:457-459/:471 still live), importProfile's custom-mode switch incl. its deliberate `open` destructure, `decryptSDKConfig`, all repair methods + `ensureCustomModeReady`/`writeVerifiedCustomRgb`. Call order inside `if (config)` verified post-edit (grep of the block): repairDksDb3 → repairGlobalDeadband → repairSpecialLighting → repairSocdDelay → repairEndDelay → repairCustomRgb → 1s sleep → saveCustomLighting (inlined) → repairMainLighting LAST — identical to the pre-collapse sequence; the collapse changed only the middle link (method call → its verbatim body).
- Self-check vs sdk-reference-v2.md: no SDK surface touched — this task only deletes unreferenced app-side methods and moves one app-side call inline; no wrapper semantics, no new SDK calls. §8 zone semantics unchanged (`closedLighting`/`setSpecialLighting` call sites died with `applyLightingZones`, which was dead code — the live special-zone path is `repairSpecialLighting`).
- Design intent preserved: filters:[] ☑ (untouched, KeyboardService not modified) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (the inlined save-check keeps `instanceof Error` → console.error, never throws; the deleted method's `throw error` in its own catch is gone but was unreachable for SDK results, which are returned not thrown, and importProfile's outer catch covers unexpected throws)
- typecheck/build: `npm run typecheck` exit 0 (0 errors, baseline 0 — unchanged). `npm run lint` exit 0, zero warnings (confirms no orphaned imports/vars). Build not run — source-only deletion/relocation, no dependency or asset change (matches the gate's "ONLY when the change could affect the build").

## 🔍 Commits to review
Base: `fdfb693` (branch head before this task)   Head: `67fbf53` (this task's commit)
<!-- Reviewer runs this itself:
       git diff --stat fdfb693..<head>     then      git diff fdfb693..<head>
     A file touched outside this task's scope is a flag. Expected: src/services/ExportService.ts ONLY (+ docs/plans/* planning files). -->
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
Not tagged [hw] in the task list — Task 5 is a pure dead-code deletion + mechanical collapse with no intended behavior change; every surviving path is already hardware-verified (group D7 hw PASS 2026-10-21 covered the full import path incl. the sleep+save sequence and MacroList restore). The F-R1 `finally` changes only failure-path restore timing, which the spec explicitly ruled needs no hw test. If the Reviewer judges a sanity hw pass worthwhile anyway: one normal export→import round trip on the device, confirm imported config lands + local macro library intact (same check as group D7's final hw run).

**Hardware verdict (agent records from the PO's plain-language outcome):**
- (n/a unless the Reviewer requests the sanity pass above)

## ❓ Reviewer, please confirm
- [x] meets every "DONE WHEN" criterion above
- [x] diff scope matches the task (no stray files)
- [x] no design-intent violation
- [x] typecheck/build gate met where it applies (no newly introduced errors; unmasked ones recorded/deferred) — or N/A
- [x] tag is correct (high-stakes where required) — else auto-FAIL

---
## ✅ REVIEWER VERDICT
**Result:** PASS  ·  **Date:** 2026-10-21  ·  **Fail count:** 0

Reviewed fdfb693..67fbf53 (full ExportService.ts diff read; handoff e12bed6 confirmed docs-only). All five DONE-WHEN criteria re-run at head and PASS: (1) grep for the three symbols → nothing (exit 1); (2) `finally` count = 3; (3) `convertLightConfigToSDKFormat` count = 3; (4) `saveCustomLighting` count = 2; (5) typecheck exit 0, lint exit 0 (no orphaned imports/vars — confirms clean deletion). File is 960 lines as claimed.

**Deletions provably dead:** `git grep` at base fdfb693 shows `withCustomModeForExport` and `applyLightingZones` matched only their own definitions — zero call sites. `applyImportedConfig` had exactly one call site (inside `importProfile`) — the collapse target.

**Collapse is behavior-preserving:** the inlined block (1s sleep → `saveCustomLighting` → `instanceof Error` → console.error) is the deleted method's body verbatim minus its try/catch. The removed catch only logged and **re-threw**; any throw from `saveCustomLighting` now lands in `importProfile`'s outer catch (confirmed at head :931–934) which logs and returns `{success:false}` — identical net outcome. The dropped `_config` param was underscore-prefixed/unused and `saveCustomLighting()` takes no args. `convertLightConfigToSDKFormat` correctly kept (still live); its `closedLighting`/`setSpecialLighting` call sites died with the dead `applyLightingZones` — the live special-zone path (`repairSpecialLighting`) is untouched. Repair call order verified unchanged in context (…repairEndDelay → repairCustomRgb → inlined sleep+save → repairMainLighting LAST).

**F-R1 hardening correct:** MacroList restore moved into a `finally` wrapping `importConfig` + both failure-return checks, so it now runs on every exit path (intended); `return` inside `try` triggers `finally`. Success path is byte-identical. Marked with the `F-R1:` comment as specified.

**Design intent preserved:** diff touches ExportService.ts only (KeyboardService.ts untouched → filters:[] / usagePage 65440 intact); wrappers-return-Error honored (inlined save-check uses `instanceof Error` → console.error, never throws; failures surface as `{success:false}`).

**Tag/hw:** [high-stakes] correct. No [hw] tag; agree no hardware sanity pass is required — this is pure dead-code deletion plus a behavior-preserving collapse on a path already hardware-verified in group D7 (PASS 2026-10-21); F-R1 only changes failure-path restore timing, which the spec ruled needs no hw test. Not writing HW-TEST; task → DONE.

### Failed items (FAIL only)
(none)

### Findings (non-defect observations → routed to current-sprint.md `## Findings`)
(none — no out-of-scope observations raised this pass)
