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
- [ ] meets every "DONE WHEN" criterion above
- [ ] diff scope matches the task (no stray files)
- [ ] no design-intent violation
- [ ] typecheck/build gate met where it applies — 0/0, no unmasked errors
- [ ] tag is correct ([high-stakes] as assigned by PM — config-level enforcement change for the whole repo)

---
## ✅ REVIEWER VERDICT
<!-- After ONE verification pass, RULE. Don't keep investigating. A runtime/behavior question goes
     to the PO hardware check, not more static analysis. Output = PASS/FAIL + findings + your own
     Findings one-liners (into current-sprint.md). Do NOT plan task order/parallelism. -->
**Result:** ___  ·  **Date:** ____-__-__  ·  **Fail count:** ___

### Failed items (FAIL only)
_(none yet)_
