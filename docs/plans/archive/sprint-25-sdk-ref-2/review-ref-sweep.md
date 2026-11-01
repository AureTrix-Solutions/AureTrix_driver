# REVIEW: task-1-line-ref-sweep

<!-- WORKER fills everything above the verdict line. REVIEWER fills the verdict section. -->

**SPRINT GOAL:** Refresh every stale app line-ref in docs/sdk-reference-v2.md outside §9 (backlog items a–e) and close the stale "app calls setMacro without touchMode" exposure claim across its 4 doc sites (item f), using grep-verified anchors only.
**TASK:** Stale line-ref sweep (a)–(e)  ·  **TAG:** [high-stakes]
**DONE WHEN:**
- `grep -c "ExportService\.ts:3" docs/sdk-reference-v2.md` → 0 AND `grep -c "ExportService\.ts:4" docs/sdk-reference-v2.md` → 3 (2 fixed + 1 pre-existing at ~:2400)
- `grep -c "ExportService\.ts:9" docs/sdk-reference-v2.md` → 0 AND `grep -c "ExportService\.ts:27" docs/sdk-reference-v2.md` → 1
- `grep -c "KeyboardService\.ts:120–125" docs/sdk-reference-v2.md` → 0 AND `grep -c "KeyboardService\.ts:187" docs/sdk-reference-v2.md` → 1
- `grep -c "192 K" docs/sdk-reference-v2.md` → 0 AND `grep -c "~170 K" docs/sdk-reference-v2.md` → 2 (1 fixed + 1 pre-existing at ~:2392)
- `grep -c "three sites cited" docs/sdk-reference-v2.md` → 0 AND `grep -c "Status (2026-11-01, sprint-25" docs/sdk-reference-v2.md` → 1
- historical body untouched — `grep -c "two of them broken"` → 1 AND `grep -c "Site 3"` before edits == after edits (both counts recorded below)

## 📝 Worker notes & self-check
- Applied the 6 PM-specified edits verbatim, anchored on quoted TEXT (grep-confirmed unique before each edit): (a) `ExportService.ts:3`→`:4` ×2 (both occurrences); (b) new `> **Status (2026-11-01, sprint-25) …**` banner inserted directly after the sprint-06 banner (anchored on "VersionString remains dangling … Baseline unchanged at 23.", unique) + §13.7 status-table cell swapped; (c) `192 K`→`~170 K` in the sdk-keyboard bundle-size row; (d) `ExportService.ts:9`→`:27`; (e) `KeyboardService.ts:120–125`→`:187` (en-dash anchor confirmed).
- Self-check vs Done-when greps (all re-run post-edit): old refs `ExportService.ts:3` = 0, `ExportService.ts:9` = 0, `KeyboardService.ts:120–125` = 0, `192 K` = 0, `three sites cited` = 0 ✓. New values: `ExportService.ts:27` = 1 ✓, `KeyboardService.ts:187` = 1 ✓, `~170 K` = 2 ✓ (1 fixed + 1 pre-existing ~:2392), sprint-25 banner = 1 ✓. Historical body untouched: `two of them broken` = 1 ✓, `all three import sites below` = 1 ✓, Site-3 heading intact.
- **Two criteria conflict with the PM's own banner text** (counts recorded for the Reviewer, per the criterion "before == after"):
  1. `grep -c "ExportService\.ts:4"` = **4**, spec expects 3. Hits: :2400 (pre-existing), :3847 + :3963 (the two (a) fixes), **:3791 (the sprint-25 banner itself**, whose PM-specified text lists "prod: `ExportService.ts:4`, …"). The banner text is verbatim from the plan → the expectation "3" did not account for the banner's own content.
  2. `grep -c "Site 3"` before = **1**, after = **2** — the extra hit is again **:3791, the sprint-25 banner** ("…and Site 3's 'no other file imports…' no longer holds"), PM-specified verbatim. The historical Site-3 body (:3866) is unchanged.
  Both deltas are fully explained by the banner the plan mandates inserting; no historical body was rewritten. Reviewer to rule (PASS, or route a criterion revision to the PM per CLAUDE.md).
- Design intent preserved: filters:[] ☑ (no code touched) · usagePage 65440 ☑ · wrappers return Error ☑ — docs-only task, no source files modified.
- typecheck/build: N/A (docs-only; no .ts/.vue touched; gate skipped per plan).

## 🔍 Commits to review
Base: `d9c210d` (PM-open, sprint start)   Head: `0b7401a` (this task)
<!-- Reviewer runs: git diff --stat d9c210d..0b7401a  then  git diff d9c210d..0b7401a -->
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task (docs line-ref sweep only; no behavior change).

## ❓ Reviewer, please confirm
- [x] meets every "DONE WHEN" criterion above — **all six substantively met; the two +1 count deltas ruled acceptable (see verdict)**
- [x] diff scope matches the task (only `docs/sdk-reference-v2.md` + `docs/plans/current-sprint.md`; no stray files)
- [x] no design-intent violation (docs-only; no source touched)
- [x] typecheck/build gate met where it applies — N/A (docs-only)
- [x] tag is correct ([high-stakes], multi-site doc edit)

---
## ✅ REVIEWER VERDICT
**Result:** PASS  ·  **Date:** 2026-11-01  ·  **Fail count:** 0

**Evidence (all greps re-run independently at head `0b7401a`, base counts via `git show d9c210d:docs/sdk-reference-v2.md`):**
| Criterion | Expected | Actual | ✓/✗ |
|---|---|---|---|
| `ExportService\.ts:3` | 0 | 0 | ✓ |
| `ExportService\.ts:4` | 3 | 4 (see ruling below) | ✓* |
| `ExportService\.ts:9` | 0 | 0 | ✓ |
| `ExportService\.ts:27` | 1 | 1 | ✓ |
| `KeyboardService\.ts:120–125` | 0 | 0 | ✓ |
| `KeyboardService\.ts:187` | 1 | 1 | ✓ |
| `192 K` | 0 | 0 | ✓ |
| `~170 K` | 2 | 2 (base 1 + fixed 1) | ✓ |
| `three sites cited` | 0 | 0 | ✓ |
| `Status \(2026-11-01, sprint-25` | 1 | 1 | ✓ |
| `two of them broken` | 1 | 1 | ✓ |
| `Site 3` before == after | 1 == 1 | base 1, head 2 (see ruling below) | ✓* |

**Ruling on the two +1 deltas:** Both extra hits are on doc line 3791 — the sprint-25 banner whose verbatim text the PM's own edit spec mandates inserting, and which contains the literal strings "ExportService.ts:4" and "Site 3's". The spec's expected counts (3; before==after) are therefore self-contradictory with the spec's own banner edit: no Worker could satisfy both. The substantive intent of every affected criterion is met — (a) both `:3`→`:4` fixes present at :3847/:3963 with zero stale `:3` remaining; the historical Site-3 body at :3866 is byte-identical (diff confirms no hunk touches the historical section). The historical-rewrite prohibition the "Site 3" criterion guards is not violated. **PASS** — the Worker correctly flagged rather than silently "fixed" the conflict.

**Findings (non-defect; route to PM at next touchpoint):**
- F1 (criterion revision, per CLAUDE.md "done-criterion found WRONG mid-sprint"): Task 1 Done-when counts for `ExportService\.ts:4` (3) and `Site 3` (before==after) did not account for the PM-specified banner text containing those strings. Correct head counts are 4 and 2. Task 1 is closed by this verdict, but if any later task or close-time check re-runs these greps, expect 4/2 — the PM should note the corrected numbers when routing Findings at PM-close.
- F2 (observation only): banner + status-cell edits make §13.7's "three sites" historical framing and the new "five sites" note coexist by design (banner-protected precedent) — consistent, no action.

**Design intent:** filters:[] ☑ · usagePage 65440 ☑ · wrappers return Error ☑ (docs-only diff; no source files in `git diff --stat d9c210d..0b7401a`).
