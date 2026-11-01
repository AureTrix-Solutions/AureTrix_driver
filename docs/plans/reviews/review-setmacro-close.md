# REVIEW: setmacro-close

<!-- WORKER fills everything above the verdict line. REVIEWER fills the verdict section. -->

**SPRINT GOAL:** Refresh every stale app line-ref in docs/sdk-reference-v2.md outside §9 (backlog items a–e) and close the stale "app calls setMacro without touchMode" exposure claim across its 4 doc sites (item f), using grep-verified anchors only.
**TASK:** Task 2 — setMacro exposure-CLOSED rewrite (f)  ·  **TAG:** [high-stakes]
**DONE WHEN:**
- `grep -c "KeyboardService\.ts:538" docs/sdk-reference-v2.md` → 0
- `grep -c "no third argument" docs/sdk-reference-v2.md` → 1 (rev1: the edit-1 direct-SDK test instruction itself; the two stale app-side claims at ~:1974/~:4283 are both replaced)
- `grep -c "KeyboardService\.ts:603" docs/sdk-reference-v2.md` → 4 (one per edit)
- `grep -c "Residual hazard" docs/sdk-reference-v2.md` → 2 (edits 2 + 4)
- `grep -c "typed as bare \`string\` on \`XDKeyboard\`" docs/sdk-reference-v2.md` → 1 (kept)
- `grep -c "all collapse to the same value" docs/sdk-reference-v2.md` → 1 (kept)
- `grep -c "is not called by" docs/sdk-reference-v2.md` → 1 (kept)
- No edits outside the 4 specified sites; no historical/banner-protected body text rewritten.

## 📝 Worker notes & self-check
- Applied the plan's edits 1–4 verbatim to `docs/sdk-reference-v2.md` (§12.1 checklist row `setMacro touchMode reset bug`, §7 prose after the touchMode table, §14.9(a), §15 Known-issues row). Nothing else touched; no new Findings this session.
- Pre-edit anchor verification (grep targets): `KeyboardService.ts:538` in doc at 4 sites; wrapper signature `async setMacro(param: IMacroMode, macros: MacroType[], touchMode: string)` — grep `setMacro` in `src/services/KeyboardService.ts` → wrapper :603, forwards all 3 args :608.
- Self-check vs sdk-reference-v2.md: all 7 Done-when greps re-run post-edit → 0 / 1 / 4 / 2 / 1 / 1 / 1 ✓. Kept-greps confirm the `touchMode`-typed-as-`string` note, the collapse table caption, and the §15 `ExportController.setMacro` facade claim are untouched.
- Design intent preserved: filters:[] ☐ n/a · usagePage 65440 ☐ n/a · wrappers return Error ☐ n/a (docs-only task, no code touched)
- typecheck/build: N/A — no .ts/.vue touched (self-check gate skipped per checkpoint).

## 🔍 Commits to review
Base: `7e374d4` (PM rev1, last commit before task)   Head: `29aa7c6` (this task's edits)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat 7e374d4..29aa7c6     then      git diff 7e374d4..29aa7c6
     A file touched outside this task's scope is a flag. -->
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — not an [hw] task.

## ❓ Reviewer, please confirm
- [ ] meets every "DONE WHEN" criterion above
- [ ] diff scope matches the task (no stray files)
- [ ] no design-intent violation
- [ ] typecheck/build gate met where it applies — or N/A (docs-only)
- [ ] tag is correct (high-stakes where required) — else auto-FAIL

---
## ✅ REVIEWER VERDICT
<!-- After ONE verification pass, RULE. -->
**Result:** — (awaiting Reviewer)  ·  **Date:** —  ·  **Fail count:** —
