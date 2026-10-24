# SPRINT: sprint-16-eslint-recommended

**GOAL:** Switch ESLint's Vue preset from `flat/essential` to `flat/recommended` and land at 0 warnings (auto-fix + 2 manual template renames; no logic changes).
**DONE-CRITERIA (sprint):** `npm run lint` exits 0 with empty output; `npm run typecheck` exits 0; `npm run build` passes; eslint.config.mjs uses `flat/recommended`.
**Started:** 2026-10-23  ·  **Status:** IN PROGRESS

## Checkpoint
- Branch: `sprint-16-eslint-recommended`
- tsc baseline: 0 errors (docs/tsc-baseline.txt)
- Cleanup: .scratch/ has pm-notes.md, check-fix.cjs, eslint.recommended.mjs (PO may delete); _to_delete/ empty except .gitkeep — from actual `ls` at PM-open.
- Base commit for review: `c256b7f`

## ▶ RUN THIS
Next: Task 1 — flip to flat/recommended, run the bulk auto-fix, rename the 2 template shadows, self-check, commit, then write the review file and set IN-REVIEW. Do this task, then stop.

## Tasks
1. **ESLint flat/essential → flat/recommended @ 0 warnings** — [high-stakes] — STATUS: PENDING
   - Done when: `grep -c 'flat/recommended' eslint.config.mjs` → `1` AND `grep -c 'flat/essential' eslint.config.mjs` → `0`.
   - Done when: `npm run lint` exits 0 AND prints nothing (no warnings; the script has no --max-warnings, so check output emptiness, not just exit code).
   - Done when: `grep -c 'v-for="layout in' src/pages/LayoutPreview.vue` → `0` (both shadow aliases renamed) AND `grep -n 'v-if="layout.length"' src/pages/LayoutPreview.vue` → 1 match AND `grep -n 'v-for="(row, rIdx) in layout"' src/pages/LayoutPreview.vue` → 1 match (outer `layout` ref untouched).
   - Done when: `npm run typecheck` exits 0 (baseline 0, no change expected — auto-fix is formatting-only).
   - Done when: `npm run build` exits 0 (template reflow could theoretically break compilation; this proves it didn't).
   - Done when: `git status --short` clean after commit — especially eslint.config.mjs: use the **Edit tool only**, never `sed`/shell text tools (PM hit CRLF stripping with `sed -i` on this file; repo is core.autocrlf=true).
   - Files: `eslint.config.mjs` (1 edit), ~15 .vue files (via `npm run lint -- --fix`, mechanical), `src/pages/LayoutPreview.vue` (2 manual template edits).
   - Spec — PM-measured this session (fresh run under a temp flip, reverted): flat/recommended raises **1069 warnings / 0 errors**; `--fix` clears **all but exactly 2**, both `vue/no-template-shadow` in LayoutPreview.vue. Warning mix is 100% vue/* formatting rules (max-attributes-per-line 356, singleline-html-element-content-newline 398, attributes-order 183, html-self-closing 46, html-indent 33, etc.). 15 files affected: App, FactoryResetModal, GlobalTravel, SingleKeyTravel, SwitchProfiles, Calibration, Connect, Debug, KeyMapping, LayoutCreator, LayoutPreview, Lighting, MacroRecording, Performance, RapidTrigger.
   - Spec — edit 1 (eslint.config.mjs :10, grep-verified current text):
     replace `  ...pluginVue.configs["flat/essential"],`
     with    `  ...pluginVue.configs["flat/recommended"],`
     (change nothing else in the file; the ignores list :7 already excludes `.scratch/`.)
   - Spec — edit 2 (bulk auto-fix): run `npm run lint -- --fix` (allowed lint script + pass-through flag; NOT a bare npx call). Expect it to exit non-zero afterwards (2 unfixed warnings remain — that is expected, not a failure). Verify with `git diff --stat`: ~15 .vue files changed, eslint.config.mjs changed, NO .ts file changed (auto-fix should not touch services/stores/utils — if a .ts file appears in the diff, STOP and report).
   - Spec — edit 3 (LayoutPreview.vue :7, verbatim current text; 8-space indent):
     replace `<option v-for="layout in layouts" :key="layout" :value="layout">{{ \`${layout}-key\` }}</option>`
     with    `<option v-for="count in layouts" :key="count" :value="count">{{ \`${count}-key\` }}</option>`
     (`layouts` is a number[] of key counts; `count` is collision-free — grep `keyCount` shows the script uses that name, but `count` has zero occurrences. NOTE: after edit 2 this line will be reflowed by max-attributes-per-line — apply the rename to whatever the post-fix shape is, same identifier substitution, 4 refs.)
   - Spec — edit 4 (LayoutPreview.vue :9-10, verbatim current text; 10/12-space indent):
     replace `<option v-for="layout in customLayouts" :key="layout.productName" :value="layout.productName">` and next line `{{ layout.productName }}`
     with    the same two lines with every `layout.` → `customLayout.` and `v-for="layout in customLayouts"` → `v-for="customLayout in customLayouts"` (3 refs; `customLayout` singular is collision-free — grep-verified zero occurrences).
   - Spec — do NOT touch: LayoutPreview.vue :15/:16 (outer `layout` ref), the script-side arrow `customLayouts.value.some(layout => ...)` (:107 pre-fix; not a vue/no-template-shadow site — the fix-dry-run survivors are template-only), and any logic anywhere. Renames are alias-only; bound `:value`/`:key` expressions keep identical semantics.
   - Self-check (code task, gate ACTIVE): `npm run typecheck` → 0; `npm run build` → pass; then all Done-when greps above. Record results in the checkpoint line.
   - Commit: `sprint-16-eslint-recommended: task 1 — eslint flat/recommended @ 0 warnings` (one commit is fine; the tree reaches a verifiable state once). Then: create `docs/plans/reviews/review-eslint-recommended.md` from docs/plans/templates/review-template.md — begin with the sprint goal (one line) + this task's Done-when criteria verbatim, Base `c256b7f` / Head = your commit; in the Notes section give the Reviewer the review angle below. Set STATUS: IN-REVIEW (collapse this task's checkpoint to one line), commit the review file + status flip together (or amend nothing — second commit `sprint-16-eslint-recommended: task 1 — review file + IN-REVIEW`), then STOP.
   - Reviewer angle (write into review file): the diff is huge (~1069 fixes across 15 .vue files) but must be **formatting-only + the 2 intentional renames**. Suggested checks: (a) `git diff c256b7f..HEAD -- eslint.config.mjs` = exactly the one-line preset flip; (b) `git diff c256b7f..HEAD --stat` = 16 files, no .ts; (c) spot-check diffs in 3-4 .vue files for non-formatting changes (attribute reorders, newlines, self-closing tags are expected; changed identifiers/expressions/logic are FAIL — except the LayoutPreview `layout`→`count`/`customLayout` renames); (d) rerun `npm run lint` (empty output, exit 0), `npm run typecheck` (0), `npm run build` (pass); (e) rerun the Done-when greps.

## Findings
<!-- Out-of-scope defects/ideas: ONE line each (defect + where to verify), edit tool only, never shell >>. -->
(none yet)
