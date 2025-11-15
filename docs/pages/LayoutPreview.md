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
- Seven supported layouts:
  - 61-key (60% keyboard)
  - 67-key (65% keyboard)
  - 68-key (65% keyboard variant)
  - 80-key (TKL/80% keyboard)
  - 82-key (75% keyboard)
  - 84-key (75% keyboard variant)
  - 87-key (TKL keyboard)

### 2. **Layout Selector**
- Dropdown to choose layout size
- Selection persists to localStorage
- Immediate visual update on selection change
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
setup() {
  const layout = ref<any[][]>([]);
  const selectedLayout = ref<number | null>(null);
  const layouts = [61, 67, 68, 80, 82, 84, 87];
  ...
}
</script>
```

### Core Functionality

#### 1. **Grid Style Calculation**
```typescript
const gridStyle = computed(() => {
  const { keyPositions, gaps } = getLayoutConfig(selectedLayout.value ?? 82);
  
  if (!keyPositions || keyPositions.length === 0) {
    return { height: '0px', width: '0px' };
  }
  
  // Calculate total container height (sum of row heights + gaps)
  const containerHeight = keyPositions.reduce((max, row, i) => {
    const rowMaxHeight = Math.max(...row.map(pos => pos[1] + pos[3]));
    return max + rowMaxHeight + (gaps[i] || 0);
  }, 0);
  
  // Calculate max row width
  const maxRowWidth = Math.max(...keyPositions.map(row => 
    row.reduce((sum, pos) => sum + pos[2], 0)
  ));
  
  return {
    position: 'relative',
    height: `${containerHeight}px`,
    width: `${maxRowWidth}px`,
    margin: '0 auto'
  };
});
```

#### 2. **Key Style Calculation**
```typescript
const getKeyStyle = (rowIdx: number, colIdx: number) => {
  const { keyPositions, gaps } = getLayoutConfig(selectedLayout.value ?? 82);
  
  // Validate row/col indices
  if (!keyPositions[rowIdx] || colIdx >= keyPositions[rowIdx].length) {
    return { width: '0px', height: '0px', left: '0px', top: '0px' };
  }
  
  // Extract key position [left, top, width, height]
  const [left, top, width, height] = keyPositions[rowIdx][colIdx];
  const topGapPx = gaps[rowIdx] || 0;
  
  return {
    position: 'absolute',
    left: `${left}px`,
    top: `${top + topGapPx}px`,
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: '#444',
    boxSizing: 'border-box'
  };
}
```

#### 3. **Update Layout**
```typescript
const updateLayout = () => {
  const { keyPositions } = getLayoutConfig(selectedLayout.value ?? 82);
  layout.value = keyPositions;
  
  // Persist selection to localStorage
  localStorage.setItem('lastSelectedLayout', 
    selectedLayout.value?.toString() ?? '82');
}
```

#### 4. **Restore from localStorage**
```typescript
onMounted(() => {
  const savedLayout = localStorage.getItem('lastSelectedLayout');
  
  if (savedLayout && layouts.includes(parseInt(savedLayout))) {
    selectedLayout.value = parseInt(savedLayout);
  } else {
    selectedLayout.value = 82;  // Fallback to 82-key
  }
  
  updateLayout();
});
```

## Dependencies

### Utilities
- **getLayoutConfig** (`@utils/layoutConfigs`): Provides layout geometry data
  - `keyPositions`: Array of [left, top, width, height] for each key
  - `gaps`: Vertical spacing between rows

### Storage
- **localStorage**:
  - Key: `'lastSelectedLayout'`
  - Value: Layout number as string (e.g., "82")

## Data Flow

```
Page Mount
    ↓
onMounted() - Restore saved layout preference
    ↓
Read localStorage['lastSelectedLayout']
    ↓
If valid: Set selectedLayout to saved value
Else: Default to 82
    ↓
updateLayout() - Load layout config
    ↓
getLayoutConfig(selectedLayout)
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
Fetch new layout config
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
- **Last selected layout**: Layout number (61, 67, etc.)

### What's Not Saved
- Layout configurations themselves (static, from code)
- Visual state (scroll position, etc.)

### Storage Location
- Browser localStorage
- Key: `'lastSelectedLayout'`
- Persists across sessions

## Error Handling

### Invalid Saved Layout
- If stored value not in `layouts` array, defaults to 82
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
- Custom layout editor
- Zoom/pan controls for large layouts
- Highlight specific keys (e.g., modifiers)
- 3D perspective view

## Developer Notes
- Uses same `layoutConfigs` as other pages
- Completely standalone (no keyboard connection needed)
- Useful for testing layout rendering logic
- Can add new layouts by updating `layouts` array and `layoutConfigs.ts`
- Key sizes in pixels (not percentage or em units)
- No key labels rendered (simplifies implementation)
- LocalStorage fallback ensures page never breaks
- Good reference for understanding layout coordinate systems
