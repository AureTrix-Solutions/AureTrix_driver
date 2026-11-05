# SPRINT: sprint-30-docs-pages-verify-5

**GOAL:** SwitchProfiles.md matches the current SwitchProfiles.vue — fix all PM-verified drift (phantom baseLayout prop, timer/listener types, wrapper-vs-SDK travel shape, UI/CSS details, missing guard).
**DONE-CRITERIA (sprint):** All Task 1 Done-when greps green; Reviewer PASS on review-switchprofiles.md; PO sign-off.
**Started:** 2026-11-04  ·  **Status:** IN PROGRESS

## Checkpoint
- Branch: `sprint-30-docs-pages-verify-5`
- tsc baseline: 0 errors (docs/tsc-baseline.txt) — docs-only sprint, self-check gate SKIPPED (no source changes)
- Cleanup: .scratch/ has pm-notes.md (PO may delete); _to_delete/ absent (from actual ls at PM-open)

## ▶ RUN THIS
Next: Task 1 — apply the 14 numbered edits below to docs/pages/SwitchProfiles.md, then write the review file and go IN-REVIEW. Do this task, then stop.
PM research is COMPLETE: every OLD text below was grep-verified 2026-11-04. Apply as written — do not re-derive. For single-line edits, match the line's exact spacing (grep it first if Edit refuses).

## Tasks
1. **Fix SwitchProfiles.md drift (15 edits, docs-only)** — [high-stakes] — STATUS: PENDING
   - Files: `docs/pages/SwitchProfiles.md` (ONLY file edited; no src/ changes)
   - Why high-stakes: SDK-correctness claims in docs (wrapper output shape) + multi-edit; Reviewer required.
   - Edits (line refs from 2026-11-04; re-grep the OLD text if a prior edit shifted lines):
     1. md:126 DELETE line: `  baseLayout: any;                // Base layout (unused)` — prop does not exist (vue props = selectedKeys/layout/profileMaxTravel only; parent passes no :base-layout).
     2. md:568 DELETE line: `  :base-layout="baseLayout"` (inside the ```vue integration snippet).
     3. md:166 REPLACE `NodeJS.Timeout` → `ReturnType<typeof setTimeout>` in: `let captureInterval: NodeJS.Timeout | null = null;      // Polling interval` (keep comment/spacing; source vue:182).
     4. md:167 same swap in: `let countdownInterval: NodeJS.Timeout | null = null;    // Timer interval` (vue:183).
     5. md:180 same swap in: `let keyTestInterval: NodeJS.Timeout | null = null;      // Polling interval` (vue:193).
     6. md:181 REPLACE `const keydownListener = ref<Function | null>(null);     // Keyboard event listener` → `const keydownListener = ref<((event: KeyboardEvent) => void) | null>(null);     // Keyboard event listener` (vue:194).
     7. md:65 REPLACE `  - Subsequent options: Custom profiles with format "SwitchName (X.Xmm)"` → `  - Subsequent options: Custom profiles with format "SwitchName (X.Xmm)"; shows "N/A" instead of the number when maxTravel is unset (vue: maxTravel ? toFixed(1) : 'N/A')`.
     8. md:109 REPLACE `- **Travel Column**: Live-updating travel value (green text, updates in real-time)` → `- **Travel Column**: Live-updating travel value (accent color, updates in real-time)` (vue:700 .live = $accent-color; md:610 already says Accent).
     9. md:208 REPLACE `Component syncs selectedProfileId via watcher` → `Component sets selectedProfileId directly from store in addProfile (watcher covers external store changes)` (vue:221 direct set; watcher vue:207).
     10. md:286 REPLACE `Component syncs: selectedProfileId = null` → `Component sets selectedProfileId = null directly, resets capturedTravel = 0, closes capture modal` (vue:230-232).
     11. md:309-310 Key Test Flow — REPLACE the two lines:
         ```
           ↓
         Step 2: remapKeyForTest(physicalKey)
         ```
         with:
         ```
           ↓
         Guard: if actuationPoint <= 0 after load → keyTestEnabled = false, abort (no remap, no modal)
           ↓
         Step 2: remapKeyForTest(physicalKey)
         ```
         (vue:424-427.)
     12. md:232-233 capture flow — REPLACE the two lines:
         ```
           ├─ SDK returns { travels: [[...], [...], ...], maxTravel: X }
           ├─ Flatten nested travels array
         ```
         with:
         ```
           ├─ KeyboardService wrapper returns { travels: number[] (already flat), maxTravel: X } (raw SDK travels is nested number[][]; wrapper flattens + computes maxTravel)
           ├─ Defensive re-flatten: Array.isArray(travels[0]) ? travels.flat() : travels
         ```
         (KS wrapper annotation + vue:255.)
     13. md:361 SDK table row REPLACE `| \`getRm6X21Travel()\` | Get current travel for all keys | Capture and key test polling |` → `| \`getRm6X21Travel()\` | Get current travel for all keys (KeyboardService wrapper flattens travels to number[] and computes maxTravel) | Capture and key test polling |`.
     14. md:383-396 Response Structure — REPLACE heading line + code block + trailing sentence:
         OLD (current text):
         ````
         **getRm6X21Travel() Response Structure**:

         ```typescript
         {
           travels: [
             [0, 0, 2.3, 0, ...],  // Row 1 travels
             [0, 0, 0, 1.8, ...],  // Row 2 travels
             // ... more rows
           ],
           maxTravel: 2.3  // Overall max across all keys
         }
         ```

         For capture, we flatten the nested array and find the max. For key test, we use `maxTravel` directly.
         ````
         NEW:
         ````
         **getRm6X21Travel() Response Structure** (KeyboardService wrapper OUTPUT — the raw SDK returns `status: number[][]` and nested `travels: number[][]`; the wrapper transforms both, see `async getRm6X21Travel` in src/services/KeyboardService.ts):

         ```typescript
         {
           status: number[][],   // per-key status grid (passed through)
           travels: number[],    // FLAT — wrapper flattens the SDK's nested rows
           maxTravel: number     // wrapper-computed: max of travels > 0; 4.0 if no travels reported; 0 if all ≤ 0
         }
         ```

         For capture, the component defensively re-flattens (`Array.isArray(travels[0]) ? travels.flat() : travels`), filters out zero values and tracks the running max. For key test, we use `maxTravel` directly.
         ````
         (Both sides grep-verified: wrapper KS:981-998 flattens + computes maxTravel with 4.0/0 fallbacks; sdk-ref §4 row VERIFIED says raw SDK = nested.)
     15. md:609 REPLACE `- **Header**: Background dark, text color from variables` → `- **Header**: Background transparent (rgba of $background-dark with alpha 0.0), text color from variables` (vue:689 th { background-color: rgba(v.$background-dark, 0.0) }).
     - Also (QA tier): fix any typo/format defect you notice in spans you touch; hand off clean.
   - Done when: `grep -n "baseLayout\|base-layout" docs/pages/SwitchProfiles.md` returns nothing
   - Done when: `grep -n "NodeJS.Timeout\|ref<Function" docs/pages/SwitchProfiles.md` returns nothing AND `grep -c "ReturnType<typeof setTimeout>" docs/pages/SwitchProfiles.md` returns 3
   - Done when: `grep -n "travels: \[\[\|green text\|Background dark" docs/pages/SwitchProfiles.md` returns nothing
   - Done when: `grep -n "actuationPoint <= 0" docs/pages/SwitchProfiles.md` returns 1 hit AND `grep -c "Array.isArray(travels" docs/pages/SwitchProfiles.md` returns 2 AND `grep -n "N/A\" instead" docs/pages/SwitchProfiles.md` returns 1 hit
   - Done when: `git diff --name-only -- src/` returns nothing (docs-only)
   - Then: create `docs/plans/reviews/review-switchprofiles.md` from docs/plans/templates/review-template.md — begin with the sprint goal (one line) + the Done-when criteria above, then Base hash = commit before your first edit, Head = your commit. Hardware check section: N/A (no [hw]). Set task IN-REVIEW, advance ▶ RUN THIS to "Reviewer: follow docs/plans/reviews/review-switchprofiles.md", commit `sprint-30-docs-pages-verify-5: Task 1 — ...`, stop.

## Findings
(none staged — the baseLayout drift found in KeyTravel.md / SingleKeyTravel.md during PM-open research was routed directly to backlog.md lines for those pages, 2026-11-04)
