# REVIEW: connection-getbaseinfo

<!-- WORKER fills everything above the verdict line. REVIEWER fills the verdict section.
     The PO's hardware verdict is RECORDED BY AN AGENT from the PO's plain-language outcome —
     the PO does not hand-edit this file. -->

**SPRINT GOAL:** Clear three routed hygiene items — fix GlobalTravel "Select to Global" to write the current UI settings (global travel + DpDr), add `instanceof Error` guards at the three `getBaseInfo()` call sites in store/connection.ts, and delete the dead `baseLayout` props from SingleKeyTravel.vue + SwitchProfiles.vue (+ both KeyTravel bindings).
**TASK:** connection.ts getBaseInfo() missing instanceof Error check  ·  **TAG:** [high-stakes]
**DONE WHEN:**
- `grep -c "if (info instanceof Error)" src/store/connection.ts` → `3`
- `grep -c "console.log('Base info:', info)" src/store/connection.ts` → `3` (the debug log was intentionally kept)
- `npm run typecheck` → 0 errors; `npm run lint` → exit 0

## 📝 Worker notes & self-check
- Added the same guard at all 3 `getBaseInfo()` call sites (`autoConnect`, `connectDevice`, `onAutoConnectSuccess`): `console.log('Base info:', info)` stays BEFORE the branch (so an Error is logged — that's the debug value); on `info instanceof Error` → degraded status only, no spread into `deviceInfo`; else → spread + success status. The existing outer try/catch at each site is kept as a backstop for genuine throws; nothing else touched.
- Self-check vs sdk-reference-v2.md: N/A — no SDK surface touched; the change implements the documented wrapper convention (KeyboardService methods RETURN `Error`, never throw; callers check `instanceof Error`), same convention as CLAUDE.md's Hardware rules.
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (guards added for exactly this)
- typecheck/build: `npm run typecheck` → 0 errors (baseline held). `npm run lint` → exit 0. Build not run (store-only change, no build config touched).
- PLAN DISCREPANCY (for Reviewer judgment, applied as specced): in `connectDevice`, the plan's replacement uses `this.deviceInfo?.productName` (optional chain) in the degraded string and says it "matches this site's catch" — but the actual catch at that site uses `this.deviceInfo.productName` (NO `?.`). I applied the plan's literal string (`?.`). `?.` is strictly safer (deviceInfo is `{...} | null` in state; it's non-null in practice at this point because it was just assigned above). Reviewer: rule whether to keep `?.` (as written) or align to the catch (no `?.`). Note the two Auto-connect sites (autoConnect, onAutoConnectSuccess) use NO `?.` per plan and match their catches.

## 🔍 Commits to review
Base: `7785a4c` (task 1 hw close)   Head: `bf12edc` (this task)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat 7785a4c..bf12edc     then      git diff 7785a4c..bf12edc
     A file touched outside this task's scope is a flag. -->
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task.

## ❓ Reviewer, please confirm
- [ ] meets every "DONE WHEN" criterion above
- [ ] diff scope matches the task (no stray files — only src/store/connection.ts)
- [ ] no design-intent violation
- [ ] typecheck/build gate met where it applies (no newly introduced errors)
- [ ] tag is correct (high-stakes — store/connection.ts touched, always high-stakes per CLAUDE.md)

---
## ✅ REVIEWER VERDICT
<!-- After ONE verification pass, RULE. Don't keep investigating. A runtime/behavior question goes
     to the PO hardware check, not more static analysis. Output = PASS/FAIL + findings + your own
     Findings one-liners (into current-sprint.md). Do NOT plan task order/parallelism. -->
**Result:** PASS / PASS (pending hw) / FAIL  ·  **Date:** YYYY-MM-DD  ·  **Fail count:** <n>

### Failed items (FAIL only)
