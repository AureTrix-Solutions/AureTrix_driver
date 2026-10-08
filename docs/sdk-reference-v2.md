# @sparklinkplayjoy/sdk-keyboard — Complete API Reference

Verification sources, in order of authority: the **readable TypeScript source shipped in
`protocol-keyboard/src`** (packers, decoders, controllers), the **compiled bundle**
(`dist/esm/index.js` in each package), and the **`.d.ts` declarations** (which the bundle
overrides wherever they disagree — §6.0). This document describes the **public facade
(`XDKeyboard`)**; where a `protocol-keyboard` *controller* differs from its facade wrapper
(extra params, defaults, return shapes), the difference is called out inline rather than
documented as a separate API.

## Installed package versions

| Package | Installed | `types` entry point | Notes |
|---|---|---|---|
| `@sparklinkplayjoy/sdk-keyboard` | **1.0.20** | `./dist/esm/index.d.ts` | Declared in app `package.json` as `^1.0.14` |
| `@sparklinkplayjoy/protocol-keyboard` | **1.0.6** | `./dist/esm/index.d.ts` | **Broken**: that file does not exist on disk. Only `dist/esm/types/index.d.ts` is present. |
| `@sparklinkplayjoy/hid` | **1.0.11** | `./dist/esm//types/enum.d.ts` | **Broken — does not resolve.** Two defects: the double slash (typo) and, decisively, `hid/dist/esm/types/` **does not exist on disk at all** (`dist/esm` contains only `index.js`, `index.d.ts`, `src/`). `main` is `./dist/cjs/index.js`. Because `types` *is* declared, `tsconfig`'s legacy `"moduleResolution": "node"` honours it and **never falls back** to the valid adjacent `dist/esm/index.d.ts`. See §13.7. |

## Dependency graph

```
src/services/KeyboardService.ts (app)
  └── @sparklinkplayjoy/sdk-keyboard   → export default class XDKeyboard
        ├── @sparklinkplayjoy/protocol-keyboard  → wire protocol, enums, interfaces, constants
        └── @sparklinkplayjoy/hid                → WebHID transport (WebHIDService, UsbDetect, EventEmitter)
```

`XDKeyboard` is the only class the app should touch. Everything else is reachable but internal.

## Prerequisites

Carried over from the superseded `SDK_REFERENCE.md`. These are **platform** requirements — the
SDK's own declarations state **no minimum browser version**, so no specific Chromium version is
claimed here (the old doc's "89+" was unsourced; WebHID shipped in Chrome 89, but treat that as
background, not an SDK requirement):

- **Chromium-based browser** with the **WebHID API** available (Chrome, Edge, Opera; enabled by
  default in modern builds). Firefox and Safari do not implement WebHID.
- **Secure context**: HTTPS is required in production; `localhost` is exempt for development
  (this app's dev server on `http://localhost:5000` qualifies).
- **User gesture**: `navigator.hid.requestDevice()` must be called from a user-interaction
  handler (click/keypress); it cannot run on page load.

## Return-type gotchas

**Several travel getters resolve to *strings*, not numbers** — verified against the decoder
source: `getSingleTravel` returns e.g. `"2.050"` (its recdata decoder computes
`((data[4] << 8) | data[3]) / 1000` then `.toFixed(decimal)`, `recdata.ts:380` — see §5.3), and
`setSingleTravel` resolves to the same fixed-decimal string (§5.3). Contrast the DKS decoders,
which run through `preciseCalculate` and return genuine **numbers** (§10.5). **Always
`Number()`-convert before comparing** — `"2.05" > 2.0` is a string comparison in JS and silently
wrong:

```ts
const travel = Number(await keyboard.getSingleTravel(keyId));
if (!isNaN(travel)) { /* numeric comparisons are now safe */ }
```

`KeyboardService` wrappers in `src/services/` already normalize where it matters; new call sites
must not assume a numeric return. See also §5.3 and the *(string vs number)* markers in the
method tables.

## Reading conventions used below

- **Signature** lines are copied verbatim from the `.d.ts` files.
- **Returns** — the SDK types almost every hardware call as `Promise<any>`. The real runtime shape
  is documented where it could be recovered from the `protocol-keyboard` decoder functions
  (`getCmd`, `getLayoutModel`, `getDks`, …) — read in their shipped TypeScript source
  (`protocol-keyboard/src/utils/recdata.ts` and friends) and cross-checked against the compiled
  bundle — and marked *(inferred)* where it could not.
- **Source vs bundle** — ✅ marks a claim cross-checked against `protocol-keyboard/src` and/or the
  compiled bundle; where the two disagree (e.g. the lighting `dynamicColorId` gate, §6.0/§8) the
  **bundle wins at runtime** and that is noted explicitly.
- **Facade vs controller** — signatures are the public `XDKeyboard` ones; where the underlying
  `protocol-keyboard` controller accepts extra params (a `v?: string` version gate, a
  `touchMode`, layout defaults), the difference is called out in the method's notes.
- **Value ranges** — ⚠️ **the SDK bundle contains no runtime range validation.** A search of
  `dist/esm/index.js` for `throw new Error`, `must be`, `between`, `out of range`, and `invalid`
  returned no parameter guards; the only thrown errors relate to device connection and the
  firmware-update flow. Every numeric range below is therefore **inferred** from the protocol
  enums and is marked **[unverified]**.
- Anything not present in the shipped declarations is called out explicitly rather than guessed.

---

## Hardware verification checklist

Every `[unverified]` / *(unverified)* marker in this doc that **can only be settled on a physical
keyboard** — i.e. firmware behaviour, device-reported ranges, or real-world effect of a wire value —
is indexed here as a test-on-device task. These are *not* documentation gaps: the source and bundle
have been exhausted for each one. The markers stay in the body text; this table is the tracking
index. Non-hardware unverified items (e.g. packaging defects in §13.4) are not listed here.

| Item | Section | What to test | How to test |
|---|---|---|---|
| mm travel ranges (global, single, RT press/release, DP/DR, DKS/DB) | §5 intro, §5.1, §5.3–§5.6, §13.2 | The real min/max for each mm value, and firmware behaviour at/outside the limits | Read `getApi({ type: 'PRECISION_STROKE' })` → `minTouchTravel`/`maxTouchTravel`/`decimalPlace` on the device; write the extremes via the matching setter, read back, and confirm actuation depth physically |
| `decimal` param valid range for `getSingleTravel` | §5.3 | Whether `decimal` is bounded by the device's `decimalPlace` | Compare `decimalPlace` from PRECISION_STROKE against `getSingleTravel(key, decimal)` output for decimal values 0–5 |
| `setSingleTravel` RT-mode meaning | §5.3, §5.4 | The old `SDK_REFERENCE.md` claimed `setSingleTravel` is dual-purpose — in RT mode it sets the key's **initial trigger travel** rather than an absolute actuation depth. The source proves only that the wire write is mode-agnostic (`Layout_DB0`, ×1000); the firmware-side interpretation is unverified | Put a key in RT mode (`setPerformanceMode`, `touchMode: 'quick'`), `setSingleTravel(key, v)`, then observe where the key actuates and how it interacts with `setRtPressTravel`/`setRtReleaseTravel`; repeat in single mode as a control |
| Axis ids — meaning and valid range | §5.7 | What each id from `getAxisList()` physically binds a key to, and whether non-list ids are rejected | For each id: `setAxis(key, id)`, then open `joy.cpl` / a gamepad tester, press the key, and note which axis deflects; also try an id outside the list and read back |
| Lighting mode ids → visual effects | §8 | Which effect each raw `mode` byte (0–255) produces; whether firmware clamps `luminance`/`speed`/`sleepDelay`/`staticColor` | `setLighting({ ...cfg, mode: id })` sweeping ids and observing the keyboard; write out-of-range byte values and `getLighting()` to see what survives |
| SOCD `pos1`/`pos2`, `type`, `mode` enum meanings | §6.8 | What each byte value does when two keys are pressed simultaneously | `setSocd` with each candidate value on a key pair, press both keys together, and observe the output (neutral / first-wins / last-wins etc.); `getSocd` to confirm what was stored |
| SOCD & END `delay` unit | §6.7, §6.8 | Unit of the raw unscaled 16-bit `delay` (ms? 10 ms? something else) and its effective ceiling | `setEND`/`setSocd` (v ≥ 1.0.7) with known delays, measure the observed timing (high-speed capture or stopwatch), and check clamping at large values |
| SOCD V1 duplicated packing — intentional or bug | §6.0, §13.3 | Whether `[key, dks1, mode1, dks1, key, mode2]` is meaningful to firmware | Requires a device on firmware < 1.0.5: write V1 shape, exercise the key pair, read back (decode is V3-only, so judge by behaviour) |
| RS byte meaning & slot independence | §6.9 | What the single 0–255 `dks` byte controls (no scaling ⇒ neither mm nor 10 ms delay), and whether wire offsets 1/2 are two independent firmware slots or one mirrored value | `setRS(key, dks)` across the range and observe key behaviour; `getRS` afterwards — `dks1 !== dks2` ever appearing (after vendor-software writes or firmware defaults) proves independent slots |
| `setMacro` touchMode reset bug | §7 | Writing a macro rewrites the whole `Layout_Mode` byte as `(u << 4) \| 6`, with `u = 0` unless `touchMode` is `'quick'`/`'single'` — so an omitted third arg should reset a `single`/`rt` key to global | Put a key in single or RT mode (`setPerformanceMode`), call `setMacro` **without** `touchMode` (as `KeyboardService.ts:538` does), then `getPerformanceMode(key)` — expected `{ touchMode: 'global', advancedKeyMode: 6 }` |
| `KeyboardConfig` round-trip | §9.1 | Which fields actually survive `exportConfig` → `importConfig` through hardware | `exportConfig`, change several settings on the device, `importConfig` the saved blob, then re-export and diff field by field |
| MT `delay` unit | §6.5 | Unit of the single raw byte (0–255) hold threshold in `IMTMode` | `setMT` with known delays, measure where the tap/hold decision flips; compare with `getMtorTgl`'s `raw * 10` ms reading of the same slot |
| TGL `delay` firmware minimum | §6.6 | Minimum delay firmware accepts below the proven 2550 ms ceiling / 10 ms granularity | Binary-search small delays via `setTGL`, checking `getTGL` read-back and toggle behaviour |
| `getMtorTgl` delay valid range | §6.3 | Range of the MT/TGL delay the firmware accepts/returns | Write boundary values, read back with `getMtorTgl` |
| TRPS value semantics & range | §6.2 | What `trps1`–`trps4` mean physically and their valid values | Write candidate values via the TRPS path, exercise the key, read back with `getTrpsAll` |
| MPT `dbs` semantics & mm range | §6.4 | Whether the three depths are literally dead bands, and their valid mm range | `setMpt` with boundary `dbs` values, read back, and observe actuation behaviour |
| `IMacroMode` field semantics | §7 | `index` slot range, `mode` playback enum, `num` repeat behaviour, `delay` unit | Write macros varying one field at a time and observe playback (loop? repeat count? timing); `getMacro` to confirm stored values |
| Out-of-range `advancedKeyMode` | §5.2, §13.3 | Firmware behaviour for values with no `advancedKeysSdkMap` entry (7, 10–15) — no SDK guard exists | `setPerformanceMode` with an out-of-range value, `getPerformanceMode` read-back, observe the key; keep `factoryDataReset` in reach in case the key wedges |
| Input-report response ids | §10.6, §13.3 | Relationship between response byte[2] (`128`/`163`/`171`/`152`/`153`) and the `Protocol` request command bytes | Subscribe via `kb.on(...)` / the Debug page while issuing commands, and log the raw byte[2] of each input report |

---

## Verification status

Statuses: **Verified** (cross-checked against `protocol-keyboard/src` and/or the compiled bundle, or
tested empirically), **Partial** (some claims verified, others still `[unverified]` or *(inferred)*),
**Unverified** (nothing in the section has been confirmed), **App-layer** (verified against `src/`,
not the SDK).

> Notes mentioning `[unverified]` hardware behaviour (mm ranges, delay units, enum semantics, …)
> are **test-on-device tasks, not missing documentation** — see the
> [Hardware verification checklist](#hardware-verification-checklist) above for what to test and how.

| Section | Status | Verified against | Batch | Notes |
|---|---|---|---|---|
| §1 Connection & lifecycle | Verified | bundles (sdk-keyboard + hid) | 4b | ✅ batch 4b: `getDevices` may prompt (empty-list → `requestDevice` fallback); `init` returns `Device \| null` and never rejects (null on missing id/device/data or open failure — no handshake, no `baseInfo`); `on`/`off` normalization + handler storage; `reconnection` flow (close → 100 ms → re-tag → reopen, `isReconnecting` guard, errors logged not thrown, queues reset). Not hardware-tested but fully bundle-verified |
| §2 Key mapping | Verified | `protocol-keyboard/src` + bundle | 4 | ✅ `setKey` returns filtered array via `getFnLayoutKeyRecdata` (not raw echo); `IKey` wire = 4 bytes `[key, layout, valueLE16]` no validation; `getLayoutKeyInfo` drops `key===0`/`layout===0xff`/`value===0xffff` entries; `deleteKey` writes `Layout_Mode` with `advancedKeyMode=0` only (doesn't clear DKS/TRPS/DB slots) |
| §3 Device info & system | Verified | hardware + `protocol-keyboard/src` + bundle | 4, 4b | Rate-index→Hz table app-verified on hardware; ✅ `getBaseInfo` shape from `getCmdSyncRecdata` (appVersion is a string; firewareSpaceSize/versionString mutually exclusive); ✅ `getApi` full return-union table incl. OrderType bytes (`currentSystem` is a string, not number); ✅ `switchConfig` range 0–3 from param.ts enum comment (`hasFourConfig` hard-coded true); ✅ `setTopDeadSwitch` = raw byte, boolean decode → on/off switch. Batch 4b: ✅ `AXOSOME`/`CURRENT_AXOSOME` rows reworded — 轴体 (axis-body/switch-module) semantics from param.ts comments, gamepad framing removed (id-to-meaning still `[unverified]`, see §5.7) |
| §4 Calibration & travel matrix | Verified | src + bundle | 3 | ✅ `getRm6X21Travel` → `{status, travels}` and `getRm6X21Calibration` → `{travels, calibrations}` both confirmed in the bundle controller (façade-only aggregators; src has only `getRm6X21data`); decoder 0x03 → raw-byte chunks, 0x02/0x06 → 3×21 mm (÷1000) ✅; `RM6X21Pack` shape ✅ |
| §5.1 Global travel / dead band | Verified | src + bundle | 3 | ✅ `IDB` decodes u16 LE ÷1000 → mm (recdata.ts); `setDB` scales ×1000 at the façade, open-src `cmdDB` expects raw µm ✅; mm ranges still device-reported via PRECISION_STROKE |
| §5.2 Per-key touch mode | Verified | src + bundle, macro corroboration | 1, 3 | `Layout_Mode = (touchMode << 4) \| advancedKeyMode` ✅; `advancedKeyMode` id table verified; batch 3: `getLayoutModel` decode confirmed (high nibble → `touchMode` string via `KeyTouchMode`, low nibble → `advancedKeyMode` raw; unknown defaults to `"global"`) ✅ and `setPerformanceMode` returns the read-back object ✅ |
| §5.3 Single travel | Verified | src + bundle | 3, 5 | ✅ `getSingleTravel` returns a **string** (`.toFixed(decimal)`, u16 LE ÷1000, recdata.ts:380); `setSingleTravel` writes ×1000 via `cmdLayout` `Layout_DB0` and round-trips → fixed-decimal string, `decimal` defaults 2 in the bundle; mm range still `[unverified]` (device-reported via PRECISION_STROKE). Batch 5: old-doc "dual-purpose in RT mode" claim restored as *(inferred)* + hardware-checklist row — the wire write itself is mode-agnostic ✅ |
| §5.4 Rapid trigger | Verified | src + bundle | 3 | ✅ `getRtTravel` returns `{pressTravel, releaseTravel}` (two `cmdLayout` reads, `getRtTravelRecdata` ÷1000 mm); `setRtPressTravel` → `{pressTravel}`, `setRtReleaseTravel` → `{releaseTravel}`; write = `value*1000` on `Layout_RTP/RTR` ✅; mm ranges still `[unverified]` |
| §5.5 DP / DR | Verified | src + bundle | 3 | ✅ `getDpDr` returns **two values** as `{pressDead, releaseDead}` (two `cmdLayout` reads, `getDpDrRecdata` ÷1000 mm) — not a single number; `setDp`/`setDr` write ×1000 and echo back a single number ✅; ranges still `[unverified]` |
| §5.6 DKS / DB travel (per-layout) | Verified | src + bundle | 1, 3 | Batch 3: naming-trap note rewritten to match §6.1 — `getDksTravel` correctly reads DKS travel depths from `Layout_DB1`–3, and `getDksTravel` ≡ `getDbTravel` (byte-identical bundle impls) ✅; returns/echo shapes confirmed (`getDksTravelRecdata` ÷1000 mm); `value` mm ranges still `[unverified]` |
| §5.7 Axis | Verified | src + bundle + `src/` (app) | 3, 4b | ✅ `getAxis`/`setAxis` return `{axis: number}` — raw integer id, no ÷1000; `getAxisList` → `{hasAxisSetting: true, axisList: number[]}`, up to 8 BE u16 ids, `0xFFFF` sentinel, never returns `false` (recdata.ts:133). Batch 4b: ✅ "axis semantics" investigation — 轴体 = physical switch module per param.ts/performance.ts Chinese comments; zero `gamepad`/`joystick`/`analog` hits in src or any bundle; app renders no id labels (Debug page = raw JSON only). Id-to-meaning remains `[unverified]`; gamepad framing removed as unsupported |
| §6.0 `v` firmware-version gate | Verified | src + bundle | 1 | ✅ Which setters actually forward `v` traced through the compiled call chain; gate table confirmed |
| §6.1 DKS | Verified | src + bundle | 2, 5 | ✅ `Layout_DKS1–4` are **key codes** (unscaled 16-bit), depths live in `Layout_DB1–3` (mm) — terminology unified; `getDks` default `'Layout_DKS1'` ✅ from the bundle; `getDksAll` → `{dks1..dks4}` ✅ (façade-only, 4 sequential reads); `setAdvancedKeys` is the **SDK's** `ExportController.importConfig` path, not app code ✅; array lengths caller-determined ✅. Batch 5: `setAdvancedKeys` writes only **2 of 3** DB slots (`dbs = [1000*db, 1000*db2]`), leaving `Layout_DB3` stale — ✅ from source, surfaced as §14.9(c) + a Summary row. Remaining *(inferred)*: whether the firmware actually enforces the 4/4/3 slot convention |
| §6.2 TRPS | Verified | src + bundle | 2 | ✅ `getTrps(key, type)` has **no default** for `type` — omitting it yields `KeyLayout[undefined]` and a garbage read (silent, not a throw); `getTrpsAll` → `{trps1..trps4}` ✅ from the bundle (façade-only, 4 sequential reads); `{trps}` is a raw unscaled integer ✅. Remaining `[unverified]`: what TRPS values mean semantically and their valid range |
| §6.3 MT / TGL delay probe | Verified | src + bundle | 2 | ⚠️ **Corrected:** `getMtorTgl` reads `Layout_MTDelay` (19) and returns `raw * 10` — a **delay in ms**, *not* an MT/TGL discriminator; the old "call this before `getMT`/`getTGL`" advice is gone. MT vs TGL is distinguished by `advancedKeyMode` **3 vs 4** from `getPerformanceMode` (§5.2) / `advancedKeysSdkMap` ✅; wire unit 10 ms ✅ (×10 decode mirrors TGL's /10 encode). Remaining *(unverified)*: the delay's valid range |
| §6.4 MPT | Verified | src + bundle | 2 | ✅ `dks[]` = key codes (unscaled hi/lo), `dbs[]` = **mm** (×1000 write / ÷1000 read) — both old `[unverified]` comments were wrong; `MPTDataPack` takes **no `v`**, so no gate; read is hardcoded **3 dks + 3 dbs** while writes loop `.length` → read/write length asymmetry ✅; `setMpt` returns the decoded read-back, not an ack ✅. Remaining `[unverified]`: mm ranges, and whether the three depths are literally "dead bands" *(inferred)* |
| §6.5 MT | Verified | src + bundle | 2 | ⚠️ **Layers disagree:** protocol-keyboard's decoder is identity (`return data`), but sdk-keyboard's controller returns **`{dks1..dks4}`** from four `Layout_DKS*` reads — bundle wins ✅. `getMT` **never returns the delay** (use `getMtorTgl`) ✅; `dks` = unscaled 16-bit codes ✅; `delay` is **one raw byte**, no scaling → unit still *(unverified)*; the `v` gate is dead twice over (façade drops it, and `cmdMT` doesn't forward it to `MTDataPack`) ✅ |
| §6.6 TGL | Verified | src + bundle | 2 | ✅ `dks` is **one** key code (not an array), 16-bit hi/lo; `delay` is **ms** with a **10 ms wire unit** (`/10` write, `*10` read) → hard ceiling **2550 ms** and non-multiples of 10 are truncated; `setTGL` returns the decoded read-back ✅; both layers agree here (unlike MT); `v` gate dead (`cmdTGL` doesn't forward it) ✅. Remaining `[unverified]`: firmware-enforced minimum |
| §6.7 END | Verified | src + bundle | 2 | ✅ **`delay` is silently dropped unless `v >= 1.0.7`** — and the façade defaults `v` to `"1.0.5"`, so a bare `setEND({key, dks, delay})` writes no delay; three payload branches tabulated; `dks` unscaled 16-bit ✅; the decoder has **no `v` gate**, so on older firmware the decoded `delay` is meaningless ✅; read requests ignore `v` (`cmdEND` packs `{key, dks:0, delay:0}`) ✅; `setEND`/`setSocd`/`getSocd` are the **only** three façade methods exposing `v` (§6.0 corrected). Remaining *(unverified)*: `delay`'s **unit** — no scaling anywhere, so ms is unconfirmed |
| §6.8 SOCD | Verified | src + bundle | 2 | ✅ `v` selects the generation: `< 1.0.5` → V1 `[key, dks1, mode1, dks1, key, mode2]`; `'1.0.5'`/`'1.0.6'` → V2 shape (`delay` omitted); `>= 1.0.7` → V3 (+16-bit `delay`); read requests are just `[key]`. ⚠️ **Read/write mismatch:** at default `v = '1.0.5'` you write `{pos1,pos2,key1,key2,type,mode}` but read back `{pos,key,type,mode}` — `pos2`/`key2` discarded, `pos1`/`key1` renamed; **no V1 decode branch**, so V1 is write-only ✅. `setSocd`'s comma-operator version compare is a **no-op** plus a stray `console.log("111111", …)` ✅. Remaining `[unverified]`: `pos`/`type`/`mode` enumerations (no `SOCDPolicy` exported), `delay` unit |
| §6.9 RS | Verified | src + bundle | 2 | ✅ `RSModePack` → `[key, dks, dks, key]` (**one value duplicated**, `key` repeated as a terminator *(inferred)*); `getRsRecdata` → `{dks1, dks2}` reading **single bytes** at offsets 1–2 — so the 1-write/2-read asymmetry is a packer/decoder shape difference with byte-level correspondence, and **the two slots cannot be set independently**. RS is **byte-wide (0–255)** with no scaling, unlike every other advanced key ✅; **no `v` gate anywhere** ✅; `Layout_RS = 0x20` exists but is never used (RS bypasses `cmdLayout`) ✅; leftover `console.log` in both `cmdRS` and `getRsRecdata` ✅. Remaining `[unverified]`: what the byte means and whether the firmware treats offsets 1/2 as genuinely independent slots |
| §7 Macros | Verified | `protocol-keyboard/src` + bundle | 4, 5 | ✅ `MacroDataPack` per-action wire = `[keyCodeLE16, status<<24\|delay&0xffffff]` (delay is u24, top 4 bits = press/release prefix 1/8; src comment says "低12位" but mask is 24-bit); ✅ `MacroModePack` slot metadata = `[key, indexLE16, macroLen, mode, numLE16, delayLE24]`; ✅ `getMacro` returns full `{key,id,len,mode,num,delay}` decode (see §13.3); `MacroType.status` numeric-consumption confirmed consistent with §13.3. Batch 5: 64-action memo already present, labeled UI convention; the touchMode-clobber encoding is ✅ from bundle but its **runtime reset effect is hardware-pending** (checklist row + §14.9(a)) |
| §8 Lighting | Verified | `protocol-keyboard/src` + facade bundle | 4, 4c | Config shape and version gate confirmed; ✅ batch 4: `PRGBDatapack`/`SRGBDatapack` wire layout — speed/mode/luminance/sleepDelay/staticColor are raw bytes (0–255 wire range, no SDK clamp); ✅ `getPRGBRecdata` derives `type` from mode (0=static, 1–20=dynamic, >20=custom); ✅ `getSingleRGBRecdata` returns uppercase `{key,R,G,B}`. ✅ batch 4c: logo verified (`cmdLogoRGB` shares the main-RGB packer; `setLogoLighting` force-zeroes `staticColor` for `type:'dynamic'` and `mode` otherwise; `getLogoLighting` decodes with full `getPRGB` decoder + caches on `logoLight`); custom verified (`setCustomLighting` sends immediately per key, returns decoded `{key,R,G,B}`; `saveCustomLighting` = `{key:254,r:254,g:254,b:254}` sentinel; batch `RGBDataPack`/`cmdKRGB` unreachable from facade); `>= 1.0.9` `dynamicColorId` gate **present in the shipped bundle but unreachable via facade** (controller default `'1.0.7'`); ⚠️ on-disk `pack.ts` predates the gate — bundle wins, divergence documented in §8. Remaining `[unverified]`: hardware behaviour of logo/custom effects |
| §9 Export/import & firmware (intro) | Verified | sdk-keyboard bundle | 4b | ✅ batch 4b: `exportConfig` default filename `"keyboard_config.json"`, AES encrypt/decrypt with hard-coded key + Blob download / sync throw; `importConfig` full flow traced (read → parse → decrypt → flat → validate → `setImportData`), rejects on read/parse/validate, `setMacro` not awaited |
| §9.1 `KeyboardConfig` | Partial | `.d.ts` | —, 5 | Field list from declarations; which fields round-trip through hardware `[unverified]` — with one known exception: the `advancedKeys.dks` dead-band array does **not** fully round-trip on import (`Layout_DB3` left stale, §14.9(c)) |
| §9.2 `ConfigValidator` | Verified | empirical import test | — | ✅ Confirmed unreachable — see §13.4 |
| §9.3 Firmware update | Partial | sdk-keyboard bundle | 4b | ✅ batch 4b: `config` defaults `{ toBootDelay: 4000, writeDelay: 30, toAppDelay: 4000 }` read from bundle; full `updateDrive` flow traced (toBoot → re-init → run-mode check → 0xFF-pad to 512-multiple → sign/erase/write/CRC); bootloader bytes `KB2_BL_*` 0x08–0x0E confirmed in `constants/byte.ts`. Still Partial: never run on hardware |
| §10.1 What each package exports | Verified | `package.json` + disk | — | ✅ `exports` maps and on-disk file presence checked |
| §10.2 `constantsParam` | Verified | `constants/param.ts` | 1 | ✅ Enum values read from source |
| §10.3 `constants/byte.d.ts` | Verified | disk + `exports` map | 1 | ✅ Confirmed NOT exported; contents documented for reference only |
| §10.4 `types/interface.d.ts` | Verified | `protocol-keyboard/src/types/interface.ts` | 4b | ✅ batch 4b: all 23 interfaces + field names/types/optionality compared 1:1 against src (ISOCDModeV2/V3 fields all `number` per §13.3); source comments (ranges, mode values) captured in §10.4. Byte-level meaning of individual fields still hardware-dependent |
| §10.5 `protocol-keyboard` utils | Verified | `protocol-keyboard/src/utils/index.ts`, `utils/decimal.ts`, `constants/byte.ts`, controllers; send/receive path from bundles | 4c, 5 | ✅ Confirmed NOT exported. ✅ batch 5: `preciseCalculate` read from `src/utils/decimal.ts` — a thin `decimal.js` wrapper (`plus`/`minus`/`times`/`dividedBy` → `Number(toFixed(precision))`, default precision 3); recommendation changed from "reimplement" to "use `decimal.js` directly" (already a transitive dep). Full wire framing documented from readable source: 64-byte packets `[0x5C, len, cmd, crc, …payload, 0x00…]`, `len` = payload-only (callers pass `data.length`); "CRC" is an additive checksum seeded `0x35 + 0x5C + len + cmd + lastPayloadByte` gated on `0 < len ≤ 252`, and `computeCheckSum` is its receive mirror; `computeProtocolSlice` puts the 4-byte header only in packet 0; byte helpers (`computeHighLowByte` = LE, `bitReadWrite`, `getLightBitmap`, `compareVersions`) read from source. Send/receive path traced through both minified bundles (`DeviceBase.sendData` FIFO queue → `WebHIDService` → `InputReportManager`, report ID 0, 3 retries, timeout resolves `null`, `slice(4)` header strip except usagePage 0xFFB0, multi-response `DataView[]` unstripped + `flatMap`-then-`slice(4)` reassembly) |
| §10.6 `sdk-keyboard` internal helpers | Partial | `.d.ts`, bundle | 4b | Signatures verbatim; ✅ batch 4b: `sdkMap` values read from bundle (128 getCmd, 163 getKey, 171 defKey, 152 getSpecialSingleRGB, 153 getLogoRGB) + input-report dispatch (byte[2] → handler, `data.slice(4)`) documented; `blSignature`/CRC details not exercised |
| §10.7 `hid` types & enums | Verified | `.d.ts` + both bundles (hid traced fully) | 4b, 4c | `EVENT` string values verified; ✅ batch 4b: transport-event leakage through `XDKeyboard.on(name \| string)` confirmed. ✅ batch 4c: full event plumbing documented from both bundles — hid layer publishes `deviceStatus`/`deviceInfo`/`inputReport`/`error` (error never published — dead); `DeviceBase` re-tags `deviceInfo`, re-keys `inputReport` by byte[2] via `sdkMap` and re-emits on the decoded camelCase channel; plug/unplug arrives as `usbChange` from `UsbDetect`, not `deviceInfo`; `on`/`off` reverse-map names to numeric keys; facade `off(name)` always removes all handlers; `reconnection` resolves true/undefined (not void), `isReconnecting`-guarded; `GETDEVICEINFO`/`INPUTREPORT` enum values vestigial (never emitted). Bundle-only vs typed split documented |
| §11.1 `DeviceBase` | Partial | `.d.ts` + sdk bundle | 4b | ✅ batch 4b: command-queue drain loop verified (serialised flush, `slice(4)` header strip except usagePage 0xFFB0, multi-response queue re-kicks single queue); `destroy()` only stops USB monitoring — does **not** clear queues (earlier claim corrected); input-report dispatch byte[2]→`sdkMap`. `isUpgrading` guard still *(inferred)* from name |
| §11.2 `WebHIDService` | Partial | `.d.ts` + bundles | 4b | ✅ batch 4b: `devices()` requestDevice-fallback, `initAndConnectDevice` null paths, `reconnection` 100 ms close/re-tag/reopen sequence, `sendReportAndWaitResponse` signature verified; ⚠️ single-queue timeout/sendTime arg swap documented. Send/receive timing not measured on hardware |
| §11.3 `UsbDetect` | Partial | `.d.ts`, disk | — | `generateStableId` private ✅; stable-id format `[unverified]` |
| §11.4 Controller layer | Partial | `.d.ts` + facade/controller bundles | 2, 4b, 4c, 5 | Members not on `XDKeyboard` enumerated; batches 2/4b/4c verified several behaviours from the bundles (v-gate drops vs END/SOCD forwarding, `updateKey`→`setKey` rename, `updateDrive` flow, `exportEncryptedJSON` sync throw). Still Partial: controllers are **unreachable at runtime** (§13.4/§13.6), so none of the extra members has ever executed on hardware |
| §12.1 Wrapped methods (54) | App-layer | `src/services/KeyboardService.ts` | — | Call-site list, verified against `src/`, not the SDK |
| §12.2 Unwrapped methods (21) | App-layer | `src/services/KeyboardService.ts` | — | Absence of call sites confirmed by search |
| §12.3 Wrapper → SDK mapping | App-layer | `src/services/KeyboardService.ts` (line-cited) | — | Every row verified against `src/`; the off-by-one traps are app-boundary facts, not SDK facts |
| §12.4 App error-handling pattern | App-layer | `src/services/ExportService.ts`, `src/composables/useBatchProcessing.ts` | — | Carried from `SDK_REFERENCE.md`, corrected against `src/`: `retryWithBackoff` defaults (2 retries / 200 ms, linear) and the fact it retries only *thrown* errors, not returned `Error` instances; batch sizes 80/100 ms. The `updateBin`/`toBoot` rethrow claim is SDK-side (✅ §14.8). The `setSingleTravel` dual-purpose claim is **unverified** and moved to the [Hardware verification checklist](#hardware-verification-checklist) |
| §13.1 `VersionString` dangling type | Verified | recursive grep, all three packages | 1 | ✅ Confirmed no declaration exists anywhere; root cause traced to broken `types` entries |
| §13.2 No runtime range validation | Verified | bundle search | — | ✅ Searched for guards; none found |
| §13.3 Shapes elided by the `.d.ts` | Partial | `.d.ts` vs src | 1, 2, 4b | Register confirmed ✅ and the **listed shapes were verified in Batch 1**. Batch 2: ✅ SOCD `V1`/`V2`/`V3` payload shapes documented from `SOCDPack` source (§6.8). Batch 4b: ✅ `sdkMap` dispatch resolved — response byte[2] ids (`128`/`163`/`171`/`152`/`153`) are **input-report event ids → handler names**, not `Protocol` command bytes (§10.6). Remaining items are hardware/intent-only and indexed in the [Hardware verification checklist](#hardware-verification-checklist): the *semantic* meaning of those ids beyond their handler names, whether the SOCD V1-branch byte duplication is intentional or a packing bug, and firmware behaviour for out-of-range `advancedKeyMode` values (7, 10–15) |
| §13.4 Packaging defects | Verified | empirical Node import tests | 4b, 5 | ✅ Each claim tested by attempting the import and reading the error code. Batch 4b: ✅ corrected the `byte.d.ts` bullet — `param.ts` uses the same `Layout_` prefix and is the exported file, so `byte.d.ts` is not the source of the exported string unions. Batch 5: ✅ added the readable-`src/` mitigation note (16 `.ts` files, reference-only, not runtime-loadable) |
| §13.5 Gaps closed after first pass | Verified | disk + bundle greps | — | ✅ `hidv2.js` absence and path-import failure both confirmed |
| §13.6 Type-vs-runtime gap, generally | Partial | — | — | Interpretation built on §13.4/§13.5 evidence, not independently testable |
| §13.7 How `src/` imports these types | Verified | `src/` (three sites cited) | — | ✅ Import sites and their failure modes confirmed |
| §14 The 21 unwrapped SDK methods (+§14.9 cross-cutting gaps) | Verified | `.d.ts` + facade/controller bundle traces + `src/` for §14.9(a)/(c) | 4c, 5 | ✅ All 21 signatures re-verified verbatim against `index.d.ts` (incl. `updateBin` config shape, `toBoot`, `reconnection`). §14.9: (a) `setMacro` touchMode-clobber encoding ✅ from bundle, runtime effect hardware-pending; (b) `v`-gate unreachability ✅ from bundle (§6.0/§8); (c) 2-of-3 DB write ✅ from `setAdvancedKeys` source (§6.1). Implementations traced in the bundle for all functional groups: on/off/reconnection (§14.1), `setTopDeadSwitch` = ORDER_TYPE envelope write, `getSaturation` = `QUERY_LIGHT_FIX_RGB` read on InfoController, `setLightingSaturation` = `[68, …param, 0xff, 0xff]` payload (§14.2–14.3), `deleteKey` = single touch-mode-slot write `value = KeyTouchMode[mode] << 4` (§14.4), DKS/TRPS reads + `setDks` decode-reply pattern (§14.5), common "setters return the decoded read-back" pattern for all seven setters (§14.6), RS read packs `{key, dks: 0}` and set decodes reply (§14.7), `updateBin` rethrows + runtime ArrayBuffer check + fresh controller instance + `updateStatus` strings passed at runtime though absent from the type, `updateDrive` flow re-confirmed (§14.8). Remaining `[unverified]`: hardware behaviour of any of these (never exercised) |

Each verification batch must update its rows here.

---

## 1. Connection & lifecycle

Constructor:

```ts
constructor(options: DeviceInit)
```

| Param | Type | Description |
|---|---|---|
| `options` | `DeviceInit` | HID match config — see §10.7 for the full shape. |

`DeviceInit` (from `@sparklinkplayjoy/hid`):

```ts
interface DeviceInit {
  configs: DeviceInfo[];   // list of acceptable device descriptors to match against
  usage: number;           // HID usage to match
  usagePage: number[];     // HID usage pages to match
}

interface DeviceInfo {
  vendorId: number;
  productId?: number;
  usage: number;
  usagePage: number;
  productName?: string;
  protocol?: number;
}
```

The instance is built around a **singleton** `DeviceBase`, which itself wraps a singleton
`WebHIDService`. Constructing two `XDKeyboard` objects in one page therefore shares one
underlying HID service — this is why `DebugKeyboardService` in this repo uses a deliberately
separate instance and why the two connections can interfere.

### `getDevices`

```ts
getDevices: () => Promise<Device[]>
```

| | |
|---|---|
| **Params** | none |
| **Returns** | `Promise<Device[]>` — devices from `navigator.hid.getDevices()` filtered by the `usage`/`usagePage` lists in `DeviceInit`. **May prompt** (bundle-verified): if the filtered list is empty, the hid package's `devices()` falls back to `requestDevice()` → `navigator.hid.requestDevice({ filters: configs })`, which opens the browser chooser. |
| **Description** | Enumerates previously-permitted devices; falls back to the grant-prompt flow when nothing matches. ✅ verified in bundles (`DeviceBase.getDevices` → `WebHIDService.devices()`). |

`Device` (as built by `tagDevice` in the hid bundle):

```ts
type Device = DeviceInfo & {
  id: string;                                    // device's own id, or a generated one
  productName: string;
  data?: HIDDevice;                              // raw device, assigned at tagging time (before open)
  collections: ReadonlyArray<HIDCollectionInfo>;
}
```

### `init`

```ts
init: (id: string) => Promise<Device>
```

| | |
|---|---|
| **Params** | `id: string` — the stable device id from `getDevices()` / a connect event. |
| **Returns** | `Promise<Device \| null>` — ✅ verified in bundles. The `XDKeyboard` facade forwards straight to `DeviceBase.init(id)`, which stores the id and calls `WebHIDService.initAndConnectDevice(id)`. That resolves `null` (never rejects) when: the id is falsy, no tagged device exists for that id, the tagged entry has no raw `data`, or `device.open()` fails (open failure is caught and logged, returning `null`). |
| **Description** | Opens the already-known device and attaches the input-report listener. It does **not** run any handshake/SN/run-mode read and does **not** populate `baseInfo` — those come from separate calls (`getBaseInfo` etc.). |

Does **not** throw or reject on failure — callers must null-check the result.

### `on`

```ts
on: (eventName: EVENT | string, handler: EventHandler) => void
```

| | |
|---|---|
| **Params** | `eventName: EVENT \| string` — see the `EVENT` enum in §10.7. `handler: EventHandler` = `(...args: (object \| string \| number)[]) => void`. |
| **Returns** | `void` |
| **Description** | Subscribes to SDK events. ✅ verified in bundles: throws `Error("Handler must be a function")` for a non-function handler; the event name is normalized (enum value → key) and handlers accumulate per event in a `Map`. |

> **Not wrapped by this app.** `KeyboardService` registers raw
> `navigator.hid.addEventListener('connect' \| 'disconnect', …)` instead and never calls
> `on`/`off`/`reconnection`.

### `off`

```ts
off: (eventName: EVENT | string) => void
```

| | |
|---|---|
| **Params** | `eventName: EVENT \| string` |
| **Returns** | `void` |
| **Description** | Removes **all** handlers for that event (name normalized through the `sdkMap` value→key lookup, same as `on`). ✅ bundle-verified. |

Note the asymmetry: `DeviceBase.off(eventName, handler?)` accepts an optional single handler
(bundle-verified: with a handler it splices just that listener out of the array and deletes the
entry when empty; without one it deletes all), but `XDKeyboard.off` drops the second parameter,
so at the facade you cannot unsubscribe one listener only.

### `reconnection`

```ts
reconnection: (device: HIDDevice, id: string) => Promise<void>
```

| | |
|---|---|
| **Params** | `device: HIDDevice` — the raw WebHID device from the `connect` event. `id: string` — its stable id. |
| **Returns** | `Promise<void>` |
| **Description** | Re-attaches the SDK to a device that dropped and reappeared. ✅ verified in bundles: `DeviceBase.reconnection(device, id, isUpgrading)` → `WebHIDService.reconnection` closes the device, waits 100 ms, re-tags the device under `id` in the `hidDevices` map, then reopens it (skipping `open()` if already opened) and re-attaches the input-report listener. No handshake/SN read is re-run. Guarded by an `isReconnecting` flag (concurrent calls warn and no-op); errors are caught and logged, not thrown. `DeviceBase.reconnection` then resets both command queues (`isFlushing = false`). |

The third parameter `isUpgrading?: boolean` exists on `DeviceBase.reconnection` (when true, the
passed device replaces the service's current device first) but is **not** exposed on `XDKeyboard`,
which forwards only `(device, id)`.

---

## 2. Key mapping

The key model is **layout-addressed**: one physical key owns several independent `KeyLayout`
slots (Fn0–Fn3, DB0–DB3, Mode, DKS1–4, TRPS1–4, …), and every read/write targets a specific
slot. See §10.2 for the full `KeyLayout` enum.

### `defKey`

```ts
defKey: () => Promise<any>
```

| | |
|---|---|
| **Params** | none |
| **Returns** | `Promise<DefKeyValue>` *(inferred from `KeyController.getDefKey`)* where `DefKeyValue = [IDefKeyInfo[], IDefKeyInfo[]]`. |
| **Description** | Reads the factory physical key matrix — the base layout, before any remapping. |

```ts
interface IDefKeyInfo {
  keyValue: number;                 // hardware key id — this is what every other call takes
  location: { row: number; col: number };
}
```

The two array elements are the two row-groups returned by the device; this repo's
`useMappedKeyboard` composes them into `IDefKeyInfo[][]`.

### `getLayoutKeyInfo`

```ts
getLayoutKeyInfo: (params: Keys) => Promise<any>
```

| | |
|---|---|
| **Params** | `params: Keys` — the slots to read. |
| **Returns** | `Promise<Keys>` **✅ verified** — a **filtered** array decoded by `getFnLayoutKeyRecdata` (recdata.ts:294; same in bundle): entries are walked at a 4-byte stride, `key = data[i+1]`, `layout = data[i+2]`, `value = data[i+4]<<8 \| data[i+3]` (u16 LE), and an entry is **dropped** when `layout === 0xff`, `value === 0xffff`, or `key === 0`. So the reply can contain **fewer entries than you asked for** — match results back by `key`, don't index positionally. |
| **Description** | Batch-reads the current value of the requested key/layout slots. |

```ts
interface IKey { key: number; layout: number; value?: number }
type Keys = IKey[];
```

**Wire packing — ✅ verified** (`KeyDataPack`/`KeyLayoutDataPack`, pack.ts:59 & :71; identical in bundle). Each `IKey` is serialised as exactly **4 bytes**: `[key, layout, value & 0xff, (value >> 8) & 0xff]`. `value` is a **u16 little-endian**; a falsy `value` (`0`/`undefined`) writes `0x00 0x00`.

| Field | Width | Range / meaning |
|---|---|---|
| `key` | u8 | physical `keyValue` from `defKey()` — device-specific; pushed raw with **no clamp/validation** in src |
| `layout` | u8 | `KeyLayout` enum value, `0x00`–`0x20` (§10.2) |
| `value` | u16 LE | out-param on read; in-param on write. The mapped/trigger code for that slot. **No validation** — the SDK neither clamps nor range-checks it, so an out-of-range code is forwarded verbatim to firmware. |

### `setKey`

```ts
setKey: (params: Keys) => Promise<Keys>
```

| | |
|---|---|
| **Params** | `params: Keys` — slots to write, each with `value` set. |
| **Returns** | `Promise<Keys>` **✅ verified** — *not* a raw echo. The facade routes to `KeyController.updateKey`, which sends the write, throws `Error("No response received")` if the reply buffer is falsy, then decodes the response with the **same** `getFnLayoutKeyRecdata` filter as `getLayoutKeyInfo`. So the returned array can be shorter than the input (dropped `key===0` / `layout===0xff` / `value===0xffff` entries). |
| **Description** | Batch-writes key remappings. |

Backed by `KeyController.updateKey`, which packs via `KeyDataPack(param: Keys)`.
(`KeyLayoutDataPack(param: IKey)` is the single-key variant used by the layout/mode writes, not by `setKey`.)

> ⚠️ **Batching.** This repo must funnel bulk writes through
> `useBatchProcessing().processBatches` (80 keys/batch, 100 ms between batches). Passing a
> whole-keyboard `Keys` array in one call overloads the device.

### `deleteKey`

```ts
deleteKey: (key: number, mode: TouchModeType) => Promise<any>
```

| | |
|---|---|
| **Params** | `key: number` — physical key id. `mode: TouchModeType` = `'global' \| 'single' \| 'rt'`. |
| **Returns** | `Promise<any>` — the raw `sendData` result (errors are caught and **returned**, not thrown). |
| **Description** | **✅ verified from the bundle**: `deleteKey(key, mode)` sends `cmdLayout(false, { key, layout: 8 /* Layout_Mode */, value: KeyTouchMode[mode] << 4 })` — i.e. it writes the key's **mode slot** with `advancedKeyMode = 0` while keeping the touch-mode nibble. It clears *only* the advanced-key mode for that touch mode; per-key DKS/TRPS/DB values in their own layout slots are untouched. Matches the `value = mode<<4 \| advancedKeyMode` encoding in §6.6/§10.2 (`mode<<4` with the low nibble = 0 = normal). |

`TouchModeType` is `keyof typeof constantsParam.KeyTouchMode`, and
`KeyTouchMode { global = 0, single = 1, rt = 2 }` — so the string maps directly onto the
numeric mode the device stores.

> **Not wrapped by this app.**

---

## 3. Device info & system

### `getBaseInfo`

```ts
getBaseInfo: () => Promise<any>
```

| | |
|---|---|
| **Params** | none |
| **Returns** | `Promise<any>` — the sync record. Shape **✅ verified** (`getCmdSyncRecdata`, recdata.ts:21; identical in the sdk-keyboard bundle): |
| **Description** | Reads the device identity block established at handshake. |

```ts
{
  BoardID: number;              // u32 LE, bytes 1–5
  KeyboardLayout: number;       // single byte (data[4])
  KeyType: number;              // single byte (data[3])
  CustomerID: number;           // always 0 — never assigned ("暂时留空" in src)
  ProductionId: number;         // always 0 — never assigned
  KeyboardRunMode: number;      // single byte (data[7])
  KeyboardSN: string;           // utf-8, bytes 9–25 (16 bytes)
  firewareSpaceSize: number;    // sic — hardVersion * 256, ONLY when hardVersion >= 1000
  appVersion: string;           // decoded text, NOT a number — bytes 26–36 ("Boot…" → 26–37)
  appBuildDate: string;         // decoded text, bytes 43–54
  versionString: string;        // "Vx.y.z" from hardVersion, ONLY when hardVersion < 1000
}
```

`hardVersion` is the u16 LE at bytes 5–6. **`firewareSpaceSize` and `versionString` are mutually
exclusive**: firmware reports either a small version number (< 1000 → formatted into
`versionString`) or a storage size (≥ 1000 → ×256 into `firewareSpaceSize`); the other stays at
its `0`/`''` default.

### `getApi`

```ts
getApi: (param: ICmd) => Promise<any>
```

| | |
|---|---|
| **Params** | `param: ICmd` — generic command descriptor. |
| **Returns** | `Promise<any>` — the decoded reply, whose shape depends entirely on `type` (see the union below). |
| **Description** | **Escape hatch**: sends an arbitrary `OrderType` command and decodes the response. |

```ts
type cmdType = keyof typeof OrderType;
interface ICmd {
  type: cmdType;       // e.g. 'AXOSOME', 'ROES', 'CONFIG', 'KEYBOARD_NAME', …
  hArgs?: number[];    // extra payload bytes
  is8bit?: boolean;    // pack values as 8-bit instead of 16-bit
}
```

Return union **✅ verified** (`getCmdRecdata`, recdata.ts:81; identical in the compiled bundle).
The reply shape is selected by `data[1]` (the `OrderType` byte echoed back):

| `type` (OrderType) | Byte | Returns |
|---|---|---|
| `KEYBOARD_NAME` | 0x26 | `string` — utf-8 of bytes 2–34, NUL bytes filtered out |
| `PROTOCOL_VERSION` | 0x01 | `string` — `"v1.v2.v3"` assembled from nibbles |
| `PRECISION_STROKE` | 0x25 | `{ precision, decimalPlace, minTouchTravel, maxTouchTravel, VID, PID }` — µm values ÷1000 → mm; **`VID`/`PID` are always `0`** (declared but never assigned in src) |
| `ROES` | 0x50 | `number` — polling-rate index (see `setRateOfReturn` below) |
| `CONFIG` | 0x70 | `{ configID: number, hasFourConfig: true }` — `hasFourConfig` is hard-coded `true` |
| `AXOSOME` | 0x76 | `{ hasAxisSetting: true, axisList: number[] }` — up to 8 ids, each u16 **big-endian**, list stops at the `0xffff` terminator. The param.ts enum comment translates as *"query the axis-body (轴体) IDs the keyboard supports"* — 轴体 is the physical magnetic-switch module of a hall keyboard, **not** a gamepad axis (see §5.7 for the full evidence) |
| `CURRENT_AXOSOME` | 0x75 | `number` — current axis id, u16 LE. Enum comment: *"the keyboard's current axis body (轴体), s_arg = [uint16,uint]"* |
| `SET_WIN_MODEL` | 0x30 | `0` on success (`data[2] === 1`), otherwise `null` |
| `SET_MAC_MODEL` | 0x31 | `1` on success, otherwise `null` |
| `QUERY_WIN_MODEL` | 0x21 | `{ currentSystem: '' \| 'win' \| 'mac', hasWinMode: boolean }` |
| `QUERY_MAC_MODEL` | 0x22 | `{ currentSystem: 'mac' \| 'win', hasMacMode: boolean }` |
| `TOP_DEAD_SWITCH` | 0x34 | `boolean` — `data[2] !== 0` |
| `QUERY_LIGHT_FIX_RGB` | 0x44 | `{ r, g, b }` — raw bytes 2–4 |
| anything else | — | `null` |

> ⚠️ `currentSystem` is a **string** (`'win'`/`'mac'`/`''`), not a number — the earlier
> `.d.ts`-derived union that said `number` was wrong. Query decoders treat `data[2]` as
> `1` = that system, `0` = the other system, `0xff` = unsupported (`has*Mode: false`).

Verified from the minified bundle: `getAxisList = () => this.infoController.getApi({ type: "ORDER_TYPE_AXOSOME" })`
— i.e. `getAxisList` is just `getApi` with a fixed command type. (`ORDER_TYPE_AXOSOME` is the
bundle's internal key for `OrderType.AXOSOME`; the public enum member is `AXOSOME`.)

### `setRateOfReturn`

```ts
setRateOfReturn: (value: number) => Promise<number>
```

| | |
|---|---|
| **Params** | `value: number` — a **polling-rate index, NOT a rate in Hz.** The SDK does not validate or clamp it; the app validates `0`–`6` itself in `KeyboardService.setPollingRate`. Note `KeyboardConfig.system.rateOfReturn` is the persisted counterpart and holds the same index. |
| **Returns** | `Promise<number>` — the index actually applied. |
| **Description** | Sets the USB report rate, addressed by index. |

`InfoController.setRateOfReturn` is typed `Promise<any>`; `XDKeyboard` narrows it to `Promise<number>`.

**Index → Hz mapping** (app-verified on hardware, **not declared by the SDK** anywhere — neither
the `.d.ts` files nor the minified bundle contains these constants). Taken from
`POLLING_RATE_OPTIONS` in `src/App.vue`, which is the only source of this table in the codebase:

| Index | Rate |
|---|---|
| `0` | 8 kHz |
| `1` | 4 kHz |
| `2` | 2 kHz |
| `3` | 1 kHz |
| `4` | 500 Hz |
| `5` | 250 Hz |
| `6` | 125 Hz |

Index `0` is the *fastest* rate and `6` the slowest — the ordering is descending, so do not do
arithmetic on the index expecting Hz.

`getApi({ type: 'ORDER_TYPE_ROES' })` returns **the same index**, not Hz. `KeyboardService.getPollingRate`
is that call, and the value it returns indexes directly into the table above.

> ⚠️ This repo wraps the call in an operation-token + timeout state machine because the device
> re-enumerates on the bus when the rate changes.

### `switchConfig`

```ts
switchConfig: (config: number) => Promise<any>
```

| | |
|---|---|
| **Params** | `config: number` — profile index. **Range ✅ verified `0`–`3`**: the `OrderType.CONFIG` (0x70) enum comment in param.ts:39 declares `h_arg/s_arg = 0[配置1], 1[配置2], 2[配置3], 3[配置4]` (any other arg = query). `getApi({type:'CONFIG'})` returns `{ configID, hasFourConfig }`; note `hasFourConfig` is hard-coded `true` in the decoder, so it is *not* authoritative — trust `configID` for the active slot. |
| **Returns** | `Promise<any>` |
| **Description** | Switches the active on-board hardware profile. |

Emits `EVENT.SWITCHCONFIG` (`"switchConfig"`) on success.

### `switchSystemMode`

```ts
switchSystemMode: (value: 'win' | 'mac') => Promise<any>
```

| | |
|---|---|
| **Params** | `value: 'win' \| 'mac'` — literal union, compile-time enforced. |
| **Returns** | `Promise<any>` |
| **Description** | Switches the keymap between Windows and macOS layouts. |

Internally maps to `OrderType.SET_WIN_MODEL` (48) / `SET_MAC_MODEL` (49); queryable via
`QUERY_WIN_MODEL` (33) / `QUERY_MAC_MODEL` (34).

### `setTopDeadSwitch`

```ts
setTopDeadSwitch: (value: number) => Promise<boolean>
```

| | |
|---|---|
| **Params** | `value: number` — sent **verbatim as one hArgs byte** (`cmd({type:'ORDER_TYPE_TOP_DEAD_SWITCH', hArgs:[value]})` in the bundle); the SDK neither validates nor clamps it. Protocol-verified as a single raw byte (0–255); the *semantic* range is device-defined. Persisted counterpart: `KeyboardConfig.system.topDeadBandSwitch`. |
| **Returns** | `Promise<boolean>` — **✅ verified**: the reply goes through the same `getCmd`/`getCmdRecdata` decoder as the getter, whose `TOP_DEAD_SWITCH` branch is `return data[2] !== 0`. So this is a success/state flag, not an echo of `value`. |
| **Description** | Enables/sets the global top dead-band (the travel ignored at the top of the stroke). Given the boolean decode on both read and write, it behaves as an **on/off switch**, not a mm distance. |

Backed by `OrderType.TOP_DEAD_SWITCH` (52 = 0x34).

> **Not wrapped by this app.**

### `factoryDataReset`

```ts
factoryDataReset: () => Promise<any>
```

| | |
|---|---|
| **Params** | none |
| **Returns** | `Promise<any>` |
| **Description** | Restores all on-board settings to factory defaults. |

`OrderType.RESTORE_FACTORY_SETTINGS` (17). Destructive — wipes remaps, lighting, macros and
travel config. This repo guards it with an operation-token state machine.

---

## 4. Calibration & travel matrix

### `calibrationStart`

```ts
calibrationStart: () => Promise<any>
```

| | |
|---|---|
| **Params** | none |
| **Returns** | `Promise<any>` |
| **Description** | Begins magnet/sensor calibration. Keys must be untouched for the duration. |

`OrderType.START_CALIBRATION` (12).

### `calibrationEnd`

```ts
calibrationEnd: () => Promise<any>
```

| | |
|---|---|
| **Params** | none |
| **Returns** | `Promise<any>` |
| **Description** | Commits and ends calibration. |

`OrderType.CLOSE_CALIBRATION` (13). Must be paired with `calibrationStart`; skipping it leaves
the device in calibration mode. Related: `OrderType.CLEAR_CALIBRATION_DATA` (4).

### `getRm6X21Travel`

```ts
getRm6X21Travel: () => Promise<any>
```

| | |
|---|---|
| **Params** | none |
| **Returns** | `Promise<{ status: number[][]; travels: number[][] }>` — **✅ verified** in the bundle's `PerformanceController`: it calls `getRm6X21Travel03()` (→ `status`), then `getRm6X21Travel021()` and `getRm6X21Travel022()` (→ `travels: [...t021, ...t022]`). On failure resolves to the caught `Error`. |
| **Description** | Reads the 6×21 live travel matrix. |

**✅ verified** mechanics (bundle `PerformanceController` + `getRm6X21Recdata`,
`protocol-keyboard/src/utils/recdata.ts:490`). Each variant packs
`RM6X21Pack(matrix6x21, datatype)` (`pack.ts:316` → `[matrix6x21, datatype, ...random 0xFF]`),
collects **3 response packets** via `sendDataAndWaitMultiple(data, 3)`, strips the first 4 bytes,
then the decoder branches on the echoed matrix id (`data[1]`):

- `0x03` (variant `Travel03`): returns an array of raw 21-byte chunks — `number[][]` of **raw
  bytes 0–255**, loop terminated by two consecutive `0xFF`. This is the `status` field; it is
  *not* in mm.
- `0x02` / `0x06` (variants `Travel021/022/061/062`): returns a `3 × 21` `number[][]`; each cell
  is u16 LE ÷ 1000 via `preciseCalculate` → **mm at 3 decimals**. `datatype` (1 vs 2) selects the
  data set, not the decoding.

So `travels` = 3 rows from `021` + 3 rows from `022` = **6 rows × 21 columns in mm**.

`PerformanceController` exposes narrower variants — **these are not re-exported on `XDKeyboard`**:

```ts
getRm6X21Travel03():  Promise<number[][]>   // raw-byte status chunks (datatype 3)
getRm6X21Travel021(): Promise<number[][]>   // 3×21 mm travel rows
getRm6X21Travel022(): Promise<number[][]>   // 3×21 mm travel rows
getRm6X21Travel061(): Promise<number[][]>   // 3×21 mm calibration rows
getRm6X21Travel062(): Promise<number[][]>   // 3×21 mm calibration rows
```

> **Controller-layer difference.** The five variants and both aggregators
> (`getRm6X21Travel`, `getRm6X21Calibration`) exist **only in the compiled bundle**. The
> open-source `protocol-keyboard/src` `PerformanceController` has just the raw decoder wrapper
> `getRm6X21data(data) → getRm6X21Recdata(data)`; you pack `RM6X21Pack`, do the 3-packet
> multi-read, slice(4), and aggregate yourself.

Wire format is `IRM6X21Mode { matrix6x21: number; datatype: number }`, packed by `RM6X21Pack`.
Command byte `Protocol.KB2_CMD_RM6X21 = 18`.

### `getRm6X21Calibration`

```ts
getRm6X21Calibration: () => Promise<any>
```

| | |
|---|---|
| **Params** | none |
| **Returns** | `Promise<{ travels: number[][]; calibrations: number[][] } \| Error>` — **✅ verified** in the bundle's `PerformanceController.getRm6X21Calibration`: `travels` = `[...Travel021(), ...Travel022()]` (6×21 mm) and `calibrations` = `[...Travel061(), ...Travel062()]` (6×21 mm). This repo's wrapper narrows the fields to `number[]` — **the SDK fields are `number[][]`** (arrays of 21-value rows); flatten or index by row accordingly. |
| **Description** | Reads the calibration baseline matrix, used to render per-key calibration state. |

> Same controller-layer difference as `getRm6X21Travel`: this aggregator exists only in the
> bundle; the open-source src exposes no `getRm6X21Calibration`.

---

## 5. Performance & travel

All of these are `key: number` = the **physical** `keyValue` from `defKey()`, never a remapped
value. Travel distances are millimetres unless stated.

⚠️ **Range source.** The authoritative min/max live on the device, not in the SDK:
`getApi({type:'PRECISION_STROKE'})` returns
`{ precision, decimalPlace, minTouchTravel, maxTouchTravel, VID, PID }`. Read those before
clamping in the UI. All concrete numbers below are **[unverified]**.

### 5.1 Global travel / dead band

#### `getGlobalTouchTravel`

```ts
getGlobalTouchTravel: () => Promise<any>
```

| | |
|---|---|
| **Params** | none |
| **Returns** | `Promise<IDB>` — **✅ verified** (`PerformanceController.getGlobalTouchTravel` → `getGlobalTouchTravelRecdata`, `protocol-keyboard/src/utils/recdata.ts`): each field is a little-endian u16 at bytes 3–8 divided by `1000.0`, i.e. **millimetres with 3-decimal resolution** (device wire unit is µm). |
| **Description** | Reads the global actuation point and dead band applied to all keys. |

```ts
interface IDB {
  globalTouchTravel: number;   // global actuation depth, mm — decode ÷1000 ✅ verified
  pressDead: number;           // dead band on press, mm — decode ÷1000 ✅ verified
  releaseDead: number;         // dead band on release, mm — decode ÷1000 ✅ verified
}
```

Units are settled by the decoder; the *range* is still device-reported — clamp against
`minTouchTravel`/`maxTouchTravel` from `getApi({type:'PRECISION_STROKE'})`.

#### `setDB`

```ts
setDB: (param: IDB) => Promise<any>
```

| | |
|---|---|
| **Params** | `param: IDB` — all three fields required, in **mm**. **✅ verified**: the facade's `setDB` multiplies each field by 1000 before packing (`cmdDB(!1,{globalTouchTravel:1e3*t,pressDead:1e3*r,releaseDead:1e3*n})`), so the wire unit is µm and the caller passes mm. |
| **Returns** | `Promise<any>` |
| **Description** | Writes global actuation travel plus press/release dead bands. |

Command byte `Protocol.KB2_CMD_DB = 41`.

> **Controller-layer difference.** The ×1000 scaling lives in the bundle's `XDKeyboard.setDB` /
> controller `setDB`, not in `PerformanceController.cmdDB(isrw, IDB)` — the open-source `cmdDB` in
> protocol-keyboard/src hands the `IDB` fields straight to `DBDataPack` → `computeHighLowByte`
> (no scale) and expects raw wire integers (µm). Call `cmdDB` directly and you must pre-multiply
> by 1000 yourself.

### 5.2 Per-key touch mode

#### `getPerformanceMode`

```ts
getPerformanceMode: (key: number) => Promise<any>
```

| | |
|---|---|
| **Params** | `key: number` — physical key id. |
| **Returns** | `Promise<{ touchMode: string; advancedKeyMode: number } \| Error>` — **✅ verified** in the bundle's `getLayoutModel`: `touchMode` = the **high** nibble (`value >> 4 & 15`) mapped through `KeyTouchMode` (0→`"global"`, 1→`"single"`, 2→`"rt"`, anything else defaults to `"global"`); `advancedKeyMode` = the **low** nibble (`value & 15`), a raw number. On failure resolves to the caught `Error`. |
| **Description** | Reads which trigger mode a key is in and its advanced-key mode. |

Reads the `KeyLayout.Mode` (8) slot. `touchMode` is one of `'global' | 'single' | 'rt'`
(`KeyTouchMode` enum, `protocol-keyboard/src/constants/param.ts:75` ✅ verified). The nibble
packing matches the write side: `setPerformanceMode(key, touchMode, advancedKeyMode)` packs
`KeyTouchMode[touchMode] << 4 | advancedKeyMode`.

#### `setPerformanceMode`

```ts
setPerformanceMode: (key: number, mode: TouchModeType, advancedKeyMode: number) => Promise<any>
```

| | |
|---|---|
| **Params** | `key: number`. `mode: 'global' \| 'single' \| 'rt'`. `advancedKeyMode: number` — id of the enabled advanced feature. **Values verified** — see table below. **✅ verified** packing (bundle): `KeyTouchMode[mode] << 4 \| advancedKeyMode` written via `cmdLayout` on `Layout_Mode` (8). |
| **Returns** | `Promise<{ touchMode: string; advancedKeyMode: number } \| Error>` — **✅ verified**: returns the same `getLayoutModel` decode as `getPerformanceMode` (round-tripped read-back of the written slot). |
| **Description** | Sets a key's trigger mode and advanced-key mode. |

`KeyTouchMode` numeric mapping: `global = 0`, `single = 1`, `rt = 2`.

#### Layout_Mode encoding — **✅ verified**

The byte written to the `Layout_Mode` (8) slot is:

```
Layout_Mode byte = (touchMode << 4) | advancedKeyMode
```

Evidence, all cross-checked between `protocol-keyboard/src` and the compiled
`sdk-keyboard/dist/esm/index.js`:

- **Encoder**: `setPerformanceMode` compiles to `Qs[t] << 4 | r`, where `Qs` is the
  `KeyTouchMode` enum object (`global`→0, `single`→1, `rt`→2), `t` is the mode string and
  `r` is `advancedKeyMode`. So high nibble = touch mode, low nibble = advanced-key type.
- **Decoder**: `getPerformanceMode` reads `KeyLayout.Mode` and splits the byte back into
  `{ touchMode, advancedKeyMode }` via the same nibble boundaries.
- **Macro corroboration**: `setMacro` writes `(u << 4) | 6` to the `Layout_Mode` slot (§7),
  where `6` is the Macro advanced-key type below — the same encoding from a different call site.

#### advancedKeyMode values — **✅ verified**

From the compiled `advancedKeysSdkMap` in `sdk-keyboard/dist/esm/index.js`, which maps the number
to a setter method. Values 0 and 7 have **no entry** in the map:

| advancedKeyMode | Feature | Setter | Command byte (§10.3) | `KeyLayout` slot used |
|---|---|---|---|---|
| 0 | *(none / plain key)* | — | — | — |
| 1 | DKS | `setDks` | `KB2_CMD_DKS` = 0x26 | none for write; reads use `Layout_DKS1`–`DKS4` (9–12) |
| 2 | MPT | `setMpt` | `KB2_CMD_MPT` = 0x27 | none |
| 3 | MT | `setMT` | `KB2_CMD_MT` = 0x24 | none for write; `getMT` reads `Layout_DKS1`–`DKS4` |
| 4 | TGL | `setTGL` | `KB2_CMD_TGL` = 0x25 | none |
| 5 | END | `setEND` | `KB2_CMD_END` = 0x28 | none |
| 6 | Macro | `setMacro` | `KB2_CMD_MACRO` = 0x20, `KB2_CMD_MACRO_MODE` = 0x21 | `Layout_MacroAddr` (17), `Layout_MacroSize` (18) |
| 7 | *(unused — no map entry)* | — | — | — |
| 8 | SOCD | `setSocd` | `KB2_CMD_SOCD` = 0x2c | none |
| 9 | RS | `setRS` | `KB2_CMD_RS` = 0x2d | none — `Layout_RS` (32) exists in the enum but the SDK never reads or writes it |

There is no `Layout_MPT`, `Layout_TGL`, `Layout_END` or `Layout_SOCD` member in `KeyLayout`
(§10.2). **Writes and reads are not symmetric**: every advanced-key setter sends its own dedicated
`cmd*` command byte and lets the firmware hold the data, so no setter writes a `KeyLayout` slot.
The slot-based `cmdLayout` reads exist only for DKS-family values — `getDksAll`/`getMT` read
`Layout_DKS1`–`DKS4`, `getTrps`/`getTrpsAll` read `Layout_TRPS1`–`TRPS4` (13–16), and
`getMtorTgl` reads `Layout_MTDelay` (19). So `advancedKeyMode` is a *mode id*, never a slot index.

The low nibble gives 4 bits (0–15), so 8 and 9 fit; nothing above 15 is representable.
`getPerformanceMode` returns this same number, so a key in DKS mode reads back
`advancedKeyMode === 1`.

> **Unverified**: whether firmware accepts arbitrary/undefined values (e.g. 7, 10–15) or
> silently ignores them. No validation guards exist (§13.2), so an out-of-map value would be
> written to the wire as-is.

### 5.3 Single (absolute actuation) travel

#### `getSingleTravel`

```ts
getSingleTravel: (key: number, decimal?: number) => Promise<any>
```

| | |
|---|---|
| **Params** | `key: number`. `decimal?: number` — decimal places used to decode the fixed-point value. **Range [unverified]**: comes from the device's `decimalPlace` field via `PRECISION_STROKE`. |
| **Returns** | `Promise<any>` — actually a **string**. **✅ verified** (`getSingleTravelRecdata`, `protocol-keyboard/src/utils/recdata.ts:380`): `((data[4] << 8) \| data[3]) / 1000` then `.toFixed(decimal)`. Fixed string of `decimal` places, e.g. `"1.500"`. Compare with `===` on strings or `parseFloat` first. |
| **Description** | Reads a key's absolute actuation depth. |

#### `setSingleTravel`

```ts
setSingleTravel: (key: number, value: number, decimal?: number) => Promise<any>
```

| | |
|---|---|
| **Params** | `key: number`. `value: number` — travel in mm. **Range [unverified]**: `[minTouchTravel, maxTouchTravel]` from `PRECISION_STROKE`. `decimal?: number` — decimal places for the returned string (default `2` in the bundle). |
| **Returns** | `Promise<any>` — on success a **string**: **✅ verified** in the bundle, `setSingleTravel` writes `cmdLayout` (`Layout_DB0`, `value*1000`) and then round-trips through `getSingleTravel(response, decimal)`, so it resolves to the same fixed-decimal string (`"1.50"`) the getter returns. On failure it resolves to the caught `Error` (§13.2). |
| **Description** | Writes a key's absolute actuation depth. mm → wire µm (×1000), confirmed at the facade. |

Use exact decimal arithmetic (e.g. `decimal.js` — see §10.5) rather than raw float arithmetic — the device stores fixed-point.

### 5.4 Rapid trigger (RT)

#### `getRtTravel`

```ts
getRtTravel: (key: number) => Promise<any>
```

| | |
|---|---|
| **Params** | `key: number` |
| **Returns** | `Promise<any>` — an **object**, not a number. **✅ verified** in the bundle controller: two `cmdLayout` reads (`Layout_RTP`, `Layout_RTR`) decoded by `getRtTravelRecdata` (`recdata.ts:389`, u16 LE ÷1000 via `preciseCalculate`, so plain `number` mm at 3 d.p.) and returned as `{ pressTravel: number, releaseTravel: number }`. On failure resolves to the caught `Error`. |
| **Description** | Reads a key's rapid-trigger press/release sensitivity pair. |

Reads `KeyLayout.RTP` (20) and `RTR` (21) as two separate commands.

#### `setRtPressTravel`

```ts
setRtPressTravel: (key: number, value: number) => Promise<any>
```

| | |
|---|---|
| **Params** | `key: number`. `value: number` — press sensitivity, mm. **Range [unverified]**: device `minTouchTravel`–`maxTouchTravel`. **✅ verified** at the facade: written as `value*1000` (µm) via `cmdLayout` on `Layout_RTP`. |
| **Returns** | `Promise<any>` — **✅ verified**: an object `{ pressTravel: number }` (the written value echoed back through `getRtTravelRecdata`, mm at 3 d.p.). On failure resolves to the caught `Error`. |
| **Description** | Sets the downward travel required to re-trigger under rapid trigger. |

#### `setRtReleaseTravel`

```ts
setRtReleaseTravel: (key: number, value: number) => Promise<any>
```

| | |
|---|---|
| **Params** | `key: number`. `value: number` — release sensitivity, mm. **Range [unverified]** as above. **✅ verified** at the facade: written as `value*1000` (µm) via `cmdLayout` on `Layout_RTR`. |
| **Returns** | `Promise<any>` — **✅ verified**: an object `{ releaseTravel: number }` (the written value echoed back through `getRtTravelRecdata`, mm at 3 d.p.). On failure resolves to the caught `Error`. |
| **Description** | Sets the upward travel required to release under rapid trigger. |

There is **no** combined `setRtTravel` — press and release are two separate writes.
Enable/disable RT globally via `getApi` with `OrderType.ENABLE_RELATIVE_TRIGGER` (10) /
`TURN_OFF_RELATIVE_TRIGGER` (11).

### 5.5 DP / DR

#### `getDpDr`

```ts
getDpDr: (key: number) => Promise<any>
```

| | |
|---|---|
| **Params** | `key: number` |
| **Returns** | `Promise<any>` — an **object with two values**, not a single number. **✅ verified** in the bundle controller: it issues two `cmdLayout` reads (`Layout_DP`, `Layout_DR`) and returns `{ pressDead: number, releaseDead: number }`. Each decoder `getDpDrRecdata` (`recdata.ts:393`) is u16 LE ÷1000 → mm at 3 d.p. On failure resolves to the caught `Error`. |
| **Description** | Reads a key's DP (down-point / press) and DR (release) travel values. |

Reads `KeyLayout.DP` (22) and `DR` (23) as two separate commands.

#### `setDp`

```ts
setDp: (key: number, value: number) => Promise<any>
```

| | |
|---|---|
| **Params** | `key: number`. `value: number` — mm. **Range [unverified]**. **✅ verified** at the facade: written as `value*1000` (µm) via `cmdLayout` on `Layout_DP`. |
| **Returns** | `Promise<any>` — **✅ verified**: a single `number` (written value echoed back through `getDpDrRecdata`, mm). On failure resolves to the caught `Error`. |
| **Description** | Writes the DP travel value for a key. |

#### `setDr`

```ts
setDr: (key: number, value: number) => Promise<any>
```

| | |
|---|---|
| **Params** | `key: number`. `value: number` — mm. **Range [unverified]**. **✅ verified** at the facade: written as `value*1000` (µm) via `cmdLayout` on `Layout_DR`. |
| **Returns** | `Promise<any>` — **✅ verified**: a single `number` (written value echoed back through `getDpDrRecdata`, mm). On failure resolves to the caught `Error`. |
| **Description** | Writes the DR travel value for a key. |

### 5.6 DKS / DB travel (per-layout)

#### `getDksTravel`

```ts
getDksTravel: (key: number, dksLayout?: DksLayoutType) => Promise<any>
```

| | |
|---|---|
| **Params** | `key: number`. `dksLayout?: 'Layout_DB1' \| 'Layout_DB2' \| 'Layout_DB3'` — defaults to `Layout_DB1` **✅ verified** (the `.d.ts` elides the default, but the compiled implementation in `sdk-keyboard/dist/esm/index.js` is `async getDksTravel(e, t = "Layout_DB1")`). Note the layout union is `Layout_DB1`–`DB3` (`KeyLayout` enum `0x05`–`0x07`), **not** `DksType` `9`–`12`. |
| **Returns** | `Promise<number>` — **✅ verified** (`getDksTravelRecdata`, `recdata.ts`): u16 LE ÷ 1000 via `preciseCalculate` → mm at 3 d.p. On failure resolves to the caught `Error`. |
| **Description** | Reads the travel threshold stored in one DKS/DB layout slot. |

> **Naming, settled — see §6.1.** `getDksTravel` is **not** a misnomer and **not** a trap: it
> correctly reads the DKS **travel depths**, which the firmware stores in `Layout_DB1`–`DB3`
> (enum 5–7, mm). The DKS **key codes** live in `Layout_DKS1`–`DKS4` (9–12) and are read with
> `getDks`. Two things to keep straight:
>
> 1. The parameter is typed `DksLayoutType`, which despite the name is the **DB** union
>    (`Layout_DB1`–`Layout_DB3`) — *not* `DksType` (9–12). The type is what counts.
> 2. **`getDksTravel` and `getDbTravel` are two separately declared methods with byte-identical
>    bodies, not a single alias** — ✅ verified: each has its own declaration in the facade, the
>    controller, and the `.d.ts` (lines 41/43), and both impls are
>    `cmdLayout(true, {key, layout: KeyLayout[dbLayout ?? 'Layout_DB1']})`; the DB path reuses the
>    DKS decoder (no separate `getDbTravel` decoder exists). Likewise `setDksTravel`/`setDbTravel`
>    are two declarations with identical bodies (`cmdLayout(false, {…, value: value*1000})`). Pick
>    either — behaviorally identical; there is no separate "DB dead band" vs "DKS travel" storage.

#### `setDksTravel`

```ts
setDksTravel: (key: number, value: number, dksLayout?: DksLayoutType) => Promise<any>
```

| | |
|---|---|
| **Params** | `key: number`. `value: number` — mm, **range [unverified]**. `dksLayout?: DksLayoutType` (defaults `Layout_DB1` ✅ verified). Written as `value*1000` (µm) via `cmdLayout` ✅ verified. |
| **Returns** | `Promise<any>` — **✅ verified**: a single `number` (written value echoed back through `getDksTravelRecdata`, mm at 3 d.p.). |
| **Description** | Writes the travel threshold for one DKS/DB layout slot. |

#### `getDbTravel`

```ts
getDbTravel: (key: number, dbLayout?: DksLayoutType) => Promise<any>
```

| | |
|---|---|
| **Params** | `key: number`. `dbLayout?: 'Layout_DB1' \| 'Layout_DB2' \| 'Layout_DB3'` (defaults `Layout_DB1` ✅ verified). |
| **Returns** | `Promise<number>` — **✅ verified**: alias of `getDksTravel` (byte-identical bundle impl, `getDksTravelRecdata` decoder, mm at 3 d.p.). |
| **Description** | Reads the travel stored in a DB layout slot. |

#### `setDbTravel`

```ts
setDbTravel: (key: number, value: number, dbLayout?: DksLayoutType) => Promise<any>
```

| | |
|---|---|
| **Params** | `key: number`. `value: number` — mm, **range [unverified]**. `dbLayout?: DksLayoutType` (defaults `Layout_DB1` ✅ verified). Written as `value*1000` (µm) via `cmdLayout` ✅ verified. |
| **Returns** | `Promise<any>` — **✅ verified**: a single `number` (written value echoed back through `getDksTravelRecdata`, mm at 3 d.p.). |
| **Description** | Writes the travel for a DB layout slot. |

`getDbTravel`/`setDbTravel` and `getDksTravel`/`setDksTravel` share the same layout union and
overlap heavily; both are wrapped by this app, which defaults `dbLayout` to `'Layout_DB1'`.

### 5.7 Axis

#### `getAxisList`

```ts
getAxisList: () => Promise<any>
```

| | |
|---|---|
| **Params** | none |
| **Returns** | `Promise<any>` — `{ hasAxisSetting: true, axisList: number[] }`. **✅ verified** (`getApi`'s `ORDER_TYPE_AXOSOME` branch, `recdata.ts:133`): reads up to **8 big-endian u16 ids** from the response, stops at the first `0xFFFF` sentinel. `hasAxisSetting` is always literally `true` when this branch runs — a device without axis support simply fails/doesn't take this path; it does **not** return `hasAxisSetting: false`. On failure resolves to the caught `Error`. |
| **Description** | Reports which **axis-body (轴体) ids** the keyboard supports. See the semantics note below. |

**Verified from the minified bundle:**
`getAxisList = () => this.infoController.getApi({ type: "ORDER_TYPE_AXOSOME" })`.
It is *not* on `PerformanceController` — it delegates to `InfoController.getApi`.

#### `getAxis`

```ts
getAxis: (key: number) => Promise<any>
```

| | |
|---|---|
| **Params** | `key: number` |
| **Returns** | `Promise<{ axis: number }>` — **✅ verified** (`getAxisRecdata`, `recdata.ts:397`): reads `Layout_AXIS` via `cmdLayout`, returns `{ axis: (data[4] << 8) \| data[3] }`. The value is a **raw integer axis id** — no ÷1000 scaling. On failure resolves to the caught `Error`. |
| **Description** | Reads the axis-body id stored on a key's `Layout_AXIS` slot. See the semantics note below. |

Reads `KeyLayout.AXIS` (25).

#### `setAxis`

```ts
setAxis: (key: number, value: number) => Promise<any>
```

| | |
|---|---|
| **Params** | `key: number`. `value: number` — axis id. **Range [unverified]**: must be a member of `axisList` from `getAxisList()`. **✅ verified** at the facade: written **raw** (no ×1000 scaling, unlike travel values) via `cmdLayout` on `Layout_AXIS`. |
| **Returns** | `Promise<any>` — **✅ verified**: `{ axis: number }`, the written value echoed back through `getAxisRecdata`. On failure resolves to the caught `Error`. |
| **Description** | Writes an axis-body id onto a key's `Layout_AXIS` slot. See the semantics note below. |

Related `OrderType`s: `CURRENT_AXOSOME` (117), `AXOSOME` (118).

#### Axis semantics — what the ids mean **[id-to-meaning still unverified]**

Earlier revisions of this doc framed these methods as "analog gamepad axis / controller
emulation". That was an inference from the English naming (`AXOSOME` reads like "axis some",
`getAxis` like a gamepad axis). Re-investigation (batch 4b) finds **no evidence for the gamepad
framing**, and evidence against it:

- **SDK comments say 轴体 (zhóutǐ, "axis body")**, the Chinese term for the *physical magnetic
  switch module* of a hall-effect keyboard (the part you swap between linear/hall variants).
  `param.ts:40-41`: `ORDER_TYPE_CURRENT_AXOSOME = 0x75, // 当前键盘的轴体，s_arg = [uint16,uint]`
  ("the keyboard's current axis body") and `ORDER_TYPE_AXOSOME = 0x76, // 查询键盘支持的轴体ID`
  ("query the axis-body IDs the keyboard supports"). `param.ts:71`:
  `Layout_AXIS = 0x19, // 轴体切换层` ("axis-body switch layer"). The controller doc-comment for
  `getAxis` (`performance.ts`) is `@desc 获取轴体` ("get axis body").
- **No gamepad/analog HID mapping exists anywhere.** The strings `gamepad`, `joystick`, and
  `analog` appear zero times in `protocol-keyboard/src` and in all three compiled bundles.
  Nothing maps axis ids to named axes (LX/LY/RX/RY/triggers) or to any HID gamepad usage page.
- **The app does not interpret the ids either.** `src/pages/Debug.vue` dumps `getAxis` /
  `getAxisList` results as raw JSON only ("Axis Data" panel, `axisData: JSON.stringify(...)`);
  there are no labels, dropdowns, or named-axis lists anywhere in `src/`. `LayoutCreator.vue`
  merely persists `hasAxisSetting` as a boolean layout flag (`hasAxisList`); no page renders
  individual ids. `KeyboardService.setAxis`/`getAxisList` are thin passthroughs.

So: the ids are u16 opaque identifiers for switch-module types the keyboard supports; `AXOSOME`
lists the supported ones (≤8, `0xFFFF`-terminated), `CURRENT_AXOSOME` reports the active one, and
`Layout_AXIS` stores a per-key id. **What each numeric id corresponds to (which physical axis
type / calibration curve) is not settled by any source — [unverified].** Do not present these as
gamepad axes in UI copy without hardware confirmation.

---

## 6. Advanced keys

Each advanced feature is **activated** by setting the key's `advancedKeyMode` nibble in the
`Layout_Mode` slot via `setPerformanceMode` (§5.2), and its data is written with the feature's own
dedicated command byte from the non-exported `Protocol` enum (§10.3). Contrary to an earlier
reading of this section, the features do **not** each have their own `KeyLayout` slot — only the
DKS-family reads and macro address/size use slots (§5.2).

### 6.0 The `v` firmware-version gate — **✅ verified**

The `v?: string` parameter on several setters is a **firmware-version gate**: the packer emits a
different byte layout for newer firmware. Where it appears on the façade it is typed plain `string`;
the controller layer types it `VersionString`, which **has no declaration anywhere in the three
packages** — see §13.1. Gating uses `compareVersions(v, 'x.y.z')` and treats `'greater'`/`'equal'`
as "new enough".

**There are two layers, and they disagree.** App code calls the
public `XDKeyboard` **facade**; the facade delegates to `HigherKeyController` / `LightingController`,
which call the `cmd*` builders, which call the packers. `v` must survive **every** hop to reach a
packer — and in most cases it does not.

| Facade method (what app code calls) | Controller method | Does `v` reach the packer? | Effective payload |
|---|---|---|---|
| `setDks(e)` | `setDKS(e)` | **n/a** — neither layer takes `v` | Always the 1.0.5 layout: `[key, ...hi/lo(dks), ...trps, ...hi/lo(dbs)]` |
| `setMpt(e)` | `setMPT(e, v = '1.0.5')` → `cmdMPT(!1, e)` | ❌ **no** — dropped at *both* hops; `MPTDataPack` has no `v` param at all | `[key, ...hi/lo(dks), ...hi/lo(dbs*1000)]` |
| `setMT(e)` | `setMT(e, v = '1.0.5')` → `cmdMT(!1, e)` | ❌ **no** — dropped at both hops | Packer default 1.0.5 → `[key, ...hi/lo(dks), delay]` |
| `setTGL(e)` | `setTGL(e, v = '1.0.5')` → `cmdTGL(!1, e)` | ❌ **no** — dropped at both hops | Packer default 1.0.5 → `[key, ...hi/lo(dks), delay/10]` |
| `setMacro(param, macros, touchMode)` | `setMacro(e, t, r, v = '1.0.5')` | ❌ **no** — facade passes only 3 args; `cmdMacro`/`modeMacro` never receive `v` | Macro packs have no version gating whatsoever |
| `setRS(e)` | `setRS(e)` | **n/a** — neither layer takes `v` | Always `[key, dks, dks, key]` |
| `setEND(e, v = '1.0.5')` | `setEND(e, v = '1.0.5')` → `cmdEND(!1, e, v)` | ✅ **yes** | See gate table below |
| `setSocd(e, v = '1.0.5')` | `setSocd(e, v = '1.0.5')` → `cmdSOCD(!1, r, v)` | ✅ **yes** | See gate table below |
| `getSocd(key, v = '1.0.5')` | `getSocd(e, v = '1.0.5')` → `cmdSOCD(!0, e, v)` | ✅ **yes** (decode side) | See gate table below |
| `getLighting()` | `getLighting(v = '1.0.7')` → `cmdPRGB(...)` | ❌ **no** — facade takes zero args | Always `'1.0.7'` |
| `setLighting(cfg)` | `setLighting(e, v = '1.0.7')` → `cmdPRGB(e, t, r = '1.0.7')` | ❌ **no** — facade passes only `cfg` | Always `'1.0.7'` |

Note the facade's inconsistent casing: `setDks`, `setMpt`, but `setMT`, `setTGL`, `setEND`,
`setSocd`, `setRS`. The controller layer uses `setDKS`/`setMPT`/`getMPT`. Bind to the facade names.

**Real gates** — only the three ✅ rows above can actually reach them from app code:

| Packer | Condition | Bytes emitted |
|---|---|---|
| `ENDDataPack` | `v >= 1.0.7` | `[key, ...hi/lo(dks), ...hi/lo(delay)]` |
| | `1.0.5 <= v < 1.0.7` | `[key, ...hi/lo(dks)]` |
| | `v < 1.0.5` | `[key, dks]` |
| `SOCDPack` (write) | `v >= 1.0.7` | V3 + delay: `[pos1, pos2, ...hi/lo(key1), ...hi/lo(key2), type, mode, ...hi/lo(delay)]` |
| | `v` is `'1.0.5'` or `'1.0.6'` | V3: `[pos1, pos2, ...hi/lo(key1), ...hi/lo(key2), type, mode]` |
| | otherwise | V1: `[key, dks1, mode1, dks1, key, mode2]` |
| `getSocdData` (decode) | `v >= 1.0.7` | `{ pos1, pos2, key1, key2, type, mode, delay }` |
| | else | `{ pos, key, type, mode }` |
| `RGBDataPack` (lighting) | `v >= 1.0.9` | base bytes **plus** a trailing `dynamicColorId` byte — ⚠️ **unreachable** from the public API (see below) |
| | else | base bytes only — what actually happens, always |

Two `SOCDPack` details worth noting: the `'1.0.5'`/`'1.0.6'` branch is an **exact string match**
(not a range compare), so e.g. `'1.0.51'` would fall through to the legacy V1 shape; and the V1
branch returns `[key, dks1, mode1, dks1, key, mode2]` — `dks1` and `key` each appear twice, and
`mode1`/`mode2` sit in asymmetric positions. Whether that duplication is intentional or a packing
bug is [unverified]; the source carries no comment either way.

`RSModePack` and `MPTDataPack` have **no** `v` parameter in the protocol source, and `cmdRS` never
takes one — RS is version-independent, always `[key, dks, dks, key]`.

> **Source/bundle divergence:** `protocol-keyboard/src/controller/lighting.ts` declares
> `cmdPRGB(isrw, param?)` with **no** `v` parameter, but the shipped `sdk-keyboard` bundle compiles
> it as `cmdPRGB(e, t, r = '1.0.7')` and threads `v` into `RGBDataPack`. The readable source is
> therefore *behind* the bundle for lighting. Trust the bundle for the 1.0.9 gate — but note it is
> **moot in practice**, because the facade above it never supplies `v`.

> **The 1.0.9 lighting gate is dead code through the public API.** `getLighting=()=>this.lightingController.getLighting()`
> and `setLighting=e=>this.lightingController.setLighting(e)` pass no version argument, so the
> controller default `'1.0.7'` always wins and `dynamicColorId` is never appended. To exercise it you
> would have to reach past `XDKeyboard` into `lightingController` directly.

**Practical rule:** from app code, `v` is settable on exactly three methods — `setEND`, `setSocd`,
and `getSocd`. Everything else (DKS, MPT, MT, TGL, RS, macro, lighting) is pinned to its packer
default (`'1.0.5'`, or `'1.0.7'` for lighting) no matter what you do, so decode returned data
assuming 16-bit hi/lo pairs.

### 6.1 DKS (Dynamic Keystroke)

Four independent actuation points per key, so one physical press can emit up to four different
key codes at four different depths.

> **Terminology settled (item 3).** Three places in this section previously disagreed about what a
> `Layout_DKS1`–`DKS4` value *is* ("key codes at depths" in the intro, "actuation **points**" in the
> slot table, "actuation **depth**" under `getDks`). The source settles it: those slots hold **raw,
> unscaled 16-bit integers that are *not* travel values**, and the travel depths live elsewhere — in
> `Layout_DB1`–`DB3`, in mm (÷1000 on the wire). So "actuation depth" is **wrong** for `getDks`;
> "point"/"code" is right. Every mention below now says **key code**, with the depth-vs-code split
> called out explicitly. See the evidence note under the slot table.

> **Evidence source.** Unlike `sdk-keyboard`, the `protocol-keyboard` package ships **readable
> TypeScript source** at `node_modules/@sparklinkplayjoy/protocol-keyboard/src/` — notably
> `utils/recdata.ts` (decoders), `utils/pack.ts` (packers), `utils/decimal.ts` (`preciseCalculate`,
> built on decimal.js) and `constants/param.ts` (the `KeyLayout` enum). Everything in this section
> below was read from those files, not from a minified bundle, and is therefore **verified** unless
> explicitly marked *(inferred)*.

#### How DKS data is split across hardware slots

One key's DKS configuration lives in **three separate groups of `KeyLayout` slots**, each with its
own unit and its own reader. The enum values are verified from `constants/param.ts`:

| Slot group | Enum values | Holds | Read with | Decoder (verified) | Returns |
|---|---|---|---|---|---|
| `Layout_DKS1`–`Layout_DKS4` | `0x09`–`0x0C` (9–12) | The four **key codes** — raw 16-bit integers off the wire, *not* divided by anything; **not** depths | `getDks` / `getDksAll` | `getDksRecdata(data)` → `{ dks: (data[4]<<8) \| data[3] }` | raw `number` |
| `Layout_TRPS1`–`Layout_TRPS4` | `0x0D`–`0x10` (13–16) | The four TRPS values — raw integers | `getTrps` / `getTrpsAll` | `getTrpsRecdata(data)` → `{ trps: (data[4]<<8) \| data[3] }` | raw `number` |
| `Layout_DB1`–`Layout_DB3` | `0x05`–`0x07` (5–7) | **Travel depths in mm** | `getDksTravel` / `getDbTravel` | `getDksTravelRecdata(data)` → `preciseCalculate('divide', (data[4]<<8) \| data[3], 1000)` | **`number`** in mm, 3 d.p. |

> **Evidence for "key codes, not depths" — ✅ verified.** Neither the decoder nor the packer applies
> any scale to the `Layout_DKS*` values:
> `getDksRecdata(data)` returns `{ dks: (data[4]<<8) | data[3] }` — a bare 16-bit little-endian
> integer, with no `/1000` and no `preciseCalculate` call, unlike `getDksTravelRecdata` directly
> above it (`preciseCalculate('divide', value, 1000)` → mm).
> On the write side, `DKSDataPack(param, v='1.0.5')` (`utils/pack.ts:153`) emits
> `[key, ...computeHighLowByte(dks[i]), ...trps, ...computeHighLowByte(dbs[i])]` for `v === '1.0.5'`
> (and `[key, ...dks, ...trps, ...dbbits]` otherwise): the `dks` entries are split into hi/lo bytes
> **verbatim**, while only `dbs` goes through the mm→raw scaling path. A value that were a travel
> depth in mm would need the `/1000` decode and the `*1000` encode; the DKS slots have neither, so
> they carry key codes, and the depths live exclusively in `Layout_DB1`–`DB3`.

On the DB row's return type specifically: `preciseCalculate` is declared `=> number` and ends with
`return Number(result.toFixed(precision))` where `precision` defaults to `3` (`utils/decimal.ts`,
verified). So `getDksTravel` / `getDbTravel` resolve to a **number**, despite being built on
decimal.js — the `.toFixed()` inside is converted back before returning. **Contrast this with
`getSingleTravel`, which genuinely returns a string**: its decoder is
`getSingleTravelRecdata(data, decimal)` → `((data[4]<<8) | data[3]) / 1000.0` then `.toFixed(decimal)`
with no `Number()` wrapper. Anything comparing these two must handle one being a string.

Two consequences worth internalising:

1. **`getDksTravel` is the correct reader for the DB slots, not a misnomer.** The DKS *depths* are
   stored in `Layout_DB1`–`DB3`, and `getDksTravel` reads exactly those. Its Chinese doc comment in
   `controller/performance.ts` is "获取DKS行程" ("get DKS travel"), which matches. Do **not** treat
   `getDksTravel` as the wrong method for DKS — it and `getDks` read different slot groups, and you
   generally need both to reconstruct a key's DKS state.
2. **Units differ between the groups.** `Layout_DKS*` and `Layout_TRPS*` come back as raw integers
   (the decoders do no scaling). `Layout_DB*` come back divided by 1000 via `preciseCalculate`, i.e.
   in millimetres. Writing is the mirror image: `DKSDataPack` runs `dks` and `dbs` through
   `computeHighLowByte` but spreads `trps` **raw** (see below).

`Layout_DB0` (`0x04`) is a fourth, separate slot that is **not** part of the DKS triple: it is what
`setSingleTravel` writes, as `value * 1000`. Caveat on the citation: `Layout_DB0` is **declared** in
both `constants/byte.ts:43` and `constants/param.ts:51` but has **zero other references in
`protocol-keyboard/src`** — `controller/performance.ts` there exposes only *getters*
(`getSingleTravel`, `getDksTravel`, `getRtTravel`, `getDpDr`, …), no setters. The `Layout_DB0` writer
lives in the **compiled `sdk-keyboard` bundle**, where `setSingleTravel(e, t, r = 2)` does
`cmdLayout(!1, { key: e, layout: Layout_DB0, value: 1e3 * t })` and then **returns the readback**
`getSingleTravel(data, r)` — so `setSingleTravel` resolves to a **string** (`.toFixed(2)`), not a
void/ack. That is verified against the bundle, not against protocol src. `KeyLayout`
also places `Layout_MacroAddr` (`0x11`), `Layout_MacroSize` (`0x12`), `Layout_MTDelay` (`0x13`),
`Layout_RTP/RTR/DP/DR/KR` (`0x14`–`0x18`), `Layout_AXIS` (`0x19`) and `Layout_RS` (`0x20`) in the
same enum, so the DKS slots are not the whole address space.

**Array lengths are caller-determined — ✅ verified** (this reconciles an earlier *(unverified)*
marker here): `IDKSMode` declares `dks`, `trps` and `dbs` as bare `number[]` in
`types/interface.ts` with no length constraint, and `DKSDataPack` loops over `dks.length` /
`trps.length` / `dbs.length` rather than a constant. The `4 / 4 / 3` shape described below is a
**convention that mirrors the slot groups** (`Layout_DKS1–4`, `Layout_TRPS1–4`, `Layout_DB1–3`) —
it is what the firmware slots can hold, not a length the packer or the type enforces. See the
verified note under `setDks`.

#### `setDks`

```ts
setDks: (param: IDKSMode) => Promise<any>
```

| | |
|---|---|
| **Params** | `param: IDKSMode` |
| **Returns** | `Promise<any>` |
| **Description** | Writes all four DKS actuation points, TRPS points and dead bands for a key in one call. |

```ts
interface IDKSMode {
  key: number;        // physical key id
  dks: number[];      // actuation points → firmware Layout_DKS1–DKS4; length is caller-set
  trps: number[];     // TRPS values      → firmware Layout_TRPS1–TRPS4; length is caller-set
  dbs: number[];      // dead bands (mm)  → firmware Layout_DB1–DB3; length is caller-set
}
```

Packed by `DKSDataPack(param: IDKSMode, v?: string)` and sent as **one** `KB2_CMD_DKS = 38`
command; the firmware splits the arrays into the three slot groups internally (so `setDks` writes
no `KeyLayout` slot directly — see §5.2). Global enable/disable: `OrderType.OPEN_DKS` (5) /
`CLOSE_DKS` (6) via `getApi`.

> **Array lengths are caller-determined, not fixed — ✅ verified.** `DKSDataPack` loops
> `dks.length` / `trps.length` / `dbs.length`; nothing constrains them to 4 / 4 / 3. In the **SDK's**
> own import path — `ExportController.importConfig` calls `setAdvancedKeys` (this is SDK code, not
> this app's) — the DKS payload is built as
> `dks = getValues(cfg.dks)`, `trps = getValues(cfg.trps)` (`getValues` = `Object.entries(x).map(e => e[1])`,
> i.e. flatten an object's values into an array — so the caller's `dks`/`trps` are keyed objects, and
> their length is however many entries they carry), and
> **`dbs = [1000 * cfg.db, 1000 * cfg.db2]` — exactly 2 values** (from the `db` and `db2` fields,
> scaled ×1000 to the firmware's integer units). So an import via `setAdvancedKeys` populates
> `Layout_DB1` and `Layout_DB2` but **not** `Layout_DB3`, even though `getDksTravel`/`getDbTravel`
> can read all three DB slots (§5.6). Reading `Layout_DB3` after such an import returns whatever the
> firmware last held there, not a value the import wrote.

> **Naming inconsistency (verbatim from the SDK).** `XDKeyboard` exposes `setDks` (lowercase
> `ks`), but `HigherKeyController`'s method is `setDKS`. Both spellings exist.

> **Not wrapped by this app.** The app never calls `setDks`. `setAdvancedKeys`
> (`advancedType === 'dks'`) is the **SDK's** import path (`ExportController.importConfig` inside
> `sdk-keyboard`), not app code. The app only touches DKS data via `getDks` (read) and
> `getDksTravel`/`setDksTravel` (per-slot DB travel, §5.6).

#### Write/read asymmetry (reconciles §5.2, §5.6 and the slot table)

DKS is the one feature whose **write** and **read** paths use different mechanisms, which is the
root of the §5.6 "naming trap":

| Direction | Method | Wire mechanism | Slots touched |
|---|---|---|---|
| **Write (all)** | `setDks(IDKSMode)` | one `KB2_CMD_DKS` command carrying `dks[]`+`trps[]`+`dbs[]` | firmware fans out to `Layout_DKS*`, `Layout_TRPS*`, `Layout_DB*` |
| **Read DKS points** | `getDks` / `getDksAll` | `cmdLayout(true, Layout_DKS1…DKS4)` per slot | `Layout_DKS1`–`DKS4` (9–12) |
| **Read TRPS** | `getTrps` / `getTrpsAll` | `cmdLayout(true, Layout_TRPS1…TRPS4)` per slot | `Layout_TRPS1`–`TRPS4` (13–16) |
| **Read DB travel** | `getDksTravel` / `getDbTravel` | `cmdLayout(true, Layout_DBn)`, one slot | `Layout_DB1`–`DB3` (5–7), default `Layout_DB1` |

`getDksTravel` and `getDbTravel` are **two separately declared methods whose implementation bodies
are byte-for-byte identical** — each is declared independently in the facade, the controller, and the
`.d.ts` (lines 41/43); they are **not** one method exposed under two names. Both bodies do
`cmdLayout(true, { key, layout: KeyLayout[dbLayout ?? 'Layout_DB1'] })` and decode with the same
`getDksTravel` decoder (`((data[4]<<8)|data[3]) / 1000` → mm) — the DB path reuses the DKS decoder,
since no separate `getDbTravel` decoder exists. So they are not different readers, and they are
behaviorally identical. The DKS *actuation points* (`getDks`, raw integers) and the DKS *travel depths*
(`getDksTravel`, mm from the DB slots) are genuinely different data in different slots — hence the
§5.6 note that `getDksTravel` is the correct DB reader and **not** a misnomer for `getDks`.

#### `getDks`

```ts
getDks: (key: number, type?: DksType) => Promise<any>
```

| | |
|---|---|
| **Params** | `key: number`. `type?: 'Layout_DKS1' \| 'Layout_DKS2' \| 'Layout_DKS3' \| 'Layout_DKS4'` (enum 9–12) — which of the four points to read. **Default is `'Layout_DKS1'` — ✅ verified** in the bundle: both the façade and its controller declare `getDks(e, t = "Layout_DKS1")`, then `cmdLayout(true, { key, layout: KeyLayout[t] })`. (Earlier drafts marked this default `[unverified]`; the minified source settles it.) |
| **Returns** | `Promise<{ dks: number }>` — the raw 16-bit integer in that slot. On a transport error the controller's `catch` returns the `Error` itself, so check `instanceof Error`. |
| **Description** | Reads one DKS slot: the **key code** assigned to that actuation point (see the terminology note at the top of §6.1 — *not* a depth in mm; the depths are read with `getDksTravel`/`getDbTravel` from `Layout_DB1`–`DB3`). |

#### `getDksAll`

```ts
getDksAll: (key: number) => Promise<any>
```

| | |
|---|---|
| **Params** | `key: number` |
| **Returns** | `Promise<{ dks1: number; dks2: number; dks3: number; dks4: number }>` — **✅ verified in the bundle.** `protocol-keyboard/src` declares **no** `getDksAll` (verified: the class in `controller/higherKey.ts` has `getTrps`, `getDks`, `getMtorTgl`, … but no `*All` method), so this is a **façade-only aggregate** in `sdk-keyboard`. Its body reads `Layout_DKS1`–`DKS4` with four separate `cmdLayout(true, { key, layout })` sends, decodes each with the `getDks` decoder, and returns `{ dks1, dks2, dks3, dks4 }` — plain `number`s, **not** `{dks}` objects and **not** a `number[]`. On transport error the `catch` returns the `Error` itself. |
| **Description** | Reads all four DKS key codes. Note these are the raw `Layout_DKS*` integers (§ slot table above), **not** the mm depths in `Layout_DB*`. It is **four sequential HID round-trips**, not a single bulk read. |

> **Not wrapped by this app.**

### 6.2 TRPS

#### `getTrps`

```ts
getTrps: (key: number, type: TrpsLayoutType) => Promise<any>
```

| | |
|---|---|
| **Params** | `key: number`. `type: 'Layout_TRPS1' \| 'Layout_TRPS2' \| 'Layout_TRPS3' \| 'Layout_TRPS4'` (enum 13–16) — **required**, unlike `getDks`'s optional `type`. |
| **Returns** | `Promise<{ trps: number }>` *(from `HigherKeyController.getTrps(data): { trps: number }`)* |
| **Description** | Reads one TRPS value for a key. |

> **There is no default for `type` — ✅ verified, and omitting it reads a garbage slot.** Unlike
> `getDks` (which defaults to `'Layout_DKS1'`), the bundle body is
> `getTrps(e, t) { const layout = KeyLayout[t]; return sendData(cmdLayout(true, { key: e, layout })) }`
> with **no parameter default**. Passing `undefined` (or an unquoted slot name) makes `KeyLayout[t]`
> evaluate to `undefined`, so the outgoing `cmdLayout` payload carries no valid layout byte — the read
> targets whatever the firmware substitutes for a missing/zero slot field and returns a meaningless
> number rather than throwing. TypeScript catches this at compile time; plain-JS callers will not get
> an error, just wrong data. Always pass one of the four `'Layout_TRPSn'` strings.

> **Not wrapped by this app.**

#### `getTrpsAll`

```ts
getTrpsAll: (key: number) => Promise<any>
```

| | |
|---|---|
| **Params** | `key: number` |
| **Returns** | `Promise<{ trps1: number; trps2: number; trps3: number; trps4: number }>` — **✅ verified in the bundle.** Like `getDksAll`, `getTrpsAll` does not exist in `protocol-keyboard/src` (no `*All` method on `HigherKeyController`), so it is a façade-only aggregate. Its body issues four separate `cmdLayout(true, { key, layout: Layout_TRPS1…TRPS4 })` sends, decodes each with the `getTrps` decoder (`{ trps: (data[4]<<8) \| data[3] }`), and returns `{ trps1, trps2, trps3, trps4 }` — plain `number`s. On transport error the `catch` returns the `Error` itself. |
| **Description** | Reads all four TRPS values (`Layout_TRPS1`–`TRPS4`, raw integers). **Four sequential HID round-trips**, not one bulk read. |

There is **no** `setTrps` on any layer — TRPS values are written as part of `setDks`'s
`IDKSMode.trps` array.

> **Not wrapped by this app.**

### 6.3 MT / TGL delay probe

#### `getMtorTgl`

```ts
getMtorTgl: (key: number) => Promise<any>
```

| | |
|---|---|
| **Params** | `key: number` |
| **Returns** | `Promise<number>` — the key's **MT/TGL delay in milliseconds**. Decoder `getMtorTglRecdata(data)` returns `((data[4]<<8) \| data[3]) * 10`, i.e. a raw 16-bit little-endian value scaled **×10**. On transport error the `catch` returns the `Error` itself. |
| **Description** | Reads the shared MT/TGL delay slot for one key. |

> **Correction (item 5): this is *not* an MT-vs-TGL discriminator.** Earlier revisions of this doc
> claimed `getMtorTgl` "determines whether a key's mod-tap slot is configured as MT or TGL" and
> advised calling it before `getMT`/`getTGL` "to know which decoder applies". The source says
> otherwise — ✅ verified:
>
> - The bundle body is
>   `getMtorTgl(e) { const t = KeyLayout.Layout_MTDelay; … cmdLayout(true, { key: e, layout: t }) }`.
>   It reads the **`Layout_MTDelay` slot (enum value 19)** — a *delay* slot, not `Layout_Mode` (8).
>   Nothing about the read distinguishes a mode.
> - The decoder multiplies by 10 (`value * 10`), exactly mirroring `getTglRecdata`
>   (`{ dks, delay: delay * 10 }`) and `TGLDataPack`'s `delay / 10` write. The wire unit is **10 ms**;
>   the ×10 converts it back to milliseconds. A mode discriminator would return a small enum, not a
>   scaled 16-bit number.
> - "MtorTgl" parses as **"MT-or-TGL" delay** — the two modes share one delay slot, so one reader
>   serves both. It tells you *how long*, never *which mode*.
>
> **How MT vs TGL is actually distinguished:** from the key's **`advancedKeyMode` nibble**, not from
> `getMtorTgl`. `getLayoutModelRecdata` (recdata.ts:356) unpacks a 16-bit layout-model value as
> `touchValue = (value & 0xff) >> 4` and `advancedKeyValue = value & 0x0f`, returning
> `{ touchMode, advancedKeyMode }`. Through the façade that is **`getPerformanceMode(key)`** (§5.2).
> The nibble is the index into the SDK's `advancedKeysSdkMap`, where **`3` = MT and `4` = TGL**
> (full map: `1` DKS, `2` MPT, `3` MT, `4` TGL, `5` END, `6` Macro, `8` SOCD, `9` RS). The same
> nibble is written by `setPerformanceMode(key, touchMode, advancedKeyMode)` (§5.2) — that is what
> selects MT or TGL for a key, and `setMT`/`setTGL` then fill in that mode's parameters.
>
> The source itself flags this area as unfinished: `recdata.ts:376` carries
> `// TODO:高级键模式有宏、socd、rs、tgl、end、dks、mpt、mt` — *"TODO: the advanced-key modes are
> macro, socd, rs, tgl, end, dks, mpt, mt"* — and the `// 高级键` header at `pack.ts:150` means
> *"advanced keys"*.

Practical order of operations: call `getPerformanceMode(key)` to learn the mode (3 = MT → use
`getMT`; 4 = TGL → use `getTGL`), and use `getMtorTgl` only when you want the delay without
parsing either mode's full payload.

> **Not wrapped by this app.**

### 6.4 MPT

```ts
getMpt: (key: number) => Promise<any>
setMpt: (param: IMPTMode) => Promise<any>
```

```ts
interface IMPTMode {
  key: number;
  dks?: number[];    // key codes — raw 16-bit integers, written unscaled (✅ verified)
  dbs?: number[];    // depths in **mm** — written ×1000 to integer wire units, read ÷1000 (✅ verified)
}
```

| | `getMpt` | `setMpt` |
|---|---|---|
| **Params** | `key: number` | `param: IMPTMode` |
| **Returns** | `Promise<{ dks: number[]; dbs: number[] }>` — **always exactly 3 + 3 entries** (✅ verified, see below) | `Promise<{ dks: number[]; dbs: number[] }>` — the controller decodes the device's read-back with the *same* `getMptRecdata`, so a successful write returns the newly-stored config, not an ack |
| **Description** | Reads a key's MPT config. | Writes a key's MPT config. |

**Field semantics — ✅ verified from the packer/decoder.** `MPTDataPack(param)` (`utils/pack.ts:170`,
under the `// 高级键` = *"advanced keys"* header) is version-independent — it takes **no `v`**
parameter at all, so there is no gate to worry about:

```ts
for (let i = 0; i < dks.length; i++) dksbits.push(...computeHighLowByte(dks[i]));                    // unscaled
for (let i = 0; i < dbs.length; i++) dbbits.push(...computeHighLowByte(preciseCalculate('multiply', dbs[i], 1000)));
return [key, ...dksbits, ...dbbits];
```

- **`dks[]` = key codes**, each split into hi/lo bytes **verbatim** — no scaling, so they are plain
  16-bit code values (the same convention as `IDKSMode.dks` in §6.1).
- **`dbs[]` = depths in millimetres** on the app side, multiplied by 1000 to integer wire units and
  then split hi/lo. The decoder reverses exactly this:
  `preciseCalculate('divide', dbN, 1000)` → mm. The previous `// [unverified] actuation depths` and
  `// [unverified] dead bands` comments in this file were both wrong — `dks` is not a depth and `dbs`
  is not a unitless "band"; the ×1000/÷1000 pair is what makes `dbs` a millimetre quantity. (The
  `db` naming matches the `Layout_DB*` depth slots of §6.1; whether MPT's three depths are
  semantically "dead bands" or plain actuation depths is *(inferred)* — the source only fixes the
  scale, not the meaning.)

**Wire layout — ✅ verified.**

Write payload (one byte per element of the array shown): `[key, dks1_hi, dks1_lo, …, dbs1_hi, dbs1_lo, …]`

Read decode, `getMptRecdata(data)` (`utils/recdata.ts:417`) — **hardcoded to three of each**:

```ts
const dks1 = (data[3] << 8) | data[2];   const dks2 = (data[5] << 8) | data[4];   const dks3 = (data[7] << 8) | data[6];
const db1  = (data[9] << 8) | data[8];   const db2  = (data[11] << 8) | data[10]; const db3  = (data[13] << 8) | data[12];
return { dks: [dks1, dks2, dks3], dbs: [db1/1000, db2/1000, db3/1000] };  // via preciseCalculate
```

so `data[0]` is the command/status byte, `data[1]` the key, bytes 2–7 the three key codes and bytes
8–13 the three depths. `dbs` comes back in **mm** (float, 3 decimals), `dks` as raw integers.

**Read/write length asymmetry — ✅ verified.** The packer loops `dks.length` / `dbs.length`, so a
write may carry any number of entries; the decoder ignores length entirely and always returns
`3 + 3`. Writing 2 entries still reads back 3 slots — the third returns whatever the firmware last
held there. There is no `getMptAll`, no per-slot `type` parameter and no `Layout_MPT*` enum: MPT
uses its own command (`cmdMPT`) rather than the `cmdLayout` slot mechanism DKS/TRPS use.

Command byte `KB2_CMD_MPT = 39`; packed by `MPTDataPack`. Internally
`HigherKeyController.setMPT(param, v = '1.0.5')` *declares* the version gate (and the bundle even
leaves a stray `console.log("data", r)` in it), but **`XDKeyboard.setMpt` does not expose `v`** and
`MPTDataPack` never receives one — so the gate is inert for MPT.

> **`setMpt` is not wrapped by this app** (`getMpt` is). Note the capitalisation split again:
> `XDKeyboard.getMpt`/`setMpt` vs controller `getMPT`/`setMPT`.

### 6.5 MT (Mod-Tap)

```ts
getMT: (key: number) => Promise<any>
setMT: (param: IMTMode) => Promise<any>
```

```ts
interface IMTMode {
  key: number;
  dks: number[];    // key codes (16-bit, hi/lo split, unscaled) — ✅ verified
  delay: number;    // hold threshold, written as ONE raw byte — units still *(unverified)*
}
```

| | `getMT` | `setMT` |
|---|---|---|
| **Params** | `key: number` | `param: IMTMode` |
| **Returns** | `Promise<{ dks1: number; dks2: number; dks3: number; dks4: number }>` — **✅ verified in the bundle**, and **the delay is not returned** | `Promise<Uint8Array>` — **raw bytes**, not a parsed object (see below) |
| **Description** | Reads a key's four mod-tap key codes. | Writes a key's mod-tap config. |

**The two layers disagree here — ✅ verified.** `protocol-keyboard`'s `HigherKeyController.getMtRecdata`
delegates to `getMTRecdata(data)`, which is an **identity function** (`return data`) — so at that layer
an MT read yields the untouched `Uint8Array`. `sdk-keyboard` ships its **own** `HigherKeyController`
with a different `getMT` that never uses that decoder:

```js
async getMT(key) {                                   // Layout_DKS1..DKS4
  const cmd1 = cmdLayout(true, { key, layout: Layout_DKS1 });   // …and cmd2/cmd3/cmd4 for DKS2..4
  const r1 = await this.deviceBase.sendData(cmd1);              // sequential, not parallel
  const r2 = await this.deviceBase.sendData(cmd2);
  const r3 = await this.deviceBase.sendData(cmd3);
  const r4 = await this.deviceBase.sendData(cmd4);
  const [s, u, l, h] = [getDks(r1), getDks(r2), getDks(r3), getDks(r4)];  // getDksRecdata → { dks }
  return { dks1: s.dks, dks2: u.dks, dks3: l.dks, dks4: h.dks };
}
```

Since the façade (`XDKeyboard.getMT = e => this.higherKeyController.getMT(e)`) delegates to
`sdk-keyboard`'s controller, **the app sees the parsed `{dks1…dks4}` object**, and the bundle wins.

Two consequences worth internalising:

1. **MT's four key codes live in `Layout_DKS1`–`DKS4` (enum 9–12)** — the *same slots* DKS uses
   (§6.1). MT is not a separate storage region; it is a different interpretation of the DKS slots
   selected by `advancedKeyMode === 3`. Reads are therefore **four sequential HID round-trips**
   (awaited one after another, not `Promise.all`), identical in cost to `getDksAll`.
2. **`getMT` never reads the delay.** The delay lives in `Layout_MTDelay` (enum 19) and is reachable
   only via **`getMtorTgl`** (§6.3), which returns it in ms (`raw * 10`). So a full MT state requires
   two calls: `getMT(key)` + `getMtorTgl(key)`. This is exactly why `getMtorTgl` exists as a separate
   probe, and it confirms §6.3's correction — it is a *delay* reader, not a mode discriminator.

**Write shape — ✅ verified.** `MTDataPack(param, v = '1.0.5')` (`utils/pack.ts:183`):

```ts
if (v === '1.0.5') { dks.forEach(d => dbbits.push(...computeHighLowByte(d))); return [key, ...dbbits, delay]; }
return [key, ...dks, delay];   // single-byte dks path — unreachable, see below
```

- `dks` entries are 16-bit key codes split hi/lo, **unscaled** (same convention as `DKSDataPack`).
- `delay` is appended as **one raw byte** — no `/10` (unlike TGL), no `*1000` (unlike MPT/DB), so its
  unit is whatever the firmware assumes for a 0–255 counter. **Unit remains *(unverified)***; nothing
  in the source names it, and there is no matching decode to invert (the read side is the identity
  function at the protocol layer and ignores delay entirely at the sdk layer). Do not assume ms.

**The `v` gate is dead for MT — ✅ verified, at both layers.** `XDKeyboard.setMT = e => …setMT(e)`
passes only `param`, so the controller's `setMT(param, v = '1.0.5')` default applies; but even that
default is discarded one level down — `cmdMT(isrw, param)` calls **`MTDataPack(param)` with no `v`
argument**, so the packer's own `v = '1.0.5'` default is what runs. Passing a version string to
`setMT` would change nothing. (`cmdMT` also never zeroes the payload on a read, unlike `cmdTGL` and
`cmdEND` which pass `{ key, dks: 0, delay: 0 }` — moot in practice because the read path goes through
`cmdLayout`, not `cmdMT`.)

Command byte `KB2_CMD_MT = 36`; packed by `MTDataPack(param, v?)`.

> **`setMT` is not wrapped by this app** (`getMT` is).

### 6.6 TGL (Toggle)

```ts
getTGL: (key: number) => Promise<any>
setTGL: (param: ITGLMode) => Promise<any>
```

```ts
interface ITGLMode {
  key: number;
  dks?: number;     // ONE key code (singular — not an array like DKS/MPT), 16-bit hi/lo, unscaled
  delay?: number;   // ms on the app side; written as delay/10, read back as raw*10 → wire unit 10 ms
}
```

| | `getTGL` | `setTGL` |
|---|---|---|
| **Params** | `key: number` | `param: ITGLMode` |
| **Returns** | `Promise<{ dks: number; delay: number }>` — `delay` in **ms** (✅ verified) | `Promise<{ dks: number; delay: number }>` — the write is decoded with the *same* `getTglRecdata`, so a successful `setTGL` returns the stored config, not an ack |
| **Description** | Reads a key's toggle config. | Writes a key's toggle config. |

**Field semantics and units — ✅ verified.** `TGLDataPack(param, v = '1.0.5')` (`utils/pack.ts:196`):

```ts
if (v === '1.0.5') return [key, ...computeHighLowByte(dks), delay / 10];
return [key, dks, delay / 10];      // single-byte dks path — unreachable via the façade
```

`getTglRecdata(data)` (`utils/recdata.ts:436`):

```ts
const dks = (data[3] << 8) | data[2];   // 16-bit little-endian
const delay = data[4];                   // ONE byte
return { dks, delay: delay * 10 };
```

- **`dks` is a single key code**, not an array. The `1.0.5` branch splits it into two bytes at
  offsets 2–3, which is exactly what the decoder reassembles from `data[3]<<8 | data[2]`. Bytes 0–1
  are the command/status and key.
- **`delay` is milliseconds on the app side.** The packer divides by 10 before writing and the decoder
  multiplies by 10 after reading, so the **wire unit is 10 ms** and the single byte caps the value at
  `255 * 10 = 2550 ms`. That resolves the previous `ms [unverified]` marker: ms is right, with the
  2550 ms ceiling and 10 ms granularity as the practical constraints (a `delay` that is not a multiple
  of 10 is truncated by the division).
- Because `delay` occupies **one byte**, the two `v` branches differ only in how `dks` is encoded
  (hi/lo split vs raw byte). The façade drops `v` (§6.0), so only the `1.0.5` shape is ever produced
  in this app.

**`v` is dead for TGL too — ✅ verified.** `XDKeyboard.setTGL = e => …setTGL(e)` forwards only
`param`; the controller's `setTGL(param, v = '1.0.5')` default then reaches
`cmdTGL(isrw, param)` → `TGLDataPack(param)` — again with **no `v` passed through** — so the packer's
own `'1.0.5'` default applies. Same pattern as `cmdMT`.

Note `cmdTGL(true, …)` packs `{ key, dks: 0, delay: 0 }` for reads, so the read request never carries
stale values. Both layers use `cmdTGL`/`getTglData` identically here — **no façade/controller
disagreement for TGL**, unlike MT (§6.5).

Command byte `KB2_CMD_TGL = 37`; packed by `TGLDataPack(param, v?)`.

> **`setTGL` is not wrapped by this app** (`getTGL` is).

### 6.7 END

```ts
getEND: (key: number) => Promise<any>
setEND: (param: IEndMode, v?: string) => Promise<any>
```

```ts
interface IEndMode {
  key: number;
  dks?: number;      // ONE key code, 16-bit hi/lo, unscaled (✅ verified)
  delay?: number;    // 16-bit raw — NO scaling anywhere; unit *(unverified)*. Dropped unless v >= 1.0.7
}

// also declared in protocol-keyboard, but not used by setEND:
interface IEnd { keys: number; dks: number }
```

| | `getEND` | `setEND` |
|---|---|---|
| **Params** | `key: number` — **no `v`** on the façade | `param: IEndMode`, `v?: string` (firmware version gate; façade default `"1.0.5"`) |
| **Returns** | `Promise<{ dks: number; delay: number }>` — both raw integers | `Promise<{ dks: number; delay: number }>` — the write is decoded with the same `getEndRecdata`, so it returns the stored config rather than an ack |
| **Description** | Reads a key's END config. | Writes a key's END config. |

**The `v` gate decides whether `delay` is written at all — ✅ verified, and this is the single most
important fact in this section.** `ENDDataPack(param, v = '1.0.5')` (`utils/pack.ts:208`) has three
branches, using `compareVersions` with `['greater','equal']` meaning "new enough":

| `v` | Payload | `delay` on the wire? |
|---|---|---|
| `>= 1.0.7` | `[key, dks_hi, dks_lo, delay_hi, delay_lo]` | ✅ yes, 16-bit |
| `1.0.5` or `1.0.6` | `[key, dks_hi, dks_lo]` | ❌ **silently dropped** |
| `< 1.0.5` | `[key, dks]` (single byte each) | ❌ dropped |

Because the façade's `setEND` defaults `v` to `"1.0.5"`
(`setEND = (e, t = "1.0.5") => this.higherKeyController.setEND(e, t)` — ✅ verified), **calling
`setEND({ key, dks, delay })` without an explicit `v` throws `delay` away.** You must pass a `v` of
`'1.0.7'` or higher to store a delay. This asymmetry is invisible from the type signature alone —
`delay` is optional in `IEndMode`, so no compile error warns you.

**Read shape — ✅ verified.** `getEndRecdata(data)` (`utils/recdata.ts:442`):

```ts
const dks   = (data[3] << 8) | data[2];   // 16-bit little-endian
const delay = (data[5] << 8) | data[4];   // 16-bit little-endian
return { dks, delay };
```

The decoder **always** reads `delay` from bytes 4–5 with no version check, so it is symmetric with the
`>= 1.0.7` write branch only. On firmware older than 1.0.7 — or after a default-`v` write that omitted
`delay` — bytes 4–5 hold whatever the device returns for absent data, and the decoded `delay` is
meaningless. Unlike `getSocdRecdata`, there is no `v` parameter here to gate the read.

**Units — *(still unverified)*.** `delay` is written as `computeHighLowByte(delay)` and read back
verbatim: **no `/10` (TGL), no `*1000` (MPT/DB), no other scaling anywhere in the chain.** The source
names no unit, so the earlier `ms [unverified]` marker is downgraded to "unit unknown" rather than
confirmed — a 16-bit raw counter could be ms, but nothing in the code supports that. Note the
deliberate contrast with TGL, whose delay *is* provably 10 ms-per-unit via its `/10`–`*10` pair.
Hardware testing is required to settle it.

**The read request ignores `v` — ✅ verified.** `cmdEND(isrw, param, v = '1.0.5')` packs
`ENDDataPack({ key, dks: 0, delay: 0 })` on the read branch with **no `v` forwarded**, so every read
request is the fixed `[key, 0, 0]` shape; only the write branch uses `v`. Consequently
`XDKeyboard.getEND` correctly takes just `key` — there is no version-dependent read to select.

Command byte `KB2_CMD_END = 40`; packed by `ENDDataPack(param, v?)`.

> **Correction (item 6): `setEND` is *not* the only advanced-key setter that exposes `v` on
> `XDKeyboard`.** `setSocd` does too — and so does its reader, `getSocd`. The façade declaration
> file (`sdk-keyboard/dist/esm/index.d.ts`) is explicit:
>
> ```ts
> setEND:  (param: IEndMode, v?: string) => Promise<any>;
> getSocd: (key: number, v?: string) => Promise<any>;
> setSocd: (param: ISOCDMode | ISOCDModeV2 | ISOCDModeV3, v?: string) => Promise<any>;
> ```
>
> Exactly **three** façade methods carry the `v` gate: `setEND`, `setSocd`, `getSocd` (see §6.8 for
> which `v` selects which SOCD payload generation). All three genuinely forward it — ✅ verified in
> the bundle: `setEND = (e, t = "1.0.5") => this.higherKeyController.setEND(e, t)`, and likewise for
> `setSocd` / `getSocd` — and the controller then passes it into `cmdEND` / `cmdSOCD`.
>
> Every *other* advanced-key setter — `setDks`, `setMpt`, `setMT`, `setTGL`, `setRS`, `setMacro` —
> drops `v` at the façade, so its packer always takes the `v = '1.0.5'` default branch. Note the
> controller layer is inconsistent with itself here: `setMT`, `setTGL` and `setMPT` all declare
> `(param, v?)`, but the façade's arrow properties don't forward it, so the gate is unreachable for
> them. And for MT and TGL the gate is dead *twice over* — `cmdMT` / `cmdTGL` don't forward their own
> `v` into `MTDataPack` / `TGLDataPack` either (§6.5, §6.6).

> **`setEND` is not wrapped by this app** (`getEND` is).

### 6.8 SOCD

SOCD (Simultaneous Opposing Cardinal Directions) cleans up contradictory directional inputs.
Three payload generations coexist.

```ts
getSocd: (key: number, v?: string) => Promise<any>
setSocd: (param: ISOCDMode | ISOCDModeV2 | ISOCDModeV3, v?: string) => Promise<any>
```

```ts
interface ISOCDMode {          // V1 — used ONLY when v < 1.0.5
  key?: number;                // this key's code (written twice, see wire layout)
  dks1?: number;               // the paired key's code (single byte in the V1 shape)
  mode1?: number;              // single byte
  mode2?: number;              // single byte
}

interface ISOCDModeV2 {        // V2 — same wire branch as V3, minus delay
  pos1: number; pos2: number;  // single bytes: the two key positions
  key1: number; key2: number;  // 16-bit key codes, hi/lo split
  type: number; mode: number;  // single bytes
}

interface ISOCDModeV3 {        // V3 — V2 + a 16-bit delay
  pos1: number; pos2: number;
  key1: number; key2: number;
  type: number; mode: number;
  delay: number;               // raw 16-bit, NO scaling → unit *(unverified)*, like IEndMode.delay
}
```

| | `getSocd` | `setSocd` |
|---|---|---|
| **Params** | `key: number`, `v?: string` (default `"1.0.5"`, forwarded to both the packer and the decoder) | `param: ISOCDMode \| ISOCDModeV2 \| ISOCDModeV3`, `v?: string` (default `"1.0.5"`, forwarded) |
| **Returns** | `Promise<any>` — decoder `getSocdRecdata(data, v)` returns a **union**: `{ pos1, pos2, key1, key2, type, mode, delay }` when `v >= 1.0.7`, otherwise `{ pos, key, type, mode }` | `Promise<…>` — same union; `setSocd` decodes its own write response with `getSocdData(e, t)`, so it returns the stored config, not an ack |
| **Description** | Reads a key's SOCD config; the shape depends on `v`. | Writes a key's SOCD config for the payload generation matching `v`. |

**Which `v` selects which generation — ✅ verified.** `SOCDPack(param, v = '1.0.5', read = false)`
(`utils/pack.ts:228`) branches as follows:

| `v` | Write payload | Notes |
|---|---|---|
| `read === true` (any `v`) | `[key]` | the read request is just the key number; `v` is ignored on reads |
| `'1.0.5'`, `'1.0.6'` | `[pos1, pos2, key1_hi, key1_lo, key2_hi, key2_lo, type, mode]` | V2/V3 shape, **`delay` omitted** |
| `>= 1.0.7` | same as above **+ `[delay_hi, delay_lo]`** | full V3 shape |
| anything else (`< 1.0.5`, e.g. `'1.0.4'`) | `[key, dks1, mode1, dks1, key, mode2]` | **V1 shape** — reads from `ISOCDMode` |

So the `>= 1.0.7` test is `['greater','equal'].includes(compareVersions(v,'1.0.7'))`, and the
`1.0.5`/`1.0.6` case is an explicit string-list check. **V1 is reachable only by passing a version
*below* 1.0.5** — the default `'1.0.5'` never produces it. Note the guard
`['1.0.5','1.0.6'].includes(v) || isGreaterOrEqual107Tag` means any `v` ≥ 1.0.7 takes the V2/V3 branch,
while a `v` that `compareVersions` can't order (malformed) falls through to V1.

**The interface you pass does not choose the branch — `v` does.** There is no runtime discrimination
between `ISOCDModeV2` and `ISOCDModeV3`: both destructure the same
`{ pos1, pos2, key1, key2, type, mode, delay }` and the only difference is whether the `v >= 1.0.7`
test appends the two `delay` bytes. Passing a V3 object with `v = '1.0.5'` therefore **silently drops
`delay`**, exactly like `setEND`'s default (see §6.7).

**Read/write shape asymmetry — ✅ verified.** `getSocdRecdata(data, v = '1.0.5')`
(`utils/recdata.ts:449`, under the comment `// v3版本` = *"v3 version"* — note the comment labels only
the *new* branch, and sits on a decoder that has no V1 branch at all) computes `key1 = (data[4]<<8)|data[3]` and `key2 = (data[6]<<8)|data[5]`
unconditionally, then:

```ts
if (v >= 1.0.7) { const delay = (data[10]<<8)|data[9];
  return { pos1: data[1], pos2: data[2], key1, key2, type: data[7], mode: data[8], delay }; }
return { pos: data[1], key: key1, type: data[7], mode: data[8] };
```

Consequences worth knowing:

- **Only at `v >= 1.0.7` does the read shape mirror the write shape.** At `v = '1.0.5'` the device is
  *written* `{pos1, pos2, key1, key2, type, mode}` but *read back* as
  `{pos, key, type, mode}` — `pos2` and `key2` are decoded off the wire and then **discarded**, and
  `pos1`/`key1` are **renamed** to `pos`/`key`. Half the config is invisible to a default-`v` read.
- **There is no V1 decode branch at all.** Reading after a V1 write still takes the `else` path and
  yields `{pos, key, type, mode}`, which does not line up with the V1 `[key, dks1, mode1, dks1, key,
  mode2]` layout. V1 is effectively **write-only** through this SDK.
- The union has **no discriminant field**, so callers must branch on `'pos1' in result` vs `'pos'`.
  Simplest safe practice: always pass an explicit `v` matching the firmware and check for `pos1`.

**Field units.** `key1`/`key2` (and V1's `dks1`) are **key codes** — `key1`/`key2` are 16-bit hi/lo
split and unscaled, so they follow the same convention as `dks` everywhere else in §6. `pos1`/`pos2`,
`type` and `mode` are **single bytes** whose enumerations are *not* defined anywhere in
`protocol-keyboard/src` or the bundle (the façade `.d.ts` exports no `SOCDPolicy`/`SOCDType`), so
their exact meanings remain ***(unverified)***. `delay` is a raw 16-bit value with **no scaling on
either side** — the same open question as `IEndMode.delay`.

**Two pieces of dead code in the write path — ✅ verified, harmless but confusing.** The bundle's
`setSocd` contains

```js
const r = ((compareVersionsInline(t, "1.0.5"), e));   // comma operator → r is just `e`
console.log("111111", r);
```

The version comparison result is **thrown away** by the comma operator, so `r === param` and the call
behaves as if the comparison never happened; the `console.log` is leftover debug output that fires on
every `setSocd`. Neither affects the payload. (`protocol-keyboard`'s controller exposes only
`cmdSOCD`/`getSocdData` — the async wrapper with this quirk lives in `sdk-keyboard`'s controller.)

Command byte `KB2_CMD_SOCD = 44`; `OrderType.SOCD = 97`; packed by
`SOCDPack(param, v?, read?)`. The protocol layer additionally accepts a bare `number` as
`param` (`ISOCDMode | ISOCDModeV2 | ISOCDModeV3 | number`) — that overload exists for the
**read** case (`cmdSOCD(true, key, v)` → `[key]`); **`XDKeyboard.setSocd` does not** accept it.

> **`setSocd` is not wrapped by this app** (`getSocd` is).

### 6.9 RS

```ts
getRS: (key: number) => Promise<any>
setRS: (param: IRSMode) => Promise<any>
```

```ts
interface IRSMode {
  key: number;   // physical key id
  dks: number;   // ONE value — written twice on the wire; single byte, so 0–255 (✅ verified)
}
```

| | `getRS` | `setRS` |
|---|---|---|
| **Params** | `key: number` — the controller wraps it as `{ key, dks: 0 }` before packing | `param: IRSMode` |
| **Returns** | `Promise<{ dks1: number; dks2: number }>` — two **single-byte** integers | `Promise<{ dks1: number; dks2: number }>` — decoded with the *same* `getRsRecdata`, so a successful write returns the stored pair, not an ack |
| **Description** | Reads a key's RS config. | Writes a key's RS config. |

**Write shape — ✅ verified.** `RSModePack(param)` (`utils/pack.ts:252`) is the shortest packer in
§6 and has **no `v` parameter at all**:

```ts
const { key, dks } = param;
return [key, dks, dks, key];        // then cmdRS prepends the rw bit → [rw, key, dks, dks, key]
```

Two things stand out: the single `dks` is **duplicated** into positions 1 and 2, and `key` appears
**both first and last** (positions 0 and 3). Nothing in the source explains the trailing `key`; it is
almost certainly a terminator/checksum-ish field the firmware expects *(inferred)*.

**Read shape — ✅ verified.** `getRsRecdata(data)` (`utils/recdata.ts:461`):

```ts
console.log('data', data);
const dks1 = data[1];      // ONE byte each — no (data[n+1] << 8) hi/lo assembly
const dks2 = data[2];
return { dks1, dks2 };
```

**Explaining the one-write/two-read asymmetry.** Read and write are not actually mismatched in what
they touch — they line up byte-for-byte:

| Wire offset (after the `rw` byte) | Written by `RSModePack` | Read by `getRsRecdata` |
|---|---|---|
| 0 | `key` | — (ignored; command/status on a response) |
| 1 | `dks` | → `dks1` |
| 2 | `dks` (same value) | → `dks2` |
| 3 | `key` | — (ignored) |

So a write puts the **same value in the two slots that a read reports separately**, and a
`setRS` followed by `getRS` returns `{ dks1: dks, dks2: dks }`. The `1 → 2` count change is a
**packer/decoder shape difference, not lost data**: this SDK exposes two RS slots on the read side but
only one setter input on the write side, so **you cannot set `dks1` and `dks2` independently** — there
is no `IRSMode` field for the second one. Whether the firmware treats offsets 1 and 2 as two genuinely
independent slots (making RS a two-value feature this SDK under-exposes) or as one value mirrored for
protocol reasons is ***(inferred)*** — nothing in `protocol-keyboard/src` or the bundle settles it, and
no `setRS` variant takes two values.

**RS is byte-wide, not word-wide — ✅ verified.** Unlike every other advanced key in §6 (DKS codes,
MPT `dks`, MT `dks`, TGL `dks`, END `dks`/`delay`, SOCD `key1`/`key2`/`delay`), RS values are
**single bytes** on both sides: no `computeHighLowByte` in the packer, no `<< 8` in the decoder.
That caps RS at **0–255** with no scaling applied — no `/1000` (so *not* a millimetre depth) and no
`/10` or `*10` (so *not* a TGL-style delay). The unit/meaning of that byte is therefore ***(unverified)***;
the source names nothing beyond `dks`.

**No version gate anywhere — ✅ verified.** `RSModePack` takes no `v`; `cmdRS(isrw, param)` takes no
`v`; `XDKeyboard.setRS = e => this.higherKeyController.setRS(e)` and `getRS(e)` likewise. RS behaves
identically on every firmware version, so unlike END (§6.7) and SOCD (§6.8) there is no `v` to pass.

**Also note:** `Layout_RS = 0x20` (32) exists in the `KeyLayout` enum, but the RS command path never
uses it —
`cmdRS` packs `RSModePack(param)` directly rather than going through `cmdLayout`, so **no layout byte
is sent**. RS is a standalone command (`KB2_CMD_RS = 45`), not a `Layout_*` slot read. Contrast with
DKS/TRPS (§6.1–§6.2), which are `cmdLayout` slot reads.

**Console noise.** Both `cmdRS` (`console.log('rs', rs)`) and `getRsRecdata`
(`console.log('data', data)`) contain leftover debug logging, so **every RS call prints two lines**.
`KeyboardService` suppresses `console.error` around reconnects but not `console.log`; if RS calls ever
get wrapped, expect this output.

> **Neither `getRS` nor `setRS` is wrapped by this app.**

---

## 7. Macros

### `setMacro`

```ts
setMacro: (param: IMacroMode, macros: MacroType[], touchMode: string) => Promise<any>
```

| | |
|---|---|
| **Params** | `param: IMacroMode` — macro slot metadata. `macros: MacroType[]` — the key sequence. `touchMode: string` — **plain `string`, not `TouchModeType`**; see the value table below, which was recovered from the compiled implementation. |
| **Returns** | `Promise<any>` — the result of the final `modeMacro` write; errors are caught and **returned**, not thrown. |
| **Description** | Writes a macro sequence to a key's macro slot. Internally batches the sequence and issues several round trips — see below. |

#### How `setMacro` actually writes (verified from the compiled implementation)

The `.d.ts` hides all of this. Read out of `sdk-keyboard/dist/esm/index.js`:

- **Batch size is 9 actions per packet.** Three fixed 9-element buffers are allocated —
  `new Uint16Array(9)` for key codes, `new Array(9)` for statuses, `new Uint32Array(9)` for delays —
  zero-filled, then filled from `macros[]`. When the fill index reaches 9, the packet is sent
  immediately (`cmdMacro(!1, s - i, i, o, a, c)`) and the index resets. A trailing partial packet
  (`if (i > 0)`) is sent after the loop.
- **There is no 64-action limit in the SDK.** Nothing caps `macros.length`; a 40-action macro simply
  becomes 5 packets (9×4 + 4). Any "maximum 64 actions" figure is a **product/UI convention, not an
  SDK constraint**, and is not enforced here. If this app needs a cap it must impose it itself.
- **The write offset starts at 256**, not 0: the running counter `s` is initialised to `256` and
  incremented per action, so the first packet's `offset` argument is `256 - i` … i.e. the macro
  payload is stored from address 256 onward, with `Layout_MacroAddr` (`0x11`) recording position.
- **Each packet is awaited sequentially** (`await this.deviceBase.sendData(e)` inside the loop), so a
  long macro costs one round trip per 9 actions. Budget for that when scripting bulk macro writes —
  it interacts with the batch-processing rule in `CLAUDE.md`.
- **After the payload, a mode byte is written separately**: `u = 2` when `touchMode === 'quick'`,
  `u = 1` when `touchMode === 'single'`, and **`u = 0` for anything else**, then
  `value = (u << 4) | 6` is sent via `cmdLayout` to layout `8` (`Layout_Mode`, `0x08`). Finally
  `modeMacro(!1, key, index, len, mode, num, delay)` writes the slot metadata and its result is
  returned.

**`touchMode` accepted values — note the mismatch with `TouchModeType`.** The type alias is
`TouchModeType = keyof typeof KeyTouchMode`, and `KeyTouchMode` is
`{ global = 0x00, single = 0x01, rt = 0x02 }` (verified in `constants/param.ts`), i.e. the union
`'global' | 'single' | 'rt'`. But `setMacro` only ever compares against **`'quick'`** and
**`'single'`** — `'quick'` is not a member of `TouchModeType`, and `'global'` / `'rt'` silently fall
through to `u = 0` (identical to `'global'`). So the declared type and the implementation disagree:

| `touchMode` passed | `u` | Effect |
|---|---|---|
| `'quick'` | `2` | Distinct mode byte `(2 << 4) \| 6` — **only reachable via `setMacro`, not via `TouchModeType`** |
| `'single'` | `1` | Mode byte `(1 << 4) \| 6` |
| `'global'`, `'rt'`, anything else | `0` | Mode byte `(0 << 4) \| 6` — all collapse to the same value |

Since the parameter is typed as bare `string` on `XDKeyboard`, TypeScript will not catch a wrong
value. **This app calls `setMacro(param, macros)` with no third argument** (`KeyboardService.ts:538`),
so `touchMode` is `undefined` → `u = 0` in practice.

```ts
interface IMacroMode {
  key: number;      // physical key id
  index: number;    // macro slot index — wire width ✅ u16 LE (MacroModePack: `[key, indexLE16, …]`); semantic range [unverified]
  len: number;      // number of steps — ✅ single byte on wire
  mode: number;     // playback mode — ✅ single byte on wire; enum of values [unverified]
  num: number;      // repeat count — wire width ✅ u16 LE; semantics [unverified]
  delay: number;    // wire width ✅ u24 LE (3 bytes via computeHighLowByte ×3); unit/semantics [unverified]
}
// Wire shape ✅ verified against MacroModePack (pack.ts:297) and getModeMacro decode (§13.3).

type MacroType = {
  keyCode: number;        // HID usage code to emit (packed as u16, see MacroDataPack below)
  timeDifference: number; // delay for this step (packed into the low 24 bits of a u32 — values > 0xffffff truncate)
  status: string;         // ⚠️ typed `string` but consumed NUMERICALLY — see §13.3 (MacroType.status row):
                          //    the packer tests `keyStatus[i] === 0` → prefix 8 (release), non-zero → prefix 1 (press).
                          //    A string would never === 0, so every string collapses to "press".
                          //    This app converts explicitly: ExportService writes `status: m.status === 'press' ? 1 : 0`.
};
```

The packer signature reveals the on-wire encoding — **✅ verified in protocol-keyboard/src**
(`higherKey.ts:220/:236`, `pack.ts:257/:297`; bundle identical):

```ts
cmdMacro(isrw: boolean, offset: number, count: number,
         keyValues: Uint16Array, keyStatus: number[], delays: Uint32Array): Uint8Array
modeMacro(isrw: boolean, key: number, index?: number, macroLen?: number,
          mode?: number, num?: number, delay?: number)
MacroDataPack(offset, count, keyValues: Uint16Array, keyStatus: number[], delays: Uint32Array): number[]
MacroModePack(key, index, macroLen, mode, num, delay): number[]
```

**Per-action wire format** (`MacroDataPack`): payload = `[offsetLE16, count]`, then for each action
`[keyCodeLE16, status<<24 | (delay & 0xffffff)]` split as 4 LE bytes — i.e. **key codes are u16 LE**
and each **delay is a u32 whose top 4 bits hold the press/release status** (`prefix 1` = press,
`prefix 8` = release; `status === 0` selects 8) and whose low 24 bits hold the delay
(`delays[i] & 0x00ffffff` — the src comment says "低12位" but the mask is 24 bits).

**Slot-metadata wire format** (`MacroModePack`, pack.ts:297): `[key, indexLE16, macroLen, mode,
numLE16, delayLE24]` — each u16 via `computeHighLowByte` = `[low, high]`; `delay` is 3 bytes:
`computeHighLowByte(delay)` + `highByte16(delay)` (bits 16–23), i.e. u24 LE.

Command bytes `KB2_CMD_MACRO = 32`, `KB2_CMD_MACRO_MODE = 33`;
layouts `MacroAddr` (17), `MacroSize` (18), `MTDelay` (19).
`OrderType.ERASE_MACROSTORAGE` (16) wipes macro storage.

`HigherKeyController.setMacro` additionally takes `v?: string`; **`XDKeyboard.setMacro` does
not expose it.**

### `getMacro`

```ts
getMacro: (key: number) => Promise<any>
```

| | |
|---|---|
| **Params** | `key: number` |
| **Returns** | `Promise<any>` — **✅ verified** (per §13.3): the reply is decoded by `getModeMacro`/`getMacroRecdata` into 7 fields, all little-endian except the single bytes: `{ key: data[1], id: data[3]<<8\|data[2], len: data[4], mode: data[5], num: data[7]<<8\|data[6], delay: data[10]<<16\|data[9]<<8\|data[8] }`. |
| **Description** | Reads the macro-slot metadata bound to a key (`id` = slot index, `len` = step count, `mode`/`num`/`delay` = the fields written by `MacroModePack`). This call returns the slot **metadata only**, not the action sequence — the sequence lives in macro storage (written by `setMacro` from offset 256). |

---

## 8. Lighting

### Light config shape

```ts
interface ILightMode {
  open: boolean;          // master on/off — folded into the lightBitmap bitfield
  direction: boolean;     // animation direction — bitmap bit
  superResponse: boolean; // react to keypresses — bitmap bit
  speed: number;          // animation speed — ✅ raw byte on wire, 0–255 (no clamp in src)
  colors: string[];       // hex strings parsed with substring(1,3)/(3,5)/(5,7) — i.e. "#RRGGBB"
                          //   (leading '#' assumed); each colour → [b,g,r,0xff] on wire
  mode: number;           // effect id — ✅ raw byte on wire, 0–255 (no clamp in src)
  luminance: number;      // brightness — ✅ raw byte on wire, 0–255 (no clamp in src)
  sleepDelay: number;     // idle timeout — ✅ raw byte on wire, 0–255 (no clamp in src)
  staticColor: number;    // index into colors[] — ✅ raw byte on wire
  type?: LightModeType;   // 'static' | 'custom' | 'dynamic' — TS-side only, never packed
}

type LightModeType     = 'static' | 'custom'  | 'dynamic';
type LightLogoModeType = 'static' |            'dynamic';   // no 'custom' for the logo

// ILoGoLightMode has the same fields as ILightMode, typed with LightLogoModeType.
```

**✅ verified wire packing** (`PRGBDatapack` pack.ts:93 / `SRGBDatapack` pack.ts:112; bundle
identical): payload = `[4×0xff, per-colour b,g,r,0xff…, 4×0xff (+4 more for PRGB), lightBitmap,
luminance, mode, speed, sleepDelay, staticColor]`. The last five fields are each **one raw byte**
with no SDK-side clamping, so their wire range is **0–255** (whether firmware clamps further is
device-defined). `lightBitmap` folds `open`/`direction`/`superResponse` via `getLightBitmap`.
**Lighting mode ids: the SDK defines no mode-id enum anywhere in src** — `mode` is passed through
raw, so valid effect ids are device/firmware-specific.

The public setters take the **`open`-less** variants:

```ts
type LightModeConfigs     = Omit<ILightMode,     'open'>;
type LogoLightModeConfigs = Omit<ILoGoLightMode, 'open'>;
```

> ⚠️ `setLogoLighting` is the exception — it takes the **full** `ILoGoLightMode` including
> `open`, while `setLighting` takes `LightModeConfigs` without it. Use `closedLighting()` for
> the main light's off switch.

Raw wire shape (not needed unless you bypass the SDK):

```ts
interface IRGBDesc {
  lightColors: number[]; lightSwitch: number; reverseEffect: number;
  superResponse: number; lightLuminance: number; lightMode: number;
  lightSpeed: number; lightSleepDelay: number; color: number;
}
interface IKRGBDesc { key: number; r?: number; g?: number; b?: number }  // r/g/b 0–255 ✅ (SingleRGBDataPack raw bytes; getSingleRGBRecdata decodes uppercase R/G/B)
type KRGBDescs = IKRGBDesc[];
```

### `getLighting` / `setLighting`

```ts
getLighting: () => Promise<any>
setLighting: (lightModeConfig: LightModeConfigs) => Promise<any>
```

| | `getLighting` | `setLighting` |
|---|---|---|
| **Params** | none | `lightModeConfig: LightModeConfigs` — all fields required (`open` omitted) |
| **Returns** | `Promise<any>` — **✅ verified**: decoder `getPRGBRecdata` (recdata.ts:200, via `LightingController.getPRGB`) returns the **full `ILightMode`** incl. `open`, plus a **derived `type`** field: `mode===0 → 'static'`, `mode 1–20 → 'dynamic'`, `mode>20 → 'custom'` (matching the src comment `mode: 0 关闭, 1-20表示效果, 21 自定义` — **the SDK's own mode-id documentation**). Decodes exactly **7 colours** (4-byte `[B,G,R,0xff]` stride from offset 5 → `"#RRGGBB"`), then `data[37]`=bitmap (bit0 `open`, bit1 `direction`, bit4 `superResponse`), `[38]`=luminance, `[39]`=mode, `[40]`=speed, `[41]`=sleepDelay, `[42]`=staticColor. | `Promise<any>` |
| **Description** | Reads main RGB lighting config. | Writes main RGB lighting config. |

Command byte `KB2_CMD_PRGB = 24`.

> **Version gate not exposed.** `LightingController.getLighting(v?: VersionString)` and
> `setLighting(cfg, v?: VersionString)` accept a firmware-version argument; **`XDKeyboard`
> drops it** — the façade is `getLighting=()=>...getLighting()` / `setLighting=e=>...setLighting(e)`,
> so the controller default `'1.0.7'` always applies. It is *not* derived from the handshake, and
> there is no way to override it through the public API. Consequence: the `>= 1.0.9`
> `dynamicColorId` gate can never fire (§6.0).

### `getLogoLighting` / `setLogoLighting`

```ts
getLogoLighting: () => Promise<any>
setLogoLighting: (lightModeConfig: ILoGoLightMode) => Promise<any>
```

| | `getLogoLighting` | `setLogoLighting` |
|---|---|---|
| **Params** | none | `lightModeConfig: ILoGoLightMode` — **includes `open`** |
| **Returns** | `Promise<any>` — **✅ verified** (facade bundle): decodes the reply with the **same `getPRGB` decoder as `getLighting`** (full `ILightMode` incl. derived `type` and `dynamicColorId = data[43]`), and caches it on the controller's `logoLight` field before returning. | `Promise<any>` — resolves to the raw `sendData` result; on throw, returns the `Error`. |
| **Description** | Reads the logo LED config. | Writes the logo LED config. |

Command byte `KB2_CMD_LOGORGB = 25`; packed by `cmdLogoRGB(isrw, param: ILightMode)`.

**✅ Verified from source + facade bundle** (batch 4c):
- Wire format is identical to main RGB — `cmdLogoRGB` calls the same private `RGB()` packer as
  `cmdPRGB`, only the command byte differs (25 vs 24). `PRGBDatapack` builds the payload.
- **`setLogoLighting` has `type`-dependent mutation** (facade bundle): it destructures the config
  and **if `type === 'dynamic'` forces `staticColor = 0`, else forces `mode = 0`**. So passing
  `type: 'static'` (or omitting it) **zeroes the effect mode on the wire**, and `type: 'dynamic'`
  zeroes the static color. The mutated object is cached as `logoLight` and sent including `open`.
- `getLogoLighting` sends `cmdLogoRGB(true, this.light)` — the read flag with the *cached*
  config object as a payload template (the controller keeps `light`/`logoLight` state fields).

### `getCustomLighting` / `setCustomLighting` / `saveCustomLighting`

```ts
getCustomLighting: (key: number) => Promise<any>
setCustomLighting: (param: IKRGBDesc) => Promise<any>
saveCustomLighting: () => Promise<any>
```

| Method | Params | Returns | Description |
|---|---|---|---|
| `getCustomLighting` | `key: number` — **required on `XDKeyboard`**, optional (`key?: number`) on the controller | **✅ verified** — `getSingleRGBRecdata` (recdata.ts:309) returns `{ key: data[1], R: data[2], G: data[3], B: data[4] }`. ⚠️ Field names are **uppercase `R`/`G`/`B`**, not the lowercase `r`/`g`/`b` of `IKRGBDesc` — don't feed the result straight back into `setCustomLighting`. | Reads one key's custom RGB colour. |
| `setCustomLighting` | `param: IKRGBDesc` (`{key, r?, g?, b?}`; **✅ verified** — `SingleRGBDataPack` (pack.ts:130) pushes `[key]` then each channel as a raw byte **only when present** (`r || r === 0`), so `r`/`g`/`b` are 0–255 on the wire; an omitted channel is simply absent, shifting later bytes — always pass all three) | `Promise<any>` — **✅ verified** (facade bundle): sends immediately (`cmdSingleRGB(false, param)`, cmd byte `KB2_CMD_KRGB = 42`, payload `[rw, key, r?, g?, b?]`) and returns the **decoded reply** via `getSingleRGB` (`{key, R, G, B}` uppercase); on throw returns the `Error`. | Writes one key's custom colour immediately. |
| `saveCustomLighting` | none | `Promise<any>` — resolves `undefined` on success (facade bundle: awaits `sendData`, no return); returns the `Error` on throw. | **✅ verified**: sends the sentinel write `cmdSingleRGB(false, {key: 254, r: 254, g: 254, b: 254})` — key 254 with all channels 254 tells the firmware to commit. |

**`setCustomLighting` is a two-phase write**: N individual per-key KRGB writes, then one
`saveCustomLighting()` sentinel (key 254). Forgetting the save loses the colours. The batch
packer `RGBDataPack(descs: KRGBDescs)` (pack.ts:140 — `[key,r,g,b]×N`, source comment flags
the protocol as `TODO: 有点问题`) is used by controller-level `cmdKRGB`, which pads to a fixed
59-byte payload with `0xff`, but **no facade method exposes `cmdKRGB`** — the public path is
always per-key. All use command byte `KB2_CMD_KRGB = 42`.

**⚠️ Source/bundle divergence on `PRGBDatapack`** (batch 4c): the on-disk
`protocol-keyboard/src/utils/pack.ts` takes `(lightDesc)` only and has **no `dynamicColorId`
and no version parameter** — it is older than what the `sdk-keyboard` bundle inlines. The
bundle's packer is `(lightDesc, version = '1.0.7')`, destructures `dynamicColorId`, and
appends it when the version gate passes; the bundle's `getPRGB` decoder always reads
`dynamicColorId = data[43]`. **The bundle wins** — the §6.0/§10.4 notes about the
`>= 1.0.9` gate being unreachable through the facade (controller default `'1.0.7'`, version
arg dropped) stand, but the gate genuinely exists in the shipped code, not just in types.

### `getSpecialLighting` / `setSpecialLighting`

```ts
getSpecialLighting: () => Promise<any>
setSpecialLighting: (lightModeConfig: LightModeConfigs) => Promise<any>
```

| | `getSpecialLighting` | `setSpecialLighting` |
|---|---|---|
| **Params** | none | `lightModeConfig: LightModeConfigs` |
| **Returns** | `Promise<any>` — decoder `getSpecialSingleRGB(data): ILightMode` | `Promise<any>` |
| **Description** | Reads the "special"/secondary lighting zone. | Writes the "special"/secondary lighting zone. |

Packed by `cmdSRGB(isrw, param?: ILightMode)` (the `SRGB` private helper). This is a distinct
zone from both main and logo — `KeyboardConfig.light` models the three as
`{ main, logo, other }`.

### `getSaturation` / `setLightingSaturation`

```ts
getSaturation: () => Promise<any>
setLightingSaturation: (param: number[]) => Promise<any>
```

| | `getSaturation` | `setLightingSaturation` |
|---|---|---|
| **Params** | none | `param: number[]` — **✅ verified: this is the "fixed RGB" (`QUERY_LIGHT_FIX_RGB`, OrderType 0x44) triplet, not a generic per-zone saturation array.** The wire packet is `[0x44, ...param, 0xff, 0xff]` (`saturationDataPack` pack.ts:395 → `cmdRGBSaturation`), so `param` is written **verbatim as bytes** with no length check or clamp. Because the getter decodes exactly `data[2..4]` as `{r,g,b}` (§ getApi `QUERY_LIGHT_FIX_RGB` row), the meaningful **length is 3** and each value is a raw **0–255** byte. Passing more/fewer than 3 still gets forwarded — the SDK won't stop you. |
| **Returns** | `Promise<any>` — **✅ verified**: routes through `getCmdRecdata`'s `QUERY_LIGHT_FIX_RGB` (0x44) branch → `{ r, g, b }` (raw bytes 2–4). | `Promise<any>` — the raw `sendData` result (errors caught and returned). |
| **Description** | Reads the fixed-RGB correction triplet. | Writes it. (The `Saturation` name is the SDK's own label for the fixed-RGB channel.) |

`getSaturation` lives on `InfoController`, not `LightingController` — an organisational quirk of
the SDK. `setLightingSaturation` → `LightingController.cmdRGBSaturation`.

> **Neither `getSaturation` nor `setLightingSaturation` is wrapped by this app.**

### `closedLighting`

```ts
closedLighting: () => Promise<any>
```

| | |
|---|---|
| **Params** | none |
| **Returns** | `Promise<any>` |
| **Description** | Turns all lighting off. |

Preferred over `setLighting({...open:false})` — the latter is not typeable since
`LightModeConfigs` omits `open`.

---

## 9. Config import/export & firmware

### `exportConfig`

```ts
exportConfig: (data: any, filename?: string) => void
```

| | |
|---|---|
| **Params** | `data: any` — a `KeyboardConfig` object (§9.1). `filename?: string` — download name. **Default ✅ verified (bundle): `"keyboard_config.json"`** — `exportConfig=(e,t="keyboard_config.json")=>…`. |
| **Returns** | `void` — **synchronous signature**, and ✅ bundle-verified the delegate is sync too: `ExportController.exportEncryptedJSON(data, filename)` (the d.ts's `Promise<void>` is stale). Encryption/download failures surface as **synchronous throws** from the facade (`导出文件失败: …`), so wrap the call in try/catch — see §9.2. |
| **Description** | Serialises and downloads the full keyboard config as **encrypted** JSON. |

### `importConfig`

```ts
importConfig: (file: File) => Promise<ImportResult>
```

| | |
|---|---|
| **Params** | `file: File` — the browser `File` from an `<input type="file">`. |
| **Returns** | `Promise<ImportResult>` = `{ success: boolean; error?: string }` — **but it can also reject** (bundle-verified): read/parse/validate failures reject with `Error` (Chinese messages: `读取文件失败` "file read failed", `解析文件失败: …` "parse failed", `配置验证失败` "config validation failed"). Only write-stage failures resolve `{ success: false, error }`. Callers must handle both. |
| **Description** | Decrypts, validates and writes a config file to the device. |

The **only** `XDKeyboard` method with a properly typed result rather than `any`.

**Flow ✅ verified in the sdk-keyboard bundle** (`ExportController.importEncryptedJSON`):

1. `FileReader.readAsText(file)`.
2. `JSON.parse` the text; expect `{ data: <ciphertext> }`.
3. **AES-decrypt** with CryptoJS (`CryptoJS.AES.decrypt(s.data, key)` → UTF-8 string) using a
   hard-coded key `"fDPy6vvnpPsYm2T0g1bh"`; `JSON.parse` the plaintext into a `KeyboardConfig`.
4. If `keyboards` is an array of arrays, `.flat()` it.
5. Validate via `ConfigValidator.validateConfig` (`validateKeyboardConfig`); invalid → reject
   `Error("配置验证失败")` (the validator's own error is only `console.error`d).
6. `setImportData(config)` — resolves `{ success: true }`, or catches and resolves
   `{ success: false, error }`. Actual write order: **`setKeyboards` → `setLighting` (main,
   then logo) → `setSystem` → `setMacro`**. Note `setMacro` is fired **without `await`** —
   `{ success: true }` can resolve before macros are written.
   - `setKeyboards` iterates every key entry; per key it runs `setPerformance`,
     `setCustomLight`, `setCustomKeys`, `setAdvancedKeys`, each with its own `.catch` so one
     failure doesn't abort the rest (results collected via `Promise.allSettled` and logged).
   - `setLighting` maps the serialised form to wire form (`staticColors`→`colors`,
     `sleepTime`→`sleepDelay`, `dynamic`→`mode`, `superResponse: true` — §9.1 note).
7. `ExportController` also tracks a public `success: boolean` field and holds an
   `advancedKeysSdkMap`.

`exportConfig` symmetric side (`exportEncryptedJSON`, bundle-verified): AES-**encrypts** the
config with the same hard-coded key, wraps as `{ data: … }`, and triggers a Blob download via a
transient `<a download>` element. Throws synchronously (`导出文件失败: …`) on failure — so at the
`XDKeyboard` facade (which returns `void`) errors surface as sync throws, not swallowed promises.

### 9.1 `KeyboardConfig` — the export/import payload

From `sdk-keyboard/dist/esm/src/utils/validate.d.ts` (verbatim):

```ts
interface KeyboardConfig {
  light: { main: LightConfig; logo: LightConfig; other: LightConfig };
  keyboards: Keyboards[];
  macro: {
    list: Array<{
      date: string; id: number; name: string;
      step: Array<{ id: number; keyValue: number; status: number; delay: number }>;
    }>;
    v2list: any[];
  };
  system: {
    rateOfReturn: number;
    topDeadBandSwitch: number;
    productId: number;
    vendorId: number;
    keyboardName: string;
    usage: number;
    usagePage: number;
  };
  other?: any;
  version?: string;
  firmwareVersion?: string;
  protocolVersion?: string;
}

interface Keyboards {
  col: number;
  row: number;
  keyValue: number;
  performance: PerformanceConfig;
  advancedKeys: AdvancedKeyConfig;
  customKeys: CustomKeyConfig;
  light: KeyboardLightConfig;
}

interface PerformanceConfig {
  isGlobalTriggering: boolean;  globalTriggeringValue: number;
  isRt: boolean;
  isSingle: boolean;            singleTriggeringValue: number;
  rtPressValue: number;         rtReleaseValue: number;
  axisID: number;
  deadBandPressValue: number;   deadBandReleaseValue: number;
  advancedKeyMode: number;
}

interface AdvancedKeyConfig {
  advancedType?: string;  value?: number;
  dks?: any; mpt?: any; mt?: any; tgl?: any; end?: any; socd?: any; macro?: any;
}

interface CustomKeyConfig {
  fn0: { keyValue: number; bindKeyValue: number } | null;
  fn1: { keyValue: number; bindKeyValue: number } | null;
  fn2: { keyValue: number; bindKeyValue: number } | null;
  fn3: { keyValue: number; bindKeyValue: number } | null;
}

interface KeyboardLightConfig { custom: { R: number; G: number; B: number; key: number } }

interface LightConfig {
  open: boolean;
  mode: LightModeType;          // 'static' | 'custom' | 'dynamic'
  staticColors: string[];
  selectStaticColor: number;
  luminance: number;  speed: number;  sleepTime: number;
  direction: boolean;  dynamic: number;
}
```

Note `LightConfig` is the **serialised** form and differs from `ILightMode` (the wire form):
`staticColors`/`selectStaticColor`/`sleepTime`/`dynamic` vs `colors`/`staticColor`/
`sleepDelay`. `ExportController` maps between them.

### 9.2 `ConfigValidator`

```ts
class ConfigValidator {
  static validateConfig(config: KeyboardConfig): { isValid: boolean; error?: string };
  // private static: validateLightConfig, validatePerformance, validateAdvancedKey,
  //                 validateCustomKey, validateKeyboards
}
```

**This is the only place in all three packages that actually validates values.** It is exported
from `src/utils/validate.d.ts` but is **not re-exported from the package root**, so it is not
importable as `@sparklinkplayjoy/sdk-keyboard`.

**It is not loadable by deep import either** — a *runtime* import of that path is rejected.
`sdk-keyboard`'s `exports` map is a bare conditional object with **no `.` key and no subpath
wildcard**:

```json
"exports": { "import": "./dist/esm/index.js", "require": "./dist/cjs/index.js" }
```

Under Node's exports resolution this blocks *every* subpath — importing
`@sparklinkplayjoy/sdk-keyboard/dist/esm/src/utils/validate` fails with `ERR_PACKAGE_PATH_NOT_EXPORTED`
(verified empirically, §13.4).

Bypassing `exports` would not help. `dist/esm/src/utils/` contains only `index.d.ts` and
`validate.d.ts` — **there is no `validate.js`**. The implementation was inlined into the single
192 K `dist/esm/index.js` bundle. So even a bundler configured to ignore `exports`, or a direct
relative path into `node_modules`, resolves the *types* and then has nothing to load.

`ConfigValidator` is therefore usable for **type-only** purposes — you can import the type via a
relative path or path alias and type-check against it — but the class is **not callable at
runtime**. Importing the type is fine; `new`-ing or calling `ConfigValidator.validateConfig(…)`
will fail.

**A live example of this exact pattern is already in the repo.** `src/services/ExportService.ts:3`
does `import type { KeyboardConfig, Keyboards } from '@sparklinkplayjoy/sdk-keyboard/dist/esm/src/utils/validate'`
— the same specifier that `ERR_PACKAGE_PATH_NOT_EXPORTED`s at runtime — and it type-checks cleanly,
because `tsconfig.json` sets `"moduleResolution": "node"`, which ignores `exports`. It works only
because the import is **type-only and erased**. Importing `ConfigValidator` the same way would
compile and then fail on load. See §13.7 for all three import sites and why the resolver setting
is load-bearing.

Practical consequence: you cannot reuse the SDK's validator. If this app wants to check a
`KeyboardConfig` before import, it must reimplement the checks against the schema in §9.1 —
which the SDK does internally on `importConfig`, so an app-side pre-check is only worth it for
giving better error messages than `ImportResult.error`.

### 9.3 Firmware update

#### `toBoot`

```ts
toBoot: () => Promise<void>
```

| | |
|---|---|
| **Params** | none |
| **Returns** | `Promise<void>` |
| **Description** | Reboots the device into bootloader mode. |

`BLControls` enum: `BL_NONE = 0`, `BL_SIGN = 2`, `BL_ERASE = 3`, `BL_REBOOT = 4`,
`BL_TOBOOT = 5`, `BL_WRITE = 6`.

> **Not wrapped by this app.**

#### `updateBin`

```ts
updateBin: (
  bin: ArrayBuffer,
  cb: (data: { current: number; total: number }) => void,
  config?: { toBootDelay: number; writeDelay: number; toAppDelay: number }
) => Promise<{ success: boolean }>
```

| | |
|---|---|
| **Params** | `bin: ArrayBuffer` — firmware image; must be an `ArrayBuffer`, **not** a `Uint8Array` (the controller takes `Uint8Array`, `XDKeyboard` converts). `cb` — progress callback, `current`/`total` in bytes. `config?` — three delays in ms. **Defaults ✅ verified (bundle):** `{ toBootDelay: 4000, writeDelay: 30, toAppDelay: 4000 }`. |
| **Returns** | `Promise<{ success: boolean }>` — but **rejects** (throws) on bad input: a non-`ArrayBuffer` `bin` throws `Error("Provided file is not an ArrayBuffer")`, and any controller error is re-thrown as `Error(e.message)` (bundle-verified). |
| **Description** | Full firmware flash: to boot → sign → erase → write in 512-byte pages → CRC → back to app. |

The controller signature is richer than the public one:

```ts
SystemController.updateDrive(
  binU8Data: Uint8Array,
  cb?: (data: { current: number; total: number; updateStatus?: string }) => void,
  config?: { toBootDelay: number; writeDelay: number; toAppDelay: number }
): Promise<{ success: boolean }>
```

- `cb` is **optional** on the controller, **required** on `XDKeyboard`.
- The controller's callback also receives `updateStatus?: string` — a human-readable phase
  label. **`XDKeyboard.updateBin` narrows the callback type and drops `updateStatus`**, so you
  cannot see the phase through the public API.
- Controller flow ✅ verified in the bundle: sets `UsbDetect.setUpgrading(true)` → emits
  `beforeToBoot`/`afterToBoot`/`beforeToBootDelay`/`afterToBootDelay` statuses around
  `toBoot()` + the `toBootDelay` wait → re-`init()`s (if the device re-enumerates as
  `"toBootFirst"`, it re-inits the first device from `getDevices()`) → checks
  `KeyboardRunMode !== 0` and throws `"The keyboard is not in upgrade mode"` otherwise →
  **pads the image to a multiple of 512 bytes with `0xFF`** → `updateStart` (sign unlock →
  erase → write → CRC → to app, with small 10–100 ms inter-command waits). Signature failures
  throw `烧录异常：解锁erase签名失败` / `…write签名失败`.

Also on `SystemController` but **not exposed on `XDKeyboard`**:

```ts
init(): Promise<string>
resetUpgradeStatus(): void
```

`resetUpgradeStatus()` matters: `UsbDetect` carries `isUpgrading` / `isUpgradingFail` /
`isUpgradingAfterBoot` static flags that suppress reconnect handling during a flash. After a
**failed** update you may need it to re-enable auto-reconnect.

Supporting protocol primitives (`SystemController` in protocol-keyboard):

```ts
blSIGN(unlock, data, sn: number[]): Uint8Array
blERASE(size: number): Uint8Array
blREBOOT(): Uint8Array
blTOAPP(size: number, crc: number): Uint8Array
blWRITE(param: IWriteParam): Uint8Array[]
blRCRC(size: number): Uint8Array
picStart(size: number, picId: number): Uint8Array
picWrite(addr: number, size: number, value: number[]): Uint8Array[]
getSignature(data): { signSuccess: boolean; signature: number[] }
getWrite(data): { currentUpdateAddress: number }
getCrc(data): number

interface IWriteParam { addr: number; size: number; codes: number[] }
```

Bootloader command bytes (✅ verified, `constants/byte.ts:25-31`): `KB2_BL_SIGN = 0x08` (签名),
`KB2_BL_ERASE = 0x09` (擦除), `KB2_BL_REBOOT = 0x0A` (重启), `KB2_BL_TOAPP = 0x0B` (跳转到app),
`KB2_BL_WRITE = 0x0C` (写指令), `KB2_BL_READ = 0x0D` (读指令), `KB2_BL_RCRC = 0x0E` (获取校验).
The `BLControls` enum above is a separate, unrelated set of values (`0x00`–`0x06`).

> **Neither `updateBin` nor `toBoot` is wrapped by this app.**

---

## 10. Shared types, enums & constants

### 10.1 What each package actually exports

`protocol-keyboard` root (`dist/esm/types/index.d.ts`, verbatim):

```ts
declare const keyboardProtocol: {
  higherKeyProtocol: HigherKeyController;
  infoProtocol:       InfoController;
  keyProtocol:        KeyController;
  lightingProtocol:   LightingController;
  systemProtocol:     SystemController;
  performanceProtocol: PerformanceController;
};
export * as constantsParam from './src/constants/param';
export * from './src/types/interface';
export default keyboardProtocol;
```

So the public surface of `protocol-keyboard` is exactly:
- `constantsParam` — the `param.d.ts` enums (§10.2)
- everything in `types/interface.d.ts` (§10.4)
- the default `keyboardProtocol` object of protocol-layer controllers

**Not exported:** `constants/byte.d.ts` (§10.3) and the whole `utils/` folder (§10.5). Verified
by grepping every `.d.ts` for `from './byte'` / `from './utils'` — no re-export exists.

`sdk-keyboard` root exports **only `XDKeyboard`** — as a named export and as the default. Nothing
else. Its `dist/esm/index.d.ts` opens with two **plain `import` statements**, not re-exports:

```ts
// sdk-keyboard/dist/esm/index.d.ts, lines 1–3 and 97 — verbatim
import { DeviceInit, EVENT, HIDDevice } from '@sparklinkplayjoy/hid';
import { DksLayoutType, DksType, EventHandler, ICmd, IDB, IDKSMode, IEndMode, IKRGBDesc,
         ILoGoLightMode, IMacroMode, IMPTMode, IMTMode, IRSMode, ISOCDMode, ISOCDModeV2,
         ISOCDModeV3, ITGLMode, Keys, LightModeConfigs, MacroType, TouchModeType,
         TrpsLayoutType } from './src/types/type';
export declare class XDKeyboard {
  /* … */
}
export default XDKeyboard;
```

There is no `export type { … }` and no `export * from './src/types/type'`. Consequence: **every
type used in an `XDKeyboard` signature is absent from the package's public type surface.** You
cannot write `import type { IDKSMode } from '@sparklinkplayjoy/sdk-keyboard'` — those names live
in `./src/types/type`, which itself re-exports them from `@sparklinkplayjoy/protocol-keyboard`,
and neither path is exported from the root.

Import them from `@sparklinkplayjoy/protocol-keyboard` instead (§10.1 above: its root does
`export * from './src/types/interface'` plus `constantsParam`). `src/types/type.d.ts:2` shows the
mapping — `DefKeyValue, ICmd, IDB, IDefKeyInfo, IDKSMode, IEndMode, IKey, IKRGBDesc, ILightMode,
ILoGoLightMode, IMacroMode, IMPTMode, IMTMode, IRSMode, ISOCDMode, ISOCDModeV2, ISOCDModeV3,
ITGLMode, IWriteParam, Keys, KRGBDescs, VersionString` all originate there. The
sdk-keyboard-local aliases `LightModeConfigs`, `LogoLightModeConfigs`, `TouchModeType`,
`MacroType`, `DksType`, `DksLayoutType`, `TrpsLayoutType`, `EventHandler` are declared in
`./src/types/type.d.ts` and are **not** exported from any root, so they are reachable only by
deep path — which fails at runtime (§13.4) but succeeds for the type checker, because this
project uses `"moduleResolution": "node"` (§13.7). `VersionString` is the one exception in that
list in practice: it is named in the re-export but has **no declaration anywhere** in the three
packages (§13.1).

Runtime confirmation: the root's named exports are exactly `XDKeyboard, default`. `Device`, which
`getDevices()` and `init()` return, is written inline as
`import("@sparklinkplayjoy/hid").Device` in the `.d.ts` — it too is not re-exported; import it
from `@sparklinkplayjoy/hid`.

`hid` root (`dist/esm/index.d.ts`, verbatim):

```ts
import WebHIDService from './src/hid';
import UsbDetect from './src/usb-detection';
export * from './src/types/enum';
export * from './src/types/types';
export { UsbDetect };
export default WebHIDService;
```

### 10.2 `constantsParam` — public enums

From `protocol-keyboard/.../constants/param.d.ts`.

#### `OrderType` — command ids for `getApi({ type })`

`type` accepts the **key name as a string** (`cmdType = keyof typeof OrderType`), not the number.

| Member | Value | | Member | Value |
|---|---|---|---|---|
| `PROTOCOL_VERSION` | 1 | | `LOCK_WIN_KEY` | 32 |
| `SAVING_PARAMETER` | 2 | | `QUERY_WIN_MODEL` | 33 |
| `RELOAD_PARAMETERS` | 3 | | `QUERY_MAC_MODEL` | 34 |
| `CLEAR_CALIBRATION_DATA` | 4 | | `QUERY_STANDARD_MODEL` | 35 |
| `OPEN_DKS` | 5 | | `QUERY_ADJUSTABLE_SPEEDMODEL` | 36 |
| `CLOSE_DKS` | 6 | | `PRECISION_STROKE` | 37 |
| `REVERSE` | 7 | | `KEYBOARD_NAME` | 38 |
| `TURN_ON_REMAPPING` | 8 | | `SET_WIN_MODEL` | 48 |
| `TURN_OFF_REMAPPING` | 9 | | `SET_MAC_MODEL` | 49 |
| `ENABLE_RELATIVE_TRIGGER` | 10 | | `SET_STANDARD_MODEL` | 50 |
| `TURN_OFF_RELATIVE_TRIGGER` | 11 | | `SET_ADJUSTABLE_SPEEDMODEL` | 51 |
| `START_CALIBRATION` | 12 | | `TOP_DEAD_SWITCH` | 52 |
| `CLOSE_CALIBRATION` | 13 | | `RGB1` | 64 |
| `START_DEMONSTRATION` | 14 | | `RGB2` | 65 |
| `CLOSE_DEMONSTRATION` | 15 | | `RGB3` | 66 |
| `ERASE_MACROSTORAGE` | 16 | | `RGB4` | 67 |
| `RESTORE_FACTORY_SETTINGS` | 17 | | `QUERY_LIGHT_FIX_RGB` | 68 |
| | | | `ROES` | 80 |
| | | | `WEB` | 96 |
| | | | `SOCD` | 97 |
| | | | `CONFIG` | 112 |
| | | | `CURRENT_AXOSOME` | 117 |
| | | | `AXOSOME` | 118 |

`PRECISION_STROKE` (37) is the one that yields the travel range metadata
(`{ precision, decimalPlace, minTouchTravel, maxTouchTravel, VID, PID }`) — read it before
clamping any travel value in the UI.

#### `KeyLayout` — per-key storage slots

Every member is `Layout_`-prefixed in the source. Values below are decimal (source is hex; the
declaration order in `param.ts` puts `Layout_Mode = 0x08` before `Layout_DB0 = 0x04`).

| Member | Value | | Member | Value |
|---|---|---|---|---|
| `Layout_Fn0` | 0 | | `Layout_DKS1` | 9 |
| `Layout_Fn1` | 1 | | `Layout_DKS2` | 10 |
| `Layout_Fn2` | 2 | | `Layout_DKS3` | 11 |
| `Layout_Fn3` | 3 | | `Layout_DKS4` | 12 |
| `Layout_DB0` | 4 | | `Layout_TRPS1` | 13 |
| `Layout_DB1` | 5 | | `Layout_TRPS2` | 14 |
| `Layout_DB2` | 6 | | `Layout_TRPS3` | 15 |
| `Layout_DB3` | 7 | | `Layout_TRPS4` | 16 |
| `Layout_Mode` | 8 | | `Layout_MacroAddr` | 17 |
| | | | `Layout_MacroSize` | 18 |
| | | | `Layout_MTDelay` | 19 |
| | | | `Layout_RTP` | 20 |
| | | | `Layout_RTR` | 21 |
| | | | `Layout_DP` | 22 |
| | | | `Layout_DR` | 23 |
| | | | `Layout_KR` | 24 |
| | | | `Layout_AXIS` | 25 |
| | | | `Layout_RS` | 32 |

Gap at 26–31; `Layout_RS` jumps to 32. Source comments: `Layout_DP` = 单键死区按下 (single-key
dead-zone press), `Layout_DR` = 单键死区抬起 (release), `Layout_KR` = 单键释放 (single-key
release), `Layout_AXIS` = 轴体切换层 (axis switch layer).

#### `KeyTouchMode`

```ts
{ global = 0, single = 1, rt = 2 }
```

`TouchModeType = keyof typeof constantsParam.KeyTouchMode` → **`'global' | 'single' | 'rt'`**.

#### `BLControls`

```ts
{ BL_NONE = 0, BL_SIGN = 2, BL_ERASE = 3, BL_REBOOT = 4, BL_TOBOOT = 5, BL_WRITE = 6 }
```

### 10.3 `constants/byte.d.ts` — **NOT exported**

**Not reachable at all.** No `.d.ts` in `protocol-keyboard` re-exports it (its root does
`export * as constantsParam from './src/constants/param'` — `param`, not `byte`), and the
`exports` map admits no subpath (§13.4), so there is nothing to deep-import. Listed here only
because the values explain the wire protocol; treat them as read-only documentation, never as an
API you can depend on.

```ts
declare const Head: number;
declare const MaxPack: number;
```

#### `Protocol` — command bytes

| Member | Value | | Member | Value |
|---|---|---|---|---|
| `KB2_CMD` | 0 | | `KB2_CMD_END` | 40 |
| `KB2_CMD_SYNC` | 1 | | `KB2_CMD_DB` | 41 |
| `KB2_CMD_RM6X21` | 18 | | `KB2_CMD_KRGB` | 42 |
| `KB2_CMD_PRGB` | 24 | | `KB2_CMD_DEFKEY` | 43 |
| `KB2_CMD_LOGORGB` | 25 | | `KB2_CMD_SOCD` | 44 |
| `KB2_CMD_MACRO` | 32 | | `KB2_CMD_RS` | 45 |
| `KB2_CMD_MACRO_MODE` | 33 | | `KB2_CMD_PIC` | 48 |
| `KB2_CMD_KEY` | 35 | | `KB2_PIC_WRITE` | 49 |
| `KB2_CMD_MT` | 36 | | `KB2_BL_SIGN` | 8 |
| `KB2_CMD_TGL` | 37 | | `KB2_BL_ERASE` | 9 |
| `KB2_CMD_DKS` | 38 | | `KB2_BL_REBOOT` | 10 |
| `KB2_CMD_MPT` | 39 | | `KB2_BL_TOAPP` | 11 |
| | | | `KB2_BL_WRITE` | 12 |
| | | | `KB2_BL_READ` | 13 |
| | | | `KB2_BL_RCRC` | 14 |
| | | | `KB2_CMD_FAIL` | 255 |

⚠️ **This file declares a *second*, conflicting `KeyLayout` and `KeyTouchMode`.** Correcting an
earlier note: **both** enums — this one and the public `param.d.ts` one in §10.2 — use the same
`Layout_`-prefixed member spelling. The prefix is *not* a distinguishing feature. They diverge two
ways:

1. **Range.** `byte.ts`'s `KeyLayout` stops at `Layout_RTR = 0x15` (21). It has **no**
   `Layout_DP`, `Layout_DR`, `Layout_KR`, `Layout_AXIS` or `Layout_RS`. `param.d.ts` (§10.2) adds
   those five (22–25, 32). Everything up to `Layout_RTR` has identical values in both.
2. **`KeyTouchMode` member names.** `byte.ts` uses `{ GlobalMode = 0, SingleMode = 1, QuickMode = 2 }`;
   `param.d.ts` (§10.2) uses `{ global = 0, single = 1, rt = 2 }`. **Same numbers, different
   spellings.** The public `TouchModeType` string union is `'global' | 'single' | 'rt'`, so it
   follows `param.d.ts`.

There is also a second `BLControls` here. **Only the `param.d.ts` versions are public** (§10.1);
this byte-layer file is not reachable at all. Because both `KeyLayout` enums share the
`Layout_*` spelling, you **cannot** tell which one a `Layout_FOO` string came from by its prefix —
only `param.d.ts` is importable, so in practice every `Layout_*` you can actually reference is the
§10.2 one. The byte-layer copy matters only as documentation of the wire protocol.

### 10.4 `types/interface.d.ts` — protocol interfaces

All exported from the package root. **✅ verified field-by-field against
`protocol-keyboard/src/types/interface.ts`** — everything below matches (names, types,
optionality). Source comments worth keeping: `IDB.globalTouchTravel` is ranged `0x01 ~ 0xFA0`
(1–4000); `ILightMode.mode` is `0` off, `1-20` effects, `21` custom; `IKRGBDesc.key` assumes
a length-7 colour array follows.

```ts
interface IDefKeyInfo { keyValue: number; location: { row: number; col: number } }
type DefKeyValue = [IDefKeyInfo[], IDefKeyInfo[]];

interface IEnd { keys: number; dks: number }
interface IKRGBDesc { key: number; r?: number; g?: number; b?: number }
type KRGBDescs = IKRGBDesc[];

type cmdType = keyof typeof OrderType;
interface ICmd { type: cmdType; hArgs?: number[]; is8bit?: boolean }

interface IKey { key: number; layout: number; value?: number }
type Keys = IKey[];

type LightModeType     = 'static' | 'custom' | 'dynamic';
type LightLogoModeType = 'static' | 'dynamic';

interface ILightMode {
  open: boolean; direction: boolean; superResponse: boolean;
  speed: number; colors: string[]; mode: number;
  luminance: number; sleepDelay: number; staticColor: number;
  type?: LightModeType;
}
interface ILoGoLightMode { /* same fields, typed LightLogoModeType */ }

interface IDB { globalTouchTravel: number; pressDead: number; releaseDead: number }

interface IRGBDesc {
  lightColors: number[]; lightSwitch: number; reverseEffect: number;
  superResponse: number; lightLuminance: number; lightMode: number;
  lightSpeed: number; lightSleepDelay: number; color: number;
}

interface IKeyData { keys: number[]; layouts: number[]; values: number[] }

interface IDKSMode  { key: number; dks: number[]; trps: number[]; dbs: number[] }
interface IMPTMode  { key: number; dks?: number[]; dbs?: number[] }
interface IMTMode   { key: number; dks: number[]; delay: number }
interface ITGLMode  { key: number; dks?: number; delay?: number }
interface IEndMode  { key: number; dks?: number; delay?: number }
interface ISOCDMode { key?: number; dks1?: number; mode1?: number; mode2?: number }
interface ISOCDModeV2 { pos1: number; pos2: number; key1: number; key2: number; type: number; mode: number }
interface ISOCDModeV3 { pos1: number; pos2: number; key1: number; key2: number; type: number; mode: number; delay: number }
interface IRSMode   { key: number; dks: number }
interface IMacroMode { key: number; index: number; len: number; mode: number; num: number; delay: number }
interface IRM6X21Mode { matrix6x21: number; datatype: number }
interface IModeParam { key1: any; dks1: any; dks2: any; delay: number }
interface IWriteParam { addr: number; size: number; codes: number[] }
```

### 10.5 `protocol-keyboard` utils — **NOT exported**

**✅ Verified against readable source** (batch 4c): `protocol-keyboard/src/utils/index.ts`,
`src/constants/byte.ts`, and call sites in `src/controller/*.ts`.

#### Wire format — output packet

Every command is built with `createProtocol(len, cmd, data)` (single packet) or
`createProtocolSlice(len, cmd, data)` (multi-packet), producing **fixed 64-byte** buffers
(`computeProtocol(head, data, len = 64)`, zero-filled):

```
byte:   0      1      2      3      4 … 4+len-1        … 63
value:  0x5C   len    cmd    crc    data[0…len-1]      0x00 padding
        Head   payload-len  cmd     checksum
```

- `Head` = `0x5C` (`constants/byte.ts`; `MaxPack = 0x0E` also lives there).
- `len` = **payload byte count only** — callers compute `const len = data.length` (e.g.
  `InfoController.cmd`: `data = CMDPack(param)`), so the 4-byte header is *not* included.
- `cmd` = command byte (the `0x80`/`0xA3`/… family mapped in §10.6's `sdkMap` table).
- `crc` = `computeCRC(len, cmd, data)` — **not a CRC at all**; it is an additive checksum
  seeded with `0x35`:
  `crc = 0x35 + 0x5C + len + cmd + data[data.length - 1]`
  i.e. header fields plus the **last payload byte only**. The last-byte term applies only
  when `0 < len ≤ 252` (`63 * 4`); for `len = 0`, `crc = 0x35 + 0x5C + cmd`. The sum is
  not masked to 8 bits in source — the `Uint8Array` assignment in `computeProtocol` wraps it.
- `computeCheckSum(pack)` is the receive-side mirror: same seed and terms, reading
  `pack[0]`(Head) + `pack[1]`(len) + `pack[2]`(cmd) + `pack[len + 3]` (last payload byte),
  under the same `0 < len ≤ 252` condition.

Multi-packet: `computeProtocolSlice` concatenates `[...head, ...data]` and chunks it into
`ceil((4 + data.length) / 64)` × 64-byte packets. The 4-byte header appears **only in the
first packet**; later packets are raw payload continuation, zero-padded.

#### Send path (`DeviceBase.sendData` → hid bundle) — **✅ verified from bundles** (no TS source;
`sdk-keyboard/dist/esm/index.js` + `hid/dist/esm/index.js`, minified but fully traced)

```
controller packs protocol (createProtocol*, 64-byte packets)
  → DeviceBase.sendData(data, timeout?)            [sdk-keyboard bundle]
    → per-device FIFO command queue (globalCommandQueue[deviceBase.id])
    → flushQueue() serializes: one command at a time
      → WebHIDService.sendReportAndWaitResponse(data, sendTime, timeout=1000)
        → InputReportManager.sendAndWait(data, {expectedResponses=1, timeout, sendTime})
          → device.sendReport(0, bytes)            ← report ID 0 ALWAYS
          → await inputreport events
```

- **`DeviceBase.sendData(data, timeout?)`**: pushes `{res, rej, args, timeout, sendTime: Date.now()}`
  onto the queue; if neither queue is flushing it calls `flushQueue()` immediately, otherwise the
  running flush loop picks it up (full serialization — concurrent SDK calls queue, they don't interleave).
  `args` may also be a bare `async () => …` function (inline work executed in queue order).
- **`flushQueue()`**: for each entry calls `sendReportAndWaitResponse(args, timeout, sendTime)` and
  resolves with `new Uint8Array(response.buffer)` — **`.slice(4)` strips the first 4 bytes**
  (the mirrored `0x5C len cmd crc` reply header) so callers get raw payload, **unless**
  `hidService.deviceUsagePage === 65456` (0xFFB0), where nothing is stripped. On `Read timeout`
  the entry is shifted out and rejected; other errors propagate. In `finally`, if the *multiple*
  queue has pending work it cross-kicks `flushQueueMultiple()` (and vice versa).
- **`DeviceBase.sendDataAndWaitMultiple(data, expectedResponses, timeout?)`**: identical queueing,
  but flushes through `sendReportAndWaitMultipleResponses(data, expectedResponses, sendTime, timeout)`
  and resolves with **`DataView[]` (one per input report), headers NOT stripped** — callers reassemble.
  Canonical reassembly (`getRm6X21Travel03`): 
  `Uint8Array.from(responses.flatMap(r => [...new Uint8Array(r.buffer)])).slice(4)` —
  concat every 64-byte reply into one byte stream, then drop the 4-byte header of the first packet.
- **`InputReportManager`** (hid bundle): `MAX_RETRIES = 3`. `attemptSend` resends the whole command
  if zero responses arrived; throws `发送/接收数据失败，已重试 3 次: …` after the last retry.
  `waitForResponses(n, sendTime, timeout)` fires `n` concurrent `waitForResponse` promises against a
  shared deadline and filters out `null`s. `waitForResponse` discards stale queued reports
  (`time < sendTime`), resolves from the queue, or waits for the next `inputreport`; **on timeout it
  resolves `null` (logs `waitForResponse-timeout`), it never throws** — timeout surfaces as a
  shorter-than-expected `DataView[]` (or, for single-response calls, a retry/throw from `attemptSend`).
  Every inbound `inputreport` is also published on the `inputReport` event channel (feeds §10.7).

#### Byte helpers

- `lowByte(v) = v & 0xFF`, `highByte(v) = (v >> 8) & 0xFF`, `highByte16/24` likewise at >>16/>>24.
- `computeHighLowByte(v) = [lowByte(v), highByte(v)]` — **little-endian** 16-bit split, as used in payloads.
- `bitReadWrite(value = true)`: `true → 0x00` (read), `false → 0x01` (write).
- `getSomeBits(num = 1, bit = 0x00)` → `Array(num).fill(bit)`.
- `getLightBitmap(lightSwitch, reverseEffect, superResponse)` → bit0 switch, bit1 reverse-effect, bit4 super-response.
- `compareVersions(v1, v2)` → `'greater' | 'less' | 'equal'`; splits on `.`, zero-pads, compares numerically.

Original declaration listing (`utils/index.d.ts`), matching the source above:

```ts
bitReadWrite(value?: boolean): number
getLightBitmap(lightSwitch, reverseEffect, superResponse: boolean): number
getSomeBits(num?: number, bit?: number): number[]
lowByte(value): number
highByte(value): number
highByte16(value): number
highByte24(value): number
computeHighLowByte(value): number[]
computeHead(len, cmd, crc): number[]
computeCRC(len, cmd, data: number[]): number
computeProtocol(head: number[], data: number[], len?): Uint8Array
computeProtocolSlice(...): Uint8Array[]
createProtocol(len, cmd, data): Uint8Array
createProtocolSlice(...): Uint8Array[]
compareVersions(v1, v2): string
computeCheckSum(pack: number[]): number
export * from './decimal'
```

`utils/decimal.d.ts`:

```ts
declare const preciseCalculate: (
  operation: 'add' | 'subtract' | 'multiply' | 'divide',
  num1: number, num2: number, precision?: number
) => number;
```

Use `preciseCalculate` for travel arithmetic — device values are fixed-point and float maths
drifts. But it is **not importable**. `utils` is not exported from the package root,
`protocol-keyboard`'s `exports` map declares **only** the `.` subpath
(`{".": {"import": …, "require": …}}`), and `dist/esm/types/src/utils/` contains `.d.ts` files
only — no `.js`. All three reasons independently block it. **Verified empirically — see §13.4.**

The same applies to every other util listed below (`pack.d.ts`, `recdata.d.ts`,
`secret-key.d.ts`, and the `utils/index.d.ts` byte helpers): all present on disk as
declarations, none loadable. **Use the `decimal.js` library directly rather than
reimplementing anything** — `preciseCalculate` is not scaled-integer arithmetic of its own:
the readable source (`protocol-keyboard/src/utils/decimal.ts`) shows it is a thin wrapper
around `decimal.js` (`new Decimal(num1).plus/minus/times/dividedBy(num2)` →
`Number(result.toFixed(precision))`, default `precision = 3`). `decimal.js` is already in
the lockfile as a transitive dependency of the sparklink packages; adding it as a direct app
dependency and calling `Decimal` gives the exact same arithmetic the SDK uses, with no
reimplementation to keep in sync. Do not copy the wrapper from the bundle: that is the SDK's
implementation detail and it is not licensed for extraction.

Also present, **not exported**: `utils/pack.d.ts` (`CMDPack`, `SYNCPack`, `KeyDataPack`,
`KeyLayoutDataPack`, `DBDataPack`, `PRGBDatapack`, `SRGBDatapack`, `SingleRGBDataPack`,
`RGBDataPack`, `DKSDataPack`, `MPTDataPack`, `MTDataPack`, `TGLDataPack`, `ENDDataPack`,
`SOCDPack`, `RSModePack`, `MacroDataPack`, `MacroModePack`, `RM6X21Pack`, …),
`utils/recdata.d.ts` (response decoders), `utils/secret-key.d.ts` (config encryption keys).

### 10.6 `sdk-keyboard` internal helpers — **NOT exported**

`src/utils/index.d.ts`:

```ts
declare const blSignatureKey: number[];
declare const blSignatureParams: number[];
declare const blSignatureUnlock: number[];
compareVersions(version1: string, version2: string): string
padFirmwareDataTo512(firmwareData: Uint8Array): Uint8Array
getAPackData(pos: number, FWData: Uint8Array): any[]
delay(ms: number): Promise<unknown>
convertByte(datas: number): number[]
blSignature(Datas: number[], KEYS: number[], params: number[], unlock: number): number[]
crc16CCITTIteration(wCRCin: any, data: any, datalen: any): any
crc16(fw: Uint8Array): number
getType(obj: any): string
isObject(obj: any): boolean
isArray(obj: any): boolean
```

`src/recData/index.d.ts` and `src/recData/map.d.ts`:

```ts
declare const inputReportRecData: (eventName: string, data: Uint8Array) => any;
declare const sdkMap: { '128': string; '163': string; '171': string; '152': string; '153': string };
```

`sdkMap` keys are decimal command bytes as strings. **Values ✅ verified (bundle, confirmed in
§13.3):**

| key (dec) | hex | value |
|---|---|---|
| `128` | 0x80 | `"getCmd"` |
| `163` | 0xA3 | `"getKey"` |
| `171` | 0xAB | `"defKey"` |
| `152` | 0x98 | `"getSpecialSingleRGB"` |
| `153` | 0x99 | `"getLogoRGB"` |

These are **incoming response-byte ids used to route input reports to recdata handlers**.
Bundle-verified dispatch (`DeviceBase`'s `inputReport` listener): `const key =
new Uint8Array(data.buffer)[2].toString()` — the **byte at offset 2** of every input report, as
a decimal string — is looked up in `sdkMap`; the matching handler decodes the payload:
`{ getCmd: e => infoProtocol.getCmd(e), getKey: e => keyProtocol.getDefKey(e), defKey: e =>
keyProtocol.getDefKey(e), getSpecialSingleRGB: e => lightingProtocol.getSpecialSingleRGB(e),
getLogoRGB: e => lightingProtocol.getPRGB(e) }`, each called with `data.slice(4)`. The decoded
result is then re-emitted as a `DeviceBase` event **named with the same decimal string**
(`emit("128", decoded)`, …), and `DeviceBase.on` maps a subscription name through `sdkMap`
value→key, so `kb.on('getCmd', h)` registers under `"128"` and receives the decoded value.
They do **not** match any `Protocol` enum value in §10.3 (those are 0–49 and 255); the
relationship between response byte and request command byte is not visible in the sources
**[unverified]**. The shipped `.d.ts` types every value as bare `string` and does not reveal them.

### 10.7 `hid` types & enums

**✅ Verified against the compiled bundles** (batch 4c): `hid/dist/esm/index.js` (12 KB, fully
traced) + `hid/dist/esm/src/*.d.ts` and `sdk-keyboard/dist/esm/index.js`. Enum values below
match the bundle exactly.

`types/enum.d.ts`:

```ts
enum DEVICE { INPUT_REPORT_STATUS_ACTIVE = 1, INPUT_REPORT_STATUS_INACTIVE = 3 }

enum REQUESTDEVICESTATUS {
  CONNECT_STATUS_ACTIVE   = 'ACTIVE',
  CONNECT_STATUS_WAITING  = 'WAITING',
  CONNECT_STATUS_INACTIVE = 'INACTIVE',
}

enum EVENT {
  GETDEVICEINFO = 'GETDEVICEINFO',
  INPUTREPORT   = 'INPUTREPORT',
  USBCHANGE     = 'usbChange',
  SWITCHCONFIG  = 'switchConfig',
  CUSTOMCOMMAND = 'customCommand',
  LIGHTINGBASE  = 'lightingBase',
  TOUCHFLOW     = 'touchFlow',
  VOICEFLOW     = 'voiceFlow',
}

enum LogLevel { DEBUG = '调试', INFO = '信息', WARN = '警告', ERROR = '错误' }
```

Note the **mixed casing convention**: `GETDEVICEINFO` and `INPUTREPORT` have SCREAMING-case
values; the other six are camelCase strings. Compare against the enum *value*, not the member name.

#### What actually fires — event plumbing (verified from both bundles)

Two layers emit events; the channel names are **not** the `EVENT` enum for either:

**hid layer (`WebHIDService`, static `Events` map):** `deviceStatus`, `deviceInfo`,
`inputReport`, `error`.
- `deviceStatus` — published by `updateDeviceStatus()` with `{status}`; fires around
  `requestDevice()` (`WAITING` → `ACTIVE`/`INACTIVE`).
- `deviceInfo` — published alongside `deviceStatus` with `{status, device, deviceList}`.
  These two are the **connect-status** channels: they fire on device request/tagging, not
  on every USB plug/unplug.
- `inputReport` — every raw HID `inputreport`, as `{data: DataView, reportId, time}`.
  Published by `InputReportManager.handleInputReport` *before* the response queue resolves
  (so listeners see reports consumed by pending `sendData` calls too).
- `error` — wired but the hid bundle never publishes it (no `publish(Events.ERROR…)` call);
  `InputReportManager.Events.ERROR` exists but is likewise never emitted. Effectively dead.

**sdk layer (`DeviceBase`):** forwards the four hid channels under the same names, with two
transforms (from `setupEventListeners` in the sdk bundle):
- `deviceInfo` payloads are re-tagged: `device` becomes `{data, id, usage, usagePage,
  vendorId, productId, productName}` (defaults `-1`/`''` for missing fields).
- `inputReport` is re-keyed: `DeviceBase` reads `data.buffer` as bytes and uses
  **`byte[2]` as the channel key** (`r = t[2].toString()`), looks it up in the internal
  `sdkMap` (the `0x80`/`0xA3`-style cmd→name table), decodes `t.slice(4)` with the mapped
  decoder, and emits **on the decoded-name channel** (e.g. `'lightingBase'`,
  `'switchConfig'`, … — the camelCase `EVENT` values). So app code subscribes to
  `EVENT.LIGHTINGBASE` etc. and receives the *decoded payload*, while the raw
  `'inputReport'`-named channel from hid is consumed internally, not forwarded by name.
- **`usbChange`**: comes from `UsbDetect` (bundle class `R`, exported as `UsbDetect`).
  `DeviceBase`'s constructor calls `UsbDetect.bindToDeviceBase(this)` + `startMonitoring()`,
  which registers `navigator.hid` `connect`/`disconnect` listeners. On either, it checks the
  device's collections against the configured `usage`/`usagePage`; if matched it awaits
  `DeviceBase.reconnection(...)` (unless `isUpgrading`) and emits `usbChange` with
  `{device, type: 'connect'|'disconnect'|'isUpgrading_connect'|'isUpgrading_disconnect',
  reconnect?, updateFail?}`. `DeviceBase.destroy()` calls `UsbDetect.stopMonitoring()`.
  **Plug/unplug events arrive as `usbChange`, not `deviceInfo`.**

**`on`/`off` name translation** (DeviceBase): `on(eventName, handler)` maps the given name
through the reverse `sdkMap` lookup (`Object.entries(sdkMap).find(([,v]) => v === eventName)`);
if found, it subscribes under the **numeric key** (byte[2] value), else under the name itself.
`off(eventName, handler?)` does the same mapping; omitting `handler` removes all handlers for
that channel. Handlers must be functions or `on` throws. Note `XDKeyboard.off = (e) =>
deviceBase.off(e)` — the facade's `off` takes only the event name (drops the handler arg), so
facade-level `off` always removes *all* handlers for the channel.

**`reconnection(device, id, isUpgrading?)`** (DeviceBase → `WebHIDService.reconnection`):
guarded by `isReconnecting` (concurrent calls log a warning and return `undefined`); closes
the device, waits 100 ms, re-tags the device object with the stored id under
`hidDevices[id]`, reopens if needed, rebuilds the `InputReportManager` + listener, returns
`true` on success / `undefined` on failure (catch logs `Reconnection failed:`).

Bundle-only vs typed: the `EVENT`/`DEVICE`/`REQUESTDEVICESTATUS`/`LogLevel` enums and all
`types.d.ts` interfaces are in the shipped `.d.ts` files (typed). The channel-name mapping
(`sdkMap`), the `deviceInfo` re-tagging, `inputReport` re-keying by `byte[2]`, and the
`usbChange` emission are **bundle-only implementation details** — no `.d.ts` describes them.
`EVENT.GETDEVICEINFO`/`EVENT.INPUTREPORT` (SCREAMING values) appear nowhere in either bundle's
emit paths; treat them as vestigial.

`types/types.d.ts`:

```ts
interface DeviceInfo {
  vendorId: number; productId?: number;
  usage: number; usagePage: number;
  productName?: string; protocol?: number;
}
interface DeviceInit { configs: DeviceInfo[]; usage: number; usagePage: number[] }

interface HIDCollectionInfo {
  usagePage: number; usage: number;
  inputReports:   ReadonlyArray<HIDReportInfo>;
  outputReports:  ReadonlyArray<HIDReportInfo>;
  featureReports: ReadonlyArray<HIDReportInfo>;
  children:       ReadonlyArray<HIDCollectionInfo>;
}
interface HIDReportInfo { id: number; items: any }

interface HIDDevice extends EventTarget {
  id: string;
  collections: ReadonlyArray<HIDCollectionInfo>;
  readonly opened: boolean;
  readonly vendorId: number;
  readonly productId: number;
  readonly productName: string;
  oninputreport: ((event: Event) => void) | null;
  open(): Promise<void>;
  close(): Promise<void>;
  forget(): Promise<void>;
  sendReport(reportId: number, data: BufferSource): Promise<void>;
  sendFeatureReport(reportId: number, data: BufferSource): Promise<void>;
  receiveFeatureReport(reportId: number): Promise<DataView>;
}

interface HIDInputReportEvent extends Event {
  device: HIDDevice; reportId: number; data: DataView;
}

type Device = DeviceInfo & {
  id: string; productName: string;
  data?: HIDDevice;
  collections: ReadonlyArray<HIDCollectionInfo>;
};

type LogColor = { 调试: string; 信息: string; 警告: string; 错误: string; TIMESTAMP: string; RESET: string };
```

`LogLevel` uses Chinese labels (`调试` = debug, `信息` = info, `警告` = warn, `错误` = error),
and `LogColor` is keyed by those same strings.

---

## 11. Internal layers (reachable, not exported)

`XDKeyboard` is a thin façade over six controllers, which sit on `DeviceBase`, which sits on
`WebHIDService`. Documented because they explain the public signatures and because the
controller layer exposes things `XDKeyboard` drops.

```
XDKeyboard
  ├── InfoController          (device/index.d.ts → controller/info.d.ts)
  ├── KeyController
  ├── LightingController
  ├── PerformanceController
  ├── HigherKeyController
  ├── SystemController
  ├── ExportController        (takes XDKeyboard, not DeviceBase — circular by design)
  └── DeviceBase  (singleton)
        └── WebHIDService  (singleton, extends EventEmitter)
              └── navigator.hid  (WebHID)
```

### 11.1 `DeviceBase` — `sdk-keyboard/dist/esm/src/device/index.d.ts`

```ts
class DeviceBase {
  private static instance;
  private hidService;
  private eventHandlers;

  configs: DeviceInfo[];
  usage: number[];
  uagePage: number[];        // sic — typo for "usagePage" is in the shipped declaration
  devices: Device[];
  id: string;

  globalCommandQueue:         { [id: string]: { isFlushing: boolean; commandQueue: CommandQueue } };
  globalCommandQueueMultiple: { [id: string]: { isFlushing: boolean; commandQueue: CommandQueue } };

  constructor({ configs, usage, usagePage }: DeviceInit);
  static getInstance(config: DeviceInit): DeviceBase;

  private setupEventListeners;
  on(eventName: string, handler: (data: any) => void): void;
  private emit;
  off(eventName: string, handler?: (data: any) => void): void;

  getDevices(): Promise<Device[]>;
  getHidDevices(): Promise<HIDDevice[]>;
  requestDevice(): Promise<HIDDevice | null | Error>;
  init(id: string): Promise<Device | null>;
  reconnection(device: any, id: string, isUpgrading?: boolean): Promise<void>;

  sendData(data: Uint8Array, timeout?: number): Promise<Uint8Array | null>;
  get commandQueueWrapper(): { isFlushing: boolean; commandQueue: CommandQueue };
  flushQueue(): Promise<void>;
  sendDataAndWaitMultiple(data: Uint8Array, expectedResponses: number, timeout?: number): Promise<DataView[]>;
  flushQueueMultiple(): Promise<void>;
  get commandQueueWrapperMultiple(): { isFlushing: boolean; commandQueue: CommandQueue };
  destroy(): void;
}
```

**This is the answer to "why does my bulk write hang."** Every SDK call enqueues onto a
per-device serial queue (`globalCommandQueue[id]`) drained one entry at a time by
`flushQueue()`. A second, parallel queue (`globalCommandQueueMultiple` /
`flushQueueMultiple`) serves multi-response commands via `sendDataAndWaitMultiple`. The queue
entry carries its own `sendTime`, `timeout` and `expectedResponses`:

```ts
type CommandQueueArgs = [number, Array<number>] | Uint8Array | (() => Promise<void>);
type CommandQueueEntry = {
  res: (val?: any) => void;
  rej: (error?: any) => void;
  sendTime: number;
  args: CommandQueueArgs;
  timeout?: number;
  expectedResponses?: number;
};
```

Note `src/types/type.d.ts` declares a **second, poorer** `CommandQueueEntry` without
`sendTime`/`timeout`/`expectedResponses`. The `device/index.d.ts` version is the one actually
used.

Consequences for app code (✅ verified against the sdk-keyboard bundle):
- Calls are **serialised**, never concurrent. `flushQueue()` loops the queue one entry at a
  time: function args are awaited directly; byte-array args go through
  `hidService.sendReportAndWaitResponse(args, timeout, sendTime)`. On success the response is
  `new Uint8Array(buf)` when `deviceUsagePage === 65456` (0xFFB0), otherwise
  `new Uint8Array(buf).slice(4)` — i.e. the usual 0xFFA0 interface strips a 4-byte header
  before the recdata decoders ever see it.
- The multi-response queue's `finally` block also re-kicks `flushQueue()` if the single queue
  still has entries — the two queues interleave at drain time.
- A rejected/timed-out entry blocks nothing but produces an unhandled rejection unless awaited.
- `destroy()` exists but — contrary to an earlier note — it **does not clear the command
  queue**: the bundle shows it only calls `UsbDetect.stopMonitoring()` (sets the monitoring
  flag false). It is **not** exposed on `XDKeyboard`, so the app has no supported way to tear
  down a connection.
- `requestDevice()` is **not** exposed on `XDKeyboard` either. This repo calls
  `navigator.hid.requestDevice({ filters: [] })` directly instead, which is why it must manage
  `pairedStableId` itself.

### 11.2 `WebHIDService` — `hid/dist/esm/src/hid.d.ts`

```ts
type EventData = {
  deviceStatus: { status: string };
  deviceInfo:   { status: string; device: HIDDevice | null; deviceList: Device[] };
  inputReport:  { data: DataView; reportId: number; sequence: number };
  error:        Error;
};

class WebHIDService extends EventEmitter {
  private static instance;
  static readonly Events: {
    readonly DEVICE_STATUS: 'deviceStatus';
    readonly DEVICE_INFO:   'deviceInfo';
    readonly INPUT_REPORT:  'inputReport';
    readonly ERROR:         'error';
  };

  private requestDeviceStatus; private hidDevices; private device;
  private usage; private usagePage; private configs;
  private inputReportManager; private isReconnecting; private isInputReportListenerSetup;

  get deviceUsagePage(): number;
  private constructor();
  static getInstance({ configs, usage, usagePage }: DeviceInit): WebHIDService;

  devices(): Promise<Device[]>;
  requestDevice(): Promise<HIDDevice | null | Error>;
  getDevices(): Promise<HIDDevice[]>;
  initAndConnectDevice(id: string): Promise<Device | null>;
  private open;

  sendData(data: Uint8Array | Uint8Array[], options?: {
    expectedResponses?: number; timeout?: number; sendTime?: number;
  }): Promise<DataView | DataView[] | null>;
  sendReportAndWaitResponse(data: Uint8Array, sendTime: number, timeout?: number): Promise<DataView | null>;
  sendMultipleReportsAndWaitResponse(dataPackets: Uint8Array[], sendTime: number, timeout?: number): Promise<DataView | null>;
  sendReportAndWaitMultipleResponses(data: Uint8Array, expectedResponses: number, sendTime: number, timeout?: number): Promise<DataView[]>;

  reconnection: (device: HIDDevice, id: string, isUpgrading?: boolean) => Promise<boolean>;
  closeDevice(): Promise<void>;

  on<T extends keyof EventData>(event: T, handler: (data: EventData[T]) => void): void;
  off<T extends keyof EventData>(event: T, handler: (data: EventData[T]) => void): void;

  private tagDevice; private filterHIDDevices; private updateDeviceStatus;
  private setupInputReportListener;
}
```

⚠️ **Two different event systems, do not conflate them.**
`WebHIDService.Events` (`'deviceStatus'`, `'deviceInfo'`, `'inputReport'`, `'error'`) are
**transport-level** and are *not* the same strings as the `EVENT` enum in §10.7
(`'GETDEVICEINFO'`, `'INPUTREPORT'`, `'usbChange'`, …). `XDKeyboard.on` takes `EVENT | string`;
`WebHIDService.on` takes `keyof EventData`. ✅ verified in the sdk bundle: the `| string`
escape hatch is real — `DeviceBase.on(name, handler)` stores handlers under *any* string key
(normalized through `sdkMap` value→key lookup), and `DeviceBase` re-emits the transport events
`'usbChange'`, `'deviceStatus'`, `'deviceInfo'`, `'error'` (forwarded from `WebHIDService`) plus
the decimal `sdkMap` keys (`'128'`…`'153'`) for decoded input reports. So
`kb.on('usbChange', h)` and `kb.on('getCmd', h)` both work untyped at the `XDKeyboard` facade.

Also note `WebHIDService.reconnection` returns `Promise<boolean>` while
`DeviceBase.reconnection` and `XDKeyboard.reconnection` both return `Promise<void>` — the
success flag is discarded on the way up.

⚠️ **Bundle-observed arg swap (single queue only).** In `DeviceBase.flushQueue`, the single
queue calls `sendReportAndWaitResponse(args, n, s)` where `n` is the entry's `timeout` and `s`
is its `sendTime` — but the hid signature is `(data, sendTime, timeout = 1000)`, so timeout and
sendTime arrive transposed: the wait timeout becomes the `Date.now()` enqueue timestamp
(effectively no timeout), and the caller's timeout value lands in `sendTime`. The
multiple-response path (`sendReportAndWaitMultipleResponses(args, sendTime, timeout,
expectedResponses)`) passes them in the **correct** order. Practical impact looks small —
`sendTime` only gates stale-response filtering in `waitForResponse` — but it means
**per-call timeouts on single-response commands are not enforced at the transport layer**
(the queue entry's timeout is still used for the `flushQueue` retry bookkeeping).

`requestDevice(): Promise<HIDDevice | null | Error>` resolves an `Error` **as a value** rather
than rejecting. Callers must test `instanceof Error`, not just truthiness.

`closeDevice(): Promise<void>` exists here but is **not surfaced on `DeviceBase` or
`XDKeyboard`**.

### 11.3 `UsbDetect` — `hid/dist/esm/src/usb-detection.d.ts`

Exported from the `hid` package root.

```ts
class UsbDetect {
  private static deviceDetectionMap;
  private static deviceRemovalTimeoutMap;
  private static instance;
  private static isListenerRegistered;
  static isUpgrading: boolean;
  static isUpgradingFail: boolean;
  static isUpgradingAfterBoot: boolean;
  static getIsListenerRegistered(): boolean;
  static getInstance(): UsbDetect;
  constructor(
    callback?: (device: HIDDevice, type: string) => void,
    device?: HIDDevice,
    stableId?: string,
    isWebHIDService?: boolean
  );
  private initializeListener;
  private static generateStableId;
  handleDeviceDetection(event: Event): Promise<void>;
  handleDeviceRemoval(event: Event): void;
  stopDetection(device: HIDDevice): void;
  clearAllDetections(): void;
  clearAllRemovals(): void;
}
```

Key details:
- `generateStableId` is **private**, so the app cannot reproduce the SDK's device identity
  scheme — hence this repo persisting its own `pairedStableId` in localStorage.
- Detection is debounced (`deviceRemovalTimeoutMap`) — a disconnect handler does not fire
  synchronously on unplug.
- The three **static** `isUpgrading*` flags are global mutable state. They gate reconnect
  handling during firmware flashing. `isUpgradingFail` is set when a flash aborts, and nothing
  in the public API resets it — `SystemController.resetUpgradeStatus()` (also unexposed) is the
  only reset path.
- `stopDetection` takes an `HIDDevice`; `clearAllDetections`/`clearAllRemovals` take nothing.

`hid/dist/esm/src/hidv2.d.ts` declares `WebHIDServiceV2` with an identical shape to `WebHIDService`.
It is **dead code**: there is a `hidv2.d.ts` but **no compiled `hidv2.js`**, nothing imports it,
and no `.js` bundle in either `hid` or `sdk-keyboard` mentions it. **Verified — see §13.5.**
Do not target it.

### 11.4 Controller layer — members not on `XDKeyboard`

| Controller | Extra members | Notes |
|---|---|---|
| `InfoController` | `delay(ms?)`, `setPic(size, picId, addr, value: number[])` | `setPic` writes LCD/graphic frames (`KB2_CMD_PIC = 48`, `KB2_PIC_WRITE = 49`). `setRateOfReturn` returns `Promise<any>` here, `Promise<number>` on the façade. |
| `LightingController` | `getLighting(v?)`, `setLighting(cfg, v?)`, `getCustomLighting(key?)` | `v?: VersionString` version gate dropped by the façade; `key` optional here, required on the façade. |
| `KeyController` | `updateKey(params: Keys): Promise<Keys>` | The façade renames it to `setKey`. |
| `PerformanceController` | `getRm6X21Travel03/021/022/061/062`, `getRm6X21Calibration` | Five matrix variants unreachable from `XDKeyboard`, which only exposes `getRm6X21Travel`. |
| `HigherKeyController` | `setMPT/setMT/setTGL(param, v?)`, `setMacro(param, macros, touchMode, v?)` | Version gates dropped by the façade. **Not true for END/SOCD** — `setEND`, `setSocd` and `getSocd` *do* forward `v` end-to-end (§6.0, §6.7, §6.8); and for MT/TGL the `cmd*` builders drop `v` again before packing, so their gate is dead at both layers. Capitalisation differs (`setMPT` vs `setMpt`, `setDKS` vs `setDks`). |
| `SystemController` | `init(): Promise<string>`, `resetUpgradeStatus(): void`, `updateDrive(binU8Data, cb?, config?)` | `updateDrive` takes `Uint8Array` + optional callback incl. `updateStatus?: string`; façade's `updateBin` takes `ArrayBuffer` + required callback without `updateStatus`. Also `static instance` and fields `sn`, `KeyboardRunMode`, `addr`, `device`, `baseInfo`. |
| `ExportController` | `exportEncryptedJSON(data: KeyboardConfig, filename: string)`, `importEncryptedJSON(file: File)`, public field `success: boolean` | Constructed with `(keyBoard: XDKeyboard)`, not `DeviceBase`. `filename` is **required** here, optional on the façade. |

`PerformanceController` full member list, verbatim from `controller/performance.d.ts`:

```ts
class PerformanceController {
  constructor(deviceBase: DeviceBase);
  getGlobalTouchTravel(): Promise<any>;
  setDB(param: IDB): Promise<any>;
  getPerformanceMode(key: number): Promise<any>;
  setPerformanceMode(key: number, mode: TouchModeType, advancedKeyMode: number): Promise<any>;
  getDksTravel(key: number, dksLayout?: DksLayoutType): Promise<any>;
  setDksTravel(key: number, value: number, dksLayout?: DksLayoutType): Promise<any>;
  getDbTravel(key: number, dbLayout?: DksLayoutType): Promise<any>;
  setDbTravel(key: number, value: number, dbLayout?: DksLayoutType): Promise<any>;
  getRtTravel(key: number): Promise<any>;
  setRtPressTravel(key: number, value: number): Promise<any>;
  setRtReleaseTravel(key: number, value: number): Promise<any>;
  getSingleTravel(key: number, decimal?: number): Promise<any>;
  setSingleTravel(key: number, value: number, decimal?: number): Promise<any>;
  getDpDr(key: number): Promise<any>;
  setDp(key: number, value: number): Promise<any>;
  setDr(key: number, value: number): Promise<any>;
  getAxis(key: number): Promise<any>;
  setAxis(key: number, value: number): Promise<any>;
  getRm6X21Travel03(): Promise<number[][]>;
  getRm6X21Travel021(): Promise<number[][]>;
  getRm6X21Travel022(): Promise<number[][]>;
  getRm6X21Travel061(): Promise<number[][]>;
  getRm6X21Travel062(): Promise<number[][]>;
  getRm6X21Travel(): Promise<any>;
  getRm6X21Calibration(): Promise<any>;
}
```

Note there is **no `getAxisList`** here — that one delegates to `InfoController.getApi`, as
verified in §5.7.

---

## 12. Wrapper coverage in `src/services/KeyboardService.ts`

**Method.** Every member of `export declare class XDKeyboard` in
`node_modules/@sparklinkplayjoy/sdk-keyboard/dist/esm/index.d.ts` was extracted
(75 public members — the 8 constructor/private fields are excluded), and each name was tested
against the source text of `src/services/KeyboardService.ts` for a `.<name>(` call site.

**Result: `TOTAL = 75`, `USED = 54`, `UNUSED = 21`.**

⚠️ **Caveat on the method.** This is a *textual* call-site match. It proves
`KeyboardService.ts` invokes `xdKeyboard.<name>(…)` somewhere, **not** that it exposes a
corresponding public wrapper method, nor that arguments are forwarded faithfully. Several
matches come from `ExportService`-style bulk reads rather than a dedicated wrapper. Treat the
table as "is this SDK call reachable from the app at all", and read the file before assuming a
1:1 wrapper exists.

### 12.1 Has a call site in `KeyboardService.ts` — 54

| # | SDK method | § | # | SDK method | § |
|---|---|---|---|---|---|
| 1 | `getDevices` | 1 | 28 | `setDbTravel` | 5.6 |
| 2 | `init` | 1 | 29 | `getRtTravel` | 5.4 |
| 3 | `getBaseInfo` | 3 | 30 | `setRtPressTravel` | 5.4 |
| 4 | `getApi` | 3 | 31 | `setRtReleaseTravel` | 5.4 |
| 5 | `setRateOfReturn` | 3 | 32 | `getSingleTravel` | 5.3 |
| 6 | `switchConfig` | 3 | 33 | `setSingleTravel` | 5.3 |
| 7 | `switchSystemMode` | 3 | 34 | `getDpDr` | 5.5 |
| 8 | `factoryDataReset` | 3 | 35 | `setDp` | 5.5 |
| 9 | `calibrationStart` | 4 | 36 | `setDr` | 5.5 |
| 10 | `calibrationEnd` | 4 | 37 | `getAxisList` | 5.7 |
| 11 | `getRm6X21Travel` | 4 | 38 | `getAxis` | 5.7 |
| 12 | `getRm6X21Calibration` | 4 | 39 | `setAxis` | 5.7 |
| 13 | `defKey` | 2 | 40 | `getDks` | 6.1 |
| 14 | `getLayoutKeyInfo` | 2 | 41 | `getMpt` | 6.4 |
| 15 | `setKey` | 2 | 42 | `getMT` | 6.5 |
| 16 | `getGlobalTouchTravel` | 5.1 | 43 | `getTGL` | 6.6 |
| 17 | `setDB` | 5.1 | 44 | `getEND` | 6.7 |
| 18 | `getPerformanceMode` | 5.2 | 45 | `getSocd` | 6.8 |
| 19 | `setPerformanceMode` | 5.2 | 46 | `setMacro` | 7 |
| 20 | `getDksTravel` | 5.6 | 47 | `getMacro` | 7 |
| 21 | `setDksTravel` | 5.6 | 48 | `getLighting` | 8 |
| 22 | `getDbTravel` | 5.6 | 49 | `setLighting` | 8 |
| 23 | `getLogoLighting` | 8 | 50 | `setLogoLighting` | 8 |
| 24 | `getCustomLighting` | 8 | 51 | `setCustomLighting` | 8 |
| 25 | `saveCustomLighting` | 8 | 52 | `closedLighting` | 8 |
| 26 | `getSpecialLighting` | 8 | 53 | `setSpecialLighting` | 8 |
| 27 | `exportConfig` | 9 | 54 | `importConfig` | 9 |

The read side is well covered; the **write side of every advanced-key feature is missing** — see
§13.

### 12.2 No call site in `KeyboardService.ts` — 21

Enumerated with signatures and what each would unlock in **§14**.

### 12.3 `KeyboardService` wrapper → SDK mapping

**Why this section exists.** Several public method names on `KeyboardService` **are not SDK
methods at all** — they are this app's own wrappers, and they rename, re-index or reshape the
underlying SDK call. The superseded `docs/SDK_REFERENCE.md` documented these wrapper names *as if*
they were the SDK surface, which is why a reader looking for `getPollingRate` or `getActiveProfile`
on `XDKeyboard` finds nothing. They are not missing from the SDK; they never existed there.

Every row below was verified against `src/services/KeyboardService.ts` (line numbers cited). None
of the right-hand column is a guess.

| `KeyboardService` wrapper (app layer) | Underlying SDK call on `XDKeyboard` | Transform the wrapper applies | Verified at |
|---|---|---|---|
| `getPollingRate()` | `getApi({ type: 'ORDER_TYPE_ROES' })` | Retries up to **5** times, then requires `typeof result === 'number'`; returns that number. The value is a **rate index 0–6, not Hz** (§3). | `:1144`–`:1174` |
| `setPollingRate(value)` | `setRateOfReturn(value)` | **App-side validation only**: rejects `value < 0 \|\| value > 6`. The SDK itself does not validate. Then arms `pollingRateOperationToken` and a timeout, because the device re-enumerates on rate change (§3). | `:1175`–`:1262` |
| `querySystemMode()` | `getApi({ type: 'ORDER_TYPE_QUERY_WIN_MODEL' })` | Retries up to **5** times; validates `result.currentSystem` is a string; narrows it to the union `'win' \| 'mac'`. The SDK returns an untyped object. | `:1263`–`:1297` |
| `setSystemMode(mode)` | `switchSystemMode(mode)` | Pass-through of `'win' \| 'mac'`; no transform. | `:1298`–`:1310` |
| `factoryReset()` | `factoryDataReset()` | Arms `factoryResetOperationToken` + timeout, calls `suppressSDKReconnectError()` (temporary `console.error` suppression), and sets `isFactoryResetting = true` around the call, because reset drops and re-enumerates the device. | `:1312`–… |
| `setGlobalTouchTravel(param)` | `setDB(param)` | Pass-through; the wrapper's declared return type is `{ globalTouchTravel: number; pressDead: number; releaseDead: number } \| Error`, which is the app's reading of what `setDB` yields. | `:561`–`:573` |
| `getActiveProfile()` | `getApi({ type: 'ORDER_TYPE_CONFIG' })` | **Re-indexes**: reads `result.configID` (device-native **0–3**), applies `(result.configID ?? 0) + 1`, and returns a **profile ID 1–4**. The SDK knows nothing about 1-based profiles. | `:1044`–`:1058` |
| `switchConfig(profileId)` | `switchConfig(configIndex)` | **Re-indexes in the opposite direction**: validates `1 <= profileId <= 4`, then passes `configIndex = profileId - 1` (**0–3**) to the SDK. Same method name on both layers — easy to confuse. | `:1012`–`:1043` |

**The two off-by-one traps, stated plainly**, because they are the only place a 1-vs-0 mistake will
silently corrupt state:

- **Profiles are 1–4 at the app boundary and 0–3 at the SDK boundary.** `getActiveProfile` adds 1
  on the way out; `switchConfig` subtracts 1 on the way in. Both are explicit in source, with the
  comment `// SDK returns configID as 0-3, we use 1-4 for profile IDs` at `:1051`.
- **Polling rate is an index 0–6 at *both* boundaries** — no conversion, but the index is *not* Hz
  and is ordered **descending** (0 = 8 kHz, 6 = 125 Hz). See the table in §3.

**Shared wrapper conventions** (all eight above, and the rest of `KeyboardService`):

1. Every wrapper first checks `if (!this.connectedDevice) return new Error('No device connected')`.
2. Wrappers **return `Error` instances rather than throwing** — the declared types are
   `Promise<T | Error>`. Callers must test `result instanceof Error`, not use `try/catch`.
3. Each wraps its SDK call in `try/catch` that `console.error`s and returns `error as Error`.
4. The SDK instance is reached via `this.ensureKeyboard()`, never a bare field — this is what makes
   the auto-reconnect path work.

> **Documentation consequence.** Any SDK reference for this project must keep these two layers
> separate. `docs/SDK_REFERENCE.md` conflated them; this file documents the **SDK surface** in
> §1–§11 and this **app layer** here. When a name appears in one column and not the other, that is
> expected, not an error.

### 12.4 App error-handling pattern *(app-layer, not SDK)*

Carried over from `SDK_REFERENCE.md`, corrected to match what the app actually does. None of
this is SDK behaviour — it is the convention every caller in `src/` follows.

**Two error channels, both must be handled.**

1. **`Error` as a return value** — the dominant channel. Nearly every `KeyboardService` wrapper
   resolves to `T | Error` (never throws; see the wrapper conventions above). Callers test
   `result instanceof Error` before using the value:

   ```ts
   const result = await KeyboardService.getBaseInfo();
   if (result instanceof Error) { /* handle */ return; }
   ```

2. **Thrown exceptions** — the minority channel, but real. The facade's `updateBin`/`toBoot`
   **rethrow** instead of returning `Error` (§14.8); `exportConfig` failures surface as
   **synchronous throws** (`导出文件失败: …`, §9); `updateKey` throws `"No response received"`
   on an empty reply (§4); and `on()` throws for a non-function handler. Anything touching
   those paths needs `try/catch` *in addition to* the `instanceof Error` check. Note
   `init` does **not** throw — it resolves `null` on every failure path (§2) — and the SDK's
   `requestDevice` is not exposed on the facade at all; this app calls
   `navigator.hid.requestDevice` directly inside its own try/catch
   (`KeyboardService.ts:120–125`).

**Retry with backoff for bulk reads.** `ExportService` wraps every SDK read in
`retryWithBackoff` (`src/services/ExportService.ts:9` — defaults `maxRetries = 2` (3 attempts),
linear backoff `backoffMs * (attempt + 1)` from `backoffMs = 200`). Caveat: it retries only on
**thrown** errors — since `KeyboardService` wrappers *return* `Error` instances rather than
throwing, a returned `Error` passes straight through as a "successful" result, so callers must
still do their own `instanceof Error` check on the final value. Use the same pattern for any new
operation that issues many sequential SDK calls; single reads in interactive UIs generally don't
retry. Bulk *writes* additionally go through `useBatchProcessing().processBatches` (batches of
80 keys, `Promise.all` within a batch, 100 ms delay between batches —
`src/composables/useBatchProcessing.ts`); firing unbatched per-key calls for a whole keyboard
overloads the device.

**Dual-purpose methods.** Some SDK methods serve two features depending on the key's current
mode — the old doc's example was `setSingleTravel` (single-mode actuation depth vs RT-mode
initial trigger). That specific claim is **unverified** and is tracked in the
[Hardware verification checklist](#hardware-verification-checklist); what *is* source-verified
is `getDksTravel` ≡ `getDbTravel` (byte-identical implementations reading the same slots, §5.6)
and the shared `Layout_DKS*` storage behind MT/MPT/TGL/END reads (§14.6). When documenting or
wrapping a method, check whether its meaning depends on `touchMode`/`advancedKeyMode` before
assuming one interpretation.

---

## 13. Unresolved items & unverified register

**Most of what originally lived here has been resolved by the verification batches** and moved
into the body sections; this section now keeps only what is still open, plus the packaging-defect
record. Resolved pointers:

| Former register item | Now documented at |
|---|---|
| `getModeMacro` / `MacroModePack` shapes, `ISOCDModeV2`/`V3` fields, `MacroType.status` numeric contract, `setMacro` `touchMode` encoding, getter defaults, `getMtorTgl` discriminator premise | §13.3 table (all ✅ verified, batches 1/4/4b) |
| `sdkMap` values and input-report dispatch | §10.6 + §10.7 (batch 4b/4c) |
| `advancedKeyMode` enum, `Layout_Mode` encoding | §5.2 (batch 1/3) |
| `VersionString` dangling type | §13.1 (verified) — treat `v` as `string` |
| Missing runtime range validation | §13.2 (verified) — ranges are device-reported; see the [Hardware verification checklist](#hardware-verification-checklist) |
| `WebHIDServiceV2` dead code, `ConfigValidator` / `preciseCalculate` unreachable | §13.5 / §10.5 / §9.2 |
| `src/` broken type-import sites | §13.7 |

What remains below is either **not present in the shipped declarations**, **hardware-only**, or
**inferred**. Anything marked `[unverified]` that depends on firmware behaviour is indexed in the
Hardware verification checklist; nothing here should be treated as authoritative for those
entries without checking against hardware.

### 13.1 `VersionString` is a dangling type — **✅ verified**

`VersionString` is imported into `sdk-keyboard/dist/{esm,cjs}/src/types/type.d.ts` from
`@sparklinkplayjoy/protocol-keyboard`, re-exported from there, and used as `v?: VersionString`
on `LightingController.getLighting` / `setLighting`. A recursive grep for `VersionString` over
the **entire `protocol-keyboard` package — `src/`, `dist/esm/` and `dist/cjs/` — returns zero
hits**. The only matches anywhere in `node_modules/@sparklinkplayjoy/` are in `sdk-keyboard`:
two import lines, two re-export lines, and four usage lines (the `getLighting`/`setLighting`
signatures in both `esm` and `cjs` `lighting.d.ts`). **There is no `type VersionString` or
`declare type VersionString` declaration anywhere.** It is not merely missing from the shipped
`.d.ts` — it was never written in the readable TypeScript source either.

Root cause, verified on disk (`protocol-keyboard@1.0.6`):

- `package.json` declares `"types": "./dist/esm/index.d.ts"` — **that file does not exist**.
  `dist/esm/` contains only `index.js` and a `types/` directory.
- The `exports` map declares only `import` and `require` conditions pointing at `.js` files, with
  **no `types` condition at all**. So there is no fallback resolution path either.
- `dist/esm/types/index.d.ts` does exist, but is not the declared entry point and does not export
  `VersionString`.

Net effect: any TypeScript program that imports `VersionString` transitively through
`sdk-keyboard`'s controller layer gets an unresolved type. This never bites app code, because the
`XDKeyboard` façade only exposes `v` on `setEND` / `setSocd` / `getSocd`, where it is typed plain
`string` (§6.0) — the two controller methods that *do* use `VersionString`
(`LightingController.getLighting` / `setLighting`) have no `v` parameter on the façade at all. It
only affects code that reaches into `LightingController` directly.

**Practical consequence for this document:** treat `v` as `string`. The only values with observed
behaviour are the exact literals `'1.0.5'`, `'1.0.6'`, `'1.0.7'` and `'1.0.9'` (§6.0); there is
no union type in the source to enumerate.

### 13.2 No runtime value-range validation exists

Searched `sdk-keyboard/dist/esm/index.js` for `throw new Error`, `must be`, `between`,
`out of range`, `invalid`, and firmware version literals (`'V1'`, `"V2.0"`, …). Result: **no
parameter-validation guards.** The only thrown errors relate to device connection and the
firmware-update flow.

Therefore **every numeric range in this document is inferred** from the protocol enums, the
`KeyboardConfig` schema, or the shape of the decoders — and is marked **[unverified]**.
The real ranges must be read from the device at runtime via
`getApi({ type: 'PRECISION_STROKE' })` → `{ precision, decimalPlace, minTouchTravel,
maxTouchTravel, VID, PID }`, and profile count via `getApi({ type: 'CONFIG' })` →
`{ configID, hasFourConfig }`.

### 13.3 Shapes elided by the shipped `.d.ts`

The shipped `.d.ts` files are terse, but almost every gap is closed by reading either
`protocol-keyboard/src` (the readable source, which is *richer* than the `.d.ts` for these types)
or the compiled `sdk-keyboard/dist/esm/index.js` bundle. Second-pass status below — **✅ verified**
rows were previously listed as unrecoverable.

| Item | `.d.ts` says | Ground truth (source / bundle) | Status |
|---|---|---|---|
| `getModeMacro(data)` | `{ key, id, len, mode, … }` — literal ellipsis | Bundle: `{ key: e[1], id: e[3]<<8\|e[2], len: e[4], mode: e[5], num: e[7]<<8\|e[6], delay: e[10]<<16\|e[9]<<8\|e[8] }` — 7 fields, all little-endian multi-byte except `key`/`len`/`mode` | ✅ verified |
| `ISOCDModeV2` / `ISOCDModeV3` | Field types **are** annotated in `protocol-keyboard/src/types/interface.ts` (L135–151): all `number`; `V3` = `V2` + `delay: number` | Same as source | ✅ verified (the sdk-keyboard `.d.ts` copies it; only names were "assumed" before) |
| `sdkMap` values | All five typed bare `string`; keys `128`/`163`/`171`/`152`/`153` | Bundle: `{128:"getCmd", 163:"getKey", 171:"defKey", 152:"getSpecialSingleRGB", 153:"getLogoRGB"}` — these are **input-report event ids → handler-name** pairs, not `Protocol` command bytes | ✅ verified (values); id→meaning still **[unverified]** beyond the handler names |
| `MacroType.status` | Typed `string`, not a union | Packagers do a **numeric** test: `MacroDataPack` / `cmdMacro` use `keyStatus[i] === 0 ? prefix 8 : prefix 1`. So the wire contract is `0` (release) vs non-zero (press), **not** a `'down'\|'up'` string. This app's `ExportService` confirms it: `status: m.status === 'press' ? 1 : 0` | ✅ verified — the `string` type is misleading; a string would never `=== 0` |
| `setMacro`'s `touchMode` (`r` param) | Plain `string` on both layers — not `TouchModeType` | Bundle: `"quick"===r ? u=2 : "single"===r && (u=1)`, then `y = u<<4 \| 6`. Accepted values are **`'quick'` (2) / `'single'` (1)**, anything else → `0` (global). Note these differ from `TouchModeType` (`global`/`single`/`rt`) | ✅ verified |
| Default `dksLayout` / `dbLayout` | Optional params, defaults not in `.d.ts` | Bundle: `getDks(e, t="Layout_DKS1")`, `getDksTravel(e, t="Layout_DB1")`, `setDksTravel(e, t, r="Layout_DB1")`. **`getTrps(e, t)` has no default** — passing `undefined` indexes `KeyLayout[undefined]` → `undefined` slot | ✅ verified |
| `getMtorTgl` discriminator | Returns `number`; MT vs TGL "not declared" | Bundle: returns `10 * (e[4]<<8 \| e[3])` — a **scaled delay** (16-bit LE × 10), *not* a discriminator. Both MT and TGL store a delay in the same slot layout; `getMtorTgl` reads it back regardless of which feature is active | ✅ verified — the row's premise (a MT/TGL selector) was wrong |
| `advancedKeyMode` | No exported enum | See §5.2 — full 0–9 table verified from `advancedKeysSdkMap` | ✅ verified (moved to §5.2) |

**Remaining genuinely-unverified items** (not derivable from source or bundle):

- The *semantic* meaning of `sdkMap` input-report ids `128`/`163`/`171`/`152`/`153` beyond their
  handler names — these are firmware-side event ids with no enum in either package. Checked:
  `recData/map.d.ts` (types them `string`), the bundle (only maps id → handler name).
- Whether the `SOCDPack` V1-branch byte duplication (`[key, dks1, mode1, dks1, key, mode2]`, §6.0)
  is intentional or a packing bug — the source carries no comment. Checked: `pack.ts` `SOCDPack`.
- Firmware behaviour for `advancedKeyMode` values outside `advancedKeysSdkMap` (7, 10–15) — no
  range guard exists (§5.2).

### 13.4 Package-level packaging defects

All three `exports` maps, verbatim from each `package.json`:

```jsonc
// sdk-keyboard — bare conditional object, NO "." key, NO wildcard
"exports": { "import": "./dist/esm/index.js", "require": "./dist/cjs/index.js" }

// protocol-keyboard — "." only, no wildcard
"exports": { ".": { "import": "./dist/esm/index.js", "require": "./dist/cjs/index.js" } }

// hid — "." plus an explicit types subpath plus a permissive wildcard
"exports": {
  ".":            { "import": "./dist/esm/index.js", "require": "./dist/cjs/index.js" },
  "./src/types":  "./dist/esm/index.d.ts",
  "./*":          "./*"
}
```

**Deep imports are impossible in all three packages — for two independent reasons.** This was
verified empirically, not inferred, by attempting each import in Node and reading the error code:

| Import attempted | Result |
|---|---|
| `@sparklinkplayjoy/sdk-keyboard` | **OK** |
| `@sparklinkplayjoy/sdk-keyboard/dist/esm/src/utils/validate` | `ERR_PACKAGE_PATH_NOT_EXPORTED` |
| `@sparklinkplayjoy/protocol-keyboard` | **OK** |
| `@sparklinkplayjoy/protocol-keyboard/dist/esm/types/src/utils/decimal` | `ERR_PACKAGE_PATH_NOT_EXPORTED` |
| `@sparklinkplayjoy/hid` | **OK** |
| `@sparklinkplayjoy/hid/dist/esm/src/usb-detection` | `ERR_MODULE_NOT_FOUND` |

Reason 1 — **`exports` blocks the path.** `sdk-keyboard` uses the shorthand form (conditions at
the top level, no `.` key); Node reads that as "conditions for the root entry", which works for a
bare import, but with **no `"./*"` wildcard** every subpath is rejected. `protocol-keyboard`
declares only `.`, same effect.

Reason 2 — **there is nothing at the path to load.** Each package ships **exactly one compiled
`.js` file**, a single bundle at `dist/esm/index.js`. Every other file in the source tree is a
`.d.ts` declaration with no JS sibling:

| Package | `.js` files | `.d.ts` files | bundle size |
|---|---|---|---|
| `sdk-keyboard` | **1** (`dist/esm/index.js`) | 14 | 192 K |
| `protocol-keyboard` | **1** (`dist/esm/index.js`) | 15 | 64 K |
| `hid` | **1** (`dist/esm/index.js`) | 8 | 64 K |

One mitigation: **`protocol-keyboard` additionally ships its readable TypeScript source** —
`src/` contains 16 `.ts` files (`utils/decimal.ts`, `utils/recdata.ts`, `utils/pack.ts`,
`constants/param.ts`, `controller/*.ts`, …) and zero `.js` files. This is the material this
reference was verified against (§10.3, §10.5, §10.6, §13.3): it shows the real implementation
behind the bundle. It is **for reference only, not loadable at runtime** — `exports` maps only
`.` to the single bundle, and the `.ts` sources have no compiled siblings, so deep-importing
them fails with `ERR_PACKAGE_PATH_NOT_EXPORTED` exactly like the `.d.ts` tree does.

This is why `hid` fails differently. Its `"./*": "./*"` wildcard *does* permit the subpath —
so Node gets past the exports check and then fails with `ERR_MODULE_NOT_FOUND`, because
`dist/esm/src/` holds only `hid.d.ts`, `hidv2.d.ts`, `input-report-manager.d.ts`,
`pub-sub.d.ts` and `usb-detection.d.ts`, with no `.js` among them. **The wildcard is vestigial:
it grants access to declarations that cannot be executed.**

Note the contrast in error codes is diagnostic, not cosmetic. `ERR_PACKAGE_PATH_NOT_EXPORTED`
means the `exports` map refused; `ERR_MODULE_NOT_FOUND` means the map allowed it and the file
was absent. Reading them as interchangeable would lead you to "fix" `hid` by adding a wildcard
to `sdk-keyboard` — which would change nothing, since `sdk-keyboard` has no per-module JS either.

Further defects:
- `protocol-keyboard` `types` → `./dist/esm/index.d.ts` — **file does not exist**. Only
  `index.js` and a `types/` directory are present, so the real declarations live at
  `dist/esm/types/index.d.ts` (§13.1).
- `hid` `types` → `./dist/esm//types/enum.d.ts` — **double slash**, and it points at
  `enum.d.ts` rather than `index.d.ts`, so `DeviceInit` / `HIDDevice` / `Device` are not
  reachable through the declared root entry point even though `sdk-keyboard` imports them from
  `@sparklinkplayjoy/hid`.

  `hid` does, however, declare one working deep path for types:

  ```jsonc
  "./src/types": "./dist/esm/index.d.ts"
  ```

  Tested: `import '@sparklinkplayjoy/hid/src/types'` **resolves through the exports map** and
  then fails with `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` — i.e. Node found the file and
  refused to *execute* it, because it is a `.d.ts`. That failure is **expected and not a
  defect**: the entry deliberately maps to a declaration file, so it is for TypeScript's
  resolver (`tsc`/Vite will use it for `DeviceInit` etc.), never for runtime import. This is the
  one supported way to name `hid`'s transport types.

  (`@sparklinkplayjoy/hid/src/types/enum` — trying to reach past the mapped entry to the
  underlying file — fails with `ERR_MODULE_NOT_FOUND`, because the wildcard resolves it to a
  path that does not exist: the package root contains only `dist/` and `package.json`, no
  `src/`.)
- `constants/byte.d.ts` declares a **conflicting duplicate** `KeyLayout` and `KeyTouchMode`
  (§10.3). Not exported, so it cannot collide at the type level — and it is *not* the source of
  the `Layout_DKS1`-style string unions the SDK exports: `constants/param.ts` uses the same
  `Layout_`-prefixed spelling (§10.3), and param.ts is the file the package actually exports
  (`export * as constantsParam from './src/constants/param'`).
- `sdk-keyboard/src/types/type.d.ts` declares a **second, poorer** `CommandQueueEntry` that
  omits `sendTime`, `timeout` and `expectedResponses` (§11.1).

### 13.5 Gaps closed after first pass

Two items were initially left open; both are now resolved.

**`WebHIDServiceV2` is dead code — confirmed at the bundle level, not just the type level.**
`hid/dist/esm/src/` contains **`hidv2.d.ts` with no corresponding `hidv2.js`** — the
implementation was never emitted. Grepping every compiled `.js` in both `sdk-keyboard/dist/`
and `hid/dist/` for `WebHIDServiceV2` and `hidv2` returns **zero matches**, and no `.d.ts`
imports it. So it is not merely unreferenced: there is no runtime code to reference.

It is **not importable by path either**, contrary to what `hid`'s permissive `"./*": "./*"`
wildcard suggests. Tested: `import '@sparklinkplayjoy/hid/dist/esm/src/usb-detection'` fails
with `ERR_MODULE_NOT_FOUND` — the wildcard admits the specifier, then resolution finds only a
`.d.ts`. Since `hidv2.js` does not exist at all, `WebHIDServiceV2` would fail the same way, and
worse: it would type-check cleanly against `hidv2.d.ts` and then fail at runtime. **A type that
resolves is not proof that an implementation ships.** This is the single most dangerous trap in
the package — see §13.4 for the underlying one-bundle-per-package layout.

**`ConfigValidator` and `preciseCalculate` are both unreachable** — see the `exports` analysis
above. Neither can be imported through a supported path, so §9.2 and §10.5 are updated to say
so rather than hedging.

### 13.6 What this means for the type-vs-runtime gap generally

The layout above has a consequence that outlives these three specific cases. Because each
package is **one bundle plus a tree of declarations**, the `.d.ts` files describe modules that
were inlined and no longer exist as separate runtime artifacts. Anything declared in a file that
is *not* re-exported from the package root — `ConfigValidator`, `preciseCalculate`, the
`utils/pack.d.ts` packers, `WebHIDServiceV2`, `constants/byte.d.ts`, `sdkMap` — is:

- **visible to TypeScript** if you reach it by relative path or path alias, and
- **absent at runtime**, because the only loadable module is `dist/esm/index.js`.

So a successful type-check tells you nothing about whether an import will resolve. The
practical rule for this repo: **only trust what the three root entry points export** (§10.1).
Everything else in this reference is documented for comprehension of the public signatures, not
as an available API.

### 13.7 How `src/` currently imports these types — three sites, two of them broken

This project sets `"moduleResolution": "node"` (`tsconfig.json:5`) — the legacy classic/node10
resolver, which resolves through `main`/`module`/`types` and **ignores the `exports` field
entirely**. That single setting explains all three import sites below, and it is why they
disagree with the runtime results in §13.4. Verified with `npx tsc --noEmit -p tsconfig.json`
(**60 errors project-wide**); there is no `typecheck` script, so nothing in CI surfaces these.

**Site 1 — `KeyboardService.ts:2` and `DebugKeyboardService.ts:2` (identical line): broken.**

```ts
import XDKeyboard from '@sparklinkplayjoy/sdk-keyboard';
import type { DeviceInit, Device } from '@sparklinkplayjoy/sdk-keyboard';
```

The default import is fine. The named type imports are not: neither `DeviceInit` nor `Device` is
exported from that root (§10.1) — `DeviceInit` is imported *into* `index.d.ts` from
`@sparklinkplayjoy/hid`, and `Device` appears only inline as
`import("@sparklinkplayjoy/hid").Device`. `tsc` reports **4 × `TS2614`** (2 per file):

```
src/services/KeyboardService.ts(2,15): error TS2614: Module '"@sparklinkplayjoy/sdk-keyboard"'
  has no exported member 'DeviceInit'. …
src/services/KeyboardService.ts(2,27): error TS2614: Module '"@sparklinkplayjoy/sdk-keyboard"'
  has no exported member 'Device'. …
src/services/DebugKeyboardService.ts(2,15): error TS2614: … 'DeviceInit'. …
src/services/DebugKeyboardService.ts(2,27): error TS2614: … 'Device'. …
```

Both names are real and exported — from `@sparklinkplayjoy/hid`, whose root does
`export * from './src/types/types'` (`types.d.ts:10` declares `DeviceInit`, `:47` declares
`Device`). Note this is a **type-only** import, so it erases at compile time and the app runs
correctly today — the breakage is invisible outside `tsc`, which is exactly why it survived.
`DeviceInit` is also **unused** in both files, so half the error count is dead weight.

> **Correction to an earlier claim in this section.** A prior revision said "the fix is to change
> the *specifier*, not the names", on the grounds that classic resolution "falls back to
> `main`/`module` and finds `dist/esm/index.d.ts`". **That is wrong, and has been measured.**
> `hid`'s `package.json` declares `types: "./dist/esm//types/enum.d.ts"` — a double-slash path
> whose target directory (`dist/esm/types/`) does not exist (§13.4). Because the field is
> *present*, `moduleResolution: "node"` honours it and does **not** fall back to the valid
> adjacent `dist/cjs/index.d.ts`. Importing `Device`/`DeviceInit` from the `@sparklinkplayjoy/hid`
> **root** therefore yields `TS7016`, and both names degrade to `any` — the 4 × `TS2614` are
> traded for total loss of type safety on `Device`. Untruncated message from the probe run:
>
> ```
> src/services/KeyboardService.ts(2,15): error TS7016: Could not find a declaration file for
>   module '@sparklinkplayjoy/hid'. '…/node_modules/@sparklinkplayjoy/hid/dist/cjs/index.js'
>   implicitly has an 'any' type. There are types at
>   '…/node_modules/@sparklinkplayjoy/hid/dist/esm/index.d.ts', but this result could not be
>   resolved under your current 'moduleResolution' setting. Consider updating to 'node16',
>   'nodenext', or 'bundler'.
> ```
>
> `dist/cjs/index.d.ts` and `dist/esm/index.d.ts` are byte-identical and both valid — the file
> TypeScript names in its own diagnostic. The defect is purely that the `types` field blocks the
> lookup. A **deep path** straight to the `.d.ts` does resolve (variant B/D below), and so does a
> `paths` mapping that bypasses `types` (§13.7.3). Under a modern resolver (`node16`/`bundler`)
> the `exports` map takes precedence, admits `"./src/types"`, and would also resolve the root —
> so **migrating `moduleResolution` would change which of these imports work**, in both
> directions.

**Site 2 — `ExportService.ts:3`: works, but only by accident of the resolver.**

```ts
import type { KeyboardConfig, Keyboards } from '@sparklinkplayjoy/sdk-keyboard/dist/esm/src/utils/validate';
```

`ExportService.ts` produces **0 errors**. Under `moduleResolution: "node"` the deep path resolves
straight to the `.d.ts` on disk, and both names genuinely exist there (`validate.d.ts:63`
`Keyboards`, `:72` `KeyboardConfig`). But §13.4 proved this exact specifier fails at runtime with
`ERR_PACKAGE_PATH_NOT_EXPORTED`. It is safe *here* only because the import is type-only and is
erased — had it been a value import (`ConfigValidator`), the build would pass and the app would
crash on load.

Two caveats worth recording: the path is fragile (it breaks if the SDK ever emits per-module JS,
reorders `dist`, or if the project adopts `node16`/`bundler` resolution), and `KeyboardConfig` is
a schema this repo depends on for export/import — so the dependency is load-bearing, not
incidental. The robust alternative is to import these from `@sparklinkplayjoy/sdk-keyboard`'s
root, which does not export them (§10.1), or to declare the shape locally in `src/types/`.

**Site 3 — the rest of `src/`.** No other file imports from the three packages; everything else
goes through the `KeyboardService` singleton, which is why the breakage is contained to two
lines.

#### 13.7.1 Measured: four candidate fixes for Site 1

Each candidate, plus the baseline, was run as a full `tsc --noEmit` against a scratch copy of the
repo (`src/`, `tsconfig.json`, and a copied `node_modules`) outside the working tree, so no source
file in the repo was modified. That copy has since been deleted; the numbers below are what it
produced. Deltas are set-diffs over `(file, line, col, code, message)` tuples, not just error
counts — a count can fall while type safety is lost (variant A is exactly that trap).

| # | Import specifier for `Device` / `DeviceInit` | Errors | Verdict |
|---|---|---|---|
| — | *baseline* — `from '@sparklinkplayjoy/sdk-keyboard'` | **60** | 4 × `TS2614`, but `Device` is `any` so nothing downstream complains |
| A | `from '@sparklinkplayjoy/hid'` (root) | **58** | 4 × `TS2614` → 2 × `TS7016`. Both names become `any`. **Rejected** — lower count, zero safety |
| B | `from '@sparklinkplayjoy/hid/dist/esm/src/types/types'` | **72** | Types genuinely resolve; unmasks 16 latent errors |
| D | `from '@sparklinkplayjoy/hid/dist/cjs/src/types/types'` | **72** | Identical to B, byte for byte |
| P | `from '@sparklinkplayjoy/hid'` (root) **+ `tsconfig` `paths` → `dist/cjs/index.d.ts`** | **74** | Clean root import *and* real types; unmasks B/D's 16 **plus 2 more** — see §13.7.4 |

Two accounting notes. First, B and D are the *same* file — the package ships one bundle plus a
`.d.ts` tree, so `dist/esm/src/types/types.d.ts` and `dist/cjs/src/types/types.d.ts` are
equivalent; pick one, don't treat them as alternatives. Second, B's +12 net is **not new
breakage**. The baseline's 60 already contains a `TS2304 Cannot find name 'HIDDevice'` at
`KeyboardService.ts(7,11)`; under B it is merely *reworded* to
`TS2552 … Did you mean 'Device'?` at the same position. Diffing on message text alone reports
that as fixed-and-new, so it must be counted once on each side. The genuine tally for B is:
**4 × `TS2614` fixed, 1 reworded, ~16 genuinely new.**

The rise from 60 to 72 is the interesting result: those 16 errors were **always true** and are
only visible once `Device` and `HIDDevice` have real shapes. The baseline hid them by making
everything `any`.

#### 13.7.2 The 16 latent errors variant B unmasks — and which are unrelated to the import

**Independent of the fix — ambient WebHID types are missing.** No `@types/w3c-web-hid` is
installed (`node_modules/@types` holds only chai, crypto-js, deep-eql, estree), and
**`HIDDevice` occurs 0 times in TypeScript's own `lib.dom.d.ts`**. `hid` declares its own
`HIDDevice` interface at `types.d.ts:27`, shadowing the standard WebHID global. Consequences:

| Diagnostic | Sites | Meaning |
|---|---|---|
| `TS2552` / `TS2304` | `KeyboardService.ts(7,11)` | `interface HIDConnectionEvent { device: HIDDevice }` names a type that is not in scope. Only reference to `HIDDevice` in all of `src/`, so it needs importing alongside `Device`. |
| `TS2339` `Property 'hid' does not exist on type 'Navigator'` | `(181,46) (1216,48) (1350,48)` | `navigator.hid` is not declared on `Navigator` without the WebHID ambient types. |
| `TS18046` `'navigator.hid' is of type 'unknown'` | `(31,7) (32,7) (125,29)` | Same root cause, different expression position. |
| `TS7006` parameter implicitly `any` | `(182,51) (864,81) (1217,56) (1351,56)` | Callback parameters on the untyped `navigator.hid` calls, so their types cannot be inferred. |

**A real bug, not a type artefact.** `hid`'s `HIDDevice` has **no `serialNumber` member**:

| Diagnostic | Sites | Meaning |
|---|---|---|
| `TS2339` `Property 'serialNumber' does not exist on type 'HIDDevice'` | `(134,138) (191,163)` | `d.data.serialNumber === device.serialNumber` — the property is read but never declared. `serialNumber` appears nowhere in hid's types. At runtime the value is `undefined` on both sides, so `undefined === undefined` is `true` and the comparison silently passes for every device. The stable-ID fallback at `(135,…)` already anticipates this (`device.serialNumber \|\| 'unknown'`), which is why it works. |

This one deserves a decision of its own, separate from the import fix: either install
`@types/w3c-web-hid` (which declares `serialNumber` as `string`, matching the platform) or
drop the comparison.

**Caused by `Device`'s optional `data`.** `types.d.ts:47` declares
`type Device = DeviceInfo & { id: string; productName: string; data?: HIDDevice; collections: ReadonlyArray<HIDCollectionInfo> }` — note `data?`:

| Diagnostic | Sites | Meaning |
|---|---|---|
| `TS18048` `'d.data' is possibly 'undefined'` | `(134,51) (134,90) (134,131) (191,58) (191,106) (191,156)` | Every `d.data.vendorId` / `d.data.productId` / `d.data.serialNumber` in the `.find()` predicates. Real: a `Device` can legitimately have no live `HIDDevice`. |

**Caused by the two object literals — see the design constraint below.**

| Diagnostic | Sites | Meaning |
|---|---|---|
| `TS2322` `Type 'Device \| { id: any; data: any; productName: any; }' is not assignable to type 'Device \| null'` | `KeyboardService.ts (138,7) (141,7) (195,13) (199,13)`, `DebugKeyboardService.ts (51,13) (52,13) (81,7) (82,7)` | The literals supply only `id`, `data`, `productName`. `Device` additionally requires `collections` (non-optional) and `DeviceInfo`'s `usage` / `usagePage`. |

> **Design constraint — do not "fix" the `TS2322`s by completing the literals.**
> The omissions at `KeyboardService.ts` ~136 and ~193 are **deliberate**. This driver must work
> with **any** SparkLink-compatible keyboard, so it must not assert a `vendorId`, `usage`, or
> `usagePage` it has not read from the device. Hard-coding those would silently narrow the
> supported hardware to one product. The fix belongs at the **type annotation**: widen the
> declared type of `this.connectedDevice` / the return type to something the literal actually
> satisfies — e.g. `Partial<Device>`, or a local
> `type PairedDevice = Pick<Device, 'id' | 'productName'> & { data?: HIDDevice }` — and never by
> adding the missing fields.

Also present under B, and **pre-existing in the baseline** (listed only so they are not
misattributed to the import fix): `(538,35) TS2554`, `(608,67) (622,74) (776,68) (790,75) TS2345`
on `DksLayoutType`, `(799,37) (813,35) TS2304` on `Calibration`, `(975,68) TS2345`,
`(1065,62) TS2345` on `DksType`, `(1193,11) TS2358`.

#### 13.7.3 Proposed fix for Site 1 — not applied

Four parts, in order of independence:

1. **Drop `DeviceInit`.** Unused in both files; removing it clears 2 × `TS2614` with no other
   consequence.
2. **Import `Device` and `HIDDevice` from a specifier that actually resolves.** Two candidates,
   both now measured:
   - the deep path `@sparklinkplayjoy/hid/dist/cjs/src/types/types` (variants B/D, **72**) —
     works today under `moduleResolution: "node"`, and is the same pattern `ExportService.ts:3`
     already uses (Site 2). It fixes *only the app's own import line*. Fragile in the same way:
     it breaks if the package reorders `dist`, starts emitting per-module JS, or if the project
     migrates to `node16`/`bundler`. Must stay `import type` — a value import of that path fails
     at runtime with `ERR_PACKAGE_PATH_NOT_EXPORTED` (§13.4), exactly like Site 2.
   - a `paths` mapping in `tsconfig.json` pointing `@sparklinkplayjoy/hid` at
     `node_modules/@sparklinkplayjoy/hid/dist/cjs/index.d.ts`, keeping the *clean* root specifier
     (variant P, **74**). Sidesteps the broken `types` field and keeps the import text portable
     across resolvers — but it remaps the specifier for the **whole module graph**, not just
     `src/`, which is why it surfaces 2 more errors than B/D. See §13.7.4.
3. **Widen only the annotation** at the two literals, per the design constraint above
   (`Partial<Device>` or a local `PairedDevice`). Do not touch the literals' contents.
4. **Handle `navigator.hid` and `serialNumber` separately.** These are ambient-typing gaps, not
   import-path problems, and fixing them in the same change conflates two concerns. Adding
   `@types/w3c-web-hid` is the likely answer for both, but it would re-declare `HIDDevice`
   globally and could collide with hid's own declaration — verify before adopting.

None of this is in the repo. `src/` is unmodified; all measurements came from a scratch copy.

#### 13.7.4 Why the `paths` mapping (variant P) reaches 74, not 72

The deep path in B/D rewrites **one import line in `src/`**. The `paths` mapping instead rebinds
the bare specifier `@sparklinkplayjoy/hid` **everywhere TypeScript resolves it**, including
inside the dependency's own `.d.ts` files. That distinction is what produces the two extra
errors — and it is the whole reason to prefer `paths` despite the higher count.

`sdk-keyboard/dist/esm/index.d.ts:1` opens with
`import { DeviceInit, EVENT, HIDDevice } from '@sparklinkplayjoy/hid'`, and its façade is
`constructor(options: DeviceInit)` (`:11`). At **baseline** that root specifier hits hid's
broken `types` field, so `DeviceInit` resolves to `any` and the constructor is
`new XDKeyboard(…anything…)`. Both call sites —
`KeyboardService.ts(43,9)` and `DebugKeyboardService.ts(11,7)`, each
`new XDKeyboard({ usage: 1, usagePage: 65440 })` — are therefore unchecked.

Under **variant P** the mapping fixes the root specifier *for sdk-keyboard too*, so `DeviceInit`
becomes the real type (`types.d.ts:10`):

```ts
export type DeviceInit = {
    configs: DeviceInfo[];
    usage: number;
    usagePage: number[];      // ← array, not scalar
};
```

That immediately flags the two calls:

```
src/services/KeyboardService.ts(43,9):      error TS2322: Type 'number' is not assignable to type 'number[]'.
src/services/DebugKeyboardService.ts(11,7): error TS2322: Type 'number' is not assignable to type 'number[]'.
```

Two things worth recording about this specific mismatch, because neither is a simple "add the
brackets":

- **`usagePage: 65440` vs the declared `number[]`.** The `.d.ts` says array, but the compiled
  runtime normalises a scalar: `this.usagePage = Array.isArray(s) ? s : [s]` (and likewise for
  `usage`). So the scalar form **works at runtime**; hid's own type is stricter than its
  implementation. The honest fix is `[65440]`, which satisfies both.
- **`configs` is required but never passed — and TypeScript hides that behind the `usagePage`
  error.** Object-literal checking reports one problem at a time. Changing the call to
  `new XDKeyboard({ usage: 1, usagePage: [65440] })` in the probe made the *next* error appear:
  `TS2741: Property 'configs' is missing in type '{ usage: number; usagePage: number[]; }' but
  required in type 'DeviceInit'`. Verified by editing the probe, not inferred.

  **This note is now closed — the missing `configs` is harmless, and the reason is worth keeping.**
  `configs` is only ever consumed by hid's own `requestDevice()`, which does
  `navigator.hid.requestDevice({ filters: this.configs })` (verified in `hid/dist/esm/index.js`).
  But **`XDKeyboard` does not expose `requestDevice`** — it is not on the façade at all (§11.1;
  confirmed by grep over `sdk-keyboard/dist/esm/index.d.ts`). Device picking in this app is done by
  `KeyboardService.requestDevice()` (`src/services/KeyboardService.ts:120`–`146`), which calls the
  browser API **directly** with an explicitly empty filter list:

  ```ts
  const devices = await navigator.hid.requestDevice({ filters: [] });
  ```

  So hid's `requestDevice` — and therefore `configs` — is **never invoked on this code path**, and
  the `undefined` `configs` never reaches a `filters` argument. Nothing is silently unfiltered;
  the filtering step simply does not happen in the SDK at all. `filters: []` at the app level is
  **intentional**: it lets the user pick *any* HID device so the driver works with any
  SparkLink-compatible keyboard, consistent with the design constraint against hard-coding
  vendor/product IDs. (The superseded `docs/SDK_REFERENCE.md` hard-codes `vendorId: 7331` /
  `productId: 1793` in its pairing example; those identify **one** specific board and must not be
  read as a requirement.)

  **What `usagePage: 65440` actually does.** `65440` = `0xFFA0`, a vendor-defined usage page. It is
  **not a device filter** — it selects the **SparkLink command interface (HID collection)** *within*
  whichever device was chosen. Concretely, hid uses `usage`/`usagePage` in two verified places:
  `filterHIDDevices` matches a device by testing whether *some* collection satisfies
  `c.usage === this.usage[t] && c.usagePage === this.usagePage[s]`, and `tagDevice` records
  `usage: this.usage[0]` plus `usagePage: collections?.[0]?.usagePage || -1`. So the pair identifies
  the right interface on an already-granted device rather than narrowing the picker. `configs` would
  have been the picker-level filter; `usage`/`usagePage` are the interface-level selector.

  Net: the two constructor edits variant P forces are (a) wrap `usagePage` as `[65440]` — a genuine
  type-vs-runtime mismatch, since the compiled constructor normalises a scalar via
  `Array.isArray(s) ? s : [s]` — and (b) supply or silence the required `configs`, which is a **pure
  type-formality** with no runtime consequence here. Passing `configs: []` is the minimal honest
  change; it types correctly and preserves today's behaviour exactly.

The takeaway for the proposal: variant P's 74 is **not** "2 worse than B/D" in any meaningful
sense — it is B/D's 16 latent errors **plus** the constructor-typing that the dependency's own
broken `types` field had been masking all along. P is the only variant that makes
`XDKeyboard`'s constructor honest. If the goal is a clean `tsc`, choose P and budget for the two
constructor edits (wrap `usagePage` in an array; decide the `configs` question); if the goal is
the smallest change that clears the four `TS2614`, B/D's deep path does it without touching the
constructor — at the cost of leaving that latent mismatch invisible.

---

## 14. The 21 unwrapped SDK methods

These have **no call site in `src/services/KeyboardService.ts`**. Signatures re-verified verbatim
against `sdk-keyboard/dist/esm/index.d.ts` (batch 4c). **Correction:** the facade declares
`Promise<any>` for most getters here — where a concrete return shape is shown, it was verified at
the *controller/recdata* layer (§6.x), not from the facade's types. Grouped by what adding them
would unlock.

### 14.1 Event / reconnection API — 3

The app bypasses these entirely, using raw
`navigator.hid.addEventListener('connect' | 'disconnect', …)` plus a self-maintained
`pairedStableId` in localStorage, with its own retry logic and temporary `console.error`
suppression. That is the reason `UsbDetect.generateStableId` being private (§11.3) matters.

| # | Signature | Returns | One-line description |
|---|---|---|---|
| 1 | `on(eventName: EVENT \| string, handler: EventHandler)` | `void` | Subscribe to SDK events. **✅ verified** (§10.7): real channels are `usbChange`, the decoded `EVENT` camelCase values (re-keyed by reply byte[2] via `sdkMap`), plus hid-level `deviceStatus`/`deviceInfo`/`inputReport` (re-tagged). Throws if `handler` is not a function. No "voice" channel exists. |
| 2 | `off(eventName: EVENT \| string)` | `void` | Remove **all** handlers for an event — cannot target one listener (see §1). **✅ verified**: same `sdkMap` reverse lookup as `on`; the facade drops `DeviceBase.off`'s optional `handler` argument (§10.7). |
| 3 | `reconnection(device: HIDDevice, id: string)` | `Promise<void>` | Re-attach to a device that dropped and reappeared, without a full re-`init`. **✅ verified**: delegates to `DeviceBase.reconnection`, which actually resolves `true`/`undefined` (the `Promise<void>` type is a lie) and is serialized by an `isReconnecting` guard — concurrent calls no-op with a console warning (§10.7). |

Adopting these would let the app drop its hand-rolled reconnect state machine — but
`reconnection`'s `isUpgrading` guard (§11.1) and the transport-level vs `EVENT`-level string
collision (§11.2) would both need handling.

### 14.2 System — 1

| # | Signature | Returns | One-line description |
|---|---|---|---|
| 4 | `setTopDeadSwitch(value: number)` | `Promise<boolean>` | Set the global top dead-band (travel ignored at the top of the stroke). |

**✅ Verified** (bundle): facade sends `InfoController.cmd({type: 'ORDER_TYPE_TOP_DEAD_SWITCH',
hArgs: [value]})` and returns the reply decoded via `getCmd` — i.e. the generic ORDER_TYPE
envelope (same controller as `factoryDataReset`), not a dedicated layout slot. On throw it
returns the `Error` (so the real type is `Promise<boolean | Error>`).

`OrderType.TOP_DEAD_SWITCH` (52). Persisted as `KeyboardConfig.system.topDeadBandSwitch`, so it
survives `exportConfig`/`importConfig` — meaning the app **already round-trips a setting it has
no UI to change**.

### 14.3 Lighting saturation — 2

| # | Signature | Returns | One-line description |
|---|---|---|---|
| 5 | `getSaturation()` | `Promise<any>` | Read colour saturation. |
| 6 | `setLightingSaturation(param: number[])` | `Promise<any>` | Write colour saturation. |

**✅ Verified** (bundle):
- `getSaturation` is `InfoController.cmd({type: 'QUERY_LIGHT_FIX_RGB'})` + `getCmd(reply)` —
  confirmed on **InfoController, not LightingController** (it rides the generic query envelope).
- `setLightingSaturation` is `LightingController.cmdRGBSaturation(false, param)`; the packer
  builds payload `[68, ...param, 0xff, 0xff]` — leading byte **68** is a fixed sub-command, the
  `number[]` is copied through **verbatim as raw payload bytes**, and two `0xff` bytes pad the
  tail. So `param`'s length is whatever the firmware's saturation record is; the SDK imposes no
  length/range check. Neither is documented in types (§8).

Also persisted in `KeyboardConfig.light.*` and thus already round-tripped blind.

### 14.4 Key mapping — 1

| # | Signature | Returns | One-line description |
|---|---|---|---|
| 7 | `deleteKey(key: number, mode: TouchModeType)` | `Promise<any>` | Clear a key's advanced/trigger config for `'global' \| 'single' \| 'rt'`, restoring defaults. |

**✅ Verified** (bundle): a **single** `cmdLayout(false, {key, layout: 8, value})` write where
`value = KeyTouchMode[mode] << 4` — i.e. it overwrites the key's touch-mode slot (layout 8) with
the mode nibble shifted into the high half; there is no per-config iteration. `KeyTouchMode` is
the string→number map from `constants`. Returns the raw `sendData` result, or the `Error`.

This is the **only reset path for a single key**. Without it the app can only clear a key by
overwriting it with a default-shaped config, or nuke everything with `factoryDataReset`.

### 14.5 DKS / TRPS — 4

| # | Signature | Returns | One-line description |
|---|---|---|---|
| 8 | `setDks(param: IDKSMode)` | `Promise<any>` | Write all four DKS actuation points + TRPS points + dead bands for a key in one call. **✅ verified**: facade `setDks = (e) => higherKeyController.setDKS(e)` → `cmdDKS(false, param)`; returns the **decoded** reply (`getDks(reply)`). |
| 9 | `getDksAll(key: number)` | `Promise<{ dks1: number; dks2: number; dks3: number; dks4: number }>` | Read all four DKS **key codes** — **✅ verified**: 4 sequential `cmdLayout(true, {key, layout: Layout_DKS1..4})` round trips, each decoded with `getDks`, assembled into `{dks1..dks4}` (§6.1). |
| 10 | `getTrps(key: number, type: TrpsLayoutType)` | `Promise<{ trps: number }>` | Read one TRPS value (`Layout_TRPS1`–`Layout_TRPS4`); **✅ verified**: single `cmdLayout(true, {key, layout: KeyLayout[type]})` → `getTrps(reply)`. `type` is **required** — no default, the bundle indexes `KeyLayout[type]` directly (§6.2). |
| 11 | `getTrpsAll(key: number)` | `Promise<{ trps1: number; trps2: number; trps3: number; trps4: number }>` | Read all four TRPS values — **✅ verified**: 4 sequential round trips (`Layout_TRPS1..4`), each decoded with `getTrps`, assembled into `{trps1..trps4}` (§6.2). |

**`setDks` is the single biggest gap.** The app reads DKS state (`getDks` is wrapped) but has
**no way to write it** — and there is no `setTrps` at any layer, so TRPS is writable *only*
through `setDks`'s `IDKSMode.trps` array (§6.1). The DKS page can therefore display but not
persist TRPS.

⚠️ **`getDksAll`/`getTrpsAll` are *not* batched — corrected in Batch 2.** They are convenience
aggregates that issue **four sequential `cmdLayout` round-trips** each, then return
`{dks1..dks4}` / `{trps1..trps4}` (§6.1, §6.2). Using them saves *caller* code but **zero** round
trips against the serial queue (§11.1); there is no bulk-read command for these slots. Any plan that
assumed a 4:1 saving here is wrong.

### 14.6 MT / TGL / END / SOCD / MPT — 6

The app wraps **every getter** in this group and **not one setter**. Each advanced-key page can
render existing config but cannot save changes through these methods.

| # | Signature | Returns | One-line description |
|---|---|---|---|
| 12 | `getMtorTgl(key: number)` | `Promise<number>` | Read the shared MT/TGL **delay in ms** (`Layout_MTDelay`, raw ×10). **✅ verified**: a single `cmdLayout(true, {key, layout: Layout_MTDelay})` read, decoded by `getMtorTgl`. **Not** a mode discriminator — see §6.3. |
| 13 | `setMT(param: IMTMode)` | `Promise<any>` | Write a key's mod-tap config (`{key, dks[], delay}`). **✅ verified**: reply is decoded and the **decoded shape is returned** (`getMtRecdata(reply)`), not the raw send result. |
| 14 | `setTGL(param: ITGLMode)` | `Promise<any>` | Write a key's toggle config (`{key, dks?, delay?}`). **✅ verified**: returns the decoded reply (`getTglData`). |
| 15 | `setEND(param: IEndMode, v?: string)` | `Promise<any>` | Write a key's END config; `v` is the firmware version gate. **✅ verified**: `v` is forwarded to `cmdEND`; returns the decoded reply (`getEndData`). |
| 16 | `setSocd(param: ISOCDMode \| ISOCDModeV2 \| ISOCDModeV3, v?: string)` | `Promise<any>` | Write a key's SOCD config for the payload generation matching `v`. **✅ verified**: returns the decoded reply **via `getSocdData(reply, v)`** — the read-back shape matches the `v` you wrote with. Bundle oddity: it computes a `compareVersions(v, '1.0.5')` result and **discards it** (comma operator), and logs `console.log("111111", param)`. |
| 17 | `setMpt(param: IMPTMode)` | `Promise<any>` | Write a key's MPT config (`{key, dks?, dbs?}`). **✅ verified**: returns the decoded reply (`getMptData`); controller defaults `v = '1.0.5'` (dropped at the facade) and logs `console.log("data", packed)`. |

**Common setter pattern (✅ verified, bundle)**: every setter in §14.5–14.7 (`setDks`, `setMT`,
`setTGL`, `setEND`, `setSocd`, `setMPT`, `setRS`) **sends then decodes and returns the reply** with
its matching recdata decoder — you get the same object shape the corresponding getter returns, so a
write doubles as a read-back. All catch and return the `Error`.

`getMtorTgl` being unwrapped is a **smaller** gap than earlier drafts claimed. It does not gate the
use of `getMT`/`getTGL` — MT vs TGL is read from `advancedKeyMode` (3 vs 4) via `getPerformanceMode`
(§5.2), which *is* wrapped. What it does cost: `getMT` never returns a delay (§6.5), so the app has
**no way to read the MT/TGL delay** until `getMtorTgl` is wrapped. (`getTglRecdata` does return
`delay` for TGL, so TGL is unaffected.)

`setEND` and `setSocd` are the **only** setters here that expose the `v?` version gate on the façade
(`getSocd` exposes it too) — see the corrected note in §6.7 and the gate table in §6.0.
`setMT`/`setTGL`/`setMpt` accept `v` at the controller layer but drop it at the façade, and for MT/TGL
the command builders drop it again before packing (§11.4), so their gate is unreachable twice over.
`setMpt` has no gate at all (`MPTDataPack` takes no `v`). The `v` gate matters in practice only for
END and SOCD, where it decides whether `delay` is written at all (§6.7, §6.8).

`setSocd` additionally has the discriminated-union read problem: `getSocdData` returns one of two
shapes with no discriminant field, so you must branch on `pos1` vs `pos` — and at the façade's default
`v = '1.0.5'` the read returns the *narrow* `{pos, key, type, mode}` shape while the write sent the
wide one, so half the config is unreadable (§6.8).

### 14.7 RS — 2

| # | Signature | Returns | One-line description |
|---|---|---|---|
| 18 | `getRS(key: number)` | `Promise<{ dks1: number; dks2: number }>` | Read a key's RS config. **✅ verified**: `cmdRS(true, {key, dks: 0})` → `getRsData(reply)`. Note the read packs a **`dks: 0` placeholder** even though only `key` is used for a read. |
| 19 | `setRS(param: IRSMode)` | `Promise<any>` | Write a key's RS config (`{key, dks}`). **✅ verified**: `cmdRS(false, param)` → returns the **decoded** reply (`getRsData`), not the raw send result. |

The **only feature with both halves missing**. Asymmetric payload: write one `dks`, read back
two (`dks1`, `dks2`) — §6.9.

### 14.8 Firmware update — 2

| # | Signature | Returns | One-line description |
|---|---|---|---|
| 20 | `updateBin(bin: ArrayBuffer, cb, config?)` | `Promise<{ success: boolean }>` | Flash firmware: to boot → sign → erase → write 512-byte pages → CRC → back to app. |
| 21 | `toBoot()` | `Promise<void>` | Reboot the device into bootloader mode. |

```ts
updateBin(
  bin: ArrayBuffer,
  cb: (data: { current: number; total: number }) => void,   // required, unlike the controller's
  config?: { toBootDelay: number; writeDelay: number; toAppDelay: number }
): Promise<{ success: boolean }>
```

**✅ Verified** (bundle + `index.d.ts`, batch 4c):
- Facade defaults are `config = {toBootDelay: 4000, writeDelay: 30, toAppDelay: 4000}` (ms).
- Facade **runtime-checks** `bin instanceof ArrayBuffer` and throws
  `"Provided file is not an ArrayBuffer"` otherwise — then converts to `Uint8Array` and calls
  `SystemController.updateDrive(u8, cb, config)` on a **fresh controller instance per call**
  (state lives in statics, so that is safe).
- Unlike almost every other facade method, `updateBin`/`toBoot` **rethrow** (`throw new
  Error(e.message)`) rather than returning the `Error` — callers need try/catch, and the
  original error type/stack is flattened.
- `updateDrive` flow (bundle): `setUpgrading(true)` → `cb({current:0,total,updateStatus:'beforeToBoot'})`
  → `toBoot()` → `'afterToBoot'` → wait `toBootDelay` → `'afterToBootDelay'` →
  `setUpgradingAfterBoot(true)` → `init()`; if `init` returns `'toBootFirst'` it re-enumerates
  devices (`getDevices()[0]`), re-inits, and re-reads base info → 30 ms wait → **throws
  `"The keyboard is not in upgrade mode"` if `KeyboardRunMode === 0`** → zero-pads the bin to a
  512-byte multiple → sign/erase/write/CRC phases using `BLControls` (`BL_SIGN`, `BL_ERASE`,
  `BL_WRITE`, `BL_TOBOOT`, `BL_REBOOT`).
- `cb` is invoked with **optional chaining** (`t?.(…)`), so it is genuinely optional on the
  controller; only the facade *type* marks it required.
- The `updateStatus` phase strings (`beforeToBoot`, `afterToBoot`, `beforeToBootDelay`,
  `afterToBootDelay`, …) **are** passed at runtime; the facade's callback type just omits the
  field. A cast/looser local type recovers them.

Four traps if these are ever wired up (§9.3):
1. `bin` must be an `ArrayBuffer`, **not** a `Uint8Array` — the facade throws; the controller takes the latter.
2. `cb` is **required** on the façade type but optional at runtime (`t?.()`).
3. The façade's callback type **drops `updateStatus?: string`**, though it is passed at runtime.
4. `SystemController.resetUpgradeStatus()` — the only thing that clears the static
   `isUpgrading*` flags after a failed flash — is **not exposed on `XDKeyboard`** (absent from
   `index.d.ts`). A failed update can therefore leave reconnect handling permanently suppressed.

### 14.9 Cross-cutting behavioural gaps (not per-method)

Three gaps cut across methods rather than belonging to one unwrapped signature. Each is
verified against source/bundle; the first additionally needs a hardware check for its
*runtime effect*.

**(a) `setMacro` without `touchMode` should reset a single/RT key to global — §7.**
The app calls `setMacro(param, macros)` with **no third argument** (`KeyboardService.ts:538`),
so `touchMode` is `undefined` → the compiled implementation computes `u = 0` and rewrites the
entire `Layout_Mode` byte as `(u << 4) | 6 = 0x06`. Because `KeyTouchMode` is
`{ global = 0, single = 1, rt = 2 }` (§5.2) and `'quick'` is the **only** accepted string that
yields `u = 2`, writing a macro to a key that is currently in `single` or `rt` mode should
collapse it to `global` (and set `advancedKeyMode = 6`). This is a source-verified encoding;
its **real-world effect is a hardware test** (see the
[Hardware verification checklist](#hardware-verification-checklist), "setMacro touchMode reset
bug"). If confirmed, the app should pass the key's current `touchMode` as the third argument,
or re-apply it after the macro write.

**(b) The lighting `v` (1.0.9 `dynamicColorId`) gate is unreachable through the public facade — §6.0, §8.**
`XDKeyboard.getLighting`/`setLighting` delegate to `LightingController` **without forwarding a
`v` argument**, so the controller's default `'1.0.7'` always wins. The packer's `v >= 1.0.9`
branch that appends (write) / reads `data[43]` as `dynamicColorId` (read) therefore **can never
fire** via the public API. It is not a bug to fix — it is a dead code path behind a version gate
the facade never satisfies. Any firmware ≥1.0.9 dynamic-colour behaviour is inaccessible without
calling `LightingController` directly (which is itself unreachable per §13.4/§13.6). Documented so
nobody assumes `dynamicColorId` is live.

**(c) The SDK's DKS import path writes only 2 of the 3 DB slots, leaving `Layout_DB3` stale — §6.1.**
`ExportController.importConfig` → `setAdvancedKeys` builds the dead-band array as
`dbs = [1000 * cfg.db, 1000 * cfg.db2]` — **exactly two values** — so a config import populates
`Layout_DB1` and `Layout_DB2` but **not `Layout_DB3`**. Since `getDksTravel`/`getDbTravel` can
read all three (§5.6), reading `Layout_DB3` after an import returns whatever the firmware last
held there, not a value the import wrote. This is SDK-internal import code (not this app's — the
app never calls `setDks`), so it affects anyone relying on `importConfig` to fully restore DKS
dead bands. A complete restore would need the third DB written separately.

---

## Summary of gaps worth acting on

| Priority | Gap | Impact |
|---|---|---|
| **High** | `setDks` unwrapped (§14.5) | DKS **and** TRPS cannot be saved at all — no `setTrps` exists anywhere. |
| **High** | All of `setMT`/`setTGL`/`setEND`/`setSocd`/`setMpt` unwrapped, plus `getMtorTgl` (§14.6) | Five advanced-key pages can render config but not persist it. MT-vs-TGL *is* disambiguable — via `advancedKeyMode` 3/4 from the wrapped `getPerformanceMode` (§5.2) — so the wrapped readers work; what is missing is the **MT delay**, which only `getMtorTgl` returns (TGL's own decoder already includes `delay`, §6.5). |
| **High** | `getRS`/`setRS` both unwrapped (§14.7) | RS feature entirely unreachable. |
| **High** | `setMacro` called with no `touchMode` (§7, §14.9) | **Silent config loss, pending hardware confirmation.** The app calls `setMacro(param, macros)` (`KeyboardService.ts:538`), so `touchMode` is `undefined` → `u = 0` → the whole `Layout_Mode` byte is rewritten as `(0 << 4) \| 6`. Since `KeyTouchMode.rt = 2` and `'quick'` is the only value that produces `u = 2`, a macro write to a key already in **single or RT** mode should reset it to **global**. *Test on hardware* — see the [Hardware verification checklist](#hardware-verification-checklist). |
| **Medium** | `deleteKey` unwrapped (§14.4) | No per-key reset; only `factoryDataReset`. |
| **Medium** | `on`/`off`/`reconnection` bypassed (§14.1) | App maintains a hand-rolled reconnect state machine the SDK already provides. |
| **Medium** | `resetUpgradeStatus` unexposed (§14.8) | Failed firmware flash can wedge reconnect handling with no public recovery path. |
| **Medium** | SDK DKS import path writes only 2 of 3 DB slots (§6.1, §14.9) | `ExportController.importConfig` → `setAdvancedKeys` builds `dbs = [1000*cfg.db, 1000*cfg.db2]` — exactly two values — so `Layout_DB1`/`DB2` are written and **`Layout_DB3` is left stale** at whatever the firmware last held, while `getDksTravel`/`getDbTravel` can read all three (§5.6). An imported config therefore does not fully restore DKS dead bands. |
| **Low** | `getSaturation`/`setLightingSaturation`, `setTopDeadSwitch` unwrapped (§14.2–14.3) | Settings already round-trip through `exportConfig` but have no UI. |
| **Low** | `getDksAll`/`getTrpsAll` unwrapped (§14.5) | Convenience only — they are **4 sequential round trips each**, not batched, so there is **no** round-trip saving against the serial queue (§6.1, §6.2). |
| **Low** | Lighting `v` gate (1.0.9 `dynamicColorId`) unreachable (§6.0, §8, §14.9) | The facade's `getLighting`/`setLighting` pass no `v`, so the controller default `'1.0.7'` always wins and the `v >= 1.0.9` branch that appends/reads `dynamicColorId` **can never fire**. Not fixable through the public API — any ≥1.0.9 dynamic-colour behaviour is inaccessible without a controller-level call. |

---

*End of reference. 75 public `XDKeyboard` members documented: 54 with call sites in
`src/services/KeyboardService.ts`, 21 without.*
