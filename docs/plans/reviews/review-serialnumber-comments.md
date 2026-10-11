# REVIEW: serialnumber-comments

**SPRINT GOAL:** Clear the two open PO-confirmed defects — purge the removed export feature from docs/pages/Debug.md, and land the serialNumber known-limitation comments (net +5 tsc errors, resolved 2026-10-10).
**TASK:** 2. Land the serialNumber known-limitation comments + resolved decision  ·  **TAG:** [high-stakes]
**DONE WHEN:** (verbatim from current-sprint.md Task 2)
- `grep -n -B2 "serialNumber" src/services/KeyboardService.ts` shows a known-limitation comment immediately above each of the 5 sites (L133, L134, L182, L190, L191)
- `npm run typecheck` → 23 errors, unchanged (KeyboardService.ts baseline is 0). If the count moves, STOP and report — comments must not change types.
- `grep -n "deserves a decision" docs/sdk-reference-v2.md` → no matches
- `grep -n "(134,138)" docs/sdk-reference-v2.md` shows `KeyboardService.ts` qualified onto that ref (backlog L30: bare cross-file refs are namespace-ambiguous)
- `grep -ni "serialNumber" docs/pages/Connect.md` → 1 match

## 📝 Worker notes & self-check
- Applied all 8 spec edits verbatim: 5 known-limitation comments in KeyboardService.ts (requestDevice serial compare + fallbackId; autoConnect targetHidDevice fallbackId; autoConnect targetSdkDevice compare + fallbackId), the Connect.md Auto-Connect sub-bullet, and the two sdk-reference-v2.md edits (§13.7.2 annotation + resolved-decision paragraph replacing the "deserves a decision" text).
- Mid-task self-caught: first draft of edits 7/8 drifted from spec-verbatim wording (wrong date, invented "sprint-05 measured" attribution) — corrected to the exact spec text before commit. Flagging for transparency; the committed diff is spec-verbatim.
- Self-check vs sdk-reference-v2.md: §13.7.2 (serialNumber limitation, net +5 finding, review-type-cleanup-4a.md §1 pointer) — consistent; edits confined to that section.
- Design intent preserved: filters:[] ☑ · usagePage 65440 ☑ · wrappers return Error ☑ (comments/docs only — no behavior touched)
- typecheck/build: ran `npx tsc --noEmit` anyway (source file touched): 23 errors = docs/tsc-baseline.txt 23, all pre-existing, 0 in KeyboardService.ts. No newly introduced errors. Gate formally N/A (inactive) but result recorded.
- Scope note: two MORE `serialNumber || 'unknown'` sites exist (~L1225, ~L1359, connect/disconnect listeners, grep `deviceStillPresent`) — outside the spec's 5 named sites; filed as a Findings line, not touched.
- Cleanup (from actual `ls`): `.scratch/` contains pm-notes.md (PM working memory — PO can empty); `_to_delete/` contains only .gitkeep (no cleanup needed).

## 🔍 Commits to review
Base: `aad81f6` (Task 1 verdict commit)   Head: `09948ba` (this task)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat <base>..<head>     then      git diff <base>..<head>
     A file touched outside this task's scope is a flag. -->
Fix-round ranges (added on each re-review):

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task (comments and docs only; no runtime behavior change).

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
**Result:**   ·  **Date:**   ·  **Fail count:**

### Failed items (FAIL only)
**Result:** PASS  ·  **Date:** 2026-10-11  ·  **Fail count:** 0

### Verification performed (commands + results)
- `git diff --stat aad81f6..09948ba` → 4 files: KeyboardService.ts (+8), Connect.md (+1), sdk-reference-v2.md (+13/−6... net), current-sprint.md (checkpoint + Findings line — standard Worker writes). No stray files; every hunk is within the task's named files + the Worker's own checkpoint.
- Done-when 1: `grep -n -B2 serialNumber src/services/KeyboardService.ts` → known-limitation comment immediately above all 5 sites (now L137, L139, L188, L197, L199; spec's L133/134/182/190/191 + the inserted comment lines = expected drift). All 8 spec edits verified VERBATIM against the diff, including the 4-line block above the requestDevice compare and the two sdk-ref edits.
- Done-when 2: `npm run typecheck` → **23 errors = baseline 23** (docs/tsc-baseline.txt first line), `grep -c KeyboardService` in typecheck output → **0**. Comments changed no types ✓
- Done-when 3: `grep -n "deserves a decision" docs/sdk-reference-v2.md` → no matches (exit 1) ✓
- Done-when 4: `grep -n "(134,138)"` → line 3906, cell now reads `KeyboardService.ts (134,138) (191,163) — as measured in sprint-01; positions have since drifted by ~1 line` — filename qualified, numbers not re-timed, per spec edit 7 ✓
- Done-when 5: `grep -ni serialNumber docs/pages/Connect.md` → exactly 1 match (L14, the Auto-Connect sub-bullet) ✓
- Cross-reference integrity: `docs/plans/archive/sprint-01-code-fixes/review-type-cleanup-4a.md` exists and contains the net-+5 `@types/w3c-web-hid` measurement cited by both the code comment and the Resolved paragraph ✓
- Design intent: `filters: []` untouched; both find() predicates' serialNumber compares unchanged (diff shows insertion-only in KeyboardService.ts — 8 added lines, 0 modified/deleted); wrappers still return Error ✓
- Tag correctness: [high-stakes] applied (touches KeyboardService → always high-stakes); NOT [hw] is correct — comment/docs-only, zero behavior change ✓
- Inline-fixable defect sweep: no typos/broken refs found in the landed text; Worker's self-caught draft drift (wrong date/invented attribution) was corrected pre-commit — committed diff is spec-verbatim ✓

### Findings (non-defect observations)
- None new. The Worker's Findings line (2 unannotated `serialNumber || 'unknown'` sites ~L1225/~L1359, grep `deviceStillPresent`) already covers the only out-of-scope observation; PM to route at close.
