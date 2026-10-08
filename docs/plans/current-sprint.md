# SPRINT: sprint-01-code-fixes

**GOAL:** Clean up the SDK integration (typecheck infrastructure, variant-P import fix, wrapper-pattern skill, type-error cleanup) before feature work.
**DONE-CRITERIA (sprint):** `npm run typecheck` exists with docs/tsc-baseline.txt recorded and ratcheted down toward zero; variant-P import fix landed per §13.7.3 with design intent preserved (filters:[], usagePage 65440, wrappers return Error); sdk-wrapper skill captured.
**Started:** 2026-10-08  ·  **Status:** IN PROGRESS

## Checkpoint
- Branch: `sprint-01-code-fixes`
- tsc baseline: **60** (docs/tsc-baseline.txt, 2026-10-08) — self-check gate now ACTIVE for Tasks 2–4
- Cleanup: no cleanup needed (.scratch/ and _to_delete/ untouched)

## ▶ RUN THIS
Next: Task 2 — variant-P import fix [high-stakes] [hw] — **IN-PROGRESS, interrupted at runtime limit.**
Research is COMPLETE; every edit is specified below — apply mechanically, do NOT re-read spec sections.

**Already applied (uncommitted):** `tsconfig.json` — in `paths` (after `"@utils/*"` line) added:
`"@sparklinkplayjoy/hid": ["node_modules/@sparklinkplayjoy/hid/dist/cjs/index.d.ts"]`

**Remaining edits (apply exactly; annotation-only — NEVER complete the literals with vendorId/usage/usagePage):**

1. `KeyboardService.ts:2` — replace `import type { DeviceInit, Device } from '@sparklinkplayjoy/sdk-keyboard';` with `import type { Device, HIDDevice } from '@sparklinkplayjoy/hid';`
2. `KeyboardService.ts` — insert after line 2 (before `interface HIDConnectionEvent`): `type PairedDevice = { id: string; data: HIDDevice; productName: string };` (this import also resolves `HIDDevice` at line 7 — baseline TS2304 clears)
3. `KeyboardService.ts:13` — `private connectedDevice: Device | PairedDevice | null = null;`
4. `KeyboardService.ts:15` — `private autoConnectPromise: Promise<Device | PairedDevice | null> | null = null;`
5. `KeyboardService.ts:41–44` — `ensureKeyboard()` constructor arg → `{ usage: 1, usagePage: [65440], configs: [] }`
6. `KeyboardService.ts:120` — `async requestDevice(): Promise<Device | PairedDevice> {`
7. `KeyboardService.ts:136` — `const result: Device | PairedDevice = existingDevice || { id: fallbackId, data: device, productName: device.productName || 'Unknown' };` (literal unchanged)
8. `KeyboardService.ts:148` — `async autoConnect(): Promise<Device | PairedDevice | null> {`
9. `KeyboardService.ts:175` — `private async _autoConnectInternal(savedStableId: string): Promise<Device | PairedDevice | null> {`
10. `KeyboardService.ts:193` — `const device: Device | PairedDevice = targetSdkDevice || { id: fallbackId, data: targetHidDevice, productName: targetHidDevice.productName || 'Unknown' };`
11. `DebugKeyboardService.ts:2` — same import replacement as step 1.
12. `DebugKeyboardService.ts` — insert after line 2: `type PairedDevice = { id: string; data: HIDDevice; productName: string };`
13. `DebugKeyboardService.ts:6` — `private connectedDevice: Device | PairedDevice | null = null;`
14. `DebugKeyboardService.ts:9–12` — constructor arg → `{ usage: 1, usagePage: [65440], configs: [] }`
15. `DebugKeyboardService.ts:30` — `async autoConnect(): Promise<Device | PairedDevice | null> {`
16. `DebugKeyboardService.ts:49` — `const device: Device | PairedDevice = existingDevice || { id: targetDevice.id, data: targetDevice, productName: targetDevice.productName || 'Unknown' };`
17. `DebugKeyboardService.ts:70` — `async requestDevice(): Promise<Device | PairedDevice> {`
18. `DebugKeyboardService.ts:79` — `const result: Device | PairedDevice = existingDevice || { id: device.id, data: device, productName: device.productName || 'Unknown' };`

**Verified safe (do not re-check):** store/connection.ts + onAutoConnectSuccess only read `.id`/`.productName` — the `Device | PairedDevice` union satisfies both. hid's types confirmed to declare `Device`, `HIDDevice`, `DeviceInit`, `PairedDevice`-shaped literal; `DeviceInit.configs` required → `configs: []` (harmless: XDKeyboard never exposes requestDevice, §13.7.4).

**Then:** `npm run typecheck`. EXPECTED ≈ 63 errors — variant P unmasks ~14 over the 60 baseline; 8 of them (6× TS18048 `d.data` possibly-undefined, 2× TS2339 `serialNumber` — hid's HIDDevice lacks it) are **explicitly Task 4 scope** (§13.7.2/§13.7.3 pt 4) — do NOT fix them (rule 8). The Task 2 "≤ baseline" criterion is arithmetically unreachable without pulling Task 4 forward: record the actual count + per-file diff vs `.scratch/baseline-services.txt` (saved pre-edit baseline for the two service files) in the checkpoint AND review file, and flag the conflict to Reviewer/PM. Also run `npm run build` (constructor + type changes can affect build). Commit `sprint-01-code-fixes: variant-P import fix`; write `docs/plans/reviews/review-variant-p-imports.md` from template (Base = 819202c, Head = new commit; hardware check: connect, auto-reconnect, device picker still unfiltered); set STATUS: IN-REVIEW.

## Tasks
1. ✓ **typecheck script + baseline** — DONE 2026-10-08 — `"typecheck": "tsc --noEmit"` added to package.json; first run = 60 errors, saved to docs/tsc-baseline.txt (KeyboardService.ts 23, router/index.ts 17, DebugKeyboardService.ts 14, profileStore.ts 2, connection.ts 2, travelProfilesStore.ts 1, main.ts 1). Config-only change — self-check gate skipped per CLAUDE.md; gate now active for Tasks 2–4.
2. **variant-P import fix** — [high-stakes] [hw] — STATUS: IN-PROGRESS (interrupted — follow ▶ RUN THIS)
   - Done when: per docs/sdk-reference-v2.md §13.7.3 — tsconfig paths mapping `@sparklinkplayjoy/hid` → `dist/cjs/index.d.ts`; unused `DeviceInit` imports removed (KeyboardService.ts:2, DebugKeyboardService.ts); device-literal annotations widened annotation-only (§13.7 design constraint: NEVER complete the literals with vendorId/usage/usagePage); XDKeyboard constructor init set to `{ usage: 1, usagePage: [65440], configs: [] }` in both services.
   - Done when: design intent preserved — requestDevice stays unfiltered (`configs: []` → `filters: []`), usagePage 65440 semantics unchanged, wrappers still return Error.
   - Done when: `npm run typecheck` ≤ baseline with no new errors in touched files; Reviewer PASS; then PO hardware check (connect, auto-reconnect, device picker unfiltered). Note: the hid bundle normalizes usagePage (`Array.isArray(s)?s:[s]`), so the only runtime delta is `filters: undefined` → `filters: []` (both unfiltered).
   - Files: `tsconfig.json`, `src/services/KeyboardService.ts`, `src/services/DebugKeyboardService.ts`
3. **sdk-wrapper skill** — [trivial] — STATUS: PENDING
   - Done when: `.openclaude/skills/sdk-wrapper/` captures the KeyboardService wrapper pattern: connectedDevice check → ensureKeyboard().<method> → instanceof Error check → return Error (never throw); param types sourced from protocol-keyboard/src.
   - Files: `.openclaude/skills/sdk-wrapper/`
4. **type cleanup** — [high-stakes] — STATUS: PENDING
   - Done when: `@types/w3c-web-hid` installed as devDependency (checked for conflict with hid's own HIDDevice; if conflicting, document the alternative in the checkpoint); missing `Calibration` import fixed (KeyboardService.ts:799/813); serialNumber handling decided and logged; remaining §13.7 tsc errors (TS18048 `d.data` sites, TS2322 device literals — annotation-only per §13.7 design constraint) cleared.
   - Done when: docs/tsc-baseline.txt ratcheted DOWN to the new count (never up); `npm run typecheck` ≤ new baseline; no new errors in touched files.
   - Files: `package.json`, `docs/tsc-baseline.txt`, `src/services/KeyboardService.ts`, `src/services/DebugKeyboardService.ts`, plus any other files surfaced by the baseline run
