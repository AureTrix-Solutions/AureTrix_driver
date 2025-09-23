<template>
  <div class="key-mapping-page">
    <h2>Key Mapping</h2>
    <div class="controls">
      <label for="layer-select">Layer: </label>
      <select v-model="selectedLayer" id="layer-select">
        <option v-for="layer in layers" :key="layer" :value="layer">{{ `Fn${layer + 1}` }}</option>
      </select>
    </div>
    <div v-if="layout.length && loaded" class="key-grid" :style="gridStyle">
      <div v-for="(row, rIdx) in layout" :key="`r-${rIdx}`" class="key-row">
        <div
          v-for="(keyInfo, cIdx) in row"
          :key="`k-${rIdx}-${cIdx}`"
          class="key-btn"
          :style="getKeyStyle(rIdx, cIdx)"
          :class="{ 'drop-target': isDropTarget(row, cIdx) }"
          @dragover.prevent
          @drop="onDrop(keyInfo, rIdx, cIdx)"
          @click="selectKey(keyInfo)"
        >
          {{ keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}` }}
        </div>
      </div>
    </div>
    <div class="key-config">
      <label for="category-select">Remap to Category: </label>
      <select v-model="selectedCategory" id="category-select" @change="resetVirtualKeys">
        <option value="" disabled selected>Select a Category</option>
        <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
      </select>
      <div v-if="selectedCategory" class="virtual-keys-window">
        <div class="virtual-keys" @dragstart="onDragStart" @dragend="onDragEnd">
          <div
            v-for="(label, keyValue) in filteredKeyMap"
            :key="keyValue"
            class="virtual-key"
            draggable="true"
            :data-key-value="keyValue"
          >
            {{ label }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, computed } from 'vue';
import KeyboardService from '@services/KeyboardService';
import { keyMap } from '@utils/keyMap';
import { categories, categorizedKeys } from '@utils/keyCategories';
import { IDefKeyInfo } from '../types/types';
import { getLayoutConfig } from '@utils/layoutConfigs';
import { mmToPx } from '@utils/mmToPx'; // Import mmToPx

export default defineComponent({
  name: 'KeyMapping',
  setup() {
    const layout = ref<IDefKeyInfo[][]>([]); // 2D array for the keyboard layout
    const selectedLayer = ref(0); // Layers 0-3 (Fn1-Fn4)
    const selectedCategory = ref<string | null>(null);
    const draggedKey = ref<number | null>(null);
    const layers = [0, 1, 2, 3]; // Fn1-Fn4
    const baseLayout = ref<IDefKeyInfo[][] | null>(null); // Store the initial base layout
    const selectedKey = ref<IDefKeyInfo | null>(null); // For selectability
    const loaded = ref(false); // Flag to control rendering

    const categorizedKeysComputed = computed(categorizedKeys);
    const filteredKeyMap = computed(() => {
      return selectedCategory.value ? categorizedKeysComputed.value[selectedCategory.value] : {};
    });

    const gridStyle = computed(() => {
      if (!baseLayout.value) {
        console.warn('baseLayout.value is undefined, returning empty style');
        return {};
      }
      const totalKeys = baseLayout.value.flat().length;
      const { keyPositions, gaps } = getLayoutConfig(totalKeys, baseLayout.value);
      //console.log('Grid Style keyPositions:', keyPositions); // Debug log
      if (!keyPositions || keyPositions.length === 0) {
        console.warn('keyPositions is empty or invalid');
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
      if (!baseLayout.value) {
        console.warn('baseLayout.value is undefined in getKeyStyle');
        return {};
      }
      const totalKeys = baseLayout.value.flat().length;
      const { keyPositions, gaps } = getLayoutConfig(totalKeys, baseLayout.value);
      const rowLength = baseLayout.value[rowIdx]?.length || 0;
      if (!keyPositions || !keyPositions[rowIdx] || !Array.isArray(keyPositions[rowIdx]) || colIdx >= rowLength) {
        console.warn(`Invalid key position at row ${rowIdx}, col ${colIdx}: rowLength=${rowLength}, keyPositions[rowIdx]=`, keyPositions[rowIdx]);
        return { width: '0px', height: '0px', left: '0px', top: '0px' }; // Fallback to hide invalid keys
      }
      const [left, top, width, height] = keyPositions[rowIdx][colIdx];
      const topGapPx = gaps[rowIdx] || 0;
      //console.log(`Rendered style for row ${rowIdx}, col ${colIdx}:`, { left, top, width, height }); // Debug log
      return {
        position: 'absolute',
        left: `${left}px`,
        top: `${top + topGapPx}px`,
        width: `${width}px`,
        height: `${height}px`,
        marginBottom: `${mmToPx(1)}px`, // 1mm bottom spacing
        boxSizing: 'border-box', // Include border and padding in width/height
        'data-overlay': '', // Placeholder for future use
      };
    };

    // Fetch layer-specific layout with non-overlapping batched requests
    async function fetchLayerLayout(layerIndex: number) {
      try {
        const newBaseLayout = await KeyboardService.defKey();
        if (!baseLayout.value) {
          baseLayout.value = newBaseLayout;
          const totalKeys = newBaseLayout.flat().length;
          //console.log(`Detected ${totalKeys} keys, baseLayout:`, newBaseLayout);
        }
        const totalKeys = newBaseLayout.flat().length;
        //console.log(`Base layout key count: ${totalKeys} (template for layer ${layerIndex + 1})`, newBaseLayout);

        await KeyboardService.reloadParameters();
        //console.log(`Reloaded parameters for layer ${layerIndex + 1}`);

        const batchSize = 10;
        const requests = [];
        for (let i = 0; i < newBaseLayout.flat().length; i += batchSize) {
          const startIdx = i;
          const endIdx = Math.min(i + batchSize - 1, newBaseLayout.flat().length - 1);
          const batch = newBaseLayout.flat().slice(startIdx, endIdx + 1).map(k => ({ key: k.keyValue, layout: layerIndex }));
          requests.push(batch);
        }
        const allLayerData = [];
        for (const request of requests) {
          try {
            const layerData = await KeyboardService.getLayoutKeyInfo(request);
            allLayerData.push(...layerData);
            //console.log(`Raw fetched batch for keys ${request[0].key} to ${request[request.length - 1].key} in layer ${layerIndex + 1}:`, layerData);
          } catch (error) {
            console.error(`Failed to fetch batch for keys ${request[0].key} to ${request[request.length - 1].key} in layer ${layerIndex + 1}:`, error);
          }
        }
        //console.log(`Raw allLayerData for layer ${layerIndex + 1} before processing:`, allLayerData);

        const uniqueLayerData = new Map<number, { key: number; value: number }>();
        allLayerData.forEach(item => {
          uniqueLayerData.set(item.key, { key: item.key, value: item.value });
          //console.log(`Unique mapping for key ${item.key}: value ${item.value} in layer ${layerIndex + 1}`);
        });
        //console.log(`Unique layer data key count for layer ${layerIndex + 1}: ${uniqueLayerData.size}`, Array.from(uniqueLayerData.values()));

        const layerLayout: IDefKeyInfo[][] = newBaseLayout.map(row =>
          row.map(baseKey => {
            const layerKey = uniqueLayerData.get(baseKey.keyValue);
            let keyValue = baseKey.keyValue;
            if (layerKey) {
              keyValue = layerKey.value;
              if (layerKey.value === 0 && layerIndex === 0) {
                //console.log(`Base layer ${layerIndex + 1}: Using default ${keyValue} for unmapped key ${baseKey.keyValue}`);
              } else if (layerKey.value === 0 || layerKey.value === 1) {
                //console.log(`Layer ${layerIndex + 1}: Preserving unmapped value ${keyValue} for key ${baseKey.keyValue}`);
              } else {
                //console.log(`Layer ${layerIndex + 1}: Applied remapped value ${keyValue} for key ${baseKey.keyValue}`);
                if (baseKey.keyValue === 57) {
                  //console.log(`Caps Lock (key 57) remapped to ${keyValue} in layer ${layerIndex + 1}`);
                }
              }
            } else {
              console.warn(`No unique mapping found for key ${baseKey.keyValue} in layer ${layerIndex + 1}, using base value: ${keyValue}`);
            }
            if (keyValue === 1) {
              keyValue = 0;
              //console.log(`Visual remap: Changed key ${baseKey.keyValue} from value 1 to 0 in layer ${layerIndex + 1}`);
            }
            if (keyValue < 0 || keyValue > 65535) {
              console.warn(`Invalid value ${keyValue} for key ${baseKey.keyValue} in layer ${layerIndex + 1}, using default: ${baseKey.keyValue}`);
              keyValue = baseKey.keyValue;
            }
            return { keyValue, location: baseKey.location };
          })
        );

        layout.value = layerLayout;
        loaded.value = true; // Set loaded flag after layout is ready
        //console.log(`Fetched and transformed layout for layer ${layerIndex + 1}:`, layerLayout);
      } catch (error) {
        console.error(`Failed to fetch layout for layer ${layerIndex + 1}:`, error);
        layout.value = [];
        loaded.value = false;
      }
    }

    const selectKey = (key: IDefKeyInfo) => {
      selectedKey.value = key; // Select the key for future use (e.g., overlays)
      //console.log(`Selected key: { keyValue: ${key.keyValue}, location: { row: ${key.location.row}, col: ${key.location.col} } }`);
    };

    const remapKey = async (rowIdx: number, colIdx: number, newValue: number) => {
      try {
        if (!baseLayout.value) throw new Error('Base layout not initialized');
        const targetKey = baseLayout.value[rowIdx][colIdx];
        const targetKeyValue = targetKey.keyValue;
        //console.log(`Attempting to remap key ${keyMap[targetKeyValue] || `Key ${targetKeyValue}`} to ${keyMap[newValue] || `Key ${newValue}`}`);
        //console.log(`Using base keyValue: ${targetKeyValue} for remapping at location { row: ${targetKey.location.row}, col: ${targetKey.location.col} }`);
        const config = [{ key: targetKeyValue, layout: selectedLayer.value, value: newValue }];
        //console.log(`Sending remap config:`, config);
        await KeyboardService.setKey(config);
        //console.log(`Remap request sent for key ${targetKeyValue} to ${newValue} on layer ${selectedLayer.value + 1}`);
        await KeyboardService.reloadParameters();
        //console.log(`Device parameters reloaded after remap on layer ${selectedLayer.value + 1}`);
        let verifyData = [];
        for (let attempt = 1; attempt <= 3; attempt++) {
          verifyData = await KeyboardService.getLayoutKeyInfo([{ key: targetKeyValue, layout: selectedLayer.value }]);
          //console.log(`Verified remap data for key ${targetKeyValue} (attempt ${attempt}):`, verifyData);
          if (verifyData.length > 0 && verifyData[0].value === newValue) break;
        }
        if (verifyData.length === 0 || verifyData[0].value !== newValue) {
          console.warn(`Verification failed after 3 attempts; latest data:`, verifyData);
          // Force layout refresh with retry
          for (let retry = 1; retry <= 2; retry++) {
            await fetchLayerLayout(selectedLayer.value);
            const updatedKey = layout.value.flat().find(k => k.keyValue === targetKeyValue);
            if (updatedKey && updatedKey.keyValue === newValue) break;
            //console.log(`Retry ${retry} to refresh layout for key ${targetKeyValue}`);
          }
        }
        await fetchLayerLayout(selectedLayer.value); // Final refresh
        //console.log(`Layout refreshed after remap on layer ${selectedLayer.value + 1} with new value ${newValue}`);
      } catch (error) {
        console.error(`Remap failed for key at { row: ${rowIdx}, col: ${colIdx} } to ${newValue} on layer ${selectedLayer.value + 1}:`, error);
      }
    };

    const resetVirtualKeys = () => {
      draggedKey.value = null;
    };

    const onDragStart = (event: DragEvent) => {
      const target = event.target as HTMLElement;
      draggedKey.value = parseInt(target.getAttribute('data-key-value') || '');
      event.dataTransfer?.setData('text/plain', draggedKey.value.toString());
      //console.log(`Drag started with key value: ${draggedKey.value} (${keyMap[draggedKey.value]})`);
    };

    const onDragEnd = () => {
      draggedKey.value = null;
      //console.log('Drag ended');
    };

    const isDropTarget = (row: IDefKeyInfo[], colIdx: number) => {
      // Any key can be a drop target
      return true;
    };

    const onDrop = (keyInfo: IDefKeyInfo, rowIdx: number, colIdx: number) => {
      if (draggedKey.value !== null) {
        //console.log(`Dropping key ${keyMap[draggedKey.value]} onto ${keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}`}`);
        remapKey(rowIdx, colIdx, draggedKey.value);
      }
    };

    watch(selectedLayer, (newLayer) => {
      layout.value = [];
      loaded.value = false; // Reset loaded flag on layer change
      fetchLayerLayout(newLayer);
    });

    onMounted(() => {
      fetchLayerLayout(selectedLayer.value);
    });

    return {
      layout,
      selectKey,
      remapKey,
      selectedLayer,
      layers,
      keyMap,
      selectedCategory,
      categories,
      categorizedKeysComputed: categorizedKeys(),
      filteredKeyMap,
      resetVirtualKeys,
      onDragStart,
      onDragEnd,
      isDropTarget,
      onDrop,
      gridStyle,
      getKeyStyle,
      selectedKey,
      loaded,
    };
  },
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@styles/variables' as v;

.key-mapping-page {
  padding: 20px;
  color: v.$text-color;
  h2 {
    color: v.$primary-color;
    margin-bottom: 20px;
  }
  .controls {
    margin-bottom: 20px;
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
    margin-bottom: 20px;
    width: fit-content;
    margin: 0 auto; // Center the grid
    min-height: 300px; // Minimum height to ensure visibility
  }
  .key-row {
    display: contents; // Allow positioning of children
  }
  .key-btn {
    position: absolute;
    padding: 4px; // Increased padding for better visual size
    border: 2px solid rgba(255, 255, 255, 0.3); // Thicker border
    border-radius: v.$border-radius * 2; // Enhanced rounding
    background: linear-gradient(to bottom, v.$background-dark 70%, color.adjust(v.$background-dark, $lightness: 10%) 100%); // Gradient for depth
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(255, 255, 255, 0.2); // Beveled effect
    color: v.$text-color;
    cursor: pointer;
    transition: all 0.2s ease;
    box-sizing: border-box; // Include border and padding in width/height
    user-select: text; // Ensure selectability
    &:focus {
      outline: 2px solid v.$accent-color; // Visual feedback for selection
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.4), inset 0 -2px 4px rgba(255, 255, 255, 0.3);
    }
    &.drop-target {
      outline: 2px dashed v.$accent-color;
      outline-offset: -2px;
      background-color: color.adjust(v.$background-dark, $lightness: 5%, $alpha: 0.7); // Semi-transparent highlight
    }
    &:hover {
      background: linear-gradient(to bottom, color.adjust(v.$background-dark, $lightness: 5%) 70%, color.adjust(v.$background-dark, $lightness: 15%) 100%);
      box-shadow: 0 3px 5px rgba(0, 0, 0, 0.4), inset 0 -2px 4px rgba(255, 255, 255, 0.3);
    }
  }
  .key-config {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    label {
      margin-right: 10px;
      color: v.$text-color;
      font-size: 1rem;
    }
    select {
      padding: 8px;
      border-radius: v.$border-radius;
      background-color: v.$background-dark;
      color: v.$text-color;
      border: 1px solid rgba(255, 255, 255, 0.2);
      font-size: 1rem;
      width: 300px; // Ensure the selector is wide enough
    }
    .virtual-keys-window {
      padding: 20px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: v.$border-radius;
      background-color: color.adjust(v.$background-dark, $lightness: -2%);
      .virtual-keys {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); // Increased key size and columns
        gap: 15px;
        padding: 20px;
        max-height: 400px; // Larger window
        overflow-y: auto;
      }
      .virtual-key {
        padding: 15px; // Increased padding for larger keys
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: v.$border-radius;
        background-color: v.$background-dark;
        color: v.$text-color;
        text-align: center;
        cursor: move;
        transition: all 0.2s ease;
        &:hover {
          background-color: color.adjust(v.$background-dark, $lightness: 8%);
          border-color: v.$accent-color;
        }
        &.dragging {
          opacity: 0.6;
          transform: scale(0.98);
        }
      }
    }
  }
}
</style>