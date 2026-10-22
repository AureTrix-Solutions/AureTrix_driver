# REVIEW: d2-advanced-keys (Task 3 group: 3a→3d)

**SPRINT GOAL:** ExportService export/import review sprint — make the exported JSON round-trip correctly through the SDK's own import path (D-group fixes), verified against docs/sdk-reference-v2.md.
**TASK:** D2 group: advanced keys — KS wrappers + canonical export shapes (3a→3d, ONE review over the cumulative diff)  ·  **TAG:** [high-stakes] [hw]
**DONE WHEN:**
- 3a: `grep -c "async getDksAll\|async getTrpsAll\|async getMtorTgl" src/services/KeyboardService.ts` = 3; wrappers return `Error` instances, never throw; typecheck 0.
- 3b (REVISED rev1 2026-10-14, PO-confirmed — the original "value from the mode's primary trigger" clause was wrong vs the SDK contract, see §F1): gatherAdvancedKeyData sets `advancedKeys.advancedType` from live `advancedKeyMode` via ADVANCED_KEY_MODE_MAP (sdk-ref §5.2) and `advancedKeys.value` to the **numeric `advancedKeyMode` id** (SDK setAdvancedKeys resolves the setter via `advancedKeysSdkMap[value]`; per-mode data travels in its sibling field); no `advancedValue`/trigger switch remains; no stale "not yet read" comment; typecheck 0, lint 0. Fix-round greps: `grep -c "advancedValue" src/services/ExportService.ts` = 0; `grep -c "advancedKeys.value = advancedKeyMode" src/services/ExportService.ts` = 1.
- 3c: canonical dks export shape `{dks:{1,2,3},trps:{1,2,3},db,db2,db3}` from getDksAll/getTrpsAll/getDksTravel(Layout_DB1/2/3); `grep -c "Layout_DB3" src/services/ExportService.ts` ≥ 1; KS get/setDksTravel annotated `number|Error`; typecheck 0, lint 0.
- 3d: mt export shape `{dksAll:[dks1..4], delay}` with delay = getMtorTgl's ms value stored AS-IS (NO ÷10 — import's mt branch does `delay/10` before cmdMT, which puts the 10ms wire unit on the wire); socd confirmed against sdk-ref §6.8 union (no change expected); tgl/mpt/end stay raw; `grep -c "getMtorTgl" src/services/ExportService.ts` ≥ 1; typecheck 0, lint 0.
- **rev2 (2026-10-15, PO-approved):** the §F3 import-side delay-survival criterion is VOID for this task — re-routed to Task 4c (see §F3 PM DISPOSITION below). Task 3's hw criterion as closed = the export JSON carries correct shapes/values (DKS 4-point, SOCD 7-field, mt/tgl/mpt/end raw, delays present in the export) — verified ✓ on the PO's device 2026-10-15. Code criteria 3a–3d unchanged (PASS, fix-round range `223be41..b1e7423`).
<!-- If a criterion is revised after this file exists, UPDATE it here too — the Reviewer judges
     this file, not current-sprint.md. -->

## 📝 Worker notes & self-check
- 3a (`0ed9715`): added getDksAll/getTrpsAll/getMtorTgl wrappers to KeyboardService near getDksTravel; try/catch → return Error; JSDoc cites sdk-ref §6.2/§6.3.
- 3b (`bab76eb`): module-level ADVANCED_KEY_MODE_MAP (§5.2) + value switch (dks.dks/mpt.dks[0]/mt.dks1/tgl.dks/end.dks/socd.type; macro & RS → 0); stale comment replaced.
- 3c (`b4de552`): canonical dks shape stored; KS get/setDksTravel annotations fixed to `number|Error` (sdk-ref Verified: plain mm); db3 carried (extra props pass SDK validation).
- 3d (`d54e780`): getMtorTgl read added in gatherAdvancedKeyData (fires for every key like the db reads, stored only when mt non-Error); mt store now `{dksAll:[mt.dks1..dks4], delay: mtorTglDelay ms AS-IS}`; socd CONFIRMED against §6.8 union — existing raw store correct, unchanged; tgl/mpt/end raw stores unchanged; switch case 3/4 read raw local vars, unaffected; comment above the stores updated to name dks+mt as canonical.
- **3b F1 fix-round (`c8fd88e`)**: `advancedKeys.value` now = numeric `advancedKeyMode` id (SDK setAdvancedKeys resolves the setter via `advancedKeysSdkMap[value]`); trigger switch + `advancedValue` deleted; replacement comment names the sibling-field data path. Scope addition: lint's no-unused-vars caught the `dks` local (old :302, `getDks(keyValue)`) — consumed ONLY by the deleted switch (canonical dks shape uses dksAll/trpsAll; mpt/socd/tgl/end/mt have their own stores) ⇒ its read + 50ms delay removed as dead code; no payload shape change (the switch value never entered the payload otherwise). +4/−17, ExportService.ts only. Gates re-run post-fix: `grep -c "advancedValue"` = 0; `grep -c "advancedKeys.value = advancedKeyMode"` = 1; `grep -c "getDks("` = 0; typecheck exit 0; lint exit 0.
- **F2 fix-round (`b1e7423`)**: two edits, ExportService.ts only (+10/−3). (1) DKS canonical store now emits points 1-4 for `dks` and `trps` (was 1-3): firmware wire (protocol DKSDataPack, pack.ts:153 — `[key, ...dks 2B-LE each, ...trps 1B raw each, ...dbs 2B-LE each]`) expects 4+4 points; a 3-point payload byte-shifts everything after dks3 and exactly reproduced PO's corruption (recomputed through the 3-point wire: mt.dksAll[4]=7171, trps {96,231,1}, db 0.487→0.011). getDksAll/getTrpsAll wrappers already returned 4 points — only the store was truncated. (2) SOCD read changed to `getSocd(keyValue, '1.0.7')`: bundle getSocdData (verified this session) version-gates the decode — default '1.0.5' yields the lossy `{pos,key,type,mode}`, ≥'1.0.7' yields `{pos1,pos2,key1,key2,type,mode,delay}`; import's socd branch passes ONLY the stored socd object to setSocd→SOCDPack, which destructures the 7-field shape → the old 4-field store left pos1/pos2/key1/key2 undefined (NaN wire bytes = dead keys + 8996 garbage siblings). Verbatim storage of the read object is now correct because the read shape matches the write shape. KS.getSocd(key,version?) already forwarded version (KS:1215, verified); SocdConfig union already typed both shapes. Gates re-run: typecheck exit 0 (baseline 0), lint exit 0. Not touched: mpt/mt/tgl/end branches (hw-verified passing), KeyboardService wrappers, import side; db3-dropped-by-SDK remains Task 4b scope (bundle dks branch consumes only db/db2 ×1000).
- Self-check vs sdk-reference-v2.md: §6.2 (getDksAll/getTrpsAll shapes, Verified), §6.3 (getMtorTgl = Layout_MTDelay raw ×10 = ms, Verified — the mt delay round-trip math), §6.6 (TGL delay 10ms wire unit, Verified), §6.8 (getSocd union `{pos1,pos2,key1,key2,type,mode,delay}` v≥1.0.7 | `{pos,key,type,mode}` — matches KS SocdConfig exactly), §5.2 (advancedKeyMode map). Import mt branch (bundle-verified in 3c): `const {dksAll,delay}=o; cmdMT({key,dks:getValues(dksAll),delay:delay/10})`.
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (3a wrappers + KS annotations).
- typecheck/build: `npm run typecheck` 0 errors at each of 3a–3d; `npm run lint` 0 errors/warnings at 3b–3d. Build not run (no build-affecting change beyond service code that typecheck+lint cover).

## 🔍 Commits to review
Base: `9f7ecfa` (Task 2 / branch-reviewed point)   Head: `d54e780` (Task 3d)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat 9f7ecfa..d54e780     then      git diff 9f7ecfa..d54e780
     A file touched outside this task's scope is a flag. -->
Fix-round ranges (added on each re-review): F1 → `d54e780..c8fd88e` (3b value=mode-id fix + orphan getDks removal; 1 file, +4/−17) · F2 → `223be41..b1e7423` (DKS 4-point payload + SOCD '1.0.7' read; source diff = ExportService.ts only, +10/−3 in `b1e7423`; `07efe2d` in the range is the research/checkpoint commit — current-sprint.md only, no source)

## 🖥️ Hardware check ([hw] tasks only)
**Worker fills (what to test):**
- What changed (that touches hardware behavior): Export now reads three additional values per key (getDksAll, getTrpsAll, getMtorTgl) and stores canonical shapes for dks and mt in the exported JSON; advancedType/value now come from the live advancedKeyMode. Import consumes these shapes via the SDK's own branches.
- What to verify: on a real device — (1) export a keyboard that has MT configured on at least one key, then import that JSON back: the MT key keeps its 4 dks codes and its delay (delay should survive in ms — e.g. a 30ms MT delay exports as 30 and re-imports as 30, not 3 or 300); (2) same round-trip for a DKS key (4-point curve + trps + dead bands db/db2/db3) and a SOCD key (config survives verbatim); (3) exported JSON shows advancedType matching the key's actual mode (e.g. "mt", "dks") instead of "none"; (4) export still completes without device errors/timeouts (the 3 extra reads per key lengthen the pass).

**F2 fix-round — what changed (plain language, for the PO's re-test):**
- DKS: the exported JSON now carries all 4 curve points and 4 trps points per key (previously 3+3 — the firmware wire needs 4+4, and the short payload shifted all following bytes, which is why trps/db came back scrambled).
- SOCD: the export now reads SOCD in the full 7-field format (pos1/pos2/key1/key2/type/mode/delay) instead of the lossy 4-field one, so import writes a well-formed SOCD record again.
- What to verify on a real device (F2 re-test = DKS + SOCD only; MPT/MT/TGL/END already passed and are untouched): (1) configure a DKS key (curve + trps + dead bands db/db2/db3), export, re-import → all values round-trip (in particular trps in order, db/db2 correct; db3 remains Task 4b scope — SDK import drops it, expect 0 for now); (2) configure a SOCD key, export, re-import → key still works (normal keypress fires), socd fields survive verbatim, no garbage (8996-type) values in sibling fields; (3) export completes without device errors.

**Hardware verdict (agent records from the PO's plain-language outcome):**
- Hardware verdict: FAIL — 2026-10-15 → see F2 (partial: MPT+MT+TGL+END round-trip ✓, DKS+SOCD ✗)
- F2 fix-round re-test: **Hardware verdict: FAIL — 2026-10-15 → see F3** (DKS ✓ fully operational + SOCD core ✓ — both F2 fixes confirmed on hardware; remaining defect: `socd.delay` + `end.delay` dropped on import, cross-cutting). Task 3 → IN-PROGRESS; Worker fix-round = import side only.
- **PM disposition (2026-10-15, PO-approved): F3 re-routed OUT of Task 3 → Task 4c.** Root cause sealed = SDK import-side wire-version default (`setAdvancedKeys` calls `setEND`/`setSocd` with ONE arg → v defaults `'1.0.5'` → packers omit delay bytes); no export-side edit can fix it, and the only fix (post-import re-write at v`'1.0.7'`) requires 4a's `decryptSDKConfig` + lands in 4b's repair region. Task 3's export work stands hw-verified ✓ → Task 3 = DONE (rev2); F3 closure = Task 4c's Reviewer pass + PO hw test (see §F3 disposition below). Detail: review-d2-advanced-keys.md §F3 PM disposition.

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
1. ~~dks branch consumes mt/tgl/end sibling fields~~ **CORRECTED 2026-10-15 (grep-verified this session; earlier F1-based hypothesis was WRONG — do not chase it).** Full `"dks"===r` branch from the bundle (`grep -o '"dks"===r.\{0,200\}'` in node_modules/@sparklinkplayjoy/sdk-keyboard/dist/esm/index.js): `"dks"===r){const{dks:t,trps:r,db:n,db2:i}=s,o=this.getValues(t),a=this.getValues(r),c=[1e3*n,1e3*i];d=await h({key:e,dks:o,trps:a,dbs:c})` — it DOES consume our exported `dks` object (`s` = `dks:{dks,trps,db,db2,db3}`), destructuring `{dks,trps,db,db2}`; **`db3` is silently dropped** and `db`/`db2` are ×1000 into `dbs:[1e3*db,1e3*db2]`; `getValues()` (see .scratch/review-getvalues.js if still present) converts the `{1:,2:,3:}` maps to arrays. So the corruption (trps shuffled, db 0.487→0.011, dksAll[4]→7171) is NOT from wrong-field consumption — verify instead: what `h` (the resolved setter, setDks) does with `{key,dks,trps,dbs}` (units? mm vs raw? ordering?), what our read-back path (getDksAll/getTrpsAll) returns after that write, and whether the EXPORT side already wrote wrong values to the device or only the read-back is misinterpreted. The p4 read-back `db 0.011` vs original `0.487` and `trps {96,231,1}` vs `{3,28,96}` are the anchors.
2. What our import path hands `setAdvancedKeys` for a dks key: `advancedKeys.dks` assembly at src/services/ExportService.ts:346 (grep `advancedKeys.dks = {`) and the SDK `setImportData`/`importConfig` chain's getValues order for dks.
3. **SOCD (PO detail 2026-10-15):** configured SOCD pairing on keys col3/keyValue32 + col4/keyValue33 (both `advancedKeyMode:8`, `advancedType:"socd"`, `value:8` ✓ correct in BOTH blocks — setter resolution works). Worked on p1; on p4 after import SOCD does not function at all — **not even a normal key press fires**. Read-back comparison: original both keys `socd.pos:41`; post-import both keys `socd.pos:32` (= col3's own keyValue; the pairing target was overwritten with self/other value). Sibling garbage post-import on BOTH keys: `dks.dks.1`, `mpt.dks[0]`, `mt.dksAll[0]`, `tgl.dks`, `end.dks` all = **8996** (0x2324 — bytes 35,36; was all 0), `end.delay` 65535→**243**, `deadBandPress/Release` 0.2→0. Bundle facts (grep-verified): socd branch is `"socd"===r)d=await h(u)` — passes ONLY the `socd` object `u` (`{pos,key,type,mode}`) to the setter, **no `key:e`** (contrast mpt branch `{key:e,...i}`); and `setSocd(e,t="1.0.5")` starts with a **semver version compare** (firmware-version-gated behavior — check protocol-keyboard/src setSocd/getSocd for what `pos` means and whether the version gate changes the payload). Also `grep -c setSocd src/services/KeyboardService.ts` = 0 — we never call setSocd directly; import goes through the SDK's setAdvancedKeys. Verify: what the device does with a socd payload lacking the acting key (is `pos` supposed to carry it? 41 = ? vs 32), and whether our export's socd read (`getSocd(keyValue)` in ExportService, grep `getSocd`) returns `{pos,key,type,mode}` in the order/semantics setSocd expects.

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

---
## ✅ REVIEWER VERDICT — F2 fix-round re-review
**Result:** PASS (pending hw) → **HW-TEST**  ·  **Date:** 2026-10-15  ·  **Fail count:** 0  ·  **Range:** `223be41..b1e7423` (F2 fix ONLY; F1 code PASS + MPT/MT/TGL/END hw PASS stand, not re-reviewed)

Both F2 fixes confirmed against the diff and independently re-verified end-to-end at protocol + bundle level this session:

- **Scope clean:** `git diff --stat 223be41..b1e7423` = ExportService.ts (+10/−3) + current-sprint.md (checkpoint/handoff mechanics). No stray source; mpt/mt/tgl/end branches, KeyboardService wrappers, and the import side all untouched in the diff.
- **Fix (1) DKS 4-point payload — VERIFIED.** Diff changes the canonical store at ExportService.ts:353 to `dks:{1,2,3,4: dksAll.dks4}` and `trps:{1,2,3,4: trpsAll.trps4}`; db/db2/db3 lines unchanged. Chain re-verified: KS getDksAll (:874) / getTrpsAll (:893) return dks1..4/trps1..4 → bundle `"dks"===r` branch `getValues` converts the point maps to arrays verbatim → protocol `DKSDataPack` (pack.ts:153) wire = `[key, ...dks 2B-LE each, ...trps 1B raw each, ...dbs 2B-LE each]`, length driven by the arrays passed → 4+4 now matches the read-back's 4-point decode (getDksRecdata/getTrpsRecdata, recdata.ts:404, ×4 per bundle getDksAll/getTrpsAll). The 3-point byte-shift that reproduced PO's corruption (7171 = (28<<8)|3, trps {96,231,1}, db→0.011) is eliminated. `db3` still dropped by the SDK dks branch (`dbs:[1e3*n,1e3*i]`) — known, Task 4b scope, NOT a regression of this fix.
- **Fix (2) SOCD '1.0.7' read — VERIFIED.** Diff changes ExportService.ts:327 to `getSocd(keyValue, '1.0.7')`. Chain re-verified: KS `getSocd(key, version?)` (:1215) forwards version to bundle `getSocd(e,t="1.0.5")` → `xs.getSocdData(e,t)`; protocol `getSocdRecdata` (recdata.ts:449) with v≥1.0.7 returns the 7-field `{pos1,pos2,key1,key2,type,mode,delay}` — exactly what `SOCDPack` (pack.ts:228) destructures on the import write (`"socd"===r)d=await h(u)` passes the stored object verbatim). The old default-'1.0.5' 4-field `{pos,key,type,mode}` store left pos1/pos2/key1/key2 undefined → the malformed wire write behind PO's dead keys / 8996 siblings.
- **Gates re-run THIS session:** `npm run typecheck` exit 0 ✓ · `npm run lint` exit 0 ✓.
- **Design intent untouched:** no filters/usagePage/wrapper-error changes; ExportService payload only.

**Non-defect observation (NOT a failed item, no action this round):** import writes SOCD via `setSocd` default v='1.0.5', so `SOCDPack`'s 1.0.5 branch emits the wire WITHOUT the delay field even though the exported object now carries `delay`. Pre-existing import-side SDK behavior, unchanged by this diff; if PO's hw re-test shows a SOCD delay mismatch, it becomes a new finding for the PM.

**[hw] task ⇒ status set to HW-TEST, not DONE.** PO re-test scope per the Hardware check section above: **DKS + SOCD round-trip only** (MPT/MT/TGL/END already hw-passed and are untouched). db3 = 0 after import is expected until Task 4b.

---
**F2 fix-round re-review (2026-10-15):** Reviewer cleanup (actual `ls`): `.scratch/` = pm-notes.md, review-notes.md (mine — banked verification notes; PO may delete). `_to_delete/` = .gitkeep only — no cleanup needed. Never edited source; edits this session = this review file + current-sprint.md status/RUN THIS lines.
**F2 fix-round sign-off:** verdict PASS (pending hw), 0 failed items. Both fixes confirmed against the diff + re-verified at protocol/bundle level; gates re-run clean. Task → HW-TEST; PO exercises the F2 hardware re-test (DKS + SOCD only).

---
## §F3 — Hardware verdict: FAIL — 2026-10-15 (PO; recorded by agent per Hardware gate)

**What PO did:** full F2 re-test on device — DKS round-trip (key col1/row1, kv30, mode 1), SOCD round-trip (pair col2/row4 kv29 + col3/row4 kv27, mode 8), END round-trip (mode 5, end.delay 1015 set deliberately — first-round test had no distinct delay). Export → import → re-export debug JSON compared field-by-field (pre/post blocks banked in `.scratch/review-notes.md`).

**Expected:** all configured fields survive the round-trip (db3 = 0 after import was the ONLY pre-registered expected gap, Task 4b).

**Actual — PASSED (F2 fixes confirmed on hardware, do NOT re-fix):**
- DKS ✓ operational: `dks` {22,4,9,8} identical incl. point 4 — no byte-shift, no 7171-type garbage; `trps` {1,4,32,128} identical in order (was corrupted {96,231,1} pre-fix); `db` 1.5 / `db2` 2.9 identical (was 0.011). Fix (1) verified.
- SOCD ✓ core working: `socd.pos1` 29 / `pos2` 27 / `mode` 2 survived on BOTH pair keys (was 41→32 + dead keys + 8996 garbage siblings pre-fix); keys fire normally. Fix (2) verified.
- END ✓ function (advancedType "end", value 5 stable; end.dks stable).

**Actual — FAILED (the F3 defect, ONE symptom class): delay fields dropped on import.**
- `socd.delay` 146 → 0 on both SOCD pair keys (post-import re-export).
- `end.delay` 1015 → 0 (END-mode key) AND 146 → 0 on both SOCD-mode keys — i.e. end.delay zeroes even when the import ran ONLY the dks branch (mode 1) or ONLY the socd branch (mode 8). The drop is **cross-cutting across import branches, not per-branch**.
- mt.delay/tgl.delay were 0 in the PO's SOCD-pair config (not exercised there); the earlier END-key block showed mt.delay 170/tgl.delay 170 surviving — mt/tgl delays appear to survive, but F3 must audit ALL delay-carrying setters, not assume.
- Not part of F3 (already routed, don't double-count): `performance.deadBandPressValue/ReleaseValue` 0→0.2 = F-2b-1 (Task 4b repair item 3); db3 never written by SDK dks branch = Task 4b repair item 1.

**Scope statement for the fix-round (PO decision 2026-10-15):** ONE consolidated fix task — `socd.delay` + `end.delay` + audit of other delay-carrying setters together. This is **import-side** (the F2 export fix stands untouched). Leads already banked (grep-verified this Reviewer session):
- SOCD: bundle import writes via `setSocd` default `t="1.0.5"` → protocol `SOCDPack` (pack.ts:228) 1.0.5 branch omits `delay` from the wire (delay only packed ≥1.0.7). Exported object DOES carry delay (7-field '1.0.7' read). Where to verify: bundle `"socd"===r)d=await h(u)` — does `h`/setSocd accept a version param the app can pass ('1.0.7'), or must the app re-write SOCD post-import (Task-4b-style repair)?
- END: where to verify: bundle import branches for `end` / any setEND write path + version gating — the cross-cutting zeroing on dks/socd-branch keys suggests an unconditional end-record write (or firmware-wide delay reset) during setKeyboards/setImportData, not the end branch itself.
- General: grep every delay-carrying pack/setter in protocol-keyboard/src/utils/pack.ts + recdata.ts for version gates; list which wire formats drop delay at the bundle's default versions.

**Fix-round rules:** Worker fixes ONLY this (§F3) — import-side delay preservation + audit; must NOT touch the F2 export fixes (they are hw-verified) or F-2b-1/db3 (Task 4b). Then Reviewer re-check + PO hardware re-test (DKS/SOCD/END delays survive; no regression of the ✓ items above).

---
**F3 record (2026-10-15):** agent file mechanics complete — verdict line updated, §F3 written, Task 3 → IN-PROGRESS, ▶ RUN THIS → Worker fix-ONLY-F3 (checklist cites this §F3). Evidence banked pre-record in `.scratch/review-notes.md` (PO may delete after fix-round). Never edited source.

---
## §F3 PM DISPOSITION — re-routed to Task 4c (2026-10-15, PO-approved)

**Ruling: F3 does NOT belong in Task 3. Task 3 → DONE (rev2); the delay-drop defect becomes Task 4c** [high-stakes][hw], grouped with 4a/4b under ONE Reviewer pass at group end. Not backlog — F3 is a hw-confirmed FAIL of the sprint goal and its fix lands in the code region Task 4 already owns (it *requires* 4a's `decryptSDKConfig`; the config object never leaves SDK import until 4a builds it).

**Root cause SEALED this session (grep-verified; do not re-derive — grep targets in each line):**
1. **Export is correct — Task 3 stands hw-verified.** `ExportService.ts` reads socd at `'1.0.7'` (grep `getSocd(keyValue, '1.0.7')` → :327) and stores end verbatim (grep `advancedKeys.end = end` → :385); PO's re-test confirmed the JSON carries real `socd.delay`/`end.delay`. Nothing in Task 3's export-side scope can fix an import-side wire drop.
2. **SDK import hard-calls the setters at the version DEFAULT, which omits delay.** bundle `setAdvancedKeys` (grep `async setAdvancedKeys(e,t)` in sdk-keyboard/dist/esm/index.js): end branch `const{dks:t,delay:r}=c; d=await h({key:e,dks:t,delay:r})` — **one arg to h=setEND**; socd branch `d=await h(u)` — **one arg to h=setSocd**. Facade: `setEND=(e,t="1.0.5")=>…`, `setSocd=(e,t="1.0.5")=>…` (grep `setEND=`/`setSocd=`) ⇒ both default to `'1.0.5'`.
3. **`'1.0.5'` packs no delay bytes.** protocol-keyboard `src/utils/pack.ts`: `ENDDataPack` (grep `export const ENDDataPack`) — delay only in the v≥'1.0.7' branch `[key,...dksbits,...delaybits]`; the 1.0.5/1.0.6 branch is `[key,...dksbits]`, NO delay. `SOCDPack` (grep `export const SOCDPack`) — same v≥1.0.7 gate; 1.0.5/1.0.6 returns `[pos1,pos2,...key1V,...key2V,type,mode]`, NO delay. sdk-reference-v2 §6.7 (:149) / §6.8 (:150) rows — Verified — state this verbatim ("delay silently dropped unless v ≥ 1.0.7").
4. **mt/tgl delay audit CLOSED — they survive by construction.** `MTDataPack` (grep `export const MTDataPack`) returns `[key,...dks,delay]` and `TGLDataPack` (grep `export const TGLDataPack`) returns `[key,...dksbits,delay/10]` — delay packed at ALL versions, no gate. This explains the PO's observation (mt/tgl 170 survived) and retires the "audit ALL delay-carrying setters" item — only socd + end are gated.

**Why the earlier §F3 "cross-cutting zeroing on dks/socd-branch keys" was a red herring:** the Worker's F3-2 lead (setKeyboards prime suspect / rogue end-write) is disproved — the end.delay 146→0 seen on SOCD-mode keys is simply that *every* key's END record is written at v'1.0.5' with no delay bytes whenever setAdvancedKeys runs the end branch, and where it doesn't run the end branch the pre-existing end.delay was already 0/garbage. There is no cross-cutting writer; there is one version-gated packer used by two branches.

**Fix (Task 4c) = post-import re-write at v'1.0.7'**, structurally identical to 4b's repair items. The app CAN pass the version: sdk-ref :1150 "v is settable on exactly three methods — setEND, setSocd, getSocd"; the SDK import path just never does. Full edit spec handed over in current-sprint.md Task 4c (grep-verified anchors: KS `async getSocd(key: number, version?: string)` :1215 / `async getEND(key: number)` :1257; ES importProfile :717-768, batcher already present `processBatches` :23).

**Closure test for §F3 = Task 4c's hw gate:** configure SOCD + END with non-zero delays → export → wipe → import → delays survive readback + behavior; no regression of the ✓ items above (DKS 4-point, SOCD core pos/mode). Reviewer re-checks 4a→4c cumulative diff ONCE at group end.

**Residual risk (flagged to PO, accepted):** the 1.0.7 *write* packets are longer than any the app has sent; the device demonstrably speaks ≥1.0.7 (the 1.0.7 *read* is hw-verified ✓), but firmware acceptance of the longer write is exactly what 4c's hw gate confirms.
