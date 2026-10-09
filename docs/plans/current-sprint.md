# SPRINT: sprint-01-code-fixes

**GOAL:** Clean up the SDK integration (typecheck infrastructure, variant-P import fix, wrapper-pattern skill, type-error cleanup) before feature work.
**DONE-CRITERIA (sprint):** `npm run typecheck` exists with docs/tsc-baseline.txt recorded and ratcheted down toward zero; variant-P import fix landed per §13.7.3 with design intent preserved (filters:[], usagePage 65440, wrappers return Error); sdk-wrapper skill captured.
**Started:** 2026-10-08  ·  **Status:** IN PROGRESS

## Checkpoint
- Branch: `sprint-01-code-fixes`
- tsc baseline: **60** (docs/tsc-baseline.txt, 2026-10-08) — self-check gate ACTIVE
- Task 2 DONE 2026-10-08 (Reviewer PASS + PO hardware PASS; 60→63, 8 errors deferred to Task 4; R1 gate-wording + R2 §13.7.4 → see review + backlog).
- Task 3 DONE 2026-10-08 — non-code, gate N/A; all claims verified against source (3 real deviations documented, not fixed); 1 finding filed to backlog.
- Cleanup: `.scratch/` now empty (PO cleared the 4 earlier typecheck captures). `_to_delete/` empty. No cleanup needed.

## ▶ RUN THIS
Next: Task 4 (**type cleanup**, [high-stakes]) is PENDING — **Worker:** in a fresh window run "go". Before starting, PM must resolve R1 (gate-wording exception for unmasked-and-deferred errors) or Task 4 will hit the same unsatisfiable gate as Task 2.
Then: nothing — Task 4 is the last task. After it: "ALL TASKS DONE — awaiting PO sign-off".
**Carried forward for Task 4 / PM (from review-variant-p-imports.md, task 2):**
- **R1 — the self-check gate is unsatisfiable as worded** for an import fix whose latent errors a later task owns (63 > 60 AND a touched file gained them, though the delta is pure unmasking). Task 4 will hit the same wall: PM to add an "unmasked-and-deferred" exception clause or a baseline-note mechanism before Task 4 starts.
- **R2 — sdk-reference-v2.md §13.7.4 is factually wrong** (`configs` IS reachable via hid's internal `devices()` zero-match fallback → `requestDevice({filters:this.configs})`). Filed in backlog.md; a docs task should correct it. Do not re-derive it from that section.

## Tasks
1. ✓ **typecheck script + baseline** — DONE 2026-10-08
2. ✓ **variant-P import fix** — [high-stakes] [hw] — DONE 2026-10-08 (Reviewer PASS + PO hardware PASS; commits 57305ef+c15d44f; review-variant-p-imports.md)
3. ✓ **sdk-wrapper skill** — DONE 2026-10-08 (.openclaude/skills/sdk-wrapper/SKILL.md; canonical shape + 3 known deviations + batching + type-sourcing order incl. the protocol-keyboard broken-`types` caveat)
4. **type cleanup** — [high-stakes] — STATUS: PENDING
   - Done when: `@types/w3c-web-hid` installed as devDependency (checked for conflict with hid's own HIDDevice; if conflicting, document the alternative in the checkpoint); missing `Calibration` import fixed (KeyboardService.ts:799/813); serialNumber handling decided and logged; remaining §13.7 tsc errors (TS18048 `d.data` sites incl. the 8 unmasked by Task 2, TS2322 device literals — annotation-only per §13.7 design constraint) cleared.
   - Done when: docs/tsc-baseline.txt ratcheted DOWN to the new count (never up); `npm run typecheck` ≤ new baseline; no new errors in touched files.
   - Files: `package.json`, `docs/tsc-baseline.txt`, `src/services/KeyboardService.ts`, `src/services/DebugKeyboardService.ts`, plus any other files surfaced by the baseline run
