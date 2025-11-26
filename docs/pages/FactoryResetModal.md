# FactoryResetModal Component Documentation

## Overview
FactoryResetModal is a confirmation dialog component that warns users about the consequences of factory resetting their keyboard and requires explicit confirmation before proceeding.

**Component Path:** `src/components/FactoryResetModal.vue`

**Parent Component:** App.vue

**Type:** Modal Dialog Component

## Purpose
- Display clear warning about factory reset consequences
- Prevent accidental factory resets
- Recommend profile export before reset
- Provide cancel option for users who change their mind

## Key Features

### 1. Warning Display
- Red warning title with caution emoji
- Clear list of what will be deleted:
  - Key mappings and macros
  - RGB lighting settings
  - Performance settings and calibration
  - All saved profiles

### 2. Recommendation
- Prominent recommendation to export profiles first
- Styled with bold text for visibility

### 3. Action Buttons
- **Cancel**: Close modal without action
- **OK, Reset**: Confirm and proceed with factory reset

### 4. Modal Behavior
- Backdrop click closes modal (cancel action)
- Centered on screen with dark overlay
- Cyan accent border matching app theme

## User Interface Elements

### Modal Structure
```
+------------------------------------------+
|          ⚠️ Factory Reset                |
+------------------------------------------+
| This will restore your keyboard to       |
| factory settings and delete all your     |
| custom configurations, including:        |
|                                          |
| • Key mappings and macros                |
| • RGB lighting settings                  |
| • Performance settings and calibration   |
| • All saved profiles                     |
|                                          |
| We strongly recommend exporting your     |
| profiles first!                          |
|                                          |
|  [Cancel]              [OK, Reset]       |
+------------------------------------------+
```

## Technical Implementation

### Component Definition
```typescript
export default defineComponent({
  name: 'FactoryResetModal',
  emits: ['confirm', 'cancel'],
  methods: {
    onConfirm() {
      this.$emit('confirm');
    },
    onCancel() {
      this.$emit('cancel');
    }
  }
});
```

### Template
```vue
<template>
  <div class="modal-backdrop" @click.self="onCancel">
    <div class="modal-content">
      <h2 class="modal-title">⚠️ Factory Reset</h2>
      <p class="modal-message">
        This will restore your keyboard to factory settings and 
        <strong>delete all your custom configurations</strong>, including:
      </p>
      <ul class="modal-list">
        <li>Key mappings and macros</li>
        <li>RGB lighting settings</li>
        <li>Performance settings and calibration</li>
        <li>All saved profiles</li>
      </ul>
      <p class="modal-warning">
        <strong>We strongly recommend exporting your profiles first!</strong>
      </p>
      <div class="modal-buttons">
        <button class="cancel-btn" @click="onCancel">Cancel</button>
        <button class="ok-btn" @click="onConfirm">OK, Reset</button>
      </div>
    </div>
  </div>
</template>
```

### Props
None - this is a self-contained modal.

### Emits
| Event | Description |
|-------|-------------|
| `confirm` | User clicked "OK, Reset" - proceed with factory reset |
| `cancel` | User clicked "Cancel" or backdrop - close modal |

## Styling

### SCSS Structure
```scss
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: #1e1e1e;
  border: 1px solid #00ffff;
  border-radius: 8px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0, 255, 255, 0.3);
}

.modal-title {
  color: #ff4444;  // Red for warning
}

.cancel-btn {
  background: transparent;
  border: 1px solid #666;
}

.ok-btn {
  background: #ff4444;  // Red for destructive action
  color: white;
}
```

### Design Choices
- **Dark theme**: Matches app's dark color scheme
- **Red title**: Immediately signals danger/warning
- **Cyan border**: Maintains brand consistency
- **Red confirm button**: Reinforces destructive nature of action
- **Subdued cancel button**: Encourages cancellation as safer option

## Usage in App.vue

### Rendering
```vue
<FactoryResetModal 
  v-if="isFactoryResetModalVisible" 
  @confirm="handleFactoryReset" 
  @cancel="hideFactoryResetModal" 
/>
```

### Control Methods
```typescript
showFactoryResetModal() {
  this.isFactoryResetModalVisible = true;
},
hideFactoryResetModal() {
  this.isFactoryResetModalVisible = false;
},
async handleFactoryReset() {
  this.hideFactoryResetModal();
  const result = await KeyboardService.factoryReset();
  // Handle result...
}
```

## Data Flow

```
Factory Reset button clicked
    |
    v
showFactoryResetModal()
    |
    v
isFactoryResetModalVisible = true
    |
    v
FactoryResetModal renders
    |
    +---> User clicks Cancel or backdrop
    |         |
    |         v
    |     @cancel emitted
    |         |
    |         v
    |     hideFactoryResetModal()
    |         |
    |         v
    |     Modal closes (no action)
    |
    +---> User clicks "OK, Reset"
              |
              v
          @confirm emitted
              |
              v
          handleFactoryReset()
              |
              v
          KeyboardService.factoryReset()
              |
              v
          Show success/failure alert
```

## Accessibility

### Current Implementation
- Backdrop click as escape mechanism
- Clear button labels
- High contrast text

### Potential Improvements
- Add `aria-modal="true"`
- Add `role="dialog"`
- Trap focus within modal
- Add keyboard escape handling
- Add `aria-labelledby` for title

## Related Documentation

- [GlobalFeatures](./GlobalFeatures.md) - Parent component documentation
- [SDK Reference](../SDK_REFERENCE.md#factory-reset) - Factory reset SDK method

---

*Last Updated: November 26, 2025*
