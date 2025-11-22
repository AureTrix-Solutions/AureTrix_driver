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
              <input v-model="hasAxisList" type="checkbox" disabled />
              <span>Supports Axis List (Controller Emulation) - Auto-detected</span>
            </label>
          </div>
        </div>

        <div class="layout-builder">
          <div class="builder-section">
            <h3>Layout Builder</h3>
            
            <!-- Bulk Row Creation -->
            <div class="bulk-controls">
              <div class="bulk-row-creation">
                <label>Number of Rows</label>
                <input v-model.number="bulkRowCount" type="number" min="1" max="20" />
                <button @click="addBulkRows" class="btn-sm">Create Rows</button>
              </div>
            </div>

            <!-- Global Column Gaps -->
            <div class="column-gaps-section">
              <h4>Global Column Gaps</h4>
              <div class="gap-controls">
                <div v-for="(gap, colIdx) in columnGaps" :key="`col-gap-${colIdx}`" class="gap-item">
                  <label>After Column {{ colIdx + 1 }}</label>
                  <input v-model.number="columnGaps[colIdx]" type="number" min="0" step="0.5" @input="updatePreview" />
                  <button @click="removeColumnGap(colIdx)" class="btn-sm btn-danger">×</button>
                </div>
                <button @click="addColumnGap" class="btn-sm">+ Add Column Gap</button>
              </div>
            </div>
            
            <!-- Rows -->
            <div v-for="(row, rIdx) in rows" :key="`row-${rIdx}`" class="row-builder">
              <div class="row-header">
                <h4>Row {{ rIdx + 1 }}</h4>
                <div class="row-bulk-controls">
                  <input v-model.number="row.bulkKeyCount" type="number" min="1" placeholder="Key count" style="width: 80px;" />
                  <button @click="populateRowKeys(rIdx)" class="btn-sm">Populate</button>
                  <button @click="removeRow(rIdx)" class="btn-sm btn-danger">Remove Row</button>
                </div>
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
  bulkKeyCount?: number;
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
    const bulkRowCount = ref(6);
    const columnGaps = ref<number[]>([]);

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
        spacingBelow: 18,
        bulkKeyCount: 16
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

    const addBulkRows = () => {
      const count = bulkRowCount.value || 1;
      for (let i = 0; i < count; i++) {
        rows.value.push({
          keys: [{ size: 18, gapAfter: 0 }],
          spacingBelow: 18,
          bulkKeyCount: 16
        });
      }
      updatePreview();
    };

    const populateRowKeys = (rowIdx: number) => {
      const row = rows.value[rowIdx];
      const count = row.bulkKeyCount || 1;
      row.keys = [];
      for (let i = 0; i < count; i++) {
        row.keys.push({ size: 18, gapAfter: 0 });
      }
      updatePreview();
    };

    const addColumnGap = () => {
      columnGaps.value.push(0);
    };

    const removeColumnGap = (colIdx: number) => {
      columnGaps.value.splice(colIdx, 1);
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
          
          // Apply per-key gap
          if (key.gapAfter > 0) {
            left += mmToPx(key.gapAfter);
          }
          
          // Apply global column gap
          if (columnGaps.value[kIdx] && columnGaps.value[kIdx] > 0) {
            left += mmToPx(columnGaps.value[kIdx]);
          }
        }

        generatedRows.push(generatedKeys);
        cumulativeTop += mmToPx(18 + (row.spacingBelow || 0));
      }

      previewKeys.value = generatedRows;
      
      const maxWidth = Math.max(...rows.value.map(row => {
        let totalWidth = 0;
        row.keys.forEach((key, kIdx) => {
          totalWidth += mmToPx(key.size) + mmToPx(1) + mmToPx(key.gapAfter);
          if (columnGaps.value[kIdx] && columnGaps.value[kIdx] > 0) {
            totalWidth += mmToPx(columnGaps.value[kIdx]);
          }
        });
        return totalWidth;
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
          // Merge per-key gaps with global column gaps
          const perKeyGap = key.gapAfter || 0;
          const columnGap = columnGaps.value[idx] || 0;
          const totalGap = perKeyGap + columnGap;
          if (totalGap > 0) {
            gaps[idx] = totalGap;
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
          // Merge per-key gaps with global column gaps
          const perKeyGap = key.gapAfter || 0;
          const columnGap = columnGaps.value[idx] || 0;
          const totalGap = perKeyGap + columnGap;
          if (totalGap > 0) {
            gaps[idx] = totalGap;
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
          // Merge per-key gaps with global column gaps
          const perKeyGap = key.gapAfter || 0;
          const columnGap = columnGaps.value[idx] || 0;
          const totalGap = perKeyGap + columnGap;
          if (totalGap > 0) {
            gaps[idx] = totalGap;
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
      bulkRowCount,
      columnGaps,
      addRow,
      removeRow,
      addKey,
      removeKey,
      addBulkRows,
      populateRowKeys,
      addColumnGap,
      removeColumnGap,
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
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  font-family: v.$font-style;
}

.modal-content {
  background-color: v.$background-dark;
  border: v.$border-style;
  border-radius: v.$border-radius;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  font-family: v.$font-style;
}

.modal-header {
  padding: 20px;
  border-bottom: v.$border-style;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    margin: 0;
    color: v.$primary-color;
    font-size: 1.5rem;
    font-weight: 400;
    font-family: v.$font-style;
  }

  .close-btn {
    background: none;
    border: none;
    color: v.$text-color;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: v.$font-style;
    transition: color 0.2s ease;

    &:hover {
      color: v.$accent-color;
    }
  }
}

.modal-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
  font-family: v.$font-style;
}

.info-section {
  margin-bottom: 24px;
  border-bottom: v.$border-style;
  padding-bottom: 20px;

  .form-group {
    margin-bottom: 12px;

    label {
      display: block;
      margin-bottom: 6px;
      color: v.$text-color;
      font-weight: 300;
      font-size: 0.9rem;
      font-family: v.$font-style;
    }

    input[type="text"] {
      width: 100%;
      padding: 8px;
      border-radius: v.$border-radius;
      background-color: color.adjust(v.$background-dark, $lightness: -5%);
      border: v.$border-style;
      color: v.$text-color;
      font-size: 1rem;
      font-family: v.$font-style;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    &.checkbox-group {
      label {
        display: flex;
        align-items: center;
        cursor: default;

        input[type="checkbox"] {
          margin-right: 10px;
          cursor: not-allowed;
        }

        span {
          font-weight: 300;
          font-size: 0.9rem;
        }
      }
    }
  }
}

.layout-builder {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.builder-section, .preview-section {
  h3 {
    color: v.$primary-color;
    margin-bottom: 16px;
    margin-top: 0;
    font-size: 1.2rem;
    font-weight: 400;
    font-family: v.$font-style;
  }
}

.bulk-controls {
  border: v.$border-style;
  border-radius: v.$border-radius;
  padding: 12px;
  margin-bottom: 16px;

  .bulk-row-creation {
    display: flex;
    gap: 10px;
    align-items: center;

    label {
      color: v.$text-color;
      font-weight: 300;
      font-size: 0.9rem;
      font-family: v.$font-style;
    }

    input {
      width: 80px;
      padding: 6px;
      border-radius: v.$border-radius;
      background-color: v.$background-dark;
      border: v.$border-style;
      color: v.$text-color;
      font-family: v.$font-style;
      text-align: center;

      &:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(v.$accent-color, 0.3);
      }
    }
  }
}

.column-gaps-section {
  border: v.$border-style;
  border-radius: v.$border-radius;
  padding: 12px;
  margin-bottom: 16px;

  h4 {
    color: v.$primary-color;
    margin: 0 0 12px 0;
    font-size: 1rem;
    font-weight: 400;
    font-family: v.$font-style;
  }

  .gap-controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .gap-item {
    display: flex;
    gap: 10px;
    align-items: center;

    label {
      color: v.$text-color;
      min-width: 120px;
      font-weight: 300;
      font-size: 0.9rem;
      font-family: v.$font-style;
    }

    input {
      width: 100px;
      padding: 6px;
      border-radius: v.$border-radius;
      background-color: v.$background-dark;
      border: v.$border-style;
      color: v.$text-color;
      font-family: v.$font-style;
      text-align: center;

      &:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(v.$accent-color, 0.3);
      }
    }
  }
}

.row-builder {
  border: v.$border-style;
  border-radius: v.$border-radius;
  padding: 12px;
  margin-bottom: 12px;

  .row-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: v.$border-style;

    h4 {
      margin: 0;
      color: v.$primary-color;
      font-size: 1rem;
      font-weight: 400;
      font-family: v.$font-style;
    }

    .row-bulk-controls {
      display: flex;
      gap: 6px;
      align-items: center;

      input {
        padding: 4px 6px;
        border-radius: v.$border-radius;
        background-color: v.$background-dark;
        border: v.$border-style;
        color: v.$text-color;
        font-family: v.$font-style;
        text-align: center;

        &:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(v.$accent-color, 0.3);
        }
      }
    }
  }

  .keys-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }

  .key-item {
    display: grid;
    grid-template-columns: auto 1fr auto 1fr auto;
    gap: 8px;
    align-items: center;
    padding: 6px 8px;
    border-radius: v.$border-radius;

    label {
      color: v.$text-color;
      font-size: 0.85rem;
      font-weight: 300;
      font-family: v.$font-style;
    }

    select, input {
      padding: 4px 6px;
      border-radius: v.$border-radius;
      background-color: v.$background-dark;
      border: v.$border-style;
      color: v.$text-color;
      font-family: v.$font-style;

      &:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(v.$accent-color, 0.3);
      }
    }
  }

  .row-spacing {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-top: 8px;
    padding-top: 8px;
    border-top: v.$border-style;

    label {
      color: v.$text-color;
      font-size: 0.85rem;
      font-weight: 300;
      font-family: v.$font-style;
    }

    input {
      padding: 4px 6px;
      border-radius: v.$border-radius;
      background-color: v.$background-dark;
      border: v.$border-style;
      color: v.$text-color;
      width: 100px;
      font-family: v.$font-style;
      text-align: center;

      &:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(v.$accent-color, 0.3);
      }
    }
  }
}

.preview-container {
  border: v.$border-style;
  border-radius: v.$border-radius;
  padding: 20px;
  min-height: 200px;
  background-color: color.adjust(v.$background-dark, $lightness: -3%);
}

.preview-row {
  display: contents;
}

.preview-key {
  border: v.$border-style;
  border-radius: v.$border-radius;
  background: linear-gradient(to bottom, v.$background-dark 70%, color.adjust(v.$background-dark, $lightness: 10%) 100%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 -2px 4px rgba(255, 255, 255, 0.1);
}

.modal-footer {
  padding: 20px;
  border-top: v.$border-style;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  font-family: v.$font-style;
}

.btn {
  padding: 8px 16px;
  border-radius: v.$border-radius;
  background-color: color.adjust(v.$background-dark, $lightness: -100%);
  color: v.$primary-color;
  border: v.$border-style;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 400;
  transition: background-color 0.2s ease;
  font-family: v.$font-style;

  &:hover:not(:disabled) {
    background-color: color.adjust(v.$background-dark, $lightness: 10%);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.btn-primary {
    background-color: v.$accent-color;
    color: v.$background-dark;

    &:hover:not(:disabled) {
      background-color: color.adjust(v.$accent-color, $lightness: 10%);
    }
  }

  &.btn-secondary {
    color: v.$accent-color;
  }

  &.btn-danger {
    color: rgba(#ff4444, 0.8);
  }
}

.btn-sm {
  padding: 4px 8px;
  border-radius: v.$border-radius;
  background-color: color.adjust(v.$background-dark, $lightness: -100%);
  color: v.$primary-color;
  border: v.$border-style;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 400;
  transition: background-color 0.2s ease;
  font-family: v.$font-style;

  &:hover:not(:disabled) {
    background-color: color.adjust(v.$background-dark, $lightness: 10%);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &.btn-danger {
    color: rgba(#ff4444, 0.8);
  }
}
</style>
