# SPRINT: sprint-14-code-hygiene (ARCHIVED)

**GOAL:** Clear three routed hygiene items: fix the real functional bug — GlobalTravel "Select to Global" must write the current UI settings (global travel + DpDr), not the re-fetched Global-DB register; add the missing `instanceof Error` guard at all three `getBaseInfo()` call sites in store/connection.ts; delete the dead `baseLayout` props from SingleKeyTravel.vue and SwitchProfiles.vue (and both KeyTravel bindings).
**DONE-CRITERIA (sprint):** All 3 tasks DONE (Task 1: Reviewer PASS + PO hardware ✓; Tasks 2–3: Reviewer PASS), `npm run typecheck` stays at 0 errors, `npm run lint` exit 0, Findings routed at close.
**Started:** 2026-10-23  ·  **Closed:** 2026-10-23  ·  **Tasks:** 3 (all DONE)  ·  **Signed off by:** PO (2026-10-23)

## Checkpoint
- Branch: `sprint-14-code-hygiene`
- tsc baseline: 0 errors (docs/tsc-baseline.txt; gate ACTIVE — every task must keep typecheck at 0)
- Cleanup: .scratch/ has pm-notes.md + review-notes.md (PO may delete); _to_delete/ holds only .gitkeep (from actual `ls`, task-3 Reviewer close 2026-10-23)

## ▶ RUN THIS
ALL TASKS DONE — awaiting PO sign-off. Next: PM-close — "Act as PM per CLAUDE.md. All tasks DONE; assemble work + QA verdicts vs the goal for my sign-off; on acceptance archive, on rejection revise." No further Worker or Reviewer tasks this sprint.

## Tasks
1. **GlobalTravel Select-to-Global writes UI settings instead of Global-DB register** — [high-stakes][hw] — ✓ DONE 2026-10-23 (Worker `0121da8`; Reviewer PASS 0 fails; Hardware verdict PASS) — details: review-globaltravel-select-to-global.md

2. **connection.ts getBaseInfo() missing instanceof Error check** — [high-stakes] — ✓ DONE 2026-10-23 (Worker `bf12edc`, base `7785a4c`; Reviewer PASS 0 fails — all 3 Done-whens rerun ✓, `?.` ruled non-defect) — details: review-connection-getbaseinfo.md

3. **Delete dead baseLayout props (SingleKeyTravel + SwitchProfiles + both parent bindings)** — [high-stakes] — ✓ DONE 2026-10-23 (Worker `b8ca878`, base `7ce699f`; Reviewer PASS 0 fails — diff exactly 3 files / 10 deletions / 0 insertions, all Done-whens rerun ✓) — details: review-baselayout-prop.md

## Findings
- <none — the SwitchProfiles dead-baseLayout item was folded into task 3 (PO decision 2026-10-23); the KeyTravel dead-prop cascade it creates is already a backlog line>

## Close summary (PM, 2026-10-23)
- Gates re-run at close: `npm run typecheck` exit 0; `npm run lint` exit 0.
- Design intent verified untouched by all three Reviewers (filters:[], usagePage 65440, wrappers return Error).
- Findings: nothing to route; the one out-of-scope item (KeyTravel's own `baseLayout` prop now consumerless) is already a backlog line per the PO's scope cap.
- Reviewer nit (no action): task 1's Done-when said `loadGlobalTravel`; actual function is `loadGlobalSettings` — doc wording only.
