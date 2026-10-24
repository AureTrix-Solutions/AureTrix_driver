# SPRINT: sprint-16-eslint-recommended

**GOAL:** Switch ESLint's Vue preset from `flat/essential` to `flat/recommended` and land at 0 warnings (auto-fix + 2 manual template renames; no logic changes).
**DONE-CRITERIA (sprint):** `npm run lint` exits 0 with empty output; `npm run typecheck` exits 0; `npm run build` passes; eslint.config.mjs uses `flat/recommended`.
**Started:** 2026-10-23  ·  **Status:** ALL TASKS DONE — awaiting PO sign-off

## Checkpoint
- Branch: `sprint-16-eslint-recommended`
- tsc baseline: 0 errors (docs/tsc-baseline.txt)
- Cleanup (actual `ls` at Reviewer PASS, 2026-10-23): .scratch/ has pm-notes.md, review-notes.md, check-fix.cjs, eslint.recommended.mjs, lint-out.txt, tc-out.txt, build-out.txt (all gitignored; PO may delete). _to_delete/ empty.
- Base commit for review: `c256b7f`

## ▶ RUN THIS
ALL TASKS DONE — awaiting PO sign-off. PM-close: "Act as PM per CLAUDE.md. All tasks DONE; assemble work + QA verdicts vs the goal for my sign-off; on acceptance archive, on rejection revise."

## Tasks
1. **ESLint flat/essential → flat/recommended @ 0 warnings** — [high-stakes] — ✓ DONE 2026-10-23 (Worker commit `2c8a75a`, base `c256b7f`; Reviewer PASS, 0 fails — all 6 Done-when re-run green: preset flipped exactly one line, lint exit 0 empty output, LayoutPreview greps 0/1/1 with outer `layout` ref intact, typecheck 0, build ✓ 1.75s, tree clean; scope confirmed 15 .vue + config, zero .ts, formatting-only + the 2 intentional alias renames, script blocks untouched — docs/plans/reviews/review-eslint-recommended.md).

## Findings
<!-- Out-of-scope defects/ideas: ONE line each (defect + where to verify), edit tool only, never shell >>. -->
(none yet)
