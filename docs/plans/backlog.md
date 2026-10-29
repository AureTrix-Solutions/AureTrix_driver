# Backlog

Candidate sprints, known issues, and standing constraints. The PM reads this at PM-open; the PO picks
the next sprint; the PM removes the chosen item and expands it into current-sprint.md with "Done when:"
criteria and tags. Workers/Reviewers who find a new bug append a one-liner here (do NOT fix out of
sprint scope).
One line per entry: defect + pointer to where detail/verification lives (usually the review file) —
never a pre-written solution, never duplicated detail.
The issue sections are the WORK QUEUE: each item is a defect that becomes a sprint task and then leaves
this file. `## Constraints` is NOT work — those are standing guardrails that apply conditionally (on a
version bump, when writing a spec) and stay here permanently. File a new finding under Constraints if
it is a rule to follow rather than a defect to fix.

## Candidate sprints (PO picks next)

### dks-page — build the Dynamic Keystroke config page (setDks wrapper + DKS.vue)

### advanced-key-pages — MPT, MT, TGL, END, SOCD, RS pages

### rs-export-recovery — RS (advancedKeyMode 9) export/import round-trip (deferred from sprint-12, PO 2026-10-14)
- Scope DECISION PENDING a hardware read (below) — feature-scoped (export carries rs, import silently drops) vs device-scoped (full round-trip via post-import repair). NOT an RS page — that's `advanced-key-pages`.
- Pick-up sequence (PO-specified): (1) add a getRS wrapper to KeyboardService (sdk-wrapper pattern; wrappers return Error, never throw); (2) PO sets RS via OEM tooling and reads it back through the wrapper; (3) if `dks1 !== dks2` can occur, recovery is partial (setRS takes single `dks`; cmdRS writes `[key,dks,dks,key]` so slot 2 can't be set independently), else trivial full round-trip; (4) decide scope after that read.
- Banked sizing (PM-verified 2026-10-14, grep targets in .scratch/pm-notes.md "RS (mode 9) sizing" + "RS investigation"): (a) setAdvancedKeys has NO 'rs' branch (dispatch chain dks/mpt/mt/tgl/end/socd/macro only; advancedKeysSdkMap has 9:setRS but it's never called → silent no-op) → device-scoped needs a post-import repair loop calling setRS directly, like DB3. (b) shapes DON'T match: getRS returns `{dks1,dks2}` (single bytes), setRS takes IRSMode `{key,dks}` → shape to `{key, dks: dks1}`. Feature-scoped ≈ 4-6 lines (gather branch + type field); device-scoped adds ≈ 10-15 (batched repair loop + hw criterion). RS is version-independent (no `v` param). What the `dks` byte means functionally is unverified in source/sdk-ref (§6.9) — hw-observe question.

### macro-page — build the Macro config page (setMacro wrapper + Macro.vue)
- Pitfall: setMacro without touchMode may reset a key's touch mode to global (sdk-reference-v2.md §7); the wrapper now requires touchMode (Task 4b item G) — the page must pass/preserve it; verify on single + RT keys on hardware.
- RESOLVED (sprint-12 PM-open, 2026-10-13): macro readback via raw HID is NOT worth building — PO decision ("reassigning them is not hard, no point making development harder"); SDK getMacroDataRecdata is a stub so no native path exists. Export/import intentionally carries empty macro lists; import preserves the local MacroList (sprint-12 Task 1). Do not re-investigate.

### keyboardservice-decomposition
Break up the KeyboardService god-object behind a stable façade — keep the public
API (method names, return types, Error-not-throw convention) identical; move only
internals. Candidate domain splits: DeviceConnection, LightingService, and pulling
direct Pinia/store mutations OUT of the service (return data/errors; let stores react).
ALWAYS [high-stakes] + [hw] (touches KeyboardService). Behavior-preserving, zero
user-facing change.
Sequencing: do NOT start until (a) the feature pages are built (dks/advanced-keys/macro)
and (b) KeyboardService has its own test coverage as a safety net. Then one domain
extraction per sprint/branch — never a multi-phase rewrite in one go.
(PO, sprint-21 close 2026-10-28.)

### custom-firmware (long-term) — firmware for an own board (RP2040/STM32)
- Foundation: docs/sdk-reference-v2.md §10.5 wire-framing (64-byte packets, additive checksum, multi-packet reassembly).

## Code issues
- [code] travelProfilesStore.addProfile uses `id = Date.now().toString()` — two adds within the same millisecond get IDENTICAL ids (pinned AS-IS by src/store/__tests__/travelProfiles.test.ts "AS-IS pin"). Verify: `const id = Date.now()` in src/store/travelProfilesStore.ts addProfile; detail: docs/plans/archive/sprint-22-test-stores-mappedkeyboard/review-sprint-22.md §Confirmed AS-IS pins. (sprint-22, 2026-10-29.)
- [code] MappedKeyboard.batchSetKey catches only THROWN setKey failures — a *resolved* `Error` instance (house convention: wrappers return Error, never throw) passes silently as success (pinned AS-IS by src/utils/__tests__/MappedKeyboard.batch-watch.test.ts "AS-IS pin"). Verify: the `await KeyboardService.setKey(...)` loop inside batchSetKey in src/utils/MappedKeyboard.ts; detail: docs/plans/archive/sprint-22-test-stores-mappedkeyboard/review-sprint-22.md §Confirmed AS-IS pins. (sprint-22, 2026-10-29.)

## Document issues
- [docs] docs/pages/Debug.md still describes the old 16-getter debug panel (autoConnect/requestDevice/fetchAllData, mode testing, export JSON), but Debug.vue (~307 lines) is now a simple axis inspector (select key → getAxis() → JSON display); sprint-11 Task 3 fixed only the service-name mentions. Verify: src/pages/Debug.vue script section vs Debug.md Features/Data Flow/API Reference. (2026-10-13.)

## Constraints (standing guardrails — NOT work items; apply conditionally, never removed by a sprint)
- [deps] vue-tsc 3.x requires TypeScript 5.x — `typescript@latest` is 7.0.2 and vue-tsc 3.3.13 crashes under it with `ERR_PACKAGE_PATH_NOT_EXPORTED './lib/tsc'` (verified by PM dryrun 2026-10-22: fails on TS 7.0.2, works on TS 5.9.2). The repo's `^5.9.2` caret cannot reach 7, so this only bites on a deliberate TS major bump or a tool resolving TypeScript outside the lockfile. Verify before any TS major upgrade: `npm view vue-tsc dist-tags` + the installed vue-tsc's compatibility with that TS major. (sprint-13 PM-open, 2026-10-22.)
- [deps] On any @sparklinkplayjoy version bump, re-verify the two tsconfig.json pinned `paths` targets still exist (hid `dist/cjs/index.d.ts`; protocol-keyboard `dist/esm/types/index.d.ts` since sprint-06 — upstream ships no root types, so a moved/renamed barrel or a fixed upstream release silently breaks typecheck or makes the remap redundant) — grep `"@sparklinkplayjoy` in tsconfig.json, then `ls` both paths. (2026-10-11.)
- [process] `npm install --no-save --no-package-lock` ignores the lockfile and re-resolves pinned SDKs (poisoned two Task 4a measurements; recover with `npm ci`) — use `npm pack` + manual extraction for package experiments; see docs/plans/archive/sprint-01-code-fixes/review-type-cleanup-4a.md, Reviewer verification notes. (2026-10-09.)
- [process] PM edit-specs that bless inherited line-refs as "EXACT — keep as-is" without re-verifying them shield drift from the Worker (sprint-04 F1: spec blessed `:7`/`:11`, truth was `:8`/`:12`) — specs should mark refs verified-this-session vs inherited-unverified; verify: docs/plans/archive/sprint-04-sdk-skill-clean/review-sdk-skill-clean.md §RF1. (2026-10-11.)
- [process] Done-when greps that count a PHRASE (`grep -c "import type"`) also match the PM spec's own comment prose — sprint-08 Task 1 computed 4 vs expected 2 while the code was correct; anchor statement counts (`^import type`) instead — verify: docs/plans/archive/sprint-08-types-dedupe/review-types-dedupe.md Evidence. (2026-10-11.)
- [docs] Bare `:NNN` refs mixing two files in one sentence are namespace-ambiguous (sprint-04 SKILL.md:76 — `:11` = `connectedDevice` in KeyboardService but `constructor()` in DebugKeyboardService) — qualify cross-file refs (e.g. `DebugKeyboardService:8`); verify: docs/plans/archive/sprint-04-sdk-skill-clean/review-sdk-skill-clean.md §RF2. (2026-10-11.)
- [process] Done-when criteria of the form `ls node_modules/.bin | grep -c <pkg>` → `1` are wrong on Windows: npm writes 3 shims per bin (`<pkg>`, `.cmd`, `.ps1`), so the count is 3 — use `grep -q`/non-empty for bin-presence criteria. Verify: `ls node_modules/.bin | grep vue-tsc` (returns 3 lines). (sprint-13 Task 1 Reviewer obs O1, routed at PM-close 2026-10-23.)
- [process] .github/workflows/ci.yml pins `actions/checkout@v4` + `actions/setup-node@v4` by tag, not commit SHA — acceptable for informational-only CI; revisit only if the repo adopts a SHA-pinning policy. Verify: `grep "@v4" .github/workflows/ci.yml`. (sprint-15-ci Reviewer observation, routed at PM-close 2026-10-23; detail: docs/plans/archive/sprint-15-ci/review-ci-workflow.md §Non-defect observations.)