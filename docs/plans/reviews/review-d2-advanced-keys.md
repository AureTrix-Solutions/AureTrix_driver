# REVIEW: d2-advanced-keys (Task 3 group: 3a→3d)

**SPRINT GOAL:** ExportService export/import review sprint — make the exported JSON round-trip correctly through the SDK's own import path (D-group fixes), verified against docs/sdk-reference-v2.md.
**TASK:** D2 group: advanced keys — KS wrappers + canonical export shapes (3a→3d, ONE review over the cumulative diff)  ·  **TAG:** [high-stakes] [hw]
**DONE WHEN:**
- 3a: `grep -c "async getDksAll\|async getTrpsAll\|async getMtorTgl" src/services/KeyboardService.ts` = 3; wrappers return `Error` instances, never throw; typecheck 0.
- 3b: gatherAdvancedKeyData sets `advancedKeys.advancedType` from live `advancedKeyMode` via ADVANCED_KEY_MODE_MAP (sdk-ref §5.2) and `advancedKeys.value` from the mode's primary trigger; no stale "not yet read" comment; typecheck 0, lint 0.
- 3c: canonical dks export shape `{dks:{1,2,3},trps:{1,2,3},db,db2,db3}` from getDksAll/getTrpsAll/getDksTravel(Layout_DB1/2/3); `grep -c "Layout_DB3" src/services/ExportService.ts` ≥ 1; KS get/setDksTravel annotated `number|Error`; typecheck 0, lint 0.
- 3d: mt export shape `{dksAll:[dks1..4], delay}` with delay = getMtorTgl's ms value stored AS-IS (NO ÷10 — import's mt branch does `delay/10` before cmdMT, which puts the 10ms wire unit on the wire); socd confirmed against sdk-ref §6.8 union (no change expected); tgl/mpt/end stay raw; `grep -c "getMtorTgl" src/services/ExportService.ts` ≥ 1; typecheck 0, lint 0.
<!-- If a criterion is revised after this file exists, UPDATE it here too — the Reviewer judges
     this file, not current-sprint.md. -->

## 📝 Worker notes & self-check
- 3a (`0ed9715`): added getDksAll/getTrpsAll/getMtorTgl wrappers to KeyboardService near getDksTravel; try/catch → return Error; JSDoc cites sdk-ref §6.2/§6.3.
- 3b (`bab76eb`): module-level ADVANCED_KEY_MODE_MAP (§5.2) + value switch (dks.dks/mpt.dks[0]/mt.dks1/tgl.dks/end.dks/socd.type; macro & RS → 0); stale comment replaced.
- 3c (`b4de552`): canonical dks shape stored; KS get/setDksTravel annotations fixed to `number|Error` (sdk-ref Verified: plain mm); db3 carried (extra props pass SDK validation).
- 3d (`d54e780`): getMtorTgl read added in gatherAdvancedKeyData (fires for every key like the db reads, stored only when mt non-Error); mt store now `{dksAll:[mt.dks1..dks4], delay: mtorTglDelay ms AS-IS}`; socd CONFIRMED against §6.8 union — existing raw store correct, unchanged; tgl/mpt/end raw stores unchanged; switch case 3/4 read raw local vars, unaffected; comment above the stores updated to name dks+mt as canonical.
- Self-check vs sdk-reference-v2.md: §6.2 (getDksAll/getTrpsAll shapes, Verified), §6.3 (getMtorTgl = Layout_MTDelay raw ×10 = ms, Verified — the mt delay round-trip math), §6.6 (TGL delay 10ms wire unit, Verified), §6.8 (getSocd union `{pos1,pos2,key1,key2,type,mode,delay}` v≥1.0.7 | `{pos,key,type,mode}` — matches KS SocdConfig exactly), §5.2 (advancedKeyMode map). Import mt branch (bundle-verified in 3c): `const {dksAll,delay}=o; cmdMT({key,dks:getValues(dksAll),delay:delay/10})`.
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (3a wrappers + KS annotations).
- typecheck/build: `npm run typecheck` 0 errors at each of 3a–3d; `npm run lint` 0 errors/warnings at 3b–3d. Build not run (no build-affecting change beyond service code that typecheck+lint cover).

## 🔍 Commits to review
Base: `9f7ecfa` (Task 2 / branch-reviewed point)   Head: `d54e780` (Task 3d)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat 9f7ecfa..d54e780     then      git diff 9f7ecfa..d54e780
     A file touched outside this task's scope is a flag. -->
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
**Worker fills (what to test):**
- What changed (that touches hardware behavior): Export now reads three additional values per key (getDksAll, getTrpsAll, getMtorTgl) and stores canonical shapes for dks and mt in the exported JSON; advancedType/value now come from the live advancedKeyMode. Import consumes these shapes via the SDK's own branches.
- What to verify: on a real device — (1) export a keyboard that has MT configured on at least one key, then import that JSON back: the MT key keeps its 4 dks codes and its delay (delay should survive in ms — e.g. a 30ms MT delay exports as 30 and re-imports as 30, not 3 or 300); (2) same round-trip for a DKS key (4-point curve + trps + dead bands db/db2/db3) and a SOCD key (config survives verbatim); (3) exported JSON shows advancedType matching the key's actual mode (e.g. "mt", "dks") instead of "none"; (4) export still completes without device errors/timeouts (the 3 extra reads per key lengthen the pass).

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
**Result:** <pending>  ·  **Date:** YYYY-MM-DD  ·  **Fail count:** <n>

### Failed items (FAIL only)
<!-- none yet -->
