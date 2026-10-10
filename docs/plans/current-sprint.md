# SPRINT: sprint-03-docs-sdk-ref-fix

**GOAL:** sdk-reference-v2.md §13.7 states the verified truth about `configs` reachability and carries the current repo state.
**DONE-CRITERIA (sprint):** No "configs never invoked" claim remains in the doc; §13.7.4 corrected per sprint-01 review §R2; §13.7 preamble/Site 1/§13.7.3 banner-noted as superseded; §13.7 status row updated; no source files touched (tsc baseline stays 23).
**Started:** 2026-10-10  ·  **Status:** IN PROGRESS
<!-- revN (YYYY-MM-DD): <what changed> -->

## Checkpoint
- Branch: `sprint-03-docs-sdk-ref-fix`
- tsc baseline: 23 errors (docs/tsc-baseline.txt) — docs-only sprint, must not change
- Cleanup: no cleanup needed (`.scratch/` and `_to_delete/` both empty — ls'd 2026-10-10 by Worker at Task 1)
- PM-open complete: backlog item removed, this file seeded.

## ▶ RUN THIS
Next: Worker session — "go" (Task 2: Banner-note §13.7 staleness — spec + edit list in Tasks below).

## Tasks

1. **Correct §13.7.4 `configs` reachability claims** — ✓ DONE (Reviewer PASS 2026-10-10; commits a3ee408 + 931b972; detail: docs/plans/reviews/review-sdk-ref-configs-fix.md)

2. **Banner-note §13.7 staleness (pre-variant-P text)** — [high-stakes] — STATUS: PENDING
   - Done when: §13.7 preamble carries a status note that Site 1 was fixed in sprint-01 via variant P and the text below is pre-fix history; grep "Status (2026-10-09" or equivalent in the §13.7 preamble.
   - Done when: §13.7.3 header no longer reads as currently-unapplied without qualification; line 3964's "None of this is in the repo" is followed by a superseded note citing tsconfig.json:21 + both constructors.
   - Done when: diff is ADDITIONS/TITLE-CHANGES only inside §13.7 — no historical analysis paragraphs deleted (Task 1's two replacements excepted, already committed).
   - Files: `docs/sdk-reference-v2.md`
   - Context: sprint-01 applied variant P — tsconfig.json:21 has the `@sparklinkplayjoy/hid` paths mapping; both services import `from '@sparklinkplayjoy/hid'` at line 2; constructors pass `usagePage: [65440], configs: []`; `npm run typecheck` + docs/tsc-baseline.txt (23) exist. §13.7 still describes the pre-fix state in present tense.
   - Edit list (4 sites; PM chose banner-notes over rewrite, PO-approved 2026-10-09):
     1. **After the preamble paragraph ending line 3778** ("…so nothing in CI surfaces these."): INSERT a standalone status line: "> **Status (2026-10-09, sprint-03): Site 1 was fixed in sprint-01 by adopting variant P** — tsconfig.json:21 `paths` mapping, type-only imports now `from '@sparklinkplayjoy/hid'`, constructors pass `usagePage: [65440]` + `configs: []`, and `npm run typecheck` + docs/tsc-baseline.txt now exist (baseline 23). The text below describes the **pre-fix** state and is kept as historical context; the "60 errors"/"no typecheck script" figures are as-of that measurement, not current."
     2. **Line 3780** ("**Site 1 — `KeyboardService.ts:2` and `DebugKeyboardService.ts:2` (identical line): broken.**"): APPEND to that bold line: " *(Superseded — fixed in sprint-01 via variant P; see the status note above. The 4 × TS2614 no longer occur.)*"
     3. **Line 3938** header "#### 13.7.3 Proposed fix for Site 1 — not applied": CHANGE to "#### 13.7.3 Proposed fix for Site 1 — applied in sprint-01 (variant P); proposal text kept as written".
     4. **Line 3964** ("None of this is in the repo. `src/` is unmodified; all measurements came from a scratch copy."): APPEND: " *(Superseded — as of sprint-01, variant P and the constructor edits ARE in the repo: tsconfig.json:21, KeyboardService.ts:39–43, DebugKeyboardService.ts:12–16. Measurements below were from the pre-fix scratch copy.)*"
   - Note: the status-row mention of these banners is already added in Task 1 edit 3 — do not duplicate.

## Findings (raw — PM routes at close)
- Policy (PO, 2026-10-10, Task 1 review): a text defect in ground truth (docs/sdk-reference-v2.md) must be a blocking FAIL item, not a QA-tier inline fix — after PASS no mechanism remains to fix it. Verify: CLAUDE.md QA tiers vs Reviewer verdict handling.
