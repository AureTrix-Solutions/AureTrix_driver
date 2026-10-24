# SPRINT: sprint-18-code-hygiene-3

**GOAL:** Clear two verified Code-hygiene backlog items — fix the `getRm6X21Travel` wrapper's `-Infinity` maxTravel on the all-zero-travels path, and remove the dead `@update-notification` binding (plus its now-orphaned `setNotification` helper) in Performance.vue.
**DONE-CRITERIA (sprint):** `getRm6X21Travel` returns 0 (not -Infinity) when travels are non-empty but all ≤ 0, keeping the 4.0 empty-array default; `grep -rn "update-notification\|setNotification" src/` returns 0 hits; typecheck at baseline (0); lint exit 0.
**Started:** 2026-10-24  ·  **Status:** IN PROGRESS
<!-- revN (YYYY-MM-DD): <what changed>   ← log revisions here, newest last -->

## Checkpoint
- Branch: `sprint-18-code-hygiene-3`
- tsc baseline: 0 errors (docs/tsc-baseline.txt)
- Reviewer (2026-10-24): Task 1 PASS, 0 findings; verdict + checklist in review-getRm6X21Travel-maxtravel.md; ▶ RUN THIS advanced to Task 2. Cleanup (from ls): `.scratch/` = pm-notes.md + review-notes.md (PO can delete); `_to_delete/` empty.

## ▶ RUN THIS
Next: Task 2 — Remove dead `@update-notification` binding + orphaned `setNotification` helper (Performance.vue). Do this task, then stop.

## Tasks

1. ✓ **Fix `getRm6X21Travel` all-zero maxTravel (-Infinity → 0)** — [high-stakes] — STATUS: DONE (Reviewer PASS 2026-10-24, 0 findings; commits `9e878f7`..`6cd0788`; review-getRm6X21Travel-maxtravel.md)

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
