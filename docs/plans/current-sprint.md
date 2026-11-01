# SPRINT: sprint-26-docs-pages-verify-1

**GOAL:** Reconcile the Connect page docs (docs/pages/Connect.md + its PAGES_OVERVIEW.md entry) against the current code — first sprint of the docs-pages-verify per-page series.
**DONE-CRITERIA (sprint):** Every claim in Connect.md matches Connect.vue / store/connection.ts / KeyboardService / App.vue as verified by the grep gates below; Reviewer PASS over cumulative base..head; umbrella backlog item annotated.
**Started:** 2026-11-01  ·  **Status:** IN PROGRESS
<!-- revN (YYYY-MM-DD): <what changed> -->

## Checkpoint
- Branch: `sprint-26-docs-pages-verify-1`
- tsc baseline: 0 errors (docs/tsc-baseline.txt) — docs-only sprint, self-check gate skipped per CLAUDE.md
- Cleanup: .scratch/ has pm-notes.md (PO may delete); _to_delete/ not checked this open
<!-- Session-start check: on sprint branch (not main) + clean tree. Uncommitted changes → STOP, report. -->

## ▶ RUN THIS
Next: Task 1a — Connect.md front half (Purpose → Data Flow). Apply edits 1-7 below verbatim, run the Done-when greps, commit. Then stop.

## Tasks
1. **Connect.md front half (Purpose → Data Flow)** — [high-stakes, group 1a/1b] — STATUS: PENDING
   - Files: `docs/pages/Connect.md`
   - Scope note: docs task — no typecheck/build gate. Apply each edit by grepping the FIND text (unique), replacing with the given text. Do not touch sections outside the edit list.
   - **Edit 1** — FIND `- Display connection status to the user` (Purpose) → REPLACE:
     `- Show connection state through the button (status text and device details are displayed in the App.vue sidebar, not on this page)`
   - **Edit 2** — FIND `- **Connection State Display**: Button text changes based on connection status` (Key Features) → REPLACE:
     `- **Connection State Feedback**: The button label binding switches between "Connect Keyboard" / "Connecting..." / "Connected"; in the two disabled states the label is hidden (disabled style sets font-size: 0%), so only the default label is ever visible`
   - **Edit 3** — FIND `- **Visual Feedback**: Button appears semi-transparent when disabled` (Main Button) → REPLACE:
     `- **Visual Feedback**: When disabled the button becomes a transparent, border-only outline (background-color: transparent + font-size: 0%); the "Connecting..." and "Connected" labels are bound but never rendered visibly`
   - **Edit 4** — FIND the State Management block:
     ```
     - Monitors:
       - `isConnecting`: Boolean indicating active connection attempt
       - `isConnected`: Boolean indicating successful connection
       - `deviceInfo`: Object containing device metadata (BoardID, version, etc.)
     ```
     REPLACE:
     ```
     - Renders from:
       - `isConnecting` / `isConnected`: drive the button label and `:disabled` state
       - `deviceInfo`: feeds a `deviceInfoText` computed (BoardID + appVersion) returned from `setup()` but never rendered on this page — the App.vue sidebar shows device details instead
     ```
   - **Edit 5** — FIND Connection Flow steps 3-6:
     ```
     3. Connection store triggers WebHID device selection dialog
     4. On selection, attempts to initialize the keyboard via SparkLink SDK
     5. If successful:
        - Stores device identifiers for auto-reconnect
        - Updates connection state
        - Enables navigation to other pages
     6. If failed:
        - Shows error (handled by store)
        - Returns to default state
     ```
     REPLACE:
     ```
     3. The store calls `KeyboardService.requestDevice()`: unfiltered WebHID picker (`filters: []`), opens the chosen device, saves its stable ID to `localStorage.pairedStableId`, initializes the SDK keyboard
     4. The store fetches `getBaseInfo()` and merges it into `deviceInfo`
     5. If successful:
        - `isConnected = true`; status text updated (shown in the sidebar)
        - Active hardware profile synced via `profileStore.syncActiveProfileFromHardware()`
        - The user stays on the Connect page — sidebar navigation is always available and never gated by connection state
     6. If failed:
        - The store catches the thrown Error and sets a `status` string (displayed in the App.vue sidebar; nothing renders on this page)
        - `finally` resets `isConnecting`; the button returns to the enabled default state
     ```
   - **Edit 6** — FIND `- **ConnectionStore** (`@/store/connection`): Manages connection lifecycle` (Dependencies/Services) → REPLACE:
     ```
     - **ConnectionStore** (`@/store/connection`): manages connection lifecycle (isConnecting/isConnected/status/deviceInfo)
     - **KeyboardService** (`@/services/KeyboardService`): singleton the store calls — `requestDevice()`, `getBaseInfo()`, `autoConnect()`
     ```
   - **Edit 7** — FIND the Data Flow chain tail:
     ```
     Connection Store Updates (isConnected = true)
         ↓
     deviceInfo Populated
         ↓
     App Navigation Enabled
     ```
     REPLACE:
     ```
     Connection Store Updates (isConnected = true, status set)
         ↓
     deviceInfo Populated (rendered in the App.vue sidebar, not on this page)
         ↓
     Profile Synced (profileStore.syncActiveProfileFromHardware)
     ```
   - KEEP unchanged: Overview paragraph; Auto-Connect feature + Known-limitation serialNumber bullet (accurate); Visual Design bullet; Background section; Component Structure snippet (matches template); External APIs; Future Enhancements "computed but not shown" (accurate).
   - Done when: `grep -n "App Navigation Enabled\|Enables navigation\|semi-transparent\|Connection store triggers\|Connection State Display\|Shows error (handled by store)\|- Monitors:" docs/pages/Connect.md` returns NOTHING.
   - Done when: `grep -c "requestDevice" docs/pages/Connect.md` ≥ 1 AND `grep -n "serialNumber on Chromium/Windows" docs/pages/Connect.md` still matches (kept bullet).
   - Done when: commit `<sprint>: task 1a` exists; tree clean.
2. **Connect.md back half (User Workflow → Developer Notes) + PAGES_OVERVIEW.md + review file** — [high-stakes, group 1a/1b] — STATUS: PENDING
   - Files: `docs/pages/Connect.md`, `docs/PAGES_OVERVIEW.md`
   - **Edit 8** — FIND `8. Can navigate to feature pages` (First-Time Connection) → REPLACE:
     `8. Uses the sidebar (always visible) to reach feature pages — navigation is never gated on connection state`
   - **Edit 9** — FIND the Subsequent Sessions block:
     ```
     1. App attempts auto-connect using saved device ID
     2. If successful, user can skip Connect page
     3. If failed (device unplugged, etc.), returns to Connect page
     ```
     REPLACE:
     ```
     1. On app startup the KeyboardService constructor schedules a deferred auto-reconnect: reads `localStorage.pairedStableId`, retries up to 3 times (1s apart) to match an already-permitted WebHID device
     2. If successful, the store's `onAutoConnectSuccess` sets deviceInfo/status; the user lands on the Connect page already connected — no automatic page navigation exists anywhere in the app
     3. If failed (device unplugged, etc.), the Connect button remains available for a manual connection
     ```
   - **Edit 10** — FIND the Error Handling block:
     ```
     - Connection failures are handled by the connection store
     - User sees button return to "Connect Keyboard" state
     - Can retry connection immediately
     - No error messages displayed on this page (handled globally)
     ```
     REPLACE:
     ```
     - Connection failures are caught by the connection store (`requestDevice()` throws; the store converts the error to a `status` string)
     - `finally` resets `isConnecting`, so the button returns to the enabled "Connect Keyboard" state and can be retried immediately
     - No error messages render on this page; the store's `status` string is displayed in the App.vue sidebar
     ```
   - **Edit 11** — FIND `- Button provides clear visual and text feedback` (Accessibility Notes) → REPLACE:
     `- Button provides a clear label ("Connect Keyboard") and a visible outline when disabled; its text feedback is hidden in disabled states (font-size: 0%)`
   - **Edit 12** — FIND `- Responsive layout adapts to different screen sizes` (Styling Highlights) → REPLACE:
     `- Fixed-size layout: the background wrapper is a fixed 3125x1700px canvas and the component has no media queries — the page does not adapt to small screens`
   - **Edit 13** — FIND `- Page auto-loads on mount (no manual initialization needed)` (Developer Notes) → REPLACE:
     `- The page has no onMounted hook; auto-reconnect happens at app startup inside the KeyboardService constructor (deferred to document load +100ms), independent of this page`
   - **Edit 14** — in `docs/PAGES_OVERVIEW.md`, FIND `- Connection status display` (Connect entry, §1) → REPLACE:
     `- Connection state via button feedback (status/device details live in the sidebar)`
   - KEEP unchanged: Error Handling intro context via edits above; Styling "Uses SCSS variables" (true — `v.$text-color` etc.); DevNotes "kept simple", "connect.svg must be present" (file verified in src/assets/), "font-size: 0%" note; Future Enhancements section.
   - Done when: `grep -n "can skip Connect page\|Responsive layout\|auto-loads on mount\|clear visual and text feedback" docs/pages/Connect.md` returns NOTHING AND `grep -n "Connection status display" docs/PAGES_OVERVIEW.md` returns NOTHING.
   - Done when: `grep -c "sidebar" docs/pages/Connect.md` ≥ 4 AND `grep -n "computed but not shown" docs/pages/Connect.md` still matches.
   - Done when: review file `docs/plans/reviews/review-connect-doc.md` written from review-template.md — sprint goal + BOTH tasks' Done-when criteria + Base (commit before task 1a) / Head (task 1b commit) hashes + Hardware check section marked N/A (docs-only).
   - Done when: task status → IN-REVIEW, ▶ RUN THIS → Reviewer, commit `<sprint>: task 1b`.
3. **Reviewer** — fresh session: "follow docs/plans/reviews/review-connect-doc.md". Rules ONCE over cumulative base..head. PASS → DONE (both sub-tasks collapse to ✓), advance ▶ RUN THIS to PM-close. FAIL → fix checklist per CLAUDE.md.

## Findings
- F1 RESOLVED (PO decision 2026-11-01): the hidden disabled-state label (`font-size: 0%` + transparent bg) is INTENTIONAL design — not a defect, no backlog entry. Doc edits 2/3 describe it as fact. Nothing further to route at close.
