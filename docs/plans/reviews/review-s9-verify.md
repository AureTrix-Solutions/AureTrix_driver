# REVIEW: s9-verify — Task 1: apply the 4 in-§9 drift fixes to docs/sdk-reference-v2.md

<!-- WORKER fills everything above the verdict line. REVIEWER fills the verdict section.
     The PO's hardware verdict is RECORDED BY AN AGENT from the PO's plain-language outcome —
     the PO does not hand-edit this file. -->

**SPRINT GOAL:** Reconcile docs/sdk-reference-v2.md §9 (Config import/export & firmware) with the current implementation — repair drift from the sprint-12/21 ExportService work.
**TASK:** Apply the 4 in-§9 drift fixes (E1–E4) to docs/sdk-reference-v2.md  ·  **TAG:** [high-stakes]
**DONE WHEN:** (verbatim from current-sprint.md Task 1, criterion 5 as REVISED rev1; criterion 7 pinned to the task head commit — at review time `HEAD` is the PM revision commit, planning files only)
- `grep -cF "can resolve before macros" docs/sdk-reference-v2.md` → `0`
- `grep -cF 'localStorage.setItem("MacroList"' docs/sdk-reference-v2.md` → `1` (E1 NEW text landed)
- `grep -cF '192 K `dist/esm/index.js` bundle' docs/sdk-reference-v2.md` → `0` AND `grep -cF "~170 K" docs/sdk-reference-v2.md` → `1`
- `grep -cF "src/services/ExportService.ts:4" docs/sdk-reference-v2.md` → `1` (the two remaining `ExportService.ts:3` hits must both be in §13.7, lines ~3839/~3955 — verify with `grep -n`)
- `grep -cF "See §13.7 for all three import sites" docs/sdk-reference-v2.md` → `0` AND `grep -cF "See §13.7 for the import sites" docs/sdk-reference-v2.md` → `1` (rev1: scoped to the E4 anchor — the bare phrase `all three import sites` remains at §13.7's own intro (:3783), which is out of scope and backlogged under Document issues. Do NOT fail this criterion on that residual.)
- `grep -n "macroSnapshot" src/services/ExportService.ts` → hits exist (:891/:908) — the E1 factual claim holds
- `git show --stat 563e0a0` lists EXACTLY `docs/sdk-reference-v2.md`; every `git show 563e0a0` hunk header falls inside §9 (§9 = from `## 9. Config import/export & firmware` to the next `## ` header — currently :2226–:2508, but judge by section boundary not a fixed range, since the E-edits themselves shifted §9's end) — expect ~3 hunks (the :2394/:2399 edits are close enough that git merges them); the status-table row :154 and §13.7 are NOT touched
- Cleanup report from actual `ls .scratch/ _to_delete/` in the checkpoint line (Worker checkpoint, commit `5d56f8d`)

## 📝 Worker notes & self-check
- E1–E4 applied verbatim to §9 and committed as `563e0a0`: E1 rewrote §9 intro item 6 (setMacro is a deliberate fire-and-forget inside the SDK's `setImportData` — the old "race, fixed in SDK" claim was false; bundle 1.0.20 has no such fix), E2 corrected the §9.2 bundle-size note (old `192 K \`dist/esm/index.js\` bundle` → `~170 K`), E3 corrected `ExportService.ts:3` → `:4`, E4 re-phrased the §9.2 site-count sentence (`for all three import sites` → `for the import sites`; src/ now has 5 validate-import sites since sprint-21 — §13.7's own enumeration/count left untouched, backlogged).
- Self-check vs sdk-reference-v2.md: both edited spans reread once — §9 item-6 list numbering intact, backticks balanced, no double spaces at joins, no TODO/FIXME introduced. Done-when greps rerun at checkpoint: 1, 2, 3a, 3b, 4, 6 PASS; criterion 5 FAILED BY SPEC CONFLICT (bare phrase residual at §13.7 intro) → routed as F1, PM revised the criterion (rev1) — no Worker improvisation, no second edit to the doc.
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (untouched — docs-only sprint, no source files)
- typecheck/build: N/A (docs-only; no .ts/.vue touched)

## 🔍 Commits to review
Base: `59baae1` (branch point)   Head: `563e0a0` (E1–E4 applied; sole doc-content commit)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat <base>..<head>     then      git diff <base>..<head>
     A file touched outside this task's scope is a flag. -->
Fix-round ranges (added on each re-review): <base2>..<head2>, ...

Context commits (not review content): `f2ff0cf` = PM-open plan; `5d56f8d` = Worker checkpoint + F1 routed; the rev1 PM-revision commit (planning files only — current-sprint.md + this review file; sdk-reference-v2.md unchanged since `563e0a0`).

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task (documentation reconciliation; no hardware behavior changed).

## ❓ Reviewer, please confirm
- [x] meets every "DONE WHEN" criterion above (criterion 5 as REVISED — the :3783 residual is expected, not a defect) — **7/7 PASS.** C1 `can resolve before macros` → 0 ✓ · C2 `localStorage.setItem("MacroList"` → 1 ✓ · C3 old `192 K …bundle` → 0 ✓ AND `~170 K` → 1 ✓ · C4 `src/services/ExportService.ts:4` → 1 ✓ · C5 old `See §13.7 for all three import sites` → 0 ✓ AND new `See §13.7 for the import sites` → 1 ✓ · C6 `macroSnapshot` in ExportService.ts → hits at :891/:907/:908 ✓ · C7 scope — see below.
- [x] diff scope matches the task (only docs/sdk-reference-v2.md; only §9 hunks) — **PASS.** `git show --stat 563e0a0` lists EXACTLY `docs/sdk-reference-v2.md` (11 insertions, 5 deletions). Exactly 3 hunk headers: `@@ -2262,8 +2262,14 @@`, `@@ -2383,7 +2389,7 @@`, `@@ -2391,12 +2397,12 @@`. §9 boundary re-derived this session (`^## ` headers): `## 9. Config import/export & firmware` :2226 → `## 10. Shared types…` :2509, so §9 = :2226–:2508; all three post-image ranges fall inside. Status-table row :154 untouched (earliest hunk starts at :2262); §13.7 (`### 13.7` :3779) untouched. The other 2 files in the `59baae1..563e0a0` range (backlog.md, current-sprint.md) belong to the carved-out context commits `f2ff0cf` (planning only: backlog.md +1, current-sprint.md +54) and `5d56f8d` (current-sprint.md only) — `git log --oneline 59baae1..563e0a0` confirms just those two precede the task commit.
- [x] no design-intent violation — **PASS.** The task commit changes zero source files, so `filters: []`, `usagePage: 65440` semantics and wrappers-return-Error are untouched in code; the edited §9 prose (import/export write order, §9.2 validator-import guidance) makes no design-intent claim either way.
- [x] typecheck/build gate met where it applies — N/A (docs-only) — **confirmed N/A:** 0 `.ts`/`.vue` files in `563e0a0`, so the self-check gate is correctly inactive for this task.
- [x] tag is correct ([high-stakes] — rewrites an SDK behavioral claim in the ground-truth reference) — else auto-FAIL — **tag correct, no auto-FAIL.** E1 rewrites a behavioral claim about `setImportData`, which is exactly the high-stakes case.

---
## ✅ REVIEWER VERDICT
<!-- After ONE verification pass, RULE. Don't keep investigating. A runtime/behavior question goes
     to the PO hardware check, not more static analysis. Output = PASS/FAIL + findings + your own
     Findings one-liners (into current-sprint.md). Do NOT plan task order/parallelism. -->
**Result:** ✅ **PASS**  ·  **Date:** 2026-11-01  ·  **Fail count:** 0

Task 1 → **DONE**. All 7 Done-when criteria pass, including criterion 5 as revised by rev1. No inline-fixable
defects found (QA tier) — the authored prose is clean, so nothing is being handed back for a fix-round.

**E1 (the high-stakes item) independently verified against installed sdk-keyboard 1.0.20** — not taken on
trust from the plan. The rewritten claim is *correct on all three of its assertions*:

1. **`setMacro` really is un-awaited.** Bundle: `setImportData(e){…await this.setKeyboards(n),await
   this.setLighting(t),await this.setSystem(r),this.setMacro(s)…}` — the trailing `setMacro(s)` has no
   `await`, so the *old* doc's premise ("fired without `await`") was factually right.
2. **There are two distinct `setMacro` methods, and `setImportData` binds the sync one.** Widening the
   grep to `(async )?setMacro\([^)]*\)\{` returns exactly two definitions:
   - `setMacro(e){const{list:t}=e;localStorage.setItem("MacroList",JSON.stringify(t))}` — synchronous,
     single `localStorage` write, **no hardware call**; sits beside `setSystem`/`setCustomLight`/
     `setImportData`, i.e. ExportController's own.
   - `async setMacro(e,t,r,n="1.0.5"){…}` — async, hardware-writing, sits beside `getMacro`/`getRs`.
   The `.d.ts` files settle attribution beyond doubt: `dist/esm/src/controller/export.d.ts:22` declares
   **`private setMacro;`** (so the public §7 API cannot be this one, and `this.setMacro(s)` binds it),
   while `dist/esm/src/controller/higherKey.d.ts:26` declares `setMacro(param: IMacroMode, macros:
   MacroType[], touchMode: string, v?: string): Promise<any>` — the async hardware method, on
   HigherKeyController, exactly as the doc says. The `private` modifier is corroboration the doc does
   not even claim.
3. **∴ "no race" is right** — a synchronous method cannot be left pending, so it necessarily completes
   before `{ success: true }` resolves. **"Unconditionally overwrite" is right** — the body is a bare
   `setItem` with no guard or merge. The snapshot/restore rationale is right too: `macroSnapshot` at
   ExportService.ts :891 (`getItem('MacroList')`), :907 (`if (macroSnapshot !== null)`), :908
   (`setItem('MacroList', macroSnapshot)`).

**E2/E3/E4 verified against the tree:** `dist/esm/index.js` is 173,688 B on disk → `~170 K` is accurate
and the old `192 K` was stale; `sed -n '1,6p' src/services/ExportService.ts` shows line **4** is the
`…/dist/esm/src/utils/validate` type import, so `:3` → `:4` is a correct repair and the quoted import text
beside it still matches verbatim; the E4 phrase is now count-agnostic ("the import sites"), which is right
given src/ has 5 validate-import sites, and the neighbouring sentence says "A live example" (singular) so
no residual count claim survives.

**Criterion 4's ~3839/~3955 vs actual :3845/:3961 — expected drift, not a defect.** The criterion itself
says to judge by section boundary rather than fixed line numbers, and the arithmetic accounts for the
difference exactly: the task commit is 11 insertions − 5 deletions = **+6 net lines**, all added in §9
above both hits. 3839 + 6 = 3845; 3955 + 6 = 3961. Nothing moved; both residual `ExportService.ts:3`
hits are inside §13.7 as required.

**Reviewer process note (no bearing on the verdict):** my first bundle grep for `setMacro` used a
4-char param window and therefore *silently missed* the async definition, reporting "no async setMacro
exists." That would have produced a finding accusing correct documentation of inventing a method. I
caught it before ruling because §7's own signature contradicted the result. Re-running with a wide param
window found both definitions and vindicated E1. Recorded here as a caution that a zero-match result
from a bounded regex is not evidence of absence.

### Failed items (FAIL only)
None — PASS.

### Findings (non-defect observations, for the PM to route)
- **F-R1 (out of scope, already backlogged — no new entry needed):** the bare phrase `all three import
  sites` still resolves at §13.7's own intro (`grep -n "all three import sites" docs/sdk-reference-v2.md`
  → :3783), and two stale `ExportService.ts:3` refs remain in §13.7 (:3845, :3961 post-drift). All three
  are exactly the items rev1 declared out of Task 1's scope and covered by the existing backlog
  Document-issues entry. Confirming them here so the PM does not treat them as new drift; if the backlog
  entry cites the pre-drift line numbers ~3839/~3955, they should be read as ~3845/~3961 now.

**Cleanup (actual `ls`):** `.scratch/` holds `pm-notes.md` (PO may delete) and this review's
`review-notes.md`; `_to_delete/` is **empty** — no `git rm` needed.
