# Key Mapping Page Documentation

## Overview
The Key Mapping page provides a comprehensive interface for remapping keyboard keys across four different layers (Fn0-Fn3). It features drag-and-drop functionality, multi-key selection, categorized key browsers, and batch operations, making it easy to customize keyboard layouts for different use cases.

## Purpose
- Remap individual or multiple keys to different functions
- Support multi-layer configurations (Fn0, Fn1, Fn2, Fn3)
- Enable complex gaming, productivity, or specialized key layouts
- Provide intuitive visual and drag-drop interfaces for key customization

## Key Features

### 1. **Layer Management**
- Four independent layers (Fn0-Fn3)
- Switch between layers via dropdown
- Each layer stores unique key mappings
- Reset any layer to defaults

### 2. **Multi-Select Mode**
- Toggle multi-select to choose multiple keys at once
- Visual highlighting of selected keys
- Bulk remap all selected keys to the same value
- Select All / Deselect All quick actions

### 3. **Categorized Key Browser**
- Keys organized into logical categories:
  - Letters, Numbers, Function Keys
  - Modifiers (Ctrl, Alt, Shift, etc.)
  - Navigation (Arrows, Home, End, etc.)
  - Media Controls
  - Special Keys
- Filter keys by category for easier finding

### 4. **Dual Interaction Methods**
- **Click Selection**: Click a virtual key, then click a keyboard key to remap
- **Drag & Drop**: Drag virtual key onto keyboard key for instant remap

### 5. **Batch Operations**
- Remap multiple keys simultaneously
- Automatic batching with configurable batch size (80 keys per batch)
- Delay between batches to prevent overwhelming the keyboard hardware
- Progress handled automatically

## User Interface Elements

### Top Controls Bar
- **Layer Selector**: Dropdown to choose Fn0-Fn3
- **Category Selector**: Dropdown to filter virtual keys by category
- **Apply Button**: Appears when keys are selected and a remap value is chosen
- **Select Multi / Stop Multi-Select**: Toggle multi-selection mode
- **Select All / Deselect All**: Quick selection toggles
- **Reset Mapping**: Restore current layer to factory defaults

### Keyboard Grid
- Visual representation of physical keyboard layout
- Displays current key values (respecting layer-specific mappings)
- Selected keys highlighted with accent color border and glow
- Drag-drop target indicators on hover

### Virtual Keys Panel
- Only visible after selecting a category
- Grid of available keys for remapping
- Draggable items
- Click to select, highlighted when chosen
- Hint text: "Click or drag a key to select it for remapping"

## Technical Implementation

### Component Setup
```vue
<script>
setup() {
  const selectedLayer = ref(0);  // Current Fn layer (0-3)
  const selectedCategory = ref<string | null>(null);
  const selectedKeyValue = ref<number | null>(null);
  const selectedKeys = ref<{ rowIdx, colIdx }[]>([]);
  const isMultiSelect = ref(false);
  ...
}
</script>
```

### Core Functionality

#### 1. **Single Key Remap**
```typescript
const remapKey = async (rowIdx, colIdx, newValue) => {
  const targetKey = baseLayout.value[rowIdx][colIdx];
  const config = [{ 
    key: targetKey.keyValue, 
    layout: selectedLayer.value, 
    value: newValue 
  }];
  await batchSetKey(config);
  await fetchLayerLayout();  // Refresh to show changes
}
```

#### 2. **Bulk Remap**
```typescript
const applyBulkRemap = async () => {
  const config = selectedKeys.value.map(({ rowIdx, colIdx }) => ({
    key: baseLayout.value[rowIdx][colIdx].keyValue,
    layout: selectedLayer.value,
    value: selectedKeyValue.value
  }));
  
  // Process in batches
  for (let i = 0; i < config.length; i += batchSize.value) {
    const batch = config.slice(i, i + batchSize.value);
    await batchSetKey(batch);
    await delay(delayMs.value);  // Prevent hardware overload
  }
  
  await KeyboardService.reloadParameters();
  await fetchLayerLayout();
}
```

#### 3. **Reset Layer**
```typescript
const setDefaultLayer = async () => {
  const config = baseLayout.value.flat().map(key => ({
    key: key.keyValue,
    layout: selectedLayer.value,
    value: key.keyValue  // Reset to self
  }));
  // Batch process same as bulk remap
}
```

### Drag & Drop System

#### Drag Start
```typescript
const onDragStart = (event) => {
  const keyValue = parseInt(target.getAttribute('data-key-value'));
  draggedKey.value = keyValue;
  event.dataTransfer?.setData('text/plain', keyValue.toString());
}
```

#### Drop Handler
```typescript
const onDrop = (keyInfo, rowIdx, colIdx) => {
  if (draggedKey.value !== null) {
    remapKey(rowIdx, colIdx, draggedKey.value);
  }
}
```

## Dependencies

### Services
- **KeyboardService**: Sends remap commands via SparkLink SDK
- **MappedKeyboard Utility**: Fetches and manages keyboard layouts

### Stores
- **ConnectionStore**: Verifies device connection before operations

### Utilities
- **keyMap**: Translates key codes to readable labels
- **keyCategories**: Provides category organization
- **categorizedKeys()**: Returns keys grouped by category

## Data Flow

```
User Selects Layer (Fn0-Fn3)
    ↓
fetchLayerLayout() - Get current mappings for layer
    ↓
User Selects Category
    ↓
filteredKeyMap displays virtual keys
    ↓
User Drags/Clicks Virtual Key
    ↓
selectedKeyValue = key code
    ↓
User Clicks/Drops on Keyboard Key
    ↓
remapKey() or applyBulkRemap()
    ↓
batchSetKey() - Send to hardware
    ↓
KeyboardService.reloadParameters()
    ↓
fetchLayerLayout() - Refresh display
    ↓
UI shows updated key labels
```

## User Workflows

### Simple Single Key Remap
1. Select layer (e.g., Fn1)
2. Select category (e.g., "Media Controls")
3. Click "Play/Pause" in virtual keys
4. Click target key on keyboard (e.g., F9)
5. Key instantly remapped, label updates

### Bulk Remap (e.g., Swap WASD to Arrow Keys)
1. Click "Select Multi"
2. Click W, A, S, D keys on keyboard
3. Select "Navigation" category
4. Click "Up Arrow" virtual key
5. Click "Apply to 4 Keys"
6. All four keys remapped to arrows

### Drag and Drop
1. Select category
2. Drag virtual key from browser
3. Drop onto keyboard key
4. Instant remap

### Reset Layer
1. Select layer to reset
2. Click "Reset Mapping"
3. All keys in layer restore to defaults

## Error Handling
- Checks connection before operations
- Gracefully handles missing layout data
- Console logs errors for debugging
- UI shows "No keyboard layout available" when disconnected
- Batch operations include delays to prevent timeout

## Performance Optimizations

### Batching
- **Batch Size**: 80 keys per batch (configurable)
- **Delay**: 0ms default between batches (configurable)
- Prevents overwhelming keyboard hardware with rapid commands

### Lazy Layout Loading
- Layouts fetched only when layer changes
- Cached in component state
- Minimal re-fetching

## State Persistence
- No persistence on this page
- All remaps saved directly to keyboard hardware
- Changes persist across app restarts (stored in keyboard firmware)

## Accessibility
- Keyboard navigation possible
- Visual feedback for all interactions
- High contrast selected state
- Large, clickable targets

## Styling Highlights
- Absolute positioned keys match physical layout
- Gradient backgrounds simulate 3D key caps
- Accent color highlights for selection
- Virtual key grid with uniform sizing
- Smooth transitions for hover/selection states

## Known Limitations
- Batch size and delay are hardcoded (could be user-configurable)
- No undo/redo functionality
- No visual diff showing changed keys vs defaults
- Can't copy mappings from one layer to another

## Future Enhancements
- Visual indicators for remapped keys (vs defaults)
- Copy layer mappings
- Export/import layer configurations
- Undo/redo stack
- Search functionality in virtual keys
- Favorite/recent keys quick access

## Developer Notes
- Base layout is immutable (represents physical keys)
- Current layout shows active mappings per layer
- Always reload parameters after batch operations
- Multi-select state cleared when toggling off
- Category selection triggers virtual key panel visibility
