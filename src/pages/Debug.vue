<template>
  <div class="debug-page">
    <h2 class="title">Debug Raw Keyboard Data</h2>
    <div v-if="notification" class="notification" :class="{ error: notification.isError }">
      <span>{{ notification.message }}</span>
      <button @click="notification = null" class="dismiss-btn">&times;</button>
    </div>
    <div class="debug-container">
      <div v-if="layout.length && loaded" class="key-grid" :style="gridStyle">
        <div v-for="(row, rIdx) in layout" :key="`r-${rIdx}`" class="key-row">
          <div
            v-for="(keyInfo, cIdx) in row"
            :key="`k-${rIdx}-${cIdx}`"
            class="key-btn"
            :class="{ 'debug-key-selected': loaded && selectedKey?.keyValue === keyInfo.keyValue }"
            :style="getKeyStyle(rIdx, cIdx)"
            @click="selectKey(keyInfo, rIdx, cIdx)"
          >
            {{ keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}` }}
          </div>
        </div>
      </div>
      <div v-else class="no-layout">
        <p>{{ error || 'No keyboard layout available. Ensure a device is connected and try again.' }}</p>
        <p>Debug: layout.length={{ layout.length }}, loaded={{ loaded }}, baseLayout={{ baseLayout?.value ? 'defined' : 'null' }}</p>
      </div>
      <details class="debug-window" open>
        <summary>Getter Controls & Results (Click to toggle)</summary>
        <div class="debug-content">
          <div class="getter-buttons">
            <button @click="clearData" class="clear-btn">Clear Data</button>
            <button @click="fetchAllData" class="refresh-btn" :disabled="isLoading">All Getters</button>
            <button @click="() => fetchMethod('getGlobalTouchTravel')" class="getter-btn" :disabled="isLoading || !selectedKey">Global Travel</button>
            <button @click="() => fetchMethod('getPerformanceMode')" class="getter-btn" :disabled="isLoading || !selectedKey">Perf Mode</button>
            <button @click="() => fetchMethod('getDksTravel')" class="getter-btn" :disabled="isLoading || !selectedKey">DKS Travel</button>
            <button @click="() => fetchMethod('getDbTravel')" class="getter-btn" :disabled="isLoading || !selectedKey">DB Travel</button>
            <button @click="() => fetchMethod('getRtTravel')" class="getter-btn" :disabled="isLoading || !selectedKey">RT Travel</button>
            <button @click="() => fetchMethod('getSingleTravel')" class="getter-btn" :disabled="isLoading || !selectedKey">Single Travel</button>
            <button @click="() => fetchMethod('getDpDr')" class="getter-btn" :disabled="isLoading || !selectedKey">DP/DR</button>
            <button @click="() => fetchMethod('getAxis')" class="getter-btn" :disabled="isLoading || !selectedKey">Axis</button>
            <button @click="() => fetchMethod('getAxisList')" class="getter-btn" :disabled="isLoading">Axis List</button>
            <button @click="() => fetchMethod('getLighting')" class="getter-btn" :disabled="isLoading">Lighting</button>
            <button @click="() => fetchMethod('getLogoLighting')" class="getter-btn" :disabled="isLoading">Logo Lighting</button>
            <button @click="() => fetchMethod('getCustomLighting')" class="getter-btn" :disabled="isLoading || !selectedKey">Custom Lighting</button>
            <button @click="() => fetchMethod('getSpecialLighting')" class="getter-btn" :disabled="isLoading">Special Lighting</button>
            <button @click="() => fetchMethod('getRm6x21Travel')" class="getter-btn" :disabled="isLoading">RM6x21 Travel</button>
            <button @click="() => fetchMethod('getRm6x21Calibration')" class="getter-btn" :disabled="isLoading">RM6x21 Calibration</button>
          </div>
          <div class="test-buttons">
            <button @click="setSingleMode" class="test-btn" :disabled="isLoading || !selectedKey">Set Single Mode</button>
            <button @click="setGlobalMode" class="test-btn" :disabled="isLoading || !selectedKey">Set Global Mode</button>
          </div>
          <div class="export-section">
            <label for="export-filename">Export Filename:</label>
            <input id="export-filename" v-model="exportFilename" placeholder="debug-config.json" class="filename-input" />
            <button @click="exportConfig" class="test-btn" :disabled="isLoading">Export Config</button>
          </div>
          <div v-if="isLoading" class="loading">Loading...</div>
          <div v-else class="data-sections">
            <div v-for="(data, method) in rawData" :key="method" class="data-section">
              <h4>{{ method.replace(/([A-Z])/g, ' $1').toUpperCase() }}</h4>
              <pre>{{ JSON.stringify(data, null, 2) }}</pre>
            </div>
          </div>
          <div v-if="error" class="error">{{ error }}</div>
        </div>
      </details>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted } from 'vue';
import { useMappedKeyboard } from '@utils/MappedKeyboard';
import { keyMap } from '@utils/keyMap';
import type { IDefKeyInfo } from '../types/types';
import debugKeyboardService from '@services/DebugKeyboardService';
import KeyboardService from '@services/KeyboardService';

export default defineComponent({
  name: 'Debug',
  setup() {
    const selectedKey = ref<IDefKeyInfo | null>(null);
    const notification = ref<{ message: string; isError: boolean } | null>(null);
    const rawData = ref<{ [key: string]: any }>({});
    const isLoading = ref(false);
    const error = ref<string | null>(null);
    const exportFilename = ref('debug-config.json');

    const { layout, loaded, gridStyle, getKeyStyle, fetchLayerLayout, baseLayout, error: layoutError } = useMappedKeyboard(ref(0));

    const fetchMethod = async (method: string) => {
      if (!selectedKey.value && method !== 'getGlobalTouchTravel' && method !== 'getAxisList' && method !== 'getLighting' && method !== 'getLogoLighting' && method !== 'getSpecialLighting' && method !== 'getRm6x21Travel' && method !== 'getRm6x21Calibration') {
        error.value = 'Select a key first';
        return;
      }
      isLoading.value = true;
      error.value = null;
      const keyValue = selectedKey.value?.keyValue || 1;
      try {
        let result: any;
        switch (method) {
          case 'getGlobalTouchTravel':
            result = await debugKeyboardService.getGlobalTouchTravel();
            break;
          case 'getPerformanceMode':
            result = await debugKeyboardService.getPerformanceMode(keyValue);
            break;
          case 'getDksTravel':
            result = await debugKeyboardService.getDksTravel(keyValue, 'Layout_DB1');
            break;
          case 'getDbTravel':
            result = await debugKeyboardService.getDbTravel(keyValue, 'Layout_DB1');
            break;
          case 'getRtTravel':
            result = await debugKeyboardService.getRtTravel(keyValue);
            break;
          case 'getSingleTravel':
            result = await debugKeyboardService.getSingleTravel(keyValue);
            break;
          case 'getDpDr':
            result = await debugKeyboardService.getDpDr(keyValue);
            break;
          case 'getAxis':
            result = await debugKeyboardService.getAxis(keyValue);
            break;
          case 'getAxisList':
            result = await debugKeyboardService.getAxisList();
            break;
          case 'getLighting':
            result = await debugKeyboardService.getLighting();
            break;
          case 'getLogoLighting':
            result = await debugKeyboardService.getLogoLighting();
            break;
          case 'getCustomLighting':
            result = await debugKeyboardService.getCustomLighting(keyValue);
            break;
          case 'getSpecialLighting':
            result = await debugKeyboardService.getSpecialLighting();
            break;
          case 'getRm6x21Travel':
            result = await debugKeyboardService.getRm6x21Travel();
            break;
          case 'getRm6x21Calibration':
            result = await debugKeyboardService.getRm6x21Calibration();
            break;
          default:
            throw new Error(`Unknown method: ${method}`);
        }
        rawData.value[method] = result;
        console.log(`Debug fetched ${method} for key ${keyValue}:`, result);
      } catch (err) {
        error.value = `Error in ${method}: ${(err as Error).message}`;
        console.error(`Debug ${method} failed:`, err);
      } finally {
        isLoading.value = false;
      }
    };

    const fetchAllData = async () => {
      isLoading.value = true;
      error.value = null;
      const keyValue = selectedKey.value?.keyValue || 1;
      try {
        await Promise.all([
          fetchMethod('getGlobalTouchTravel'),
          fetchMethod('getPerformanceMode'),
          fetchMethod('getDksTravel'),
          fetchMethod('getDbTravel'),
          fetchMethod('getRtTravel'),
          fetchMethod('getSingleTravel'),
          fetchMethod('getDpDr'),
          fetchMethod('getAxis'),
          fetchMethod('getAxisList'),
          fetchMethod('getLighting'),
          fetchMethod('getLogoLighting'),
          fetchMethod('getCustomLighting'),
          fetchMethod('getSpecialLighting'),
          fetchMethod('getRm6x21Travel'),
          fetchMethod('getRm6x21Calibration'),
        ]);
      } catch (err) {
        error.value = `Batch fetch error: ${(err as Error).message}`;
      } finally {
        isLoading.value = false;
      }
    };

    const clearData = () => {
      rawData.value = {};
      error.value = null;
      console.log('Debug data cleared');
    };

    const selectKey = (key: IDefKeyInfo, rowIdx: number, colIdx: number) => {
      console.log(`Debug: Selecting key: { keyValue: ${key.keyValue}, type: ${typeof key.keyValue}, location: { row: ${rowIdx}, col: ${colIdx} } }`);
      selectedKey.value = key;
      console.log(`Debug: selectedKey updated:`, selectedKey.value);
    };

    watch(selectedKey, () => {
      if (selectedKey.value) rawData.value = {}; // Clear previous data on key change
    });

    const setSingleMode = async () => {
      if (!selectedKey.value) {
        error.value = 'No key selected for mode test';
        return;
      }
      try {
        const result = await KeyboardService.setPerformanceMode(selectedKey.value.keyValue, 'single', 0);
        console.log('Debug set single mode result:', result);
        await fetchMethod('getPerformanceMode');
      } catch (error) {
        console.error('Debug: Failed to set single mode:', error);
        error.value = `Set single mode failed: ${(error as Error).message}`;
      }
    };

    const setGlobalMode = async () => {
      if (!selectedKey.value) {
        error.value = 'No key selected for mode test';
        return;
      }
      try {
        const result = await KeyboardService.setPerformanceMode(selectedKey.value.keyValue, 'global', 0);
        console.log('Debug set global mode result:', result);
        await fetchMethod('getPerformanceMode');
      } catch (error) {
        console.error('Debug: Failed to set global mode:', error);
        error.value = `Set global mode failed: ${(error as Error).message}`;
      }
    };

    const exportConfig = async () => {
      isLoading.value = true;
      error.value = null;
      try {
        await debugKeyboardService.exportEncryptedJSON(exportFilename.value);
        notification.value = { message: `Successfully exported ${exportFilename.value}`, isError: false };
        console.log('Debug: Config exported');
      } catch (err) {
        error.value = `Export failed: ${(err as Error).message}`;
        console.error('Debug: Export config failed:', err);
      } finally {
        isLoading.value = false;
      }
    };

    onMounted(async () => {
      console.log('Debug page mounted, calling fetchLayerLayout');
      await fetchLayerLayout();
      
      // Initialize debug service connection
      try {
        await debugKeyboardService.autoConnect();
        console.log('Debug service connected successfully');
      } catch (error) {
        console.warn('Debug auto-connect failed, prompting user:', error);
        try {
          await debugKeyboardService.requestDevice();
          console.log('Debug service connected via user prompt');
        } catch (promptError) {
          console.error('Debug connection failed:', promptError);
          error.value = `Debug connection failed: ${(promptError as Error).message}`;
        }
      }
      
      // Initial data fetch after connection
      setTimeout(fetchAllData, 500);
    });

    const setNotification = (message: string, isError: boolean) => {
      notification.value = { message, isError };
    };

    return {
      layout,
      loaded,
      gridStyle,
      getKeyStyle,
      keyMap,
      selectKey,
      selectedKey,
      notification,
      setNotification,
      rawData,
      isLoading,
      error,
      fetchAllData,
      fetchMethod,
      clearData,
      setSingleMode,
      setGlobalMode,
      exportConfig,
      exportFilename,
      layoutError,
      baseLayout,
    };
  },
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
    font-weight: 700;
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

.debug-container {
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
  visibility: visible !important;
  z-index: 2;

  &.debug-key-selected {
    border-color: v.$accent-color;
    box-shadow: 0 0 8px rgba(v.$accent-color, 0.5);
  }
}

.debug-window {
  margin-top: 20px;
  border: 1px solid rgba(v.$text-color, 0.2);
  border-radius: v.$border-radius;
  background-color: rgba(v.$background-dark, 0.5);

  summary {
    padding: 10px;
    cursor: pointer;
    font-weight: bold;
    color: v.$accent-color;
  }

  .debug-content {
    padding: 10px;

    .getter-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-bottom: 10px;

      .refresh-btn {
        padding: 5px 10px;
        background-color: v.$primary-color;
        color: v.$background-dark;
        border: none;
        border-radius: v.$border-radius;
        cursor: pointer;

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      .getter-btn {
        padding: 5px 8px;
        background-color: v.$accent-color;
        color: v.$background-dark;
        border: none;
        border-radius: v.$border-radius;
        cursor: pointer;
        font-size: 0.8rem;

        &:hover:not(:disabled) {
          background-color: color.adjust(v.$accent-color, $lightness: 10%);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }
    }

    .test-buttons {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    }

    .export-section {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;

      label {
        color: v.$text-color;
        font-size: 0.9rem;
      }

      .filename-input {
        padding: 5px 8px;
        border: 1px solid rgba(v.$text-color, 0.3);
        border-radius: v.$border-radius;
        background-color: rgba(v.$background-dark, 0.5);
        color: v.$text-color;
        font-size: 0.9rem;
      }
    }

    .clear-btn {
      padding: 5px 10px;
      background-color: #6b7280;
      color: white;
      border: none;
      border-radius: v.$border-radius;
      cursor: pointer;

      &:hover {
        background-color: color.adjust(#6b7280, $lightness: 10%);
      }
    }

    .test-btn {
      padding: 5px 10px;
      background-color: #6b7280;
      color: white;
      border: none;
      border-radius: v.$border-radius;
      cursor: pointer;

      &:hover:not(:disabled) {
        background-color: color.adjust(#6b7280, $lightness: 10%);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .loading {
      color: v.$text-color;
      text-align: center;
    }

    .data-sections {
      display: flex;
      flex-direction: column;
      gap: 15px;
      max-height: 400px;
      overflow-y: auto;

      .data-section {
        h4 {
          color: v.$primary-color;
          margin: 0 0 5px 0;
          font-size: 0.9rem;
        }

        pre {
          background-color: rgba(0, 0, 0, 0.3);
          padding: 10px;
          border-radius: v.$border-radius;
          font-size: 0.8rem;
          color: v.$text-color;
          margin: 0;
          overflow-x: auto;
        }
      }
    }

    .error {
      color: #ef4444;
      text-align: center;
      padding: 10px;
      background-color: rgba(239, 68, 68, 0.1);
      border-radius: v.$border-radius;
    }
  }
}
</style>