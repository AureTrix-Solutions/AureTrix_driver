# Backlog

Candidate sprints and known issues. The PM reads this at PM-open; the PO picks the next sprint; the
PM removes the chosen item and expands it into current-sprint.md with "Done when:" criteria and tags.
Workers/Reviewers who find a new bug append a one-liner here (do NOT fix out of sprint scope).

## Candidate sprints (PO picks next)

### code-fixes — clean up the SDK integration before feature work
Suggested order: typecheck-script → variant-P → sdk-wrapper → type-cleanup (baseline must exist
before the cleanup can be measured; variant-P is foundational for the cleanup).

- typecheck script [trivial]: add "typecheck": "tsc --noEmit" to package.json.
  Done when: script runs; AND the first run's error count is saved to docs/tsc-baseline.txt
  (this activates the self-check gate in CLAUDE.md).
- variant-P import fix [high-stakes]: per docs/sdk-reference-v2.md §13.7.3 — add the tsconfig paths
  mapping for @sparklinkplayjoy/hid → dist/cjs/index.d.ts; remove the unused DeviceInit imports;
  widen the device-literal annotations (annotation only); set the XDKeyboard constructor to
  { usage:1, usagePage:[65440], configs:[] }. Preserve design intent (filters:[], usagePage 65440).
  Later tasks depend on this — review immediately.
- sdk-wrapper skill [trivial]: capture the KeyboardService wrapper pattern (connectedDevice check →
  ensureKeyboard().<method> → instanceof Error → return Error; param types from protocol-keyboard).
  Create under .openclaude/skills/sdk-wrapper.
- type cleanup [high-stakes]: install @types/w3c-web-hid (check for conflict with hid's own
  HIDDevice), fix the missing Calibration import, decide serialNumber handling, and clear the
  remaining tsc errors down toward zero (ratchet docs/tsc-baseline.txt down as you go).

### dks-page — build the Dynamic Keystroke config page (setDks wrapper + DKS.vue)

### advanced-key-pages — MPT, MT, TGL, END, SOCD, RS pages

### custom-firmware (long-term) — firmware for an own board (RP2040/STM32);
docs/sdk-reference-v2.md §10.5 wire-framing (64-byte packets, additive checksum, multi-packet
reassembly) is the foundation.

### macro-page — build the Macro config page (setMacro wrapper + Macro.vue)
- Pitfall: setMacro is called without touchMode → may reset a key's touch mode to global.
  Pass/preserve touchMode when wiring the page; verify on single + RT keys on hardware.