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
| docs/pages/GlobalFeatures.md | 35, 119, 143 | "**SDK Method:**" heading applied to `KeyboardService.switchConfig(profileId)`, `KeyboardService.setPollingRate/getPollingRate`, `KeyboardService.setSystemMode/querySystemMode` | v2 §6.1 (3444-3490) — these are app **wrapper** names; the SDK methods are `switchConfig`, `setRateOfReturn` / `getApi({type:'ORDER_TYPE_ROES'})`, `switchSystemMode` / `getApi({type:'ORDER_TYPE_QUERY_WIN_MODEL'})`. Docs do prefix `KeyboardService.`, so this is mislabeling under an "SDK Method" heading rather than a false method name — but it's exactly the conflation pattern v2 §6.1 flags |
| docs/pages/RapidTrigger.md | 523-524 | "`getSingleTravel(keyId)`: Get initial actuation point" / "`setSingleTravel(keyId, value)`: Set initial actuation" — stated as fact for RT mode | v2:98 — the dual-purpose RT claim came from old SDK_REFERENCE.md; wire write is mode-agnostic (`Layout_DB0`, ×1000); firmware-side interpretation is **[unverified]**, listed in v2's open-questions table |
| docs/pages/GlobalTravel.md | 291 | "SDK Method" table lists `setGlobalTouchTravel(param)` as an SDK method | v2:3458 — `setGlobalTouchTravel` is a KeyboardService **wrapper**; the SDK method is `setDB(param)` (getter `getGlobalTouchTravel` is genuinely an SDK name, v2 §5.1:691) |
| docs/pages/GlobalFeatures.md | 242 | Flow: `profileStore.switchProfile(id)` → `KeyboardService.switchConfig(id - 1)` | v2:3460 — the wrapper takes the **1–4** profile ID and subtracts 1 itself (`switchConfig(profileId)` → SDK `switchConfig(profileId - 1)`); passing `id - 1` would send 0–3 into a 1–4-validated wrapper and fail for id=1. Source agrees: profileStore.ts:28 passes `id` unchanged |
| docs/pages/SingleKeyTravel.md | 265 | `getSingleTravel(key)` Returns: "`number` (as string "2.05")" — self-contradictory | v2:830 — ✅ verified: returns a **string** (fixed-decimal); callers must `Number()` it. The doc's stated type `number` is wrong |
| docs/pages/SingleKeyTravel.md | 266 | `setSingleTravel(key, value)` Returns: `number` | v2:842 — ✅ verified: on success a **string** (round-trips through `getSingleTravel`, fixed-decimal e.g. `"1.50"`); on failure resolves to `Error` |
| docs/pages/SingleKeyTravel.md | 268 | `setDp(key, value)` Returns: `{ pressDead }` | v2:916 — ✅ verified: a single **number** (echo of written value in mm), not an object |
| docs/pages/SingleKeyTravel.md | 269 | `setDr(key, value)` Returns: `{ releaseDead }` | v2:928 — ✅ verified: a single **number** (echo of written value in mm), not an object |
| docs/pages/SingleKeyTravel.md | 270 | `setPerformanceMode(key, mode, param)` Returns: N/A | v2:762 — ✅ verified: returns `{ touchMode: string; advancedKeyMode: number } \| Error` (round-tripped read-back of the written slot) |
| docs/pages/Performance.md | 447 | `getPerformanceMode` "Returns: { touchMode: 'global' \| 'single' }" | v2:745 — `touchMode` is `'global' \| 'single' \| 'rt'` (0→global, 1→single, 2→rt); return also includes `advancedKeyMode: number` |
| docs/pages/Performance.md | 305 | "`getPerformanceMode(keyId)`: Get global/single mode" | Same omission — v2:745: three modes, not two (`'rt'` missing) |
| docs/pages/Lighting.md | 13, 461 | "Brightness (Luminance): 0-4" listed alongside SDK params `mode, luminance, speed` | v2:2047,2072-2086 — the SDK `luminance` field is a **0–255 raw byte** (`setLighting` validates 0–255); 0–4 is a UI-level scale only. As written under "How Lighting Works" with SDK param names, it states the SDK range as 0–4. (App's own Lighting.vue scales UI 0–4 → byte before calling, so the UI scale itself is real — the contradiction is attributing it to `luminance`) |
| README.md | 109 | "**SDK**: @sparklinkplayjoy/sdk-keyboard v1.0.14" | v2:15 — installed package is **1.0.20** (`^1.0.14` is only the declared semver range in package.json); v2's whole audit is against 1.0.20 |
| README.md | 182 | Points readers to "docs/SDK_REFERENCE.md — Complete API reference for the SparkLink SDK" | v2 (whole doc) supersedes SDK_REFERENCE.md; v2:32 lists the specific errors the old reference contains. README sends readers to the stale doc as the authoritative one |

## Part 3 — categories checked, no contradictions found

- **Device filtering**: zero hits for `vendorId`/`productId`/`usagePage`/`filters`/`requestDevice` in docs/pages/ or README.md — no doc contradicts v2's unfiltered-device-selection rule (v2 §12).
- **Polling rate table** (docs/pages/GlobalFeatures.md:110-117): index→Hz values (3→1K … 7→8K) match v2 §3 (486-518) exactly.
- **RT travel/deadzone object shapes** (docs/pages/RapidTrigger.md:355-384): `getRtTravel` → `{pressTravel, releaseTravel}` and DP/DR shapes match v2 §5.5/§5.6.
- **SwitchProfiles.md:359-364 "SDK Method" table**: all four (`getRm6X21Travel`, `getSingleTravel`, `getLayoutKeyInfo`, `setKey`) are genuine SDK facade methods per v2 §5.1/§2 — correctly labeled, unlike GlobalFeatures.md.
- **Calibration.md**: `getRm6X21Calibration` / calibration flow matches v2 §4.
- **KeyTravel.md, Connect.md, KeyMapping.md, FactoryResetModal.md, LayoutPreview.md, LayoutCreator.md**: no return-type/range/method-name claims contradicting v2 found via the claim-pattern greps (these docs are mostly UI-flow oriented). `hasAxisList` (LayoutCreator.md:108) matches v2:1062.
- **Encrypted JSON export** (README.md:28 "Encrypted configuration export/import"): consistent with v2 §11 (`exportEncryptedJSON`, AES-encrypted, v2:2231,2268).
