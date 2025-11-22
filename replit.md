# AureTrix Keyboard Driver

## Overview
AureTrix is a web-based configuration tool for hall effect keyboards compatible with the SparkLink SDK. It provides a professional, browser-based interface for customizing keyboard behavior without requiring native drivers. Key capabilities include multi-layer key remapping, macro creation, comprehensive RGB lighting control, advanced hall effect features (Dynamic Keystroke, Magnetic Point Triggering, Rapid Trigger), sensor calibration, profile management, and a real-time debugging interface. The application runs entirely in the browser using the WebHID API, aiming to be the leading configuration solution for SparkLink-compatible hall effect keyboards.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes

**November 22, 2025 - Active Profile Hardware Synchronization**
- **Hardware-First Active Profile**: Removed `activeProfileId` from localStorage persistence; only profile names/settings persist
- **Query on Connection**: `syncActiveProfileFromHardware()` queries `ORDER_TYPE_CONFIG` (returns 0-3, maps to profiles 1-4) when keyboard connects
- **Optimistic UI Updates**: Profile switches set `activeProfileId` immediately for responsive UI
- **Delayed Verification**: After 500ms, `syncActiveProfileFromHardware()` confirms hardware state matches UI
- **Single Sync Point**: Eliminated duplicate sync calls; only `onAutoConnectSuccess` and `connectDevice` trigger sync
- **Result**: UI always reflects actual hardware profile on page load; profile switches feel instant while verifying with hardware

**November 21, 2025 - Production Ready Cleanup**
- **Removed Debug Features**: Eliminated `exportProfileDebug` and `importProfileDebug` methods from ExportService.ts
- **Cleaned Up Logging**: Removed verbose console.log statements throughout the codebase, keeping only console.error for critical errors
- **UI Cleanup**: Removed debug export/import buttons from App.vue and associated CSS styles
- **Removed Artifacts**: Deleted temporary debug JSON export files from attached_assets folder
- **Minimal Comments**: Added concise inline comments only where critical for understanding (import flow pre-mode switch)
- **Result**: Clean, production-ready codebase with no debug artifacts or verbose logging

**November 21, 2025 - Fixed Custom RGB Persistence with Simple Save Call**
- **Simple Solution**: SDK `importConfig()` loads all data including custom RGB into keyboard memory
- **Import Flow**: 
  1. Switch keyboard to custom mode 21 before import (removes `open` and `dynamicColorId` from current state)
  2. Wait 250ms for mode transition
  3. SDK `importConfig()` imports full profile (includes mode="custom" and all custom RGB data)
  4. Wait 1 second for profile to apply to hardware
  5. Call `saveCustomLighting()` once to commit custom RGB to flash memory
- **Key Insight**: Keyboard must be in custom mode before SDK import for RGB data to load correctly; then just save to flash
- **No Manual Loops**: No need for GET/SET loops - SDK already loads the data when in custom mode
- **Export Flow**: Switch to custom mode → capture all data (shows mode="custom", dynamic=21) → restore original mode
- **Result**: Custom RGB colors persist through browser refreshes and lighting mode switches

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
-   **KeyboardService.ts:** Abstraction layer for hardware interaction, managing device discovery, WebHID pairing, auto-reconnection, SparkLink SDK API wrappers, and connection lifecycle.
-   **ExportService.ts:** Handles complete profile backup and restore functionality, orchestrating data collection, assembling `KeyboardConfig` objects, and managing export/import operations via the SDK.
-   **DebugKeyboardService.ts:** A dedicated service for development and testing, offering SDK access without interfering with the main application state.

### Key Technical Decisions
1.  **WebHID over Native Drivers:** Chosen for cross-platform compatibility, no installation, and browser security.
2.  **Batch Processing for SDK Calls:** Crucial for managing hardware communication efficiency when sending numerous updates.
3.  **Service Separation Pattern:** Separates `KeyboardService`, `ExportService`, and `DebugKeyboardService` for clear separation of concerns.
4.  **Layout Configuration System:** Centralized management of absolute positioning data for accurate rendering of diverse keyboard layouts.
5.  **Type Safety with TypeScript:** Ensures type consistency across the application, especially between physical keys and remapped values in SDK calls and UI.
6.  **Complete Configuration Snapshot:** Export collects the full keyboard state by querying all keys using batch processing, reconstructing the macro library, and using `getApi()` for system settings lacking dedicated getters.

## External Dependencies

### Hardware Integration
-   **SparkLink SDK (@sparklinkplayjoy/sdk-keyboard v1.0.14):** Official SDK for communication with hall effect keyboards, enabling key remapping, macro management, travel distance configuration, sensor calibration, RGB lighting control, and advanced features.
-   **WebHID API (Browser Native):** Browser API for USB HID device communication, requiring Chromium-based browsers and HTTPS.

### Build Tools & Development
-   **Vite (v7.1.6):** Build tool and dev server.
-   **TypeScript (v5.9.2):** Provides type safety and IDE support.

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