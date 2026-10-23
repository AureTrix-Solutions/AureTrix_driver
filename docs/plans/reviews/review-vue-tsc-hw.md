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
Base: `61cae73` (Task 2 head — current branch tip)   Head: `61cae73` (no code in this task; nothing to diff)
No Reviewer window: there is no diff to judge. The behavior under test was introduced by Task 2 commits `57793da`/`0079fa2`/`e1dc70b`/`ea5567d`/`6f44057`/`61cae73` (reviewed and PASSed in `review-vue-tsc-zero.md`).
Fix-round ranges (added on each re-review): —

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
- Hardware verdict: PENDING — PO to exercise items (a)–(f) on a real device.

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
