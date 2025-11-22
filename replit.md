# AureTrix Keyboard Driver

## Overview
AureTrix is a web-based configuration tool for hall effect keyboards compatible with the SparkLink SDK. It provides a professional, browser-based interface for customizing keyboard behavior without requiring native drivers. Key capabilities include multi-layer key remapping, macro creation, comprehensive RGB lighting control, advanced hall effect features (Dynamic Keystroke, Magnetic Point Triggering, Rapid Trigger), sensor calibration, profile management, and a real-time debugging interface. The application runs entirely in the browser using the WebHID API, aiming to be the leading configuration solution for SparkLink-compatible hall effect keyboards.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
### Frontend Architecture
The application is built with Vue.js 3, using the Composition API and TypeScript. It follows a component-based Single Page Application (SPA) architecture with Vue Router for lazy-loaded routes and Pinia for state management with persistence. SCSS handles styling. Key design patterns include composables for reusable logic and a layout system for dynamic rendering of various physical keyboard layouts using absolute pixel positioning. A batch processing pattern is implemented to prevent hardware overload by batching SDK calls during extensive updates.

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