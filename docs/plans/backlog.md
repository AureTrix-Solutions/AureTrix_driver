# Backlog

Candidate sprints and known issues. The PM reads this at PM-open; the PO picks the next sprint; the
PM removes the chosen item and expands it into current-sprint.md with "Done when:" criteria and tags.
Workers/Reviewers who find a new bug append a one-liner here (do NOT fix out of sprint scope).
One line per entry: defect + pointer to where detail/verification lives (usually the review file) —
never a pre-written solution, never duplicated detail.

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

### custom-firmware (long-term) — firmware for an own board (RP2040/STM32)
- Foundation: docs/sdk-reference-v2.md §10.5 wire-framing (64-byte packets, additive checksum, multi-packet reassembly).

## Code issues
- [code] ExportService `decryptSDKConfig` does not replicate the SDK import's `keyboards.flat()` — IF an SDK export ever ships nested `keyboards` arrays, SDK import still applies them but all five app-side repairs silently skip (safe no-op failure; current exports verified flat on hardware, PO debug export 88 entries). Verify: bundle `grep "keyboards=i.keyboards.flat()"` (dist/esm/index.js importEncryptedJSON) vs ExportService `decryptSDKConfig`. (sprint-12 F-D7-1, routed at PM-close 2026-10-22; detail: docs/plans/archive/sprint-12-exportservice-review/review-d7-import-decrypt.md §Findings 1.)
- [code] ExportService `convertLightConfigToSDKFormat` hardcodes `superResponse: false` — a non-default `superResponse` on the special/logo lighting zones is not preserved on import. Pre-existing (converter identical at base 304620f); minor, non-round-trip-blocking; converter is a KEEP-verbatim anchor so changing it risks the 4b/4c advanced-key shapes. Verify: grep `superResponse: false` in `convertLightConfigToSDKFormat` src/services/ExportService.ts. (sprint-12 F-D7-7 observation, routed at PM-close 2026-10-22.)
- [code] SingleKeyTravel.vue declares prop `baseLayout` but never reads it (template or setup) — dead prop; KeyTravel still binds `:base-layout` to it. Deletion is a PO/PM call. Verify: `grep -n baseLayout src/components/performance/SingleKeyTravel.vue` (declaration only). (sprint-11 Task 6a, 2026-10-13.)
- [code] store/connection.ts spreads `getBaseInfo()` results into `deviceInfo` with NO `instanceof Error` check — on hardware failure an Error object's own props pollute deviceInfo silently (typecheck stays clean → latent). Verify: grep `await KeyboardService.getBaseInfo()` src/store/connection.ts. (sprint-11 Task 4a, 2026-10-12.)

## Deps issues
- [deps] On any @sparklinkplayjoy version bump, re-verify the two tsconfig.json pinned `paths` targets still exist (hid `dist/cjs/index.d.ts`; protocol-keyboard `dist/esm/types/index.d.ts` since sprint-06 — upstream ships no root types, so a moved/renamed barrel or a fixed upstream release silently breaks typecheck or makes the remap redundant) — grep `"@sparklinkplayjoy` in tsconfig.json, then `ls` both paths. (2026-10-11.)

## Process issues
- [process] `npm install --no-save --no-package-lock` ignores the lockfile and re-resolves pinned SDKs (poisoned two Task 4a measurements; recover with `npm ci`) — use `npm pack` + manual extraction for package experiments; see docs/plans/archive/sprint-01-code-fixes/review-type-cleanup-4a.md, Reviewer verification notes. (2026-10-09.)
- [process] PM edit-specs that bless inherited line-refs as "EXACT — keep as-is" without re-verifying them shield drift from the Worker (sprint-04 F1: spec blessed `:7`/`:11`, truth was `:8`/`:12`) — specs should mark refs verified-this-session vs inherited-unverified; verify: docs/plans/archive/sprint-04-sdk-skill-clean/review-sdk-skill-clean.md §RF1. (2026-10-11.)
- [process] Done-when greps that count a PHRASE (`grep -c "import type"`) also match the PM spec's own comment prose — sprint-08 Task 1 computed 4 vs expected 2 while the code was correct; anchor statement counts (`^import type`) instead — verify: docs/plans/archive/sprint-08-types-dedupe/review-types-dedupe.md Evidence. (2026-10-11.)

## Document issues
- [docs] Bare `:NNN` refs mixing two files in one sentence are namespace-ambiguous (sprint-04 SKILL.md:76 — `:11` = `connectedDevice` in KeyboardService but `constructor()` in DebugKeyboardService) — qualify cross-file refs (e.g. `DebugKeyboardService:8`); verify: docs/plans/archive/sprint-04-sdk-skill-clean/review-sdk-skill-clean.md §RF2. (2026-10-11.)
- [docs] docs/pages/Debug.md still describes the old 16-getter debug panel (autoConnect/requestDevice/fetchAllData, mode testing, export JSON), but Debug.vue (~307 lines) is now a simple axis inspector (select key → getAxis() → JSON display); sprint-11 Task 3 fixed only the service-name mentions. Verify: src/pages/Debug.vue script section vs Debug.md Features/Data Flow/API Reference. (2026-10-13.)