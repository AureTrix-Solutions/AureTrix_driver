# SPRINT: sprint-20-test-foundation

**GOAL:** Stand up the test foundation — vitest config (node env, aliases reused), `test:run` script, CI test step — and cover the Tier A pure-logic modules (keyUnits, useBatchProcessing, keyCategories, layoutConfigs) with tests, keeping typecheck at 0 and CI green.
**DONE-CRITERIA (sprint):** `npm run test:run` exits 0 with 5 test files passing (smoke + 4 modules); `npm run typecheck` = 0 errors (baseline docs/tsc-baseline.txt = 0); `npm run lint` exit 0; ci.yml runs `npm run test:run`. All expected values below are probe-verified (`.scratch/pm-notes.md`, 2026-10-24) — use them as-is, never recompute.
**Started:** 2026-10-24  ·  **Status:** IN PROGRESS

## Checkpoint
- Branch: `sprint-20-test-foundation` (tree clean at plan time, HEAD beca01b)
- tsc baseline: 0 errors (docs/tsc-baseline.txt) — test files live under src/**/* so vue-tsc typechecks them; every task must end at 0
- Cleanup: from actual ls 2026-10-24 — `.scratch/` has pm-notes.md + probe.test.ts + probe2.test.ts (PO may delete; now excluded from vitest collection); `_to_delete/` empty
- Facts for the Worker: vitest ^5.0.3 installed; tsconfig `types:["vite/client"]` → NO globals — every test file starts `import { describe, it, expect, vi } from 'vitest';` (import only what it uses; no-unused rules). eslint lints src/**/*.test.ts (no-explicit-any = error). Probe proved: zero-config vitest already resolves the @ aliases and runs in node env; explicit config below just pins it. LayoutStorageService module import is SAFE in node (indexedDB.open is inside async init(), not ctor) — but 2e vi.mocks it anyway to control getAllLayouts().

## ▶ RUN THIS
Next: Task 2a — keyUnits.test.ts. Do this task, then stop (commit, update checkpoint, advance ▶ RUN THIS to 2b).
1b ✓ — `"test:run": "vitest run"` in package.json; `- run: npm run test:run` after lint in ci.yml; test:run exit 0 (1 file passed), typecheck 0, lint 0. No deviations.
1a ✓ — gates all pass (vitest 1 file passed; typecheck 0; build ✓; lint 0). DEVIATION for Reviewer: spec's `test:{environment:'node'}` shipped with one added line `exclude: [...configDefaults.exclude, '.scratch/**']` (+ `configDefaults` added to the import) — vitest was collecting PM's gitignored .scratch/probe*.test.ts (3 files ran, not 1); Worker never deletes, so exclusion was the only in-scope fix. Restores the spec's "1 file passed" Done-when literally; keeps future .scratch probes out of the suite.

## Tasks
1. **Phase 0 — test infra** — [high-stakes] (config + CI = infra) — STATUS: PENDING
   Sequential sub-tasks 1a→1b, each with its own commit; task stays IN-PROGRESS until 1b, then → IN-REVIEW (Reviewer runs ONCE over cumulative diff, review file `docs/plans/reviews/review-test-infra.md`, base = beca01b).
   **1a. vitest config + smoke test** — Files: `vite.config.ts`, `src/__tests__/smoke.test.ts` (new)
   - Edit 1 (grep `from 'vite';` in vite.config.ts — line 1): replace `import { defineConfig } from 'vite';` with `import { defineConfig } from 'vitest/config';` (superset type; vite build unaffected).
   - Edit 2 (grep `preview: {` — insert AFTER the preview block's closing `},`, before the final `});`):
     ```ts
       test: {
         environment: 'node',
       },
     ```
   - Edit 3: create `src/__tests__/smoke.test.ts`:
     ```ts
     import { describe, it, expect } from 'vitest';
     import { uToMm } from '@utils/keyUnits';

     describe('test infra smoke', () => {
       it('resolves path aliases and asserts real module values', () => {
         expect(uToMm(1)).toBe(19.05);
       });
     });
     ```
   - Done when: `npx vitest run` → exit 0, 1 file passed; `grep -n "vitest/config" vite.config.ts` → 1 hit; `npm run typecheck` → 0 errors; `npm run build` → succeeds (config change can affect build); `npm run lint` → exit 0.
   **1b. test:run script + CI step** — Files: `package.json`, `.github/workflows/ci.yml`
   - Edit 1 (grep `"test": "vitest"` in package.json — line 9): insert after it: `    "test:run": "vitest run",`
   - Edit 2 (grep `npm run lint` in ci.yml — line 19): insert after it: `      - run: npm run test:run` (before the build step at line 20).
   - Done when: `npm run test:run` → exit 0, 1 file passed; `grep -n "test:run" package.json .github/workflows/ci.yml` → 1 hit each; typecheck 0; lint exit 0.
2. **Phase 1 — Tier A pure-logic tests** — [high-stakes] (new behavior-pinning tests across 4 modules) — STATUS: PENDING
   Sequential sub-tasks 2a→2f (2b/2c share one file, 2e/2f share one file), each with its own commit; ≤40 new authored lines per sub-task. Task → IN-REVIEW after 2f (Reviewer ONCE over cumulative diff from Task 1's head, review file `docs/plans/reviews/review-tier-a-tests.md`). Convention: colocated `src/**/__tests__/<module>.test.ts`. Every expected value below is probe-verified — do NOT recompute or "correct" it.
   **2a. `src/utils/__tests__/keyUnits.test.ts`** (new, ~30 ln)
   - uToMm: (1)→19.05, (2)→35.999, (1.75)→32.3 (empirical table — NOT 1.75×19.05), unknown (3)→`toBeCloseTo(57.15, 10)` (probe: 57.150000000000006, float).
   - mmToU: (19.05)→1, (35.999)→2, (38.1)→2 (map has a 2:38.1 entry — pin the probed value), (0)→0 (fallback 0/19.05).
   - mmToPx: (19.05)→72 (Math.round), (0)→0; KEY_SIZES.length===9; MM_TO_PX===3.7795275591.
   - Done when: `npx vitest run src/utils/__tests__/keyUnits.test.ts` → pass; typecheck 0; lint exit 0.
   **2b. `src/composables/__tests__/useBatchProcessing.test.ts`** (new, core chunking/detection, ~30 ln)
   - `const { processBatches } = useBatchProcessing();` per test (composable is stateless).
   - Number array: `await processBatches([10,20,30,40,50], spy, 2, 10)` → spy called with [10,20,30,40,50] in order, 5 calls (3 batches).
   - Object array: `[{physicalKeyValue:7,keyValue:99},{physicalKeyValue:8,keyValue:98}]` → updateFn receives 7 then 8 (physicalKeyValue only, keyValue never passed).
   - Empty array: `await processBatches([], spy, 80, 100)` → spy 0 calls.
   - Done when: file passes; typecheck 0; lint exit 0.
   **2c. same file — timing behaviors with fake timers** (~25 ln appended)
   - `vi.useFakeTimers()` in the test (+ `vi.useRealTimers()` after): start `processBatches([1,2,3], spy, 1, 100)` WITHOUT awaiting; assert spy called with 1; `await vi.advanceTimersByTimeAsync(99)` → spy still 1 call (delay gates next batch); `await vi.advanceTimersByTimeAsync(1)` → eventually all 3 called. (Delay runs after EVERY batch including the last — probe P14.)
   - Intra-batch concurrency (real timers OK, delay 0): two updateFns returning manually-resolved deferred promises in one batch — assert BOTH started before resolving either (Promise.all semantics).
   - Done when: file passes; typecheck 0; lint exit 0.
   **2d. `src/utils/__tests__/keyCategories.test.ts`** (new, ~30 ln)
   - `Object.keys(categorizedKeys())` deep-equals exported `categories` (16 entries, same order).
   - Special is exactly `{0:' ', 1:'Fn'}` (probe P5 — keyMap[0] is a single space).
   - Every value in every category is a non-empty string (probe: allDefined true).
   - No key id appears in two categories (probe: overlaps 0; total unique keys 250 — pin `seen.size===250` too).
   - Pin exact counts (probe P6): Letters 26, Numbers & Symbols 21, Control Keys 6, Function Keys 12, Navigation & Editing 13, Numpad 17, System & Misc 7, Languages 9, Extra Functions 20, Media & Browser 26, Lighting & Effects 25, Modifier Keys 9, Brightness Controls 2, Multimedia Extended 14, Misc Special 41.
   - Done when: file passes; typecheck 0; lint exit 0.
   **2e. `src/utils/__tests__/layoutConfigs.test.ts`** (new — priority chain, ~40 ln)
   - Top of file: `vi.mock('@/services/LayoutStorageService', () => ({ default: { getAllLayouts: vi.fn(async () => [fixture]) } }));` — specifier MUST be the alias string exactly as layoutConfigs.ts imports it. Fixture = full CustomLayoutConfig (7 fields): `{ productName:'PM-Test-Custom', hasAxisList:false, keySizes:[[19.05]], gapsAfterCol:[{}], rowSpacing:[20.05], createdAt:0, updatedAt:0 }`. Import `{ getLayoutConfig, loadCustomLayouts }` AFTER the mock (static imports are fine — vi.mock hoists).
   - P1 beats P2: `await loadCustomLayouts()` then `getLayoutConfig(0,null,null,null,null,'PM-Test-Custom')` → rows===1 && cols===1 (custom wins; Slice75 HE would give 6×15, layoutMap[61] 5×14).
   - P2: `getLayoutConfig(0,null,null,null,null,'Slice75 HE')` → rows===6, cols===15 (only key in sharedLayoutMap).
   - P3: `getLayoutConfig(61,null,null,null,null)` (no productName → cache skipped) → rows===5, cols===14.
   - P4: `getLayoutConfig(999,null,null,null,null,'NoSuchProduct')` → rows===6, cols===1.
   - Order matches CLAUDE.md Layout system (probe-verified: no contradiction) — these 4 tests ARE the regression pin.
   - Done when: file passes; typecheck 0; lint exit 0.
   **2f. same file — geometry through getLayoutConfig + getPaddedKeySizes** (~30 ln appended)
   - 61-key row 0: 14 entries; first `[0,0,72,72]`, second `[76,0,72,72]` (19.05mm + 1mm gap → 76px), last `[988,0,136,72]` (35.999mm → 136px).
   - 61-key row 4 (probe P8): `[[0,304,90,72],[94,304,90,72],[188,304,90,72],[282,304,466,72],[752,304,90,72],[846,304,90,72],[940,304,90,72],[1034,304,90,72]]`; gaps===[0,0,0,0,0]; top=304 = Σ mmToPx(20.05)=76 ×4 rows.
   - 67-key gap shift (probe P17, exact): `getLayoutConfig(67,null,null,null,null)` → rows 5, cols 15; `keyPositions[4]` deep-equals `[[0,304,90,72],[94,304,90,72],[188,304,90,72],[282,304,466,72],[752,304,90,72],[846,304,90,72],[976,304,72,72],[1052,304,72,72],[1128,304,72,72]]` (gapsAfterCol row4 {5:9.5} → +36px shift at key 6; rows have differing key counts — keyPositions is [row][key], row 4 has 9).
   - getPaddedKeySizes(null) → `[[19.05]]×6`; getPaddedKeySizes([]) → same.
   - Done when: file passes; typecheck 0; lint exit 0.
3. **CLAUDE.md conventions update** — [trivial] — STATUS: PENDING
   - Edit 1 (grep `npm test              # vitest (watch mode by default)` in CLAUDE.md): add after it a line: `npm run test:run      # vitest run — single pass, CI mode`.
   - Edit 2 (grep `There are currently no test files, despite vitest/@vue/test-utils being installed.`): replace that sentence with: `Tests live colocated in src/**/__tests__/*.test.ts (node env, explicit vitest imports — no globals); CI runs npm run test:run. Component/DOM tests need a DOM env dep (not yet installed).`
   - Done when: both greps return the new text; no other CLAUDE.md changes. (Docs task — skips the typecheck gate.)

## Findings (raw — PM routes at close)
- <none yet>
