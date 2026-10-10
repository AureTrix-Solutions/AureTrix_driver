# REVIEW: sdk-ref-banner-notes

**SPRINT GOAL:** sdk-reference-v2.md §13.7 states the verified truth about `configs` reachability and carries the current repo state.
**TASK:** Banner-note §13.7 staleness (pre-variant-P text)  ·  **TAG:** [high-stakes]
**DONE WHEN:**
- §13.7 preamble carries a status note that Site 1 was fixed in sprint-01 via variant P and the text below is pre-fix history; grep "Status (2026-10-09" or equivalent in the §13.7 preamble.
- §13.7.3 header no longer reads as currently-unapplied without qualification; line 3964's "None of this is in the repo" is followed by a superseded note citing tsconfig.json:21 + both constructors.
- Diff is ADDITIONS/TITLE-CHANGES only inside §13.7 — no historical analysis paragraphs deleted (Task 1's two replacements excepted, already committed).

## 📝 Worker notes & self-check
- Applied the PM's 4-edit list verbatim (facts re-verified this session before writing, per rule 6):
  1. §13.7 preamble (:3780): blockquote status note — variant P adopted in sprint-01 (tsconfig.json:21 paths mapping, type-only imports now from '@sparklinkplayjoy/hid', constructors pass usagePage:[65440] + configs:[], typecheck script + baseline 23 now exist); text below marked pre-fix history, "60 errors"/"no typecheck script" marked as-of.
  2. Site 1 heading (:3783): appended *(Superseded — fixed in sprint-01 via variant P; … 4 × TS2614 no longer occur.)*
  3. §13.7.3 header (:3940): "— not applied" → "— applied in sprint-01 (variant P); proposal text kept as written".
  4. "None of this is in the repo" (:3966): appended *(Superseded — … tsconfig.json:21, KeyboardService.ts:39–43, DebugKeyboardService.ts:12–16 …)*.
- Self-check vs sdk-reference-v2.md: facts cited in the notes verified against live repo — tsconfig.json paths line for @sparklinkplayjoy/hid present (line 21); both service files line 2 `import type { Device, HIDDevice } from '@sparklinkplayjoy/hid'`; both constructors pass `usagePage: [65440]` and `configs: []` (KeyboardService.ts:39–43, DebugKeyboardService.ts:12–16); package.json has `"typecheck": "tsc --noEmit"`; docs/tsc-baseline.txt = 23.
- Diff scope: `git diff --stat` = 1 file, 5 insertions / 3 deletions; the 3 deleted lines are exactly the 3 lines that received appended notes (no analysis paragraph removed). Criterion 3 met.
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (untouched) — docs-only task, no source changes.
- typecheck/build: N/A (docs-only; `git diff --stat` confirms no .ts/.vue touched; baseline stays 23).

## 🔍 Commits to review
Base: `21a0eca` (task 1 reviewer PASS)   Head: `a16bf5a` (task 2 doc edits) + the handoff commit adding this file
<!-- Reviewer runs: git diff --stat <base>..<head> then git diff <base>..<head> -->
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task (documentation only; no hardware behavior touched).

## ❓ Reviewer, please confirm
- [ ] meets every "DONE WHEN" criterion above
- [ ] diff scope matches the task (no stray files — only docs/sdk-reference-v2.md + handoff artifacts)
- [ ] no design-intent violation
- [ ] typecheck/build gate met where it applies — N/A (docs-only; baseline unchanged at 23)
- [ ] tag is correct (high-stakes where required) — else auto-FAIL

---
## ✅ REVIEWER VERDICT
<!-- After ONE verification pass, RULE. -->
**Result:** PASS / FAIL  ·  **Date:** YYYY-MM-DD  ·  **Fail count:** <n>

### Failed items (FAIL only)
(none yet)
