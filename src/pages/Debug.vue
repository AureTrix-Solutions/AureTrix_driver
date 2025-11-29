<template>
  <div class="debug-page">
    <h2 class="title">Key Debug</h2>

    <div class="debug-container">
      <div v-if="layout.length && loaded" class="key-grid" :style="gridStyle">
        <div v-for="(row, rIdx) in layout" :key="`r-${rIdx}`" class="key-row">
          <div v-for="(keyInfo, cIdx) in row" :key="`k-${rIdx}-${cIdx}`" class="key-btn"
            :class="{ 'key-selected': isSelected(keyInfo) }"
            :style="getKeyStyle(rIdx, cIdx)" @click="selectKey(keyInfo)">
            <div class="key-label">
              {{ keyInfo.remappedLabel || keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}` }}
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-layout">
        <p>{{ error || 'No keyboard layout available. Ensure a device is connected and try again.' }}</p>
      </div>

      <div class="axis-panel">
        <h3>Axis Data</h3>
        <div v-if="!selectedKey" class="no-selection">
          Click a key to view its axis data
        </div>
        <div v-else class="axis-content">
          <div class="selected-key-info">
            <span class="key-name">{{ selectedKeyLabel }}</span>
            <span class="key-value">(Key {{ selectedKey.physicalKeyValue || selectedKey.keyValue }})</span>
            <button @click="refreshAxis" class="refresh-btn" :disabled="loading">
              {{ loading ? 'Loading...' : 'Refresh' }}
            </button>
          </div>
          <div v-if="axisError" class="axis-error">{{ axisError }}</div>
          <pre v-else class="axis-output">{{ axisData }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useMappedKeyboard } from '@utils/MappedKeyboard';
import { keyMap } from '@utils/keyMap';
import KeyboardService from '@services/KeyboardService';
import type { IDefKeyInfo } from '../types/types';

export default defineComponent({
  name: 'Debug',
  setup() {
    const { layout, loaded, gridStyle, getKeyStyle, fetchLayerLayout, error } = useMappedKeyboard(ref(0));

    const selectedKey = ref<IDefKeyInfo | null>(null);
    const axisData = ref<string>('');
    const axisError = ref<string>('');
    const loading = ref(false);

    const selectedKeyLabel = ref('');

    const isSelected = (keyInfo: IDefKeyInfo): boolean => {
      if (!selectedKey.value) return false;
      const selectedValue = selectedKey.value.physicalKeyValue || selectedKey.value.keyValue;
      const keyValue = keyInfo.physicalKeyValue || keyInfo.keyValue;
      return selectedValue === keyValue;
    };

    const selectKey = async (keyInfo: IDefKeyInfo) => {
      const keyValue = keyInfo.physicalKeyValue || keyInfo.keyValue;
      const currentValue = selectedKey.value?.physicalKeyValue || selectedKey.value?.keyValue;
      
      if (currentValue === keyValue) {
        selectedKey.value = null;
        axisData.value = '';
        axisError.value = '';
        return;
      }

      selectedKey.value = keyInfo;
      selectedKeyLabel.value = keyInfo.remappedLabel || keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}`;
      await fetchAxisData(keyValue);
    };

    const fetchAxisData = async (keyValue: number) => {
      loading.value = true;
      axisError.value = '';
      axisData.value = '';

      try {
        const result = await KeyboardService.getAxis(keyValue);
        if (result instanceof Error) {
          axisError.value = result.message;
        } else {
          axisData.value = JSON.stringify(result, null, 2);
        }
      } catch (err) {
        axisError.value = (err as Error).message;
      } finally {
        loading.value = false;
      }
    };

    const refreshAxis = async () => {
      if (!selectedKey.value) return;
      const keyValue = selectedKey.value.physicalKeyValue || selectedKey.value.keyValue;
      await fetchAxisData(keyValue);
    };

    onMounted(() => {
      fetchLayerLayout();
    });

    return {
      layout,
      loaded,
      gridStyle,
      getKeyStyle,
      error,
      keyMap,
      selectedKey,
      selectedKeyLabel,
      axisData,
      axisError,
      loading,
      isSelected,
      selectKey,
      refreshAxis
    };
  }
});
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@styles/variables' as v;

.debug-page {
  padding: 20px;
  color: v.$text-color;

  .title {
    color: v.$primary-color;
    margin-bottom: 20px;
    font-size: 1.5rem;
    font-weight: 600;
    font-family: v.$font-style;
  }
}

.debug-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.key-grid {
  display: block !important;
  position: relative;
  width: fit-content;
  margin: 0 auto;
  min-height: 300px;
  max-height: 500px;
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

  .key-label {
    font-size: 1rem;
    font-weight: 300;
  }

  &.key-selected {
    border-color: v.$accent-color;
    box-shadow: 0 0 8px rgba(v.$accent-color, 0.5);
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(255, 255, 255, 0.2);
  }
}

.no-layout {
  text-align: center;
  color: v.$text-color;
  font-size: 1rem;
  font-family: v.$font-style;
  padding: 20px;
}

.axis-panel {
  border: 1px solid rgba(v.$text-color, 0.2);
  border-radius: v.$border-radius;
  background-color: color.adjust(v.$background-dark, $lightness: -100%);
  padding: 15px 20px;

  h3 {
    color: v.$primary-color;
    margin: 0 0 15px 0;
    font-size: 1.2rem;
    font-weight: 400;
    font-family: v.$font-style;
  }
}

.no-selection {
  color: rgba(v.$text-color, 0.6);
  font-style: italic;
  font-family: v.$font-style;
}

.axis-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.selected-key-info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-family: v.$font-style;
}

.key-name {
  font-size: 1.1rem;
  font-weight: 500;
  color: v.$accent-color;
}

.key-value {
  color: rgba(v.$text-color, 0.7);
  font-size: 0.9rem;
}

.refresh-btn {
  margin-left: auto;
  padding: 6px 14px;
  background-color: color.adjust(v.$background-dark, $lightness: -100%);
  color: v.$accent-color;
  border: v.$border-style;
  border-radius: v.$border-radius;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-family: v.$font-style;

  &:hover:not(:disabled) {
    background-color: color.adjust(v.$background-dark, $lightness: 10%);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.axis-output {
  background: rgba(v.$background-dark, 0.5);
  border: 1px solid rgba(v.$text-color, 0.1);
  border-radius: v.$border-radius;
  padding: 15px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.85rem;
  color: v.$text-color;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 400px;
  overflow-y: auto;
  margin: 0;
}

.axis-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: v.$border-radius;
  padding: 15px;
  color: #ef4444;
  font-size: 0.9rem;
  font-family: v.$font-style;
}
</style>
