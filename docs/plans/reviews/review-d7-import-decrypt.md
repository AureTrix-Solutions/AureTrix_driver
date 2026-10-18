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
- Hardware verdict: **FAIL — 2026-10-17 → see F1**. PO's plain-language outcome: on profile import every key's advanced type is being set to END even though it was not set to END on the original export. Code review stays PASS (pending hw); Task 4 → **IN-PROGRESS**.
- Partial results from the same session: global-mode deadband **✓ survives import** (by actual key behaviour). Lighting modes 1–21 **✗**, recorded as **pre-existing** F-D7-2 + F-D7-3 (not D7; PM routing under F-D7-4).
- Advanced-key behaviour + DB3 + F3 closure: **deferred, neither pass nor fail** — unobservable while F1 stands (F-D7-6). Special lighting: **not UI-testable** (F-D7-7).

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
**Result:** **FAIL** (hardware)  ·  **Date:** 2026-10-17  ·  **Fail count:** 1

Hardware verdict: **FAIL — 2026-10-17 → see F1**. Code review remains PASS (pending hw); the failure is a device-behaviour defect found only by the PO's hardware check. Task 4 → **IN-PROGRESS**; a new Worker window fixes ONLY F1.

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

#### F1 — every key's advanced type is forced to END on import (D7-introduced, 4c)

**What the PO did:** exported profile 2 (key 41 had `advancedType: "none"`, `performance.advancedKeyMode: 0`), imported that file into profile 3, then read the post-import debug snapshot.

**Expected:** keys with no advanced type keep `advancedType: "none"` / `advancedKeyMode: 0`. Only keys that genuinely had SOCD or END configured should have those re-written (that is the point of the F3 delay repair).

**Actual:** every key comes back as END. Verbatim from the PO's debug export for `keyValue: 41`:
- `performance.advancedKeyMode`: `0` → **`5`**
- `advancedKeys.advancedType`: `"none"` → **`"end"`**
- `advancedKeys.value`: `0` → **`5`**
(The same snapshot also shows `light.custom` RGB `255,255,255` → `0,0,0`, but that is the separate **pre-existing** F-D7-3, not this failure.)

**Mechanism — every step grep/bundle-verified, none from memory:**

1. **Export writes `end`/`socd` for EVERY key, unconditionally on success.** `ExportService.ts:367-369` (`if (!(socd instanceof Error) && socd) advancedKeys.socd = socd;`) and `:385-387` (same for `end`). There is **no `advancedType` filter**. So a key whose type is `"none"` still gets the raw uninitialized readback stored: `end: {dks:0, delay:65535}` and `socd: {pos1:0,pos2:0,key1:0,key2:0,type:0,mode:0,delay:0}` — exactly what the PO's export shows.
2. **Both repair gates are therefore always-true.** `repairSocdDelay` gates on `socd && typeof socd.delay === 'number'` (`ExportService.ts:785`) — `0` IS a number → true for all 88 keys. `repairEndDelay` gates on `end && typeof end.delay === 'number'` (`:810`) — `65535` IS a number → true for all 88 keys. Neither gate consults `entry.advancedKeys.advancedType`.
3. **The SDK itself branches on `advancedType` and the repairs bypass that.** Bundle `setAdvancedKeys(e,t)` destructures `const{advancedType:r,...}=t` and dispatches only on `r` — `"dks"`/`"mpt"`/`"mt"`/`"tgl"`/`"end"`/`"socd"`/`"macro"`. For `"none"` **no setter runs at all**. The repairs call `KeyboardService.setSocd(...)` / `setEND(...)` directly, so they write registers the SDK import deliberately skipped.
4. **Writing the END register changes the key's active advanced type on the device**, which is why the readback returns `advancedKeyMode: 5`. `ADVANCED_KEY_MODE_MAP` (`ExportService.ts:11-21`) confirms `5: 'end'`, `8: 'socd'`, `0: 'none'`.
5. **Order explains why END wins rather than SOCD.** `ExportService.ts:907` `await this.repairSocdDelay(config)` then `:908` `await this.repairEndDelay(config)` — END is the last writer, so `'end'` is what survives on every key. Matches the PO's debug exactly.

**Attribution — D7-introduced, NOT pre-existing (contrast F-D7-2/F-D7-3):**
- `git show 304620f:src/services/ExportService.ts | grep -c "repairEndDelay\|repairSocdDelay"` → **0**
- `git show 304620f:src/services/KeyboardService.ts | grep -c "async setSocd\|async setEND"` → **0**
- `git log --oneline -S "repairEndDelay" -- src/services/ExportService.ts` → added by **`b8eb0bc`** (Task 4c).
So this regression is inside the D7 group's own diff and fails the group gate outright, regardless of how the PM rules on F-D7-4.

**Reviewer miss, recorded honestly:** this session's `.scratch/review-notes.md` line 38 flagged the exact risk — *"repairs write socd/end for ANY entry with stored numeric-delay data regardless of active type … hw behavior is PO gate"* — and I ruled it acceptable because it matched the task's spec and I could not test device behaviour. The gate was seen and mis-judged: the numeric-delay gate is unconditionally true precisely because the fields are always populated. Hardware disproved it. Flagged here so the PM can weigh it against the PASS verdict.

**Fix direction (diagnosis, not a patch — the Worker owns the implementation):** gate each repair on the entry's **own** active type, mirroring the SDK's branching — i.e. only collect a key into `socdByKey` when `entry.advancedKeys?.advancedType === 'socd'`, and into `endByKey` only when `=== 'end'`. That keeps the F3 delay repair working for keys that genuinely had SOCD/END, and stops touching every other key. Also worth a PM/PO decision: whether `end.delay === 65535` (the uninitialized sentinel seen in this export) should be skipped even on a real END key.

**Re-check scope:** the Reviewer re-checks ONLY this fix — the two gates in `repairSocdDelay`/`repairEndDelay`, plus re-confirmation that F3 closure still works for a key that genuinely has END/SOCD set (non-zero delay survives readback AND behaviour). Gates re-run: `npm run typecheck`, `npm run lint`, `npm run build`.

### Hardware gate (PO — group 4b+4c, per the Hardware check section above)

Verdict is recorded once, in the Hardware verdict slot above (§Hardware check) — **FAIL 2026-10-17 → see F1**. What follows is the detail behind that verdict.

Results recorded as the PO reported them:

| Item | Result |
| --- | --- |
| Global-mode deadband (`repairGlobalDeadband`) | **✓ SURVIVES import** — confirmed by actual key behaviour. Stands. |
| Advanced keys: every key forced to `advancedType:"end"` | **✗ FAIL — §F1** (D7-introduced, `b8eb0bc`) |
| Lighting mode 1–21 round trip | ✗ — **pre-existing**, F-D7-2 (export never captures the mode) + F-D7-3 (per-key RGB zeroed). Not D7; routing under F-D7-4. |
| Special lighting (`light.other`) | **PASS — code-only** per PO ruling 2026-10-17 (no UI setting exists). Detail below. |
| Logo lighting (`light.logo`) | **PASS — code-only** per PO ruling. Applied by the SDK's own import path; unaffected by F-D7-2. Detail below. |
| `topDeadBandSwitch` | **PASS — code-only** per PO ruling. Live-read on export, validated as number, applied by SDK `setSystem`. Detail below. |
| DKS/MPT/MT/TGL/END/SOCD behaviour, DB3, F3 closure | **Deferred — neither pass nor fail** (F-D7-6). Unobservable while §F1 stands; re-run after the fix + re-review. |

**Deferred — NOT a pass and NOT a fail (F-D7-6):** DKS / MPT / MT / TGL / END / SOCD behaviour, DB3 point-3 travel, and F3 closure (SOCD/END non-zero delay readback + behaviour) **cannot be observed while §F1 stands**. Import overwrites every key's active type to END, so a key configured as DKS reads back `advancedType:"end"` and its behaviour is that of END. Stored *values* do survive in the readback (`dks.db3: 3` intact), but behaviour is unjudgeable. These items must be re-run **after** the §F1 fix and re-review; the Reviewer's re-check of §F1 should explicitly confirm F3 closure works on a key that genuinely has SOCD/END set.

**Special lighting is not UI-testable (F-D7-7) → RESOLVED by PO ruling.** Verified this session: `KeyboardConfig.light` models three separate hardware zones `{main, logo, other}` (validate.d.ts; sdk-reference §8, status **Verified**). Modes 0–21 belong to the **main** zone (`cmdPRGB`; 0=static, 1–20=dynamic, 21=custom — `getPRGBRecdata` type derivation, `Lighting.vue:754`). `other` is the "special" zone driven by `cmdSRGB` via `getSpecialLighting`/`setSpecialLighting`. Grepping src/ outside services for `SpecialLighting|light.other` returns **nothing**, and `Lighting.vue` calls only `getLighting`/`setLighting` (main zone) — `getLogoLighting`/`setLogoLighting` are likewise never called from any page. So no UI can configure the special zone: export captures whatever factory/default state the device holds, and `repairSpecialLighting` re-writes that same untested state. The gap it fixes is real and bundle-verified (`setLighting` destructures `{main, logo}` only, never applying `other`), but the item cannot be hardware-verified through the app.

**PO ruling (2026-10-17):** special lighting, logo lighting, and `topDeadBandSwitch` are **judged code-only** — no UI setting exists for any of them, so no hardware test is required or possible. Verdicts below, each grep/bundle-verified this session (no claim taken from memory or from the Worker's notes).

#### Code-only verdicts (PO ruling 2026-10-17)

**Special lighting (`light.other`) — PASS.**
- The converter supplies every field the facade needs. `convertLightConfigToSDKFormat` (ES:637-660) returns `{direction, speed, colors, luminance, sleepDelay, staticColor, type, mode, superResponse:false}`; bundle `async setSpecialLighting(e)` destructures exactly `{direction, superResponse, speed, colors, mode, luminance, sleepDelay, staticColor}` — all 8 present, the extra `type` is ignored harmlessly.
- The Worker's deviation (a) — no `open` gate — is **validated**: the facade itself forces `open:!0` into the payload (`u = {...{...}, open:!0}`), so `LightModeConfigs` omitting `open` cannot lose the on-state. Not a defect.
- The gap the repair fixes is real: SDK-level `setLighting` destructures `{main, logo}` only, so `other` is never applied by SDK import.
- Incidental on-device corroboration: the P2 export vs P3-after-import deep-diff showed `light.other` **identical**. Since SDK import alone would never write that zone, identical readback indicates `repairSpecialLighting` did apply it.

**Logo lighting (`light.logo`) — PASS.**
- Applied by the **SDK's own** import path: bundle `setLighting(e){const{main:t,logo:r}=e; await this.setMainLighting(t), await this.setLogoLighting(r)}`. No app-side repair needed and none exists — correctly.
- **Not clobbered by the export temp-switch** (this was the risk worth checking): `KeyboardService.setLighting` → `XDKeyboard` facade `setLighting=e=>this.lightingController.setLighting(e)`, which is the **main zone only** (the facade exposes `setLogoLighting` separately). So `tempCustomParams` (mode 21) touches main and leaves logo/other untouched — both are captured truthfully at export.
- Consequently **F-D7-2 does not affect the logo zone** (it forces only `main` to custom/21).
- Incidental on-device corroboration: `light.logo` **identical** P2 vs P3-after-import.

**`topDeadBandSwitch` — PASS.**
- Export live-reads it: `getApi({type:'ORDER_TYPE_TOP_DEAD_SWITCH'})` → boolean → `Number()` → 0/1 (ES:60-65).
- The `Number()` conversion is **load-bearing**: bundle `validateConfig` rejects the file unless `"number" == typeof e.system.topDeadBandSwitch` (error "Invalid system configuration"). Passing the raw boolean would fail SDK validation.
- SDK import applies it: `async setSystem(e){const{rateOfReturn:t, topDeadBandSwitch:r}=e; await this.keyBoard.setTopDeadSwitch(r)}`, and `setTopDeadSwitch(e)` packs `hArgs:[e]` — numeric 0/1 is the correct wire value.
- `rateOfReturn` is destructured but unused by `setSystem` (polling rate genuinely not restored) — already documented and PO-accepted as **D4**; no new finding.
- Incidental on-device corroboration: the `system` section was **identical** P2 vs P3-after-import. (`topDeadBandSwitch` is live-read there, unlike the intentionally static `productId`/`vendorId`/`keyboardName` fields per D3.)

**Minor observation (not a fail, pre-existing, out of D7 scope):** `convertLightConfigToSDKFormat` hardcodes `superResponse: false`, so a non-default `superResponse` on the special/logo zones is not preserved across import. The converter is pre-existing — a KEEP-verbatim anchor identical at base `304620f`, and live for the main zone too. Noted for the PM, no action here.

**Also confirmed dead:** `applyLightingZones` (ES:662-701) has **0 call sites** and is already scheduled for deletion in Task 5 (D6). Its presence does not affect these verdicts — `repairSpecialLighting` is the live path.

Still outstanding after this ruling: **no F2 regression** (not blocked by §F1) and the deferred advanced-key items (F-D7-6). `topDeadBandSwitch`, special lighting and logo lighting are closed by the PO ruling above — code-only PASS, no hardware test required.

Reviewer never writes DONE on a [hw] task. On the §F1 fix + re-check, the PO re-runs the deferred items and states a fresh verdict; an agent records it here.
