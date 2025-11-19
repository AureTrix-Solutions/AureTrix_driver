# Lighting.vue Documentation

## Overview

The Lighting page (`src/pages/Lighting.vue`) is a production-ready Vue component that provides complete RGB lighting control for SparkLink SDK-compatible hall effect keyboards. It offers master lighting controls, 22 lighting modes (0-21), per-key custom RGB lighting, batch processing for performance, and dual visual feedback through both physical and virtual keyboards.

## Features

### Master Controls
- **Brightness (Luminance):** 0-4 (Off, Low, Medium, High, Maximum)
- **Speed:** 0-4 (Slowest to Fastest) - affects animation speed for dynamic modes
- **Sleep Timer:** 0-120 minutes (Never, 1, 2, 3, 5, 10, 15, 20, 25, 30, 45, 60, 120 minutes)
- **Direction:** Normal or Reverse (reverses animation direction)
- **ON/OFF Toggle:** Enables/disables all RGB lighting

### Lighting Modes

The page supports 22 distinct lighting modes organized into three categories:

#### Static Mode (Mode 0)
- Single solid color across all keys
- User-selectable via color picker
- Type: `'static'`

#### Dynamic Modes (Modes 1-20)
Built-in animated effects that run on the keyboard:
- **Mode 1:** Wave
- **Mode 2:** Wave 2
- **Mode 3:** Ripple
- **Mode 4:** Wheel
- **Mode 5:** Wheel 2
- **Mode 6:** Collide
- **Mode 7:** Spectrum
- **Mode 8:** Shift
- **Mode 9:** Spot Shift
- **Mode 10:** Race
- **Mode 11:** Rainbow Wave
- **Mode 12:** Snake
- **Mode 13:** Twinkle
- **Mode 14:** Twinkle 2
- **Mode 15:** Twinkle 3
- **Mode 16:** Pong
- **Mode 17:** Pulse
- **Mode 18:** Radiate
- **Mode 19:** Column
- **Mode 20:** Explode

Type: `'dynamic'`

#### Custom Mode (Mode 21)
- Per-key custom RGB lighting
- User-defined colors for individual keys
- Colors persist across sessions (saved to flash memory)
- Type: `'custom'`

### Key Selection System

Users can select keys for custom RGB lighting using several methods:

#### Selection Buttons
- **Select All:** Toggles selection of all keys
- **Select WASD:** Toggles selection of W, A, S, D keys
- **Select Letters:** Toggles selection of all letter keys (A-Z)
- **Select Numbers:** Toggles selection of number keys (1-0)
- **Select None:** Clears all selections

#### Toggle Behavior
Selection buttons intelligently toggle:
- If all target keys are selected → deselect all target keys
- If some or no target keys are selected → add all target keys (without duplicates)

#### Manual Selection
- Click individual keys on the virtual keyboard to select/deselect
- Selected keys are highlighted with the `lighting-key-selected` CSS class

### Virtual Keyboard Display

The virtual keyboard provides real-time visual feedback:

- **Layout Support:** Dynamically renders keyboard layout based on connected device (61, 67, 68, 80, 82, 84, 87-key layouts)
- **Custom Color Preview:** In Custom mode (21), displays saved RGB colors on each key
- **Visual Selection:** Highlights selected keys
- **Real-time Updates:** Shows color changes instantly during custom color adjustments

## Technical Implementation

### Architecture

**Framework:** Vue 3 with Composition API and TypeScript

**Key Dependencies:**
- `useMappedKeyboard` composable: Handles keyboard layout rendering
- `useBatchProcessing` composable: Manages batched SDK calls for performance
- `KeyboardService`: Hardware abstraction layer for SparkLink SDK
- `keyMap` utility: Maps key values to readable labels

### State Management

#### Reactive References
```typescript
const initializing = ref(false);           // SDK initialization state
const lightingEnabled = ref(true);         // Lighting ON/OFF state
const masterLuminance = ref(4);           // Brightness 0-4
const masterSpeed = ref(3);               // Speed 0-4
const masterSleepDelay = ref(0);          // Sleep timer in minutes
const masterDirection = ref(false);       // Normal (false) or Reverse (true)
const selectedMode = ref(0);              // Current UI mode selection
const confirmedMode = ref(0);             // Last successfully applied mode
const staticColor = ref('#0037ff');       // Color picker value
const selectedKeys = ref<IDefKeyInfo[]>([]);  // Currently selected keys
```

#### Reactive Objects
```typescript
const customColors = reactive<Record<number, { R: number; G: number; B: number }>>({});
```
- Stores custom RGB colors per key (keyed by `physicalKeyValue || keyValue`)
- Enables instant virtual keyboard preview updates

### Core Functions

#### Initialization

**`initLightingFromDevice()`**
- Fetches current lighting settings from the keyboard via `KeyboardService.getLighting()`
- Syncs UI state with hardware state
- Loads custom colors if in Custom mode (21)
- Called on component mount

**`loadCustomColorsFromKeyboard()`**
- Retrieves custom RGB colors for all keys from keyboard flash memory
- Populates `customColors` reactive object for virtual keyboard display
- Called when switching to Custom mode or on initial load if mode is 21

#### Master Controls

All master control functions follow the same pattern:
1. Get current lighting state via `KeyboardService.getLighting()`
2. Destructure and filter out `open` and `dynamicColorId` fields
3. Update the target property
4. Apply changes via `KeyboardService.setLighting(filteredParams)`

**Master Control Functions:**
- `applyMasterLuminance()`: Updates brightness
- `applyMasterSpeed()`: Updates animation speed
- `applyMasterSleepDelay()`: Updates sleep timer
- `applyMasterDirection()`: Updates animation direction
- `toggleLighting()`: Turns lighting ON/OFF using `setLighting()` or `closedLighting()`

#### Mode Selection

**`applyModeSelection()`**
- Validates mode selection (0-21 range)
- Fetches current state and updates `mode` and `type` fields
- Sets `type` based on mode:
  - Mode 0 → `type: 'static'`
  - Modes 1-20 → `type: 'dynamic'`
  - Mode 21 → `type: 'custom'`
- Syncs color picker to static color when switching to Static mode
- Loads custom colors when switching to Custom mode
- Implements rollback on failure to previous confirmed mode

#### Static Color Application

**`applyStaticColor()`**
- Updates the first color in the `colors` array
- Sets `mode: 0` and `type: 'static'`
- Applies immediately to physical keyboard

**`applyStaticColorThrottled()`**
- Throttled version (100ms) for smooth color picker dragging in Static mode

#### Custom Color Application

**`applyCustomColor(saveToFlash: boolean = true)`**
- Applies custom RGB color to selected keys
- Uses batch processing (80 keys per batch with 100ms throttle) to prevent hardware overload
- Updates `customColors` reactive object after successful SDK call
- Optionally saves to flash memory (default: true)
- Called on color picker `@change` event (mouse release)

**`applyCustomColorThrottled()`**
- Throttled version (100ms) with `saveToFlash: false`
- **Note:** Currently unused - replaced by `updateVirtualKeyboardColorOnly()`

**`updateVirtualKeyboardColorOnly()`** ⚡ **Performance Optimization**
- Updates only the `customColors` reactive object (no SDK calls)
- Provides instant visual preview on virtual keyboard
- Called on color picker `@input` event (during drag)
- Eliminates lag during color dragging

#### Color Picker Workflow (Custom Mode)

The custom color picker uses a dual-event approach for optimal performance:

```vue
<input type="color" 
  v-model="staticColor"
  @input="updateVirtualKeyboardColorOnly()"   <!-- Drag: virtual preview only -->
  @change="applyCustomColor()"                <!-- Release: write to hardware -->
/>
```

**Workflow:**
1. User drags color picker → `@input` fires continuously
2. `updateVirtualKeyboardColorOnly()` updates virtual keyboard instantly (no SDK calls)
3. User releases color picker → `@change` fires once
4. `applyCustomColor()` writes to physical keyboard via SDK with `saveToFlash: true`

**Benefits:**
- ✅ Smooth, responsive dragging experience
- ✅ Virtual keyboard shows real-time color preview
- ✅ Physical keyboard updates only once (no repeated SDK calls)
- ✅ Optimized flash memory writes

#### Selection Functions

**`selectKey(key: IDefKeyInfo)`**
- Toggles individual key selection
- Uses `physicalKeyValue || keyValue` for consistent key identification

**`selectAll()`**
- Toggles all keys: if all selected → deselect all, otherwise select all

**`selectWASD()`, `selectLetters()`, `selectNumbers()`**
- Toggle selection of specific key groups
- If all target keys are selected → deselect all target keys
- Otherwise → add all target keys without duplicates

**`selectNone()`**
- Clears all selections

### Virtual Keyboard Rendering

**`getKeyStyleWithCustomColor(rIdx: number, cIdx: number)`**
- Returns computed style for each key
- In Custom mode (21), overlays custom RGB color if available
- Uses `background` and `backgroundImage: 'none'` to override CSS gradient backgrounds

```typescript
if (selectedMode.value === 21 && rgb) {
  const bgColor = rgbToHex(rgb.R, rgb.G, rgb.B);
  return {
    ...baseStyle,
    background: bgColor,
    backgroundImage: 'none',  // Override CSS gradient
  };
}
```

### Utility Functions

**`rgbToHex(r: number, g: number, b: number): string`**
- Converts RGB values to hex color string
- Example: `rgbToHex(0, 55, 255)` → `'#0037ff'`

**`hexToRgb(hex: string): { R: number; G: number; B: number }`**
- Converts hex color string to RGB object
- Example: `hexToRgb('#0037ff')` → `{ R: 0, G: 55, B: 255 }`

**`throttle(func: Function, delay: number)`**
- Generic throttle utility
- Ensures function executes at most once per `delay` milliseconds

### Computed Properties

**`displayedColor`**
- Computes the color to display in the color picker based on context:
  - **Non-Custom modes:** Returns `staticColor` value
  - **Custom mode, no selection:** Returns white (`#ffffff`)
  - **Custom mode, single key:** Returns that key's custom color
  - **Custom mode, multiple keys:** Returns majority color among selections

## API Workflow Pattern

All lighting modifications follow this consistent pattern:

```typescript
// 1. Get current state
const currentState = await KeyboardService.getLighting();
if (currentState instanceof Error) {
  console.error('Failed to get lighting state:', currentState.message);
  return;
}

// 2. Filter out read-only fields
const { open, dynamicColorId, ...filteredParams } = currentState;

// 3. Modify desired properties
filteredParams.luminance = 4;
filteredParams.speed = 3;

// 4. Apply changes
const result = await KeyboardService.setLighting(filteredParams);
if (result instanceof Error) {
  console.error('Failed to apply changes:', result.message);
}
```

**Critical Fields to Filter:**
- `open`: Read-only status field (use `closedLighting()` to turn off)
- `dynamicColorId`: Internal SDK field, causes errors if included in `setLighting()`

## Performance Optimizations

### 1. Batch Processing for Custom Colors

Uses `useBatchProcessing` composable to process custom color updates in parallel batches:
- **Batch size:** 80 keys
- **Throttle:** 100ms between batches
- **Prevents:** Hardware overload when updating many keys simultaneously

```typescript
await processBatches(
  keyIds,
  async (keyValue: number) => {
    await KeyboardService.setCustomLighting({ key: keyValue, r, g, b });
    customColors[keyValue] = { R: rgb.R, G: rgb.G, B: rgb.B };
  },
  80  // Batch size
);
```

### 2. Separated Visual Preview from Physical Writes

**Problem:** During color dragging, repeated SDK calls caused lag

**Solution:** Dual-event approach
- `@input` → Update virtual keyboard only (instant, local state)
- `@change` → Update physical keyboard once (SDK call with flash write)

**Implementation:**
```typescript
// Virtual preview only - no SDK calls
const updateVirtualKeyboardColorOnly = () => {
  const rgb = hexToRgb(staticColor.value);
  keyIds.forEach(keyValue => {
    customColors[keyValue] = rgb;  // Local state update only
  });
};

// Physical update with flash write
const applyCustomColor = async (saveToFlash = true) => {
  // SDK calls to keyboard hardware
  await processBatches(...);
  if (saveToFlash) {
    await KeyboardService.saveCustomLighting();
  }
};
```

### 3. Flash Write Optimization

Custom color application uses conditional flash saving:
- **During drag (`@input`):** `saveToFlash: false` (preview only, now replaced by virtual-only update)
- **On release (`@change`):** `saveToFlash: true` (final commit to flash memory)

Benefits:
- ✅ Reduces flash memory wear
- ✅ Improves performance
- ✅ Ensures final state is persisted

## Error Handling

All SDK calls implement comprehensive error handling:

```typescript
try {
  const result = await KeyboardService.someMethod();
  if (result instanceof Error) {
    console.error('Operation failed:', result.message);
    return;
  }
  // Process success
} catch (error) {
  console.error('Unexpected error:', error);
}
```

**Mode Selection Rollback:**
- If mode change fails, UI reverts to last confirmed mode
- Prevents UI state from desynchronizing with hardware state

## Styling

### SCSS Variables (from `@styles/variables`)

```scss
v.$background-dark  // Dark background color
v.$text-color       // Primary text color
v.$primary-color    // Accent/primary color
v.$accent-color     // Secondary accent color
v.$font-style       // Font family
```

### Key CSS Classes

- `.lighting-page`: Main page container
- `.lighting-container`: Layout container
- `.key-grid`: Virtual keyboard grid
- `.key-btn`: Individual key button
- `.lighting-key-selected`: Selected key highlight (matches Debug.vue pattern)
- `.settings-panel`: RGB settings panel
- `.settings-row`: Control row container
- `.color-picker-wrapper`: Color picker container

## Component Lifecycle

```
1. onMounted()
   └─> fetchLayerLayout()      // Load keyboard layout from device
   └─> initLightingFromDevice() // Sync UI with hardware state
       └─> getLighting()        // Fetch current settings
       └─> loadCustomColorsFromKeyboard() (if mode === 21)
           └─> getCustomLighting() for each key
```

## Integration with KeyboardService

The Lighting page uses the following `KeyboardService` methods:

### Lighting Control
- `getLighting()`: Fetch current RGB settings
- `setLighting(params)`: Apply RGB settings
- `closedLighting()`: Turn off RGB lighting

### Custom RGB Control
- `getCustomLighting(keyValue)`: Fetch custom color for specific key
- `setCustomLighting({ key, r, g, b })`: Set custom color for specific key
- `saveCustomLighting()`: Save custom colors to flash memory

See `docs/SDK_REFERENCE.md` for detailed API documentation.

## Common Usage Patterns

### Changing Brightness
1. User selects brightness level (0-4) from dropdown
2. `applyMasterLuminance()` triggers on `@change`
3. Function gets current state, updates `luminance`, applies via `setLighting()`

### Switching Lighting Modes
1. User selects mode from dropdown (0-21)
2. `applyModeSelection()` triggers on `@change`
3. Function validates mode, sets `type` field based on mode number
4. If mode 0 (Static): syncs color picker to current static color
5. If mode 21 (Custom): loads all custom colors from keyboard

### Setting Custom Colors
1. User selects keys (click keys or use selection buttons)
2. User drags color picker:
   - `@input` → `updateVirtualKeyboardColorOnly()` → instant virtual preview
3. User releases color picker:
   - `@change` → `applyCustomColor()` → batch write to hardware with flash save

### Toggling Lighting ON/OFF
1. User clicks ON/OFF toggle button
2. If currently ON: calls `closedLighting()` to turn off
3. If currently OFF: calls `getLighting()` + `setLighting()` to restore

## Troubleshooting

### Custom Colors Not Displaying
- Ensure `selectedMode === 21` (Custom mode)
- Verify `customColors` object contains RGB values for keys
- Check that `getKeyStyleWithCustomColor()` returns `background` with `backgroundImage: 'none'`

### Mode Selection Not Working
- Verify `type` field is set correctly ('static', 'dynamic', or 'custom')
- Check that `open` and `dynamicColorId` are filtered out before `setLighting()`
- Ensure mode number is in valid range (0-21)

### Lag During Custom Color Dragging
- Verify `@input` uses `updateVirtualKeyboardColorOnly()` (no SDK calls)
- Verify `@change` uses `applyCustomColor()` (single SDK call on release)
- Check that batch processing is configured (80 keys per batch)

### Selection Buttons Not Toggling
- Ensure logic checks if all target keys are selected before deciding toggle direction
- Verify physical key values are used consistently (`physicalKeyValue || keyValue`)
- Check that duplicate prevention is working when adding keys

## Design Decisions

### Why Dual-Event Color Picker Approach?
- **Problem:** Continuous SDK calls during drag caused severe lag
- **Solution:** Separate visual preview (local state) from hardware writes (SDK)
- **Result:** Smooth dragging with instant feedback, single hardware update on release

### Why Batch Processing?
- **Problem:** Updating 100+ keys sequentially caused hardware overload and timeout
- **Solution:** Process keys in parallel batches of 80 with 100ms throttle
- **Result:** Reliable bulk updates even with large selections

### Why Filter `open` and `dynamicColorId`?
- **Problem:** Including these fields in `setLighting()` causes SDK errors
- **Solution:** Always destructure and exclude: `const { open, dynamicColorId, ...filteredParams } = currentState`
- **Result:** Consistent, error-free lighting updates

### Why Toggle Selection Buttons?
- **Problem:** Users expected buttons to deselect if all target keys were already selected
- **Solution:** Check if all targets selected → deselect all, otherwise add all
- **Result:** Intuitive toggle behavior matching user expectations (aligned with Debug.vue)

## Testing Recommendations

### Manual Testing Checklist

**Master Controls:**
- [ ] Brightness changes (0-4) apply to keyboard
- [ ] Speed changes (0-4) affect animation speed in dynamic modes
- [ ] Sleep timer activates after specified duration
- [ ] Direction reversal changes animation direction
- [ ] ON/OFF toggle disables/enables lighting

**Mode Selection:**
- [ ] Static mode (0) displays solid color
- [ ] Each dynamic mode (1-20) shows correct animation
- [ ] Custom mode (21) displays per-key colors
- [ ] Mode transitions work smoothly

**Custom RGB:**
- [ ] Key selection works (click, Select All, WASD, Letters, Numbers, None)
- [ ] Color picker shows current color for single selection
- [ ] Color picker shows majority color for multiple selections
- [ ] Dragging color picker updates virtual keyboard instantly (no lag)
- [ ] Releasing color picker updates physical keyboard
- [ ] Custom colors persist after page refresh
- [ ] Virtual keyboard displays saved custom colors on load

**Error Handling:**
- [ ] Failed SDK calls log errors without crashing
- [ ] Mode selection failure rolls back to previous mode
- [ ] Missing hardware gracefully displays error message

## Related Documentation

- **`docs/SDK_REFERENCE.md`**: Complete SparkLink SDK API reference
- **`docs/PAGES_OVERVIEW.md`**: Overview of all application pages
- **`src/pages/Debug.vue`**: Reference implementation for design patterns
- **`src/composables/useBatchProcessing.ts`**: Batch processing composable
- **`src/utils/MappedKeyboard.ts`**: Keyboard layout rendering utility
- **`src/services/KeyboardService.ts`**: Hardware abstraction layer

## Version History

- **November 19, 2025**: Production release with full RGB control, 22 modes, custom RGB, batch processing, and performance optimizations
