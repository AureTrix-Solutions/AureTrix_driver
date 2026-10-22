# REVIEW: exportconfig-contract

<!-- WORKER fills everything above the verdict line. REVIEWER fills the verdict section.
     The PO's hardware verdict is RECORDED BY AN AGENT from the PO's plain-language outcome —
     the PO does not hand-edit this file. -->

**SPRINT GOAL:** Make export→import a true full-keyboard recovery: live-read the dead-shape fields (D1), fix advanced-key export shapes incl. DB3 carry (D2/D2b), make import macro-safe (D5), repair what SDK import silently drops — DB3 + special lighting + socd/end delay — via app-side decrypt (D7), delete the dead code (D6), and fix the exportConfig contract violation.
**TASK:** 6 — exportConfig contract fix (rule 7: wrappers return Error, never throw)  ·  **TAG:** [high-stakes] (NOT [hw] — no hardware behavior change; failure-path plumbing only)
**DONE WHEN:**
- `grep -n "throw new Error" src/services/KeyboardService.ts` shows no hit inside exportConfig
- `grep -c "await KeyboardService.exportConfig" src/services/ExportService.ts` ≥ 1
- typecheck 0
- lint 0

## 📝 Worker notes & self-check
- `KeyboardService.exportConfig` (:1576): `void`/throw → `async ... Promise<void | Error>`; guard now `return new Error('No device connected')`; SDK call awaited in try/catch → `console.error('Failed to export config:', error); return error as Error;` (canonical wrapper shape per sdk-wrapper skill). Defensive `const result: unknown = await ...; if (result instanceof Error) return result;` — SDK d.ts (`dist/{cjs,esm}/index.d.ts:90`) types it `(data: any, filename?: string) => void`, captured via `unknown` to keep the instanceof check type-safe.
- `ExportService.exportProfile` (:541, sole call site — `grep exportConfig src/` = 3 hits: def, SDK call, this): now `const exportResult = await KeyboardService.exportConfig(config, filename); if (exportResult instanceof Error) return { success: false, error: exportResult.message };`. Outer catch untouched (still covers gatherKeyboardSnapshot).
- Spec compliance: exact fix shape from plan line 40 (async/Promise<void | Error>, return-not-throw, await SDK call, caller instanceof → {success:false}). PM's ":1531-1535 / :625-633" anchors were stale post-Task-5 (1101→960 lines); re-located by grep: KS :1576, ES :538/:541. Other KS throw at :349 untouched (spec: OUT of scope). No other callers exist.
- Self-check vs sdk-reference-v2.md: N/A — no SDK semantics touched; SDK signature verified from its own d.ts instead (`exportConfig: (data: any, filename?: string) => void`).
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched, ensureKeyboard still used) · wrappers return Error ☑ (this IS the fix — exportConfig was the last rule-7 violator in the export path)
- typecheck/build: typecheck 0 errors (exit 0). Build NOT run — change is service-layer plumbing with no import/config/build-pipeline impact; typecheck is the active gate and it's clean. Lint: exit 0, 0 warnings.
- Gates re-run at head (all 4): grep "throw new Error" KS → 9 hits, NONE inside exportConfig (:185/:189/:211/:299/:349/:355/:1330/:1452/:1456 — all pre-existing, other methods); grep -c "await KeyboardService.exportConfig" ES → 1; typecheck 0; lint 0.

## 🔍 Commits to review
Base: `39d0520` (Task 5 Reviewer PASS — branch head at task start)   Head: `35dda4f` (this task)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat 39d0520..<head>     then      git diff 39d0520..<head>
     A file touched outside this task's scope is a flag. -->
Expected diff scope: `src/services/KeyboardService.ts` (exportConfig only), `src/services/ExportService.ts` (exportProfile only), `docs/plans/current-sprint.md` (status/checkpoint), `docs/plans/reviews/review-exportconfig-contract.md` (this file). Nothing else.
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — task is NOT tagged [hw]. No hardware behavior changes: success path calls the same SDK exportConfig with the same args; only the failure path (no device / SDK throw) changes from throw to returned Error. PO sign-off note: export-on-connected-device behavior is byte-identical.

## ❓ Reviewer, please confirm
- [ ] meets every "DONE WHEN" criterion above
- [ ] diff scope matches the task (no stray files)
- [ ] no design-intent violation
- [ ] typecheck/build gate met where it applies (no newly introduced errors; unmasked ones recorded/deferred) — or N/A
- [ ] tag is correct (high-stakes where required) — else auto-FAIL

---
## ✅ REVIEWER VERDICT
<!-- After ONE verification pass, RULE. Don't keep investigating. A runtime/behavior question goes
     to the PO hardware check, not more static analysis. Output = PASS/FAIL + findings + your own
     Findings one-liners (into current-sprint.md). Do NOT plan task order/parallelism. -->
**Result:** —  ·  **Date:** —  ·  **Fail count:** —

### Failed items (FAIL only)
