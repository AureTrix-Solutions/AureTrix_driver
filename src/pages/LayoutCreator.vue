<template>
  <div class="layout-creator-page">
    <h2 class="title">Create Custom Layout</h2>
    <div v-if="notification" class="notification" :class="{ error: notification.isError }">
      {{ notification.message }}
      <button @click="notification = null" class="dismiss-btn">&times;</button>
    </div>

    <div class="layout-creator-container">
      <div v-if="virtualKeyboard.length" class="key-grid" :style="gridStyle">
        <div v-for="(row, rIdx) in virtualKeyboard" :key="`vrow-${rIdx}`" class="key-row">
          <div
            v-for="(key, kIdx) in row"
            :key="`vkey-${rIdx}-${kIdx}`"
            class="key-btn"
            :class="{ 'creator-key-selected': selectedKey?.row === rIdx && selectedKey?.col === kIdx }"
            :style="getKeyStyle(rIdx, kIdx)"
            @click="selectKey(rIdx, kIdx)"
          >
            <div class="key-label">{{ key.size }}u</div>
          </div>
        </div>
      </div>
      <div v-else class="no-layout">
        <p>Enter row counts below to generate virtual keyboard</p>
      </div>
      <div class="bottom-section">
        <div class="parent">
          <div class="settings-panel">
            <div class="settings-section">
              <div class="header-row">
                <h3>Layout Configuration</h3>
              </div>

              <!-- Product Name -->
              <div class="input-row">
                <div class="input-group">
                  <div class="label">Product Name</div>
                  <input v-model="productName" type="text" placeholder="Enter keyboard name" class="text-input" />
                </div>
              </div>

              <!-- Row Counts and Gaps - Horizontal Layout -->
              <div class="row-gap-section">
                <!-- Row Counts Row -->
                <div class="row-inputs-row">
                  <div v-for="i in 6" :key="`row-${i}`" class="input-group">
                    <div class="label">Row{{ i - 1 }}</div>
                    <input 
                      v-model.number="rowCounts[i - 1]" 
                      type="number" 
                      min="0" 
                      placeholder="0"
                      @input="generateVirtualKeyboard"
                      class="number-input"
                    />
                  </div>
                </div>
                <!-- Gap Inputs Row -->
                <div class="gap-inputs-row">
                  <div v-for="i in 6" :key="`gap-${i}`" class="input-group">
                    <div class="label">Gap{{ i - 1 }} (mm)</div>
                    <input 
                      v-model.number="rowGaps[i - 1]" 
                      type="number" 
                      min="0"
                      step="0.5"
                      placeholder="0"
                      class="number-input"
                    />
                  </div>
                </div>
              </div>

              <!-- Key Editor -->
              <div v-if="selectedKey" class="key-editor-section">
                <h4>Edit Key (Row {{ selectedKey.row + 1 }}, Key {{ selectedKey.col + 1 }})</h4>
                <div class="key-editor-controls">
                  <div class="input-group">
                    <div class="label">Size</div>
                    <select v-model.number="selectedKeyData.size" @change="updateSelectedKey" class="select-input">
                      <option v-for="keySize in KEY_SIZES" :key="keySize.units" :value="keySize.units">
                        {{ keySize.label }}
                      </option>
                    </select>
                  </div>
                  <div class="input-group">
                    <div class="label">Gap After (mm)</div>
                    <input v-model.number="selectedKeyData.gap" type="number" min="0" step="0.5" @input="updateSelectedKey" class="number-input" />
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="action-buttons">
                <button @click="saveLayout" class="action-btn">Save Layout</button>
                <button @click="exportLayout" class="action-btn">Export JSON</button>
                <button @click="exportCompactCode" class="action-btn">Export Compact Code</button>
                <button @click="goBack" class="action-btn cancel">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useConnectionStore } from '@/store/connection';
import LayoutStorageService from '@/services/LayoutStorageService';
import KeyboardService from '@/services/KeyboardService';
import { uToMm, KEY_SIZES } from '@/utils/keyUnits';

interface VirtualKey {
  size: number;
  gap: number;
}

export default defineComponent({
  name: 'LayoutCreator',
  setup() {
    const router = useRouter();
    const connectionStore = useConnectionStore();
    
    const productName = ref('');
    const hasAxisList = ref(false);
    const rowCounts = ref<(number | undefined)[]>([undefined, undefined, undefined, undefined, undefined, undefined]);
    const rowGaps = ref<(number | undefined)[]>([undefined, undefined, undefined, undefined, undefined, undefined]);
    const virtualKeyboard = ref<VirtualKey[][]>([]);
    
    const selectedKey = ref<{ row: number; col: number } | null>(null);
    const selectedKeyData = ref<VirtualKey>({ size: 1, gap: 0 });
    const notification = ref<{ message: string; isError: boolean } | null>(null);

    const mmToPx = (mm: number) => mm * 4;

    onMounted(async () => {
      productName.value = connectionStore.deviceInfo?.productName || 'Custom Keyboard';
      
      try {
        const axisResult = await KeyboardService.getAxisList();
        if (!(axisResult instanceof Error)) {
          hasAxisList.value = axisResult.hasAxisSetting;
        }
      } catch (error) {
        console.warn('Could not fetch axis list:', error);
      }
    });

    const generateVirtualKeyboard = () => {
      const keyboard: VirtualKey[][] = [];
      
      for (let i = 0; i < rowCounts.value.length; i++) {
        const count = rowCounts.value[i];
        if (count && count > 0) {
          const row: VirtualKey[] = [];
          for (let j = 0; j < count; j++) {
            row.push({ size: 1, gap: 0 });
          }
          keyboard.push(row);
        }
      }
      
      virtualKeyboard.value = keyboard;
      selectedKey.value = null;
    };

    const getActualRowIndex = (virtualRowIdx: number): number => {
      let count = 0;
      for (let i = 0; i < rowCounts.value.length; i++) {
        if (rowCounts.value[i] && rowCounts.value[i]! > 0) {
          if (count === virtualRowIdx) {
            return i;
          }
          count++;
        }
      }
      return 0;
    };

    const getKeyStyle = (rowIdx: number, colIdx: number) => {
      let top = 0;
      let left = 0;

      // Calculate top position
      for (let i = 0; i < rowIdx; i++) {
        top += mmToPx(uToMm(1));
        const actualGapIdx = getActualRowIndex(i);
        const gap = rowGaps.value[actualGapIdx];
        if (gap && gap > 0) {
          top += mmToPx(gap);
        } else {
          top += mmToPx(1);
        }
      }

      // Calculate left position
      const currentRow = virtualKeyboard.value[rowIdx];
      for (let i = 0; i < colIdx; i++) {
        const key = currentRow[i];
        left += mmToPx(uToMm(key.size));
        if (key.gap > 0) {
          left += mmToPx(key.gap);
        }
        left += mmToPx(1);
      }

      const key = currentRow[colIdx];
      const width = mmToPx(uToMm(key.size));
      const height = mmToPx(17);

      return {
        position: 'absolute' as const,
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        height: `${height}px`
      };
    };

    const gridStyle = computed(() => {
      if (!virtualKeyboard.value.length) {
        return { height: '300px', width: '600px' };
      }

      let totalHeight = 0;
      for (let i = 0; i < virtualKeyboard.value.length; i++) {
        totalHeight += mmToPx(uToMm(1));
        const actualGapIdx = getActualRowIndex(i);
        const gap = rowGaps.value[actualGapIdx];
        if (gap && gap > 0) {
          totalHeight += mmToPx(gap);
        } else {
          totalHeight += mmToPx(1);
        }
      }

      let maxWidth = 0;
      virtualKeyboard.value.forEach(row => {
        let rowWidth = 0;
        row.forEach(key => {
          rowWidth += mmToPx(uToMm(key.size));
          if (key.gap > 0) {
            rowWidth += mmToPx(key.gap);
          }
          rowWidth += mmToPx(1);
        });
        if (rowWidth > maxWidth) {
          maxWidth = rowWidth;
        }
      });

      return {
        position: 'relative' as const,
        height: `${totalHeight}px`,
        width: `${maxWidth}px`,
        minHeight: '300px',
        maxHeight: '500px'
      };
    });

    const selectKey = (row: number, col: number) => {
      selectedKey.value = { row, col };
      selectedKeyData.value = { ...virtualKeyboard.value[row][col] };
    };

    const updateSelectedKey = () => {
      if (selectedKey.value) {
        virtualKeyboard.value[selectedKey.value.row][selectedKey.value.col] = { ...selectedKeyData.value };
      }
    };

    // Helper function to convert array to compact syntax
    const arrayToCompactSyntax = (arr: number[]): string => {
      const segments: string[] = [];
      let i = 0;

      while (i < arr.length) {
        const current = arr[i];
        let count = 1;

        // Count consecutive identical values
        while (i + count < arr.length && arr[i + count] === current) {
          count++;
        }

        if (count >= 3) {
          // Use Array.fill() for 3 or more consecutive values
          segments.push(`Array(${count}).fill(${current})`);
          i += count;
        } else {
          // Add individual values
          for (let j = 0; j < count; j++) {
            segments.push(String(current));
          }
          i += count;
        }
      }

      // Format output
      if (segments.length === 1 && segments[0].startsWith('Array(')) {
        return segments[0];
      } else if (segments.every(s => !s.startsWith('Array('))) {
        return `[${segments.join(', ')}]`;
      } else {
        // Mixed format - use concat
        const first = segments[0].startsWith('Array(') ? segments[0] : `[${segments[0]}]`;
        if (segments.length === 1) return first;
        
        const rest = segments.slice(1).map(s => 
          s.startsWith('Array(') ? s : s
        );
        return `${first}.concat(${rest.join(', ')})`;
      }
    };

    const saveLayout = async () => {
      if (!productName.value.trim()) {
        notification.value = { message: 'Please enter a product name', isError: true };
        return;
      }

      if (!virtualKeyboard.value.length) {
        notification.value = { message: 'Please add rows to create a layout', isError: true };
        return;
      }

      const keySizes: number[][] = virtualKeyboard.value.map(row => 
        row.map(key => uToMm(key.size))
      );

      const gapsAfterCol = virtualKeyboard.value.map(row => {
        const gaps: Record<number, number> = {};
        row.forEach((key, idx) => {
          if (key.gap > 0) {
            gaps[idx] = key.gap;
          }
        });
        return gaps;
      });

      const rowSpacing: number[] = [];
      for (let i = 0; i < virtualKeyboard.value.length; i++) {
        const actualGapIdx = getActualRowIndex(i);
        const gap = rowGaps.value[actualGapIdx];
        rowSpacing.push(gap && gap > 0 ? gap : 1);
      }

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
        notification.value = { message: 'Layout saved successfully!', isError: false };
        setTimeout(() => {
          router.push('/layout-preview');
        }, 1500);
      } catch (error) {
        console.error('Failed to save layout:', error);
        notification.value = { message: 'Failed to save layout. Please try again.', isError: true };
      }
    };

    const exportLayout = () => {
      if (!productName.value.trim()) {
        notification.value = { message: 'Please enter a product name', isError: true };
        return;
      }

      if (!virtualKeyboard.value.length) {
        notification.value = { message: 'Please add rows to create a layout', isError: true };
        return;
      }

      const keySizes: number[][] = virtualKeyboard.value.map(row => 
        row.map(key => uToMm(key.size))
      );

      const gapsAfterCol = virtualKeyboard.value.map(row => {
        const gaps: Record<number, number> = {};
        row.forEach((key, idx) => {
          if (key.gap > 0) {
            gaps[idx] = key.gap;
          }
        });
        return gaps;
      });

      const rowSpacing: number[] = [];
      for (let i = 0; i < virtualKeyboard.value.length; i++) {
        const actualGapIdx = getActualRowIndex(i);
        const gap = rowGaps.value[actualGapIdx];
        rowSpacing.push(gap && gap > 0 ? gap : 1);
      }

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
      notification.value = { message: 'Layout exported successfully!', isError: false };
    };

    const exportCompactCode = () => {
      if (!productName.value.trim()) {
        notification.value = { message: 'Please enter a product name', isError: true };
        return;
      }

      if (!virtualKeyboard.value.length) {
        notification.value = { message: 'Please add rows to create a layout', isError: true };
        return;
      }

      // Generate compact keySizes
      const keySizesCompact: string[] = virtualKeyboard.value.map(row => {
        const sizes = row.map(key => uToMm(key.size));
        return arrayToCompactSyntax(sizes);
      });

      // Generate gapsAfterCol
      const gapsAfterColData = virtualKeyboard.value.map(row => {
        const gaps: Record<number, number> = {};
        row.forEach((key, idx) => {
          if (key.gap > 0) {
            gaps[idx] = key.gap;
          }
        });
        return gaps;
      });

      // Check if all gapsAfterCol are empty
      const allEmpty = gapsAfterColData.every(g => Object.keys(g).length === 0);
      let gapsAfterColCompact: string;
      
      if (allEmpty) {
        // All empty - use Array.fill({})
        gapsAfterColCompact = `Array(${gapsAfterColData.length}).fill({})`;
      } else {
        // Mixed - stringify each entry
        const gapsStrings = gapsAfterColData.map(g => 
          Object.keys(g).length > 0 ? JSON.stringify(g) : '{}'
        );
        gapsAfterColCompact = `[${gapsStrings.join(', ')}]`;
      }

      // Generate rowSpacing
      const rowSpacingArr: number[] = [];
      for (let i = 0; i < virtualKeyboard.value.length; i++) {
        const actualGapIdx = getActualRowIndex(i);
        const gap = rowGaps.value[actualGapIdx];
        rowSpacingArr.push(gap && gap > 0 ? gap : 1);
      }
      const rowSpacingCompact = arrayToCompactSyntax(rowSpacingArr);

      // Build compact code
      const compactCode = `{
  keySizes: [
${keySizesCompact.map(row => `    ${row},`).join('\n')}
  ],
  gapsAfterCol: ${gapsAfterColCompact},
  rowSpacing: ${rowSpacingCompact},
  hasAxisList: ${hasAxisList.value}
}`;

      // Copy to clipboard
      navigator.clipboard.writeText(compactCode).then(() => {
        notification.value = { message: 'Compact code copied to clipboard!', isError: false };
      }).catch(() => {
        // Fallback: show in console
        console.log('Compact Layout Code:\n', compactCode);
        notification.value = { message: 'Compact code logged to console!', isError: false };
      });
    };

    const goBack = () => {
      router.push('/layout-preview');
    };

    return {
      productName,
      rowCounts,
      rowGaps,
      virtualKeyboard,
      selectedKey,
      selectedKeyData,
      notification,
      gridStyle,
      generateVirtualKeyboard,
      getKeyStyle,
      selectKey,
      updateSelectedKey,
      saveLayout,
      exportLayout,
      exportCompactCode,
      goBack,
      KEY_SIZES
    };
  }
});
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@styles/variables' as v;

.layout-creator-page {
  padding: 20px;
  color: v.$text-color;

  .title {
    width: 500px;
    color: v.$primary-color;
    margin-bottom: 10px;
    margin-top: 0px;
    font-size: 1.5rem;
    font-weight: 600;
    font-family: v.$font-style;
  }

  .notification {
    padding: 10px;
    margin-bottom: 0px;
    border-radius: v.$border-radius;
    background-color: rgba(v.$background-dark, 1.1);
    color: v.$text-color;
    display: flex;
    align-items: center;

    &.error {
      background-color: color.mix(#ef4444, v.$background-dark, 50%);
    }

    .dismiss-btn {
      margin-left: auto;
      padding: 0 6px;
      background: none;
      border: none;
      color: v.$text-color;
      cursor: pointer;
      font-size: 1rem;
      font-family: v.$font-style;

      &:hover {
        color: rgba(v.$text-color, 0.6);
      }
    }
  }

  .layout-creator-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .no-layout {
    text-align: center;
    color: v.$text-color;
    font-size: 1rem;
    font-family: v.$font-style;
    padding: 60px 20px;
    border: v.$border-style;
    border-radius: v.$border-radius;
    background-color: color.adjust(v.$background-dark, $lightness: -3%);
  }

  .key-grid {
    display: block !important;
    position: relative;
    width: fit-content;
    margin: 0 auto;
    flex-shrink: 0;
    visibility: visible !important;
    z-index: 1;
  }

  .key-row {
    display: contents;
  }

  .key-btn {
    position: absolute;
    padding: 4px;
    border: v.$border-style;
    border-radius: v.$border-radius;
    background: linear-gradient(to bottom, v.$background-dark 70%, color.adjust(v.$background-dark, $lightness: 10%) 100%);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 -2px 4px rgba(255, 255, 255, 0.2);
    color: v.$text-color;
    cursor: pointer;
    transition: all 0.2s ease;
    box-sizing: border-box;
    user-select: none;
    text-align: center;
    font-family: v.$font-style;
    visibility: visible !important;
    z-index: 2;

    &:hover {
      background: linear-gradient(to bottom, color.adjust(v.$background-dark, $lightness: 5%) 70%, color.adjust(v.$background-dark, $lightness: 15%) 100%);
    }

    &.creator-key-selected {
      border-color: v.$accent-color;
      box-shadow: 0 0 8px rgba(v.$accent-color, 0.5);
    }

    .key-label {
      font-size: 0.85rem;
      font-weight: 300;
    }
  }

  .bottom-section {
    display: flex;
    flex: 1;
    flex-shrink: 0;
    gap: 10px;
    position: relative;
    margin-right: auto;
    margin-left: auto;
    margin-top: 20px;
    justify-content: center;
  }

  .parent {
    display: flex;
    gap: 10px;
  }

  .settings-panel {
    width: 1425px;
    padding: 20px;
    border: 1px solid rgba(v.$text-color, 0.2);
    border-radius: v.$border-radius;
    background-color: color.adjust(v.$background-dark, $lightness: -100%);
  }

  .settings-section {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .header-row {
      h3 {
        margin: 0;
        color: v.$primary-color;
        font-size: 1.2rem;
        font-weight: 400;
        font-family: v.$font-style;
      }
    }

    .input-row {
      display: flex;
      gap: 16px;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .label {
        color: v.$text-color;
        font-size: 0.9rem;
        font-weight: 300;
        font-family: v.$font-style;
      }

      .text-input, .number-input, .select-input {
        padding: 6px 8px;
        background-color: color.adjust(v.$background-dark, $lightness: -5%);
        border: v.$border-style;
        border-radius: v.$border-radius;
        color: v.$text-color;
        font-family: v.$font-style;
        font-size: 0.9rem;

        &:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(v.$accent-color, 0.3);
        }
      }

      .number-input {
        text-align: center;
        width: 80px;
      }
    }

    .row-gap-section {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .row-inputs-row, .gap-inputs-row {
        display: flex;
        gap: 12px;
        justify-content: flex-start;
      }
    }

    .key-editor-section {
      border-top: v.$border-style;
      padding-top: 16px;

      h4 {
        margin: 0 0 12px 0;
        color: v.$primary-color;
        font-size: 1rem;
        font-weight: 400;
        font-family: v.$font-style;
      }

      .key-editor-controls {
        display: flex;
        gap: 16px;
      }
    }

    .action-buttons {
      display: flex;
      gap: 10px;
      padding-top: 16px;
      border-top: v.$border-style;

      .action-btn {
        padding: 8px 16px;
        background-color: color.adjust(v.$background-dark, $lightness: -100%);
        color: v.$primary-color;
        border: v.$border-style;
        border-radius: v.$border-radius;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 400;
        font-family: v.$font-style;
        transition: background-color 0.2s ease;

        &:hover {
          background-color: color.adjust(v.$background-dark, $lightness: 10%);
        }

        &.cancel {
          color: v.$text-color;
        }
      }
    }
  }
}
</style>
