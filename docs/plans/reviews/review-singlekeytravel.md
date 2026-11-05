# REVIEW: singlekeytravel-docs-drift (Task 1a–1d, cumulative)

**SPRINT GOAL:** SingleKeyTravel.md matches the current SingleKeyTravel.vue — fix all PM-verified drift (phantom baseLayout prop + binding, dead update-overlay emit, wrong event payloads, phantom 300ms/null overlay flow, stale code snippets, overlay-scope claims, re-click matrix row).
**TASK:** Task 1 — Fix SingleKeyTravel.md drift (24 edits, docs-only), sub-tasks 1a→1b→1c→1d  ·  **TAG:** [high-stakes] (no [hw] — docs-only sprint)
**DONE WHEN:** (all four sub-task criterion sets, copied from current-sprint.md; Reviewer re-runs each against final HEAD `8e2d320`)

1a. Props/Emits/Features/Data-Flow:
- `grep -n "baseLayout: any\|refresh: true\|emit null\|300ms\|newMode: 'single' }\|Auto-refreshes when selection" docs/pages/SingleKeyTravel.md` returns nothing
- `grep -c "NEVER emitted" docs/pages/SingleKeyTravel.md` ≥ 1

1b. updateSingleKeyAll snippet → verbatim source:
- `grep -c "const keyIds = keys.map\|processBatches(keyIds" docs/pages/SingleKeyTravel.md` = 2 (one each)
  - **Final-state observation: = 3** (lines 281, 283 from 1b's snippet + line 504 from 1c's Update Failures snippet, which legitimately uses `processBatches(keyIds,` too). The "=2" was a snapshot at 1b's commit, before 1c landed.
- `grep -c "processBatches(keys," docs/pages/SingleKeyTravel.md` = 1 (Update Failures snippet — fixed in 1c)
  - **Final-state observation: = 0.** The plan's own annotation says this leftover is "fixed in 1c" — 1c zeroed it, as designed.

1c. Update Failures + watcher params + load-catch snippets:
- `grep -n "processBatches(keys,\|Silent failure\|Fall through to default\|(newVal, oldVal)\|async (newKeys)" docs/pages/SingleKeyTravel.md` returns nothing
- `grep -c "console.error" docs/pages/SingleKeyTravel.md` ≥ 2 (observed: 3)

1d. Workflows/matrix/binding/Event-Flow/overlay scope:
- `grep -n "baseLayout\|base-layout\|refresh-overlays\|for each selected key\|deep watch doesn't detect change" docs/pages/SingleKeyTravel.md` returns nothing
- `grep -c '@mode-changed="handleModeChange"' docs/pages/SingleKeyTravel.md` ≥ 1 (observed: 1)
- `wc -l docs/pages/SingleKeyTravel.md` in 590–650 (observed: 620)

Note for the Reviewer: the two 1b criteria above are per-sub-task snapshots that later sub-tasks intentionally change (sequential 1a→1b→1c→1d, one cumulative review). Judge them at final HEAD with the observations noted; both divergences match the plan's own "fixed in 1c" annotations, not a defect. Also `grep -c "every single-mode key with fetched data"` = 2 by design (1a edit 7 and 1d edit 3 each author one occurrence with distinct surrounding text).

## 📝 Worker notes & self-check
- 24 spec edits applied verbatim across 1a (10), 1b (snippet replacement), 1c (6), 1d (7); docs/pages/SingleKeyTravel.md is the only file changed (plus current-sprint.md checkpoints — expected Worker mechanics, not scope drift).
- 1b snippet and 1d binding block copied verbatim from source: `updateSingleKeyAll` from src/components/performance/SingleKeyTravel.vue (dedent-4); `<SingleKeyTravel …>` binding grepped from src/components/performance/KeyTravel.vue (no `:base-layout`, no `@refresh-overlays`, `@mode-changed="handleModeChange"` present).
- All Done-when commands re-run on final state: 1a D1 exit 1 (nothing) · 1a D2 =1 · 1b D1 =3 / D2 =0 (snapshot-superseded, see above) · 1c D1 exit 1 (nothing) / D2 =3 · 1d D1 exit 1 (nothing) / D2 =1, wc =620.
- Self-check vs sdk-reference-v2.md: N/A — this task documents a Vue component's props/emits/workflows against its own source; no SDK claim is asserted or changed.
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (untouched) — docs-only, no src edits.
- typecheck/build: N/A — docs-only; self-check gate skipped per plan (no .ts/.vue changes).
- Cleanup (actual `ls`): `.scratch/` = pm-notes.md only (PM's private notes; PO may delete); `_to_delete/` = empty, nothing to git rm.

## 🔍 Commits to review
Base: `d5ce52c` (PM-open — commit BEFORE 1a)   Head: `8e2d320` (Task 1d)
Cumulative commits in range: `74bea7a` (1a) → `ba247bc` (1a ckpt) → `2afbca1` (1b) → `61f9e4f` (1c) → `344bc19` (1c ckpt) → `8e2d320` (1d). Reviewer runs `git diff --stat d5ce52c..8e2d320` then `git diff d5ce52c..8e2d320` — expect only docs/pages/SingleKeyTravel.md + docs/plans/current-sprint.md.
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task; docs-only sprint, no hardware behavior changed.

## ⚖️ Reviewer findings
<!-- F1..Fn blocks or "No defects found". Every quote/line-ref grep-verified before surfacing. -->

## ✅ VERDICT
<!-- PASS (→DONE) / FAIL (→IN-PROGRESS + "fix ONLY these" checklist into ▶ RUN THIS). Never edits source. -->
