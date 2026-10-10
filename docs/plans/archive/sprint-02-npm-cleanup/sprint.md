# SPRINT ARCHIVE: sprint-02-npm-cleanup

**GOAL:** Finish the pnpm→npm migration: package.json, lockfiles, and contributor docs all speak npm and point at the AureTrix-Solutions repo.
**DONE-CRITERIA (sprint):** No pnpm references remain in package.json, package-lock.json, README.md, or .github/CONTRIBUTING.md (the harmless `.gitignore` pnpm-debug glob stays); pnpm lockfiles moved to `_to_delete/`; `npm install` + `npm run build` pass on the regenerated lockfile; typecheck still ≤ 23.
**Started:** 2026-10-09  ·  **Closed:** 2026-10-09  ·  **Tasks:** 2  ·  **Signed off by PO:** 2026-10-09

## Branch & commits
Branch `sprint-02-npm-cleanup` (6 commits from PM-open 6f658d6 through close). PO merged and deleted per process.

## Tasks
✓ 1. **package.json + lockfile migration** [high-stakes] — DONE (2026-10-09, Reviewer PASS — review-npm-lockfile.md in this folder). Removed `packageManager` key + `pnpm` dep; lockfile regenerated via `npm install`; pnpm lockfiles `git mv`'d to `_to_delete/` (PO ran `git rm`, commit 869784a).
✓ 2. **README + CONTRIBUTING pnpm→npm and URL fixes** [trivial] — DONE (2026-10-09; grep gate 0 hits both files; all 12 planned edits applied; repo URLs repointed to AureTrix-Solutions/AureTrix_driver).

## Close verification (PM, 2026-10-09)
- grep `pnpm` across package.json / package-lock.json / README.md / .github/CONTRIBUTING.md → 0 hits.
- `npm run build` passed (1.61s); `npm run typecheck` → 23 errors, breakdown matches docs/tsc-baseline.txt exactly (router 17, profileStore 2, connection 2, travelProfilesStore 1, main 1). Baseline unchanged — no source touched.
- Cleanup: `.scratch/` empty; `_to_delete/` emptied by PO `git rm` (869784a).

## Checkpoint (final)
- tsc baseline: 23 errors (docs/tsc-baseline.txt) — unchanged through the sprint.
- PM-open: backlog item "npm cleanup" removed from backlog.md; sprint planned from it.

## Findings (routed at close)
- `npm install` reports 3 audit vulnerabilities (1 moderate, 2 critical), pre-existing in the dep graph — routed to backlog.md Known issues ([deps] entry, 2026-10-09).

## QA notes carried from review-npm-lockfile.md
- Reviewer verification: 5 non-consecutive commits on branch; lockfile is a clean npm regen (62 pkgs, 0 pnpm refs, both SDKs at exact pinned versions, integrity hashes, no peer/override flags); `npm install` idempotent post-commit; gates re-run (23 = baseline, build pass, greps 0 hits); `_to_delete/` moves in scope per Done-when; no out-of-scope changes.
- Advisory (no action): Worker's "61 added" npm output count vs 62 in lockfile is npm output semantics (direct vs total), not a discrepancy.
