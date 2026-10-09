---
name: sdk-wrapper
description: The AureTrix KeyboardService wrapper pattern — how to add or review a method that wraps a SparkLink SDK (@sparklinkplayjoy/sdk-keyboard XDKeyboard) call. Use whenever touching src/services/KeyboardService.ts, src/services/DebugKeyboardService.ts, or ExportService.ts, or when adding any new hardware-facing method. Covers the connectedDevice guard, ensureKeyboard(), return-Error-never-throw, batch processing, known deviations, and where param/return types come from.
---

# SDK wrapper pattern

Every hardware call in this app goes through a `KeyboardService` wrapper. The wrapper is the **only**
place that touches `XDKeyboard`. Pages, components and stores call the wrapper and check for an
`Error`; they never call the SDK directly and never `try/catch` a hardware call for control flow.

Returning `Error` instead of throwing is a **design-intent rule** (CLAUDE.md §7). Changing it is
always `[high-stakes]` and needs Reviewer + PO sign-off.

## The canonical shape

Copy this for any new getter or setter that returns a value. Verbatim from
`src/services/KeyboardService.ts:802` (`calibrationStart`) — the simplest full example:

```ts
async calibrationStart(): Promise<Calibration | Error> {
  try {
    if (!this.connectedDevice) {
      return new Error('No device connected');
    }
    const result = await this.ensureKeyboard().calibrationStart();
    if (result instanceof Error) return result;
    return result;
  } catch (error) {
    console.error('Failed to start calibration:', error);
    return error as Error;
  }
}
```

Four required parts, in this order:

1. **Return type is `<Success> | Error`.** Never `throws`. The union is what forces callers to
   handle failure. Note that many existing wrappers write `<any> | Error` (`setLighting`,
   `getMacro`, `setPollingRate`, …) because the SDK's own `.d.ts` returns `Promise<any>` — prefer a
   real type when you can source one (see *Where types come from*).
2. **`if (!this.connectedDevice) return new Error('No device connected');`** The guard runs *before*
   any SDK access. `connectedDevice` is the service's own private field
   (`Device | PairedDevice | null`, declared at `:15`) — do not substitute `connectionStore`.
3. **`await this.ensureKeyboard().<method>(...)`** — always via `ensureKeyboard()`, never
   `this.keyboard` directly.
4. **`if (result instanceof Error) return result;`** — the SDK reports failure by *returning* an
   `Error`, not throwing. Pass it through unchanged: don't re-wrap it, don't stringify it, don't
   replace its message. Callers may match on the instance.

The outer `try/catch` exists **only** to convert an unexpected throw into the documented contract.
Log with `console.error` naming the operation, then `return error as Error`. Never re-throw.

### What `ensureKeyboard()` actually does

`:41`. It is a lazy constructor, nothing more:

```ts
private ensureKeyboard(): XDKeyboard {
  if (!this.keyboard) {
    this.keyboard = new XDKeyboard({ usage: 1, usagePage: [65440], configs: [] });
  }
  return this.keyboard;
}
```

It does **not** apply connection state or bind the device — it only guarantees a non-null
`XDKeyboard` carrying the fixed `usagePage: [65440]` and unfiltered `configs: []`. Bypassing it
risks a null-instance crash or a second instance with different options.

## Known deviations (real code — do not "fix" them in passing)

Not every wrapper follows the canonical shape. These three are deliberate or at least long-standing:

| Method | Line | Deviation |
|---|---|---|
| `setKey` | `:512` | `Promise<void \| Error>`, but **no** `connectedDevice` guard and **no** `instanceof Error` check — just `await this.ensureKeyboard().setKey(keyConfigs); return;` |
| `getDevices` | `:113` | Returns `Promise<Device[]>` — **no `Error` in the union**; on failure it returns `[]` instead. Also no guard. |
| `initializeKeyboard` | `:259` | Returns `Promise<void>`; dedupes concurrent calls through `this.initializationPromise`. No `Error` union. The real work is in `_initializeKeyboardInternal` (`:272`, retries ≤ 2), which *does* guard on `connectedDevice`. |

If your task touches one of these, match the surrounding behaviour and flag the inconsistency in
your checkpoint. Do not silently normalise them — `getDevices`' empty-array fallback in particular
has callers that depend on it. Per CLAUDE.md §8, a genuine bug outside your task scope gets **one
line in `docs/plans/backlog.md`** and nothing more.

## Caller side

```ts
const result = await KeyboardService.calibrationStart();
if (result instanceof Error) {
  // surface it — do not swallow, do not throw
  return;
}
// result is narrowed to the success type here
```

`instanceof Error` is the only supported check. Truthiness checks are wrong: a valid SDK payload can
be falsy, and `if (result)` then misreads success as failure.

## Bulk / many-key operations

**Never loop per-key SDK calls over a whole keyboard** — it overloads the device. Use
`src/composables/useBatchProcessing.ts`.

Batching lives in the **component/page layer**, not in `KeyboardService`. The real shape, from
`src/components/performance/SingleKeyTravel.vue:164`:

```ts
const { processBatches } = useBatchProcessing();

await processBatches(keys, async (physicalKeyValue) => {
  await KeyboardService.setPerformanceMode(physicalKeyValue, 'single', 0);
  await KeyboardService.setSingleTravel(physicalKeyValue, singleKeyTravel.value);
  await KeyboardService.setDp(physicalKeyValue, topDeadZone.value);
  await KeyboardService.setDr(physicalKeyValue, bottomDeadZone.value);
});
```

Exact signature (`useBatchProcessing.ts:5`):

```ts
processBatches<T>(
  keys: { physicalKeyValue: number; keyValue: number }[] | number[],
  updateFn: (physicalKey: number) => Promise<T>,
  batchSize: number = 80,
  delayMs: number = 100,
): Promise<void>
```

- `keys` accepts **either** objects **or** plain numbers. It detects which via
  `typeof keys[0] === 'object' && 'physicalKeyValue' in keys[0]` (`:12`), then maps objects down to
  `k.physicalKeyValue`.
- `updateFn` receives the **`physicalKeyValue`**, never the display `keyValue`. All SDK calls are
  keyed on `physicalKeyValue` (CLAUDE.md §Key model).
- Defaults are **80 keys per batch, 100ms between batches**. Don't raise `batchSize` or lower
  `delayMs` without a hardware-tested reason.
- Batches are sequential (`await Promise.all(batch.map(updateFn))` then `setTimeout(delayMs)`,
  `:21`); keys *within* a batch run concurrently.
- Returns `Promise<void>` and **does not collect or report per-key errors**. If a bulk operation
  must surface failures, accumulate them yourself inside the `updateFn` closure.

### Gotcha: `physicalKeyValue` is optional in the app's own type

`src/types/types.ts` declares a **local** `IDefKeyInfo` where `physicalKeyValue?: number` is
optional (it duplicates protocol-keyboard's `IDefKeyInfo` rather than importing it). But
`processBatches`'s object form requires `physicalKeyValue: number`. The established fix is to
narrow at the call site with a fallback — `SingleKeyTravel.vue:160`:

```ts
physicalKeyValue: key.physicalKeyValue || key.keyValue,
```

Do that; don't loosen the composable's signature.

## Where types come from

Ground-truth order (CLAUDE.md §6 — verify before relying on anything):

1. **`docs/sdk-reference-v2.md`** for behaviour and semantics. Always check its Verification status
   table first; if a section is Partial or Unverified, confirm against source.
2. **`node_modules/@sparklinkplayjoy/protocol-keyboard/src/`** for param and payload types —
   readable TypeScript, explicitly permitted by CLAUDE.md. The two files that matter:
   - `src/constants/param.ts` (88 lines) — enums `OrderType`, `KeyLayout`, `KeyTouchMode`,
     `BLControls`.
   - `src/types/interface.ts` (183 lines) — `IDefKeyInfo`, `ILightMode`, `LightModeType`
     (`'static' | 'custom' | 'dynamic'`), `IDKSMode`, `IMPTMode`, `IMTMode`, `ITGLMode`, `IEndMode`,
     `ISOCDMode`/`V2`/`V3`, `IRSMode`, `IKRGBDesc`, `ICmd`, `IKey`, `IDB`, `IRGBDesc`, `IKeyData`.

   Read the enum/interface body for actual member values — **never guess them.**
3. **`src/types/types.ts`** for the app's own view-model types (currently just the local
   `IDefKeyInfo`).
4. **`sdk-keyboard/dist/cjs/src/controller/*.d.ts`** (`key`, `lighting`, `performance`, `system`,
   `higherKey`, `info`, `export`) for exact `XDKeyboard` signatures. Many return `Promise<any>`;
   treat those as untyped and pin the real shape from the reference or source.

### Importing protocol-keyboard types — verify before you rely on it

⚠️ **Resolution UNTESTED as of 2026-10-08** — do not assume either outcome. What is verified from
the package files on disk:

- `package.json` declares `"types": "./dist/esm/index.d.ts"`, and **that file does not exist** — the
  same class of packaging defect documented for `@sparklinkplayjoy/hid` in sdk-reference-v2.md §13.4.
- Its `"exports"` map declares only `"."` → `{ import: ./dist/esm/index.js, require:
  ./dist/cjs/index.js }`, with **no `types` condition** on either branch.
- The package ships 30 `.d.ts` files. A working root declaration *does* exist at
  **`dist/cjs/types/index.d.ts`**, which re-exports the useful surface:
  `export * from './src/types/interface'` and `export * as constantsParam from './src/constants/param'`.

So the types are present and reachable *by file path*, but nothing in the package metadata points
TypeScript at them. Practically:

- `import type { KeyTouchMode } from '@sparklinkplayjoy/protocol-keyboard'` **may or may not
  resolve.** Nothing in `src/` imports from `protocol-keyboard` today, so there is no working
  precedent to copy. **Test it before you rely on it** (one `npm run typecheck` after a scratch
  import is enough).
- Deep-path imports (`.../protocol-keyboard/dist/cjs/types`) are likely **blocked** by the `exports`
  map, which only exposes `"."`. Prefer a `paths` entry in `tsconfig.json` over a deep path — but
  note **a `paths` remap affects the whole module graph, not just `src/`**, which is exactly how
  variant-P surfaced 2 extra errors in `DebugKeyboardService` during Task 2. Budget for that, and
  see §13.7.3 for the hid precedent.
- Reading `protocol-keyboard/src/*.ts` for *semantics and enum values* is always safe and always
  allowed, independent of whether the import resolves. Use it to learn the shape, then decide the
  import strategy separately.

## Known pre-existing type errors in this file

Don't re-discover these as new bugs; they're counted in `docs/tsc-baseline.txt`.

`npm run typecheck` currently reports exactly two `TS2304`s, both in `KeyboardService.ts`:

```
src/services/KeyboardService.ts(802,37): error TS2304: Cannot find name 'Calibration'.
src/services/KeyboardService.ts(816,35): error TS2304: Cannot find name 'Calibration'.
```

`Calibration` is used as the return type of `calibrationStart`/`calibrationEnd` but is **never
imported or declared** anywhere in `src/`, nor exported from any package root. This is Task 4
(type-cleanup) territory. **Never fix it inside an unrelated task** — CLAUDE.md §8: one line in
`docs/plans/backlog.md`, then carry on.

## The self-check gate will fight you here

Any change to `KeyboardService.ts` is `[high-stakes]` **regardless of size** (CLAUDE.md §Tag
ownership), so the gate applies: `npm run typecheck` must be ≤ `docs/tsc-baseline.txt` with **no new
errors in files you touched**.

Two traps recorded from Task 2 (`docs/plans/reviews/review-variant-p-imports.md`, finding **R1**):

- Fixing a *latent* error can **unmask** further errors at the same site, so the count rises even
  though the code improved — and the gate as worded becomes unsatisfiable. If that happens, flag it
  explicitly in your checkpoint and the review file. Don't hide the delta, and don't revert good
  work to satisfy a number.
- The baseline only ever ratchets **down**. If your task legitimately resolves errors, publish the
  exact reconciliation (`before = after − resolved + unmasked`) so the Reviewer can verify it. Task 2
  reconciled as `63 = 60 − 5 + 8`.

## Never change (design intent — CLAUDE.md §7)

- Device selection stays **unfiltered**: `navigator.hid.requestDevice({ filters: [] })`. No device
  filters, no hard-coded vendor/product IDs. Any SparkLink keyboard must connect.
- `usagePage: 65440` (`0xFFA0`, passed as `[65440]` in `ensureKeyboard`) selects the SparkLink
  **command interface** on an already-chosen device. It is **not** a device filter — never move it
  into `requestDevice`.
- Wrappers **return** `Error`, never throw.
- `DebugKeyboardService` deliberately holds a **separate** `XDKeyboard` instance (`:7`, constructed
  in its own constructor at `:11`) so raw SDK inspection can't disturb the main connection. Don't
  unify them.

## Checklist for a new wrapper

- [ ] Return type is `<Success> | Error` (a real type where you can source one, not `any`)
- [ ] `if (!this.connectedDevice) return new Error('No device connected')` runs first
- [ ] SDK reached via `this.ensureKeyboard().<method>()`, never `this.keyboard`
- [ ] `if (result instanceof Error) return result;` present, passed through unchanged
- [ ] Outer `try/catch` logs via `console.error` and `return error as Error` — no re-throw
- [ ] Param/return types sourced per the order above, not invented
- [ ] Bulk operations go through `processBatches` (80 / 100ms) from the component layer, keyed on
      `physicalKeyValue`
- [ ] No device filters added; `usagePage 65440` untouched
- [ ] `npm run typecheck` ≤ baseline, no new errors in touched files
- [ ] Tagged `[high-stakes]`, plus `[hw]` if hardware behaviour is affected
