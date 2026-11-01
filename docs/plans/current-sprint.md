# SPRINT: sprint-24-sdk-ref-s9-verify

**GOAL:** Reconcile docs/sdk-reference-v2.md §9 (Config import/export & firmware) with the current implementation — repair drift from the sprint-12/21 ExportService work. PM-open swept every §9 claim against installed sdk-keyboard 1.0.20 (locked; protocol-keyboard 1.0.6): 4 in-§9 drifts found → Task 1; all other §9 claims RE-VERIFIED HOLD; out-of-§9 drift routed to backlog.md (Document issues) at PM-open.
**DONE-CRITERIA (sprint):** Task 1's 4 edits applied exactly as specced; `git show --stat` touches ONLY docs/sdk-reference-v2.md; every Done-when grep passes; Reviewer PASS. Docs-only sprint → typecheck/build gate N/A (no .ts/.vue touched), but hand off free of inline-fixable defects.

<!-- rev0 (2026-10-29): sprint opened by PM. Full claim sweep + bundle re-verification done at PM-open (evidence was in .scratch/pm-notes.md — private, recreated per PM session; the verified FACTS live in the Task 1 spec below). -->

## Checkpoint
- Branch: `sprint-24-sdk-ref-s9-verify` — clean at PM-open; base HEAD `59baae1`
- tsc baseline: 0 errors (docs/tsc-baseline.txt) — gate N/A (docs-only)
- Cleanup (actual `ls` at PM-open): `.scratch/` has pm-notes.md (PO may delete); `_to_delete/` empty (only .gitkeep)

## ▶ RUN THIS
**PM session (plan mode):** revise Task 1's Done-when criterion 5 — it is WRONG as written (see `## Findings` F1). All 4 edits (E1–E4) are already applied verbatim and committed (`563e0a0`); only the criterion needs revising. Proposed: scope the grep to the E4 line, e.g. `grep -cF "See §13.7 for all three import sites" docs/sdk-reference-v2.md` → `0`, plus a note that the residual `all three import sites` at :3783 is §13.7's own intro (backlogged, untouched). Revise + log `revN (date): <change>` on PO confirmation, update the checkpoint, then hand to the Reviewer: create `docs/plans/reviews/review-s9-verify.md` per the original block (Base `59baae1` → Head `563e0a0`, or the revision commit if the file changes), set Task 1 → IN-REVIEW, and overwrite this block with:
> **Reviewer session:** follow docs/plans/reviews/review-s9-verify.md

## Tasks
1. **Apply the 4 in-§9 drift fixes to docs/sdk-reference-v2.md** — [high-stakes] — STATUS: IN-PROGRESS
   - CHECKPOINT (Worker): E1–E4 applied verbatim, committed `563e0a0` (touches ONLY docs/sdk-reference-v2.md; hunks at :2262/:2389/:2397, all inside §9). Done-when greps rerun: 1,2,3a,3b,4,6 all PASS; 5 FAILS BY SPEC CONFLICT (see Findings F1 — routed to PM, no improvisation). Self-check done: both edited spans reread once — list numbering in §9 item 6 intact, backticks balanced, no double spaces at joins; no TODO/FIXME introduced. Cleanup (actual `ls`): `.scratch/` has pm-notes.md (PO may delete); `_to_delete/` empty — no cleanup needed from this task.
   - Files: `docs/sdk-reference-v2.md` ONLY. No source edits. No other doc sections (the status-table row :154 "`setMacro` not awaited" stays — that phrase is still true; the FALSE claim is the body sentence fixed in E1).
   - Why high-stakes: rewrites an SDK behavioral claim (E1) in the project's ground-truth reference.
   - **E1 — §9 intro, item 6: the setMacro race claim is WRONG** (bundle 1.0.20: `setImportData` ends `…await this.setSystem(r),this.setMacro(s),{success:!0}`; the `setMacro` it binds is ExportController's own SYNCHRONOUS method `setMacro(e){const{list:t}=e;localStorage.setItem("MacroList",JSON.stringify(t))}` — not the async hardware-writing facade `setMacro` of §7, which lives on HigherKeyController). Grep anchor (unique, :2265-2266): `can resolve before macros are written`.
     OLD (exact, incl. the doc's 3-space continuation indent):
     ```
        then logo) → `setSystem` → `setMacro`**. Note `setMacro` is fired **without `await`** —
        `{ success: true }` can resolve before macros are written.
     ```
     (The real file lines start with 3 spaces, not the 4 shown by this fence's own indent — match the FILE, i.e. `   then logo)…` / `   `{ success: true }`…`.)
     NEW (same 3-space continuation indent; re-wrap freely, meaning fixed):
     ```
        then logo) → `setSystem` → `setMacro`**. Note `setMacro` is fired **without `await`**, but
        the method `setImportData` binds is `ExportController`'s own **synchronous** `setMacro` — a
        single `localStorage.setItem("MacroList", …)`, no hardware write — so there is **no race**:
        it completes before `{ success: true }` resolves. It does **unconditionally overwrite**
        `localStorage["MacroList"]` with the imported file's macro list (usually empty), which is
        why `ExportService.importProfile` snapshots and restores that key around `importConfig`.
        (The hardware-writing async `setMacro` — §7 — is a different method and is not called by
        import.)
     ```
     Note: NEW text deliberately cites a method name, not line numbers — line refs rot (that is what E3 repairs). The snapshot/restore claim is verifiable: `grep -n "macroSnapshot" src/services/ExportService.ts` → hits at :891/:908 (grep-confirmed at PM-open).
   - **E2 — §9.2, stale bundle size.** Grep anchor (unique, :2386): ``192 K `dist/esm/index.js` bundle``. Actual at 1.0.20: 173,688 B. Replace `192 K` with `~170 K` in that anchor ONLY — the other `192 K` (:3678, §13 bundle table) is out of scope (backlogged).
   - **E3 — §9.2, stale app line ref.** Grep anchor (unique, :2394): ``already in the repo.** `src/services/ExportService.ts:3````. Replace `ExportService.ts:3` → `ExportService.ts:4` (the `import type { KeyboardConfig, Keyboards } …validate'` line moved to :4; the import TEXT quoted at :2395 still matches verbatim — leave it). The §13.7 copies of this stale ref (:3839/:3955) are out of scope (backlogged).
   - **E4 — §9.2, stale site count.** Grep anchor (unique, :2399): `See §13.7 for all three import sites and why the resolver setting`. Replace `for all three import sites` → `for the import sites` (src/ now has 5 validate-import sites: 2 prod + 3 test since sprint-21; §13.7's own enumeration/count is out of scope — backlogged).
   - Done when (each a command; Reviewer reruns all):
     - `grep -cF "can resolve before macros" docs/sdk-reference-v2.md` → `0`
     - `grep -cF 'localStorage.setItem("MacroList"' docs/sdk-reference-v2.md` → `1` (E1 NEW text landed)
     - `grep -cF '192 K `dist/esm/index.js` bundle' docs/sdk-reference-v2.md` → `0` AND `grep -cF "~170 K" docs/sdk-reference-v2.md` → `1`
     - `grep -cF "src/services/ExportService.ts:4" docs/sdk-reference-v2.md` → `1` (the two remaining `ExportService.ts:3` hits must both be in §13.7, lines ~3839/~3955 — verify with `grep -n`)
     - `grep -cF "all three import sites" docs/sdk-reference-v2.md` → `0`
     - `grep -n "macroSnapshot" src/services/ExportService.ts` → hits exist (:891/:908) — the E1 factual claim holds
     - `git show --stat HEAD` lists EXACTLY `docs/sdk-reference-v2.md`; every `git show HEAD` hunk header falls inside §9 (:2226–:2501) — expect ~3 hunks (the :2394/:2399 edits are close enough that git merges them); the status-table row :154 and §13.7 are NOT touched
     - Cleanup report from actual `ls .scratch/ _to_delete/` in the checkpoint line
   - Worker self-check before IN-REVIEW: reread the 4 edited spans ONCE for markdown sanity (list numbering in §9 item 6 intact, backticks balanced, no double spaces at line joins); fix inline-fixable defects before handoff.

## Findings (raw — PM routes at close)
- F1 (WRONG DONE-CRITERION — this sprint, Task 1): Done-when `grep -cF "all three import sites" docs/sdk-reference-v2.md → 0` is unsatisfiable within Task 1's scope. E4 replaces that phrase only at its §9.2 anchor (:2399); a second, distinct occurrence lives in §13.7's own intro (`grep -n "all three import sites" docs/sdk-reference-v2.md` → :3783), which E4 explicitly declares out of scope and Done-when 7 forbids touching. Verify: after applying E4 verbatim the grep returns 1 (commit `563e0a0`). Criterion needs PM revision (scope the grep to the E4 anchor phrase), not a Worker edit.
<!-- Out-of-§9 drift found at PM-open was routed DIRECTLY to backlog.md (Document issues) — PM is sole backlog writer; no need to re-route at close. -->
