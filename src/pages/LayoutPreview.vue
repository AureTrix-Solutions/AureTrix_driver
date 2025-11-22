<template>
  <div class="layout-preview-page">
    <h2>Layout Preview</h2>
    <div class="controls">
      <label for="layout-select">Select Layout: </label>
      <select v-model="selectedLayout" id="layout-select" @change="updateLayout">
        <optgroup label="Standard Layouts">
          <option v-for="layout in layouts" :key="layout" :value="layout">{{ `${layout}-key` }}</option>
        </optgroup>
        <optgroup v-if="customLayouts.length > 0" label="Custom Layouts">
          <option v-for="layout in customLayouts" :key="layout.productName" :value="layout.productName">
            {{ layout.productName }}
          </option>
        </optgroup>
      </select>
      <button @click="showCreateModal = true" class="btn-create">Create New Layout</button>
      <button @click="triggerImport" class="btn-import">Import Layout</button>
      <input ref="fileInput" type="file" accept=".json" @change="handleFileImport" style="display: none" />
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

    <!-- Layout Creator Modal -->
    <LayoutCreatorModal :visible="showCreateModal" @close="showCreateModal = false" @saved="handleLayoutSaved" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { getLayoutConfig, refreshCustomLayouts } from '@utils/layoutConfigs';
import LayoutCreatorModal from '@/components/LayoutCreatorModal.vue';
import LayoutStorageService, { type CustomLayoutConfig } from '@/services/LayoutStorageService';

export default defineComponent({
  name: 'LayoutPreview',
  components: {
    LayoutCreatorModal
  },
  setup() {
    const layout = ref<any[][]>([]);
    const selectedLayout = ref<number | string | null>(null); // Can be number or productName string
    const layouts = [61, 67, 68, 80, 82, 84, 87]; // Supported layouts
    const customLayouts = ref<CustomLayoutConfig[]>([]);
    const showCreateModal = ref(false);
    const fileInput = ref<HTMLInputElement | null>(null);

    const layoutData = ref<any>({ rows: 0, cols: 0, keyPositions: [], gaps: [] });

    // Grid computation
    const gridStyle = computed(() => {
      const { keyPositions, gaps } = layoutData.value;
      if (!keyPositions || keyPositions.length === 0) {
        return { height: '0px', width: '0px' };
      }
      const containerHeight = keyPositions.reduce((max: number, row: any, i: number) => max + Math.max(...row.map((pos: any) => pos[1] + pos[3])) + (gaps[i] || 0), 0);
      const maxRowWidth = Math.max(...keyPositions.map((row: any) => row.reduce((sum: number, pos: any) => sum + pos[2], 0)));
      return {
        position: 'relative',
        height: `${containerHeight}px`,
        width: `${maxRowWidth}px`,
        margin: '0 auto',
      };
    });

    const getKeyStyle = (rowIdx: number, colIdx: number) => {
      const { keyPositions, gaps } = layoutData.value;
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
      const productName = typeof selectedLayout.value === 'string' ? selectedLayout.value : undefined;
      const keyCount = typeof selectedLayout.value === 'number' ? selectedLayout.value : 82;
      
      const config = getLayoutConfig(keyCount, undefined, undefined, undefined, undefined, productName);
      layoutData.value = config;
      layout.value = config.keyPositions;
      localStorage.setItem('lastSelectedLayout', selectedLayout.value?.toString() ?? '82');
    };

    // Load custom layouts
    const loadCustomLayouts = async () => {
      try {
        customLayouts.value = await LayoutStorageService.getAllLayouts();
        await refreshCustomLayouts();
      } catch (error) {
        console.warn('Failed to load custom layouts:', error);
      }
    };

    const handleLayoutSaved = async () => {
      await loadCustomLayouts();
      await updateLayout();
    };

    const triggerImport = () => {
      fileInput.value?.click();
    };

    const handleFileImport = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        try {
          await LayoutStorageService.importLayout(file);
          await loadCustomLayouts();
          await updateLayout();
        } catch (error) {
          console.error('Failed to import layout:', error);
          alert('Failed to import layout. Please check the file format.');
        }
      }
    };

    // Restore from localStorage on mount
    onMounted(async () => {
      await loadCustomLayouts();
      
      const savedLayout = localStorage.getItem('lastSelectedLayout');
      if (savedLayout) {
        // Check if it's a custom layout
        const isCustom = customLayouts.value.some(layout => layout.productName === savedLayout);
        if (isCustom) {
          selectedLayout.value = savedLayout;
        } else if (layouts.includes(parseInt(savedLayout))) {
          selectedLayout.value = parseInt(savedLayout);
        } else {
          selectedLayout.value = 82; // Fallback
        }
      } else {
        selectedLayout.value = 82; // Fallback
      }
      
      await updateLayout();
    });

    return {
      layout,
      selectedLayout,
      layouts,
      customLayouts,
      gridStyle,
      getKeyStyle,
      updateLayout,
      showCreateModal,
      handleLayoutSaved,
      triggerImport,
      handleFileImport,
      fileInput,
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
    flex-wrap: wrap;

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
      min-width: 150px;
    }

    .btn-create, .btn-import {
      padding: 8px 16px;
      border-radius: v.$border-radius;
      border: none;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.3s;
      font-weight: bold;
    }

    .btn-create {
      background-color: v.$accent-color;
      color: v.$background-dark;

      &:hover {
        background-color: color.adjust(v.$accent-color, $lightness: 10%);
      }
    }

    .btn-import {
      background-color: rgba(255, 255, 255, 0.1);
      color: v.$text-color;

      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
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