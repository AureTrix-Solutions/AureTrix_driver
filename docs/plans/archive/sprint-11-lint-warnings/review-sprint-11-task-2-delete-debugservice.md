# REVIEW: sprint-11 task-2 delete orphaned DebugKeyboardService + core docs

**SPRINT GOAL:** Ratchet ESLint warnings 221 → 0 honestly (real types + real dead-code removal, no new suppressions), delete the orphaned DebugKeyboardService, and end with the three deferred rules promoted to errors and docs/lint-baseline.txt at 0.
**TASK:** Task 2 — Delete orphaned DebugKeyboardService + core docs  ·  **TAG:** [high-stakes]
**DONE WHEN:**
- `_to_delete/DebugKeyboardService.ts` exists AND `src/services/DebugKeyboardService.ts` does NOT
- `npm run lint` → `137 problems (0 errors, 137 warnings)`
- `grep -rn DebugKeyboardService CLAUDE.md README.md .openclaude/skills/sdk-wrapper/SKILL.md` → nothing
- `npm run typecheck` exit 0
- `npm run build` passes

## 📝 Worker notes & self-check
- Re-verified the orphan claim first: `grep -rln DebugKeyboardService src/` → only the file itself. `mv` (not delete) into `_to_delete/`; PO does the `git rm` after sign-off.
- Doc edits: CLAUDE.md — deleted the Architecture bullet describing DebugKeyboardService; README.md — removed the 1 line in the services tree; SKILL.md — dropped `src/services/DebugKeyboardService.ts` from the frontmatter trigger list and deleted the trailing "DebugKeyboardService holds its own XDKeyboard… don't unify them" sentence in the Never-change section (the file no longer exists; the usagePage 65440 / ensureKeyboard guidance there is kept intact).
- All five Done-whens re-run exact: lint 137 (80 any / 54 unused / 3 pce — matches PM's predicted post-delete split); scoped grep exit 1 (nothing); typecheck exit 0; build ✓ 1.65s. Suppression gate: 0 new suppressions in `git diff 8b54b75..6fcb34c`.
- docs/lint-baseline.txt ratcheted 193 → 137 with one history line (down only).
- Self-check vs sdk-reference-v2.md: N/A — no SDK claim made or changed; DebugKeyboardService was orphaned app code (zero importers since 929d723).
- Design intent preserved: filters:[] ☑ · usagePage 65440 ☑ · wrappers return Error ☑ (no SDK-facing source touched; the only .ts change is a whole-file move).
- Note for Reviewer: `docs/pages/Debug.md` (4 mentions) and `docs/PAGES_OVERVIEW.md` (2) still contain the name — that is Task 3's scope ([trivial]), deliberately untouched here per the plan's Done-when scoping.

## 🔍 Commits to review
Base: `8b54b75` (Task 1 DONE)   Head: `6fcb34c` (this task's code/doc move) + the checkpoint/review-file commit that follows this file.
<!-- Reviewer: git diff --stat 8b54b75..6fcb34c → 4 files changed (the move shows as {src/services => _to_delete}/DebugKeyboardService.ts, 0 content lines); CLAUDE.md -1, README.md -1, SKILL.md ±2. Baseline-file update rides in the follow-up commit. -->
Fix-round ranges (added on each re-review):

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task. No hardware behavior changed: the deleted service had zero importers, and no SDK call path was edited.

## ✅ Verdict (Reviewer fills)
Verdict: **PASS** · Date 2026-10-12 · Fail count 0
Findings:
- All 5 Done-whens re-run exact by Reviewer: `_to_delete/DebugKeyboardService.ts` present + `src/services/DebugKeyboardService.ts` absent (git shows a 100% rename, 0 content lines changed — a pure move, no edit); `npm run lint` → `137 problems (0 errors, 137 warnings)`; scoped `grep -rn DebugKeyboardService CLAUDE.md README.md .openclaude/skills/sdk-wrapper/SKILL.md` → exit 1 (nothing); `npm run typecheck` exit 0; `npm run build` ✓ built in 1.61s.
- Orphan claim independently re-verified: `grep -rln DebugKeyboardService src/` → nothing (only the now-moved file, gone from src).
- Suppression gate clean: `git diff 8b54b75..HEAD | grep -E "^\+.*(as any|@ts-ignore|@ts-expect-error|eslint-disable)"` → nothing.
- Diff scope matches the task: the move + CLAUDE.md (-1) + README.md (-1) + SKILL.md (2 mentions dropped: frontmatter trigger + body sentence) + baseline ratchet + the checkpoint/review-file commit. No stray source files.
- Design intent preserved: no SDK-facing source touched (only .ts change is the whole-file move). Tag [high-stakes] correct (multi-file deletion task).
Reviewer's own Findings lines (for the PM to route): (none)
