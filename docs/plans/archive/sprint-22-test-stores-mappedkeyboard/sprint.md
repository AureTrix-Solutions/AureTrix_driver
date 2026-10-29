# SPRINT 22 ARCHIVE: sprint-22-test-stores-mappedkeyboard

**Goal:** Phase 3 of the testing backlog — headless test coverage for the three Pinia stores (travelProfiles, profiles, connection) and the `useMappedKeyboard` composable, pinning CURRENT behavior (tests only, zero source edits).
**Started:** 2026-10-28  ·  **Closed:** 2026-10-29  ·  **Tasks:** 7 (all DONE)  ·  **Signed off by:** PO (2026-10-29)
**QA:** Group Reviewer PASS (review-sprint-22.md, base `bad4d3e` .. head `5f41b09`). Final suite: 14 files / 175 tests green; typecheck exit 0; lint exit 0. Zero source edits confirmed. F1 (plan-time criterion said 174 tests; true total 96+79=175) corrected at close in the review file.
**Findings routed to backlog.md at close:** travelProfilesStore.addProfile same-ms `Date.now()` id collision; MappedKeyboard.batchSetKey ignores a *resolved* `Error` from setKey. Both pinned AS-IS by tests.

---

Snapshot of docs/plans/current-sprint.md as of close:

**DONE-CRITERIA (sprint):** 7 new test files green; `npm run test:run` all-pass (96 baseline + new); `npm run typecheck` exit 0; `npm run lint` exit 0; Reviewer PASS on the cumulative diff.

## Checkpoint
- ✓ Task 1 DONE — `src/store/__tests__/travelProfiles.test.ts` (12 tests, commit 60858d3). Await group review.
- ✓ Task 2 DONE — `src/store/__tests__/profileStore.test.ts` (16 tests, commit bda9a62). vitest 16/16; typecheck exit 0; lint exit 0. Source matched spec verbatim. Await group review.
- ✓ Task 3 DONE — `src/store/__tests__/connection.sync.test.ts` (10 tests, commit 2e932b3). vitest 10/10; typecheck exit 0; lint exit 0. Source matched spec verbatim. Await group review.
- ✓ Task 4 DONE — `src/store/__tests__/connection.async.test.ts` (11 tests, commit 3dd0b2d). vitest 11/11; typecheck exit 0; lint exit 0. Spec diverged from source once (drafted `connect` — real action is `connectDevice`; `autoConnect` reject string is `'Please Connect.'` capital-C+period, distinct from null path `'Please connect'`). Await group review.
- ✓ Task 5 DONE — `src/utils/__tests__/MappedKeyboard.geometry.test.ts` (10 tests, commit 3db302e). vitest 10/10; typecheck exit 0; lint exit 0. Source matched spec verbatim (gridStyle reduce, absolute-box getKeyStyle, zeroed fallback); confirmed `IDefKeyInfo` needs only `keyValue` (location optional in app type) and real `getLayoutConfig` returns rows/cols too — mock returns include them. Await group review.
- ✓ Task 6 DONE — `src/utils/__tests__/MappedKeyboard.fetch.test.ts` (12 tests, commit e741d67). vitest 12/12; typecheck exit 0; lint exit 0. Source matched spec (all 13 spec cases covered incl. duplicate-key-later-wins and baseLayout stickiness). Note: `ref()` reactive-proxy wrapping breaks `toBe` identity on layout/baseLayout — used `toStrictEqual`. Await group review.
- ✓ Task 7 DONE — `src/utils/__tests__/MappedKeyboard.batch-watch.test.ts` (8 tests, commit 5f41b09). vitest 8/8; typecheck exit 0; lint exit 0. Full-suite sweep 14 files / 175 green.
- Suite: 14 files / 175 tests green (`npm run test:run`) — Reviewer re-run; the plan-time annotation said 174, corrected here to measured ground truth (see review-sprint-22.md F1). Baselines unchanged (tsc 0, lint 0).
- Cleanup: `.scratch/` pm-notes.md, review-notes.md (PO may delete); `_to_delete/` empty.
- Group review: Tasks 1–7 are ONE high-stakes group — Reviewer ran ONCE over cumulative base..head (sprint-21 precedent). VERDICT: **PASS** (review-sprint-22.md). One non-code finding F1 (174→175 criterion slip) routed to PM-close.

## Tasks
✓ 1. **travelProfilesStore tests** — committed 60858d3 (12 tests) — DONE (Reviewer PASS)
✓ 2. **profileStore tests** — committed bda9a62 (16 tests) — DONE (Reviewer PASS)
✓ 3. **connectionStore sync actions** — committed 2e932b3 (10 tests) — DONE (Reviewer PASS)
✓ 4. **connectionStore async actions** — committed 3dd0b2d (11 tests) — DONE (Reviewer PASS)
✓ 5. **useMappedKeyboard geometry** — committed 3db302e (10 tests) — DONE (Reviewer PASS)
✓ 6. **useMappedKeyboard fetchLayerLayout behavior** — committed e741d67 (12 tests) — DONE (Reviewer PASS)
✓ 7. **batchSetKey + connection watch + full-suite sweep** — committed 5f41b09 (8 tests) — DONE (Reviewer PASS, Base bad4d3e / Head 5f41b09)

## Findings (routed to backlog.md at close)
- travelProfilesStore.addProfile: `id = Date.now().toString()` — two adds within the same millisecond get IDENTICAL ids (pinned AS-IS in travelProfiles.test.ts "AS-IS pin" test; verify at `const id = Date.now()` in src/store/travelProfilesStore.ts addProfile).
- MappedKeyboard.batchSetKey: does not check whether `setKey` RESOLVES an Error instance (KeyboardService wrappers return Error instead of throwing) — a device-side failure passes silently (pinned AS-IS in MappedKeyboard.batch-watch.test.ts "AS-IS pin" test; verify at the `await KeyboardService.setKey(...)` call inside batchSetKey's loop in src/utils/MappedKeyboard.ts).
