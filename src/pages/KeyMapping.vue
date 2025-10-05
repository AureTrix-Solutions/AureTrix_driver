<template>
  <div class="key-mapping-page">
    <h2 class="title">Key Mapping</h2>
    <div class="controls">
      <label for="layer-select">Layer: </label>
      <select v-model="selectedLayer" id="layer-select">
        <option v-for="layer in layers" :key="layer" :value="layer">{{ `Fn${layer}` }}</option>
      </select>
      <label for="category-select">Remap to Category: </label>
      <select v-model="selectedCategory" id="category-select" @change="resetVirtualKeys">
        <option value="" disabled selected>Select a Category</option>
        <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
      </select>
      <button
        v-if="selectedKeys.length > 0 && selectedCategory && selectedKeyValue !== null"
        @click="applyBulkRemap"
        class="action-btn"
      >
        Apply to {{ selectedKeys.length }} Selected Key{{ selectedKeys.length > 1 ? 's' : '' }}
      </button>
      <button @click="toggleMultiSelect" class="action-btn secondary" :class="{ active: isMultiSelect }">
        {{ isMultiSelect ? 'Stop Multi-Select' : 'Select Multi' }}
      </button>
      <button @click="toggleSelectAll" class="action-btn secondary">
        {{ selectedKeys.length === (layout.value?.flat().length || 0) ? 'Select All' : 'Deselect All' }}
      </button>
      <button @click="setDefaultLayer" class="action-btn">Reset Mapping</button>
    </div>
    <div v-if="notification" class="notification" :class="{ error: notification.isError }">
      <span>{{ notification.message }}</span>
      <button @click="notification = null" class="dismiss-btn">&times;</button>
    </div>
    <div class="mapping-container">
      <div v-if="layout.length && loaded" class="key-grid" :style="gridStyle">
        <div v-for="(row, rIdx) in layout" :key="`r-${rIdx}`" class="key-row">
          <div
            v-for="(keyInfo, cIdx) in row"
            :key="`k-${rIdx}-${cIdx}`"
            class="key-btn"
            :style="getKeyStyle(rIdx, cIdx)"
            :class="{ 'drop-target': isDropTarget(row, cIdx), selected: isKeySelected(rIdx, cIdx) }"
            @dragover.prevent
            @drop="onDrop(keyInfo, rIdx, cIdx)"
            @click="handleKeyClick(keyInfo, rIdx, cIdx)"
          >
            {{ keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}` }}
          </div>
        </div>
      </div>
      <div v-else class="no-layout">
        <p>{{ error || 'No keyboard layout available. Ensure a device is connected and try again.' }}</p>
      </div>
      <div class="key-config">
        <div v-if="selectedCategory" class="virtual-keys-window">
          <p class="hint-text">Click or drag a key to select it for remapping</p>
          <div class="virtual-keys" @dragstart="onDragStart" @dragend="onDragEnd">
            <div
              v-for="(label, keyValue) in filteredKeyMap"
              :key="keyValue"
              class="virtual-key"
              :class="{ 'key-selected': selectedKeyValue === keyValue }"
              draggable="true"
              :data-key-value="keyValue"
              @click="selectKeyValue(keyValue)"
            >
              {{ label }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch, onMounted } from 'vue';
import KeyboardService from '@services/KeyboardService';
import { keyMap } from '@utils/keyMap';
import { categories, categorizedKeys } from '@utils/keyCategories';
import { useMappedKeyboard } from '@utils/MappedKeyboard';
import type { IDefKeyInfo } from '../types/types';
import { useConnectionStore } from '../store/connection';

export default defineComponent({
  name: 'KeyMapping',
  setup() {
    const connectionStore = useConnectionStore();
    const selectedLayer = ref(0); // Layers 0-3 (Fn1-Fn4)
    const selectedCategory = ref<string | null>(null);
    const draggedKey = ref<number | null>(null);
    const selectedKeyValue = ref<number | null>(null);
    const layers = [0, 1, 2, 3]; // Fn1-Fn4
    const selectedKey = ref<IDefKeyInfo | null>(null);
    const selectedKeys = ref<{ rowIdx: number; colIdx: number }[]>([]);
    const notification = ref<{ message: string; isError: boolean } | null>(null);
    const isMultiSelect = ref(false);

    const { layout, loaded, gridStyle, getKeyStyle, fetchLayerLayout, baseLayout, error, batchSetKey } = useMappedKeyboard(selectedLayer);

    const categorizedKeysComputed = computed(() => categorizedKeys());
    const filteredKeyMap = computed(() => {
      return selectedCategory.value ? categorizedKeysComputed.value[selectedCategory.value] : {};
    });

    // Auto-clear notification after 3 seconds
    watch(notification, (newNotification) => {
      if (newNotification) {
        setTimeout(() => {
          if (notification.value === newNotification) {
            notification.value = null;
            //console.log('Notification auto-cleared after 3 seconds');
          }
        }, 3000);
      }
    });

    const selectKey = (key: IDefKeyInfo) => {
      selectedKey.value = key;
      //console.log(`Selected key: { keyValue: ${key.keyValue}, location: { row: ${key.location.row}, col: ${key.location.col} } }`);
    };

    const isKeySelected = (rowIdx: number, colIdx: number) => {
      return selectedKeys.value.some(key => key.rowIdx === rowIdx && key.colIdx === colIdx);
    };

    const toggleMultiSelect = () => {
      isMultiSelect.value = !isMultiSelect.value;
      if (!isMultiSelect.value) {
        selectedKeys.value = [];
      }
      //console.log(`Multi-select mode: ${isMultiSelect.value}`);
    };

    const handleKeyClick = (keyInfo: IDefKeyInfo, rowIdx: number, colIdx: number) => {
      //console.log(`Key clicked: row ${rowIdx}, col ${colIdx}, multi-select: ${isMultiSelect.value}, selected keys: ${selectedKeys.value.length}`);
      if (isMultiSelect.value || selectedKeys.value.length > 0) {
        const keyIndex = selectedKeys.value.findIndex(key => key.rowIdx === rowIdx && key.colIdx === colIdx);
        if (keyIndex >= 0) {
          selectedKeys.value.splice(keyIndex, 1); // Deselect
        } else {
          selectedKeys.value.push({ rowIdx, colIdx }); // Select
        }
        //console.log(`Toggled multi-select for key at row ${rowIdx}, col ${colIdx}. Selected keys:`, selectedKeys.value);
      } else {
        selectedKeys.value = []; // Clear multi-selection
        selectKey(keyInfo);
      }
    };

    const toggleSelectAll = () => {
      if (layout.value && selectedKeys.value.length === layout.value.flat().length) {
        selectedKeys.value = [];
        //console.log('Deselected all keys');
        notification.value = { message: 'All keys deselected.', isError: false };
      } else if (layout.value) {
        selectedKeys.value = layout.value.flatMap((row, rowIdx) =>
          row.map((_, colIdx) => ({ rowIdx, colIdx }))
        );
        //console.log('Selected all keys:', selectedKeys.value);
        notification.value = { message: 'All keys selected. Click keys to select/deselect.', isError: false };
      }
    };

    const selectKeyValue = (keyValue: number) => {
      selectedKeyValue.value = keyValue;
      draggedKey.value = keyValue; // Sync with draggedKey for compatibility
      //console.log(`Selected key value: ${keyMap[keyValue] || keyValue}`);
    };

    const remapKey = async (rowIdx: number, colIdx: number, newValue: number) => {
      try {
        if (!baseLayout.value || !baseLayout.value[rowIdx][colIdx]) throw new Error('Base layout not initialized');
        const targetKey = baseLayout.value[rowIdx][colIdx];
        const targetKeyValue = targetKey.keyValue;
        //console.log(`Attempting to remap key ${keyMap[targetKeyValue] || `Key ${targetKeyValue}`} to ${keyMap[newValue] || `Key ${newValue}`}`);
        //console.log(`Using base keyValue: ${targetKeyValue} for remapping at location { row: ${targetKey.location.row}, col: ${targetKey.location.col} }`);
        const config = [{ key: targetKeyValue, layout: selectedLayer.value, value: newValue }];
        //console.log(`Sending remap config:`, config);
        await batchSetKey(config);
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
          //notification.value = { message: `Failed to verify remap for key ${keyMap[targetKeyValue] || targetKeyValue}`, isError: true };
        }
        await fetchLayerLayout();
        //console.log(`Layout refreshed after remap on layer ${selectedLayer.value + 1} with new value ${newValue}`);
      } catch (error) {
        console.error(`Remap failed for key at { row: ${rowIdx}, col: ${colIdx} } to ${newValue} on layer ${selectedLayer.value + 1}:`, error);
        //notification.value = { message: `Failed to remap key: ${(error as Error).message}`, isError: true };
      }
    };

    const applyBulkRemap = async () => {
      if (selectedKeyValue.value === null || !selectedKeys.value.length) {
        notification.value = { message: 'Select keys and a key value to remap', isError: false};
        return;
      }
      try {
        //console.log(`Applying bulk remap to ${selectedKeys.value.length} keys with value ${keyMap[selectedKeyValue.value] || selectedKeyValue.value}`);
        const config = selectedKeys.value
          .map(({ rowIdx, colIdx }) => {
            if (!baseLayout.value || !baseLayout.value[rowIdx][colIdx]) return null;
            const targetKey = baseLayout.value[rowIdx][colIdx];
            return { key: targetKey.keyValue, layout: selectedLayer.value, value: selectedKeyValue.value };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);
        //console.log(`Sending bulk remap config:`, config);
        await batchSetKey(config);
        //console.log(`Bulk remap request sent for ${config.length} keys on layer ${selectedLayer.value + 1}`);
        await KeyboardService.reloadParameters();
        //console.log(`Device parameters reloaded after bulk remap on layer ${selectedLayer.value + 1}`);
        let verifyData = [];
        for (let attempt = 1; attempt <= 3; attempt++) {
          verifyData = await KeyboardService.getLayoutKeyInfo(
            config.map(item => ({ key: item.key, layout: selectedLayer.value }))
          );
          //console.log(`Verified bulk remap data (attempt ${attempt}):`, verifyData);
          const allVerified = verifyData.every(item => item.value === selectedKeyValue.value);
          if (allVerified) break;
        }
        if (verifyData.length === 0 || verifyData.some(item => item.value !== selectedKeyValue.value)) {
          //console.warn(`Bulk remap verification failed after 3 attempts; latest data:`, verifyData);
          //notification.value = { message: `Failed to verify bulk remap for some keys`, isError: true };
        }
        const numKeys = selectedKeys.value.length;
        selectedKeys.value = [];
        //console.log('Cleared selected keys after bulk remap');
        await fetchLayerLayout();
        //console.log(`Layout refreshed after bulk remap on layer ${selectedLayer.value + 1}`);
        notification.value = { message: `Remapped ${numKeys} key${numKeys > 1 ? 's' : ''} to ${keyMap[selectedKeyValue.value] || selectedKeyValue.value}`, isError: false };
      } catch (error) {
        console.error(`Bulk remap failed on layer ${selectedLayer.value + 1}:`, error);
        //notification.value = { message: `Failed to bulk remap: ${(error as Error).message}`, isError: true };
      }
    };

    const setDefaultLayer = async () => {
      if (!connectionStore.isConnected) {
        notification.value = { message: 'No keyboard connected', isError: true };
        return;
      }
      if (!baseLayout.value) {
        notification.value = { message: 'Base layout not initialized', isError: true };
        return;
      }
      try {
        const config = baseLayout.value.flat().map(key => ({
          key: key.keyValue,
          layout: selectedLayer.value,
          value: key.keyValue
        }));
        //console.log(`Setting default layout for layer ${selectedLayer.value + 1} with config:`, config);
        await batchSetKey(config);
        //console.log(`Default layout set for layer ${selectedLayer.value + 1}`);
        await KeyboardService.reloadParameters();
        //console.log(`Device parameters reloaded after setting default layer ${selectedLayer.value + 1}`);
        let verifyData = [];
        for (let attempt = 1; attempt <= 3; attempt++) {
          verifyData = await KeyboardService.getLayoutKeyInfo(
            config.map(item => ({ key: item.key, layout: selectedLayer.value }))
          );
          //console.log(`Verified default layout data for layer ${selectedLayer.value + 1} (attempt ${attempt}):`, verifyData);
          const allVerified = verifyData.every(item => item.value === config.find(c => c.key === item.key)?.value);
          if (allVerified) break;
        }
        if (verifyData.length === 0 || verifyData.some(item => item.value !== config.find(c => c.key === item.key)?.value)) {
          //console.warn(`Default layout verification failed after 3 attempts; latest data:`, verifyData);
          //notification.value = { message: `Failed to verify default layout for layer Fn${selectedLayer.value + 1}`, isError: true };
        }
        await fetchLayerLayout();
        //console.log(`Layout refreshed after setting default layer ${selectedLayer.value + 1}`);
        notification.value = { message: `Layer Fn${selectedLayer.value + 1} reset to default layout`, isError: false };
      } catch (error) {
        console.error(`Failed to set default layer ${selectedLayer.value + 1}:`, error);
        notification.value = { message: `Failed to reset mapping: ${(error as Error).message}`, isError: true };
      }
    };

    const resetVirtualKeys = () => {
      draggedKey.value = null;
      selectedKeyValue.value = null;
      selectedKeys.value = [];
      //console.log('Reset virtual keys and selected keys');
    };

    const onDragStart = (event: DragEvent) => {
      const target = event.target as HTMLElement;
      const keyValue = parseInt(target.getAttribute('data-key-value') || '');
      draggedKey.value = keyValue;
      selectedKeyValue.value = keyValue;
      event.dataTransfer?.setData('text/plain', keyValue.toString());
      //console.log(`Drag started with key value: ${keyValue} (${keyMap[keyValue]})`);
    };

    const onDragEnd = () => {
      draggedKey.value = null;
      //console.log('Drag ended');
    };

    const isDropTarget = (row: IDefKeyInfo[], colIdx: number) => {
      return true; // Any key can be a drop target
    };

    const onDrop = (keyInfo: IDefKeyInfo, rowIdx: number, colIdx: number) => {
      if (draggedKey.value !== null) {
        //console.log(`Dropping key ${keyMap[draggedKey.value]} onto ${keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}`}`);
        remapKey(rowIdx, colIdx, draggedKey.value);
      }
    };

    watch(selectedLayer, (newLayer) => {
      //console.log(`Layer changed to Fn${newLayer + 1}`);
      fetchLayerLayout();
    });

    watch(error, (newError) => {
      if (newError) {
        notification.value = { message: newError, isError: true };
      }
    });

    onMounted(() => {
      fetchLayerLayout();
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
      categorizedKeysComputed,
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
      selectedKeys,
      handleKeyClick,
      applyBulkRemap,
      setDefaultLayer,
      notification,
      isKeySelected,
      selectedKeyValue,
      selectKeyValue,
      toggleSelectAll,
      toggleMultiSelect,
      isMultiSelect,
      error, // Added to fix Vue warning
    };
  },
});
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@styles/variables' as v;

.key-mapping-page {
  padding: 20px;
  color: v.$text-color;

  .title {
    color: v.$primary-color;
    margin-bottom: 10px;
    margin-top: 0px;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .controls {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 24px;
    flex-wrap: wrap;

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
      border: 1px solid rgba(v.$text-color, 0.2);
      font-size: 1rem;
    }

    .action-btn {
      padding: 8px 16px;
      background-color: v.$primary-color;
      color: v.$background-dark;
      border: none;
      border-radius: v.$border-radius;
      cursor: pointer;
      font-size: 1rem;

      &:hover:not(:disabled) {
        background-color: color.adjust(v.$primary-color, $lightness: 10%);
      }

      &:disabled {
        background-color: color.adjust(v.$primary-color, $lightness: -20%);
        cursor: not-allowed;
        opacity: 0.6;
      }

      &.secondary {
        background-color: #374151;

        &:hover:not(:disabled) {
          background-color: color.adjust(#374151, $lightness: 10%);
        }

        &.active {
          background-color: v.$accent-color;
          color: v.$background-dark;

          &:hover:not(:disabled) {
            background-color: color.adjust(v.$accent-color, $lightness: 10%);
          }
        }
      }
    }
  }

  .notification {
    padding: 10px;
    margin-bottom: 16px;
    border-radius: v.$border-radius;
    background-color: rgba(v.$background-dark, 1.1);
    color: v.$text-color;
    display: flex;
    align-items: center;

    &.error {
      background-color: color.mix(#ef4444, v.$background-dark, 50%);
    }

    .dismiss-btn {
      margin-left: 10px;
      padding: 0 6px;
      background: none;
      border: none;
      color: v.$text-color;
      cursor: pointer;
      font-size: 1rem;

      &:hover {
        color: rgba(v.$text-color, 0.6);
      }
    }
  }

  .mapping-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .no-layout {
    text-align: center;
    color: v.$text-color;
    font-size: 1rem;
    padding: 20px;
  }

  .key-grid {
    display: block;
    position: relative;
    width: fit-content;
    margin: 0 auto;
    min-height: 300px;
    max-height: 500px;
    flex-shrink: 0;
  }

  .key-row {
    display: contents;
  }

  .key-btn {
    position: absolute;
    padding: 4px;
    border: 2px solid rgba(v.$text-color, 0.3);
    border-radius: v.$border-radius;
    background: linear-gradient(to bottom, v.$background-dark 70%, color.adjust(v.$background-dark, $lightness: 10%) 100%);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 -2px 4px rgba(255, 255, 255, 0.2);
    color: v.$text-color;
    cursor: pointer;
    transition: all 0.2s ease;
    box-sizing: border-box;
    user-select: none;
    text-align: center;

    &.drop-target {
      outline-offset: -2px;
      background-color: color.adjust(v.$background-dark, $lightness: 5%, $alpha: 0.7);
    }

    &.selected {
      border-color: v.$accent-color;
      box-shadow: 0 0 8px rgba(v.$accent-color, 0.5);
    }
  }

  .key-config {
    position: relative;
    margin-top: -30px;
    padding-top: 5px;
    display: flex;
    flex-direction: column;
    height:500px;
    width: 1156px;
    align-self: center;
    gap: 10px;
    flex: 0 0 auto;

    .hint-text {
      color: rgba(v.$text-color, 0.6);
      font-size: 0.9rem;
      margin-bottom: 8px;
    }

    label {
      margin-right: 10px;
      color: v.$text-color;
      font-size: 1rem;
    }

    select {
      padding: 8px;
      margin-left: 1px;
      border-radius: v.$border-radius;
      background-color: v.$background-dark;
      color: v.$text-color;
      border: 1px solid rgba(255, 255, 255, 0.2);
      font-size: 1rem;
      width: 200px;
    }

    .virtual-keys-window {
      display: flex;
      flex-direction: column;
      padding: 10px;
      align-self: center;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: v.$border-radius;
      background-color: color.adjust(v.$background-dark, $lightness: -2%);

      .virtual-keys {
        display: grid;
        width:fit-content;
        grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
        gap: 3px;
        padding: 8px;
        max-height: 500px;
        max-width: 1000px;
        overflow: hidden;
      }

      .virtual-key {
        padding: 8px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: v.$border-radius;
        background-color: v.$background-dark;
        color: v.$text-color;
        text-align: center;
        height: 48px;
        width: 50px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background-color: color.adjust(v.$background-dark, $lightness: 8%);
          border-color: v.$accent-color;
        }

        &.key-selected {
          background-color: v.$accent-color;
          color: v.$background-dark;
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