# SPRINT: sprint-01-code-fixes

**GOAL:** Clean up the SDK integration (typecheck infrastructure, variant-P import fix, wrapper-pattern skill, type-error cleanup) before feature work.
**DONE-CRITERIA (sprint):** `npm run typecheck` exists with docs/tsc-baseline.txt recorded and ratcheted down toward zero; variant-P import fix landed per §13.7.3 with design intent preserved (filters:[], usagePage 65440, wrappers return Error); sdk-wrapper skill captured.
**Started:** 2026-10-08  ·  **Status:** IN PROGRESS

## Checkpoint
- Branch: `sprint-01-code-fixes`
- tsc baseline: **60** (docs/tsc-baseline.txt, 2026-10-08) — self-check gate ACTIVE
- Task 2 (2026-10-08): all 18 edits applied exactly per plan (commits 57305ef tsconfig + c15d44f services). typecheck 60 → **63**: 5 resolved (4× TS2614, 1× TS2304), 8 UNMASKED at KeyboardService.ts:137/194 (6× TS18048 `d.data?`, 2× TS2339 `serialNumber`) — EXPECTED, deferred to Task 4 (§13.7.2/§13.7.3 pt 4) per explicit PO ruling this session; lines left byte-identical. Build ✓. ⚠️ "≤ baseline" criterion arithmetically unreachable without pulling Task 4 forward — gate conflict flagged for Reviewer/PM in review file. Baseline NOT touched (ratchets down only).
- Cleanup: `.scratch/` holds 4 typecheck capture files (baseline-services.txt, post-services.txt, base-norm.txt, post-norm.txt) — PO may delete. `_to_delete/` empty.

## ▶ RUN THIS
Next: Task 2 is **HW-TEST** — **PO:** hands-on device check, then record the verdict (see Hardware gate). Test: manual Connect (unfiltered picker → open → getBaseInfo) · unplug/replug auto-reconnect · Debug-page connect on its separate XDKeyboard. Write `Hardware verdict: PASS — <date>` (or `FAIL — <date> → see F1` + an F1 block) into review-variant-p-imports.md, and set Task 2 → DONE (collapse to ✓) on PASS, or → IN-PROGRESS + "fix ONLY this — see review-variant-p-imports.md §F1" here on FAIL.
After Task 2 closes: Task 3 (sdk-wrapper skill), then Task 4 (type cleanup — owns the 8 deferred errors + serialNumber decision).
**No fix round is pending** — the Reviewer found no fail items. Task 3 can start once the PO's verdict lands (or be done in parallel if the PO prefers; it does not touch these files).

## Tasks
1. ✓ **typecheck script + baseline** — DONE 2026-10-08
2. **variant-P import fix** — [high-stakes] [hw] — STATUS: HW-TEST (Reviewer **PASS** 2026-10-08, 0 fail items; code done, commits 57305ef+c15d44f; awaiting PO hardware ✓ — details + 2 reviewer notes (R1 gate wording, R2 §13.7.4 doc error) in review-variant-p-imports.md)
3. **sdk-wrapper skill** — [trivial] — STATUS: PENDING
   - Done when: `.openclaude/skills/sdk-wrapper/` captures the KeyboardService wrapper pattern: connectedDevice check → ensureKeyboard().<method> → instanceof Error check → return Error (never throw); param types sourced from protocol-keyboard/src.
   - Files: `.openclaude/skills/sdk-wrapper/`
4. **type cleanup** — [high-stakes] — STATUS: PENDING
   - Done when: `@types/w3c-web-hid` installed as devDependency (checked for conflict with hid's own HIDDevice; if conflicting, document the alternative in the checkpoint); missing `Calibration` import fixed (KeyboardService.ts:799/813); serialNumber handling decided and logged; remaining §13.7 tsc errors (TS18048 `d.data` sites incl. the 8 unmasked by Task 2, TS2322 device literals — annotation-only per §13.7 design constraint) cleared.
   - Done when: docs/tsc-baseline.txt ratcheted DOWN to the new count (never up); `npm run typecheck` ≤ new baseline; no new errors in touched files.
   - Files: `package.json`, `docs/tsc-baseline.txt`, `src/services/KeyboardService.ts`, `src/services/DebugKeyboardService.ts`, plus any other files surfaced by the baseline run
