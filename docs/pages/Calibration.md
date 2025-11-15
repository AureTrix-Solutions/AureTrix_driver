# Calibration Page Documentation

## Overview
The Calibration page provides a real-time visual interface for calibrating hall effect keyboard sensors. It displays live travel distance data as users press keys, helping ensure accurate actuation sensing. The calibration process captures maximum travel distances for each key position and saves them to the keyboard's firmware.

## Purpose
- Calibrate hall effect sensors for accurate key travel detection
- Display real-time travel values as keys are pressed
- Capture maximum travel distance for each key (physical calibration)
- Save calibration data to keyboard hardware
- Provide visual feedback during the calibration process

## Key Features

### 1. **Live Travel Visualization**
- Real-time polling of key travel values (every 200ms)
- Overlay display on each key showing current maximum travel
- Color-coded feedback:
  - **Red (0)**: Not calibrated / not pressed
  - **Green (>0)**: Calibrated / max travel recorded

### 2. **Calibration Workflow**
- Simple two-button interface:
  - Start Calibration
  - Save Calibration
- Instructions panel guides users through process
- 6x21 key matrix support

### 3. **Maximum Travel Tracking**
- Tracks maximum travel value per key position
- Values update in real-time as keys are pressed deeper
- Displays in micrometers (μm) for precision

### 4. **Hardware Integration**
- Direct communication with SparkLink SDK calibration APIs
- Saves calibration to keyboard firmware
- Persistent across power cycles

## User Interface Elements

### Top Control Bar
- **Start Calibration Button**:
  - Disabled when: Not connected or already calibrating
  - Initiates calibration mode
  - Starts real-time polling
- **Save Calibration Button**:
  - Disabled when: Not calibrating
  - Saves current max values to hardware
  - Ends calibration mode

### Keyboard Grid
- Visual keyboard layout
- Each key displays:
  - Key label (top)
  - Travel overlay (center, when calibrating):
    - Red text if value = 0 (not pressed yet)
    - Green text if value > 0 (max travel recorded)
    - Value in micrometers (0-4000 typical range)

### Instructions Panel
- Located below keyboard
- Provides calibration guidance:
  - Press keys fully and hold 1-2 seconds
  - Rock keys forward/back and side-to-side
  - Avoid quick presses (causes inaccurate results)

## Technical Implementation

### Component Setup
```vue
<script setup lang="ts">
const calibrating = ref(false);
const calibrated = ref(new Set<number>());
const travels = ref<number[][]>([]);         // Current frame
const maxTravels = ref<number[][]>([]);      // Maximum values
let pollInterval: NodeJS.Timeout | null = null;
</script>
```

### Core Functionality

#### 1. **Start Calibration**
```typescript
async function startCalibration() {
  // Send start command to keyboard
  const result = await KeyboardService.calibrationStart();
  
  // Initialize 6x21 matrix
  const numRows = 6;
  const numCols = 21;
  maxTravels.value = Array.from({ length: numRows }, 
    () => Array(numCols).fill(0));
  travels.value = Array.from({ length: numRows }, 
    () => Array(numCols).fill(0));
  
  calibrating.value = true;
  calibrated.value.clear();
  
  // Start polling every 200ms
  pollInterval = setInterval(async () => {
    const calResult = await KeyboardService.getRm6X21Calibration();
    
    if (calResult.travels) {
      const newTravels = calResult.travels;
      
      // Update max per position
      for (let r = 0; r < newTravels.length; r++) {
        for (let c = 0; c < newTravels[r].length; c++) {
          const currentMax = maxTravels.value[r]?.[c] || 0;
          const newVal = newTravels[r][c];
          
          if (newVal > currentMax) {
            maxTravels.value[r][c] = newVal;
            console.log(`Max travel updated: row ${r} col ${c}: ${newVal}`);
          }
        }
      }
      
      travels.value = newTravels;
    }
  }, 200);
}
```

#### 2. **End Calibration**
```typescript
async function endCalibration() {
  // Stop polling
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  
  // Send save command to keyboard
  const result = await KeyboardService.calibrationEnd();
  
  calibrating.value = false;
  console.log('Calibration ended and saved.');
}
```

#### 3. **Get Travel Value for Display**
```typescript
const getTravelValue = (locRow: number, locCol: number): number => {
  const maxVal = maxTravels.value[locRow]?.[locCol] || 0;
  return Math.round(maxVal * 1000);  // Convert to μm
}
```

#### 4. **Travel Overlay Display**
```vue
<span
  v-if="calibrating"
  class="travel-overlay"
  :class="{
    red: getTravelValue(keyInfo.location.row, keyInfo.location.col) === 0,
    green: getTravelValue(keyInfo.location.row, keyInfo.location.col) > 0
  }"
>
  {{ getTravelValue(keyInfo.location.row, keyInfo.location.col) }}
</span>
```

## Dependencies

### Services
- **KeyboardService**:
  - `calibrationStart()`: Begin calibration mode
  - `calibrationEnd()`: Save and end calibration
  - `getRm6X21Calibration()`: Fetch live travel data

### Stores
- **ConnectionStore**: Check device connection status

### Utilities
- **useMappedKeyboard**: Fetch keyboard layout
- **keyMap**: Display key labels

## Data Flow

```
User Clicks "Start Calibration"
    ↓
startCalibration()
    ↓
KeyboardService.calibrationStart() - Hardware enters calibration mode
    ↓
Initialize maxTravels (6x21 matrix of zeros)
    ↓
Start 200ms polling interval
    ↓
Poll Loop:
  KeyboardService.getRm6X21Calibration()
      ↓
  Get current travels matrix
      ↓
  Compare each position: newVal > currentMax?
      ↓
  If yes: Update maxTravels[row][col]
      ↓
  UI re-renders overlay values
    ↓
User Presses Keys (physically)
    ↓
Hardware Senses Travel
    ↓
Poll fetches updated values
    ↓
Overlay shows new max in green
    ↓
User Clicks "Save Calibration"
    ↓
endCalibration()
    ↓
Stop polling
    ↓
KeyboardService.calibrationEnd() - Save to firmware
    ↓
calibrating = false
    ↓
Overlays hidden
```

## User Workflow

### Full Calibration Process
1. Ensure keyboard is connected
2. Navigate to Calibration page
3. Click "Start Calibration"
   - Overlay values appear (all 0, red)
4. Press each key fully:
   - Hold for 1-2 seconds
   - Rock key forward/back
   - Rock key side-to-side
   - Value turns green, shows max travel (e.g., "3850")
5. Continue until all keys calibrated (green)
6. Click "Save Calibration"
7. Calibration saved to keyboard
8. Values persist across reboots

## Calibration Best Practices

### Proper Key Pressing
- **Press Fully**: Push key to absolute bottom
- **Hold 1-2 Seconds**: Gives time for sensor to capture peak
- **Rock Motion**: Ensures sensor sees maximum deflection
- **Avoid Quick Presses**: Rapid taps don't reach maximum travel

### Why Rocking Helps
- Hall effect sensors measure magnetic field
- Magnet position can vary slightly based on key angle
- Rocking ensures maximum field strength is captured
- Results in most accurate calibration

## Matrix Layout

### 6x21 Structure
```
Row 0: [Col 0 ... Col 20]  (Top row, typically Esc, F-keys, etc.)
Row 1: [Col 0 ... Col 20]  (Number row)
Row 2: [Col 0 ... Col 20]  (QWERTY row)
Row 3: [Col 0 ... Col 20]  (ASDF row)
Row 4: [Col 0 ... Col 20]  (ZXCV row)
Row 5: [Col 0 ... Col 20]  (Bottom row, space, etc.)
```

- Total: 126 positions (though not all populated on every keyboard)
- Matches `keyInfo.location.row` and `keyInfo.location.col`

## Travel Value Ranges

### Typical Values
- **0 μm**: Not pressed / not calibrated
- **500-1500 μm**: Partial press
- **3000-4000 μm**: Full press (typical maximum)
- **>4000 μm**: Unusually deep press or sensor issue

### Display Format
- Raw values from SDK are in mm (e.g., 3.850)
- Multiplied by 1000 for μm display
- Rounded to integer (3850)

## Polling Details

### Interval Timing
- **200ms**: Balance between responsiveness and performance
- Fast enough for real-time feedback
- Slow enough to avoid overwhelming hardware/network

### Poll Lifecycle
- Starts when calibration begins
- Runs continuously until save/cancel
- Cleared automatically on component unmount (safety)

## Error Handling

### Connection Issues
- Start button disabled if not connected
- Prevents attempting calibration on disconnected device

### Hardware Errors
- Logged to console (e.g., "Calibration poll error")
- Doesn't crash page, continues polling
- User can retry by saving and restarting

### Data Validation
- Warns if matrix shape != 6x21
- Handles missing/malformed data gracefully
- Defaults to 0 if value unavailable

## State Persistence

### During Calibration
- `maxTravels` stored in component state
- Lost if page refreshed during calibration
- User must complete and save

### After Save
- Calibration data written to keyboard firmware
- Persists across:
  - Page refreshes
  - App closes
  - Keyboard power cycles
- No localStorage needed (hardware storage)

## Performance Considerations

### Polling Impact
- 5 requests/second (200ms interval)
- 6x21 = 126 values per request
- Minimal bandwidth, efficient for real-time feedback

### UI Rendering
- Overlay values update reactively
- Only changed values trigger re-render
- Smooth performance even during rapid updates

## Accessibility
- Clear instructions provided
- Visual feedback (color-coded)
- Large, clickable buttons
- High contrast overlays

## Styling Highlights

### Overlay Styling
```scss
.travel-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: bold;
  
  &.red { color: rgba(red, 0.8); }
  &.green { color: rgba(green, 0.8); }
}
```

### Key Appearance
- Standard key gradient backgrounds
- Overlays positioned center-absolute
- Text large enough to read during pressing

## Known Limitations
- Page refresh during calibration loses progress
- No pause/resume functionality
- Can't export/import calibration data
- No visual progress indicator (% complete)
- No comparison with previous calibration

## Future Enhancements
- Progress bar showing calibrated vs total keys
- Pause/resume calibration
- Export calibration data for backup
- Compare before/after calibration values
- Calibration history log
- Automatic detection of problematic keys
- Sound/haptic feedback when key calibrated

## Developer Notes
- Always clear interval on component unmount
- Matrix indices (row, col) must match keyInfo.location
- Travel values are in mm from SDK, convert to μm for display
- Polling continues even if errors occur (resilient design)
- Max travel tracking is per-position, not per-key (handles remapping)
- `calibrated` Set currently used for tracking but could expand for progress bar
