# REVIEW: d7-import-decrypt (group Task 4: 4a+4b+4c, one cumulative review)

**SPRINT GOAL:** Make export→import a true full-keyboard recovery: live-read the dead-shape fields (D1), fix advanced-key export shapes incl. DB3 carry (D2/D2b), make import macro-safe (D5), repair what SDK import silently drops — DB3 + special lighting + socd/end delay — via app-side decrypt (D7), delete the dead code (D6), and fix the exportConfig contract violation.
**TASK:** D7 group — import-time decrypt + post-import repairs (4a→4b→4c)  ·  **TAG:** [high-stakes] [hw]
**DONE WHEN (4a):** `grep -c "crypto-js" package.json` ≥ 1; `grep -c "decryptSDKConfig" src/services/ExportService.ts` ≥ 2; `npm run build` exit 0; typecheck 0; lint 0.
**DONE WHEN (4b):** `grep -c "setDksTravel\|setSpecialLighting" src/services/ExportService.ts` ≥ 2; `grep -c "setDp\|setDr" src/services/ExportService.ts` ≥ 2; typecheck 0; lint 0.
**DONE WHEN (4c):** `grep -c "async setSocd\|async setEND" src/services/KeyboardService.ts` = 2; `grep -c "setSocd\|setEND" src/services/ExportService.ts` ≥ 2; `grep -c "'1.0.7'" src/services/ExportService.ts` ≥ 4; typecheck 0; lint 0.

## 📝 Worker notes & self-check
- **4a** (commit f8fb312): crypto-js@4.2.0 + @types/crypto-js@4.2.2 pinned exact; `decryptSDKConfig(text)` parses `{data:"<cipher>"}` → AES.decrypt with the SDK bundle-hardcoded key → `KeyboardConfig | null` (any throw = null, best-effort: repairs skipped, SDK import stands). importProfile's garbage ciphertext `JSON.parse` replaced; `applyImportedConfig` now guarded by `if (config)`.
- **4b** (commit 077ac89): repairs (1) `repairDksDb3` (Map keyValue→db3 → processBatches 80/100 → `setDksTravel(key, db3, 'Layout_DB3')`), (2) `repairGlobalDeadband` (isGlobalTriggering entries → per-key `setDp`/`setDr`, 0 applied to clear stale), (3) `repairSpecialLighting` (guard `light.other` → `setSpecialLighting(convertLightConfigToSDKFormat(...))`). Wired inside `if (config)` BEFORE applyImportedConfig, order DB3→deadband→special. Per-call `instanceof Error` → console.error, never throw. Documented deviations: no open-gate (flag can't ride the LightModeConfigs payload; spec said unconditional), no empty-list guard (processBatches [] = zero batches).
- **4c** (commit b8eb0bc): KS wrappers `setSocd(param: Keyboards['advancedKeys']['socd'], v='1.0.7'): Promise<SocdConfig | Error>` and `setEND(param: {key,dks,delay}, v='1.0.7'): Promise<{dks,delay} | Error>` after getSocd, canonical 4-part shape (guard → ensureKeyboard → instanceof passthrough → catch/console.error/return). `Keyboards` type added to the validate import. ES `repairSocdDelay` (gate `typeof socd.delay === 'number'` → stored 7-field object VERBATIM → `setSocd(socd, '1.0.7')`) + `repairEndDelay` (gate `typeof end.delay === 'number'` → `{key: entry.keyValue, dks, delay}` as-is, no scaling → `setEND(end, '1.0.7')`), both via processBatches 80/100, wired after repairSpecialLighting and before applyImportedConfig. Mid-session correction (banked in sprint checkpoint): the facade is 2-arg `set(param, v)` with the key INSIDE param — bundle setAdvancedKeys verified (`end` branch `h({key:e,dks:t,delay:r})`, `socd` branch `h(u)` verbatim); a first-pass 3-arg draft was removed before commit.
- Self-check vs sdk-reference-v2.md: §6.1 method table (setEND/setSocd are the only version-plumbing setters; ENDDataPack/SOCDPack omit delay below '1.0.7'), §6.7/§6.8 (wire-version default '1.0.5' root cause — sealed by review-d2-advanced-keys.md §F3 PM DISPOSITION). Facade signatures confirmed in higherKey.d.ts + index.d.ts; IEndMode/ISOCDModeV3 field shapes confirmed in protocol-keyboard interface.ts; decode shapes (getEndRecdata → {dks,delay} no key; getSocdRecdata@1.0.7 → 7 fields no key) confirmed in recdata.ts.
- Design intent preserved: filters:[] ☑ untouched · usagePage 65440 ☑ untouched · wrappers return Error, never throw ☑ (all new wrappers + repairs).
- typecheck/build: typecheck 0 new errors; lint 0; build exit 0 (ran after 4a and after 4c).
- Untouched as required: F2 export fixes (hw ✓), Task 1 macro guard, KEEP-verbatim anchors.

## 🔍 Commits to review
Base: `304620f` (PM rev2 touchpoint, pre-4a)   Head: `b8eb0bc` (4c)
Sub-commits: 4a `f8fb312` · 4b `077ac89` · 4c `b8eb0bc`
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat 304620f..b8eb0bc     then      git diff 304620f..b8eb0bc
     A file touched outside this task's scope is a flag. Expected scope:
     package.json + package-lock.json (4a deps), src/services/ExportService.ts,
     src/services/KeyboardService.ts, docs/plans/current-sprint.md. -->
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
**Worker fills (what to test):**
- What changed: import now decrypts the SDK export locally and, after the SDK's own import runs, re-writes the things the SDK import silently drops: DKS point-3 travel (DB3), global-mode per-key deadbands (DP/DR), special (non-main/logo) lighting, SOCD configs with their delay, and END configs with their delay — SOCD/END re-written at wire version '1.0.7' so the delay bytes actually reach the device.
- What to verify (group gate, 4b+4c together): on a real device configure DKS+MPT+MT+TGL+END+SOCD (incl. DB3) + special lighting + a distinct global-mode deadband; export; wipe; import; confirm all six advanced modes + DB3 + special lighting + global-mode deadband are restored. Verify deadband by ACTUAL KEY BEHAVIOR, not just UI readback. F3 closure: SOCD + END configured with non-zero delays survive export→wipe→import in readback AND behavior. topDeadBandSwitch also restored (D1 add-on — if ✗ it is a NEW finding routed to PM, not a 4b fix item). No regression of the ✓ F2 items (DKS 4-point, SOCD core pos/mode). Residual risk accepted by PO: '1.0.7' WRITE packets are longer than any the app has sent before (the READ at '1.0.7' is hw-verified ✓; this gate confirms firmware write acceptance).

**Hardware verdict (agent records from the PO's plain-language outcome):**
- Hardware verdict: _(pending — Reviewer sets HW-TEST first; PO then exercises the device)_

## ❓ Reviewer, please confirm
- [ ] meets every "DONE WHEN" criterion above
- [ ] diff scope matches the task (no stray files)
- [ ] no design-intent violation
- [ ] typecheck/build gate met where it applies (no newly introduced errors; unmasked ones recorded/deferred) — or N/A
- [ ] tag is correct (high-stakes where required) — else auto-FAIL

---
## ✅ REVIEWER VERDICT
<!-- After ONE verification pass, RULE. Don't keep investigating. A runtime/behavior question goes
     to the PO hardware check, not more static analysis. Output = PASS/FAIL + findings + your own
     Findings one-liners (into current-sprint.md). Do NOT plan task order/parallelism. -->
**Result:** PASS / PASS (pending hw) / FAIL  ·  **Date:** YYYY-MM-DD  ·  **Fail count:** <n>

### Failed items (FAIL only)
_(none yet)_
