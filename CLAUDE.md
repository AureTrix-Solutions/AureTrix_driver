# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AureTrix is a browser-based configuration tool for hall effect keyboards (SparkLink SDK compatible). It is a Vue 3 + TypeScript + Vite SPA that talks to keyboards via the **WebHID API** — no native driver. WebHID requires a Chromium-based browser and a secure context (`localhost` or HTTPS).

## Commands

```bash
pnpm install          # install dependencies (pnpm is the declared package manager)
pnpm dev              # dev server on http://localhost:5000 (strictPort)
pnpm build            # production build to dist/
pnpm preview          # serve the production build
pnpm test             # vitest (watch mode by default)
pnpm vitest run path/to/file.test.ts   # run a single test file
```

There is no lint script and currently no test files, despite vitest/@vue/test-utils being installed.

## Architecture

### Layered data flow

```
Vue pages (src/pages/*) 
  → Pinia stores (src/store/*)  and/or  singleton services (src/services/*)
    → @sparklinkplayjoy/sdk-keyboard (XDKeyboard)
      → WebHID → physical keyboard
```

- **Services are singletons**: each service class ends with `export default new XService()`. Importing `KeyboardService` anywhere gets the same instance. `KeyboardService` is also `app.provide`d in `main.ts` as `'KeyboardService'`, but most code imports the singleton directly.
- **`KeyboardService`** (~1400 lines) is the core hardware wrapper: connection/auto-reconnect (paired device tracked via `pairedStableId` in localStorage), key remapping, lighting, rapid trigger, calibration, profile switching, factory reset. It registers HID connect/disconnect listeners in its constructor and does deferred auto-reconnect on app start. It contains operation-token and timeout state machines for polling-rate changes, factory reset, and reconnection, plus temporary `console.error` suppression around reconnects.
- **`DebugKeyboardService`** is a *separate* XDKeyboard instance used only by the Debug page, so raw SDK inspection doesn't interfere with the main connection.
- **`ExportService`** gathers full keyboard config for export/import (JSON), using batch processing and retry-with-backoff around SDK calls.
- **`store/connection.ts`** holds connection status/deviceInfo and is the bridge pages use to know if hardware is available. `profileStore` (4 hardware profiles) and `travelProfilesStore` (persisted via pinia-plugin-persistedstate) are small.

### Batch processing

Hardware calls for many keys must go through `useBatchProcessing().processBatches` (src/composables): batches of 80 keys with 100ms delay between batches. Firing per-key SDK calls for a whole keyboard will overload the device — follow this pattern for any new bulk operation.

### Key model

`IDefKeyInfo` (src/types/types.ts) distinguishes `physicalKeyValue` (hardware key ID used for all SDK calls) from `keyValue` (current remapped/display value). Layouts are `IDefKeyInfo[][]` (rows of keys). `useMappedKeyboard(layerIndex)` (src/utils/MappedKeyboard.ts) is the shared composable that fetches the base layout + a remapping layer from hardware and computes absolute pixel positioning (`gridStyle`) for rendering.

### Layout system (priority order)

Physical layout geometry (key sizes in mm, gaps, row spacing) resolves in this order:

1. `src/utils/sharedLayout.ts` — community-contributed layouts keyed by **productName** (checked first; this is where user-submitted layouts go)
2. IndexedDB custom layouts via `LayoutStorageService` (created in the Layout Creator page; cache preloaded in `main.ts` via `loadCustomLayouts()` before app mount)
3. `src/utils/layoutConfigs.ts` — built-in fallback layouts keyed by **total key count** (61, 68, ...)

`getLayoutConfig(totalKeys, layout, ..., productName)` in layoutConfigs.ts implements this resolution. `keyUnits.ts` converts mm to px.

### Routing

`src/router/index.ts`: `/` (Connect page) is eagerly loaded; all feature pages are lazy-loaded. Routes map 1:1 to pages (KeyMapping, Lighting, Performance, RapidTrigger, Calibration, DKS/MPT/MT/TGL/END/SOCD/Macro advanced features, LayoutPreview, LayoutCreator, Debug).

### Path aliases

Vite + TS aliases: `@` → src, plus `@components`, `@pages`, `@services`, `@styles`, `@assets`, `@types`, `@utils`. Both alias styles are used in the codebase.

### Docs

`docs/pages/*.md` documents each feature page; `docs/SDK_REFERENCE.md` documents the SparkLink SDK surface. Consult these before changing page behavior or SDK call patterns.

## Conventions (from CONTRIBUTING.md)

- Use `<script setup lang="ts">` for new components; Composition API only.
- Use Pinia stores for shared state; no direct DOM manipulation for state changes.
- Commit style: `Add: ...`, `Fix: ...`, `Update: ...`, `Remove: ...`.
- New keyboard layout contributions go in `src/utils/sharedLayout.ts` with precise mm-level measurements (1u = 19.05mm).
