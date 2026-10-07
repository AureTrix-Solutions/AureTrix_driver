# Roadmap

## SDK reference verification (one fresh session each)

1. ~~Cross-cutting: Layout_Mode encoding and advancedKeyMode values, firmware version gates, VersionString, KeyLayout naming, §6.1/§5.6 DKS consistency~~ — done. Verification status table added.
2. ~~§6 advanced keys: MPT, MT, getMtorTgl, TGL, END, SOCD, RS~~ — done
3. ~~§5 performance + §4 calibration~~ — done
4. ~~§2 key mapping, §3 device info, §7 macros, §8 lighting~~ — done
4b. ~~§1 connection, §9 export/firmware, §10.4 interfaces, §11 internals~~ — done
4c. ~~§10.5 framing utils, §10.7 events, §8 logo/custom/dynamic lighting, §14 unwrapped methods~~ — done

All 75 methods are now source-verified. Only hardware-behavior items remain `[unverified]`.

5. Add a "Hardware verification checklist" section to the reference (indexes all hardware-only `[unverified]` items)
6. Batch 5 cleanup: §10.5 decimal.js note, §13 register, summary table, Prerequisites/gotchas/error-handling sections from the old doc, cross-reference check
7. Audit docs/pages and README for stale SDK claims, then fix
8. Retire docs/SDK_REFERENCE.md and update CLAUDE.md

## Code fixes

- Apply variant P import fix (§13.7.3)
- Create sdk-wrapper skill
- Type cleanup: typecheck script, @types/w3c-web-hid, Calibration import, serialNumber, remaining errors

## Features

- DKS: setDks wrapper + getDksAll/getTrps/getTrpsAll, DKS.vue page
- Create advanced-key-page skill from DKS
- MPT, MT/TGL (getMtorTgl), END, SOCD, RS

## Backlog

- setMacro is called without touchMode, so all macros are written in mode 0. Test on single/RT keys.
- Macro writes may reset a key's touch mode to global (setMacro touchMode; 'quick' = 2 = rt). Test on single/RT keys.
- Lighting 1.0.9 features (dynamicColorId) are unreachable through the SDK facade.
- Decide npm vs pnpm (CLAUDE.md says pnpm, repo has package-lock.json)
- qmax/qlocal launchers, settings.local.json allowlist
- Replit: pull + npm install, don't commit Replit's lockfile
- deleteKey, on/off/reconnection, saturation, top dead band
- Custom firmware project — protocol wire-framing is now documented in §10.5 (64-byte packets, additive checksum, multi-packet reassembly)
