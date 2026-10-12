# REVIEW: sprint-11-task5-exportservice-ratchet

<!-- WORKER fills everything above the verdict line. REVIEWER fills the verdict section. -->

**SPRINT GOAL:** Ratchet ESLint warnings 221 → 0 honestly (real types + real dead-code removal, no new suppressions), delete the orphaned DebugKeyboardService, and end with the three deferred rules promoted to errors and docs/lint-baseline.txt at 0 — mirroring the tsc-baseline ratchet (sprint-07).
**TASK:** 5. ExportService ratchet (rev1: 14 sites — the macro-map `m: any` was removed in 4a site 14)  ·  **TAG:** [high-stakes]
**DONE WHEN:**
- `npx eslint src/services/ExportService.ts | grep -c warning` → 0
- `npm run lint` total → 80
- `npm run typecheck` → 0
- (global rules) suppression gate over the diff → nothing; docs/lint-baseline.txt line 1 re-ratcheted → 80 with one `#` history line; `npm run build` passes

## 📝 Worker notes & self-check
- All 14 ExportService sites cleared with decoder/bundle-verified types (no `!`/`as any`/eslint-disable):
  - `retryWithBackoff` :14 `let lastError: unknown;` (initializer dropped — TS2454 did not fire; the `throw lastError` path is unreachable-by-typing but `unknown` keeps it honest)
  - `convertLightingToConfig(lighting: ILightMode)` (root-import from protocol-keyboard)
  - `getLayoutKeyInfo` forEach `(keyInfo: IKey, index)` — **root fix in KeyboardService.ts**: declaration `IDefKeyInfo[] | Error` → `IKey[] | Error` (type-only, body untouched). Decoder-verified: `getFnLayoutKeyRecdata` (protocol-keyboard recdata.ts:338-348) returns `{key, layout, value?}` elements = `IKey`, NOT `IDefKeyInfo`. The wrong declaration only passed typecheck because `tsc --noEmit` does not check `.vue` SFCs (no vue-tsc) — the TS2345 contravariance fired in ExportService when the callback param was typed. Finding logged.
  - `findKeyLocation(layout: IDefKeyInfo[][], ...)` (app type, `../types/types`) + TS18048 fix: match condition narrowed `key.keyValue === keyValue && key.location` (app `IDefKeyInfo.location` is optional)
  - `LightingSnapshot` interface: `main: ILightMode & { dynamicColorId: number }`, `logo: (ILightMode & { dynamicColorId: number }) | null`, `other: ILightMode | null`
  - `gatherKeyboardSnapshot` locals: `originalLighting/originalLogo: (ILightMode & { dynamicColorId: number }) | Error | null`, `originalSpecial: ILightMode | Error | null`, `tempCustomParams: ILightMode`
  - `convertLightConfigToSDKFormat(...): LightModeConfigs` (deep-import from sdk-keyboard type.d.ts, = `Omit<ILightMode,'open'>`); `mode` computed before the literal; `superResponse: false` ADDED — bit-identical encoding (pack.ts encoders destructure superResponse; undefined was already falsy/bit-clear)
  - 3 × `setLogoLighting` call sites: `type: x.type === 'dynamic' ? 'dynamic' : 'static'` (bundle-verified: logo `type` only gates the dynamic/staticColor branch, is never sent in the payload → `custom→static` mapping is behavior-preserving) + `open: true` at the import site (guaranteed by the enclosing `config.light.logo.open` guard)
  - `applyImportedConfig(_config: KeyboardConfig)` (unused param, `argsIgnorePattern: "^_"` confirmed in eslint.config.mjs)
- Dead code removed honestly (all unmasked by the new types, never silenced):
  - 5 dead `open === 0/1` TS2367 clauses (ILightMode.open is boolean): `mainWasOff` dropped `|| … === 0`; `logoWasOn/otherWasOn/specialWasOn` dropped `|| … === 1`
  - 2 dead `dynamicColorId` destructures (field exists only on getLighting/getLogoLighting's `& { dynamicColorId }` intersection, not on `ILightMode` for other/special): objects now passed directly to `setSpecialLighting`. The second resolves 4b's latent Finding #82 (marked RESOLVED in current-sprint.md `## Findings`)
- Self-check vs sdk-reference-v2.md: §8 (getPRGBRecdata → 9 fields + type + dynamicColorId; getSpecialSingleRGB → 9 fields, no type/dynamicColorId) — snapshot types match; LightModeConfigs/ILightMode/IKey shapes re-verified against protocol-keyboard `src/types/interface.ts` (readable source) during the research pass (banked as T5-WIP-2/3, commits ddb19fa..7dbc95b).
- Design intent preserved: filters:[] ☑ (untouched) · usagePage 65440 ☑ (untouched) · wrappers return Error ☑ (KS declaration change is type-only; `| Error` unions kept everywhere)
- typecheck/build: `npm run typecheck` → 0 errors (3 unmasked errors during the run — TS2345 at :186, TS18048 at :218, TS2339 at :428 — all fixed at root in-task, nothing silenced; tsc baseline stays 0). `npm run build` → ✓ 1.65s.
- Lint: `npx eslint src/services/ExportService.ts` → 0 warnings; `npm run lint` total 94 → **80**; docs/lint-baseline.txt line 1 = 80 with one Task 5 history line; suppression gate over the diff → 0.

## 🔍 Commits to review
Base: `c1cef79` (Task 4 Reviewer PASS / close)   Head: this commit (the one containing this review file; source-carrying commits in between: f390456, a851aed, 342d7b2 — ddb19fa..7dbc95b are plan-only WIP checkpoints)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat c1cef79..HEAD     then      git diff c1cef79..HEAD
     A file touched outside this task's scope is a flag.
     Expected source scope: src/services/ExportService.ts (14 sites),
     src/services/KeyboardService.ts (getLayoutKeyInfo declaration only, type-only root fix),
     docs/lint-baseline.txt, docs/plans/current-sprint.md, this review file. -->
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task. No runtime behavior change intended: all edits are type-level, dead-code removal (clauses that could never be true against the verified decoder shapes), or bit-identical encoding (`superResponse: false`, logo type-mapping — both bundle-verified).

## ❓ Reviewer, please confirm
- [ ] meets every "DONE WHEN" criterion above
- [ ] diff scope matches the task (no stray files)
- [ ] no design-intent violation
- [ ] typecheck/build gate met (no newly introduced errors; the 3 unmasked ones fixed at root, none silenced)
- [ ] tag is correct (high-stakes) — else auto-FAIL
- [ ] spot-check the two behavior-preservation claims: `superResponse: false` addition (pack.ts encoder) and logo `type` mapping (bundle setLogoLighting payload)
- [ ] spot-check the KS `getLayoutKeyInfo` declaration root-fix against protocol-keyboard recdata.ts `getFnLayoutKeyRecdata` (IKey vs IDefKeyInfo)

---
## ✅ REVIEWER VERDICT
<!-- After ONE verification pass, RULE. -->
**Result:** —  ·  **Date:** —  ·  **Fail count:** —

### Failed items (FAIL only)
—
