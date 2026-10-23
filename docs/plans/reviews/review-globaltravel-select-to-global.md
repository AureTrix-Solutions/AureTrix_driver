# REVIEW: globaltravel-select-to-global

<!-- WORKER fills everything above the verdict line. REVIEWER fills the verdict section.
     The PO's hardware verdict is RECORDED BY AN AGENT from the PO's plain-language outcome —
     the PO does not hand-edit this file. -->

**SPRINT GOAL:** Clear three routed hygiene items — fix GlobalTravel "Select to Global" to write the current UI settings (global travel + DpDr), add `instanceof Error` guards at the three `getBaseInfo()` call sites in store/connection.ts, and delete the dead `baseLayout` props from SingleKeyTravel.vue + SwitchProfiles.vue (+ both KeyTravel bindings).
**TASK:** GlobalTravel Select-to-Global writes UI settings instead of Global-DB register  ·  **TAG:** [high-stakes][hw]
**DONE WHEN:**
- `grep -n "getGlobalTouchTravel" src/components/performance/GlobalTravel.vue` → returns only `loadGlobalTravel` occurrences (grep `const globalSettings = await KeyboardService.getGlobalTouchTravel();` in loadGlobalTravel; count drops from 3 → 2)
- `grep -n "globalSettingsResult\|Invalid global settings\|Failed to fetch global settings\|Sync UI state" src/components/performance/GlobalTravel.vue` → returns nothing
- `grep -n "globalTravel.value" src/components/performance/GlobalTravel.vue` → `const globalTravelValue = globalTravel.value` present in setKeyToGlobalMode (grep `const globalTravelValue`)
- `npm run typecheck` → 0 errors (baseline held); `npm run lint` → exit 0

## 📝 Worker notes & self-check
- Edit 1: replaced the Step-1 block that re-fetched `getGlobalTouchTravel()` (the device Global-DB register) with reads of the current UI refs — `globalTravel.value` / `pressDead.value` / `releaseDead.value`. The refs are the authoritative "current global travel + DpDr" state (persisted on every @change by `updateGlobalSettings`) and are always numbers (init 2.0/0.2/0.2), so the now-dead `isNaN` guard was removed with the block.
- Edit 2: deleted the dead "Sync UI state" self-assign block (`globalTravel.value = globalTravelValue` etc. — no-ops once the values ARE the refs), collapsed the surrounding blank lines to one.
- Net: 1 file changed, 6 insertions(+), 20 deletions(-).
- Self-check vs sdk-reference-v2.md: §5.1 (Verified) — refs are mm; `setSingleTravel`/`setDp`/`setDr` take mm; no scaling at this layer. Both sides agree; units unchanged by this edit (values flow through unchanged, only the source changed).
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (KeyboardService untouched; no new throwing)
- typecheck/build: `npm run typecheck` → 0 errors (baseline 0 held, no unmasking). `npm run build` NOT run — change is a single-component value-source swap, cannot affect the build graph.

## 🔍 Commits to review
Base: `aa621e7` (last reviewed / PM revision before task 1)   Head: `0121da8` (this task)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat aa621e7..0121da8     then      git diff aa621e7..0121da8
     A file touched outside this task's scope is a flag. -->
Fix-round ranges (added on each re-review): <none yet>

## 🖥️ Hardware check ([hw] tasks only)
**Worker fills (what to test):**
- What changed (that touches hardware behavior): "Select to Global" on the Global Travel panel now writes the per-key travel + press/release dead zones from the CURRENT slider/input values shown in the UI, instead of re-reading the device's Global-DB register first. If you had dragged the sliders to a value that differs from what the device currently has stored in its Global register, the button now honors the UI value.
- What to verify: with a keyboard connected, set the Global Travel slider (and Top/Bottom Dead Zone) to a distinct value — e.g. travel 3.50mm, top DZ 0.40mm, bottom DZ 0.30mm — so it visibly differs from the device's stored global register, select a few keys on the Performance page, then click "Select to Global". Confirm the selected keys end up in Global mode AND their per-key travel/dead-zone values match what the UI showed (3.50 / 0.40 / 0.30), not some other previously-stored global value. Also sanity-check the button is still disabled with no keys selected, and that the "Global Settings Applied to Selected Keys" success message still appears.

**Hardware verdict (agent records from the PO's plain-language outcome):**
- Hardware verdict: <pending — PO to exercise on device>

## ❓ Reviewer, please confirm
- [x] meets every "DONE WHEN" criterion above — C1 `getGlobalTouchTravel` 3→2, both survivors inside `loadGlobalSettings` (the UI-load path); C2 dead-string grep → nothing; C3 `const globalTravelValue = globalTravel.value` present at :265; C4 typecheck 0 errors + lint exit 0.
- [x] diff scope matches the task (no stray files) — `git diff --stat aa621e7..0121da8` → only GlobalTravel.vue, +6/-20.
- [x] no design-intent violation — filters:[] / usagePage 65440 / KeyboardService wrappers all untouched; no new throwing; Step-2 batch + `emit('mode-changed')` unchanged.
- [x] typecheck/build gate met where it applies — typecheck clean (baseline 0 held, no unmasking); build not required for a single-component value-source swap.
- [x] tag is correct (high-stakes where required) — [high-stakes][hw] correct (device-affecting value source). PASS pending hw → HW-TEST, not DONE.

---
## ✅ REVIEWER VERDICT
<!-- After ONE verification pass, RULE. Don't keep investigating. A runtime/behavior question goes
     to the PO hardware check, not more static analysis. Output = PASS/FAIL + findings + your own
     Findings one-liners (into current-sprint.md). Do NOT plan task order/parallelism. -->
**Result:** PASS (pending hw) → **HW-TEST**  ·  **Date:** 2026-10-23  ·  **Fail count:** 0

Code passes review. This is a [hw] task, so per CLAUDE.md I set **HW-TEST** and stop — I do NOT write DONE. The PO exercises it on a real device and states the verdict; an agent records it here.

### Verification summary (one pass, ruled)
- Diff (`git diff aa621e7..0121da8`): Step-1 device re-fetch (`getGlobalTouchTravel()` + `instanceof Error` throw + `Number()` conversions + `isNaN` throw) replaced with direct reads of the authoritative UI refs — `globalTravelValue = globalTravel.value`, `globalPressDead = pressDead.value`, `globalReleaseDead = releaseDead.value`. The now-dead "Sync UI state" self-assign block correctly removed (no-ops once values ARE the refs). Step-2 `processBatches` body and `emit('mode-changed', keys, 'global')` untouched.
- isNaN-guard removal is **justified**: refs declared `ref(2.0)` / `ref(0.2)` / `ref(0.2)` — always numbers, no NaN source remains.
- All four Done-when criteria met (see confirm checklist). typecheck 0 errors, lint exit 0.

### Non-blocking nit (no action; not a source defect)
- The Done-when text names the surviving caller `loadGlobalTravel`; the actual function is `loadGlobalSettings` (grep `const loadGlobalSettings = async`). Intent holds — both remaining `getGlobalTouchTravel` usages are in the legitimate UI-load path. Doc-wording only; nothing to fix in source or route to backlog.

### Failed items (FAIL only)
<none>
