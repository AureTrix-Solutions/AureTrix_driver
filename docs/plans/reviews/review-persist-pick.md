# REVIEW: persist-pick (sprint-07-tsc-errors Task 2)

**SPRINT GOAL:** Drive the tsc baseline from 23 errors to 0 — add the missing `*.vue` ambient shim and migrate both stores' `persist.paths` → `persist.pick` for pinia-plugin-persistedstate v4, then re-baseline docs/tsc-baseline.txt to 0.
**TASK:** Migrate `persist.paths` → `persist.pick` in both stores + re-baseline to 0  ·  **TAG:** [high-stakes]
**DONE WHEN:**
- `npm run typecheck` reports **0 errors**; docs/tsc-baseline.txt first line is `0`.
- `grep -rn "paths:" src/store/` returns nothing.
- `grep -n "pick:" src/store/profileStore.ts src/store/travelProfilesStore.ts` returns the two new lines.
- `npm run build` passes.
- Persistence behavior preserved per PO decision 2026-10-11 (v4 silently ignored the unknown `paths` key, so both stores were persisting full state; the new `pick` lists restore the intended v3 behavior — see Worker notes for the `activeProfileId` addition).

## 📝 Worker notes & self-check
- Edits applied exactly per plan: `profileStore.ts` `paths: ['profiles']` → `pick: ['profiles', 'activeProfileId']`; `travelProfilesStore.ts` `paths: ['profiles', 'selectedProfileId']` → `pick: ['profiles', 'selectedProfileId']`; tsc-baseline.txt first line 23 → 0 with ratchet history comment added.
- Behavioral note (PM-researched, PM decision baked into plan): under v4 the `paths` key is unknown and silently ignored, meaning BOTH stores were persisting their FULL state. The new `pick` lists restore the originally-intended v3 behavior; for profileStore this ADDS `activeProfileId` to persistence vs the old `paths: ['profiles']` — intentional per plan (PO decision: preserve current behavior; `activeProfileId` was being persisted under the ignored-paths fallback).
- No `!` / `as any` used; no files touched outside the task's scope.
- Self-check vs sdk-reference-v2.md: N/A — no SDK calls touched (Pinia persistence only).
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (untouched)
- typecheck/build: typecheck 5 → **0** errors (all 5 expected errors cleared: 2× TS2769 + 3× cascaded TS2339); `npm run build` passes (✓ built in 1.60s). Baseline re-ratcheted 23 → 0.

## 🔍 Commits to review
Base: `2f9bf1a` (Task 1 / last checkpoint)   Head: `9183312` (this task)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat 2f9bf1a..9183312     then      git diff 2f9bf1a..9183312
     A file touched outside this task's scope is a flag. -->
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task. No hardware behavior touched (store persistence only).

## ❓ Reviewer, please confirm
- [x] meets every "DONE WHEN" criterion above
- [x] diff scope matches the task (no stray files)
- [x] no design-intent violation
- [x] typecheck/build gate met where it applies (no newly introduced errors; unmasked ones recorded/deferred) — or N/A
- [x] tag is correct (high-stakes where required) — else auto-FAIL

### Reviewer findings (independent verification, 2026-10-11, fresh session)
- Diff 2f9bf1a..9183312 inspected: exactly 3 files (profileStore.ts, travelProfilesStore.ts, docs/tsc-baseline.txt), 5+/4−. Edits match the plan's edit list verbatim — `paths:` → `pick:` in both persist blocks, `key:` lines untouched. No strays, no `!`, no `as any`.
- `npm run typecheck` re-run: 0 errors (clean tsc output). ✓
- `npm run build` re-run: `✓ built in 1.58s`, no errors. ✓
- `grep paths: src/store/` → no matches. ✓
- `grep pick: src/store/` → profileStore.ts:62 `pick: ['profiles', 'activeProfileId'],` + travelProfilesStore.ts:38 `pick: ['profiles', 'selectedProfileId'],`. ✓
- docs/tsc-baseline.txt first line `0`; ratchet comment added; breakdown "none remaining". 23 → 0 respects ratchet-down-only. ✓
- Behavior criterion: profileStore state = {profiles, activeProfileId} (:10–17); travelProfilesStore state = {profiles, selectedProfileId} (:10–13). Each pick list = the store's FULL state ⇒ deepPick serializes the same object as today's full-state persist (v4 ignores the unknown `paths` key) — behavior-neutral per PO decision 2026-10-11. ✓
- Design intent: no SDK/service code touched; filters:[] and wrapper semantics untouched. ✓
- Tag check: [high-stakes] correct (multi-file store/persistence change); review performed. ✓
- Observation (non-defect, out of scope): travelProfilesStore.ts has no trailing newline at EOF — pre-existing (diff marker sits on shared context present in both revisions), not introduced here.

---
## ✅ REVIEWER VERDICT
**Result:** PASS  ·  **Date:** 2026-10-11  ·  **Fail count:** 0

### Failed items (FAIL only)
—

Not a [hw] task (behavior-neutral by PO decision; no browser/hardware gate), so PASS is final → Task 2 DONE. ALL TASKS DONE — sprint complete, awaiting PO sign-off.
