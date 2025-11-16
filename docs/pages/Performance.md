# Performance Page Documentation

## Overview
The Performance page provides advanced control over key travel distances, allowing users to adjust how far each key must be pressed before it actuates. This is a critical feature for hall effect keyboards, enabling fine-tuning for gaming, typing, or specialized use cases. The page supports both global and per-key travel settings with real-time visual overlays.

## Purpose
- Adjust key travel distances (actuation points) for optimal performance
- Support two modes: Global (all keys same) and Single (per-key customization)
- Visualize current travel settings overlaid on keyboard
- Batch adjust keys by category (WASD, letters, numbers, etc.)
- Fine-tune press/release deadzones

## Key Features

### 1. **Dual Travel Modes**
- **Global Mode**: All keys share the same travel distance
- **Single Mode**: Each key has independent travel distance

### 2. **Visual Travel Overlays**
- Real-time display of travel values on keys
- Color-coded values:
  - **Center**: Travel distance (cyan)
  - **Bottom Left**: Press deadzone (green)
  - **Bottom Right**: Release deadzone (orange)

### 3. **Quick Selection Presets**
- **Select All**: Select entire keyboard
- **Select WASD**: Gaming keys
- **Select Letters**: All alphabetic keys
- **Select Numbers**: Number row (1-0)
- **Select None**: Clear selection

### 4. **Batch Processing**
- Process large key selections without overwhelming hardware
- Automatic batching with configurable size (80 keys)
- Delay mechanism prevents command flooding

### 5. **Remapped Label Display**
- Shows current key mappings (not just physical labels)
- Respects active layer mappings
- Helps identify remapped keys during adjustment

## User Interface Elements

### Title & Notification Bar
- Page title: "Key Travel Settings"
- Notification bar for success/error messages
- Auto-dismiss notifications after 3 seconds

### Keyboard Grid
- Visual keyboard layout
- Selected keys highlighted with accent glow
- Travel overlays display on keys:
  - Center: Main travel value (e.g., "2.50")
  - Bottom corners: Press/Release deadzones

### Selection Buttons (Left Sidebar)
- **Select All**: Toggle all keys
- **Select WASD**: Gaming preset
- **Select Letters**: A-Z keys
- **Select Numbers**: 1-0 keys
- **Select None**: Clear selection

### Settings Panel (Bottom)
- **KeyTravel Component**: Main control interface container
  - GlobalTravel: Global mode travel and deadzone controls
  - SingleKeyTravel: Per-key travel and deadzone controls
  - SwitchProfiles: Profile management and key testing
- Panel shows current selection count
- Disabled when no keys selected

## Component Architecture

The Performance page uses a modular component structure for travel configuration:

```
Performance.vue (main page)
  └─ KeyTravel.vue (container component)
       ├─ GlobalTravel.vue (global mode settings)
       ├─ SingleKeyTravel.vue (per-key settings)
       └─ SwitchProfiles.vue (profile management)
```

### Component Responsibilities

- **Performance.vue**: Keyboard grid rendering, key selection, overlay management, event coordination
- **KeyTravel.vue**: Props delegation, profile max travel computation, event routing ([docs](./KeyTravel.md))
- **GlobalTravel.vue**: Global travel/deadzone settings, batch updates to global-mode keys ([docs](./GlobalTravel.md))
- **SingleKeyTravel.vue**: Per-key travel/deadzone settings, batch updates to single-mode keys ([docs](./SingleKeyTravel.md))
- **SwitchProfiles.vue**: Switch profile CRUD, max travel capture, key test monitor ([docs](./SwitchProfiles.md))

### Component Documentation

Each sub-component has comprehensive documentation:
- [KeyTravel.md](./KeyTravel.md) - Container component with profile max travel computation
- [GlobalTravel.md](./GlobalTravel.md) - Global travel settings with deadzone linking
- [SingleKeyTravel.md](./SingleKeyTravel.md) - Per-key travel configuration
- [SwitchProfiles.md](./SwitchProfiles.md) - Profile management and key testing

## Technical Implementation

### Component Setup
```vue
<script lang="ts">
setup() {
  const selectedKeys = ref<IDefKeyInfo[]>([]);
  const overlayData = ref<{ 
    [key: number]: { 
      travel: string; 
      pressDead: string; 
      releaseDead: string 
    } 
  }>({});
  const { processBatches } = useBatchProcessing();
  ...
}
</script>
```

### Core Functionality

#### 1. **Fetch Remapped Labels**
```typescript
const fetchRemappedLabels = async () => {
  const keyIds = layout.value.flat().map(k => k.physicalKeyValue || k.keyValue);
  const BATCH_SIZE = 80;
  
  // Batch fetch current layer mappings
  for (const batch of batches) {
    const currentLayer = await Promise.all(
      batch.map(keyId => KeyboardService.getLayoutKeyInfo([{ 
        key: keyId, 
        layout: 0 
      }]))
    );
    
    // Build position-to-remap map
    currentLayer.flat().forEach(item => {
      if (item.value !== 0) {
        positionToRemap[item.key] = item.value;
      }
    });
  }
  
  // Apply remapped labels to layout
  layout.value.forEach(row => {
    row.forEach(keyInfo => {
      const remappedValue = positionToRemap[physicalId] || keyInfo.keyValue;
      keyInfo.remappedLabel = keyMap[remappedValue];
    });
  });
}
```

#### 2. **Update Global Mode Overlays**
```typescript
const updateOverlayData = async (data) => {
  if (data) {
    // Fetch all keys in global mode
    const globalModeKeys = await batchFetchPerformanceModes()
      .filter(mode => mode.touchMode === 'global')
      .map(mode => mode.key);
    
    // Apply same values to all global keys
    layout.value.flat().forEach(keyInfo => {
      if (globalModeKeys.includes(keyInfo.physicalKeyValue)) {
        overlayData.value[keyInfo.physicalKeyValue] = {
          travel: data.travel,
          pressDead: data.pressDead,
          releaseDead: data.releaseDead
        };
      }
    });
  } else {
    // Clear global overlays
  }
}
```

#### 3. **Update Single Mode Overlays**
```typescript
const updateSingleOverlayData = async (data) => {
  // Find all keys in single mode
  const singleModeKeys = await batchFetchPerformanceModes()
    .filter(mode => mode.touchMode === 'single')
    .map(mode => mode.key);
  
  if (!data) {
    // Clear single mode overlays
    singleModeKeys.forEach(keyId => {
      delete overlayData.value[keyId];
    });
    return;
  }
  
  // Fetch actual per-key values
  await processBatches(singleModeKeys, async (keyId) => {
    const travelResult = await KeyboardService.getSingleTravel(keyId);
    const deadzoneResult = await KeyboardService.getDpDr(keyId);
    
    overlayData.value[keyId] = {
      travel: Number(travelResult).toFixed(2),
      pressDead: Number(deadzoneResult.pressDead).toFixed(2),
      releaseDead: Number(deadzoneResult.releaseDead).toFixed(2)
    };
  });
}
```

#### 4. **Selection Presets**
```typescript
const selectWASD = () => {
  const wasdLabels = ['W', 'A', 'S', 'D'];
  const wasdKeys = layout.value.flat().filter(keyInfo => {
    const label = keyInfo.remappedLabel || keyMap[keyInfo.keyValue];
    return wasdLabels.includes(label.toUpperCase());
  });
  
  // Toggle if all WASD already selected, else add
  if (currentlySelectedWASD.length === wasdKeys.length) {
    selectedKeys.value = selectedKeys.value.filter(k => !isWASD);
  } else {
    selectedKeys.value = [...selectedKeys.value, ...wasdKeys];
  }
}
```

## Dependencies

### Services
- **KeyboardService**: Hardware communication for travel adjustments
- **Performance Mode APIs**:
  - `getPerformanceMode(keyId)`: Get global/single mode
  - `getSingleTravel(keyId)`: Get per-key travel
  - `getDpDr(keyId)`: Get press/release deadzones

### Utilities
- **useBatchProcessing**: Batch keyboard operations
- **useMappedKeyboard**: Fetch and manage layouts
- **keyMap**: Key code to label mapping

### Stores
- **useTravelProfilesStore**: User-saved travel profiles

### Components
- **KeyTravel.vue**: Main controls component (emits events to this page)

## Data Flow

```
Page Mounted
    ↓
fetchLayerLayout() - Get keyboard layout
    ↓
fetchRemappedLabels() - Get current key mappings
    ↓
User Selects Keys (click or preset buttons)
    ↓
selectedKeys array updated
    ↓
User Adjusts Settings in KeyTravel Component
    ↓
KeyTravel emits events:
  - @update-overlay (global mode change)
  - @update-single-overlay (single mode change)
  - @update-notification (status messages)
    ↓
Event Handlers Update Overlay Data
    ↓
Batch Fetch Current Travel Values
    ↓
overlayData updated
    ↓
UI Re-renders with New Overlay Values
```

## User Workflows

### Adjust Global Travel for All Keys
1. Click "Select All"
2. In KeyTravel panel, ensure mode is "Global"
3. Adjust travel slider (e.g., 2.5mm)
4. Adjust press/release deadzones
5. Click "Apply"
6. All keys update, overlays show new values

### Fine-Tune WASD Keys for Gaming
1. Click "Select WASD"
2. Switch mode to "Single"
3. Adjust travel to 1.5mm for faster actuation
4. Apply changes
5. WASD keys now have custom travel
6. Other keys unaffected

### Customize Individual Key
1. Click specific key on keyboard
2. Switch to Single mode
3. Adjust travel and deadzones
4. Apply
5. Only that key affected

## Overlay Display Format

### Example Overlay
```
┌─────────────┐
│      W      │  ← Key label (possibly remapped)
│    2.50     │  ← Travel distance (cyan)
│ 0.10    0.20│  ← Press Dead (green)  Release Dead (orange)
└─────────────┘
```

### Value Meanings
- **Travel (center)**: Actuation distance in mm
- **Press Dead (bottom-left)**: Distance from rest before key starts registering
- **Release Dead (bottom-right)**: Distance from actuation point before key releases

## Mode Behavior

### Global Mode
- All keys share the same travel setting
- Changing one changes all
- Efficient for uniform typing feel
- Overlay shows same values on all keys

### Single Mode
- Each key has independent travel
- More granular control
- Perfect for gaming or specialized layouts
- Each overlay can show different values

## Batch Processing Details

### Why Batching?
- Keyboards have limited command processing speed
- Sending 100+ commands simultaneously can cause timeouts
- Batching ensures reliable communication

### Configuration
- **Batch Size**: 80 keys per batch (defined in useBatchProcessing)
- **Delay**: 50ms between batches (configurable)
- **Auto-batching**: Handled transparently by utility

## Performance Mode Fetching

The page frequently fetches performance modes to determine which overlay system to use:

```typescript
await KeyboardService.getPerformanceMode(keyId)
  // Returns: { touchMode: 'global' | 'single' }
```

This determines:
- Which overlay update function to call
- Which keys to include in batch updates
- What values to display

## Error Handling
- Network failures logged to console
- Notifications show user-friendly errors
- Failed key fetches skipped, don't block others
- Graceful degradation (missing overlays just don't show)

## State Persistence
- **Selection**: Lost on page refresh
- **Overlays**: Fetched fresh on mount
- **Travel Settings**: Saved to keyboard hardware
- **Profiles**: Saved to Pinia store (persisted)

## Performance Optimizations

### Debounced Fetching
- Remapped labels fetched once on layout load
- Overlays fetched only when mode changes
- Not re-fetched on every selection change

### Selective Overlay Updates
- Only keys in relevant mode get overlays
- Global keys skip individual fetches
- Single keys skip global updates

## Accessibility
- High contrast overlays
- Large selection buttons
- Clear visual feedback for selected keys
- Keyboard navigation possible

## Styling Highlights
- Keys use gradient backgrounds
- Selected keys glow with accent color
- Overlays position-absolute, center-aligned
- Color-coded overlay values
- Settings panel bordered, full-width

## Known Limitations
- Overlay values are display-only (not editable inline)
- No visual diff between modified and default travel
- Selection doesn't persist across page navigation
- Can't save selection as preset
- No undo for travel changes

## Future Enhancements
- Inline overlay editing (click overlay to adjust)
- Visual indicators for non-default travel
- Save selection presets
- Undo/redo for travel changes
- Export/import travel profiles
- Per-game travel presets
- Heatmap visualization of travel values

## Developer Notes
- Physical key value used for overlay indexing (not keyValue)
- Remapped labels displayed but physical IDs used for commands
- Empty overlays (no data) simply don't render
- KeyTravel component handles actual setting changes
- This page is primarily for selection and visualization
- Watch handlers trigger remapped label refresh on layout changes
- 100ms delay on mount before fetching layout (ensures services ready)
