# AureTrix Keyboard Driver

## Overview
AureTrix is a web-based configuration tool for hall effect keyboards compatible with the SparkLink SDK. It provides a professional, browser-based interface for customizing keyboard behavior without requiring native drivers. Key capabilities include multi-layer key remapping, macro creation, comprehensive RGB lighting control (including per-key customization and various dynamic effects), advanced hall effect features (Dynamic Keystroke, Magnetic Point Triggering, Rapid Trigger), sensor calibration, profile management, and a real-time debugging interface. The application runs entirely in the browser using the WebHID API.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes

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
-   **KeyboardService.ts:** Abstraction layer for hardware interaction, managing device discovery, WebHID pairing, auto-reconnection, SparkLink SDK API wrappers, and connection lifecycle.
-   **DebugKeyboardService.ts:** A dedicated service for development and testing, offering SDK access without interfering with the main application state.

### Key Technical Decisions
1.  **WebHID over Native Drivers:** Chosen for cross-platform compatibility, no installation, and browser security, acknowledging its limitation to Chromium browsers and requirement for HTTPS.
2.  **Batch Processing for SDK Calls:** Crucial for managing hardware communication efficiency when sending numerous updates.
3.  **Dual Service Pattern:** Separates `KeyboardService` and `DebugKeyboardService` to enable raw data inspection independently.
4.  **Layout Configuration System:** Centralized management of absolute positioning data for accurate rendering of diverse keyboard layouts.
5.  **Type Safety with TypeScript:** Ensures type consistency across the application, especially between physical keys and remapped values in SDK calls and UI.

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