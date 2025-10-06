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
import { defineComponent, ref, computed, onMounted } from 'vue';
import { getLayoutConfig } from '@utils/layoutConfigs';

export default defineComponent({
  name: 'LayoutPreview',
  setup() {
    const layout = ref<any[][]>([]);
    const selectedLayout = ref<number | null>(null); // Initial null to force load from storage
    const layouts = [61, 67, 68, 80, 82, 84, 87]; // Supported layouts

    // Grid computation
    const gridStyle = computed(() => {
      const { keyPositions, gaps } = getLayoutConfig(selectedLayout.value ?? 82);
      if (!keyPositions || keyPositions.length === 0) {
        return { height: '0px', width: '0px' };
      }
      const containerHeight = keyPositions.reduce((max, row, i) => max + Math.max(...row.map(pos => pos[1] + pos[3])) + (gaps[i] || 0), 0);
      const maxRowWidth = Math.max(...keyPositions.map(row => row.reduce((sum, pos) => sum + pos[2], 0)));
      return {
        position: 'relative',
        height: `${containerHeight}px`,
        width: `${maxRowWidth}px`,
        margin: '0 auto',
      };
    });

    const getKeyStyle = (rowIdx: number, colIdx: number) => {
      const { keyPositions, gaps } = getLayoutConfig(selectedLayout.value ?? 82);
      const rowLength = keyPositions[rowIdx]?.length || 0;
      if (!keyPositions || !keyPositions[rowIdx] || !Array.isArray(keyPositions[rowIdx]) || colIdx >= rowLength) {
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

    // Layout update
    const updateLayout = () => {
      const { keyPositions } = getLayoutConfig(selectedLayout.value ?? 82);
      layout.value = keyPositions;
      localStorage.setItem('lastSelectedLayout', selectedLayout.value?.toString() ?? '82');
    };

    // Restore from localStorage on mount
    onMounted(() => {
      const savedLayout = localStorage.getItem('lastSelectedLayout');
      if (savedLayout && layouts.includes(parseInt(savedLayout))) {
        selectedLayout.value = parseInt(savedLayout);
      } else {
        selectedLayout.value = 82; // Fallback
      }
      updateLayout();
    });

    return {
      layout,
      selectedLayout,
      layouts,
      gridStyle,
      getKeyStyle,
      updateLayout,
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
    margin-bottom: 10px;
    margin-top: 0px;
  }

  .controls {
    margin-bottom: 10px;
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
    margin: 0 auto;
    min-height: 200px;
  }

  .key-row {
    display: contents;
  }

  .key-preview {
    position: absolute;
    border-radius: v.$border-radius * 1;
    background-color: #444;
    box-sizing: border-box;
  }
}
</style>