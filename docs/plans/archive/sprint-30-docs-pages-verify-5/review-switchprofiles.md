# REVIEW: switchprofiles-drift-fix

**SPRINT GOAL:** SwitchProfiles.md matches the current SwitchProfiles.vue — fix all PM-verified drift (phantom baseLayout prop, timer/listener types, wrapper-vs-SDK travel shape, UI/CSS details, missing guard).
**TASK:** Fix SwitchProfiles.md drift (15 edits, docs-only)  ·  **TAG:** [high-stakes]
**DONE WHEN:**
- No `baseLayout` or `NodeJS.Timeout` in docs/pages/SwitchProfiles.md: grep returns nothing
- `ReturnType<typeof setTimeout>` appears 3× (three timer declarations)
- keydownListener line typed `((event: KeyboardEvent) => void)`; "N/A" in option label; "accent color" not "green text"; "Guard: if actuationPoint <= 0" in flow; `travels: number[]` flat shape; header "transparent (rgba"
- No `Function | null` and no `Component syncs` remaining

## 📝 Worker notes & self-check
- Applied all 15 PM-verified edits (plan lines 21–35) verbatim in one pass; no re-derivation, no src/ changes. Edits 2 (line 568→570) had drifted 2 lines from PM refs; matched on exact text as instructed.
- Self-check vs sdk-reference-v2.md: N/A for new SDK claims — the travel-shape edit (13/14) documents the KeyboardService WRAPPER's output (`travels: number[]` flat, wrapper-computed `maxTravel`), per PM research grep-verified against `async getRm6X21Travel` in src/services/KeyboardService.ts; the doc now explicitly distinguishes wrapper output from raw SDK shape.
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (untouched) — docs-only task, no code touched.
- typecheck/build: N/A — docs-only task; self-check gate skipped per plan (no .ts/.vue changes). Inline-defect sweep done: no typos/dead links introduced; all edits are text-verified replacements.
- Cleanup (from actual ls at handoff): .scratch/ has pm-notes.md (PO may delete); _to_delete/ has only .gitkeep → no cleanup needed.

## 🔍 Commits to review
Base: `9461bb3` (PM-open commit / branch point)   Head: `7efb6e8` (this task)

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task (docs-only; no hardware behavior changed).

## ❓ Reviewer, please confirm
- [x] meets every "DONE WHEN" criterion above — all 5 plan-level greps + 9 review-file criteria green (see Findings below)
- [x] diff scope matches the task (docs/pages/SwitchProfiles.md only; no stray files) — `git diff --stat 9461bb3..7efb6e8` = 1 file, 19+/22-; `git diff --name-only -- src/` empty
- [x] no design-intent violation — docs-only; no code touched; wrapper-returns-Error semantics preserved in doc text
- [x] typecheck/build gate met where it applies — N/A (docs-only, per plan)
- [x] tag is correct (high-stakes where required) — SDK-correctness claims in docs + multi-edit → high-stakes ✓

---
## ✅ REVIEWER VERDICT
**Result:** PASS  ·  **Date:** 2026-11-04  ·  **Fail count:** 0

### Failed items (FAIL only)
(none)

### Reviewer Findings
All 15 PM-verified edits present in diff, matched against source. Key confirmations:
- **baseLayout phantom removed**: prop deleted from interface (was line 126) + `:base-layout="baseLayout"` binding deleted (was line 568). Vue props = `selectedKeys`, `layout`, `profileMaxTravel` only — no `baseLayout` in src/components/performance/SwitchProfiles.vue.
- **Timer types fixed ×3**: `NodeJS.Timeout` → `ReturnType<typeof setTimeout>` for `captureInterval`, `countdownInterval`, `keyTestInterval`. Matches vue:182/183/193 verbatim.
- **keydownListener typed**: `ref<Function | null>` → `ref<((event: KeyboardEvent) => void) | null>`. Matches vue:194 verbatim.
- **N/A in option label**: "SwitchName (X.Xmm)" now documents `maxTravel ? toFixed(1) : 'N/A'`. Matches vue:39 template.
- **accent color (not green text)**: Travel Column updated. Matches vue:700 `.live { color: $accent-color }`.
- **Component sets selectedProfileId directly ×2**: replaced vague "syncs via watcher" with precise "sets directly from store in addProfile (watcher covers external store changes)" + "sets = null directly, resets capturedTravel = 0, closes capture modal". Matches vue:221/230-232.
- **Guard added to Key Test flow**: "Guard: if actuationPoint <= 0 after load → keyTestEnabled = false, abort (no remap, no modal)" inserted before Step 2. Matches vue:424-427.
- **Wrapper travel shape documented correctly ×3 spots** (capture flow, SDK table, Response Structure): now explicitly distinguishes KeyboardService WRAPPER output (`travels: number[]` FLAT, wrapper-computed `maxTravel`) from raw SDK shape (nested `number[][]`). Cross-checked against src/services/KeyboardService.ts:982-998 `async getRm6X21Travel` — signature returns `{ status: number[][]; travels: number[]; maxTravel: number }`; maxTravel = `4.0` if empty, `Math.max(...positiveTravels)` if any >0, else `0`. Doc matches wrapper semantics exactly. Defensive re-flatten `Array.isArray(travels[0]) ? travels.flat() : travels` documented ×2 (capture flow + Response Structure), matches vue:255.
- **Header transparent (rgba)**: "Background dark" → "Background transparent (rgba of $background-dark with alpha 0.0)". Matches vue:689 `th { background-color: rgba(v.$background-dark, 0.0) }`.
- **Zero "Component syncs" or "Function | null" remaining** in doc.

No typos, dead links, or formatting defects introduced. All edits are factual corrections that bring doc into alignment with current src/components/performance/SwitchProfiles.vue + src/services/KeyboardService.ts. Task is docs-only (no src/ changes, no hardware behavior affected).

**VERDICT: PASS.** All Done-when criteria met. No Findings to route to backlog.
