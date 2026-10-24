# REVIEW: eslint-recommended

<!-- WORKER fills everything above the verdict line. REVIEWER fills the verdict section.
     The PO's hardware verdict is RECORDED BY AN AGENT from the PO's plain-language outcome —
     the PO does not hand-edit this file. -->

**SPRINT GOAL:** Switch ESLint's Vue preset from `flat/essential` to `flat/recommended` and land at 0 warnings (auto-fix + 2 manual template renames; no logic changes).
**TASK:** ESLint flat/essential → flat/recommended @ 0 warnings  ·  **TAG:** [high-stakes]
**DONE WHEN:**
- `grep -c 'flat/recommended' eslint.config.mjs` → `1` AND `grep -c 'flat/essential' eslint.config.mjs` → `0`
- `npm run lint` exits 0 AND prints nothing (no warnings; the script has no --max-warnings, so check output emptiness, not just exit code)
- `grep -c 'v-for="layout in' src/pages/LayoutPreview.vue` → `0` (both shadow aliases renamed) AND `grep -n 'v-if="layout.length"' src/pages/LayoutPreview.vue` → 1 match AND `grep -n 'v-for="(row, rIdx) in layout"' src/pages/LayoutPreview.vue` → 1 match (outer `layout` ref untouched)
- `npm run typecheck` exits 0 (baseline 0, no change expected — auto-fix is formatting-only)
- `npm run build` exits 0 (template reflow could theoretically break compilation; this proves it didn't)
- `git status --short` clean after commit — especially eslint.config.mjs: use the Edit tool, never shell echo/sed on the config (an unparseable config file breaks lint itself)

## 📝 Worker notes & self-check
- Applied per spec: single Edit flipped `flat/essential` → `flat/recommended` in eslint.config.mjs; `npm run lint -- --fix` bulk-fixed 15 .vue files (formatting/template-reflow only); renamed the 2 leftover `vue/no-template-shadow` aliases in LayoutPreview.vue (`layout`→`count` for the `layouts` option loop, `layout`→`customLayout` for the `customLayouts` option loop; outer `layout` ref and script untouched).
- Diff stat: 16 files, +1569/−420 — 15 .vue + eslint.config.mjs; `git diff --name-only | grep '\.ts$'` → none (spec expected zero .ts).
- Self-check vs sdk-reference-v2.md: N/A — no SDK usage; no runtime logic changed.
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (untouched) — diff touches only .vue templates and eslint.config.mjs.
- typecheck/build: typecheck exit 0 (baseline 0 → 0, no unmasking); `npm run lint` exit 0 with empty output (0 warnings); `npm run build` exit 0 (✓ built in 4.83s). All Done-when greps verified: recommended=1, essential=0, old-shadow-v-for=0, outer v-if=1, outer v-for=1.

## 🔍 Commits to review
Base: `c256b7f` (branch point / last reviewed)   Head: `2c8a75a` (this task)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat c256b7f..2c8a75a     then      git diff c256b7f..2c8a75a
     A file touched outside this task's scope is a flag. -->
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task. No hardware behavior touched (formatting-only auto-fix + two template alias renames).

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
**Result:** PASS  ·  **Date:** 2026-10-23  ·  **Fail count:** 0

All six Done-when criteria independently re-run at head `2c8a75a`:
1. ✓ `grep -c 'flat/recommended' eslint.config.mjs` → 1; `grep -c 'flat/essential'` → 0.
2. ✓ `npm run lint` exit 0; captured output is the npm banner only — zero eslint warnings (empty-output criterion met).
3. ✓ LayoutPreview.vue: `v-for="layout in` → 0; `v-if="layout.length"` → 1 (line 33); `v-for="(row, rIdx) in layout"` → 1 (line 38) — outer `layout` ref untouched.
4. ✓ `npm run typecheck` exit 0 (vue-tsc --noEmit).
5. ✓ `npm run build` exit 0 (✓ built in 1.75s).
6. ✓ `git status --short` clean at head.

Reviewer-angle scope check: `git diff c256b7f..2c8a75a --stat` → 17 files = 15 .vue + eslint.config.mjs + docs/plans/current-sprint.md (worker checkpoint; process-normal, not stray source). `--name-only | grep '\.ts$'` → none: KeyboardService / stores / design-intent .ts untouched (filters:[], usagePage 65440, wrappers-return-Error unaffected). The eslint.config.mjs diff is exactly the one-line preset flip. LayoutPreview renames are internally consistent alias-only changes (`:key`/`:value`/interpolation all moved with the identifier; bound semantics identical). Scan of every changed ± line across the other 14 .vue files: each changed `{{ … }}` interpolation pairs with an identical expression on the other side, and no changed line contains `import`/`const`/`function`/`=>`/`ref(`/`computed(` — script blocks untouched; the diff is formatting-only (attribute reflow/wrapping/self-closing). No logic changes, as the sprint goal requires. Tag [high-stakes] correctly applied (multi-file, config). No inline-fixable defects found → no QA-tier FAIL trigger.

### Failed items (FAIL only)
(none)
