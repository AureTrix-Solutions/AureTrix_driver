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
- [ ] meets every "DONE WHEN" criterion above — **note the two +1 deltas above, both caused by the PM-specified banner text; ruling requested**
- [ ] diff scope matches the task (only `docs/sdk-reference-v2.md` + planning files; no stray files)
- [ ] no design-intent violation
- [ ] typecheck/build gate met where it applies — N/A (docs-only)
- [ ] tag is correct ([high-stakes], multi-site doc edit)

---
## ✅ REVIEWER VERDICT
**Result:** —  ·  **Date:** —  ·  **Fail count:** —
