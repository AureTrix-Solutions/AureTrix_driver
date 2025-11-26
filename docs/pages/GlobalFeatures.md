# Global Features Documentation (App.vue Sidebar)

## Overview
The App.vue component provides the main application shell with a persistent sidebar containing global features that are accessible from any page. These features include profile management, configuration import/export, quick settings (polling rate, system mode), and factory reset.

## Purpose
- Provide quick access to commonly used keyboard settings
- Enable profile switching without navigating to a dedicated page
- Allow configuration backup and restore
- Offer system-level settings (polling rate, OS mode)
- Provide factory reset capability with safety confirmation

## Key Features

### 1. Profile Selection (P1-P4)
The sidebar displays four profile buttons that allow quick switching between keyboard configurations stored in the keyboard's firmware.

**Features:**
- **4 Profiles**: P1, P2, P3, P4 (stored on keyboard hardware)
- **Active indicator**: Current profile highlighted with accent color
- **Editable names**: Click edit icon to rename profiles
- **Instant switch**: Click profile to switch (triggers page reload)
- **Persistent names**: Profile names stored in Pinia store with localStorage

**Technical:**
```typescript
async handleProfileClick(profileId: number) {
  const result = await this.profileStore.switchProfile(profileId);
  if (result.success) {
    window.location.reload();  // Reload to refresh all settings
  }
}
```

**SDK Method:** `KeyboardService.switchConfig(profileId)` (converts 1-4 to 0-3 internally)

### 2. Profile Export
Exports the complete keyboard configuration from the currently active profile.

**Features:**
- Gathers all key mappings across 4 layers (Fn0-Fn3)
- Collects per-key performance settings (travel, deadzones)
- Includes lighting configuration
- Captures macros from macro library
- Includes system settings (polling rate, etc.)

**Technical:**
```typescript
async exportProfile() {
  const activeProfile = this.profileStore.profiles.find(p => p.id === this.profileStore.activeProfileId);
  const filename = `${activeProfile.name}.json`;
  await ExportService.exportProfile(filename);
}
```

**Output:** JSON file with complete keyboard state (uses SDK's encrypted format)

### 3. Profile Import
Restores a previously exported configuration to the keyboard.

**Features:**
- Accepts JSON configuration files
- Validates file format before applying
- Applies all settings to keyboard firmware
- Triggers page reload on success

**Technical:**
```typescript
async importProfile() {
  const file = /* file from input */;
  const result = await ExportService.importProfile(file);
  if (result.success) {
    window.location.reload();
  }
}
```

### 4. Debug Export JSON
Development tool that exports raw configuration data for debugging purposes.

**Features:**
- Exports complete configuration in readable JSON format
- Not encrypted (unlike standard export)
- Includes all raw SDK data

**Note:** This is a development/debugging tool and may not be present in production builds.

### 5. Polling Rate (Quick Settings)

Configures the keyboard's USB polling rate.

**Options:**
| Value | Rate |
|-------|------|
| 0 | 8KHz (8000Hz) |
| 1 | 4KHz |
| 2 | 2KHz |
| 3 | 1KHz (default) |
| 4 | 500Hz |
| 5 | 250Hz |
| 6 | 125Hz |

**Features:**
- Flyout dropdown selection
- Lazy-loaded on first open (reads current value from hardware)
- Triggers keyboard reconnection after change
- Waits for reconnection before page reload

**Technical:**
```typescript
async handlePollingRateChange() {
  await KeyboardService.setPollingRate(this.currentPollingRate);
  // Wait for reconnection and suppression cleanup
  await waitForReinitialization();
  window.location.reload();
}
```

**SDK Method:** `KeyboardService.setPollingRate(value)` / `KeyboardService.getPollingRate()`

**Important:** Changing polling rate causes the keyboard to disconnect and reconnect. The application handles this automatically.

### 6. System Mode (Quick Settings)

Switches between Windows and Mac keyboard layouts.

**Options:**
- **Windows**: Standard Windows key mappings
- **Mac**: macOS-compatible mappings (Cmd/Option swap)

**Features:**
- Flyout dropdown selection
- Lazy-loaded on first open
- Applies immediately without page reload

**Technical:**
```typescript
async handleSystemModeChange() {
  await KeyboardService.setSystemMode(this.currentSystemMode);
}
```

**SDK Methods:** `KeyboardService.setSystemMode('win' | 'mac')` / `KeyboardService.querySystemMode()`

### 7. Factory Reset

Restores the keyboard to factory default settings.

**Warning:** This operation:
- Deletes all key mappings and macros
- Resets RGB lighting settings
- Clears performance settings and calibration
- Removes all saved profiles on the keyboard

**Features:**
- Confirmation modal before execution
- Recommends exporting profiles first
- Shows success/failure alert
- Does not clear browser-stored data (profile names, travel profiles)

**Technical:**
```typescript
async handleFactoryReset() {
  this.hideFactoryResetModal();
  const result = await KeyboardService.factoryReset();
  if (result === true) {
    alert('Factory reset successful!');
  }
}
```

**SDK Method:** `KeyboardService.factoryReset()`

## User Interface Elements

### Sidebar Header
- AureTrix logo
- Connection status with device info:
  - Product name
  - Serial number
  - Board ID
  - Firmware version
- Initialization states: Loading, Initializing, Error

### Navigation Menu
- Main navigation links
- Collapsible categories (Basic Settings, Customization, Advanced)
- Tooltips for advanced features

### Profiles Section
- 4 profile buttons in 2x2 grid
- Edit icon for renaming
- Active profile highlighted

### Export/Import Buttons
- Export Profile button
- Import Profile button
- Debug Export JSON button (development)

### Quick Settings Section
- Polling Rate (expandable)
- System Mode (expandable)
- Factory Reset button

## Dependencies

### Services
- **KeyboardService**: Hardware communication
- **ExportService**: Profile backup/restore operations

### Stores
- **connectionStore**: Device connection state
- **profileStore**: Profile names and active selection

### Components
- **FactoryResetModal**: Confirmation dialog for factory reset

## Data Flow

```
Quick Settings Access
    |
    v
First open: syncHardwareSettings()
    |
    +--> getPollingRate()
    |         |
    |         v
    |    Update currentPollingRate
    |
    +--> querySystemMode()
              |
              v
         Update currentSystemMode

Profile Switch
    |
    v
profileStore.switchProfile(id)
    |
    v
KeyboardService.switchConfig(id - 1)
    |
    v
window.location.reload()

Factory Reset
    |
    v
Show FactoryResetModal
    |
    v
User confirms
    |
    v
KeyboardService.factoryReset()
    |
    v
Show result alert
```

## Error Handling

### Profile Operations
- Failed switch: Error logged, no reload
- Export failure: Error logged to console
- Import failure: Error logged, no changes applied

### Quick Settings
- Invalid polling rate: Operation rejected with console error
- System mode failure: Error logged, no UI change

### Factory Reset
- Failure: Alert shown to user with retry suggestion
- Unexpected result: Warning alert with result info

## Known Limitations

- Profile names are stored in browser localStorage (not on keyboard)
- Changing polling rate requires page reload
- Factory reset does not clear browser-stored preferences
- Debug export only available in development builds

## Related Documentation

- [ExportService](../SDK_REFERENCE.md#configuration-management) - Profile export/import implementation
- [FactoryResetModal](./FactoryResetModal.md) - Confirmation modal component
- [SDK Reference](../SDK_REFERENCE.md) - SDK methods used

---

*Last Updated: November 26, 2025*
