# REVIEW: sdk-ref-configs-fix

**SPRINT GOAL:** sdk-reference-v2.md §13.7 states the verified truth about `configs` reachability and carries the current repo state.
**TASK:** Correct §13.7.4 `configs` reachability claims  ·  **TAG:** [high-stakes]
**DONE WHEN:**
- §13.7.4 contains none of the strings "never invoked on this code path", "simply does not happen in the SDK", "pure type-formality with no runtime consequence" (grep gate).
- Corrected text names the devices()→requestDevice zero-match fallback chain and cites sprint-01 review §R2 as the source; design-intent warning (unfiltered selection, no hard-coded IDs, superseded SDK_REFERENCE.md caveat) survives.
- Verification status row §13.7 (sdk-reference-v2.md:179) notes the sprint-03 correction.

## 📝 Worker notes & self-check
- Replaced the wrong "This note is now closed" paragraph (§13.7.4, formerly lines 4012–4031) with a corrected note: states the earlier conclusion was wrong (corrected 2026-10-10, sprint-03, per review §R2), gives the verified chain as a code block (KeyboardService.getDevices() at src/services/KeyboardService.ts:109 → XDKeyboard.getDevices() → hid devices() → zero-match fallback → hid internal requestDevice() → navigator.hid.requestDevice({filters: this.configs})), and states `configs` DOES reach a `filters` argument — only on the zero-match fallback, with `configs: []` in this repo (KeyboardService.ts:42, DebugKeyboardService.ts:15), so the prompt is unfiltered, matching KeyboardService.requestDevice()'s `filters: []` (KeyboardService.ts:124). Design-intent sentences and the superseded SDK_REFERENCE.md vendorId 7331/productId 1793 caveat kept verbatim; added that a filtering `configs` value would violate design intent. Cross-references §1's getDevices "May prompt" row.
- Fixed the "Net:" paragraph (formerly 4042–4046): clause (b) now says `configs` is NOT a pure type-formality — its value is reachable via hid's internal zero-match fallback; `configs: []` is both type-correct and intent-preserving. Clause (a) (`usagePage` → `[65440]`) untouched.
- §13.7 verification status row (line 179) updated to the exact text prescribed in the plan's Task 1 edit 3 (4th column now `sprint-03`). Note for the Reviewer: that row text also mentions the preamble/Site 1/§13.7.3 banner-notes, which land in Task 2 — this is per the plan (Task 2's note: "the status-row mention of these banners is already added in Task 1 edit 3 — do not duplicate"), so the row is intentionally forward-referencing until Task 2 completes.
- Self-check vs sdk-reference-v2.md: grep gate — all 3 forbidden strings: 0 occurrences. Surviving content verified: "vendorId: 7331" caveat present (line ~4046), "against hard-coding" design-intent sentence present, §R2 citation present (line ~4013), §1 cross-ref present (line ~4037, "May prompt" row at line 231 unchanged). Bundle facts re-confirmed this session by count-only grep of hid/dist/esm/index.js: `filters:this.configs` 1×, zero-match `requestDevice()` fallback 1×. Line refs re-confirmed: KeyboardService.ts:42/109/119/124, DebugKeyboardService.ts:15.
- Design intent preserved: filters:[] ☑ · usagePage 65440 ☑ · wrappers return Error ☑ (docs-only; no code touched — corrected text explicitly affirms unfiltered selection)
- typecheck/build: N/A — docs-only task, no .ts/.vue touched; baseline stays 23 (docs/tsc-baseline.txt unchanged).
- Cleanup (actual ls): `.scratch/` empty, `_to_delete/` empty — no cleanup needed.

## 🔍 Commits to review
Base: `956548c` (PM-open)   Head: `a3ee408` (this task)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat 956548c..a3ee408     then      git diff 956548c..a3ee408
     A file touched outside this task's scope is a flag. Only docs/sdk-reference-v2.md should appear. -->

## 🖥️ Hardware check ([hw] tasks only)
N/A — docs-only task, not tagged [hw].

## ❓ Reviewer, please confirm
- [x] meets every "DONE WHEN" criterion above
- [x] diff scope matches the task (no stray files — only docs/sdk-reference-v2.md + handoff artifacts)
- [x] no design-intent violation
- [x] typecheck/build gate met where it applies — N/A (docs-only; baseline unchanged at 23)
- [x] tag is correct (high-stakes where required) — else auto-FAIL

---
## ✅ REVIEWER VERDICT
<!-- After ONE verification pass, RULE. Don't keep investigating. A runtime/behavior question goes
     to the PO hardware check, not more static analysis. Output = PASS/FAIL + findings + your own
     Findings one-liners (into current-sprint.md). Do NOT plan task order/parallelism. -->
**Result:** PASS  ·  **Date:** 2026-10-10  ·  **Fail count:** 0

### Evidence (all re-run independently this session)
- **Grep gate:** all 3 forbidden strings → 0 occurrences in docs/sdk-reference-v2.md ✓
- **Surviving content:** "vendorId: 7331" caveat 1×, "against hard-coding" design-intent sentence present (:4043), §R2 citation 2×, "May prompt" cross-ref 2× (incl. §1 row :231) ✓
- **Bundle facts (spot-check prescribed by plan):** `filters:this.configs` 1× and zero-match fallback `if(0===e.length){try{await this.requestDevice()}` 1× in node_modules/@sparklinkplayjoy/hid/dist/esm/index.js ✓; `this.configs=e` assignment 1× ✓
- **R2 citation real:** review-variant-p-imports.md:85 §R2; doc's chain matches R2's chain (the doc's current line refs :42/:109/:124/:15 are correct against current source — R2's older :136/:193 predate sprint-01 edits; Worker cited current source, correct call) ✓
- **Status row :179** notes the sprint-03 correction, matching the plan's edit-3 text; forward-reference to Task 2's banner-notes is per plan (current-sprint.md:43) ✓
- **Scope:** git diff 956548c..931b972 touches only docs/sdk-reference-v2.md + current-sprint.md + this review file ✓

### Findings (non-blocking)
1. Review file's Head hash says `a3ee408`, but the IN-REVIEW handoff artifacts landed in a second commit `931b972` (which also made a small wording tweak to the §13.7 status row). Reviewed the full range 956548c..931b972 instead — both commits are within Task 1's scope and message convention. No action needed; noted for the record.
2. **RETRACTED — Reviewer misquote.** An earlier draft finding claimed a garbled sentence ("it the type-correct") near :4048. Verified against the file: grep for that string → 0 matches. Both delivered sentences read cleanly — :4044 "`[]` is both the type-correct and the intent-preserving choice" and :4062–4064 "`configs: []` is both the minimal type-correct change and the intent-preserving one". The PO initially ruled FAIL on this bad evidence; on re-verification the PO confirmed PASS. No defect in the delivered text.
3. **PO policy point (for PM):** a text defect in the ground-truth reference (docs/sdk-reference-v2.md) is a blocking FAIL item, not a deferrable inline fix — the QA-tiers "Worker MAY fix inline" rule applies only during the Worker's own session, and a PASS leaves no mechanism to fix it afterward.

### Failed items (FAIL only)
None — PASS.
