# REVIEW: batch-setkey-resolved-errors

**SPRINT GOAL:** Fix the two sprint-22 code issues pinned AS-IS by tests: travelProfilesStore id collision (Date.now ids) and MappedKeyboard.batchSetKey swallowing resolved Errors.
**TASK:** Task 2 — batchSetKey: detect resolved Errors  ·  **TAG:** [high-stakes] (not [hw])
**DONE WHEN:**
- `grep -c "instanceof Error" src/utils/MappedKeyboard.ts` returns 3 (was 2)
- `npx vitest run src/utils/__tests__/MappedKeyboard.batch-watch.test.ts` → 8 tests pass (0 fail)
- `npm run test:run` → full suite green
- `npm run typecheck` exits 0

## 📝 Worker notes & self-check
- Edit 1 applied verbatim per plan: in `batchSetKey`'s for-loop, `await KeyboardService.setKey(batch);` → `const result = await KeyboardService.setKey(batch); if (result instanceof Error) throw result;` — routes a resolved Error through the existing catch (console.error log + reject with `{ cause }`), matching the thrown-error path.
- Edit 2 applied verbatim per plan: AS-IS pin test inverted → "setKey RESOLVING an Error is detected: rejects with cause, later batches do NOT run". Asserts rejection instanceof Error, message 'Failed to set key batch', cause === the resolved Error, setKey called 1× (loop aborted), console.error 1× with the exact batch-range message. Test count unchanged (8).
- Grep-confirmed at execution time: `KeyboardService.setKey` is `async setKey(keyConfigs: { key: number; layout: number; value: number }[]): Promise<void | Error>` (KeyboardService.ts, `async setKey(` — returns Error, never throws; house convention).
- Self-check vs sdk-reference-v2.md: N/A — no SDK surface touched. This is the house convention ("wrappers return Error instances; callers check `instanceof Error`") applied at the composable consumer.
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (KeyboardService.setKey still returns Error, never throws; batchSetKey now *detects* it instead of swallowing — the wrapper itself is unchanged).
- typecheck/build: `npm run typecheck` exit 0 (baseline 0 → 0, no new errors; change is type-safe — `result` is `void | Error`, narrowed by instanceof). `npm run lint` exit 0. Build not run (no build-affecting change). `npm run test:run`: 14 files, 175 tests, all pass.
- Cleanup (from actual `ls`): `.scratch/` contains pm-notes.md + review-notes.md (both gitignored, PO may delete); `_to_delete/` contains only .gitkeep — no cleanup needed from this task.

## 🔍 Commits to review
Base: `3e98a41` (last reviewed — task 1 PASS)   Head: `22dee80` (this task)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat <base>..<head>     then      git diff <base>..<head>
     A file touched outside this task's scope is a flag. -->
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task. Pure logic/test change; the reject path is already exercised by the mocked unit tests.

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
**Result:** PASS  ·  **Date:** 2026-10-29  ·  **Fail count:** 0

All four DONE-WHEN criteria rerun green by the Reviewer; the diff is the plan spec applied verbatim; scope clean; design intent untouched. Task 2 → DONE.

### Failed items (FAIL only)
None.

### Verification evidence (all commands rerun by Reviewer)
| Done-when | Command | Result |
|---|---|---|
| instanceof-Error count 3 | `grep -c "instanceof Error" src/utils/MappedKeyboard.ts` | 3 ✓ |
| pin-test file green | `npx vitest run src/utils/__tests__/MappedKeyboard.batch-watch.test.ts` | Test Files 1 passed (1); **Tests 8 passed (8)** ✓ |
| full suite | `npm run test:run` | Test Files 14 passed (14); **Tests 175 passed (175)** ✓ |
| typecheck | `npm run typecheck` | exit 0 ✓ |

**Diff scope** — `git diff --stat 3e98a41..22dee80` = exactly the two task files (`MappedKeyboard.ts` +3/−1, `MappedKeyboard.batch-watch.test.ts` +15/−6 net). No stray files. Code head `22dee80` is code-only; the review file + sprint checkpoint landed in the following docs-only commit `52d19a2` (verified via `git diff --stat 22dee80..52d19a2` = only current-sprint.md + this review file) — hashes in "Commits to review" are accurate.

**Spec conformance** — edit 1 is the planned change verbatim: in `batchSetKey`'s try block, `await KeyboardService.setKey(batch);` → `const result = await KeyboardService.setKey(batch); if (result instanceof Error) throw result;`. A resolved Error now enters the SAME existing catch as a thrown one (console.error with the batch-range message + `throw new Error('Failed to set key batch', { cause: error })`), so the pre-existing 'setKey rejects on batch 1' behavior is unchanged and the 5 `mockResolvedValue(undefined)` tests are unaffected. Edit 2 is the planned test verbatim: the AS-IS pin ('...is not detected — all batches run, no throw (Findings candidate b)') is inverted to 'setKey RESOLVING an Error is detected: rejects with cause, later batches do NOT run', asserting rejection instanceof Error, message, `cause` identity (`toBe(busy)`), setKey called 1× (loop aborts; 25 configs would otherwise be 3 batches), console.error 1× with the exact range message. One test replaced by one — count held at 8. `grep "AS-IS pin"` in the test file → no matches. The inverted pin is the defect this sprint exists to fix, so inverting it is correct, not a lost pin. This mirrors the `fetchLayerLayout` pattern already in the same file.

**Design intent** — untouched: no `filters`/`requestDevice` change, no `usagePage` 65440 change; `KeyboardService.setKey` wrapper itself unmodified (still returns Error, never throws) — the consumer now *detects* the returned Error per house convention.

**Tag** — [high-stakes] required (logic/behavior change) and correctly tagged; correctly not [hw] (pure logic; reject path exercised by mocked unit tests).

**Observation (non-defect, no action)** — the task's "On complete" instruction line in current-sprint.md referenced slug `review-batchsetkey-resolved-error.md`; the Worker created the better-slug `review-batch-setkey-resolved-errors.md` and the live ▶ RUN THIS pointer was correct. The stale reference was historical PM-plan text, physically removed when the task collapsed to ✓ on PASS. No Findings line warranted.
