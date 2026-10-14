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
- [ ] meets every "DONE WHEN" criterion above
- [ ] diff scope matches the task (no stray files)
- [ ] no design-intent violation
- [ ] typecheck/build gate met where it applies (no newly introduced errors; unmasked ones recorded/deferred) — or N/A
- [ ] tag is correct (high-stakes where required) — else auto-FAIL

---
## ✅ REVIEWER VERDICT
**Result:** <pending>  ·  **Date:** <pending>  ·  **Fail count:** <pending>
