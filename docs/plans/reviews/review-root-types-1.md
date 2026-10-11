# REVIEW: sprint-06-root-types Task 1 — tsconfig remap + setPerformanceMode narrowing

**SPRINT GOAL:** Root type imports from `@sparklinkplayjoy/protocol-keyboard` resolve in this repo (tsconfig `paths` remap, variant-P pattern), the single unmasked error is absorbed with baseline unchanged at 23, and sdk-reference + the sdk-wrapper skill record the fixed state.
**TASK:** tsconfig paths remap + narrow setPerformanceMode  ·  **TAG:** [high-stakes] (touches KeyboardService)  ·  no [hw] — type-only change
**DONE WHEN:**
- `grep -c '"@sparklinkplayjoy/protocol-keyboard"' tsconfig.json` → `1`
- `grep -n "mode: 'global' | 'single' | 'rt'" src/services/KeyboardService.ts` → exactly 1 hit (the :596 wrapper)
- `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `23` (baseline UNCHANGED; unmasked TS2345 absorbed by the narrowing — no re-baseline, no silencing)
- `git diff --stat <base>..<head>` shows only tsconfig.json + src/services/KeyboardService.ts

## 📝 Worker notes & self-check
- Applied the two PM-verified edits verbatim: tsconfig `paths` gains `"@sparklinkplayjoy/protocol-keyboard"` → `node_modules/@sparklinkplayjoy/protocol-keyboard/dist/esm/types/index.d.ts` (sibling after the existing `@sparklinkplayjoy/hid` entry, variant-P pattern); `KeyboardService.ts:596` `mode: string` → `mode: 'global' | 'single' | 'rt'`.
- Self-check vs sdk-reference-v2.md: §5.2 lines 390, 394–395 — `TouchModeType` = `'global' \| 'single' \| 'rt'` (`keyof typeof constantsParam.KeyTouchMode`, `KeyTouchMode { global = 0, single = 1, rt = 2 }`); line 3361 — `setPerformanceMode(key: number, mode: TouchModeType, advancedKeyMode: number)`. Narrowing matches the SDK contract exactly. Return type `{ touchMode: string; advancedKeyMode: number }` matches §5.2 verified Returns (line 745).
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (wrapper body unchanged, still `instanceof Error` checks).
- typecheck/build: gate ACTIVE. `npm run typecheck` before→after: 23 → **23** (unchanged, baseline held; 0 errors mention protocol/performanceMode). `npm run build` run because tsconfig paths changed: **passes** (✓ built in 1.63s). No re-baseline, nothing silenced.
- Done-when results (all pass): grep tsconfig → `1`; grep narrowing → 1 hit at :596; error count → `23`; diff stat → `tsconfig.json | 3 ++-` and `src/services/KeyboardService.ts | 2 +-` only.

## 🔍 Commits to review
Base: `a544af9`   Head: `4d84f17`
Fix-round ranges: (none yet)

## 🖥️ Hardware check
N/A — not a [hw] task; type-only change with no runtime behavior impact (narrowing accepts a subset of what it did before; all in-repo callers pass one of the three literals, proven by typecheck staying at 23).

## ✅ Reviewer verdict
- [x] PASS — diff matches every Done-when criterion
- [ ] FAIL — findings below (each: severity, file:line, exact fix, Done-when #)

**Reviewer:** independent session, 2026-10-11. All four Done-whens rerun, not trusted from worker notes:
1. `grep -c '"@sparklinkplayjoy/protocol-keyboard"' tsconfig.json` → `1` ✓ (entry is sibling after hid, esm barrel target; verified target file exists on disk).
2. `grep -n "mode: 'global' | 'single' | 'rt'" src/services/KeyboardService.ts` → exactly 1 hit, line 596, the wrapper signature; body untouched ✓.
3. `npx tsc --noEmit 2>&1 | grep -c "error TS"` → `23` ✓ — baseline unchanged, no re-baseline, no silencing; 0 errors mention protocol/performanceMode/tsconfig (the probe-predicted TS2345 at :601 is absorbed by the narrowing).
4. `git diff --stat a544af9..4d84f17` → only `src/services/KeyboardService.ts | 2 +-` and `tsconfig.json | 3 ++-` ✓. Full diff read: two hunks, exactly the PM-specified edits, nothing else.

Corroborations:
- `npm run build` rerun → passes (✓ built in 1.60s) — worker ran it because paths changed; confirmed.
- SDK contract grep-verified this session: sdk-reference-v2.md :390 (`mode: TouchModeType` = `'global' \| 'single' \| 'rt'`), :394 (`keyof typeof constantsParam.KeyTouchMode`), :3361 (`setPerformanceMode(key: number, mode: TouchModeType, advancedKeyMode: number)`) — worker's citations accurate; narrowing matches. Literal union (not an imported alias) is correct per PM research: TouchModeType is sdk-keyboard-local, not root-exported.
- sdk-wrapper skill checklist: wrapper pattern intact (Error union, guard, ensureKeyboard, instanceof passthrough all unchanged — signature-only edit).
- Design intent (hard rule 7): untouched — no filters, usagePage 65440 unchanged, still returns Error never throws.
- Tag [high-stakes] correct (touches KeyboardService — always high-stakes). No [hw] correct: type-only narrowing accepting a strict subset; zero caller breakage proven by typecheck holding at 23 (all 4 call sites pass literals).

Findings:
- (none — non-defect observation: SKILL.md still says "Resolution UNTESTED" and sdk-reference §13.7 lacks the sprint-06 status note; both are Task 2's scoped deliverables, not defects of Task 1.)
