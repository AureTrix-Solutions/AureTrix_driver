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

- [deps] `npm install` reports 3 audit vulnerabilities (1 moderate, 2 critical), pre-existing in the dep graph (surfaced by sprint-02 lockfile regen) — verify with `npm audit`; a fix sprint must weigh `audit fix --force` version bumps against the pinned SDK versions. (2026-10-09.)

- [docs] docs/pages/Debug.md:191,214 still documents DebugKeyboardService.exportEncryptedJSON, removed as dead code in Task 4b (fb20895) — needs a cleanup pass; see docs/plans/archive/sprint-01-code-fixes/review-type-cleanup-4b.md, Reviewer obs 1. (2026-10-09.)
- [types] Remaining 23 baseline tsc errors are all outside the services (router/index.ts ×17 the largest block; breakdown in docs/tsc-baseline.txt) — own cleanup sprint needed before baseline reaches zero; do NOT install @types/w3c-web-hid (measured net +5 — detail in docs/plans/archive/sprint-01-code-fixes/review-type-cleanup-4a.md §1). (2026-10-09.)
- [types] protocol-keyboard ships no resolvable root types ("types" → nonexistent dist/esm/index.d.ts; "exports" has no types condition; deep-path import confirmed BLOCKED, root import untested) — relevant if real SDK types are ever wanted instead of local declarations; verify vs the installed package's package.json/exports map; fullest record in the sdk-wrapper skill's import section. (2026-10-08, upd 2026-10-09.)
- [known-limitation] WebHID `HIDDevice.serialNumber` confirmed `undefined` on Chromium/Windows (PO hardware check 2026-10-10; `pairedStableId` persists as `7333-5890-unknown`) — the serial compares in the KeyboardService find() predicates (`src/services/KeyboardService.ts:133,190`) are no-ops, so auto-reconnect matches vendorId+productId only: with two same-model boards it can silently open the wrong twin (manual connect via browser picker unaffected; the real serial from SDK `getBaseInfo()` is only available after open, so it cannot feed device selection). Not a fix — intentional platform limitation; landing spots for the PM to spec at next PM-open (single small task; comment-only, but the KeyboardService tag rule makes it [high-stakes]): (1) known-limitation comments at both predicates and the fallbackId lines (`:134,:182,:191`) — do NOT drop the compare and do NOT install `@types/w3c-web-hid` (net +5 tsc errors, see [types] entry above); (2) one-line auto-connect limitation note in `docs/pages/Connect.md`; (3) record the resolved decision in `docs/sdk-reference-v2.md:3908-3910`. Context: docs/plans/archive/sprint-01-code-fixes/review-type-cleanup-4b.md. (2026-10-09, resolved 2026-10-10.)
- [process] `npm install --no-save --no-package-lock` ignores the lockfile and re-resolves pinned SDKs (poisoned two Task 4a measurements; recover with `npm ci`) — use `npm pack` + manual extraction for package experiments; see docs/plans/archive/sprint-01-code-fixes/review-type-cleanup-4a.md, Reviewer verification notes. (2026-10-09.)
- [process] PM edit-specs that bless inherited line-refs as "EXACT — keep as-is" without re-verifying them shield drift from the Worker (sprint-04 F1: spec blessed `:7`/`:11`, truth was `:8`/`:12`) — specs should mark refs verified-this-session vs inherited-unverified; verify: docs/plans/archive/sprint-04-sdk-skill-clean/review-sdk-skill-clean.md §RF1. (2026-10-11.)
- [docs] Bare `:NNN` refs mixing two files in one sentence are namespace-ambiguous (sprint-04 SKILL.md:76 — `:11` = `connectedDevice` in KeyboardService but `constructor()` in DebugKeyboardService) — qualify cross-file refs (e.g. `DebugKeyboardService:8`); verify: docs/plans/archive/sprint-04-sdk-skill-clean/review-sdk-skill-clean.md §RF2. (2026-10-11.)
