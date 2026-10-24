# REVIEW: getRm6X21Travel clarifying comment

**SPRINT GOAL:** Clear four code-hygiene defects — clarify the getRm6X21Travel wrapper annotation, delete the dead KeyTravel baseLayout prop cascade, and make decryptSDKConfig replicate the SDK import's `keyboards.flat()` so nested-array repairs can't silently skip.
**TASK:** getRm6X21Travel clarifying comment  ·  **TAG:** [high-stakes] (touches KeyboardService — always high-stakes)
**DONE WHEN:**
- `grep -n "Wraps SDK getRm6X21Travel" src/services/KeyboardService.ts` returns one hit immediately above the `async getRm6X21Travel` signature.
- The annotation line is UNCHANGED — `grep -n "travels: number\[\]; maxTravel: number" src/services/KeyboardService.ts` still hits :982 (it was correct; NOT "fixed" to `number[][]`).
- `npm run typecheck` → 0 errors (baseline 0).

## 📝 Worker notes & self-check
- Applied the PM edit spec exactly: replaced the blank line at :981 with the one-line comment verbatim; diff is 1 file, +1/−1.
- Both greps verified post-edit: comment at :981, annotation intact at :982, signature directly below the comment.
- Self-check vs sdk-reference-v2.md: none needed — comment-only, no behavior/type change; sdk-ref §4 claim was carried verbatim from the PM-verified spec.
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (untouched — code unchanged).
- typecheck/build: typecheck exit 0, 0 errors (baseline 0, unchanged). Build skipped per spec (comment-only cannot affect build).

## 🔍 Commits to review
Base: `94a156c` (branch point / PM-open)   Head: `5fb626a` (this task)

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task; comment-only change with zero behavioral impact.

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
