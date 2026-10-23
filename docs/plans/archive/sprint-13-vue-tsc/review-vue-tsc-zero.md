# REVIEW: vue-tsc-zero

**SPRINT GOAL:** Give `.vue` files a real automated type/undefined-reference gate — install vue-tsc, make `npm run typecheck` use it, and clear every error it unmasks so the gate lands at zero.
**TASK:** Task 2 — Clear every vue-tsc error to zero (sequential sub-tasks 2a→2f, one session + own commit each; cumulative review 2a..2f)  ·  **TAG:** [high-stakes]
**DONE WHEN:**
- Universal (EVERY sub-task): `npm run typecheck 2>&1 | grep -c "error TS"` → the expected count; `head -1 docs/tsc-baseline.txt` → that same number; `npm run lint` exit 0. Plus per-sub-task anchors below.
- Universal rule: fixes are TYPE-LEVEL. No `!`, no `as any`, no `@ts-ignore`, no suppressing a real error — narrow properly (`instanceof Error`, `typeof`, `v-if`). Design intent untouched: wrappers still RETURN `Error` (never throw); call sites narrow `Error | T` unions rather than cast them away.
- Expected counts (re-based to live post-2a state, rev2): 2a → 60, 2b → 54, 2c → 45, 2d → 21, 2e → 11, 2f → 0.
- 2a anchors: `grep -c "^export const keyMap: Record<number, string> = {" src/utils/keyMap.ts` → 1; `grep -c "CSSProperties" src/utils/MappedKeyboard.ts` → 3; `grep -n "async getRm6X21Calibration" src/services/KeyboardService.ts` shows `calibrations: number[][]; travels: number[][]`.
- 2b anchors: `grep -c "computed<CSSProperties>" src/pages/LayoutPreview.vue` → 1; `grep -c "instanceof Error" src/pages/LayoutCreator.vue` → ≥ 1; `grep -c "currentState.open === 1" src/pages/Lighting.vue` → 0.
- 2c anchors: `grep -c "isConnecting" src/store/connection.ts` → 3; `grep -c "type MenuItem" src/App.vue` → 1 AND `grep -c "interface MenuCategory" src/App.vue` → 0; `grep -c '\$refs.importFile' src/pages/MacroRecording.vue` → 0.
- 2d anchors: `grep -c "item is IKey"` → 1 each in Performance.vue + RapidTrigger.vue; `grep -c "baseLayout?.value"` → 0 each; `grep -c "const positionToRemap: Record<number, number> = {};" src/pages/Performance.vue` → 1.
- 2e anchors: `grep -c "globalModeKeys: number\[\]" src/components/performance/GlobalTravel.vue` → 1; `grep -c "NodeJS" src/components/performance/SwitchProfiles.vue` → 0; `grep -c "processBatches(keyIds" src/components/performance/SingleKeyTravel.vue` → 1.
- 2f anchors: `npm run typecheck 2>&1 | grep -c "error TS"` → 0 AND `head -1 docs/tsc-baseline.txt` → 0; `grep -c 'v-if="calibrating && keyInfo.location"' src/pages/Calibration.vue` → 1; `grep -c "layout.value?.flat()" src/pages/KeyMapping.vue` → 0 AND `grep -c "Number(keyValue)" src/pages/KeyMapping.vue` → 2.
<!-- If a criterion is revised after this file exists, UPDATE it here too — the Reviewer judges
     this file, not current-sprint.md. -->

## 📝 Worker notes & self-check
- Cleared all 101 vue-tsc errors across 14 .vue/.ts files in six committed sub-tasks: 2a `57793da` (keyMap Record + MappedKeyboard CSSProperties + getRm6X21Calibration number[][]; 101→60), 2b `0079fa2` (LayoutPreview/LayoutCreator/Lighting; 60→54), 2c `e1dc70b` (App.vue MenuItem union + isStatusReady string-narrow, connection.ts isConnecting REAL BUG fix, MacroRecording importFile ref; 54→45), 2d `ea5567d` (Performance/RapidTrigger IKey predicate retype + positionToRemap + mode Error-narrow + redundant TS2358 test dropped; 45→21), 2e `6f44057` (GlobalTravel/SwitchProfiles/SingleKeyTravel mode narrows + ReturnType<typeof setTimeout> ×3 + processBatches keyIds; 21→11), 2f `61cae73` (Calibration keyInfo.location v-if + KeyMapping template unwrap/Number(keyValue)/hoisted newKeyValue; 11→0). Checkpoint commits: `5e3445e` (2c done), `9ba75f8` (rev2 count revision), `8322cba` (settings.json, PO-made).
- Spec-defect deviations recorded (all type-level, no behavior change): 2a landed at 60 not 58 (+2 positionToRemap TS7053 cleared by 2d edit-3; getKeyStyle also needed its own CSSProperties annotation to avoid TS2353 on 'data-overlay'); 2e edit-2's TS2322 site was the optional `IKey.value` at 270,9 (`?? null`), not the NodeJS line the spec named; 2f edit-5's null-guard ALREADY existed at :163 — the real issue was ref-`.value` narrowing not flowing into the `.map` closure, fixed by hoisting `const newKeyValue: number = selectedKeyValue.value;` after the guard (equivalent to the spec's intent, no `!`).
- Behavior-visible fixes (routed to Task 3 [hw] PO device check): Connect "Connecting..." button state (isConnecting), KeyMapping selected-key highlight + Select All label (Number(keyValue) / template unwrap), Performance/RapidTrigger debug 'defined'/'null' line (template auto-unwrap), Calibration overlay v-if (location guard must not hide normal keys), SingleKeyTravel processBatches(keyIds).
- Self-check vs sdk-reference-v2.md: §4 getRm6X21Calibration rows Verified (number[][] — wrapper annotation matched to SDK truth); IKey `{key; layout; value?}` line 352 (value optional — guarded at use); ILightMode.open boolean (dead `=== 1` arm dropped); KeyboardBaseInfo KeyboardSN/appVersion decoded strings lines 425,427 (dead Uint8Array arms dropped). No SDK call signatures changed anywhere in 2a–2f.
- Design intent preserved: filters:[] ☑ · usagePage 65440 ☑ · wrappers return Error ☑ (no wrapper touched except the annotation-only getRm6X21Calibration return type, which narrows nothing away — still `| Error`).
- typecheck/build: `npm run typecheck` → **0 errors, exit 0** (was 101 at sprint start; gate = no newly introduced errors — every sub-task's count matched its spec'd expectation exactly at commit time). `npm run lint` → exit 0. `npm run build` → exit 0 (dist built 1.78s). Baseline ratchet history 101→60→54→45→21→11→0 recorded in docs/tsc-baseline.txt; `head -1` = `0`. All per-sub-task anchor greps re-run at 2f close: all pass (see Done-when list; 2e paths are `src/components/performance/`).
- Cleanup (from actual `ls`): `.scratch/` holds working artifacts only — typecheck captures (typecheck-2f-pre/post.txt, typecheck-2d/2e.txt, rv-*.txt, vue-tsc-*.txt, pm-*.txt, review-notes.md, handoff.md, lint-2f.txt, build-2f.txt) — PO can empty freely. `_to_delete/` holds `vue-shim.d.ts` (retired in Task 1; PO must `git rm`).

## 🔍 Commits to review
Base: `65b0b3e` (Task 1 head — vue-tsc gate installed, 101 errors re-based)   Head: `61cae73` (Task 2f — zero)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat <base>..<head>     then      git diff <base>..<head>
     A file touched outside this task's scope is a flag. -->
20 files changed, 217 insertions(+), 151 deletions(-) across 15 commits (6 sub-task commits + 3 checkpoint/plan commits + PO's settings.json). Files: src/App.vue, src/store/connection.ts, src/services/KeyboardService.ts, src/utils/{keyMap.ts,MappedKeyboard.ts}, src/pages/{Calibration,KeyMapping,LayoutCreator,LayoutPreview,Lighting,MacroRecording,Performance,RapidTrigger}.vue, src/components/performance/{GlobalTravel,SingleKeyTravel,SwitchProfiles}.vue (+ Connect.vue consumers unchanged, docs/tsc-baseline.txt, docs/plans/*).
Fix-round ranges (added on each re-review): <base2>..<head2>, ...

## 🖥️ Hardware check ([hw] tasks only)
**Worker fills (what to test):** N/A for this task — hardware verification is Task 3 ([hw], review-vue-tsc-hw.md). This review is code-only.

**Hardware verdict (agent records from the PO's plain-language outcome):**
- Hardware verdict: PENDING

## 🔎 Reviewer findings (REVIEWER fills — F1..Fn; empty if none)
<!-- One block per finding. Include exact file:line, expected vs actual, and the fix needed.
     Non-defect observations (out-of-scope improvements) go under Findings, not here. -->

No defects found. Non-defect observations (routed to ## Findings in current-sprint.md):

- O1 — Worker scope summary (this file, "Commits to review" section) lists `src/pages/Debug.vue` among touched files, but Debug.vue has zero commits and zero net diff in 65b0b3e..61cae73 (`git log --oneline 65b0b3e..61cae73 -- src/pages/Debug.vue` → empty). Documentation inaccuracy only; no code impact. (Fixed inline at PM-close 2026-10-23 — Debug.vue removed from the scope line.)
- O2 — Two dead-arm removals are behavior-visible IF runtime data ever diverges from declared types: Lighting.vue dropped `|| currentState.open === 1` and App.vue `isStatusReady` dropped the `Uint8Array` arms for KeyboardSN/appVersion. Both removals were mandated by the spec/anchors (declared types make the arms unreachable), but the PO may want a sanity glance at lighting-enable and device-status display during Task 3 [hw] regardless.

Verification evidence (rerun at review time, all on head 61cae73 tree):
- `npm run typecheck 2>&1 | grep -c "error TS"` → 0; `head -1 docs/tsc-baseline.txt` → 0 (identical, sprint gate AT ZERO).
- `npm run lint` → exit 0, no output beyond the npm banner.
- `npm run build` → exit 0 (see checkpoint).
- All 2a–2f anchors rerun verbatim → every expected value matched (details in the verdict rationale below).
- Suppression scan of added diff lines (`as any`, `@ts-ignore`, `@ts-expect-error`, `@ts-nocheck`, non-null `!` assertions) → zero hits. Added `as` casts limited to 2 CSSProperties zero-size returns in LayoutPreview.vue (type-level, correct).
- Design intent intact: KeyboardService.ts change is the single `getRm6X21Calibration` return-type widening `number[]`→`number[][]`; `| Error` preserved everywhere; no wrapper now throws.

## ✅ Verdict (REVIEWER fills)
**VERDICT:** PASS
**Reviewed by:** Reviewer session (fresh window, 2026-10-22)
**Date:** 2026-10-22
**Re-review scope (fix rounds only):** —
**Findings (1 line each):**
- O1 (observation): review-file scope summary mislists Debug.vue as touched; zero diff in range. Doc-only.
- O2 (observation): Lighting `open === 1` and App.vue Uint8Array arms dropped as spec-mandated dead code; PO sanity glance during Task 3 [hw] suggested.

Rationale: cumulative base 65b0b3e → head 61cae73 clears vue-tsc from 101 to 0 errors across 2a–2f with exact ratchet matches at every stage; lint and build clean; every Done-when anchor reproduces; fixes are type-level only (no suppressions, no non-null assertions); the three behavior-visible real-bug fixes (connection.isConnecting, KeyMapping Number(keyValue)/template unwrap, SingleKeyTravel processBatches keyIds) are type-correct and already routed to Task 3 [hw]. The 15-commit range contains no stray source files (settings.json commits are PO's; review-vue-tsc-gate.md is the Task-1 verdict write).

