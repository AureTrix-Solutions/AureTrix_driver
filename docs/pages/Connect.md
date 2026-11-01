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
- **Connection State Feedback**: The button label binding switches between "Connect Keyboard" / "Connecting..." / "Connected"; in the two disabled states the label is hidden (disabled style sets font-size: 0%), so only the default label is ever visible
- **Visual Design**: Features a large circuit board SVG background for brand identity

## User Interface Elements

### Main Button
- **Text States**:
  - "Connect Keyboard" - Default state, ready to connect
  - "Connecting..." - Active connection attempt in progress
  - "Connected" - Device successfully connected
- **Disabled States**: Button is disabled during connection or when already connected
- **Visual Feedback**: When disabled the button becomes a transparent, border-only outline (background-color: transparent + font-size: 0%); the "Connecting..." and "Connected" labels are bound but never rendered visibly

### Background
- Large decorative SVG graphic (`connect.svg`) showing electrical circuit design
- Reinforces the electronic/technical nature of the keyboard driver
- Positioned absolutely to fill the page

## Technical Implementation

### Component Structure
```vue
<template>
  <div class="page-wrapper"></div>  <!-- Background SVG -->
  <div class="connect-page">
    <button @click="connectDevice">...</button>
  </div>
</template>
```

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
8. Can navigate to feature pages

### Subsequent Sessions
1. App attempts auto-connect using saved device ID
2. If successful, user can skip Connect page
3. If failed (device unplugged, etc.), returns to Connect page

## Error Handling
- Connection failures are handled by the connection store
- User sees button return to "Connect Keyboard" state
- Can retry connection immediately
- No error messages displayed on this page (handled globally)

## Accessibility Notes
- Button provides clear visual and text feedback
- Disabled state prevents multiple simultaneous connection attempts
- High contrast design for visibility

## Styling Highlights
- Circuit board background SVG creates immersive tech aesthetic
- Button positioned to align with the visual design
- Uses SCSS variables for consistent theming
- Responsive layout adapts to different screen sizes

## Future Enhancements (Potential)
- Display device info after connection (currently computed but not shown)
- Connection troubleshooting tips
- Multiple device support
- Visual connection status indicators beyond button text

## Developer Notes
- This is intentionally kept simple - connection complexity is abstracted to the store
- Page auto-loads on mount (no manual initialization needed)
- SVG background file must be present in `@/assets/connect.svg`
- Button styling changes completely when disabled (font-size: 0%)
