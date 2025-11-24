# AureTrix Keyboard Driver

## Overview
AureTrix is a web-based configuration tool for hall effect keyboards compatible with the SparkLink SDK. It provides a professional, browser-based interface for customizing keyboard behavior without requiring native drivers. Key capabilities include multi-layer key remapping, macro creation, comprehensive RGB lighting control, advanced hall effect features (Dynamic Keystroke, Magnetic Point Triggering, Rapid Trigger), sensor calibration, profile management, a real-time debugging interface, and a custom layout creator with controller emulation metadata support. The application runs entirely in the browser using the WebHID API, aiming to be the leading configuration solution for SparkLink-compatible hall effect keyboards.

## Recent Changes
### November 24, 2025 - Layout Creator Initialization & Fallback System
-   **Layout Creator Single-Column Initialization:** Updated LayoutCreator.vue to automatically initialize with a single-column layout (1 key per row) instead of starting empty. Users now have an immediate foundation for building layouts, where each row contains one 1u key that works with the auto-padding logic. The row count dynamically adapts to the connected keyboard's actual hardware (via baseLayout), defaulting to 6 rows when no keyboard is connected.
-   **Robust Connection Lifecycle Handling:** Implemented comprehensive watchers for connection state changes, device hot-swaps, and disconnects. Includes retry logic with exponential backoff (up to 5 attempts over ~3 seconds) to handle delayed SDK responses. Users always see a functional layout that adapts to their hardware.
-   **Dynamic Fallback Layout System:** Added `generateFallbackLayout()` function in layoutConfigs.ts that provides a last-resort single-column keyboard layout when no IndexedDB custom layout, sharedLayout.ts community layout, or layoutMap keyCount match exists. Prevents users from seeing blank screens or errors when connecting unknown keyboards. Fallback dynamically generates layout based on hardware's actual row count from baseLayout parameter, defaulting to 6 rows if unavailable.
-   **4-Tier Layout Priority:** Updated layout loading to use IndexedDB → sharedLayout.ts → layoutMap → dynamic fallback, ensuring graceful degradation for all hardware configurations.

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