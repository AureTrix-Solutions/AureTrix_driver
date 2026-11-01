# SPRINT: sprint-24-sdk-ref-s9-verify

**GOAL:** Reconcile docs/sdk-reference-v2.md §9 (Config import/export & firmware) with the current implementation — repair drift from the sprint-12/21 ExportService work. PM-open swept every §9 claim against installed sdk-keyboard 1.0.20 (locked; protocol-keyboard 1.0.6): 4 in-§9 drifts found → Task 1; all other §9 claims RE-VERIFIED HOLD; out-of-§9 drift routed to backlog.md (Document issues) at PM-open.
**DONE-CRITERIA (sprint):** Task 1's 4 edits applied exactly as specced; `git show --stat` touches ONLY docs/sdk-reference-v2.md; every Done-when grep passes; Reviewer PASS. Docs-only sprint → typecheck/build gate N/A (no .ts/.vue touched), but hand off free of inline-fixable defects.

<!-- rev0 (2026-10-29): sprint opened by PM. Full claim sweep + bundle re-verification done at PM-open (evidence was in .scratch/pm-notes.md — private, recreated per PM session; the verified FACTS live in the Task 1 spec below). -->
<!-- rev1 (2026-11-01): F1 upheld and revised — Done-when 5's bare `all three import sites` → 0 grep was unsatisfiable in scope (§13.7's own intro :3783 keeps the phrase; out of scope + already backlogged under Document issues). Grep re-scoped to the E4 anchor: old anchor → 0 AND new anchor → 1 (both re-verified this session). No Worker edit was needed. -->

## Checkpoint
- Branch: `sprint-24-sdk-ref-s9-verify` — clean at PM-open; base HEAD `59baae1`
- tsc baseline: 0 errors (docs/tsc-baseline.txt) — gate N/A (docs-only)
- Cleanup (actual `ls` at PM-open): `.scratch/` has pm-notes.md (PO may delete); `_to_delete/` empty (only .gitkeep)
- rev1 (2026-11-01, PM revision session): F1 upheld — Done-when 5 revised to the E4-anchor grep (old → 0 AND new → 1, both re-verified on tree); residual at :3783 = §13.7 intro, covered by the existing backlog Document-issues item, no new entry. Task 1 → IN-REVIEW; review-s9-verify.md created (Base `59baae1` → Head `563e0a0`); ▶ RUN THIS → Reviewer. Session start: tree clean, HEAD `5d56f8d`.

## ▶ RUN THIS
> **Reviewer session:** follow docs/plans/reviews/review-s9-verify.md

## Tasks
1. **Apply the 4 in-§9 drift fixes to docs/sdk-reference-v2.md** — [high-stakes] — STATUS: IN-REVIEW
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
     - `grep -cF "See §13.7 for all three import sites" docs/sdk-reference-v2.md` → `0` AND `grep -cF "See §13.7 for the import sites" docs/sdk-reference-v2.md` → `1` (rev1: scoped to the E4 anchor — the bare phrase `all three import sites` remains at §13.7's own intro (:3783), which is out of scope and backlogged under Document issues)
     - `grep -n "macroSnapshot" src/services/ExportService.ts` → hits exist (:891/:908) — the E1 factual claim holds
     - `git show --stat 563e0a0` lists EXACTLY `docs/sdk-reference-v2.md`; every `git show 563e0a0` hunk header falls inside §9 (§9 = from `## 9. Config import/export & firmware` to the next `## ` header — currently :2226–:2508, but judge by section boundary not a fixed range, since the E-edits themselves shifted §9's end) — expect ~3 hunks (the :2394/:2399 edits are close enough that git merges them); the status-table row :154 and §13.7 are NOT touched. (Pinned to `563e0a0` — at review time `HEAD` is the PM revision commit, planning files only.)
     - Cleanup report from actual `ls .scratch/ _to_delete/` in the checkpoint line
   - Worker self-check before IN-REVIEW: reread the 4 edited spans ONCE for markdown sanity (list numbering in §9 item 6 intact, backticks balanced, no double spaces at line joins); fix inline-fixable defects before handoff.

## Findings (raw — PM routes at close)
- F1 (WRONG DONE-CRITERION — this sprint, Task 1): Done-when `grep -cF "all three import sites" docs/sdk-reference-v2.md → 0` is unsatisfiable within Task 1's scope. E4 replaces that phrase only at its §9.2 anchor (:2399); a second, distinct occurrence lives in §13.7's own intro (`grep -n "all three import sites" docs/sdk-reference-v2.md` → :3783), which E4 explicitly declares out of scope and Done-when 7 forbids touching. Verify: after applying E4 verbatim the grep returns 1 (commit `563e0a0`). Criterion needs PM revision (scope the grep to the E4 anchor phrase), not a Worker edit. → **ROUTED (rev1, 2026-11-01): revised in place — Done-when 5 now greps the E4 anchor (old → 0 AND new → 1); residual :3783 is §13.7's own intro, already covered by the backlog Document-issues item; no new backlog entry.**
<!-- Out-of-§9 drift found at PM-open was routed DIRECTLY to backlog.md (Document issues) — PM is sole backlog writer; no need to re-route at close. -->
