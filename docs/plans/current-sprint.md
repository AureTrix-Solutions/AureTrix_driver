# SPRINT: sprint-20-test-foundation

**GOAL:** Stand up the test foundation — vitest config (node env, aliases reused), `test:run` script, CI test step — and cover the Tier A pure-logic modules (keyUnits, useBatchProcessing, keyCategories, layoutConfigs) with tests, keeping typecheck at 0 and CI green.
**DONE-CRITERIA (sprint):** `npm run test:run` exits 0 with 5 test files passing (smoke + 4 modules); `npm run typecheck` = 0 errors (baseline docs/tsc-baseline.txt = 0); `npm run lint` exit 0; ci.yml runs `npm run test:run`. All expected values below are probe-verified (`.scratch/pm-notes.md`, 2026-10-24) — use them as-is, never recompute.
**Started:** 2026-10-24  ·  **Status:** IN PROGRESS

## Checkpoint
- Branch: `sprint-20-test-foundation` (tree clean at plan time, HEAD beca01b)
- tsc baseline: 0 errors (docs/tsc-baseline.txt) — test files live under src/**/* so vue-tsc typechecks them; every task must end at 0
- Cleanup: from actual ls at review close 2026-10-24 — `.scratch/` has pm-notes.md, probe.test.ts, probe2.test.ts, review-notes.md (all PO-deletable; probes excluded from vitest collection); `_to_delete/` empty → no git rm needed
- Facts for the Worker: vitest ^5.0.3 installed; tsconfig `types:["vite/client"]` → NO globals — every test file starts `import { describe, it, expect, vi } from 'vitest';` (import only what it uses; no-unused rules). eslint lints src/**/*.test.ts (no-explicit-any = error). Probe proved: zero-config vitest already resolves the @ aliases and runs in node env; explicit config below just pins it. LayoutStorageService module import is SAFE in node (indexedDB.open is inside async init(), not ctor) — but 2e vi.mocks it anyway to control getAllLayouts().

## ▶ RUN THIS
Next: REVIEWER — "follow docs/plans/reviews/review-tier-a-tests.md" (cumulative review of Task 2, base b5ec520 → head f9cdacd). On PASS: flip Task 2 → DONE (collapse to ✓), advance ▶ RUN THIS to Task 3 (CLAUDE.md conventions update, [trivial]). On FAIL: fix checklist into ▶ RUN THIS, Task 2 → IN-PROGRESS.
2f ✓ — appended `describe('layoutConfigs geometry', …)` with 4 geometry tests per spec (import line gained getPaddedKeySizes). Probe values as-is, none recomputed. Commit f9cdacd. File 8/8 pass; full suite 5 files/24 tests pass; typecheck 0; lint exit 0. Cleanup (actual ls): `.scratch/` pm-notes.md, probe.test.ts, probe2.test.ts, review-notes.md (PO-deletable); `_to_delete/` empty → no cleanup needed.
2e ✓ — `src/utils/__tests__/layoutConfigs.test.ts` created per spec (4 priority-chain tests: P1 custom via vi.mock LayoutStorageService alias specifier, P2 Slice75 HE 6×15, P3 layoutMap[61] 5×14, P4 default 6×1). Fixture hoisted via vi.hoisted to avoid TDZ in the hoisted mock factory. vitest file 4/4 pass, suite 5 files 20 tests, typecheck 0, lint exit 0. One spec-vs-reality deviation (test-side only): spec's literal `null` args fail TS2345 vs `baseLayout?: unknown[][]` etc. — used `undefined` in the same positions; all pinned rows/cols values used as-is, none recomputed. Cleanup (actual ls): `.scratch/` pm-notes.md, probe.test.ts, probe2.test.ts, review-notes.md (PO-deletable); `_to_delete/` empty → no cleanup needed.
2d ✓ — `src/utils/__tests__/keyCategories.test.ts` created per spec (4 tests: category order+16, Special {0:' ',1:'Fn'}, non-empty labels/no id reuse/seen.size===250, exact per-category counts incl. Special:2). Commit 7f3a1e6. vitest file 4/4 pass, typecheck 0, lint exit 0. All probe values used as-is, none recomputed. Cleanup (actual ls): `.scratch/` pm-notes.md, probe.test.ts, probe2.test.ts, review-notes.md (PO-deletable); `_to_delete/` empty → no cleanup needed.
2c ✓ — appended 2 timing tests to useBatchProcessing.test.ts per spec (fake-timer delay gating; intra-batch concurrency) — file now 5/5 pass; typecheck 0; lint exit 0. Spec code applied as-is, no recomputed values. Cleanup from actual ls: `.scratch/` pm-notes.md, probe.test.ts, probe2.test.ts, review-notes.md (PO-deletable); `_to_delete/` empty.
2b ✓ — `src/composables/__tests__/useBatchProcessing.test.ts` created per spec (3 tests: number array order, object array physicalKeyValue-only, empty array). vitest pass (file 3/3; suite 3 files 10 tests), typecheck 0, lint exit 0. One spec-vs-reality deviation (test-side only, no source change): spec's `expect(spy.mock.calls).toEqual([[7],[8]])` fails because `batch.map(updateFn)` passes (value, index, array) — actual calls are [[7,0,[7,8]],[8,1,[7,8]]]. Asserted first-arg only: `spy.mock.calls.map(c => c[0])` → [7,8] — pins "physicalKeyValue only, keyValue never passed" as intended. Cleanup (actual ls): .scratch/ has pm-notes.md, probe.test.ts, probe2.test.ts, review-notes.md (PO-deletable); _to_delete/ empty → no cleanup needed.
2a ✓ — `src/utils/__tests__/keyUnits.test.ts` created per spec (6 tests); vitest run pass, typecheck 0, lint exit 0. All plan values used as-is, none recomputed. NOTE for Reviewer: plan's parenthetical "map has a 2:38.1 entry" is inaccurate — KEY_SIZES 2u entry is 35.999; mmToU(38.1)===2 passes via the ÷19.05 fallback (38.1/19.05=2). Pinned value matches plan.
1 ✓ DONE — Reviewer PASS 2026-10-24 (review-test-infra.md, base beca01b → head f526813); all gates rerun green; `.scratch` exclusion deviation ACCEPTED. Findings: none.

## Tasks
1. **Phase 0 — test infra** — [high-stakes] — ✓ DONE (Reviewer PASS 2026-10-24, review-test-infra.md; vitest config node env + .scratch exclude, smoke test, test:run script, CI step; deviation accepted)
2. **Phase 1 — Tier A pure-logic tests** — [high-stakes] (new behavior-pinning tests across 4 modules) — STATUS: IN-REVIEW (2a–2f ✓ committed; review-tier-a-tests.md, base b5ec520 → head f9cdacd; 2f ✓ = 4 geometry tests appended, probe values as-is, file 8/8 pass, full suite 5 files/24 tests, typecheck 0, lint exit 0)
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
