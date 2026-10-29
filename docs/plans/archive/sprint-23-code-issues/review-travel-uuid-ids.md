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
- [x] meets every "DONE WHEN" criterion above
- [x] diff scope matches the task (no stray files)
- [x] no design-intent violation
- [x] typecheck/build gate met where it applies (no newly introduced errors; unmasked ones recorded/deferred) — or N/A
- [x] tag is correct (high-stakes where required) — else auto-FAIL

---
## ✅ REVIEWER VERDICT
<!-- After ONE verification pass, RULE. Don't keep investigating. A runtime/behavior question goes
     to the PO hardware check, not more static analysis. Output = PASS/FAIL + findings + your own
     Findings one-liners (into current-sprint.md). Do NOT plan task order/parallelism. -->
**Result:** PASS  ·  **Date:** 2026-07-06  ·  **Fail count:** 0

### Failed items (FAIL only)
None.

### Verification evidence (all commands rerun by Reviewer)
| Done-when | Command | Result |
|---|---|---|
| Date.now gone from store | `grep -n "Date.now" src/store/travelProfilesStore.ts` | No matches ✓ |
| randomUUID present | `grep -c "crypto.randomUUID" src/store/travelProfilesStore.ts` | 1 ✓ |
| tests green | `npx vitest run src/store/__tests__/travelProfiles.test.ts` | Test Files 1 passed (1); **Tests 12 passed (12)**, 0 fail ✓ |
| typecheck | `npm run typecheck` | exit 0 ✓ |

**Diff scope** — `git diff --stat a945680..1688d4a` = exactly the two task files (`travelProfilesStore.ts` 2 lines, `travelProfiles.test.ts` 24 lines). No stray files.

**Spec conformance** — store change is the single planned edit: `addProfile` id `Date.now().toString()` → `crypto.randomUUID()`. Test changes match plan edits 2–5: the `selectedProfile` test now reads `store.profiles[0].id` instead of `String(Date.now())`; the timestamp-id test asserts UUID shape `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/` (correct lowercase RFC 4122 form, which is what `crypto.randomUUID()` returns) plus fields and auto-select; "two adds at different mocked times" became "two adds get distinct ids" with the now-pointless `setSystemTime` mocks dropped; the sprint-22 AS-IS same-ms collision pin was correctly inverted to `.not.toBe` — this is the defect the sprint exists to fix, so inverting it is right, not a lost pin. Test count held at 12 (4 blocks modified, none added/removed).

**Design intent** — untouched: no `filters`/`requestDevice`, no `usagePage` 65440, no wrapper/`Error`-return semantics in the diff.

**QA-tier inline defects** — none found (no typos, dead links, or self-created inconsistencies in the diff).

**Tag** — [high-stakes] confirmed appropriate: this is a logic/behavior change to persisted state (profile ids are stored via pinia-plugin-persistedstate), so id-generation semantics are not trivial. No downgrade.

### Findings (out-of-scope observations; NOT defects in this task)
None. No `## Findings` lines were added to current-sprint.md — this diff surfaced no out-of-scope defect or idea.
