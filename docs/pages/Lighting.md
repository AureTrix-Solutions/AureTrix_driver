# Lighting Page Documentation

## Overview
The Lighting page provides complete RGB lighting control for SparkLink SDK-compatible hall effect keyboards. It features master lighting controls, 22 lighting modes (static, 20 dynamic effects, and custom per-key RGB), batch processing for performance optimization, and real-time visual feedback through both physical and virtual keyboards.

## Purpose
- Control all RGB lighting settings (brightness, speed, sleep timer, direction)
- Switch between 22 different lighting modes
- Create custom per-key RGB lighting configurations
- Visualize custom colors on virtual keyboard preview
- Optimize performance with batch processing and smart update strategies

## Key Features

### 1. **Master Lighting Controls**
- Brightness (Luminance): 0-4 (Off, Low, Medium, High, Maximum)
- Speed: 0-4 (Slowest to Fastest) - affects animation speed
- Sleep Timer: Never, 1-120 minutes (13 options)
- Direction: Normal or Reverse (reverses animation direction)
- ON/OFF Toggle: Enable/disable all RGB lighting

### 2. **22 Lighting Modes**
- **Mode 0 (Static)**: Single solid color across all keys
- **Modes 1-20 (Dynamic)**: Built-in animated effects
  - Wave, Wave 2, Ripple, Wheel, Wheel 2, Collide
  - Spectrum, Shift, Spot Shift, Race, Rainbow Wave
  - Snake, Twinkle (1-3), Pong, Pulse, Radiate, Column, Explode
- **Mode 21 (Custom)**: Per-key custom RGB lighting with flash persistence

### 3. **Key Selection System**
- **Visual Selection**: Click keys on virtual keyboard to select/deselect
- **Quick Presets**:
  - Select All / None: Toggle all keys
  - Select WASD: Toggle W, A, S, D keys
  - Select Letters: Toggle A-Z keys
  - Select Numbers: Toggle 1-0 keys
- **Toggle Behavior**: If all targets selected → deselect, otherwise add without duplicates

### 4. **Custom RGB Features**
- Per-key color assignment via color picker
- Real-time virtual keyboard color preview
- Batch processing (80 keys per batch with 100ms throttle)
- Flash memory persistence across sessions
- Dual-event optimization: virtual preview during drag, hardware write on release

### 5. **Virtual Keyboard Display**
- Dynamic layout support (61, 67, 68, 80, 82, 84, 87-key layouts)
- Custom color visualization in Custom mode (mode 21)
- Visual selection highlighting
- Instant color updates during customization

## User Interface Elements

### Header
- Page title: "RGB Lighting"
- No notification bar (errors logged to console)

### Virtual Keyboard
- Grid layout with absolute positioning
- Click to select keys for custom RGB
- Selected keys highlighted with `lighting-key-selected` class
- Custom colors displayed with background override in Custom mode

### Selection Buttons
- **Select All**: Toggle all keys
- **Select WASD**: Toggle gaming keys
- **Select Letters**: Toggle A-Z
- **Select Numbers**: Toggle 1-0
- **Select None**: Clear selection

### RGB Settings Panel

#### Header Row
- "RGB Settings" title
- ON/OFF toggle button (shows "SYNCING..." during initialization)

#### Master Controls Row (3 columns)
- **Brightness**: Dropdown (0-4)
- **Speed**: Dropdown (0-4)
- **Lighting Mode**: Dropdown (0-21)
  - Color picker appears for Static (0) and Custom (21) modes

#### Additional Controls Row
- **Sleep Timer**: Dropdown (Never, 1-120 minutes)
- **Direction**: Dropdown (Normal/Reverse)

## Technical Implementation

### Component Setup
```vue
<script lang="ts">
setup() {
  const initializing = ref(false);
  const lightingEnabled = ref(true);
  const masterLuminance = ref(4);
  const masterSpeed = ref(3);
  const masterSleepDelay = ref(0);
  const masterDirection = ref(false);
  const selectedMode = ref(0);
  const confirmedMode = ref(0);  // Last successful mode
  const staticColor = ref('#0037ff');
  const selectedKeys = ref<IDefKeyInfo[]>([]);
  const customColors = reactive<Record<number, { R, G, B }>>({});
  
  const { layout, loaded, gridStyle, getKeyStyle, fetchLayerLayout } = useMappedKeyboard(ref(0));
  const { processBatches } = useBatchProcessing();
}
</script>
```

### Core Functionality

#### 1. **Initialize from Device**
```typescript
const initLightingFromDevice = async () => {
  const currentState = await KeyboardService.getLighting();
  
  lightingEnabled.value = currentState.open === true || currentState.open === 1;
  masterLuminance.value = currentState.luminance ?? 4;
  masterSpeed.value = currentState.speed ?? 3;
  masterSleepDelay.value = currentState.sleepDelay ?? 0;
  masterDirection.value = currentState.direction ?? false;
  selectedMode.value = currentState.mode ?? 0;
  confirmedMode.value = currentState.mode ?? 0;
  
  if (selectedMode.value === 0 && currentState.colors?.length > 0) {
    staticColor.value = currentState.colors[0];
  }
  
  if (selectedMode.value === 21) {
    await loadCustomColorsFromKeyboard();
  }
}
```

#### 2. **Apply Master Control Changes**
```typescript
// Pattern used by all master controls
const applyMasterLuminance = async () => {
  const currentState = await KeyboardService.getLighting();
  const { open, dynamicColorId, ...filteredParams } = currentState;
  filteredParams.luminance = masterLuminance.value;
  
  await KeyboardService.setLighting(filteredParams);
}

// Similar: applyMasterSpeed, applyMasterSleepDelay, applyMasterDirection
```

#### 3. **Mode Selection with Type Setting**
```typescript
const applyModeSelection = async () => {
  const currentState = await KeyboardService.getLighting();
  const { open, dynamicColorId, ...filteredParams } = currentState;
  filteredParams.mode = selectedMode.value;
  
  // Set type based on mode
  if (selectedMode.value === 0) {
    filteredParams.type = 'static';
    // Sync color picker to static color
    if (currentState.colors?.length > 0) {
      staticColor.value = currentState.colors[0];
    }
  } else if (selectedMode.value === 21) {
    filteredParams.type = 'custom';
  } else {
    filteredParams.type = 'dynamic';
  }
  
  const result = await KeyboardService.setLighting(filteredParams);
  if (result instanceof Error) {
    // Rollback to previous confirmed mode
    selectedMode.value = confirmedMode.value;
  } else {
    confirmedMode.value = selectedMode.value;
    
    if (selectedMode.value === 21) {
      await loadCustomColorsFromKeyboard();
    }
  }
}
```

#### 4. **Static Color Application**
```typescript
const applyStaticColor = async () => {
  const currentState = await KeyboardService.getLighting();
  const { open, dynamicColorId, ...filteredParams } = currentState;
  
  if (!filteredParams.colors || filteredParams.colors.length === 0) {
    filteredParams.colors = [staticColor.value];
  } else {
    filteredParams.colors = [...filteredParams.colors];
    filteredParams.colors[0] = staticColor.value;
  }
  
  filteredParams.mode = 0;
  filteredParams.type = 'static';
  
  await KeyboardService.setLighting(filteredParams);
}

const applyStaticColorThrottled = throttle(applyStaticColor, 100);
```

#### 5. **Custom Color Application (Batch Processing)**
```typescript
const applyCustomColor = async (saveToFlash: boolean = true) => {
  if (selectedKeys.value.length === 0) return;
  
  const rgb = hexToRgb(staticColor.value);
  const keyIds = selectedKeys.value.map(key => key.physicalKeyValue || key.keyValue);
  
  // Batch process: 80 keys per batch with 100ms throttle
  await processBatches(
    keyIds,
    async (keyValue: number) => {
      const result = await KeyboardService.setCustomLighting({
        key: keyValue,
        r: rgb.R,
        g: rgb.G,
        b: rgb.B
      });
      
      if (!(result instanceof Error)) {
        customColors[keyValue] = { R: rgb.R, G: rgb.G, B: rgb.B };
      }
    },
    80
  );
  
  if (saveToFlash) {
    await KeyboardService.saveCustomLighting();
  }
}
```

#### 6. **Virtual-Only Color Preview (Performance Optimization)**
```typescript
// Updates virtual keyboard instantly without SDK calls
const updateVirtualKeyboardColorOnly = () => {
  if (selectedKeys.value.length === 0) return;
  
  const rgb = hexToRgb(staticColor.value);
  const keyIds = selectedKeys.value.map(key => key.physicalKeyValue || key.keyValue);
  
  // Update reactive object only - no SDK calls
  keyIds.forEach(keyValue => {
    customColors[keyValue] = { R: rgb.R, G: rgb.G, B: rgb.B };
  });
}
```

#### 7. **Load Custom Colors from Keyboard**
```typescript
const loadCustomColorsFromKeyboard = async () => {
  const allKeys = layout.value.flat();
  
  for (const key of allKeys) {
    const keyValue = key.physicalKeyValue || key.keyValue;
    const result = await KeyboardService.getCustomLighting(keyValue);
    
    if (!(result instanceof Error) && result?.R !== undefined) {
      customColors[keyValue] = { R: result.R, G: result.G, B: result.B };
    }
  }
}
```

### Color Picker Dual-Event System

```vue
<input type="color" 
  v-model="staticColor"
  @input="selectedMode === 0 ? applyStaticColorThrottled() : updateVirtualKeyboardColorOnly()"
  @change="selectedMode === 0 ? applyStaticColor() : applyCustomColor()"
/>
```

**Static Mode (0):**
- `@input` → Throttled SDK call (preview with 100ms throttle)
- `@change` → Immediate SDK call (final update)

**Custom Mode (21):**
- `@input` → Virtual keyboard update only (instant, no SDK calls)
- `@change` → Batch SDK call with flash save (single hardware write on release)

### Selection Functions

```typescript
const selectAll = () => {
  const totalKeys = layout.value.flat().length;
  selectedKeys.value = selectedKeys.value.length === totalKeys ? [] : layout.value.flat();
}

const selectWASD = () => {
  const wasdLabels = ['W', 'A', 'S', 'D'];
  const wasdKeys = layout.value.flat().filter(keyInfo => {
    const label = keyInfo.remappedLabel || keyMap[keyInfo.keyValue];
    return wasdLabels.includes(label.toUpperCase());
  });
  
  const physicalWASD = wasdKeys.map(key => key.physicalKeyValue || key.keyValue);
  const currentlySelected = selectedKeys.value.filter(k => 
    physicalWASD.includes(k.physicalKeyValue || k.keyValue)
  );
  
  // Toggle: deselect all if all selected, otherwise add all
  if (currentlySelected.length === wasdKeys.length) {
    selectedKeys.value = selectedKeys.value.filter(k => 
      !physicalWASD.includes(k.physicalKeyValue || k.keyValue)
    );
  } else {
    selectedKeys.value = [...selectedKeys.value, 
      ...wasdKeys.filter(key => !selectedKeys.value.some(s => 
        (s.physicalKeyValue || s.keyValue) === (key.physicalKeyValue || key.keyValue)
      ))
    ];
  }
}

// Similar: selectLetters, selectNumbers
```

### Virtual Keyboard Custom Color Rendering

```typescript
const getKeyStyleWithCustomColor = (rIdx: number, cIdx: number) => {
  const baseStyle = getKeyStyle(rIdx, cIdx);
  
  if (selectedMode.value === 21 && layout.value[rIdx]?.[cIdx]) {
    const keyInfo = layout.value[rIdx][cIdx];
    const keyValue = keyInfo.physicalKeyValue || keyInfo.keyValue;
    const rgb = customColors[keyValue];
    
    if (rgb) {
      const bgColor = rgbToHex(rgb.R, rgb.G, rgb.B);
      return {
        ...baseStyle,
        background: bgColor,
        backgroundImage: 'none',  // Override CSS gradient
      };
    }
  }
  
  return baseStyle;
}
```

## Dependencies

### Services
- **KeyboardService**: Hardware abstraction layer
  - `getLighting()`: Fetch current RGB settings
  - `setLighting(params)`: Apply RGB settings
  - `closedLighting()`: Turn off lighting
  - `getCustomLighting(keyValue)`: Fetch custom color for key
  - `setCustomLighting({ key, r, g, b })`: Set custom color for key
  - `saveCustomLighting()`: Save custom colors to flash

### Composables
- **useMappedKeyboard**: Keyboard layout rendering
- **useBatchProcessing**: Batch SDK call management

### Utilities
- **keyMap**: Key value to label translation

## Data Flow

```
Page Mount
    ↓
fetchLayerLayout() - Get keyboard layout
    ↓
initLightingFromDevice()
    ↓
getLighting() - Fetch current settings
    ↓
Sync UI state (brightness, speed, mode, etc.)
    ↓
If mode === 21: loadCustomColorsFromKeyboard()
    ↓
getCustomLighting() for each key
    ↓
customColors object populated
    ↓
Virtual keyboard displays custom colors

User Changes Setting (e.g., Brightness)
    ↓
getLighting() - Get current state
    ↓
Filter { open, dynamicColorId, ...filteredParams }
    ↓
filteredParams.luminance = newValue
    ↓
setLighting(filteredParams)
    ↓
Physical keyboard updated

User Drags Custom Color Picker
    ↓
@input event fires continuously
    ↓
updateVirtualKeyboardColorOnly()
    ↓
customColors object updated (no SDK calls)
    ↓
Virtual keyboard shows preview instantly

User Releases Custom Color Picker
    ↓
@change event fires once
    ↓
applyCustomColor(saveToFlash: true)
    ↓
processBatches() - 80 keys per batch
    ↓
setCustomLighting() for each key
    ↓
saveCustomLighting() - Flash write
    ↓
Physical keyboard updated
```

## User Workflows

### Change Brightness
1. Select brightness level (0-4) from dropdown
2. Brightness applies immediately to keyboard
3. No confirmation needed

### Switch to Static Mode
1. Select "Static" from Lighting Mode dropdown
2. Color picker appears
3. Choose desired color
4. Color applies to all keys instantly

### Switch to Dynamic Mode (e.g., Rainbow Wave)
1. Select "Rainbow Wave" (mode 11) from dropdown
2. Animation starts immediately
3. Adjust speed (0-4) to change animation rate
4. Adjust direction (Normal/Reverse) to reverse animation

### Create Custom Per-Key RGB
1. Select "Custom" (mode 21) from dropdown
2. Wait for custom colors to load from keyboard
3. Select keys (click keys or use preset buttons)
4. Choose color from color picker
5. Drag to preview colors instantly on virtual keyboard
6. Release to apply to physical keyboard (saved to flash)

### Bulk Custom Color Application
1. Switch to Custom mode (21)
2. Click "Select All" or "Select Letters"
3. Choose color from picker
4. Drag to preview on all selected keys
5. Release to batch-update physical keyboard
6. 80 keys processed per batch with 100ms throttle

### Reset to Default Mode
1. Select desired mode from dropdown
2. Previous custom colors remain in flash memory
3. Switch back to Custom mode to restore

## Error Handling

### Connection Errors
- All SDK calls check for `Error` instance
- Errors logged to console with descriptive messages
- UI continues functioning (no crashes)

### Mode Selection Rollback
- If mode change fails, UI reverts to `confirmedMode`
- Prevents UI desync from hardware state
- User sees previous mode still selected

### Missing Key Selection
- Custom color functions check `selectedKeys.length === 0`
- Early return if no keys selected
- No invalid SDK calls

### SDK Response Validation
- All getter calls validate response type
- Fallback to defaults if data missing
- Null/undefined checks before accessing properties

## API Workflow Pattern

All lighting modifications follow this consistent pattern:

1. **Get current state**: `const currentState = await KeyboardService.getLighting()`
2. **Filter read-only fields**: `const { open, dynamicColorId, ...filteredParams } = currentState`
3. **Modify properties**: `filteredParams.luminance = 4`
4. **Apply changes**: `await KeyboardService.setLighting(filteredParams)`

**Critical**: Always filter out `open` and `dynamicColorId` - including them causes SDK errors.

## Performance Optimizations

### 1. Batch Processing for Custom Colors
- Process keys in parallel batches (80 per batch)
- 100ms throttle between batches
- Prevents hardware overload when updating many keys
- Implemented via `useBatchProcessing` composable

### 2. Dual-Event Color Picker
- **Problem**: Continuous SDK calls during drag caused severe lag
- **Solution**: Separate virtual preview (local state) from hardware writes (SDK)
- `@input`: Update `customColors` reactive object only (instant)
- `@change`: Single batch SDK call with flash save (on release)
- **Result**: Smooth dragging with real-time feedback

### 3. Flash Write Optimization
- Preview changes: `saveToFlash: false` (now replaced by virtual-only update)
- Final commit: `saveToFlash: true` (single flash write)
- Reduces flash memory wear
- Improves performance

### 4. Computed Color Display
- `displayedColor` computed property determines picker color
- Single key: show that key's color
- Multiple keys: show majority color
- Efficient reactive updates without manual tracking

## Styling Highlights

### SCSS Variables
```scss
@use '@styles/variables' as v;

v.$background-dark  // Dark background
v.$text-color       // Primary text
v.$primary-color    // Accent/primary
v.$accent-color     // Secondary accent
v.$font-style       // Font family
```

### Key CSS Classes
- `.lighting-page`: Main container
- `.lighting-container`: Layout wrapper
- `.key-grid`: Virtual keyboard grid
- `.key-btn`: Individual key button
- `.lighting-key-selected`: Selected key highlight (matches Debug.vue)
- `.settings-panel`: RGB controls panel
- `.color-picker-wrapper`: Color input container

### Custom Color Override
Custom colors override CSS gradients using:
```css
{
  background: #0037ff;
  backgroundImage: none;  /* Override .key-btn gradient */
}
```

## Known Limitations

- Custom mode loads all key colors on switch (can be slow for 100+ keys)
- Color picker shows majority color for multiple selections (may not reflect all colors)
- No undo/redo for color changes
- No color palette save/load (must recreate each time)
- Direction control only affects dynamic modes (no effect on Static/Custom)

## Future Enhancements

- Color palette presets (save/load custom color schemes)
- Gradient editor for smooth color transitions
- Animation speed preview slider
- Undo/redo for custom color changes
- Import/export custom color configurations
- Color history (recent colors used)
- Visual mode preview (show animation before applying)
- Batch operations for dynamic mode colors

## Developer Notes

- Always filter `open` and `dynamicColorId` from `getLighting()` response before calling `setLighting()`
- Mode selection requires `type` field: 'static' (0), 'dynamic' (1-20), 'custom' (21)
- Custom colors use `physicalKeyValue || keyValue` for consistent key identification
- `confirmedMode` tracks last successful mode for rollback on failure
- Selection buttons toggle: if all selected → deselect, otherwise add all (aligned with Debug.vue)
- Color picker dual-event approach critical for performance: `@input` for preview, `@change` for commit
- Batch processing prevents hardware timeout: 80 keys per batch, 100ms throttle
- Virtual keyboard color display requires `backgroundImage: 'none'` to override CSS gradients
- Use `useBatchProcessing` composable for all bulk SDK operations
- Static mode color picker uses throttled SDK calls (100ms), Custom mode uses virtual-only updates
