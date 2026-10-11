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
- [ ] meets every "DONE WHEN" criterion above
- [ ] diff scope matches the task (no stray files)
- [ ] no design-intent violation
- [ ] typecheck/build gate met where it applies (no newly introduced errors; unmasked ones recorded/deferred) — or N/A
- [ ] tag is correct (high-stakes where required) — else auto-FAIL

---
## ✅ REVIEWER VERDICT
**Result:** —  ·  **Date:** —  ·  **Fail count:** —

### Failed items (FAIL only)
—
