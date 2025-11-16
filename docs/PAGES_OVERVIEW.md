# AureTrix Keyboard Driver - Pages Documentation

## Overview
This document provides a comprehensive index of all functional pages in the AureTrix keyboard driver application. Each page has detailed documentation covering its purpose, features, technical implementation, and user workflows.

## Table of Contents
- [Documentation Index](#documentation-index)
- [Page Status](#page-status)
- [Quick Reference](#quick-reference)
- [Common Patterns](#common-patterns)

---

## Documentation Index

### 1. [Connect Page](./pages/Connect.md)
**Purpose**: Device pairing and connection management

**Key Features**:
- WebHID device pairing
- Auto-reconnect to previous devices
- Connection status display
- Decorative circuit board UI

**Primary Use Case**: Initial keyboard setup and connection

**Dependencies**: ConnectionStore, SparkLink SDK

---

### 2. [Key Mapping Page](./pages/KeyMapping.md)
**Purpose**: Remap keyboard keys across multiple layers

**Key Features**:
- 4 independent layers (Fn0-Fn3)
- Drag-and-drop key remapping
- Multi-select bulk operations
- Categorized key browser
- Reset layer to defaults

**Primary Use Case**: Customizing key layouts for gaming, productivity, or specialized workflows

**Dependencies**: KeyboardService, MappedKeyboard utility, keyCategories

---

### 3. [Macro Recording Page](./pages/MacroRecording.md)
**Purpose**: Create and manage keyboard macros visually

**Key Features**:
- Visual macro recording (no physical keypresses)
- Up to 64 actions per macro
- Custom delay timing
- Macro library with save/load
- Import/export macro collections
- Layout-aware recording (Default or Mapped)

**Primary Use Case**: Building complex keystroke sequences for repetitive tasks

**Dependencies**: localStorage, MappedKeyboard utility

---

### 4. [Performance Page](./pages/Performance.md)
**Purpose**: Adjust key travel distances and actuation points

**Key Features**:
- Global and per-key travel modes
- Real-time visual overlays
- Quick selection presets (WASD, letters, numbers)
- Batch processing for multiple keys
- Remapped label display
- Press/release deadzone control
- Switch profile management with max travel capture
- Key test monitor for validating trigger points

**Primary Use Case**: Fine-tuning actuation points for gaming or typing performance

**Dependencies**: KeyboardService, useBatchProcessing, KeyTravel container component

**Component Documentation**:
- [KeyTravel.md](./pages/KeyTravel.md) - Container component
- [GlobalTravel.md](./pages/GlobalTravel.md) - Global travel settings
- [SingleKeyTravel.md](./pages/SingleKeyTravel.md) - Per-key travel configuration
- [SwitchProfiles.md](./pages/SwitchProfiles.md) - Profile management and testing

---

### 5. [Calibration Page](./pages/Calibration.md)
**Purpose**: Calibrate hall effect sensors for accurate travel detection

**Key Features**:
- Real-time travel visualization (200ms polling)
- 6x21 matrix support
- Color-coded calibration feedback (red/green)
- Live maximum travel tracking
- Save calibration to firmware

**Primary Use Case**: Ensuring accurate sensor readings for all keys

**Dependencies**: KeyboardService calibration APIs

---

### 6. [Debug Page](./pages/Debug.md)
**Purpose**: Developer tool for inspecting raw keyboard data

**Key Features**:
- 16+ SDK getter methods
- Visual key selection
- Bulk data retrieval
- Mode testing (Global/Single)
- Configuration export
- JSON data display

**Primary Use Case**: Development, testing, and troubleshooting

**Dependencies**: DebugKeyboardService

---

### 7. [Layout Preview Page](./pages/LayoutPreview.md)
**Purpose**: Visualize different keyboard layout geometries

**Key Features**:
- 7 supported layouts (61 to 87 keys)
- Accurate key positioning
- Layout selection persistence
- No keyboard connection required

**Primary Use Case**: Understanding layout differences and testing geometry

**Dependencies**: layoutConfigs utility

---

### 8. [Rapid Trigger Page](./pages/RapidTrigger.md)
**Purpose**: Configure rapid trigger settings for ultra-responsive key actuation

**Key Features**:
- 5-slider configuration system (Initial Trigger, Re-Trigger, Reset, Top/Bottom Deadzones)
- RT Travel and Deadzone linking
- Automatic clamping of Initial Trigger Travel
- Real-time visual overlays with 5 color-coded values
- Quick selection presets (WASD, letters, numbers)
- Batch processing for multiple keys

**Primary Use Case**: Optimizing keyboard responsiveness for competitive gaming and high-speed typing

**Dependencies**: KeyboardService RT APIs, useBatchProcessing, MappedKeyboard utility

---

## Page Status

### Fully Functional Pages (8)
✅ Connect  
✅ Key Mapping  
✅ Macro Recording  
✅ Performance  
✅ Calibration  
✅ Debug  
✅ Layout Preview  
✅ Rapid Trigger  

### Placeholder Pages (3)
⏳ Lighting - RGB control (planned)  
⏳ Profiles - Configuration management (planned)  
⏳ Advanced Config - Advanced features (planned)  

---

## Quick Reference

### By User Type

#### End Users
- **Connect**: Start here to pair your keyboard
- **Key Mapping**: Customize your key layout
- **Macro Recording**: Create automated keystroke sequences
- **Performance**: Optimize actuation points for your use case
- **Calibration**: Ensure accurate sensor readings

#### Developers
- **Debug**: Inspect all keyboard data
- **Layout Preview**: Understand layout geometry
- **All Pages**: Study implementation patterns

#### Gamers
- **Rapid Trigger**: Configure ultra-responsive RT settings for competitive advantage
- **Performance**: Tune WASD travel for faster inputs
- **Key Mapping**: Create gaming-specific layers
- **Macro Recording**: Build combo macros

#### Typists
- **Performance**: Adjust travel for comfortable typing
- **Calibration**: Ensure consistent key feel

---

## Common Patterns

### Data Flow Pattern
Most pages follow this pattern:
```
User Action → Component Method → Service Call → Hardware Command
                                              ↓
                                    Hardware Response
                                              ↓
                                    Store/State Update
                                              ↓
                                    UI Re-render
```

### Connection Requirement
All pages except **Layout Preview** require an active keyboard connection.

Pages handle disconnection gracefully by:
- Disabling interaction controls
- Displaying "No keyboard connected" messages
- Checking `connectionStore.isConnected` before operations

### Layout Fetching
Pages that display keyboards use **MappedKeyboard** utility:
```typescript
const { layout, loaded, gridStyle, getKeyStyle, fetchLayerLayout } = 
  useMappedKeyboard(layerRef);
```

This provides:
- `layout`: 2D array of key info
- `loaded`: Boolean indicating data ready
- `gridStyle`: CSS for container
- `getKeyStyle()`: CSS for individual keys
- `fetchLayerLayout()`: Refresh layout data

### Batch Processing
Pages that update multiple keys use **useBatchProcessing**:
```typescript
const { processBatches } = useBatchProcessing();

await processBatches(keyIds, async (keyId) => {
  // Process individual key
});
```

Benefits:
- Prevents hardware overload
- Automatic chunking (80 keys per batch)
- Configurable delays between batches

### Error Handling
Common patterns:
- Try-catch blocks around service calls
- Console logging for debugging
- User-friendly notification messages
- Graceful degradation (missing data doesn't crash UI)

### State Management
- **Connection State**: Centralized in ConnectionStore (Pinia)
- **Local State**: Component-specific (Vue refs)
- **Hardware State**: Stored in keyboard firmware
- **User Preferences**: localStorage for UI settings

---

## Navigation Flow

### Typical User Journey
```
1. Connect Page (pair device)
   ↓
2. Performance Page (adjust travel)
   ↓
3. Calibration Page (calibrate sensors)
   ↓
4. Key Mapping Page (customize layout)
   ↓
5. Macro Recording Page (create macros)
```

### Developer Journey
```
1. Connect Page (pair device)
   ↓
2. Debug Page (inspect all data)
   ↓
3. Layout Preview (understand geometry)
   ↓
4. Test specific features on relevant pages
```

---

## Architecture Overview

### Service Layer
- **KeyboardService**: Main hardware communication
- **DebugKeyboardService**: Development-specific service
- **SparkLink SDK**: Low-level keyboard protocol

### Utility Layer
- **MappedKeyboard**: Layout fetching and styling
- **useBatchProcessing**: Batch operation management
- **keyMap**: Key code translations
- **layoutConfigs**: Physical layout geometry
- **keyCategories**: Key grouping

### Store Layer
- **ConnectionStore**: Device connection state
- **TravelProfilesStore**: User travel presets

### Component Layer
- **Pages**: Top-level route components (these docs)
- **Performance Components**: Reusable controls (KeyTravel, etc.)

---

## Development Guidelines

### Adding a New Page
1. Create component in `src/pages/`
2. Add route in `src/router/index.ts`
3. Follow existing patterns (layout fetching, error handling)
4. Create documentation in `docs/pages/`
5. Update this overview document

### Testing a Page
1. Use Debug page to verify hardware communication
2. Check browser console for errors
3. Test with/without keyboard connected
4. Verify state persistence (where applicable)

### Common Pitfalls
- **Forgetting to check connection**: Always verify `isConnected` before hardware calls
- **Not batching operations**: Large multi-key operations need batching
- **Missing error handling**: Wrap service calls in try-catch
- **Physical vs logical keys**: Use `physicalKeyValue` for travel, `keyValue` for mapping

---

## Additional Resources

### Codebase Documentation
- Main README: `../README.md`
- Technical Architecture: `../replit.md` (if exists)

### External Resources
- SparkLink SDK Documentation
- WebHID API Reference
- Vue 3 Documentation
- Pinia State Management

---

## Feedback and Contributions

This documentation is maintained alongside the codebase. When making changes to pages:

1. **Update the page**: Make your code changes
2. **Update the docs**: Revise the relevant `docs/pages/*.md` file
3. **Update this index**: If adding/removing pages or changing structure
4. **Test thoroughly**: Ensure examples in docs still work

---

## Component-Level Documentation

Some pages have complex component hierarchies with dedicated documentation for each sub-component:

### Performance Page Components
The Performance page uses four sub-components, each with comprehensive documentation:
- **[KeyTravel.md](./pages/KeyTravel.md)** - Container component that orchestrates the three main sub-components
- **[GlobalTravel.md](./pages/GlobalTravel.md)** - Global travel and deadzone configuration for all keys in global mode
- **[SingleKeyTravel.md](./pages/SingleKeyTravel.md)** - Per-key travel and deadzone configuration for individual keys
- **[SwitchProfiles.md](./pages/SwitchProfiles.md)** - Profile management, max travel capture, and key test monitor

These component docs provide detailed technical implementation, SDK integration patterns, data flows, and user workflows specific to each sub-component.

---

## Version History

- **v1.0** (November 2025): Initial comprehensive documentation for 7 functional pages
- **v1.1** (November 2025): Added Rapid Trigger page documentation (8 functional pages total)
- **v1.1.1** (November 2025): Added Performance component documentation (GlobalTravel, SingleKeyTravel, KeyTravel, SwitchProfiles)
- Future versions will document remaining placeholder pages as they're implemented

---

*Last Updated: November 16, 2025*
