# SPRINT: sprint-28-docs-pages-verify-3

**GOAL:** Bring `docs/pages/FactoryResetModal.md` fully in line with current source — fix the 4 queued drifts (cancel-btn SCSS, ok-btn SCSS, trigger-button disabled gate, stale footer date) and sweep for any remaining drift.
**DONE-CRITERIA (sprint):** Every Task-1 Done-when grep passes; doc's Template/Component-Definition/SCSS/Data-Flow/links match `src/components/FactoryResetModal.vue` + the App.vue factory-reset wiring; Reviewer PASS; PO sign-off.
**Started:** 2026-11-02  ·  **Status:** IN PROGRESS
<!-- revN (YYYY-MM-DD): <what changed>   ← log revisions here, newest last -->

## Checkpoint
- Branch: `sprint-28-docs-pages-verify-3`
- tsc baseline: 0 errors (docs/tsc-baseline.txt) — self-check gate N/A this sprint (docs-only, no .ts/.vue edits)
- Cleanup: .scratch/ has pm-notes.md (PO may delete); _to_delete/ empty — from actual ls at PM-open
<!-- Session-start check: on sprint branch (not main) + clean tree. Uncommitted changes → STOP, report.
     Do NOT record or update a commit hash here — git log is the source of truth.
     Updating a task's status REPLACES its one checkpoint line — never append a second paragraph.
     On resume, trust this checkpoint as the plan; consult only the compiler for results. -->

## ▶ RUN THIS
Next: Reviewer — "follow docs/plans/reviews/review-factoryreset-doc-drift.md" (Task 1 IN-REVIEW, base 25657b0, head = the Task-1 commit). Task 1 is the sprint's only task: on PASS → ALL TASKS DONE — awaiting PO sign-off (PM-close).

## Tasks
1. **Fix FactoryResetModal.md drifts + verify sweep** — [high-stakes] — STATUS: IN-REVIEW
   - Checkpoint (Worker 2026-11-02): 4 PM-spec'd edits applied to docs/pages/FactoryResetModal.md (cancel-btn SCSS, ok-btn SCSS+hover, isInitialized gate line, footer date); sweep vs .vue + App.vue found no further drift. Done-when greps: 0/2/1/1/1/1 — all pass. Review file: docs/plans/reviews/review-factoryreset-doc-drift.md. Cleanup (actual ls): .scratch/ has pm-notes.md (PO may delete); _to_delete/ empty.
   - Done when: `grep -c "background: transparent\|color: white\|November 26, 2025" docs/pages/FactoryResetModal.md` → 0
   - Done when: `grep -c "&:hover" docs/pages/FactoryResetModal.md` → 2
   - Done when: `grep -c "background: #444" docs/pages/FactoryResetModal.md` → 1 AND `grep -c "background: #ff6666" docs/pages/FactoryResetModal.md` → 1
   - Done when: `grep -c "isInitialized" docs/pages/FactoryResetModal.md` → 1
   - Done when: `grep -c "November 2, 2026" docs/pages/FactoryResetModal.md` → 1
   - Files: `docs/pages/FactoryResetModal.md` (ONLY file edited)
   - Research (PM-verified 2026-11-02, both sides grepped — Worker APPLIES, never re-derives):
     - Source of truth: `src/components/FactoryResetModal.vue` (146 lines; template :1-39, script :40-56, SCSS :57-146) and `src/App.vue` trigger button :167-173 (`<button class="factory-reset-btn" :disabled="!connectionStore.isInitialized" @click="showFactoryResetModal">Factory Reset</button>`).
     - Doc already VERIFIED ACCURATE (no edits): Overview/Purpose/Key Features/Modal Structure ASCII; Component Definition block (= .vue :43-54 exact); Template block (= .vue :1-39 semantically identical — real file wraps attributes per-line, doc shows them compact, keep doc convention); Props None; Emits table; SCSS `.modal-backdrop`/`.modal-content`/`.modal-title` excerpts (= .vue :58-75 exact); Design Choices ("Subdued cancel button" still valid: #444 vs #ff4444); Usage in App.vue Rendering (doc :171-177 = App.vue :271-274 exact) + Control Methods (doc :180-192 = App.vue :559-567); Data Flow modal-side branches; Accessibility sections; Related links (GlobalFeatures.md exists; sdk-reference-v2.md:569 heading `### \`factoryDataReset\`` → anchor `#factorydatareset` valid).
     - Edit 1 — doc :150-153, replace the `.cancel-btn` block. Current text:
~~~
.cancel-btn {
  background: transparent;
  border: 1px solid #666;
}
~~~
       Replacement (real = .vue :129-136 — copy verbatim, 2-space indent):
~~~
.cancel-btn {
  background: #444;
  color: #fff;

  &:hover {
    background: #555;
  }
}
~~~
     - Edit 2 — doc :155-158, replace the `.ok-btn` block (KEEP the doc's annotation comment). Current text:
~~~
.ok-btn {
  background: #ff4444;  // Red for destructive action
  color: white;
}
~~~
       Replacement (real = .vue :138-145 — copy verbatim, 2-space indent):
~~~
.ok-btn {
  background: #ff4444;  // Red for destructive action
  color: #fff;

  &:hover {
    background: #ff6666;
  }
}
~~~
     - Edit 3 — doc :197 (Data Flow first line inside the code fence):
       current: `Factory Reset button clicked`
       replacement: `Factory Reset button clicked (button disabled unless connectionStore.isInitialized)`
     - Edit 4 — doc :255 footer:
       current: `*Last Updated: November 26, 2025*`
       replacement: `*Last Updated: November 2, 2026*`
     - Edit 5 (sweep): after edits 1-4, re-scan the whole doc vs the two source files for any drift the PM missed; fix inline per QA tiers (docs task skips the typecheck gate but hands off defect-free). The SCSS section is intentionally ABRIDGED (omits `.modal-message`/`.modal-list`/`.modal-warning`/`.modal-buttons`/the shared `.cancel-btn, .ok-btn` base rule) — abridgement is the doc convention, do NOT expand it; only wrong VALUES are drift.
   - After work + self-check (the Done-when greps above): set IN-REVIEW; create `docs/plans/reviews/review-docs-pages-verify-3.md` from `docs/plans/templates/review-template.md`, beginning with the sprint goal (one line) + this task's Done-when criteria, then Base/Head commit hashes. Not a [hw] task — no Hardware check section needed.
   - Commit message: `sprint-28: fix FactoryResetModal.md drifts`

<!-- STATUS values:
     PENDING → IN-PROGRESS → (DONE | IN-REVIEW → DONE)
     high-stakes:  IN-REVIEW → DONE (PASS) | → IN-PROGRESS (FAIL)
     Collapse a finished task to one line:  ✓ 1. <title> — DONE (YYYY-MM-DD) -->

## Findings (raw — PM routes at close)
- <none yet>

<!-- Keep this file under ~150 lines. It is a SNAPSHOT, not a log. Overwrite, don't append. -->

<!-- ===== PM-CLOSE CHECKLIST (ordered; one close commit; verify each file at the end) =====
     1. Verify sprint complete: all tasks DONE + criteria met.
     2. Route Findings → backlog (one line + pointer each; defect + where-to-verify; no duplicated detail).
     3. Snapshot this file → docs/plans/archive/sprint-28-docs-pages-verify-3/sprint.md (header: goal, dates, task count, signed-off-by PO).
     4. git mv this sprint's review files into docs/plans/archive/sprint-28-docs-pages-verify-3/.
     5. UPDATE every backlog/other pointer that referenced those reviews → the new archive path.
     6. Add the index line to docs/plans/index.md (status = signed off).
     7. RESET this (LIVE) file to the IDLE stub below — not the archive copy.
     8. Commit all together; report. PO merges + deletes the branch.
     Sprint-specific at close: REMOVE the queued Document-issues entry for FactoryResetModal.md
     (backlog.md line ~53, "4 small verified drifts") — consumed by this sprint; and UPDATE the
     docs-pages-verify PROGRESS line (~41): sprint-28 = FactoryResetModal — CLOSED (archive path),
     next candidates now GlobalTravel/SwitchProfiles/SingleKeyTravel. Item STAYS in backlog.
     Verify: archive sprint.md = full snapshot; current-sprint.md = IDLE stub (verbatim from the
     template's IDLE section); backlog pointers repointed.
     ================================================================================= -->

