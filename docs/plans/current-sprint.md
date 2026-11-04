# SPRINT: sprint-29-docs-pages-verify-4

**GOAL:** Bring `docs/pages/GlobalTravel.md` into full fidelity with `src/components/performance/GlobalTravel.vue` (7 PM-confirmed drifts), and correct the overstated "Typical User Journey" navigation order in `docs/PAGES_OVERVIEW.md`.
**DONE-CRITERIA (sprint):** Every Done-when grep below returns its stated count; both files committed; no `src/` file modified; Reviewer PASS on both tasks; PO signs off.
**Started:** 2026-11-03  ·  **Status:** IN PROGRESS

## Checkpoint
- Branch: `sprint-29-docs-pages-verify-4`
- tsc baseline: 0 errors (docs/tsc-baseline.txt) — **gate skipped, all tasks are docs-only** per CLAUDE.md
- Cleanup (from `ls` at Task 1 review): `.scratch/` holds `pm-notes.md` + `review-notes.md` (gitignored working files, PO may delete); `_to_delete/` empty. No repo file staged for removal.
<!-- Session-start check: on sprint branch (not main) + clean tree. Uncommitted changes → STOP, report.
     Do NOT record or update a commit hash here — git log is the source of truth.
     Updating a task's status REPLACES its one checkpoint line — never append a second paragraph.
     On resume, trust this checkpoint as the plan; consult only the compiler for results. -->

## ▶ RUN THIS
Reviewer window: "follow docs/plans/reviews/review-typical-journey.md" — Task 2 (PAGES_OVERVIEW Typical User Journey). Task 1 is DONE (Reviewer PASS). Task 2 is IN-REVIEW awaiting verdict; on PASS this sprint is ALL TASKS DONE — awaiting PO sign-off.

## Scope notes (apply to every task)
- **Docs-only.** Never edit any file under `src/`. Verify after each task: `git status --short src/` returns NOTHING.
- Line numbers below are as of head `2c8ef76`; they drift as earlier sub-tasks land, so **always locate by the quoted target text, not by line number.** Every target string below was grep-verified unique (count=1) at plan time unless stated otherwise.
- Keep the doc's existing voice and heading structure. Fix facts; do not restructure or reword sections already correct.
- One commit per sub-task, message `sprint-29-docs-pages-verify-4: Task 1a — <summary>`.

## Tasks

1. **GlobalTravel.md drift fixes (parent, 4 sequential sub-tasks)** — [high-stakes] — STATUS: ✓ DONE (Reviewer PASS 2026-11-03, fail count 0 — all 16 cumulative Done-when greps rerun green; every new claim grep-verified vs GlobalTravel.vue + sdk-reference-v2.md + protocol-keyboard/src; review-globaltravel.md holds the verdict)

2. **PAGES_OVERVIEW.md — "Typical User Journey" overstates a required order** — [high-stakes] — STATUS: IN-REVIEW
   Checkpoint: both edits applied in one span; router claim re-verified this session (guard grep → nothing, exit 1). Done-when greps green (count=1, -A12 block correct, src/ empty). Docs-only → tsc gate skipped. Cleanup: `.scratch/` = pm-notes.md + review-notes.md (PO may delete); `_to_delete/` empty. Review file: review-typical-journey.md (Base fea8491 / Head 57d3d57).
   File: `docs/PAGES_OVERVIEW.md`
   - **Edit 1** — Under `### Typical User Journey` (~:342) the fenced diagram presents Connect → Performance → Calibration → Key Mapping → Macro Recording as a linear sequence. Rewrite it so the order reads as *typical*, not *required*: keep Connect Page first and label it the only real prerequisite (a device must be paired), then present the remaining four as a common order that may be visited in any sequence.
     > **Why (PM-verified):** `grep -n "beforeEach\|requiresAuth\|meta:\|isConnected\|redirect" src/router/index.ts` returns NOTHING — the router defines no navigation guards or gating, so no page depends on another having been visited. This is the backlog `## Document issues` item from sprint-26 F2, routed here at PM-open.
   - **Edit 2** — Add one sentence adjacent to the diagram stating the app enforces no page ordering; all feature pages are reachable once a device is connected.
   - Done when: `grep -c "Typical User Journey" docs/PAGES_OVERVIEW.md` → `1`
   - Done when: `grep -A12 "Typical User Journey" docs/PAGES_OVERVIEW.md` shows the corrected wording (Reviewer confirms the rendered block no longer implies a mandatory sequence)
   - Done when: `git status --short src/` → empty
   - Then set → IN-REVIEW, write `docs/plans/reviews/review-pages-overview-journey.md`, and advance ▶ RUN THIS to "ALL TASKS DONE — awaiting PO sign-off".

## Findings (raw — PM routes at close)
- Task 1 review observation (non-defect): docs/sdk-reference-v2.md renders the IDB blocks as `interface IDB` (:705, :2755) while the SDK source carries `export interface IDB` (protocol-keyboard/src/types/interface.ts:74). Verify: `grep -n "interface IDB" docs/sdk-reference-v2.md`.
- Task 1b plan defect (fixed inline): spec replacement tree kept a Step 3 "Sync UI state" (globalTravel.value = globalTravelValue / pressDead.value = … / releaseDead.value = …) that does not exist in source — refs are never reassigned in setKeyToGlobalMode (the same reason spec Edit 4 deletes the "UI State Synchronization" detail item). Worker deleted that tree step + its detail item and renumbered (tree Steps 4→3, 5→4; list 5→3). Verify: src/components/performance/GlobalTravel.vue setKeyToGlobalMode — no ref reassignments after processBatches.
