# REVIEW: sdk-skill-clean (Task 1 — verify-and-trim SKILL.md)

**SPRINT GOAL:** Verify every claim in `.openclaude/skills/sdk-wrapper/SKILL.md` against current source and trim it to the tight pattern+checklist the context-hygiene rule requires (~60–80 lines, hard cap 100).
**TASK:** Task 1 — verify-and-trim `.openclaude/skills/sdk-wrapper/SKILL.md`, executed as 1a→1b→1c  ·  **TAG:** [high-stakes] (NOT [hw] — docs/skill file only, no source or hardware behaviour touched)
**DONE WHEN (full Task 1 criteria across 1a–1c):**

Task 1a — delete the two stale sections (edit-spec items 7, 8):
- `grep -n "Known pre-existing" .openclaude/skills/sdk-wrapper/SKILL.md` returns nothing
- `grep -n "self-check gate will fight" .openclaude/skills/sdk-wrapper/SKILL.md` returns nothing
- `grep -n "review-variant-p-imports" .openclaude/skills/sdk-wrapper/SKILL.md` returns nothing (dead link gone with the section)

Task 1b — −4 line-ref corrections + canonical-shape signature (items 2, 3, 4):
- `grep -n "Promise<any | Error>" …/SKILL.md` matches (canonical-shape signature corrected)
- `grep -n "Promise<Calibration | Error>" …/SKILL.md` returns nothing AND `grep -n "Calibration" …/SKILL.md` returns nothing (capital-C type gone)
- Every corrected ref present — this loop prints nothing: `for r in ":37" ":109" ":255" ":268" ":508" ":518" ":798" ":913" ":1174"; do grep -qE "$r\b" …/SKILL.md || echo "MISSING $r"; done`
- Frontmatter untouched

Task 1c — rewrite Bulk/Where-types/Never-change + tighten checklist (items 1, 5, 6, 9, 10) + whole-file gates:
- `wc -l …/SKILL.md` ≤ 100 (aim ~80) — actual: 89
- Whole-file stale-ref sweep returns nothing: `grep -nE ":15|:41\b|:113|:259|:272|:512|:802|:816" …/SKILL.md`
- `grep -nE "TS2304|Calibration" …/SKILL.md` returns nothing (1a/1b held through the rewrite)
- `grep -nE "^## " …/SKILL.md` lists NEITHER deleted section
- Kept-facts all match: `grep -n "dist/cjs/types/index.d.ts" …`, `grep -n "no \`types\` condition" …` (item 6), `grep -n "ExportService" …` (item 5)
- Item 5/6/9 positives: `grep -n "never inside KeyboardService" …` matches; `grep -ni "simplified" …` matches (SingleKeyTravel snippet marked); `for t in IDefKeyInfo DksLayoutType DksType; do grep -q "$t" …/SKILL.md || echo "MISSING $t"; done` prints nothing; `grep -n "hard rule 7" …` and `grep -n "65440" …` match
- Frontmatter untouched

Sprint-level: zero stale line-refs/claims; all still-true facts kept — including the condensed protocol-keyboard import record the backlog [types] entry depends on (package.json v1.0.6 `"types"` → nonexistent `dist/esm/index.d.ts`; exports `"."` only, no `types` condition; deep-path BLOCKED; root import untested; working decls at `dist/cjs/types/index.d.ts`; `protocol-keyboard/src/` always safe to read; `paths` remap = whole module graph).

## 📝 Worker notes & self-check
- 1a: deleted sections "Known pre-existing type errors in this file" + "The self-check gate will fight you here" (commit a931def). 1b: corrected all KeyboardService refs (−4 drift) and the canonical-shape return type to `Promise<any | Error>` (commit 0d1c501). 1c: rewrote intro/canonical prose, Bulk, Where-types, Never-change; tightened checklist; 229 → 89 lines (commit 1f47e52).
- All edits applied from the PM's grep/read-verified edit spec (items 1–10, verified at PM-open 2026-10-10); no new SDK claims introduced by the Worker — content condensed, not re-derived. Item 1 honoured: no phantom "Bulk misrepresentation" hunt; only items 5–6 fixes applied.
- Self-check vs sdk-reference-v2.md: N/A for new claims — every fact transcribed from the PM-verified spec; the §13.4/§13.7.3 pointers are kept as references, not re-asserted.
- Design intent preserved: filters:[] ☑ · usagePage 65440 ☑ · wrappers return Error ☑ (all three stated in the trimmed Never-change section)
- typecheck/build: N/A — docs-only task; self-check gate skipped per sprint checkpoint (tsc baseline 23, untouched).
- All 1a/1b/1c Done-when greps re-run after the final write: every gate passes (89 lines; both sweeps empty; all kept-fact and positive greps match; ref loop prints nothing; frontmatter byte-identical — diff hunks start at line 5).

## 🔍 Commits to review
Base: `0e0a9f0fc56d5424f65b265c2806d657033f48c4` (commit before 1a)   Head: `1f47e52f5041e93c4a3b9b83d037de0804d60c7a` (task 1c)
Cumulative diff covers 1a + 1b + 1c; the ONLY file touched is `.openclaude/skills/sdk-wrapper/SKILL.md`.
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task. Skill/docs file only; no hardware behaviour changed.

## ❓ Reviewer, please confirm
- [ ] meets every "DONE WHEN" criterion above
- [ ] diff scope matches the task (no stray files — single SKILL.md across base..head)
- [ ] no design-intent violation
- [ ] typecheck/build gate met where it applies — N/A (docs-only)
- [ ] tag is correct (high-stakes where required) — else auto-FAIL

---
## ✅ REVIEWER VERDICT
**Result:** PASS / PASS (pending hw) / FAIL  ·  **Date:** YYYY-MM-DD  ·  **Fail count:** <n>

### Failed items (FAIL only)
