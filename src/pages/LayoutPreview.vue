<template>
  <div class="layout-preview-page">
    <h2>Layout Preview</h2>
    <div class="controls">
      <label for="layout-select">Select Layout: </label>
      <select v-model="selectedLayout" id="layout-select" @change="updateLayout">
        <option v-for="layout in layouts" :key="layout" :value="layout">{{ `${layout}-key` }}</option>
      </select>
    </div>
    <div v-if="layout.length" class="key-grid" :style="gridStyle">
      <div v-for="(row, rIdx) in layout" :key="`r-${rIdx}`" class="key-row">
        <div
          v-for="(pos, cIdx) in row"
          :key="`k-${rIdx}-${cIdx}`"
          class="key-preview"
          :style="getKeyStyle(rIdx, cIdx)"
        ></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted } from 'vue';
import { getLayoutConfig } from '@utils/layoutConfigs';
import { mmToPx } from '@utils/mmToPx'; // Import mmToPx

export default defineComponent({
  name: 'LayoutPreview',
  setup() {
    const layout = ref<any[][]>([]);
    const selectedLayout = ref(82); // Default to 80-key, overridden by localStorage
    const layouts = [61, 67, 68, 80, 82, 84, 87]; // Supported layouts

    const gridStyle = computed(() => {
      const { keyPositions, gaps } = getLayoutConfig(selectedLayout.value);
      ////console.log('Grid Style keyPositions:', keyPositions);
      if (!keyPositions || keyPositions.length === 0) {
        //console.warn('keyPositions is empty or invalid');
        return { 'height': '0px', 'width': '0px' };
      }
      const containerHeight = keyPositions.reduce((max, row, i) => max + Math.max(...row.map(pos => pos[1] + pos[3])) + (gaps[i] || 0), 0);
      const maxRowWidth = Math.max(...keyPositions.map(row => row.reduce((sum, pos) => sum + pos[2], 0)));
      return {
        'position': 'relative',
        'height': `${containerHeight}px`,
        'width': `${maxRowWidth}px`,
        'margin': '0 auto', // Center the grid
      };
    });

    const getKeyStyle = (rowIdx: number, colIdx: number) => {
      const { keyPositions, gaps } = getLayoutConfig(selectedLayout.value);
      const rowLength = keyPositions[rowIdx]?.length || 0;
      if (!keyPositions || !keyPositions[rowIdx] || !Array.isArray(keyPositions[rowIdx]) || colIdx >= rowLength) {
        //console.warn(`Invalid key position at row ${rowIdx}, col ${colIdx}: rowLength=${rowLength}, keyPositions[rowIdx]=`, keyPositions[rowIdx]);
        return { width: '0px', height: '0px', left: '0px', top: '0px' };
      }
      const [left, top, width, height] = keyPositions[rowIdx][colIdx];
      const topGapPx = gaps[rowIdx] || 0;
      return {
        position: 'absolute',
        left: `${left}px`,
        top: `${top + topGapPx}px`,
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: '#444',
        boxSizing: 'border-box',
      };
    };

    const updateLayout = () => {
      const { keyPositions } = getLayoutConfig(selectedLayout.value);
      layout.value = keyPositions;
      localStorage.setItem('lastSelectedLayout', selectedLayout.value.toString());
    };

    const resetLayout = () => {
      updateLayout();
    };

    // Restore last selected layout from localStorage on mount
    onMounted(() => {
      const savedLayout = localStorage.getItem('lastSelectedLayout');
      if (savedLayout && layouts.includes(parseInt(savedLayout))) {
        selectedLayout.value = parseInt(savedLayout);
      }
      updateLayout();
    });

    // Trigger initial update
    updateLayout();

    return {
      layout,
      selectedLayout,
      layouts,
      gridStyle,
      getKeyStyle,
      updateLayout,
      resetLayout,
    };
  },
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@styles/variables' as v;

.layout-preview-page {
  padding: 20px;
  color: v.$text-color;
  h2 {
    color: v.$primary-color;
    margin-bottom: 10px; // Reduced margin
  }
  .controls {
    margin-bottom: 10px; // Reduced margin
    display: flex;
    gap: 10px;
    align-items: center;
    label {
      margin-right: 5px;
      color: v.$text-color;
    }
    select {
      padding: 8px;
      border-radius: v.$border-radius;
      background-color: v.$background-dark;
      color: v.$text-color;
      border: 1px solid rgba(255, 255, 255, 0.2);
      font-size: 1rem;
    }
  }
  .key-grid {
    display: block;
    position: relative;
    width: fit-content;
    margin: 0 auto; // Center the grid
    min-height: 200px; // Reduced min-height to save space
  }
  .key-row {
    display: contents; // Allow positioning of children
  }
  .key-preview {
    position: absolute;
    background-color: #444; // Simple gray box for preview
    box-sizing: border-box; // Include padding
  }
}
</style>