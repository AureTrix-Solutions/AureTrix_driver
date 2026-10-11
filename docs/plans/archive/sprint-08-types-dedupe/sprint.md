# SPRINT ARCHIVE: sprint-08-types-dedupe

**GOAL:** Replace the hand-mirrored declarations in `src/types/types.ts` with types derived from the SDK's public type surface (PO-approved A1 + B1, 2026-10-11): `IDefKeyInfo` derived from the protocol-keyboard root import; `DksLayoutType`/`DksType` re-exported via a type-only deep-path import from sdk-keyboard.
**DONE-CRITERIA (sprint):** `npm run typecheck` clean (baseline 0), `npm run build` passes, all 13 consumer files import unchanged, and `src/types/types.ts` contains no literal `Layout_*` unions and no hand-written `keyValue` declaration. Reviewer PASS on the single [high-stakes] task.
**Started:** 2026-10-11  ·  **Closed:** 2026-10-11  ·  **Tasks:** 1  ·  **Signed off by PO:** 2026-10-11
**Branch:** `sprint-08-types-dedupe`  ·  **tsc baseline at close:** 0 errors (docs/tsc-baseline.txt)

## Tasks (final state)
1. ✓ **Dedupe src/types/types.ts against the SDK type surface** — [high-stakes] — DONE (Reviewer PASS 2026-10-11, 0 fails; Worker @ 8ae0faf; verdict + evidence in review-types-dedupe.md, this folder)

## Commits
- `e7aa4c5` PM-open — sprint plan (A1+B1, 1 task, high-stakes); backlog item removed
- `8ae0faf` Task 1 — dedupe src/types/types.ts against SDK type surface (A1+B1)
- `0fa4c50` Task 1 IN-REVIEW — review file + checkpoint
- `f54826f` Task 1 Reviewer PASS — verdict + evidence; task DONE; Findings line added
- PM-close commit (this snapshot + index row + backlog routing + IDLE reset) follows.

## Findings (routed at close)
- Done-when greps that count a PHRASE (`grep -c "import type"`) also match the spec's own comment prose — this task's criterion computed 4 vs expected 2 while the code was correct; count STATEMENTS with an anchor (`^import type`) instead. → routed to backlog.md Known issues [process] (2026-10-11).

## Cleanup at close
- `.scratch/`: pm-notes.md (PM working file, PO may delete) · `_to_delete/`: empty — no cleanup needed.
