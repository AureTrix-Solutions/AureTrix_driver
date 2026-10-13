# Backlog

Candidate sprints and known issues. The PM reads this at PM-open; the PO picks the next sprint; the
PM removes the chosen item and expands it into current-sprint.md with "Done when:" criteria and tags.
Workers/Reviewers who find a new bug append a one-liner here (do NOT fix out of sprint scope).
One line per entry: defect + pointer to where detail/verification lives (usually the review file) —
never a pre-written solution, never duplicated detail.

## Candidate sprints (PO picks next)

### dks-page — build the Dynamic Keystroke config page (setDks wrapper + DKS.vue)

### advanced-key-pages — MPT, MT, TGL, END, SOCD, RS pages

### exportservice-review — full review of src/services/ExportService.ts methods (756 lines)
- Known issue found sprint-11 Task 4a (PO decision a1, 2026-10-12): the SDK has NO macro-action readback at all — getMacro returns slot metadata only (sdk-reference-v2.md §7, getMacroRecdata) and getMacroDataRecdata is a stub (`return data`, protocol-keyboard src/utils/recdata.ts). buildMacroLibrary's dead `.macros` read was replaced with an always-empty return + comment; whether macro readback via raw HID is feasible/worth building is OPEN — verify against §7 + §10.5 wire-framing.
- Review scope: every method vs the KeyboardService wrapper contract (returns Error, never throws) + retry-with-backoff + useBatchProcessing consumption; check for other dead-shape reads like `.macros` (silent no-ops that never throw).
- Dead-shape reads confirmed sprint-11 (values preserved as literals, exports byte-identical; making any of them LIVE changes exported JSON = PO call): (1) gatherDeviceInfo reads `baseInfo.productId/vendorId/keyboardName/usage/usagePage` — none in the §3-verified getBaseInfo shape, so those fields may always carry `|| 0`/`|| ''` defaults (verify vs real device + XDKeyboard.getBaseInfo bundle impl); (2) `rateOfReturn`/`topDeadBandSwitch` read `.sArg` off getApi(ROES)/getApi(TOP_DEAD_SWITCH), but the union decodes ROES→number, TOP_DEAD_SWITCH→boolean — always the 3/0 defaults (4c); (3) `advancedType`/`value` from `.enable`/`.keyValue`/`.triggeringPoint` — no verified advanced-key readback shape has those fields, so always 'none'/0 even with DKS/MPT/SOCD/MT/TGL configured; the raw per-mode objects DID export correctly (4d); (4) `deadBandPressValue`/`deadBandReleaseValue` read phantom `{dpThreshold,drThreshold}` — getDpDr's real payload is `{pressDead,releaseDead}` (mm), KS decl fixed in 6d, export still literal 0. Verify: ExportService.ts gatherDeviceInfo/gatherAdvancedKeyData/gatherPerformanceKeyData comment blocks vs protocol-keyboard src/utils/recdata.ts + sdk-reference-v2.md §3/§5.5. (2026-10-12/13.)

### macro-page — build the Macro config page (setMacro wrapper + Macro.vue)
- Pitfall: setMacro without touchMode may reset a key's touch mode to global (sdk-reference-v2.md §7); the wrapper now requires touchMode (Task 4b item G) — the page must pass/preserve it; verify on single + RT keys on hardware.

### custom-firmware (long-term) — firmware for an own board (RP2040/STM32)
- Foundation: docs/sdk-reference-v2.md §10.5 wire-framing (64-byte packets, additive checksum, multi-packet reassembly).

## Code issues
- [code] SingleKeyTravel.vue declares prop `baseLayout` but never reads it (template or setup) — dead prop; KeyTravel still binds `:base-layout` to it. Deletion is a PO/PM call. Verify: `grep -n baseLayout src/components/performance/SingleKeyTravel.vue` (declaration only). (sprint-11 Task 6a, 2026-10-13.)
- [code] store/connection.ts spreads `getBaseInfo()` results into `deviceInfo` with NO `instanceof Error` check — on hardware failure an Error object's own props pollute deviceInfo silently (typecheck stays clean → latent). Verify: grep `await KeyboardService.getBaseInfo()` src/store/connection.ts. (sprint-11 Task 4a, 2026-10-12.)

## Deps issues
- [deps] On any @sparklinkplayjoy version bump, re-verify the two tsconfig.json pinned `paths` targets still exist (hid `dist/cjs/index.d.ts`; protocol-keyboard `dist/esm/types/index.d.ts` since sprint-06 — upstream ships no root types, so a moved/renamed barrel or a fixed upstream release silently breaks typecheck or makes the remap redundant) — grep `"@sparklinkplayjoy` in tsconfig.json, then `ls` both paths. (2026-10-11.)

## Process issues
- [process] `npm install --no-save --no-package-lock` ignores the lockfile and re-resolves pinned SDKs (poisoned two Task 4a measurements; recover with `npm ci`) — use `npm pack` + manual extraction for package experiments; see docs/plans/archive/sprint-01-code-fixes/review-type-cleanup-4a.md, Reviewer verification notes. (2026-10-09.)
- [process] PM edit-specs that bless inherited line-refs as "EXACT — keep as-is" without re-verifying them shield drift from the Worker (sprint-04 F1: spec blessed `:7`/`:11`, truth was `:8`/`:12`) — specs should mark refs verified-this-session vs inherited-unverified; verify: docs/plans/archive/sprint-04-sdk-skill-clean/review-sdk-skill-clean.md §RF1. (2026-10-11.)
- [process] Done-when greps that count a PHRASE (`grep -c "import type"`) also match the PM spec's own comment prose — sprint-08 Task 1 computed 4 vs expected 2 while the code was correct; anchor statement counts (`^import type`) instead — verify: docs/plans/archive/sprint-08-types-dedupe/review-types-dedupe.md Evidence. (2026-10-11.)
- [process] `.vue` files have NO automated type/undefined-reference gate: `npm run typecheck` = `tsc --noEmit` with no vue-tsc installed, eslint.config.mjs turns `no-undef` off for `.ts`/`.vue`, and Vite build transpiles without type-checking — a dangling reference in a `.vue` file passes all three gates and surfaces only at runtime. Sprint-11 mitigated with a manual word-boundary grep after every .vue deletion; a real gate (vue-tsc, or a typecheck script change) is a PO tooling call. Verify: `ls node_modules/.bin | grep vue-tsc` → empty; `grep -n 'no-undef' eslint.config.mjs` → "off". (sprint-11 Task 6b, 2026-10-13; also relates to the getLayoutKeyInfo decl that stayed wrong through 3 sprints.)

## Document issues
- [docs] Bare `:NNN` refs mixing two files in one sentence are namespace-ambiguous (sprint-04 SKILL.md:76 — `:11` = `connectedDevice` in KeyboardService but `constructor()` in DebugKeyboardService) — qualify cross-file refs (e.g. `DebugKeyboardService:8`); verify: docs/plans/archive/sprint-04-sdk-skill-clean/review-sdk-skill-clean.md §RF2. (2026-10-11.)
- [docs] docs/pages/Debug.md still describes the old 16-getter debug panel (autoConnect/requestDevice/fetchAllData, mode testing, export JSON), but Debug.vue (~307 lines) is now a simple axis inspector (select key → getAxis() → JSON display); sprint-11 Task 3 fixed only the service-name mentions. Verify: src/pages/Debug.vue script section vs Debug.md Features/Data Flow/API Reference. (2026-10-13.)