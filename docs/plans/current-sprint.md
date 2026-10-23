# SPRINT: sprint-14-code-hygiene

**GOAL:** Clear three routed hygiene items: fix the real functional bug — GlobalTravel "Select to Global" must write the current UI settings (global travel + DpDr), not the re-fetched Global-DB register; add the missing `instanceof Error` guard at all three `getBaseInfo()` call sites in store/connection.ts; delete the dead `baseLayout` props from SingleKeyTravel.vue and SwitchProfiles.vue (and both KeyTravel bindings).
**DONE-CRITERIA (sprint):** All 3 tasks DONE (Task 1: Reviewer PASS + PO hardware ✓; Tasks 2–3: Reviewer PASS), `npm run typecheck` stays at 0 errors, `npm run lint` exit 0, Findings routed at close.
**Started:** 2026-10-23  ·  **Status:** IN PROGRESS

## Checkpoint
- Branch: `sprint-14-code-hygiene`
- tsc baseline: 0 errors (docs/tsc-baseline.txt; gate ACTIVE — every task must keep typecheck at 0)
- Cleanup: .scratch/ has pm-notes.md + review-notes.md (PO may delete); _to_delete/ holds only .gitkeep (from actual `ls`, task-2 close 2026-10-23)

## ▶ RUN THIS
Next: WORKER — "go" → Task 3: delete dead `baseLayout` props (SingleKeyTravel + SwitchProfiles + both parent bindings) ([high-stakes], PENDING; full edit spec in Tasks below). Self-check → commit `sprint-14-code-hygiene: task 3` → write review-baselayout-prop.md → IN-REVIEW. Task 2 is DONE (Reviewer PASS, 0 fails) — nothing outstanding on it.

## Tasks
1. **GlobalTravel Select-to-Global writes UI settings instead of Global-DB register** — [high-stakes][hw] — ✓ DONE 2026-10-23 (Worker `0121da8`; Reviewer PASS 0 fails; Hardware verdict PASS) — details: review-globaltravel-select-to-global.md

2. **connection.ts getBaseInfo() missing instanceof Error check** — [high-stakes] — ✓ DONE 2026-10-23 (Worker `bf12edc`, base `7785a4c`; Reviewer PASS 0 fails — all 3 Done-whens rerun ✓, `?.` ruled non-defect) — details: review-connection-getbaseinfo.md

3. **Delete dead baseLayout props (SingleKeyTravel + SwitchProfiles + both parent bindings)** — [high-stakes] — STATUS: PENDING
   - Files: `src/components/performance/SingleKeyTravel.vue`, `src/components/performance/SwitchProfiles.vue`, `src/components/performance/KeyTravel.vue` (multi-file → high-stakes; pure deletion, no device behavior → no [hw])
   - Verified dead in BOTH children: `baseLayout` appears ONLY in each child's prop declaration — never in template or setup (grep `baseLayout` in each → declaration block only). `import type { IDefKeyInfo }` STAYS in both files (still used by `layout` and `selectedKeys` props — grep `PropType<IDefKeyInfo` → 2 other uses each).
   - SCOPE CAP (PO decision 2026-10-23): prop + binding deletions ONLY. Removing both children's props leaves KeyTravel's OWN `baseLayout` prop with no consumer → that becomes dead, and the cascade up to Performance.vue / useMappedKeyboard is a SEPARATE multi-file change — do NOT touch it here (it's a backlog line). KeyTravel keeps its own `baseLayout` prop this sprint.
   - **Edit 1** — SingleKeyTravel.vue: delete the prop block (grep `baseLayout: {`):
     ```ts
    baseLayout: {
      type: Object as PropType<IDefKeyInfo[][] | null>,
      default: null,
    },
     ```
   - **Edit 2** — SwitchProfiles.vue: delete the IDENTICAL prop block (grep `baseLayout: {`):
     ```ts
    baseLayout: {
      type: Object as PropType<IDefKeyInfo[][] | null>,
      default: null,
    },
     ```
   - **Edit 3** — KeyTravel.vue: delete BOTH `:base-layout="baseLayout"` lines (grep `:base-layout="baseLayout"` → 2 hits): the one in `<SingleKeyTravel ...>` AND the one in `<SwitchProfiles ...>`. Both children now lack the prop, so both bindings go. KeyTravel's own `baseLayout` prop declaration STAYS (scope cap above).
   - Done when: `grep -n "baseLayout" src/components/performance/SingleKeyTravel.vue` → nothing
   - Done when: `grep -n "baseLayout" src/components/performance/SwitchProfiles.vue` → nothing
   - Done when: `grep -c ':base-layout="baseLayout"' src/components/performance/KeyTravel.vue` → 0
   - Done when: `grep -c "baseLayout: {" src/components/performance/KeyTravel.vue` → 1 (KeyTravel's OWN prop untouched)
   - Done when: `npm run typecheck` → 0 errors; `npm run lint` exit 0
   - Self-check: run typecheck; commit `sprint-14-code-hygiene: task 3`; write review-baselayout-prop.md; set IN-REVIEW.

## Findings
<!-- One line per out-of-scope defect: DEFECT + WHERE TO VERIFY. PM routes at close. -->
- <none yet — the SwitchProfiles dead-baseLayout item was folded into task 3 (PO decision 2026-10-23); the KeyTravel dead-prop cascade it creates is already a backlog line; do not re-file either>
