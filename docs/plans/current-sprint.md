# SPRINT: sprint-01-code-fixes

**GOAL:** Clean up the SDK integration (typecheck infrastructure, variant-P import fix, wrapper-pattern skill, type-error cleanup) before feature work.
**DONE-CRITERIA (sprint):** `npm run typecheck` exists with docs/tsc-baseline.txt recorded and ratcheted down toward zero; variant-P import fix landed per §13.7.3 with design intent preserved (filters:[], usagePage 65440, wrappers return Error); sdk-wrapper skill captured.
**Started:** 2026-10-08  ·  **Status:** IN PROGRESS

## Checkpoint
- Branch: `sprint-01-code-fixes`
- tsc baseline: **60** (docs/tsc-baseline.txt, 2026-10-08) — self-check gate ACTIVE
- Task 2 DONE 2026-10-08 (Reviewer PASS + PO hardware PASS; 60→63, 8 errors deferred to Task 4; R1 gate-wording + R2 §13.7.4 → see review + backlog).
- Cleanup: `.scratch/` holds 4 typecheck capture files (baseline-services.txt, post-services.txt, base-norm.txt, post-norm.txt) — PO may delete. `_to_delete/` empty.

## ▶ RUN THIS
Next: Task 3 (**sdk-wrapper skill**, [trivial]) is PENDING — **Worker:** in a fresh window run "go", then build `.openclaude/skills/sdk-wrapper/` capturing the KeyboardService wrapper pattern per Task 3's "Done when" below (connectedDevice check → ensureKeyboard().<method> → instanceof Error check → return Error, never throw; param types sourced from protocol-keyboard/src). Read only that task's named files + the needed sdk-reference-v2.md sections. It is a docs/skill task: the self-check gate does NOT apply (non-code), and it touches no source.
Then: Task 4 (type cleanup, [high-stakes]) — owns the 8 errors unmasked by Task 2 at KeyboardService.ts:137/:194 plus the serialNumber decision.
**Carried forward for Task 4 / PM (from review-variant-p-imports.md, task 2):**
- **R1 — the self-check gate is unsatisfiable as worded** for an import fix whose latent errors a later task owns (63 > 60 AND a touched file gained them, though the delta is pure unmasking). Task 4 will hit the same wall: PM to add an "unmasked-and-deferred" exception clause or a baseline-note mechanism before Task 4 starts.
- **R2 — sdk-reference-v2.md §13.7.4 is factually wrong** (`configs` IS reachable via hid's internal `devices()` zero-match fallback → `requestDevice({filters:this.configs})`). Filed in backlog.md; a docs task should correct it. Do not re-derive it from that section.

## Tasks
1. ✓ **typecheck script + baseline** — DONE 2026-10-08
2. ✓ **variant-P import fix** — [high-stakes] [hw] — DONE 2026-10-08 (Reviewer PASS + PO hardware PASS; commits 57305ef+c15d44f; review-variant-p-imports.md)
3. **sdk-wrapper skill** — [trivial] — STATUS: PENDING
   - Done when: `.openclaude/skills/sdk-wrapper/` captures the KeyboardService wrapper pattern: connectedDevice check → ensureKeyboard().<method> → instanceof Error check → return Error (never throw); param types sourced from protocol-keyboard/src.
   - Files: `.openclaude/skills/sdk-wrapper/`
4. **type cleanup** — [high-stakes] — STATUS: PENDING
   - Done when: `@types/w3c-web-hid` installed as devDependency (checked for conflict with hid's own HIDDevice; if conflicting, document the alternative in the checkpoint); missing `Calibration` import fixed (KeyboardService.ts:799/813); serialNumber handling decided and logged; remaining §13.7 tsc errors (TS18048 `d.data` sites incl. the 8 unmasked by Task 2, TS2322 device literals — annotation-only per §13.7 design constraint) cleared.
   - Done when: docs/tsc-baseline.txt ratcheted DOWN to the new count (never up); `npm run typecheck` ≤ new baseline; no new errors in touched files.
   - Files: `package.json`, `docs/tsc-baseline.txt`, `src/services/KeyboardService.ts`, `src/services/DebugKeyboardService.ts`, plus any other files surfaced by the baseline run
