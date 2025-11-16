<template>
  <div class="performance-page">
    <h2 class="title">Key Travel Settings</h2>
    <div v-if="notification" class="notification" :class="{ error: notification.isError }">
      {{ notification.message }}
      <button @click="notification = null" class="dismiss-btn">&times;</button>
    </div>

    <div class="performance-container">
      <div v-if="layout.length && loaded" class="key-grid" :style="gridStyle">
        <div v-for="(row, rIdx) in layout" :key="`r-${rIdx}`" class="key-row">
          <div
            v-for="(keyInfo, cIdx) in row"
            :key="`k-${rIdx}-${cIdx}`"
            class="key-btn"
            :class="{ 'performance-key-selected': loaded && selectedKeys.some(k => (k.physicalKeyValue || k.keyValue) === (keyInfo.physicalKeyValue || keyInfo.keyValue)) }"
            :style="getKeyStyle(rIdx, cIdx)"
            @click="selectKey(keyInfo, rIdx, cIdx)"
          >
            <div class="key-label">
              {{ keyInfo.remappedLabel || keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}` }}
            </div>
            <div v-if="overlayData[keyInfo.physicalKeyValue || keyInfo.keyValue]" class="overlay">
              <div class="overlay-values">
                <div class="overlay-center">{{ overlayData[keyInfo.physicalKeyValue || keyInfo.keyValue]?.travel || '0.00' }}</div>
                <div class="overlay-bottom-left">{{ overlayData[keyInfo.physicalKeyValue || keyInfo.keyValue]?.pressDead }}</div>
                <div class="overlay-bottom-right">{{ overlayData[keyInfo.physicalKeyValue || keyInfo.keyValue]?.releaseDead }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-layout">
        <p>{{ error || 'No keyboard layout available. Ensure a device is connected and try again.' }}</p>
        <p>Debug: layout.length={{ layout.length }}, loaded={{ loaded }}, baseLayout={{ baseLayout?.value ? 'defined' : 'null' }}</p>
      </div>
      <div class="bottom-section">
        <div class="selection-buttons">
          <button @click="selectAll" class="select-btn">Select All</button>
          <button @click="selectWASD" class="select-btn">Select WASD</button>
          <button @click="selectLetters" class="select-btn">Select Letters</button>
          <button @click="selectNumbers" class="select-btn">Select Numbers</button>
          <button @click="selectNone" class="select-btn">Select None</button>
        </div>
        <div class="parent">
          <div class="settings-panel">
            <KeyTravel
              :selected-keys="selectedKeys"
              :layout="layout"
              :base-layout="baseLayout"
              @update-single-overlay="updateSingleOverlayData"
              @update-overlay="updateOverlayData"
              @update-notification="setNotification"
              @mode-changed="handleModeChange"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted, computed } from 'vue';
import { useTravelProfilesStore } from '@/store/travelProfilesStore';
import { useMappedKeyboard } from '@utils/MappedKeyboard';
import { keyMap } from '@utils/keyMap';
import KeyboardService from '@services/KeyboardService';
import { useBatchProcessing } from '@/composables/useBatchProcessing'; // New import for batch fetching
import type { IDefKeyInfo } from '../types/types';
import KeyTravel from '../components/performance/KeyTravel.vue';

export default defineComponent({
  name: 'Performance',
  components: {
    KeyTravel,
  },
  setup() {
    const { processBatches } = useBatchProcessing(); // Use composable for batching
    const selectedKeys = ref<IDefKeyInfo[]>([]);
    const notification = ref<{ message: string; isError: boolean } | null>(null);
    
    // Separate overlay state for global and single modes
    const keyModeMap = ref<{ [key: number]: 'global' | 'single' }>({});
    const globalOverlayValues = ref<{ travel: string; pressDead: string; releaseDead: string } | null>(null);
    const singleOverlayByKey = ref<{ [key: number]: { travel: string; pressDead: string; releaseDead: string } }>({});
    
    // Computed overlay data that merges based on current key modes
    const overlayData = computed(() => {
      const merged: { [key: number]: { travel: string; pressDead: string; releaseDead: string } } = {};
      
      for (const [keyIdStr, mode] of Object.entries(keyModeMap.value)) {
        const keyId = Number(keyIdStr);
        if (mode === 'global' && globalOverlayValues.value) {
          merged[keyId] = globalOverlayValues.value;
        } else if (mode === 'single' && singleOverlayByKey.value[keyId]) {
          merged[keyId] = singleOverlayByKey.value[keyId];
        }
      }
      
      return merged;
    });

    const { layout, loaded, gridStyle, getKeyStyle, fetchLayerLayout, baseLayout, error } = useMappedKeyboard(ref(0));

    const fetchRemappedLabels = async () => {
      if (!layout.value.length || !loaded.value) {
        return;
      }
      try {
        const keyIds = layout.value.flat().map(keyInfo => keyInfo.physicalKeyValue || keyInfo.keyValue);
        const BATCH_SIZE = 80;
        const batches = [];
        for (let i = 0; i < keyIds.length; i += BATCH_SIZE) {
          batches.push(keyIds.slice(i, i + BATCH_SIZE));
        }

        const positionToRemap = {};
        for (const batch of batches) {
          const currentLayer = await Promise.all(
            batch.map(async (keyId) => {
              try {
                return await KeyboardService.getLayoutKeyInfo([{ key: keyId, layout: 0 }]);
              } catch (error) {
                console.warn(`Failed to fetch layout key info for key ${keyId}:`, error);
                return null;
              }
            })
          );
          currentLayer
            .flat()
            .filter((item): item is { key: number; value: number } => item !== null)
            .forEach(item => {
              if (item.key && item.value !== 0) {
                positionToRemap[item.key] = item.value;
              }
            });
        }

        layout.value.forEach(row => {
          row.forEach(keyInfo => {
            const physicalId = keyInfo.physicalKeyValue || keyInfo.keyValue;
            const remappedValue = positionToRemap[physicalId] || keyInfo.keyValue;
            keyInfo.remappedLabel = keyMap[remappedValue] || `Key ${remappedValue}`;
          });
        });
      } catch (error) {
        console.error('Failed to fetch remapped labels:', error);
        layout.value.forEach(row => {
          row.forEach(keyInfo => {
            keyInfo.remappedLabel = keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}`;
          });
        });
      }
    };

    const selectKey = (key: IDefKeyInfo, rowIdx: number, colIdx: number) => {
      const physicalKeyValue = key.physicalKeyValue || key.keyValue;
      const existingIndex = selectedKeys.value.findIndex(k => (k.physicalKeyValue || k.keyValue) === physicalKeyValue);
      if (existingIndex > -1) {
        selectedKeys.value.splice(existingIndex, 1);
      } else {
        selectedKeys.value.push(key);
      }
    };

    const selectAll = () => {
      const totalKeys = layout.value.flat().length;
      if (selectedKeys.value.length === totalKeys) {
        selectedKeys.value = [];
      } else {
        selectedKeys.value = layout.value.flat();
      }
    };

    const selectWASD = () => {
      const wasdLabels = ['W', 'A', 'S', 'D'];
      const wasdKeys = layout.value
        .flat()
        .filter(keyInfo => {
          const label = keyInfo.remappedLabel || keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}`;
          return wasdLabels.includes(label.toUpperCase());
        });
      const physicalWASD = wasdKeys.map(key => key.physicalKeyValue || key.keyValue);
      const currentlySelectedWASD = selectedKeys.value.filter(k => physicalWASD.includes(k.physicalKeyValue || k.keyValue));
      if (currentlySelectedWASD.length === wasdKeys.length) {
        selectedKeys.value = selectedKeys.value.filter(k => !physicalWASD.includes(k.physicalKeyValue || k.keyValue));
      } else {
        selectedKeys.value = [...selectedKeys.value, ...wasdKeys.filter(key => !selectedKeys.value.some(s => (s.physicalKeyValue || s.keyValue) === (key.physicalKeyValue || key.keyValue)))];
      }
    };

    const selectLetters = () => {
      const letterRegex = /^[A-Z]$/;
      const letterKeys = layout.value
        .flat()
        .filter(keyInfo => {
          const label = keyInfo.remappedLabel || keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}`;
          return letterRegex.test(label.toUpperCase());
        });
      const physicalLetters = letterKeys.map(key => key.physicalKeyValue || key.keyValue);
      const currentlySelectedLetters = selectedKeys.value.filter(k => physicalLetters.includes(k.physicalKeyValue || k.keyValue));
      if (currentlySelectedLetters.length === letterKeys.length) {
        selectedKeys.value = selectedKeys.value.filter(k => !physicalLetters.includes(k.physicalKeyValue || k.keyValue));
      } else {
        selectedKeys.value = [...selectedKeys.value, ...letterKeys.filter(key => !selectedKeys.value.some(s => (s.physicalKeyValue || s.keyValue) === (key.physicalKeyValue || key.keyValue)))];
      }
    };

    const selectNumbers = () => {
      const numberLabels = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
      const numberKeys = layout.value
        .flat()
        .filter(keyInfo => {
          const label = keyInfo.remappedLabel || keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}`;
          return numberLabels.includes(label);
        });
      const physicalNumbers = numberKeys.map(key => key.physicalKeyValue || key.keyValue);
      const currentlySelectedNumbers = selectedKeys.value.filter(k => physicalNumbers.includes(k.physicalKeyValue || k.keyValue));
      if (currentlySelectedNumbers.length === numberKeys.length) {
        selectedKeys.value = selectedKeys.value.filter(k => !physicalNumbers.includes(k.physicalKeyValue || k.keyValue));
      } else {
        selectedKeys.value = [...selectedKeys.value, ...numberKeys.filter(key => !selectedKeys.value.some(s => (s.physicalKeyValue || s.keyValue) === (key.physicalKeyValue || key.keyValue)))];
      }
    };

    const selectNone = () => {
      selectedKeys.value = [];
    };

    const updateSingleOverlayData = async (shouldRefresh: boolean) => {
      if (!shouldRefresh) {
        // Clear all single overlays
        singleOverlayByKey.value = {};
        return;
      }

      try {
        // Get all keys in single mode from keyModeMap
        const singleModeKeys = Object.entries(keyModeMap.value)
          .filter(([_, mode]) => mode === 'single')
          .map(([keyIdStr, _]) => Number(keyIdStr));

        if (singleModeKeys.length === 0) {
          return;
        }

        // Build new overlay object to trigger reactivity
        const newSingleOverlays: { [key: number]: { travel: string; pressDead: string; releaseDead: string } } = {};
        
        // Fetch actual per-key values for single mode keys
        await processBatches(singleModeKeys, async (keyId) => {
          try {
            const travelResult = await KeyboardService.getSingleTravel(keyId);
            const deadzoneResult = await KeyboardService.getDpDr(keyId);
            if (travelResult instanceof Error || deadzoneResult instanceof Error) {
              console.warn(`Failed to fetch values for single key ${keyId}`);
              return;
            }
            newSingleOverlays[keyId] = {
              travel: Number(travelResult).toFixed(2),
              pressDead: Number(deadzoneResult.pressDead).toFixed(2),
              releaseDead: Number(deadzoneResult.releaseDead).toFixed(2),
            };
          } catch (fetchError) {
            console.error(`Failed to fetch single key data for ${keyId}:`, fetchError);
          }
        });

        // Assign the new object to trigger reactivity
        singleOverlayByKey.value = newSingleOverlays;
        console.log(`[PERFORMANCE] Refreshed overlays for ${singleModeKeys.length} single mode keys`);
      } catch (error) {
        console.error('Failed to update single mode overlays:', error);
        notification.value = {
          message: `Failed to update single mode overlays: ${(error as Error).message}`,
          isError: true,
        };
      }
    };

    const updateOverlayData = async (data: { travel: string; pressDead: string; releaseDead: string } | null) => {
      if (data) {
        // Set global overlay values for all keys in global mode
        globalOverlayValues.value = data;
      } else {
        // Clear global overlay values
        globalOverlayValues.value = null;
      }
    };

    watch(notification, (newNotification) => {
      if (newNotification) {
        setTimeout(() => {
          if (notification.value === newNotification) {
            notification.value = null;
          }
        }, 3000);
      }
    });

    watch([layout, loaded, baseLayout, selectedKeys], () => {
      if (layout.value.length && loaded.value) {
        fetchRemappedLabels();
      }
    });

    watch(() => useTravelProfilesStore().selectedProfile, (profile) => {
      console.log('Performance: Profile changed:', profile?.switchName, 'Max Travel:', profile?.maxTravel);
    }, { immediate: true });

    // Debug watchers
    watch(keyModeMap, (newMap, oldMap) => {
      console.log('[PERFORMANCE] keyModeMap changed:', { newMap, oldMap });
    }, { deep: true });

    watch(globalOverlayValues, (newVal, oldVal) => {
      console.log('[PERFORMANCE] globalOverlayValues changed:', { newVal, oldVal });
    });

    watch(singleOverlayByKey, (newVal, oldVal) => {
      console.log('[PERFORMANCE] singleOverlayByKey changed:', { newVal, oldVal });
    }, { deep: true });

    watch(overlayData, (newVal, oldVal) => {
      console.log('[PERFORMANCE] overlayData (computed) changed:', { 
        newKeys: Object.keys(newVal),
        oldKeys: Object.keys(oldVal || {}),
        newCount: Object.keys(newVal).length,
        oldCount: Object.keys(oldVal || {}).length
      });
    });

    onMounted(() => {
      setTimeout(async () => {
        await fetchLayerLayout();
        await initializeKeyModes();
      }, 100);
    });

    const setNotification = (message: string, isError: boolean) => {
      notification.value = { message, isError };
    };

    // Initialize key mode map
    const initializeKeyModes = async () => {
      try {
        const keyIds = layout.value.flat().map(keyInfo => keyInfo.physicalKeyValue || keyInfo.keyValue);
        const newKeyModeMap: { [key: number]: 'global' | 'single' } = {};
        
        await processBatches(keyIds, async (keyId) => {
          try {
            const mode = await KeyboardService.getPerformanceMode(keyId);
            newKeyModeMap[keyId] = mode.touchMode as 'global' | 'single';
          } catch (error) {
            console.warn(`Failed to fetch performance mode for key ${keyId}:`, error);
            // Default to global if fetch fails
            newKeyModeMap[keyId] = 'global';
          }
        });
        
        // Assign the complete map to trigger reactivity
        keyModeMap.value = newKeyModeMap;
        console.log(`[PERFORMANCE] Initialized modes for ${keyIds.length} keys`);
      } catch (error) {
        console.error('Failed to initialize key modes:', error);
      }
    };

    // Handle mode changes from child components
    const handleModeChange = (keyIds: number[], newMode: 'global' | 'single') => {
      console.log(`[PERFORMANCE] handleModeChange called:`, keyIds, newMode);
      
      // Create new object for keyModeMap to trigger reactivity
      const newKeyModeMap = { ...keyModeMap.value };
      keyIds.forEach(keyId => {
        newKeyModeMap[keyId] = newMode;
      });
      keyModeMap.value = newKeyModeMap;
      
      // Clear old single overlay data when switching to global
      if (newMode === 'global') {
        const newSingleOverlays = { ...singleOverlayByKey.value };
        keyIds.forEach(keyId => {
          delete newSingleOverlays[keyId];
        });
        singleOverlayByKey.value = newSingleOverlays;
      }
      
      console.log(`[PERFORMANCE] Updated keyModeMap:`, keyModeMap.value);
    };

    return {
      layout,
      loaded,
      gridStyle,
      getKeyStyle,
      keyMap,
      selectKey,
      selectAll,
      selectWASD,
      selectLetters,
      selectNumbers,
      selectNone,
      selectedKeys,
      overlayData,
      updateSingleOverlayData,
      notification,
      setNotification,
      error,
      baseLayout,
      updateOverlayData,
    };
  },
});
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@styles/variables' as v;

.performance-page {
  padding: 20px;
  color: v.$text-color;

  .title {
    width: 500px;
    color: v.$primary-color;
    margin-bottom: 10px;
    margin-top: 0px;
    font-size: 1.5rem;
    font-weight: 600;
    font-family: v.$font-style;
  }

  .notification {
    padding: 10px;
    margin-bottom: 0px;
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
      font-family: v.$font-style;

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
    font-family: v.$font-style;
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

    &.performance-key-selected {
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

    .overlay {
      position: absolute !important;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      font-size: 0.75rem;
      background-color: transparent;
      padding: 0px 0px;
      border-radius: 3px;

      .overlay-values {
        width: 100%;
        height: 100%;
        position: relative;
      }

      .overlay-center {
        font-size: 0.8rem;
        font-weight: bold;
        color: rgba(5, 205, 165, 0.684) !important;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
      }

      .overlay-bottom-left {
        font-size: 0.7rem;
        font-weight: bold;
        color: green !important;
        position: absolute;
        bottom: 10px;
        left: calc(50% - 25px);
        text-align: left;
      }

      .overlay-bottom-right {
        font-size: 0.7rem;
        font-weight: bold;
        color: rgba(255, 140, 0, 0.679) !important;
        position: absolute;
        bottom: 10px;
        right: calc(50% - 25px);
        text-align: right;
      }
    }
  }

  .selection-buttons {
    display: flex;
    flex-direction: column;
    gap: 10px;

    .select-btn {
      padding: 8px 8px;
      background-color: color.adjust(v.$background-dark, $lightness: -100%);
      color: v.$accent-color;
      border: v.$border-style;
      border-radius: v.$border-radius;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 200px;
      transition: background-color 0.2s ease;
      width: 120px;
      text-align: center;
      font-family: v.$font-style;

      &:hover {
        background-color: color.adjust(v.$background-dark, $lightness: 10%);
      }
    }
  }

  .bottom-section {
    display: flex;
    flex:1;
    flex-shrink: 0;
    gap: 10px;
    position:relative;
    margin-right: auto;
    margin-left: auto;
    margin-top: -50px;
    justify-content:center;
 
  }
  .settings-panel {
    width: 1425px;
    padding: 10px;
    border: 1px solid rgba(v.$text-color, 0.2);
    border-radius: v.$border-radius;
    background-color: color.adjust(v.$background-dark, $lightness: -100%);
  }
}
</style>