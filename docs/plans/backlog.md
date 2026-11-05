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
- each page to be its own sprint.

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

### docs-pages-verify — reconcile each docs/pages/*.md against its current .vue (one page per sprint)
- [docs] One sprint per page: check the doc against current source, fix drift. Advanced-key stub pages excluded (documented when built). Item STAYS until all implemented pages done (precedent: advanced-key-pages).
- [x] Connect.md — sprint-26, Reviewer PASS, PO signed off 2026-11-01 (archive/sprint-26-docs-pages-verify-1/)
- [x] LayoutPreview.md — sprint-27, PASS 14/14 greps, PO signed off 2026-11-01 (archive/sprint-27-docs-pages-verify-2/)
- [x] FactoryResetModal.md — sprint-28, PASS 6/6 greps, 4 drifts fixed, PO signed off 2026-11-02 (archive/sprint-28-docs-pages-verify-3/)
- [x] GlobalTravel.md — sprint-29, PASS ×2 (16/16 + 3/3 greps), 7 drifts fixed + PAGES_OVERVIEW journey fix, PO signed off 2026-11-03 (archive/sprint-29-docs-pages-verify-4/)
- [x] SwitchProfiles.md — sprint-30, Reviewer PASS (15 drift edits: phantom baseLayout prop, timer/listener types, wrapper-vs-SDK travels shape, UI/CSS details, actuationPoint guard), PO signed off 2026-11-04 (archive/sprint-30-docs-pages-verify-5/)
- [x] SingleKeyTravel.md — sprint-31, Reviewer PASS (24 drift edits in 4 sub-tasks: phantom baseLayout prop + binding, dead update-overlay emit, wrong event payloads, phantom 300ms/null overlay flow, stale snippets, overlay-scope claims, re-click matrix row), PO signed off 2026-11-04 (archive/sprint-31-docs-pages-verify-6/)
- [ ] KeyTravel.md ↔ src/components/performance/KeyTravel.vue — doc 482 vs source 89; drift likely. Known drift (found sprint-30 PM-open): doc claims baseLayout is passed to SingleKeyTravel and SwitchProfiles (KeyTravel.md:74/:205/:213/:226/:370) — KeyTravel.vue passes NO :base-layout to any child; verify all when the sprint runs. Also (sprint-31 Findings): `setSingleOverlay` param typed `(data: {travel; pressDead; releaseDead} | null)` but child emits boolean — stale annotation; relay still works (re-emits arg unchanged). Verify: grep `const setSingleOverlay` in src/components/performance/KeyTravel.vue
- [ ] KeyMapping.md ↔ src/pages/KeyMapping.vue
- [ ] Lighting.md ↔ src/pages/Lighting.vue
- [ ] RapidTrigger.md ↔ src/pages/RapidTrigger.vue
- [ ] Performance.md ↔ src/pages/Performance.vue
- [ ] Calibration.md ↔ src/pages/Calibration.vue
- [ ] MacroRecording.md ↔ src/pages/MacroRecording.vue
- [ ] LayoutCreator.md ↔ src/pages/LayoutCreator.vue
- [ ] GlobalFeatures.md ↔ App.vue sidebar (not a routed page)
- [ ] Debug.md ↔ src/pages/Debug.vue — SKIPPED, possible future sprint of its own

### docs-meta-verify — correctness pass on project meta docs
README.md (repo root) + .github/* (CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, issue/PR templates, ci.yml).

## Code issues
- [cleanup] SingleKeyTravel.vue `emits` array still declares `'update-overlay'` (:194) though no code path ever emits it — dead declaration (doc now correctly records it). Verify: grep `emit('update-overlay'` in src/components/performance/SingleKeyTravel.vue (exit 1). (sprint-31 Reviewer Findings; detail: docs/plans/archive/sprint-31-docs-pages-verify-6/review-singlekeytravel.md.)

## Document issues
- [docs] docs/sdk-reference-v2.md renders the IDB blocks as `interface IDB` (:705, :2755) while SDK source carries `export interface IDB` (protocol-keyboard/src/types/interface.ts:74) — cosmetic fidelity gap. Verify: `grep -n "interface IDB" docs/sdk-reference-v2.md`. (sprint-29 F1; detail: docs/plans/archive/sprint-29-docs-pages-verify-4/sprint.md §Findings.)

## Constraints (standing guardrails — NOT work items; apply conditionally, never removed by a sprint)
- [deps] vue-tsc 3.x requires TypeScript 5.x — `typescript@latest` is 7.0.2 and vue-tsc 3.3.13 crashes under it with `ERR_PACKAGE_PATH_NOT_EXPORTED './lib/tsc'` (verified by PM dryrun 2026-10-22: fails on TS 7.0.2, works on TS 5.9.2). The repo's `^5.9.2` caret cannot reach 7, so this only bites on a deliberate TS major bump or a tool resolving TypeScript outside the lockfile. Verify before any TS major upgrade: `npm view vue-tsc dist-tags` + the installed vue-tsc's compatibility with that TS major. (sprint-13 PM-open, 2026-10-22.)
- [deps] On any @sparklinkplayjoy version bump, re-verify the two tsconfig.json pinned `paths` targets still exist (hid `dist/cjs/index.d.ts`; protocol-keyboard `dist/esm/types/index.d.ts` since sprint-06 — upstream ships no root types, so a moved/renamed barrel or a fixed upstream release silently breaks typecheck or makes the remap redundant) — grep `"@sparklinkplayjoy` in tsconfig.json, then `ls` both paths. (2026-10-11.)
- [process] `npm install --no-save --no-package-lock` ignores the lockfile and re-resolves pinned SDKs (poisoned two Task 4a measurements; recover with `npm ci`) — use `npm pack` + manual extraction for package experiments; see docs/plans/archive/sprint-01-code-fixes/review-type-cleanup-4a.md, Reviewer verification notes. (2026-10-09.)
- [process] PM edit-specs that bless inherited line-refs as "EXACT — keep as-is" without re-verifying them shield drift from the Worker (sprint-04 F1: spec blessed `:7`/`:11`, truth was `:8`/`:12`) — specs should mark refs verified-this-session vs inherited-unverified; verify: docs/plans/archive/sprint-04-sdk-skill-clean/review-sdk-skill-clean.md §RF1. (2026-10-11.)
- [process] Done-when greps that count a PHRASE (`grep -c "import type"`) also match the PM spec's own comment prose — sprint-08 Task 1 computed 4 vs expected 2 while the code was correct; anchor statement counts (`^import type`) instead — verify: docs/plans/archive/sprint-08-types-dedupe/review-types-dedupe.md Evidence. (2026-10-11.)
- [docs] Bare `:NNN` refs mixing two files in one sentence are namespace-ambiguous (sprint-04 SKILL.md:76 — `:11` = `connectedDevice` in KeyboardService but `constructor()` in DebugKeyboardService) — qualify cross-file refs (e.g. `DebugKeyboardService:8`); verify: docs/plans/archive/sprint-04-sdk-skill-clean/review-sdk-skill-clean.md §RF2. (2026-10-11.)
- [process] Done-when criteria of the form `ls node_modules/.bin | grep -c <pkg>` → `1` are wrong on Windows: npm writes 3 shims per bin (`<pkg>`, `.cmd`, `.ps1`), so the count is 3 — use `grep -q`/non-empty for bin-presence criteria. Verify: `ls node_modules/.bin | grep vue-tsc` (returns 3 lines). (sprint-13 Task 1 Reviewer obs O1, routed at PM-close 2026-10-23.)
- [process] .github/workflows/ci.yml pins `actions/checkout@v4` + `actions/setup-node@v4` by tag, not commit SHA — acceptable for informational-only CI; revisit only if the repo adopts a SHA-pinning policy. Verify: `grep "@v4" .github/workflows/ci.yml`. (sprint-15-ci Reviewer observation, routed at PM-close 2026-10-23; detail: docs/plans/archive/sprint-15-ci/review-ci-workflow.md §Non-defect observations.)