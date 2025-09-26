<template>
  <div class="macros-page">
    <h2>Macro Editor</h2>
    <div class="controls">
      <label for="macro-select">Select Macro:</label>
      <select v-model="selectedMacro" id="macro-select">
        <option v-for="macro in macros" :key="macro" :value="macro">M{{ macro }}</option>
      </select>
      <button @click="createNewMacro" class="action-btn">New Macro</button>
      <button @click="clearMacro" class="action-btn" :disabled="!selectedMacro">Clear Macro</button>
    </div>
    <div class="macro-editor">
      <div v-if="layout.length && loaded" class="key-grid" :style="gridStyle">
        <div v-for="(row, rIdx) in layout" :key="`r-${rIdx}`" class="key-row">
          <div
            v-for="(keyInfo, cIdx) in row"
            :key="`k-${rIdx}-${cIdx}`"
            class="key-btn"
            :style="getKeyStyle(rIdx, cIdx)"
            :class="{ 'pressed': isKeyPressed(keyInfo.keyValue) }"
            @click="toggleKey(keyInfo.keyValue)"
          >
            {{ keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}` }}
          </div>
        </div>
      </div>
      <div class="macro-sequence">
        <h3>Current Sequence</h3>
        <div v-if="currentSequence.length" class="sequence-list">
          <div v-for="(event, index) in currentSequence" :key="index" class="sequence-item">
            {{ formatEvent(event) }}
            <button @click="removeEventFromSequence(index)" class="remove-btn">×</button>
          </div>
        </div>
        <p v-else>No events in sequence</p>
      </div>
      <div class="macro-actions">
        <button @click="saveMacro" class="action-btn" :disabled="!currentSequence.length">Save Macro</button>
        <button @click="assignMacroToKey" class="action-btn" :disabled="!selectedMacro">Assign to Key</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import KeyboardService from '@services/KeyboardService';
import { keyMap } from '@utils/keyMap';
import { getLayoutConfig } from '@utils/layoutConfigs';
import type { IDefKeyInfo } from '../types/types';

export default defineComponent({
  name: 'Macros',
  setup() {
    const macros = Array.from({ length: 23 }, (_, i) => i); // M0-M22
    const selectedMacro = ref<number | null>(null);
    const layout = ref<IDefKeyInfo[][]>([]);
    const baseLayout = ref<IDefKeyInfo[][] | null>(null);
    const loaded = ref(false);
    const currentSequence = ref<{ key: number; action: 'down' | 'up' }[]>([]);
    const pressedKeys = ref<Set<number>>(new Set()); // Track pressed keys

    const gridStyle = computed(() => {
      if (!baseLayout.value) {
        return { height: '0px', width: '0px' };
      }
      const totalKeys = baseLayout.value.flat().length;
      const { keyPositions, gaps } = getLayoutConfig(totalKeys, baseLayout.value);
      if (!keyPositions || keyPositions.length === 0) {
        return { height: '0px', width: '0px' };
      }
      const containerHeight = keyPositions.reduce(
        (max, row, i) => max + Math.max(...row.map(pos => pos[1] + pos[3])) + (gaps[i] || 0),
        0
      );
      const maxRowWidth = Math.max(...keyPositions.map(row => row.reduce((sum, pos) => sum + pos[2], 0)));
      return {
        position: 'relative',
        height: `${containerHeight}px`,
        width: `${maxRowWidth}px`,
        margin: '0 auto',
      };
    });

    const getKeyStyle = (rowIdx: number, colIdx: number) => {
      if (!baseLayout.value) {
        return { width: '0px', height: '0px', left: '0px', top: '0px' };
      }
      const totalKeys = baseLayout.value.flat().length;
      const { keyPositions, gaps } = getLayoutConfig(totalKeys, baseLayout.value);
      const rowLength = baseLayout.value[rowIdx]?.length || 0;
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
        boxSizing: 'border-box',
      LaTeX
    };

    const isKeyPressed = (keyValue: number) => {
      return pressedKeys.value.has(keyValue);
    };

    const toggleKey = (keyValue: number) => {
      if (pressedKeys.value.has(keyValue)) {
        currentSequence.value.push({ key: keyValue, action: 'up' });
        pressedKeys.value.delete(keyValue);
      } else {
        currentSequence.value.push({ key: keyValue, action: 'down' });
        pressedKeys.value.add(keyValue);
      }
    };

    const formatEvent = (event: { key: number; action: 'down' | 'up' }) => {
      return `${keyMap[event.key] || `Key ${event.key}`} ${event.action}`;
    };

    const removeEventFromSequence = (index: number) => {
      const event = currentSequence.value[index];
      if (event.action === 'down') {
        pressedKeys.value.delete(event.key);
      } else {
        pressedKeys.value.add(event.key);
      }
      currentSequence.value.splice(index, 1);
    };

    const createNewMacro = () => {
      selectedMacro.value = macros.find(m => !currentSequence.value.length) || 0;
      currentSequence.value = [];
      pressedKeys.value.clear();
    };

    const clearMacro = () => {
      currentSequence.value = [];
      pressedKeys.value.clear();
    };

    const saveMacro = () => {
      // Placeholder for saving macro to KeyboardService
      console.log('Saving macro:', selectedMacro.value, currentSequence.value);
    };

    const assignMacroToKey = () => {
      // Placeholder for assigning macro to a key
      console.log('Assigning macro:', selectedMacro.value);
    };

    const fetchLayout = async () => {
      try {
        const layoutData = await KeyboardService.defKey();
        layout.value = layoutData;
        baseLayout.value = layoutData;
        loaded.value = true;
      } catch (error) {
        console.error('Failed to fetch layout:', error);
      }
    };

    onMounted(() => {
      fetchLayout();
    });

    return {
      macros,
      selectedMacro,
      layout,
      baseLayout,
      loaded,
      currentSequence,
      pressedKeys,
      keyMap,
      gridStyle,
      getKeyStyle,
      isKeyPressed,
      toggleKey,
      formatEvent,
      removeEventFromSequence,
      createNewMacro,
      clearMacro,
      saveMacro,
      assignMacroToKey,
    };
  },
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@styles/variables' as v;

.macros-page {
  padding: 20px;
  color: v.$text-color;

  h2 {
    color: v.$primary-color;
    margin-bottom: 10px;
  }

  h3 {
    color: v.$primary-color;
    margin-bottom: 8px;
    font-size: 1.2rem;
  }

  .controls {
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 10px;

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

    .action-btn {
      padding: 8px 16px;
      background-color: v.$primary-color;
      color: v.$background-dark;
      border: none;
      border-radius: v.$border-radius;
      cursor: pointer;
      font-size: 1rem;

      &:disabled {
        background-color: color.adjust(v.$background-dark, $lightness: 10%);
        cursor: not-allowed;
      }

      &:hover:not(:disabled) {
        background-color: color.adjust(v.$primary-color, $lightness: 10%);
      }
    }
  }

  .macro-editor {
    display: flex;
    flex-direction: column;
    gap: 15px;
    max-height: calc(100vh - 150px);
    overflow-y: auto;
  }

  .key-grid {
    display: block;
    position: relative;
    width: fit-content;
    margin: 0 auto;
    min-height: 300px;
    max-height: 500px;
    flex: 0 0 auto;
  }

  .key-row {
    display: contents;
  }

  .key-btn {
    position: absolute;
    padding: 4px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: v.$border-radius;
    background: linear-gradient(to bottom, v.$background-dark 70%, color.adjust(v.$background-dark, $lightness: 10%) 100%);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), inset 0 -2px 4px rgba(255, 255, 255, 0.2);
    color: v.$text-color;
    cursor: pointer;
    transition: all 0.2s ease;
    box-sizing: border-box;
    user-select: none;
    text-align: center;

    &.pressed {
      background: linear-gradient(to bottom, v.$accent-color 70%, color.adjust(v.$accent-color, $lightness: 10%) 100%);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4), inset 0 -2px 4px rgba(255, 255, 255, 0.3);
    }

    &:hover {
      background: linear-gradient(to bottom, color.adjust(v.$background-dark, $lightness: 5%) 70%, color.adjust(v.$background-dark, $lightness: 15%) 100%);
      box-shadow: 0 3px 5px rgba(0, 0, 0, 0.4), inset 0 -2px 4px rgba(255, 255, 255, 0.3);
    }
  }

  .macro-sequence {
    padding: 10px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: v.$border-radius;
    background-color: color.adjust(v.$background-dark, $lightness: -2%);

    .sequence-list {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;

      .sequence-item {
        display: flex;
        align-items: center;
        padding: 5px 10px;
        background-color: v.$background-dark;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: v.$border-radius;
        color: v.$text-color;

        .remove-btn {
          margin-left: 8px;
          padding: 0 6px;
          background-color: color.adjust(v.$background-dark, $lightness: 10%);
          border: none;
          border-radius: v.$border-radius;
          color: v.$text-color;
          cursor: pointer;

          &:hover {
            background-color: color.adjust(v.$background-dark, $lightness: 20%);
          }
        }
      }
    }
  }

  .macro-actions {
    display: flex;
    gap: 10px;

    .action-btn {
      padding: 8px 16px;
      background-color: v.$primary-color;
      color: v.$background-dark;
      border: none;
      border-radius: v.$border-radius;
      cursor: pointer;
      font-size: 1rem;

      &:disabled {
        background-color: color.adjust(v.$background-dark, $lightness: 10%);
        cursor: not-allowed;
      }

      &:hover:not(:disabled) {
        background-color: color.adjust(v.$primary-color, $lightness: 10%);
      }
    }
  }
}
</style>