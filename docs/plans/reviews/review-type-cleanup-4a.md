# REVIEW: type-cleanup-4a

**SPRINT GOAL:** Clean up the SDK integration (typecheck infrastructure, variant-P import fix, wrapper-pattern skill, type-error cleanup) before feature work.
**TASK:** Task 4a — type cleanup: deps + Calibration + baseline ratchet  ·  **TAG:** [high-stakes] (KeyboardService.ts touched → always high-stakes per CLAUDE.md Tag ownership)
**DONE WHEN:**
- `@types/w3c-web-hid` collision measured in `.scratch/` first; installed as devDependency if clean, else the alternative documented in the checkpoint — decision logged either way.
- Missing `Calibration` import fixed (KeyboardService.ts TS2304 ×2).
- `docs/tsc-baseline.txt` ratcheted DOWN to the measured post-4a count (never up), breakdown line updated, `npm run typecheck` ≤ new baseline, no new errors in touched files.

## 📝 Worker notes & self-check

**1. `@types/w3c-web-hid` measured — verdict: NOT clean, do not install.** Decision logged.

Measured via a `.scratch/` harness (two tsconfigs extending the real one, differing only in the
`types` array) against **lockfile-pinned** SDK versions:

- **Control (no w3c-web-hid): 63 errors. Measure (with it): 68 errors. Net +5 — strictly worse.**
- Fixes 17: `navigator.hid` unknown ×7 (TS18046), `Navigator.hid` ×3, `HIDConnectionEvent` ×2
  (TS2552), implicit-`any` params ×5 (TS7006), plus others.
- Creates 22: `Property 'id' does not exist on HIDDevice` ×9 (TS2339), `serialNumber` ×7 (TS2339),
  TS2322 ×4, TS2769 ×2.

**Root cause of the collision (the thing §13.7.3 pt 4 warned about):** the two `HIDDevice` types are
*not* compatible, and hid's module-scoped interface **shadows** the global class wherever hid's type
is imported.

| | `id` | `serialNumber` | `productName` | declared as |
|---|---|---|---|---|
| hid's `HIDDevice` (`hid/dist/cjs/src/types/types.d.ts:27`) | ✅ `string` | ❌ | ✅ | module-scoped `export interface` |
| `@types/w3c-web-hid@1.0.7` (`index.d.ts:139`) | ❌ | ❌ | ✅ | global `declare class` |

Both services `import type { Device, HIDDevice } from '@sparklinkplayjoy/hid'`, so `Device.data`
stays hid's `HIDDevice` — but adding the global package retypes the *live* `navigator.hid` results as
the spec class. The `find(d => d.data...)` callbacks then resolve against the spec type, which has
neither `id` nor `serialNumber`, breaking every such access.

**Also note:** TypeScript 5.9.3's `lib.dom.d.ts` contains **zero** `HIDDevice`/`HID` declarations —
WebHID is not in the built-in DOM lib, so there was never a lib.dom collision. The conflict is
purely hid-vs-spec.

**`tsconfig.json` gate detail (why a bare install would silently do nothing):** `tsconfig.json` sets
`"types": ["vite/client"]`, a *whitelist*. An installed `@types/*` package is **inert** unless added
to that array. So this decision requires no `package.json` change and no `tsconfig.json` change —
both left untouched.

**Alternative documented (measured, not proposed): the local-shim pattern already in this file.**
`KeyboardService.ts:8-10` already does exactly this:
```ts
interface HIDConnectionEvent extends Event {
  device: HIDDevice;   // hid's own HIDDevice, imported at :2
}
```
That is why `KeyboardService.ts` has **no** TS2552, while `DebugKeyboardService.ts` has 2
(`:103`, `:108`) — it imports hid's `HIDDevice` but declares no local event shim. So the alternative
to a global types package is: keep hid as the single `HIDDevice` authority, and replicate this
existing local-shim pattern into `DebugKeyboardService.ts`. The remaining `navigator.hid` TS18046
sites (7) would need a small local `Navigator.hid` augmentation typed against **hid's** `HIDDevice`,
not the spec's. **Not implemented in 4a** — out of its scope; recorded here so 4b/a later task has
the measured answer instead of re-deriving it.

**2. `Calibration` fixed — deviation from the Done-when wording, deliberate and logged.**

The Done-when says "fix the missing **import**". Measurement proves **there is no `Calibration` type
to import**:
- Not in any SDK package. `grep -rn "Calibration"` across `@sparklinkplayjoy/*/dist/cjs/**/*.d.ts`
  and `protocol-keyboard/src/` → **no match** (only `OrderType.START_CALIBRATION`/`CLOSE_CALIBRATION`).
- SDK signature is `calibrationStart(): Promise<any>` / `calibrationEnd(): Promise<any>`
  (`sdk-keyboard/dist/cjs/src/controller/info.d.ts:10-11`).
- Verified against `docs/sdk-reference-v2.md` §4 (lines 587-613): both documented as
  `Promise<any>`. Section status checked per CLAUDE.md — §4's claim matches the compiled bundle
  directly, so it is authoritative here.

So an import was impossible; declaring a local `Calibration` shape would have meant **inventing** a
type I cannot verify from any ground-truth source (CLAUDE.md hard rule 6). Instead I matched the
file's own established precedent for SDK methods that return `any` — **23 existing sites** use
`Promise<any | Error>`, **0** use `unknown | Error` (e.g. `getBaseInfo():425`, `getMacro():522`,
`getLighting():875`), and the `sdk-wrapper` skill documents exactly this shape: *"many existing
wrappers write `<any> | Error` because the SDK's own `.d.ts` returns `Promise<any>`."*

Change (2 lines, `KeyboardService.ts:802`, `:816`):
```diff
- async calibrationStart(): Promise<Calibration | Error> {
+ async calibrationStart(): Promise<any | Error> {
- async calibrationEnd(): Promise<Calibration | Error> {
+ async calibrationEnd(): Promise<any | Error> {
```
Callers unaffected: both call sites in `src/pages/Calibration.vue` (`:96`, `:147`) only do
`if (result instanceof Error) throw result;` and then **ignore the success value entirely** — so
widening the success type to `any` cannot break them. Wrapper bodies untouched (guard, `ensureKeyboard()`,
`instanceof` passthrough, outer try/catch all intact per the skill's canonical shape).

**3. `docs/tsc-baseline.txt` NOT modified — deliberate, explained.**

The Done-when says ratchet the baseline DOWN to the post-4a count. **Post-4a count is 61; the
baseline is 60.** 61 > 60, so writing 61 would ratchet the baseline **UP**, which the file itself
forbids (line 3: "Ratchet DOWN only") and which CLAUDE.md's self-check gate forbids ("The baseline
only ever ratchets DOWN"). I left the file untouched rather than weaken the gate.

This is the tail of R1, not a new failure: **Task 2 already left the count at 63 against a baseline
of 60**, accepted as PASS + hardware PASS with the 8 unmasked errors explicitly deferred to Task 4.
4a resolved 2 of the outstanding errors (63 → 61) but cannot get back under 60 on its own, because
the remaining excess is the deferred 4b set (TS18048 `d.data` ×6 + TS2339 `serialNumber` ×2) plus
23 errors in files 4a never touches. The standing **gate waiver** in ▶ RUN THIS covers exactly this
("the ratchet target is 'down from 63', not zero"). Reconciliation: **61 = 63 − 2** (Calibration
TS2304 ×2 resolved; 0 unmasked; 0 new).

**Reviewer decision needed:** confirm that leaving the baseline at 60 with count 61 under the waiver
is correct, versus editing the baseline file. I judged that not weakening a safety gate is the safer
default, and that the ratchet becomes real once 4b lands.

- Self-check vs sdk-reference-v2.md: **§4 (lines 587-613)** checked for `calibrationStart`/`calibrationEnd`
  → both `Promise<any>`, matches the compiled `info.d.ts:10-11`; **§13.7.3 pt 4** checked for the
  `HIDDevice` collision warning → confirmed, and measured (hid module-scoped vs spec global, member
  sets differ). §13.7.2's `serialNumber` claim was **not** relied upon — that is 4b/PO-hardware territory.
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (both bodies byte-identical except the return type)
- typecheck/build: `npm run typecheck` = **61** (from 63). No new errors — verified by diffing the
  full normalized error lists pre/post: `comm -13` output was **empty**, and the only 2 lines removed
  were the TS2304 `Calibration` pair. `npm run build` **not run**: this change is a return-type
  widening on two methods whose bodies are unchanged and whose callers discard the value, so it
  cannot affect the build.

## 🔍 Commits to review
Base: `d94d45b` (PM R1 ruling + Task 4 split)   Head: this task's commit — review as `d94d45b..HEAD`
Files touched: `src/services/KeyboardService.ts` (2 lines), `docs/plans/current-sprint.md`,
`docs/plans/reviews/review-type-cleanup-4a.md`. No `package.json`, no `package-lock.json`,
no `tsconfig.json`, no `docs/tsc-baseline.txt`, no `src/` file other than KeyboardService.ts.

Fix-round ranges (added on each re-review):

## 🖥️ Hardware check ([hw] tasks only)
N/A — Task 4a is not tagged [hw]. Nothing hardware-affecting changed: the two `Calibration` return
types are compile-time only, the method bodies are untouched, and no SDK call, device filter, or
`usagePage` was modified. (Task 4b carries the [hw] tag and the PO serialNumber pre-step.)

## ❓ Reviewer, please confirm
- [ ] meets every "DONE WHEN" criterion above — noting the two logged deviations: (a) no import was
      possible for `Calibration`, so the file's `any | Error` precedent was matched instead;
      (b) the baseline was left at 60 because the post-4a count (61) is above it and ratcheting up is forbidden
- [ ] diff scope matches the task (no stray files)
- [ ] no design-intent violation
- [ ] typecheck/build gate met where it applies (count 61 vs baseline 60, under the standing ▶ RUN THIS waiver; reconciliation 61 = 63 − 2)
- [ ] tag is correct ([high-stakes] — KeyboardService.ts touched) — else auto-FAIL
- [ ] the `@types/w3c-web-hid` "do not install" verdict is sound, and the documented alternative is adequate for 4a

---
## ✅ REVIEWER VERDICT
**Result:**   ·  **Date:**   ·  **Fail count:**

### Failed items (FAIL only)
