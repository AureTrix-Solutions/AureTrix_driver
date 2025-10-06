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
      'calibration': 'Calibration',
    };

    const selectKey = (key: IDefKeyInfo, rowIdx: number, colIdx: number) => {
      if (selectedSection.value === 'key-travel' || selectedSection.value === 'rapid-trigger') {
        const physicalKeyValue = key.physicalKeyValue || key.keyValue;
        const existingIndex = selectedKeys.value.findIndex(k => (k.physicalKeyValue || k.keyValue) === physicalKeyValue);
        if (existingIndex > -1) {
          selectedKeys.value.splice(existingIndex, 1);
        } else {
          selectedKeys.value.push(key);
        }
      }
    };

    const selectAll = () => {
      if (selectedSection.value === 'key-travel' || selectedSection.value === 'rapid-trigger') {
        const totalKeys = layout.value.flat().length;
        if (selectedKeys.value.length === totalKeys) {
          selectedKeys.value = [];
        } else {
          selectedKeys.value = layout.value.flat();
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
        } else {
          selectedKeys.value = [...selectedKeys.value, ...wasdKeys.filter(key => !selectedKeys.value.some(s => (s.physicalKeyValue || s.keyValue) === (key.physicalKeyValue || key.keyValue)))];
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
        } else {
          selectedKeys.value = [...selectedKeys.value, ...letterKeys.filter(key => !selectedKeys.value.some(s => (s.physicalKeyValue || s.keyValue) === (key.physicalKeyValue || key.keyValue)))];
        }
      }
    };

    const selectNumbers = () => {
      if (selectedSection.value === 'key-travel' || selectedSection.value === 'rapid-trigger') {
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
      }
    };

    const selectNone = () => {
      if (selectedSection.value === 'key-travel' || selectedSection.value === 'rapid-trigger') {
        selectedKeys.value = [];
      }
    };

    const updateSingleOverlayData = async (data: { travel: string; pressDead: string; releaseDead: string } | null) => {
      try {
        const keyIds = layout.value.flat().map(keyInfo => keyInfo.physicalKeyValue || keyInfo.keyValue);
        const BATCH_SIZE = 80;
        const batches = [];
        for (let i = 0; i < keyIds.length; i += BATCH_SIZE) {
          batches.push(keyIds.slice(i, i + BATCH_SIZE));
        }

        const singleModeKeys: number[] = [];
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

        if (data === null) {
          const keysToClear = Object.keys(overlayData.value).filter(key => singleModeKeys.includes(Number(key)));
          keysToClear.forEach(key => delete overlayData.value[key]);
          if (keysToClear.length === 0) {
            console.log('No single mode overlays to clear');
          }
          return;
        }

        const singleBatches = [];
        for (let i = 0; i < singleModeKeys.length; i += BATCH_SIZE) {
          singleBatches.push(singleModeKeys.slice(i, i + BATCH_SIZE));
        }

        for (const batch of singleBatches) {
          const keyValues = await Promise.all(
            batch.map(async (keyId) => {
              try {
                const travelResult = await KeyboardService.getSingleTravel(keyId);
                const deadzoneResult = await KeyboardService.getDpDr(keyId);
                if (travelResult instanceof Error || deadzoneResult instanceof Error) {
                  return null;
                }
                return {
                  key: keyId,
                  travel: Number(travelResult).toFixed(2),
                  pressDead: Number(deadzoneResult.pressDead).toFixed(2),
                  releaseDead: Number(deadzoneResult.releaseDead).toFixed(2)
                };
              } catch (error) {
                console.warn(`Failed to fetch values for key ${keyId}:`, error);
                return null;
              }
            })
          );
          keyValues
            .filter((val): val is { key: number; travel: string; pressDead: string; releaseDead: string } => val !== null)
            .forEach(val => {
              overlayData.value[val.key] = {
                travel: val.travel,
                pressDead: val.pressDead,
                releaseDead: val.releaseDead
              };
            });
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (singleModeKeys.length === 0) {
          notification.value = { message: 'No keys in single mode found', isError: false };
        }
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
            await new Promise(resolve => setTimeout(resolve, 100));
          }

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
          if (globalModeKeys.length === 0) {
            notification.value = {
              message: 'No keys in global mode found',
              isError: false,
            };
          }
        } catch (error) {
          console.error('Failed to update global mode overlays:', error);
          notification.value = {
            message: `Failed to update global mode overlays: ${(error as Error).message}`,
            isError: true,
          };
        }
      } else {
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
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          const keysToClear = Object.keys(overlayData.value).filter(key => 
            globalModeKeys.includes(Number(key)));
          keysToClear.forEach(key => {
            delete overlayData.value[key];
          });
          if (keysToClear.length === 0) {
            console.log('No global mode overlays to clear');
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

    const updateOverlay = () => {
      overlayData.value = {};
      selectedKeys.value = [];
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

    onMounted(() => {
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