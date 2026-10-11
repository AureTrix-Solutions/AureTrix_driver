# REVIEW: sprint-10-lint-script Task 2 — fix the 7 genuine lint errors

<!-- WORKER fills everything above the verdict line. REVIEWER fills the verdict section.
     The PO's hardware verdict is RECORDED BY AN AGENT from the PO's plain-language outcome —
     the PO does not hand-edit this file. -->

**SPRINT GOAL:** Add a working `npm run lint` (ESLint 10 flat config, TS + Vue) that exits 0, with all genuine lint defects fixed and the bulk warning load deliberately deferred to a ratchet-down backlog item.
**TASK:** Fix the 7 genuine lint errors (3 files)  ·  **TAG:** [high-stakes] (no [hw])
**DONE WHEN:**
- `npm run lint` → `0 errors` and exit code 0 (warnings remain, ~221)
- `grep -rn '<br></br>' src/` → nothing; `grep -n 'props.profileMaxTravel,' src/components/performance/SwitchProfiles.vue` → nothing
- `npm run typecheck` → 0 errors; `npm run build` passes

## 📝 Worker notes & self-check
- Applied the PM's 5-step edit spec exactly (commit de8f62c, 3 files, 5 insertions / 8 deletions): (1) `<br></br>` → `<br />` in SwitchProfiles.vue help text; (2) deleted the redundant `profileMaxTravel: props.profileMaxTravel,` / `selectedKeys: props.selectedKeys,` re-returns from setup() — template bindings resolve from declared props (vue/no-dupe-keys); (3) `let rows = 0;` → `let rows: number;` in layoutConfigs.ts (both if/else branches assign before use — definite assignment holds); (4) `let gapsAfterCol`/`let rowSpacing` → `const` (never reassigned); (5) `func: Function` → `func: (...args: unknown[]) => void` in Lighting.vue throttle (call sites pass zero-arg-compatible functions).
- Self-check vs sdk-reference-v2.md: N/A — no SDK calls touched; edits are pure lint hygiene (template void tag, redundant setup returns, const/definite-assignment, a type annotation). No runtime behavior change intended.
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (no service files touched)
- typecheck/build (gate active, touched .ts/.vue): `npm run typecheck` → 0 errors (baseline 0 unchanged, no unmasking). `npm run build` → exit 0, `✓ built in 1.62s`. `npm run lint` → `✖ 221 problems (0 errors, 221 warnings)`, exit 0 — exactly the 228−7 = 221 deferred-warning set from Task 1; warning tier unchanged (no warning added or removed).

## 🔍 Commits to review
Base: `855c853` (Task 1 Reviewer-PASS checkpoint)   Head: `de8f62c` (this task)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat 855c853..de8f62c     then      git diff 855c853..de8f62c
     A file touched outside this task's scope is a flag. -->
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task. No hardware-facing behavior changed: SwitchProfiles edit removed two redundant setup() returns whose values the template already resolves from declared props (identical values, identical reactivity); remaining edits are type/const/void-tag only.

## ❓ Reviewer, please confirm
- [x] meets every "DONE WHEN" criterion above
- [x] diff scope matches the task (no stray files)
- [x] no design-intent violation
- [x] typecheck/build gate met where it applies (no newly introduced errors; unmasked ones recorded/deferred) — or N/A
- [x] tag is correct (high-stakes where required) — else auto-FAIL

---
## ✅ REVIEWER VERDICT
**Result:** PASS  ·  **Date:** 2026-10-11  ·  **Fail count:** 0

### Evidence (all commands rerun by Reviewer this session)
- `npm run lint` → `✖ 221 problems (0 errors, 221 warnings)`, exit 0 — EXACT match to Done-when and to the 228−7=221 deferred set from Task 1; warning tier unchanged.
- `grep '<br></br>' src/` → no matches. `grep 'props.profileMaxTravel,' SwitchProfiles.vue` → no matches.
- `npm run typecheck` → exit 0, 0 errors (baseline 0 unchanged). `npm run build` → exit 0, `✓ built in 1.59s`.
- Diff scope (855c853..de8f62c): exactly the 3 named files, 5 insertions / 8 deletions — matches Worker report; no stray files.
- Semantic check of the setup() removal: `profileMaxTravel`/`selectedKeys` are declared props (L91/L103); Vue exposes declared props to the template directly (already relied on at L33 for `selectedKeys`), so the removed aliases were redundant — and being one-time snapshots, removing them if anything restores live-prop reactivity. Template grep confirms no other binding depends on the aliases.
- `let rows: number;` definite assignment verified against source: assigned in both branches (baseLayout L165, else L178) before first use (L167/L208/L211). `gapsAfterCol`/`rowSpacing` never reassigned → const correct.
- throttle signature `(...args: unknown[]) => void`: typecheck passes; wrapper still forwards args unchanged — no behavior change.
- Design intent: no service/connection files touched; filters:[], usagePage 65440, Error-returning wrappers all untouched.
- Tag [high-stakes] correct (multi-file logic-adjacent edits); review performed accordingly. No [hw] — agreed, no hardware-facing behavior changed.

### Findings (Reviewer)
- None. (Non-defect observation, no action: `throttle`'s inner `(...args: any[])` remains an `any` — part of the deferred 221-warning tier, correctly out of scope here.)
