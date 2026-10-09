# SPRINT: sprint-01-code-fixes

**GOAL:** Clean up the SDK integration (typecheck infrastructure, variant-P import fix, wrapper-pattern skill, type-error cleanup) before feature work.
**DONE-CRITERIA (sprint):** `npm run typecheck` exists with docs/tsc-baseline.txt recorded and ratcheted down toward zero; variant-P import fix landed per §13.7.3 with design intent preserved (filters:[], usagePage 65440, wrappers return Error); sdk-wrapper skill captured.
**Started:** 2026-10-08  ·  **Status:** IN PROGRESS

## Checkpoint
- Branch: `sprint-01-code-fixes`
- tsc baseline: **60** (docs/tsc-baseline.txt, 2026-10-08) — self-check gate ACTIVE
- Current count: **61** (baseline 60 — see 4a's baseline note below; the standing waiver covers the 1-error excess). Was 63 after Task 2 unmasked 8 latent errors; 4a resolved the 2 `Calibration` TS2304s.
- Task 2 DONE 2026-10-08 (Reviewer PASS + PO hardware PASS; 60→63, 8 errors deferred to Task 4; R1 gate-wording + R2 §13.7.4 → see review + backlog).
- Task 3 DONE 2026-10-08 — non-code, gate N/A; all claims verified against source (3 real deviations documented, not fixed); 1 finding filed to backlog.
- **R1 RESOLVED 2026-10-08 (PM ruling, PO-approved):** scoped waiver written into ▶ RUN THIS below — CLAUDE.md's self-check gate is UNCHANGED (deliberately; a permanent self-reported exception would loosen a safety gate for every future sprint on the word of the role that benefits from it). R1's premise was half right: Task 2 hit the wall because it was *one half* of a refactor that unmasked errors a later task owns. Task 4 is the other half — lowering the count is its actual job, so the "count ≤ baseline" clause is satisfiable as written and needs no exception. What it needs is narrower: a waiver for errors blocked on a PO hardware measurement that has not happened yet.
- **Task 4 SPLIT into 4a (mechanical) / 4b (behavior-adjacent),** PO-approved. 4a MUST precede 4b: installing `@types/w3c-web-hid` re-declares `HIDDevice` *globally* (§13.7.3 pt 4 — may collide with hid's own at `types.d.ts:27`), so until it lands no one knows which of 4b's errors still exist. Several TS2339 `serialNumber` diagnostics may vanish from the type install alone, with no code change.

**Findings for 4a/4b Workers — inherited so you need not read the archive:**
1. **Task 4's old Done-when was stale** (written before Task 2 landed). `type PairedDevice = { id: string; data: HIDDevice; productName: string }` already exists in BOTH services (KeyboardService.ts:6, DebugKeyboardService.ts:4) and all 18 union annotations are applied. The **TS2322 ×8 item is likely already satisfied** — the real deferred set is **TS18048 `d.data` ×6 + TS2339 `serialNumber` ×2**, not the §13.7.2 pre-Task-2 list. Measure; do not trust either list.
2. **The ratchet target is NOT zero.** 23 of the 60 baseline errors live in files 4a/4b never touch: `router/index.ts` 17, `profileStore.ts` 2, `connection.ts` 2, `travelProfilesStore.ts` 1, `main.ts` 1. Sprint goal says "ratcheted down *toward* zero" — consistent. **Do not chase router/index.ts** and do not treat a landing around ~35 as failure. Filed to backlog as its own candidate.
3. **Nothing enforces the baseline programmatically.** `npm run typecheck` is bare `tsc --noEmit`; docs/tsc-baseline.txt is read only by prose (CLAUDE.md, the sdk-wrapper skill, review files). R1 was always a wording fix, never a tooling fix — **no script change is needed or wanted.**
4. **Measure in `.scratch/` before promising a number.** Do not commit to a target count before running the scratch measurement; a global `HIDDevice` re-declaration moves counts in non-obvious ways.

- Task 4a **DONE 2026-10-09 (Reviewer PASS, review-type-cleanup-4a.md)** — `@types/w3c-web-hid` measured **NOT clean, do not install** (63→68, net +5); `Calibration` TS2304 ×2 resolved via `any | Error` precedent (63→**61**). **§3 ruling (Reviewer):** leaving `docs/tsc-baseline.txt` at 60 is CORRECT — writing 61 would ratchet UP (forbidden); the waiver is the right instrument and expires with 4b. Measurement findings below are inherited for 4b.

**4a measurement results — inherited so 4b/anyone else need not re-derive them:**
- **`@types/w3c-web-hid@1.0.7` makes typecheck WORSE: 63 → 68 (net +5).** Fixes 17 (`navigator.hid` ×7, `Navigator.hid` ×3, `HIDConnectionEvent` ×2, implicit-`any` ×5, +others) but creates 22 (`Property 'id' does not exist on HIDDevice` ×9, `serialNumber` ×7, TS2322 ×4, TS2769 ×2). Measured with a `.scratch/` harness (two tsconfigs differing only in the `types` array) against lockfile-pinned SDK versions; control reproduced 63 exactly.
- **Why:** the two `HIDDevice` types are incompatible and hid's **module-scoped** `export interface` (`hid/.../types.d.ts:27`) shadows the spec's **global** `declare class` (`w3c-web-hid/index.d.ts:139`). hid's has `id: string` and NO `serialNumber`; the spec's has NEITHER `id` NOR `serialNumber`. Both services import hid's, so adding the global package retypes live `navigator.hid` results and breaks every `d.data.id` / `d.data.serialNumber` access. **Neither type has `serialNumber`** — installing it could never have fixed the TS2339 ×2 that Task 2 deferred. That is a real finding for 4b.
- TS 5.9.3's `lib.dom.d.ts` has **zero** HID declarations, so there was never a lib.dom collision; §13.7.3 pt 4's warning resolved as hid-vs-spec.
- **`tsconfig.json` has `"types": ["vite/client"]` — a whitelist.** An installed `@types/*` package is INERT unless listed there. Hence no `package.json` and no `tsconfig.json` change was needed for this decision.
- **The alternative is already in the repo:** `KeyboardService.ts:8-10` declares a local `interface HIDConnectionEvent extends Event { device: HIDDevice }` using hid's own import — which is why `KeyboardService.ts` has no TS2552 while `DebugKeyboardService.ts:103/:108` does. Path forward for a later task: keep hid as the single `HIDDevice` authority and replicate that local-shim pattern into `DebugKeyboardService.ts`, plus a small local `Navigator.hid` augmentation typed against **hid's** `HIDDevice`. Not 4a scope.
- **`npm install --no-save --no-package-lock` is DANGEROUS here:** it ignores the lockfile and re-resolved the pinned SDKs (hid 1.0.11→1.0.15, sdk-keyboard 1.0.20→1.0.24, protocol-keyboard 1.0.6→1.0.7), which alone moved the count 63→67 and poisoned two measurement runs. Recovered with `npm ci`. **Use `npm pack` + manual extraction to test a package instead.**

- Cleanup: `.scratch/` holds 4a's measurement artifacts (tarball, extracted package, harness tsconfigs, tsc logs) — PO may delete freely. `_to_delete/` empty. **One leftover outside `.scratch/`:** `node_modules/@types/w3c-web-hid/` was copied in manually for the measurement; `rm -rf` is blocked for the agent. It is **inert** (not in the `types` whitelist — verified: typecheck reports 61 with it present) and `node_modules` is gitignored, so it will vanish on the next `npm ci` or a fresh install. No `git rm` needed.

## ▶ RUN THIS
Next: Task 4a is **DONE** (Reviewer PASS 2026-10-09; §3 ruled — baseline correctly stays at 60, do not edit it).
Next: **Task 4b ([high-stakes] [hw], the LAST task) — PO hardware pre-step FIRST:** on a real device, log the four serialNumber values at KeyboardService.ts:137/:194 (`d.data.serialNumber`, `device.serialNumber`, targetSdkDevice's `d.data.serialNumber`, `targetHidDevice.serialNumber`) and record them on disk BEFORE the 4b Worker session opens — in the review file's Hardware check section (create review-type-cleanup-4b.md from the template if needed). A fresh Worker cannot see chat. Then Worker: "go" → Task 4b. After 4b: "ALL TASKS DONE — awaiting PO sign-off".

**Gate waiver (Task 4a/4b only, expires when 4b closes):** the following may remain past the self-check gate, each cited to docs/plans/reviews/review-variant-p-imports.md:
- **Count 61 vs baseline 60.** The 1-error excess is inherited from Task 2 (which landed 63-vs-60 as PASS) and is not a 4a regression — 4a moved 63→61. The baseline was deliberately NOT edited, because writing 61 would ratchet it UP, which is forbidden. Ratchet target stands as "down from 63". **Reviewer confirmed 2026-10-09 (review-type-cleanup-4a.md §3 ruling): leaving the baseline at 60 is correct; the ratchet becomes real when 4b lands.**
- KeyboardService.ts TS2339 `serialNumber` at :137/:194 — ONLY if the PO hardware measurement (4b pre-step) has not yet landed on disk. Once it lands, the decision IS in scope and this waiver no longer applies. **4a finding that changes this item:** neither hid's `HIDDevice` nor the spec's has a `serialNumber` member, so no types package can ever make that property type-safe — the fix must be a local type or a code change, decided by the PO measurement.
- All pre-existing errors in files outside 4a/4b's file list (notably router/index.ts ×17, profileStore.ts ×2, connection.ts ×2, travelProfilesStore.ts ×1, main.ts ×1). Out of sprint scope; the ratchet target is "down from 63", not zero.

Anything NOT on this list must be fixed, or the task FAILs. This waiver is not a CLAUDE.md rule and does not carry to any future sprint.

**Carried forward (from review-variant-p-imports.md, task 2):**
- **R1** — RESOLVED, see Checkpoint. No further action.
- **R2 — sdk-reference-v2.md §13.7.4 is factually wrong** (`configs` IS reachable via hid's internal `devices()` zero-match fallback → `requestDevice({filters:this.configs})`). Filed in backlog.md; a docs task should correct it. **Do not re-derive anything from that section.**

## Tasks
1. ✓ **typecheck script + baseline** — DONE 2026-10-08
2. ✓ **variant-P import fix** — [high-stakes] [hw] — DONE 2026-10-08 (Reviewer PASS + PO hardware PASS; commits 57305ef+c15d44f; review-variant-p-imports.md)
3. ✓ **sdk-wrapper skill** — DONE 2026-10-08 (.openclaude/skills/sdk-wrapper/SKILL.md; canonical shape + 3 known deviations + batching + type-sourcing order incl. the protocol-keyboard broken-`types` caveat)
4a. ✓ **type cleanup — deps + Calibration + baseline ratchet** — [high-stakes] — DONE 2026-10-09 (Reviewer PASS 2026-10-09, review-type-cleanup-4a.md; commit 1f7a615; w3c-web-hid NOT installed — measured net +5; `Calibration` TS2304 ×2 → `any | Error` per SDK ground truth; 63→61; baseline stays 60 per §3 ruling; measurement findings inherited in Checkpoint for 4b)
4b. **type cleanup — d.data + device literals + serialNumber** — [high-stakes] [hw] — STATUS: PENDING (blocked on the PO pre-step)
   - **PRE-STEP — PO, on a real device, result written to disk BEFORE the Worker session opens** (a fresh Worker cannot see chat): at KeyboardService.ts:137 and :194, log all four values — `d.data.serialNumber`, `device.serialNumber`, `targetSdkDevice`'s `d.data.serialNumber`, `targetHidDevice.serialNumber` — and record them in the review file's Hardware check section. This settles whether §13.7.2's "both sides are `undefined` at runtime, so the comparison silently passes" claim is TRUE (it is unverified — `d.data` is the *live* WebHID device, which Chromium may populate with a real serial). It decides which physical keyboard a reconnect picks when two of the same model are paired; a code read cannot settle it.
     - real string on both sides → the comparison already works; keep it
     - `''`/`undefined` both sides → §13.7.2 holds; drop or replace it
     - one side populated only → the match is silently broken; make it real
   - Done when: the serialNumber decision is implemented from the RECORDED measurement (keep / drop / make-real) and logged in the checkpoint + review file.
   - Done when: `d.data` TS18048 ×6 cleared **annotation-only** per §13.7.2's design constraint — NEVER by completing a device literal with vendorId/usage/usagePage; both `find()` calls stay byte-identical unless the recorded measurement forces a change.
   - Done when: baseline ratcheted DOWN again; design intent intact (filters:[] unfiltered, usagePage 65440, wrappers return Error never throw); Reviewer PASS + PO hardware ✓.
   - Files: `src/services/KeyboardService.ts`, `src/services/DebugKeyboardService.ts`, `docs/tsc-baseline.txt`, `docs/plans/reviews/review-<slug>.md`.
