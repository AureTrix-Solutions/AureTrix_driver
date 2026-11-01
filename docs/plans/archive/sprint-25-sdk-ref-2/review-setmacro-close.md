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
- [x] meets every "DONE WHEN" criterion above
- [x] diff scope matches the task (no stray files)
- [x] no design-intent violation
- [x] typecheck/build gate met where it applies — or N/A (docs-only)
- [x] tag is correct (high-stakes where required) — else auto-FAIL

---
## ✅ REVIEWER VERDICT
<!-- After ONE verification pass, RULE. -->
**Result:** PASS  ·  **Date:** 2026-11-01  ·  **Fail count:** 0

**Evidence (all grep-verified at head `29aa7c6`, range `7e374d4..29aa7c6`):**
- Diff scope: `git diff --stat` → ONLY `docs/sdk-reference-v2.md`, 4 insertions / 14 deletions. No stray files.
- All 7 Done-when greps match exactly: `KeyboardService\.ts:538`→0 · `no third argument`→1 · `KeyboardService\.ts:603`→4 · `Residual hazard`→2 · kept-greps `typed as bare \`string\` on \`XDKeyboard\``→1, `all collapse to the same value`→1, `is not called by`→1.
- `git diff -U0`: exactly 4 hunks (doc :105 checklist row, :1974 §7 prose, :4283 §14.9(a), :4321 §15 row) — precisely the plan's 4 anchored sites; each replacement matches the PM-specified text verbatim (incl. edit-4 severity `**High**`→`**Low** (closed in current code)` and the renamed risk cell). No edits outside the sites; no historical/banner-protected text touched.
- Independent re-verification of the doc's new factual claims against source:
  - Wrapper (`grep -n setMacro src/services/KeyboardService.ts`): `:603` `async setMacro(param: IMacroMode, macros: MacroType[], touchMode: string)` — third arg REQUIRED; `:608` forwards all three. Matches doc.
  - Zero app callers (`grep -rn setMacro src/` minus KeyboardService.ts): only two comment lines in ExportService.ts about the SDK-internal sync facade — no call sites. Matches "zero app callers as of sprint-25".
  - Import-path facade (`grep -n setMacro` sdk-keyboard dist/esm): `higherKey.d.ts:26` requires `touchMode`; package entry `index.d.ts:76` is the narrower 3-arg form. Matches the doc's facade/typings claims.
- Typecheck/build gate: N/A — docs-only task, no .ts/.vue touched. Design intent: n/a (no code).
- Tag [high-stakes] correct (SDK-correctness doc claims) — properly reviewed.

**Findings:** none. Cleanup (actual ls): `.scratch/` has review-notes.md (PO may delete); `_to_delete/` has .gitkeep only — no cleanup needed.

**Task 2 → DONE.** All sprint tasks DONE — awaiting PO sign-off at PM-close.
