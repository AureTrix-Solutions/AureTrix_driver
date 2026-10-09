# SPRINT: sprint-01-code-fixes

**GOAL:** Clean up the SDK integration (typecheck infrastructure, variant-P import fix, wrapper-pattern skill, type-error cleanup) before feature work.
**DONE-CRITERIA (sprint):** `npm run typecheck` exists with docs/tsc-baseline.txt recorded and ratcheted down toward zero; variant-P import fix landed per §13.7.3 with design intent preserved (filters:[], usagePage 65440, wrappers return Error); sdk-wrapper skill captured.
**Started:** 2026-10-08  ·  **Status:** IN PROGRESS

## Checkpoint
- Branch: `sprint-01-code-fixes`
- tsc baseline: **60** (docs/tsc-baseline.txt) — self-check gate ACTIVE. Current count **61**; the 1-error excess is covered by the waiver below until 4b ratchets the baseline DOWN (expected ≈**23** — the remaining out-of-scope errors: router/index.ts ×17, profileStore ×2, connection ×2, travelProfilesStore ×1, main.ts ×1; a ~23 landing is SUCCESS, not failure; backlog candidate, do not chase).
- Task 2 DONE 2026-10-08 (Reviewer PASS + PO hardware PASS; R1 resolved — scoped waiver below, CLAUDE.md gate deliberately unchanged; R2 → backlog).
- Task 3 DONE 2026-10-08 (skill written; 3 real SDK deviations documented, not fixed; 1 finding → backlog). No tooling change is needed or wanted for the baseline (it is prose-enforced by design).
- Task 4a DONE 2026-10-09 (Reviewer PASS, review-type-cleanup-4a.md; commit 1f7a615): `@types/w3c-web-hid@1.0.7` measured **net +5 (63→68) — DO NOT INSTALL**; `Calibration` TS2304 ×2 fixed via `any | Error` precedent; 63→**61**; baseline stays 60 per review §3 ruling (writing 61 would ratchet UP — forbidden).
- **4a results inherited for 4b** (full detail: review-type-cleanup-4a.md §1 — do not re-derive):
  - hid's `HIDDevice` (hid/dist/cjs/src/types/types.d.ts:27) has `id: string` but **no `serialNumber`**; the spec class has **neither**; the two are incompatible (hid's module-scoped interface shadows the spec's global class). No types package can ever make `serialNumber` type-safe — only a local type can.
  - TS 5.9.3's lib.dom.d.ts has zero HID declarations (no lib collision possible); `tsconfig.json "types": ["vite/client"]` is a whitelist — installed `@types/*` are inert unless listed. 4b makes **no** tsconfig/package.json change.
  - Sanctioned fix pattern: the local shim already at KeyboardService.ts:8-10 (`interface HIDConnectionEvent extends Event { device: HIDDevice }` on hid's import) — it is why KeyboardService has no TS2552 while DebugKeyboardService does.
  - **Hazard:** `npm install --no-save --no-package-lock` ignores the lockfile and re-resolves pinned SDKs (poisoned two 4a measurement runs; recover with `npm ci`). For package experiments use `npm pack` + manual extraction.
- **PM revision rev2 (2026-10-09, PO-approved):** Task 4b replanned from 4a's measured results — full worklist in Tasks §4b below. Changes vs the old spec: (1) the "TS2339 serialNumber may vanish from the install" premise is dead (nothing was installed; neither type has the member) — all 38 service errors are code fixes; (2) the old **PO hardware pre-step (logging four serialNumber values) is REMOVED** — 4b types `serialNumber?: string` in the shim and is constrained runtime-identical, and the PO's **[hw] gate** (connect + auto-reconnect + Debug connect) verifies behavior on-device instead (PO ruling 2026-10-09: "add [hw] to re-test connect + auto-reconnect"); (3) expected landing is now a known number: 61 → ≈23. The open runtime question (does Chromium populate serialNumber? — matters only when two same-model keyboards are paired) is filed to backlog.
- Cleanup: `.scratch/` holds 4a's measurement artifacts (PO may delete freely); `_to_delete/` empty; leftover `node_modules/@types/w3c-web-hid/` is **inert** (not in the types whitelist, gitignored, vanishes on next `npm ci`). Nothing else outstanding.

## ▶ RUN THIS
Next: **Task 4b ([high-stakes] [hw], the LAST task)** — full spec + worklist in Tasks §4b. Worker session: "go" → execute worklist A–G → self-check → IN-REVIEW. Then Reviewer session: "follow docs/plans/reviews/review-type-cleanup-4b.md" → PASS (pending hw) → **HW-TEST**: PO exercises on a real device (1) first connect, (2) auto-reconnect after unplug/replug or reload, (3) Debug page connect → record verdict in the review file + status line per the hardware gate (✓ → DONE / ✗ → IN-PROGRESS + F1). After 4b: flag "ALL TASKS DONE — awaiting PO sign-off" and stop; PM-close follows.

**Gate waiver (Task 4a/4b only, expires when 4b closes):**
- **Count 61 vs baseline 60** — excess inherited from Task 2 (which landed 63-vs-60 as PASS); 4a moved 63→61. Baseline deliberately NOT edited (ratchet-up forbidden; review-type-cleanup-4a.md §3 ruling). The ratchet becomes real when 4b lands: baseline → measured post-4b count (≈23), waiver EXPIRED.
- **All pre-existing errors outside 4b's file list** (router/index.ts ×17, profileStore.ts ×2, connection.ts ×2, travelProfilesStore.ts ×1, main.ts ×1) — out of sprint scope; do not touch.
- The old serialNumber-waiver bullet is **superseded by rev2**: the fix is now IN SCOPE (worklist A/B), decided at the type level; no PO pre-step gates it.
- Anything NOT on this list must be fixed, or the task FAILs. This waiver is not a CLAUDE.md rule and does not carry to any future sprint.

**Carried forward (from review-variant-p-imports.md, task 2):**
- **R1** — RESOLVED (waiver above; CLAUDE.md unchanged by design). No further action.
- **R2 — sdk-reference-v2.md §13.7.4 is factually wrong** (`configs` IS reachable via hid's internal `devices()` zero-match fallback → `requestDevice({filters:this.configs})`). Filed in backlog.md; a docs task should correct it. **Do not re-derive anything from that section.**

## Tasks
1. ✓ **typecheck script + baseline** — DONE 2026-10-08
2. ✓ **variant-P import fix** — [high-stakes] [hw] — DONE 2026-10-08 (commits 57305ef+c15d44f; review-variant-p-imports.md)
3. ✓ **sdk-wrapper skill** — DONE 2026-10-08 (.openclaude/skills/sdk-wrapper/SKILL.md; canonical shape + 3 deviations + batching + type-sourcing order)
4a. ✓ **type cleanup — deps + Calibration** — [high-stakes] — DONE 2026-10-09 (commit 1f7a615; review-type-cleanup-4a.md; w3c-web-hid NOT installed, measured net +5; 63→61)
4b. **type cleanup — services to zero (shim + d.data guards + serialNumber)** — [high-stakes] [hw] — STATUS: PENDING

   **Scope:** all **38** remaining errors in the two services (KeyboardService.ts ×26, DebugKeyboardService.ts ×12 — enumerated in `.scratch/tsc-after-calib.txt`; re-derive from a fresh `npm run typecheck` — the worklist is the guide, the compiler is the truth). Expected landing: 61 → ≈23.

   **Worklist:**
   - **A. Shared WebHID shim** — new file `src/types/webhid.d.ts` (ambient; picked up by tsconfig `include: src/**/*`). Typed against **hid's** `HIDDevice`, never the spec class:
     `type BrowserHIDDevice = HIDDevice & { serialNumber?: string }` · `interface HIDConnectionEvent extends Event { device: HIDDevice }` · `interface HID extends EventTarget { requestDevice(options?: { filters: unknown[] }): Promise<BrowserHIDDevice[]>; getDevices(): Promise<BrowserHIDDevice[]>; addEventListener(type: 'connect' | 'disconnect', listener: (e: HIDConnectionEvent) => void): void }` (+ whatever overloads the compiler demands) · `interface Navigator { readonly hid?: HID }`.
     **Pitfall:** the file has a top-level `import type { HIDDevice } from '@sparklinkplayjoy/hid'`, so it is a MODULE — every global declaration above must sit inside `declare global { … }` or the `Navigator` augmentation silently does nothing. `hid?` stays optional so the existing `'hid' in navigator` guards remain load-bearing (narrowing via a local const or `navigator.hid!` after the guard is fine; weakening a guard is not).
     Then **delete** KeyboardService.ts:8-10's file-local `HIDConnectionEvent` (superseded by the shared one) and use the shim type at DebugKeyboardService.ts:103/:108. For the `d.data.serialNumber` side of the :137/:194 predicates (hid's `HIDDevice` lacks the member), cast to `BrowserHIDDevice` or type the predicate — Worker's choice, **no `as any`**.
     Fixes: TS18046 ×6, TS7006 ×2, TS2552 ×2, TS2339 `serialNumber` ×2.
   - **B. `d.data` optional guards** — TS18048 ×6 (KeyboardService.ts:137 ×3, :194 ×3): `Device.data` is optional in hid v2. Optional chaining in both `find()` predicates (`d.data?.vendorId === …`) — **runtime-identical** (undefined never equals a number → same filter results). Annotation/guard only — NEVER complete a device literal with vendorId/usage/usagePage (§13.7.2 constraint). The PO's earlier freeze on these two lines is lifted by rev2 (the serialNumber decision = item A).
   - **C. DebugKeyboardService TS2345 ×3** — :189/:201 `string` → `DksLayoutType`: validate/narrow the incoming string against the union's members at the boundary; :297 `number | undefined` → `number`: guard with an early `return new Error(…)` per the wrapper pattern (sdk-wrapper skill applies).
   - **D. DebugKeyboardService :423 TS2339 `exportEncryptedJSON` does not exist on `XDKeyboard`** — verify against docs/sdk-reference-v2.md FIRST (rule 6). If the API genuinely does not exist in the installed SDK, the wrapper is dead code: remove the method and any Debug-page caller (grep `exportEncryptedJSON` under src/), and log the removal. If it exists under another name/shape, fix the call. Log which branch was taken.
   - **E. KeyboardService TS2532 ×4** — :867 `flatTravels` possibly-undefined ×3: tighten the local (e.g. `const flatTravels = (result.travels ?? []).flat()`) without changing the `maxTravel` fallback-4.0 semantics; :1195 `setRateOfReturn(value)` with `value: number | undefined`: early `return new Error(…)` guard, or tighten the param type if ALL callers pass a number (verify callers).
   - **F. KeyboardService TS2322 ×3** — :1204/:1255/:1302 `number | null` → `number` in the polling-rate state machine. Narrowest correct change: non-null assertion only where the token was just assigned in the same flow, else a guard.
   - **G. KeyboardService :545 TS2339 `param.key` on `{}`** — read the actual signature at that site (`setMacro`); minimal fix (type the param or the access).

   **Hard constraints (design intent — rule 7):** `filters: []` at KeyboardService.ts:128 stays byte-identical; DebugKeyboardService.ts:76 `filters: [{ usagePage: 65440, usage: 1 }]` is pre-existing — leave as-is unless shim typing forces a change (then keep semantics identical); wrappers return `Error`, never throw; NO `@types/w3c-web-hid` install, NO tsconfig `types` change; `as any` banned without a logged justification.

   **Done when:**
   - `npm run typecheck`: **zero** errors in KeyboardService.ts and DebugKeyboardService.ts; total ≈23, all confined to the out-of-scope files.
   - `npm run build` passes (connect paths touched → build check required).
   - Runtime-identity argument written in the checkpoint + review file: every edit is type-level or a guard that cannot change behavior for currently-working inputs (B, E, F especially).
   - docs/tsc-baseline.txt ratcheted DOWN to the measured post-4b count; breakdown line updated; waiver noted EXPIRED.
   - review-type-cleanup-4b.md created from the template (sprint goal + this Done-when + Base/Head hashes + a Hardware check section saying in plain language WHAT changed and WHAT to verify — connect, auto-reconnect, Debug connect); task set IN-REVIEW → Reviewer → HW-TEST → PO verdict per the hardware gate. A Worker NEVER marks its own high-stakes task DONE.
   - Cleanup reported in the checkpoint (`.scratch/` contents listed; `_to_delete/` entry if item D removes a whole file).

   **Files:** `src/types/webhid.d.ts` (new), `src/services/KeyboardService.ts`, `src/services/DebugKeyboardService.ts`, `docs/tsc-baseline.txt`, `docs/plans/reviews/review-type-cleanup-4b.md`, possibly one Debug-page file (item D only).
