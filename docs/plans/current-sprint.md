# SPRINT: sprint-04-sdk-skill-clean

**GOAL:** Verify every claim in `.openclaude/skills/sdk-wrapper/SKILL.md` against current source and trim it to the tight pattern+checklist the context-hygiene rule requires (~60–80 lines, hard cap 100).
**DONE-CRITERIA (sprint):** SKILL.md ≤ 100 lines, zero stale line-refs/claims, both task-specific sections deleted, all still-true facts kept (incl. the protocol-keyboard import record the backlog [types] entry depends on).
**Started:** 2026-10-10  ·  **Status:** ALL TASKS DONE — awaiting PO sign-off
rev1 (2026-10-10): split Task 1 into sequential 1a→1b→1c — the whole-file rewrite stalled as a single generation. Edit-spec items 1–10 preserved VERBATIM (no re-verification); only regrouped + per-subtask Done-when greps added. ▶ RUN THIS seeded at 1a.

## Checkpoint
- Branch: `sprint-04-sdk-skill-clean`
- tsc baseline: 23 errors (docs/tsc-baseline.txt) — docs-only sprint, gate skipped
- Cleanup: .scratch/ has pm-notes.md (PO may delete); _to_delete/ empty — from actual `ls` at PM-open
- PM-open (2026-10-10): plan written from backlog item; item removed from backlog.md; all claims below grep/read-verified this session
- Reviewer re-check (2026-10-11): Round 1 F1/F2 both ✓ (SKILL.md:76 `:8`/`:12` matches grep on DebugKeyboardService.ts; review-file line-39 scope claim now accurate) → **Task 1 PASS → DONE**. Verdict in review file. Cleanup: .scratch/ has pm-notes.md (PO may delete); _to_delete/ only .gitkeep — from actual `ls`.

## ▶ RUN THIS
Next: **PO** — ALL TASKS DONE — awaiting PO sign-off. Task 1 PASSed Round 1 re-check (2026-10-11; F1/F2 verified ✓ — see review-sdk-skill-clean.md verdict). On sign-off: run PM-close ("Act as PM per CLAUDE.md. All tasks DONE; assemble work + QA verdicts vs the goal for my sign-off; on acceptance archive, on rejection revise."). On rejection: revise per the Sprint feedback loop.

Reviewer Findings (NOT fix items — PM routes at close): §RF1 PM edit-spec item 2 falsely blessed `:7`/`:11` as "EXACT"; §RF2 bare `:NNN` refs namespace-ambiguous on line 76. Both also in the Findings section below and in the review file's Reviewer Findings section.

## Tasks

**Task 1 — verify-and-trim `.openclaude/skills/sdk-wrapper/SKILL.md`** — [high-stakes] — STATUS: ✓ DONE (1a ✓ 1b ✓ 1c ✓; Reviewer FAIL 2026-10-10 → fix-round F1/F2 → Round 1 re-check PASS 2026-10-11; SKILL.md 89 lines ≤ 100, all Done-when greps pass — see review-sdk-skill-clean.md)
Split into 1a→1b→1c (sequential; each its own commit + recovery point). Single file for all three: `.openclaude/skills/sdk-wrapper/SKILL.md` (docs task → no typecheck gate; self-check = the Done-when greps). One Reviewer pass after 1c covers the cumulative base..head diff.

### Edit spec — items 1–10 (verified 2026-10-10 — APPLY, do NOT re-derive or re-read source)
1. **Backlog claim (a) is mostly FALSE** — the Bulk section already puts batching in the composable correctly. Do not hunt a phantom "misrepresentation." Real fixes are items 5–6 below only.
2. **Line drift is uniform −4 in KeyboardService.ts** (file now 1417 lines). Correct refs: connectedDevice decl `:11`; ensureKeyboard `:37`; getDevices `:109`; initializeKeyboard `:255`; _initializeKeyboardInternal `:268` (sig `retryCount: number = 0`, `maxRetries = 2`); setKey `:508`; calibrationStart `:798`; calibrationEnd `:812`. DebugKeyboardService refs `:7`/`:11` and SingleKeyTravel `:160`/`:164` are EXACT — keep as-is.
3. **Canonical-shape example is stale in signature**: real calibrationStart is `Promise<any | Error>`, NOT `Promise<Calibration | Error>`. Re-source the block: present it as "the pattern (cf. calibrationStart at :798)", showing either the real `Promise<any | Error>` form or generic `Promise<T | Error>`. Keep the note that getMacro `:518`, setLighting `:913`, setPollingRate `:1174` are `any | Error` and a real type is preferred where sourceable. Keep the 4 rules + try/catch rationale + ensureKeyboard code block (body verified identical; fix ref `:41`→`:37`).
4. **Known deviations table: behaviorally accurate, fix refs only** (setKey `:508`, getDevices `:109`, initializeKeyboard `:255`, internal `:268`). Keep "do not silently normalise" + CLAUDE.md §8 pointer.
5. **Bulk section**: change framing "component/page layer, not in KeyboardService" → "the caller (page/component/service) — never inside KeyboardService"; add that `ExportService.ts` is a service-layer consumer (`private processBatches = useBatchProcessing().processBatches;` at its `:6`). Signature block + bullets (:5, :12, :21-22, 80/100ms, Promise<void>, no per-key error collection) all verified accurate — keep. Mark the SingleKeyTravel snippet as **simplified** (real :164 callback wraps setSingleTravel/setDp/setDr in travelChanged/deadChanged conditionals; setPerformanceMode unconditional). Keep the `physicalKeyValue?`-optional gotcha (types.ts still optional).
6. **Where types come from**: update — `src/types/types.ts` (13 lines) now exports **three** types: `IDefKeyInfo`, `DksLayoutType`, `DksType`; header comment says it mirrors `@sparklinkplayjoy/sdk-keyboard dist/cjs/src/types/type.d.ts` verbatim (say that, not "duplicates protocol-keyboard's IDefKeyInfo"). Then KEEP the protocol-keyboard import record condensed (backlog [types] entry depends on it — do not delete): package.json v1.0.6 `"types"` → **nonexistent** `dist/esm/index.d.ts`; exports "." = import/esm + require/cjs with **no `types` condition**; deep-path import **BLOCKED** by exports map; root import **untested** (verify with one typecheck before relying); 30 `.d.ts` files ship; working declarations at `dist/cjs/types/index.d.ts` (re-exports `./src/types/interface` + `constantsParam`); `protocol-keyboard/src/` readable TS (param.ts 88 lines, interface.ts 183) — always safe to read for semantics/enum values; a `paths` remap affects the whole module graph (variant-P precedent).
7. **DELETE section "Known pre-existing type errors in this file"** entirely — fully stale: typecheck now reports 23 errors, ZERO in KeyboardService.ts, ZERO TS2304 (Calibration errors resolved by sprint-01 Tasks 4a/4b; baseline 60→36→23).
8. **DELETE section "The self-check gate will fight you here"** entirely — task-specific mechanics don't belong in a skill (CLAUDE.md context-hygiene), and it holds a dead link (`docs/plans/reviews/review-variant-p-imports.md` now lives in `docs/plans/archive/sprint-01-code-fixes/`).
9. **"Never change (design intent)"**: replace the verbatim CLAUDE.md §7 duplication with ~3 lines: pointer to CLAUDE.md hard rule 7 + keep the two skill-specific facts: `usagePage: [65440]` lives in `ensureKeyboard` (`:37`), never in `requestDevice`; DebugKeyboardService holds its own XDKeyboard (`:7`/`:11`) — don't unify.
10. **Checklist**: keep, tighten wording; items stay (return-type, guard-first, ensureKeyboard, instanceof pass-through, try/catch no-throw, sourced types, processBatches for bulk, no filters/usagePage untouched, typecheck ≤ baseline, [high-stakes]+[hw] tagging).

---

### Task 1a — delete the two stale sections — [high-stakes] — STATUS: ✓ DONE
Deleted "Known pre-existing type errors" + "The self-check gate will fight you here" (items 7, 8); all Done-when greps pass; committed.

### Task 1b — fix −4 line refs + canonical-shape signature — [high-stakes] — STATUS: ✓ DONE
Items 2/3/4 applied (all refs corrected, `Promise<any | Error>` canonical shape, no `Calibration`); all Done-when greps pass (re-recorded in review-sdk-skill-clean.md §"Done when" lines 12–16); committed.

### Task 1c — rewrite Bulk + Where-types + Never-change + tighten checklist — [high-stakes] — STATUS: ✓ DONE
Items 1/5/6/9/10 applied; 89 lines ≤ 100; whole-file gates (stale sweep, TS2304/Calibration, section headers, kept-facts, item-5/6/9 positives, frontmatter) all pass (re-recorded in review-sdk-skill-clean.md §"Done when" lines 18–25); committed 1f47e52.

## Findings (raw — PM routes at close)
- Reviewer RF1: current-sprint.md edit-spec item 2 asserts DebugKeyboardService refs `:7`/`:11` are "EXACT — keep as-is", but the field decl is line 8 and the construction line 12 — a spec blessing shields inherited drift from the Worker. Verify: `grep -n "private keyboard: XDKeyboard\|new XDKeyboard" src/services/DebugKeyboardService.ts` → 8, 12. (Detail: review-sdk-skill-clean.md §RF1.)
- Reviewer RF2: SKILL.md line 76 mixes KeyboardService and DebugKeyboardService refs as bare `:NNN` in one sentence; `:11` legitimately means `connectedDevice` in one file and `constructor()` in the other, so refs are namespace-ambiguous to a reader/verifier. Verify: SKILL.md:76 vs SKILL.md:30. (Detail: review-sdk-skill-clean.md §RF2.)

<!-- Keep this file under ~150 lines. It is a SNAPSHOT, not a log. Overwrite, don't append. -->
