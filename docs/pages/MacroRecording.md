# Macro Recording Page Documentation

## Overview
The Macro Recording page provides a complete visual macro creation and management system. Users can build complex keystroke sequences by clicking keys on a virtual keyboard, assign custom timing delays, save macros to localStorage, and export/import macro collections.

## Purpose
- Create keyboard macros without triggering OS shortcuts (no physical key presses needed)
- Build multi-step keystroke sequences with custom timing
- Save, load, edit, and organize macros
- Export/import macros for backup or sharing
- Support up to 64 actions per macro (hardware limitation)

## Key Features

### 1. **Visual Macro Recording**
- Click keys on the visual keyboard to add down/up events
- No physical keypresses required (prevents Windows key interruptions, etc.)
- Real-time sequence building
- Visual feedback shows "pressed" key states

### 2. **Sequence Management**
- View complete action sequence
- Each action shows: Key name, action (down/up), delay in milliseconds
- Edit individual delays
- Remove specific actions
- Clear entire sequence

### 3. **Macro Library**
- Save unlimited macros to browser localStorage
- Each macro stored with:
  - Custom name
  - Creation date
  - Step count
  - Complete action sequence
- Grid-based macro card display
- Load existing macros for editing
- Delete unwanted macros

### 4. **Layout Options**
- **Default Layout**: Uses base keyboard layout
- **Mapped Layout**: Respects remapped keys from layers Fn0-Fn3

### 5. **Import/Export System**
- Export all macros to JSON file for backup
- Import macros from JSON file
- Share macro collections between users/devices

### 6. **Smart Validations**
- Prevents empty macro saves
- Enforces 64-action limit (hardware constraint)
- Duplicate name detection
- Delay must be ≥ 0ms
- User-friendly error messages

## User Interface Elements

### Top Control Bar
- **Record Macro**: Start new macro creation
- **Macro Name Input**: Text field for naming macro (enabled during recording)
- **Layout Type Selector**: Choose Default or Mapped layout
- **Layer Selector**: Choose Fn0-Fn3 (only when Mapped layout selected)
- **Save Macro**: Save current sequence (enabled when valid)
- **Clear Macro**: Reset current sequence
- **Export Macros**: Download all macros as JSON
- **Import Macros**: Upload JSON macro file

### Keyboard Grid
- Visual keyboard layout
- Click keys to add down/up actions
- Pressed keys highlighted with accent color glow
- Shows current "pressed" state based on sequence

### Current Sequence Panel
- List of all actions in order
- Each item shows:
  - Key name and action (down/up)
  - Delay input field (editable)
  - Remove button (×)
- Real-time delay validation
- Empty state message when no actions

### Macro Library Grid
- Card-based display of saved macros
- Each card shows:
  - Macro name (title)
  - Creation date
  - Number of steps
  - Load button
  - Delete button
- Responsive grid layout

### Notification System
- Success/error messages
- Auto-dismiss after 3 seconds
- Manual dismiss with × button
- Visual distinction for errors (red background)

## Technical Implementation

### Component Structure
```vue
<script lang="ts">
setup() {
  const isRecording = ref(false);
  const currentSequence = ref<{ 
    keyValue: number; 
    action: 'down' | 'up'; 
    delay: number 
  }[]>([]);
  const macroList = ref<Macro[]>([]);
  const selectedMacro = ref<string | null>(null);
  const pressedKeys = ref<Set<number>>(new Set());
  ...
}
</script>
```

### Core Functionality

#### 1. **Key Toggle Logic**
```typescript
const toggleKey = (keyInfo) => {
  if (currentSequence.value.length >= 64) {
    // Show limit error
    return;
  }
  
  // Count current down/up events for this key
  let downCount = 0;
  events.forEach(event => {
    if (event.action === 'down') downCount++;
    else if (event.action === 'up') downCount--;
  });
  
  const isCurrentlyDown = downCount > 0;
  
  if (isCurrentlyDown) {
    currentSequence.value.push({ keyValue, action: 'up', delay: 50 });
    pressedKeys.value.delete(keyValue);
  } else {
    currentSequence.value.push({ keyValue, action: 'down', delay: 50 });
    pressedKeys.value.add(keyValue);
  }
}
```

#### 2. **Save Macro**
```typescript
const saveMacro = () => {
  // Validations
  if (!currentSequence.value.length || !macroName.value) return;
  if (currentSequence.value.length > 64) return;
  if (nameExists) return;
  
  const newMacro = {
    id: Date.now(),  // or existing ID if editing
    name: macroName.value,
    date: new Date().toLocaleString(),
    length: currentSequence.value.length,
    step: currentSequence.value.map((event, index) => ({
      id: index + 1,
      keyValue: event.keyValue,
      status: event.action === 'down' ? 1 : 0,
      delay: index === 0 ? 0 : event.delay
    }))
  };
  
  localStorage.setItem('MacroList', JSON.stringify(macroList.value));
}
```

#### 3. **Load Macro**
```typescript
const loadMacro = (id) => {
  const macro = macroList.value.find(m => m.id === parseInt(id));
  
  currentSequence.value = macro.step.map(step => ({
    keyValue: step.keyValue,
    action: step.status === 1 ? 'down' : 'up',
    delay: step.delay
  }));
  
  macroName.value = macro.name;
  
  // Rebuild pressedKeys set
  pressedKeys.value.clear();
  currentSequence.value.forEach(event => {
    if (event.action === 'down') {
      pressedKeys.value.add(event.keyValue);
    } else {
      pressedKeys.value.delete(event.keyValue);
    }
  });
}
```

#### 4. **Export/Import**
```typescript
const exportMacros = () => {
  const blob = new Blob([JSON.stringify(macroList.value, null, 2)], 
    { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'macros.json';
  a.click();
  URL.revokeObjectURL(url);
}

const importMacros = (event) => {
  const file = event.target.files?.[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    const imported = JSON.parse(e.target?.result as string);
    macroList.value = imported;
    localStorage.setItem('MacroList', JSON.stringify(macroList.value));
  };
  reader.readAsText(file);
}
```

## Dependencies

### Services
- None directly (macros stored locally, sent to keyboard separately)

### Utilities
- **keyMap**: Display readable key names
- **MappedKeyboard**: Fetch keyboard layouts

### Storage
- **localStorage**: Persistent macro storage
  - Key: `'MacroList'`
  - Value: JSON array of macro objects

## Data Flow

```
User Clicks "Record Macro"
    ↓
isRecording = true, sequence cleared
    ↓
User Enters Macro Name
    ↓
User Clicks Keys on Visual Keyboard
    ↓
toggleKey() adds down/up to sequence
    ↓
pressedKeys set updated
    ↓
User Edits Delays (optional)
    ↓
User Clicks "Save Macro"
    ↓
Validation checks
    ↓
Macro object created
    ↓
Saved to macroList
    ↓
localStorage updated
    ↓
UI refreshed, sequence cleared
```

## User Workflows

### Create New Macro
1. Click "Record Macro"
2. Enter macro name (e.g., "Login Sequence")
3. Click keys in order:
   - Click 'A' (adds A down, delay 50ms)
   - Click 'A' again (adds A up, delay 50ms)
   - Click 'D' (adds D down)
   - Click 'D' (adds D up)
   - Click 'Enter' down/up
4. Adjust delays as needed
5. Click "Save Macro"
6. Macro appears in library

### Edit Existing Macro
1. Click "Load" on a macro card
2. Sequence populates in current sequence panel
3. Add/remove actions or edit delays
4. Save (overwrites existing macro)

### Delete Macro
1. Click "Delete" on macro card
2. Macro removed from library and localStorage

### Export Macros
1. Click "Export Macros"
2. JSON file downloads (macros.json)
3. Save for backup or sharing

### Import Macros
1. Click "Import Macros"
2. Select JSON file
3. Macros loaded and merged into library

## Macro Data Format

### Stored Format
```json
[
  {
    "id": 1699999999999,
    "name": "Quick Login",
    "date": "11/15/2025, 10:30:00 AM",
    "length": 6,
    "step": [
      { "id": 1, "keyValue": 4, "status": 1, "delay": 0 },
      { "id": 2, "keyValue": 4, "status": 0, "delay": 50 },
      { "id": 3, "keyValue": 7, "status": 1, "delay": 50 },
      { "id": 4, "keyValue": 7, "status": 0, "delay": 50 },
      { "id": 5, "keyValue": 40, "status": 1, "delay": 100 },
      { "id": 6, "keyValue": 40, "status": 0, "delay": 50 }
    ]
  }
]
```

### Field Meanings
- `status: 1` = key down
- `status: 0` = key up
- `delay` = milliseconds after previous action
- `keyValue` = HID key code

## Validation Rules

### Save Validations
1. **Non-empty sequence**: At least one action required
2. **Name required**: Macro name cannot be blank
3. **64-action limit**: Cannot exceed hardware maximum
4. **Unique names**: No duplicate macro names allowed (when creating new)

### Runtime Validations
1. **Delay ≥ 0**: Negative delays auto-corrected to 0
2. **Action limit**: UI prevents adding 65th action

## Error Messages
- "Cannot save: Sequence must not be empty and name must be provided"
- "Cannot save: Macro exceeds 64-action limit"
- "Cannot save: Macro name '[name]' already exists"
- "Cannot add action: Macro has reached 64-action limit"

## State Persistence
- **Macros**: Saved to localStorage, survive browser restart
- **Active Sequence**: Lost on page refresh
- **Recording State**: Reset on page navigation

## Performance Considerations
- No limit on total number of macros
- JSON parsing on load/save is fast for typical usage
- Layout fetching may delay initial render

## Accessibility
- Visual feedback for pressed keys
- Clear labels and buttons
- High contrast UI elements
- Notifications auto-dismiss but also manually dismissible

## Styling Highlights
- Pressed keys glow with accent color
- Sequence items have inline delay inputs
- Macro cards in responsive grid
- Notifications overlay at top

## Known Limitations
- Macros not automatically sent to keyboard (need separate feature)
- No macro playback visualization
- Cannot reorder sequence items (must delete and re-add)
- No timing recording mode (manual delay entry only)
- No macro groups/folders
- Import replaces all macros (no merge option)

## Future Enhancements
- Actual macro playback to keyboard
- Record timing automatically
- Drag-to-reorder sequence items
- Macro folders/categories
- Duplicate macro function
- Macro preview/test mode
- Global hotkey to trigger macros

## Developer Notes
- `pressed Keys` is a Set for O(1) lookup performance
- `isRecording` controls UI state (name input enabled, etc.)
- First action always has delay: 0 (starting point)
- File input hidden, triggered via button click
- Notification timeout is 3000ms
- Layout type switching refetches layout
