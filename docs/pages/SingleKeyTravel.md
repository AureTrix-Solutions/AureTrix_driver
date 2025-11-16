# SingleKeyTravel Component

**Component Path:** `src/components/performance/SingleKeyTravel.vue`

**Parent Component:** Performance.vue (via KeyTravel.vue)

**Type:** Performance Sub-Component

---

## Overview

SingleKeyTravel is a configuration component that manages per-key travel distance and deadzone settings for individual keyboard keys operating in "single mode". Unlike GlobalTravel which applies one setting to all global-mode keys, SingleKeyTravel allows users to configure unique travel distances and deadzones for specific keys or groups of keys.

The component automatically loads settings from the first selected key, applies changes to all selected keys in a batch, and provides visual overlays to display per-key configurations on the keyboard grid.

---

## Key Features

1. **Per-Key Travel Distance Control**
   - Individual travel distance for selected keys
   - Range: 0.1mm - 4.0mm (or profile max travel, dynamically clamped by deadzones)
   - Fine-tune adjustment with +/- buttons
   - Direct numeric input for precise values
   - Disabled when no keys selected

2. **Per-Key Deadzone Configuration**
   - **Top Dead Zone**: Defines minimum distance before actuation
   - **Bottom Dead Zone**: Defines minimum distance from bottom before release
   - Each deadzone ranges from 0.0mm to 1.0mm
   - Link/Unlink functionality to synchronize both deadzones

3. **Automatic Mode Switching**
   - Automatically sets keys to "single" performance mode when applying settings
   - No manual mode switching required
   - Seamless conversion from global to single mode

4. **Multi-Key Batch Application**
   - Apply same settings to multiple selected keys simultaneously
   - Batch processing prevents hardware overwhelm
   - All selected keys receive identical travel and deadzone values

5. **Dynamic Travel Clamping**
   - Travel automatically adjusts when deadzones change
   - Ensures: `minTravel = max(0.1, topDeadZone)`
   - Ensures: `maxTravel = min(profileMaxTravel, profileMaxTravel - bottomDeadZone)`
   - Prevents invalid configurations

6. **Visual Overlay System**
   - Show/Hide button toggles per-key overlay display
   - Displays unique travel and deadzone values for each selected key
   - Auto-refreshes when selection changes

7. **Selection-Reactive Loading**
   - Automatically loads settings from first selected key when selection changes
   - Updates UI to reflect current key configuration
   - Resets to defaults when selection cleared

---

## User Interface Elements

### Header Section
- **Title**: "Single Travel" in primary color
- **Show/Hide Button**: Toggles overlay visibility for selected keys

### Travel Row
- **Label**: "Trigger Travel (mm)"
- **Slider**: Visual range control with min/max value displays
- **Numeric Input**: Direct value entry
- **+/- Buttons**: Fine adjustment controls (±0.01mm)
- **All controls disabled when `selectedKeys.length === 0`**

### Deadzone Group (Horizontal Layout)
- **Top Dead Zone Input**
  - Label: "Top Dead Zone (mm)"
  - Slider with 0.00 - 1.00 range
  - Numeric input with +/- buttons
  - Disabled when no keys selected
  
- **Link Button** (Center)
  - Text: "Link Zones" or "Unlink Zones"
  - Synchronizes top and bottom deadzones when linked
  - Disabled when no keys selected
  
- **Bottom Dead Zone Input**
  - Label: "Bottom Dead Zone (mm)"
  - Slider with 0.00 - 1.00 range
  - Numeric input with +/- buttons
  - Disabled when no keys selected OR when zones are linked

---

## Technical Implementation

### Props

```typescript
interface Props {
  selectedKeys: IDefKeyInfo[];    // Currently selected keys (reactive)
  layout: IDefKeyInfo[][];        // Full keyboard layout
  baseLayout: any;                // Base layout configuration (unused in current implementation)
  profileMaxTravel: number;       // Maximum travel from active switch profile
}
```

### Emits

```typescript
emits: [
  'update-single-overlay',   // Sends per-key overlay data or null/{}
  'update-overlay'           // Clears global overlay when switching to single mode
]
```

### Core State

```typescript
const singleKeyTravel = ref(2.0);        // Per-key travel distance (mm)
const topDeadZone = ref(0.0);            // Top deadzone (mm)
const bottomDeadZone = ref(0.0);         // Bottom deadzone (mm)
const deadZonesLinked = ref(false);      // Link state for deadzones
const showOverlay = ref(false);          // Overlay visibility toggle
const prevSingleKeyTravel = ref(2.0);    // Previous travel for change detection
const prevTopDeadZone = ref(0.0);        // Previous top deadzone for change detection
const prevBottomDeadZone = ref(0.0);     // Previous bottom deadzone for change detection
```

### Computed Properties

```typescript
const minTravel = computed(() => Math.max(0.1, topDeadZone.value));
const maxTravel = computed(() => 
  Math.min(props.profileMaxTravel, props.profileMaxTravel - bottomDeadZone.value)
);
```

---

## Data Flow

### Loading Single Key Settings

```
User selects key(s) on keyboard grid
  ↓
Selection watcher triggers
  ↓
loadSingleKeyTravel() - loads from FIRST selected key
  ↓
KeyboardService.getSingleTravel(physicalKeyValue)
  ↓
SDK returns travel value as STRING (e.g., "2.05")
  ↓
Convert to number and validate (0.1 - 4.0 range)
  ↓
Update singleKeyTravel.value and prevSingleKeyTravel
  ↓
loadDeadZones() - loads from same first key
  ↓
KeyboardService.getDpDr(physicalKeyValue)
  ↓
SDK returns { pressDead, releaseDead }
  ↓
Update topDeadZone and bottomDeadZone state
```

**Important**: The component loads settings from the **first selected key** only. When multiple keys are selected, the first key's configuration becomes the "template" that will be applied to all selected keys when the user makes changes.

### Updating Single Key Settings

```
User adjusts slider/input
  ↓
updateSingleKeyTravel() or updateDeadZones()
  ↓
Both call unified updateSingleKeyAll() function
  ↓
Check if travel or deadzones changed (compare with prev values)
  ↓
If no changes: exit early
  ↓
Map selectedKeys to physical key values
  ↓
processBatches: For each key
  ├─ setPerformanceMode(key, 'single', 0)  ← Force single mode
  ├─ If travel changed: setSingleTravel(key, singleKeyTravel)
  └─ If deadzones changed: setDp(key, topDead) & setDr(key, bottomDead)
  ↓
Update prev values for future change detection
  ↓
Clear overlays (emit null)
  ↓
If overlay enabled: Re-emit after 300ms to refresh display
```

### Deadzone Linking

```
User clicks "Link Zones"
  ↓
toggleLinkDeadZones()
  ↓
Toggle deadZonesLinked state
  ↓
If linking: bottomDeadZone = topDeadZone
  ↓
updateDeadZones() applies to all selected keys
```

When linked, adjusting top deadzone automatically updates bottom to match:

```typescript
const adjustDeadZone = (delta: number, type: 'top' | 'bottom') => {
  if (deadZonesLinked.value && type === 'bottom') return; // Block bottom adjustments
  
  let newValue = type === 'top' ? topDeadZone.value + delta : bottomDeadZone.value + delta;
  newValue = Math.min(Math.max(newValue, 0), 1.0);
  
  if (type === 'top') {
    topDeadZone.value = Number(newValue.toFixed(2));
  } else {
    bottomDeadZone.value = Number(newValue.toFixed(2));
  }
  
  // Sync other deadzone if linked
  if (deadZonesLinked.value) {
    const otherType = type === 'top' ? 'bottom' : 'top';
    (otherType === 'top' ? topDeadZone : bottomDeadZone).value = Number(newValue.toFixed(2));
  }
  
  updateDeadZones();
};
```

---

## SDK Integration

### Methods Used

| SDK Method | Purpose | Returns |
|------------|---------|---------|
| `getSingleTravel(key)` | Load travel distance for specific key | `number` (as string "2.05") |
| `setSingleTravel(key, value)` | Set travel distance for specific key | `number` |
| `getDpDr(key)` | Load deadzones for specific key | `{ pressDead, releaseDead }` |
| `setDp(key, value)` | Set top deadzone for specific key | `{ pressDead }` |
| `setDr(key, value)` | Set bottom deadzone for specific key | `{ releaseDead }` |
| `setPerformanceMode(key, mode, param)` | Set key to single mode | N/A |

### Batch Processing Strategy

All updates to selected keys use batch processing to prevent hardware overwhelm:

```typescript
const updateSingleKeyAll = async () => {
  if (props.selectedKeys.length === 0) return;
  
  const travelChanged = singleKeyTravel.value !== prevSingleKeyTravel.value;
  const deadChanged = topDeadZone.value !== prevTopDeadZone.value || 
                      bottomDeadZone.value !== prevBottomDeadZone.value;
  
  if (!travelChanged && !deadChanged) return; // Optimization: exit early
  
  const keys = props.selectedKeys.map(key => ({
    physicalKeyValue: key.physicalKeyValue || key.keyValue,
  }));
  
  await processBatches(keys, async (physicalKeyValue) => {
    await KeyboardService.setPerformanceMode(physicalKeyValue, 'single', 0);
    
    if (travelChanged) {
      await KeyboardService.setSingleTravel(physicalKeyValue, singleKeyTravel.value);
    }
    
    if (deadChanged) {
      await KeyboardService.setDp(physicalKeyValue, topDeadZone.value);
      await KeyboardService.setDr(physicalKeyValue, bottomDeadZone.value);
    }
  });
  
  // Update tracking values
  prevSingleKeyTravel.value = singleKeyTravel.value;
  prevTopDeadZone.value = topDeadZone.value;
  prevBottomDeadZone.value = bottomDeadZone.value;
};
```

---

## User Workflows

### Workflow 1: Configure Gaming Keys (WASD) for Fast Actuation

1. User clicks "W" key on keyboard grid → key highlights
2. User holds Shift and clicks "A", "S", "D" → all four keys selected
3. Component loads settings from "W" key (first selected)
4. User sees current travel (e.g., 2.0mm) in slider
5. User drags slider to 1.2mm for faster actuation
6. `updateSingleKeyAll()` batches updates to W, A, S, D:
   - Sets each key to single mode
   - Sets each key's travel to 1.2mm
7. All four keys now actuate at 1.2mm instead of 2.0mm

### Workflow 2: Add Top Deadzone to Prevent Resting Finger Triggers

1. User rests fingers on home row keys (A, S, D, F)
2. Keys accidentally trigger at 0.0mm due to finger pressure
3. User selects all four home row keys
4. User adjusts "Top Dead Zone" slider to 0.3mm
5. Watcher clamps travel if needed (ensures travel ≥ 0.3mm)
6. Component batches updates:
   - Sets mode to single
   - Applies 0.3mm top deadzone to all selected keys
7. Keys now require 0.3mm depression before they can trigger
8. Resting fingers no longer cause accidental presses

### Workflow 3: Configure Spacebar with Linked Symmetric Deadzones

1. User selects spacebar (large key, prone to edge presses)
2. Component loads spacebar's current settings
3. User clicks "Link Zones" button
4. User sets top deadzone to 0.4mm
5. Bottom deadzone automatically syncs to 0.4mm
6. Travel auto-clamps to ensure valid range
7. Spacebar now has 0.4mm buffer zones at top and bottom
8. Prevents edge activation and accidental releases

### Workflow 4: Apply Preset to Multiple Keys

1. User configures one key perfectly (e.g., "Q" at 1.8mm, 0.2mm top/bottom dead)
2. User wants same settings on other keys
3. User selects "Q" (already configured) + other keys (W, E, R, T)
4. Component loads "Q" settings (first selected key)
5. User clicks "Show" to see current overlay
6. Without changing any values, simply re-selecting triggers no update (change detection prevents redundant SDK calls)
7. To force apply: User adjusts slider slightly (e.g., 1.81mm) then back to 1.80mm
8. All selected keys receive the same configuration

**Better approach**: Adjust any value slightly to trigger update, then adjust back if needed.

### Workflow 5: View Per-Key Settings with Overlay

1. User has configured different travels for different keys
2. User selects a configured key (e.g., "A")
3. User clicks "Show" button
4. Component emits `update-single-overlay` with `{}`
5. Parent component (Performance.vue) reads travel and deadzone from keyboard
6. Overlay displays unique values for each selected key
7. User selects different key (e.g., "B")
8. Selection watcher reloads settings from "B"
9. Overlay auto-refreshes to show "B" key's values
10. User clicks "Hide" button
11. Overlay clears from display

---

## Automatic Clamping Behavior

The component implements automatic clamping via watchers to maintain valid configurations:

### Top Deadzone Watcher

```typescript
watch(topDeadZone, (newVal, oldVal) => {
  if (singleKeyTravel.value < minTravel.value) {
    singleKeyTravel.value = Number(minTravel.value.toFixed(2));
  }
});
```

**Scenario**: User has travel at 0.8mm, then sets top deadzone to 1.0mm
- `minTravel` becomes 1.0mm (since `max(0.1, 1.0) = 1.0`)
- Watcher detects `singleKeyTravel (0.8) < minTravel (1.0)`
- Auto-clamps `singleKeyTravel` to 1.0mm
- Result: Valid configuration (travel can't be less than top deadzone)

### Bottom Deadzone Watcher

```typescript
watch(bottomDeadZone, (newVal, oldVal) => {
  if (!deadZonesLinked.value) { // Only clamp if unlinked
    if (singleKeyTravel.value > maxTravel.value) {
      singleKeyTravel.value = Number(maxTravel.value.toFixed(2));
    }
  }
});
```

**Scenario**: User has travel at 3.8mm (profile max 4.0mm), then sets bottom deadzone to 0.5mm
- `maxTravel` becomes 3.5mm (since `min(4.0, 4.0 - 0.5) = 3.5`)
- Watcher detects `singleKeyTravel (3.8) > maxTravel (3.5)`
- Auto-clamps `singleKeyTravel` to 3.5mm
- Result: Valid configuration (travel can't extend into bottom deadzone)

### Deadzone Adjustment Clamping

When user adjusts deadzones, the `updateDeadZones()` function performs immediate clamping:

```typescript
const updateDeadZones = async () => {
  if (deadZonesLinked.value && topDeadZone.value !== bottomDeadZone.value) {
    bottomDeadZone.value = topDeadZone.value; // Sync if linked
  }
  
  // Clamp travel to new bounds
  if (singleKeyTravel.value < minTravel.value) {
    singleKeyTravel.value = Number(minTravel.value.toFixed(2));
  } else if (singleKeyTravel.value > maxTravel.value) {
    singleKeyTravel.value = Number(maxTravel.value.toFixed(2));
  }
  
  await updateSingleKeyAll();
};
```

---

## Selection Change Behavior

The component reacts to selection changes via a deep watcher:

```typescript
watch(() => props.selectedKeys, async (newKeys) => {
  await loadSingleKeyTravel();
  await loadDeadZones();
}, { deep: true });
```

### Behavior Matrix

| Scenario | Action |
|----------|--------|
| No keys selected → Key selected | Load settings from selected key |
| Key A selected → Key B selected | Load settings from Key B (replaces A's values in UI) |
| Keys A+B selected → Keys C+D selected | Load settings from Key C (first in new selection) |
| Keys selected → No keys selected | Reset to defaults (2.0mm travel, 0.2mm deadzones) |
| Same keys selected (re-click) | No reload triggered (deep watch doesn't detect change) |

**Important**: When multiple keys are selected, only the **first key** determines what values display in the UI. Changes will apply to **all selected keys**, not just the first one.

---

## Error Handling

### Load Failures

When loading settings fails (key not configured, SDK error, etc.), component falls back to defaults:

```typescript
const loadSingleKeyTravel = async () => {
  if (props.selectedKeys.length === 0) {
    singleKeyTravel.value = 2.0;
    prevSingleKeyTravel.value = 2.0;
    return;
  }
  
  const physicalKeyValue = props.selectedKeys[0].physicalKeyValue || props.selectedKeys[0].keyValue;
  
  try {
    const result = await KeyboardService.getSingleTravel(physicalKeyValue);
    if (!(result instanceof Error)) {
      const loadedValue = Number(result); // SDK returns string
      if (loadedValue >= 0.1 && loadedValue <= 4.0) {
        singleKeyTravel.value = Number(loadedValue.toFixed(2));
        prevSingleKeyTravel.value = singleKeyTravel.value;
        return; // Success path
      }
    }
  } catch (error) {
    // Fall through to default
  }
  
  // Default fallback
  singleKeyTravel.value = 2.0;
  prevSingleKeyTravel.value = 2.0;
};
```

### Update Failures

Update failures are caught but don't interrupt the user experience:

```typescript
try {
  await processBatches(keys, async (physicalKeyValue) => {
    await KeyboardService.setPerformanceMode(physicalKeyValue, 'single', 0);
    // ...additional SDK calls
  });
} catch (error) {
  // Silent failure - UI state remains consistent
}
```

---

## Integration with Performance Page

SingleKeyTravel is rendered within KeyTravel.vue:

```vue
<SingleKeyTravel 
  :selected-keys="selectedKeys" 
  :layout="layout" 
  :base-layout="baseLayout" 
  :profile-max-travel="profileMaxTravel"
  @update-single-overlay="setSingleOverlay" 
  @refresh-overlays="$emit('refresh-overlays')" 
/>
```

### Component Hierarchy

```
Performance.vue
  └─ KeyTravel.vue (container)
       ├─ GlobalTravel.vue
       ├─ SingleKeyTravel.vue (this component)
       └─ SwitchProfiles.vue
```

### Event Flow

```
SingleKeyTravel emits 'update-single-overlay'
  ↓
KeyTravel.setSingleOverlay() forwards event
  ↓
Performance.vue receives event
  ↓
Performance.vue updates keyboard grid overlays for selected keys
```

---

## Dependencies

### Internal Dependencies
- `@services/KeyboardService` - SDK wrapper for keyboard communication
- `@utils/keyMap` - Key ID to label mapping
- `@/composables/useBatchProcessing` - Batch processing for SDK calls
- `@/types/types` - TypeScript interfaces (IDefKeyInfo)

### External Dependencies
- Vue 3 Composition API (`ref`, `watch`, `computed`, `PropType`, `defineComponent`)

---

## Styling Notes

- **Component Height**: Fixed at 170px (matches GlobalTravel for visual consistency)
- **Layout**: Horizontal layout for deadzone group with center link button
- **Colors**: Uses SCSS variables from `@styles/variables`
  - Primary color for headings
  - Accent color for value displays
  - Background dark for inputs
- **Disabled States**: 
  - All controls disabled when `selectedKeys.length === 0`
  - Bottom deadzone controls disabled when `deadZonesLinked === true`
  - Visual feedback with opacity and cursor changes

---

## Known Limitations

1. **Multi-Key Display Ambiguity**: When multiple keys with different settings are selected, only the first key's values display. Users might not realize other selected keys have different values.

2. **No Bulk Configuration Review**: No way to view all selected keys' current settings before applying changes.

3. **Change Detection Prevents Intentional Re-Application**: If user selects keys that already have the desired values, no update occurs (optimization prevents redundant SDK calls).

4. **String-to-Number Conversion**: SDK returns travel as string (e.g., "2.05"). Component must explicitly convert with `Number()`.

5. **No Validation Feedback**: Invalid values are clamped silently without notifying user.

6. **Overlay Refresh Delay**: 300ms delay after updates before overlay re-renders (intentional, allows state to settle).

---

## Future Enhancements

1. **Multi-Key Settings Preview**: Table showing current settings for all selected keys before applying changes

2. **Incremental Application**: Option to apply different travel values across selected keys (e.g., gradient from 1.5mm to 2.5mm)

3. **Profile Templates**: Save and recall common single-key configurations as presets

4. **Visual Feedback**: Highlight which selected keys have different current values vs. the displayed value

5. **Undo/Redo**: Allow reverting changes to previous configurations

6. **Validation Warnings**: Notify user when values are auto-clamped

7. **Copy Settings**: "Copy from Key" button to load settings from a specific key by clicking it

---

## Related Documentation

- [Performance.md](./Performance.md) - Parent page documentation
- [GlobalTravel.md](./GlobalTravel.md) - Global travel configuration
- [KeyTravel.md](./KeyTravel.md) - Container component
- [SwitchProfiles.md](./SwitchProfiles.md) - Profile management
- [SDK_REFERENCE.md](../SDK_REFERENCE.md) - Complete SDK API reference
