# Roadmap

## SDK reference verification (one fresh session each)

1. ~~Cross-cutting: Layout_Mode encoding and advancedKeyMode values, firmware version gates, VersionString, KeyLayout naming, §6.1/§5.6 DKS consistency~~ — done. Verification status table added.
2. §6 advanced keys: MPT, MT, getMtorTgl, TGL, END, SOCD, RS
3. §5 performance + §4 calibration
4. §2 key mapping, §3 device info, §7 macros, §8 lighting
4b. §1 connection, §9 export/firmware, §10.4 interfaces, §11 internals
5. Cleanup: §10.5 decimal.js, §13.4 src ships, §13 register, summary table, header sources, gaps from old doc
6. Audit docs/pages and README for stale SDK claims, then fix
7. Retire docs/SDK_REFERENCE.md

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
- Custom firmware project
