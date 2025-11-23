<template>
  <div class="calibration-page">
    <h2 class="title">Calibration</h2>
    <div class="controls">
      <button
        @click="startCalibration"
        :disabled="!connectionStore.isConnected || calibrating"
        class="action-btn"
      >
        Start Calibration
      </button>
      <button
        @click="endCalibration"
        :disabled="!calibrating"
        class="action-btn secondary"
      >
        Save Calibration
      </button>
    </div>
    <div class="mapping-container">
      <div v-if="loaded" class="key-grid" :style="gridStyle">
        <div v-for="(row, rowIdx) in layout" :key="rowIdx" class="key-row">
          <button
            v-for="(keyInfo, colIdx) in row"
            :key="colIdx"
            class="key-btn"
            :style="getKeyStyle(rowIdx, colIdx)"
            :data-physical-key="keyInfo.physicalKeyValue"
          >
            <div class="key-label">
              {{ getKeyLabel(keyInfo.keyValue) }}
            </div>
            <span
              v-if="calibrating"
              class="travel-overlay"
              :class="{
                red: getTravelValue(keyInfo.location.row, keyInfo.location.col) === 0,
                green: getTravelValue(keyInfo.location.row, keyInfo.location.col) > 0
              }"
            >
              {{ getTravelValue(keyInfo.location.row, keyInfo.location.col) }}
            </span>
          </button>
        </div>
      </div>
      <div v-else-if="error" class="no-layout">
        {{ error }}
      </div>
      <div v-else class="no-layout">
        Loading layout...
      </div>
      <div class="instructions">
        <span><p>When calibrating, press the button down completely and hold it for 1 to 2 seconds, while slightly rocking the button forward/backward and side to side.</p></span>
        <span><p>Note: Pressing and lifting the key quickly can result in inaccurate calibration results.</p></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useMappedKeyboard } from '@/utils/MappedKeyboard';
import KeyboardService from '@/services/KeyboardService';
import { useConnectionStore } from '../store/connection';
import { keyMap } from '@/utils/keyMap';

const connectionStore = useConnectionStore();
const layerRef = ref<number | null>(null);
const {
  layout,
  loaded,
  gridStyle,
  getKeyStyle,
  fetchLayerLayout,
  error
} = useMappedKeyboard(layerRef);

const calibrating = ref(false);
const calibrated = ref(new Set<number>());
const travels = ref<number[][]>([]);
const maxTravels = ref<number[][]>([]);
let pollInterval: NodeJS.Timeout | null = null;

const getKeyLabel = (keyValue: number): string => {
  return keyMap[keyValue] || `Key ${keyValue}`;
};

const getTravelValue = (locRow: number, locCol: number): number => {
  const maxVal = maxTravels.value[locRow]?.[locCol] || 0;
  return Math.round(maxVal * 1000);
};

async function startCalibration(): Promise<void> {
  if (!connectionStore.isConnected) return;
  try {
    const result = await KeyboardService.calibrationStart();
    if (result instanceof Error) throw result;
    calibrated.value.clear();
    const numRows = 6;
    const numCols = 21;
    maxTravels.value = Array.from({ length: numRows }, () => Array(numCols).fill(0));
    travels.value = Array.from({ length: numRows }, () => Array(numCols).fill(0));
    calibrating.value = true;
    pollInterval = setInterval(async () => {
      try {
        const calResult = await KeyboardService.getRm6X21Calibration();
        if (!(calResult instanceof Error) && calResult.travels) {
          const newTravels = calResult.travels;
          // Update max per location [row][col]
          for (let r = 0; r < newTravels.length; r++) {
            for (let c = 0; c < newTravels[r].length; c++) {
              const currentMax = maxTravels.value[r]?.[c] || 0;
              const newVal = newTravels[r][c];
              if (newVal > currentMax) {
                maxTravels.value[r][c] = newVal;
              }
            }
          }
          travels.value = newTravels;
          // Update calibrated for any max >0 in flat
          maxTravels.value.flat().forEach((val: number) => {
            if (val > 0) {
              calibrated.value.add(1); // Placeholder; adjust if needed for flat index
            }
          });
          // Warn if shape mismatch
          if (newTravels.length !== numRows || newTravels.some(row => row.length !== numCols)) {
            console.warn('Travels array shape mismatch with expected 6x21');
          }
        }
      } catch (pollError) {
        console.error('Calibration poll error:', pollError);
      }
    }, 200);
  } catch (err) {
    console.error('Failed to start calibration:', err);
    // Optionally show toast/error UI
  }
}

async function endCalibration(): Promise<void> {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  try {
    const result = await KeyboardService.calibrationEnd();
    if (result instanceof Error) throw result;
    calibrating.value = false;
    // Optionally refetch layout or travels post-save
  } catch (err) {
    console.error('Failed to end calibration:', err);
    // Optionally show toast/error UI
  }
}

onMounted(() => {
  fetchLayerLayout();
});

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
});
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@styles/variables' as v;

.calibration-page {
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
    }
  }

  .instructions {
    background-color: color.adjust(v.$background-dark, $lightness: -5%);
    border-radius: v.$border-radius;
    padding: 12px;
    width: fit-content;
    margin-top: -50px;
    margin-left: auto;
    margin-right: auto;
    color: rgba($color: #ffffff, $alpha: .8);
    font-size: 1rem;
    line-height: 1;
    font-family: v.$font-style;
    text-align: calc(100% - 50%);
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

    .key-label {
      position: absolute;
      top: 2px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 1rem;
      font-weight: 300;
    }

    .travel-overlay {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 0.85rem;
      font-weight: bold;
      font-family: v.$font-style;
      z-index: 1;
      pointer-events: none;
      text-align: center;

      &.red {
        color: rgba($color: #ff0000, $alpha: .8);
      }

      &.green {
        color: rgba($color: #00ff04, $alpha: .8) ;
      }
    }
  }
}
</style>
