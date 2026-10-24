# REVIEW: decryptSDKConfig-flat

**SPRINT GOAL:** Clear four code-hygiene defects — clarify the getRm6X21Travel wrapper annotation, delete the dead KeyTravel baseLayout prop cascade, and make decryptSDKConfig replicate the SDK import's `keyboards.flat()` so nested-array repairs can't silently skip.
**TASK:** decryptSDKConfig replicates SDK import's keyboards.flat()  ·  **TAG:** [high-stakes] (SDK/import correctness)
**DONE WHEN:**
- `grep -n "cfg.keyboards = cfg.keyboards.flat()" src/services/ExportService.ts` returns one hit inside `decryptSDKConfig`.
- `grep -c "config.keyboards ?? \[\]" src/services/ExportService.ts` → 5 (the five repair loops at ~:584/:608/:661/:696/:805 stay UNCHANGED — the fix is one site upstream of all of them).
- `npm run typecheck` → 0 errors with NO `as any` added; `npm run build` passes.

## 📝 Worker notes & self-check
- Applied the PM edit spec verbatim: in `decryptSDKConfig` (src/services/ExportService.ts:854), replaced `return JSON.parse(plaintext) as KeyboardConfig;` with parse → `if (Array.isArray(cfg.keyboards)) { cfg.keyboards = cfg.keyboards.flat(); }` → `return cfg;`. Diff: 1 file, +5/−1. No other code touched.
- Self-check vs sdk-reference-v2.md: N/A for this task — no wrapper added, no SDK call added. The grounding fact (SDK's importEncryptedJSON does `keyboards=i.keyboards.flat()`, dist/esm/index.js) was PM grep-verified at plan time and is quoted in the task's edit spec in current-sprint.md; this edit replicates it app-side. `flat()` on an already-flat array is a safe no-op; the `Array.isArray` guard keeps non-array input on the existing null/skip path unchanged.
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (untouched; `decryptSDKConfig` keeps its pre-existing `KeyboardConfig | null` contract — returns null on failure, callers skip repairs, unchanged).
- typecheck/build: `npm run typecheck` exit 0, `grep -c "error TS"` → 0 (baseline 0; no unmasking, no new errors). `npm run build` exit 0, ✓ built. NO `as any` added; no new casts — the sole `as KeyboardConfig` is the pre-existing one, kept on the parse line. The five `config.keyboards ?? []` repair-loop sites: pre-edit count 5, post-edit count 5 (unchanged, as spec'd).

## 🔍 Commits to review
Base: `4bd97dc` (last reviewed state — task 2 DONE)   Head: `e604c42` (this task)
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task. Pure import-path data-shape normalization; no device interaction.

## ❓ Reviewer, please confirm
- [ ] meets every "DONE WHEN" criterion above
- [ ] diff scope matches the task (no stray files)
- [ ] no design-intent violation
- [ ] typecheck/build gate met where it applies (no newly introduced errors; unmasked ones recorded/deferred) — or N/A
- [ ] tag is correct (high-stakes where required) — else auto-FAIL

---
## ✅ REVIEWER VERDICT
<!-- Reviewer fills this section. -->
**Result:** (pending)  ·  **Date:**   ·  **Fail count:**

### Failed items (FAIL only)
