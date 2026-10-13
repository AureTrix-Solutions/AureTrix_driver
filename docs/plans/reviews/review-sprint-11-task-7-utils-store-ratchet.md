# REVIEW: sprint-11-task-7-utils-store-ratchet

**SPRINT GOAL:** Ratchet ESLint warnings 221 → 0 honestly (real types + real dead-code removal, no new suppressions), delete the orphaned DebugKeyboardService, and end with the three deferred rules promoted to errors and docs/lint-baseline.txt at 0 — mirroring the tsc-baseline ratchet (sprint-07).
**TASK:** Task 7 — Utils/store ratchet (9 sites)  ·  **TAG:** [high-stakes] (touches store/connection.ts → always HS). Not [hw] — no device behavior change.
**DONE WHEN:**
- `npm run lint` total → **23** (was 32)
- `npm run typecheck` → 0 errors
- (global rules) docs/lint-baseline.txt re-ratcheted: line 1 = 23 + one history line
- (global rules) suppression gate: `git diff | grep -E "^\+.*(as any|@ts-ignore|@ts-expect-error|eslint-disable)"` → nothing
- (global rules) `npm run build` passes (store/layout changes can affect it)

## 📝 Worker notes & self-check
- All 9 sites cleared honestly, no suppressions:
  - `src/utils/layoutConfigs.ts` (6 any): `baseLayout` params → `unknown[][]` / `unknown[][] | null` on generateFallbackLayout, getLayoutConfig, processLayoutConfig, getPaddedKeySizes. Verified by read: every body uses baseLayout ONLY for `.length` row/col counts — never touches element properties — so `unknown[][]` is the honest consumed type (the plan's "verify against IDefKeyInfo[][]" was done; IDefKeyInfo[][] is what callers PASS, but `unknown[][]` is what the functions CONSUME, and it also covers LayoutPreview's undefined-filled and LayoutCreator's `defKey() | Error`-union callers). `customGapsAfterCol?: any[]` → `Record<number, number>[]` — matches the existing `LayoutConfig.gapsAfterCol` field type (layoutConfigs.ts L8) and its only use `gapsAfterCol[rIdx][cIdx]` yielding number|undefined.
  - `src/store/connection.ts` (2 any): `deviceInfo: null as any` → `null as ({ productName: string; id: string } & Partial<KeyboardBaseInfo>) | null` (+ `import { type KeyboardBaseInfo }`). Shape verified from real writes (L26/L54/L125 `{productName, id}`, then L30/L58/L129 spread of `getBaseInfo(): KeyboardBaseInfo | Error`, exported @ KeyboardService.ts:57) and real reads (`productName/id/KeyboardSN/BoardID/appVersion` — the Partial keeps all base-info fields optional, matching runtime where a spread may not have landed). Only typechecked consumer is MappedKeyboard `?.productName` → string ✓. `{...this.deviceInfo, ...info}` spread still compiles (spread-derived props are EPC-exempt) — confirmed by typecheck 0.
  - `onAutoConnectSuccess(device: any)` → structural `{ productName: string; id: string }`. **Deviation from the plan's suggested `HIDDevice`:** the sole caller (KeyboardService.ts:268) passes `Device | PairedDevice`; PairedDevice = `{id, data: HIDDevice, productName}` (KS:9, unexported) WRAPS a HIDDevice in `.data` — it is not one, so `HIDDevice` would fail at the call site. The structural type matches both branches exactly and the body reads only `.productName`/`.id`. No KeyboardService.ts edit needed; PairedDevice stays unexported.
  - `src/utils/MappedKeyboard.ts` (1 preserve-caught-error): `throw new Error('Failed to set key batch')` → `throw new Error('Failed to set key batch', { cause: error })` (global-rule (d) pattern, matches KS:211).
- Self-check vs sdk-reference-v2.md: no SDK call added/changed/removed — type-only param/state annotations + one error-cause append. KeyboardBaseInfo shape cross-checked against KeyboardService.ts:57 (the exported interface, already verified in Task 4a against §3). `Device` shape cross-checked against @sparklinkplayjoy/hid dist/esm/src/types/types.d.ts:47 (`DeviceInfo & { id: string; productName: string; data?: HIDDevice; collections }`).
- Design intent preserved: filters:[] ☑ (untouched — requestDevice call unchanged) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (no wrapper changed; the `{cause}` append is inside MappedKeyboard's own throw in a catch that already threw — pce rule requires the rethrow, behavior unchanged for callers).
- typecheck/build: `npm run typecheck` → 0 errors (baseline 0, no unmasking). `npm run lint` → 23 problems (0 errors, 23 warnings); rule split 10 any / 13 unused / 0 pce. Three-file eslint (`npx eslint src/utils/layoutConfigs.ts src/store/connection.ts src/utils/MappedKeyboard.ts`) → 0 problems. `npm run build` → ✓ built in 1.56s. Suppression gate on src/ diff → 0 matches (App.vue:254 `null as any` is PRE-EXISTING at HEAD — verified via `git show HEAD:src/App.vue | grep -n "as any"` → line 254 — and is Task 9's scoped site, untouched here). docs/lint-baseline.txt → line 1 = 23 + Task 7 history line (32 → 23, down-only).
- No symbols deleted → Finding-13 dangling-reference greps N/A (no .vue reference could dangle; signature changes are widening-compatible: `unknown[][]` accepts every `IDefKeyInfo[][]` caller).
- No new Findings. The deviceInfo spread-without-instanceof-Error concern (connection.ts L30/L58/L129) is already on the Findings list from Task 4a; this task makes it VISIBLE in the type system (Partial<KeyboardBaseInfo>) without changing runtime.

## 🔍 Commits to review
Base: `1cc6cc6` (Task 6 closed)   Head: `1cc2fdf` (this task)
<!-- Reviewer runs: git diff --stat 1cc6cc6..<head> then git diff 1cc6cc6..<head>.
     Expected file set: src/utils/layoutConfigs.ts, src/store/connection.ts, src/utils/MappedKeyboard.ts, docs/lint-baseline.txt, docs/plans/current-sprint.md, and this review file (+ its own checkpoint commit). Anything else is a flag. -->
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task. No device behavior change: type annotations only, plus one error-cause append on an existing throw path.

## ❓ Reviewer, please confirm
- [x] meets every "DONE WHEN" criterion above
- [x] diff scope matches the task (no stray files)
- [x] no design-intent violation
- [x] typecheck/build gate met where it applies (no newly introduced errors; unmasked ones recorded/deferred) — or N/A
- [x] tag is correct (high-stakes where required) — else auto-FAIL
- [x] the HIDDevice → structural-type deviation is justified (sole caller KS:268 passes `Device | PairedDevice`; PairedDevice is not a HIDDevice)

---
## ✅ REVIEWER VERDICT
<!-- After ONE verification pass, RULE. Output = PASS/FAIL + findings. -->
**Result:** PASS  ·  **Date:** 2026-10-13  ·  **Fail count:** 0

### Done-whens re-run (Reviewer, 2026-10-13)
| Check | Command | Result |
| --- | --- | --- |
| lint total | `npm run lint` | ✓ `23 problems (0 errors, 23 warnings)` |
| rule split | lint output grep | ✓ 10 no-explicit-any / 13 no-unused-vars / 0 pce |
| three files clean | `npx eslint src/utils/layoutConfigs.ts src/store/connection.ts src/utils/MappedKeyboard.ts` | ✓ no output, exit 0 |
| typecheck | `npm run typecheck` | ✓ 0 errors (no unmasking) |
| build | `npm run build` | ✓ `✓ built in 1.65s` |
| suppression gate | `git diff 1cc6cc6..1cc2fdf -- src/ \| grep -E "^\+.*(as any\|@ts-ignore\|@ts-expect-error\|eslint-disable)"` | ✓ nothing (App.vue:254 `as any` confirmed pre-existing at base via `git show 1cc6cc6:src/App.vue`) |
| baseline | `docs/lint-baseline.txt` | ✓ line 1 = `23`, history line `32 → 23` down-only |
| diff scope | `git diff --stat 1cc6cc6..1cc2fdf` | ✓ exactly layoutConfigs.ts / connection.ts / MappedKeyboard.ts / lint-baseline.txt |

### Spot-checks (all grep-verified this session)
1. **baseLayout → `unknown[][]` honest:** every `baseLayout` reference in layoutConfigs.ts (110–227) consumes only `.length` counts (`.length`, `.map(row => row.length)`) — zero property access off rows. `customGapsAfterCol → Record<number, number>[]` matches the existing `LayoutConfig.gapsAfterCol` type (layoutConfigs.ts:7).
2. **onAutoConnectSuccess structural param justified:** sole caller KS:268 passes `device` typed `Device | PairedDevice` (autoConnect signature KS:215); `PairedDevice` (KS:9) = `{ id, data: HIDDevice, productName }` — wraps HIDDevice in `.data`, is NOT one, so the plan's HIDDevice suggestion would have broken the call site. Body reads only `.productName`/`.id` (connection.ts:125). Deviation correct.
3. **deviceInfo union matches real writes/reads:** writes = `{productName, id}` then `getBaseInfo()` spread; typechecked reads (App.vue isStatusReady, Connect.vue deviceInfoText, LayoutCreator productName — .vue files are tsc-invisible but grepped) touch only productName/BoardID/KeyboardSN/appVersion, all in `({productName,id} & Partial<KeyboardBaseInfo>) | null`. `Partial` is honest: base-info fields only exist after the spread succeeds.
4. **pce fix matches precedent:** MappedKeyboard.ts:74 `{ cause: error }` — same shape as KS:211/KS:299.
5. **Design intent untouched:** no filters/usagePage/wrapper-contract changes anywhere in the diff.
6. **Tag:** high-stakes correct (connection.ts touched → always HS).

### Failed items (FAIL only)
—
