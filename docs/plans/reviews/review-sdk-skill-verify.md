# REVIEW: sdk-skill-verify (Task 1 — re-verify & correct SKILL.md, sub-tasks 1a+1b)

**SPRINT GOAL:** Re-verify `.openclaude/skills/sdk-wrapper/SKILL.md` against the current `src/services/KeyboardService.ts` (and its cited companions) and correct every drifted claim — the skill was last source-verified in sprint-04 and the code has moved on.
**TASK:** Task 1 — Re-verify and correct SKILL.md (1a: Canonical shape + Known deviations; 1b: Bulk ops + Where types come from)  ·  **TAG:** [high-stakes] (not [hw] — docs-only)
**DONE WHEN:**

1a (commit `d509dae`):
- `grep -n ":798\|:518\|:913\|:1174\|\`:508\`\|\`:109\`\|\`:255\`\|\`:268\`\|decl \`:11\`\|(\`:37\`)\|Promise<any | Error>\|connectedDevice) return new Error" .openclaude/skills/sdk-wrapper/SKILL.md` → **no output**
- `grep -c "KeyboardService.ts:926" .openclaude/skills/sdk-wrapper/SKILL.md` → **1**
- `grep -c "Promise<null | Error>" .openclaude/skills/sdk-wrapper/SKILL.md` → **≥1**
- `grep -n "\`:579\`\|\`:172\`\|\`:326\`\|\`:339\`\|decl \`:74\`\|(\`:100\`)" .openclaude/skills/sdk-wrapper/SKILL.md` → **≥6 hits**

1b (commit `46a925b`):
- `grep -n "at \`:6\`\|useBatchProcessing.ts:5\|\`:12\`)\|, \`:21\`\|SingleKeyTravel.vue:164\|SingleKeyTravel.vue:160\|(13 ln)" .openclaude/skills/sdk-wrapper/SKILL.md` → **no output**
- `grep -n "at \`:24\`\|useBatchProcessing.ts:3\|\`:10\`\|\`:19\`\|SingleKeyTravel.vue:223\|SingleKeyTravel.vue:219\|(17 ln)\|Refs source-verified" .openclaude/skills/sdk-wrapper/SKILL.md` → **≥8 hits**
- `wc -l .openclaude/skills/sdk-wrapper/SKILL.md` → **≤100**
- `git diff --name-only 04ea632..HEAD` → only `.openclaude/skills/sdk-wrapper/SKILL.md` + `docs/plans/*` (no source files)
- Handoff clean of inline-fixable defects (typos, dead refs, self-created inconsistencies); typecheck gate skipped (docs-only, no `.ts`/`.vue` edits)

Reviewer additionally (per Task 2 in current-sprint.md): re-run every Done-when command above **and** spot-check at least five of the corrected refs against source (e.g. `grep -n "async calibrationStart" src/services/KeyboardService.ts` → 926).

## 📝 Worker notes & self-check
- 1a (prior session, `d509dae`): edits 1–6 applied per spec + 2 gate-required inline fixes the edit list missed (`(`:37`)`→`(`:100`)` in Never-change §; one-line→braced guard in checklist §). All five 1a Done-when commands passed.
- 1b (this session, `46a925b`): edits 7–15 applied verbatim from the spec's grep-verified edit list — no deviations, no extra edits. All four 1b Done-when commands passed (DW1 empty; DW2 = 8 hits; `wc -l` = 96; diff = SKILL.md + docs/plans/* only).
- Self-check vs sdk-reference-v2.md: every corrected value came from the PM's grep-confirmed spec (banked in `.scratch/pm-notes.md`); Worker applied without re-deriving per PM-open handover rule. SKILL.md's §10.1/§10.4/§13.1/§13.4/§13.7 citations were re-verified by the PM this sprint.
- Design intent preserved (untouched, still documented in SKILL.md): filters:[] ☑ · usagePage 65440 ☑ · wrappers return Error ☑ — no source file modified.
- typecheck/build: N/A — docs-only task; self-check gate skipped per spec (no `.ts`/`.vue` edits).

## 🔍 Commits to review
Base: `04ea632` (branch point)   Head: `46a925b` (task 1b SKILL.md edits)
Note: the handoff mechanics (this review file + current-sprint.md status/checkpoint) land in the commit immediately after `46a925b`; review range is `04ea632..HEAD` of the branch (per Task 2), which covers 1a (`d509dae`) + 1b (`46a925b`) + handoff.
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat 04ea632..HEAD     then      git diff 04ea632..HEAD
     A file touched outside this task's scope is a flag. -->
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task; docs-only, nothing device-affecting.

## ❓ Reviewer, please confirm
- [x] meets every "DONE WHEN" criterion above (1a and 1b) — all 8 commands re-run, all pass (1aDW1/1bDW1 empty; 1aDW2=1; 1aDW3=1; 1aDW4=6; 1bDW2=8; wc -l=96 ≤100)
- [x] diff scope matches the task (only SKILL.md + docs/plans/* — no source files; `git diff --name-only 04ea632..HEAD` confirms)
- [x] no design-intent violation (filters:[], usagePage 65440, return-Error all still documented, unchanged)
- [x] typecheck/build gate met where it applies — N/A here (docs-only)
- [x] tag is correct (high-stakes where required) — docs-only re-verify, correctly [high-stakes], not [hw]
- [x] ≥5 corrected refs spot-checked against source — 15+ checked, all exact (see Findings below)

---
## ✅ REVIEWER VERDICT
<!-- After ONE verification pass, RULE. Don't keep investigating. A runtime/behavior question goes
     to the PO hardware check, not more static analysis. Output = PASS/FAIL + findings + your own
     Findings one-liners (into current-sprint.md). Do NOT plan task order/parallelism. -->
**Result:** PASS  ·  **Date:** 2026-10-24  ·  **Fail count:** 0

All 8 Done-when commands re-run and pass. Diff scope clean: SKILL.md + docs/plans/* only, no source files. SKILL.md = 96 lines (≤100). Design intent intact. Tag correct ([high-stakes], docs-only, not [hw]).

Refs spot-checked against source (all exact):
- KeyboardService.ts: calibrationStart :926 (sig `Promise<null | Error>`, snippet :926–938 VERBATIM), getMacro :589 (`MacroSlotInfo | Error`), setPollingRate :1348 (`number | Error`), setLighting :1042 (`DataView | DataView[] | null | Error`), connectedDevice decl :74 (`Device | PairedDevice | null`), ensureKeyboard :100, setKey :579 (`void | Error`; deviation "bare `return;`, no result check" TRUE), getDevices :172 (deviation "returns `[]` in catch, no guard" TRUE), initializeKeyboard :326 / _initializeKeyboardInternal :339 / maxRetries=2 :341 ("retries ≤ 2" TRUE), MacroSlotInfo export interface :44, usagePage:[65440] :104, filters:[] :187; `Promise<any | Error>` = 0 hits (skill's "zero hits" TRUE); wc -l = 1605 (header "(1605 ln)" TRUE).
- ExportService.ts: class :23, `private processBatches = useBatchProcessing().processBatches` :24.
- useBatchProcessing.ts (25 ln): processBatches :3–:22, isObjectArray check :10, keyIds map :12, batch loop :19–:20 (80/100ms) — all match skill text.
- SingleKeyTravel.vue: travelChanged :215 / deadChanged :216 / `physicalKeyValue || keyValue` :219 / processBatches call :223 / setPerformanceMode :224 — all match.
- src/types/types.ts (17 ln): `import type` DksLayoutType/DksType :5, IDefKeyInfo :7, re-export :9, `Omit<SdkIDefKeyInfo, 'location'>` :13 — 17-line re-export story in skill §"Where types come from" item 3 TRUE.

### Findings (non-defect observations, routed to current-sprint.md ## Findings)
- F1 (out of scope, pre-existing): SKILL.md line 47 routes out-of-scope bugs to `docs/plans/backlog.md` directly; CLAUDE.md rule 8 routes Findings to current-sprint.md `## Findings` (PM owns backlog). Pre-existing text (untouched by 1a/1b — diff context confirms), not a self-created defect → PASS stands; PM may align the wording at next touchpoint.
