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
        Apply to {{ selectedKeys.length }} Key{{ selectedKeys.length > 1 ? 's' : '' }}
      </button>
      <button @click="toggleMultiSelect" class="action-btn secondary" :class="{ active: isMultiSelect }">
        {{ isMultiSelect ? 'Stop Multi-Select' : 'Select Multi' }}
      </button>
      <button @click="toggleSelectAll" class="action-btn secondary">
        {{ selectedKeys.length === (layout.value?.flat().length || 0) ? 'Select All' : 'Deselect All' }}
      </button>
      <button @click="setDefaultLayer" class="action-btn">Reset Mapping</button>
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
            <div class="key-label">
              {{ keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}` }}
            </div>
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
    const isMultiSelect = ref(false);
    const batchSize = ref(80);
    const delayMs = ref(0);

    const { layout, loaded, gridStyle, getKeyStyle, fetchLayerLayout, baseLayout, error, batchSetKey } = useMappedKeyboard(selectedLayer);

    const categorizedKeysComputed = computed(() => categorizedKeys());
    const filteredKeyMap = computed(() => {
      return selectedCategory.value ? categorizedKeysComputed.value[selectedCategory.value] : {};
    });

    // Selection and multi-select handling
    const selectKey = (key: IDefKeyInfo) => {
      selectedKey.value = key;
    };

    const isKeySelected = (rowIdx: number, colIdx: number) => {
      return selectedKeys.value.some(key => key.rowIdx === rowIdx && key.colIdx === colIdx);
    };

    const toggleMultiSelect = () => {
      isMultiSelect.value = !isMultiSelect.value;
      if (!isMultiSelect.value) {
        selectedKeys.value = [];
      }
    };

    const handleKeyClick = (keyInfo: IDefKeyInfo, rowIdx: number, colIdx: number) => {
      if (isMultiSelect.value || selectedKeys.value.length > 0) {
        const keyIndex = selectedKeys.value.findIndex(key => key.rowIdx === rowIdx && key.colIdx === colIdx);
        if (keyIndex >= 0) {
          selectedKeys.value.splice(keyIndex, 1);
        } else {
          selectedKeys.value.push({ rowIdx, colIdx });
        }
      } else {
        selectedKeys.value = [];
        selectKey(keyInfo);
      }
    };

    const toggleSelectAll = () => {
      if (layout.value && selectedKeys.value.length === layout.value.flat().length) {
        selectedKeys.value = [];
      } else if (layout.value) {
        selectedKeys.value = layout.value.flatMap((row, rowIdx) =>
          row.map((_, colIdx) => ({ rowIdx, colIdx }))
        );
      }
    };

    // Key value selection and remapping
    const selectKeyValue = (keyValue: number) => {
      selectedKeyValue.value = keyValue;
      draggedKey.value = keyValue;
    };

    const remapKey = async (rowIdx: number, colIdx: number, newValue: number) => {
      try {
        if (!baseLayout.value || !baseLayout.value[rowIdx][colIdx]) throw new Error('Base layout not initialized');
        const targetKey = baseLayout.value[rowIdx][colIdx];
        const targetKeyValue = targetKey.keyValue;
        const config = [{ key: targetKeyValue, layout: selectedLayer.value, value: newValue }];
        await batchSetKey(config);
        await fetchLayerLayout();
      } catch (error) {
        console.error(`Remap failed for key at { row: ${rowIdx}, col: ${colIdx} } to ${newValue} on layer ${selectedLayer.value + 1}:`, error);
      }
    };

    const applyBulkRemap = async () => {
      if (selectedKeyValue.value === null || !selectedKeys.value.length) {
        return;
      }
      try {
        const config = selectedKeys.value
          .map(({ rowIdx, colIdx }) => {
            if (!baseLayout.value || !baseLayout.value[rowIdx][colIdx]) return null;
            const targetKey = baseLayout.value[rowIdx][colIdx];
            return { key: targetKey.keyValue, layout: selectedLayer.value, value: selectedKeyValue.value };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);

        for (let i = 0; i < config.length; i += batchSize.value) {
          const batch = config.slice(i, i + batchSize.value);
          await batchSetKey(batch);
          if (i + batchSize.value < config.length) {
            await new Promise(resolve => setTimeout(resolve, delayMs.value));
          }
        }

        const numKeys = selectedKeys.value.length;
        selectedKeys.value = [];
        await fetchLayerLayout();
      } catch (error) {
        console.error(`Bulk remap failed on layer ${selectedLayer.value + 1}:`, error);
      }
    };

    // Layer reset and utilities
    const setDefaultLayer = async () => {
      if (!connectionStore.isConnected) {
        return;
      }
      if (!baseLayout.value) {
        return;
      }
      try {
        const config = baseLayout.value.flat().map(key => ({
          key: key.keyValue,
          layout: selectedLayer.value,
          value: key.keyValue
        }));

        for (let i = 0; i < config.length; i += batchSize.value) {
          const batch = config.slice(i, i + batchSize.value);
          await batchSetKey(batch);
          if (i + batchSize.value < config.length) {
            await new Promise(resolve => setTimeout(resolve, delayMs.value));
          }
        }

        await fetchLayerLayout();
      } catch (error) {
        console.error(`Failed to set default layer ${selectedLayer.value + 1}:`, error);
      }
    };

    const resetVirtualKeys = () => {
      draggedKey.value = null;
      selectedKeyValue.value = null;
      selectedKeys.value = [];
    };

    const onDragStart = (event: DragEvent) => {
      const target = event.target as HTMLElement;
      const keyValue = parseInt(target.getAttribute('data-key-value') || '');
      draggedKey.value = keyValue;
      selectedKeyValue.value = keyValue;
      event.dataTransfer?.setData('text/plain', keyValue.toString());
    };

    const onDragEnd = () => {
      draggedKey.value = null;
    };

    const isDropTarget = (row: IDefKeyInfo[], colIdx: number) => {
      return true;
    };

    const onDrop = (keyInfo: IDefKeyInfo, rowIdx: number, colIdx: number) => {
      if (draggedKey.value !== null) {
        remapKey(rowIdx, colIdx, draggedKey.value);
      }
    };

    // Watchers and lifecycle
    watch(selectedLayer, (newLayer) => {
      fetchLayerLayout();
    });

    watch(error, (newError) => {
      if (newError) {
        console.error(newError);
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
      isKeySelected,
      selectedKeyValue,
      selectKeyValue,
      toggleSelectAll,
      toggleMultiSelect,
      isMultiSelect,
      error,
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
  font-family: v.$font-style;

  .title {
    color: v.$primary-color;
    margin-bottom: 10px;
    margin-top: 0px;
    font-size: 1.5rem;
    margin: 0;
    margin-bottom: -5px;
    margin-right: 10px;
    font-weight: 400;
  }

  .controls {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-top: 10px;
    margin-bottom: 24px;
    flex-wrap: wrap;

    label {
      margin-right: 10px;
      color: v.$text-color;
      font-size: 1rem;
      font-family: v.$font-style;
    }

    select {
      padding: 4px 6px;
      border-radius: v.$border-radius;
      background-color: v.$background-dark;
      color: v.$text-color;
      border: v.$border-style;
      font-size: 0.9rem;
      text-align: center;
      font-family: v.$font-style;

      &:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(v.$accent-color, 0.3);
      }
    }

    .action-btn {
      padding: 8px 16px;
      width: 150px;
      background-color: color.adjust(v.$background-dark, $lightness: -100%);
      color: v.$primary-color;
      border: v.$border-style;
      border-radius: v.$border-radius;
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

      &.secondary {
        color: v.$accent-color;
      }

      &.secondary:hover:not(:disabled) {
        background-color: color.adjust(v.$background-dark, $lightness: 10%);
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

  .mapping-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
    margin-bottom: auto;
    margin-left: auto;
    margin-right: auto;
  }

  .no-layout {
    text-align: center;
    color: v.$text-color;
    font-size: 1rem;
    padding: 20px;
    font-family: v.$font-style;
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
    position: relative;

    &.drop-target {
      outline-offset: -2px;
      background-color: color.adjust(v.$background-dark, $lightness: -100%, $alpha: 0.7);
    }

    &.selected {
      border-color: v.$accent-color;
      box-shadow: 0 0 8px rgba(v.$accent-color, 0.5);
    }

    .key-label {
      position: absolute;
      top: 2px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 1rem;
      font-weight: 300;
    }
  }

  .key-config {
    position: relative;
    margin-top: -50px;
    margin-bottom: auto;
    padding-top: 5px;
    display: flex;
    flex-direction: column;
    width: 1156px;
    align-self: center;
    gap: 10px;
    flex: 0 0 auto;

    .hint-text {
      color: rgba(v.$text-color, 0.6);
      font-size: 0.9rem;
      margin-bottom: 8px;
      font-family: v.$font-style;
      font-weight: 300;
    }

    label {
      margin-right: 10px;
      color: v.$text-color;
      font-size: 1rem;
      font-family: v.$font-style;
    }

    select {
      padding: 4px 6px;
      margin-left: 1px;
      border-radius: v.$border-radius;
      background-color: v.$background-dark;
      color: v.$text-color;
      border: v.$border-style;
      font-size: 0.9rem;
      text-align: center;
      width: 200px;
      font-family: v.$font-style;

      &:focus {
        outline: none;
        box-shadow: 0 0 0 2px rgba(v.$accent-color, 0.3);
      }
    }

    .virtual-keys-window {
      display: flex;
      flex-direction: column;
      padding: 10px;
      margin-top: 30px;
      align-self: center;
      border: v.$border-style;
      border-radius: v.$border-radius;
      background-color: color.adjust(v.$background-dark, $lightness: -100%);
      font-family: v.$font-style;

      .virtual-keys {
        display: grid;
        width: fit-content;
        grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
        gap: 3px;
        padding: 8px;
        max-height: 500px;
        max-width: 1000px;
        overflow: hidden;
      }

      .virtual-key {
        padding: 8px;
        border: v.$border-style;
        border-radius: v.$border-radius;
        background-color: v.$background-dark;
        color: v.$text-color;
        text-align: center;
        height: 48px;
        width: 50px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: v.$font-style;
        font-weight: 300;

        &:hover {
          background-color: color.adjust(v.$background-dark, $lightness: 8%);
          border-color: v.$accent-color;
        }

        &.key-selected {
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