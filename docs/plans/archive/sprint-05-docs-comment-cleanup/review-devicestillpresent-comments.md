# REVIEW: devicestillpresent-comments

**SPRINT GOAL:** Clear the verified low-hanging backlog items that need no design decisions — purge the removed export feature from docs/pages/Debug.md, land the `serialNumber` known-limitation comments (which also records the resolved sdk-reference decision and qualifies its one bare cross-file ref), and (rev1) extend that comment coverage to the two `deviceStillPresent` fallbackId sites flagged in Findings.
**TASK:** Extend the `serialNumber` known-limitation comment to the two `deviceStillPresent` fallbackId blocks (rev1, from Findings)  ·  **TAG:** [high-stakes] (KeyboardService rule) — comment-only, no [hw]
**DONE WHEN:**
- `grep -c "same vid/pid" src/services/KeyboardService.ts` returns **2** (was 0) — the known-limitation comment is added once per fallbackId block.
- The comment appears immediately after `const deviceStillPresent = hidDevices.some(d => {` in both blocks (currently ~L1224 and ~L1358; line numbers drift with Task 2's insertions — grep, don't trust numbers).
- `npm run typecheck` → **23 errors = baseline 23** (docs/tsc-baseline.txt), with **0** in KeyboardService.ts. Comment-only; baseline must not change.

## 📝 Worker notes & self-check
- One Edit with replace_all=true on the two-line anchor (`deviceStillPresent` line + `fallbackId` line), inserting the spec'd 2-line comment verbatim → exactly 2 insertions (L1224, L1360 after Task 2 drift), 4 lines added, no logic touched.
- Comment text matches the spec verbatim (mirrors the Task 2 comment family: 'unknown' tail / undefined on Chromium/Windows / same vid/pid match can't distinguish / first enumerated device wins).
- Self-check vs sdk-reference-v2.md: no SDK claim — comment content was authored and resolved in Task 2's review (the `serialNumber` undefined-on-Windows finding); this task only propagates it to the two Findings-flagged sites.
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (untouched)
- typecheck/build: 23 errors = baseline 23, 0 in KeyboardService.ts ✓ (`grep -c "error TS"` → 23; `grep -c "KeyboardService"` → 0). Build not run — comment-only change cannot affect it.
- Cleanup (from actual `ls`): `.scratch/` has pm-notes.md (PM-private, PO may delete); `_to_delete/` shows no visible entries — nothing for PO to `git rm`.

## 🔍 Commits to review
Base: `13ceb4e` (rev1 commit — Task 3 seeded into sprint)   Head: `bb3760c` (this task)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat 13ceb4e..bb3760c     then      git diff 13ceb4e..bb3760c
     A file touched outside this task's scope is a flag. -->
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task. Comment-only; zero behavior change, nothing to exercise on a device.

## ❓ Reviewer, please confirm
- [x] meets every "DONE WHEN" criterion above
- [x] diff scope matches the task (only KeyboardService.ts + this review file + current-sprint.md checkpoint)
- [x] no design-intent violation (fallbackId compare unchanged; both blocks still identical)
- [x] typecheck gate met (23 = baseline 23, 0 in KeyboardService.ts)
- [x] tag is correct ([high-stakes] per the always-high-stakes KeyboardService rule)

---
## ✅ REVIEWER VERDICT
<!-- After ONE verification pass, RULE. Don't keep investigating. A runtime/behavior question goes
     to the PO hardware check, not more static analysis. Output = PASS/FAIL + findings + your own
     Findings one-liners (into current-sprint.md). Do NOT plan task order/parallelism. -->
**Result:** PASS  ·  **Date:** 2026-10-11  ·  **Fail count:** 0

### Failed items (FAIL only)
None.

### Reviewer verification (re-ran independently, not trusting Worker notes)
- `git diff --stat 13ceb4e..bb3760c` → KeyboardService.ts only, +4/−0. Full range to HEAD adds only this review file + the sprint checkpoint — no out-of-scope file touched.
- Diff body: the 2-line comment inserted identically after both `const deviceStillPresent = hidDevices.some(d => {` lines (post-edit L1224→1225, L1360→1361); text matches the plan's replacement verbatim (short-form convention; canonical long note at KS.ts:133 not duplicated). `fallbackId` expression and compare untouched; blocks still byte-identical.
- Done-when 1: `grep -c "same vid/pid" src/services/KeyboardService.ts` → 2 ✓
- Done-when 2: `grep -n -A1 "const deviceStillPresent"` → comment directly after both lines ✓
- Done-when 3: `npm run typecheck` → 23 errors = baseline 23 (docs/tsc-baseline.txt); 0 in KeyboardService.ts ✓
- Design intent (rule 7): filters:[] untouched, usagePage 65440 untouched, wrappers still return Error — comment-only, zero behavior change ✓
- Tag: [high-stakes] correct (KeyboardService binary rule); no [hw] needed — nothing to exercise on a device ✓

### Reviewer Findings
None — all known `serialNumber || 'unknown'` fallbackId sites in KeyboardService.ts are now covered (5 from Task 2 + these 2); grep `serialNumber` / `deviceStillPresent` to verify.
