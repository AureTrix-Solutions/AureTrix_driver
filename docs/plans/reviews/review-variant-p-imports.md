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
- [x] meets every "DONE WHEN" criterion above
- [x] diff scope matches the task (no stray files)
- [x] no design-intent violation
- [x] typecheck/build gate met where it applies — **by exception**, see R1 below
- [x] tag is correct (high-stakes + hw — both required and correctly assigned)

## 🔎 Reviewer findings (2026-10-08, fresh session)

**Reruns (Reviewer independent):**

`npx tsc --noEmit | grep -cE "error TS"` → **63** (matches Worker's reported count exactly).

Per-file, vs docs/tsc-baseline.txt breakdown:
| File | Baseline | Now | Δ |
|---|---|---|---|
| KeyboardService.ts | 23 | 28 | **+5** |
| DebugKeyboardService.ts | 14 | 12 | **−2** |
| router/index.ts | 17 | 17 | 0 |
| profileStore / connection / travelProfilesStore / main | 2/2/1/1 | 2/2/1/1 | 0 |
| **Total** | **60** | **63** | **+3** |

All 8 of KeyboardService's new errors are exactly the predicted pair of sites — `(137,*)` and `(194,*)`,
6× TS18048 (`d.data` possibly undefined) + 2× TS2339 (`serialNumber`). No error appeared at any
line the Worker touched. Confirmed independently: `serialNumber` occurs **0 times** in
`hid/dist/cjs/src/types/types.d.ts`.

`npm run build` → **✓ built in 1.56s** (all chunks emitted, Debug-DxD4im9n.js present).

**R1 — the self-check gate fails on wording; PASS by exception is the correct ruling.**
Strictly, both clauses fail: 63 > 60, and a touched file gained errors. But the Worker's ⚠️ flag is
well-founded and I concur. The delta is *unmasking*, not regression: those lines were silent only
because the broken imports made `Device`/`DeviceInit` `any`. Deferring them to Task 4 was an
explicit PO ruling this session, and §13.7.2 already enumerated them as pre-existing latent errors.
The baseline was correctly **not** touched (ratchets down only).

**Notably, the result is better than the spec predicted.** §13.7.1 forecasts variant P → **74**
errors (B/D's 16 unmasked + 2 more, §13.7.4). Measured is **63** — 11 fewer. The gap is the
Worker's `type PairedDevice = { id: string; data: HIDDevice; productName: string }` unions: they
suppress the 8 × TS2322 device-literal errors §13.7.2 expected, because the fallback literal
`{ id, data: device, productName }` now matches a named member of the union instead of failing
against `Device` (whose `usage`/`vendorId`/`collections` the literal omits). That is a genuine
improvement over bare variant P, achieved without touching the two find() predicates.

**→ For PM:** the gate needs an "unmasked-and-deferred" exception clause (or a baseline note
mechanism). As written it is arithmetically unsatisfiable for any task that fixes a broken import
while a later task owns the resulting latent errors. Task 4 will hit the same wall.

**R2 — §13.7.4's central claim is factually WRONG. `configs` IS reachable.** This is a
documentation defect in ground truth, found while verifying design intent. §13.7.4 asserts
"`configs` is only ever consumed by hid's own `requestDevice()` … **`XDKeyboard` does not expose
`requestDevice`** … So hid's `requestDevice` — and therefore `configs` — is **never invoked on this
code path**." The premise is true but the conclusion does not follow — the doc missed hid's
*internal* fallback. Verified chain against the installed bundles:

1. `KeyboardService.getDevices()` (src/services/KeyboardService.ts:136 and :193) → `XDKeyboard.getDevices()`
2. `sdk-keyboard/dist/esm/index.js`: `getDevices(){ return this.devices = await this.hidService.devices(), this.devices }`
3. `hid/dist/esm/index.js`: `async devices(){ let e=await this.getDevices(); if(0===e.length){ try{ await this.requestDevice() }catch(e){ return console.log("e: ",e),[] } … } }`
4. `hid/dist/esm/index.js`: `async requestDevice(){ … navigator.hid.requestDevice({filters:this.configs}) … }`
5. `this.configs = e` is assigned verbatim from the `DeviceInit` arg — confirmed by
   `this.usage=Array.isArray(t)?t:[t],this.usagePage=Array.isArray(s)?s:[s],this.configs=e`

So the zero-match branch of `devices()` **does** call hid's `requestDevice`, and `configs` **does**
reach a `filters` argument. `XDKeyboard` not exposing `requestDevice` publicly is irrelevant — the
façade reaches it internally. Filed to backlog (one line) per CLAUDE.md rule 8; not fixed here.

**Why this does NOT fail the task:** the prescribed value is `configs: []`, and an empty filter
list means *unfiltered* — which is precisely the design intent (`filters: []` at the app level).
Had the Worker written `configs: [{ usage: 1, usagePage: 65440 }]`, that would have been a
design-intent violation. `[]` is the correct, intent-preserving choice, and it is correct
*because* the path is reachable. The Worker followed §13.7.3 exactly; the error is the spec's
reasoning, not the edit.

**Design intent — verified, all three intact:**
- `filters: []` at KeyboardService.ts:128 — **untouched** by the diff.
- `usagePage` 65440 — same value. The array form is required by v2 `DeviceInit`
  (`usagePage: number[]`, read directly from types.d.ts:10-14) and is **runtime-identical**: hid
  normalizes with `Array.isArray(s)?s:[s]`, so `[65440]` and `65440` produce the same field.
  `filterHIDDevices` then compares `e.usagePage===this.usagePage[r]` over that array — semantics
  unchanged. Not a device filter either way; it selects the SparkLink command interface.
- Wrappers return `Error`, never throw — **untouched**.
- `import type` (not a value import) at both sites, so nothing is bundled from `hid`: confirmed
  both occurrences are `import type`, and the build emitted no new chunk.
- tsconfig `paths` target `dist/cjs/index.d.ts` **exists** (205 bytes) and re-exports
  `./src/types/types`, so `Device`/`HIDDevice` genuinely resolve. `DeviceInit` now has **0**
  references in src/ — the removal is complete, no dangling import.
- DebugKeyboardService.ts:76 `filters: [{ usagePage: 65440, usage: 1 }]` is **pre-existing** —
  present at base 819202c line 73, untouched by this diff. Not attributable to this task.

**Diff scope:** tsconfig.json, KeyboardService.ts, DebugKeyboardService.ts + the Worker's own
checkpoint/review-file writes. No stray files, no out-of-scope source edits. All 18 planned edits
present; the two find() predicates confirmed **byte-identical** to base.

---
## ✅ REVIEWER VERDICT
**Result:** PASS (pending hw)  ·  **Date:** 2026-10-08  ·  **Fail count:** 0

Code passes. Task 2 moves **IN-REVIEW → HW-TEST**; the PO's hands-on device check is now the gate.

Every "Done when" criterion is met: variant-P applied at both sites exactly per §13.7.3, all 18
edits present, the two find() predicates left byte-identical, no design-intent violation, build
green, and the error count fully reconciled (63 = 60 − 5 resolved + 8 unmasked, all unmasked errors
at the two predicted sites and nowhere else). Tag [high-stakes] [hw] correct — this touches
KeyboardService, which is always high-stakes regardless of size.

Two findings recorded above, **neither a fail item**:
- **R1** — the self-check gate is unsatisfiable as worded; PASS granted by exception on the PO's
  deferred-unmask ruling. **For PM to amend** (Task 4 will hit the same wall).
- **R2** — §13.7.4's claim that `configs` can never reach a `filters` argument is **factually
  wrong**; hid's internal `devices()` zero-match fallback calls `requestDevice({filters: this.configs})`.
  Harmless here because `configs: []` is unfiltered, which *is* the design intent. Filed to
  backlog; the doc should be corrected in a docs task.

**No fix round required. Nothing for a Worker to redo.**

### Failed items (FAIL only)
—

### Reviewer note on the hardware check
The Worker's "what to test" is accurate and I endorse it. One addition worth the PO's attention,
following from R2: because `configs` is reachable, the zero-match branch of `hid.devices()` can
trigger a **second, SDK-initiated device-picker prompt** with `filters: []`. That is pre-existing
v2 behavior, not something this diff introduces — but the PO should not be surprised if an extra
unfiltered picker dialog appears when no matching device is present. It is the *expected*
consequence of the design intent, not a regression.

The specific thing that would prove the v2 constructor shape wrong: failure to enumerate or open
the device on manual Connect, or auto-reconnect no longer recovering the session after
unplug/replug. `usagePage: [65440]` is verified runtime-equivalent to `65440` (hid normalizes via
`Array.isArray`), so I do not expect either failure.

**Hardware verdict: PENDING** — PO to record here after the hands-on check, then set the task
status line in current-sprint.md (✓ → DONE / ✗ → IN-PROGRESS + §F1).
