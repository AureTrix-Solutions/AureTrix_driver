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
**Result:** PASS (pending hw) → **HW-TEST**  ·  **Date:** 2026-10-17  ·  **Fail count:** 0

### Confirmation checklist
- [x] meets every "DONE WHEN" criterion above — Reviewer re-ran all greps: 4a crypto-js=2, decryptSDKConfig=2; 4b setDksTravel|setSpecialLighting=5, setDp|setDr=2; 4c async setSocd|setEND=2, ES setSocd|setEND=4, ES `'1.0.7'`=7 (≥4). Gates re-run by Reviewer: `npm run typecheck` 0 errors, `npm run lint` exit 0, `npm run build` ✓ (1.78s).
- [x] diff scope matches the task — `git diff --stat 304620f..b8eb0bc` = exactly package.json, package-lock.json, src/services/ExportService.ts, src/services/KeyboardService.ts, docs/plans/current-sprint.md. No stray files.
- [x] no design-intent violation — new wrappers `setSocd` (KS:1238) / `setEND` (KS:1260) are canonical 4-part (connectedDevice guard → ensureKeyboard() → instanceof passthrough → catch console.error + return error as Error); never throw. No device filters touched; usagePage 65440 untouched. Repairs keyed on `physicalKeyValue`-equivalent `entry.keyValue` — bundle-verified this is the SAME id SDK import's setKeyboards/setAdvancedKeys uses (grep `setKeyboards(e){try{`).
- [x] typecheck/build gate met — baseline 0, current 0; no unmasked errors.
- [x] tag correct — [high-stakes][hw] as required (multi-file, SDK-correctness, device-affecting).

### Reviewer verification highlights (all grep-verified against bundle/dist, not memory)
- **4a decrypt fidelity:** app `decryptSDKConfig` (ES:846) is a faithful port of the SDK's own import path — bundle `importEncryptedJSON` does exactly `JSON.parse(AES.decrypt(s.data, rt).toString(Utf8))` with `rt="fDPy6vvnpPsYm2T0g1bh"`, and `exportEncryptedJSON` writes `{data: encryptData(e, rt)}`. Key, wrapper shape, and decrypt sequence all match. Null-on-any-failure keeps the SDK import standing (best-effort per spec).
- **4c wire-version mechanism:** bundle facade `setSocd(e,t="1.0.5")`/`setEND(e,t="1.0.5")` (2-arg, key inside param); minified `SOCDPack` (`Sn`) appends delay hi/lo only at v≥1.0.7; `ENDDataPack` (`Tn`) same. SDK import's `setAdvancedKeys` calls both with ONE arg → default '1.0.5' → delay bytes omitted. Repairs re-write at explicit `'1.0.7'` → delay bytes reach the device. Corroborated by sdk-reference-v2.md §6.7/§6.8 (both status **Verified**, lines 149-150).
- **4c param shapes:** `repairSocdDelay` passes the stored socd object VERBATIM (Sn destructures {pos1,pos2,key1,key2,type,mode,delay} — matches export-side getSocd(key,'1.0.7') 7-field readback); `repairEndDelay` builds `{key: entry.keyValue, dks, delay}` (Tn destructures {key,dks,delay}) — matches bundle end branch `h({key:e,dks:t,delay:r})`. Delay as-is, no scaling (unit unverified per §6.7; round-trip fidelity is unit-agnostic — correct call).
- **4b deadband:** `deadBandPressValue`/`deadBandReleaseValue` are BOTH required `number` in PerformanceConfig (validate.d.ts:22-23) — press-gate + release-passthrough is type-safe; 0 applied (clears stale). DB3 round-trip verified: export ES:318/:359 stores raw getDksTravel value (Error→0), repair writes it back via setDksTravel — units match. 'Layout_DB3' is a valid DksLayoutType member (sdk type.d.ts).
- **4b special lighting:** bundle setLighting destructures ONLY {main, logo} → `other` zone never applied by SDK import (gap real); repair routes config.light.other through convertLightConfigToSDKFormat (ES:637, arg type = KeyboardConfig['light']['main'] — same LightConfig shape as `other` per validate.d.ts:76) into setSpecialLighting (KS:1069, takes LightModeConfigs). Worker's no-open-gate deviation is sound: LightModeConfigs omits `open`, and validate.d.ts shows `open` cannot ride the payload.
- **Error contract:** every SDK result in all five repairs checked `instanceof Error` → console.error, never thrown; repairs cannot fail a successful SDK import. processBatches 80/100 everywhere; empty maps = zero batches (no guard needed).
- **MUST-NOT-TOUCH respected:** F2 export fixes, Task 1 macro guard (macroSnapshot/restore), and 4b items (1)-(3) untouched by 4c (diff-verified).

### Findings (non-defect observations; PASS unaffected)
1. **Nested-keyboards flatten gap (low):** bundle `importEncryptedJSON` runs `Array.isArray(i.keyboards) && (i.keyboards = i.keyboards.flat())` before consuming the config; app `decryptSDKConfig` does not flatten. If an SDK export ever contains nested `keyboards` arrays, the SDK import still applies them (it flattens), but ALL five app-side repairs silently skip (`entry.advancedKeys` undefined on array-typed entries → maps stay empty → processBatches([]) = no-op). Failure mode is safe (silent skip, import stands) and current exports are flat. Where to verify: bundle `grep "keyboards=i.keyboards.flat()"` vs ES `decryptSDKConfig`. → Findings line added for PM routing.
2. **Pre-existing, out of scope:** sdk-reference §6.8 flags a SOCD read/write shape mismatch at v='1.0.5' (write {pos1,pos2,key1,key2,type,mode} vs read {pos,key,type,mode}). Not introduced by this diff; repairs run at '1.0.7' where the version-aware readback is consistent. No action.

### Failed items (FAIL only)
_(none)_

### Hardware gate (PO — group 4b+4c, per the Hardware check section above)
Code is PASS (pending hw). Task 4 set to **HW-TEST**. PO: exercise the device per the Hardware check section (configure DKS+MPT+MT+TGL+END+SOCD incl. DB3 + special lighting + distinct global-mode deadband → export → wipe → import → confirm restoration incl. F3 closure: non-zero SOCD/END delays survive readback AND behavior; deadband by actual key behavior; no F2 regression). Then state the verdict in plain words; an agent records it here (PASS → DONE + advance ▶ RUN THIS to Task 5; FAIL → F1 block + IN-PROGRESS). Reviewer never writes DONE on a [hw] task.
