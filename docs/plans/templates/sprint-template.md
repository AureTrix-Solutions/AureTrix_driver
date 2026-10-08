<!-- current-sprint.md has TWO states. Between sprints it is the IDLE stub at the very bottom of
     this file. At PM-open the PM OVERWRITES the whole file with the ACTIVE shape below. At PM-close
     the PM archives it and resets it back to the IDLE stub. Use the shape that matches the state. -->

=================  ACTIVE SHAPE (PM writes this at PM-open)  =================

# SPRINT: sprint-NN-<slug>

**GOAL:** <one sentence — what this sprint delivers>
**DONE-CRITERIA (sprint):** <how we know the goal is met, 1–2 lines>
**Started:** YYYY-MM-DD  ·  **Status:** IN PROGRESS
<!-- revN (YYYY-MM-DD): <what changed>   ← log revisions here, newest last -->

## Checkpoint
- Branch: `sprint-NN-<slug>`
- Last commit: `<hash>` — <message>
- tsc baseline: <N> errors (docs/tsc-baseline.txt)
<!-- Session-start check compares branch + last commit against this. On mismatch: STOP, report. -->

## ▶ RUN THIS
<!-- The single entry point. A fresh Worker runs the session-start check, then reads ONLY this
     block to know what's next. On a Reviewer FAIL this block is replaced with the fix checklist. -->
Next: Task 1 — <title>. Do this task, then stop.

## Tasks
1. **<title>** — [trivial] | [high-stakes] (+ [hw] if on-device confirmation needed) — STATUS: PENDING
   - Done when: <criterion>
   - Done when: <criterion>
   - Files: `src/...`
2. **<title>** — [trivial] — STATUS: PENDING
   - Done when: <criterion>

<!-- STATUS values:
     PENDING → IN-PROGRESS → (DONE | IN-REVIEW → DONE)
     high-stakes:  IN-REVIEW → DONE (PASS) | → IN-PROGRESS (FAIL)
     [hw]:         IN-REVIEW → HW-TEST (PASS pending hw) → DONE (all ✓) | → IN-PROGRESS (any ✗)
     Collapse a finished task to one line:  ✓ 1. <title> — DONE (YYYY-MM-DD) -->

<!-- ===== FAIL-mode ▶ RUN THIS looks like this (Reviewer writes it): =====
## ▶ RUN THIS — fix ONLY these (detail in review-<slug>.md)
- [ ] (F1) <short item> — see review-<slug>.md §F1
- [ ] (F2) <short item> — see review-<slug>.md §F2
======================================================================= -->

<!-- Keep this file under ~150 lines. It is a SNAPSHOT, not a log. Overwrite, don't append. -->


=================  IDLE STUB (the whole file between sprints)  =================
<!-- At PM-close, after archiving, reset current-sprint.md to exactly this: -->

# No active sprint

COMPLETE — run PM-open for the next sprint.

## ▶ RUN THIS
No active sprint. To start one, open a fresh window and paste:
  Act as PM per CLAUDE.md. Plan the "<name>" sprint from docs/plans/backlog.md.
(Or a direct goal: Act as PM per CLAUDE.md. Goal: <...>.)