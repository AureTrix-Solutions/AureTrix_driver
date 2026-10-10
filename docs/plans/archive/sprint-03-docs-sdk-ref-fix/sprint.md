# SPRINT ARCHIVE: sprint-03-docs-sdk-ref-fix

**GOAL:** sdk-reference-v2.md §13.7 states the verified truth about `configs` reachability and carries the current repo state.
**DONE-CRITERIA (sprint):** No "configs never invoked" claim remains in the doc; §13.7.4 corrected per sprint-01 review §R2; §13.7 preamble/Site 1/§13.7.3 banner-noted as superseded; §13.7 status row updated; no source files touched (tsc baseline stays 23).
**Started:** 2026-10-10  ·  **Closed:** 2026-10-10  ·  **Tasks:** 2  ·  **Signed off by PO:** 2026-10-10

## Branch & commits
Branch `sprint-03-docs-sdk-ref-fix` (8 commits from PM-open 956548c through close). PO merges and deletes per process.

## Checkpoint (at close)
- tsc baseline: 23 errors (docs/tsc-baseline.txt) — docs-only sprint, unchanged
- Cleanup: no cleanup needed (`.scratch/` and `_to_delete/` both empty — ls'd 2026-10-10)

## Tasks
✓ 1. **Correct §13.7.4 `configs` reachability claims** [high-stakes] — DONE (2026-10-10, Reviewer PASS, fail count 0 — review-sdk-ref-configs-fix.md in this folder; commits a3ee408 + 931b972). §13.7.4 now gives the verified devices()→zero-match-fallback→internal requestDevice() chain, cites sprint-01 review §R2, keeps the design-intent warning + vendorId 7331/productId 1793 caveat; "Net:" clause (b) corrected; §13.7 verification status row (:179) notes the sprint-03 correction. Grep gate: all 3 forbidden strings 0 occurrences (re-confirmed by PM at close).
✓ 2. **Banner-note §13.7 staleness (pre-variant-P text)** [high-stakes] — DONE (2026-10-10, Reviewer PASS, fail count 0 — review-sdk-ref-banner-notes.md in this folder; commits a16bf5a + 3a4c9c7). 4 PM-prescribed edits applied verbatim (preamble status note, Site 1 heading, §13.7.3 header, "None of this is in the repo" superseded note); additions/title-changes only; all cited facts spot-checked by the Reviewer against the live repo (tsconfig.json:21 paths mapping, imports, constructors, typecheck script + baseline 23).

## QA notes for the record
- Task 1 had one FAIL round caused by a Reviewer misquote (retracted finding 2 in review-sdk-ref-configs-fix.md); the PO re-verified and ruled PASS. Delivered text confirmed clean.
- PO policy point from that round (a text defect in ground-truth docs = blocking FAIL, not a QA-tier inline fix) was logged in Findings, then removed by the PO in commit 0677fc9 — Findings closed empty, nothing routed to backlog.

## Findings (at close)
Empty — nothing to route (PO removed the one logged line in 0677fc9).
