# REVIEW: sprint-11-task-4-keyboard-ratchet

**SPRINT GOAL:** Ratchet ESLint warnings 221 → 0 honestly (real types + real dead-code removal, no new suppressions), delete the orphaned DebugKeyboardService, and end with the three deferred rules promoted to errors and docs/lint-baseline.txt at 0 — mirroring the tsc-baseline ratchet (sprint-07).
**TASK:** KeyboardService ratchet (42 sites: 35 any + 5 unused + 2 pce), sub-tasks 4a→4d  ·  **TAG:** [high-stakes]
**DONE WHEN:**
- `npx eslint src/services/KeyboardService.ts` → 0 warnings (was 43 at task start)
- Cumulative `npm run lint` totals per sub-task: 4a → 123, 4b → 111, 4c → 104, 4d → 94 (rev1 PO decision a1 shifted each −1)
- `npm run typecheck` → 0 errors at every sub-task; unmasked caller errors fixed in-task, never silenced
- Suppression gate clean: `git diff | grep -E "^\+.*(as any|@ts-ignore|@ts-expect-error|eslint-disable)"` → nothing across the whole 50bba97..head range
- docs/lint-baseline.txt re-ratcheted down at each sub-task (final line 1 = 94) with one `#` history line each
- `npm run build` passes
- Wrappers still RETURN Error (design intent), never throw

## 📝 Worker notes & self-check
- **4a (commit 646edeb):** 14 sites — console shim `unknown[]`; getBaseInfo → exported `KeyboardBaseInfo` (11 §3 fields); getMacro → `MacroSlotInfo`; setMacro → `(IMacroMode, MacroType[], string)`; setGlobalTouchTravel → IDB; 2 pce → `{ cause: error }`; 5 unused. ExportService: buildMacroLibrary dead `.macros` body → always-empty return (PO decision a1 — SDK has no macro-action readback, getMacroDataRecdata is a stub); gatherDeviceInfo 5 dead reads → literal defaults, export shape unchanged.
- **4b (commit 43bb8a8):** 12 sites — calibrationStart/End → `null | Error`; getRm6X21Travel `status: number[][]`; getLighting/getLogoLighting → `ILightMode & { dynamicColorId: number } | Error` (bundle getPRGB decoder); getSpecialLighting → `ILightMode | Error`; setLighting/setSpecialLighting params → `LightModeConfigs`, setLogoLighting → `ILoGoLightMode`; setter returns → `DataView | DataView[] | null | Error` (sendData passthrough) except setSpecialLighting. Unmasked ExportService:387 dead `open === 1` TS2367 branch dropped.
- **4c (commit 94406d7):** 7 sites — closedLighting → `boolean | Error`; getCustomLighting/setCustomLighting → exported `CustomLightColor {key,R,G,B}` (UPPERCASE per bundle getSingleRGB — SDK's IKRGBDesc is lowercase and wrong); saveCustomLighting → `undefined | Error`; switchConfig → `{configID, hasFourConfig:true} | Error`; getApi → `(param: ICmd)` + exported `GetApiResult` union (§3 verified table). Unmasked: ExportService `.sArg` reads always-dead → literals 3/0 preserved + Finding; 2 dead `R !== undefined` TS2367 guards dropped (Lighting.vue, ExportService).
- **4d (this commit):** 10 sites — getDks → `{dks:number} | Error`; getMpt → `{dks:number[]; dbs:number[]} | Error`; getSocd → exported `SocdConfig` v-dependent union (≥1.0.7 7-field / else 4-field, recdata getSocdRecdata); getMT → `{dks1,dks2,dks3,dks4:number} | Error` (BUNDLE-verified: controller decodes 4× getDksRecdata — recdata.ts getMTRecdata stub is dead code); getTGL/getEND → `{dks:number; delay:number} | Error`; setPollingRate → `number | Error` (bundle setRateOfReturn catch RESOLVES the error → instanceof guard live at runtime despite `Promise<number>` d.ts; local `unknown` + one honest `as number` final-return narrow, comment in place); setSystemMode → `number | null | Error` (recdata SET_WIN/MAC_MODEL decode); exportConfig param `data: any` → `KeyboardConfig`, importConfig → `ImportResult | Error` (both deep-imported from sdk-keyboard validate.d.ts; ImportResult = `{success: boolean; error?: string}`).
- **4d unmask fixed in-task:** ExportService.gatherAdvancedKeyData — `retryWithBackoff<T>` is generic, so the 6 tightened getters unmasked TS2339s on `.enable`/`.keyValue`/`.triggeringPoint`/`.mode` reads that NO verified read-back shape has ever had → every guard was always falsy → exported `advancedType` was ALWAYS `'none'`, `value` ALWAYS `0` (raw per-mode objects under `advancedKeys.dks/.mpt/...` exported correctly all along — `AdvancedKeyConfig` slots are `any`). Fix per 4a/4c precedent: 5 dead inner guards + `activeType`/`activeValue` locals dropped, trailing unconditional `advancedType:'none', value:0` (byte-identical export), WHY comment in place, Finding logged → `exportservice-review` (making advancedType live is a PO call).
- Self-check vs sdk-reference-v2.md: §3 (getApi union), §4 (setRateOfReturn, switchSystemMode), §6.1/6.4/6.5/6.6/6.7/6.8 (DKS/MPT/MT/TGL/END/SOCD getters), §7 (getMacro), §8 (lighting), §9 (export/importConfig) — every section's Verification-status row checked first; where prose and source disagreed (MT decoder, CustomLightColor case, IKRGBDesc), protocol-keyboard/src or the minified bundle was authoritative and the discrepancy is recorded in the checkpoint lines.
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (every typed signature keeps `| Error`; no wrapper converted to throw)
- typecheck/build: `npm run typecheck` → 0 errors (all 4 sub-tasks; 4d unmasked exactly the gatherAdvancedKeyData TS2339 burst + 1 internal TS2358, both fixed in-task, nothing silenced, tsc baseline stays 0). `npm run build` → ✓ (4d first run hit the known environmental segfault/OOM, clean retry built in 1.58s — same pattern as 4b).
- Lint totals re-run at each sub-task end: 123 → 111 → 104 → 94; docs/lint-baseline.txt line 1 = 94 with 4 history lines (4a/4b/4c/4d).
- Suppression gate across the full task: 0 hits (the one `as number` in setPollingRate is not in the banned set — banned = `as any`/`@ts-ignore`/`@ts-expect-error`/`eslint-disable`; it narrows a bundle-verified runtime shape and carries a WHY comment).
- Cleanup (from `ls`, post-4d): `.scratch/` = classify.awk, dead-inventory.txt, lint-out.txt, lint-per-file-rule.txt, lint-postopt.txt, matrix.txt, pce-test, pm-notes.md, test-eslint.config.mjs, unused-class.txt, unused2.txt, unused3.txt (PM/Worker research dumps — PO may delete); `_to_delete/` = DebugKeyboardService.ts (PO must `git rm` after sign-off). No new files added by 4d.

## 🔍 Commits to review
Base: `50bba97` (Task 3 close)   Head: this commit (the one containing this review file; 4a–4d code commits in between: 646edeb, 43bb8a8, 94406d7 — 3f1273c/fcab76c are plan-only)
<!-- Reviewer runs: git diff --stat 50bba97..HEAD then git diff 50bba97..HEAD
     Files expected in scope: src/services/KeyboardService.ts, src/services/ExportService.ts,
     src/pages/Lighting.vue (1 dropped dead guard, 4c), docs/lint-baseline.txt,
     docs/plans/current-sprint.md, docs/plans/reviews/* (this file). Anything else is a flag. -->
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — Task 4 is not tagged [hw]. (Typing-only ratchet; no runtime behavior changed. The one behavior-adjacent edit — gatherAdvancedKeyData — provably preserves the exported JSON byte-for-byte: the dropped guards were always falsy.)

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
**Result:** PASS  ·  **Date:** 2026-10-12  ·  **Fail count:** 0

### Failed items (FAIL only)
None.

### Gate re-runs (Reviewer, all exact)
- `npx eslint src/services/KeyboardService.ts` → exit 0, **0 warnings** ✓ (Done-when: 0)
- `npm run lint` → **94 problems (0 errors, 94 warnings)** ✓ = baseline; no warning lines in KeyboardService.ts ✓ (Done-when: total 94)
- `npm run typecheck` → exit 0 ✓ (Done-when: 0 errors)
- `npm run build` → exit 0, built in 1.41s ✓
- Suppression gate on added lines of `*.ts`/`*.vue`/`*.mjs` → **0 hits** ✓ (only matches are the gate command quoted in current-sprint.md + this review file — docs, not source)
- `docs/lint-baseline.txt` line 1 = **94**; ratchet history 137→123→111→104→94 intact with per-sub-task lines ✓
- Diff scope = 4 files (KeyboardService.ts, ExportService.ts, Lighting.vue + planning docs) — matches task plan; no stray files ✓

### SDK claims spot-verified (bundle dist/cjs/index.js + protocol-keyboard/src/utils/recdata.ts)
- `getDks/getMpt/getSocd/getTGL/getEND/getMacro` return unions match the recdata decoders member-for-member (incl. SocdConfig's v-dependent 1.0.5-vs-else branches, default `"1.0.5"` ✓)
- `getMT` → `{dks1..dks4}`: recdata `getMTRecdata` is a stub (`return data`); the bundle's `getMT` decodes per-layout with dks1..dks4 — claim correctly sourced from the bundle ✓
- `CustomLightColor {key,R,G,B}` uppercase per bundle `getSingleRGB` ✓ (lowercase IKRGBDesc correctly rejected); `saveCustomLighting` → `undefined|Error` (no success return in bundle) ✓
- `ILightMode & {dynamicColorId}` per bundle `getPRGB` (field defaults 0, populated later) ✓; `getSpecialSingleRGB` 9-field ILightMode shape ✓; `ILightMode.open: boolean` per interface.ts:106 ✓
- `calibrationStart/End` → `null|Error`: bundle `getCmd` ends `…:null` with no ORDER_TYPE 12/13 branch ✓
- `setSystemMode` → `number|null|Error`: bundle `switchSystemMode` → `getCmd` ✓
- `setPollingRate` → `number|Error`: bundle `setRateOfReturn` catch **resolves** the error (`catch(e){return e}`), so the `instanceof` guard is live despite the `Promise<number>` d.ts; the final `as number` is an honest post-guard narrow ✓
- `GetApiResult` union matches every `Gn` (getCmd) branch: text/version-string/precision-object/raw index number/`{configID,hasFourConfig:true}`/axisList/both system shapes/two booleans/`{r,g,b}`/null fall-through ✓; sdk-reference §3 rows corroborate (`TOP_DEAD_SWITCH` → boolean :475, `ROES` → index number :518) ✓
- ExportService dead-code claims all hold: `.sArg` absent from the getApi union → literals `3`/`0` preserve prior exported values, HID queries kept; `open === 1` impossible on `boolean`; `R !== undefined` impossible on typed `R: number`; decoder shapes carry no `.enable`/`.keyValue`/`.triggeringPoint` → `advancedType` was always `'none'` and `activeType`/`activeValue` were always `undefined` (JSON.stringify drops undefined → export byte-identical) ✓
- Wrapper contract intact across all touched wrappers: `connectedDevice` guard, `ensureKeyboard()`, `instanceof Error` pass-through, outer try/catch → console.error + return — signature/type-only edits; the two `{ cause }` throws are the pre-existing non-wrapper sites (requestDevice/initializeDevice), untouched by design ✓

### Reviewer Findings
- None new. Worker-logged observations (getMacroDataRecdata stub; `.sArg` live-read = PO call; connection.ts getBaseInfo spread) already sit in `## Findings` / backlog routing.

### Cleanup report (from actual `ls`, Reviewer)
- `.scratch/`: 14 entries — 12 pre-existing PM/Worker files + `.scratch/ks.diff` and `.scratch/es.diff` staged by this review (PO may delete freely; gitignored).
- `_to_delete/`: `DebugKeyboardService.ts` (from Task 2 — PO must `git rm`).
