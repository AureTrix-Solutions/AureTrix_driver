# SPRINT: sprint-10-lint-script

**GOAL:** Add a working `npm run lint` (ESLint 10 flat config, TS + Vue) that exits 0, with all genuine lint defects fixed and the bulk warning load deliberately deferred to a ratchet-down backlog item.
**DONE-CRITERIA (sprint):** `npm run lint` exits 0 (0 errors; ≤221 tolerated warnings); `npm audit` = 0 vulnerabilities; typecheck stays 0 errors; `npm run build` passes; CLAUDE.md reflects the new script.
**Started:** 2026-10-11  ·  **Status:** ALL TASKS DONE — awaiting PO sign-off
<!-- revN (YYYY-MM-DD): <what changed>   ← log revisions here, newest last -->

**PM trial-run result (PO asked to capture):** with js.recommended + typescript-eslint.recommended + eslint-plugin-vue flat/**essential** (recommended tier added 1066 pure-formatting warnings — rejected), the codebase reports **1322 raw problems → 228 after deliberate config policy: 7 genuine errors + 221 deferred warnings**. DECISION baked into this plan: **fix the 7 real defects in this sprint (Task 2); defer the 221 warnings** (109 no-explicit-any SDK-boundary, 81 no-unused-vars, 31 preserve-caught-error) to warn-tier + a backlog ratchet-down item (mirrors the tsc-baseline approach). Rig: `.scratch/lint-trial/` (PM-validated; config there is identical to the block below).

## Checkpoint
- Branch: `sprint-10-lint-script`
- tsc baseline: 0 errors (docs/tsc-baseline.txt)
- Task 1: ✓ DONE (5fdb069) — Reviewer PASS 2026-10-11 — see reviews/review-lint-setup.md
- Task 2: ✓ DONE (de8f62c) — Reviewer PASS 2026-10-11: all three Done-whens rerun exact (lint 0 err/221 warn exit 0; both greps clean; typecheck 0; build ✓ 1.59s); scope 3 files +5/−8; setup-removal semantics + definite-assignment verified — see reviews/review-lint-fixes.md
- Task 3: ✓ DONE — Worker self-check 2026-10-11: both greps pass (lint line at CLAUDE.md:17; old "no lint script" line gone); docs-only, gate skipped per spec
- Cleanup (actual ls): .scratch/ = lint-trial/, pm-notes.md, review-sprint-10-task-1-lint-toolchain.md (PO may delete all); _to_delete/ = .gitkeep only → nothing needs git rm
<!-- Session-start check: on sprint branch (not main) + clean tree. Uncommitted changes → STOP, report. -->

## ▶ RUN THIS
ALL TASKS DONE — awaiting PO sign-off. Next: PM-close ("Act as PM per CLAUDE.md. All tasks DONE; assemble work + QA verdicts vs the goal for my sign-off; on acceptance archive, on rejection revise."). No Worker tasks remain.

## Tasks
1. **Install lint toolchain, script, and config** — [high-stakes] — STATUS: ✓ DONE (Reviewer PASS 2026-10-11)
   - Files: `package.json` (via npm), `eslint.config.mjs` (new)
   - Edit spec (PM-researched; apply, don't re-derive):
     1. Run: `npm i -D eslint@^10.12.0 @eslint/js@^10.0.1 typescript-eslint@^8.71.1 eslint-plugin-vue@^10.11.1 vue-eslint-parser@^10.4.1 globals@^17.13.0` — npm writes devDependencies + lockfile; NO hand edits. (Note: @eslint/js versions separately from eslint — 10.12.0 does not exist for it; 10.0.1 is latest. Whole set peer-verified against eslint ^10 and TS <6.1; `npm audit` on this exact set = 0 vulnerabilities — must not undo sprint-09.)
     2. Edit package.json scripts — current last script (grep-verified) is `"typecheck": "tsc --noEmit"` with NO trailing comma; change to:
        `"typecheck": "tsc --noEmit",` + new line `    "lint": "eslint ."`
     3. Create `eslint.config.mjs` at repo root = EXACTLY this (repo has no `"type"` field → CommonJS → MUST be `.mjs`; PM-validated: this exact file produces the 228 numbers below and lints clean itself):
        ```js
        import js from "@eslint/js";
        import globals from "globals";
        import tseslint from "typescript-eslint";
        import pluginVue from "eslint-plugin-vue";

        export default tseslint.config(
          { ignores: ["dist/", "node_modules/", ".scratch/", "_to_delete/", "coverage/"] },
          js.configs.recommended,
          ...tseslint.configs.recommended,
          ...pluginVue.configs["flat/essential"],
          {
            files: ["**/*.vue"],
            languageOptions: { parserOptions: { parser: tseslint.parser } },
          },
          { languageOptions: { globals: { ...globals.browser } } },
          { files: ["vite.config.ts"], languageOptions: { globals: { ...globals.node } } },
          // TS-aware rules supersede no-undef in .ts/.vue (typescript-eslint recommendation)
          { files: ["**/*.ts", "**/*.vue"], rules: { "no-undef": "off" } },
          // Page components are single-word by routing convention (Connect, Lighting, ...)
          { files: ["src/pages/**/*.vue"], rules: { "vue/multi-word-component-names": "off" } },
          // Standard Vue SFC shim boilerplate (DefineComponent<{}, {}, any>)
          {
            files: ["**/*.d.ts"],
            rules: {
              "@typescript-eslint/no-empty-object-type": "off",
              "@typescript-eslint/no-explicit-any": "off",
            },
          },
          {
            rules: {
              // window.location.href = window.location.href is the intentional force-reload idiom
              "no-self-assign": "off",
              // Swallowing SDK errors in retry/teardown paths is the established pattern here
              "no-empty": ["error", { allowEmptyCatch: true }],
              // Deferred to warn tier — ratchet-down tracked in backlog:
              "@typescript-eslint/no-explicit-any": "warn", // SDK-boundary anys (109)
              "@typescript-eslint/no-unused-vars": "warn", // unused vars (81)
              "preserve-caught-error": "warn", // missing { cause } on rethrow (31)
            },
          }
        );
        ```
     4. Run `npm run lint` — expect EXIT 1 with `228 problems (7 errors, 221 warnings)` (exit 1 is CORRECT here; the 7 errors are Task 2). Commit.
   - Done when: `npm run lint` output ends `228 problems (7 errors, 221 warnings)` (PM-measured; ±2 warnings tolerated only if reported with reason)
   - Done when: `npm audit` prints `found 0 vulnerabilities`
   - Done when: `npm run typecheck` → 0 errors (baseline unchanged)
   - Done when: `grep -n '"lint": "eslint ."' package.json` → 1 hit; `wc -l eslint.config.mjs` → 41
   - On finish: IN-REVIEW; write `docs/plans/reviews/review-lint-setup.md` (sprint goal + these Done-whens + base/head hashes). Reviewer reruns all four commands.

2. **Fix the 7 genuine lint errors (3 files)** — [high-stakes] — STATUS: ✓ DONE (Reviewer PASS 2026-10-11)
   - Files: `src/components/performance/SwitchProfiles.vue`, `src/utils/layoutConfigs.ts`, `src/pages/Lighting.vue`
   - Edit spec (all PM-verified safe this session; apply exactly):
     1. SwitchProfiles.vue L56 (inside the `<p>` help text): `<br></br>` → `<br />` (invalid void-element close tag; grep: `<br></br>`)
     2. SwitchProfiles.vue L441–442: DELETE both lines `      profileMaxTravel: props.profileMaxTravel,` and `      selectedKeys: props.selectedKeys,` from the `setup() { return { … } }` block. SAFE: both are declared props (L91/L103) and Vue resolves `selectedKeys` in template L33 directly from props — the re-returns are redundant dupes (vue/no-dupe-keys).
     3. layoutConfigs.ts L157: `  let rows = 0;` → `  let rows: number;` (no-useless-assignment; both if/else branches L165/L178 assign before any use — TS definite-assignment satisfied, PM-verified)
     4. layoutConfigs.ts L160: `  let gapsAfterCol = customGapsAfterCol || config.gapsAfterCol;` → `const gapsAfterCol = …` (same RHS); L161: `  let rowSpacing = customRowSpacing || config.rowSpacing;` → `const rowSpacing = …` (never reassigned — prefer-const)
     5. Lighting.vue L338: `const throttle = (func: Function, delay: number) => {` → `const throttle = (func: (...args: unknown[]) => void, delay: number) => {`. SAFE: only call sites are L642 `throttle(applyStaticColor, 0)` and L681 `throttle(() => applyCustomColor(false), 0)`; throttled wrappers invoked with zero args (template L100) — PM-verified assignable.
   - Done when: `npm run lint` → `0 errors` and exit code 0 (warnings remain, ~221)
   - Done when: `grep -rn '<br></br>' src/` → nothing; `grep -n 'props.profileMaxTravel,' src/components/performance/SwitchProfiles.vue` → nothing
   - Done when: `npm run typecheck` → 0 errors; `npm run build` passes
   - On finish: IN-REVIEW; write `docs/plans/reviews/review-lint-fixes.md`. Reviewer reruns the Done-whens (build last).

3. **Update CLAUDE.md for the new script** — [trivial] — STATUS: ✓ DONE (Worker self-check 2026-10-11)
   - File: `CLAUDE.md` (docs only; skip the typecheck/build gate; still hand off defect-free)
   - Edit spec:
     1. In the Commands code block, after the `npm run typecheck …` line add: `npm run lint          # ESLint flat config (eslint.config.mjs); exit 0 = clean, warnings tolerated`
     2. Replace the line `There is no lint script and currently no test files, despite vitest/@vue/test-utils being installed.` with: `Lint runs via ESLint 10 flat config (``eslint.config.mjs``); ~221 deferred warnings are tolerated (exit 0) and ratchet down per the backlog item. There are currently no test files, despite vitest/@vue/test-utils being installed.`
   - Done when: `grep -n 'npm run lint' CLAUDE.md` → ≥1 hit; `grep -n 'There is no lint script' CLAUDE.md` → nothing
   - Trivial → Worker marks DONE directly after self-check.

## Findings
- (none open — PM-open already routed the deferred-lint follow-up to backlog.md § "lint-warnings-ratchet"; no further routing needed at close unless new lines appear above.)
