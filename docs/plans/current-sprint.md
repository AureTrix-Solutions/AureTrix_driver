# SPRINT: sprint-19-doc-verify

**GOAL:** Re-verify `.openclaude/skills/sdk-wrapper/SKILL.md` against the current `src/services/KeyboardService.ts` (and its cited companions) and correct every drifted claim — the skill was last source-verified in sprint-04 and the code has moved on.
**DONE-CRITERIA (sprint):** Every file/line reference and every code-shape claim in SKILL.md resolves against the source as it exists today (each confirmed by grep); no source file is modified; SKILL.md stays tight (≤100 lines).
**Started:** 2026-10-24  ·  **Status:** IN PROGRESS
<!-- revN (YYYY-MM-DD): <what changed> -->

## Checkpoint
- Branch: `sprint-19-doc-verify`
- tsc baseline: N/A this sprint — docs-only, no `.ts`/`.vue` edits, so the self-check gate does not apply (`docs/tsc-baseline.txt` untouched)
- Cleanup (from an actual `ls`): `.scratch/` has `pm-notes.md` (PO may delete); `_to_delete/` is empty — no cleanup needed
- Base commit for the review diff: `04ea632`
- Task 1 → IN-REVIEW: 1a ✓ (`d509dae`) + 1b ✓ (`46a925b`, edits 7–15 applied verbatim; all four Done-when pass — DW1 empty, DW2=8 hits, 96 ln ≤100, diff SKILL.md+docs/plans/* only). Review file `docs/plans/reviews/review-sdk-skill-verify.md` written; review range `04ea632..HEAD`. Cleanup (actual `ls`): `.scratch/` = pm-notes.md only (PO may delete); `_to_delete/` = empty — no cleanup needed.
<!-- Session-start check: on sprint branch (not main) + clean tree. Uncommitted changes → STOP, report. -->

## ▶ RUN THIS
Next: **Task 2** — Reviewer window: "follow docs/plans/reviews/review-sdk-skill-verify.md". Runs ONCE over `04ea632..HEAD` (1a `d509dae` + 1b `46a925b` + handoff). Re-run every Done-when command from both sub-tasks and spot-check ≥5 corrected refs against source. PASS → task 1 DONE + sprint flags "ALL TASKS DONE — awaiting PO sign-off".

## Tasks

### 1. Re-verify and correct SKILL.md — [high-stakes] — STATUS: IN-REVIEW (1a ✓, 1b ✓; review-sdk-skill-verify.md written)
Docs-only. **Do not edit any source file.** SKILL.md is the only file you change (plus this plan's checkpoint/Findings). Read SKILL.md ONCE (it is 89 lines) — every `old_string` below is quoted verbatim from it; apply, don't re-derive.

Why high-stakes: the skill encodes SDK-correctness guidance that future Workers apply blindly; a wrong ref or a wrong shape claim propagates. Reviewer runs ONCE at the end over `04ea632..HEAD`.

Split into two sequential sub-tasks (4 `##` sections touched, ~14 edit-sites — over the "authoring >2 sections" limit as one generation).

---

#### 1a — *Canonical shape* + *Known deviations* — STATUS: ✓ DONE (2026-10-24, all Done-when pass)

**Verified facts (PM-confirmed 2026-10-24; grep targets given — do NOT re-derive, just apply):**

| SKILL.md says | Truth | grep target |
|---|---|---|
| `KeyboardService.ts:798` (canonical example) | `calibrationStart` is at **:926** | `async calibrationStart` |
| snippet returns `Promise<any \| Error>` | returns **`Promise<null \| Error>`**; real guard is multi-line braced | `async calibrationStart` |
| "Many wrappers write `any \| Error` (`getMacro :518`, `setLighting :913`, `setPollingRate :1174`)" | **Zero** `Promise<any \| Error>` wrappers remain. Now typed: `getMacro :589` → `MacroSlotInfo \| Error`; `setLighting :1042` → `DataView \| DataView[] \| null \| Error`; `setPollingRate :1348` → `number \| Error` | `Promise<any \| Error>` (0 hits) |
| `connectedDevice` … decl `:11` | decl **:74** (type annotation `Device \| PairedDevice \| null` is CORRECT — don't touch it) | `private connectedDevice` |
| `ensureKeyboard()` (`:37`) | **:100**; body text in the skill is still exact | `private ensureKeyboard` |
| deviations `setKey` `:508` | **:579**; deviation description still TRUE (no guard, no `instanceof`) | `async setKey` |
| deviations `getDevices` `:109` | **:172**; description still TRUE (`Promise<Device[]>`, `return []` on catch, no guard) | `async getDevices` |
| deviations `initializeKeyboard` `:255` / `_initializeKeyboardInternal` `:268` | **:326** / **:339**; description still TRUE (`initializationPromise` dedup; `const maxRetries = 2` at :341 → "retries ≤ 2" holds) | `async initializeKeyboard`, `const maxRetries = 2` |

**Edits:**
1. Line 12 — replace `(cf. \`calibrationStart\`, \`KeyboardService.ts:798\`)` with `(cf. \`calibrationStart\`, \`KeyboardService.ts:926\`)`.
2. Lines 15–24 — replace the fenced snippet body with the real method so the "cf." citation is literally true (verbatim from `src/services/KeyboardService.ts:926–938`, de-indented by two spaces):
```ts
async calibrationStart(): Promise<null | Error> {
  try {
    if (!this.connectedDevice) {
      return new Error('No device connected');
    }
    const result = await this.ensureKeyboard().calibrationStart();
    if (result instanceof Error) return result;
    return result;
  } catch (error) {
    console.error('Failed to start calibration:', error);
    return error as Error;
  }
}
```
3. Line 29 (item **1**) — replace the whole bullet with:
   `1. **Return type is \`<Success> | Error\`** — never throws; the union forces callers to handle failure. No wrapper returns \`any | Error\` any more (sprint-19 re-verify: zero hits) — they are typed, e.g. \`getMacro :589\` → \`MacroSlotInfo | Error\`, \`setPollingRate :1348\` → \`number | Error\`, \`setLighting :1042\` → \`DataView | DataView[] | null | Error\`. Keep it that way: pin the real type where sourceable (see *Where types come from*); the SDK's own \`.d.ts\` often says \`Promise<any>\`, which is not a licence to propagate \`any\`.`
   (Note: `MacroSlotInfo` is a **local** `export interface` in KeyboardService.ts **:44**, not an SDK import — grep `export interface MacroSlotInfo`.)
4. Line 30 (item **2**) — two changes in this bullet:
   a. Replace the substring `` **`if (!this.connectedDevice) return new Error('No device connected');`** `` with `` **`if (!this.connectedDevice) { return new Error('No device connected'); }`** `` — the real code always uses the braced multi-line form (62 occurrences; the one-line form has 0). grep `if (!this.connectedDevice) {`
   b. Change ``decl `:11` `` to ``decl `:74` ``. Leave the rest of the bullet alone.
5. Item **4** (the `ensureKeyboard()` bullet, lines 31–35) — change ``(`:37`)`` to ``(`:100`)``. Body description is correct as written.
6. Deviations table (lines 40–42) — swap the four line cells: `` `:508` `` → `` `:579` ``, `` `:109` `` → `` `:172` ``, `` `:255` `` → `` `:326` ``, `` `:268` `` → `` `:339` ``. Descriptions unchanged (all re-verified TRUE).

**Done when (each is a command; all must pass):**
- `grep -n ":798\|:518\|:913\|:1174\|\`:508\`\|\`:109\`\|\`:255\`\|\`:268\`\|decl \`:11\`\|(\`:37\`)\|Promise<any | Error>\|connectedDevice) return new Error" .openclaude/skills/sdk-wrapper/SKILL.md` → **no output**
- `grep -c "KeyboardService.ts:926" .openclaude/skills/sdk-wrapper/SKILL.md` → **1**
- `grep -c "Promise<null | Error>" .openclaude/skills/sdk-wrapper/SKILL.md` → **≥1**
- `grep -n "\`:579\`\|\`:172\`\|\`:326\`\|\`:339\`\|decl \`:74\`\|(\`:100\`)" .openclaude/skills/sdk-wrapper/SKILL.md` → **≥6 hits**
- `git diff --name-only` → only `.openclaude/skills/sdk-wrapper/SKILL.md` + `docs/plans/current-sprint.md`
- Commit: `sprint-19-doc-verify: task 1a — SKILL.md canonical shape + deviations re-verified`

---

#### 1b — *Bulk / many-key operations* + *Where types come from* — STATUS: ✓ DONE (2026-10-24, `46a925b`, all Done-when pass; task 1 → IN-REVIEW)

**Verified facts (PM-confirmed 2026-10-24):**

| SKILL.md says | Truth | grep target |
|---|---|---|
| ExportService `private processBatches = …` at `:6` | at **:24** (class starts :23); the quoted code is exact | `private processBatches` |
| Signature (`useBatchProcessing.ts:5`) | the arrow fn starts at **:3**; it carries **no** explicit `: Promise<void>` annotation (inferred) | `processBatches = async <T>` |
| detects via `'physicalKeyValue' in keys[0]`, `:12` | **:10** (inside `const isObjectArray = …`) | `isObjectArray =` |
| `await Promise.all(batch.map(updateFn))` then `setTimeout`, `:21` | **:19** and **:20** | `await Promise.all(batch.map(updateFn))` |
| example cites `SingleKeyTravel.vue:164` | file is `src/components/performance/SingleKeyTravel.vue`; the `processBatches` call is at **:223**; real call passes **`keyIds`** (numbers), not `keys`; the `travelChanged`/`deadChanged` conditional description is CORRECT | `processBatches(keyIds` |
| gotcha cites `SingleKeyTravel.vue:160` | the narrowing is at **:219**, text `physicalKeyValue: key.physicalKeyValue \|\| key.keyValue` — exact | `key.physicalKeyValue \|\| key.keyValue` |
| item 3: `src/types/types.ts` (13 ln) — three app types, "mirrors `dist/cjs/src/types/type.d.ts` verbatim" | **17 ln**, and all three claims are stale: `DksLayoutType`/`DksType` are **re-exported `import type`s** from the sdk-keyboard **deep esm** `.d.ts` (:5, :9), not local declarations; `IDefKeyInfo` is the **app-extended** model `Omit<SdkIDefKeyInfo,'location'> & { physicalKeyValue?; location?; remappedLabel? }` (:13–17) with `SdkIDefKeyInfo` imported from the protocol-keyboard **root** (:7); the header says "Derived from the SDK public type surface (§10.1, §10.4, §13.7)" and that the deep-path import MUST stay `import type` (§13.4) | `Derived from the SDK public type surface` |

**Edits:**
7. Line 48 — change ``at `:6` `` to ``at `:24` ``.
8. Line 50 — change ``Signature (`useBatchProcessing.ts:5`)`` to ``Signature (`useBatchProcessing.ts:3`)``.
9. Lines 52–55 — replace the fenced signature with the real one (no return annotation; note the inference):
```ts
const processBatches = async <T>(
  keys: { physicalKeyValue: number; keyValue: number }[] | number[],
  updateFn: (physicalKey: number) => Promise<T>,
  batchSize: number = 80,
  delayMs: number = 100
) => { /* … */ }   // Promise<void> by inference — not annotated
```
10. Line 56 — change `` `:12` `` to `` `:10` ``.
11. Line 57 — change `` `:21` `` to `` `:19`–`:20` `` and change "Returns `Promise<void>`" to "Returns `Promise<void>` (inferred)".
12. Line 58 — change ``real `SingleKeyTravel.vue:164` `` to ``real `src/components/performance/SingleKeyTravel.vue:223` `` and in the inline example change `processBatches(keys,` to `processBatches(keyIds,`.
13. Line 59 — change ``(`SingleKeyTravel.vue:160`)`` to ``(`SingleKeyTravel.vue:219`)``.
14. Line 68 (item **3**) — replace the whole bullet with:
   `3. \`src/types/types.ts\` (17 ln) — \`DksLayoutType\`/\`DksType\` are **re-exported \`import type\`s** from the sdk-keyboard deep \`.d.ts\` (\`:5\`, \`:9\`); \`IDefKeyInfo\` is the **app-extended** key model \`Omit<SdkIDefKeyInfo,'location'> & { physicalKeyValue?; location?; remappedLabel? }\` (\`:13\`), with \`SdkIDefKeyInfo\` from the protocol-keyboard root (\`:7\`). Header: "Derived from the SDK public type surface (§10.1, §10.4, §13.7)"; the deep-path import MUST stay \`import type\` — a value import fails (§13.4).`
15. Provenance — insert one HTML comment line immediately after the `# SDK wrapper pattern` heading:
   `<!-- Refs source-verified against KeyboardService.ts (1605 ln) + cited companions 2026-10-24 (sprint-19). -->`

**Do NOT edit (re-verified TRUE this session — leave exactly as written):**
- Item **2** of *Where types come from*: `constants/param.ts` 88 ln with `OrderType`/`KeyLayout`/`KeyTouchMode`/`BLControls`; `types/interface.ts` 183 ln with `IDefKeyInfo`/`ILightMode`/`LightModeType`/`IDKSMode`. (Confirmed: param.ts 88 ln, symbols at :1/:45/:75/:81; interface.ts 183 ln, symbols at :3/:44/:48/:98.)
- Item **4**: `sdk-keyboard/dist/cjs/src/controller/*.d.ts` exists and many signatures do return `Promise<any>`.
- The whole *Importing protocol-keyboard types* paragraph (line 72): tsconfig `paths` remap to `dist/esm/types/index.d.ts` (:22), upstream v1.0.6 `"types"` → nonexistent `dist/esm/index.d.ts`, `"exports"` = `"."` only, working barrels at `dist/{esm,cjs}/types/index.d.ts`, `TouchModeType` is sdk-keyboard-local and **not** re-exported by the root facade (facade exports only `XDKeyboard`), `VersionString` still has no declaration anywhere (§13.1), `setPerformanceMode` takes `'global' | 'single' | 'rt'` (KeyTouchMode :75–79 = 0x00/0x01/0x02) — all confirmed.
- The *Never change (design intent)* section: `filters: []` (~:186) and `usagePage: [65440]` (:104) confirmed present.
- The claim that KeyboardService is the only place that touches `XDKeyboard`: confirmed (`grep -rln XDKeyboard src/` → KeyboardService.ts + types.ts, the latter type-only).

**Done when:**
- `grep -n "at \`:6\`\|useBatchProcessing.ts:5\|\`:12\`)\|, \`:21\`\|SingleKeyTravel.vue:164\|SingleKeyTravel.vue:160\|(13 ln)" .openclaude/skills/sdk-wrapper/SKILL.md` → **no output**
- `grep -n "at \`:24\`\|useBatchProcessing.ts:3\|\`:10\`\|\`:19\`\|SingleKeyTravel.vue:223\|SingleKeyTravel.vue:219\|(17 ln)\|Refs source-verified" .openclaude/skills/sdk-wrapper/SKILL.md` → **≥8 hits**
- `wc -l .openclaude/skills/sdk-wrapper/SKILL.md` → **≤100**
- `git diff --name-only 04ea632..HEAD` → only SKILL.md + `docs/plans/*` (no source files)
- Handoff clean of inline-fixable defects (typos, dead refs, self-created inconsistencies) — this is a docs task, so the typecheck gate is skipped but the clean-handoff duty is not
- Then set task 1 → **IN-REVIEW** and write `docs/plans/reviews/review-sdk-skill-verify.md` from the template (sprint goal + this task's Done-when criteria + Base `04ea632` / Head `<your commit>`), and commit: `sprint-19-doc-verify: task 1b — SKILL.md batch + types sections re-verified`

---

### 2. Independent review — [high-stakes] — STATUS: PENDING
Reviewer window: "follow docs/plans/reviews/review-sdk-skill-verify.md". Runs ONCE over `04ea632..HEAD`. No `[hw]` — docs-only, nothing device-affecting. Re-run every Done-when command above **and** spot-check at least five of the corrected refs against source (e.g. `grep -n "async calibrationStart" src/services/KeyboardService.ts` → 926). PASS → task 1 DONE; FAIL → detail in the review file + fix checklist in ▶ RUN THIS.

## Findings
<!-- One line per out-of-scope defect: DEFECT + WHERE TO VERIFY. Never a pre-written fix. The PM routes these. -->
(none — the one defect found at PM-open, CLAUDE.md:36's stale "~1400 lines" for a 1605-line file, was routed straight to backlog.md by the PM)
