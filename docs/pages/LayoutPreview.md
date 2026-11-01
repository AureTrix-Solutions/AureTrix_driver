# Layout Preview Page Documentation

## Overview
The Layout Preview page provides a visual representation of different keyboard physical layouts. It allows users to preview the geometry and key positions of various keyboard sizes (61-key, 82-key, etc.) without needing an actual keyboard connected. This is useful for understanding layout differences and verifying layout configurations.

## Purpose
- Preview different keyboard layout geometries
- Visualize key positions and sizes
- Test layout configurations
- Educational tool for understanding keyboard form factors
- Development aid for testing layout rendering

## Key Features

### 1. **Multiple Layout Support**
- Seven built-in layouts:
  - 61-key (60% keyboard)
  - 67-key (65% keyboard)
  - 68-key (65% keyboard variant)
  - 80-key (TKL/80% keyboard)
  - 82-key (75% keyboard)
  - 84-key (75% keyboard variant)
  - 87-key (TKL keyboard)
- Plus user-created custom layouts (IndexedDB, created in the Layout Creator page)

### 2. **Layout Selector**
- Dropdown to choose layout size
- Selection persists to localStorage
- Immediate visual update on selection change
- Custom layouts appear in a "Custom Layouts" optgroup when present
- Defaults to 82-key if no saved preference

### 3. **Accurate Key Positioning**
- Uses real layout configurations from `layoutConfigs.ts`
- Absolute positioning for pixel-perfect accuracy
- Accounts for row gaps and key sizes
- Matches physical keyboard dimensions

### 4. **State Persistence**
- Remembers last selected layout
- Restores on page reload
- Stored in browser localStorage

## User Interface Elements

### Title & Controls
- **Page Title**: "Layout Preview"
- **Layout Selector**:
  - Label: "Select Layout:"
  - Dropdown showing sizes (e.g., "61-key", "82-key")
  - "Custom Layouts" optgroup (rendered only when custom layouts exist), each option valued by productName
  - Immediately updates preview on change

### Layout Display
- **Key Grid**: Visual representation of keyboard
- **Keys**: Rendered as gray rectangles (#444)
- **Positioning**: Absolute positioned to match physical layout
- **Spacing**: Respects row gaps and key spacing

## Technical Implementation

### Component Setup
```vue
<script lang="ts">
import { getLayoutConfig, refreshCustomLayouts } from '@utils/layoutConfigs';
import LayoutStorageService, { type CustomLayoutConfig } from '@/services/LayoutStorageService';

setup() {
  const layout = ref<number[][][]>([]);
  const selectedLayout = ref<number | string | null>(null); // Number or productName string
  const layouts = [61, 67, 68, 80, 82, 84, 87];
  const customLayouts = ref<CustomLayoutConfig[]>([]);

  const layoutData = ref<ReturnType<typeof getLayoutConfig>>({ rows: 0, cols: 0, keyPositions: [], gaps: [] });
  ...
}
</script>
```

### Core Functionality

#### 1. **Grid Style Calculation**
```typescript
const gridStyle = computed<CSSProperties>(() => {
  const { keyPositions, gaps } = layoutData.value;
  if (!keyPositions || keyPositions.length === 0) {
    return { height: '0px', width: '0px' } as CSSProperties;
  }
  const containerHeight = keyPositions.reduce((max: number, row: number[][], i: number) => max + Math.max(...row.map((pos: number[]) => pos[1] + pos[3])) + (gaps[i] || 0), 0);
  const maxRowWidth = Math.max(...keyPositions.map((row: number[][]) => row.reduce((sum: number, pos: number[]) => sum + pos[2], 0)));
  return {
    position: 'relative',
    height: `${containerHeight}px`,
    width: `${maxRowWidth}px`,
    margin: '0 auto',
  };
});
```

#### 2. **Key Style Calculation**
```typescript
const getKeyStyle = (rowIdx: number, colIdx: number): CSSProperties => {
  const { keyPositions, gaps } = layoutData.value;
  const rowLength = keyPositions[rowIdx]?.length || 0;
  if (!keyPositions || !keyPositions[rowIdx] || !Array.isArray(keyPositions[rowIdx]) || colIdx >= rowLength) {
    return { width: '0px', height: '0px', left: '0px', top: '0px' } as CSSProperties;
  }
  const [left, top, width, height] = keyPositions[rowIdx][colIdx];
  const topGapPx = gaps[rowIdx] || 0;
  return {
    position: 'absolute',
    left: `${left}px`,
    top: `${top + topGapPx}px`,
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: '#444',
    boxSizing: 'border-box',
  };
};
```

#### 3. **Update Layout**
```typescript
const updateLayout = () => {
  const productName = typeof selectedLayout.value === 'string' ? selectedLayout.value : undefined;
  const keyCount = typeof selectedLayout.value === 'number' ? selectedLayout.value : 82;

  const config = getLayoutConfig(keyCount, undefined, undefined, undefined, undefined, productName);
  layoutData.value = config;
  layout.value = config.keyPositions;
  localStorage.setItem('lastSelectedLayout', selectedLayout.value?.toString() ?? '82');
}
```

#### 4. **Load Custom Layouts**
```typescript
const loadCustomLayouts = async () => {
  try {
    customLayouts.value = await LayoutStorageService.getAllLayouts();
    await refreshCustomLayouts();
  } catch (error) {
    console.warn('Failed to load custom layouts:', error);
  }
};
```

#### 5. **Restore from localStorage**
```typescript
onMounted(async () => {
  await loadCustomLayouts();

  const savedLayout = localStorage.getItem('lastSelectedLayout');
  if (savedLayout) {
    // Check if it's a custom layout
    const isCustom = customLayouts.value.some(layout => layout.productName === savedLayout);
    if (isCustom) {
      selectedLayout.value = savedLayout;
    } else if (layouts.includes(parseInt(savedLayout))) {
      selectedLayout.value = parseInt(savedLayout);
    } else {
      selectedLayout.value = 82; // Fallback
    }
  } else {
    selectedLayout.value = 82; // Fallback
  }

  await updateLayout();
});
```

## Dependencies

### Utilities
- **getLayoutConfig** (`@utils/layoutConfigs`): Provides layout geometry data
  - `keyPositions`: Array of [left, top, width, height] for each key
  - `gaps`: Vertical spacing between rows
- **refreshCustomLayouts** (`@utils/layoutConfigs`): reloads the module-level custom-layout cache from IndexedDB

### Services
- **LayoutStorageService** (`@/services/LayoutStorageService`): `getAllLayouts()` returns `CustomLayoutConfig[]` (custom layouts from IndexedDB)

### Storage
- **localStorage**:
  - Key: `'lastSelectedLayout'`
  - Value: Built-in layout number (e.g., "82") or custom layout productName, as string

## Data Flow

```
Page Mount
    ↓
onMounted() (async) - loadCustomLayouts() first, then restore preference
    ↓
Read localStorage['lastSelectedLayout']
    ↓
If saved value matches a custom productName: restore it as string
Else if valid built-in number: restore as number
Else: Default to 82
    ↓
updateLayout() - Load layout config
    ↓
getLayoutConfig(keyCount, ..., productName) → layoutData
    ↓
layout.value = keyPositions matrix
    ↓
gridStyle computed - Calculate container size
    ↓
getKeyStyle() - Calculate each key position
    ↓
UI Renders Keys
    ↓
User Changes Layout Dropdown
    ↓
@change="updateLayout"
    ↓
Fetch new layout config (built-in by keyCount, custom by productName)
    ↓
Save to localStorage
    ↓
UI Re-renders with New Layout
```

## User Workflow

### View Different Layouts
1. Navigate to Layout Preview page
2. See default layout (82-key or last selected)
3. Click dropdown
4. Select different size (e.g., "61-key")
5. Layout immediately updates
6. Keys reposition to match new geometry

### Restore Previous Selection
1. Select layout (e.g., 67-key)
2. Navigate away from page
3. Return to Layout Preview
4. Previous selection restored automatically

## Layout Configuration Details

### Key Position Array Structure
```typescript
// Each key: [left, top, width, height]
keyPositions: [
  // Row 0
  [
    [0, 0, 50, 50],      // First key
    [52, 0, 50, 50],     // Second key (2px gap)
    [104, 0, 100, 50],   // Third key (wider, e.g., Tab)
    // ...
  ],
  // Row 1
  [
    [0, 54, 50, 50],     // First key of second row
    // ...
  ]
]

// Row gaps (vertical spacing between rows)
gaps: [0, 4, 4, 4, 4, 12]  // Extra space after each row
```

### Layout Differences

#### 61-Key (60%)
- Compact layout
- No function row, no nav cluster
- ~12" wide

#### 67-Key / 68-Key (65%)
- Adds arrow keys and nav column
- No function row
- ~13" wide

#### 80-Key / 82-Key / 84-Key (75%)
- Compact TKL
- Includes function row
- Compressed nav cluster
- ~14-15" wide

#### 87-Key (TKL)
- Full ten-key-less
- Separate nav cluster
- ~17" wide

## Positioning Logic

### Absolute Positioning
- Container has `position: relative`
- Keys have `position: absolute`
- Each key's `left` and `top` calculated from layout config

### Row Gaps
- Extra vertical space between rows
- Simulates physical keyboard spacing
- Accumulated when calculating `top` positions

### Container Sizing
- Height: Sum of all row heights + gaps
- Width: Widest row's total width
- Centered with `margin: 0 auto`

## State Persistence

### What's Saved
- **Last selected layout**: built-in layout number (61, 67, etc.) or custom layout productName

### What's Not Saved
- Layout configurations themselves (built-ins from code; custom layouts live in IndexedDB via LayoutStorageService)
- Visual state (scroll position, etc.)

### Storage Location
- Browser localStorage
- Key: `'lastSelectedLayout'`
- Persists across sessions

## Error Handling

### Invalid Saved Layout
- If stored value matches a custom layout productName, it is restored; else if not in `layouts` array, defaults to 82
- Prevents crashes from manual localStorage editing

### Missing Layout Config
- If `keyPositions` empty, renders 0x0 grid
- Graceful degradation (no crash)

### Invalid Row/Col Indices
- `getKeyStyle()` validates before accessing array
- Returns invisible key (0px size) if out of bounds

## Performance Considerations

### Computed Properties
- `gridStyle` recalculates only when layout changes
- Efficient reactive updates

### Minimal Re-renders
- Only affected keys re-render on layout change
- Vue's virtual DOM optimizes rendering

## Accessibility
- Dropdown keyboard-navigable
- Clear visual layout representation
- High contrast (though keys are gray, outline visible)

## Styling Highlights

### Key Styling
```scss
.key-preview {
  position: absolute;
  border-radius: v.$border-radius * 1;  // Rounded corners
  background-color: #444;               // Dark gray
  box-sizing: border-box;               // Includes border in size
}
```

### Container Styling
- Centered horizontally with `margin: 0 auto`
- Minimum height 200px
- Width/height calculated dynamically

## Known Limitations
- Keys are plain rectangles (no labels)
- No hover effects or interactivity
- Doesn't reflect actual key mappings
- No 100% (full-size) layout support
- Can't zoom or scale view

## Future Enhancements
- Display key labels on preview
- Hover tooltips with key info
- Side-by-side layout comparison
- Export layout as image
- Zoom/pan controls for large layouts
- Highlight specific keys (e.g., modifiers)
- 3D perspective view

## Developer Notes
- Uses same `layoutConfigs` as other pages
- Completely standalone (no keyboard connection needed)
- Useful for testing layout rendering logic
- Built-in layouts: add to `layouts` array + `layoutConfigs.ts`. Custom layouts: created in Layout Creator, stored in IndexedDB, resolved by productName (Priority 1 in getLayoutConfig)
- Key sizes in pixels (not percentage or em units)
- No key labels rendered (simplifies implementation)
- LocalStorage fallback ensures page never breaks
- Good reference for understanding layout coordinate systems
