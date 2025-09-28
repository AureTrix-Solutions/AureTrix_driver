<template>
  <div class="performance-page">
    <h2 class="title">Performance Settings</h2>
    <div class="controls">
      <label for="section-select">Section: </label>
      <select v-model="selectedSection" id="section-select" @change="updateOverlay">
        <option value="global-travel">Global Travel</option>
        <option value="single-key-travel">Single Key Travel</option>
        <option value="rapid-trigger">Rapid Trigger</option>
        <option value="dead-zones">Dead Zones</option>
        <option value="polling-rate">Polling Rate</option>
        <option value="calibration">Calibration</option>
        <option value="switch-settings">Switch Settings</option>
      </select>
    </div>
    <div v-if="notification" class="notification" :class="{ error: notification.isError }">
      <span>{{ notification.message }}</span>
      <button @click="notification = null" class="dismiss-btn">&times;</button>
    </div>
    <div class="performance-container">
      <div v-if="layout.length && loaded" class="key-grid" :style="gridStyle">
        <div v-for="(row, rIdx) in layout" :key="`r-${rIdx}`" class="key-row">
          <div
            v-for="(keyInfo, cIdx) in row"
            :key="`k-${rIdx}-${cIdx}`"
            class="key-btn"
            :class="{ selected: loaded && selectedKey?.value?.keyValue === keyInfo.keyValue && selectedSection === 'single-key-travel' }"
            :style="getKeyStyle(rIdx, cIdx)"
            @click="selectKey(keyInfo)"
          >
            {{ keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}` }}
            <div v-if="overlayData[keyInfo.keyValue]" class="overlay" :class="{ 'single-travel': selectedSection === 'single-key-travel' }">
              {{ overlayData[keyInfo.keyValue] }}
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-layout">
        <p>No keyboard layout available. Ensure a device is connected and try again.</p>
      </div>
      <div class="settings-panel">
        <div v-if="selectedSection === 'global-travel'" class="settings-section">
          <h3>Global Travel</h3>
          <div class="input-group">
            <label for="global-travel-input">Trigger Travel (mm):</label>
            <input
              type="number"
              v-model.number="globalTravel"
              id="global-travel-input"
              min="0.1"
              max="4.0"
              step="0.1"
              placeholder="Enter travel (0.1 - 4.0 mm)"
              class="text-input"
            />
            <button @click="saveGlobalTravel" class="action-btn" :disabled="!globalTravel || globalTravel < 0.1 || globalTravel > 4.0">
              Save
            </button>
          </div>
        </div>
        <div v-else-if="selectedSection === 'single-key-travel'" class="settings-section">
          <h3>Single Key Travel</h3>
          <p v-if="!loaded || !selectedKey?.value">Select a key to configure its travel</p>
          <div v-if="loaded && selectedKey?.value" class="input-group">
            <label for="single-key-travel-input">Trigger Travel for {{ keyMap[selectedKey.value.keyValue] || `Key ${selectedKey.value.keyValue}` }} (mm):</label>
            <input
              type="number"
              v-model.number="singleKeyTravel"
              id="single-key-travel-input"
              min="0.1"
              max="4.0"
              step="0.1"
              placeholder="Enter travel (0.1 - 4.0 mm)"
              class="text-input"
            />
            <button @click="saveSingleKeyTravel" class="action-btn" :disabled="!singleKeyTravel || singleKeyTravel < 0.1 || singleKeyTravel > 4.0">
              Save
            </button>
          </div>
        </div>
        <div v-else-if="selectedSection === 'rapid-trigger'" class="settings-section">
          <h3>Rapid Trigger</h3>
          <!-- Placeholder for rapid trigger settings -->
        </div>
        <div v-else-if="selectedSection === 'dead-zones'" class="settings-section">
          <h3>Dead Zones</h3>
          <!-- Placeholder for dead zone settings -->
        </div>
        <div v-else-if="selectedSection === 'polling-rate'" class="settings-section">
          <h3>Polling Rate</h3>
          <!-- Placeholder for polling rate settings -->
        </div>
        <div v-else-if="selectedSection === 'calibration'" class="settings-section">
          <h3>Calibration</h3>
          <!-- Placeholder for calibration controls -->
        </div>
        <div v-else-if="selectedSection === 'switch-settings'" class="settings-section">
          <h3>Switch Settings</h3>
          <!-- Placeholder for switch settings -->
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted } from 'vue';
import KeyboardService from '@services/KeyboardService';
import { keyMap } from '@utils/keyMap';
import { useMappedKeyboard } from '@utils/MappedKeyboard';
import type { IDefKeyInfo } from '../types/types';
import { useConnectionStore } from '../store/connection';

export default defineComponent({
  name: 'Performance',
  setup() {
    console.log('Performance.vue setup started');
    const connectionStore = useConnectionStore();
    const selectedSection = ref('global-travel');
    const overlayData = ref<{ [key: number]: string }>({});
    const selectedKey = ref<IDefKeyInfo | null>(null);
    const globalTravel = ref<number | null>(null);
    const singleKeyTravel = ref<number | null>(null);
    const notification = ref<{ message: string; isError: boolean } | null>(null);

    // Debug useMappedKeyboard availability
    if (!useMappedKeyboard) {
      console.error('useMappedKeyboard is undefined');
    } else {
      console.log('useMappedKeyboard is defined');
    }

    // Use MappedKeyboard composable for layer 0
    const { layout, loaded, gridStyle, getKeyStyle, fetchLayerLayout } = useMappedKeyboard(0);

    const fetchGlobalTravel = async () => {
      if (!connectionStore.isConnected) return;
      try {
        const globalData = await KeyboardService.getGlobalTouchTravel();
        if (globalData && typeof globalData.globalTouchTravel === 'number') {
          globalTravel.value = globalData.globalTouchTravel / 1000; // Convert from SDK units
        }
      } catch (error) {
        console.error('Failed to fetch global travel:', error);
        notification.value = { message: `Failed to fetch global travel: ${(error as Error).message}`, isError: true };
      }
    };

    const saveGlobalTravel = async () => {
      if (!globalTravel.value || globalTravel.value < 0.1 || globalTravel.value > 4.0) {
        notification.value = { message: 'Please enter a valid travel value between 0.1 and 4.0 mm', isError: true };
        return;
      }
      if (!connectionStore.isConnected) {
        notification.value = { message: 'No keyboard connected', isError: true };
        return;
      }
      try {
        await KeyboardService.setDB({
          globalTouchTravel: Math.round(globalTravel.value * 1000), // Convert mm to SDK units
          pressDead: 0,
          releaseDead: 0
        });
        notification.value = { message: `Global travel set to ${globalTravel.value} mm`, isError: false };
        updateOverlay();
      } catch (error) {
        console.error('Failed to set global travel:', error);
        notification.value = { message: `Failed to set global travel: ${(error as Error).message}`, isError: true };
      }
    };

    const fetchSingleKeyTravel = async (key: number) => {
      if (!connectionStore.isConnected) return;
      try {
        const travelData = await KeyboardService.getSingleTravel(key);
        if (travelData && typeof travelData.singleTravel === 'number') {
          singleKeyTravel.value = travelData.singleTravel / 1000; // Convert from SDK units
        } else {
          singleKeyTravel.value = null;
        }
      } catch (error) {
        console.error(`Failed to fetch single key travel for key ${key}:`, error);
        notification.value = { message: `Failed to fetch travel for key ${key}: ${(error as Error).message}`, isError: true };
      }
    };

    const saveSingleKeyTravel = async () => {
      if (!selectedKey.value) {
        notification.value = { message: 'No key selected', isError: true };
        return;
      }
      if (!singleKeyTravel.value || singleKeyTravel.value < 0.1 || singleKeyTravel.value > 4.0) {
        notification.value = { message: 'Please enter a valid travel value between 0.1 and 4.0 mm', isError: true };
        return;
      }
      if (!connectionStore.isConnected) {
        notification.value = { message: 'No keyboard connected', isError: true };
        return;
      }
      try {
        await KeyboardService.setSingleTravel(selectedKey.value.keyValue, Math.round(singleKeyTravel.value * 1000));
        notification.value = { message: `Travel for key ${keyMap[selectedKey.value.keyValue] || selectedKey.value.keyValue} set to ${singleKeyTravel.value} mm`, isError: false };
        updateOverlay();
      } catch (error) {
        console.error('Failed to set single key travel:', error);
        notification.value = { message: `Failed to set single key travel: ${(error as Error).message}`, isError: true };
      }
    };

    const fetchAllSingleTravels = async () => {
      if (!connectionStore.isConnected) return;
      try {
        const travels = await Promise.all(
          layout.value.flat().map(async (keyInfo) => {
            const travelData = await KeyboardService.getSingleTravel(keyInfo.keyValue);
            return { key: keyInfo.keyValue, travel: travelData?.singleTravel ? travelData.singleTravel / 1000 : null };
          })
        );
        const newOverlayData: { [key: number]: string } = {};
        travels.forEach(({ key, travel }) => {
          if (travel !== null) {
            newOverlayData[key] = `${travel} mm`;
          }
        });
        overlayData.value = newOverlayData;
      } catch (error) {
        console.error('Failed to fetch all single key travels:', error);
        notification.value = { message: `Failed to fetch single key travels: ${(error as Error).message}`, isError: true };
      }
    };

    const selectKey = (keyInfo: IDefKeyInfo) => {
      if (selectedSection.value === 'single-key-travel') {
        selectedKey.value = keyInfo;
        fetchSingleKeyTravel(keyInfo.keyValue);
      } else {
        selectedKey.value = null;
        singleKeyTravel.value = null;
      }
      updateOverlay();
    };

    const updateOverlay = () => {
      if (selectedSection.value === 'global-travel') {
        overlayData.value = {};
      } else if (selectedSection.value === 'single-key-travel') {
        fetchAllSingleTravels();
      } else {
        overlayData.value = {};
      }
    };

    watch(selectedSection, (newSection) => {
      selectedKey.value = null;
      singleKeyTravel.value = null;
      if (newSection === 'global-travel') {
        fetchGlobalTravel();
      } else if (newSection === 'single-key-travel') {
        fetchAllSingleTravels();
      }
      updateOverlay();
    });

    onMounted(async () => {
      await fetchLayerLayout();
      if (selectedSection.value === 'global-travel') {
        await fetchGlobalTravel();
      } else if (selectedSection.value === 'single-key-travel') {
        await fetchAllSingleTravels();
      }
    });

    return {
      layout,
      keyMap,
      selectedSection,
      overlayData,
      gridStyle,
      getKeyStyle,
      selectKey,
      loaded,
      globalTravel,
      saveGlobalTravel,
      singleKeyTravel,
      saveSingleKeyTravel,
      notification
    };
  }
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@styles/variables' as v;

.performance-page {
  padding: 20px;
  color: v.$text-color;

  .title {
    color: v.$primary-color;
    margin-bottom: 10px;
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

  .performance-container {
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
    position: relative;

    &.selected {
      border-color: v.$primary-color;
      box-shadow: 0 0 8px rgba(v.$primary-color, 0.5);
    }

    .overlay {
      position: absolute;
      top: 2px;
      left: 2px;
      font-size: 0.75rem;
      color: v.$accent-color;
      background-color: rgba(v.$background-dark, 0.8);
      padding: 2px 4px;
      border-radius: 3px;

      &.single-travel {
        color: #00ff00; // Green for single key travel
      }
    }
  }

  .settings-panel {
    padding: 10px;
    border: 1px solid rgba(v.$text-color, 0.2);
    border-radius: v.$border-radius;
    background-color: rgba(v.$background-dark, 0.98);

    .settings-section {
      h3 {
        color: v.$primary-color;
        margin-bottom: 10px;
      }

      .input-group {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 10px;

        label {
          color: v.$text-color;
          font-size: 1rem;
        }

        .text-input {
          padding: 8px;
          border-radius: v.$border-radius;
          background-color: v.$background-dark;
          color: v.$text-color;
          border: 1px solid rgba(v.$text-color, 0.2);
          font-size: 1rem;
          width: 200px;

          &:focus {
            outline: none;
            box-shadow: 0 0 0 2px rgba(v.$primary-color, 0.5);
          }
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
        }
      }
    }
  }
}
</style>