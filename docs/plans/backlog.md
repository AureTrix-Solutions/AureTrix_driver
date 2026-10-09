# Backlog

Candidate sprints and known issues. The PM reads this at PM-open; the PO picks the next sprint; the
PM removes the chosen item and expands it into current-sprint.md with "Done when:" criteria and tags.
Workers/Reviewers who find a new bug append a one-liner here (do NOT fix out of sprint scope).

## Candidate sprints (PO picks next)

### dks-page — build the Dynamic Keystroke config page (setDks wrapper + DKS.vue)

### npm cleanup — finish the pnpm→npm migration
- package.json: remove "packageManager": "pnpm@10.17.0" and the "pnpm" dependency.
- Delete pnpm-lock.yaml and pnpm-workspace.yaml (move to _to_delete/ for PO git rm).
- Re-run npm install so package-lock.json is clean.
- README.md: change pnpm→npm in Prerequisites/Install/Tech Stack; fix GitHub URL to AureTrix-Solutions.

### advanced-key-pages — MPT, MT, TGL, END, SOCD, RS pages

### custom-firmware (long-term) — firmware for an own board (RP2040/STM32);
docs/sdk-reference-v2.md §10.5 wire-framing (64-byte packets, additive checksum, multi-packet
reassembly) is the foundation.

### macro-page — build the Macro config page (setMacro wrapper + Macro.vue)
- Pitfall: setMacro is called without touchMode → may reset a key's touch mode to global.
  Pass/preserve touchMode when wiring the page; verify on single + RT keys on hardware.

- [docs] sdk-reference-v2.md §13.7.4 wrongly claims `configs` never reaches a `filters` arg — hid's internal `devices()` zero-match fallback calls `requestDevice({filters:this.configs})`; correct the section. (Found in Task 2 review, 2026-10-08.)

- [types] protocol-keyboard ships no resolvable root types: package.json `"types"` points at a nonexistent `dist/esm/index.d.ts` and `"exports"` exposes only `"."` with no `types` condition, though `dist/cjs/types/index.d.ts` re-exports the whole interface/param surface. §13.4-class defect (same as hid). Relevant to Task 4 if real types are wanted instead of `any`. Resolution untested. (Found in Task 3, 2026-10-08.)

- [types] router/index.ts carries 17 of the 60 baseline tsc errors — the largest single block, and out of scope for sprint-01 Task 4a/4b (which only touch the two services). Its own type-cleanup sprint is needed before the baseline can approach zero. (Noted during PM R1 ruling, 2026-10-08.)

- [types] `navigator.hid` typing gap (15 errors across both services: TS18046 ×7, TS7006 ×6, TS2552 ×2). Do NOT install `@types/w3c-web-hid` — measured to make typecheck worse (63→68) because its global `HIDDevice` lacks `id`/`serialNumber` while hid's module-scoped `HIDDevice` has `id`. Fix instead by replicating KeyboardService.ts:8-10's existing local-shim pattern into DebugKeyboardService.ts plus a local `Navigator.hid` augmentation typed against hid's `HIDDevice`. Out of scope for Task 4a. (Measured in Task 4a, 2026-10-08 — detail in review-type-cleanup-4a.md §1.)
