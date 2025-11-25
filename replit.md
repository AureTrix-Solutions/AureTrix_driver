# AureTrix Keyboard Driver

## Overview
AureTrix is a web-based configuration tool for hall effect keyboards compatible with the SparkLink SDK. It provides a professional, browser-based interface for customizing keyboard behavior without requiring native drivers. Key capabilities include multi-layer key remapping, macro creation, comprehensive RGB lighting control, advanced hall effect features (Dynamic Keystroke, Magnetic Point Triggering, Rapid Trigger), sensor calibration, profile management, a real-time debugging interface, and a custom layout creator with controller emulation metadata support. The application runs entirely in the browser using the WebHID API, aiming to be the leading configuration solution for SparkLink-compatible hall effect keyboards.

## Recent Changes
### November 25, 2025 - Click-and-Drag Key Selection for RGB Lighting
-   **Drag Selection in Lighting Page:** Added click-and-drag selection to the RGB Lighting page. Users can now draw a selection rectangle over the virtual keyboard to select multiple keys at once, making it much faster to customize lighting zones.
-   **Movement Threshold:** Distinguishes between clicks and drags using a 5px movement threshold. Single clicks still toggle individual keys, while dragging beyond 5px enters selection mode.
-   **Shift Key Additive Mode:** Hold Shift while dragging to add keys to existing selection instead of replacing. Works for both drag selections and single clicks.
-   **Selection Rectangle Overlay:** Visual dashed rectangle with accent color shows the selection area while dragging.
-   **Global Mouse Event Handling:** Proper cleanup via global mouseup listener ensures drag state resets even when pointer is released outside the keyboard grid.

### November 24, 2025 - Dynamic Row Count Support & Full Keyboard Initialization
-   **Dynamic Row Count Support:** Layout Creator now supports keyboards with any number of rows (up to 10). Added `displayRowCount` computed property that dynamically adjusts UI controls based on actual keyboard structure. Removed hardcoded 6-row limitation from template loops and reactive arrays, allowing full editing capability for 7+ row keyboards (ortholinear, full-size, custom layouts).
-   **Watcher Synchronization Fix:** Fixed critical issue where `previousRowCounts` was updated after `rowCounts`, causing the watcher to rebuild rows 6+ with default keys. Now updates `previousRowCounts` before `rowCounts` in all initialization paths (fallback, hardware load, saved layout load, import) to preserve hardware data for 7+ row keyboards.
-   **Full Keyboard Padding System:** Implemented `getPaddedKeySizes()` helper function in layoutConfigs.ts that returns fully padded keySizes arrays using the same padding logic as `processLayoutConfig`. Creates single-column seed layout and pads each row to match hardware's actual key count, filling missing positions with 1u (19.05mm) keys.
-   **Complete Layout Display on Initialization:** Updated LayoutCreator.vue to show ALL keys immediately upon loading. Instead of single-column initialization, users now see the full keyboard with every key visible at 1u size, ready to resize and customize. Uses `getPaddedKeySizes()` to build virtualKeyboard directly from padded keySizes array.
-   **Synchronized Row Counts:** rowCounts now represent actual key counts per row (e.g., 15 keys) rather than just row existence flags. Updates dynamically when hardware connects/disconnects, providing accurate representation of keyboard structure.
-   **Robust Connection Lifecycle Handling:** Comprehensive watchers for connection state changes, device hot-swaps, and disconnects. Includes retry logic with exponential backoff (up to 5 attempts over ~3 seconds) to handle delayed SDK responses.
-   **Dynamic Fallback Layout System:** `generateFallbackLayout()` provides last-resort keyboard layout when no IndexedDB custom layout, sharedLayout.ts community layout, or layoutMap keyCount match exists. Dynamically generates layout based on hardware's actual row count from baseLayout parameter, defaulting to 6 rows if unavailable.
-   **4-Tier Layout Priority:** IndexedDB → sharedLayout.ts → layoutMap → dynamic fallback, ensuring graceful degradation for all hardware configurations.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Frontend Architecture
The application is built with Vue.js 3, using the Composition API and TypeScript. It follows a component-based Single Page Application (SPA) architecture with Vue Router for lazy-loaded routes and Pinia for state management with persistence. SCSS handles styling. Key design patterns include composables for reusable logic and a layout system for dynamic rendering of various physical keyboard layouts using absolute pixel positioning. A batch processing pattern is implemented to prevent hardware overload by batching SDK calls during extensive updates.

### Data Flow Architecture
User interactions trigger `KeyboardService` methods, which encapsulate SparkLink SDK calls. The SDK communicates with the keyboard via WebHID. Responses update Pinia stores, leading to reactive UI updates. Connection status, device identification, macro library, and travel profiles are persisted via localStorage.

### Service Layer
-   **KeyboardService.ts:** Abstraction layer for hardware interaction, managing device discovery, WebHID pairing, auto-reconnection, SparkLink SDK API wrappers, and connection lifecycle.
-   **ExportService.ts:** Handles complete profile backup and restore functionality.
-   **DebugKeyboardService.ts:** A dedicated service for development and testing, offering SDK access without interfering with the main application state.
-   **LayoutStorageService.ts:** Manages custom keyboard layouts using IndexedDB for persistent storage, handles JSON export/import, and generates GitHub issue submission links.

### Key Technical Decisions
1.  **WebHID over Native Drivers:** Chosen for cross-platform compatibility, no installation, and browser security.
2.  **Batch Processing for SDK Calls:** Manages hardware communication efficiency.
3.  **Service Separation Pattern:** Separates concerns into distinct services.
4.  **Layout Configuration System:** Centralized management of absolute positioning data for accurate rendering of diverse keyboard layouts, using a 4-tier priority system: IndexedDB (user custom layouts) → `sharedLayout.ts` (community layouts) → `layoutMap` (standard layouts by key count) → Dynamic Fallback (generates a minimal layout for unknown hardware). Layouts are cached in-memory and refreshed dynamically.
5.  **Standardized Measurement System:** All layout measurements use the industry-standard 1u = 19.05mm, with a centralized `mmToPx` conversion ratio.
6.  **Type Safety with TypeScript:** Ensures type consistency across the application.
7.  **SDK Reconnection Error Suppression:** Implements logic to suppress `NotAllowedError` during SDK auto-reconnection and managed operations, preventing console pollution while maintaining proper error logging.
8.  **SDK Initialization System:** Implements a comprehensive initialization flow using `waitForSDKReady()` with exponential backoff to ensure the SparkLink SDK is fully ready before API calls. Includes auto-retry logic and a mutex to prevent concurrent initialization.
9.  **Complete Configuration Snapshot:** Export collects the full keyboard state by querying all keys, reconstructing the macro library, and using `getApi()` for system settings.
10. **Custom Layout Creator:** A full-page visual builder allowing users to create and customize keyboard layouts by specifying row counts, key sizes (in units or mm), and gaps. Supports multi-select, stores layouts in IndexedDB, and enables export in JSON or compact code formats for community contributions via GitHub issues.

## External Dependencies

### Hardware Integration
-   **SparkLink SDK (@sparklinkplayjoy/sdk-keyboard v1.0.14):** Official SDK for communication with hall effect keyboards.
-   **WebHID API (Browser Native):** Browser API for USB HID device communication.

### Build Tools & Development
-   **Vite (v7.1.6):** Build tool and dev server.
-   **TypeScript (v5.9.2):** Provides type safety and IDE support.

### Runtime Dependencies
-   **Vue 3 (v3.5.21):** Reactive UI framework.
-   **Vue Router (v4.5.1):** Client-side routing.
-   **Pinia (v3.0.3):** State management.
-   **pinia-plugin-persistedstate (v4.5.0):** Enables localStorage persistence for Pinia stores.

### Testing
-   **Vitest (v3.2.4):** Vite-native unit test runner.
-   **@vue/test-utils (v2.4.6):** Utilities for Vue component testing.

### Package Management
-   **pnpm (v10.17.0):** Fast, disk-efficient package manager.