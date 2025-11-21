# AureTrix Keyboard Driver

## Overview
AureTrix is a web-based configuration tool for hall effect keyboards compatible with the SparkLink SDK. It provides a professional, browser-based interface for customizing keyboard behavior without requiring native drivers. Key capabilities include multi-layer key remapping, macro creation, comprehensive RGB lighting control (including per-key customization and various dynamic effects), advanced hall effect features (Dynamic Keystroke, Magnetic Point Triggering, Rapid Trigger), sensor calibration, profile management, and a real-time debugging interface. The application runs entirely in the browser using the WebHID API.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes

**November 21, 2025 - Complete Export Using Proven Batch Processing Patterns**
- **Fixed approach**: Removed incorrect ORDER_TYPE_CONFIG usage (only switches profiles, doesn't return config)
- **Implemented complete 4-phase data collection** matching proven patterns from MappedKeyboard.ts and Vue pages:
  - **Phase A**: Layout bindings (Fn0-Fn3) using 10-key sequential batches for `getLayoutKeyInfo()` array method
  - **Phase B**: Performance & travel data using 80-key batches with 100ms delays via `processBatches`
  - **Phase C**: Advanced key data (DKS, MPT, SOCD, MT, TGL, END) using 80-key batches with 100ms delays
  - **Phase D**: Per-key custom RGB lighting using 80-key batches with 100ms delays
- **Complete lighting zones**: Added `getLogoLighting()` and `getSpecialLighting()` to KeyboardService for main/logo/other zones
- **Complete macro library**: Iterates all keys to find macro assignments via `getMacro()`
- **Proper schema compliance**: Imports KeyboardConfig/Keyboards types from SDK's validate.d.ts
- Export assembles complete KeyboardConfig from all phases: system, light (3 zones), keyboards (80 keys with all settings), macros
- Batch sizes match production code: 10-key for array-based SDK methods, 80-key for single-key SDK methods
- Expected completion time: 3-5 seconds for complete profile backup

**November 21, 2025 - Optimized Profile Export/Import with Phased Batch Processing**
- Created dedicated ExportService.ts for profile backup/restore functionality with timeout-resistant data collection
- Added missing SDK wrapper methods to KeyboardService: getApi, getDks, getMpt, getSocd, getMT, getTGL, getEND
- Implemented **4-phase batch processing** to eliminate SDK timeout errors
- **Retry logic**: All SDK calls wrapped with retryWithBackoff (2 retries, 200ms backoff) to handle intermittent timeouts
- Enhanced useBatchProcessing composable with configurable batchSize and delayMs parameters (defaults: 80, 100)
- Export collects complete KeyboardConfig: device info, system settings, lighting, layouts, performance, travel, advanced keys, macros
- All keys populate fn0-fn3 bindings (not just remapped keys) for complete layer mapping
- Export passes populated KeyboardConfig to SDK's exportConfig() for encryption and file download
- Import uses SDK's importConfig() which handles decryption and applies settings automatically
- UI updated: Export/Import buttons in sidebar use ExportService with proper error handling

**November 21, 2025 - Simplified Profile Export/Import UI**
- Removed per-profile export icon (⬇) from profile buttons for cleaner interface
- Added centralized "Export Profile" button above "Import Profile" button in sidebar
- Both export/import buttons share consistent full-width styling and disabled state when disconnected
- Simplified exportProfile() method to export currently active profile without switching profiles
- Export filename automatically uses custom profile name from profileStore
- Active profile tracking relies on profileStore's persisted activeProfileId (restored after page reload)
- **Profile export flow**: Switch to desired profile → profile changes and page reloads → click "Export Profile" to save that profile's current configuration
- Removed .export-icon CSS styling, added .export-btn styling grouped with .import-btn

**November 21, 2025 - Connection Storage Cleanup and Race Condition Fixes**
- Simplified localStorage to use only `pairedStableId` (single key) instead of multiple pairedDeviceData_* entries
- Removed redundant reconnect() method that duplicated device data in localStorage
- Added cleanupLegacyStorage() to remove old pairedDeviceId and pairedDeviceData_* keys on startup
- Improved reconnectIfPaired() with pairedStableId check before calling autoConnect() to avoid unnecessary browser queries
- Added race condition guard (isAutoConnecting flag) to prevent concurrent autoConnect() calls from constructor and handleConnect events
- Implemented try-finally pattern to ensure isAutoConnecting flag is always reset even on errors
- Made reconnectIfPaired() async with proper error handling for startup connection failures
- Connection persistence now relies solely on browser's navigator.hid.getDevices() for fresh device data instead of localStorage cache

**November 21, 2025 - Profile Quick-Access Buttons with SDK Integration**
- Added 4 customizable profile buttons in 2x2 grid layout below Debug nav item in sidebar
- Created profileStore.ts with Pinia for managing profiles, active profile, and localStorage persistence
- Integrated SDK's switchConfig method for hardware profile switching via profile buttons
- Added KeyboardService.switchConfig wrapper that maps profileId (1-4) to SDK config index (0-3) with error handling
- Single-click profile button triggers hardware profile switch via SDK and full page reload
- **Full page reload after successful profile switch**: Ensures all UI components re-mount and re-fetch settings (lighting, key mappings, macros) from newly active profile
- Added small edit icon (✏️) in top-right corner of each profile button for renaming
- Edit icon implemented as accessible span element with role="button", tabindex="0", and Enter key support
- UX flow: click button switches keyboard hardware profile with page reload, click edit icon enters rename mode
- Profile names persist in localStorage independently of hardware profile state
- Page reload only triggers on successful SDK switch, not on rename operations or failed switches

## System Architecture

### Frontend Architecture
The application is built with Vue.js 3, using the Composition API and TypeScript. It follows a component-based Single Page Application (SPA) architecture with Vue Router for lazy-loaded routes and Pinia for state management with persistence. SCSS handles styling.

**Key Design Patterns:**
-   **Composables:** Reusable logic is extracted into composition functions, such as `useBatchProcessing.ts` for batched SDK calls and `useMappedKeyboard.ts` for keyboard layout rendering.
-   **Layout System:** Supports dynamic rendering of various physical keyboard layouts (e.g., 61, 67, 68, 80, 82, 84, 87-key) using absolute pixel positioning defined in `layoutConfigs.ts`.
-   **Batch Processing Pattern:** Implemented to prevent hardware overload by batching SDK calls (e.g., 80 keys per batch with a 100ms throttle) during extensive updates like key remapping or calibration.

### Data Flow Architecture
User interactions trigger `KeyboardService` methods, which encapsulate SparkLink SDK calls. The SDK communicates with the keyboard via WebHID. Responses update Pinia stores, leading to reactive UI updates. Connection status, device identification, macro library, and travel profiles are persisted via localStorage.

### Service Layer
-   **KeyboardService.ts:** Abstraction layer for hardware interaction, managing device discovery, WebHID pairing, auto-reconnection, SparkLink SDK API wrappers, and connection lifecycle. Provides comprehensive SDK method wrappers including getApi() for raw command access.
-   **ExportService.ts:** Handles complete profile backup and restore functionality. Orchestrates data collection from keyboard hardware, assembles KeyboardConfig objects matching SDK validation schema, and manages export/import operations via SDK's exportConfig/importConfig methods.
-   **DebugKeyboardService.ts:** A dedicated service for development and testing, offering SDK access without interfering with the main application state.

### Key Technical Decisions
1.  **WebHID over Native Drivers:** Chosen for cross-platform compatibility, no installation, and browser security, acknowledging its limitation to Chromium browsers and requirement for HTTPS.
2.  **Batch Processing for SDK Calls:** Crucial for managing hardware communication efficiency when sending numerous updates. Export/import leverages existing useBatchProcessing composable (40 keys/batch, 100ms throttle) for efficient data collection.
3.  **Service Separation Pattern:** Separates `KeyboardService` (SDK wrappers), `ExportService` (profile backup/restore), and `DebugKeyboardService` (development/testing) for clear separation of concerns.
4.  **Layout Configuration System:** Centralized management of absolute positioning data for accurate rendering of diverse keyboard layouts.
5.  **Type Safety with TypeScript:** Ensures type consistency across the application, especially between physical keys and remapped values in SDK calls and UI.
6.  **Complete Configuration Snapshot:** Export collects full keyboard state (not just subset) by querying all keys using batch processing, reconstructing macro library from getMacro() results, and using getApi() for system settings lacking dedicated getters (polling rate: ORDER_TYPE_ROES, top dead band: ORDER_TYPE_TOP_DEAD_SWITCH).

## External Dependencies

### Hardware Integration
-   **SparkLink SDK (@sparklinkplayjoy/sdk-keyboard v1.0.14):** Official SDK for communication with hall effect keyboards, enabling key remapping, macro management, travel distance configuration, sensor calibration, RGB lighting control, and advanced features (DKS, MPT, SOCD, Rapid Trigger).
-   **WebHID API (Browser Native):** Browser API for USB HID device communication. Requires Chromium-based browsers, HTTPS (localhost exempt), and explicit user permission.

### Build Tools & Development
-   **Vite (v7.1.6):** Build tool and dev server with HMR, path aliases, SCSS preprocessing, and production build capabilities.
-   **TypeScript (v5.9.2):** Provides type safety and IDE support with strict mode and path mapping enabled.

### Runtime Dependencies
-   **Vue 3 (v3.5.21):** Reactive UI framework.
-   **Vue Router (v4.5.1):** Client-side routing with lazy loading.
-   **Pinia (v3.0.3):** State management.
-   **pinia-plugin-persistedstate (v4.5.0):** Enables localStorage persistence for Pinia stores.

### Testing
-   **Vitest (v3.2.4):** Vite-native unit test runner.
-   **@vue/test-utils (v2.4.6):** Utilities for Vue component testing.

### Package Management
-   **pnpm (v10.17.0):** Fast, disk-efficient package manager.