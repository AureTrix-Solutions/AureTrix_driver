# REVIEW: vue-tsc-hw

**SPRINT GOAL:** Give `.vue` files a real automated type/undefined-reference gate — install vue-tsc, make `npm run typecheck` use it, and clear every error it unmasks so the gate lands at zero.
**TASK:** PO device smoke check of the behavior-visible fixes  ·  **TAG:** [hw]
**DONE WHEN:**
- The PO's verdict is recorded on disk in this file (`review-vue-tsc-hw.md`) and Task 3 STATUS is DONE (✓) or IN-PROGRESS (✗).

## 📝 Worker notes & self-check
- No code in this task. The four behavior-visible changes below landed in Task 2 (base `65b0b3e` → head `61cae73`); this file exists so the PO can confirm them on a real device per CLAUDE.md's Hardware gate.
- Two extra sanity glances are appended (items e/f) from Reviewer observation O2 in current-sprint.md `## Findings` ([hw-glance]) — dead-arm drops that are behavior-visible only if runtime data diverges from declared types.
- Self-check vs sdk-reference-v2.md: N/A (no code written).
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (untouched)
- typecheck/build: N/A (no source changed in this task; gate last ran at Task 2f: typecheck 0, lint 0, build 0).

## 🔍 Commits to review
Base: `61cae73` (Task 2 head)   Head: `ed7de1f` (F1 fix)
No Reviewer window: there is no diff to judge. The behavior under test was introduced by Task 2 commits `57793da`/`0079fa2`/`e1dc70b`/`ea5567d`/`6f44057`/`61cae73` (reviewed and PASSed in `review-vue-tsc-zero.md`).
Fix-round ranges (added on each re-review): Round 1 = `61cae73..ed7de1f` — F1 fix only: one-line label-ternary literal swap in `src/pages/KeyMapping.vue:25` (handler `toggleSelectAll` untouched; it was already correct). Worker self-check: typecheck 0 / lint 0 / build 0. No Reviewer pass needed for a label-literal swap on an already-reviewed handler — the PO re-check below is the gate.

## 🖥️ Hardware check ([hw] tasks only)
**Worker fills (what to test):**
- What changed (that touches hardware behavior): Task 2 was a type-cleanup sprint, but four fixes changed what the user sees/does on the Connect, KeyMapping, Calibration, and Rapid Trigger/Performance pages. Items (e)/(f) are unchanged code whose dead fallback branches were removed — they should behave exactly as before.
- What to verify (plain language — with a real keyboard connected):
  - **(a) Connect page — "Connecting..." state.** Start a connection. While it is in flight, the connect button should be disabled and read "Connecting...". Before the fix this state never showed (the flag was always undefined); if the button stays enabled/clickable during a connect, that's a fail.
  - **(b) KeyMapping — virtual-key selection highlight.** In the key-remapping category list, click a virtual key: it should highlight as selected (it never did before the fix). Also click Select All / Deselect All and confirm the selection reflects the real number of keys on the board.
  - **(c) Calibration — travel overlay still renders.** Run a calibration and watch the per-key travel overlay: the red/green travel numbers should still appear over normal keys while calibrating. A new guard was added; if the overlay is missing for ordinary keys, that's a fail.
  - **(d) Rapid Trigger / Performance single-key travel — applies to the right keys.** Select one or more keys and apply a travel setting (single-key travel / rapid trigger). Re-read the values from the device and confirm the intended keys got them — the batching call now passes key IDs differently (`processBatches(keyIds)`), so wrong or missing keys would show up here.
  - **(e) Sanity glance — lighting enable.** Toggle a lighting effect on/off; the lighting-enable control should work as before (a `|| currentState.open === 1` fallback was removed as dead code).
  - **(f) Sanity glance — device status display.** After connecting, the app's device-status indicator should reach its ready state as before (two `Uint8Array` fallback arms were removed as dead code).

**Hardware verdict (agent records from the PO's plain-language outcome):**
- Hardware verdict: **PASS — 2026-10-23** (round 2; the PO stated "HW passed" after the F1 fix `ed7de1f` — items (b)+(f) re-checked and passed; round-1 passes (a)/(c)/(d)/(e) stand. Round 1 was FAIL on (b) → see F1, now FIXED and confirmed on device.)

## 🔍 Reviewer verification (code review of the hw handoff)
**Verdict: PASS (pending hw)** — 2026-10-22. This task has no code diff to judge (git diff 61cae73..HEAD is docs-only: current-sprint.md + both review files). Reviewer scope reduced to confirming the Hardware check items the Worker wrote are accurate against head `61cae73`, so the PO tests the real code.

Grep-confirmed every item matches the code at head:
- **(a)** Connect: button `:disabled="isConnecting || isConnected"` + `'Connecting...'` label; `connection.ts` sets `isConnecting=true` at connect start, `false` in finally. ✓
- **(b)** KeyMapping: `selectedKeyValue === Number(keyValue)` class + `selectKeyValue(Number(keyValue))` click + Select All/Deselect All count from `layout?.flat().length`. ✓
- **(c)** Calibration: overlay `v-if="calibrating && keyInfo.location"` guards `keyInfo.location.row/col` reads. ✓
- **(d)** Single-key travel / Rapid Trigger / Performance: batching passes IDs via `processBatches(keyIds, physicalKeyValue => …)`; Performance/RapidTrigger debug line gated `item.value !== undefined && item.value !== 0`. ✓
- **(e)** Lighting enable: `lightingEnabled.value = currentState.open === true` — no `|| currentState.open === 1` fallback remains anywhere in src. ✓
- **(f)** Device-status validity (App.vue): arms now `typeof info.KeyboardSN === 'string' && length > 0` (same for appVersion) — the two `instanceof Uint8Array` fallbacks removed. ✓

No new Findings. Task 3 stays **HW-TEST**; per CLAUDE.md Hardware gate a Reviewer never writes DONE for a [hw] task — the PO's device verdict on items (a)–(f) closes it.

## F1 — Hardware verdict FAIL (2026-10-23): KeyMapping Select All / Deselect All tags reversed
- **What was done:** PO connected a real device, opened KeyMapping, and exercised item (b) — clicking virtual keys in the category list and using the Select All / Deselect All controls (behavior as introduced by Task 2, commit `61cae73`).
- **Expected:** the Select All and Deselect All tags/labels follow the last intended functionality (commit `61cae73`) — each control reads and acts as its label says.
- **Actual (PO's words):** "keymapping select all and deselect all tags are reversed last intended functionality in commit 61cae73b."
- Items (a), (c), (d), (e) passed on hardware; (f) was not reported — re-check (b) and (f) after the fix.
- **Fix scope: ONLY this.** Investigate the label/branch logic in `src/pages/KeyMapping.vue` (the Select All/Deselect All ternary + `selectAll`/`deselectAll` handlers and how they read `selectedKeys` vs the real key count) against the intended behavior at commit `61cae73`; do not touch the other verified items. After the fix, self-check (typecheck 0 / lint / build if affected), set Task 3 back to HW-TEST, and hand off for PO re-check of (b) + (f).
- **FIXED (Worker, 2026-10-23, commit `ed7de1f`):** No separate `selectAll`/`deselectAll` handlers exist — there is one `toggleSelectAll`, and its logic is CORRECT (all-selected → clears; not-all → selects all). The defect was purely the label ternary at `KeyMapping.vue:25`: it read `'Select All'` when everything was already selected (click deselects) and `'Deselect All'` otherwise (click selects) — tags reversed vs the action. Fix = swap the two string literals; handler untouched. Self-check: typecheck 0, lint 0, build 0. Task 3 → HW-TEST; PO re-checked items (b) + (f) → PASS (round 2, 2026-10-23; recorded above).

## 🔍 Reviewer verification — fix-round 1 (`61cae73..ed7de1f`)
**Verdict: PASS (pending hw)** — 2026-10-23.

Scope: the F1 fix only (items (a)/(c)/(d)/(e) passed hardware in round 1 and were not modified; (f) awaits the PO re-check).

- **Diff scope grep-confirmed:** `git diff 61cae73..HEAD --stat -- src` → `src/pages/KeyMapping.vue | 2 +-` — ONE line (`:25` label ternary literal swap), nothing else in src across the fix range (HEAD `64e1bd9` is docs-only mechanics). ✓
- **Handler untouched and correct:** `toggleSelectAll` (`KeyMapping.vue:133-141`): all-selected (`layout.value && selectedKeys.value.length === layout.value.flat().length`) → clears; else if layout → selects every coordinate via `flatMap`. ✓
- **Label now matches action:** `:25` uses the SAME condition — all-selected → reads "Deselect All" (a click clears) ✓; not-all-selected → reads "Select All" (a click selects all) ✓. This is exactly F1's complaint ("tags are reversed") resolved; intended behavior per the last-intended functionality is restored.
- **Gates rerun at HEAD by the Reviewer:** `npm run typecheck` (vue-tsc --noEmit) exit 0, `grep -c "error TS"` → 0; `docs/tsc-baseline.txt` first line `0`; shim confirmed at `_to_delete/vue-shim.d.ts` (absent from `src/types/`); `npm run lint` exit 0; `npm run build` exit 0. All match the Worker's self-check claims. ✓
- **Observation O1 (non-defect, no fix needed):** if `layout` is null/empty the condition degenerates to `0 === 0` and the button reads "Deselect All" while the handler is a no-op (`layout.value` guard). Pre-existing cosmetic edge, unreachable once a keyboard layout loads; noted only.

Per CLAUDE.md Hardware gate a Reviewer never writes DONE for a [hw] task — Task 3 stays **HW-TEST**; the PO's device re-check of items **(b) + (f)** closes it. No new Findings from this pass.
