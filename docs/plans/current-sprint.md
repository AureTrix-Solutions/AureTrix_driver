# SPRINT: sprint-06-root-types

**GOAL:** Root type imports from `@sparklinkplayjoy/protocol-keyboard` resolve in this repo (tsconfig `paths` remap, variant-P pattern), the single unmasked error is absorbed with baseline unchanged at 23, and sdk-reference + the sdk-wrapper skill record the fixed state.
**DONE-CRITERIA (sprint):** remap present in tsconfig.json; `npm run typecheck` = 23 errors (docs/tsc-baseline.txt unchanged); "Resolution UNTESTED" gone from SKILL.md; backlog item removed (done at PM-open).
**Started:** 2026-10-11  ·  **Status:** IN PROGRESS
<!-- revN (YYYY-MM-DD): <what changed>   ← log revisions here, newest last -->

## Checkpoint
- Branch: `sprint-06-root-types`
- tsc baseline: 23 errors (docs/tsc-baseline.txt) — sprint ends at 23 (unmask absorbed in Task 1, no re-baseline)
- Cleanup: `.scratch/` has pm-notes.md only; `_to_delete/` has .gitkeep only — from actual ls 2026-10-11 (Task 1 session; earlier probe/junction/verify-tree files already removed by PO)
<!-- Session-start check: on sprint branch (not main) + clean tree. Uncommitted changes → STOP, report.
     Updating a task's status REPLACES its one checkpoint line — never append a second paragraph.
     On resume, trust this checkpoint as the plan; consult only the compiler for results. -->

## ▶ RUN THIS
Next: Worker session — "go" → Task 2 (Docs: sdk-reference-v2.md + sdk-wrapper SKILL.md record the fixed state). Task 1 ✓ DONE (Reviewer PASS 2026-10-11 — review-root-types-1.md).

## PM research (banked 2026-10-11; re-verify targets in .scratch history — Worker APPLIES, never re-derives)
- Installed v1.0.6: `"types"` → **nonexistent** `dist/esm/index.d.ts`; no root `index.d.ts`; `"exports"` = `"."` only, no types condition → bare import cannot resolve types today.
- Working complete barrels exist at BOTH `dist/esm/types/index.d.ts` and `dist/cjs/types/index.d.ts` (identical content: `constantsParam` + `export * from './src/types/interface'` + default `keyboardProtocol`; full nested decl tree present). Use the **esm** barrel (app is `"type": "module"`, moduleResolution "node").
- PROBE MEASURED (`.scratch/tsconfig-probe.json` = real tsconfig + only the remap): total 24 = baseline 23 + exactly ONE unmasked error — `src/services/KeyboardService.ts(601,74) TS2345: 'string' not assignable to '"global" | "single" | "rt"'`. All other per-file counts identical to baseline. Remap is safe.
- Why it unmasks: sdk-keyboard v1.0.20's own decls import ~24 names from the protocol-keyboard ROOT (`dist/{esm,cjs}/src/types/type.d.ts:1`) + `LightModeType` (`validate.d.ts:1`); today those silently degrade to `any` under skipLibCheck. The remap makes them real.
- `TouchModeType` (SDK decl `sdk-keyboard/dist/esm/src/controller/performance.d.ts:9`) = union `'global' | 'single' | 'rt'`; it is a sdk-keyboard-local alias, NOT root-exported — write the literal union, do not import the alias.
- All 4 call sites already pass union literals (RapidTrigger.vue:450 'global', :481 'rt', GlobalTravel.vue:301 'global', SingleKeyTravel.vue:165 'single') → zero caller changes.
- `VersionString` has NO declaration anywhere (§13.1) — stays unresolved/`any` post-remap; not a blocker, must be recorded in docs.
- vite.config.ts has only the 8 @-aliases, no vendor aliases; tsconfig `paths` affects typecheck ONLY → no build impact, `npm run build` not required.
- Precedent: identical fix already applied for hid (tsconfig `"@sparklinkplayjoy/hid"` → `dist/cjs/index.d.ts`; sdk-reference §13.7.3, variant P).

## Tasks
1. ✓ **tsconfig paths remap + narrow setPerformanceMode** — [high-stakes] — DONE (Reviewer PASS 2026-10-11; typecheck 23→23, build passes; a544af9..4d84f17; detail in reviews/review-root-types-1.md)
2. **Docs: sdk-reference-v2.md + sdk-wrapper SKILL.md record the fixed state** — [high-stakes] — STATUS: PENDING
   *(high-stakes: investigation-derived SDK-correctness record; not trivial per tag rule)*
   - Done when: `grep -c "Resolution UNTESTED" .openclaude/skills/sdk-wrapper/SKILL.md` → `0`
   - Done when: `grep -c "is present. |" docs/sdk-reference-v2.md` → `0` (old table-row tail gone; grep target: `Only \`dist/esm/types/index.d.ts\` is present`)
   - Done when: `grep -c "sprint-06" docs/sdk-reference-v2.md` → `2` (table row + §13.7 status note)
   - Done when: `grep -c "sprint-06" .openclaude/skills/sdk-wrapper/SKILL.md` → `1`
   - Files: `docs/sdk-reference-v2.md`, `.openclaude/skills/sdk-wrapper/SKILL.md`
   - Docs task → self-check GATE skipped; still hand off free of inline-fixable defects (typos, dead refs).
   - Edits (PM-verified 2026-10-11):
     1. sdk-reference-v2.md package-table row (grep `protocol-keyboard.*1.0.6` in docs/sdk-reference-v2.md, ~line 16) — current Notes cell:
        ``**Broken**: that file does not exist on disk. Only `dist/esm/types/index.d.ts` is present.``
        → replace with:
        ``**Broken upstream**: that file does not exist on disk; working root-type barrels ship at `dist/esm/types/index.d.ts` and `dist/cjs/types/index.d.ts` (the old "only esm" claim was wrong — cjs exists too). **Fixed in-app (sprint-06)**: tsconfig `paths` remaps the bare specifier to the esm barrel — root type imports now resolve (variant-P pattern, §13.7.3).``
     2. sdk-reference-v2.md §13.7 — insert a new blockquote IMMEDIATELY AFTER the existing `> **Status (2026-10-09, sprint-03): Site 1 was fixed...` blockquote (grep `Status (2026-10-09, sprint-03)` in docs/sdk-reference-v2.md):
        `> **Status (2026-10-11, sprint-06): the protocol-keyboard root specifier now resolves too** — tsconfig paths remaps `@sparklinkplayjoy/protocol-keyboard` → `dist/esm/types/index.d.ts` (same variant-P pattern as hid). sdk-keyboard's own .d.ts root imports (type.d.ts ~24 names, validate.d.ts LightModeType) are now real instead of silent `any` under skipLibCheck. Exactly one error unmasked, absorbed in-sprint: KeyboardService.setPerformanceMode wrapper param narrowed `string` → `'global' | 'single' | 'rt'` (TouchModeType). VersionString remains dangling (§13.1). Baseline unchanged at 23.`
     3. SKILL.md `### Importing protocol-keyboard types` section (grep `Resolution UNTESTED` in .openclaude/skills/sdk-wrapper/SKILL.md, ~line 72) — replace the ENTIRE `⚠️ **Resolution UNTESTED** …` paragraph with:
        `✅ **Resolution FIXED (sprint-06)** — tsconfig `paths` remaps `@sparklinkplayjoy/protocol-keyboard` → `dist/esm/types/index.d.ts` (variant-P pattern, §13.7.3), so root type imports resolve: `import type { IDefKeyInfo, ILightMode } from '@sparklinkplayjoy/protocol-keyboard'` typechecks. Upstream is still broken (v1.0.6): `"types"` → nonexistent `dist/esm/index.d.ts`; `"exports"` = `"."` only, no types condition; deep-path import BLOCKED; working barrels at `dist/{esm,cjs}/types/index.d.ts`. Consequences to expect: sdk-keyboard's own root imports are now real, so SDK signatures are no longer `any` in wrappers — write real unions (e.g. `setPerformanceMode` takes `'global' | 'single' | 'rt'`, the sdk-keyboard-local `TouchModeType` — not root-exported, don't try to import the alias). `VersionString` has no declaration anywhere (§13.1) — stays `any`. Reading `protocol-keyboard/src/*.ts` for semantics/enum values remains always safe.`
   - At IN-REVIEW: write `docs/plans/reviews/review-root-types-2.md`.

<!-- STATUS values: PENDING → IN-PROGRESS → (DONE | IN-REVIEW → DONE); high-stakes: IN-REVIEW → DONE (PASS) | → IN-PROGRESS (FAIL). Collapse a finished task to one ✓ line. -->

## Findings (raw — PM routes at close)
- <none yet>
