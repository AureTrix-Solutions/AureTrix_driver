# LayoutCreator Page Documentation

## Overview
The Layout Creator (titled "Keyboard Creator" in the UI) is a visual keyboard layout builder that allows users to create, customize, and share physical keyboard layout configurations. It enables precise control over key sizes, row configurations, and gaps, storing layouts in IndexedDB for persistence and supporting JSON export/import for sharing.

## Purpose
- Create custom keyboard layouts for unsupported or custom keyboards
- Visually edit key sizes using preset units or precise mm values
- Configure row gaps and key gaps with 0.1mm precision
- Save layouts locally via IndexedDB for automatic loading
- Export layouts as JSON for backup or community sharing
- Contribute layouts to the sharedLayout.ts community repository

## Key Features

### 1. Dynamic Row Configuration
- **Up to 10 rows supported**: Automatically adjusts based on keyboard structure
- **Per-row key count**: Set number of keys for each row independently
- **Per-row gap**: Configure vertical spacing between rows in mm
- **Automatic row detection**: Loads hardware row structure when keyboard connected

### 2. Multi-Select Key Editing
- **Click to select**: Click individual keys to select/deselect
- **Multi-key selection**: Select multiple keys and apply settings to all at once
- **Selection count display**: Shows number of selected keys in header
- **Clear selection button**: Quickly deselect all keys

### 3. Key Size Configuration
- **Preset sizes**: Common sizes (1u, 1.25u, 1.5u, 1.75u, 2u, 2.25u, 2.75u, 6.25u, etc.)
- **Custom mm values**: Fine-tune any size with 0.1mm precision
- **Gap after key**: Add horizontal gap after specific keys (for layout spacing)
- **Industry standard**: Uses 1u = 19.05mm measurement

### 4. Hardware Integration
- **Auto-load from hardware**: When keyboard connected, loads actual key count per row
- **Product name detection**: Automatically uses connected keyboard's product name
- **Fallback layout**: Shows 6-row default layout when no keyboard connected
- **Connection watchers**: Reloads layout on device connect/disconnect

### 5. Storage & Sharing
- **IndexedDB persistence**: Layouts saved locally, survive browser refresh
- **JSON export**: Download layout as JSON file for backup
- **JSON import**: Load layout from JSON file
- **Community sharing**: Generate GitHub issue link to contribute layout to sharedLayout.ts
- **Duplicate detection**: Prevents overwriting existing community layouts

## User Interface Elements

### Virtual Keyboard Grid
- Displays all keys with their current size in units (e.g., "1u", "1.25u")
- Selected keys highlighted with cyan border
- Keys positioned using absolute pixel positioning
- Grid resizes dynamically based on content

### Bottom Section

#### Action Buttons
- **Save Layout**: Save current layout to IndexedDB
- **Export Layout**: Download layout as JSON file
- **Import Layout**: Load layout from JSON file
- **Share**: Generate GitHub issue link (disabled if community layout exists)
- **Cancel**: Return to previous page

### Settings Panel

#### Product Name Section
- **Product Name**: Text input for keyboard identifier (used as storage key)
- **Load Saved Layout**: Dropdown to load previously saved layouts from IndexedDB

#### Row Keycount/Gap Section
- **Row0-Row9**: Number inputs for key count per row (0 = row hidden)
- **Gap0-Gap9**: Number inputs for vertical gap after each row in mm

#### Edit Keys Section
- **Size (Preset)**: Dropdown for common key unit sizes
- **Size (mm)**: Direct mm input for custom sizes
- **Gap After (mm)**: Horizontal gap after selected key(s)
- **Clear button**: Deselect all keys

## Technical Implementation

### Component Setup
```typescript
setup() {
  const productName = ref('');
  const rowCounts = ref<(number | undefined)[]>([]);
  const rowGaps = ref<(number | undefined)[]>([]);
  const virtualKeyboard = ref<VirtualKey[][]>([]);
  const selectedKeys = ref<{ row: number; col: number }[]>([]);
  const selectedKeyData = ref<VirtualKey>({ size: 1, sizeMm: 19.05, gap: 0 });
  const savedLayouts = ref<CustomLayoutConfig[]>([]);
}
```

### VirtualKey Interface
```typescript
interface VirtualKey {
  size: number;    // Units (1, 1.25, 2, etc.)
  sizeMm: number;  // Actual mm value
  gap: number;     // Gap after key in mm
}
```

### Layout Data Format (IndexedDB/Export)
```typescript
interface CustomLayoutConfig {
  productName: string;
  hasAxisList: boolean;
  keySizes: number[][];        // 2D array of key sizes in mm
  gapsAfterCol: Record<number, number>[];  // Gaps after specific columns
  rowSpacing: number[];        // Vertical spacing per row
  createdAt: number;
  updatedAt: number;
}
```

### Key Positioning Algorithm
```typescript
const getKeyStyle = (rowIdx: number, colIdx: number) => {
  let top = 0;
  let left = 0;

  // Calculate vertical position
  for (let i = 0; i < rowIdx; i++) {
    top += mmToPx(uToMm(1));           // Key height
    top += mmToPx((rowGap || 0) + 1);  // User gap + 1mm spacing
  }

  // Calculate horizontal position
  for (let i = 0; i < colIdx; i++) {
    left += mmToPx(key.sizeMm);         // Key width
    left += mmToPx(key.gap);            // Gap after key
    left += mmToPx(1);                  // 1mm built-in spacing
  }

  return { position: 'absolute', top, left, width, height };
};
```

### Hardware Layout Loading
```typescript
const loadHardwareLayout = async () => {
  // Retry with exponential backoff (5 attempts)
  const baseLayout = await KeyboardService.defKey();
  const paddedKeySizes = getPaddedKeySizes(baseLayout);
  
  // Convert to VirtualKey format
  const keyboard = paddedKeySizes.map(row => 
    row.map(sizeMm => ({ size: sizeMm / 19.05, sizeMm, gap: 0 }))
  );
  
  virtualKeyboard.value = keyboard;
  rowCounts.value = paddedKeySizes.map(row => row.length);
};
```

## Dependencies

### Services
- **LayoutStorageService**: IndexedDB CRUD operations for layouts
- **KeyboardService**: Hardware communication for layout detection

### Utilities
- **keyUnits.ts**: `uToMm()`, `mmToPx()`, `KEY_SIZES` constants
- **layoutConfigs.ts**: `getPaddedKeySizes()`, `refreshCustomLayouts()`
- **sharedLayout.ts**: Community layout definitions

### Store
- **connectionStore**: Device connection state, product name

## Data Flow

```
Page Mount
    |
    v
initializeFallbackLayout() --> Show 6-row default
    |
    v
Check connectionStore.isInitialized
    |
    +--> If connected: loadHardwareLayout()
    |                      |
    |                      v
    |               getPaddedKeySizes(baseLayout)
    |                      |
    |                      v
    |               Build virtualKeyboard from actual key counts
    |
    v
User edits keys
    |
    v
selectedKeyData updates --> updateSelectedKey()
    |
    v
virtualKeyboard row/key modified
    |
    v
Save Layout clicked
    |
    v
LayoutStorageService.saveLayout()
    |
    v
refreshCustomLayouts() --> Update global cache
```

## User Workflows

### Create New Layout
1. Connect keyboard (optional - will auto-detect structure)
2. Enter product name
3. Adjust row key counts if needed
4. Click keys to select
5. Adjust size using preset or mm input
6. Add gaps between keys as needed
7. Click "Save Layout"

### Edit Existing Layout
1. Select layout from "Load Saved Layout" dropdown
2. Layout populates with saved configuration
3. Make changes to keys/gaps
4. Click "Save Layout" to update

### Export for Sharing
1. Create or load layout
2. Click "Export Layout"
3. JSON file downloads with layout configuration

### Import Layout
1. Click "Import Layout"
2. Select JSON file
3. Layout loads and can be saved locally

### Contribute to Community
1. Create layout for keyboard not in sharedLayout.ts
2. Click "Share" button
3. GitHub issue page opens with pre-filled layout code
4. Submit issue for review

## Error Handling

### Connection Errors
- Falls back to 6-row default layout if hardware unavailable
- Retries hardware fetch with exponential backoff (5 attempts)
- Logs warnings for failed operations

### Validation
- Empty product name: Save/Export silently fails
- Empty keyboard: Operations silently fail
- Community layout exists: Share button disabled with message

### Storage Errors
- IndexedDB errors logged to console
- User can retry save/load operations

## Known Limitations

- Maximum 10 rows supported
- No undo/redo functionality
- Single keyboard layout per product name
- Cannot delete saved layouts from UI (must use browser dev tools)
- Share button generates GitHub link only (no direct submission)

## Future Enhancements

- Delete saved layouts from UI
- Undo/redo for key edits
- Drag-and-drop key reordering
- Visual row gap preview
- Layout preview mode (read-only)
- Multiple layouts per keyboard support
- Direct layout submission API

---

*Last Updated: November 26, 2025*
