# AureTrix Keyboard Driver

## Overview

AureTrix is a web-based configuration tool for hall effect keyboards compatible with the SparkLink SDK. Built with Vue.js 3, TypeScript, and Vite, it provides a professional interface for customizing keyboard behavior including key remapping, macro creation, lighting control, and advanced hall effect features like dynamic keystroke (DKS), magnetic point triggering (MPT), and rapid trigger.

The application runs entirely in the browser and communicates with compatible keyboards via the WebHID API, eliminating the need for native drivers or installations.

**Key capabilities:**
- Multi-layer key remapping (4 independent layers: Fn0-Fn3)
- Visual macro recording without OS interference
- Per-key RGB lighting and logo lighting control
- Hall effect sensor calibration and travel distance adjustment
- Profile management with import/export functionality
- Real-time debugging interface for raw SDK data inspection

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**November 19, 2025 - Custom RGB Mode (Mode 21) Implementation**
- Implemented full per-key custom RGB lighting control (mode 21)
- Added reactive Map data structure for storing per-key custom colors using `reactive(new Map())`
- Created RGB↔hex conversion utilities (rgbToHex, hexToRgb) for color handling
- Smart color picker logic: displays white for no selection, individual color for single key, majority/first color for multiple selections
- Dual real-time feedback system: throttled SDK calls update physical keyboard + instant virtual keyboard color changes
- Enhanced page load initialization to fetch all custom colors via getCustomLighting when mode is 21
- Color picker visible for both Static (mode 0) and Custom (mode 21) modes with mode-specific handlers
- Implemented `getKeyStyleWithCustomColor` wrapper to apply custom background colors to virtual keyboard keys
- Watcher synchronizes color picker display with selection changes in Custom mode
- Proper 100ms throttling for both applyCustomColor and applyStaticColor handlers

**November 19, 2025 - Real-Time Color Picker with Throttling**
- Implemented real-time color preview for Static mode lighting
- Added throttle utility function (100ms) to rate-limit SDK calls during color picker drag
- Color picker uses `@input` event for throttled real-time updates while dragging
- Maintains `@change` event for final confirmation when user releases color picker
- Event-driven approach - no continuous polling, only fires when actively interacting with color selector
- Provides smooth visual feedback without overwhelming keyboard hardware

**November 19, 2025 - RGB Settings Layout Reorganization**
- Moved Lighting Mode dropdown from separate "Mode Selection" section into RGB Settings
- Restructured RGB Settings to 3-column top row (Brightness, Speed, Lighting Mode)
- Second row remains 2-column layout (Sleep, Reverse)
- Static color picker stays with Lighting Mode dropdown
- Completely removed "Mode Selection" section with full cleanup

**November 19, 2025 - Super Response Checkbox Integration**
- Added Super Response checkbox control to Debug Console section
- Checkbox initializes from keyboard state during `initLightingFromDevice()`
- `applySuperResponse()` handler follows standard pattern: fetch state, update field, call setLighting
- Proper disable logic during initialization and when lighting is off
- Console logging for state changes ("Super Response enabled/disabled")
- Styling matches existing UI with accent color and disabled state support

**November 18, 2025 - Debug Page Initialization Enhancement**
- Added automatic UI synchronization on page load in Debug.vue
- `initLightingFromDevice()` function fetches keyboard state via `getLighting()` on mount
- Master controls (toggle, luminance, speed, sleep timer) now reflect actual keyboard settings instead of defaults
- Added `initializing` ref to track sync state with "SYNCING..." UI feedback
- Disabled all master controls during initialization to prevent race conditions
- Graceful error handling when device not connected (falls back to defaults)
- CSS styling added for disabled toggle state (pointer-events: none, opacity 0.5)

## Documentation

### Page Documentation
Comprehensive markdown documentation for all functional pages is available in the `docs/` directory:

- **Master Index**: `docs/PAGES_OVERVIEW.md` - Overview of all pages with quick reference
- **Individual Page Docs**: `docs/pages/` - Detailed documentation for each page:
  - `Connect.md` - Device pairing and connection management
  - `KeyMapping.md` - Multi-layer key remapping with drag-and-drop
  - `MacroRecording.md` - Visual macro creation and management
  - `Performance.md` - Travel distance adjustment and performance tuning
  - `Calibration.md` - Hall effect sensor calibration
  - `Debug.md` - Developer tool for inspecting raw keyboard data
  - `LayoutPreview.md` - Keyboard layout geometry visualization

Each page document includes:
- Overview and purpose
- Key features list
- User interface elements description
- Technical implementation details
- Data flow diagrams
- User workflows and examples
- Dependencies and integrations
- Error handling approaches
- Known limitations
- Future enhancement ideas

### Functional vs Placeholder Pages
**Fully Functional (8 pages)**:
- Connect, KeyMapping, MacroRecording, Performance, Calibration, Debug, LayoutPreview, RapidTrigger

**Placeholder Pages (3 pages)**:
- Lighting, Profiles, AdvancedConfig (planned features)

### SDK Documentation
Complete API reference for the SparkLink SDK is available:

- **SDK Reference**: `docs/SDK_REFERENCE.md` - Comprehensive API documentation for @sparklinkplayjoy/sdk-keyboard
  - Installation and setup instructions
  - Connection management and device pairing patterns
  - Complete API coverage: remapping, macros, travel, calibration, lighting, axis
  - Real-world code examples from AureTrix implementation
  - Error handling patterns and retry strategies
  - Best practices for batch processing and state management
  - Quick reference tables for all SDK methods

The SDK documentation includes practical examples for:
- WebHID device connection and auto-reconnect
- Multi-layer key remapping with batch processing
- Macro creation (up to 64 actions)
- Hall effect travel distance configuration (global and per-key)
- Sensor calibration workflows
- Lighting control and axis configuration

## System Architecture

### Frontend Architecture

**Framework:** Vue.js 3 with Composition API and TypeScript

The application follows a component-based SPA (Single Page Application) architecture with the following structure:

- **Pages:** Route-level components organized by feature (`/src/pages/`)
  - Connect.vue - Device pairing interface
  - KeyMapping.vue - Multi-layer key remapping
  - MacroRecording.vue - Visual macro builder
  - Performance.vue - Travel distance configuration
  - Calibration.vue - Hall effect sensor calibration
  - Lighting.vue - RGB lighting control
  - AdvancedConfig.vue - DKS, MPT, SOCD settings
  - Debug.vue - Raw SDK data inspection
  - Profiles.vue - Configuration profile management
  - RapidTrigger.vue - Rapid trigger settings
  - LayoutPreview.vue - Physical layout visualization

- **Routing:** Vue Router with lazy-loaded routes for code-splitting
- **State Management:** Pinia stores with persistence via `pinia-plugin-persistedstate`
  - `connection.ts` - Device connection state and info
  - `travelProfilesStore.ts` - Switch profile presets
- **Styling:** SCSS with global variables (`/src/styles/variables.scss`), no CSS framework dependency

**Key Design Patterns:**

1. **Composables:** Reusable logic extracted into composition functions
   - `useBatchProcessing.ts` - Handles batched SDK calls to prevent hardware overload (80 keys per batch with 100ms throttle)
   - `useMappedKeyboard.ts` - Manages keyboard layout rendering with remapped labels

2. **Layout System:** Dynamic keyboard rendering based on physical layouts
   - Supports 61, 67, 68, 80, 82, 84, 87-key layouts
   - Position calculations in `layoutConfigs.ts` using absolute pixel positioning
   - Conversion factor: 4px per millimeter for accurate key sizing

3. **Batch Processing Pattern:** Critical for preventing SDK command flooding
   - Used in key remapping, travel distance updates, and calibration
   - Configurable batch size (default 80 keys)
   - Inter-batch delay prevents device overwhelm

### Data Flow Architecture

**Keyboard Communication Flow:**
1. User action in Vue component
2. Component calls KeyboardService method
3. KeyboardService wraps SparkLink SDK calls
4. SDK communicates with keyboard via WebHID
5. Response updates Pinia store
6. Reactive UI updates automatically

**State Persistence:**
- Connection state persisted to localStorage for auto-reconnect
- Device identification using stable IDs
- Macro library stored in localStorage
- Travel profiles persisted across sessions

### Service Layer

**KeyboardService.ts** - Primary hardware abstraction layer

Responsibilities:
- Device discovery and pairing via WebHID
- Auto-reconnection to previously paired devices
- Wraps all SparkLink SDK keyboard APIs
- Connection lifecycle management (connect/disconnect event handlers)
- Device information retrieval (BoardID, firmware version)

**DebugKeyboardService.ts** - Development/testing service

Provides isolated SDK access for debugging without affecting main service state.

**Key Technical Decisions:**

1. **WebHID over Native Drivers**
   - Pros: Cross-platform, no installation, browser security model
   - Cons: Requires HTTPS, limited to Chromium browsers
   - Rationale: Eliminates driver installation friction, simplifies deployment

2. **Batch Processing for SDK Calls**
   - Problem: Sending 100+ key updates simultaneously can overwhelm hardware
   - Solution: Process in batches of 80 keys with 100ms delays
   - Alternative considered: Sequential processing (too slow for UX)

3. **Dual Service Pattern (KeyboardService + DebugKeyboardService)**
   - Problem: Debug operations interfering with production state
   - Solution: Isolated debug service with independent SDK instance
   - Enables raw data inspection without disrupting user configuration

4. **Layout Configuration System**
   - Problem: Supporting 7+ different physical keyboard layouts
   - Solution: Centralized `layoutConfigs.ts` with absolute positioning data
   - Provides pixel-perfect key rendering for any layout size

5. **Type Safety with TypeScript**
   - `IDefKeyInfo` interface bridges physical keys and remapped values
   - `physicalKeyValue` - Actual hardware key ID for SDK calls
   - `keyValue` - Display/remapped value for UI presentation
   - Prevents SDK call mismatches when keys are remapped

## External Dependencies

### Hardware Integration

**SparkLink SDK (@sparklinkplayjoy/sdk-keyboard v1.0.14)**
- Official SDK for hall effect keyboard communication
- Provides APIs for:
  - Key remapping across 4 layers
  - Macro management (up to 64 actions per macro)
  - Travel distance configuration (global and per-key modes)
  - Hall effect sensor calibration
  - RGB lighting control (per-key and logo)
  - Advanced features: DKS, MPT, SOCD, Rapid Trigger
  - Profile import/export (encrypted JSON)
- Hardware requirements: USB HID device with VendorID 7331, ProductID 1793, UsagePage 65440, Usage 1

**WebHID API (Browser Native)**
- Browser API for USB HID device communication
- Required browser: Chrome/Edge (Chromium-based)
- Security requirement: HTTPS connection (localhost exempt)
- User permission model: Explicit device pairing

### Build Tools & Development

- **Vite (v7.1.6):** Build tool and dev server
  - HMR with WebSocket protocol over WSS
  - Path aliases for cleaner imports (`@/`, `@components/`, `@services/`, etc.)
  - SCSS preprocessing
  - Production build with sourcemaps

- **TypeScript (v5.9.2):** Type safety and IDE support
  - Strict mode enabled
  - Path mapping matches Vite aliases

### Runtime Dependencies

- **Vue 3 (v3.5.21):** Reactive UI framework
- **Vue Router (v4.5.1):** Client-side routing with lazy loading
- **Pinia (v3.0.3):** State management
- **pinia-plugin-persistedstate (v4.5.0):** localStorage persistence for stores

### Testing

- **Vitest (v3.2.4):** Unit test runner (Vite-native)
- **@vue/test-utils (v2.4.6):** Vue component testing utilities

### Package Management

- **pnpm (v10.17.0):** Fast, disk-efficient package manager
- Lockfile version 3

### Development Server Configuration

- Host: `0.0.0.0` (allows network access)
- Port: 5000 (strict)
- HMR: WebSocket Secure (WSS) over port 443
- Designed for deployment on Replit or similar cloud environments