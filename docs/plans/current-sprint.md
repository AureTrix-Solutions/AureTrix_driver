# SPRINT: sprint-04-sdk-skill-clean

**GOAL:** Verify every claim in `.openclaude/skills/sdk-wrapper/SKILL.md` against current source and trim it to the tight pattern+checklist the context-hygiene rule requires (~60–80 lines, hard cap 100).
**DONE-CRITERIA (sprint):** SKILL.md ≤ 100 lines, zero stale line-refs/claims, both task-specific sections deleted, all still-true facts kept (incl. the protocol-keyboard import record the backlog [types] entry depends on).
**Started:** 2026-10-10  ·  **Status:** IN PROGRESS
<!-- revN (YYYY-MM-DD): <what changed> -->

## Checkpoint
- Branch: `sprint-04-sdk-skill-clean`
- tsc baseline: 23 errors (docs/tsc-baseline.txt) — docs-only sprint, gate skipped
- Cleanup: .scratch/ has pm-notes.md (PO may delete); _to_delete/ empty — from actual `ls` at PM-open
- PM-open (2026-10-10): plan written from backlog item; item removed from backlog.md; all claims below grep/read-verified this session

## ▶ RUN THIS
Next: Task 1 — verify-and-trim SKILL.md. Apply the edit spec below, run the Done-when greps, commit, stop.

## Tasks
1. **Verify-and-trim `.openclaude/skills/sdk-wrapper/SKILL.md`** — [high-stakes] — STATUS: PENDING
   - Done when: `wc -l .openclaude/skills/sdk-wrapper/SKILL.md` ≤ 100 (aim ~80)
   - Done when: no stale refs remain — `grep -nE ":15|:41\b|:113|:259|:272|:512|:802|:816" SKILL.md` returns nothing, and `grep -n "TS2304\|Calibration" SKILL.md` returns nothing
   - Done when: sections "Known pre-existing type errors in this file" and "The self-check gate will fight you here" are gone (`grep "^## " SKILL.md` lists neither)
   - Done when: frontmatter untouched (name `sdk-wrapper`, description text unchanged)
   - Done when: kept-facts greps all match: `dist/cjs/types/index.d.ts`, `no \`types\` condition`, `ExportService`
   - Files: `.openclaude/skills/sdk-wrapper/SKILL.md` (single file, rewrite in place; docs task → no typecheck gate)
   - PM research (all verified 2026-10-10 — apply, do NOT re-derive):
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
   - Self-check = the Done-when greps + wc -l above. Then commit `sprint-04-sdk-skill-clean: task 1 — verify-and-trim sdk-wrapper skill`, set STATUS: IN-REVIEW, write `docs/plans/reviews/review-sdk-skill-clean.md` from the review template (sprint goal + Done-when criteria + base/head hashes), advance ▶ RUN THIS to the Reviewer.

## Findings (raw — PM routes at close)
- <none yet>

<!-- Keep this file under ~150 lines. It is a SNAPSHOT, not a log. Overwrite, don't append. -->
