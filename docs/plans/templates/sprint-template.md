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
- tsc baseline: <N> errors (docs/tsc-baseline.txt)
- Cleanup: <none | .scratch/ has <x> (PO may delete) | _to_delete/ has <y> (PO must git rm)>   ← from an ACTUAL ls, not memory
<!-- Session-start check: on sprint branch (not main) + clean tree. Uncommitted changes → STOP, report.
     Do NOT record or update a commit hash here — git log is the source of truth.
     Updating a task's status REPLACES its one checkpoint line — never append a second paragraph.
     On resume, trust this checkpoint as the plan; consult only the compiler for results. -->

## ▶ RUN THIS
<!-- The single entry point. A fresh Worker runs the session-start check, then reads ONLY this
     block to know what's next. Whoever closes a task ADVANCES this block to the next task.
     On a Reviewer FAIL this block is replaced with the fix checklist. -->
Next: Task 1 — <title>. Do this task, then stop.

## Tasks
1. **<title>** — [trivial] | [high-stakes] (+ [hw] if on-device confirmation needed) — STATUS: PENDING
   - Done when: <criterion>   <!-- feasible by construction: checked against the plan's own edits/counts -->
   - Done when: <criterion>
   - Files: `src/...`
   <!-- For a researched task, the PM writes the edits HERE: numbered, file + grep-verified current text
        + replacement, expected post-task typecheck count, facts/call-chains confirmed. Worker APPLIES,
        never re-derives. A [trivial] task (full spec writable without opening a source file) is a one-liner. -->
2. **<title>** — [trivial] — STATUS: PENDING
   - Done when: <criterion>

<!-- STATUS values:
     PENDING → IN-PROGRESS → (DONE | IN-REVIEW → DONE)
     high-stakes:  IN-REVIEW → DONE (PASS) | → IN-PROGRESS (FAIL)
     [hw]:         IN-REVIEW → HW-TEST (Reviewer; PASS pending hw) → DONE (PO verdict, agent records) | → IN-PROGRESS (✗)
     Collapse a finished task to one line:  ✓ 1. <title> — DONE (YYYY-MM-DD) -->

<!-- ===== FAIL-mode ▶ RUN THIS looks like this (Reviewer writes it): =====
## ▶ RUN THIS — fix ONLY these (detail in review-<slug>.md)
- [ ] (F1) <short item> — see review-<slug>.md §F1
- [ ] (F2) <short item> — see review-<slug>.md §F2
======================================================================= -->

## Findings (raw — PM routes at close)
<!-- Any role that hits something OUTSIDE its task scope drops ONE line here (edit tool, never shell >>)
     and carries on — no formatting or backlog knowledge needed. State the DEFECT + WHERE TO VERIFY it,
     never a pre-written fix. The PM is the only one who moves lines out of here: future-sprint findings
     → backlog.md at close; this-sprint findings → folded into a later task's plan at PM-open. This
     section clears for free when the file resets to the IDLE stub at close. -->
- <none yet>

<!-- Keep this file under ~150 lines. It is a SNAPSHOT, not a log. Overwrite, don't append. -->

<!-- ===== PM-CLOSE CHECKLIST (ordered; one close commit; verify each file at the end) =====
     1. Verify sprint complete: all tasks DONE + criteria met + baseline final + waiver EXPIRED.
     2. Route Findings → backlog (one line + pointer each; defect + where-to-verify; no duplicated detail).
     3. Snapshot this file → docs/plans/archive/sprint-NN-<slug>/sprint.md (header: goal, dates, task count, signed-off-by PO).
     4. git mv this sprint's review files into docs/plans/archive/sprint-NN-<slug>/.
     5. UPDATE every backlog/other pointer that referenced those reviews → the new archive path.
     6. Add the index line to docs/plans/index.md.
     7. RESET this (LIVE) file to the IDLE stub below — not the archive copy.
     8. Commit all together; report. PO merges + deletes the branch.
     Verify: archive sprint.md = full snapshot; current-sprint.md = IDLE stub; backlog pointers repointed.
     ================================================================================= -->


=================  IDLE STUB (the whole file between sprints)  =================
<!-- At PM-close, after archiving, reset current-sprint.md to exactly this: -->

# No active sprint

COMPLETE — run PM-open for the next sprint.

## ▶ RUN THIS
No active sprint. To start one, open a fresh window and paste:
  Act as PM per CLAUDE.md. Plan the "<name>" sprint from docs/plans/backlog.md.
(Or a direct goal: Act as PM per CLAUDE.md. Goal: <...>.)