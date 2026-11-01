# Connect Page Documentation

## Overview
The Connect page is the entry point for establishing a connection between the web application and a compatible hall effect keyboard via WebHID. It provides a simple, visually appealing interface with a decorative circuit board background and a single connection button.

## Purpose
- Initiate WebHID device pairing with compatible SparkLink keyboards
- Show connection state through the button (status text and device details are displayed in the App.vue sidebar, not on this page)
- Provide a welcoming visual experience with branded graphics

## Key Features
- **WebHID Connection**: Triggers the browser's device selection dialog
- **Auto-Connect**: Automatically attempts to reconnect to previously paired devices on app startup
  - Known limitation: WebHID exposes no usable serialNumber on Chromium/Windows, so auto-reconnect matches vendorId+productId only — with two same-model boards it may open the wrong one. Manual connect via the browser picker is unaffected.
- **Connection State Feedback**: The button label binding switches between "Connect Keyboard" / "Connecting..." / "Connected"; in the two disabled states the label is hidden (disabled style sets `font-size: 0`), so only the default label is ever visible
- **Visual Design**: Features a circuit board SVG background for brand identity
- **Responsive Layout**: Background and button adapt to any window size without letterboxing or scrollbars

## User Interface Elements

### Main Button
- **Text States**:
  - "Connect Keyboard" - Default state, ready to connect
  - "Connecting..." - Active connection attempt in progress
  - "Connected" - Device successfully connected
- **Disabled States**: Button is disabled during connection or when already connected
- **Visual Feedback**: When disabled the button becomes a transparent, border-only outline (`background-color: transparent` + `font-size: 0`); the "Connecting..." and "Connected" labels are bound but never rendered visibly
- **Positioning**: Anchored to the content area (not the artwork), so it stays a consistent distance from the sidebar at any window size. Size, padding, and font scale with the content area and are capped with `clamp()` so it stays usable on small windows and doesn't grow oversized in fullscreen

### Background
- Decorative SVG graphic (`connect.svg`, 1024×640 viewBox) showing an electrical circuit design
- Reinforces the electronic/technical nature of the keyboard driver
- Fills the content area beside the sidebar using cover-style scaling: keeps its 16:10 aspect ratio, scales to the larger of the container's width or height, and crops the overflow instead of letterboxing
- Sized from its container (CSS container query units), not the viewport, so it never sits under the sidebar or causes scrollbars

## Technical Implementation

### Component Structure
```vue
<template>
  <div class="viewport">          <!-- Fills .main-content; size container -->
    <div class="stage" />         <!-- Background SVG, cover-scaled -->
    <div class="connect-page">    <!-- Button, pinned to content area -->
      <button @click="connectDevice">...</button>
    </div>
  </div>
</template>
```

- `.viewport`: `position: absolute; inset: 0; overflow: hidden; container-type: size`
- `.stage`: centered with `transform: translate(-50%, -50%)`, `width: max(100cqw, 100cqh × 1024/640)`, `aspect-ratio: 1024 / 640`, background at `100% 100%`
- `.connect-page`: absolute within `.viewport`, `z-index: 1`, position and sizes use `clamp()` with `cqw` / `cqh`
- SVG dimensions are stored as SCSS variables (`$art-w: 1024`, `$art-h: 640`); update them if the artwork's viewBox changes

### State Management
- Uses Pinia's `useConnectionStore()`
- Renders from:
  - `isConnecting` / `isConnected`: drive the button label and `:disabled` state
  - `deviceInfo`: feeds a `deviceInfoText` computed (BoardID + appVersion) returned from `setup()` but never rendered on this page — the App.vue sidebar shows device details instead

### Connection Flow
1. User clicks "Connect Keyboard" button
2. `connectDevice()` method calls `connectionStore.connectDevice()`
3. The store calls `KeyboardService.requestDevice()`: unfiltered WebHID picker (`filters: []`), opens the chosen device, saves its stable ID to `localStorage.pairedStableId`, initializes the SDK keyboard
4. The store fetches `getBaseInfo()` and merges it into `deviceInfo`
5. If successful:
   - `isConnected = true`; status text updated (shown in the sidebar)
   - Active hardware profile synced via `profileStore.syncActiveProfileFromHardware()`
   - The user stays on the Connect page — sidebar navigation is always available and never gated by connection state
6. If failed:
   - The store catches the thrown Error and sets a `status` string (displayed in the App.vue sidebar; nothing renders on this page)
   - `finally` resets `isConnecting`; the button returns to the enabled default state

## Dependencies

### Services
- **ConnectionStore** (`@/store/connection`): manages connection lifecycle (isConnecting/isConnected/status/deviceInfo)
- **KeyboardService** (`@/services/KeyboardService`): singleton the store calls — `requestDevice()`, `getBaseInfo()`, `autoConnect()`

### External APIs
- **WebHID**: Browser API for USB HID device communication
- **SparkLink SDK** (`@sparklinkplayjoy/sdk-keyboard`): Keyboard communication protocol

### Layout (App.vue)
- `.main-content` must have `position: relative`, `min-width: 0`, and a defined height (inherited from `.app-container`'s `100vh`) — the page sizes itself against this box

## Data Flow

```
User Click
    ↓
connectDevice()
    ↓
connectionStore.connectDevice()
    ↓
Browser WebHID Dialog
    ↓
User Selects Device
    ↓
SparkLink SDK Initialize
    ↓
Connection Store Updates (isConnected = true, status set)
    ↓
deviceInfo Populated (rendered in the App.vue sidebar, not on this page)
    ↓
Profile Synced (profileStore.syncActiveProfileFromHardware)
```

## User Workflow

### First-Time Connection
1. User opens the application
2. Automatically routed to Connect page
3. Sees decorative circuit board background
4. Clicks "Connect Keyboard"
5. Browser shows available USB HID devices
6. User selects their keyboard
7. Connection established
8. Uses the sidebar (always visible) to reach feature pages — navigation is never gated on connection state

### Subsequent Sessions
1. On app startup the KeyboardService constructor schedules a deferred auto-reconnect: reads `localStorage.pairedStableId`, retries up to 3 times (1s apart) to match an already-permitted WebHID device
2. If successful, the store's `onAutoConnectSuccess` sets deviceInfo/status; the user lands on the Connect page already connected — no automatic page navigation exists anywhere in the app
3. If failed (device unplugged, etc.), the Connect button remains available for a manual connection

## Error Handling
- Connection failures are caught by the connection store (`requestDevice()` throws; the store converts the error to a `status` string)
- `finally` resets `isConnecting`, so the button returns to the enabled "Connect Keyboard" state and can be retried immediately
- No error messages render on this page; the store's `status` string is displayed in the App.vue sidebar

## Accessibility Notes
- Button provides a clear label ("Connect Keyboard") and a visible outline when disabled; its text feedback is hidden in disabled states (`font-size: 0`)
- Disabled state prevents multiple simultaneous connection attempts
- Button text has a minimum size (`clamp()` floor of 0.8rem) so it stays readable on small windows
- High contrast design for visibility

## Styling Highlights
- Circuit board background SVG creates immersive tech aesthetic
- Responsive layout: background covers the content area at any window size with no letterboxing or scrollbars; edges crop on extreme aspect ratios
- Button stays beside the sidebar and scales within fixed min/max bounds
- Uses SCSS variables for consistent theming
- No media queries; responsiveness comes from container query units (`cqw` / `cqh`) and `clamp()`

## Future Enhancements (Potential)
- Display device info after connection (currently computed but not shown)
- Connection troubleshooting tips
- Multiple device support
- Visual connection status indicators beyond button text

## Developer Notes
- This is intentionally kept simple - connection complexity is abstracted to the store
- The page has no onMounted hook; auto-reconnect happens at app startup inside the KeyboardService constructor (deferred to document load +100ms), independent of this page
- SVG background file must be present in `@/assets/connect.svg`
- If `connect.svg` is replaced, update `$art-w` / `$art-h` to the new viewBox or the art will letterbox
- `scrollbar-gutter` was removed from App.vue's `.main-content`; it reserved empty strips that showed as black bars beside the background
- Button styling changes completely when disabled (`font-size: 0`)
- Type-check with `npx vue-tsc --noEmit` (plain `tsc` cannot read `.vue` files)