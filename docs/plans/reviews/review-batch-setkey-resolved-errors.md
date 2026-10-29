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
**Result:** _pending_  ·  **Date:** YYYY-MM-DD  ·  **Fail count:** <n>

<!-- PASS (non-hw): one line confirming criteria met; flip task to DONE + advance ▶ RUN THIS.
     PASS (pending hw): flip task to HW-TEST (never DONE); PO does the hands-on check above.
     FAIL: list each failed item below with full detail. Then append a short checklist to
     current-sprint.md ▶ RUN THIS, one bullet per item, each citing its §Fn here. -->

### Failed items (FAIL only)
_None yet — Reviewer fills on FAIL._
