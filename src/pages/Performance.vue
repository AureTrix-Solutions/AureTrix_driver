<template>
  <div class="performance-page">
    <h2 class="title">Performance Settings</h2>
    <div class="controls">
      <label for="section-select">Section: </label>
      <select v-model="selectedSection" id="section-select" @change="updateOverlay">
        <option value="key-travel">Key Travel</option>
        <option value="rapid-trigger">Rapid Trigger</option>
        <option value="calibration">Calibration</option>
      </select>
    </div>

    <div class="performance-container">
      <div v-if="layout.length && loaded && (selectedSection === 'key-travel' || selectedSection === 'rapid-trigger')" class="key-grid" :style="gridStyle">
        <div v-for="(row, rIdx) in layout" :key="`r-${rIdx}`" class="key-row">
          <div
            v-for="(keyInfo, cIdx) in row"
            :key="`k-${rIdx}-${cIdx}`"
            class="key-btn"
            :class="{ 'performance-key-selected': loaded && selectedKeys.some(k => (k.physicalKeyValue || k.keyValue) === (keyInfo.physicalKeyValue || keyInfo.keyValue)) && (selectedSection === 'key-travel' || selectedSection === 'rapid-trigger') }"
            :style="getKeyStyle(rIdx, cIdx)"
            @click="selectKey(keyInfo, rIdx, cIdx)"
          >
            {{ keyInfo.remappedLabel || keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}` }}
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
      <div v-else-if="selectedSection === 'key-travel' || selectedSection === 'rapid-trigger'" class="no-layout">
        <p>{{ error || 'No keyboard layout available. Ensure a device is connected and try again.' }}</p>
        <p>Debug: layout.length={{ layout.length }}, loaded={{ loaded }}, baseLayout={{ baseLayout?.value ? 'defined' : 'null' }}, selectedSection={{ selectedSection }}</p>
      </div>
      <div class="bottom-section">
        <div class="selection-buttons" v-if="selectedSection === 'key-travel' || selectedSection === 'rapid-trigger'">
          <button @click="selectAll" class="select-btn">Select All</button>
          <button @click="selectWASD" class="select-btn">Select WASD</button>
          <button @click="selectLetters" class="select-btn">Select Letters</button>
          <button @click="selectNumbers" class="select-btn">Select Numbers</button>
          <button @click="selectNone" class="select-btn">Select None</button>
        </div>
        <div class="parent">
          <div class="settings-panel">
            <component
              :is="sectionComponents[selectedSection]"
              :selected-keys="selectedKeys"
              :layout="layout"
              :base-layout="baseLayout"
              @update-single-overlay="updateSingleOverlayData"
              @update-overlay="updateOverlayData"
              @update-notification="setNotification"
            ></component>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted } from 'vue';
import { useTravelProfilesStore } from '@/store/travelProfilesStore';
import { useMappedKeyboard } from '@utils/MappedKeyboard';
import { keyMap } from '@utils/keyMap';
import KeyboardService from '@services/KeyboardService';
import { useConnectionStore } from '../store/connection';
import type { IDefKeyInfo } from '../types/types';
import KeyTravel from '../components/performance/KeyTravel.vue';
import RapidTrigger from '../components/performance/RapidTrigger.vue';
import Calibration from '../components/performance/Calibration.vue';

export default defineComponent({
  name: 'Performance',
  components: {
    KeyTravel,
    RapidTrigger,
    Calibration,
  },
  setup() {
    const connectionStore = useConnectionStore();
    const selectedSection = ref('key-travel');
    const selectedKeys = ref<IDefKeyInfo[]>([]);
    const notification = ref<{ message: string; isError: boolean } | null>(null);
    const overlayData = ref<{ [key: number]: { travel: string; pressDead: string; releaseDead: string } }>({});

    const { layout, loaded, gridStyle, getKeyStyle, fetchLayerLayout, baseLayout, error } = useMappedKeyboard(ref(0));

    const fetchRemappedLabels = async () => {
      if (!layout.value.length || !loaded.value) {
        //console.log('Skipping fetchRemappedLabels: layout not ready');
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
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        layout.value.forEach(row => {
          row.forEach(keyInfo => {
            const physicalId = keyInfo.physicalKeyValue || keyInfo.keyValue;
            const remappedValue = positionToRemap[physicalId] || keyInfo.keyValue;
            keyInfo.remappedLabel = keyMap[remappedValue] || `Key ${remappedValue}`;
          });
        });
        //console.log('Remapped labels updated using physicalKeyValue and keyValue');
      } catch (error) {
        console.error('Failed to fetch remapped labels:', error);
        layout.value.forEach(row => {
          row.forEach(keyInfo => {
            keyInfo.remappedLabel = keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}`;
          });
        });
      }
    };

    const sectionComponents = {
      'key-travel': 'KeyTravel',
      'rapid-trigger': 'RapidTrigger',
      'polling-rate': 'PollingRate',
      'calibration': 'Calibration',
    };

    const selectKey = (key: IDefKeyInfo, rowIdx: number, colIdx: number) => {
      if (selectedSection.value === 'key-travel' || selectedSection.value === 'rapid-trigger') {
        //console.log(`Selecting key: { keyValue: ${key.keyValue}, type: ${typeof key.keyValue}, location: { row: ${rowIdx}, col: ${colIdx} } }`);
        const physicalKeyValue = key.physicalKeyValue || key.keyValue;
        const existingIndex = selectedKeys.value.findIndex(k => (k.physicalKeyValue || k.keyValue) === physicalKeyValue);
        if (existingIndex > -1) {
          selectedKeys.value.splice(existingIndex, 1);
          //console.log(`Deselected physical key ${physicalKeyValue} (display: ${key.keyValue})`);
        } else {
          selectedKeys.value.push(key);
          //console.log(`Selected physical key ${physicalKeyValue} (display: ${key.keyValue})`);
        }
        //console.log(`Selected physical keys:`, selectedKeys.value.map(k => k.physicalKeyValue || k.keyValue));
      } else {
        //console.log(`Key selection ignored: current section is ${selectedSection.value}`);
      }
    };

    const selectAll = () => {
      if (selectedSection.value === 'key-travel' || selectedSection.value === 'rapid-trigger') {
        const totalKeys = layout.value.flat().length;
        if (selectedKeys.value.length === totalKeys) {
          selectedKeys.value = [];
          //console.log('Deselected all keys');
        } else {
          selectedKeys.value = layout.value.flat();
          //console.log(`Selected all keys: ${selectedKeys.value.length} keys`);
        }
      }
    };

    const selectWASD = () => {
      if (selectedSection.value === 'key-travel' || selectedSection.value === 'rapid-trigger') {
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
          //console.log('Deselected WASD keys');
        } else {
          selectedKeys.value = [...selectedKeys.value, ...wasdKeys.filter(key => !selectedKeys.value.some(s => (s.physicalKeyValue || s.keyValue) === (key.physicalKeyValue || key.keyValue)))];
          //console.log(`Selected WASD keys: ${wasdKeys.map(k => keyMap[k.keyValue] || k.keyValue).join(', ')}`);
        }
      }
    };

    const selectLetters = () => {
      if (selectedSection.value === 'key-travel' || selectedSection.value === 'rapid-trigger') {
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
          //console.log('Deselected letter keys');
        } else {
          selectedKeys.value = [...selectedKeys.value, ...letterKeys.filter(key => !selectedKeys.value.some(s => (s.physicalKeyValue || s.keyValue) === (key.physicalKeyValue || key.keyValue)))];
          //console.log(`Selected letter keys: ${letterKeys.map(k => keyMap[k.keyValue] || k.keyValue).join(', ')}`);
        }
      }
    };

    const selectNumbers = () => {
      if (selectedSection.value === 'key-travel' || selectedSection.value === 'rapid-trigger') {
        const numberRegex = /^[0-9]$/;
        const numberKeys = layout.value
          .flat()
          .filter(keyInfo => {
            const label = keyInfo.remappedLabel || keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}`;
            return numberRegex.test(label);
          });
        const physicalNumbers = numberKeys.map(key => key.physicalKeyValue || key.keyValue);
        const currentlySelectedNumbers = selectedKeys.value.filter(k => physicalNumbers.includes(k.physicalKeyValue || k.keyValue));
        if (currentlySelectedNumbers.length === numberKeys.length) {
          selectedKeys.value = selectedKeys.value.filter(k => !physicalNumbers.includes(k.physicalKeyValue || k.keyValue));
          //console.log('Deselected number keys');
        } else {
          selectedKeys.value = [...selectedKeys.value, ...numberKeys.filter(key => !selectedKeys.value.some(s => (s.physicalKeyValue || s.keyValue) === (key.physicalKeyValue || key.keyValue)))];
          //console.log(`Selected number keys: ${numberKeys.map(k => keyMap[k.keyValue] || k.keyValue).join(', ')}`);
        }
      }
    };

    const selectNone = () => {
      if (selectedSection.value === 'key-travel' || selectedSection.value === 'rapid-trigger') {
        selectedKeys.value = [];
        //console.log('Cleared all key selections');
      }
    };

    const updateOverlay = () => {
      overlayData.value = {};
      selectedKeys.value = [];
      //console.log(`Section changed to ${selectedSection.value}`);
    };

    const updateSingleOverlayData = async (trigger: { travel: string; pressDead: string; releaseDead: string } | null) => {
      //console.log(`Received update-single-overlay trigger:`, trigger);
      if (selectedSection.value !== 'key-travel') return;

      try {
        const keyIds = layout.value.flat().map(keyInfo => keyInfo.physicalKeyValue || keyInfo.keyValue);
        const BATCH_SIZE = 80;
        const batches = [];
        for (let i = 0; i < keyIds.length; i += BATCH_SIZE) {
          batches.push(keyIds.slice(i, i + BATCH_SIZE));
        }

        const singleModeKeys: number[] = [];
        // Poll modes to identify single-mode keys
        for (const batch of batches) {
          const keyModes = await Promise.all(
            batch.map(async (keyId) => {
              try {
                const mode = await KeyboardService.getPerformanceMode(keyId);
                return { key: keyId, touchMode: mode.touchMode };
              } catch (error) {
                console.warn(`Failed to fetch performance mode for key ${keyId}:`, error);
                return null;
              }
            })
          );
          singleModeKeys.push(...keyModes
            .filter((mode): mode is { key: number; touchMode: string } => mode !== null)
            .filter(mode => mode.touchMode === 'single')
            .map(mode => mode.key));
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (trigger === null) {
          // Clear overlays for single-mode keys
          const keysToClear = Object.keys(overlayData.value).filter(key => 
            singleModeKeys.includes(Number(key)));
          keysToClear.forEach(key => {
            delete overlayData.value[key];
          });
          //console.log('Cleared single mode overlays:', keysToClear);
          return;
        }

        // Populate actual values for each single-mode key
        //console.log(`Populating overlays for ${singleModeKeys.length} single-mode keys`);
        const singleBatches = [];
        for (let i = 0; i < singleModeKeys.length; i += BATCH_SIZE) {
          singleBatches.push(singleModeKeys.slice(i, i + BATCH_SIZE));
        }

        for (const batch of singleBatches) {
          const keyValues = await Promise.all(
            batch.map(async (keyId) => {
              try {
                const [travelResult, deadzoneResult] = await Promise.all([
                  KeyboardService.getSingleTravel(keyId),
                  KeyboardService.getDpDr(keyId)
                ]);
                if (travelResult instanceof Error || deadzoneResult instanceof Error) {
                  console.warn(`Failed to fetch values for key ${keyId}:`, travelResult, deadzoneResult);
                  return null;
                }
                const travel = Number(travelResult).toFixed(2);
                const pressDead = Number(deadzoneResult.pressDead).toFixed(2);
                const releaseDead = Number(deadzoneResult.releaseDead).toFixed(2);
                return { key: keyId, travel, pressDead, releaseDead };
              } catch (error) {
                console.warn(`Error fetching values for key ${keyId}:`, error);
                return null;
              }
            })
          );
          keyValues
            .filter((val): val is { key: number; travel: string; pressDead: string; releaseDead: string } => val !== null)
            .forEach(({ key, travel, pressDead, releaseDead }) => {
              overlayData.value[key] = { travel, pressDead, releaseDead };
            });
          //console.log(`Populated batch of ${batch.length} single-mode keys`);
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (singleModeKeys.length === 0) {
          notification.value = { message: 'No keys in single mode found', isError: false };
        } else {
          //console.log('Single-mode overlays populated with actual device values');
        }
      } catch (error) {
        console.error('Failed to update single overlays:', error);
        notification.value = {
          message: `Failed to update single overlays: ${(error as Error).message}`,
          isError: true,
        };
      }
    };

    const updateOverlayData = async (data: { travel: string; pressDead: string; releaseDead: string } | null) => {
      //console.log(`Received update-overlay:`, data);
      if (data && selectedSection.value === 'key-travel') {
        try {
          const keyIds = layout.value.flat().map(keyInfo => keyInfo.physicalKeyValue || keyInfo.keyValue);
          //console.log(`Processing ${keyIds.length} keys for global mode overlay`);
          const BATCH_SIZE = 80;
          const batches = [];
          for (let i = 0; i < keyIds.length; i += BATCH_SIZE) {
            batches.push(keyIds.slice(i, i + BATCH_SIZE));
          }

          const globalModeKeys: number[] = [];
          for (const batch of batches) {
            const keyModes = await Promise.all(
              batch.map(async (keyId) => {
                try {
                  const mode = await KeyboardService.getPerformanceMode(keyId);
                  return { key: keyId, touchMode: mode.touchMode };
                } catch (error) {
                  console.warn(`Failed to fetch performance mode for key ${keyId}:`, error);
                  return null;
                }
              })
            );
            globalModeKeys.push(...keyModes
              .filter((mode): mode is { key: number; touchMode: string } => mode !== null)
              .filter(mode => mode.touchMode === 'global')
              .map(mode => mode.key));
            //console.log(`Processed batch of ${batch.length} keys, found ${keyModes.filter(m => m?.touchMode === 'global').length} in global mode`);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          //console.log(`Found ${globalModeKeys.length} global mode keys:`, globalModeKeys);

          layout.value.flat().forEach(keyInfo => {
            const keyId = keyInfo.physicalKeyValue || keyInfo.keyValue;
            if (globalModeKeys.includes(keyId)) {
              overlayData.value[keyId] = {
                travel: data.travel,
                pressDead: data.pressDead,
                releaseDead: data.releaseDead,
              };
            }
          });
          //console.log('Overlay data updated for global mode keys:', overlayData.value);
          if (globalModeKeys.length === 0) {
            //console.log('No global mode keys found for overlay');
            notification.value = {
              message: 'No keys in global mode found',
              isError: false,
            };
          }
        } catch (error) {
          console.error('Failed to fetch global mode keys:', error);
          notification.value = {
            message: `Failed to fetch global mode keys: ${(error as Error).message}`,
            isError: true,
          };
        }
      } else {
        //console.log('Clearing global mode overlays');
        try {
          const keyIds = layout.value.flat().map(keyInfo => keyInfo.physicalKeyValue || keyInfo.keyValue);
          const BATCH_SIZE = 80;
          const batches = [];
          for (let i = 0; i < keyIds.length; i += BATCH_SIZE) {
            batches.push(keyIds.slice(i, i + BATCH_SIZE));
          }

          const globalModeKeys: number[] = [];
          for (const batch of batches) {
            const keyModes = await Promise.all(
              batch.map(async (keyId) => {
                try {
                  const mode = await KeyboardService.getPerformanceMode(keyId);
                  return { key: keyId, touchMode: mode.touchMode };
                } catch (error) {
                  console.warn(`Failed to fetch performance mode for key ${keyId}:`, error);
                  return null;
                }
              })
            );
            globalModeKeys.push(...keyModes
              .filter((mode): mode is { key: number; touchMode: string } => mode !== null)
              .filter(mode => mode.touchMode === 'global')
              .map(mode => mode.key));
            //console.log(`Processed batch of ${batch.length} keys for clearing, found ${keyModes.filter(m => m?.touchMode === 'global').length} in global mode`);
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          const keysToClear = Object.keys(overlayData.value).filter(key => 
            globalModeKeys.includes(Number(key)));
          keysToClear.forEach(key => {
            delete overlayData.value[key];
          });
          //console.log('Cleared global mode overlays:', keysToClear);
          if (keysToClear.length === 0) {
            //console.log('No global mode overlays to clear');
          }
        } catch (error) {
          console.error('Failed to clear global mode overlays:', error);
          notification.value = {
            message: `Failed to clear global mode overlays: ${(error as Error).message}`,
            isError: true,
          };
        }
      }
    };

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

    watch([layout, loaded, baseLayout, selectedKeys], () => {
      //console.log(`Layout updated: length=${layout.value.length}, loaded=${loaded.value}, baseLayout=${baseLayout.value ? 'defined' : 'null'}, selectedKeys=${selectedKeys.value.map(k => k.keyValue).join(', ') || 'none'}`);
      //console.log(`Grid style:`, gridStyle.value);
      if (layout.value.length && loaded.value) {
        //console.log(`Key grid data:`, layout.value);
        fetchRemappedLabels();
      }
    });

    watch(() => useTravelProfilesStore().selectedProfile, (profile) => {
      //console.log('Performance: Profile changed:', profile?.switchName, 'Max Travel:', profile?.maxTravel);
    }, { immediate: true 
    });

    onMounted(() => {
      //console.log('Performance page mounted, calling fetchLayerLayout');
      fetchLayerLayout();
    });

    const setNotification = (message: string, isError: boolean) => {
      notification.value = { message, isError };
    };

    return {
      selectedSection,
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
      updateOverlay,
      updateSingleOverlayData,
      notification,
      sectionComponents,
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
    font-weight: 700;
  }

  .controls {
    width: 500px;
    gap: 0px;
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

    &.performance-key-selected {
      border-color: v.$accent-color;
      box-shadow: 0 0 8px rgba(v.$accent-color, 0.5);
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
      background-color: v.$accent-color;
      color: v.$background-dark;
      border: none;
      border-radius: v.$border-radius;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: background-color 0.2s ease;
      width: 120px;
      text-align: center;

      &:hover {
        background-color: color.adjust(v.$accent-color, $lightness: 10%);
      }
    }
  }

  .bottom-section {
    display: flex;
    flex:1;
    flex-shrink: 0;
    gap: 10px;
    position:relative;
    margin-right: 650px;
    margin-left: auto;
    justify-content:center;
 
  }



  .settings-panel {
    width: 1425px;
    padding: 10px;
    border: 1px solid rgba(v.$text-color, 0.2);
    border-radius: v.$border-radius;
    background-color: rgba(v.$background-dark, 0.98);
  }
}
</style>