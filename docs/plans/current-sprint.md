# SPRINT: sprint-29-docs-pages-verify-4

**GOAL:** Bring `docs/pages/GlobalTravel.md` into full fidelity with `src/components/performance/GlobalTravel.vue` (7 PM-confirmed drifts), and correct the overstated "Typical User Journey" navigation order in `docs/PAGES_OVERVIEW.md`.
**DONE-CRITERIA (sprint):** Every Done-when grep below returns its stated count; both files committed; no `src/` file modified; Reviewer PASS on both tasks; PO signs off.
**Started:** 2026-11-03  ·  **Status:** IN PROGRESS

## Checkpoint
- Branch: `sprint-29-docs-pages-verify-4`
- tsc baseline: 0 errors (docs/tsc-baseline.txt) — **gate skipped, all tasks are docs-only** per CLAUDE.md
- Cleanup: to be reported by Worker from an actual `ls .scratch/ _to_delete/`
<!-- Session-start check: on sprint branch (not main) + clean tree. Uncommitted changes → STOP, report.
     Do NOT record or update a commit hash here — git log is the source of truth.
     Updating a task's status REPLACES its one checkpoint line — never append a second paragraph.
     On resume, trust this checkpoint as the plan; consult only the compiler for results. -->

## ▶ RUN THIS
Next: Task 1b — rewrite §Updating Global Settings to the real flow (debounce wrapper, clamp order, deadzone-merge rule). Do this task, then stop.

## Scope notes (apply to every task)
- **Docs-only.** Never edit any file under `src/`. Verify after each task: `git status --short src/` returns NOTHING.
- Line numbers below are as of head `2c8ef76`; they drift as earlier sub-tasks land, so **always locate by the quoted target text, not by line number.** Every target string below was grep-verified unique (count=1) at plan time unless stated otherwise.
- Keep the doc's existing voice and heading structure. Fix facts; do not restructure or reword sections already correct (see the Verified-correct list at the end of Task 1).
- One commit per sub-task, message `sprint-29-docs-pages-verify-4: Task 1a — <summary>`.

## Tasks

1. **GlobalTravel.md drift fixes (parent, 4 sequential sub-tasks)** — [high-stakes] — STATUS: IN-PROGRESS
   Files: `docs/pages/GlobalTravel.md`; source of truth `src/components/performance/GlobalTravel.vue`

   **1a. §Loading Global Settings — real load gate + false SDK claim** — STATUS: ✓ DONE (4 edits applied, all Done-when greps pass, src/ clean)
   The existing tree (target: the fenced block from `Component Mount` through `Store previous deadzone values for change detection`, ~:155–169) is accurate EXCEPT its root line. Make surgical edits — do not rewrite the whole block.
   - **Edit 1** — Replace the root line `Component Mount` (and the `↓` following it) with the real gate, keeping every line below `loadGlobalSettings()` as-is:
     ```
     Load gate — runs only when ALL of:
       connectionStore.isInitialized && props.layout.length > 0 && !hasLoadedSettings
       (hasLoadedSettings is a load-once-per-session flag, set true before the call)
     Trigger sites, all behind that gate: onMounted · watch(isInitialized) ·
       watch(layout.length) (empty→populated only) · watch(isConnected)
       (on disconnect resets hasLoadedSettings = false, so settings reload on next connection)
       ↓
     loadGlobalSettings()
       ↓
     ```
   - **Edit 2** — In that tree, after the `KeyboardService.getGlobalTouchTravel()` line, note the real consumption: the component reads only `settings.globalTouchTravel`, and applies it only when it is within the **hardcoded** `0.1`–`4.0` range (`globalTravel.value = Number(settings.globalTouchTravel.toFixed(2))`). Also add the branch the doc currently omits: if no global-mode key is found, it falls back to `getDpDr(keyIds[0])` with the same number/NaN/`[0, 1.0]` validation.
   - **Edit 3** — Replace line ~:171 (target: `**Important:** The global deadzones are fetched via`) with:
     ``**Important:** `getGlobalTouchTravel()` returns an `IDB` object that DOES carry all three fields — `globalTouchTravel`, `pressDead`, `releaseDead` (verified: docs/sdk-reference-v2.md §5.1 and `export interface IDB { globalTouchTravel: number; pressDead: number; releaseDead: number; }`). The component reads only the travel value from that response and sources the global deadzones from `getDpDr()` on a key confirmed to be in global performance mode instead.``
   - **Edit 4** — The tree's failure handling must say what the source does: the outer `catch` logs `console.error('[GlobalTravel] loadGlobalSettings failed:', error)`. (Source has **no `console.warn`** anywhere — do not introduce one.)
   - Done when: `grep -c "does not return deadzone values" docs/pages/GlobalTravel.md` → `0`
   - Done when: `grep -c "hasLoadedSettings" docs/pages/GlobalTravel.md` → `>= 1`
   - Done when: `grep -c "Component Mount" docs/pages/GlobalTravel.md` → `0`
   - Done when: `grep -c "console.warn" docs/pages/GlobalTravel.md` → `0`
   - Done when: `git status --short src/` → empty

   **1b. §Setting Keys to Global Mode — remove the nonexistent fetch-first Step 1** — STATUS: PENDING
   - **Edit 1** — Replace the Step 1 lines of the flow tree (target: `Step 1: Fetch current global settings from keyboard` through `Check all values are valid numbers (throw if NaN)`, ~:205–212) with:
     ```
     Step 1: Source values from the current UI settings (refs), not the Global-DB register
       ↓
     globalTravelValue = globalTravel.value, globalPressDead = pressDead.value,
     globalReleaseDead = releaseDead.value   (no SDK read, no NaN validation)
       ↓
     ```
     Leave `Step 2: Apply global values to each key BEFORE switching mode` and everything after it untouched — they are accurate.
   - **Edit 2** — Rewrite Critical Implementation Details item **1** (target: `**Fetch-First Pattern**`) to:
     `1. **UI Refs as Source**: The button applies the values currently held in the component's refs (`globalTravel`, `pressDead`, `releaseDead`). It performs no read-back from the keyboard, so what the sliders show is what gets written to the keys.`
   - **Edit 3** — DELETE item **3** (target: `**NaN Validation**`) — no SDK response is read in this function, and its parenthetical ("which aren't in the TypeScript type") is false: `IDB` declares both fields.
   - **Edit 4** — DELETE item **4** (target: `**UI State Synchronization**`) — the refs are the source and are never rewritten afterwards.
   - **Edit 5** — Renumber the survivors to 1 (**UI Refs as Source**), 2 (**Apply Before Switch**, text unchanged), 3 (**mode-changed Event**, text unchanged).
   - Done when: `grep -c "Fetch-First Pattern\|NaN Validation\|UI State Synchronization" docs/pages/GlobalTravel.md` → `0`
   - Done when: `grep -c "Fetch current global settings from keyboard" docs/pages/GlobalTravel.md` → `0`
   - Done when: `grep -c "mode-changed Event" docs/pages/GlobalTravel.md` → `1`
   - Done when: `grep -c "Apply Before Switch" docs/pages/GlobalTravel.md` → `1`
   - Done when: `git status --short src/` → empty

   **1c. Batch snippet guards + Workflow 4 + missing API functions** — STATUS: PENDING
   - **Edit 1** — §Batch Processing Strategy snippet: replace `if (mode.touchMode === 'global') {` with the source's guard `if (!(mode instanceof Error) && mode.touchMode === 'global') {`
   - **Edit 2** — Second snippet of that section (target: `await processBatches(globalModeKeys, async (keyId) => {`): wrap it as the source does with `if (globalModeKeys.length > 0) {` … `}`, so the snippet can't be copied without the guard.
   - **Edit 3** — Workflow 4 step 4 (target: ``Component batches `setPerformanceMode(key, 'global', 0)` for each selected key``) → `Component batches each selected key through setSingleTravel, setDp, setDr, then setPerformanceMode(key, 'global', 0) — the values are written BEFORE the mode switch`
   - **Edit 4** — Workflow 4 step 5 (target: `Current global travel and deadzones apply to newly converted keys`) → `The travel and deadzone values written are the ones held in the component's UI refs at click time`
   - **Edit 5** — In §Technical Implementation, after the Computed Properties block (target: `const maxTravel = computed(() =>`), add a short `### Functions` list for the two setup()-returned entry points the doc never mentions:
     - `adjustTravel(delta)` — clamps to `[minTravel, maxTravel]`, rounds to 2dp, then calls `updateGlobalSettings()`
     - `adjustDeadZone(delta, 'press' | 'release')` — early-returns for `'release'` while zones are linked; clamps to `[0, 1.0]`; when linked, mirrors the value onto the other zone; then calls `updateGlobalSettings()`
   - **Edit 6** — Add the two SDK methods the component calls but §Methods Used omits, as table rows: `getDpDr(key)` (reads a global-mode key's deadzones) and `setSingleTravel(key, travel)` (written per key before the global-mode switch).
   - Done when: `grep -c "if (mode.touchMode === 'global') {" docs/pages/GlobalTravel.md` → `0`
   - Done when: `grep -c "adjustTravel\|adjustDeadZone" docs/pages/GlobalTravel.md` → `>= 2`
   - Done when: `grep -c "getDpDr\|setSingleTravel" docs/pages/GlobalTravel.md` → `>= 4` (was 3 at plan time)
   - Done when: `git status --short src/` → empty

   **1d. Scenario 3 auto-clamp, integration snippet, stale 300ms limitation** — STATUS: PENDING
   - **Edit 1** — Replace the Scenario 3 fenced block (target its UNIQUE first line `profileMaxTravel = 4.0mm, releaseDead = 0.1mm`; the block runs to its `Result:` line) with:
     ```
     Initial: globalTravel = 3.8mm, profileMaxTravel = 4.0mm, releaseDead = 0.1mm
     User switches to profile with maxTravel = 3.5mm
     maxTravel becomes min(3.5, 3.5 - 0.1) = 3.4mm
     globalTravel stays 3.8mm — it is NOT clamped at switch time
     (no watcher observes props.profileMaxTravel)
     Clamping is lazy: globalTravel is corrected to 3.4mm at the next
       - deadzone change (the [pressDead, releaseDead] watcher), or
       - write to hardware (the guard before setGlobalTouchTravel)
     Result: an over-limit value can persist in the UI until one of those fires
     ```
     > **Why:** the current `Auto-clamp: globalTravel = 3.4mm` asserts an automatic correction that does not exist. The component has exactly four watchers, none on `profileMaxTravel`; that prop appears only in its declaration and the `maxTravel` computed.
     > ⚠ **Do NOT** use `Auto-clamp` as a grep target — it appears 3× (:397 Scenario 1, :408 Scenario 2, :419 Scenario 3) and Scenarios 1–2 are CORRECT and must keep theirs.
   - **Edit 2** — In the §Integration with Performance Page `<GlobalTravel …>` snippet, replace `@refresh-overlays="$emit('refresh-overlays')"` with `@mode-changed="handleModeChange"`.
     > **Why:** `refresh-overlays`/`refreshOverlays` exists NOWHERE in `src/`. The real binding forwards through KeyTravel (`emit('mode-changed', keyIds, newMode)`) to Performance.vue.
   - **Edit 3** — DELETE Known Limitation item **4** (target: `**Overlay Timing**: 300ms delay after mode conversion`). The component's script contains no `setTimeout` and no `300` (its only `300` is `font-weight: 300` in SCSS); the parent's timers are 3000ms and 100ms, neither an overlay delay. Item 4 is last, so items 1–3 need NO renumbering.
   - Done when: `grep -c "Result: Travel respects new profile limits" docs/pages/GlobalTravel.md` → `0`
   - Done when: `grep -c "Auto-clamp" docs/pages/GlobalTravel.md` → `2` (Scenarios 1 and 2 only)
   - Done when: `grep -c "refresh-overlays" docs/pages/GlobalTravel.md` → `0`
   - Done when: `grep -c "300ms delay" docs/pages/GlobalTravel.md` → `0`
   - Done when: `grep -c "@mode-changed=\"handleModeChange\"" docs/pages/GlobalTravel.md` → `1`
   - Done when: `git status --short src/` → empty

   - **After 1d:** set parent Task 1 → IN-REVIEW and write `docs/plans/reviews/review-globaltravel.md` from the template — sprint goal (one line) + Task 1's Done-when criteria + Base/Head hashes spanning all four sub-tasks. Then advance ▶ RUN THIS to Task 2.
   - **Verified correct — DO NOT edit** (PM-checked against source): the Props/Emits/Core State/Computed blocks in §Technical Implementation; §Automatic Clamping formula table; §Deadzone Linking tree and its watcher snippet; **Scenarios 1 and 2** (arithmetic re-verified); Workflows 1–3; §Event Flow tree; the component-tree diagram; §Related Documentation (all 4 links resolve); CID items 2 and 5.

2. **PAGES_OVERVIEW.md — "Typical User Journey" overstates a required order** — [high-stakes] — STATUS: PENDING
   File: `docs/PAGES_OVERVIEW.md`
   - **Edit 1** — Under `### Typical User Journey` (~:342) the fenced diagram presents Connect → Performance → Calibration → Key Mapping → Macro Recording as a linear sequence. Rewrite it so the order reads as *typical*, not *required*: keep Connect Page first and label it the only real prerequisite (a device must be paired), then present the remaining four as a common order that may be visited in any sequence.
     > **Why (PM-verified):** `grep -n "beforeEach\|requiresAuth\|meta:\|isConnected\|redirect" src/router/index.ts` returns NOTHING — the router defines no navigation guards or gating, so no page depends on another having been visited. This is the backlog `## Document issues` item from sprint-26 F2, routed here at PM-open.
   - **Edit 2** — Add one sentence adjacent to the diagram stating the app enforces no page ordering; all feature pages are reachable once a device is connected.
   - Done when: `grep -c "Typical User Journey" docs/PAGES_OVERVIEW.md` → `1`
   - Done when: `grep -A12 "Typical User Journey" docs/PAGES_OVERVIEW.md` shows the corrected wording (Reviewer confirms the rendered block no longer implies a mandatory sequence)
   - Done when: `git status --short src/` → empty
   - Then set → IN-REVIEW, write `docs/plans/reviews/review-pages-overview-journey.md`, and advance ▶ RUN THIS to "ALL TASKS DONE — awaiting PO sign-off".

## Findings (raw — PM routes at close)
- <none yet>
