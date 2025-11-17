# RapidTrigger Page Documentation

## Overview
The RapidTrigger page provides advanced configuration for rapid trigger functionality on hall effect keyboards. Rapid trigger allows keys to register new inputs before fully releasing, enabling faster re-actuation for gaming and high-speed typing. The page offers precise control over initial trigger travel, re-trigger distances, reset distances, and deadzones with real-time visual overlays.

## Purpose
- Configure rapid trigger settings for optimal responsiveness
- Fine-tune initial actuation points and re-trigger distances
- Adjust top and bottom deadzones to prevent accidental key presses
- Batch adjust keys by category (WASD, letters, numbers, etc.)
- Visualize all RT settings overlaid on keyboard
- Link paired settings for synchronized adjustments

## Key Features

### 1. **Five-Slider Configuration System**
- **Initial Trigger Travel**: First actuation distance (0.1mm - maxTravel)
- **Key Re-Trigger**: Distance traveled upward before key re-triggers (0.1mm - 4.0mm)
- **Key Reset**: Distance traveled upward before key fully resets (0.1mm - 4.0mm)
- **Top Deadzone**: Dead zone at the top of key travel (0.0mm - 1.0mm)
- **Bottom Deadzone**: Dead zone at the bottom of key travel (0.0mm - 1.0mm)

### 2. **Link Functionality**
- **RT Travel Linking**: Link Key Re-Trigger and Key Reset sliders
  - When linked, both values move together
  - Ensures consistent press/release behavior
  - Syncs bidirectionally via watchers
- **Deadzone Linking**: Link Top and Bottom Deadzone sliders
  - When linked, both deadzones stay equal
  - Simplifies symmetric deadzone configuration
  - Syncs bidirectionally via watchers

### 3. **Automatic Clamping**
- **Initial Trigger Travel** automatically adjusts when deadzones change
- Minimum value: `Math.max(0.1, pressDeadzone)`
- Maximum value: `Math.min(profileMaxTravel, profileMaxTravel - releaseDeadzone)`
- Updates keyboard when clamping occurs
- Prevents invalid configurations

### 4. **Visual RT Overlays**
- Real-time display of all 5 RT values on keys
- Color-coded overlay positions:
  - **Top Left**: Key Re-Trigger (red/pink)
  - **Top Right**: Key Reset (blue)
  - **Center**: Initial Trigger Travel (white)
  - **Bottom Left**: Top Deadzone (yellow)
  - **Bottom Right**: Bottom Deadzone (orange)

### 5. **Quick Selection Presets**
- **Select All**: Select entire keyboard
- **Select WASD**: Gaming keys
- **Select Letters**: All alphabetic keys
- **Select Numbers**: Number row (1-0)
- **Select None**: Clear selection

### 6. **Batch Processing**
- Process large key selections without overwhelming hardware
- Automatic batching with configurable size (80 keys default)
- Delay mechanism prevents command flooding
- Changes take effect immediately

### 7. **Remapped Label Display**
- Shows current key mappings (not just physical labels)
- Respects active layer mappings
- Helps identify remapped keys during adjustment

### 8. **Set to Global Button**
- Converts selected RT keys back to global mode
- Applies current global settings (travel + deadzones) before mode switch
- Ensures deadzones are properly configured on converted keys
- Clears RT-specific overlays automatically
- Disabled when no keys are selected
- Syncs UI sliders with applied device values

## User Interface Elements

### Title & Notification Bar
- Page title: "Rapid Trigger Settings"
- Notification bar for success/error messages
- Auto-dismiss notifications after 5 seconds

### Keyboard Grid
- Visual keyboard layout
- Selected keys highlighted with accent glow
- RT overlays display 5 values per key:
  - Top-left: Re-trigger distance (red/pink)
  - Top-right: Reset distance (blue)
  - Center: Initial trigger travel (white)
  - Bottom-left: Top deadzone (yellow)
  - Bottom-right: Bottom deadzone (orange)

### Selection Buttons (Left Sidebar)
- **Select All**: Toggle all keys
- **Select WASD**: Gaming preset
- **Select Letters**: A-Z keys
- **Select Numbers**: 1-0 keys
- **Select None**: Clear selection

### Settings Panel (Bottom)
- **Initial Trigger Travel Slider**
  - Dynamic min/max based on deadzones
  - Updates when deadzones change
  - Displays current min/max values
  
- **RT Travel Group** (horizontal layout)
  - Key Re-Trigger slider (left)
  - Link button (center)
  - Key Reset slider (right)
  
- **Deadzone Group** (horizontal layout)
  - Top Deadzone slider (left)
  - Link button (center)
  - Bottom Deadzone slider (right)

### Control Elements
- **Sliders**: Drag to adjust values (0.01mm precision)
- **Number Inputs**: Direct value entry
- **+/- Buttons**: Fine adjustment (±0.01mm)
- **Link Buttons**: Toggle synchronized adjustments
  - Shows "Link" when unlinked
  - Shows "Unlink" when linked
- **Set to Global Button**: Converts selected RT keys back to global mode
  - Located in settings panel area
  - Disabled when no keys selected
  - Applies global travel and deadzones before mode switch
  - Shows success/error notifications

## Technical Implementation

### Component Setup
```vue
<script lang="ts">
setup() {
  const selectedKeys = ref<IDefKeyInfo[]>([]);
  const overlayData = ref<{ 
    [key: number]: { 
      travel: string;    // Initial trigger travel
      press: string;     // Re-trigger
      release: string;   // Reset
      pressDead: string; // Top deadzone
      releaseDead: string; // Bottom deadzone
    } 
  }>({});
  const { processBatches } = useBatchProcessing();
  
  // Settings
  const initialActuation = ref(2.0);
  const pressTravel = ref(0.1);      // Re-trigger
  const releaseTravel = ref(0.1);    // Reset
  const pressDeadzone = ref(0.1);    // Top deadzone
  const releaseDeadzone = ref(0.1);  // Bottom deadzone
  
  // Link states
  const rtTravelLinked = ref(false);
  const deadZonesLinked = ref(false);
  
  ...
}
</script>
```

### Core Functionality

#### 1. **Update All Settings** (Batch Processing)
```typescript
const updateAllSettings = async () => {
  if (selectedKeys.value.length === 0) return;
  
  const keys = selectedKeys.value.map(key => 
    key.physicalKeyValue || key.keyValue
  );
  
  try {
    // Batch process all selected keys
    await processBatches(keys, async (physicalKeyValue) => {
      // Enable RT mode
      await KeyboardService.setPerformanceMode(physicalKeyValue, 'rt', 0);
      
      // Set all 5 RT parameters
      await KeyboardService.setSingleTravel(
        physicalKeyValue, 
        Number(initialActuation.value)
      );
      await KeyboardService.setRtPressTravel(
        physicalKeyValue, 
        Number(pressTravel.value)
      );
      await KeyboardService.setRtReleaseTravel(
        physicalKeyValue, 
        Number(releaseTravel.value)
      );
      await KeyboardService.setDp(
        physicalKeyValue, 
        Number(pressDeadzone.value)
      );
      await KeyboardService.setDr(
        physicalKeyValue, 
        Number(releaseDeadzone.value)
      );
    });
    
    // Update overlays
    setTimeout(() => updateOverlayData(), 500);
  } catch (error) {
    console.error('Failed to update RT settings:', error);
    setNotification('Failed to update rapid trigger settings', true);
  }
};
```

#### 2. **Computed Min/Max for Initial Actuation**
```typescript
const minInitialActuation = computed(() => {
  // Can't be less than top deadzone
  return Math.max(0.1, pressDeadzone.value);
});

const maxInitialActuation = computed(() => {
  // Can't exceed max travel minus bottom deadzone
  return Math.min(
    profileMaxTravel.value, 
    profileMaxTravel.value - releaseDeadzone.value
  );
});
```

#### 3. **Watcher for Deadzone Clamping**
```typescript
watch([pressDeadzone, releaseDeadzone], () => {
  let clamped = false;
  
  // Clamp initial actuation to valid range
  if (initialActuation.value < minInitialActuation.value) {
    initialActuation.value = Number(minInitialActuation.value.toFixed(2));
    clamped = true;
  } else if (initialActuation.value > maxInitialActuation.value) {
    initialActuation.value = Number(maxInitialActuation.value.toFixed(2));
    clamped = true;
  }
  
  // If clamped, update keyboard keys
  if (clamped && selectedKeys.value.length > 0) {
    updateAllSettings();
  }
});
```

#### 4. **RT Travel Linking**
```typescript
// Watcher syncs when linked
watch([pressTravel, releaseTravel], () => {
  if (rtTravelLinked.value) {
    releaseTravel.value = pressTravel.value;
  }
});

// Toggle function with clamping
const toggleLinkRtTravel = () => {
  rtTravelLinked.value = !rtTravelLinked.value;
  if (rtTravelLinked.value) {
    // Sync to smaller value to stay within bounds
    const targetValue = Math.min(
      pressTravel.value, 
      releaseTravel.value, 
      maxPressTravel.value, 
      maxReleaseTravel.value
    );
    pressTravel.value = Number(targetValue.toFixed(2));
    releaseTravel.value = Number(targetValue.toFixed(2));
    updateAllSettings();
  }
};
```

#### 5. **Deadzone Linking**
```typescript
// Watcher syncs when linked (via combined deadzone watcher)
const toggleLinkDeadZones = () => {
  deadZonesLinked.value = !deadZonesLinked.value;
  if (deadZonesLinked.value) {
    // Sync to smaller value
    const targetValue = Math.min(
      pressDeadzone.value, 
      releaseDeadzone.value, 
      1.0
    );
    pressDeadzone.value = Number(targetValue.toFixed(2));
    releaseDeadzone.value = Number(targetValue.toFixed(2));
    updateAllSettings();
  }
};
```

#### 6. **Load Settings from First Selected Key**
```typescript
const loadAllSettings = async () => {
  if (selectedKeys.value.length === 0) {
    // Reset to defaults
    initialActuation.value = 2.0;
    pressTravel.value = 0.1;
    releaseTravel.value = 0.1;
    pressDeadzone.value = 0.1;
    releaseDeadzone.value = 0.1;
    return;
  }
  
  const keyId = selectedKeys.value[0].physicalKeyValue || 
                selectedKeys.value[0].keyValue;
  
  try {
    // Fetch all settings in parallel
    const [initialResult, rtResult, dzResult] = await Promise.all([
      KeyboardService.getSingleTravel(keyId),
      KeyboardService.getRtTravel(keyId),
      KeyboardService.getDpDr(keyId)
    ]);
    
    // Parse initial actuation (SDK returns string)
    if (!(initialResult instanceof Error)) {
      const travelNum = Number(initialResult);
      if (!isNaN(travelNum)) {
        initialActuation.value = Number(travelNum.toFixed(2));
      }
    }
    
    // Parse RT travel
    if (!(rtResult instanceof Error)) {
      pressTravel.value = Number(rtResult.pressTravel.toFixed(2));
      releaseTravel.value = Number(rtResult.releaseTravel.toFixed(2));
    }
    
    // Parse deadzones
    if (!(dzResult instanceof Error)) {
      const pressDead = Number(dzResult.pressDead);
      const releaseDead = Number(dzResult.releaseDead);
      if (!isNaN(pressDead)) {
        pressDeadzone.value = Number(pressDead.toFixed(2));
      }
      if (!isNaN(releaseDead)) {
        releaseDeadzone.value = Number(releaseDead.toFixed(2));
      }
    }
  } catch (error) {
    console.error('Failed to load RT settings:', error);
  }
};
```

#### 7. **Update Overlay Data**
```typescript
const updateOverlayData = async () => {
  try {
    const keyIds = layout.value.flat().map(keyInfo => 
      keyInfo.physicalKeyValue || keyInfo.keyValue
    );
    
    // Batch fetch all RT settings
    await processBatches(keyIds, async (keyId) => {
      const initialActuationResult = await KeyboardService.getSingleTravel(keyId);
      const rtResult = await KeyboardService.getRtTravel(keyId);
      const dzResult = await KeyboardService.getDpDr(keyId);
      
      if (!(initialActuationResult instanceof Error) && 
          !(rtResult instanceof Error) && 
          !(dzResult instanceof Error)) {
        
        overlayData.value[keyId] = {
          travel: Number(initialActuationResult).toFixed(2),  // Center (cyan)
          press: Number(rtResult.pressTravel).toFixed(2),     // Top-left (red/pink)
          release: Number(rtResult.releaseTravel).toFixed(2), // Top-right (blue)
          pressDead: Number(dzResult.pressDead).toFixed(2),   // Bottom-left (green)
          releaseDead: Number(dzResult.releaseDead).toFixed(2) // Bottom-right (orange)
        };
      }
    });
  } catch (error) {
    console.error('Failed to update overlay data:', error);
  }
};
```

#### 8. **Adjust Functions with Link Support**
```typescript
const adjustPress = (delta: number) => {
  const newValue = Math.min(
    Math.max(pressTravel.value + delta, 0.1), 
    maxPressTravel.value
  );
  pressTravel.value = Number(newValue.toFixed(2));
  
  // Sync when linked
  if (rtTravelLinked.value) {
    releaseTravel.value = pressTravel.value;
  }
  updateAllSettings();
};

const adjustDeadzone = (delta: number, type: 'press' | 'release') => {
  // Skip release adjustment when linked
  if (deadZonesLinked.value && type === 'release') return;
  
  let newValue = type === 'press' 
    ? pressDeadzone.value + delta 
    : releaseDeadzone.value + delta;
  newValue = Math.min(Math.max(newValue, 0), 1.0);
  
  if (type === 'press') {
    pressDeadzone.value = Number(newValue.toFixed(2));
  } else {
    releaseDeadzone.value = Number(newValue.toFixed(2));
  }
  
  // Sync when linked
  if (deadZonesLinked.value) {
    const otherType = type === 'press' ? 'release' : 'press';
    (otherType === 'press' ? pressDeadzone : releaseDeadzone).value = 
      Number(newValue.toFixed(2));
  }
  updateAllSettings();
};
```

#### 9. **Set to Global Function**
```typescript
const setToGlobal = async () => {
  if (selectedKeys.value.length === 0) {
    setNotification('Please select keys first', true);
    return;
  }

  const keys = selectedKeys.value.map(key => 
    key.physicalKeyValue || key.keyValue
  );
  
  try {
    // Step 1: Fetch current global settings from keyboard
    const globalSettingsResult = await KeyboardService.getGlobalTouchTravel();
    if (globalSettingsResult instanceof Error) {
      throw new Error('Failed to fetch global settings');
    }
    
    // Step 2: Extract and validate global values
    const globalSettings = globalSettingsResult as any;
    const globalTravel = Number(globalSettings.globalTouchTravel);
    const globalPressDead = Number(globalSettings.pressDead);
    const globalReleaseDead = Number(globalSettings.releaseDead);
    
    if (isNaN(globalTravel) || isNaN(globalPressDead) || isNaN(globalReleaseDead)) {
      throw new Error('Invalid global settings: one or more values are not valid numbers');
    }
    
    // Step 3: Apply global values to each key BEFORE switching mode
    await processBatches(keys, async (physicalKeyValue) => {
      // Set travel distance
      const travelResult = await KeyboardService.setSingleTravel(
        physicalKeyValue, 
        globalTravel
      );
      if (travelResult instanceof Error) {
        throw new Error(`Failed to set travel for key ${physicalKeyValue}`);
      }
      
      // Set top deadzone
      const dpResult = await KeyboardService.setDp(
        physicalKeyValue, 
        globalPressDead
      );
      if (dpResult instanceof Error) {
        throw new Error(`Failed to set top deadzone for key ${physicalKeyValue}`);
      }
      
      // Set bottom deadzone
      const drResult = await KeyboardService.setDr(
        physicalKeyValue, 
        globalReleaseDead
      );
      if (drResult instanceof Error) {
        throw new Error(`Failed to set bottom deadzone for key ${physicalKeyValue}`);
      }
      
      // Finally, switch performance mode to global
      const modeResult = await KeyboardService.setPerformanceMode(
        physicalKeyValue, 
        'global', 
        0
      );
      if (modeResult instanceof Error) {
        throw new Error(`Failed to set performance mode for key ${physicalKeyValue}`);
      }
    });
    
    // Step 4: Clear RT overlays for converted keys
    keys.forEach(keyId => {
      delete overlayData.value[keyId];
    });
    
    setNotification(`Set ${keys.length} key(s) to global mode successfully`, false);
  } catch (error) {
    console.error('Failed to set keys to global mode:', error);
    setNotification('Failed to set keys to global mode', true);
  }
};
```

**Critical Implementation Details**:

1. **Fetch-First Pattern**: Fetches current global settings from the keyboard before applying them. Ensures the values written to individual keys match what the global mode will use.

2. **Apply Before Switch**: Each key receives individual travel and deadzone values BEFORE switching to global mode. This prevents a bug where keys would switch to global mode but retain their old RT deadzone values.

3. **NaN Validation**: After casting the SDK response to access `pressDead` and `releaseDead` fields (which aren't in the TypeScript type declaration), validates all three values are valid numbers. Prevents silent failures from malformed SDK responses.

4. **Comprehensive Error Handling**: Each SDK call is validated for errors. If any key fails during batch processing, the entire operation throws and shows an error notification to the user.

5. **Overlay Cleanup**: After successful conversion, RT-specific overlays are removed from the converted keys. This prevents confusion where RT overlay values would persist on keys now in global mode.

## Dependencies

### Services
- **KeyboardService**: Hardware communication for RT configuration
- **RT APIs**:
  - `setPerformanceMode(keyId, 'rt', 0)`: Enable RT mode
  - `getSingleTravel(keyId)`: Get initial actuation point
  - `setSingleTravel(keyId, value)`: Set initial actuation
  - `getRtTravel(keyId)`: Get RT press/release travel
  - `setRtPressTravel(keyId, value)`: Set re-trigger distance
  - `setRtReleaseTravel(keyId, value)`: Set reset distance
  - `getDpDr(keyId)`: Get press/release deadzones
  - `setDp(keyId, value)`: Set top deadzone
  - `setDr(keyId, value)`: Set bottom deadzone

### Utilities
- **useBatchProcessing**: Batch keyboard operations
- **useMappedKeyboard**: Fetch and manage layouts
- **keyMap**: Key code to label mapping

### Stores
- **useTravelProfilesStore**: User-saved travel profiles (for max travel)

## Data Flow

```
Page Mounted
    ↓
fetchLayerLayout() - Get keyboard layout
    ↓
User Selects Keys (click or preset buttons)
    ↓
selectedKeys array updated
    ↓
loadAllSettings() - Fetch RT settings from first key
    ↓
Update slider values
    ↓
User Adjusts Sliders
    ↓
Link watchers sync paired values (if linked)
    ↓
Deadzone watcher clamps initial actuation
    ↓
@change event triggers updateAllSettings()
    ↓
Batch Process All Selected Keys
  - setPerformanceMode('rt')
  - setSingleTravel(initial)
  - setRtPressTravel(re-trigger)
  - setRtReleaseTravel(reset)
  - setDp(top deadzone)
  - setDr(bottom deadzone)
    ↓
updateOverlayData() - Fetch all keys' RT values
    ↓
overlayData updated
    ↓
UI Re-renders with New Overlay Values
```

## User Workflows

### Configure RT for Gaming Keys (WASD)
1. Click "Select WASD"
2. Set Initial Trigger Travel to 1.8mm for faster actuation
3. Set Key Re-Trigger to 0.2mm for fast re-presses
4. Set Key Reset to 0.2mm for quick release
5. Click "Link" button between Re-Trigger and Reset
6. Adjust Top Deadzone to 0.0mm (no dead zone at top)
7. Adjust Bottom Deadzone to 0.0mm
8. Slider automatically updates keyboard
9. WASD keys now have ultra-responsive RT settings

### Create Symmetric RT Configuration
1. Select desired keys
2. Click "Link" between Re-Trigger and Reset
3. Adjust either slider - both move together
4. Click "Link" between Top and Bottom Deadzones
5. Adjust either deadzone - both move together
6. Settings stay synchronized

### Fine-Tune Individual Key
1. Click specific key on keyboard
2. Adjust all 5 sliders independently
3. Watch Initial Trigger Travel clamp automatically if deadzones change
4. Each change updates keyboard immediately
5. Overlay shows new values

### Prevent Accidental Presses
1. Select All keys
2. Set Top Deadzone to 0.3mm (ignore first 0.3mm of travel)
3. Set Bottom Deadzone to 0.2mm (ignore last 0.2mm before bottom)
4. Notice Initial Trigger Travel automatically adjusts min/max
5. Keys now ignore accidental light touches

### Convert RT Keys Back to Global Mode
1. User has configured WASD keys with RT settings for gaming
2. User decides to return those keys to standard global mode
3. User selects WASD keys on the keyboard
4. User clicks "Set to Global" button
5. Component fetches current global settings from keyboard (e.g., 2.5mm travel, 0.2mm deadzones)
6. Each WASD key receives:
   - Travel distance: 2.5mm (applied individually via setSingleTravel)
   - Top deadzone: 0.2mm (applied via setDp)
   - Bottom deadzone: 0.2mm (applied via setDr)
   - Performance mode switched to 'global'
7. RT overlays clear from WASD keys
8. Success notification: "Set 4 key(s) to global mode successfully"
9. WASD keys now behave identically to other global-mode keys

**Why This Workflow Matters**: Without applying individual travel/deadzone values before the mode switch, keys would switch to global mode but retain their old RT deadzone settings, creating inconsistent behavior. The fetch-first pattern ensures the converted keys have the exact same settings as the global configuration.

## Overlay Display Format

### Example Overlay
```
┌─────────────┐
│      W      │  ← Key label (possibly remapped)
│ 0.20   0.20 │  ← Re-Trigger (red/pink)  Reset (blue)
│    1.80     │  ← Initial Travel (cyan)
│ 0.00   0.00 │  ← Top Dead (green)  Bottom Dead (orange)
└─────────────┘
```

### Value Meanings
- **Re-Trigger (top-left, red/pink)**: Upward distance before key re-triggers
- **Reset (top-right, blue)**: Upward distance before key fully resets
- **Initial Travel (center, cyan)**: Initial actuation distance from rest
- **Top Deadzone (bottom-left, green)**: Distance from rest that's ignored
- **Bottom Deadzone (bottom-right, orange)**: Distance from max travel that's ignored

## Link Behavior

### RT Travel Linking
- **Unlinked**: Re-Trigger and Reset independent
- **Linked**: Both values stay equal
  - Dragging either slider updates both
  - Clicking +/- on either updates both
  - When activated, syncs to smaller value
- **Use Case**: Ensure symmetric RT behavior

### Deadzone Linking
- **Unlinked**: Top and Bottom deadzones independent
- **Linked**: Both values stay equal
  - Dragging either slider updates both
  - Clicking +/- on either updates both (release buttons disabled)
  - When activated, syncs to smaller value
- **Use Case**: Create symmetric dead zones

## Clamping Behavior

### Initial Trigger Travel Auto-Adjustment
When deadzones change, Initial Trigger Travel automatically clamps:

**Example 1: Top Deadzone Increase**
- Top Deadzone: 0.1mm → 0.5mm
- Initial Trigger Travel min increases from 0.1mm to 0.5mm
- If current value is 0.3mm, it auto-clamps to 0.5mm
- Keyboard updates with new value

**Example 2: Bottom Deadzone Increase**
- Bottom Deadzone: 0.0mm → 1.0mm
- Max travel = 4.0mm
- Initial Trigger Travel max decreases from 4.0mm to 3.0mm
- If current value is 3.5mm, it auto-clamps to 3.0mm
- Keyboard updates with new value

## Error Handling

### SDK Return Type Handling
```typescript
// SDK returns strings for getSingleTravel
const result = await KeyboardService.getSingleTravel(keyId);
const travelNum = Number(result); // Explicit conversion

// SDK returns object for getDpDr with pressDead/releaseDead
const dzResult = await KeyboardService.getDpDr(keyId);
const pressDead = Number(dzResult.pressDead);
```

### Validation
- All values converted to numbers with `Number()`
- NaN checks before assignment
- Clamping to valid ranges (0.1-4.0mm for travel, 0-1.0mm for deadzones)
- Error catching with console.error and user notifications

### Batch Processing Safety
- 80 keys per batch (configurable)
- 100ms delay between batches
- Prevents hardware overwhelm
- Changes take effect immediately

## Known Limitations

1. **First-Key-Only Loading**: When multiple keys selected, loads settings from first key only
2. **Overlay Update Delay**: 500ms delay after settings update for overlay refresh
3. **String Conversion Required**: SDK returns strings that need Number() conversion
4. **Link State Not Persisted**: Link buttons reset on page reload
5. **No Multi-Select Value Averaging**: Doesn't show average when keys have different values

## Future Enhancements

### Potential Improvements
1. **Profile Presets**: Save/load RT profiles (Gaming, Typing, Custom)
2. **Per-Key Link States**: Allow different keys to have different link configurations
3. **Value Averaging**: Show average value when multiple keys with different settings selected
4. **Visual Range Indicators**: Show valid range on sliders based on current deadzones
5. **RT Mode Indicator**: Visual badge showing which keys are in RT mode
6. **Bulk RT Enable/Disable**: Quick toggle RT mode for all selected keys
7. **Comparison View**: Side-by-side comparison of different RT configurations
8. **Animation Presets**: Smooth transitions when changing RT values
9. **Keyboard Heatmap**: Visualize RT sensitivity across entire keyboard
10. **Export/Import**: Share RT configurations with other users

## Performance Considerations

### Batch Processing Strategy
- Keys processed in batches of 80
- 100ms delay between batches
- Prevents USB command flooding
- Total update time: ~3-5 seconds for 100+ keys

### Overlay Update Optimization
- Batch fetch all keys in parallel within batches
- 500ms debounce after settings update
- Only fetches visible keys
- Updates reactive object for efficient re-renders

### Watcher Efficiency
- Watchers check link state before syncing
- No infinite loops (watchers don't trigger themselves)
- Minimal computational overhead
- Only calls updateAllSettings when needed

## Testing Recommendations

### Manual QA Checklist
- [ ] Link RT Travel, drag Re-Trigger → Reset follows
- [ ] Link RT Travel, drag Reset → Re-Trigger follows
- [ ] Link Deadzones, drag Top → Bottom follows
- [ ] Link Deadzones, drag Bottom → Top follows
- [ ] Increase Top Deadzone above Initial Travel → Initial Travel clamps up
- [ ] Increase Bottom Deadzone → Initial Travel max reduces
- [ ] Select 100 keys → batch processing completes without errors
- [ ] Overlays update after settings change
- [ ] Unlink buttons → values move independently

### Edge Cases
- Zero deadzone values
- Maximum deadzone values (1.0mm)
- Initial Travel at min/max bounds
- Rapid slider adjustments
- Linking/unlinking during adjustment
- Selecting keys while linked
