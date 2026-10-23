# REVIEW: baselayout-prop

**SPRINT GOAL:** Clear three routed hygiene items: fix the real functional bug — GlobalTravel "Select to Global" must write the current UI settings (global travel + DpDr), not the re-fetched Global-DB register; add the missing `instanceof Error` guard at all three `getBaseInfo()` call sites in store/connection.ts; delete the dead `baseLayout` props from SingleKeyTravel.vue and SwitchProfiles.vue (and both KeyTravel bindings).
**TASK:** Delete dead baseLayout props (SingleKeyTravel + SwitchProfiles + both parent bindings)  ·  **TAG:** [high-stakes]
**DONE WHEN:**
- `grep -rn "baseLayout" src/components/performance/` returns exactly ONE hit: KeyTravel.vue's OWN prop declaration (`baseLayout: {`) — that prop stays this task (it's fed from Performance.vue's `useMappedKeyboard` and is a separate deletion, out of scope).
- `grep -n ":base-layout" src/components/performance/KeyTravel.vue` returns NOTHING.
- `npm run typecheck` → 0 errors. `npm run lint` → exit 0.
- Diff scope: exactly SingleKeyTravel.vue, SwitchProfiles.vue, KeyTravel.vue; deletions only.

## 📝 Worker notes & self-check
- Deleted the dead `baseLayout` prop block (4 lines: declaration + `type` + `default` + closing brace) from SingleKeyTravel.vue and SwitchProfiles.vue — identical text in both, neither component read the prop anywhere.
- Deleted both `:base-layout="baseLayout"` bindings from KeyTravel.vue's template (SingleKeyTravel + SwitchProfiles). KeyTravel's OWN `baseLayout: {` prop is intentionally retained (scope cap — fed by Performance.vue).
- `IDefKeyInfo` and `PropType` imports stay in both children (still used by `selectedKeys`/`layout` props).
- Self-check vs sdk-reference-v2.md: N/A — no SDK call added/changed; prop deletion only, no device behavior touched.
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (untouched)
- typecheck/build: `npm run typecheck` → 0 errors (baseline 0 held). `npm run lint` → exit 0. Build not run (template/props deletion cannot affect build config; typecheck + lint cover it).
- Note for Reviewer: the final diff is deletions-only (3 files, 10 deletions, 0 insertions). An intermediate edit pass had normalized trailing whitespace on untouched KeyTravel template lines; this was restored pre-commit so the diff contains only the two `:base-layout` line deletions.

## 🔍 Commits to review
Base: `7ce699f` (task 2 close / last reviewed)   Head: `b8ca878` (this task)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat <base>..<head>     then      git diff <base>..<head>
     A file touched outside this task's scope is a flag. -->
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check
N/A — not a [hw] task. Dead-prop deletion; no runtime/device behavior changed.

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
**Result:** ___  ·  **Date:** ___  ·  **Fail count:** ___

### Failed items (FAIL only)
