# SPRINT: sprint-06-root-types

**GOAL:** Root type imports from `@sparklinkplayjoy/protocol-keyboard` resolve in this repo (tsconfig `paths` remap, variant-P pattern), the single unmasked error is absorbed with baseline unchanged at 23, and sdk-reference + the sdk-wrapper skill record the fixed state.
**DONE-CRITERIA (sprint):** remap present in tsconfig.json; `npm run typecheck` = 23 errors (docs/tsc-baseline.txt unchanged); "Resolution UNTESTED" gone from SKILL.md; backlog item removed (done at PM-open).
**Started:** 2026-10-11  ·  **Closed:** 2026-10-11  ·  **Status:** CLOSED  ·  **Signed off by:** PO (2026-10-11)
**Tasks:** 2/2 DONE — all Reviewer PASS (2026-10-11), 0 fails, no fix rounds, no [hw]. Commits: 8eb6319 (T1), 34f2a82 (T2).
- Archive note (2026-10-11): this sprint's 2 review files were git mv'd into this folder at close; the task pointers below were repointed accordingly.
<!-- revN (YYYY-MM-DD): <what changed>   ← log revisions here, newest last -->

## Checkpoint
- Branch: `sprint-06-root-types`
- tsc baseline: 23 errors (docs/tsc-baseline.txt) — sprint ends at 23 (unmask absorbed in Task 1, no re-baseline)
- Cleanup: `.scratch/` has pm-notes.md only; `_to_delete/` has .gitkeep only — from actual ls 2026-10-11 (Task 2 Reviewer session)
<!-- Session-start check: on sprint branch (not main) + clean tree. Uncommitted changes → STOP, report.
     Updating a task's status REPLACES its one checkpoint line — never append a second paragraph.
     On resume, trust this checkpoint as the plan; consult only the compiler for results. -->

## ▶ RUN THIS
ALL TASKS DONE — awaiting PO sign-off. Next: PM-close session — "Act as PM per CLAUDE.md. All tasks DONE; assemble work + QA verdicts vs the goal for my sign-off; on acceptance archive, on rejection revise." No further Worker/Reviewer sessions.

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
1. ✓ **tsconfig paths remap + narrow setPerformanceMode** — [high-stakes] — DONE (Reviewer PASS 2026-10-11; typecheck 23→23, build passes; a544af9..4d84f17; detail in review-root-types-1.md)
2. ✓ **Docs: sdk-reference-v2.md + sdk-wrapper SKILL.md record the fixed state** — [high-stakes] — DONE (Reviewer PASS 2026-10-11; all 4 Done-when greps rerun → 0/0/2/1; diff scope exactly the 2 docs files (+4/-2); 3 PM edits verified verbatim; barrels on disk + tsconfig:22 remap + §13.1/§13.7.3 cross-refs confirmed; 8eb6319..50a5bd1; detail in review-root-types-2.md)

ALL TASKS DONE — awaiting PO sign-off (no [hw] tasks this sprint). Next: PM-close session only.

<!-- STATUS values: PENDING → IN-PROGRESS → (DONE | IN-REVIEW → DONE); high-stakes: IN-REVIEW → DONE (PASS) | → IN-PROGRESS (FAIL). Collapse a finished task to one ✓ line. -->

## Findings (raw — PM routes at close)
- <none yet>
