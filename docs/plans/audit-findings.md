# Stale SDK Documentation Audit (2026-10-07)

Report only. Ground truth: `docs/sdk-reference-v2.md`. `docs/SDK_REFERENCE.md` is superseded.

## Part 1 — files referencing SDK_REFERENCE.md

| File | Line | Context |
|---|---|---|
| README.md | 182 | Lists it as "Complete API reference for the SparkLink SDK" |
| CLAUDE.md | 75 | Says it's superseded; don't use it |
| docs/plans/roadmap.md | 17 | Task: "Retire docs/SDK_REFERENCE.md and update CLAUDE.md" |
| docs/sdk-reference-v2.md | 32, 98, 172, 3444, 3481, 3487, 4023 | Self-references explaining what the old doc got wrong |
| docs/pages/GlobalTravel.md | 547 | Related-docs link |
| docs/pages/GlobalFeatures.md | 286, 288 | Links ExportService + "SDK Reference" |
| docs/pages/FactoryResetModal.md | 251 | Links "#factory-reset" anchor |
| docs/pages/SwitchProfiles.md | 668 | Related-docs link |
| docs/pages/SingleKeyTravel.md | 625 | Related-docs link |
| docs/pages/KeyTravel.md | 470 | Related-docs link |

10 files total. `docs/SDK_REFERENCE.md` still exists on disk; roadmap retirement task not done.

## Part 2 — contradictions vs docs/sdk-reference-v2.md

| file | line | claim | what v2 says |
|---|---|---|---|
| docs/pages/MacroRecording.md | 11 | "Support up to 64 actions per macro (hardware limitation)" | v2:1938-1940 — "There is no 64-action limit in the SDK"; any 64 figure is a product/UI convention, not an SDK/hardware constraint |
| docs/pages/MacroRecording.md | 50 | "Enforces 64-action limit (hardware constraint)" | Same — v2:1938-1940; nothing caps `macros.length` |
| docs/pages/MacroRecording.md | 334 | "64-action limit: Cannot exceed hardware [limit]" (save validation) | Same — v2:1938-1940; app-side cap only, misattributed to hardware |
| docs/pages/Debug.md | 308-310 | "Axis & Analog" section: `getAxis` = "Per-key axis assignment", `getAxisList` = "All axis mappings" | v2 §5.7 (1044-1069) explicitly retracts the gamepad/analog-axis framing: ids are opaque u16 轴体 (hall switch-module) identifiers; `gamepad`/`analog` appear zero times in SDK sources; do not present as analog axes without hardware confirmation |
| docs/pages/Debug.md | 301 | "getPerformanceMode: Per-key mode (global/single)" | v2:748 — `touchMode` is `'global' \| 'single' \| 'rt'`; doc omits `'rt'` |
| docs/pages/Debug.md | 325-329 | `getPerformanceMode` example return: `{ "touchMode": "global", "profile": 0 }` | v2:745 — returns `{ touchMode: string; advancedKeyMode: number }`; there is no `profile` field (low nibble = `advancedKeyMode`) |
| docs/pages/Debug.md | 302-303 | Lists `getDksTravel` ("DKS travel settings") and `getDbTravel` ("Deadband travel settings") as two distinct getters | v2:945-954 (and row 140) — the two are aliases, byte-identical bundle impls (`getDksTravel` ≡ `getDbTravel`); presenting them as distinct features is the conflation §6.1 settles |
| docs/pages/RapidTrigger.md | 523-524 | "`getSingleTravel(keyId)`: Get initial actuation point" / "`setSingleTravel(keyId, value)`: Set initial actuation" — stated as fact for RT mode | v2:98 — the dual-purpose RT claim came from old SDK_REFERENCE.md; wire write is mode-agnostic (`Layout_DB0`, ×1000); firmware-side interpretation is **[unverified]**, listed in v2's open-questions table |
