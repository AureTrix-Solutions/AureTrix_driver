# SwitchProfiles Component

**Component Path:** `src/components/performance/SwitchProfiles.vue`

**Parent Component:** Performance.vue (via KeyTravel.vue)

**Type:** Performance Sub-Component

---

## Overview

SwitchProfiles is a profile management and key testing component that allows users to create, select, and delete switch profiles with custom maximum travel distances. It integrates with the Pinia travel profiles store for persistent storage and provides two advanced features: automatic max travel capture via live keyboard polling, and real-time key test monitoring for validating trigger configurations.

This component enables users to define physical switch characteristics (e.g., "Gateron Red 4.0mm", "Cherry MX Speed 3.4mm") that constrain travel distance sliders throughout the Performance page, ensuring configurations respect hardware limitations.

---

## Key Features

### 1. Profile Management
- **Create Profiles**: Add new switch profiles with custom names
- **Select Profiles**: Dropdown to choose active profile
- **Delete Profiles**: Remove unwanted profiles
- **Default Profile**: "Default 4mm" option with no custom profile selected
- **Persistent Storage**: Profiles saved to localStorage via Pinia store

### 2. Automatic Max Travel Capture
- **Modal-Based Workflow**: Guided capture process with countdown timer
- **Live Polling**: Continuously reads travel data from keyboard via `getRm6X21Travel()`
- **Peak Detection**: Automatically captures maximum observed travel distance
- **5-Second Window**: User presses any key, system records peak travel
- **Auto-Save**: Captured travel updates profile automatically
- **Visual Feedback**: Real-time display of captured travel value

### 3. Key Test Monitor
- **Real-Time Travel Display**: Shows current key travel in mm (0.00-4.00 range)
- **Trigger Point Capture**: Records exact travel distance when key actuates
- **Checkbox Enable**: Must select key first, then enable key test
- **Modal Table View**: Clean table layout with Key/Travel/Trigger columns
- **Key Remapping**: Temporarily remaps selected key to 'A' for consistent testing
- **Restoration**: Automatically restores original key mapping on close

### 4. Store Integration
- **Reactive Profile Selection**: Computed properties sync with Pinia store
- **Bi-Directional Sync**: Changes to dropdown update store; store changes update dropdown
- **Profile Options**: Computed list of all profiles with formatted display names

---

## User Interface Elements

### Profile Management Section

#### Add New Profile Input Group
- **Label**: "New Profile Name:"
- **Text Input**: Placeholder "Enter switch name (e.g., Gateron Red)"
- **Add Button**: Disabled when input empty, triggers profile creation
- **Enter Key**: Pressing Enter in input field triggers add action

#### Select Profile Dropdown Group
- **Label**: "Select Profile:"
- **Dropdown**: 
  - First option: "Default 4mm" (null value)
  - Subsequent options: Custom profiles with format "SwitchName (X.Xmm)"
- **Delete Button**: Disabled when no profile selected (on "Default 4mm")

#### Key Test Toggle Group
- **Label**: "Enable Key Test:"
- **Checkbox**: Disabled when `selectedKeys.length === 0`
- **Behavior**: Checked state starts key test modal, unchecked stops polling

---

### Max Travel Capture Modal

**Trigger**: Automatically shows after adding a new profile

**Title**: "Capture Max Travel for [ProfileName]"

**Body**:
- Instructions: "Press any key now to capture travel... (Xs remaining)"
- Live Status: "Listening... (Captured: X.X mm)" when capturing
- Countdown: 5-second timer (decrements every second)

**Buttons**:
- **Save**: Enabled when `capturedTravel > 0`, saves captured value to profile
- **Cancel**: Stops capture and closes modal without saving

**Auto-Close**: After 5 seconds, automatically saves if travel captured, or closes if no travel detected

---

### Key Test Monitor Modal

**Trigger**: Checkbox "Enable Key Test" checked with key(s) selected

**Title**: "Key Test Monitor"

**Instructions**: "Press the selected key to monitor travel and trigger. Press slow for better accuracy."

**Table Layout**:

| Key | Travel | Trigger |
|-----|--------|---------|
| A (example) | 0.00 mm | N/A |

- **Key Column**: Label of selected key (e.g., "A", "Space", "Esc")
- **Travel Column**: Live-updating travel value (green text, updates in real-time)
- **Trigger Column**: 
  - Red "N/A" when not triggered
  - Green value (e.g., "1.85 mm") when key actuates

**Close Button**: Stops polling, restores key mapping, closes modal

---

## Technical Implementation

### Props

```typescript
interface Props {
  selectedKeys: IDefKeyInfo[];    // Currently selected keys
  layout: IDefKeyInfo[][];        // Full keyboard layout
  baseLayout: any;                // Base layout (unused)
  profileMaxTravel: number;       // Current profile's max travel (from KeyTravel)
}
```

### Store Integration

```typescript
const store = useTravelProfilesStore();

// Reactive state
const selectedProfileId = ref(store.selectedProfileId);
const profiles = computed(() => store.profiles);
const profileOptions = computed(() => store.profileOptions);

// Bi-directional sync
watch(() => store.selectedProfileId, (newId) => {
  selectedProfileId.value = newId;
});

watch(selectedProfileId, (newId) => {
  store.selectProfile(newId || null);
});
```

### Core State (Profile Management)

```typescript
const newProfileName = ref('');              // Input for new profile name
const selectedProfileId = ref<string | null>(store.selectedProfileId);
```

### Core State (Capture Modal)

```typescript
const showCaptureModal = ref(false);         // Modal visibility
const currentProfileName = ref('');          // Name of profile being captured
const isCapturing = ref(false);              // Capture in progress flag
const capturedTravel = ref(0);               // Captured max travel value
const countdown = ref(5);                    // Countdown timer (seconds)
let captureInterval: NodeJS.Timeout | null = null;      // Polling interval
let countdownInterval: NodeJS.Timeout | null = null;    // Timer interval
let maxObservedTravel = 0;                   // Running max during capture
```

### Core State (Key Test)

```typescript
const keyTestEnabled = ref(false);           // Checkbox state
const actuationPoint = ref(0.5);             // Loaded from key's single travel
const showKeyTestModal = ref(false);         // Modal visibility
const travelValue = ref('0.00');             // Current travel display
const triggerValue = ref('0.00');            // Captured trigger point
const triggered = ref(false);                // Trigger state (green highlight)
let keyTestInterval: NodeJS.Timeout | null = null;      // Polling interval
const keydownListener = ref<Function | null>(null);     // Keyboard event listener
const pendingTriggerCapture = ref(false);    // Waiting for trigger event
const triggerCaptured = ref(false);          // Trigger already captured this press
const originalKeyMapping = ref<number | null>(null);    // Original key value before remap
```

---

## Data Flow

### Profile Creation Flow

```
User types profile name ("Gateron Red")
  ↓
User clicks "Add Profile" or presses Enter
  ↓
addProfile()
  ↓
Validate name is not empty
  ↓
store.addProfile("Gateron Red", 2.0) - creates profile with default 2.0mm
  ↓
Store generates unique ID and adds to profiles array
  ↓
Store selects new profile (selectedProfileId updates)
  ↓
Component syncs selectedProfileId via watcher
  ↓
Set currentProfileName = "Gateron Red"
  ↓
showCaptureModal = true (display capture UI)
  ↓
After 500ms: captureTravel() starts
```

### Max Travel Capture Flow

```
captureTravel() called
  ↓
isCapturing = true
  ↓
Reset: capturedTravel = 0, maxObservedTravel = 0, countdown = 5
  ↓
Start countdown interval (decrements every 1000ms)
  ↓
Start capture interval (polls continuously, 0ms delay = max speed)
  ↓
Every interval tick:
  ├─ KeyboardService.getRm6X21Travel()
  ├─ SDK returns { travels: [[...], [...], ...], maxTravel: X }
  ├─ Flatten nested travels array
  ├─ Filter out zero values (no key pressed)
  ├─ Find max from non-zero values
  ├─ Round to 0.1mm precision (e.g., 3.87 → 3.9)
  ├─ If new max > maxObservedTravel:
  │    └─ Update maxObservedTravel and capturedTravel.value
  └─ Loop continues
  ↓
After 5 seconds (auto-timeout):
  ├─ stopCapture() - clear both intervals
  ├─ If capturedTravel > 0:
  │    └─ saveCapturedTravel()
  └─ Else:
       └─ closeModal() (no travel detected)
```

**User Experience**: User presses key hard to max out travel. Display shows increasing values (e.g., 0.0 → 1.2 → 2.8 → 3.9 → 4.0). When released, value stays at peak (4.0). After 5 seconds, profile saves with maxTravel = 4.0mm.

### Profile Selection Flow

```
User changes dropdown to "Cherry MX Red (3.2 mm)"
  ↓
selectedProfileId.value = "profile-id-123"
  ↓
Watcher detects change
  ↓
store.selectProfile("profile-id-123")
  ↓
Store updates selectedProfile and selectedProfileId
  ↓
Parent component (KeyTravel) recomputes profileMaxTravel
  ↓
GlobalTravel and SingleKeyTravel receive new profileMaxTravel prop
  ↓
Auto-clamping triggers if current travels exceed new max
```

### Profile Deletion Flow

```
User selects profile from dropdown
  ↓
User clicks "Delete Profile" button
  ↓
deleteProfile()
  ↓
store.deleteProfile(selectedProfileId.value)
  ↓
Store removes profile from array
  ↓
Store resets selectedProfile to null (Default 4mm)
  ↓
Component syncs: selectedProfileId = null
  ↓
Dropdown shows "Default 4mm"
  ↓
profileMaxTravel computed returns 4.0 (default)
```

### Key Test Flow (Complete Lifecycle)

```
User selects key (e.g., 'A') on keyboard grid
  ↓
User checks "Enable Key Test" checkbox
  ↓
Watch detects keyTestEnabled = true
  ↓
startKeyTest() executes
  ↓
Step 1: loadActuationPoint()
  ├─ KeyboardService.getSingleTravel(physicalKeyValue)
  ├─ Loads configured travel (e.g., 2.0mm)
  ├─ Validates range (0.1 - profileMaxTravel)
  └─ Sets actuationPoint.value = 2.0
  ↓
Step 2: remapKeyForTest(physicalKey)
  ├─ KeyboardService.getLayoutKeyInfo([{ key: physicalKey, layout: 0 }])
  ├─ SDK returns original key mapping (e.g., 4 for 'A')
  ├─ Store in originalKeyMapping.value = 4
  ├─ KeyboardService.setKey([{ key: physicalKey, value: 4, layout: 0 }])
  └─ Key now mapped to 'A' (needed for consistent keydown detection)
  ↓
Step 3: startPolling(physicalKey)
  ├─ Create keydown listener for 'A' key press
  │    └─ Sets pendingTriggerCapture = true (waiting for trigger data)
  ├─ window.addEventListener('keydown', keydownListener)
  ├─ Start interval polling getRm6X21Travel() at max speed (0ms delay)
  └─ showKeyTestModal = true
  ↓
During Polling (every interval tick):
  ├─ KeyboardService.getRm6X21Travel()
  ├─ SDK returns { maxTravel: X } (current travel for all keys)
  ├─ If maxTravel > 0:
  │    ├─ Update travelValue = "2.35 mm" (example)
  │    ├─ If pendingTriggerCapture && !triggerCaptured && travel >= 0.1:
  │    │    ├─ Capture trigger point: triggerValue = "2.35 mm"
  │    │    ├─ Set triggered = true (green highlight in table)
  │    │    └─ Set triggerCaptured = true (prevent re-capture)
  │    └─ If triggered && travel < 0.1:
  │         └─ Reset: triggered = false, pendingTriggerCapture = false
  └─ If maxTravel = 0:
       └─ Reset: travelValue = "0.00", clear trigger flags
  ↓
User unchecks "Enable Key Test" OR closes modal
  ↓
Watch detects keyTestEnabled = false OR closeKeyTestModal() called
  ↓
stopPolling()
  ├─ Clear keyTestInterval
  ├─ Remove keydown event listener
  ├─ restoreKeyMapping(physicalKey)
  │    └─ KeyboardService.setKey([{ key: physicalKey, value: originalKeyMapping }])
  ├─ Reset all state (travelValue, triggerValue, triggered, etc.)
  └─ showKeyTestModal = false
```

**User Experience**: User enables test, modal appears. User presses 'A' key slowly. Travel shows live values (0.00 → 0.50 → 1.00 → 1.85 → 2.00). At actuation (key triggers in OS), trigger column shows "1.85 mm" in green. User releases key, travel returns to 0.00, trigger value persists. User can press again to capture new trigger point.

---

## SDK Integration

### Methods Used

| SDK Method | Purpose | Usage |
|------------|---------|-------|
| `getRm6X21Travel()` | Get current travel for all keys | Capture and key test polling |
| `getSingleTravel(key)` | Load key's configured travel | Load actuation point for testing |
| `getLayoutKeyInfo(keys)` | Get current key mapping | Save original mapping before test |
| `setKey(mappings)` | Remap key to specific value | Remap to 'A', restore original |

### Polling Strategy

Both capture and key test use aggressive polling (0ms interval) for maximum responsiveness:

```typescript
captureInterval = setInterval(async () => {
  const result = await KeyboardService.getRm6X21Travel();
  // Process result...
}, 0); // No delay = poll as fast as possible
```

**Why 0ms delay?**
- Capture needs to catch peak travel (user may press and release quickly)
- Key test needs to show smooth live updates (better UX)
- SDK and hardware can handle the request rate
- Browser automatically throttles to ~4ms minimum anyway

**getRm6X21Travel() Response Structure**:

```typescript
{
  travels: [
    [0, 0, 2.3, 0, ...],  // Row 1 travels
    [0, 0, 0, 1.8, ...],  // Row 2 travels
    // ... more rows
  ],
  maxTravel: 2.3  // Overall max across all keys
}
```

For capture, we flatten the nested array and find the max. For key test, we use `maxTravel` directly.

---

## User Workflows

### Workflow 1: Create Profile for New Switch Type

1. User receives new keyboard with Gateron Yellow switches (3.6mm total travel)
2. User navigates to Performance page
3. User types "Gateron Yellow" in "New Profile Name" input
4. User clicks "Add Profile" button
5. Profile created with default 2.0mm, dropdown auto-selects it
6. Capture modal appears: "Capture Max Travel for Gateron Yellow"
7. User presses any key firmly to bottom out
8. Display shows: "Listening... (Captured: 3.6 mm)"
9. Countdown reaches 0, modal closes, profile saved with maxTravel = 3.6mm
10. Global and Single travel sliders now max out at 3.6mm

### Workflow 2: Manually Adjust Captured Travel

**Problem**: User accidentally captured 3.2mm instead of 3.6mm (didn't press hard enough)

**Solution (Current)**: Delete profile and re-create
1. User selects profile from dropdown
2. User clicks "Delete Profile"
3. User creates profile again and re-captures

**Future Enhancement**: Edit profile maxTravel directly without re-capture

### Workflow 3: Test Key Actuation Point

**Goal**: Verify WASD keys are triggering at configured 1.5mm

1. User selects 'W' key on keyboard grid
2. User checks "Enable Key Test" checkbox
3. Modal appears showing:
   - Key: W
   - Travel: 0.00 mm
   - Trigger: N/A
4. User slowly presses 'W' key (remapped to 'A' internally for detection)
5. Travel column updates live: 0.00 → 0.50 → 1.00 → 1.48 → ...
6. At 1.48mm, key actuates (triggers in OS)
7. Keydown event fires, trigger column shows "1.48 mm" in green
8. User continues pressing: 1.48 → 1.80 → 2.00 (bottom out)
9. Travel maxes at 2.00mm, trigger stays at 1.48mm
10. User releases key, travel returns to 0.00mm
11. Trigger value persists (1.48mm) until next press
12. User verifies: configured 1.5mm matches actual ~1.48mm ✓

**Note**: Slight variance (1.5mm config vs 1.48mm actual) is normal due to sensor precision and pressing technique.

### Workflow 4: Test Multiple Keys

**Current Limitation**: Can only test one key at a time

1. User tests 'W' key, captures trigger at 1.5mm
2. User unchecks "Enable Key Test" to close modal
3. User selects 'A' key
4. User checks "Enable Key Test" again
5. New modal shows 'A' key data
6. User tests 'A' key independently

**Future Enhancement**: Multi-key table view showing all selected keys simultaneously

### Workflow 5: Switch Between Profiles During Configuration

1. User has two profiles: "Gateron Red" (4.0mm) and "Cherry MX Speed" (3.4mm)
2. User configures GlobalTravel to 3.8mm under Gateron Red profile
3. User tests configuration, feels too slow
4. User switches dropdown to "Cherry MX Speed"
5. profileMaxTravel updates from 4.0 → 3.4
6. GlobalTravel auto-clamps from 3.8 → 3.4mm
7. User adjusts to 3.2mm (faster actuation for speed switches)
8. User tests keys again with new profile active

---

## Selection Change Behavior

The component reacts to selection changes for key testing:

```typescript
watch(() => props.selectedKeys, async (newKeys) => {
  if (newKeys.length === 0) {
    keyTestEnabled.value = false;  // Disable checkbox
    await stopPolling();           // Stop any active test
  } else if (keyTestEnabled.value) {
    await stopPolling();           // Stop current test
    await startKeyTest();          // Restart with new key
  }
  await loadActuationPoint();      // Load new key's travel
}, { deep: true });
```

### Behavior Matrix

| Scenario | Action |
|----------|--------|
| No keys → Key selected | Enable checkbox, load actuation point |
| Key A → Key B (test inactive) | Load Key B actuation point, keep checkbox disabled |
| Key A → Key B (test active) | Stop test, restart with Key B, show new modal |
| Keys selected → None | Disable checkbox, stop test if active |

---

## Error Handling

### Capture Failures

If `getRm6X21Travel()` fails during capture:
- Error caught silently in try-catch
- Capture continues (next interval tick will retry)
- If no successful reads in 5 seconds, modal closes without saving
- User sees "Captured: 0.0 mm" throughout (no data)

### Key Test Failures

**Failed to Load Actuation Point**:
```typescript
const result = await KeyboardService.getSingleTravel(physicalKeyValue);
if (result instanceof Error) throw result;
const loadedValue = Number(result);
if (loadedValue < 0.1 || loadedValue > props.profileMaxTravel) {
  throw new Error(`Out of range: ${loadedValue} mm`);
}
// If any error: keyTestEnabled.value = false (disable checkbox)
```

**Failed to Remap Key**:
```typescript
await remapKeyForTest(physicalKey);
// If fails: catch block sets keyTestEnabled = false
```

**Polling Errors**:
- Errors during `getRm6X21Travel()` in polling loop are caught silently
- Polling continues on next tick
- If persistent errors, modal shows stale data but doesn't crash

### Cleanup on Unmount

Component ensures cleanup even if user navigates away mid-test:

```typescript
onUnmounted(async () => {
  if (captureInterval) clearInterval(captureInterval);
  if (countdownInterval) clearInterval(countdownInterval);
  if (keyTestInterval) clearInterval(keyTestInterval);
  if (keydownListener.value) window.removeEventListener('keydown', keydownListener.value);
  
  // Critical: Restore original key mapping
  if (props.selectedKeys.length > 0 && originalKeyMapping.value !== null) {
    const physicalKey = props.selectedKeys[0].physicalKeyValue || props.selectedKeys[0].keyValue;
    await restoreKeyMapping(physicalKey);
  }
});
```

This prevents:
- Memory leaks from active intervals
- Orphaned event listeners
- Stuck key remappings (user would have broken 'A' key without this)

---

## Integration with Performance Page

SwitchProfiles is the third child of KeyTravel:

```vue
<SwitchProfiles 
  :selected-keys="selectedKeys" 
  :layout="layout" 
  :base-layout="baseLayout"
  :profile-max-travel="profileMaxTravel"
/>
```

**Key Difference**: Unlike GlobalTravel and SingleKeyTravel, SwitchProfiles does **not emit overlay events**. It only manages profiles and testing, without visual keyboard grid integration.

---

## Dependencies

### Internal Dependencies
- `@services/KeyboardService` - SDK wrapper
- `@/store/travelProfilesStore` - Pinia store for profiles
- `@utils/keyMap` - Key ID to label mapping
- `@/types/types` - TypeScript interfaces

### External Dependencies
- Vue 3 Composition API (`ref`, `computed`, `watch`, `onUnmounted`, `defineComponent`)

---

## Styling Notes

### Component Layout
- **Height**: `fit-content` (expands based on content)
- **Border**: Matches GlobalTravel and SingleKeyTravel (1px solid)
- **Font**: Uses global `v.$font-style` variable

### Modal Styling
- **Overlay**: Full-screen semi-transparent black (rgba(0,0,0,0.5))
- **Z-Index**: 1000 (appears above all other content)
- **Modal Width**: Max 400px, responsive (90vw on mobile)
- **Max Height**: 80vh with vertical scroll if needed

### Key Test Table
- **Width**: 80% of modal width
- **Border Collapse**: Collapsed borders for clean look
- **Cell Padding**: 8px
- **Header**: Background dark, text color from variables
- **Live Travel**: Accent color, font-weight 500
- **Trigger**: 
  - Red (#ff4444) when N/A
  - Green (#00ff00) when triggered
- **Font Size**: 1.1rem for readability

---

## Known Limitations

1. **Single Key Testing**: Can only test one key at a time (no multi-key comparison view)

2. **No Manual Travel Entry**: Must capture via pressing key; can't manually type max travel value

3. **No Profile Editing**: Can't edit profile name or maxTravel after creation (must delete and recreate)

4. **Hardcoded 'A' Remap**: Key test always remaps to 'A' (assumes 'A' has keyCode 4 in keyMap)

5. **No Trigger Threshold Config**: Can't adjust what qualifies as "triggered" (hardcoded 0.1mm minimum)

6. **Capture Timeout Not Adjustable**: Fixed 5-second window (no user control)

7. **No Capture Retry**: If capture fails, must delete profile and try again

8. **Checkbox State Confusion**: Checkbox can't distinguish between "test not started" and "test failed to start"

---

## Future Enhancements

1. **Edit Profile Modal**: Allow editing profile name and maxTravel without re-creation

2. **Manual Travel Entry**: Option to skip capture and type maxTravel value directly

3. **Multi-Key Test Table**: Show Travel/Trigger columns for all selected keys simultaneously

4. **Capture Progress Indicator**: Show how many key presses detected during capture window

5. **Adjustable Capture Duration**: User-configurable timeout (3s, 5s, 10s)

6. **Profile Export/Import**: Save profiles to JSON file, share with other users

7. **Profile Presets**: Built-in profiles for common switches (Cherry MX, Gateron, Kailh, etc.)

8. **Trigger Sensitivity Setting**: Configure minimum travel threshold for trigger detection

9. **Key Test History**: Log all trigger captures for statistical analysis (avg, min, max trigger points)

10. **Visual Travel Graph**: Real-time line chart showing travel over time during key test

---

## Related Documentation

- [Performance.md](./Performance.md) - Parent page documentation
- [GlobalTravel.md](./GlobalTravel.md) - Global travel configuration
- [SingleKeyTravel.md](./SingleKeyTravel.md) - Per-key travel configuration
- [KeyTravel.md](./KeyTravel.md) - Container component
- [SDK_REFERENCE.md](../SDK_REFERENCE.md) - Complete SDK API reference

---

## Summary

SwitchProfiles provides critical infrastructure for the Performance page by:
- **Managing switch profiles** with physical max travel constraints
- **Auto-capturing max travel** via live keyboard polling
- **Providing real-time key testing** for validating trigger configurations
- **Persisting profiles** across sessions via Pinia store

It enables users to ensure their travel configurations respect physical switch limitations, preventing invalid settings and providing tools to verify actual trigger behavior matches expected configuration.
