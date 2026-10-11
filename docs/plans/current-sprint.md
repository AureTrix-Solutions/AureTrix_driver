# SPRINT: sprint-05-docs-comment-cleanup

**GOAL:** Clear the verified low-hanging backlog items that need no design decisions — purge the removed export feature from docs/pages/Debug.md, land the `serialNumber` known-limitation comments (which also records the resolved sdk-reference decision and qualifies its one bare cross-file ref), and (rev1) extend that comment coverage to the two `deviceStillPresent` fallbackId sites flagged in Findings.
**DONE-CRITERIA (sprint):** `grep -ni export docs/pages/Debug.md` → no matches; `grep -n serialNumber src/services/KeyboardService.ts` shows a known-limitation comment at all 5 sites; `grep -c "same vid/pid" src/services/KeyboardService.ts` → 2; `grep -n "deserves a decision" docs/sdk-reference-v2.md` → no matches; `npm run typecheck` ≤ 23 (docs/tsc-baseline.txt).
**Started:** 2026-10-11  ·  **Status:** IN PROGRESS
- rev1 (2026-10-11): scope expanded — routed the live Findings item (uncommented `deviceStillPresent` fallbackId blocks in KeyboardService.ts) into this sprint as Task 3 instead of backlog, per PO directive. Sprint reopened from ALL TASKS DONE.

## Checkpoint
- Branch: `sprint-05-docs-comment-cleanup`
- tsc baseline: 23 errors (docs/tsc-baseline.txt) — no task may change this count
- Cleanup: `.scratch/` has pm-notes.md (PM-private, PO may delete); `_to_delete/` has only .gitkeep — nothing for PO to `git rm`
<!-- Session-start check: on sprint branch (not main) + clean tree. Uncommitted changes → STOP, report. -->

## ▶ RUN THIS
Task 3 is IN-REVIEW. Reviewer: "follow docs/plans/reviews/review-devicestillpresent-comments.md" (base 13ceb4e, head bb3760c). On PASS → DONE + ALL TASKS DONE — awaiting PO sign-off (PM-close next). Tasks 1–2: DONE (PASS).

## Tasks

1. **Purge the removed export feature from docs/pages/Debug.md** — [high-stakes] — STATUS: DONE
   - ✓ Reviewer PASS 2026-10-11 (all 3 Done-when greps + numbering/residual/source cross-checks; 0 fails) — detail in review-debug-md-export-purge.md. Commit bdf78e2.
   - Done when: `grep -ni export docs/pages/Debug.md` → no matches (the page has no export feature; every hit must be gone)
   - Done when: `grep -n exportEncryptedJSON docs/pages/Debug.md` → no matches
   - Done when: Core Functionality's Clear Data heading reads `#### 4.` (`grep -n "Clear Data" docs/pages/Debug.md`)
   - Files: `docs/pages/Debug.md`
   - Typecheck after: N/A (docs-only task skips the code gate — CLAUDE.md Self-check gate)
   - **Research handed over (verified 2026-10-11).** The whole export feature was removed from the page, not just one method: `grep -niE "download|filename|ExportService|exportEncrypted" src/pages/Debug.vue` → No matches, and `grep -rn exportEncryptedJSON src/` → No matches. So Debug.md documents a feature that no longer exists. Delete by the verified heading boundaries below (headings are stable grep targets; line numbers drift — use them only as orientation).
     1. L13 Purpose bullet — delete the line `- Export complete keyboard configuration as JSON`
     2. Key Features — delete the whole `### 5. **Configuration Export**` block (starts L44) up to but NOT including `## User Interface Elements` (L50). It is the LAST numbered feature → no renumbering in this section.
     3. UI — delete the whole `#### Export Section` block (starts L93) up to but NOT including `### Data Display` (L97)
     4. L116 Component Setup — delete the line `const exportFilename = ref('debug-config.json');`
     5. Core Functionality — delete the whole `#### 4. **Export Configuration**` block (starts L186) up to but NOT including `#### 5. **Clear Data**` (L200). Contains the stale `await debugKeyboardService.exportEncryptedJSON(exportFilename.value);` call (L191).
     6. Then renumber the surviving `#### 5. **Clear Data**` heading (L200) → `#### 4. **Clear Data**`
     7. L214 Dependencies — delete the line `` - `exportEncryptedJSON()`: Configuration export ``
     8. User Workflows — delete the whole `### Export Configuration` block (starts L285) up to but NOT including `### Bulk Data Retrieval` (L291)
     9. L388 State Persistence — delete the line `- **Export Only**: Use export feature to save snapshots`
     10. L433 Known Limitations — delete the line `- Export format is encrypted (not human-readable JSON)`
     11. L440 Future Enhancements — delete the line `- Import configuration (reverse of export)`
     12. L450-451 Developer Notes — delete both lines `- Export uses encrypted format from SDK (not plain JSON)` and `- Perfect for debugging reported issues (ask user to export config)`
   - 12 edit-sites, 1 file, all deletions + one heading renumber — no prose to author. Do NOT touch `src/pages/Debug.vue` (already correct).
   - Inline-fixable defect duty applies: after deleting, check for orphaned headings, broken numbering, and any dangling export reference elsewhere in the file — clear them before handoff.

2. **Land the `serialNumber` known-limitation comments and record the resolved decision** — [high-stakes] — STATUS: DONE
   - ✓ Reviewer PASS 2026-10-11 (all 5 Done-when checks + verbatim spec match + typecheck 23=baseline, 0 in KeyboardService.ts; 0 fails) — detail in review-serialnumber-comments.md. Commit 09948ba.
   - Done when: `grep -n -B2 "serialNumber" src/services/KeyboardService.ts` shows a known-limitation comment immediately above each of the 5 sites (L133, L134, L182, L190, L191)
   - Done when: `npm run typecheck` → 23 errors, unchanged (KeyboardService.ts baseline is 0). If the count moves, STOP and report — comments must not change types.
   - Done when: `grep -n "deserves a decision" docs/sdk-reference-v2.md` → no matches
   - Done when: `grep -n "(134,138)" docs/sdk-reference-v2.md` shows `KeyboardService.ts` qualified onto that ref (backlog L30: bare cross-file refs are namespace-ambiguous)
   - Done when: `grep -ni "serialNumber" docs/pages/Connect.md` → 1 match
   - Files: `src/services/KeyboardService.ts`, `docs/pages/Connect.md`, `docs/sdk-reference-v2.md`
   - **Research handed over (all 5 sites read against source 2026-10-11).** Background: `HIDDevice.serialNumber` is `undefined` on Chromium/Windows (PO hardware check 2026-10-10; `pairedStableId` persists as `7333-5890-unknown`). The serial compares are therefore no-ops; auto-reconnect matches vendorId+productId only — with two same-model boards it can open the wrong twin. Manual connect via the browser picker is unaffected. The real serial from SDK `getBaseInfo()` is only available after open, so it cannot feed device selection. **Resolved decision (2026-10-10): do NOT drop the compares and do NOT install `@types/w3c-web-hid`** (measured net +5 tsc errors — docs/plans/archive/sprint-01-code-fixes/review-type-cleanup-4a.md §1). Keep the code as-is; document it.
   - **Design intent — never change (rule 7):** `navigator.hid!.requestDevice({ filters: [] })` at L124 stays unfiltered; both find() predicates keep their serialNumber compares verbatim; wrappers keep returning `Error`, never throwing. COMMENTS ONLY — no existing code line changes.
   - Numbered edits (current text grep-verified 2026-10-11; insert each comment as new line(s) immediately ABOVE the cited line):
     1. Above L133 (`const existingDevice = sdkDevices.find(d => d.data?.vendorId === device.vendorId && ...`), insert:
        `// KNOWN LIMITATION: HIDDevice.serialNumber is undefined on Chromium/Windows, so this serial`
        `// compare is a no-op — matching falls back to vendorId+productId. With two same-model boards`
        `// auto-reconnect can open the wrong twin. Compare kept by design; do not install`
        `// @types/w3c-web-hid (net +5 tsc errors). See docs/sdk-reference-v2.md §13.7.2.`
     2. Above L134 (``const fallbackId = device.id || `${device.vendorId}-${device.productId}-${device.serialNumber || 'unknown'}`;``), insert:
        `// serialNumber resolves to 'unknown' on Chromium/Windows, so the persisted id looks like 7333-5890-unknown.`
     3. Above L182 (first find() in `_autoConnectInternal`: ``const fallbackId = d.id || `${d.vendorId}-${d.productId}-${d.serialNumber || 'unknown'}`;``), insert:
        `// 'unknown' tail: serialNumber is undefined on Chromium/Windows (known-limitation note above).`
     4. Above L190 (`const targetSdkDevice = sdkDevices.find(d => d.data?.vendorId === targetHidDevice.vendorId && ...`), insert:
        `// KNOWN LIMITATION: serialNumber compare is a no-op on Chromium/Windows — same as requestDevice() above.`
     5. Above L191 (``const fallbackId = targetHidDevice.id || `${targetHidDevice.vendorId}-${targetHidDevice.productId}-${targetHidDevice.serialNumber || 'unknown'}`;``), insert:
        `// 'unknown' tail: serialNumber is undefined on Chromium/Windows.`
     6. `docs/pages/Connect.md` — beneath the Auto-Connect feature bullet (L13, `- **Auto-Connect**: Automatically attempts to reconnect to previously paired devices on app startup`), add one note line:
        `- Known limitation: WebHID exposes no usable serialNumber on Chromium/Windows, so auto-reconnect matches vendorId+productId only — with two same-model boards it may open the wrong one. Manual connect via the browser picker is unaffected.`
     7. `docs/sdk-reference-v2.md` L3904-3906 — the diagnostic table row's bare `Sites` cell reads `(134,138) (191,163)`. Qualify it with the filename + an as-of note; do NOT re-time the numbers (historical sprint-01 measurement; predicates are now at L133/L190, so the ~1-line drift is expected for a snapshot). Replace the cell content with:
        `KeyboardService.ts (134,138) (191,163) — as measured in sprint-01; positions have since drifted by ~1 line`
     8. `docs/sdk-reference-v2.md` L3908-3910 — replace the open-decision paragraph (`This one deserves a decision of its own, separate from the import fix: either install` / `` `@types/w3c-web-hid` (which declares `serialNumber` as `string`, matching the platform) or `` / `drop the comparison.`) with the paragraph below. The backticks in it are literal markdown — write them exactly as shown:

        **Resolved (2026-10-10, PO hardware check).** Neither option was taken. `serialNumber` is confirmed
        `undefined` on Chromium/Windows, so the compares are no-ops and auto-reconnect matches on
        vendorId+productId only; the compares are kept as-is and `@types/w3c-web-hid` was rejected
        (measured net +5 tsc errors — see docs/plans/archive/sprint-01-code-fixes/review-type-cleanup-4a.md §1).
        The limitation is documented at each call site in KeyboardService.ts and in docs/pages/Connect.md.
        Not a bug to fix — a platform limitation.
   - 8 edit-sites, 3 files, ~22 new lines authored — within single-session limits.
   - Expected post-task typecheck: **23**, unchanged; no re-baselining.

3. **Extend the `serialNumber` known-limitation comment to the two `deviceStillPresent` fallbackId blocks in KeyboardService.ts** — [high-stakes] (KeyboardService.ts is always high-stakes by the binary rule, even for comment-only; mirrors Task 2's PASSED no-[hw] call) — STATUS: IN-REVIEW
   - Checkpoint (2026-10-11): spec edit applied verbatim via ONE replace_all Edit → 2 comment insertions (KS.ts L1225-1226, L1361-1362), 4 lines added, no logic touched. All 3 Done-when checks pass (count=2; comment directly after both `deviceStillPresent` lines; typecheck 23 = baseline, 0 in KeyboardService.ts). Commit bb3760c. Review file: review-devicestillpresent-comments.md. Findings: none new. Cleanup (actual ls): `.scratch/` has pm-notes.md (PM-private, PO may delete); `_to_delete/` no visible entries — nothing to `git rm`.
   - Resolved up front (rev1 PO directive): **comment-only**. No disambiguation logic, no behavior change. Design intent untouched.
   - Done when: `grep -c "same vid/pid" src/services/KeyboardService.ts` → `2`
   - Done when: `grep -n -A1 "const deviceStillPresent" src/services/KeyboardService.ts` shows the new comment line directly after each of the 2 `const deviceStillPresent` lines
   - Done when: `npm run typecheck` → ≤ 23 (baseline unchanged; no re-baselining)
   - Files: `src/services/KeyboardService.ts` (only)
   - Verified current state (grep `deviceStillPresent` → lines 1224, 1229, 1358, 1363; both blocks read at KS.ts:1218–1231 and 1352–1365): the two blocks are byte-identical across this exact 3-line span —
     ```
                 const hidDevices = await navigator.hid!.getDevices();
                 const deviceStillPresent = hidDevices.some(d => {
                   const fallbackId = d.id || `${d.vendorId}-${d.productId}-${d.serialNumber || 'unknown'}`;
     ```
     → ONE Edit with `replace_all: true` lands both insertions identically. Do not hand-edit each block separately.
   - The edit — old_string (verbatim, current, 16-space indent inside the timeout-state-machine handler):
     ```
                 const deviceStillPresent = hidDevices.some(d => {
                   const fallbackId = d.id || `${d.vendorId}-${d.productId}-${d.serialNumber || 'unknown'}`;
     ```
     replacement (adds exactly ONE comment line before `const fallbackId`; keep the rest byte-identical):
     ```
                 const deviceStillPresent = hidDevices.some(d => {
                   // 'unknown' tail: serialNumber is undefined on Chromium/Windows; with two devices sharing
                   // the same vid/pid this match cannot tell them apart — first enumerated device wins.
                   const fallbackId = d.id || `${d.vendorId}-${d.productId}-${d.serialNumber || 'unknown'}`;
     ```
     Use the short-form convention (canonical long-form note lives at KS.ts:133 — do not repeat it).
   - 1 edit-site (replace_all → 2 insertions), 1 file, 2 new lines authored — well within single-session limits.
   - Expected post-task typecheck: **23**, unchanged.

## Findings (raw — PM routes at close)
- ~~Two more `serialNumber || 'unknown'` fallbackId sites in KeyboardService.ts (grep `deviceStillPresent`) carry no known-limitation comment~~ — **ROUTED (rev1, 2026-10-11): folded into this sprint as Task 3 per PO directive; not going to backlog.**
