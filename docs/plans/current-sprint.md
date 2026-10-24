# SPRINT: sprint-18-code-hygiene-3

**GOAL:** Clear two verified Code-hygiene backlog items — fix the `getRm6X21Travel` wrapper's `-Infinity` maxTravel on the all-zero-travels path, and remove the dead `@update-notification` binding (plus its now-orphaned `setNotification` helper) in Performance.vue.
**DONE-CRITERIA (sprint):** `getRm6X21Travel` returns 0 (not -Infinity) when travels are non-empty but all ≤ 0, keeping the 4.0 empty-array default; `grep -rn "update-notification\|setNotification" src/` returns 0 hits; typecheck at baseline (0); lint exit 0.
**Started:** 2026-10-24  ·  **Status:** IN PROGRESS
<!-- revN (YYYY-MM-DD): <what changed>   ← log revisions here, newest last -->

## Checkpoint
- Branch: `sprint-18-code-hygiene-3`
- tsc baseline: 0 errors (docs/tsc-baseline.txt)
- Cleanup: none (`.scratch/` holds only pm-notes.md; `_to_delete/` untouched)

## ▶ RUN THIS
Next: Task 1 — Fix `getRm6X21Travel` all-zero `-Infinity` maxTravel. Do this task, then stop.

## Tasks

1. **Fix `getRm6X21Travel` all-zero maxTravel (-Infinity → 0)** — [high-stakes] — STATUS: PENDING
   - Files: `src/services/KeyboardService.ts`
   - Why high-stakes: touches KeyboardService (auto high-stakes per CLAUDE.md). NOT [hw] — the sole consumer (SwitchProfiles.vue key-test) already guards with `if (currentTravel > 0)`, so both -Infinity and 0 fail the guard and hold the display; no on-device behavior changes today. This is contract hygiene.
   - The defect: when `flatTravels` is non-empty but every value ≤ 0, `Math.max(...[])` returns `-Infinity`, which the wrapper hands back as `maxTravel`. The `: 4.0` fallback only covers the empty-array case.
   - PO decision (resolved up-front, 2026-10-24): all-zero path falls back to **0**, NOT 4.0 — 0 is the honest "no key movement" value for the Key Test Monitor; 4.0 is full depth and would falsely imply a bottomed-out key. **Leave the empty-array `4.0` default unchanged** (that is the separate, correct "no profile/test data → user default" case).
   - Edit 1 — `grep -n "flatTravels.length > 0 ? Math.max" src/services/KeyboardService.ts` (currently ~:991). Replace that single line:
     - FROM: `      const maxTravel = flatTravels.length > 0 ? Math.max(...flatTravels.filter((t: number) => t > 0)) : 4.0;`
     - TO (two lines):
       `      const positiveTravels = flatTravels.filter((t: number) => t > 0);`
       `      const maxTravel = flatTravels.length === 0 ? 4.0 : positiveTravels.length > 0 ? Math.max(...positiveTravels) : 0;`
     - Semantics: empty travels → 4.0 (unchanged); non-empty with a positive value → real max (unchanged); non-empty but all ≤ 0 → 0 (the fix).
   - Edit 2 — update the annotation comment above the signature (`grep -n "computes maxTravel" src/services/KeyboardService.ts`, ~:981). In that JSDoc, change the phrase `computes maxTravel (Math.max of travels > 0, else 4.0)` to `computes maxTravel (Math.max of travels > 0; 4.0 if no travels reported at all; 0 if travels exist but all are ≤ 0)`. Touch only that phrase; leave the rest of the comment intact.
   - Do NOT change the consumer (SwitchProfiles.vue) — its `result.maxTravel || 0` + `if (currentTravel > 0)` guard is already correct and needs no edit.
   - Done when: `grep -n "flatTravels.length > 0 ? Math.max" src/services/KeyboardService.ts` returns nothing (old form gone).
   - Done when: `grep -n "positiveTravels.length > 0 ? Math.max(...positiveTravels) : 0" src/services/KeyboardService.ts` returns the new line.
   - Done when: `npm run typecheck` exits with 0 errors (baseline).
   - Commit: `sprint-18-code-hygiene-3: task 1 — getRm6X21Travel all-zero maxTravel returns 0, empty-array 4.0 kept`. Then set IN-REVIEW and write `docs/plans/reviews/review-getRm6X21Travel-zero.md`.

2. **Remove dead `@update-notification` binding + orphaned `setNotification` helper (Performance.vue)** — [trivial] — STATUS: PENDING
   - Files: `src/pages/Performance.vue`
   - The defect: `<KeyTravel>` binds `@update-notification="setNotification"`, but KeyTravel's emits are `['update-overlay','update-single-overlay','mode-changed']` — `update-notification` is never emitted, so the binding can never fire. Removing it orphans the `setNotification` helper (its only call site), so the helper and its setup-return entry go too. The `notification` ref stays (used independently by the template + a watch + :329).
   - Edit 1 — in the `<KeyTravel ...>` block (`grep -n "@update-notification" src/pages/Performance.vue`, ~:108), delete the whole line:
     - `              @update-notification="setNotification"`
     - Leave the sibling bindings (`:selected-keys`, `:layout`, `@update-single-overlay`, `@update-overlay`, `@mode-changed`) and the `/>` intact.
   - Edit 2 — delete the helper definition (`grep -n "const setNotification" src/pages/Performance.vue`, ~:370). Remove the 3-line block:
     - FROM:
       `    const setNotification = (message: string, isError: boolean) => {`
       `      notification.value = { message, isError };`
       `    };`
     - TO: (deleted — including the blank line that followed it, if present, to avoid a double blank)
   - Edit 3 — in the setup return object (`grep -n "^      setNotification,$" src/pages/Performance.vue`, ~:437), delete the line `      setNotification,`. It sits on its own line between `      notification,` and `      error,` — `notification,` must remain.
   - Do NOT change KeyTravel.vue (its emits option is already correct). Do NOT touch the `notification` ref or the template that renders it.
   - Done when: `grep -rn "setNotification" src/pages/Performance.vue` returns nothing.
   - Done when: `grep -rn "update-notification" src/` returns nothing.
   - Done when: `npm run typecheck` exits with 0 errors (baseline).
   - Commit: `sprint-18-code-hygiene-3: task 2 — remove dead @update-notification binding + orphaned setNotification helper`.

## Findings
<!-- One line per out-of-scope observation: DEFECT + WHERE TO VERIFY (never a pre-written fix). -->
(none yet)
