# SPRINT: sprint-19-doc-verify

**GOAL:** Re-verify `.openclaude/skills/sdk-wrapper/SKILL.md` against the current `src/services/KeyboardService.ts` (and its cited companions) and correct every drifted claim — the skill was last source-verified in sprint-04 and the code has moved on.
**DONE-CRITERIA (sprint):** Every file/line reference and every code-shape claim in SKILL.md resolves against the source as it exists today (each confirmed by grep); no source file is modified; SKILL.md stays tight (≤100 lines).
**Started:** 2026-10-24  ·  **Status:** ALL TASKS DONE — awaiting PO sign-off
<!-- revN (YYYY-MM-DD): <what changed> -->

## Checkpoint
- Branch: `sprint-19-doc-verify`
- tsc baseline: N/A this sprint — docs-only, no `.ts`/`.vue` edits, so the self-check gate does not apply (`docs/tsc-baseline.txt` untouched)
- Base commit for the review diff: `04ea632`
- Task 1 → DONE: Reviewer PASS 2026-10-24 (verdict in docs/plans/reviews/review-sdk-skill-verify.md — all 8 Done-when re-run pass; 15+ refs spot-checked exact; diff SKILL.md+docs/plans/* only; design intent intact; fail count 0). Task 2 (review) → DONE. Sprint: ALL TASKS DONE — awaiting PO sign-off.
- Cleanup (actual `ls` at review close): `.scratch/` = pm-notes.md + review-notes.md (PO may delete); `_to_delete/` = empty — no cleanup needed.
<!-- Session-start check: on sprint branch (not main) + clean tree. Uncommitted changes → STOP, report. -->

## ▶ RUN THIS
Next: **PM-close** — PO sign-off first. On acceptance: "Act as PM per CLAUDE.md. All tasks DONE; assemble work + QA verdicts vs the goal for my sign-off; on acceptance archive, on rejection revise." PM routes F1 in ## Findings to backlog.md at close.

## Tasks

### 1. Re-verify and correct SKILL.md — [high-stakes] — STATUS: ✓ DONE (2026-10-24; 1a `d509dae` + 1b `46a925b`; Reviewer PASS — see docs/plans/reviews/review-sdk-skill-verify.md)

---

### 2. Independent review — [high-stakes] — STATUS: ✓ DONE (2026-10-24; PASS, fail count 0; verdict + spot-checks in docs/plans/reviews/review-sdk-skill-verify.md)

## Findings
<!-- One line per out-of-scope defect: DEFECT + WHERE TO VERIFY. Never a pre-written fix. The PM routes these. -->
(PM-open note: CLAUDE.md:36's stale "~1400 lines" for a 1605-line file was routed straight to backlog.md by the PM.)
- [skill] SKILL.md line 47 tells readers to route out-of-scope bugs to `docs/plans/backlog.md` directly; CLAUDE.md rule 8 routes Findings to current-sprint.md `## Findings` (PM is sole backlog writer). Pre-existing wording, out of Task 1's edit scope (found at review). Verify: grep "backlog.md" .openclaude/skills/sdk-wrapper/SKILL.md vs CLAUDE.md rule 8. (2026-10-24, Reviewer.)
