# REVIEW: d5-macro-noop

<!-- WORKER fills everything above the verdict line. REVIEWER fills the verdict section.
     The PO's hardware verdict is RECORDED BY AN AGENT from the PO's plain-language outcome —
     the PO does not hand-edit this file. -->

**SPRINT GOAL:** Make export→import a true full-keyboard recovery: live-read dead-shape fields (D1), fix advanced-key export shapes incl. DB3 (D2/D2b), make import macro-safe (D5), repair what SDK import drops — DB3 + special lighting — via app-side decrypt (D7), delete dead code (D6), fix the exportConfig contract violation.
**TASK:** D5: import must not destroy the local macro library  ·  **TAG:** [high-stakes] [hw]
**DONE WHEN:**
- `grep -c "MacroList" src/services/ExportService.ts` ≥ 3 (actual: 5)
- `npm run typecheck` exit 0 (actual: 0)
- `npm run lint` exit 0 (actual: 0)
- [hw] PO: record a macro, import any profile, macro still there

## 📝 Worker notes & self-check
- importProfile: snapshot `localStorage.getItem('MacroList')` immediately before `KeyboardService.importConfig(file)`; restore (setItem / removeItem-if-was-null) after the `result.success === false` early-return, before the existing double file read. Rationale: SDK setImportData unconditionally calls sync setMacro which overwrites MacroList with the file's always-empty list (PO hardware-confirmed the loss; pm-notes "D5-revised").
- buildMacroLibrary: added PO-decision line to the existing stub comment (empty macro list accepted for export; import-side now protects localStorage). No behavior change there.
- Restore placement note: early-return paths (importConfig Error / success:false) skip the restore — intentional per plan; on those paths setMacro either didn't run or the import failed, and the snapshot was taken before any mutation, so skipping restore cannot lose data the user had.
- Banked grep: only 2 `MacroList` getItem sites src-wide — MacroRecording.vue:121 (re-reads storage on page load) and the new ExportService snapshot; no Pinia/store cache of the macro list, so localStorage restore alone is effective (page re-reads on next visit).
- Self-check vs sdk-reference-v2.md: §7 (macro) — getMacro returns slot metadata only, no action readback; consistent with D5's premise that exported macro lists are always empty. No SDK call added/changed — this task touches only localStorage around the existing importConfig call.
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (no wrapper changed)
- typecheck/build: typecheck exit 0 (baseline 0, no new errors); lint exit 0. Build not run — change is localStorage-only in an async method, cannot affect bundling.

## 🔍 Commits to review
Base: `0bc1bb0` (sprint branch point)   Head: `235ca55` (this task)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat 0bc1bb0..235ca55     then      git diff 0bc1bb0..235ca55
     A file touched outside this task's scope is a flag. -->
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
**Worker fills (what to test):**
- What changed (that touches hardware behavior): Importing a profile no longer wipes the locally recorded macro library; the SDK import itself is unchanged.
- What to verify: Record a macro in the Macro page, export or use any profile file, run Import, then return to the Macro page — the recorded macro should still be there. Also sanity-check a normal import still applies (keys/lighting) as before.

**Hardware verdict (agent records from the PO's plain-language outcome):**
- Hardware verdict: PASS — 2026-10-13 (PO: recorded macro persisted after profile import)

## ❓ Reviewer, please confirm
- [x] meets every "DONE WHEN" criterion above
- [x] diff scope matches the task (no stray files)
- [x] no design-intent violation
- [x] typecheck/build gate met where it applies (no newly introduced errors; unmasked ones recorded/deferred) — or N/A
- [x] tag is correct (high-stakes where required) — else auto-FAIL

---
## ✅ REVIEWER VERDICT
**Result:** PASS (pending hw)  ·  **Date:** 2026-10-13  ·  **Fail count:** 0

Independent re-run of every code Done-when (`git diff 0bc1bb0..235ca55` reviewed directly):
- `grep -c "MacroList" src/services/ExportService.ts` → **5** (≥ 3 ✓)
- `npm run typecheck` → **exit 0** ✓ · `npm run lint` → **exit 0** ✓
- Diff scope: `src/services/ExportService.ts` (16 lines, exactly edits 1-3) + `docs/plans/current-sprint.md` (plan mechanics). No stray source files. ✓
- Ordering verified by grep: snapshot :689 immediately before `importConfig(file)` :691; restore :702-706 after both result guards (:693, :697) and before the file re-read :708 — matches plan edits 1+2. Null-branch restore (`removeItem` when no prior list) correct.
- Edit 3: comment-only in buildMacroLibrary; return value untouched. ✓
- Edit 4 constraint: `macro:{list:[],v2list:[]}` in gatherKeyboardSnapshot untouched by the diff. ✓
- Design intent: filters:[], usagePage 65440, wrapper Error contract all untouched. ✓
- Tag [high-stakes] [hw] correct (import-path logic change; PO hardware check required).

**Findings (non-blocking, routed to PM):**
- F-R1: The `result instanceof Error` (:693) and `result.success === false` (:697) early-returns skip the MacroList restore, but SDK `setImportData` may run sync `setMacro` (overwriting MacroList with the file's empty list) *before* reporting failure — a failed import could still wipe local macros. Placement is exactly per plan edit 2, so Task 1 is spec-compliant; where to verify: SDK bundle `setImportData` — ordering of the `setMacro` call vs. the failure return. Worker note :18 asserts "setMacro either didn't run or the import failed" — the second half of that claim is not bundle-verified.

**Hardware check pending** — PO to exercise per §Hardware check above. Reviewer sets HW-TEST, never DONE, on [hw] tasks.
