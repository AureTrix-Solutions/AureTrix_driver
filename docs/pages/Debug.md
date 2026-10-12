# Debug Page Documentation

> **⚠️ Development Only**: This page is intended for development and debugging purposes only. It may not be included in production builds and should not be relied upon by end users.

## Overview
The Debug page is a comprehensive developer tool that provides raw access to all SparkLink SDK keyboard data getters. It displays a visual keyboard for key selection and a collapsible debug panel with buttons to fetch every available data type. This page is essential for development, testing, and troubleshooting keyboard configurations.

## Purpose
- Inspect raw keyboard data from all SDK getters
- Test keyboard responses without building full UIs
- Verify hardware configuration and status
- Debug issues with travel, lighting, axis, and other settings

## Audience
This page is designed for **developers and advanced users only**. It exposes raw SDK data and low-level debugging tools that are not intended for typical keyboard configuration workflows.

## Key Features

### 1. **Complete SDK Getter Coverage**
- 16+ individual getter methods accessible via buttons
- Grouped by category (travel, lighting, axis, etc.)
- Both global and per-key data fetchers
- "All Getters" button for bulk data retrieval

### 2. **Visual Key Selection**
- Interactive keyboard grid
- Click to select key for per-key getters
- Selected key highlighted with accent glow
- Key selection required for relevant getters

### 3. **Collapsible Debug Window**
- Details element (click to expand/collapse)
- Organized getter buttons
- JSON data display with syntax highlighting
- Loading states and error messages

### 4. **Mode Testing Controls**
- Set Single Mode button
- Set Global Mode button
- Test mode switching functionality
- Immediate re-fetch to verify changes

## User Interface Elements

### Title & Notification Bar
- Page title: "Debug Raw Keyboard Data"
- Notification bar for success/error messages
- Auto-dismiss after 3 seconds

### Keyboard Grid
- Visual keyboard layout (default layer 0)
- Click keys to select for per-key getters
- Selected key highlighted with accent color
- Shows current key labels

### Debug Window (Collapsible)
- **Summary Header**: "Getter Controls & Results (Click to toggle)"
- **Open by Default**: Details element starts expanded

### Control Sections

#### Getter Buttons
- **Clear Data**: Reset all fetched data
- **All Getters**: Fetch all available data at once
- **Individual Getters**:
  - Global Travel
  - Perf Mode
  - DKS Travel
  - DB Travel
  - RT Travel
  - Single Travel
  - DP/DR (deadzones)
  - Axis
  - Axis List
  - Lighting
  - Logo Lighting
  - Custom Lighting
  - Special Lighting
  - RM6x21 Travel
  - RM6x21 Calibration

#### Test Buttons
- **Set Single Mode**: Switch selected key to single mode
- **Set Global Mode**: Switch selected key to global mode

### Data Display
- **Loading State**: "Loading..." text during fetch
- **Data Sections**: One per fetched method
- **Section Format**:
  - Method name as header (e.g., "GET GLOBAL TOUCH TRAVEL")
  - JSON data in `<pre>` block with formatting
- **Error State**: Red background error messages
- **Scrollable**: Max-height 400px with vertical scroll

## Technical Implementation

### Component Setup
```vue
<script lang="ts">
setup() {
  const selectedKey = ref<IDefKeyInfo | null>(null);
  const rawData = ref<{ [key: string]: any }>({});
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  
  // Uses KeyboardService (the main hardware wrapper)
  ...
}
</script>
```

### Core Functionality

#### 1. **Fetch Individual Method**
```typescript
const fetchMethod = async (method: string) => {
  // Validate key selection for per-key methods
  if (!selectedKey.value && requiresKey(method)) {
    error.value = 'Select a key first';
    return;
  }
  
  isLoading.value = true;
  const keyValue = selectedKey.value?.keyValue || 1;
  
  let result: any;
  switch (method) {
    case 'getGlobalTouchTravel':
      result = await KeyboardService.getGlobalTouchTravel();
      break;
    case 'getPerformanceMode':
      result = await KeyboardService.getPerformanceMode(keyValue);
      break;
    // ... more cases
  }
  
  rawData.value[method] = result;
  console.log(`Debug fetched ${method}:`, result);
}
```

#### 2. **Fetch All Data**
```typescript
const fetchAllData = async () => {
  isLoading.value = true;
  
  await Promise.all([
    fetchMethod('getGlobalTouchTravel'),
    fetchMethod('getPerformanceMode'),
    fetchMethod('getDksTravel'),
    // ... all 16 methods
  ]);
  
  isLoading.value = false;
}
```

#### 3. **Mode Testing**
```typescript
const setSingleMode = async () => {
  if (!selectedKey.value) return;
  
  const result = await KeyboardService.setPerformanceMode(
    selectedKey.value.keyValue, 
    'single', 
    0
  );
  
  // Re-fetch to verify
  await fetchMethod('getPerformanceMode');
}
```

#### 4. **Clear Data**
```typescript
const clearData = () => {
  rawData.value = {};
  error.value = null;
  console.log('Debug data cleared');
}
```

## Dependencies

### Services
- **KeyboardService**: The main hardware wrapper (singleton, `@services/KeyboardService`)
  - SDK getter methods used by the page
  - Connection managed app-wide by KeyboardService (no separate debug connection)

### Utilities
- **useMappedKeyboard**: Fetch keyboard layout
- **keyMap**: Display key labels

### Stores
- None directly (debug service manages own connection)

## Data Flow

```
Page Mount
    ↓
fetchLayerLayout() - Get keyboard visual
    ↓
User Selects Key on Keyboard
    ↓
selectedKey updated
    ↓
fetchMethod(methodName)
    ↓
KeyboardService.[method](keyValue)
    ↓
rawData[methodName] = result
    ↓
UI Re-renders Data Section
    ↓
JSON displayed in <pre> block
```

## User Workflows

### Inspect Global Settings
1. Navigate to Debug page
2. Wait for auto-connect and initial data load
3. Review data sections:
   - "GET GLOBAL TOUCH TRAVEL" shows global settings
   - "GET LIGHTING" shows RGB config
   - "GET AXIS LIST" shows axis assignments
4. No key selection needed

### Debug Specific Key
1. Click key on keyboard (e.g., 'A')
2. Key highlights
3. Click "Perf Mode" button
4. See mode for 'A' key (global/single)
5. Click "Single Travel" button
6. See travel distance for 'A'
7. Click "Custom Lighting" button
8. See RGB color for 'A'

### Test Mode Switching
1. Select a key
2. Click "Get Perf Mode" (see current mode)
3. Click "Set Single Mode"
4. Observe perf mode auto-refreshed
5. Verify mode changed to "single"
6. Click "Set Global Mode"
7. Verify mode changed back to "global"

### Bulk Data Retrieval
1. Click "All Getters" button
2. Wait for all 16 methods to fetch
3. Scroll through data sections
4. Review all keyboard configuration at once

## Available Getters

### Travel & Performance
- **getGlobalTouchTravel**: Global travel settings for all keys
- **getPerformanceMode**: Per-key mode (global/single)
- **getDksTravel**: DKS (Dynamic KeyStroke) travel settings
- **getDbTravel**: Deadband travel settings
- **getRtTravel**: Rapid Trigger travel settings
- **getSingleTravel**: Per-key travel distance
- **getDpDr**: Press/Release deadzones (per-key)

### Axis & Analog
- **getAxis**: Per-key axis assignment
- **getAxisList**: All axis mappings

### Lighting
- **getLighting**: Global RGB lighting mode
- **getLogoLighting**: Keyboard logo RGB settings
- **getCustomLighting**: Per-key RGB color
- **getSpecialLighting**: Special effects settings

### Calibration & Matrix
- **getRm6x21Travel**: Real-time 6x21 travel matrix
- **getRm6x21Calibration**: Calibration data matrix

## Data Format Examples

### getPerformanceMode
```json
{
  "touchMode": "global",
  "profile": 0
}
```

### getSingleTravel
```json
2.5
```

### getDpDr
```json
{
  "pressDead": 0.10,
  "releaseDead": 0.20
}
```

### getLighting
```json
{
  "mode": "static",
  "brightness": 100,
  "speed": 50,
  "color": { "r": 255, "g": 0, "b": 0 }
}
```

## Error Handling

### Connection Errors
- Auto-connect attempted on mount
- If failed, prompts user for device selection
- Errors logged to console and displayed in UI

### Fetch Errors
- Individual getter failures don't block others
- Error message shows which method failed
- User can retry by clicking button again

### Missing Key Selection
- Per-key methods disabled when no key selected
- Error message: "Select a key first"
- Prevents invalid API calls

## Service Layer

- **KeyboardService** (shared singleton, `@services/KeyboardService`): the main hardware wrapper, used by this page and every other page
- **Production Use**: same wrappers as the rest of the app
- **Shared Connection**: app-wide connection state — there is no separate debug connection

## State Persistence
- **No Persistence**: All data cleared on page refresh
- **Real-Time**: Always fetches live data from keyboard

## Performance Considerations

### Parallel Fetching
- `fetchAllData()` uses `Promise.all()`
- All getters run simultaneously
- Faster than sequential fetching

### Lazy Loading
- Data only fetched when requested
- Not all methods run automatically
- User controls what to load

## Accessibility
- Keyboard grid clickable
- Large button targets
- Clear button labels
- High contrast data display

## Styling Highlights

### Collapsible Window
- Bordered panel with rounded corners
- Bold summary header in accent color
- Dark background for JSON data
- Scrollable data sections

### Getter Buttons
- Color-coded by type:
  - Refresh (All): Primary color
  - Individual Getters: Accent color
  - Test Actions: Gray
  - Clear: Gray

### Data Display
- Monospace font for JSON
- Black background for code blocks
- Scrollable container (max 400px)
- Each section clearly separated

## Known Limitations
- No comparison view (before/after)
- Can't edit values inline (read-only)
- No data history/timeline

## Future Enhancements
- Editable JSON (live editing)
- Data diff viewer (compare before/after changes)
- Historical snapshots (timeline view)
- Automated test runner
- Performance benchmarks (response times)
- Data validation warnings

## Developer Notes
- Uses `KeyboardService` (the main wrapper); there is no separate debug service
- Auto-connect runs on mount with 500ms delay before initial fetch
- Clear data when key selection changes (prevents confusion)
- Details element HTML native (no Vue component needed)
