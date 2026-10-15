# REVIEW: d2-advanced-keys (Task 3 group: 3a→3d)

**SPRINT GOAL:** ExportService export/import review sprint — make the exported JSON round-trip correctly through the SDK's own import path (D-group fixes), verified against docs/sdk-reference-v2.md.
**TASK:** D2 group: advanced keys — KS wrappers + canonical export shapes (3a→3d, ONE review over the cumulative diff)  ·  **TAG:** [high-stakes] [hw]
**DONE WHEN:**
- 3a: `grep -c "async getDksAll\|async getTrpsAll\|async getMtorTgl" src/services/KeyboardService.ts` = 3; wrappers return `Error` instances, never throw; typecheck 0.
- 3b (REVISED rev1 2026-10-14, PO-confirmed — the original "value from the mode's primary trigger" clause was wrong vs the SDK contract, see §F1): gatherAdvancedKeyData sets `advancedKeys.advancedType` from live `advancedKeyMode` via ADVANCED_KEY_MODE_MAP (sdk-ref §5.2) and `advancedKeys.value` to the **numeric `advancedKeyMode` id** (SDK setAdvancedKeys resolves the setter via `advancedKeysSdkMap[value]`; per-mode data travels in its sibling field); no `advancedValue`/trigger switch remains; no stale "not yet read" comment; typecheck 0, lint 0. Fix-round greps: `grep -c "advancedValue" src/services/ExportService.ts` = 0; `grep -c "advancedKeys.value = advancedKeyMode" src/services/ExportService.ts` = 1.
- 3c: canonical dks export shape `{dks:{1,2,3},trps:{1,2,3},db,db2,db3}` from getDksAll/getTrpsAll/getDksTravel(Layout_DB1/2/3); `grep -c "Layout_DB3" src/services/ExportService.ts` ≥ 1; KS get/setDksTravel annotated `number|Error`; typecheck 0, lint 0.
- 3d: mt export shape `{dksAll:[dks1..4], delay}` with delay = getMtorTgl's ms value stored AS-IS (NO ÷10 — import's mt branch does `delay/10` before cmdMT, which puts the 10ms wire unit on the wire); socd confirmed against sdk-ref §6.8 union (no change expected); tgl/mpt/end stay raw; `grep -c "getMtorTgl" src/services/ExportService.ts` ≥ 1; typecheck 0, lint 0.
<!-- If a criterion is revised after this file exists, UPDATE it here too — the Reviewer judges
     this file, not current-sprint.md. -->

## 📝 Worker notes & self-check
- 3a (`0ed9715`): added getDksAll/getTrpsAll/getMtorTgl wrappers to KeyboardService near getDksTravel; try/catch → return Error; JSDoc cites sdk-ref §6.2/§6.3.
- 3b (`bab76eb`): module-level ADVANCED_KEY_MODE_MAP (§5.2) + value switch (dks.dks/mpt.dks[0]/mt.dks1/tgl.dks/end.dks/socd.type; macro & RS → 0); stale comment replaced.
- 3c (`b4de552`): canonical dks shape stored; KS get/setDksTravel annotations fixed to `number|Error` (sdk-ref Verified: plain mm); db3 carried (extra props pass SDK validation).
- 3d (`d54e780`): getMtorTgl read added in gatherAdvancedKeyData (fires for every key like the db reads, stored only when mt non-Error); mt store now `{dksAll:[mt.dks1..dks4], delay: mtorTglDelay ms AS-IS}`; socd CONFIRMED against §6.8 union — existing raw store correct, unchanged; tgl/mpt/end raw stores unchanged; switch case 3/4 read raw local vars, unaffected; comment above the stores updated to name dks+mt as canonical.
- **3b F1 fix-round (`c8fd88e`)**: `advancedKeys.value` now = numeric `advancedKeyMode` id (SDK setAdvancedKeys resolves the setter via `advancedKeysSdkMap[value]`); trigger switch + `advancedValue` deleted; replacement comment names the sibling-field data path. Scope addition: lint's no-unused-vars caught the `dks` local (old :302, `getDks(keyValue)`) — consumed ONLY by the deleted switch (canonical dks shape uses dksAll/trpsAll; mpt/socd/tgl/end/mt have their own stores) ⇒ its read + 50ms delay removed as dead code; no payload shape change (the switch value never entered the payload otherwise). +4/−17, ExportService.ts only. Gates re-run post-fix: `grep -c "advancedValue"` = 0; `grep -c "advancedKeys.value = advancedKeyMode"` = 1; `grep -c "getDks("` = 0; typecheck exit 0; lint exit 0.
- Self-check vs sdk-reference-v2.md: §6.2 (getDksAll/getTrpsAll shapes, Verified), §6.3 (getMtorTgl = Layout_MTDelay raw ×10 = ms, Verified — the mt delay round-trip math), §6.6 (TGL delay 10ms wire unit, Verified), §6.8 (getSocd union `{pos1,pos2,key1,key2,type,mode,delay}` v≥1.0.7 | `{pos,key,type,mode}` — matches KS SocdConfig exactly), §5.2 (advancedKeyMode map). Import mt branch (bundle-verified in 3c): `const {dksAll,delay}=o; cmdMT({key,dks:getValues(dksAll),delay:delay/10})`.
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (3a wrappers + KS annotations).
- typecheck/build: `npm run typecheck` 0 errors at each of 3a–3d; `npm run lint` 0 errors/warnings at 3b–3d. Build not run (no build-affecting change beyond service code that typecheck+lint cover).

## 🔍 Commits to review
Base: `9f7ecfa` (Task 2 / branch-reviewed point)   Head: `d54e780` (Task 3d)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat 9f7ecfa..d54e780     then      git diff 9f7ecfa..d54e780
     A file touched outside this task's scope is a flag. -->
Fix-round ranges (added on each re-review): F1 → `d54e780..c8fd88e` (3b value=mode-id fix + orphan getDks removal; 1 file, +4/−17)

## 🖥️ Hardware check ([hw] tasks only)
**Worker fills (what to test):**
- What changed (that touches hardware behavior): Export now reads three additional values per key (getDksAll, getTrpsAll, getMtorTgl) and stores canonical shapes for dks and mt in the exported JSON; advancedType/value now come from the live advancedKeyMode. Import consumes these shapes via the SDK's own branches.
- What to verify: on a real device — (1) export a keyboard that has MT configured on at least one key, then import that JSON back: the MT key keeps its 4 dks codes and its delay (delay should survive in ms — e.g. a 30ms MT delay exports as 30 and re-imports as 30, not 3 or 300); (2) same round-trip for a DKS key (4-point curve + trps + dead bands db/db2/db3) and a SOCD key (config survives verbatim); (3) exported JSON shows advancedType matching the key's actual mode (e.g. "mt", "dks") instead of "none"; (4) export still completes without device errors/timeouts (the 3 extra reads per key lengthen the pass).

**Hardware verdict (agent records from the PO's plain-language outcome):**
- Hardware verdict: FAIL — 2026-10-15 → see F2 (partial: MPT+MT+TGL+END round-trip ✓, DKS+SOCD ✗; SOCD symptom detail pending PO follow-up)

### F2 — DKS (and SOCD) corrupted on import; MPT/MT/TGL/END round-trip correctly (hardware FAIL, 2026-10-15)

**What the PO did:** configured DKS+MPT+MT+TGL+END+SOCD on profile 1; verified all six behave correctly on p1. Exported p1 → imported into profile 4. On p4: MPT, MT, TGL, END all worked as expected. DKS and SOCD did not match p1.

**Expected:** p4 DKS behaves identically to p1 (key "3": fire A at start point, B at bottom, C on release-from-bottom, D on full release).

**Actual (PO):** on p4 the key fired "C" at a much shallower depth than configured; the other points were wrong; the last DKS point ("D") was dropped and replaced with **7171**.

**Export read-back comparison (PO debug exports, same key col3/row1/keyValue32; block A = post-import p4 read-back, block B = original p1):**
- `dks.trps`: B `{3, 28, 96}` → A `{96, 231, 1}` — values shuffled/corrupted (note A.trps1 = 96 = B.trps3).
- `dks.db`: B `0.487` → A `0.011`. `db2`/`db3` unchanged (2.9/3).
- `mt.dksAll[4]`: B `7` → A `7171`. (7171 = 0x1C03 = (28<<8)|3 = B.trps2/trps1 — byte-misalignment signature, observation only.)
- `performance.deadBandPressValue`/`deadBandReleaseValue`: B `0.2/0.2` → A `0/0`.
- `advancedType`/`value` both correct (`"dks"`/`1`) in A ⇒ the F1 fix (setter resolution) works; the failure is in the dks branch's **payload consumption**, not setter lookup. MPT/MT/TGL/END hardware ✓ confirms their branches consume correctly.

**Where to verify (leads, not a fix):**
1. SDK bundle `setAdvancedKeys` `"dks"===r` branch (grep `"dks"===r` in node_modules/@sparklinkplayjoy/sdk-keyboard/dist/esm/index.js, 1 hit): the F1 verbatim quote shows it calls the setter with `{key:e, dks:o, trps:a, dbs:c}` where, per the destructure `{advancedType:r,value:n,dks:s,mpt:i,mt:o,tgl:a,end:c,socd:u,macro:l}`, `o`=**mt**, `a`=**tgl**, `c`=**end** — i.e. the dks branch may consume the mt/tgl/end sibling fields, NOT our exported `dks:{dks,trps,db,db2,db3}` object (`s`). Verify whether that quote is complete/current and what shape setDks actually expects (also check protocol-keyboard/src if the bundle is ambiguous).
2. What our import path hands `setAdvancedKeys` for a dks key: `advancedKeys.dks` assembly at src/services/ExportService.ts:346 (grep `advancedKeys.dks = {`) and the SDK `setImportData`/`importConfig` chain's getValues order for dks.
3. SOCD: PO to supply the symptom detail (configured mode vs p4 behavior); verify the bundle's `"socd"===r` branch consumption the same way.

**Routing:** Task 3 → IN-PROGRESS. Next Worker fixes ONLY F2 (see this block) after research — likely an export-shape and/or import-payload change in ExportService.ts, pending the bundle verification above. Re-check by Reviewer + a new PO hardware round-trip afterwards.

## ❓ Reviewer, please confirm
- [ ] meets every "DONE WHEN" criterion above — 3a/3c/3d: YES (all re-run ✓). 3b: met AS WORDED, but the criterion's value clause ("value from the mode's primary trigger") is itself contradicted by the bundle-verified SDK contract → F1; criterion revision routes to PM (PO confirmation).
- [x] diff scope matches the task (no stray files) — source touched = `ExportService.ts` + `KeyboardService.ts` only; planning-doc commits in range (`current-sprint.md`, `backlog.md`, `review-d1d3d4-live-reads.md`) are PM-touchpoint/handoff mechanics per protocol, not stray source.
- [x] no design-intent violation — filters:[] untouched, usagePage 65440 untouched, all new wrappers return `Error`, never throw.
- [x] typecheck/build gate met — `npm run typecheck` exit 0 and `npm run lint` exit 0 re-run independently this session; build N/A (service-code change covered by typecheck+lint).
- [x] tag is correct — [high-stakes] [hw] appropriate (SDK-correctness, multi-file, device-affecting).

---
## ✅ REVIEWER VERDICT
**Result:** PASS (pending hw) → **HW-TEST**  ·  **Date:** 2026-10-14  ·  **Fail count:** 0
rev1 (2026-10-14): Done-when 3b revised per F1, PO-confirmed — `value` = numeric `advancedKeyMode` id, trigger switch deleted. Fix ONLY F1 (3a/3c/3d PASS, untouched); re-review covers ONLY the fix-round range.
**Fix-round re-review (2026-10-14, range `d54e780..c8fd88e`): F1 FIXED → code verdict PASS (pending hw).** Re-check covered F1 only, per RUN THIS. Evidence:
- Diff = ExportService.ts (+4/−17) + planning-doc mechanics (current-sprint.md PM touchpoint, this review file). Only source file touched: ExportService.ts.
- F1 fix confirmed verbatim in diff: whole `let advancedValue = 0; switch (advancedKeyMode) {…}` block replaced by `advancedKeys.value = advancedKeyMode;`; `const advancedKeyMode = keyData.performance?.advancedKeyMode ?? 0;` and `advancedKeys.advancedType = ADVANCED_KEY_MODE_MAP[advancedKeyMode] ?? 'none';` retained. Matches the revised Done-when 3b + the F1 contract (`h=this.advancedKeysSdkMap[n]`, n=value ⇒ value must be the numeric mode id).
- Comment now states the contract (setter resolved via advancedKeysSdkMap[value]; per-mode data travels in sibling fields); stale "not yet read" comment gone (`grep -c` = 0).
- Scope addition verified clean: orphaned `const dks = …getDks(keyValue)` + its 50ms delay deleted (the switch was its only consumer; canonical dks shape comes from getDksAll/getTrpsAll). Post-fix `grep -c 'getDks('` = 0 (getDksAll/getDksTravel unaffected); no remaining `dks` local refs — only `advancedKeys.dks = {` (:346, 3c shape, untouched). typecheck 0 + lint 0 confirm no undefined/unused leftovers. No payload shape change.
- Gates re-run THIS session: `grep -c advancedValue src/services/ExportService.ts` = **0** ✓ · `grep -c 'advancedKeys.value = advancedKeyMode'` = **1** ✓ · `npm run typecheck` exit **0** ✓ · `npm run lint` exit **0** ✓.
- Design intent untouched (no filters/usagePage/wrapper-error changes; ExportService payload only).
- §F1 below is retained as the first-pass record; it is now RESOLVED. [hw] task ⇒ status set to **HW-TEST**, not DONE. PO hardware check section (items 1-4) stands unchanged — F1 was import-path-breaking, so the on-device round-trips are the live confirmation.

3a ✓, 3c ✓, 3d ✓ — all Done-when greps, wrapper shape (return `Error`, never throw), KS `number|Error` annotations, canonical dks `{dks,trps,db,db2,db3}`, mt `{dksAll:[dks1..4],delay}` with delay stored ms AS-IS (import does `delay/10`), socd §6.8 union, typecheck 0 / lint 0 all independently re-run and pass. 3b: first pass FAILED (F1 — criterion factually wrong vs SDK contract); after rev1 + fix-round `c8fd88e`, 3b meets the revised criterion ✓.

### Failed items (first pass — RESOLVED)

**F1 — RESOLVED in fix-round `c8fd88e` (re-review PASS, see verdict above). Original finding retained for the record:** `advancedKeys.value` must be the numeric mode id, not the trigger; SDK import resolves the setter via `advancedKeysSdkMap[value]`, so every advanced key throws on import. *(root cause = wrong Done-when 3b criterion → PM revision + PO confirmation; Worker followed the criterion faithfully.)*

- **Bundle evidence (verbatim, `@sparklinkplayjoy/sdk-keyboard/dist/esm/index.js`, re-extracted this session):**
  - `advancedKeysSdkMap={1:setDks,2:setMpt,3:setMT,4:setTGL,5:setEND,6:setMacro,8:setSocd,9:setRS}` — **keys are mode ids** (matches sdk-ref §5.2 table, Verified).
  - `async setAdvancedKeys(e,t){try{const{advancedType:r,value:n,dks:s,mpt:i,mt:o,tgl:a,end:c,socd:u,macro:l}=t,h=this.advancedKeysSdkMap[n];let d;if("dks"===r){…d=await h({key:e,dks:o,trps:a,dbs:c})}else if("mt"===r){…d=await h({key:e,dks:n,delay:r/10})}…}catch(e){throw …new Error(`高级键设置失败: ${e.message}`)}}`
  - ⇒ the **branch** is chosen by `advancedType` (`r`), but the **setter `h`** is `advancedKeysSdkMap[value]` (`n`). If `value` is not a mode id, `h === undefined` and `await h(…)` throws TypeError → caught → `throw new Error("高级键设置失败")`.
  - Import chain (bundle-verified): app import → SDK `importConfig` → `setImportData` → `setKeyboards` → per-key `setAdvancedKeys(keyValue, advancedKeys)`; `setKeyboards` destructures `advancedKeys` straight from the JSON entry. No app-side remap exists (`grep -rn advancedKeys src/` outside ExportService = 0 hits).
- **Defect location — `src/services/ExportService.ts:388-399`:**
  ```
  let advancedValue = 0;
  switch (advancedKeyMode) {
    case 1: … advancedValue = dks.dks; break;      // trigger key code
    case 2: … advancedValue = mpt.dks[0] ?? 0; break;
    case 3: … advancedValue = mt.dks1; break;
    case 4: … advancedValue = tgl.dks; break;
    case 5: … advancedValue = end.dks; break;
    case 8: … advancedValue = socd.type; break;    // 0..3 — can even collide with a real mode id → wrong setter
  }
  advancedKeys.value = advancedValue;               // ← stores trigger/type, NOT the mode id
  ```
- **Consequence:** importing the app's own export feeds `advancedKeysSdkMap[<triggercode>]` = `undefined` for every configured advanced key ⇒ all advanced-key writes throw ⇒ the export→import round-trip (the sprint goal) fails on-device.
- **Contract (from the consumer, authoritative):** `value` MUST equal the numeric `advancedKeyMode` id already read at `ExportService.ts:386`. `advancedType` = `ADVANCED_KEY_MODE_MAP[advancedKeyMode]` is correct and stays. With `value = advancedKeyMode`, the entire `:388-399` trigger switch becomes unnecessary.
- **Routing (per CLAUDE.md "wrong done-criterion"):** Done-when 3b's "`value` from the mode's primary trigger" clause is contradicted by the bundle → route to **PM (plan mode)** to revise + log, **on PO confirmation**; the revised criterion **must be written into THIS review file** before the fix Worker opens (the Reviewer judges the review file, not current-sprint.md). Then a new Worker window fixes ONLY this item.
- **Verify-by (reviewer/worker re-run):** re-extract `setAdvancedKeys` from the bundle (confirm `h=this.advancedKeysSdkMap[n]`, `n=value`) and `advancedKeysSdkMap` keys; `grep -n "advancedKeys.value =" src/services/ExportService.ts`.

---
**Reviewer cleanup (actual `ls`):** `.scratch/` = pce-test/, pm-notes.md (pre-existing, PO-emptied, gitignored) + `review-getvalues.js` (mine this session — throwaway bundle extractor; PO can delete). `_to_delete/` = .gitkeep + DebugKeyboardService.ts (pre-existing; PO must `git rm`). No tracked repo files deleted or edited beyond this review file + current-sprint.md status lines.
**Reviewer sign-off:** verdict FAIL, 1 failed item (F1). Never edited source. 3a/3c/3d PASS; F1 = wrong Done-when 3b criterion routed to PM.

---
**Fix-round re-review (2026-10-14):** Reviewer cleanup (actual `ls`): `.scratch/` = pce-test/, pm-notes.md, review-getvalues.js (pre-existing, PO may delete) + `review-notes.md` (mine this session — working notes; PO may delete). `_to_delete/` = .gitkeep + DebugKeyboardService.ts (PO must `git rm`). No new cleanup otherwise; never edited source.
**Fix-round sign-off:** verdict PASS (pending hw), 0 failed items. F1 confirmed fixed against the diff; gates re-run (advancedValue 0 · value=advancedKeyMode 1 · typecheck 0 · lint 0). Task → HW-TEST; PO exercises the Hardware check items 1-4 on a real device.
