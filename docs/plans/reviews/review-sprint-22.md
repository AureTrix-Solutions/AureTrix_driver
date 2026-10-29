# REVIEW: sprint-22-test-stores-mappedkeyboard (Tasks 1–7, group)

<!-- WORKER fills everything above the verdict line. REVIEWER fills the verdict section.
     The PO's hardware verdict is RECORDED BY AN AGENT from the PO's plain-language outcome —
     the PO does not hand-edit this file. -->

**SPRINT GOAL:** Phase 3 of the testing backlog — headless test coverage for the three Pinia stores (travelProfiles, profiles, connection) and the `useMappedKeyboard` composable, pinning CURRENT behavior (tests only, zero source edits).
**TASK:** Group review of all 7 test tasks (Reviewer runs ONCE over the cumulative base..head diff, sprint-21 precedent).  ·  **TAG:** [high-stakes]
**DONE WHEN:**
- Task 1: `npx vitest run src/store/__tests__/travelProfiles.test.ts` green (12 tests).
- Task 2: `npx vitest run src/store/__tests__/profileStore.test.ts` green (16 tests).
- Task 3: `npx vitest run src/store/__tests__/connection.sync.test.ts` green (10 tests).
- Task 4: `npx vitest run src/store/__tests__/connection.async.test.ts` green (11 tests).
- Task 5: `npx vitest run src/utils/__tests__/MappedKeyboard.geometry.test.ts` green (10 tests).
- Task 6: `npx vitest run src/utils/__tests__/MappedKeyboard.fetch.test.ts` green (12 tests).
- Task 7: `npx vitest run src/utils/__tests__/MappedKeyboard.batch-watch.test.ts` green (8 tests).
- Sprint gates: `npm run test:run` all green (14 files / 174 tests); `npm run typecheck` exit 0; `npm run lint` exit 0.
- Zero source edits — all 7 new files are tests under src/store/__tests__/ and src/utils/__tests__/ (plus docs/plans).
<!-- If a criterion is revised after this file exists, UPDATE it here too — the Reviewer judges
     this file, not current-sprint.md. -->

## 📝 Worker notes & self-check
- Tasks 1–4 (store tests): travelProfiles 60858d3; profileStore bda9a62 (source matched spec verbatim); connection.sync 2e932b3 (verbatim); connection.async 3dd0b2d (spec diverged once: real action is `connectDevice`; `autoConnect` reject string is `'Please Connect.'` capital-C+period vs null path `'Please connect'`).
- Task 5 (3db302e): 10 geometry tests; source matched spec verbatim (gridStyle reduce, absolute-box getKeyStyle, zeroed fallback).
- Task 6 (e741d67): 12 fetch tests; fetchLayerLayout paths pinned (null-layer, layer merge, error, disconnect guard, baseLayout stickiness).
- Task 7 (5f41b09): 8 tests — batchSetKey (slices 10/10/5, custom batchSize 5, empty array, reject aborts loop with `Failed to set key batch` + `.cause`, sequential-await gate, AS-IS pin that a resolved Error is NOT detected) + connection watch (full reset incl. baseLayout null on disconnect; connect refires fetchLayerLayout).
- Self-check vs sdk-reference-v2.md: N/A — tests pin app-layer behavior only; no new SDK claims. Mock signatures match app usage (defKey/getLayoutKeyInfo/setKey/autoConnect/requestDevice/getBaseInfo/switchConfig/getActiveProfile).
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (untouched — Task 7 AS-IS-pins that batchSetKey ignores a resolved Error; routed to Findings, not fixed).
- typecheck/build: `npm run typecheck` exit 0; `npm run lint` exit 0; `npm run test:run` 14 files / 174 tests green. Zero source edits.
- Cleanup (from actual `ls`): `.scratch/` contains pm-notes.md (PO may delete); `_to_delete/` empty → no cleanup needed beyond .scratch.

## 🔍 Commits to review
Base: `bad4d3e` (branch point from main)   Head: `5f41b09` (Task 7)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat <base>..<head>     then      git diff <base>..<head>
     A file touched outside this task's scope is a flag. -->
Expected diff contents: 7 new test files (src/store/__tests__/*.test.ts ×4, src/utils/__tests__/MappedKeyboard*.test.ts ×3) + docs/plans/current-sprint.md + docs/plans/reviews/review-sprint-22.md. Any source-file change is a FAIL flag.
Fix-round ranges (added on each re-review):

## 🖥️ Hardware check ([hw] tasks only)
N/A — no [hw] tasks in this sprint. Tests are headless; no hardware behavior changed.

**Hardware verdict (agent records from the PO's plain-language outcome):**
- (n/a)

---

## ✅ REVIEWER VERDICT — fill this in
**VERDICT:** PASS ☐   FAIL ☐

**Findings:**
- (none yet)

**Re-run results (commands + output):**
- (fill in)
