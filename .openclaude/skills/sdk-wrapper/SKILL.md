---
name: sdk-wrapper
description: The AureTrix KeyboardService wrapper pattern — how to add or review a method that wraps a SparkLink SDK (@sparklinkplayjoy/sdk-keyboard XDKeyboard) call. Use whenever touching src/services/KeyboardService.ts or ExportService.ts, or when adding any new hardware-facing method. Covers the connectedDevice guard, ensureKeyboard(), return-Error-never-throw, batch processing, known deviations, and where param/return types come from.
---

# SDK wrapper pattern

Every hardware call goes through a `KeyboardService` wrapper — the only place that touches `XDKeyboard`. Callers (pages/components/stores) check `instanceof Error`, never call the SDK directly, and never `try/catch` a hardware call for control flow. Return-`Error`-never-throw is design intent (CLAUDE.md hard rule 7); changing it is always `[high-stakes]`.

## Canonical shape

Copy for any new getter/setter (cf. `calibrationStart`, `KeyboardService.ts:798`):

```ts
async calibrationStart(): Promise<any | Error> {
  try {
    if (!this.connectedDevice) return new Error('No device connected');
    const result = await this.ensureKeyboard().calibrationStart();
    if (result instanceof Error) return result;
    return result;
  } catch (error) {
    console.error('Failed to start calibration:', error);
    return error as Error;
  }
}
```

Four required parts, in order:
1. **Return type is `<Success> | Error`** — never throws; the union forces callers to handle failure. Many wrappers write `any | Error` (`getMacro :518`, `setLighting :913`, `setPollingRate :1174`) since the SDK's `.d.ts` returns `Promise<any>` — prefer a real type where sourceable (see *Where types come from*).
2. **`if (!this.connectedDevice) return new Error('No device connected');`** — guard before any SDK access. `connectedDevice` (`Device | PairedDevice | null`, decl `:11`) is the service's own field, not `connectionStore`.
3. **`await this.ensureKeyboard().<method>(...)`** — always via `ensureKeyboard()`, never `this.keyboard` directly.
4. **`if (result instanceof Error) return result;`** — the SDK reports failure by *returning* an `Error`; pass it through unchanged (no re-wrap, no stringify). Callers check `instanceof Error` only — truthiness misreads a falsy payload as failure.

Outer `try/catch` exists only to convert an unexpected throw into the contract: `console.error` naming the operation, then `return error as Error`; never re-throw. `ensureKeyboard()` (`:37`) is a lazy constructor — `if (!this.keyboard) this.keyboard = new XDKeyboard({ usage: 1, usagePage: [65440], configs: [] }); return this.keyboard;` — no connection-state binding; bypassing it risks a null crash or a second, differently-optioned instance.

## Known deviations (real code — don't "fix" in passing)

| Method | Line | Deviation |
|---|---|---|
| `setKey` | `:508` | `Promise<void \| Error>`, but no `connectedDevice` guard, no `instanceof` check |
| `getDevices` | `:109` | `Promise<Device[]>` — no `Error` union; returns `[]` on failure; no guard |
| `initializeKeyboard` | `:255` | `Promise<void>`; dedupes via `initializationPromise`. Real work in `_initializeKeyboardInternal` (`:268`, retries ≤ 2), which does guard |

Match surrounding behaviour and flag the inconsistency; don't silently normalise (`getDevices`' `[]` fallback has dependents). A genuine bug outside scope → one line in `docs/plans/backlog.md` (CLAUDE.md §8).

## Bulk / many-key operations

**Never loop per-key SDK calls over a whole keyboard** — it overloads the device. Use `useBatchProcessing.ts`; batching lives in the caller (page/component/service) — never inside KeyboardService. `ExportService.ts` is a service-layer consumer: `private processBatches = useBatchProcessing().processBatches;` at `:6`.

Signature (`useBatchProcessing.ts:5`):

```ts
processBatches<T>(keys: { physicalKeyValue: number; keyValue: number }[] | number[],
  updateFn: (physicalKey: number) => Promise<T>, batchSize = 80, delayMs = 100): Promise<void>
```

- `keys` accepts objects **or** numbers (detects via `'physicalKeyValue' in keys[0]`, `:12`); `updateFn` receives the **`physicalKeyValue`**, never the display `keyValue` (CLAUDE.md §Key model).
- Defaults **80/batch, 100ms between** — don't raise/lower without a hardware-tested reason. Batches sequential (`await Promise.all(batch.map(updateFn))` then `setTimeout`, `:21`); keys within a batch concurrent. Returns `Promise<void>` and **does not collect per-key errors** — accumulate them in the `updateFn` closure.
- Example, simplified (real `SingleKeyTravel.vue:164` wraps `setSingleTravel/setDp/setDr` in `travelChanged/deadChanged` conditionals; `setPerformanceMode` unconditional): `await processBatches(keys, async (pkv) => { await KeyboardService.setPerformanceMode(pkv, 'single', 0); await KeyboardService.setSingleTravel(pkv, singleKeyTravel.value); })`
- **Gotcha:** `types.ts` `IDefKeyInfo.physicalKeyValue?` is optional, but the object form requires `physicalKeyValue: number` — narrow at the call site (`SingleKeyTravel.vue:160`): `physicalKeyValue: key.physicalKeyValue || key.keyValue`. Don't loosen the composable's signature.

## Where types come from

Ground-truth order (CLAUDE.md §6 — verify before relying):
1. `docs/sdk-reference-v2.md` — behaviour/semantics; check its Verification status table first (Partial/Unverified → confirm against source).
2. `@sparklinkplayjoy/protocol-keyboard/src/` (readable TS, permitted) — param/payload types: `constants/param.ts` (88 ln — `OrderType`, `KeyLayout`, `KeyTouchMode`, `BLControls`); `types/interface.ts` (183 ln — `IDefKeyInfo`, `ILightMode`, `LightModeType`, `IDKSMode`, …). Read bodies for member values — never guess.
3. `src/types/types.ts` (13 ln) — **three** app types: `IDefKeyInfo`, `DksLayoutType`, `DksType`; header says it mirrors `@sparklinkplayjoy/sdk-keyboard dist/cjs/src/types/type.d.ts` verbatim (not a duplicate of protocol-keyboard's `IDefKeyInfo`).
4. `sdk-keyboard/dist/cjs/src/controller/*.d.ts` — exact `XDKeyboard` signatures; many return `Promise<any>` (treat as untyped; pin the real shape from reference/source).

### Importing protocol-keyboard types — verify before relying

✅ **Resolution FIXED (sprint-06)** — tsconfig `paths` remaps `@sparklinkplayjoy/protocol-keyboard` → `dist/esm/types/index.d.ts` (variant-P pattern, §13.7.3), so root type imports resolve: `import type { IDefKeyInfo, ILightMode } from '@sparklinkplayjoy/protocol-keyboard'` typechecks. Upstream is still broken (v1.0.6): `"types"` → nonexistent `dist/esm/index.d.ts`; `"exports"` = `"."` only, no types condition; deep-path import BLOCKED; working barrels at `dist/{esm,cjs}/types/index.d.ts`. Consequences to expect: sdk-keyboard's own root imports are now real, so SDK signatures are no longer `any` in wrappers — write real unions (e.g. `setPerformanceMode` takes `'global' | 'single' | 'rt'`, the sdk-keyboard-local `TouchModeType` — not root-exported, don't try to import the alias). `VersionString` has no declaration anywhere (§13.1) — stays `any`. Reading `protocol-keyboard/src/*.ts` for semantics/enum values remains always safe.

## Never change (design intent — CLAUDE.md hard rule 7)

See CLAUDE.md hard rule 7 (unfiltered `requestDevice({ filters: [] })`; wrappers return `Error`, never throw). Skill-specific: `usagePage: [65440]` lives in `ensureKeyboard` (`:37`), **never** in `requestDevice` — it selects the SparkLink command interface on an already-chosen device, not a filter.

## Checklist for a new wrapper

- [ ] Return type `<Success> | Error` (real type where sourceable, not `any`)
- [ ] `if (!this.connectedDevice) return new Error('No device connected')` runs first
- [ ] SDK via `this.ensureKeyboard().<method>()`, never `this.keyboard`
- [ ] `if (result instanceof Error) return result;` — passed through unchanged
- [ ] Outer `try/catch` → `console.error` + `return error as Error`, no re-throw
- [ ] Param/return types sourced per the order above, not invented
- [ ] Bulk ops via `processBatches` (80/100ms) from the caller, keyed on `physicalKeyValue`
- [ ] No device filters added; `usagePage 65440` untouched
- [ ] `npm run typecheck` ≤ baseline, no new errors in touched files
- [ ] Tagged `[high-stakes]`, plus `[hw]` if hardware behaviour affected
