# REVIEW: sprint-11 task-1 config ratchet

**SPRINT GOAL:** Ratchet ESLint warnings 221 → 0 honestly, delete the orphaned DebugKeyboardService, end with the three deferred rules promoted to errors and docs/lint-baseline.txt at 0.
**TASK:** Task 1 — Config ratchet + lint-baseline file  ·  **TAG:** [high-stakes]
**DONE WHEN:**
- `npm run lint 2>&1 | grep -oE '[0-9]+ problems.*'` → `193 problems (0 errors, 193 warnings)`
- Per-rule counts (`grep -oE '(no-explicit-any|no-unused-vars|preserve-caught-error)$' | sort | uniq -c`) → 108 / 54 / 31
- `npx eslint src/types/vue-shim.d.ts` → 0 warnings
- docs/lint-baseline.txt line 1 = `193`
- `npm run typecheck` exit 0

## 📝 Worker notes & self-check
- Replaced `"@typescript-eslint/no-unused-vars": "warn"` with the array form (ignoreRestSiblings + the three `^_` patterns); moved the `**/*.d.ts` block to AFTER the warn-rules block (flat-config later-wins, so the no-explicit-any exemption was previously dead — that was vue-shim's 1 warning); deleted the stale `(109)/(81)/(31)` counts from the three warn-rule comments.
- Created docs/lint-baseline.txt mirroring docs/tsc-baseline.txt: line 1 `193`, one history line, one gate line.
- All five Done-whens re-run exact: 193 total · 108/54/31 · vue-shim exit 0 · baseline line 1 = 193 · typecheck exit 0. Suppression gate clean (0 new `as any`/`@ts-ignore`/`@ts-expect-error`/`eslint-disable` in the diff).
- Self-check vs sdk-reference-v2.md: N/A — config/docs only, no SDK claim made.
- Design intent preserved: filters:[] ☑ · usagePage 65440 ☑ · wrappers return Error ☑ (no source touched).
- typecheck/build: typecheck exit 0. Build not run — no .ts/.vue source changed, so it cannot affect the build.

## 🔍 Commits to review
Base: `dcbac5a`   Head: `2db12f7`

## ❓ Reviewer, please confirm
- [x] meets every "DONE WHEN" criterion above
- [x] diff scope matches the task (no stray files — expect exactly eslint.config.mjs + docs/lint-baseline.txt)
- [x] no design-intent violation
- [x] typecheck/build gate met where it applies
- [x] tag is correct (high-stakes where required) — else auto-FAIL

---
## ✅ REVIEWER VERDICT
**Result:** PASS  ·  **Date:** 2026-10-12  ·  **Fail count:** 0

### Evidence (all re-run this session, fresh)
1. `npm run lint | grep -oE '[0-9]+ problems.*'` → `193 problems (0 errors, 193 warnings)` ✓
2. Per-rule counts → `108 no-explicit-any` / `54 no-unused-vars` / `31 preserve-caught-error` ✓ (exact match)
3. `npx eslint src/types/vue-shim.d.ts` → no output, exit 0 ✓
4. `head -1 docs/lint-baseline.txt` → `193` ✓
5. `npm run typecheck` → exit 0 ✓
6. Suppression gate: `git diff dcbac5a..2db12f7 | grep -cE '^\+.*(as any|@ts-ignore|@ts-expect-error|eslint-disable)'` → 0 ✓
7. Scope: `git diff --stat dcbac5a..2db12f7` → exactly eslint.config.mjs + docs/lint-baseline.txt (new); follow-up commit 69b93d3 is checkpoint/review-file mechanics only ✓
8. Final config verified line-by-line vs edit spec: array-form no-unused-vars (ignoreRestSiblings + argsIgnorePattern/varsIgnorePattern/destructuredArrayIgnorePattern `^_`) + rest-sibling comment; `**/*.d.ts` block now AFTER the warn-rules block (later-wins restores the exemption) with its comment; stale `(109)/(81)/(31)` counts deleted; baseline file mirrors tsc-baseline.txt format (count, `#` history, `# Gate:`) ✓
9. Design intent: no source touched — filters:[], usagePage 65440, wrappers-return-Error unaffected ✓
10. Tag: plan carries [high-stakes]; review performed accordingly ✓

### Findings
- None.
