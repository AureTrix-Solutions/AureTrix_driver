# ARCHIVE: sprint-19-doc-verify

**GOAL:** Re-verify `.openclaude/skills/sdk-wrapper/SKILL.md` against the current `src/services/KeyboardService.ts` (and its cited companions) and correct every drifted claim — the skill was last source-verified in sprint-04 and the code has moved on.
**DONE-CRITERIA (sprint):** Every file/line reference and every code-shape claim in SKILL.md resolves against the source as it exists today (each confirmed by grep); no source file is modified; SKILL.md stays tight (≤100 lines).
**Started:** 2026-10-24  ·  **Closed:** 2026-10-24  ·  **Tasks:** 3  ·  **Signed off by:** PO (2026-10-24)
<!-- rev1 (2026-10-24): expanded scope — Reviewer F1 (SKILL.md:47 routes findings straight to backlog.md, contradicting CLAUDE.md §8) judged in-goal (a contradicted-protocol claim IS a drifted claim); added Task 3 to fix it this sprint. -->

## Checkpoint (final)
- Branch: `sprint-19-doc-verify`
- tsc baseline: N/A this sprint — docs-only, no `.ts`/`.vue` edits, so the self-check gate does not apply (`docs/tsc-baseline.txt` untouched)
- Base commit for the review diff: `04ea632`; head at sign-off: `740032b`
- Task 1 → DONE; Task 2 → DONE; Task 3 → DONE (Reviewer PASS 2026-10-24, fail count 0; incremental verdict in review-sdk-skill-verify.md — archived alongside this file; commit `48a1c20`). **ALL TASKS DONE — PO signed off 2026-10-24.**
- Cleanup (actual `ls` 2026-10-24): `.scratch/` = pm-notes.md + review-notes.md (PO may delete); `_to_delete/` = empty (.gitkeep only) — no cleanup needed.
- PM-close final drift re-verification (2026-10-24): every SKILL.md claim re-grepped against source in 8 banked groups (`.scratch/pm-notes.md`) — NO DRIFT; SKILL.md 96 ln ≤ 100; no source file modified.

## Tasks (final state)

### 1. Re-verify and correct SKILL.md — [high-stakes] — STATUS: ✓ DONE (2026-10-24; 1a `d509dae` + 1b `46a925b`; Reviewer PASS — see review-sdk-skill-verify.md in this archive folder)

---

### 2. Independent review — [high-stakes] — STATUS: ✓ DONE (2026-10-24; PASS, fail count 0; verdict + spot-checks in review-sdk-skill-verify.md in this archive folder)

---

### 3. Fix SKILL.md findings-routing line (from Reviewer F1) — [high-stakes] — STATUS: ✓ DONE (2026-10-24; PASS, fail count 0; incremental verdict in review-sdk-skill-verify.md in this archive folder; commit `48a1c20`)
Tag rationale: SKILL.md is a protocol-teaching artifact and the fix touches CLAUDE.md §8 semantics; one edit, but the Research gate means it is not trivial. Review is incremental only (base `2d99766`).

**Spec (PM grep-verified 2026-10-24 — apply as-is, do not re-derive).** One edit in `.openclaude/skills/sdk-wrapper/SKILL.md` (locate with `grep -n "backlog" .openclaude/skills/sdk-wrapper/SKILL.md` → currently line 47):

1. Replace the sentence
   ``A genuine bug outside scope → one line in `docs/plans/backlog.md` (CLAUDE.md §8).``
   with
   ``A genuine bug outside scope → one line in the `## Findings` section of `docs/plans/current-sprint.md`; the PM routes it to backlog (CLAUDE.md §8 — the PM is the only writer of backlog.md).``

**Done when (all commands, pass/fail):**
- `grep -n 'one line in `docs/plans/backlog.md`' .openclaude/skills/sdk-wrapper/SKILL.md` → returns NOTHING.
- `grep -n '## Findings' .openclaude/skills/sdk-wrapper/SKILL.md` → returns the new routing sentence.
- `wc -l .openclaude/skills/sdk-wrapper/SKILL.md` → ≤ 100 (currently 96; edit is a one-line replacement).
- `git diff --name-only` → only `.openclaude/skills/sdk-wrapper/SKILL.md` (+ `docs/plans/*`).

## Findings (routed at close)
(PM-open note: CLAUDE.md:36's stale "~1400 lines" for a 1605-line file was routed straight to backlog.md by the PM.)
- [skill] F1 (SKILL.md:47 sends out-of-scope bugs directly to backlog.md, contradicting CLAUDE.md §8) → ROUTED by PM 2026-10-24 into Task 3 of this sprint — CLOSED (Task 3 DONE). No findings remain to route to backlog.
