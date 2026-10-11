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
- [ ] PASS — diff matches every Done-when criterion
- [ ] FAIL — findings below (each: severity, file:line, exact fix, Done-when #)

Findings:
- (empty)
