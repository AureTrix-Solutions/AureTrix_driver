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
Cumulative diff covers 1a + 1b + 1c. The only *source* file touched is `.openclaude/skills/sdk-wrapper/SKILL.md`; `git diff --name-only 0e0a9f0..1f47e52` also lists `docs/plans/current-sprint.md` — the sanctioned checkpoint update required by status-ownership mechanics, not a stray file.
Fix-round ranges (added on each re-review): Round 1 — base `1f47e52`, head `2b37bde` (F1: SKILL.md line 76 `:7`→`:8`, `:11`→`:12`; F2: this line-39 sentence corrected; nothing else changed).

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
**Result:** FAIL  ·  **Date:** 2026-10-10  ·  **Fail count:** 2

### Failed items (FAIL only)

#### F1 — 2 stale line-refs on SKILL.md:76 (sprint-level criterion "zero stale line-refs/claims" — review file line 27)

**Where:** `.openclaude/skills/sdk-wrapper/SKILL.md` line 76 (the "Never change (design intent)" section), final clause:

> `DebugKeyboardService` holds its **own** `XDKeyboard` (`:7`, constructed `:11`) so raw inspection can't disturb the main connection — don't unify them.

**Defect:** both refs are off by one. Actual `src/services/DebugKeyboardService.ts`:

```
 7: class DebugKeyboardService {
 8:   private keyboard: XDKeyboard;          <-- the "holds its own XDKeyboard" line
 9:   private connectedDevice: Device | PairedDevice | null = null;
10:
11:   constructor() {
12:     this.keyboard = new XDKeyboard({      <-- the "constructed" line
13:       usage: 1,
14:       usagePage: [65440],
```

Verified two independent ways, both agreeing:
- `grep -n "private keyboard: XDKeyboard" src/services/DebugKeyboardService.ts` → **8**
- `grep -n "new XDKeyboard" src/services/DebugKeyboardService.ts` → **12**

So `:7` currently points at the `class` declaration line (not the field) and `:11` at `constructor() {` (not the construction). The file's own convention is exact-declaration-line — it cites `connectedDevice` decl `:11` for KeyboardService that way, and that one is correct (`private connectedDevice: Device | PairedDevice | null = null;`). By the same convention these must be `:8` and `:12`.

**Provenance (not a Worker transcription error):** these two refs were inherited from the base file (base line 245 carries the identical `(`:7`, constructed `:11`)`) and the PM's edit spec explicitly blessed them — current-sprint.md item 2: *"DebugKeyboardService refs `:7`/`:11` and SingleKeyTravel `:160`/`:164` are EXACT — keep as-is"*, and item 9 repeated `(`:7`/`:11`)`. The Worker applied the spec as handed over. The SingleKeyTravel half of that blessing **is** correct (see Verified-correct below); only the DebugKeyboardService half drifted. **Fix is 2 characters on one line: `:7`→`:8`, `:11`→`:12`.**

#### F2 — inaccurate scope claim in this review file, line 39 (QA tier: self-created inconsistency)

**Where:** review file line 39 (Worker-authored, 🔍 Commits to review):

> Cumulative diff covers 1a + 1b + 1c; the ONLY file touched is `.openclaude/skills/sdk-wrapper/SKILL.md`.

**Defect:** false as written. `git diff --name-only 0e0a9f0..1f47e52` returns **two** files:

```
.openclaude/skills/sdk-wrapper/SKILL.md   | 250 +++++-----------------
docs/plans/current-sprint.md              |  15 +-
2 files changed, 44 insertions(+), 221 deletions(-)
```

The second file is the *sanctioned* checkpoint (Status-ownership rules require the Worker to move PENDING→IN-PROGRESS and advance ▶ RUN THIS there), so the diff scope is legitimately clean — **no stray source files**. The defect is purely the word "ONLY", which also contradicts the checkbox on line 47 ("single SKILL.md across base..head"). Fix: state it as *the only source file touched is SKILL.md; the second file is the current-sprint.md checkpoint (sanctioned mechanics)*. No source change needed.

### Verified correct (all 19 refs in the file checked against disk this session)

Ref inventory — every `` :NNN `` in SKILL.md, with the line it sits on:

| Skill line | Ref | Claim | On disk | ✓ |
|---|---|---|---|---|
| 12 | `:798` | calibrationStart | `async calibrationStart(): Promise<any \| Error> {` | ✓ |
| 29 | `:518` | getMacro | `async getMacro(key: number): Promise<any \| Error> {` | ✓ |
| 29 | `:913` | setLighting | `async setLighting(lightModeConfig: any): Promise<any \| Error> {` | ✓ |
| 29 | `:1174` | setPollingRate | `async setPollingRate(value: number): Promise<any \| Error> {` | ✓ |
| 30 | `:11` | KeyboardService connectedDevice decl | `private connectedDevice: Device \| PairedDevice \| null = null;` | ✓ |
| 34, 76 | `:37` | ensureKeyboard | `private ensureKeyboard(): XDKeyboard {` | ✓ |
| 40 | `:508` | setKey | `async setKey(keyConfigs: {...}[]): Promise<void \| Error> {` | ✓ |
| 41 | `:109` | getDevices | `async getDevices(): Promise<Device[]> {` | ✓ |
| 42 | `:255` | initializeKeyboard | `async initializeKeyboard(): Promise<void> {` | ✓ |
| 42 | `:268` | _initializeKeyboardInternal | `private async _initializeKeyboardInternal(retryCount: number = 0): Promise<void> {` | ✓ |
| 48 | `:6` | ExportService consumes composable | `private processBatches = useBatchProcessing().processBatches;` | ✓ |
| 50 | `:5` | composable signature | `const processBatches = async <T>(` | ✓ |
| 57 | `:12` | object/number detection | `... && 'physicalKeyValue' in keys[0];` | ✓ |
| 58 | `:21` | batches sequential | `await Promise.all(batch.map(updateFn));` | ✓ |
| 59 | `:164` | SingleKeyTravel wraps in conditionals | `await processBatches(keys, async (physicalKeyValue) => {` + travelChanged/deadChanged guards at 166–170 | ✓ |
| 60 | `:160` | call-site narrowing | `physicalKeyValue: key.physicalKeyValue \|\| key.keyValue,` | ✓ |
| 76 | `:7` | DebugKeyboardService field | actually **8** | ✗ F1 |
| 76 | `:11` | DebugKeyboardService construction | actually **12** | ✗ F1 |

17 of 19 correct; the 2 failures are the adjacent pair on line 76.

Other claims independently confirmed against source/manifests (not just the PM's spec):
- **Design intent intact** — `usagePage: [65440]` is at KeyboardService.ts:41, inside `ensureKeyboard` (37–45) ✓; `navigator.hid!.requestDevice({ filters: [] })` at :124, separate ✓. The skill's "lives in `ensureKeyboard`, never in `requestDevice`" is accurate.
- **Batch defaults 80/100ms, `Promise<void>`, no per-key error collection** ✓ (useBatchProcessing.ts:20–22 loop: `await Promise.all(...)` then `await new Promise(resolve => setTimeout(resolve, delayMs))`).
- **protocol-keyboard v1.0.6 import record** (the backlog `[types]` dependency) — all five facts verified on disk: `package.json "types"` → `./dist/esm/index.d.ts` which does **not** exist; `"exports"` = `"."` only with **no** `types` condition (`{ import: esm, require: cjs }`); **30** `.d.ts` ship; working decls at `dist/cjs/types/index.d.ts`, which `export * from './src/types/interface'` + `export * as constantsParam from './src/constants/param'` (both targets exist under `dist/cjs/types/src/…`) ✓.
- **File-size claims** — `constants/param.ts` 88 ln ✓, `types/interface.ts` 183 ln ✓, `src/types/types.ts` 13 ln with exactly three app types (`IDefKeyInfo`, `DksLayoutType`, `DksType`) ✓, `IDefKeyInfo.physicalKeyValue?` optional ✓.
- **Symbol-name claims** — `param.ts` exports `OrderType`/`KeyLayout`/`KeyTouchMode`/`BLControls` ✓; `interface.ts` exports `IDefKeyInfo`/`ILightMode`/`LightModeType`/`IDKSMode` ✓.
- **`sdk-keyboard/dist/cjs/src/controller/*.d.ts`** exists (higherKey/info/key/lighting/performance/system) ✓.
- **Deviation claims** — `setKey` body has no guard/no `instanceof` ✓; `getDevices` returns `Promise<Device[]>` with `[]` on failure, no guard ✓; `initializeKeyboard` dedupes via `initializationPromise` ✓; `_initializeKeyboardInternal` caps at `maxRetries = 2` ✓.

### Criteria disposition (full Task 1 list, review file lines 7–27)

- **1a** (lines 8–10): all three greps return nothing ✓ — "Known pre-existing", "self-check gate will fight", "review-variant-p-imports" all absent; neither deleted heading appears in `grep -nE "^## "`.
- **1b** (lines 13–16): `Promise<any | Error>` matches (1 hit) ✓; `Promise<Calibration | Error>` 0 hits ✓; the 9-ref loop `:37 :109 :255 :268 :508 :518 :798 :913 :1174` prints **no MISSING** ✓; **frontmatter byte-identical** — `diff` of base vs head lines 1–4 is empty, and both diff hunks start at line 5 ✓.
- **1c** (lines 19–25): `wc -l` = **89** ≤ 100 ✓; whole-file stale sweep (`:15|:41\b|:113|:259|:272|:512|:802|:816`) empty ✓ — note `:41\b` correctly absent while KeyboardService.ts:41 legitimately holds 65440 (different namespace); `TS2304|Calibration` empty ✓; `^## ` lists 6 sections, neither deleted ✓; kept-facts all present (`dist/cjs/types/index.d.ts`, ``no `types` condition``, `ExportService`) ✓; item 5/6/9 positives all match (`never inside KeyboardService`, `simplified`, all three type names present, `hard rule 7`, `65440`) ✓.
- **Sprint-level** (line 27): ✗ **F1** — "zero stale line-refs/claims" fails on the DebugKeyboardService pair. All still-true facts kept, including the full protocol-keyboard import record ✓.

### Reviewer confirmations (lines 46–50)

- [x] meets every "DONE WHEN" criterion — **NO**: 25 of 27 pass; line 27 fails (F1).
- [x] diff scope matches the task — **YES on substance**: only SKILL.md + the sanctioned checkpoint; no stray source files, no design-intent file touched. Line 39's wording is wrong (F2).
- [x] no design-intent violation — confirmed: `filters: []` and `usagePage: [65440]` semantics both stated correctly and verified against source; "wrappers return `Error`, never throw" preserved; all three appear in the trimmed Never-change section.
- [x] typecheck/build gate — N/A, docs-only (tsc baseline 23 untouched, no `.ts`/`.vue` in diff).
- [x] tag correct — [high-stakes] is right (SDK-correctness + multi-file skill rewrite); not [hw] (no device behaviour changed). No mis-tag.

### Reviewer Findings (non-defect observations — routed to PM, not fix items)

- **RF1 — PM edit-spec item 2 carries a false "EXACT" blessing.** current-sprint.md item 2 asserts the DebugKeyboardService `:7`/`:11` refs are exact; they are not (F1). *Where to verify:* `grep -n "private keyboard: XDKeyboard\|new XDKeyboard" src/services/DebugKeyboardService.ts` → 8 and 12. Worth the PM's attention because a spec that says "keep as-is" actively shields drift from the Worker — the same class of error the sprint exists to remove. Consider requiring edit specs to distinguish "verified exact this session" from "inherited, unverified".
- **RF2 — bare `:NNN` refs are namespace-ambiguous.** Line 76 mixes KeyboardService and DebugKeyboardService refs in one sentence with no file qualifier, which is how a reader (and a future verifier) can mis-attribute `:11` — the number legitimately means `connectedDevice` in KeyboardService and `constructor()` in DebugKeyboardService. *Where to verify:* SKILL.md line 76 vs line 30. Cheap hardening: qualify cross-file refs (`DebugKeyboardService:8`).
