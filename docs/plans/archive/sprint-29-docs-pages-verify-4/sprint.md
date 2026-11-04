# SPRINT ARCHIVE: sprint-29-docs-pages-verify-4

**GOAL:** Bring `docs/pages/GlobalTravel.md` into full fidelity with `src/components/performance/GlobalTravel.vue` (7 PM-confirmed drifts), and correct the overstated "Typical User Journey" navigation order in `docs/PAGES_OVERVIEW.md`.
**Started:** 2026-11-03  ·  **Closed:** 2026-11-03 (PO sign-off)  ·  **Tasks:** 2 (Task 1 = parent of 4 sequential sub-tasks 1a–1d)  ·  **Signed off by:** PO
**QA:** Reviewer PASS ×2 (review-globaltravel.md — 16/16 greps; review-typical-journey.md — 3/3 greps), fail count 0, no [hw] tasks. Commits: base `2c8ef76` → head `f4b9963`. No `src/` file touched.
**Findings routed at close:** F1 (sdk-reference-v2.md `interface IDB` vs source `export interface IDB`) → backlog.md §Document issues; F2 (Task 1b plan defect) resolved inline by Worker, no routing.

--- Snapshot of current-sprint.md as archived ---

# SPRINT: sprint-29-docs-pages-verify-4

**GOAL:** Bring `docs/pages/GlobalTravel.md` into full fidelity with `src/components/performance/GlobalTravel.vue` (7 PM-confirmed drifts), and correct the overstated "Typical User Journey" navigation order in `docs/PAGES_OVERVIEW.md`.
**DONE-CRITERIA (sprint):** Every Done-when grep below returns its stated count; both files committed; no `src/` file modified; Reviewer PASS on both tasks; PO signs off.
**Started:** 2026-11-03  ·  **Status:** IN PROGRESS

## Checkpoint
- Branch: `sprint-29-docs-pages-verify-4`
- tsc baseline: 0 errors (docs/tsc-baseline.txt) — **gate skipped, all tasks are docs-only** per CLAUDE.md
- Cleanup (from `ls` at Task 2 review): `.scratch/` holds `pm-notes.md` + `review-notes.md` (gitignored working files, PO may delete); `_to_delete/` holds only `.gitkeep` — empty. No repo file staged for removal.
<!-- Session-start check: on sprint branch (not main) + clean tree. Uncommitted changes → STOP, report.
     Do NOT record or update a commit hash here — git log is the source of truth.
     Updating a task's status REPLACES its one checkpoint line — never append a second paragraph.
     On resume, trust this checkpoint as the plan; consult only the compiler for results. -->

## ▶ RUN THIS
ALL TASKS DONE — awaiting PO sign-off. (Task 1 ✓ Reviewer PASS; Task 2 ✓ Reviewer PASS 2026-11-03 — review-typical-journey.md holds the verdict, fail count 0.) Next step is PM-close: "Act as PM per CLAUDE.md. All tasks DONE; assemble work + QA verdicts vs the goal for my sign-off; on acceptance archive, on rejection revise."

## Scope notes (apply to every task)
- **Docs-only.** Never edit any file under `src/`. Verify after each task: `git status --short src/` returns NOTHING.
- Line numbers below are as of head `2c8ef76`; they drift as earlier sub-tasks land, so **always locate by the quoted target text, not by line number.** Every target string below was grep-verified unique (count=1) at plan time unless stated otherwise.
- Keep the doc's existing voice and heading structure. Fix facts; do not restructure or reword sections already correct.
- One commit per sub-task, message `sprint-29-docs-pages-verify-4: Task 1a — <summary>`.

## Tasks

1. **GlobalTravel.md drift fixes (parent, 4 sequential sub-tasks)** — [high-stakes] — STATUS: ✓ DONE (Reviewer PASS 2026-11-03, fail count 0 — all 16 cumulative Done-when greps rerun green; every new claim grep-verified vs GlobalTravel.vue + sdk-reference-v2.md + protocol-keyboard/src; review-globaltravel.md holds the verdict)

2. **PAGES_OVERVIEW.md — "Typical User Journey" overstates a required order** — [high-stakes] — STATUS: ✓ DONE (Reviewer PASS 2026-11-03, fail count 0 — all 3 Done-when greps rerun green; diff scope = docs/PAGES_OVERVIEW.md only (+11/−8); router no-guards claim independently re-verified (guard grep → exit 1); review-typical-journey.md holds the verdict)

## Findings (raw — PM routes at close)
- Task 1 review observation (non-defect): docs/sdk-reference-v2.md renders the IDB blocks as `interface IDB` (:705, :2755) while the SDK source carries `export interface IDB` (protocol-keyboard/src/types/interface.ts:74). Verify: `grep -n "interface IDB" docs/sdk-reference-v2.md`.
- Task 1b plan defect (fixed inline): spec replacement tree kept a Step 3 "Sync UI state" (globalTravel.value = globalTravelValue / pressDead.value = … / releaseDead.value = …) that does not exist in source — refs are never reassigned in setKeyToGlobalMode (the same reason spec Edit 4 deletes the "UI State Synchronization" detail item). Worker deleted that tree step + its detail item and renumbered (tree Steps 4→3, 5→4; list 5→3). Verify: src/components/performance/GlobalTravel.vue setKeyToGlobalMode — no ref reassignments after processBatches.
