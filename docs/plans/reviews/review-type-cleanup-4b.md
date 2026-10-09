# REVIEW: type-cleanup-4b

<!-- WORKER fills everything above the verdict line. REVIEWER fills the verdict section. -->

**SPRINT GOAL:** Clean up the SDK integration (typecheck infrastructure, variant-P import fix, wrapper-pattern skill, type-error cleanup) before feature work.
**TASK:** type cleanup — services to zero (shim + d.data guards + serialNumber)  ·  **TAG:** [high-stakes] [hw]
**DONE WHEN:**
- `npm run typecheck`: **zero** errors in KeyboardService.ts and DebugKeyboardService.ts; total ≈23, all confined to the out-of-scope files.
- `npm run build` passes (connect paths touched → build check required).
- Runtime-identity argument written in the checkpoint + review file: every edit is type-level or a guard that cannot change behavior for currently-working inputs (B, E, F especially).
- docs/tsc-baseline.txt ratcheted DOWN to the measured post-4b count; breakdown line updated; waiver noted EXPIRED.
- review-type-cleanup-4b.md created from the template (sprint goal + this Done-when + Base/Head hashes + a Hardware check section saying in plain language WHAT changed and WHAT to verify — connect, auto-reconnect, Debug connect); task set IN-REVIEW → Reviewer → HW-TEST → PO verdict per the hardware gate.
- Cleanup reported in the checkpoint (`.scratch/` contents listed; `_to_delete/` entry if item D removes a whole file).

## 📝 Worker notes & self-check
- **Landed in 2 commits.** ee46924 = items A+B (shared `src/types/webhid.d.ts` ambient shim: BrowserHIDDevice/HIDConnectionEvent/HID/Navigator.hid?; `navigator.hid!` narrowing after existing guards; `d.data?.` optional chaining + BrowserHIDDevice casts in both find() predicates; DksLayoutType/DksType unions declared in src/types/types.ts, imported — not re-exported — by both facades). fb20895 = items C–G (KS+DBKS travel-layout params → DksLayoutType; getDks `type?: DksType`; getCustomLighting `key?: number` → `key: number` in both services; KS:863 filter callback `(t: number)`; setRateOfReturn result typed `unknown` keeping the runtime `instanceof Error` guard; setMacro gains required 3rd param `touchMode: string` passed through — PO decision, no default; DBKS dead `exportEncryptedJSON` wrapper removed via edit — PO decision).
- **Runtime-identity argument:** every edit is type-level (annotations, param types, ambient decls) or a guard that cannot change behavior for currently-working inputs. B (`d.data?.`): `data` is present on connect/disconnect events per spec — the `?.` only turns a would-be crash on a malformed event into a clean filter miss. E (annotation): zero runtime effect. F (`unknown` + existing instanceof guard): guard was already there; only the variable's static type changed. C (narrowed params): all verified callers pass conforming values (`'Layout_DB1'`-family literals, numbers, DksType members); getCustomLighting callers Lighting.vue:705 and ExportService:455 both pass `number`. G (setMacro 3rd param): wrapper had zero in-app callers; the facade already required 3 args, so the old 2-arg call was a TS error that would have passed `undefined` at runtime — new param is stricter, not looser. D (removed dead wrapper): zero callers in src; the underlying SDK method is untouched.
- Self-check vs sdk-reference-v2.md: §7 (setMacro 3-arg signature incl. touchMode; verification-table row "setMacro touchMode reset bug" noted — wrapper is now honest about the param instead of silently omitting it; no in-app callers so no behavior change today); §13.4/§13.7.3 (hid packaging defect precedent — shim is ambient-only, no import from @sparklinkplayjoy/hid added); facade signatures verified against `sdk-keyboard/dist/cjs/index.d.ts` (getCustomLighting(key: number), getDks(key, type?: DksType), setMacro(param, macros, touchMode: string), setRateOfReturn(value: number): Promise<number>) and travel methods against `dist/cjs/src/controller/higherKey.d.ts` (DksLayoutType params).
- Design intent preserved: filters:[] ☑ · usagePage 65440 ☑ · wrappers return Error ☑ (F keeps the instanceof guard; removed D wrapper was dead code, not a live contract; DebugKeyboardService's throw-style is its long-standing separate pattern, untouched otherwise)
- typecheck/build: **typecheck 36 → 23 total; KeyboardService.ts 0, DebugKeyboardService.ts 0.** Remaining 23 all out-of-scope (router/index.ts 17, profileStore 2, connection 2, travelProfilesStore 1, main.ts 1). Reconciliation: 36 = 23 + 13 resolved, 0 unmasked. **Build passes** (✓ built in 1.66s). Artifacts: `.scratch/tsc-4b-final.txt`. Baseline ratcheted 60 → 23 (docs/tsc-baseline.txt, breakdown line updated; the Task-2/4a waiver is **EXPIRED** — count now equals baseline).

## 🔍 Commits to review
Base: `5cc3260` (PM rev2, last reviewed state before 4b)   Head: `fb20895` (items C–G + baseline + this file)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat <base>..<head>     then      git diff <base>..<head>
     A file touched outside this task's scope is a flag. -->
Note: ee46924 (A+B wip) sits between Base and Head; review the full range 5cc3260..fb20895. The trailing commit adding this file + baseline ratchet is docs-only.
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
**Worker fills (what to test):**
- What changed (that touches hardware behavior): the connection layer's *types* were rewritten — a new ambient WebHID shim file, optional-chaining guards in the HID connect/disconnect event filters, and narrowed parameter types across the two service facades. No call sequence, payload, filter, or usagePage value changed. The only runtime-visible edits are the `?.` guards (item B) and setMacro's signature (item G — no in-app callers).
- What to verify: that connecting and staying connected behaves exactly as before. Specifically: (1) first connect via the Connect page works and device info displays; (2) auto-reconnect after unplug/replug or page reload still pairs to the remembered keyboard; (3) the Debug page connects and exercises its raw-SDK methods (including the travel getters whose param types changed) without new errors. Anything that worked before should work identically — this task's promise is zero behavioral change.

**PO fills (after the hands-on check):**
- Hardware verdict: PASS — <date>        (that's all a PASS needs; add a note only if useful)
  or: FAIL — <date> → see F1              (write the symptom once, in the F1 block below)
<!-- PASS → set the task to DONE in current-sprint.md.
     FAIL → put the symptom in an Fn block below, set the task to IN-PROGRESS,
            add "fix ONLY this — see review-<slug>.md §Fn" to ▶ RUN THIS. -->

## ❓ Reviewer, please confirm
- [ ] meets every "DONE WHEN" criterion above
- [ ] diff scope matches the task (no stray files)
- [ ] no design-intent violation
- [ ] typecheck/build gate met where it applies (or N/A)
- [ ] tag is correct (high-stakes where required) — else auto-FAIL

---
## ✅ REVIEWER VERDICT
**Result:** PASS / PASS (pending hw) / FAIL  ·  **Date:** YYYY-MM-DD  ·  **Fail count:** <n>

<!-- PASS (non-hw): one line confirming criteria met; flip task to DONE in current-sprint.md.
     PASS (pending hw): flip task to HW-TEST; PO does the hands-on check above and marks ✓/✗.
     FAIL: list each failed item below with full detail. Then append a short checklist to
     current-sprint.md ▶ RUN THIS, one bullet per item, each citing its §Fn here. -->

### Failed items (FAIL only)
(none yet)
