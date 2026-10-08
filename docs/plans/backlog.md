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