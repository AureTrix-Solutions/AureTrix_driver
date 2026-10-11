# SPRINT: sprint-08-types-dedupe

**GOAL:** Replace the hand-mirrored declarations in `src/types/types.ts` with types derived from the SDK's public type surface (PO-approved A1 + B1, 2026-10-11): `IDefKeyInfo` derived from the protocol-keyboard root import; `DksLayoutType`/`DksType` re-exported via a type-only deep-path import from sdk-keyboard.
**DONE-CRITERIA (sprint):** `npm run typecheck` clean (baseline 0), `npm run build` passes, all 13 consumer files import unchanged, and `src/types/types.ts` contains no literal `Layout_*` unions and no hand-written `keyValue` declaration. Reviewer PASS on the single [high-stakes] task.
**Started:** 2026-10-11  ·  **Status:** IN PROGRESS

## Checkpoint
- Branch: `sprint-08-types-dedupe`
- tsc baseline: 0 errors (docs/tsc-baseline.txt — landed at 0 in sprint-07 Task 2; gate: no new errors, ratchet down only)
- Cleanup: `.scratch/` has pm-notes.md (PM working file, PO may delete); `_to_delete/` empty (from actual ls at PM-open)
<!-- Session-start check: on sprint branch (not main) + clean tree. Uncommitted changes → STOP, report.
     Updating a task's status REPLACES its one checkpoint line — never append a second paragraph. -->

## ▶ RUN THIS
Next: REVIEWER window — "follow docs/plans/reviews/review-types-dedupe.md". Review base e7aa4c5..head 8ae0faf (single file: src/types/types.ts). Note: the plan's "grep -c 'import type' = 2" criterion counts 4 due to prose mentions in the spec's own comments; actual statements = 2 (`grep -c "^import type"`). On PASS → mark Task 1 DONE, advance ▶ RUN THIS to PM-close. No further Worker tasks.

## Tasks
1. **Dedupe src/types/types.ts against the SDK type surface** — [high-stakes] — STATUS: IN-REVIEW
   - Worker done @ 8ae0faf: whole-file replacement per spec; typecheck 0 errors (baseline 0), build ✓ 1.59s; greps pass (IDefKeyInfo export=1, no Layout_* literals, consumers=13). Review file: docs/plans/reviews/review-types-dedupe.md (base e7aa4c5..head 8ae0faf). One plan-math note recorded there: "import type" grep counts 4 not 2 because the spec's own comments contain the phrase; `^import type` statements = 2.
   - Files: `src/types/types.ts` (ONLY this file — the 13 consumers keep importing the same three names from the same path and are NOT touched)
   - Why high-stakes: app-wide key model (IDefKeyInfo used in 11 files; physicalKeyValue/remappedLabel have 160 usages). NOT [hw]: type-level change only, fully erased at build; no runtime/behavior delta to exercise on a device.
   - **PM research (grep-verified 2026-10-11; Worker APPLIES, does not re-derive):**
     - Current file is 14 lines: header comment ("Mirrors … verbatim") + `export type DksLayoutType = 'Layout_DB1' | 'Layout_DB2' | 'Layout_DB3';` + `export type DksType = 'Layout_DKS1' | 'Layout_DKS2' | 'Layout_DKS3' | 'Layout_DKS4';` + `export interface IDefKeyInfo { keyValue: number; physicalKeyValue?: number; location?: { row: number; col: number }; remappedLabel?: string }` (with inline comments). grep: `DksLayoutType` in src/types/types.ts.
     - SDK root `IDefKeyInfo` (via the sprint-06 tsconfig paths remap `@sparklinkplayjoy/protocol-keyboard` → `dist/esm/types/index.d.ts`) = `{ keyValue: number; location: { row: number; col: number } }` — location REQUIRED, no app fields. A verbatim swap is impossible; PO approved derivation A1 (`Omit` + app extensions). `interface extends` is also impossible (required→optional location conflict).
     - `DksLayoutType`/`DksType` exist ONLY in `sdk-keyboard/dist/esm/src/types/type.d.ts` (lines 19/17); the sdk root facade exports only `XDKeyboard` (sdk-reference §10.1). Deep-path `import type` resolves under `moduleResolution: node` and is erased at build → runtime-safe (§13.7 ExportService precedent; §13.4: a VALUE import of that path would fail — must stay `import type`).
     - Import chain is closed: esm `type.d.ts` imports only from `@sparklinkplayjoy/protocol-keyboard` (remapped ✓); protocol `interface.d.ts` imports only `../constants/param` (exists, no imports of its own).
     - No `extends IDefKeyInfo` / `implements IDefKeyInfo` anywhere in src (grep exit 1) → interface→type alias is safe for all 13 consumers.
   - **Edit (1 site — replace the WHOLE file with exactly this, via Write):**
     ```ts
     // Derived from the SDK public type surface (docs/sdk-reference-v2.md §10.1, §10.4, §13.7).
     // DksLayoutType/DksType are sdk-keyboard-local (the root facade exports only XDKeyboard);
     // the deep .d.ts path resolves for tsc (moduleResolution:node) and `import type` is erased
     // at build, so it is runtime-safe. MUST stay `import type` — a value import fails (§13.4).
     import type { DksLayoutType, DksType } from '@sparklinkplayjoy/sdk-keyboard/dist/esm/src/types/type';
     // IDefKeyInfo comes from the protocol-keyboard root via the tsconfig paths remap (sprint-06).
     import type { IDefKeyInfo as SdkIDefKeyInfo } from '@sparklinkplayjoy/protocol-keyboard';

     export type { DksLayoutType, DksType };

     // App-extended key model: the SDK requires `location` and has no remapping fields; the app
     // builds layouts before location is known and tracks physical/display key identity separately.
     export type IDefKeyInfo = Omit<SdkIDefKeyInfo, 'location'> & {
       physicalKeyValue?: number;  // default/physical key ID used for SDK calls
       location?: SdkIDefKeyInfo['location'];  // optional in the app (SDK: required)
       remappedLabel?: string;  // optional label override for display
     };
     ```
   - Expected post-task typecheck: **0 errors** (baseline 0). If NEW errors appear in consumer files, the derivation is wrong — do NOT silence with `!`/`as any`; report per the self-check gate.
   - Done when (all mechanical):
     - `grep -c "export type IDefKeyInfo" src/types/types.ts` → `1`
     - `grep -n "Layout_DB1\|Layout_DKS1" src/types/types.ts` → no output (literal unions gone; only the deep-path import remains)
     - `grep -c "import type" src/types/types.ts` → `2`
     - `grep -rl "types/types" src | wc -l` → `13` (consumers untouched)
     - `npm run typecheck` → 0 errors; `npm run build` → passes (type-only change, but this file feeds the whole bundle graph)
     - Committed: `sprint-08-types-dedupe: Task 1 …` + review file written with Base/Head hashes.

## Findings (raw — PM routes at close)
- <none yet>

<!-- Keep this file under ~150 lines. SNAPSHOT, not a log. -->
