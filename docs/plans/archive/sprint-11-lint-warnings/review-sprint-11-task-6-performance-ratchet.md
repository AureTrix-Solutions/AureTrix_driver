# REVIEW: sprint-11-task-6-performance-ratchet

**SPRINT GOAL:** Ratchet ESLint warnings 221 → 0 honestly (real types + real dead-code removal, no new suppressions), delete the orphaned DebugKeyboardService, and end with the three deferred rules promoted to errors and docs/lint-baseline.txt at 0 — mirroring the tsc-baseline ratchet (sprint-07).
**TASK:** Performance components ratchet (48 sites, sub-tasks 6a→6d, ONE cumulative review)  ·  **TAG:** [high-stakes]
**DONE WHEN:**
- 6a: `npm run lint` total → **65** — `src/components/performance/SingleKeyTravel.vue` (14: 13 unused dead locals from a watch-handler refactor + 1 `PropType<any>`) + `KeyTravel.vue` (1 `PropType<any>`) → 0 warnings each
- 6b: total → **56** — `GlobalTravel.vue` (9: 8 unused + 1 `const globalSettings = globalSettingsResult as any`, the cast dissolved against Task 4's typed wrapper via the existing instanceof guard) → 0 warnings
- 6c: total → **41** — `SwitchProfiles.vue` (11: 8 unused + 3 `type: Array as any`/`Object as any` props → `PropType<T>` with the real T) + `Performance.vue` (4 unused) → 0 warnings each
- 6d: total → **32** — `RapidTrigger.vue` (9: 7 `(result as any).x` casts on KS-wrapper results DELETEd relying on existing `instanceof Error` narrowing; 2 unused) → 0 warnings
- Every sub-task: `npm run typecheck` 0 errors; suppression gate 0 over the src/ diff (`git diff -- src/ | grep -E '^\+.*(as any|@ts-ignore|@ts-expect-error|eslint-disable)'` → no matches); docs/lint-baseline.txt line 1 re-ratcheted (down only) + one `#` history line; Finding-13 word-boundary greps clean for every deleted/renamed symbol in .vue files (no vue-tsc, no-undef off for .vue, Vite build untyped — nothing else catches a dangling ref)

## 📝 Worker notes & self-check
- **6a** (commit c37169e): baseLayout PropType → `IDefKeyInfo[][] | null` in SingleKeyTravel.vue + KeyTravel.vue (honest type from useMappedKeyboard); empty catches → `catch {`; 10 dead locals/params deleted (pure deletions, side-effectful awaits kept per nuance a). Finding: SingleKeyTravel declares prop baseLayout but never reads it (dead prop — out of scope, logged).
- **6b** (commit eb64773): dead `globalSettings = … as any` local deleted, 3 reads moved onto the instanceof-narrowed `globalSettingsResult`; 2 empty catches → `catch {`; 2 dead clamped+oldTravel pairs deleted (clamping side effects kept). ONE extra edit outside the named file: KS.getGlobalTouchTravel decl widened `{globalTouchTravel:number}` → `IDB | Error` (type-only, runtime untouched; decoder fills all 3 IDB fields; additive across all 4 readers). Finding #12 logged (mis-declaration).
- **6c** (commit ff22187 range): SwitchProfiles 3 prop casts → `PropType<IDefKeyInfo[]>`/`PropType<IDefKeyInfo[][]>`/`PropType<IDefKeyInfo[][] | null>` mirroring parent KeyTravel's own prop decls (grep-verified); `IDefKeyInfo` import thereby USED, not deleted; 5 unused catches → `catch {` (one catch legitimately rethrows — untouched); dead `keyValue` local deleted; live `startPolling` param → `_physicalKey`. Performance.vue: dead store import deleted; live `selectKey` params → `_rowIdx`/`_colIdx`; inner catch → `catch {`. Finding #13 logged (no gate catches a dangling .vue reference) → word-boundary greps became mandatory for 6d.
- **6d** (commit 0f1f9a2): `npx eslint RapidTrigger.vue` fresh = 9 sites ✓ matched plan. (1) 2 unused `selectKey` params → `_rowIdx`/`_colIdx` (fn LIVE: template @click + defineExpose — never delete, nuance b). (2) dead `const globalSettings = globalSettingsResult as any` deleted, 3 reads (globalTouchTravel/pressDead/releaseDead) moved onto the narrowed IDB result (legal since 6b's decl widen; 6b precedent). (3) 7 casts `(result as any).pressDead/.releaseDead` and `(dzResult as any)…` deleted, relying on existing `instanceof Error` narrowing. **MANDATORY pre-cast check hit the blocker the plan warned about:** KS.getDpDr was DECLARED `{dpThreshold, drThreshold}` — fields that exist on no verified shape. Bundle-verified payload = `{pressDead: number, releaseDead: number}` (mm; two cmdLayout reads Layout_DP/Layout_DR, each getDpDrRecdata u16LE ÷1000 — dist/esm/index.js snippet + sdk-reference §5.5 Verified row + protocol-keyboard recdata.ts:393). Fixed the DECLARATION type-only (KeyboardService.ts:743; runtime untouched; 6b precedent). All 6 .vue callers read pressDead/releaseDead (invisible to tsc — latent TS2339s dissolved, none unmasked to tsc). The one tsc-visible consumer unmasked: ExportService.gatherPerformanceKeyData read the phantom `dpThreshold`/`drThreshold` → always `undefined ?? 0` → exported dead-band values were ALWAYS 0 → preserved byte-identical as literal 0 + WHY comment (4c/4d precedent: value-preserving, live-value fix is a PO call → Finding logged, routed to backlog `exportservice-review`). Finding-13 word-boundary greps: `\bglobalSettings\b`, `\browIdx\b`, `\bcolIdx\b` in RapidTrigger.vue → ZERO remaining refs.
- Self-check vs sdk-reference-v2.md: §5.5 getDpDr row (Verified) — payload `{pressDead, releaseDead}` mm confirmed; cross-checked against protocol-keyboard/src/utils/recdata.ts:393 (getDpDrRecdata: u16LE ÷1000) and the sdk-keyboard dist/esm bundle implementation (bounded snippet). IDB fields for 6b cross-checked against its decoder per that sub-task's checkpoint.
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (getDpDr/getGlobalTouchTravel decls keep the `| Error` union; no throw introduced; runtime bodies untouched)
- typecheck/build: `npm run typecheck` → 0 errors after every sub-task (baseline docs/tsc-baseline.txt = 0, never re-ratcheted up). `npm run build` ✓ each sub-task (6a 1.63s, 6b 1.61s, 6c 1.58s, 6d 1.62s). Suppression gate 0 over src/ diff each sub-task. Gate = NO newly introduced errors; the only unmasking event (6d ExportService phantom-field reads) was fixed properly per global rule L20 — never silenced with `!`/`as any`; the preserved-value decision + PO call are in the Finding.

## 🔍 Commits to review
Base: `4b190d1` (Task 5 verdict — branch point for Task 6)   Head: `0f1f9a2` (6d source commit; the following commit is status/review-file mechanics only)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat 4b190d1..0f1f9a2     then      git diff 4b190d1..0f1f9a2
     A file touched outside this task's scope is a flag.
     Expected files: SingleKeyTravel.vue, KeyTravel.vue, GlobalTravel.vue, SwitchProfiles.vue,
     Performance.vue, RapidTrigger.vue, KeyboardService.ts (2 type-only decl lines: getGlobalTouchTravel 6b, getDpDr 6d),
     ExportService.ts (6d phantom-field preservation only), docs/lint-baseline.txt, docs/plans/current-sprint.md. -->
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — Task 6 is not tagged [hw]: all changes are lint-ratchet edits (dead-code deletion, `_`-param renames, honest types). The two KeyboardService edits (6b getGlobalTouchTravel, 6d getDpDr) are DECLARATION-only — runtime bodies byte-identical; wrappers' behavior toward the device is unchanged.

## ❓ Reviewer, please confirm
- [x] meets every "DONE WHEN" criterion above
- [x] diff scope matches the task (no stray files)
- [x] no design-intent violation
- [x] typecheck/build gate met where it applies (no newly introduced errors; unmasked ones recorded/deferred) — or N/A
- [x] tag is correct (high-stakes where required) — else auto-FAIL

---
## ✅ REVIEWER VERDICT
<!-- After ONE verification pass, RULE. Don't keep investigating. A runtime/behavior question goes
     to the PO hardware check, not more static analysis. Output = PASS/FAIL + findings + your own
     Findings one-liners (into current-sprint.md). Do NOT plan task order/parallelism. -->
**Result:** PASS  ·  **Date:** 2026-10-13  ·  **Fail count:** 0

### Done-when re-runs (cumulative Base 4b190d1 .. Head 0f1f9a2)
- Scope: `git diff --stat` = 10 files, exactly the expected set (6 .vue + KeyboardService.ts + ExportService.ts + lint-baseline.txt + current-sprint.md). No strays.
- Lint: `npm run lint` → `✖ 32 problems (0 errors, 32 warnings)` = total **32** ✓ (6d Done-when).
- Per-file: `npx eslint` over all six touched .vue files → exit 0, no output = **0 warnings each** ✓ (6a/6b/6c/6d Done-whens).
- Typecheck: `npm run typecheck` → 0 errors ✓.
- Build: `npm run build` → ✓ 1.61s.
- Suppression gate: `git diff 4b190d1..0f1f9a2 -- src/ | grep -E '^\+.*(as any|@ts-ignore|@ts-expect-error|eslint-disable)'` → 0 matches ✓.
- Baseline: docs/lint-baseline.txt line 1 = `32` (down-only from 80) + 4 history lines (6a 65, 6b 56, 6c 41, 6d 32) ✓.

### KS declaration spot-checks (both type-only; runtime bodies byte-identical per diff — only the `Promise<...>` lines changed)
- `getGlobalTouchTravel` → `IDB | Error` (6b): protocol-keyboard `dist/cjs/types/src/types/interface.d.ts:59` — `interface IDB { globalTouchTravel: number; pressDead: number; releaseDead: number; }`. Bundle decoder resolves all three fields (dist/esm/index.js `getGlobalTouchTravel` body). Declaration matches the verified payload; additive across all 4 readers.
- `getDpDr` → `{ pressDead: number; releaseDead: number } | Error` (6d): bundle `dist/esm/index.js` — `getDpDr(e){const{Layout_DP...}` decodes via `getDpDrRecdata` (u16LE ÷1000 mm), resolves `{pressDead, releaseDead}` or the caught Error; sdk-reference §5.5 Verified row agrees. The OLD declared fields `dpThreshold/drThreshold` appear nowhere in bundle/recdata/sdk-reference — `grep -rn "dpThreshold\|drThreshold" src/` now returns only the WHY comment (ExportService.ts:273). Declaration honest.
- Narrowing at all 6d cast-deletion sites confirmed live: RapidTrigger.vue :421 (`instanceof Error` throw-guard above :425-427 reads), :570 (`if (!(result instanceof Error))` around :571-572), :693/:716 (`dzResult instanceof Error` guards around :717-721); GlobalTravel.vue same pattern at its two read sites.

### ExportService value-preservation (6d unmask)
Confirmed value-preserving, not a behavior change: old code read `dpDr.dpThreshold ?? 0` — `dpThreshold` never existed on the payload (verified above), so the expression evaluated to `undefined ?? 0` = 0 on every run. New code writes literal `0` with a WHY comment inside the same `if (!(dpDr instanceof Error))` guard. Exported JSON byte-identical. Same class as the 4c `.sArg`/4d advanced-key preservations; PO call logged as Finding for making it live.

### Finding-13 word-boundary greps (deleted/renamed symbols, all 6 .vue files + RapidTrigger.vue)
- `\bglobalSettings\b` (bare, 6b+6d deleted local) → 0 hits in GlobalTravel.vue / RapidTrigger.vue ✓ (only `globalSettingsResult` remains, correctly).
- `\browIdx\b`/`\bcolIdx\b` → 0 bare hits (only `_rowIdx`/`_colIdx` definitions) ✓.
- `\bclamped\b` → RapidTrigger.vue :762-774 = that file's OWN live local (declared :762, assigned :765/:768, read :774) — not a dangling ref; GlobalTravel/SingleKeyTravel copies deleted cleanly, 0 hits there ✓.
- `\boldTravel\b` → 0 hits across all files ✓.
- `\bkeyError\b` → 0 hits ✓ (checked via eslint 0 + diff: both `catch (keyError)` → `catch {`).
- SwitchProfiles.vue: dead `keyValue` local gone — surviving `physicalKey` hits (:266-409) are other functions' own live locals/params ✓; `_physicalKey` body of `startPolling` contains no bare `physicalKey` reference ✓; `IDefKeyInfo` import (line 86) now USED by the 3 PropType decls ✓.
- Performance.vue: `useTravelProfilesStore` import deleted, 0 remaining references ✓.

### Design intent
Untouched: no device filters added, no usagePage semantics changed, both KS edits are declaration-only (runtime bodies unchanged in the diff), wrappers still RETURN Error (the instanceof guards in callers are preserved, not converted to throws).

### Tag
[high-stakes] correct — multi-file, SDK-declaration-correctness. Not [hw]: no runtime/device behavior changed.

### Failed items (FAIL only)
—
