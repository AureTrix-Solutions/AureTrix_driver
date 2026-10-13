# REVIEW: sprint-11-task-11-promote-rules

**SPRINT GOAL:** Ratchet ESLint warnings 221 → 0 honestly (real types + real dead-code removal, no new suppressions), delete the orphaned DebugKeyboardService, and end with the three deferred rules promoted to errors and docs/lint-baseline.txt at 0 — mirroring the tsc-baseline ratchet (sprint-07).
**TASK:** Task 11 — Promote rules to error + final docs (FINAL task)  ·  **TAG:** [high-stakes]
**DONE WHEN:**
- `grep -n 'no-explicit-any\|no-unused-vars\|preserve-caught-error' eslint.config.mjs` shows all three at `"error"`
- `npm run lint` exit 0 → `0 problems`
- docs/lint-baseline.txt line 1 = `0`
- `grep -n "221" CLAUDE.md` → nothing, and the Commands-section sentence now says warnings ratcheted to 0 in sprint-11 with the three rules at error (≤2 lines — CLAUDE.md curation rule)
- typecheck 0

## 📝 Worker notes & self-check
- `eslint.config.mjs`: flipped the three rules `"warn"` → `"error"` at L28 (`no-explicit-any`), L30 (`no-unused-vars` — options block kept untouched: `ignoreRestSiblings: true` + `^_` argsIgnorePattern/varsIgnorePattern/destructuredArrayIgnorePattern, per locked PO decision 2), L36 (`preserve-caught-error`). Refreshed two comments now stale under error severity: the L27 tier header (`// Deferred to warn tier — ratchet-down tracked in backlog:` → `// Ratcheted 221 → 0 warnings in sprint-11; promoted to error:`) and the L28 trailing `// SDK-boundary anys` (removed — no deferred anys remain in lint scope; the surviving SDK-boundary anys were re-typed honestly in Tasks 4–6). L41-45 `**/*.d.ts` override `no-explicit-any: "off"` (Task-1 Vue-shim exemption) untouched, as planned.
- `CLAUDE.md` L22: replaced the "~221 deferred warnings are tolerated (exit 0) and ratchet down per the backlog item" sentence with one line: warnings ratcheted to 0 (sprint-11), three named rules enforced at `"error"`. Replacement contains no literal `221` (Done-when greps for it); second sentence (no test files) unchanged; ≤2-line curation rule met (1 line).
- `docs/lint-baseline.txt`: no edit — line 1 was already `0` after Task 10 and the rule-severity flip changes no counts (lint was clean at warn tier; at error tier it stays clean). Verify-only criterion.
- Self-check vs sdk-reference-v2.md: N/A — no SDK calls, signatures, or hardware paths touched; config + docs only.
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (untouched — zero `src/` files in this task's diff).
- typecheck/build: `npm run typecheck` → 0 errors (sentinel TYPECHECK_OK); `npm run build` → ✓ built in 1.63s. Baseline unchanged at 0/0.
- Suppression gate: `git diff -- CLAUDE.md eslint.config.mjs | grep -cE 'as any|@ts-ignore|@ts-expect-error|eslint-disable'` → `0`; src/ diff empty (this task touched no source files).

## 🔍 Commits to review
Base: `e2416d6` (Task 10, last reviewed state)   Head: `57ab083` (this task)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat e2416d6..57ab083     then      git diff e2416d6..57ab083
     A file touched outside this task's scope is a flag. -->
Expected scope: `eslint.config.mjs`, `CLAUDE.md`, `docs/plans/current-sprint.md` (checkpoint mechanics) only. `docs/lint-baseline.txt` intentionally NOT in the diff (verify-only).
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task; no hardware behavior touched.

## ❓ Reviewer, please confirm
- [x] meets every "DONE WHEN" criterion above
- [x] diff scope matches the task (no stray files)
- [x] no design-intent violation
- [x] typecheck/build gate met where it applies — 0/0, no unmasked errors
- [x] tag is correct ([high-stakes] as assigned by PM — config-level enforcement change for the whole repo)

---
## ✅ REVIEWER VERDICT
**Result:** PASS  ·  **Date:** 2026-10-13  ·  **Fail count:** 0

### Done-when re-runs (all exact)
1. `grep -n 'no-explicit-any\|no-unused-vars\|preserve-caught-error' eslint.config.mjs` → L28 `"error"`, L30 `["error", {…}]`, L36 `"error"` (the L44 hit is the `**/*.d.ts` override at `"off"` — pre-existing Task-1 Vue-shim exemption, intentionally untouched).
2. `npm run lint` → exit 0, zero output (0 problems).
3. `docs/lint-baseline.txt` line 1 = `0` (verify-only; not in diff, as planned).
4. `grep -n "221" CLAUDE.md` → nothing; L22 replacement sentence says warnings ratcheted to 0 (sprint-11), three named rules at `"error"` — 1 line, curation rule met.
5. `npm run typecheck` → exit 0, zero errors.

### Additional checks
- Diff scope: `git diff --name-only e2416d6..57ab083` → exactly CLAUDE.md, eslint.config.mjs, docs/plans/current-sprint.md (checkpoint mechanics). Zero `src/` files. lint-baseline.txt correctly absent (verify-only).
- Diff content review: only the three severity flips + two comment refreshes (stale warn-tier header, removed `// SDK-boundary anys` trailing comment) in eslint.config.mjs; one-line CLAUDE.md sentence swap. `no-unused-vars` options block (`ignoreRestSiblings` + three `^_` patterns) preserved untouched per locked PO decision 2.
- Suppression gate on diff: `grep -cE "^\+.*(as any|@ts-ignore|@ts-expect-error|eslint-disable)"` → 0.
- Build: `npm run build` → ✓ built in 1.58s (config-only change; build unaffected).
- Design intent: untouched (no source files in diff; filters:[], usagePage 65440, wrappers-return-Error all outside this change).
- Worker claims in notes all grep-verified accurate (L28/L30/L36 positions, comment text, CLAUDE.md L22).

### Failed items (FAIL only)
_(none)_

### Reviewer findings
_(none — clean config/docs-only task; no new out-of-scope observations)_
