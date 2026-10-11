# SPRINT ARCHIVE: sprint-07-tsc-errors

**GOAL:** Drive the tsc baseline from 23 errors to 0 — add the missing `*.vue` ambient shim (kills 18 TS2307) and migrate both stores' `persist.paths` → `persist.pick` for pinia-plugin-persistedstate v4 (kills 2 TS2769 + 3 cascaded TS2339), then re-baseline docs/tsc-baseline.txt to 0.
**DONE-CRITERIA (sprint):** `npm run typecheck` reports 0 errors; docs/tsc-baseline.txt records baseline 0; persistence behavior byte-identical (PO decision 2026-10-11: preserve current).
**Started:** 2026-10-11  ·  **Closed:** 2026-10-11  ·  **Tasks:** 2  ·  **Signed off by:** PO (2026-10-11)
<!-- revN: none — sprint ran without revision -->

## Final state (verified at PM-close)
- `npm run typecheck` re-run at close: **0 errors** (clean output).
- docs/tsc-baseline.txt first line `0`; ratchet history 60 → 36 → 23 → 0; breakdown "none remaining".
- Persistence behavior-neutral: each store's new `pick` list equals its full state ⇒ serializes the same object as the v4 ignored-`paths` full-state fallback (Reviewer-confirmed against store definitions).
- Findings section: empty — nothing routed to backlog.
- Cleanup at close: `.scratch/` had only pm-notes.md (PM working file); `_to_delete/` empty.
- Non-defect observation (pre-existing, not introduced by this sprint): travelProfilesStore.ts lacks a trailing newline at EOF — see review-persist-pick.md, Reviewer findings.

## Tasks (final)

1. ✓ **Add the `*.vue` ambient module shim** — [trivial] — DONE (shim created; typecheck 23 → 5, TS2307 = 0, remaining 5 = exactly the predicted 2× TS2769 + 3× TS2339)

2. ✓ **Migrate `persist.paths` → `persist.pick` in both stores + re-baseline to 0** — [high-stakes] — DONE (Reviewer PASS 2026-10-11, fail count 0 — all criteria re-verified independently; detail in review-persist-pick.md, this folder)

## Commits (this branch)
- e6b2e39 PM open — 2-task plan; backlog item removed
- 2f9bf1a Task 1 DONE — *.vue ambient shim (typecheck 23 → 5)
- 9183312 Task 2 — persist.paths → persist.pick (v4), re-baseline to 0
- 1451d03 Task 2 IN-REVIEW — review file + checkpoint
- 5f06da6 Task 2 PASS (Reviewer) — all DONE-WHEN criteria re-verified
- (close commit follows this snapshot)
