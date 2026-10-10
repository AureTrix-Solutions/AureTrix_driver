# SPRINT: sprint-03-docs-sdk-ref-fix

**GOAL:** sdk-reference-v2.md §13.7 states the verified truth about `configs` reachability and carries the current repo state.
**DONE-CRITERIA (sprint):** No "configs never invoked" claim remains in the doc; §13.7.4 corrected per sprint-01 review §R2; §13.7 preamble/Site 1/§13.7.3 banner-noted as superseded; §13.7 status row updated; no source files touched (tsc baseline stays 23).
**Started:** 2026-10-10  ·  **Status:** IN PROGRESS
<!-- revN (YYYY-MM-DD): <what changed> -->

## Checkpoint
- Branch: `sprint-03-docs-sdk-ref-fix`
- tsc baseline: 23 errors (docs/tsc-baseline.txt) — docs-only sprint, must not change
- Cleanup: no cleanup needed (`.scratch/` and `_to_delete/` both empty — ls'd 2026-10-10 by Worker at Task 1)
- PM-open complete: backlog item removed, this file seeded.

## ▶ RUN THIS
Next: Reviewer session — "follow docs/plans/reviews/review-sdk-ref-configs-fix.md" (Task 1, Base 956548c, Head in review file).

## Tasks

1. **Correct §13.7.4 `configs` reachability claims** — [high-stakes] — STATUS: IN-REVIEW
   - Checkpoint (Worker, 2026-10-10): all 3 edit sites applied; grep gate 0/0/0; bundle facts re-confirmed by count-only grep (`filters:this.configs` 1×, zero-match fallback 1×); docs-only, baseline stays 23; review file seeded.
   - Done when: §13.7.4 contains none of the strings "never invoked on this code path", "simply does not happen in the SDK", "pure type-formality with no runtime consequence" (grep gate).
   - Done when: corrected text names the devices()→requestDevice zero-match fallback chain and cites sprint-01 review §R2 as the source; design-intent warning (unfiltered selection, no hard-coded IDs, superseded SDK_REFERENCE.md caveat) survives.
   - Done when: Verification status row §13.7 (sdk-reference-v2.md:179) notes the sprint-03 correction.
   - Files: `docs/sdk-reference-v2.md`
   - Ground truth for the correction (bundle-verified, sprint-01 review-variant-p-imports.md §R2, lines 85–116): `KeyboardService.getDevices()` → `XDKeyboard.getDevices()` → hid's internal `devices()`; on **zero** matches after the usage/usagePage filter, hid calls its own internal `requestDevice()` → `navigator.hid.requestDevice({ filters: this.configs })`. `XDKeyboard` not exposing `requestDevice` on the façade is irrelevant — hid reaches it internally. Doc's own §1 getDevices row (line 231, "**May prompt**") already says this; §13.7.4 contradicted it.
   - Edit list (3 sites; all spans read by PM 2026-10-10):
     1. **Lines 4012–4031** (the "**This note is now closed — the missing `configs` is harmless…**" paragraph through "…must not be read as a requirement.)"): REPLACE with a corrected note that (a) states the earlier conclusion was wrong, corrected 2026-10-09/sprint-03 per review §R2; (b) gives the chain above (a small code block is fine: KeyboardService.getDevices() at src/services/KeyboardService.ts:109 → XDKeyboard.getDevices() → hid devices() → `if (e.length === 0)` → hid internal requestDevice() → `navigator.hid.requestDevice({filters: this.configs})`); (c) states `configs` therefore DOES reach a `filters` argument — but only on the zero-match fallback, with whatever value the constructor got: this repo passes `configs: []` (KeyboardService.ts:42, DebugKeyboardService.ts:15), so that prompt is unfiltered, matching the app-level `navigator.hid!.requestDevice({ filters: [] })` in KeyboardService.requestDevice() (KeyboardService.ts:124); (d) KEEPS verbatim the intentional-unfiltered design-intent sentences and the superseded SDK_REFERENCE.md vendorId 7331/productId 1793 caveat (current lines 4026–4031), and notes a filtering `configs` value would violate design intent; (e) cross-references §1's getDevices "May prompt" row.
     2. **Lines 4042–4046** ("Net: … and (b) supply or silence the required `configs`, which is a **pure type-formality** with no runtime consequence here. Passing `configs: []` is the minimal honest change; it types correctly and preserves today's behaviour exactly."): REPLACE the (b) clause — `configs` is NOT a pure type-formality; the value is reachable at runtime via hid's internal zero-match fallback (see corrected note above). `configs: []` is both the minimal type-correct change and the intent-preserving one: it keeps the fallback prompt unfiltered, matching the app-level `filters: []`. Keep clause (a) (usagePage wrap) unchanged.
     3. **Line 179** (status row `| §13.7 How src/ imports these types | Verified | … | ✅ Import sites and their failure modes confirmed |`): APPEND to the Notes cell, matching the doc's "Batch 4b: ✅ corrected…" convention: "sprint-03: ✅ corrected §13.7.4's `configs` claim — reachable via hid's internal devices()→requestDevice zero-match fallback (chain verified in sprint-01 review-variant-p-imports.md §R2) — and banner-noted preamble/Site 1/§13.7.3 as superseded by sprint-01's variant-P adoption".
   - Reviewer spot-check: confirm `filters:this.configs` and the `0===e.length` (or equivalent) fallback exist in `node_modules/@sparklinkplayjoy/hid/dist/esm/index.js` (grep, small span only).

2. **Banner-note §13.7 staleness (pre-variant-P text)** — [high-stakes] — STATUS: PENDING
   - Done when: §13.7 preamble carries a status note that Site 1 was fixed in sprint-01 via variant P and the text below is pre-fix history; grep "Status (2026-10-09" or equivalent in the §13.7 preamble.
   - Done when: §13.7.3 header no longer reads as currently-unapplied without qualification; line 3964's "None of this is in the repo" is followed by a superseded note citing tsconfig.json:21 + both constructors.
   - Done when: diff is ADDITIONS/TITLE-CHANGES only inside §13.7 — no historical analysis paragraphs deleted (Task 1's two replacements excepted, already committed).
   - Files: `docs/sdk-reference-v2.md`
   - Context: sprint-01 applied variant P — tsconfig.json:21 has the `@sparklinkplayjoy/hid` paths mapping; both services import `from '@sparklinkplayjoy/hid'` at line 2; constructors pass `usagePage: [65440], configs: []`; `npm run typecheck` + docs/tsc-baseline.txt (23) exist. §13.7 still describes the pre-fix state in present tense.
   - Edit list (4 sites; PM chose banner-notes over rewrite, PO-approved 2026-10-09):
     1. **After the preamble paragraph ending line 3778** ("…so nothing in CI surfaces these."): INSERT a standalone status line: "> **Status (2026-10-09, sprint-03): Site 1 was fixed in sprint-01 by adopting variant P** — tsconfig.json:21 `paths` mapping, type-only imports now `from '@sparklinkplayjoy/hid'`, constructors pass `usagePage: [65440]` + `configs: []`, and `npm run typecheck` + docs/tsc-baseline.txt now exist (baseline 23). The text below describes the **pre-fix** state and is kept as historical context; the "60 errors"/"no typecheck script" figures are as-of that measurement, not current."
     2. **Line 3780** ("**Site 1 — `KeyboardService.ts:2` and `DebugKeyboardService.ts:2` (identical line): broken.**"): APPEND to that bold line: " *(Superseded — fixed in sprint-01 via variant P; see the status note above. The 4 × TS2614 no longer occur.)*"
     3. **Line 3938** header "#### 13.7.3 Proposed fix for Site 1 — not applied": CHANGE to "#### 13.7.3 Proposed fix for Site 1 — applied in sprint-01 (variant P); proposal text kept as written".
     4. **Line 3964** ("None of this is in the repo. `src/` is unmodified; all measurements came from a scratch copy."): APPEND: " *(Superseded — as of sprint-01, variant P and the constructor edits ARE in the repo: tsconfig.json:21, KeyboardService.ts:39–43, DebugKeyboardService.ts:12–16. Measurements below were from the pre-fix scratch copy.)*"
   - Note: the status-row mention of these banners is already added in Task 1 edit 3 — do not duplicate.

## Findings (raw — PM routes at close)
- <none yet>
