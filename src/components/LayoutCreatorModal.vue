<template>
  <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Create Custom Keyboard Layout</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <!-- Keyboard Info Section -->
        <div class="info-section">
          <div class="form-group">
            <label>Product Name</label>
            <input v-model="productName" type="text" placeholder="Enter keyboard product name" readonly />
          </div>
          <div class="form-group checkbox-group">
            <label>
              <input v-model="hasAxisList" type="checkbox" />
              <span>Supports Axis List (Controller Emulation)</span>
            </label>
          </div>
        </div>

        <div class="layout-builder">
          <div class="builder-section">
            <h3>Layout Builder</h3>
            
            <!-- Rows -->
            <div v-for="(row, rIdx) in rows" :key="`row-${rIdx}`" class="row-builder">
              <div class="row-header">
                <h4>Row {{ rIdx + 1 }}</h4>
                <button @click="removeRow(rIdx)" class="btn-sm btn-danger">Remove Row</button>
              </div>

              <!-- Keys in this row -->
              <div class="keys-container">
                <div v-for="(key, kIdx) in row.keys" :key="`key-${rIdx}-${kIdx}`" class="key-item">
                  <label>Key {{ kIdx + 1 }}</label>
                  <select v-model="key.size" @change="updatePreview">
                    <option v-for="unit in keyUnits" :key="unit.value" :value="unit.value">
                      {{ unit.label }}
                    </option>
                  </select>
                  <label>Gap After (mm)</label>
                  <input v-model.number="key.gapAfter" type="number" min="0" step="0.5" @input="updatePreview" />
                  <button @click="removeKey(rIdx, kIdx)" class="btn-sm btn-danger">×</button>
                </div>
                <button @click="addKey(rIdx)" class="btn-sm">+ Add Key</button>
              </div>

              <!-- Row spacing -->
              <div class="row-spacing">
                <label>Spacing Below Row (mm)</label>
                <input v-model.number="row.spacingBelow" type="number" min="0" step="0.5" @input="updatePreview" />
              </div>
            </div>

            <button @click="addRow" class="btn">+ Add Row</button>
          </div>

          <!-- Live Preview -->
          <div class="preview-section">
            <h3>Preview</h3>
            <div class="preview-container" :style="previewStyle">
              <div v-for="(row, rIdx) in previewKeys" :key="`preview-row-${rIdx}`" class="preview-row">
                <div
                  v-for="(key, kIdx) in row"
                  :key="`preview-key-${rIdx}-${kIdx}`"
                  class="preview-key"
                  :style="key.style"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="exportLayout" class="btn btn-secondary">Export JSON</button>
        <button @click="submitToGitHub" class="btn btn-secondary">Submit to GitHub</button>
        <button @click="saveLayout" class="btn btn-primary">Save Layout</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import LayoutStorageService from '@/services/LayoutStorageService';
import { useConnectionStore } from '@/store/connection';
import KeyboardService from '@/services/KeyboardService';

interface KeyConfig {
  size: number;
  gapAfter: number;
}

interface RowConfig {
  keys: KeyConfig[];
  spacingBelow: number;
}

export default defineComponent({
  name: 'LayoutCreatorModal',
  props: {
    visible: {
      type: Boolean,
      required: true
    }
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const connectionStore = useConnectionStore();
    const productName = ref('');
    const hasAxisList = ref(false);
    const rows = ref<RowConfig[]>([]);

    // Keyboard units mapping (units to mm)
    const keyUnits = [
      { label: '1u (18mm)', value: 18 },
      { label: '1.25u (22.5mm)', value: 22.5 },
      { label: '1.5u (27mm)', value: 27 },
      { label: '1.75u (31.5mm)', value: 31.5 },
      { label: '2u (36mm)', value: 36 },
      { label: '2.25u (40.5mm)', value: 40.5 },
      { label: '2.75u (49.5mm)', value: 49.5 },
      { label: '6.25u (112.5mm)', value: 112.5 },
      { label: '6.5u (117mm)', value: 117 },
      { label: 'Custom', value: 18 }
    ];

    // Initialize with connected keyboard info
    const init = async () => {
      productName.value = connectionStore.deviceInfo?.productName || 'Unknown Keyboard';
      
      try {
        const axisResult = await KeyboardService.getAxisList();
        if (!(axisResult instanceof Error)) {
          hasAxisList.value = axisResult.hasAxisSetting;
        }
      } catch (error) {
        console.warn('Could not fetch axis list:', error);
      }

      // Start with a default row
      if (rows.value.length === 0) {
        addRow();
      }
    };

    // Watch for modal visibility to initialize
    watch(() => props.visible, (newVal) => {
      if (newVal) {
        init();
      }
    });

    const addRow = () => {
      rows.value.push({
        keys: [{ size: 18, gapAfter: 0 }],
        spacingBelow: 18
      });
      updatePreview();
    };

    const removeRow = (rowIdx: number) => {
      rows.value.splice(rowIdx, 1);
      updatePreview();
    };

    const addKey = (rowIdx: number) => {
      rows.value[rowIdx].keys.push({ size: 18, gapAfter: 0 });
      updatePreview();
    };

    const removeKey = (rowIdx: number, keyIdx: number) => {
      rows.value[rowIdx].keys.splice(keyIdx, 1);
      updatePreview();
    };

    // Generate preview
    const previewKeys = ref<Array<Array<{ style: any }>>>([]);
    const previewStyle = ref({});

    const updatePreview = () => {
      const mmToPx = (mm: number) => mm * 4;
      let cumulativeTop = 0;
      const generatedRows = [];

      for (let rIdx = 0; rIdx < rows.value.length; rIdx++) {
        const row = rows.value[rIdx];
        let left = 0;
        const generatedKeys = [];

        for (let kIdx = 0; kIdx < row.keys.length; kIdx++) {
          const key = row.keys[kIdx];
          const width = mmToPx(key.size);
          const height = mmToPx(17);

          generatedKeys.push({
            style: {
              position: 'absolute',
              left: `${left}px`,
              top: `${cumulativeTop}px`,
              width: `${width}px`,
              height: `${height}px`
            }
          });

          left += width + mmToPx(1);
          if (key.gapAfter > 0) {
            left += mmToPx(key.gapAfter);
          }
        }

        generatedRows.push(generatedKeys);
        cumulativeTop += mmToPx(18 + (row.spacingBelow || 0));
      }

      previewKeys.value = generatedRows;
      
      const maxWidth = Math.max(...rows.value.map(row => {
        return row.keys.reduce((sum, key) => sum + mmToPx(key.size) + mmToPx(1) + mmToPx(key.gapAfter), 0);
      }), 100);

      previewStyle.value = {
        position: 'relative',
        height: `${cumulativeTop}px`,
        width: `${maxWidth}px`,
        margin: '0 auto'
      };
    };

    const saveLayout = async () => {
      const keySizes = rows.value.map(row => row.keys.map(key => key.size));
      const gapsAfterCol = rows.value.map(row => {
        const gaps: Record<number, number> = {};
        row.keys.forEach((key, idx) => {
          if (key.gapAfter > 0) {
            gaps[idx] = key.gapAfter;
          }
        });
        return gaps;
      });
      const rowSpacing = rows.value.map(row => row.spacingBelow || 18);

      const layout = {
        productName: productName.value,
        hasAxisList: hasAxisList.value,
        keySizes,
        gapsAfterCol,
        rowSpacing,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      try {
        await LayoutStorageService.saveLayout(layout);
        emit('saved');
        emit('close');
      } catch (error) {
        console.error('Failed to save layout:', error);
        alert('Failed to save layout. Please try again.');
      }
    };

    const exportLayout = () => {
      const keySizes = rows.value.map(row => row.keys.map(key => key.size));
      const gapsAfterCol = rows.value.map(row => {
        const gaps: Record<number, number> = {};
        row.keys.forEach((key, idx) => {
          if (key.gapAfter > 0) {
            gaps[idx] = key.gapAfter;
          }
        });
        return gaps;
      });
      const rowSpacing = rows.value.map(row => row.spacingBelow || 18);

      const layout = {
        productName: productName.value,
        hasAxisList: hasAxisList.value,
        keySizes,
        gapsAfterCol,
        rowSpacing,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      LayoutStorageService.exportLayout(layout);
    };

    const submitToGitHub = () => {
      const keySizes = rows.value.map(row => row.keys.map(key => key.size));
      const gapsAfterCol = rows.value.map(row => {
        const gaps: Record<number, number> = {};
        row.keys.forEach((key, idx) => {
          if (key.gapAfter > 0) {
            gaps[idx] = key.gapAfter;
          }
        });
        return gaps;
      });
      const rowSpacing = rows.value.map(row => row.spacingBelow || 18);

      const layout = {
        productName: productName.value,
        hasAxisList: hasAxisList.value,
        keySizes,
        gapsAfterCol,
        rowSpacing,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const issueLink = LayoutStorageService.generateGitHubIssueLink(layout);
      window.open(issueLink, '_blank');
    };

    return {
      productName,
      hasAxisList,
      rows,
      keyUnits,
      addRow,
      removeRow,
      addKey,
      removeKey,
      previewKeys,
      previewStyle,
      updatePreview,
      saveLayout,
      exportLayout,
      submitToGitHub
    };
  }
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@styles/variables' as v;

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: v.$background-dark;
  border: 1px solid rgba(v.$accent-color, 0.3);
  border-radius: 15px;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    margin: 0;
    color: v.$primary-color;
  }

  .close-btn {
    background: none;
    border: none;
    color: v.$text-color;
    font-size: 2rem;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      color: v.$accent-color;
    }
  }
}

.modal-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.info-section {
  margin-bottom: 20px;

  .form-group {
    margin-bottom: 15px;

    label {
      display: block;
      margin-bottom: 5px;
      color: v.$text-color;
      font-weight: bold;
    }

    input[type="text"] {
      width: 100%;
      padding: 8px;
      border-radius: v.$border-radius;
      background-color: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: v.$text-color;
      font-size: 1rem;
    }

    &.checkbox-group {
      label {
        display: flex;
        align-items: center;
        cursor: pointer;

        input[type="checkbox"] {
          margin-right: 10px;
        }

        span {
          font-weight: normal;
        }
      }
    }
  }
}

.layout-builder {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.builder-section, .preview-section {
  h3 {
    color: v.$primary-color;
    margin-bottom: 15px;
  }
}

.row-builder {
  background-color: rgba(255, 255, 255, 0.03);
  border-radius: v.$border-radius;
  padding: 15px;
  margin-bottom: 15px;

  .row-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    h4 {
      margin: 0;
      color: v.$accent-color;
    }
  }

  .keys-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 10px;
  }

  .key-item {
    display: grid;
    grid-template-columns: auto 1fr auto 1fr auto;
    gap: 10px;
    align-items: center;
    padding: 8px;
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 5px;

    label {
      color: v.$text-color;
      font-size: 0.9rem;
    }

    select, input {
      padding: 5px;
      border-radius: 5px;
      background-color: v.$background-dark;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: v.$text-color;
    }
  }

  .row-spacing {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-top: 10px;

    label {
      color: v.$text-color;
      font-size: 0.9rem;
    }

    input {
      padding: 5px;
      border-radius: 5px;
      background-color: v.$background-dark;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: v.$text-color;
      width: 100px;
    }
  }
}

.preview-container {
  background-color: rgba(255, 255, 255, 0.03);
  border-radius: v.$border-radius;
  padding: 20px;
  min-height: 200px;
}

.preview-row {
  display: contents;
}

.preview-key {
  background-color: #444;
  border-radius: 5px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn, .btn-sm {
  padding: 8px 16px;
  border-radius: v.$border-radius;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;

  &.btn-primary {
    background-color: v.$accent-color;
    color: v.$background-dark;

    &:hover {
      background-color: color.adjust(v.$accent-color, $lightness: 10%);
    }
  }

  &.btn-secondary {
    background-color: rgba(255, 255, 255, 0.1);
    color: v.$text-color;

    &:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
  }

  &.btn-danger {
    background-color: #d32f2f;
    color: white;

    &:hover {
      background-color: #b71c1c;
    }
  }
}

.btn-sm {
  padding: 4px 8px;
  font-size: 0.85rem;
}
</style>
