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
- [ ] meets every "DONE WHEN" criterion above (criterion 5 as REVISED — the :3783 residual is expected, not a defect)
- [ ] diff scope matches the task (only docs/sdk-reference-v2.md; only §9 hunks)
- [ ] no design-intent violation
- [ ] typecheck/build gate met where it applies — N/A (docs-only)
- [ ] tag is correct ([high-stakes] — rewrites an SDK behavioral claim in the ground-truth reference) — else auto-FAIL

---
## ✅ REVIEWER VERDICT
<!-- After ONE verification pass, RULE. Don't keep investigating. A runtime/behavior question goes
     to the PO hardware check, not more static analysis. Output = PASS/FAIL + findings + your own
     Findings one-liners (into current-sprint.md). Do NOT plan task order/parallelism. -->
**Result:** PENDING  ·  **Date:** YYYY-MM-DD  ·  **Fail count:** <n>

### Failed items (FAIL only)
