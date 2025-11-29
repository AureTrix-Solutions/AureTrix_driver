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
.debug-page {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
}

.debug-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.key-grid {
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1rem;
  overflow-x: auto;
}

.key-row {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
}

.key-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border: 2px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  min-height: 40px;

  &:hover {
    background: var(--bg-hover);
    border-color: var(--accent-color);
  }

  &.key-selected {
    background: var(--accent-color);
    border-color: var(--accent-color);

    .key-label {
      color: #fff;
    }
  }
}

.key-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-primary);
  text-align: center;
  padding: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-layout {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 3rem;
  text-align: center;
  color: var(--text-secondary);
}

.axis-panel {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 1.5rem;

  h3 {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--text-primary);
  }
}

.no-selection {
  color: var(--text-secondary);
  font-style: italic;
  padding: 1rem 0;
}

.axis-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.selected-key-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.key-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--accent-color);
}

.key-value {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.refresh-btn {
  margin-left: auto;
  padding: 0.5rem 1rem;
  background: var(--accent-color);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s ease;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.axis-output {
  background: var(--bg-tertiary);
  border-radius: 8px;
  padding: 1rem;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.85rem;
  color: var(--text-primary);
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
  border-radius: 8px;
  padding: 1rem;
  color: #ef4444;
  font-size: 0.9rem;
}
</style>
