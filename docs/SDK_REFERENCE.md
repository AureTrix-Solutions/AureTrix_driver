# SparkLink SDK Keyboard - API Reference

## Overview

The `@sparklinkplayjoy/sdk-keyboard` package (v1.0.14) is the official SDK for communicating with SparkLink hall effect keyboards via WebHID. This document provides comprehensive API documentation with real-world examples extracted from the AureTrix keyboard driver implementation.

**Package**: `@sparklinkplayjoy/sdk-keyboard`  
**Version**: 1.0.14  
**Protocol**: WebHID  
**Hardware Requirements**:
- VendorID: 7331
- ProductID: 1793
- UsagePage: 65440
- Usage: 1

---

## ⚠️ Important Notes

### String Return Types and Type Conversions

**Critical:** Several SDK methods return **string values** instead of numbers, requiring explicit type conversion in your application code. Failure to convert these values will cause type-related bugs and incorrect comparisons.

**Methods That Return Strings:**
- `getSingleTravel(key)` - Returns `"2.05"` not `2.05`
- `setSingleTravel(key, value)` - Returns `"1.50"` not `1.50`
- `setRtPressTravel(key, value)` - Returns string confirmation value
- `setRtReleaseTravel(key, value)` - Returns string confirmation value

**Always Use Number() Conversion:**
```typescript
// ❌ WRONG - Will cause bugs
const travel = await keyboard.getSingleTravel(keyId);
if (travel > 2.0) { } // String comparison fails!

// ✅ CORRECT - Explicit conversion
const travel = await keyboard.getSingleTravel(keyId);
const travelNum = Number(travel); // Convert string to number
if (travelNum > 2.0) { } // Numeric comparison works correctly
```

**Best Practice Pattern from AureTrix:**
```typescript
const result = await keyboard.getSingleTravel(keyId);
if (!(result instanceof Error)) {
  const travelValue = Number(result); // Always convert
  if (!isNaN(travelValue) && travelValue >= 0.1 && travelValue <= 4.0) {
    // Use validated numeric value
    myState.value = Number(travelValue.toFixed(2));
  }
}
```

### Dual-Purpose Methods

**setSingleTravel()** works for **two different performance modes:**
1. **Single Mode**: Sets the travel distance for keys in single performance mode
2. **RT Mode**: Sets the initial trigger travel for keys in Rapid Trigger (RT) mode

When a key is set to RT mode, `setSingleTravel()` configures its initial actuation point, while RT-specific methods (`setRtPressTravel`, `setRtReleaseTravel`) control the dynamic trigger behavior.

---

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Initialization](#initialization)
3. [Connection Management](#connection-management)
4. [Device Information](#device-information)
5. [Keyboard Layout](#keyboard-layout)
6. [Key Remapping](#key-remapping)
7. [Macro Management](#macro-management)
8. [Travel Distance Configuration](#travel-distance-configuration)
9. [Performance Modes](#performance-modes)
10. [Calibration](#calibration)
11. [Axis Configuration](#axis-configuration)
12. [Lighting Control](#lighting-control)
13. [Configuration Management](#configuration-management)
14. [Error Handling](#error-handling)
15. [Best Practices](#best-practices)
16. [API Quick Reference](#api-quick-reference)

---

## Installation & Setup

### Installation

```bash
npm install @sparklinkplayjoy/sdk-keyboard
# or
pnpm add @sparklinkplayjoy/sdk-keyboard
```

### Import

```typescript
import XDKeyboard from '@sparklinkplayjoy/sdk-keyboard';
import type { DeviceInit, Device } from '@sparklinkplayjoy/sdk-keyboard';
```

### Browser Requirements

- **Chromium-based browsers**: Chrome, Edge, Opera (version 89+)
- **WebHID API**: Must be enabled (default in modern browsers)
- **HTTPS**: Required in production (localhost exempt for development)
- **User Gesture**: Device pairing must be triggered by user interaction

---

## Initialization

### Constructor

Creates a new SDK instance with hardware configuration.

```typescript
const keyboard = new XDKeyboard({
  usage: 1,
  usagePage: 65440
});
```

**Parameters:**
- `config.usage` (number): HID usage value (always 1 for SparkLink keyboards)
- `config.usagePage` (number): HID usage page (always 65440 for SparkLink keyboards)

**Example from AureTrix:**

```typescript
class KeyboardService {
  private keyboard: XDKeyboard;
  
  constructor() {
    this.keyboard = new XDKeyboard({
      usage: 1,
      usagePage: 65440,
    });
    
    // Setup WebHID event listeners
    if ('hid' in navigator) {
      navigator.hid.addEventListener('connect', this.handleConnect);
      navigator.hid.addEventListener('disconnect', this.handleDisconnect);
    }
  }
}
```

---

## Connection Management

### getDevices()

Retrieves all connected SparkLink-compatible HID devices.

```typescript
async getDevices(): Promise<Device[]>
```

**Returns:** Array of `Device` objects

**Example:**

```typescript
const devices = await keyboard.getDevices();
console.log('Available devices:', devices);
// Output: [{ id: '...', data: HIDDevice, productName: 'XD75' }]
```

### init()

Initializes connection to a specific keyboard device.

```typescript
async init(deviceId: string): Promise<Device>
```

**Parameters:**
- `deviceId` (string): Unique device identifier

**Returns:** Initialized `Device` object

**Throws:** Error if initialization fails

**Example:**

```typescript
const device = await keyboard.init('device-id-12345');
console.log('Initialized device:', device);
```

### reconnection()

Reconnects to a previously paired device using saved data.

```typescript
async reconnection(deviceData: HIDDevice, deviceId: string): Promise<void>
```

**Parameters:**
- `deviceData` (HIDDevice): Previously stored HID device data
- `deviceId` (string): Device identifier

**Example (Auto-Reconnect Pattern):**

```typescript
async reconnect(stableId: string): Promise<void | Error> {
  try {
    const savedDeviceData = localStorage.getItem(`pairedDeviceData_${stableId}`);
    if (!savedDeviceData) {
      throw new Error('No saved device data for reconnection');
    }
    
    const device = JSON.parse(savedDeviceData) as Device;
    await this.keyboard.reconnection(device.data, device.id);
    this.connectedDevice = device;
    
    console.log('Reconnected successfully');
  } catch (error) {
    console.error('Failed to reconnect:', error);
    return error as Error;
  }
}
```

### WebHID Device Pairing Pattern

```typescript
async requestDevice(): Promise<Device> {
  // Request device from user
  const devices = await navigator.hid.requestDevice({ filters: [] });
  if (devices.length === 0) {
    throw new Error('No device selected');
  }
  
  const hidDevice = devices[0];
  
  // Open device if not already open
  if (!hidDevice.opened) {
    await hidDevice.open();
  }
  
  // Get SDK devices and find match
  const sdkDevices = await keyboard.getDevices();
  const matchedDevice = sdkDevices.find(
    d => d.data.vendorId === hidDevice.vendorId && 
         d.data.productId === hidDevice.productId
  );
  
  const device = matchedDevice || {
    id: hidDevice.id || `${hidDevice.vendorId}-${hidDevice.productId}`,
    data: hidDevice,
    productName: hidDevice.productName || 'Unknown'
  };
  
  // Initialize the device
  await keyboard.init(device.id);
  
  // Save for auto-reconnect
  localStorage.setItem('pairedDeviceData', JSON.stringify(device));
  
  return device;
}
```

---

## Device Information

### getBaseInfo()

Retrieves keyboard hardware and firmware information.

```typescript
async getBaseInfo(): Promise<BaseInfo>
```

**Returns:** Object containing device information

**Response Format:**

```typescript
{
  boardId: number,        // Hardware board identifier
  version: string,        // Firmware version (e.g., "1.2.3")
  layoutType: number,     // Keyboard layout identifier
  // ... additional hardware-specific fields
}
```

**Example:**

```typescript
const baseInfo = await keyboard.getBaseInfo();
console.log('Board ID:', baseInfo.boardId);
console.log('Firmware Version:', baseInfo.version);
```

**Retry Pattern (Recommended):**

```typescript
async getBaseInfo(): Promise<any | Error> {
  const maxAttempts = 3;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const baseInfo = await keyboard.getBaseInfo();
      if (baseInfo instanceof Error) throw baseInfo;
      return baseInfo;
    } catch (error) {
      console.warn(`getBaseInfo attempt ${attempts + 1} failed:`, error);
      if (attempts === maxAttempts - 1) {
        return error as Error;
      }
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  return new Error('Failed to fetch base info: max retries exceeded');
}
```

---

## Keyboard Layout

### defKey()

Retrieves the physical keyboard layout definition.

```typescript
async defKey(): Promise<IDefKeyInfo[][]>
```

**Returns:** 2D array representing keyboard layout (rows × columns)

**Response Format:**

```typescript
[
  [
    {
      keyValue: 41,           // HID key code
      physicalKeyValue: 41,   // Physical position key code
      location: {
        row: 0,               // Row index (0-5)
        col: 0                // Column index (0-20)
      },
      keyWidth: 50,           // Key width in pixels
      keyHeight: 50,          // Key height in pixels
      // ... additional properties
    },
    // ... more keys in row
  ],
  // ... more rows
]
```

**Example:**

```typescript
const layout = await keyboard.defKey();
console.log('Total keys:', layout.flat().length);
console.log('Number of rows:', layout.length);

// Find specific key (e.g., Escape key, HID code 41)
const escKey = layout.flat().find(key => key.keyValue === 41);
console.log('Escape key location:', escKey.location);
```

### getLayoutKeyInfo()

Retrieves remapped key values for specific keys and layers.

```typescript
async getLayoutKeyInfo(
  params: { key: number; layout: number }[]
): Promise<IDefKeyInfo[]>
```

**Parameters:**
- `params` (array): Array of key/layer queries
  - `key` (number): Physical key value
  - `layout` (number): Layer index (0-3 for Fn0-Fn3)

**Returns:** Array of key info objects with current mappings

**Response Format:**

```typescript
[
  {
    key: 4,        // Physical key queried
    value: 7,      // Current remapped value
    layout: 1      // Layer queried (Fn1)
  },
  // ... more keys
]
```

**Example (Fetch Remappings for Entire Layer):**

```typescript
// Get all keys from base layout
const baseLayout = await keyboard.defKey();
const allKeys = baseLayout.flat();

// Query layer 1 (Fn1) mappings for all keys
const params = allKeys.map(keyInfo => ({
  key: keyInfo.physicalKeyValue,
  layout: 1  // Fn1 layer
}));

const remappedKeys = await keyboard.getLayoutKeyInfo(params);

// Build remapping map
const remapMap = {};
remappedKeys.forEach(item => {
  if (item.value !== 0) {  // 0 means no remap
    remapMap[item.key] = item.value;
  }
});

console.log('Remapped keys on Fn1:', remapMap);
```

**Batch Processing Pattern:**

```typescript
// Process in batches to avoid overwhelming hardware
const BATCH_SIZE = 80;

for (let i = 0; i < params.length; i += BATCH_SIZE) {
  const batch = params.slice(i, i + BATCH_SIZE);
  const results = await keyboard.getLayoutKeyInfo(batch);
  
  // Process results...
  
  // Delay between batches
  if (i + BATCH_SIZE < params.length) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
```

---

## Key Remapping

### setKey()

Remaps keys to different values across multiple layers.

```typescript
async setKey(
  keyConfigs: { key: number; layout: number; value: number }[]
): Promise<void>
```

**Parameters:**
- `keyConfigs` (array): Array of key remapping configurations
  - `key` (number): Physical key position to remap
  - `layout` (number): Layer index (0-3 for Fn0-Fn3)
  - `value` (number): New HID key code to assign

**Example (Single Key Remap):**

```typescript
// Remap 'A' key (HID code 4) to 'B' key (HID code 5) on Fn1 layer
await keyboard.setKey([
  { key: 4, layout: 1, value: 5 }
]);

// Must save and reload for changes to take effect
await keyboard.getApi({ type: 'ORDER_TYPE_SAVING_PARAMETER' });
await keyboard.getApi({ type: 'ORDER_TYPE_RELOAD_PARAMETERS' });
```

**Example (Bulk Remap with Batching):**

```typescript
// Remap multiple keys (e.g., WASD to arrow keys)
const remapConfigs = [
  { key: 26, layout: 0, value: 82 },  // W → Up Arrow
  { key: 4,  layout: 0, value: 80 },  // A → Left Arrow
  { key: 22, layout: 0, value: 81 },  // S → Down Arrow
  { key: 7,  layout: 0, value: 79 }   // D → Right Arrow
];

// Process in batches
const BATCH_SIZE = 80;
for (let i = 0; i < remapConfigs.length; i += BATCH_SIZE) {
  const batch = remapConfigs.slice(i, i + BATCH_SIZE);
  await keyboard.setKey(batch);
  
  // Delay between batches
  await new Promise(resolve => setTimeout(resolve, 100));
}

// Save and reload
await keyboard.getApi({ type: 'ORDER_TYPE_SAVING_PARAMETER' });
await keyboard.getApi({ type: 'ORDER_TYPE_RELOAD_PARAMETERS' });
```

**Reset Layer to Defaults:**

```typescript
// Reset all keys on Fn2 layer to their physical values
const baseLayout = await keyboard.defKey();
const resetConfigs = baseLayout.flat().map(key => ({
  key: key.keyValue,
  layout: 2,  // Fn2 layer
  value: key.keyValue  // Reset to self
}));

// Batch process
for (let i = 0; i < resetConfigs.length; i += 80) {
  const batch = resetConfigs.slice(i, i + 80);
  await keyboard.setKey(batch);
  await new Promise(resolve => setTimeout(resolve, 100));
}

await keyboard.getApi({ type: 'ORDER_TYPE_SAVING_PARAMETER' });
await keyboard.getApi({ type: 'ORDER_TYPE_RELOAD_PARAMETERS' });
```

---

## Macro Management

### getMacro()

Retrieves the macro assigned to a specific key.

```typescript
async getMacro(key: number): Promise<MacroData>
```

**Parameters:**
- `key` (number): Key value to query

**Returns:** Macro data object or null if no macro assigned

### setMacro()

Assigns a macro sequence to a key.

```typescript
async setMacro(
  param: { key: number },
  macros: MacroStep[]
): Promise<void>
```

**Parameters:**
- `param.key` (number): Key to assign macro to
- `macros` (array): Array of macro steps (max 64 actions)

**Macro Step Format:**

```typescript
{
  id: number,        // Step number (1-based)
  keyValue: number,  // HID key code
  status: 0 | 1,     // 0 = key up, 1 = key down
  delay: number      // Milliseconds after previous action
}
```

**Example (Simple Login Macro):**

```typescript
// Macro: Type "admin" then press Enter
const loginMacro = [
  // 'a' down
  { id: 1, keyValue: 4, status: 1, delay: 0 },
  // 'a' up
  { id: 2, keyValue: 4, status: 0, delay: 50 },
  // 'd' down
  { id: 3, keyValue: 7, status: 1, delay: 50 },
  // 'd' up
  { id: 4, keyValue: 7, status: 0, delay: 50 },
  // 'm' down
  { id: 5, keyValue: 16, status: 1, delay: 50 },
  // 'm' up
  { id: 6, keyValue: 16, status: 0, delay: 50 },
  // 'i' down
  { id: 7, keyValue: 12, status: 1, delay: 50 },
  // 'i' up
  { id: 8, keyValue: 12, status: 0, delay: 50 },
  // 'n' down
  { id: 9, keyValue: 17, status: 1, delay: 50 },
  // 'n' up
  { id: 10, keyValue: 17, status: 0, delay: 50 },
  // Enter down
  { id: 11, keyValue: 40, status: 1, delay: 100 },
  // Enter up
  { id: 12, keyValue: 40, status: 0, delay: 50 }
];

// Assign to F1 key (HID code 58)
await keyboard.setMacro({ key: 58 }, loginMacro);

// Save changes
await keyboard.getApi({ type: 'ORDER_TYPE_SAVING_PARAMETER' });
await keyboard.getApi({ type: 'ORDER_TYPE_RELOAD_PARAMETERS' });

// Wait for changes to apply
await new Promise(resolve => setTimeout(resolve, 1000));
```

**Macro Limitations:**
- Maximum 64 actions per macro
- First action should have `delay: 0`
- Delays in milliseconds (typical: 50ms between keypresses)
- Each keypress requires two actions (down and up)

---

## Travel Distance Configuration

Hall effect keyboards allow precise control over key actuation distances. The SDK supports multiple travel configuration modes.

### getGlobalTouchTravel()

Retrieves global travel settings (applies to all keys in global mode).

```typescript
async getGlobalTouchTravel(): Promise<{
  globalTouchTravel: number
}>
```

**Returns:**
- `globalTouchTravel` (number): Travel distance in millimeters

**Example:**

```typescript
const settings = await keyboard.getGlobalTouchTravel();
console.log('Global travel:', settings.globalTouchTravel, 'mm');
// Output: Global travel: 2.0 mm
```

### setDB()

Sets global travel distance with press/release deadzones.

```typescript
async setDB(param: {
  globalTouchTravel: number;
  pressDead: number;
  releaseDead: number;
}): Promise<{
  globalTouchTravel: number;
  pressDead: number;
  releaseDead: number;
}>
```

**Parameters:**
- `globalTouchTravel` (number): Actuation distance in mm (0.1 - 4.0)
- `pressDead` (number): Press deadzone in mm
- `releaseDead` (number): Release deadzone in mm

**Example:**

```typescript
const result = await keyboard.setDB({
  globalTouchTravel: 2.5,  // 2.5mm actuation
  pressDead: 0.1,          // 0.1mm press deadzone
  releaseDead: 0.2         // 0.2mm release deadzone
});

console.log('Updated travel:', result);
```

### getSingleTravel()

Retrieves per-key travel distance (only for keys in single mode).

```typescript
async getSingleTravel(
  key: number,
  decimal: number = 2
): Promise<string>
```

**Parameters:**
- `key` (number): Key value to query
- `decimal` (number, optional): Decimal precision (default: 2)

**Returns:** Travel distance in millimeters **as a string** (e.g., `"1.50"`, `"2.05"`)

**⚠️ Important:** This method returns a **string**, not a number. Always use `Number()` conversion for numeric operations.

**Example:**

```typescript
// Get travel for 'W' key (HID code 26)
const travelStr = await keyboard.getSingleTravel(26, 2);
const travel = Number(travelStr); // Convert string to number
console.log('W key travel:', travel, 'mm');
// Output: W key travel: 1.5 mm

// Full example with validation (from AureTrix)
const result = await keyboard.getSingleTravel(26);
if (!(result instanceof Error)) {
  const travelValue = Number(result);
  if (!isNaN(travelValue) && travelValue >= 0.1 && travelValue <= 4.0) {
    console.log('Valid travel:', travelValue.toFixed(2), 'mm');
  }
}
```

### setSingleTravel()

Sets per-key travel distance. **Works for both Single mode AND Rapid Trigger (RT) mode.**

```typescript
async setSingleTravel(
  key: number,
  value: number,
  decimal: number = 2
): Promise<string>
```

**Parameters:**
- `key` (number): Key to configure
- `value` (number): Travel distance in mm (0.1 - 4.0)
- `decimal` (number, optional): Decimal precision

**Returns:** Confirmed travel value **as a string** (e.g., `"1.50"`, `"2.00"`)

**⚠️ Important:** Like `getSingleTravel()`, this method returns a **string**. Convert with `Number()` if you need the numeric value for calculations.

**⚠️ Dual Purpose:** This method serves **two different purposes** depending on the key's performance mode:
1. **Single Mode**: Sets the travel distance for actuation
2. **RT Mode**: Sets the **initial trigger travel** (the first actuation point before rapid trigger takes over)

When a key is in RT mode, use `setSingleTravel()` for the initial trigger travel, and use `setRtPressTravel()` / `setRtReleaseTravel()` for the dynamic rapid trigger behavior.

**Example 1: Configure WASD for Gaming (Single Mode)**

```typescript
const gamingKeys = [26, 4, 22, 7];  // W, A, S, D
const fastTravel = 1.5;  // 1.5mm for quick actuation

for (const key of gamingKeys) {
  // Set to single mode first
  await keyboard.setPerformanceMode(key, 'single', 0);
  
  // Set travel distance
  await keyboard.setSingleTravel(key, fastTravel, 2);
}

console.log('WASD configured for fast actuation');
```

**Example 2: Configure Key for RT Mode (from AureTrix)**

```typescript
const key = 26;  // 'W' key

// Set to RT mode
await keyboard.setPerformanceMode(key, 'rt', 0);

// Set initial trigger travel using setSingleTravel()
await keyboard.setSingleTravel(key, 2.0);  // Initial actuation at 2.0mm

// Set RT-specific behavior
await keyboard.setRtPressTravel(key, 0.3);   // Re-trigger after 0.3mm press
await keyboard.setRtReleaseTravel(key, 0.3); // Reset after 0.3mm release
```

### getDpDr()

Gets press/release deadzones for a specific key.

```typescript
async getDpDr(key: number): Promise<{
  pressDead: number;
  releaseDead: number;
}>
```

**Parameters:**
- `key` (number): Key to query

**Returns:**
- `pressDead` (number): Press deadzone (top deadzone) in mm
- `releaseDead` (number): Release deadzone (bottom deadzone) in mm

**Important Note:** The SDK returns `pressDead` and `releaseDead` properties (not `dpThreshold` and `drThreshold`). Values may be returned as strings in some cases and should be explicitly converted to numbers.

**Example:**

```typescript
const deadzones = await keyboard.getDpDr(4);  // 'A' key
console.log('Press deadzone:', deadzones.pressDead);
console.log('Release deadzone:', deadzones.releaseDead);

// Real-world example from RapidTrigger.vue
const result = await KeyboardService.getDpDr(keyId);
const pressDead = Number(result.pressDead);    // Explicit conversion
const releaseDead = Number(result.releaseDead);
```

### setDp() / setDr()

Sets press or release deadzone for a key.

```typescript
async setDp(key: number, value: number): Promise<{ pressDead: number }>
async setDr(key: number, value: number): Promise<{ releaseDead: number }>
```

**Parameters:**
- `key` (number): Key to configure
- `value` (number): Deadzone in mm

**Example:**

```typescript
// Set larger deadzones to prevent accidental presses
await keyboard.setDp(57, 0.3);  // Space bar press deadzone
await keyboard.setDr(57, 0.3);  // Space bar release deadzone
```

### Advanced Travel APIs

#### getDksTravel() / setDksTravel()

Dynamic Keystroke (DKS) travel configuration.

```typescript
async getDksTravel(
  key: number,
  dksLayout: string = 'Layout_DB1'
): Promise<{ travel: number; dbs?: number[] }>

async setDksTravel(
  key: number,
  value: number,
  dksLayout: string = 'Layout_DB1'
): Promise<{ travel: number; dbs?: number[] }>
```

#### getDbTravel() / setDbTravel()

Deadband travel configuration.

```typescript
async getDbTravel(
  key: number,
  dbLayout: string = 'Layout_DB1'
): Promise<{ travel: number; dbs?: number[] }>

async setDbTravel(
  key: number,
  value: number,
  dbLayout: string = 'Layout_DB1'
): Promise<{ travel: number; dbs?: number[] }>
```

#### getRtTravel() / setRtPressTravel() / setRtReleaseTravel()

Rapid Trigger travel configuration for keys in RT performance mode.

```typescript
async getRtTravel(key: number): Promise<{
  pressTravel: number;
  releaseTravel: number;
}>

async setRtPressTravel(
  key: number,
  value: number
): Promise<string>

async setRtReleaseTravel(
  key: number,
  value: number
): Promise<string>
```

**Parameters:**
- `key` (number): Key to configure/query
- `value` (number): Travel distance in mm (typically 0.1 - 4.0)

**Returns:**
- `getRtTravel()`: Object with `pressTravel` (re-trigger distance) and `releaseTravel` (reset distance) as numbers
- `setRtPressTravel()`: Confirmed press travel value **as a string**
- `setRtReleaseTravel()`: Confirmed release travel value **as a string**

**⚠️ Important:** 
- `getRtTravel()` returns numeric values but may need `.toFixed()` then `Number()` conversion for consistent decimal precision
- `setRtPressTravel()` and `setRtReleaseTravel()` return **strings** - convert with `Number()` if needed for calculations

**Rapid Trigger Behavior:**
- **pressTravel**: How much the key must press down from the reset point to re-trigger
- **releaseTravel**: How much the key must release up from the trigger point to reset

**Example 1: Basic Configuration**

```typescript
// Configure rapid trigger for gaming keys
const rtConfig = await keyboard.getRtTravel(26);  // W key
console.log('Current RT:', rtConfig);
// Output: { pressTravel: 0.3, releaseTravel: 0.3 }

await keyboard.setRtPressTravel(26, 0.1);   // 0.1mm press
await keyboard.setRtReleaseTravel(26, 0.1); // 0.1mm release
```

**Example 2: Real-World Usage from AureTrix**

```typescript
// Fetch current RT values with proper conversion
const result = await keyboard.getRtTravel(keyId);
if (!(result instanceof Error)) {
  // Convert to consistent 2-decimal precision
  const pressTravel = Number(result.pressTravel.toFixed(2));
  const releaseTravel = Number(result.releaseTravel.toFixed(2));
  
  console.log(`RT Config: Press=${pressTravel}mm, Release=${releaseTravel}mm`);
  
  // Update UI state
  state.pressTravel = pressTravel;
  state.releaseTravel = releaseTravel;
}

// Set new RT values
await keyboard.setRtPressTravel(keyId, Number(newPressValue));
await keyboard.setRtReleaseTravel(keyId, Number(newReleaseValue));
```

**Example 3: Complete RT Setup**

```typescript
const key = 26;  // 'W' key

// Step 1: Set key to RT performance mode
await keyboard.setPerformanceMode(key, 'rt', 0);

// Step 2: Set initial trigger travel
await keyboard.setSingleTravel(key, 2.0);  // Initial actuation at 2.0mm

// Step 3: Configure RT dynamics
await keyboard.setRtPressTravel(key, 0.3);   // Re-trigger after 0.3mm press
await keyboard.setRtReleaseTravel(key, 0.3); // Reset after 0.3mm release

// Step 4: Verify configuration
const rtConfig = await keyboard.getRtTravel(key);
console.log('RT configured:', rtConfig);
```

---

## Performance Modes

Keys can operate in two modes: **global** (uses global travel settings) or **single** (uses per-key settings).

### getPerformanceMode()

Retrieves the current mode for a key.

```typescript
async getPerformanceMode(key: number): Promise<{
  touchMode: 'global' | 'single';
  advancedKeyMode: number;
}>
```

**Parameters:**
- `key` (number): Key to query

**Returns:**
- `touchMode` (string): 'global' or 'single'
- `advancedKeyMode` (number): Advanced mode flags

**Example:**

```typescript
const mode = await keyboard.getPerformanceMode(4);  // 'A' key
console.log('Mode:', mode.touchMode);
// Output: Mode: global
```

### setPerformanceMode()

Sets the performance mode for a key.

```typescript
async setPerformanceMode(
  key: number,
  mode: 'global' | 'single',
  advancedKeyMode: number
): Promise<{
  touchMode: string;
  advancedKeyMode: number;
}>
```

**Parameters:**
- `key` (number): Key to configure
- `mode` (string): 'global' or 'single'
- `advancedKeyMode` (number): Advanced mode flags (usually 0)

**Example (Switch Key to Single Mode):**

```typescript
// Switch 'W' key to single mode for custom travel
await keyboard.setPerformanceMode(26, 'single', 0);

// Now can set individual travel
await keyboard.setSingleTravel(26, 1.5);
```

**Example (Batch Mode Switching):**

```typescript
// Set all letter keys to single mode
const letterKeys = Array.from({ length: 26 }, (_, i) => i + 4); // A-Z

for (const key of letterKeys) {
  await keyboard.setPerformanceMode(key, 'single', 0);
  await new Promise(resolve => setTimeout(resolve, 50));
}
```

---

## Calibration

Hall effect sensors require calibration to ensure accurate travel distance detection.

### calibrationStart()

Begins calibration mode. Keyboard will start recording maximum travel values as keys are pressed.

```typescript
async calibrationStart(): Promise<Calibration>
```

**Returns:** Calibration status object

**Example:**

```typescript
// Start calibration
const result = await keyboard.calibrationStart();
console.log('Calibration started:', result);

// User should now press all keys fully
// See getRm6X21Calibration() for live data polling
```

### calibrationEnd()

Ends calibration mode and saves calibration data to keyboard firmware.

```typescript
async calibrationEnd(): Promise<Calibration>
```

**Returns:** Calibration completion status

**Example:**

```typescript
// End and save calibration
const result = await keyboard.calibrationEnd();
console.log('Calibration saved:', result);
```

### getRm6X21Calibration()

Retrieves real-time calibration and travel data (6×21 matrix).

```typescript
async getRm6X21Calibration(): Promise<{
  calibrations: number[][];
  travels: number[][];
}>
```

**Returns:**
- `calibrations` (2D array): Calibration values per position
- `travels` (2D array): Current travel values per position

**Example (Live Calibration Monitoring):**

```typescript
// Start calibration
await keyboard.calibrationStart();

// Poll every 200ms
const pollInterval = setInterval(async () => {
  const data = await keyboard.getRm6X21Calibration();
  
  if (data.travels) {
    // Process travel data (6 rows × 21 columns)
    for (let row = 0; row < data.travels.length; row++) {
      for (let col = 0; col < data.travels[row].length; col++) {
        const travelValue = data.travels[row][col];
        
        if (travelValue > 0) {
          console.log(`Key at [${row},${col}]: ${travelValue}µm`);
        }
      }
    }
  }
}, 200);

// After user presses all keys, stop polling and save
setTimeout(async () => {
  clearInterval(pollInterval);
  await keyboard.calibrationEnd();
  console.log('Calibration complete');
}, 30000);  // 30 seconds
```

### getRm6X21Travel()

Retrieves real-time travel data without calibration mode.

```typescript
async getRm6X21Travel(): Promise<{
  status: any;
  travels: number[][];
  maxTravel: number;
}>
```

**Returns:**
- `status`: Current status
- `travels` (2D array): Live travel values (6×21)
- `maxTravel` (number): Maximum travel detected

---

## Axis Configuration

Axis settings allow keys to function as analog inputs (e.g., for joystick emulation).

### getAxis()

Gets the axis assignment for a key.

```typescript
async getAxis(key: number): Promise<{ axis: number }>
```

**Parameters:**
- `key` (number): Key to query

**Returns:**
- `axis` (number): Axis number (0 = no axis assigned)

### setAxis()

Assigns a key to an axis.

```typescript
async setAxis(key: number, value: number): Promise<{ axis: number }>
```

**Parameters:**
- `key` (number): Key to configure
- `value` (number): Axis number to assign

**Example:**

```typescript
// Assign W/A/S/D to axes for analog movement
await keyboard.setAxis(26, 1);  // W → Axis 1 (Y+)
await keyboard.setAxis(22, 1);  // S → Axis 1 (Y-)
await keyboard.setAxis(4, 2);   // A → Axis 2 (X-)
await keyboard.setAxis(7, 2);   // D → Axis 2 (X+)
```

### getAxisList()

Retrieves all axis assignments.

```typescript
async getAxisList(): Promise<{
  hasAxisSetting: boolean;
  axisList: number[];
}>
```

**Returns:**
- `hasAxisSetting` (boolean): Whether keyboard supports axis
- `axisList` (array): List of assigned axes

**Example:**

```typescript
const axisConfig = await keyboard.getAxisList();
console.log('Has axis support:', axisConfig.hasAxisSetting);
console.log('Assigned axes:', axisConfig.axisList);
```

---

## Lighting Control

### getLighting()

Retrieves global RGB lighting settings.

```typescript
async getLighting(): Promise<LightingConfig>
```

**Returns:** Lighting configuration object

**Example:**

```typescript
const lighting = await keyboard.getLighting();
console.log('Lighting mode:', lighting.mode);
console.log('Brightness:', lighting.brightness);
console.log('Speed:', lighting.speed);
```

### getLogoLighting()

Gets keyboard logo RGB settings.

```typescript
async getLogoLighting(): Promise<LogoLightingConfig>
```

**Returns:** Logo lighting configuration

### getCustomLighting()

Gets per-key RGB color.

```typescript
async getCustomLighting(key?: number): Promise<CustomLightingConfig>
```

**Parameters:**
- `key` (number, optional): Specific key to query

**Returns:** Custom lighting configuration

**Example:**

```typescript
// Get lighting for 'A' key
const color = await keyboard.getCustomLighting(4);
console.log('A key color:', color);
```

### getSpecialLighting()

Gets special lighting effect settings.

```typescript
async getSpecialLighting(): Promise<SpecialLightingConfig>
```

**Returns:** Special lighting configuration

### getSaturation()

Gets RGB saturation settings.

```typescript
async getSaturation(): Promise<{ saturation: number }>
```

**Returns:** Saturation value

### setLighting()

Sets global RGB lighting mode and effects.

```typescript
async setLighting(lightModeConfig: LightModeConfigs): Promise<any>
```

**Parameters:**
- `lightModeConfig` (LightModeConfigs): Lighting configuration object with mode, brightness, speed, and color settings

**Example:**

```typescript
// Set lighting to breathing effect
await keyboard.setLighting({
  mode: 'breathing',
  brightness: 80,
  speed: 50,
  color: { r: 255, g: 0, b: 0 }
});
```

### setCustomLighting()

Sets per-key RGB colors for custom lighting.

```typescript
async setCustomLighting(param: IKRGBDesc): Promise<any>
```

**Parameters:**
- `param` (IKRGBDesc): Custom lighting descriptor with key-color mappings

**Example:**

```typescript
// Set custom colors for WASD keys
await keyboard.setCustomLighting({
  keys: [
    { key: 26, r: 255, g: 0, b: 0 },    // W - Red
    { key: 4,  r: 0, g: 255, b: 0 },    // A - Green
    { key: 22, r: 0, g: 0, b: 255 },    // S - Blue
    { key: 7,  r: 255, g: 255, b: 0 }   // D - Yellow
  ]
});
```

### setLogoLighting()

Sets keyboard logo RGB lighting.

```typescript
async setLogoLighting(lightModeConfig: ILoGoLightMode): Promise<any>
```

**Parameters:**
- `lightModeConfig` (ILoGoLightMode): Logo lighting configuration

**Example:**

```typescript
// Set logo to static purple
await keyboard.setLogoLighting({
  mode: 'static',
  color: { r: 128, g: 0, b: 128 }
});
```

### setLightingSaturation()

Sets RGB saturation level for all lighting.

```typescript
async setLightingSaturation(param: number[]): Promise<any>
```

**Parameters:**
- `param` (number[]): Saturation values array

**Example:**

```typescript
// Set saturation to 75%
await keyboard.setLightingSaturation([75]);
```

### setSpecialLighting()

Sets special lighting effects and patterns.

```typescript
async setSpecialLighting(lightModeConfig: LightModeConfigs): Promise<any>
```

**Parameters:**
- `lightModeConfig` (LightModeConfigs): Special lighting configuration

**Example:**

```typescript
// Set reactive lighting effect
await keyboard.setSpecialLighting({
  mode: 'reactive',
  brightness: 100,
  speed: 75
});
```

### saveCustomLighting()

Saves custom lighting configuration to firmware.

```typescript
async saveCustomLighting(): Promise<any>
```

**Example:**

```typescript
// Set custom colors then save
await keyboard.setCustomLighting({ /* colors */ });
await keyboard.saveCustomLighting();
```

---

## Configuration Management

### getApi()

Generic API call for special commands.

```typescript
async getApi(param: { type: string }): Promise<any>
```

**Common Commands:**

#### Save Parameters

Saves all configuration changes to keyboard firmware.

```typescript
await keyboard.getApi({ type: 'ORDER_TYPE_SAVING_PARAMETER' });
```

#### Reload Parameters

Reloads parameters from firmware (applies saved changes).

```typescript
await keyboard.getApi({ type: 'ORDER_TYPE_RELOAD_PARAMETERS' });
```

**Standard Save/Reload Pattern:**

```typescript
// Make configuration changes
await keyboard.setKey([{ key: 4, layout: 0, value: 5 }]);
await keyboard.setSingleTravel(26, 1.5);

// Save to firmware
await keyboard.getApi({ type: 'ORDER_TYPE_SAVING_PARAMETER' });

// Reload to apply
await keyboard.getApi({ type: 'ORDER_TYPE_RELOAD_PARAMETERS' });

// Wait for changes to take effect
await new Promise(resolve => setTimeout(resolve, 500));

console.log('Configuration saved and applied');
```

### exportEncryptedJSON()

Exports complete keyboard configuration as encrypted JSON file.

```typescript
async exportEncryptedJSON(filename?: string): Promise<void>
```

**Parameters:**
- `filename` (string, optional): Output filename (default: 'config.json')

**Example:**

```typescript
// Export current configuration
await keyboard.exportEncryptedJSON('my-keyboard-backup.json');
console.log('Configuration exported');
```

**Note:** The exported JSON is encrypted and can be imported using the keyboard's official software or future SDK import methods.

---

## Error Handling

### Error Types

SDK methods may return or throw errors. Always handle both patterns:

```typescript
// Pattern 1: Error as return value
const result = await keyboard.getBaseInfo();
if (result instanceof Error) {
  console.error('Failed:', result.message);
  return;
}

// Pattern 2: Try-catch for exceptions
try {
  await keyboard.init('device-id');
} catch (error) {
  console.error('Init failed:', error);
}
```

### Retry Pattern (Recommended)

For critical operations, implement retry logic:

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 500
): Promise<T | Error> {
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    try {
      const result = await operation();
      if (result instanceof Error) throw result;
      return result;
    } catch (error) {
      console.warn(`Attempt ${attempt + 1} failed:`, error);
      
      if (attempt === maxAttempts - 1) {
        return error as Error;
      }
      
      attempt++;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return new Error('Max retries exceeded');
}

// Usage
const baseInfo = await withRetry(() => keyboard.getBaseInfo());
```

### Connection State Checking

Always verify connection before operations:

```typescript
class KeyboardService {
  private connectedDevice: Device | null = null;
  
  async getSingleTravel(key: number): Promise<string | Error> {
    if (!this.connectedDevice) {
      return new Error('No device connected');
    }
    
    try {
      const result = await this.keyboard.getSingleTravel(key);
      // Note: result is a string like "2.05", not a number
      return result;
    } catch (error) {
      console.error('Failed to get travel:', error);
      return error as Error;
    }
  }
}
```

---

## Best Practices

### 1. Batch Processing

Process multiple keys in batches to prevent overwhelming the hardware:

```typescript
const BATCH_SIZE = 80;
const DELAY_MS = 100;

async function batchProcess<T>(
  items: T[],
  processFunc: (batch: T[]) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    await processFunc(batch);
    
    // Delay between batches
    if (i + BATCH_SIZE < items.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }
}

// Usage
const remapConfigs = [/* ... 100+ keys ... */];
await batchProcess(remapConfigs, async (batch) => {
  await keyboard.setKey(batch);
});
```

### 2. Always Save and Reload

Configuration changes require explicit save/reload:

```typescript
// WRONG: Changes won't persist
await keyboard.setKey([{ key: 4, layout: 0, value: 5 }]);

// CORRECT: Save and reload
await keyboard.setKey([{ key: 4, layout: 0, value: 5 }]);
await keyboard.getApi({ type: 'ORDER_TYPE_SAVING_PARAMETER' });
await keyboard.getApi({ type: 'ORDER_TYPE_RELOAD_PARAMETERS' });
```

### 3. Implement Auto-Reconnect

Save device info for seamless reconnection:

```typescript
// On successful connection
localStorage.setItem('pairedDeviceId', device.id);
localStorage.setItem('pairedDeviceData', JSON.stringify(device));

// On app startup
const savedId = localStorage.getItem('pairedDeviceId');
if (savedId) {
  const deviceData = JSON.parse(localStorage.getItem('pairedDeviceData'));
  await keyboard.reconnection(deviceData.data, deviceData.id);
}
```

### 4. Handle WebHID Events

Listen for device connect/disconnect:

```typescript
if ('hid' in navigator) {
  navigator.hid.addEventListener('connect', async (event) => {
    console.log('Device connected:', event.device);
    // Attempt auto-reconnect
  });
  
  navigator.hid.addEventListener('disconnect', (event) => {
    console.log('Device disconnected:', event.device);
    // Update UI state
  });
}
```

### 5. Use TypeScript Types

Import SDK types for type safety:

```typescript
import type { Device, DeviceInit } from '@sparklinkplayjoy/sdk-keyboard';

interface IDefKeyInfo {
  keyValue: number;
  physicalKeyValue: number;
  location: { row: number; col: number };
  keyWidth: number;
  keyHeight: number;
}
```

### 6. Calibration Best Practices

```typescript
// Start calibration
await keyboard.calibrationStart();

// Instruct user to:
// 1. Press each key fully to the bottom
// 2. Hold for 1-2 seconds
// 3. Rock key forward/back and side-to-side
// 4. This ensures maximum travel is captured

// Poll for progress
const pollInterval = setInterval(async () => {
  const data = await keyboard.getRm6X21Calibration();
  // Update UI with calibration progress
}, 200);

// After sufficient time
clearInterval(pollInterval);
await keyboard.calibrationEnd();
```

---

## API Quick Reference

### Connection & Device
| Method | Purpose | Returns |
|--------|---------|---------|
| `getDevices()` | List all connected devices | `Device[]` |
| `init(deviceId)` | Initialize device | `Device` |
| `reconnection(data, id)` | Reconnect to saved device | `void` |
| `getBaseInfo()` | Get hardware info | `BaseInfo` |

### Layout & Keys
| Method | Purpose | Returns |
|--------|---------|---------|
| `defKey()` | Get physical layout | `IDefKeyInfo[][]` |
| `getLayoutKeyInfo(params)` | Get key mappings | `IDefKeyInfo[]` |
| `setKey(configs)` | Remap keys | `void` |

### Macros
| Method | Purpose | Returns |
|--------|---------|---------|
| `getMacro(key)` | Get macro for key | `MacroData` |
| `setMacro(param, macros)` | Assign macro | `void` |

### Travel Distance
| Method | Purpose | Returns |
|--------|---------|---------|
| `getGlobalTouchTravel()` | Get global travel | `{ globalTouchTravel }` |
| `setDB(param)` | Set global travel | `{ globalTouchTravel, pressDead, releaseDead }` |
| `getSingleTravel(key)` | Get per-key travel | `string` ⚠️ |
| `setSingleTravel(key, value)` | Set per-key travel (also sets initial travel in RT mode) | `string` ⚠️ |
| `getDpDr(key)` | Get deadzones | `{ pressDead, releaseDead }` |
| `setDp(key, value)` | Set press deadzone | `{ pressDead }` |
| `setDr(key, value)` | Set release deadzone | `{ releaseDead }` |

### Advanced Travel
| Method | Purpose | Returns |
|--------|---------|---------|
| `getDksTravel(key, layout)` | Get DKS travel | `{ travel, dbs? }` |
| `setDksTravel(key, value, layout)` | Set DKS travel | `{ travel, dbs? }` |
| `getDbTravel(key, layout)` | Get DB travel | `{ travel, dbs? }` |
| `setDbTravel(key, value, layout)` | Set DB travel | `{ travel, dbs? }` |
| `getRtTravel(key)` | Get RT travel | `{ pressTravel, releaseTravel }` |
| `setRtPressTravel(key, value)` | Set RT press travel | `string` ⚠️ |
| `setRtReleaseTravel(key, value)` | Set RT release travel | `string` ⚠️ |

### Performance
| Method | Purpose | Returns |
|--------|---------|---------|
| `getPerformanceMode(key)` | Get key mode | `{ touchMode, advancedKeyMode }` |
| `setPerformanceMode(key, mode, advanced)` | Set key mode | `{ touchMode, advancedKeyMode }` |

### Calibration
| Method | Purpose | Returns |
|--------|---------|---------|
| `calibrationStart()` | Start calibration | `Calibration` |
| `calibrationEnd()` | End and save | `Calibration` |
| `getRm6X21Calibration()` | Get live calibration | `{ calibrations, travels }` |
| `getRm6X21Travel()` | Get live travel | `{ status, travels, maxTravel }` |

### Axis
| Method | Purpose | Returns |
|--------|---------|---------|
| `getAxis(key)` | Get axis assignment | `{ axis }` |
| `setAxis(key, value)` | Set axis | `{ axis }` |
| `getAxisList()` | Get all axes | `{ hasAxisSetting, axisList }` |

### Lighting
| Method | Purpose | Returns |
|--------|---------|---------|
| `getLighting()` | Get global lighting | `LightingConfig` |
| `setLighting(config)` | Set global lighting mode | `any` |
| `getLogoLighting()` | Get logo lighting | `LogoLightingConfig` |
| `setLogoLighting(config)` | Set logo lighting | `any` |
| `getCustomLighting(key?)` | Get per-key color | `CustomLightingConfig` |
| `setCustomLighting(param)` | Set per-key RGB colors | `any` |
| `getSpecialLighting()` | Get special effects | `SpecialLightingConfig` |
| `setSpecialLighting(config)` | Set special lighting effects | `any` |
| `getSaturation()` | Get saturation | `{ saturation }` |
| `setLightingSaturation(param)` | Set saturation level | `any` |
| `saveCustomLighting()` | Save custom lighting to firmware | `any` |

### Configuration
| Method | Purpose | Returns |
|--------|---------|---------|
| `getApi({ type: 'ORDER_TYPE_SAVING_PARAMETER' })` | Save config | `any` |
| `getApi({ type: 'ORDER_TYPE_RELOAD_PARAMETERS' })` | Reload config | `any` |
| `exportEncryptedJSON(filename?)` | Export config | `void` |

---

## Complete Usage Example

Here's a complete example showing common workflows:

```typescript
import XDKeyboard from '@sparklinkplayjoy/sdk-keyboard';
import type { Device } from '@sparklinkplayjoy/sdk-keyboard';

class MyKeyboardApp {
  private keyboard: XDKeyboard;
  private device: Device | null = null;
  
  constructor() {
    this.keyboard = new XDKeyboard({
      usage: 1,
      usagePage: 65440
    });
  }
  
  // 1. Connect to keyboard
  async connect(): Promise<void> {
    const devices = await navigator.hid.requestDevice({ filters: [] });
    const hidDevice = devices[0];
    
    if (!hidDevice.opened) await hidDevice.open();
    
    this.device = await this.keyboard.init(hidDevice.id);
    console.log('Connected:', this.device.productName);
  }
  
  // 2. Customize gaming keys
  async setupGamingProfile(): Promise<void> {
    const gamingKeys = [26, 4, 22, 7];  // WASD
    
    // Set to single mode
    for (const key of gamingKeys) {
      await this.keyboard.setPerformanceMode(key, 'single', 0);
    }
    
    // Set fast travel (1.5mm)
    for (const key of gamingKeys) {
      await this.keyboard.setSingleTravel(key, 1.5);
    }
    
    // Save
    await this.keyboard.getApi({ type: 'ORDER_TYPE_SAVING_PARAMETER' });
    await this.keyboard.getApi({ type: 'ORDER_TYPE_RELOAD_PARAMETERS' });
    
    console.log('Gaming profile configured');
  }
  
  // 3. Create macro
  async createQuickMacro(): Promise<void> {
    const macro = [
      { id: 1, keyValue: 4, status: 1, delay: 0 },    // 'a' down
      { id: 2, keyValue: 4, status: 0, delay: 50 },   // 'a' up
      { id: 3, keyValue: 7, status: 1, delay: 50 },   // 'd' down
      { id: 4, keyValue: 7, status: 0, delay: 50 }    // 'd' up
    ];
    
    await this.keyboard.setMacro({ key: 58 }, macro);  // F1
    await this.keyboard.getApi({ type: 'ORDER_TYPE_SAVING_PARAMETER' });
    await this.keyboard.getApi({ type: 'ORDER_TYPE_RELOAD_PARAMETERS' });
    
    console.log('Macro assigned to F1');
  }
  
  // 4. Calibrate keyboard
  async calibrate(): Promise<void> {
    await this.keyboard.calibrationStart();
    console.log('Press all keys fully...');
    
    // Poll for 30 seconds
    const duration = 30000;
    const startTime = Date.now();
    
    const interval = setInterval(async () => {
      const data = await this.keyboard.getRm6X21Calibration();
      console.log('Calibration progress:', data.travels);
      
      if (Date.now() - startTime >= duration) {
        clearInterval(interval);
        await this.keyboard.calibrationEnd();
        console.log('Calibration complete');
      }
    }, 200);
  }
}

// Usage
const app = new MyKeyboardApp();
await app.connect();
await app.setupGamingProfile();
await app.createQuickMacro();
```

---

## Documentation Version History

### v2.0.0 - November 16, 2025

**Major Corrections & Additions** - Comprehensive review and accuracy improvements based on actual SDK implementation analysis.

**Critical Fixes:**
- ✅ **Added string return type warnings** - Documented that `getSingleTravel()` returns **string** values (e.g., `"2.05"`), not numbers
- ✅ **Fixed getSingleTravel() documentation** - Updated return type from `number` to `string` with Number() conversion examples
- ✅ **Documented setSingleTravel() dual purpose** - Clarified it works for both Single mode AND RT mode (sets initial trigger travel in RT)
- ✅ **Enhanced getRtTravel() documentation** - Added complete return type structure `{pressTravel, releaseTravel}` with real-world examples
- ✅ **Updated RT setter methods** - Documented setRtPressTravel() and setRtReleaseTravel() with proper conversion patterns

**New API Documentation:**
- ✅ **Added 6 lighting setter methods** - Complete documentation for `setLighting()`, `setCustomLighting()`, `setLogoLighting()`, `setLightingSaturation()`, `setSpecialLighting()`, `saveCustomLighting()`
- ✅ **Updated Quick Reference tables** - Added all newly documented methods and corrected return types

**Examples & Best Practices:**
- ✅ **Added "⚠️ Important Notes" section** at document start with critical type conversion warnings
- ✅ **Real-world code examples** from AureTrix implementation showing proper Number() conversions
- ✅ **Complete RT setup workflow** demonstrating setSingleTravel() → setRtPressTravel() → setRtReleaseTravel() pattern

**Impact:** These corrections prevent type-related bugs, incorrect string/number comparisons, and provide accurate API usage patterns validated against production code.

### v1.0.0 - November 15, 2025

Initial comprehensive SDK documentation with examples from AureTrix keyboard driver implementation.

---

## Support & Resources

- **Package Version**: 1.0.14
- **Protocol**: WebHID
- **Browser Support**: Chrome 89+, Edge 89+, Opera 75+
- **Hardware**: SparkLink hall effect keyboards (VID:7331, PID:1793)

For implementation examples, see the AureTrix keyboard driver source code in this repository.

---

*Last Updated: November 16, 2025*
