# REVIEW: variant-p-imports

<!-- WORKER fills everything above the verdict line. REVIEWER fills the verdict section. -->

**SPRINT GOAL:** Clean up the SDK integration (typecheck infrastructure, variant-P import fix, wrapper-pattern skill, type-error cleanup) before feature work.
**TASK:** 2 — variant-P import fix in KeyboardService.ts + DebugKeyboardService.ts (+ tsconfig path) · **TAG:** [high-stakes] [hw]
**DONE WHEN:**
- Both services import `Device`/`HIDDevice` from `@sparklinkplayjoy/hid` (TS2614 import errors gone in both files)
- `PairedDevice` type defined in both files; union annotations applied at all planned sites (edits 1–18)
- XDKeyboard constructor arg uses v2 `DeviceInit` shape `{ usage: 1, usagePage: [65440], configs: [] }`
- Total typecheck error count ≤ baseline (docs/tsc-baseline.txt); no runtime behavior change — ⚠️ strictly 63 > 60 due to Task-4-deferred unmasking; see Worker notes gate flag for PO/PM ruling
- PO hardware ✓ (connect + auto-reconnect still work)

## 📝 Worker notes & self-check
- Applied all 18 checkpoint edits exactly as specified in ▶ RUN THIS: tsconfig.json path alias (committed in 57305ef, prior session), then KeyboardService.ts edits 1–10 and DebugKeyboardService.ts edits 11–18 in c15d44f. Annotation-only — no literal was completed with vendorId/usage/usagePage; both find() calls at KeyboardService.ts:137/194 left byte-identical per PO instruction.
- Self-check vs sdk-reference-v2.md: §13.7.1 (DeviceInit shape `{usage, usagePage: number[], configs: DeviceInfo[]}`), §13.7.2/§13.7.3 pt 4 (deferred d.data/serialNumber handling = Task 4 scope). hid dist types verified directly: `Device = DeviceInfo & { id; productName; data?: HIDDevice; collections }`, `HIDDevice` has no `serialNumber`.
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (same value, now array form per v2 DeviceInit) · wrappers return Error ☑ (untouched)
- typecheck/build: baseline **60** (docs/tsc-baseline.txt). Session start (57305ef, tsconfig alias already in) = **60** — the alias commit changed nothing. Post-task (c15d44f) = **63**: resolved 5 (4× TS2614 Device/DeviceInit not exported from sdk-keyboard + 1× TS2304 HIDDevice); **unmasked (not newly introduced) — EXPECTED, DEFERRED TO TASK 4** (§13.7.2 / §13.7.3 pt 4): 8 errors at KeyboardService.ts:137 & 194 — 6× TS18048 (`d.data` possibly undefined; v2 `Device.data` is optional) + 2× TS2339 (`serialNumber` absent from v2 `HIDDevice`). Net +3 = 8 unmasked − 5 resolved. These lines were error-free before only because the broken imports made the types `any`-ish; PO explicitly ruled they stay untouched until Task 4 decides serialNumber handling. `npm run build` passes (esbuild strips types).
- ⚠️ **PO/PM flag — self-check-gate conflict:** strictly read, the gate fails on BOTH clauses: total 63 > baseline 60, and the touched file gained errors. But the delta consists solely of *unmasked pre-existing* mismatches the plan defers to Task 4, per explicit PO ruling this session — not regressions introduced by the edit. Gate wording may need an "unmasked-and-deferred" exception (or a temporary baseline note) — for PM to decide.
- Cleanup: `.scratch/` holds baseline/post typecheck captures (baseline-services.txt, post-services.txt, base-norm.txt, post-norm.txt) — PO may delete. `_to_delete/` empty. No other cleanup needed.

## 🔍 Commits to review
Base: `819202c` (last commit before Task 2)   Head: `c15d44f` (this task; includes 57305ef tsconfig WIP)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat <base>..<head>     then      git diff <base>..<head>
     A file touched outside this task's scope is a flag. -->
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
**Worker fills (what to test):**
- What changed (that touches hardware behavior): nothing functional — types only. The XDKeyboard constructor arg changed shape (`usagePage: 65440` → `usagePage: [65440]`, added `configs: []`) to match the installed SDK v2's DeviceInit; connection/auto-reconnect code paths are otherwise byte-identical.
- What to verify: with a real SparkLink keyboard — manual Connect works; unplug/replug triggers auto-reconnect and the app recovers the session as before; the Debug page still connects independently. Any failure to enumerate or open the device would mean the v2 constructor shape is wrong.

**PO fills (after the hands-on check):**
- Hardware verdict: PENDING

## ❓ Reviewer, please confirm
- [ ] meets every "DONE WHEN" criterion above
- [ ] diff scope matches the task (no stray files)
- [ ] no design-intent violation
- [ ] typecheck/build gate met where it applies (or N/A) — note the deferred-unmask ruling above
- [ ] tag is correct (high-stakes where required) — else auto-FAIL

---
## ✅ REVIEWER VERDICT
**Result:** —  ·  **Date:** —  ·  **Fail count:** —

### Failed items (FAIL only)
—
