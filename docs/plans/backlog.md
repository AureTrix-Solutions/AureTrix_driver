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

### types-dedupe — replace src/types/types.ts local declarations with real protocol-keyboard root imports (now resolvable since sprint-06)
- src/types/types.ts (13 ln) mirrors IDefKeyInfo from sdk-keyboard dist/cjs/src/types/type.d.ts verbatim + DksLayoutType/DksType; with the sprint-06 tsconfig paths remap, `import type { IDefKeyInfo } from '@sparklinkplayjoy/protocol-keyboard'` typechecks (verified by probe in sprint-06 planning). Dedupe = swap the mirror for the import; verify vs types.ts + sdk-reference §10.1; touches the app-wide key model → [high-stakes]. (2026-10-11.)

## Known issues

- [deps] `npm install` reports 3 audit vulnerabilities (1 moderate, 2 critical), pre-existing in the dep graph (surfaced by sprint-02 lockfile regen) — verify with `npm audit`; a fix sprint must weigh `audit fix --force` version bumps against the pinned SDK versions. (2026-10-09.)
- [deps] On any @sparklinkplayjoy version bump, re-verify the two tsconfig.json pinned `paths` targets still exist (hid `dist/cjs/index.d.ts`; protocol-keyboard `dist/esm/types/index.d.ts` since sprint-06 — upstream ships no root types, so a moved/renamed barrel or a fixed upstream release silently breaks typecheck or makes the remap redundant) — grep `"@sparklinkplayjoy` in tsconfig.json, then `ls` both paths. (2026-10-11.)
- [types] Remaining 23 baseline tsc errors are all outside the services (router/index.ts ×17 the largest block; breakdown in docs/tsc-baseline.txt) — own cleanup sprint needed before baseline reaches zero; do NOT install @types/w3c-web-hid (measured net +5 — detail in docs/plans/archive/sprint-01-code-fixes/review-type-cleanup-4a.md §1). (2026-10-09.)
- [process] `npm install --no-save --no-package-lock` ignores the lockfile and re-resolves pinned SDKs (poisoned two Task 4a measurements; recover with `npm ci`) — use `npm pack` + manual extraction for package experiments; see docs/plans/archive/sprint-01-code-fixes/review-type-cleanup-4a.md, Reviewer verification notes. (2026-10-09.)
- [process] PM edit-specs that bless inherited line-refs as "EXACT — keep as-is" without re-verifying them shield drift from the Worker (sprint-04 F1: spec blessed `:7`/`:11`, truth was `:8`/`:12`) — specs should mark refs verified-this-session vs inherited-unverified; verify: docs/plans/archive/sprint-04-sdk-skill-clean/review-sdk-skill-clean.md §RF1. (2026-10-11.)
- [docs] Bare `:NNN` refs mixing two files in one sentence are namespace-ambiguous (sprint-04 SKILL.md:76 — `:11` = `connectedDevice` in KeyboardService but `constructor()` in DebugKeyboardService) — qualify cross-file refs (e.g. `DebugKeyboardService:8`); verify: docs/plans/archive/sprint-04-sdk-skill-clean/review-sdk-skill-clean.md §RF2. (2026-10-11.)
