# REVIEW: getRm6X21Travel-maxtravel

<!-- WORKER fills everything above the verdict line. REVIEWER fills the verdict section.
     The PO's hardware verdict is RECORDED BY AN AGENT from the PO's plain-language outcome —
     the PO does not hand-edit this file. -->

**SPRINT GOAL:** Clear two verified Code-hygiene backlog items — fix the `getRm6X21Travel` wrapper's `-Infinity` maxTravel on the all-zero-travels path, and remove the dead `@update-notification` binding (plus its now-orphaned `setNotification` helper) in Performance.vue.
**TASK:** Fix `getRm6X21Travel` all-zero maxTravel (-Infinity → 0)  ·  **TAG:** [high-stakes] (not [hw] — sole consumer guards with `if (currentTravel > 0)`; no on-device behavior changes)
**DONE WHEN:**
- `src/services/KeyboardService.ts` :991 replaced with: `const positiveTravels = flatTravels.filter((t: number) => t > 0);` + `const maxTravel = flatTravels.length === 0 ? 4.0 : positiveTravels.length > 0 ? Math.max(...positiveTravels) : 0;`
- :981 annotation now reads: `computes maxTravel (Math.max of travels > 0; 4.0 if no travels reported at all; 0 if travels exist but all are ≤ 0)`
- No other file changed; no other edit in KeyboardService.ts
- `npm run typecheck` exits with 0 errors (baseline held)

## 📝 Worker notes & self-check
- Replaced the single `maxTravel` line with the two-line `positiveTravels` form exactly as spec'd — empty-array → 4.0, all-zero → 0, else `Math.max` of positives. The old form's bug: `Math.max(...flatTravels.filter(t > 0))` over an all-zero array is `Math.max()` = -Infinity.
- Updated the :981 JSDoc to document all three outcomes (was "else 4.0", which hid the all-zero path).
- Self-check vs sdk-reference-v2.md: §4 (getRm6X21Travel) — SDK returns `{status: number[][], travels: number[][]}`; this edit touches only the wrapper's OUTPUT transform, not the SDK call or its return handling.
- Design intent preserved: filters:[] ☑ · usagePage 65440 ☑ · wrappers return Error ☑ (all untouched — diff is 2 hunks inside getRm6X21Travel)
- typecheck/build: `npm run typecheck` exit 0, no output (baseline 0 → 0). Build not run — transform-only change to one method, cannot affect the build.
- Done-when greps verified: old form returns nothing; new form hits :992; annotation hits :981.
- Cleanup (actual `ls`): `.scratch/` holds only pm-notes.md (PM's, PO may delete); `_to_delete/` empty.

## 🔍 Commits to review
Base: `9e878f7` (PM-open)   Head: `6cd0788` (this task)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat 9e878f7..6cd0788     then      git diff 9e878f7..6cd0788
     A file touched outside this task's scope is a flag. -->
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task. Rationale (from the plan): the sole consumer (SwitchProfiles.vue key-test) guards with `if (currentTravel > 0)`, so both -Infinity and 0 fail the guard and hold the display; no on-device behavior changes today. Contract hygiene only.

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
**Result:** ___  ·  **Date:** ___  ·  **Fail count:** ___

### Failed items (FAIL only)
