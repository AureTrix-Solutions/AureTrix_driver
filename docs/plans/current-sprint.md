# SPRINT: sprint-31-docs-pages-verify-6

**GOAL:** SingleKeyTravel.md matches the current SingleKeyTravel.vue — fix all PM-verified drift (phantom baseLayout prop + binding, dead update-overlay emit, wrong event payloads, phantom 300ms/null overlay flow, stale code snippets, overlay-scope claims, re-click matrix row).
**DONE-CRITERIA (sprint):** All Task 1 sub-task Done-when greps green; Reviewer PASS on review-singlekeytravel.md; PO sign-off.
**Started:** 2026-11-04  ·  **Status:** IN PROGRESS

## Checkpoint
- Branch: `sprint-31-docs-pages-verify-6`
- tsc baseline: 0 errors (docs/tsc-baseline.txt) — docs-only sprint; self-check gate SKIPPED (no source changes)
- Cleanup (actual `ls`, after 1b): `.scratch/` = pm-notes.md only (PM's, PO may delete); `_to_delete/` = empty, nothing to git rm
- Split rationale: 4 sub-tasks × (≤11 edits, ≤35 new lines authored) → sequential 1a→1b→1c→1d, ONE Reviewer over cumulative base..head after 1d
- PM research banked in `.scratch/pm-notes.md` F5–F26 (private). Specs below are final — Worker APPLIES, does not re-derive. Line refs below drift as edits land — grep the quoted text, don't trust numbers.

## ▶ RUN THIS
Next: Task 1c — Update Failures + watcher params + load-catch snippets (6 edits). Do this ONE task, commit, update checkpoint + ▶ RUN THIS, then stop.

## Tasks
1. **Fix SingleKeyTravel.md drift (24 edits, docs-only)** — [high-stakes] — STATUS: IN-PROGRESS (parent; stays IN-PROGRESS until 1d, then IN-REVIEW)
   - Files: `docs/pages/SingleKeyTravel.md` ONLY. No src edits anywhere in this sprint.

   **1a. Props/Emits/Features/Data-Flow** — ✓ DONE (commit `74bea7a`) — all 10 spec edits applied verbatim, 13/13 Done-when greps green (5 stale=0, 8 new-text=1); no defects; docs-only so self-check gate skipped
   - Edits (each CURRENT text grep-verified 2026-11-04):
     1. DELETE line `  baseLayout: any;                // Base layout configuration (unused in current implementation)` (.vue has exactly 3 props: selectedKeys/layout/profileMaxTravel)
     2. emits block line `  'update-single-overlay',   // Sends per-key overlay data or null/{}` → `  'update-single-overlay',   // Boolean: true = show/refresh overlays, false = hide`
     3. emits block line `  'update-overlay',          // Clears global overlay when switching to single mode` → `  'update-overlay',          // Declared but NEVER emitted by the component`
     4. Event Details: `  - Payload: \`null\` to hide overlays, or \`{ refresh: true }\` to trigger per-key value fetching` → `  - Payload: boolean — \`true\` when shown (toggleOverlay or post-update refresh), \`false\` when hidden via toggleOverlay`
     5. Replace update-overlay bullet pair `- **\`update-overlay\`**: Emitted when keys switch to single mode to clear global overlay display` + `  - Payload: \`null\` (clears global overlay values)` → `- **\`update-overlay\`**: declared in \`emits\` but never emitted — no code path fires it (grep \`emit(\` in SingleKeyTravel.vue: only update-single-overlay ×2, mode-changed ×1)`
     6. mode-changed bullet: `  - Payload: \`{ keyIds: number[], newMode: 'single' }\`` → `  - Payload: POSITIONAL args \`(keyIds: number[], 'single')\` — not an object`
     7. Feature 6 bullets: `   - Displays unique travel and deadzone values for each selected key` → `   - Displays unique travel and deadzone values for every single-mode key with fetched data (not just the current selection)`; `   - Auto-refreshes when selection changes` → `   - Refreshes on Show/Hide toggle and after a successful update while visible — NOT on selection change`
     8. Data-flow line `Emit 'mode-changed' event with { keyIds: [...], newMode: 'single' }` → `Emit 'mode-changed' (positional: keyIds, 'single') — inside try, only on batch success`
     9. Data-flow tail: replace `Clear overlays (emit null)\n  ↓\nIf overlay enabled: Re-emit after 300ms to refresh display` → `If overlay is visible: emit 'update-single-overlay' (true) — immediate, no timer (no setTimeout in .vue)`; and line `Update prev values for future change detection` → `Update prev values for future change detection (runs even if the batch failed)`
     10. DELETE Known Limitation `6. **Overlay Refresh Delay**: 300ms delay after updates before overlay re-renders (intentional, allows state to settle).` (last numbered item — no renumber needed)
   - Done when: `grep -n "baseLayout: any\|refresh: true\|emit null\|300ms\|newMode: 'single' }\|Auto-refreshes when selection" docs/pages/SingleKeyTravel.md` returns nothing
   - Done when: `grep -c "NEVER emitted" docs/pages/SingleKeyTravel.md` ≥ 1; commit `<sprint>: Task 1a`

   **1b. updateSingleKeyAll snippet → verbatim source** — ✓ DONE — snippet replaced with .vue `updateSingleKeyAll` verbatim (dedent-4, diff-clean: VERBATIM-OK); Done-when greps green (keyIds/processBatches(keyIds=2, processBatches(keys,=1 per spec — Update Failures snippet, 1c fixes); docs-only, self-check gate skipped
   - Edit: in `### Batch Processing Strategy`, replace the whole snippet from `const updateSingleKeyAll = async () => {` through its closing `};` (currently maps to `keys` objects, passes `processBatches(keys,`, has no try/catch, no emits) with a VERBATIM copy of the .vue's `updateSingleKeyAll` (grep that symbol in src/components/performance/SingleKeyTravel.vue, ~33 lines: `const keyIds = keys.map(k => k.physicalKeyValue);`, `processBatches(keyIds,`, try → `emit('mode-changed', keyIds, 'single')` → catch `console.error(\`[SINGLEKEYTRAVEL] Error in updateSingleKeyAll:\`, error)`, prev* updates AFTER catch, tail `if (showOverlay.value) { emit('update-single-overlay', true); }`), dedented to snippet level. Copy = apply; do not paraphrase.
   - Done when: `grep -c "const keyIds = keys.map\|processBatches(keyIds" docs/pages/SingleKeyTravel.md` = 2 (one each)
   - Done when: `grep -c "processBatches(keys," docs/pages/SingleKeyTravel.md` = 1 (Update Failures snippet — fixed in 1c); commit `<sprint>: Task 1b`

   **1c. Update Failures + watcher params + load-catch snippets** — STATUS: PENDING
   - Edits:
     1. `Update failures are caught but don't interrupt the user experience:` → `Update failures are caught, logged via console.error, and don't interrupt the user experience (prev* tracking values update even on failure):`
     2. Replace its snippet body `try {\n  await processBatches(keys, async (physicalKeyValue) => {\n    await KeyboardService.setPerformanceMode(physicalKeyValue, 'single', 0);\n    // ...additional SDK calls\n  });\n} catch (error) {\n  // Silent failure - UI state remains consistent\n}` → `try {\n  await processBatches(keyIds, async (physicalKeyValue) => {\n    await KeyboardService.setPerformanceMode(physicalKeyValue, 'single', 0);\n    // ...additional SDK calls\n  });\n  emit('mode-changed', keyIds, 'single');\n} catch (error) {\n  console.error(\`[SINGLEKEYTRAVEL] Error in updateSingleKeyAll:\`, error);\n}`
     3. `watch(topDeadZone, (newVal, oldVal) => {` → `watch(topDeadZone, () => {`
     4. `watch(bottomDeadZone, (newVal, oldVal) => {` → `watch(bottomDeadZone, () => {`
     5. `watch(() => props.selectedKeys, async (newKeys) => {` → `watch(() => props.selectedKeys, async () => {`
     6. loadSingleKeyTravel snippet: `} catch (error) {\n    // Fall through to default\n  }` → `} catch {\n  }` (source has bare empty catch)
   - Done when: `grep -n "processBatches(keys,\|Silent failure\|Fall through to default\|(newVal, oldVal)\|async (newKeys)" docs/pages/SingleKeyTravel.md` returns nothing
   - Done when: `grep -c "console.error" docs/pages/SingleKeyTravel.md` ≥ 2; commit `<sprint>: Task 1c`

   **1d. Workflows/matrix/binding/Event-Flow/overlay scope** — STATUS: PENDING
   - Edits:
     1. `- **Show/Hide Button**: Toggles overlay visibility for selected keys` → `- **Show/Hide Button**: Toggles overlay visibility (parent refreshes overlays for ALL single-mode keys, not just the current selection)`
     2. Workflow 5 step `4. Component emits \`update-single-overlay\` with \`{}\`` → `4. Component emits \`update-single-overlay\` with payload \`true\``
     3. Workflow 5 step `6. Overlay displays unique values for each selected key` → `6. Overlay displays unique values for every single-mode key with fetched data`
     4. Workflow 5 steps 7–9: replace `7. User selects different key (e.g., "B")\n8. Selection watcher reloads settings from "B"\n9. Overlay auto-refreshes to show "B" key's values` → `7. User selects different key (e.g., "B")\n8. Selection watcher reloads the component's sliders from "B"\n9. The overlay itself does NOT refresh on selection change — it updates on the next toggle or successful value change`
     5. Matrix row `| Same keys selected (re-click) | No reload triggered (deep watch doesn't detect change) |` → `| Selected key re-clicked | Parent TOGGLES it OUT of the selection (Performance.vue findIndex→splice) → watcher fires → empty selection resets to defaults |`
     6. Integration binding: replace the `<SingleKeyTravel …>` block (currently carries `:base-layout="baseLayout"` and `@refresh-overlays="$emit('refresh-overlays')"`) with the VERBATIM binding from KeyTravel.vue (grep `<SingleKeyTravel` there): `:selected-keys`, `:layout`, `:profile-max-travel`, `@update-single-overlay="setSingleOverlay"`, `@mode-changed="handleModeChange"` — no base-layout, no refresh-overlays
     7. Event Flow last line `Performance.vue updates keyboard grid overlays for selected keys` → `Performance.vue rebuilds overlays for ALL single-mode keys (payload true) or clears them (payload false)`
   - Done when: `grep -n "baseLayout\|base-layout\|refresh-overlays\|for each selected key\|deep watch doesn't detect change" docs/pages/SingleKeyTravel.md` returns nothing
   - Done when: `grep -c '@mode-changed="handleModeChange"' docs/pages/SingleKeyTravel.md` ≥ 1; `wc -l docs/pages/SingleKeyTravel.md` in 590–650
   - Then: parent task → IN-REVIEW; write `docs/plans/reviews/review-singlekeytravel.md` (from review-template.md: sprint goal + all four Done-when sets + Base = commit BEFORE 1a, Head = 1d commit; Reviewer runs ONCE over the cumulative diff; review-notes/hashes/hw sections per template — no [hw] in this sprint); advance ▶ RUN THIS to Reviewer; commit `<sprint>: Task 1d`

## Findings
- (PM-open) KeyTravel.vue `setSingleOverlay` param typed `(data: {travel; pressDead; releaseDead} | null)` but child emits boolean — stale annotation; relay still works (re-emits arg unchanged). Verify: grep `const setSingleOverlay` in src/components/performance/KeyTravel.vue. Route to the KeyTravel.md backlog row at PM-close.

## Close checklist (PM-close only)
1. All tasks DONE + Reviewer PASS + PO sign-off  2. Route Findings → backlog  3. Snapshot → archive/sprint-31-docs-pages-verify-6/sprint.md  4. git mv review file into archive  5. Repoint backlog pointers  6. index.md row 31 = `signed off`  7. Reset this file to IDLE stub (verbatim from template)  8. One close commit
