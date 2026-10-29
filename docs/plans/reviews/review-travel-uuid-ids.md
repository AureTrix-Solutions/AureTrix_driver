# REVIEW: travel-uuid-ids

**SPRINT GOAL:** Fix the two sprint-22 code issues pinned AS-IS by tests: travelProfilesStore id collision (Date.now ids) and MappedKeyboard.batchSetKey swallowing resolved Errors.
**TASK:** Task 1 — travelProfilesStore: UUID ids  ·  **TAG:** [high-stakes]
**DONE WHEN:**
- `grep -n "Date.now" src/store/travelProfilesStore.ts` returns nothing
- `grep -c "crypto.randomUUID" src/store/travelProfilesStore.ts` returns 1
- `npx vitest run src/store/__tests__/travelProfiles.test.ts` → 12 tests pass (0 fail)
- `npm run typecheck` exits 0

## 📝 Worker notes & self-check
- `addProfile` now uses `const id = crypto.randomUUID();` (was `Date.now().toString()`), per plan edit 1 — one-line change.
- Test file updated per plan edits 2–5: timestamp-id tests rewritten as UUID-shape/auto-select assertions, the same-ms AS-IS pin inverted to distinct-ids, Date.now-derived id reads replaced with `store.profiles[0].id`. Test count unchanged (12).
- Remaining `vi.setSystemTime` calls in other tests are inert (those tests read ids from the store, not from the clock) — left untouched per plan scope.
- Self-check vs sdk-reference-v2.md: N/A — no SDK surface touched (pure store/test change).
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (untouched)
- typecheck/build: `npm run typecheck` exit 0 (baseline 0, no new errors — expected, logic change is type-safe: `crypto.randomUUID()` returns `string`). `npm run lint` exit 0. Build not run (no build-affecting change).

## 🔍 Commits to review
Base: `a945680` (branch point)   Head: `1688d4a` (this task)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat <base>..<head>     then      git diff <base>..<head>
     A file touched outside this task's scope is a flag. -->
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task.

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
