<template>
  <div class="rapid-trigger-page">
    <h2 class="title">Rapid Trigger Settings</h2>
    <div v-if="notification" class="notification" :class="{ error: notification.isError }">
      {{ notification.message }}
      <button @click="notification = null" class="dismiss-btn">&times;</button>
    </div>

    <div class="rapid-trigger-container">
      <div v-if="layout.length && loaded" class="key-grid" :style="gridStyle">
        <div v-for="(row, rIdx) in layout" :key="`r-${rIdx}`" class="key-row">
          <div
            v-for="(keyInfo, cIdx) in row"
            :key="`k-${rIdx}-${cIdx}`"
            class="key-btn"
            :class="{ 'rt-key-selected': loaded && selectedKeys.some(k => (k.physicalKeyValue || k.keyValue) === (keyInfo.physicalKeyValue || keyInfo.keyValue)) }"
            :style="getKeyStyle(rIdx, cIdx)"
            @click="selectKey(keyInfo, rIdx, cIdx)"
          >
            <div class="key-label">
              {{ keyInfo.remappedLabel || keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}` }}
            </div>
            <div v-if="overlayData[keyInfo.physicalKeyValue || keyInfo.keyValue]" class="overlay">
              <div class="overlay-values">
                <div class="overlay-top-left">{{ overlayData[keyInfo.physicalKeyValue || keyInfo.keyValue]?.press || '0.00' }}</div>
                <div class="overlay-top-right">{{ overlayData[keyInfo.physicalKeyValue || keyInfo.keyValue]?.release || '0.00' }}</div>
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
            <RapidTriggerSettings
              :selected-keys="selectedKeys"
              :layout="layout"
              :base-layout="baseLayout"
              :profile-max-travel="profileMaxTravel"
              @update-overlay="updateOverlayData"
              @update-notification="setNotification"
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
import { useBatchProcessing } from '@/composables/useBatchProcessing';
import type { IDefKeyInfo } from '../types/types';
import RapidTriggerSettings from '../components/rapidtrigger/RapidTriggerSettings.vue';

export default defineComponent({
  name: 'RapidTrigger',
  components: {
    RapidTriggerSettings,
  },
  setup() {
    const { processBatches } = useBatchProcessing();
    const selectedKeys = ref<IDefKeyInfo[]>([]);
    const notification = ref<{ message: string; isError: boolean } | null>(null);
    const overlayData = ref<{ 
      [key: number]: { 
        travel: string; 
        press: string; 
        release: string; 
        pressDead: string; 
        releaseDead: string 
      } 
    }>({});

    const { layout, loaded, gridStyle, getKeyStyle, fetchLayerLayout, baseLayout, error } = useMappedKeyboard(ref(0));

    const store = useTravelProfilesStore();
    const profileMaxTravel = computed(() => {
      const selected = store.selectedProfile;
      return selected ? selected.maxTravel : 4.0;
    });

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

        const positionToRemap: { [key: number]: number } = {};
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

    const setNotification = (data: { message: string; isError: boolean }) => {
      notification.value = data;
      setTimeout(() => {
        notification.value = null;
      }, 5000);
    };

    const updateOverlayData = async (data: any) => {
      if (data === null) {
        // Fetch overlays for all keys
        try {
          const keyIds = layout.value.flat().map(keyInfo => keyInfo.physicalKeyValue || keyInfo.keyValue);

          await processBatches(keyIds, async (keyId) => {
            try {
              const rtResult = await KeyboardService.getRtTravel(keyId);
              const dzResult = await KeyboardService.getDpDr(keyId);
              
              if (rtResult instanceof Error || dzResult instanceof Error) {
                console.warn(`Failed to fetch RT values for key ${keyId}`);
                return;
              }

              // Calculate total travel (this is a simplification - you may need to adjust based on actual SDK behavior)
              const totalTravel = Math.max(rtResult.pressTravel, rtResult.releaseTravel);

              overlayData.value[keyId] = {
                travel: totalTravel.toFixed(2),
                press: rtResult.pressTravel.toFixed(2),
                release: rtResult.releaseTravel.toFixed(2),
                pressDead: dzResult.dpThreshold.toFixed(2),
                releaseDead: dzResult.drThreshold.toFixed(2),
              };
            } catch (fetchError) {
              console.error(`Failed to fetch RT data for ${keyId}:`, fetchError);
            }
          });

          console.log(`[RAPID-TRIGGER] Refreshed overlays for ${keyIds.length} keys`);
        } catch (error) {
          console.error('Failed to update RT overlays:', error);
          notification.value = {
            message: `Failed to update overlays: ${(error as Error).message}`,
            isError: true,
          };
        }
      } else {
        // Clear overlays
        overlayData.value = {};
      }
    };

    watch(loaded, async (newLoaded) => {
      if (newLoaded && layout.value.length > 0) {
        await fetchRemappedLabels();
      }
    });

    onMounted(async () => {
      await fetchLayerLayout();
      if (loaded.value && layout.value.length > 0) {
        await fetchRemappedLabels();
      }
    });

    return {
      selectedKeys,
      notification,
      overlayData,
      layout,
      loaded,
      gridStyle,
      getKeyStyle,
      baseLayout,
      error,
      keyMap,
      profileMaxTravel,
      selectKey,
      selectAll,
      selectWASD,
      selectLetters,
      selectNumbers,
      selectNone,
      setNotification,
      updateOverlayData,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@styles/variables' as v;

.rapid-trigger-page {
  padding: 20px;
  color: v.$text-primary;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 2rem;
  margin-bottom: 20px;
  color: v.$accent-primary;
}

.notification {
  background: v.$accent-secondary;
  color: #fff;
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &.error {
    background: #d32f2f;
  }

  .dismiss-btn {
    background: none;
    border: none;
    color: #fff;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    margin-left: 10px;
  }
}

.rapid-trigger-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.key-grid {
  position: relative;
  flex-shrink: 0;
  margin-bottom: 20px;
}

.key-row {
  position: relative;
}

.key-btn {
  position: absolute;
  background: v.$bg-tertiary;
  border: 2px solid v.$border-color;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;

  &:hover {
    background: lighten(v.$bg-tertiary, 5%);
    border-color: v.$accent-primary;
  }

  &.rt-key-selected {
    background: v.$accent-primary;
    border-color: v.$accent-primary;
    color: #fff;

    .key-label {
      color: #fff;
    }
  }

  .key-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: v.$text-primary;
    text-align: center;
    position: relative;
    z-index: 1;
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 2;
  }

  .overlay-values {
    position: relative;
    width: 100%;
    height: 100%;
    font-size: 0.65rem;
    font-weight: 500;
    color: v.$accent-secondary;

    .overlay-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.7);
      padding: 2px 4px;
      border-radius: 2px;
      font-weight: 700;
      color: #fff;
    }

    .overlay-top-left {
      position: absolute;
      top: 2px;
      left: 2px;
      background: rgba(76, 175, 80, 0.8);
      padding: 1px 3px;
      border-radius: 2px;
      color: #fff;
      font-weight: 600;
    }

    .overlay-top-right {
      position: absolute;
      top: 2px;
      right: 2px;
      background: rgba(33, 150, 243, 0.8);
      padding: 1px 3px;
      border-radius: 2px;
      color: #fff;
      font-weight: 600;
    }

    .overlay-bottom-left {
      position: absolute;
      bottom: 2px;
      left: 2px;
      background: rgba(255, 152, 0, 0.8);
      padding: 1px 3px;
      border-radius: 2px;
      color: #fff;
      font-weight: 600;
    }

    .overlay-bottom-right {
      position: absolute;
      bottom: 2px;
      right: 2px;
      background: rgba(156, 39, 176, 0.8);
      padding: 1px 3px;
      border-radius: 2px;
      color: #fff;
      font-weight: 600;
    }
  }
}

.no-layout {
  padding: 40px;
  text-align: center;
  color: v.$text-secondary;
}

.bottom-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.selection-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;

  .select-btn {
    background: v.$bg-tertiary;
    color: v.$text-primary;
    border: 1px solid v.$border-color;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;

    &:hover {
      background: v.$accent-primary;
      color: #fff;
      border-color: v.$accent-primary;
    }
  }
}

.parent {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.settings-panel {
  // Will be styled by child component
}
</style>
