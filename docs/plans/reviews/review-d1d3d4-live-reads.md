# REVIEW: d1d3d4-live-reads

**SPRINT GOAL:** Make export→import a true full-keyboard recovery: live-read the dead-shape fields (D1), fix advanced-key export shapes incl. DB3 carry (D2/D2b), make import macro-safe (D5), repair what SDK import silently drops — DB3 + special lighting — via app-side decrypt (D7), delete the dead code (D6), and fix the exportConfig contract violation.
**TASK:** D1+D3+D4: live-read deadband/polling + lock the identity/polling comments  ·  **TAG:** [high-stakes] [hw]
**DONE WHEN:**
- `grep -n "sArg\|dpThreshold" src/services/ExportService.ts` → nothing
- `grep -c "pressDead" src/services/ExportService.ts` ≥ 1
- typecheck 0 · lint 0

## 📝 Worker notes & self-check
- `gatherDeviceInfo`: `rateOfReturn` and `topDeadBandSwitch` now live — `getApi({type:'ORDER_TYPE_ROES'})` narrowed via `typeof === 'number'`, `getApi({type:'ORDER_TYPE_TOP_DEAD_SWITCH'})` narrowed via `typeof === 'boolean'` + `Number()`; Error/wrong-shape falls back to the previous literals 3/0 (exported JSON shape unchanged on failure). Dead `.sArg`-era comments removed.
- `gatherPerformanceData`: `deadBandPressValue`/`deadBandReleaseValue` now read `dpDr.pressDead`/`dpDr.releaseDead` (with `?? 0`); dead `dpThreshold`/`drThreshold` explanation comment removed.
- D3/D4 locked per PO decision: identity fields (`productId`/`vendorId`/`keyboardName`/`usage`/`usagePage`) stay literal with an "intentionally static, not revisited (D3)" comment; `rateOfReturn` carries the "import discards it, SDK-side limitation, no setPollingRate bypass (D4)" comment.
- Self-check vs sdk-reference-v2.md: §3 `getApi` table — `ROES` (0x50) → `number` (rate index, not Hz), `TOP_DEAD_SWITCH` (0x34) → `boolean` (`data[2] !== 0`). §5.5 / KS `getDpDr` :743 → `{pressDead, releaseDead} | Error`. Narrowing pattern matches KS `getPollingRate` (`typeof result === 'number'`).
- Design intent preserved: filters:[] ☑ · usagePage 65440 ☑ · wrappers return Error ☑ (no throws added; all reads check `instanceof Error`)
- typecheck/build: typecheck exit 0 (baseline 0, no new errors); lint exit 0. Build not run — change is export-gather logic only, no build-config surface.

## 🔍 Commits to review
Base: `905eae3` (Task-1-DONE status commit)   Head: `9f7ecfa` (this task)
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
**Worker fills (what to test):**
- What changed (that touches hardware behavior): Export now queries the device for the real polling-rate index and top-deadband-switch state, and reads each key's real deadband press/release values, instead of writing hard-coded 3/0/0. No write path changed.
- What to verify: With the keyboard connected, set a NON-default polling rate in the Performance page and non-zero deadband on a few keys, then Export. Open the JSON and confirm `system.rateOfReturn` equals the index you set (not 3), `system.topDeadBandSwitch` reflects the top deadband switch state (1/0, not always 0), and the keys you touched show real `deadBandPressValue`/`deadBandReleaseValue` in their `performance` blocks (not 0). Then Import the same file back and confirm nothing about polling rate changes on the device (that is the known SDK limitation — import does not restore rateOfReturn; this is expected, not a failure).

**Hardware verdict (agent records from the PO's plain-language outcome):**
- Hardware verdict: <pending>

## ❓ Reviewer, please confirm
- [x] meets every "DONE WHEN" criterion above
- [x] diff scope matches the task (no stray files)
- [x] no design-intent violation
- [x] typecheck/build gate met where it applies (no newly introduced errors; unmasked ones recorded/deferred) — or N/A
- [x] tag is correct (high-stakes where required) — else auto-FAIL

---
## ✅ REVIEWER VERDICT
**Result:** PASS (pending hw)  ·  **Date:** 2026-10-13  ·  **Fail count:** 0

Independent re-verification (all commands re-run this session, not trusted from Worker notes):

**Done-whens:**
- `grep -n "sArg\|dpThreshold" src/services/ExportService.ts` → no output (exit 1) ✓
- `grep -c "pressDead" src/services/ExportService.ts` → 1 ✓ (≥ 1)
- `npm run typecheck` → exit 0 ✓ · `npm run lint` → exit 0 ✓

**Scope:** `git diff --stat 905eae3..9f7ecfa` → only `src/services/ExportService.ts`, +13/−20. Both hunks match the plan's two edit sites (gatherDeviceInfo, gatherPerformanceData). No stray files.

**SDK correctness (grep-verified against docs/sdk-reference-v2.md this session):**
- ROES: `:467` — `number`, polling-rate **index** (`:518` — same index, not Hz). Worker's `typeof roes === 'number'` narrowing matches KS `getPollingRate`'s own pattern (`KeyboardService.ts:311`). Fallback 3 preserved on Error/wrong shape.
- TOP_DEAD_SWITCH: `:475` — `boolean` (`data[2] !== 0`). `typeof === 'boolean'` + `Number()` keeps the exported JSON numeric as before. Fallback 0 preserved.
- getDpDr: `:903` ✅ Verified — `{pressDead, releaseDead}`, resolves to caught `Error` on failure. Wrapper contract confirmed at `KeyboardService.ts:743` (`Promise<{pressDead; releaseDead} | Error>`). Reads sit inside the pre-existing `!(dpDr instanceof Error)` guard with `?? 0` fallbacks.
- `getApi` wrapper union (`GetApiResult | Error`, `KeyboardService.ts:1100`, union `:30-40` includes `number`/`boolean`) — narrowing is type-sound; typecheck 0 corroborates.

**D3/D4 lock comments:** present and grep-verified in the file — D4 at `:48` ("SDK-side limitation, PO accepted; no setPollingRate bypass"), D3 at `:52` ("intentionally static, not revisited").

**Design intent:** no throws added; every read checks `instanceof Error`; HID traffic unchanged (both getApi calls kept — results now captured; getDpDr call pre-existing); no device filters touched; wrappers-return-Error contract intact.

**Tag:** [high-stakes] correct (SDK-correctness + export/import behavior); [hw] correct (live device readback cannot be verified off-device).

**Findings:** none — no defects and no out-of-scope observations to route. (Task 1's F-R1 remains open in current-sprint.md §Findings, unrelated to this diff.)

**Status:** → HW-TEST. PO hardware check per §Hardware check above; Reviewer does not write DONE on a [hw] task.
