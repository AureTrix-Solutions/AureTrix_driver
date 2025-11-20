# AureTrix Keyboard Driver

## Overview

AureTrix is a web-based configuration tool for hall effect keyboards compatible with the SparkLink SDK. It provides a professional interface for customizing keyboard behavior, including key remapping, macro creation, lighting control, and advanced hall effect features like dynamic keystroke (DKS), magnetic point triggering (MPT), and rapid trigger. The application runs entirely in the browser using the WebHID API, eliminating the need for native drivers or installations. Key capabilities include multi-layer key remapping, visual macro recording, per-key RGB lighting, hall effect sensor calibration, profile management, and a real-time debugging interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**November 19, 2025 - Production Lighting Page Implementation**
- Implemented complete production-ready Lighting.vue page with full RGB lighting control
- Added master lighting controls (brightness 0-4, speed 0-4, sleep timer, direction reversal, super response toggle)
- Integrated 22 lighting modes (Static, Wave, Ripple, Spectrum, Custom, and 17 more dynamic effects)
- Implemented per-key custom RGB lighting in Custom mode (mode 21) with color picker and batch processing
- Added virtual keyboard displaying custom colors with proper CSS override (background + backgroundImage: none)
- Implemented quick selection presets (Select All, WASD, Letters, Numbers, None)
- Added lighting SDK methods to KeyboardService.ts (getLighting, setLighting, closedLighting, getCustomLighting, setCustomLighting, saveCustomLighting)
- Follows proper API workflow pattern: get current state, modify properties, filter out `open` and `dynamicColorId`, then set
- Comprehensive error handling for all SDK calls with user-friendly error messages
- Flash write optimization: preview without save during color picker drag, commit with save on release
- Updated SDK_REFERENCE.md with detailed lighting API documentation and workflow examples
- Updated PAGES_OVERVIEW.md to mark Lighting as fully functional (9 functional pages total)

**November 19, 2025 - Custom RGB Batch Processing Optimization**
- Implemented batch processing for custom color updates using `useBatchProcessing` composable
- Custom colors now update in parallel batches of 80 keys instead of sequential processing
- Significantly improved performance when updating many keys (20-50+) simultaneously
- Color picker dragging is now smooth and responsive even with large selections
- Maintains existing throttling and flash write optimization (preview without save, final commit with save)
- Properly handles key fallback logic (`physicalKeyValue || keyValue`) in batch processing

**November 19, 2025 - Virtual Keyboard Custom RGB Display Fix**
- Fixed CSS gradient masking issue preventing custom colors from displaying on virtual keyboard
- Changed `getKeyStyleWithCustomColor` to use `background` instead of `backgroundColor`
- Added `backgroundImage: 'none'` to override CSS gradient background from `.key-btn` class
- Virtual keyboard now properly displays custom RGB colors immediately on page load and mode switch
- Keys show their assigned custom colors without requiring selection
- Inline styles now correctly override CSS class gradients for visual preview

**November 19, 2025 - Lighting Page SASS Styling Fix**
- Fixed SASS compilation issues caused by incorrect variable names in Lighting.vue
- Replaced entire `<style>` section with correct styles copied from Debug.vue reference implementation
- Updated SASS variables: v.$bg-color → v.$background-dark (and other variables to match Debug.vue)
- Changed template class from 'key-selected' to 'lighting-key-selected' to match stylesheet
- All visual styling now matches Debug.vue's working implementation
- Workflow restarts successfully with no SASS compilation errors
- Architect reviewed and approved changes with no regressions found

**November 19, 2025 - Lighting Page Functional Fixes (Aligned with Debug.vue)**
- Fixed mode selection not working by adding missing `type` field to setLighting() calls
- Mode now correctly sets type='static' (mode 0), type='dynamic' (modes 1-20), type='custom' (mode 21)
- Removed non-functional super response checkbox and all related code (ref, initialization, function, exports)
- Replaced selectWASD, selectLetters, selectNumbers with toggle versions from Debug.vue
- Selection buttons now properly toggle: deselect all target keys if all are selected, otherwise add without duplicates
- All changes architect-reviewed and verified to match Debug.vue's working implementation
- Lighting page now fully functional with mode selection, togglable key selection, and no unused controls

**November 19, 2025 - Custom RGB Performance Optimization**
- Separated virtual keyboard preview from physical keyboard writes for smooth custom color dragging
- Created updateVirtualKeyboardColorOnly() function that updates customColors reactive object without SDK calls
- Color picker @input (during drag) now updates only virtual keyboard preview (instant, no SDK calls)
- Color picker @change (on release) updates physical keyboard via SDK with saveToFlash: true
- Eliminated lag during color dragging by deferring all KeyboardService calls to final release event
- Virtual keyboard shows real-time color preview while dragging, physical keyboard updates once when finished
- Architect-reviewed and verified performance improvement with no regressions

**November 19, 2025 - Lighting Page Documentation**
- Created comprehensive docs/pages/Lighting.md following project documentation conventions
- Documented all 22 lighting modes (Static, Dynamic effects 1-20, Custom per-key RGB)
- Detailed master controls, key selection system, virtual keyboard rendering, and performance optimizations
- Included API workflow patterns, error handling strategies, user workflows, and developer notes
- Documented dual-event color picker approach, batch processing optimization, and flash write management
- Follows same format and structure as other page documentation (Debug.md, KeyMapping.md, etc.)

**November 19, 2025 - Critical closedLighting() Documentation Update**
- Added prominent warning in SDK_REFERENCE.md about calling getLighting() before closedLighting()
- Documented that skipping getLighting() causes all lighting settings to be lost when lights turn back on
- Provided correct pattern (load settings → turn off → turn back on with preserved settings)
- Provided incorrect pattern example showing what NOT to do
- Added best practice toggle implementation example
- Updated docs/pages/Lighting.md with matching warnings in toggle function and dependencies sections

**November 20, 2025 - Custom Color Loading Optimization**
- Modified loadCustomColorsFromKeyboard() to use batched updates for smooth virtual keyboard rendering
- Colors now collected in temporary object first instead of updating reactive customColors immediately
- Added 100ms delay after all colors retrieved to prevent flicker during mode switch or page load
- Batch-assign all colors at once using Object.assign() for single smooth virtual keyboard update
- Added nextTick() after batch assignment to ensure Vue processes reactive updates before rendering
- Added additional 50ms delay after nextTick() to ensure rendering completes without glitches
- Eliminates flickering/multiple updates and occasional rendering glitches when loading 80-100+ key colors
- Architect-reviewed and verified no regressions, maintains Vue reactivity

## System Architecture

### Frontend Architecture

**Framework:** Vue.js 3 with Composition API and TypeScript. The application uses a component-based SPA architecture with pages, Vue Router for lazy-loaded routes, and Pinia for state management with persistence. Styling is handled with SCSS.

**Key Design Patterns:**
1.  **Composables:** Reusable logic extracted into composition functions (e.g., `useBatchProcessing.ts` for batched SDK calls, `useMappedKeyboard.ts` for keyboard layout rendering).
2.  **Layout System:** Dynamic keyboard rendering supporting various physical layouts (61, 67, 68, 80, 82, 84, 87-key) using absolute pixel positioning.
3.  **Batch Processing Pattern:** Batches SDK calls (e.g., 80 keys per batch with 100ms throttle) to prevent hardware overload during updates like key remapping or calibration.

### Data Flow Architecture

User actions in Vue components trigger `KeyboardService` methods, which wrap SparkLink SDK calls. The SDK communicates with the keyboard via WebHID, and responses update Pinia stores, leading to reactive UI updates. State persistence for connection, device identification, macro library, and travel profiles is managed via localStorage.

### Service Layer

-   **KeyboardService.ts:** The primary hardware abstraction layer, handling device discovery, pairing via WebHID, auto-reconnection, wrapping SparkLink SDK APIs, and connection lifecycle management.
-   **DebugKeyboardService.ts:** An isolated service for development and testing, providing SDK access without affecting the main application state.

### Key Technical Decisions

1.  **WebHID over Native Drivers:** Chosen for cross-platform compatibility, no installation, and browser security, despite limitations to Chromium browsers and requiring HTTPS.
2.  **Batch Processing for SDK Calls:** Implemented to prevent hardware overload when sending numerous updates (e.g., 100+ key updates).
3.  **Dual Service Pattern:** Separates `KeyboardService` and `DebugKeyboardService` to allow raw data inspection without disrupting user configurations.
4.  **Layout Configuration System:** Centralized `layoutConfigs.ts` manages absolute positioning data for pixel-perfect rendering of multiple keyboard layouts.
5.  **Type Safety with TypeScript:** Utilizes interfaces like `IDefKeyInfo` to ensure type consistency between physical keys and remapped values in SDK calls and UI presentation.

## External Dependencies

### Hardware Integration

-   **SparkLink SDK (@sparklinkplayjoy/sdk-keyboard v1.0.14):** Official SDK for hall effect keyboard communication, providing APIs for key remapping, macro management, travel distance configuration, sensor calibration, RGB lighting control, and advanced features (DKS, MPT, SOCD, Rapid Trigger). Requires a USB HID device with specific VendorID, ProductID, UsagePage, and Usage.
-   **WebHID API (Browser Native):** Browser API for USB HID device communication, requiring Chromium-based browsers (Chrome/Edge) and an HTTPS connection (localhost exempt), with an explicit user permission model for device pairing.

### Build Tools & Development

-   **Vite (v7.1.6):** Build tool and dev server with HMR, path aliases, SCSS preprocessing, and production build capabilities.
-   **TypeScript (v5.9.2):** Provides type safety and IDE support with strict mode enabled and path mapping.

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

### Development Server Configuration

Configured to host on `0.0.0.0` at port `5000` with HMR over WSS on port `443`, optimized for cloud environments like Replit.