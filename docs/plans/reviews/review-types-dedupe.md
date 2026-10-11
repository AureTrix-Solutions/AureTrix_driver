# REVIEW: types-dedupe

**SPRINT GOAL:** Replace the hand-mirrored declarations in `src/types/types.ts` with types derived from the SDK's public type surface (PO-approved A1 + B1): `IDefKeyInfo` derived from the protocol-keyboard root import; `DksLayoutType`/`DksType` re-exported via a type-only deep-path import from sdk-keyboard.
**TASK:** Dedupe src/types/types.ts against the SDK type surface  ·  **TAG:** [high-stakes]
**DONE WHEN:**
- `npm run typecheck` clean (baseline 0 — no new errors)
- `npm run build` passes
- All 13 consumer files import unchanged: `grep -rl "types/types" src | wc -l` returns 13
- `src/types/types.ts` contains no literal `Layout_*` unions: `grep -n "Layout_DB1\|Layout_DKS1" src/types/types.ts` returns nothing
- `grep -c "export type IDefKeyInfo" src/types/types.ts` returns 1 (no hand-written `keyValue` declaration)

## 📝 Worker notes & self-check
- Replaced the whole file (15 ln) with the PM-authored spec: type-only deep import of `DksLayoutType`/`DksType` from `@sparklinkplayjoy/sdk-keyboard/dist/esm/src/types/type` (erased at build — runtime-safe per §13.4/§13.7), type-only root import of `IDefKeyInfo` from `@sparklinkplayjoy/protocol-keyboard` (resolved via the sprint-06 tsconfig paths remap, §13.7.3), re-export of the two layout unions, and `IDefKeyInfo` re-declared as `Omit<SdkIDefKeyInfo, 'location'> & { physicalKeyValue?; location?; remappedLabel? }` to keep the app-side extensions (optional location, remapping fields).
- No consumer file touched; all 13 keep importing the same three names from the same path.
- Self-check vs sdk-reference-v2.md: §10.1 (root export surface — `IDefKeyInfo` reachable via protocol-keyboard root), §13.4 (deep-path type imports compile but fail at runtime — mitigated by `import type` erasure; MUST stay `import type`), §13.7/§13.7.3 (moduleResolution:node honors the paths remap; deep .d.ts resolves for tsc). All consistent with the change.
- Design intent preserved: filters:[] N/A (no runtime code touched) · usagePage 65440 N/A · wrappers return Error N/A — type-level change only, fully erased at build.
- typecheck/build: `npm run typecheck` → 0 errors (baseline 0, no new errors). `npm run build` → ✓ built in 1.59s.
- **Criterion note for the Reviewer:** the sprint-plan criterion "grep -c 'import type' = 2" computes as 4 on the specified file because the PM's own header comments (lines 3–4) contain the phrase `` `import type` `` inside prose. The actual `import type` *statements* are exactly 2. The file content is byte-identical to the PM spec; this is a plan-math artifact, not a deviation. Verify with: `grep -c "^import type" src/types/types.ts` → 2.

## 🔍 Commits to review
Base: `e7aa4c5` (PM-open commit / branch point)   Head: `8ae0faf` (this task)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat <base>..<head>     then      git diff <base>..<head>
     A file touched outside this task's scope is a flag. -->
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task. Type-level change only; fully erased at build; no runtime/behavior delta to exercise.

## ❓ Reviewer, please confirm
- [ ] meets every "DONE WHEN" criterion above
- [ ] diff scope matches the task (no stray files)
- [ ] no design-intent violation
- [ ] typecheck/build gate met where it applies (no newly introduced errors; unmasked ones recorded/deferred) — or N/A
- [ ] tag is correct (high-stakes where required) — else auto-FAIL

---
## ✅ REVIEWER VERDICT
<!-- After ONE verification pass, RULE. Don't keep investigating. A runtime/behavior question goes
     to the PO hardware check, not more static analysis. Output = PASS/FAIL + findings + your own
     Findings one-liners (into current-sprint.md). Do NOT plan task order/parallelism. -->
**Result:** ___  ·  **Date:** ___  ·  **Fail count:** ___

### Failed items (FAIL only)
—
