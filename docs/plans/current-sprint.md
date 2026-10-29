# SPRINT: sprint-22-test-stores-mappedkeyboard

**GOAL:** Phase 3 of the testing backlog — headless test coverage for the three Pinia stores (travelProfiles, profiles, connection) and the `useMappedKeyboard` composable, pinning CURRENT behavior (tests only, zero source edits).
**DONE-CRITERIA (sprint):** 7 new test files green; `npm run test:run` all-pass (96 baseline + new); `npm run typecheck` exit 0; `npm run lint` exit 0; Reviewer PASS on the cumulative diff.
**Started:** 2026-10-28  ·  **Status:** IN PROGRESS
<!-- revN (YYYY-MM-DD): <what changed> -->

## Checkpoint
- ✓ Task 1 DONE — `src/store/__tests__/travelProfiles.test.ts` (12 tests, commit 60858d3). Await group review.
- ✓ Task 2 DONE — `src/store/__tests__/profileStore.test.ts` (16 tests, commit bda9a62). vitest 16/16; typecheck exit 0; lint exit 0. Source matched spec verbatim. Await group review.
- ✓ Task 3 DONE — `src/store/__tests__/connection.sync.test.ts` (10 tests, commit 2e932b3). vitest 10/10; typecheck exit 0; lint exit 0. Source matched spec verbatim. Await group review.
- ✓ Task 4 DONE — `src/store/__tests__/connection.async.test.ts` (11 tests, commit 3dd0b2d). vitest 11/11; typecheck exit 0; lint exit 0. Spec diverged from source once (drafted `connect` — real action is `connectDevice`; `autoConnect` reject string is `'Please Connect.'` capital-C+period, distinct from null path `'Please connect'`). Await group review.
- ✓ Task 5 DONE — `src/utils/__tests__/MappedKeyboard.geometry.test.ts` (10 tests, commit 3db302e). vitest 10/10; typecheck exit 0; lint exit 0. Source matched spec verbatim (gridStyle reduce, absolute-box getKeyStyle, zeroed fallback); confirmed `IDefKeyInfo` needs only `keyValue` (location optional in app type) and real `getLayoutConfig` returns rows/cols too — mock returns include them. Await group review.
- ✓ Task 6 DONE — `src/utils/__tests__/MappedKeyboard.fetch.test.ts` (12 tests, commit e741d67). vitest 12/12; typecheck exit 0; lint exit 0. Source matched spec (all 13 spec cases covered incl. duplicate-key-later-wins and baseLayout stickiness). Note: `ref()` reactive-proxy wrapping breaks `toBe` identity on layout/baseLayout — used `toStrictEqual`. Await group review.
- Suite: 14 files / 175 tests green (`npm run test:run`) — Reviewer re-run; the plan-time annotation said 174, corrected here to measured ground truth (see review-sprint-22.md F1). Baselines unchanged (tsc 0, lint 0).
- Cleanup: `.scratch/` pm-notes.md, review-notes.md (PO may delete); `_to_delete/` empty.
- Group review: Tasks 1–7 are ONE high-stakes group — Reviewer ran ONCE over cumulative base..head (sprint-21 precedent). VERDICT: **PASS** (review-sprint-22.md). One non-code finding F1 (174→175 criterion slip) routed to PM-close.

## ▶ RUN THIS
ALL TASKS DONE — Reviewer PASS (review-sprint-22.md). Awaiting PO sign-off.
PM-close window: assemble work + QA verdicts vs the goal for PO sign-off; on acceptance archive. Correct the 174→175 criterion slip (review-sprint-22.md F1) at close.

## Shared facts (all grep-verified at PM-open; re-grep only if a check fails)
- vitest env is **node** (vite.config.ts `environment: 'node'`); default include picks up `src/**/__tests__/*.test.ts` — NO config change needed. Explicit `import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'` (no globals). ESLint: `no-explicit-any` is error — type mocks instead.
- **Every test importing connection.ts / profileStore.ts / MappedKeyboard.ts MUST `vi.mock('@services/KeyboardService', ...)`** — the real module runs `export default new KeyboardService()` whose ctor calls unguarded localStorage/document code → throws in node env. vi.mock is hoisted, so the real ctor never runs. If the mock fails to intercept, the file explodes loudly on import (self-checking). Alias `@services` resolves to the same file as profileStore's relative import (vite alias) — use the alias specifier in ALL 7 test files.
- connection.ts also imports the profileStore only inside connectDevice/onAutoConnectSuccess (`useProfileStore()`), so profileStore tests need no connection mock and vice versa.
- travelProfilesStore imports ONLY pinia — no mocks.
- `persist` options are INERT under plain `createPinia()` (plugin not registered) — no localStorage stubs anywhere.
- House mock pattern (sprint-21, src/services/__tests__/ExportService.export.test.ts): `vi.mock(path, () => ({ default: { method: vi.fn() } }))` BEFORE the SUT import; fake timers: `vi.useFakeTimers(); const p = fn(); await vi.runAllTimersAsync(); await p; vi.useRealTimers()`.
- KeyboardBaseInfo mock return (typechecked by vue-tsc — provide all fields or a typed fixture): `{ BoardID, KeyboardLayout, KeyType, CustomerID, ProductionId, KeyboardRunMode, firewareSpaceSize: number; KeyboardSN, appVersion, appBuildDate, versionString: string }`.
- SDK signatures mocks must satisfy: `defKey(): Promise<IDefKeyInfo[][]|Error>`; `getLayoutKeyInfo(params:{key,layout}[]): Promise<IKey[]|Error>` (IKey has key+value); `setKey(cfgs:{key,layout,value}[]): Promise<void|Error>`; `autoConnect(): Promise<Device|null>`; `requestDevice(): Promise<Device>` (cancel ⇒ resolves falsy; store gates `device && device.id`); `getBaseInfo(): Promise<KeyboardBaseInfo|Error>`; `switchConfig(id): Promise<{configID,hasFourConfig}|Error>`; `getActiveProfile(): Promise<number|Error>`.
- mmToPx(1) = 4 (MM_TO_PX 3.7795275591, Math.round) → marginBottom pin is `'4px'`.
- NO source-file edits this sprint (tests pin AS-IS). Out-of-scope defects → ONE line in `## Findings`. Two known defect candidates the Worker will encounter — pin AS-IS, then route to Findings, do NOT fix: (a) travelProfiles addProfile `id = Date.now().toString()` collides on same-ms adds; (b) MappedKeyboard.batchSetKey ignores a *resolved* `Error` from setKey (only throws are caught) — pin that resolved-Error continues silently; (c) fetchLayerLayout keeps the FIRST baseLayout (`if (!baseLayout.value)`) but the layer-merge builds from the FRESH `newBaseLayout.map(...)` while the null-layer path returns the stuck `baseLayout.value` — mixed layout sources across refetches (grep `if (!baseLayout.value)` + `newBaseLayout.map` in MappedKeyboard.ts); Task 6 pins baseLayout stickiness AS-IS.

## Tasks
✓ 1. **travelProfilesStore tests** — committed 60858d3 (12 tests) — DONE (Reviewer PASS: review-sprint-22.md)
✓ 2. **profileStore tests** — committed bda9a62 (16 tests) — DONE (Reviewer PASS: review-sprint-22.md)
✓ 3. **connectionStore sync actions** — committed 2e932b3 (10 tests) — DONE (Reviewer PASS: review-sprint-22.md)
✓ 4. **connectionStore async actions** — committed 3dd0b2d (11 tests) — DONE (Reviewer PASS: review-sprint-22.md)
✓ 5. **useMappedKeyboard geometry** — committed 3db302e (10 tests) — DONE (Reviewer PASS: review-sprint-22.md)
✓ 6. **useMappedKeyboard fetchLayerLayout behavior** — committed e741d67 (12 tests) — DONE (Reviewer PASS: review-sprint-22.md)
✓ 7. **batchSetKey + connection watch + full-suite sweep** — committed 5f41b09 (8 tests) — DONE (Reviewer PASS: review-sprint-22.md, Base bad4d3e / Head 5f41b09). Suite 14 files / 175 green; tsc 0; lint 0.

<!-- STATUS values: PENDING → IN-PROGRESS → IN-REVIEW (group, at Task 7) → DONE (Reviewer PASS).
     Collapse a finished task to one line:  ✓ 1. <title> — committed — IN-REVIEW (group review: review-sprint-22.md) -->

## Findings (raw — PM routes at close)
- travelProfilesStore.addProfile: `id = Date.now().toString()` — two adds within the same millisecond get IDENTICAL ids (pinned AS-IS in travelProfiles.test.ts "AS-IS pin" test; verify at `const id = Date.now()` in src/store/travelProfilesStore.ts addProfile).
- MappedKeyboard.batchSetKey: does not check whether `setKey` RESOLVES an Error instance (KeyboardService wrappers return Error instead of throwing) — a device-side failure passes silently (pinned AS-IS in MappedKeyboard.batch-watch.test.ts "AS-IS pin" test; verify at the `await KeyboardService.setKey(...)` call inside batchSetKey's loop in src/utils/MappedKeyboard.ts).
