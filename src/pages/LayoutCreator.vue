<template>
  <div class="layout-creator">
    <div class="header">
      <h1>Create Custom Layout</h1>
      <div class="actions">
        <button @click="saveLayout" class="action-btn">Save Layout</button>
        <button @click="exportLayout" class="action-btn">Export JSON</button>
        <button @click="goBack" class="action-btn">Cancel</button>
      </div>
    </div>

    <div class="creator-content">
      <!-- Setup Section -->
      <div class="setup-section">
        <div class="form-row">
          <label>Product Name</label>
          <input v-model="productName" type="text" placeholder="Keyboard name" class="compact-input" />
        </div>

        <div class="form-row">
          <label>Row Counts</label>
          <div class="row-inputs">
            <div v-for="i in 6" :key="`row-${i}`" class="row-input-item">
              <span>Row{{ i }}</span>
              <input 
                v-model.number="rowCounts[i - 1]" 
                type="number" 
                min="0" 
                :placeholder="`0`"
                @input="generateVirtualKeyboard"
                class="compact-input"
              />
            </div>
          </div>
        </div>

        <div class="form-row">
          <label>Row Gaps (mm)</label>
          <div class="gap-inputs">
            <div v-for="i in 6" :key="`gap-${i}`" class="gap-input-item">
              <span>gap{{ i - 1 }}</span>
              <input 
                v-model.number="rowGaps[i - 1]" 
                type="number" 
                min="0"
                step="0.5"
                :placeholder="`0`"
                class="compact-input"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Virtual Keyboard -->
      <div class="keyboard-section">
        <h3>Virtual Keyboard</h3>
        <div class="virtual-keyboard" :style="keyboardContainerStyle">
          <div 
            v-for="(row, rIdx) in virtualKeyboard" 
            :key="`vrow-${rIdx}`" 
            class="virtual-row"
            :style="getRowStyle(rIdx)"
          >
            <div
              v-for="(key, kIdx) in row"
              :key="`vkey-${rIdx}-${kIdx}`"
              class="virtual-key"
              :class="{ selected: selectedKey?.row === rIdx && selectedKey?.col === kIdx }"
              :style="getKeyStyle(key)"
              @click="selectKey(rIdx, kIdx)"
            >
              <div class="key-label">{{ key.size }}u</div>
            </div>
          </div>
        </div>

        <!-- Key Editor -->
        <div v-if="selectedKey" class="key-editor">
          <h4>Edit Key (Row {{ selectedKey.row + 1 }}, Key {{ selectedKey.col + 1 }})</h4>
          <div class="editor-controls">
            <div class="editor-item">
              <label>Size</label>
              <select v-model.number="selectedKeyData.size" @change="updateSelectedKey">
                <option :value="1">1u</option>
                <option :value="1.25">1.25u</option>
                <option :value="1.5">1.5u</option>
                <option :value="1.75">1.75u</option>
                <option :value="2">2u</option>
                <option :value="2.25">2.25u</option>
                <option :value="2.75">2.75u</option>
                <option :value="6.25">6.25u</option>
                <option :value="6.5">6.5u</option>
              </select>
            </div>
            <div class="editor-item">
              <label>Gap After (mm)</label>
              <input v-model.number="selectedKeyData.gap" type="number" min="0" step="0.5" @input="updateSelectedKey" />
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

interface VirtualKey {
  size: number; // in keyboard units (1u, 1.25u, etc.)
  gap: number; // gap after this key in mm
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

    const mmToPx = (mm: number) => mm * 4;
    const uToMm = (u: number) => u * 18;

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

    const getRowStyle = (rowIdx: number) => {
      let topOffset = 0;
      
      // Calculate cumulative top offset based on previous rows and gaps
      for (let i = 0; i < rowIdx; i++) {
        topOffset += mmToPx(18); // Key height
        
        // Find the actual gap index (accounting for skipped rows)
        const actualGapIdx = getActualRowIndex(i);
        const gap = rowGaps.value[actualGapIdx];
        if (gap && gap > 0) {
          topOffset += mmToPx(gap);
        } else {
          topOffset += mmToPx(1); // Default 1mm gap
        }
      }
      
      return {
        top: `${topOffset}px`
      };
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

    const getKeyStyle = (key: VirtualKey) => {
      return {
        width: `${mmToPx(uToMm(key.size))}px`,
        height: `${mmToPx(17)}px`,
        marginRight: key.gap > 0 ? `${mmToPx(key.gap)}px` : `${mmToPx(1)}px`
      };
    };

    const keyboardContainerStyle = computed(() => {
      let totalHeight = 0;
      
      for (let i = 0; i < virtualKeyboard.value.length; i++) {
        totalHeight += mmToPx(18);
        
        const actualGapIdx = getActualRowIndex(i);
        const gap = rowGaps.value[actualGapIdx];
        if (gap && gap > 0) {
          totalHeight += mmToPx(gap);
        } else {
          totalHeight += mmToPx(1);
        }
      }
      
      return {
        minHeight: `${totalHeight}px`,
        position: 'relative' as const
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

    const saveLayout = async () => {
      if (!productName.value.trim()) {
        alert('Please enter a product name');
        return;
      }

      // Convert virtual keyboard to LayoutConfig format
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
        alert('Layout saved successfully!');
        router.push('/layout-preview');
      } catch (error) {
        console.error('Failed to save layout:', error);
        alert('Failed to save layout. Please try again.');
      }
    };

    const exportLayout = () => {
      if (!productName.value.trim()) {
        alert('Please enter a product name');
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
      keyboardContainerStyle,
      generateVirtualKeyboard,
      getRowStyle,
      getKeyStyle,
      selectKey,
      updateSelectedKey,
      saveLayout,
      exportLayout,
      goBack
    };
  }
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@styles/variables' as v;

.layout-creator {
  padding: 20px;
  font-family: v.$font-style;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: v.$border-style;

  h1 {
    margin: 0;
    color: v.$primary-color;
    font-size: 1.8rem;
    font-weight: 400;
  }

  .actions {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    padding: 6px 12px;
    background-color: color.adjust(v.$background-dark, $lightness: -100%);
    color: v.$primary-color;
    border: v.$border-style;
    border-radius: v.$border-radius;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 400;
    font-family: v.$font-style;
    transition: background-color 0.2s ease;

    &:hover:not(:disabled) {
      background-color: color.adjust(v.$background-dark, $lightness: 10%);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.creator-content {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 24px;
}

.setup-section {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .form-row {
    display: flex;
    flex-direction: column;
    gap: 6px;

    label {
      color: v.$text-color;
      font-size: 0.9rem;
      font-weight: 300;
    }

    .compact-input {
      padding: 4px 8px;
      background-color: color.adjust(v.$background-dark, $lightness: -5%);
      border: v.$border-style;
      border-radius: v.$border-radius;
      color: v.$text-color;
      font-family: v.$font-style;
      font-size: 0.9rem;
      width: 100%;

      &:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(v.$accent-color, 0.3);
      }
    }
  }

  .row-inputs, .gap-inputs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .row-input-item, .gap-input-item {
    display: flex;
    align-items: center;
    gap: 4px;

    span {
      color: v.$text-color;
      font-size: 0.85rem;
      font-weight: 300;
      min-width: 40px;
    }

    input {
      flex: 1;
      padding: 4px 6px;
      background-color: color.adjust(v.$background-dark, $lightness: -5%);
      border: v.$border-style;
      border-radius: v.$border-radius;
      color: v.$text-color;
      font-family: v.$font-style;
      font-size: 0.85rem;
      text-align: center;

      &:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(v.$accent-color, 0.3);
      }
    }
  }
}

.keyboard-section {
  display: flex;
  flex-direction: column;
  gap: 16px;

  h3 {
    margin: 0;
    color: v.$primary-color;
    font-size: 1.2rem;
    font-weight: 400;
  }

  .virtual-keyboard {
    border: v.$border-style;
    border-radius: v.$border-radius;
    padding: 20px;
    background-color: color.adjust(v.$background-dark, $lightness: -3%);
    overflow-x: auto;
  }

  .virtual-row {
    position: absolute;
    left: 20px;
    display: flex;
    gap: 0;
  }

  .virtual-key {
    border: v.$border-style;
    border-radius: v.$border-radius;
    background: linear-gradient(to bottom, v.$background-dark 70%, color.adjust(v.$background-dark, $lightness: 10%) 100%);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 -2px 4px rgba(255, 255, 255, 0.1);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
      background: linear-gradient(to bottom, color.adjust(v.$background-dark, $lightness: 5%) 70%, color.adjust(v.$background-dark, $lightness: 15%) 100%);
    }

    &.selected {
      border-color: v.$accent-color;
      box-shadow: 0 0 0 2px v.$accent-color;
    }

    .key-label {
      color: v.$text-color;
      font-size: 0.75rem;
      font-weight: 300;
    }
  }

  .key-editor {
    border: v.$border-style;
    border-radius: v.$border-radius;
    padding: 16px;
    background-color: color.adjust(v.$background-dark, $lightness: -3%);

    h4 {
      margin: 0 0 12px 0;
      color: v.$primary-color;
      font-size: 1rem;
      font-weight: 400;
    }

    .editor-controls {
      display: flex;
      gap: 16px;
    }

    .editor-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;

      label {
        color: v.$text-color;
        font-size: 0.85rem;
        font-weight: 300;
      }

      select, input {
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
    }
  }
}
</style>
