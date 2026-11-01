# Review: Task 1 (1a+1b) — Connect.md doc reconcile vs code

**SPRINT GOAL:** Reconcile the Connect page docs (docs/pages/Connect.md + its PAGES_OVERVIEW.md entry) against the current code — first sprint of the docs-pages-verify per-page series.

**DONE-WHEN (Task 1a):** `grep -c "App Navigation Enabled" docs/pages/Connect.md` returns 0; `grep -c "Display connection status to the user" docs/pages/Connect.md` returns 0; `grep -c "Shows error (handled by store)" docs/pages/Connect.md` returns 0; `grep -c "Enables navigation to other pages" docs/pages/Connect.md` returns 0; `grep -c "Renders from:" docs/pages/Connect.md` returns 1; `grep -c "font-size: 0%" docs/pages/Connect.md` returns ≥2; `grep -c "KeyboardService" docs/pages/Connect.md` returns ≥2.

**DONE-WHEN (Task 1b):** `grep -c "can skip Connect page" docs/pages/Connect.md` returns 0; `grep -c "Responsive layout" docs/pages/Connect.md` returns 0; `grep -c "auto-loads on mount" docs/pages/Connect.md` returns 0; `grep -c "clear visual and text feedback" docs/pages/Connect.md` returns 0; `grep -c "sidebar" docs/pages/Connect.md` returns ≥3; `grep -c "Connection status display" docs/PAGES_OVERVIEW.md` returns 0. Docs task — no typecheck gate.

**COMMIT RANGE (cumulative base..head — review the full diff):**
Base: 52e09e7 · Head: d021578

**FILES IN RANGE:** `docs/pages/Connect.md`, `docs/PAGES_OVERVIEW.md`

---

## Task scope (for the Reviewer)
- Files touched: `docs/pages/Connect.md`, `docs/PAGES_OVERVIEW.md`.
- The spec lives in `docs/plans/current-sprint.md` Task 1: 14 numbered edits (file + FIND text + REPLACE text). Edits 1-7 = Task 1a (front half, Purpose → Data Flow); edits 8-14 = Task 1b (back half + PAGES_OVERVIEW.md).
- Code sources the docs are reconciled against: `src/pages/Connect.vue`, `src/store/connection.ts`, `src/services/KeyboardService.ts`, `src/App.vue`.

## Notes for the Reviewer (Worker)
- All 14 edits applied verbatim from the plan spec. Two deviations worth flagging:
  1. **Edit 14 FIND text**: plan says FIND `- Connection status display` in PAGES_OVERVIEW.md §1 — that was the actual line; first applied with a wrong replacement (my own drafting slip), then corrected to the plan's exact REPLACE text `- Connection state via button feedback (status/device details live in the sidebar)`. Final state is verbatim.
  2. **"font-size: 0%" count**: 1a's Done-when says ≥2; after 1a it was 3, after 1b it is 4 (edit 11 adds one). Passes both gates.
- `grep -c "KeyboardService" docs/pages/Connect.md` = 4 (≥2 gate). `grep -c "Renders from:"` = 1. `grep -c "sidebar"` = 8 (≥3 gate). All Done-when greps for 1a and 1b were run from repo root (or docs/pages with relative paths) and returned the gated values; zero-count greps return rc=1.
- QA sweep run (case-insensitive grep for stale phrases: "navigation enabled", "responsive", "displays error", "status display") — no stale claims remain in Connect.md; PAGES_OVERVIEW.md clean after edit 14.
- Inline-fixable defects cleared before handoff: none found (edits were applied as authored text; no typos, links, or formatting drift introduced).
- **Finding routed this session (F2, see Findings in current-sprint.md)**: PAGES_OVERVIEW.md "Navigation Flow → Typical User Journey" ASCII diagram still presents a linear flow starting "Connect Page (pair device) → Performance Page…" — consistent with reality (Connect is the entry route) but it implies a prescribed journey; out of scope for this task's 14 edits, so it was NOT touched. Stated as defect + where-to-verify only.
- Cleanup (from actual `ls`): `.scratch/` contains `pm-notes.md` (PM's private notes, PO may delete); `_to_delete/` is empty. No cleanup needed from this task.

## Hardware check section
*(No hardware — docs task; Reviewer PASS closes it.)*
**What changed and why:** N/A — documentation-only edits reconciling Connect.md and the PAGES_OVERVIEW.md Connect entry with current code behavior (connection state feedback via button + App.vue sidebar, unfiltered WebHID picker, KeyboardService auto-reconnect at startup, no navigation gating, fixed-size layout).
**How to verify:** N/A — no device behavior changed.

## Reviewer verdict
**VERDICT: PASS** — 2026-11-01

**Reviewed:** cumulative diff 52e09e7..d021578 (`docs/pages/Connect.md`, `docs/PAGES_OVERVIEW.md`) vs the 14-edit spec in current-sprint.md Task 1.

**Verification performed (all grep-verified this session, notes in .scratch/review-notes.md):**
1. **Diff vs spec:** all 14 edits present in the diff; every REPLACE text matches the plan verbatim, including edit 14's final corrected state. KEEP items intact (serialNumber limitation bullet, SCSS variables, "computed but not shown", connect.svg note). No out-of-spec changes to the doc files.
2. **Done-when gates re-run:** 1a — 4/4 zero-count greps = 0, "Renders from:" = 1, "font-size: 0%" = 4 (≥2), "KeyboardService" = 4 (≥2). 1b — 4/4 zero-count greps = 0, "sidebar" = 8 (≥3), PAGES_OVERVIEW "Connection status display" = 0. Extras: "requestDevice" = 3, serialNumber bullet kept, "computed but not shown" kept; stale-phrase grep (semi-transparent / Connection store triggers / Connection State Display / - Monitors:) returns nothing.
3. **Doc claims vs code:**
   - Connect.vue: label binding 'Connect Keyboard'/'Connecting...'/'Connected'; `:disabled="isConnecting || isConnected"`; disabled style `font-size: 0%` + transparent bg; `deviceInfoText` computed returned from setup but never rendered; fixed 3125×1700 circuit board; no media queries.
   - store/connection.ts: `connectDevice()` → `KeyboardService.requestDevice()` → `getBaseInfo()` merged into deviceInfo → `profileStore.syncActiveProfileFromHardware()`; catch sets `status` string; `finally` resets isConnecting.
   - KeyboardService.ts: `requestDevice()` unfiltered `filters: []`, saves `localStorage.pairedStableId`, throws Error on failure; deferred auto-reconnect (load event → `setTimeout(reconnectIfPaired, 100)`), 3 attempts × 1000ms.
   - App.vue + router: sidebar renders `connectionStore.status` and deviceInfo (productName/KeyboardSN/BoardID/appVersion); nav router-links are NOT gated by connection state; no `beforeEach` guard in router/index.ts.
4. **Worker-flagged deviations:** edit 14 mis-replacement was corrected — final state verbatim (confirmed in diff). font-size count 4 ≥ 2 — passes. Both non-issues.

**Findings (non-defect observations, no FAIL items):**
- Plan's Task 2 Done-when names the review file `review-connect-doc.md`; the actual file (and ▶ RUN THIS pointer, and commit message) is `review-connect-docs.md`. Naming inconsistency in the plan text only; all live pointers are self-consistent. No action needed.
- F2 (already routed by Worker to Findings): PAGES_OVERVIEW.md "Typical User Journey" diagram implies a prescribed linear flow. PM to route at close.

**Hardware check:** N/A — docs-only task; no [hw] tag. PASS closes the task.

**Reviewer cleanup (actual ls):** `.scratch/` contains `pm-notes.md` (PM's) and `review-notes.md` (this review, PO may delete); `_to_delete/` empty — nothing for PO to `git rm`.
