# Connect Page Documentation

## Overview
The Connect page is the entry point for establishing a connection between the web application and a compatible hall effect keyboard via WebHID. It provides a simple, visually appealing interface with a decorative circuit board background and a single connection button.

## Purpose
- Initiate WebHID device pairing with compatible SparkLink keyboards
- Display connection status to the user
- Provide a welcoming visual experience with branded graphics

## Key Features
- **WebHID Connection**: Triggers the browser's device selection dialog
- **Auto-Connect**: Automatically attempts to reconnect to previously paired devices on app startup
- **Connection State Display**: Button text changes based on connection status
- **Visual Design**: Features a large circuit board SVG background for brand identity

## User Interface Elements

### Main Button
- **Text States**:
  - "Connect Keyboard" - Default state, ready to connect
  - "Connecting..." - Active connection attempt in progress
  - "Connected" - Device successfully connected
- **Disabled States**: Button is disabled during connection or when already connected
- **Visual Feedback**: Button appears semi-transparent when disabled

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
- Monitors:
  - `isConnecting`: Boolean indicating active connection attempt
  - `isConnected`: Boolean indicating successful connection
  - `deviceInfo`: Object containing device metadata (BoardID, version, etc.)

### Connection Flow
1. User clicks "Connect Keyboard" button
2. `connectDevice()` method calls `connectionStore.connectDevice()`
3. Connection store triggers WebHID device selection dialog
4. On selection, attempts to initialize the keyboard via SparkLink SDK
5. If successful:
   - Stores device identifiers for auto-reconnect
   - Updates connection state
   - Enables navigation to other pages
6. If failed:
   - Shows error (handled by store)
   - Returns to default state

## Dependencies

### Services
- **ConnectionStore** (`@/store/connection`): Manages connection lifecycle

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
Connection Store Updates (isConnected = true)
    ↓
deviceInfo Populated
    ↓
App Navigation Enabled
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
