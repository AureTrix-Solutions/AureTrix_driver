# KeyTravel Component

**Component Path:** `src/components/performance/KeyTravel.vue`

**Parent Component:** Performance.vue

**Type:** Container Component

---

## Overview

KeyTravel is a lightweight container component that orchestrates the three main sub-components of the Performance page: GlobalTravel, SingleKeyTravel, and SwitchProfiles. It acts as an event router and state provider, managing the flow of data between child components and the parent Performance page.

The component's primary responsibilities are:
1. Provide computed `profileMaxTravel` from the travel profiles store to all child components
2. Forward overlay events from child components to the parent
3. Maintain a clean separation of concerns between travel configuration and profile management

---

## Key Features

1. **Event Routing**
   - Forwards `update-overlay` events from GlobalTravel to Performance.vue
   - Forwards `update-single-overlay` events from SingleKeyTravel to Performance.vue
   - Forwards `mode-changed` events from GlobalTravel/SingleKeyTravel to Performance.vue

2. **Reactive Profile Max Travel**
   - Computes `profileMaxTravel` from the Pinia travel profiles store
   - Reactively updates when user switches profiles
   - Provides default 4.0mm when no profile selected
   - Passes value to all three child components

3. **Props Delegation**
   - Receives props from Performance.vue
   - Delegates props to appropriate child components
   - Maintains consistency across all sub-components

4. **Minimal Logic**
   - No business logic or state management
   - Pure orchestration layer
   - Console logging for debugging event flow

---

## Component Architecture

### Visual Structure

```
KeyTravel.vue (Container)
├─ GlobalTravel.vue     (Global travel and deadzone settings)
├─ SingleKeyTravel.vue  (Per-key travel and deadzone settings)
└─ SwitchProfiles.vue   (Profile management and key testing)
```

Each child component is rendered vertically in a single column layout.

---

## Technical Implementation

### Props

```typescript
interface Props {
  selectedKeys: IDefKeyInfo[];    // Keys currently selected on keyboard grid
  layout: IDefKeyInfo[][];        // Full keyboard layout (all keys)
  baseLayout: any;                // Base layout configuration object
}
```

**Note**: `baseLayout` is passed to SingleKeyTravel and SwitchProfiles but not used in current implementation.

### Emits

```typescript
emits: [
  'update-overlay',         // Global travel overlay data
  'update-single-overlay',  // Per-key travel overlay data
  'mode-changed'            // Keys switched between global/single mode
]
```

**Event Details**:

- **`update-overlay`**: Forwarded from GlobalTravel when global travel or deadzones change
  - Payload: `{ travel: string, pressDead: string, releaseDead: string }` or `null`
  
- **`update-single-overlay`**: Forwarded from SingleKeyTravel when per-key overlay visibility toggles
  - Payload: `null` or `{ refresh: true }`
  
- **`mode-changed`**: Forwarded from GlobalTravel/SingleKeyTravel when keys switch modes
  - Payload: `{ keyIds: number[], newMode: 'global' | 'single' }`
  - Critical for overlay reactivity - triggers parent to update keyModeMap tracking

### Store Integration

```typescript
import { useTravelProfilesStore } from '@/store/travelProfilesStore';

const store = useTravelProfilesStore();

const profileMaxTravel = computed(() => {
  const selected = store.selectedProfile;
  return selected ? selected.maxTravel : 4.0; // Default to 4.0mm if no profile
});
```

The `profileMaxTravel` computed property reactively tracks the currently selected profile's max travel value. This value cascades to all child components and affects:
- Maximum slider range for travel controls
- Automatic clamping calculations in GlobalTravel and SingleKeyTravel
- Validation in SwitchProfiles key testing

---

## Event Flow

### Global Overlay Event Flow

```
GlobalTravel.vue: User clicks "Show" button
  ↓
GlobalTravel emits 'update-overlay' with { travel: '2.00', pressDead: '0.20', releaseDead: '0.20' }
  ↓
KeyTravel.setOverlay() receives event
  ↓
Console log: "[KEYTRAVEL] Forwarding update-overlay: { travel: '2.00', pressDead: '0.20', releaseDead: '0.20' }"
  ↓
KeyTravel emits 'update-overlay' to Performance.vue
  ↓
Performance.vue applies overlay to all global-mode keys on keyboard grid
```

### Single-Key Overlay Event Flow

```
SingleKeyTravel.vue: User clicks "Show" button
  ↓
SingleKeyTravel emits 'update-single-overlay' with {} (trigger signal)
  ↓
KeyTravel.setSingleOverlay() receives event
  ↓
Console log: "[KEYTRAVEL] Forwarding update-single-overlay: {}"
  ↓
KeyTravel emits 'update-single-overlay' to Performance.vue
  ↓
Performance.vue reads travel/deadzone from each selected key and displays overlay
```

### Overlay Clear Flow

```
Child component: User clicks "Hide" button
  ↓
Child emits 'update-overlay' or 'update-single-overlay' with null
  ↓
KeyTravel forwards null to Performance.vue
  ↓
Performance.vue clears overlay from keyboard grid
```

### Mode Change Event Flow

```
GlobalTravel.vue: User clicks "Select to Global" button
  ↓
GlobalTravel switches selected keys to global mode via SDK
  ↓
GlobalTravel emits 'mode-changed' with { keyIds: [4, 17, 30, 31], newMode: 'global' }
  ↓
KeyTravel.handleModeChange() receives event
  ↓
Console log: "[KEYTRAVEL] Forwarding mode-changed: { keyIds: [...], newMode: 'global' }"
  ↓
KeyTravel emits 'mode-changed' to Performance.vue
  ↓
Performance.vue updates keyModeMap tracking
  ↓
Computed overlayData automatically recalculates
  ↓
UI updates with correct overlay values on affected keys
```

**Reactivity Importance**: This event flow is critical for preventing overlay persistence bugs. Without the `mode-changed` event, keys switching between global and single modes would retain incorrect overlay values until page refresh. The event ensures the parent's `keyModeMap` tracking stays synchronized with actual SDK key modes.

---

## Template Structure

```vue
<template>
  <div class="settings-section">
    <GlobalTravel 
      :layout="layout" 
      :selected-keys="selectedKeys" 
      :profile-max-travel="profileMaxTravel"
      @update-overlay="setOverlay" 
      @mode-changed="handleModeChange"
    />
    <SingleKeyTravel 
      :selected-keys="selectedKeys" 
      :layout="layout" 
      :base-layout="baseLayout" 
      :profile-max-travel="profileMaxTravel"
      @update-single-overlay="setSingleOverlay" 
      @mode-changed="handleModeChange"
    />
    <SwitchProfiles 
      :selected-keys="selectedKeys" 
      :layout="layout" 
      :base-layout="baseLayout"
      :profile-max-travel="profileMaxTravel"
    />
  </div>
</template>
```

### Props Distribution

| Prop | GlobalTravel | SingleKeyTravel | SwitchProfiles |
|------|--------------|-----------------|----------------|
| `layout` | ✓ | ✓ | ✓ |
| `selectedKeys` | ✓ | ✓ | ✓ |
| `baseLayout` | ✗ | ✓ (unused) | ✓ (unused) |
| `profileMaxTravel` | ✓ | ✓ | ✓ |

**Note**: `profileMaxTravel` is computed within KeyTravel, not passed as a prop from Performance.

### Event Handlers

```typescript
const setOverlay = (data: { travel: string; pressDead: string; releaseDead: string } | null) => {
  console.log(`[KEYTRAVEL] Forwarding update-overlay:`, data);
  emit('update-overlay', data);
};

const setSingleOverlay = (data: { travel: string; pressDead: string; releaseDead: string } | null) => {
  console.log(`[KEYTRAVEL] Forwarding update-single-overlay:`, data);
  emit('update-single-overlay', data);
};

const handleModeChange = (data: { keyIds: number[]; newMode: 'global' | 'single' }) => {
  console.log(`[KEYTRAVEL] Forwarding mode-changed:`, data);
  emit('mode-changed', data);
};
```

**Handler Responsibilities**:
- All handlers are simple forwarders - they add debug logging and emit to parent
- No business logic or data transformation
- `handleModeChange` is critical for overlay reactivity, ensuring parent tracks mode changes

Console logging helps debug event flow during development. Logs appear in browser console with `[KEYTRAVEL]` prefix.

---

## Profile Max Travel Reactivity

The `profileMaxTravel` computed property creates a reactive dependency chain:

```
User Action in SwitchProfiles
  ↓
User selects different profile from dropdown
  ↓
SwitchProfiles updates store via store.selectProfile(id)
  ↓
useTravelProfilesStore.selectedProfile changes
  ↓
KeyTravel.profileMaxTravel computed updates (e.g., 4.0mm → 3.5mm)
  ↓
Vue reactivity propagates to child components:
  ├─ GlobalTravel: maxTravel computed updates → travel slider max adjusts → auto-clamping triggers if needed
  ├─ SingleKeyTravel: maxTravel computed updates → travel slider max adjusts → auto-clamping triggers if needed
  └─ SwitchProfiles: profileMaxTravel prop updates → validation logic uses new max
```

This ensures all travel controls respect the currently selected profile's physical switch limits.

---

## Example Scenarios

### Scenario 1: User Switches Profile from 4.0mm to 3.2mm

**Initial State**:
- Profile: "Gateron Red" (4.0mm max)
- GlobalTravel: 3.8mm
- SingleKeyTravel (WASD): 3.9mm

**User Action**: Switches to "Cherry MX Red" profile (3.2mm max)

**What Happens**:

1. SwitchProfiles dropdown change updates store
2. KeyTravel's `profileMaxTravel` computed changes from 4.0 → 3.2
3. GlobalTravel receives new prop:
   - `maxTravel` computed becomes `min(3.2, 3.2 - 0.2) = 3.0` (assuming 0.2mm bottom deadzone)
   - Watcher detects `globalTravel (3.8) > maxTravel (3.0)`
   - Auto-clamps `globalTravel` to 3.0mm
   - Updates keyboard via SDK
4. SingleKeyTravel receives new prop:
   - `maxTravel` computed becomes 3.0mm
   - If WASD travel (3.9mm) > 3.0mm, auto-clamps to 3.0mm
   - Updates WASD keys via SDK

**Result**: All travels automatically respect the new profile's physical limits without manual adjustment.

### Scenario 2: Switching Between Global and Single Overlays

**User Action Flow**:

1. User clicks "Show" in GlobalTravel
2. KeyTravel forwards `update-overlay` event to Performance
3. Performance displays global travel values on all global-mode keys
4. User selects specific keys (WASD)
5. User clicks "Show" in SingleKeyTravel
6. SingleKeyTravel emits `update-single-overlay` with `{}`
7. KeyTravel forwards event to Performance
8. Performance reads per-key travel from each selected key
9. Both global AND single overlays now visible (if configured)
10. User clicks "Hide" in GlobalTravel
11. GlobalTravel emits `update-overlay` with `null`
12. KeyTravel forwards null to Performance
13. Performance clears global overlay (single overlay remains)

---

## Debugging with Console Logs

The component includes console logs to trace event flow:

```typescript
console.log(`[KEYTRAVEL] Forwarding update-overlay:`, data);
// Example output: [KEYTRAVEL] Forwarding update-overlay: { travel: '2.50', pressDead: '0.20', releaseDead: '0.20' }

console.log(`[KEYTRAVEL] Forwarding update-single-overlay:`, data);
// Example output: [KEYTRAVEL] Forwarding update-single-overlay: {}
```

These logs help developers:
- Verify events are reaching KeyTravel from child components
- Confirm events are being forwarded to Performance.vue
- Inspect payload data structure
- Troubleshoot overlay display issues

**Note**: These logs remain in production build. Consider removing or gating behind a debug flag for release.

---

## Integration with Performance Page

Performance.vue renders KeyTravel as the main content area:

```vue
<!-- Performance.vue template (simplified) -->
<template>
  <div class="performance-page">
    <KeyboardGrid 
      :layout="currentLayout"
      :overlays="overlayData"
      @key-select="handleKeySelect"
    />
    
    <KeyTravel 
      :selected-keys="selectedKeys"
      :layout="currentLayout"
      :base-layout="baseLayout"
      @update-overlay="handleGlobalOverlay"
      @update-single-overlay="handleSingleOverlay"
      @refresh-overlays="refreshAllOverlays"
    />
  </div>
</template>
```

### Data Flow Summary

```
Performance.vue (parent)
  │
  ├─ Provides: selectedKeys, layout, baseLayout
  ├─ Receives: update-overlay, update-single-overlay, refresh-overlays
  │
  └─ KeyTravel.vue (container)
       │
       ├─ Computes: profileMaxTravel (from store)
       ├─ Provides to children: profileMaxTravel + parent props
       ├─ Receives from children: overlay events
       ├─ Forwards to parent: all overlay events
       │
       ├─ GlobalTravel.vue
       │    └─ Manages: global travel settings
       │
       ├─ SingleKeyTravel.vue
       │    └─ Manages: per-key travel settings
       │
       └─ SwitchProfiles.vue
            └─ Manages: profile CRUD and key testing
```

---

## Dependencies

### Internal Dependencies
- `@/store/travelProfilesStore` - Pinia store for switch profiles
- `@/types/types` - TypeScript interfaces (IDefKeyInfo)
- `./GlobalTravel.vue` - Global travel component
- `./SingleKeyTravel.vue` - Per-key travel component
- `./SwitchProfiles.vue` - Profile management component

### External Dependencies
- Vue 3 Composition API (`computed`, `PropType`, `defineComponent`)

---

## Styling

```scss
.settings-section {
  // Wrapper for sub-components; no additional rules needed
}
```

The component applies no styling beyond a wrapper div. All visual styling is handled by child components.

---

## Known Limitations

1. **No Direct State Management**: Component has no local state, purely reactive to props and store

2. **Console Logs in Production**: Debug logs remain in production builds (should be gated or removed)

3. **Unused Props Forwarding**: `baseLayout` is forwarded to children but not used (could be removed in future refactor)

4. **No Event Validation**: Forwards all events without validating payload structure

5. **No Error Boundary**: If child component emits malformed data, component blindly forwards it

---

## Future Enhancements

1. **Event Payload Validation**: Validate overlay data structure before forwarding to prevent downstream errors

2. **Debug Mode Toggle**: Gate console logs behind a debug environment variable

3. **Props Cleanup**: Remove unused `baseLayout` prop if children don't need it

4. **Event Aggregation**: Combine multiple child events into single parent events (e.g., `update-all-overlays`)

5. **Loading State**: Manage loading states when switching profiles (prevent UI flicker during batch updates)

6. **Error Handling**: Catch and handle errors from child components, display user-friendly messages

7. **Profile Preload**: Preload profile data on component mount to avoid delay on first dropdown open

---

## Related Documentation

- [Performance.md](./Performance.md) - Parent page documentation
- [GlobalTravel.md](./GlobalTravel.md) - Global travel sub-component
- [SingleKeyTravel.md](./SingleKeyTravel.md) - Per-key travel sub-component
- [SwitchProfiles.md](./SwitchProfiles.md) - Profile management sub-component
- [SDK_REFERENCE.md](../SDK_REFERENCE.md) - Complete SDK API reference

---

## Summary

KeyTravel is a minimalist container component that:
- **Computes** reactive `profileMaxTravel` from the travel profiles store
- **Delegates** props to three child components (GlobalTravel, SingleKeyTravel, SwitchProfiles)
- **Routes** overlay events from children to parent (Performance.vue)
- **Logs** events for debugging purposes

It maintains clean separation between configuration UI (GlobalTravel, SingleKeyTravel), profile management (SwitchProfiles), and the main Performance page orchestration. The component's simplicity makes it easy to maintain and extend as new performance features are added.
