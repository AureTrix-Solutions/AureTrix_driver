# SPRINT: sprint-01-code-fixes

**GOAL:** Clean up the SDK integration (typecheck infrastructure, variant-P import fix, wrapper-pattern skill, type-error cleanup) before feature work.
**DONE-CRITERIA (sprint):** `npm run typecheck` exists with docs/tsc-baseline.txt recorded and ratcheted down toward zero; variant-P import fix landed per §13.7.3 with design intent preserved (filters:[], usagePage 65440, wrappers return Error); sdk-wrapper skill captured.
**Started:** 2026-10-08  ·  **Status:** IN PROGRESS

## Checkpoint
- Branch: `sprint-01-code-fixes`
- tsc baseline: **60** (docs/tsc-baseline.txt, 2026-10-08) — self-check gate now ACTIVE for Tasks 2–4
- Cleanup: no cleanup needed (.scratch/ and _to_delete/ untouched)

## ▶ RUN THIS
Next: Task 2 — variant-P import fix [high-stakes] [hw]. Do this task, then stop.

## Tasks
1. ✓ **typecheck script + baseline** — DONE 2026-10-08 — `"typecheck": "tsc --noEmit"` added to package.json; first run = 60 errors, saved to docs/tsc-baseline.txt (KeyboardService.ts 23, router/index.ts 17, DebugKeyboardService.ts 14, profileStore.ts 2, connection.ts 2, travelProfilesStore.ts 1, main.ts 1). Config-only change — self-check gate skipped per CLAUDE.md; gate now active for Tasks 2–4.
2. **variant-P import fix** — [high-stakes] [hw] — STATUS: PENDING
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
