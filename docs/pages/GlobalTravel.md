# GlobalTravel Component

**Component Path:** `src/components/performance/GlobalTravel.vue`

**Parent Component:** Performance.vue (via KeyTravel.vue)

**Type:** Performance Sub-Component

---

## Overview

GlobalTravel is a configuration component that manages global travel distance and deadzone settings for all keyboard keys operating in "global mode". It provides a unified interface for setting a single travel distance that applies to all keys configured to use global settings, along with top and bottom deadzones that define the actuation boundaries.

The component includes visual overlay support to display current settings on the keyboard grid and batch processing to efficiently apply deadzone changes to all global-mode keys.

---

## Key Features

1. **Global Travel Distance Control**
   - Single slider controlling travel distance for all global-mode keys
   - Range: 0.1mm - 4.0mm (or profile max travel)
   - Fine-tune adjustment with +/- buttons
   - Direct numeric input for precise values

2. **Deadzone Configuration**
   - **Top Dead Zone (Press Deadzone)**: Defines the minimum distance before key press can be registered
   - **Bottom Dead Zone (Release Deadzone)**: Defines the minimum distance from bottom before key can be released
   - Each deadzone ranges from 0.0mm to 1.0mm
   - Link/Unlink functionality to synchronize both deadzones

3. **Select to Global Mode Button**
   - Converts selected keys from single/other modes to global mode
   - Applies current global travel and deadzone settings
   - Disabled when no keys are selected

4. **Automatic Travel Clamping**
   - Global travel automatically adjusts when deadzones change
   - Ensures: `minTravel = max(0.1, topDeadZone)`
   - Ensures: `maxTravel = min(profileMaxTravel, profileMaxTravel - bottomDeadZone)`
   - Prevents invalid configurations

5. **Visual Overlay System**
   - Show/Hide button toggles overlay display on keyboard grid
   - Displays travel, pressDead, and releaseDead on each global-mode key
   - Emits overlay data to parent for grid rendering

6. **Batch Processing**
   - Uses `useBatchProcessing` composable for efficient SDK calls
   - Updates deadzones only for keys in global mode
   - Prevents hardware overwhelm with batched operations (80 keys per batch)

---

## User Interface Elements

### Header Section
- **Title**: "Global Travel" in primary color
- **Show/Hide Button**: Toggles overlay visibility on keyboard grid

### Global Travel Row
- **Label**: "Global Travel (mm)"
- **Slider**: Visual range control with min/max value displays
- **Numeric Input**: Direct value entry
- **+/- Buttons**: Fine adjustment controls (±0.01mm)

### Deadzone Group (Horizontal Layout)
- **Top Dead Zone Input**
  - Label: "Top Dead Zone (mm)"
  - Slider with 0.00 - 1.00 range
  - Numeric input with +/- buttons
  
- **Link Button** (Center)
  - Text: "Link Zones" or "Unlink Zones"
  - Synchronizes top and bottom deadzones when linked
  
- **Bottom Dead Zone Input**
  - Label: "Bottom Dead Zone (mm)"
  - Slider with 0.00 - 1.00 range
  - Numeric input with +/- buttons
  - Disabled when zones are linked

### Select to Global Button
- Text: "Select to Global"
- Disabled when `selectedKeys.length === 0`
- Sets selected keys to global performance mode

---

## Technical Implementation

### Props

```typescript
interface Props {
  layout: IDefKeyInfo[][];        // Full keyboard layout for batch operations
  selectedKeys: IDefKeyInfo[];    // Currently selected keys
  profileMaxTravel: number;       // Maximum travel from active switch profile
}
```

### Emits

```typescript
emits: [
  'update-overlay',         // Sends global overlay data or null
  'update-single-overlay',  // Clears single-key overlay when switching modes
  'mode-changed'            // Notifies parent when keys switch to global mode
]
```

**Event Details**:

- **`update-overlay`**: Emitted when global travel or deadzones change, or when toggling overlay visibility
  - Payload: `{ travel: string, pressDead: string, releaseDead: string }` or `null` to hide
  
- **`update-single-overlay`**: Emitted when keys switch to global mode to clear their per-key overlays
  - Payload: `null` (clears all single-mode overlays)
  
- **`mode-changed`**: Critical for overlay reactivity - emitted when selected keys are converted to global mode
  - Payload: `{ keyIds: number[], newMode: 'global' }`
  - Triggers parent to update `keyModeMap` tracking
  - Ensures overlays switch from single to global values without page refresh

### Core State

```typescript
const globalTravel = ref(2.0);           // Global travel distance (mm)
const pressDead = ref(0.2);              // Top deadzone (mm)
const releaseDead = ref(0.2);            // Bottom deadzone (mm)
const deadZonesLinked = ref(false);      // Link state for deadzones
const showOverlay = ref(false);          // Overlay visibility toggle
const prevPressDead = ref(0.2);          // Previous pressDead for change detection
const prevReleaseDead = ref(0.2);        // Previous releaseDead for change detection
```

### Computed Properties

```typescript
const minTravel = computed(() => Math.max(0.1, pressDead.value));
const maxTravel = computed(() => 
  Math.min(props.profileMaxTravel, props.profileMaxTravel - releaseDead.value)
);
```

These computed values ensure the global travel slider always operates within valid bounds defined by the deadzones and profile max travel.

---

## Data Flow

### Loading Global Settings

```
Component Mount
  ↓
loadGlobalSettings()
  ↓
KeyboardService.getGlobalTouchTravel()  → Gets global travel value
  ↓
Find a global-mode key from layout (using getPerformanceMode)
  ↓
KeyboardService.getDpDr(globalModeKey)  → Gets deadzones (pressDead, releaseDead)
  ↓
Update reactive state (globalTravel, pressDead, releaseDead)
  ↓
Store previous deadzone values for change detection
```

**Important:** The global deadzones are fetched via `getDpDr()` from a key that is confirmed to be in global performance mode, not from `getGlobalTouchTravel()` which only returns the travel distance. This is because `getGlobalTouchTravel()` does not return deadzone values.

### Updating Global Settings

```
User adjusts slider/input
  ↓
updateGlobalSettings()
  ↓
Clamp globalTravel to [minTravel, maxTravel]
  ↓
KeyboardService.setGlobalTouchTravel({ globalTouchTravel, pressDead, releaseDead })
  ↓
Check if deadzones changed (compare with prev values)
  ↓
If changed: updateGlobalDeadZones()
  ↓
  ├─ Get all keys from layout
  ├─ Filter for keys in global mode via processBatches
  ├─ Batch update setDp() and setDr() for global-mode keys
  └─ Update prev values
  ↓
If overlay active: emit 'update-overlay' with current values
```

### Setting Keys to Global Mode

```
User clicks "Select to Global"
  ↓
setKeyToGlobalMode()
  ↓
Map selectedKeys to physical key values
  ↓
Step 1: Fetch current global settings from keyboard
  ↓
KeyboardService.getGlobalTouchTravel()
  ↓
Validate returned values (globalTouchTravel, pressDead, releaseDead)
  ↓
Check all values are valid numbers (throw if NaN)
  ↓
Step 2: Apply global values to each key BEFORE switching mode
  ↓
processBatches: For each selected key
  ├─ KeyboardService.setSingleTravel(key, globalTravelValue)
  ├─ KeyboardService.setDp(key, globalPressDead)  
  ├─ KeyboardService.setDr(key, globalReleaseDead)
  └─ KeyboardService.setPerformanceMode(key, 'global', 0)
  ↓
All service calls validated (throw on Error)
  ↓
Step 3: Sync UI state with applied values
  ↓
globalTravel.value = globalTravelValue
pressDead.value = globalPressDead
releaseDead.value = globalReleaseDead
  ↓
Step 4: Emit 'mode-changed' event with keyIds and 'global'
  ↓
Parent updates keyModeMap tracking (critical for overlay reactivity)
  ↓
Step 5: If overlay enabled, emit current global values
  ↓
Overlay shows values that were actually applied to keys
```

**Critical Implementation Details**:

1. **Fetch-First Pattern**: The button fetches current global settings from the keyboard before applying them. This ensures the UI always shows what's actually on the device, even if the user adjusted sliders without saving.

2. **Apply Before Switch**: Each key receives the individual travel and deadzone values BEFORE switching to global mode. This prevents a bug where keys would switch to global mode but retain their old deadzone values because global deadzones are only enforced at the global level, not per-key.

3. **NaN Validation**: After casting the SDK response to access `pressDead` and `releaseDead` fields (which aren't in the TypeScript type), the code validates all three values are valid numbers. This prevents silent failures from malformed SDK responses.

4. **UI State Synchronization**: After applying values to keys, the component updates its reactive refs to match what was actually written. This ensures the sliders and overlays show the device state, not stale UI state.

5. **mode-changed Event**: Essential for preventing overlay persistence bugs. When keys switch from single to global mode, the parent Performance page must immediately update its `keyModeMap` tracking so the computed `overlayData` knows to apply global values instead of per-key values. Without this event, keys would show stale single-mode overlay values until page refresh.

### Deadzone Linking

```
User clicks "Link Zones"
  ↓
toggleLinkDeadZones()
  ↓
Toggle deadZonesLinked state
  ↓
If linking: releaseDead = pressDead
  ↓
updateGlobalSettings()
```

When linked, the watcher ensures `releaseDead` always mirrors `pressDead`:

```typescript
watch([pressDead, releaseDead], () => {
  // Clamp travel to new bounds
  if (globalTravel.value < minTravel.value) {
    globalTravel.value = Number(minTravel.value.toFixed(2));
  } else if (globalTravel.value > maxTravel.value) {
    globalTravel.value = Number(maxTravel.value.toFixed(2));
  }
  
  // Sync deadzones if linked
  if (deadZonesLinked.value) {
    releaseDead.value = pressDead.value;
  }
});
```

---

## SDK Integration

### Methods Used

| SDK Method | Purpose | Parameters |
|------------|---------|------------|
| `getGlobalTouchTravel()` | Load current global settings | None |
| `setGlobalTouchTravel(param)` | Update global settings | `{ globalTouchTravel, pressDead, releaseDead }` |
| `getPerformanceMode(key)` | Check if key is in global mode | Key ID |
| `setPerformanceMode(key, mode, param)` | Set key to global mode | Key ID, 'global', 0 |
| `setDp(key, value)` | Set top deadzone for key | Key ID, pressDead value |
| `setDr(key, value)` | Set bottom deadzone for key | Key ID, releaseDead value |

### Batch Processing Strategy

The component uses batch processing for two critical operations:

1. **Finding Global-Mode Keys** (in `updateGlobalDeadZones()`):
   ```typescript
   const keyIds = props.layout.flat().map(keyInfo => keyInfo.physicalKeyValue || keyInfo.keyValue);
   const globalModeKeys = [];
   
   await processBatches(keyIds, async (keyId) => {
     const mode = await KeyboardService.getPerformanceMode(keyId);
     if (mode.touchMode === 'global') {
       globalModeKeys.push(keyId);
     }
   });
   ```

2. **Updating Deadzones for Global Keys**:
   ```typescript
   await processBatches(globalModeKeys, async (keyId) => {
     await Promise.all([
       KeyboardService.setDp(keyId, pressDead.value),
       KeyboardService.setDr(keyId, releaseDead.value),
     ]);
   });
   ```

The `processBatches` composable handles:
- Chunking keys into batches of 80
- Adding 100ms delay between batches
- Preventing SDK command flooding

---

## User Workflows

### Workflow 1: Set All Keys to Global 2.5mm Travel

1. User loads Performance page
2. GlobalTravel loads current settings (e.g., 2.0mm, 0.2mm deadzones)
3. User adjusts global travel slider to 2.5mm
4. Component calls `setGlobalTouchTravel({ globalTouchTravel: 2.5, pressDead: 0.2, releaseDead: 0.2 })`
5. If any keys are already in global mode, their deadzones are updated via batch processing
6. All keys currently in global mode now actuate at 2.5mm

### Workflow 2: Add Top Deadzone to Prevent Accidental Presses

1. User wants to prevent accidental key activation in the first 0.3mm of travel
2. User adjusts "Top Dead Zone" slider to 0.30mm
3. Watcher detects `pressDead` changed
4. `minTravel` computed updates to 0.3mm (since `max(0.1, 0.3) = 0.3`)
5. If `globalTravel` was less than 0.3mm, it auto-clamps to 0.3mm
6. `updateGlobalSettings()` calls SDK with new pressDead value
7. `updateGlobalDeadZones()` finds all global-mode keys and applies 0.3mm top deadzone

### Workflow 3: Link Deadzones for Symmetric Configuration

1. User has top deadzone at 0.2mm and bottom at 0.3mm (asymmetric)
2. User clicks "Link Zones" button
3. `toggleLinkDeadZones()` sets `deadZonesLinked = true`
4. Bottom deadzone immediately syncs to 0.2mm (matches top)
5. `updateGlobalSettings()` applies the change
6. User adjusts top deadzone to 0.4mm
7. Watcher detects change and syncs bottom to 0.4mm automatically
8. Both deadzones remain synchronized until user clicks "Unlink Zones"

### Workflow 4: Convert Selected Keys to Global Mode

1. User selects specific keys on keyboard grid (e.g., WASD for gaming)
2. "Select to Global" button becomes enabled
3. User clicks "Select to Global"
4. Component batches `setPerformanceMode(key, 'global', 0)` for each selected key
5. Current global travel and deadzones apply to newly converted keys
6. Overlay updates to show global settings on those keys

### Workflow 5: View Global Settings on Keyboard

1. User clicks "Show" button in header
2. `toggleOverlay()` sets `showOverlay = true`
3. Component emits `update-overlay` with `{ travel: '2.00', pressDead: '0.20', releaseDead: '0.20' }`
4. Parent component (Performance.vue) renders overlay on all global-mode keys
5. User adjusts global travel to 2.5mm
6. Overlay automatically updates to show `2.50` on all global keys
7. User clicks "Hide" button
8. Component emits `update-overlay` with `null`
9. Parent clears overlay display

---

## Automatic Clamping Behavior

The component implements automatic clamping to prevent invalid travel configurations:

### Scenario 1: Top Deadzone Increase

```
Initial: globalTravel = 1.8mm, pressDead = 0.2mm
User sets pressDead to 1.9mm
minTravel becomes max(0.1, 1.9) = 1.9mm
globalTravel (1.8) < minTravel (1.9)
Auto-clamp: globalTravel = 1.9mm
Result: Valid configuration maintained
```

### Scenario 2: Bottom Deadzone Increase

```
Initial: globalTravel = 3.5mm, profileMaxTravel = 4.0mm, releaseDead = 0.3mm
User sets releaseDead to 0.6mm
maxTravel becomes min(4.0, 4.0 - 0.6) = 3.4mm
globalTravel (3.5) > maxTravel (3.4)
Auto-clamp: globalTravel = 3.4mm
Result: Valid configuration maintained
```

### Scenario 3: Profile Change Reduces Max Travel

```
Initial: globalTravel = 3.8mm, profileMaxTravel = 4.0mm, releaseDead = 0.1mm
User switches to profile with maxTravel = 3.5mm
maxTravel becomes min(3.5, 3.5 - 0.1) = 3.4mm
globalTravel (3.8) > maxTravel (3.4)
Auto-clamp: globalTravel = 3.4mm
Result: Travel respects new profile limits
```

---

## Integration with Performance Page

GlobalTravel is one of three sub-components rendered by KeyTravel.vue:

```vue
<GlobalTravel 
  :layout="layout" 
  :selected-keys="selectedKeys" 
  :profile-max-travel="profileMaxTravel"
  @update-overlay="setOverlay" 
  @refresh-overlays="$emit('refresh-overlays')" 
/>
```

The Performance.vue page uses GlobalTravel within the KeyTravel container:

```
Performance.vue
  └─ KeyTravel.vue (container)
       ├─ GlobalTravel.vue (this component)
       ├─ SingleKeyTravel.vue
       └─ SwitchProfiles.vue
```

### Event Flow

```
GlobalTravel emits 'update-overlay'
  ↓
KeyTravel.setOverlay() forwards event
  ↓
Performance.vue receives event
  ↓
Performance.vue updates keyboard grid overlays
```

---

## Error Handling

The component handles errors gracefully:

1. **SDK Call Failures**: Wrapped in try-catch, silently fails to prevent UI disruption
2. **Invalid Values**: Clamping ensures values always stay within valid ranges
3. **Empty Global-Mode Key List**: `updateGlobalDeadZones()` exits early if no keys found
4. **Network/Connection Issues**: SDK errors don't break component state

Example error handling pattern:

```typescript
const loadGlobalSettings = async () => {
  try {
    const settings = await KeyboardService.getGlobalTouchTravel();
    if (!(settings instanceof Error)) {
      // Validate before applying
      if (settings.globalTouchTravel >= 0.1 && settings.globalTouchTravel <= 4.0) {
        globalTravel.value = Number(settings.globalTouchTravel.toFixed(2));
      }
      // Similar validation for pressDead and releaseDead
    }
  } catch (error) {
    // Silently maintain current UI state
  }
};
```

---

## Dependencies

### Internal Dependencies
- `@services/KeyboardService` - SDK wrapper for keyboard communication
- `@utils/keyMap` - Key ID to label mapping (imported but not actively used in component)
- `@/composables/useBatchProcessing` - Batch processing logic for SDK calls
- `@/types/types` - TypeScript interfaces (IDefKeyInfo)

### External Dependencies
- Vue 3 Composition API (`ref`, `computed`, `watch`, `onMounted`, `PropType`)

---

## Styling Notes

- **Component Height**: Fixed at 170px
- **Layout**: Horizontal layout for deadzone group with center link button
- **Colors**: Uses SCSS variables from `@styles/variables`
  - Primary color for headings and link button
  - Accent color for value displays
  - Background dark for inputs
- **Responsive**: Input groups have fixed widths (600px for sliders)
- **Disabled States**: Visual feedback with reduced opacity and cursor changes

---

## Known Limitations

1. **Change Detection for Deadzones**: Only updates deadzones for global-mode keys when deadzone values change. Travel-only changes don't trigger deadzone updates (intentional optimization).

2. **Batch Operation Performance**: Updating deadzones for 100+ keys can take several seconds due to batch processing delays.

3. **No Undo/Redo**: Changes apply immediately with no rollback capability.

4. **Overlay Timing**: 300ms delay after mode conversion before re-showing overlay (intentional to allow state to settle).

---

## Future Enhancements

1. **Progress Indicator**: Show batch processing progress when updating many keys
2. **Preset Configurations**: Quick-select buttons for common deadzone settings (e.g., "No Deadzones", "Gaming", "Typing")
3. **Visual Travel Graph**: Show visual representation of deadzones and actuation point
4. **Bulk Mode Conversion**: "Set All to Global" button to convert entire keyboard at once
5. **Asymmetric Deadzone Presets**: Quick presets for common asymmetric configurations

---

## Related Documentation

- [Performance.md](./Performance.md) - Parent page documentation
- [SingleKeyTravel.md](./SingleKeyTravel.md) - Per-key travel configuration
- [KeyTravel.md](./KeyTravel.md) - Container component
- [SwitchProfiles.md](./SwitchProfiles.md) - Profile management
- [SDK_REFERENCE.md](../SDK_REFERENCE.md) - Complete SDK API reference
