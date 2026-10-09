# SPRINT: sprint-01-code-fixes

**GOAL:** Clean up the SDK integration (typecheck infrastructure, variant-P import fix, wrapper-pattern skill, type-error cleanup) before feature work.
**DONE-CRITERIA (sprint):** `npm run typecheck` exists with docs/tsc-baseline.txt recorded and ratcheted down toward zero; variant-P import fix landed per §13.7.3 with design intent preserved (filters:[], usagePage 65440, wrappers return Error); sdk-wrapper skill captured.
**Started:** 2026-10-08  ·  **Status:** IN PROGRESS

## Checkpoint
- Branch: `sprint-01-code-fixes`
- tsc baseline: **60** (docs/tsc-baseline.txt, 2026-10-08) — self-check gate ACTIVE
- Current count: **63** — Task 2 unmasked 8 latent errors; Task 4a/4b own bringing this back down.
- Task 2 DONE 2026-10-08 (Reviewer PASS + PO hardware PASS; 60→63, 8 errors deferred to Task 4; R1 gate-wording + R2 §13.7.4 → see review + backlog).
- Task 3 DONE 2026-10-08 — non-code, gate N/A; all claims verified against source (3 real deviations documented, not fixed); 1 finding filed to backlog.
- **R1 RESOLVED 2026-10-08 (PM ruling, PO-approved):** scoped waiver written into ▶ RUN THIS below — CLAUDE.md's self-check gate is UNCHANGED (deliberately; a permanent self-reported exception would loosen a safety gate for every future sprint on the word of the role that benefits from it). R1's premise was half right: Task 2 hit the wall because it was *one half* of a refactor that unmasked errors a later task owns. Task 4 is the other half — lowering the count is its actual job, so the "count ≤ baseline" clause is satisfiable as written and needs no exception. What it needs is narrower: a waiver for errors blocked on a PO hardware measurement that has not happened yet.
- **Task 4 SPLIT into 4a (mechanical) / 4b (behavior-adjacent),** PO-approved. 4a MUST precede 4b: installing `@types/w3c-web-hid` re-declares `HIDDevice` *globally* (§13.7.3 pt 4 — may collide with hid's own at `types.d.ts:27`), so until it lands no one knows which of 4b's errors still exist. Several TS2339 `serialNumber` diagnostics may vanish from the type install alone, with no code change.

**Findings for 4a/4b Workers — inherited so you need not read the archive:**
1. **Task 4's old Done-when was stale** (written before Task 2 landed). `type PairedDevice = { id: string; data: HIDDevice; productName: string }` already exists in BOTH services (KeyboardService.ts:6, DebugKeyboardService.ts:4) and all 18 union annotations are applied. The **TS2322 ×8 item is likely already satisfied** — the real deferred set is **TS18048 `d.data` ×6 + TS2339 `serialNumber` ×2**, not the §13.7.2 pre-Task-2 list. Measure; do not trust either list.
2. **The ratchet target is NOT zero.** 23 of the 60 baseline errors live in files 4a/4b never touch: `router/index.ts` 17, `profileStore.ts` 2, `connection.ts` 2, `travelProfilesStore.ts` 1, `main.ts` 1. Sprint goal says "ratcheted down *toward* zero" — consistent. **Do not chase router/index.ts** and do not treat a landing around ~35 as failure. Filed to backlog as its own candidate.
3. **Nothing enforces the baseline programmatically.** `npm run typecheck` is bare `tsc --noEmit`; docs/tsc-baseline.txt is read only by prose (CLAUDE.md, the sdk-wrapper skill, review files). R1 was always a wording fix, never a tooling fix — **no script change is needed or wanted.**
4. **Measure in `.scratch/` before promising a number.** Do not commit to a target count before running the scratch measurement; a global `HIDDevice` re-declaration moves counts in non-obvious ways.

- Cleanup: `.scratch/` empty. `_to_delete/` empty. No cleanup needed.

## ▶ RUN THIS
Next: **Task 4a** ([high-stakes]) is PENDING — **Worker:** in a fresh window run "go". Start with the `.scratch/` measurement; edit only after it lands.
Then: Task 4b ([high-stakes] [hw]) — but its **PO hardware pre-step must land on disk BEFORE the 4b Worker session opens** (see 4b below). Task 4b is the last task; after it: "ALL TASKS DONE — awaiting PO sign-off".

**Gate waiver (Task 4a/4b only, expires when 4b closes):** the following may remain past the self-check gate, each cited to docs/plans/reviews/review-variant-p-imports.md:
- KeyboardService.ts TS2339 `serialNumber` at :137/:194 — ONLY if the PO hardware measurement (4b pre-step) has not yet landed on disk. Once it lands, the decision IS in scope and this waiver no longer applies.
- All pre-existing errors in files outside 4a/4b's file list (notably router/index.ts ×17, profileStore.ts ×2, connection.ts ×2, travelProfilesStore.ts ×1, main.ts ×1). Out of sprint scope; the ratchet target is "down from 63", not zero.

Anything NOT on this list must be fixed, or the task FAILs. This waiver is not a CLAUDE.md rule and does not carry to any future sprint.

**Carried forward (from review-variant-p-imports.md, task 2):**
- **R1** — RESOLVED, see Checkpoint. No further action.
- **R2 — sdk-reference-v2.md §13.7.4 is factually wrong** (`configs` IS reachable via hid's internal `devices()` zero-match fallback → `requestDevice({filters:this.configs})`). Filed in backlog.md; a docs task should correct it. **Do not re-derive anything from that section.**

## Tasks
1. ✓ **typecheck script + baseline** — DONE 2026-10-08
2. ✓ **variant-P import fix** — [high-stakes] [hw] — DONE 2026-10-08 (Reviewer PASS + PO hardware PASS; commits 57305ef+c15d44f; review-variant-p-imports.md)
3. ✓ **sdk-wrapper skill** — DONE 2026-10-08 (.openclaude/skills/sdk-wrapper/SKILL.md; canonical shape + 3 known deviations + batching + type-sourcing order incl. the protocol-keyboard broken-`types` caveat)
4a. **type cleanup — deps + Calibration + baseline ratchet** — [high-stakes] — STATUS: PENDING
   - Done when: `@types/w3c-web-hid` collision MEASURED IN `.scratch/` FIRST (does its global `HIDDevice` clash with hid's own declaration at `types.d.ts:27`?), then installed as a devDependency if clean — else the alternative is documented in the checkpoint; decision logged either way.
   - Done when: missing `Calibration` import fixed (KeyboardService.ts:799/:813 TS2304 ×2).
   - Done when: docs/tsc-baseline.txt ratcheted DOWN to the measured post-4a count (never up), its breakdown line updated, `npm run typecheck` ≤ new baseline, and no new errors in files you touched. Waiver items above may remain.
   - Files: `package.json`, `docs/tsc-baseline.txt`, `src/services/KeyboardService.ts`, plus any other file the measurement surfaces.
4b. **type cleanup — d.data + device literals + serialNumber** — [high-stakes] [hw] — STATUS: PENDING (blocked on the PO pre-step)
   - **PRE-STEP — PO, on a real device, result written to disk BEFORE the Worker session opens** (a fresh Worker cannot see chat): at KeyboardService.ts:137 and :194, log all four values — `d.data.serialNumber`, `device.serialNumber`, `targetSdkDevice`'s `d.data.serialNumber`, `targetHidDevice.serialNumber` — and record them in the review file's Hardware check section. This settles whether §13.7.2's "both sides are `undefined` at runtime, so the comparison silently passes" claim is TRUE (it is unverified — `d.data` is the *live* WebHID device, which Chromium may populate with a real serial). It decides which physical keyboard a reconnect picks when two of the same model are paired; a code read cannot settle it.
     - real string on both sides → the comparison already works; keep it
     - `''`/`undefined` both sides → §13.7.2 holds; drop or replace it
     - one side populated only → the match is silently broken; make it real
   - Done when: the serialNumber decision is implemented from the RECORDED measurement (keep / drop / make-real) and logged in the checkpoint + review file.
   - Done when: `d.data` TS18048 ×6 cleared **annotation-only** per §13.7.2's design constraint — NEVER by completing a device literal with vendorId/usage/usagePage; both `find()` calls stay byte-identical unless the recorded measurement forces a change.
   - Done when: baseline ratcheted DOWN again; design intent intact (filters:[] unfiltered, usagePage 65440, wrappers return Error never throw); Reviewer PASS + PO hardware ✓.
   - Files: `src/services/KeyboardService.ts`, `src/services/DebugKeyboardService.ts`, `docs/tsc-baseline.txt`, `docs/plans/reviews/review-<slug>.md`.
