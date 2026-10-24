# REVIEW: baseLayout-cascade

**SPRINT GOAL:** Clear four code-hygiene defects — clarify the getRm6X21Travel wrapper annotation, delete the dead KeyTravel baseLayout prop cascade, and make decryptSDKConfig replicate the SDK import's `keyboards.flat()` so nested-array repairs can't silently skip.
**TASK:** Remove dead baseLayout prop cascade (KeyTravel → Performance binding)  ·  **TAG:** [high-stakes] (multi-file)
**DONE WHEN:**
- `grep -c baseLayout src/components/performance/KeyTravel.vue` → 0.
- `grep -c ':base-layout' src/pages/Performance.vue` → 0.
- `grep -c baseLayout src/pages/Performance.vue` → ≥ 2 (the ref stays ALIVE: debug-template line and the watch read it; destructure/watch/setup-return and useMappedKeyboard untouched).
- `npm run typecheck` → 0 errors; `npm run build` passes.

## 📝 Worker notes & self-check
- Applied the PM edit spec verbatim, 2 edits / 2 files: (a) KeyTravel.vue — deleted the whole `baseLayout: { type: Object as PropType<IDefKeyInfo[][] | null>, default: null },` prop block; (b) Performance.vue — deleted the `:base-layout="baseLayout"` line from the `<KeyTravel>` binding. Imports untouched: `PropType` and `IDefKeyInfo` still used by the surviving `selectedKeys`/`layout` props in KeyTravel.vue.
- Nothing else touched: Performance.vue's own `baseLayout` ref (from `useMappedKeyboard`), the debug-template read (~:66), and the ~:357 watch remain intact — post-edit `grep -c baseLayout src/pages/Performance.vue` → 4 (≥ 2 ✓).
- All four Done-when criteria re-run green post-edit: greps → 0 / 0 / 4; typecheck exit 0, 0 errors (baseline 0); build ✓ (vite exit 0, "built in 1.79s").
- Self-check vs sdk-reference-v2.md: none needed — dead-prop removal only, no SDK call or signature touched.
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (untouched).
- Diff scope: exactly the 2 spec'd files, 5 deletions, 0 insertions (`git diff --stat 67cec9c..d85ad99`).

## 🔍 Commits to review
Base: `67cec9c` (task 1 DONE / last reviewed)   Head: `d85ad99` (this task)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat <base>..<head>     then      git diff <base>..<head>
     A file touched outside this task's scope is a flag. -->
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task. Dead-prop removal with zero runtime behavior change: the prop was declared but never read in KeyTravel.vue (verified by PM at plan time; grep confirms no other `baseLayout` occurrence remains in that file).

## ❓ Reviewer, please confirm
- [ ] meets every "DONE WHEN" criterion above
- [ ] diff scope matches the task (no stray files)
- [ ] no design-intent violation
- [ ] typecheck/build gate met where it applies (no newly introduced errors; unmasked ones recorded/deferred) — or N/A
- [ ] tag is correct (high-stakes where required) — else auto-FAIL

---
## ✅ REVIEWER VERDICT
<!-- After ONE verification pass, RULE. Don't keep investigating. A runtime/behavior question goes
     to the PO hardware check, not more static analysis. Output = PASS/FAIL + findings + your own
     Findings one-liners (into current-sprint.md). Do NOT plan task order/parallelism. -->
**Result:** —  ·  **Date:** —  ·  **Fail count:** —

### Failed items (FAIL only)
