# Backlog

Candidate sprints and known issues. The PM reads this at PM-open; the PO picks the next sprint; the
PM removes the chosen item and expands it into current-sprint.md with "Done when:" criteria and tags.
Workers/Reviewers who find a new bug append a one-liner here (do NOT fix out of sprint scope).
One line per entry: defect + pointer to where detail/verification lives (usually the review file) —
never a pre-written solution, never duplicated detail.

## Candidate sprints (PO picks next)

### dks-page — build the Dynamic Keystroke config page (setDks wrapper + DKS.vue)

### advanced-key-pages — MPT, MT, TGL, END, SOCD, RS pages

### macro-page — build the Macro config page (setMacro wrapper + Macro.vue)
- Pitfall: setMacro without touchMode may reset a key's touch mode to global (sdk-reference-v2.md §7); the wrapper now requires touchMode (Task 4b item G) — the page must pass/preserve it; verify on single + RT keys on hardware.

### custom-firmware (long-term) — firmware for an own board (RP2040/STM32)
- Foundation: docs/sdk-reference-v2.md §10.5 wire-framing (64-byte packets, additive checksum, multi-packet reassembly).

## Known issues

- [docs] sprint-02 candidate: verify-and-trim sdk-wrapper skill (.openclaude/skills/sdk-wrapper/SKILL.md) — Batching section misrepresents where batching lives (verify vs src/composables/useBatchProcessing.ts + its callers); overlong ~250 lines vs ~80 target (pattern + checklist only — self-check-gate/unmasking mechanics and verbatim CLAUDE.md §7 duplication don't belong); method names, line refs, and the "Known pre-existing type errors" section stale after Tasks 4a/4b (verify every claim vs current source). (PM curation, 2026-10-09.)
- [docs] sdk-reference-v2.md §13.7.4 wrongly claims `configs` never reaches a `filters` arg — correct the section; verified call chain in docs/plans/archive/sprint-01-code-fixes/review-variant-p-imports.md §R2. (2026-10-08.)
- [docs] docs/pages/Debug.md:191,214 still documents DebugKeyboardService.exportEncryptedJSON, removed as dead code in Task 4b (fb20895) — needs a cleanup pass; see docs/plans/archive/sprint-01-code-fixes/review-type-cleanup-4b.md, Reviewer obs 1. (2026-10-09.)
- [types] Remaining 23 baseline tsc errors are all outside the services (router/index.ts ×17 the largest block; breakdown in docs/tsc-baseline.txt) — own cleanup sprint needed before baseline reaches zero; do NOT install @types/w3c-web-hid (measured net +5 — detail in docs/plans/archive/sprint-01-code-fixes/review-type-cleanup-4a.md §1). (2026-10-09.)
- [types] protocol-keyboard ships no resolvable root types ("types" → nonexistent dist/esm/index.d.ts; "exports" has no types condition; deep-path import confirmed BLOCKED, root import untested) — relevant if real SDK types are ever wanted instead of local declarations; verify vs the installed package's package.json/exports map; fullest record in the sdk-wrapper skill's import section. (2026-10-08, upd 2026-10-09.)
- [hw] Verify at runtime whether Chromium populates HIDDevice.serialNumber — matters only when two same-model keyboards are paired (reconnect picks via the serialNumber match in KeyboardService find() predicates); verify by pairing two same-model devices; context in docs/plans/archive/sprint-01-code-fixes/review-type-cleanup-4b.md. (2026-10-09.)
- [process] `npm install --no-save --no-package-lock` ignores the lockfile and re-resolves pinned SDKs (poisoned two Task 4a measurements; recover with `npm ci`) — use `npm pack` + manual extraction for package experiments; see docs/plans/archive/sprint-01-code-fixes/review-type-cleanup-4a.md, Reviewer verification notes. (2026-10-09.)
