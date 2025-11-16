<template>
  <div class="settings-section">
    <div class="header-row">
      <h3>Single Travel</h3>
      <button @click="toggleOverlay" class="show-btn">{{ showOverlay ? 'Hide' : 'Show' }}</button>
    </div>
    <div class="travel-row">
      <div class="input-group">
        <div class="label">Trigger Travel (<span class="travel-unit">mm</span>)</div>
        <div class="slider-container">
          <div class="value-display">{{ minTravel.toFixed(2) }}</div>
          <input
            type="range"
            v-model.number="singleKeyTravel"
            id="single-key-travel-slider"
            :min="minTravel"
            :max="maxTravel"
            step="0.01"
            :disabled="selectedKeys.length === 0"
            @change="updateSingleKeyTravel"
          />
          <div class="value-display">{{ maxTravel.toFixed(2) }}</div>
        </div>
        <div class="adjusters">
          <button @click="adjustTravel(-0.01)" class="adjust-btn" :disabled="selectedKeys.length === 0">-</button>
          <input
            type="number"
            v-model.number="singleKeyTravel"
            id="single-key-travel-input"
            :min="minTravel"
            :max="maxTravel"
            step="0.01"
            :disabled="selectedKeys.length === 0"
            @change="updateSingleKeyTravel"
          />
          <button @click="adjustTravel(0.01)" class="adjust-btn" :disabled="selectedKeys.length === 0">+</button>
        </div>
      </div>
    </div>
    <div class="deadzone-group">
      <div class="input-group">
        <div class="label">Top Dead Zone (<span class="t-dzone">mm</span>)</div>
        <div class="slider-container">
          <div class="value-display">0.00</div>
          <input
            type="range"
            v-model.number="topDeadZone"
            min="0.0"
            max="1.0"
            step="0.01"
            :disabled="selectedKeys.length === 0"
            @change="updateDeadZones"
          />
          <div class="value-display">1.00</div>
        </div>
        <div class="adjusters">
          <button @click="adjustDeadZone(-0.01, 'top')" class="adjust-btn" :disabled="selectedKeys.length === 0">-</button>
          <input
            type="number"
            v-model.number="topDeadZone"
            min="0.0"
            max="1.0"
            step="0.01"
            :disabled="selectedKeys.length === 0"
            @change="updateDeadZones"
          />
          <button @click="adjustDeadZone(0.01, 'top')" class="adjust-btn" :disabled="selectedKeys.length === 0">+</button>
        </div>
      </div>
      <div class="link-container">
        <button @click="toggleLinkDeadZones" class="link-btn" :disabled="selectedKeys.length === 0">
          {{ deadZonesLinked ? 'Unlink' : 'Link' }} Zones
        </button>
      </div>
      <div class="input-group">
        <div class="label">Bottom Dead Zone (mm)</div>
        <div class="slider-container">
          <div class="value-display">0.00</div>
          <input
            type="range"
            v-model.number="bottomDeadZone"
            min="0.0"
            max="1.0"
            step="0.01"
            :disabled="selectedKeys.length === 0 || deadZonesLinked"
            @change="updateDeadZones"
          />
          <div class="value-display">1.00</div>
        </div>
        <div class="adjusters">
          <button @click="adjustDeadZone(-0.01, 'bottom')" class="adjust-btn" :disabled="selectedKeys.length === 0 || deadZonesLinked">-</button>
          <input
            type="number"
            v-model.number="bottomDeadZone"
            min="0.0"
            max="1.0"
            step="0.01"
            :disabled="selectedKeys.length === 0 || deadZonesLinked"
            @change="updateDeadZones"
          />
          <button @click="adjustDeadZone(0.01, 'bottom')" class="adjust-btn" :disabled="selectedKeys.length === 0 || deadZonesLinked">+</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed, PropType } from 'vue';
import KeyboardService from '@services/KeyboardService';
import { keyMap } from '@utils/keyMap';
import { useBatchProcessing } from '@/composables/useBatchProcessing';
import type { IDefKeyInfo } from '@/types/types';

export default defineComponent({
  name: 'SingleKeyTravel',
  props: {
    selectedKeys: {
      type: Array as PropType<IDefKeyInfo[]>,
      default: () => [],
    },
    layout: {
      type: Array as PropType<IDefKeyInfo[][]>,
      required: true,
    },
    baseLayout: {
      type: Object as PropType<any>,
      default: null,
    },
    profileMaxTravel: {
      type: Number,
      default: 4.0,
    },
  },
  emits: ['update-single-overlay', 'update-overlay', 'mode-changed'],
  setup(props, { emit }) {
    const { processBatches } = useBatchProcessing();

    // Core Refs
    const singleKeyTravel = ref(2.0);
    const topDeadZone = ref(0.0);
    const bottomDeadZone = ref(0.0);
    const deadZonesLinked = ref(false);
    const showOverlay = ref(false);
    const prevSingleKeyTravel = ref(2.0);
    const prevTopDeadZone = ref(0.0);
    const prevBottomDeadZone = ref(0.0);

    // Computed Bounds
    const minTravel = computed(() => Math.max(0.1, topDeadZone.value));
    const maxTravel = computed(() => Math.min(props.profileMaxTravel, props.profileMaxTravel - bottomDeadZone.value));

    // Unified update for single key settings
    const updateSingleKeyAll = async () => {
      if (props.selectedKeys.length === 0) return;
      const travelChanged = singleKeyTravel.value !== prevSingleKeyTravel.value;
      const deadChanged = topDeadZone.value !== prevTopDeadZone.value || bottomDeadZone.value !== prevBottomDeadZone.value;
      if (!travelChanged && !deadChanged) return;
      const keys = props.selectedKeys.map(key => ({
        physicalKeyValue: key.physicalKeyValue || key.keyValue,
      }));
      const keyIds = keys.map(k => k.physicalKeyValue);
      try {
        await processBatches(keys, async (physicalKeyValue) => {
          await KeyboardService.setPerformanceMode(physicalKeyValue, 'single', 0);
          if (travelChanged) {
            await KeyboardService.setSingleTravel(physicalKeyValue, singleKeyTravel.value);
          }
          if (deadChanged) {
            await KeyboardService.setDp(physicalKeyValue, topDeadZone.value);
            await KeyboardService.setDr(physicalKeyValue, bottomDeadZone.value);
          }
        });
        // Emit mode change so parent can update keyModeMap
        console.log(`[SINGLEKEYTRAVEL] Emitting mode-changed event:`, keyIds, 'single');
        emit('mode-changed', keyIds, 'single');
      } catch (error) {
        console.error(`[SINGLEKEYTRAVEL] Error in updateSingleKeyAll:`, error);
      }
      prevSingleKeyTravel.value = singleKeyTravel.value;
      prevTopDeadZone.value = topDeadZone.value;
      prevBottomDeadZone.value = bottomDeadZone.value;
      // Refresh single overlays if showing
      if (showOverlay.value) {
        emit('update-single-overlay', true);
      }
    };

    // Update travel to selected keys
    const updateSingleKeyTravel = async () => {
      await updateSingleKeyAll();
    };

    // Load current single key travel
    const loadSingleKeyTravel = async () => {
      if (props.selectedKeys.length === 0) {
        singleKeyTravel.value = 2.0;
        prevSingleKeyTravel.value = 2.0;
        return;
      }
      const physicalKeyValue = props.selectedKeys[0].physicalKeyValue || props.selectedKeys[0].keyValue;
      try {
        const result = await KeyboardService.getSingleTravel(physicalKeyValue);
        if (!(result instanceof Error)) {
          const loadedValue = Number(result);
          if (loadedValue >= 0.1 && loadedValue <= 4.0) {
            singleKeyTravel.value = Number(loadedValue.toFixed(2));
            prevSingleKeyTravel.value = singleKeyTravel.value;
            return;
          }
        }
      } catch (error) {
      }
      singleKeyTravel.value = 2.0;
      prevSingleKeyTravel.value = 2.0;
    };

    // Load current dead zones
    const loadDeadZones = async () => {
      if (props.selectedKeys.length === 0) {
        topDeadZone.value = 0.2;
        bottomDeadZone.value = 0.2;
        prevTopDeadZone.value = 0.2;
        prevBottomDeadZone.value = 0.2;
        return;
      }
      const physicalKeyValue = props.selectedKeys[0].physicalKeyValue || props.selectedKeys[0].keyValue;
      try {
        const result = await KeyboardService.getDpDr(physicalKeyValue);
        if (!(result instanceof Error)) {
          if (result.pressDead >= 0 && result.pressDead <= 1.0) {
            topDeadZone.value = Number(result.pressDead.toFixed(2));
            prevTopDeadZone.value = topDeadZone.value;
          }
          if (result.releaseDead >= 0 && result.releaseDead <= 1.0) {
            bottomDeadZone.value = Number(result.releaseDead.toFixed(2));
            prevBottomDeadZone.value = bottomDeadZone.value;
          }
          return;
        }
      } catch (error) {
      }
      topDeadZone.value = 0.2;
      bottomDeadZone.value = 0.2;
      prevTopDeadZone.value = 0.2;
      prevBottomDeadZone.value = 0.2;
    };

    // Update dead zones to selected keys
    const updateDeadZones = async () => {
      if (deadZonesLinked.value && topDeadZone.value !== bottomDeadZone.value) {
        bottomDeadZone.value = topDeadZone.value;
      }
      // Clamp travel to new bounds
      let clamped = false;
      const oldTravel = singleKeyTravel.value;
      if (singleKeyTravel.value < minTravel.value) {
        singleKeyTravel.value = Number(minTravel.value.toFixed(2));
        clamped = true;
      } else if (singleKeyTravel.value > maxTravel.value) {
        singleKeyTravel.value = Number(maxTravel.value.toFixed(2));
        clamped = true;
      }
      if (props.selectedKeys.length === 0) return;
      await updateSingleKeyAll();
    };

    // Adjust travel
    const adjustTravel = (delta: number) => {
      const newValue = Math.min(Math.max(singleKeyTravel.value + delta, minTravel.value), maxTravel.value);
      singleKeyTravel.value = Number(newValue.toFixed(2));
      updateSingleKeyTravel();
    };

    // Adjust dead zone
    const adjustDeadZone = (delta: number, type: 'top' | 'bottom') => {
      if (deadZonesLinked.value && type === 'bottom') return;
      let newValue = type === 'top' ? topDeadZone.value + delta : bottomDeadZone.value + delta;
      newValue = Math.min(Math.max(newValue, 0), 1.0);
      if (type === 'top') {
        topDeadZone.value = Number(newValue.toFixed(2));
      } else {
        bottomDeadZone.value = Number(newValue.toFixed(2));
      }
      if (deadZonesLinked.value) {
        const otherType = type === 'top' ? 'bottom' : 'top';
        (otherType === 'top' ? topDeadZone : bottomDeadZone).value = Number(newValue.toFixed(2));
      }
      updateDeadZones();
    };

    // Toggle linking
    const toggleLinkDeadZones = () => {
      deadZonesLinked.value = !deadZonesLinked.value;
      if (deadZonesLinked.value) {
        bottomDeadZone.value = topDeadZone.value;
        updateDeadZones();
      } else {
        updateDeadZones();
      }
    };

    // Toggle overlay
    const toggleOverlay = () => {
      showOverlay.value = !showOverlay.value;
      emit('update-single-overlay', showOverlay.value);
    };

    // Watchers
    watch(topDeadZone, (newVal, oldVal) => {
      let clamped = false;
      const oldTravel = singleKeyTravel.value;
      if (singleKeyTravel.value < minTravel.value) {
        singleKeyTravel.value = Number(minTravel.value.toFixed(2));
        clamped = true;
      }
    });

    watch(bottomDeadZone, (newVal, oldVal) => {
      if (!deadZonesLinked.value) {
        let clamped = false;
        const oldTravel = singleKeyTravel.value;
        if (singleKeyTravel.value > maxTravel.value) {
          singleKeyTravel.value = Number(maxTravel.value.toFixed(2));
          clamped = true;
        }
      }
    });

    watch(() => props.selectedKeys, async (newKeys) => {
      await loadSingleKeyTravel();
      await loadDeadZones();
    }, { deep: true });

    return {
      keyMap,
      singleKeyTravel,
      topDeadZone,
      bottomDeadZone,
      deadZonesLinked,
      minTravel,
      maxTravel,
      updateSingleKeyTravel,
      updateDeadZones,
      adjustTravel,
      adjustDeadZone,
      toggleLinkDeadZones,
      showOverlay,
      toggleOverlay,
    };
  },
});
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@styles/variables' as v;

.settings-section {
  flex-shrink: 0;
  border: 1px solid rgba(v.$text-color, 0.2);
  height: 170px;
  padding-left: 8px;

  .header-row {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    font-family: v.$font-style;
  }

  h3 {
    color: v.$primary-color;
    width: auto;
    font-size: 1.5rem;
    margin: 0;
    margin-bottom: -5px;
    margin-right: 10px;
    font-weight: 400;
  }

  .show-btn {
    padding: 3px 8px;
    background-color: color.adjust(v.$background-dark, $lightness: -100%);
    color: v.$accent-color;
    border: v.$border-style;
    border-radius: v.$border-radius;
    cursor: pointer;
    font-size: 0.7rem;
    font-weight: 500;
    transition: background-color 0.2s ease;
    align-self: left;
    margin-bottom: -10px;

    &:hover:not(:disabled) {
      background-color: color.adjust(v.$background-dark, $lightness: 10%);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .travel-row {
    display: flex;
    height: 10px;
    padding-top: 30px;
    gap: 0px;
    margin-bottom: 20px;
    align-items: center;
    font-family: v.$font-style;
  }

  .input-group {
    display: flex;
    align-items: center;
    gap: 0px;
    margin-bottom: 20px;
    padding: 10px;
    width: 600px;
    height: 30px;
    border: v.$border-style;
    border-radius: v.$border-radius;
    background-color: rgba(v.$background-dark, 0.5);
    font-family: v.$font-style;

    &.global-mode-group {
      display: inline;
      padding-left: 5px;
      width: 150px;
      height: 30px;
      justify-content: center;
      border: none;
    }

    .label {
      min-width: 180px;
      text-align: center;
      color: v.$text-color;
      font-size: 0.95rem;
      font-weight: 300;
    }

    .slider-container {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0px;

      input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        flex: 1;
        max-width: 200px;
        cursor: pointer;
        height: 6px;
        background: transparent; // clear default track

        &::-webkit-slider-runnable-track {
          background-color: color.adjust(v.$background-dark, $lightness: 10%); // track color
          height: 6px;
          border-radius: 3px;
        }

        &::-webkit-slider-thumb {
          appearance: none;
          opacity: 1;
          width: 12px;
          height: 12px;
          border-radius: 4%;
          background-color: v.$primary-color; // thumb color
          cursor: pointer;
          margin-top: -3px; // centers thumb vertically
        }
      }
      
      .value-display {
        min-width: 60px;
        color: v.$accent-color;
        font-size: 0.95rem;
        font-weight: 500;
        text-align: center;
      }
    }

    .adjusters {
      display: flex;
      align-items: center;
      gap: 4px;

      input[type="number"] {
        width: 60px;
        padding: 4px 6px;
        border-radius: v.$border-radius;
        background-color: v.$background-dark;
        color: v.$text-color;
        border: 1px solid rgba(v.$text-color, 0.2);
        font-size: 0.9rem;
        text-align: center;

        &:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(v.$accent-color, 0.3);
        }
      }

      .adjust-btn {
        width: 20px;
        height: 20px;
        border: none;
        border-radius: 4%;
        background-color: rgba(v.$text-color, 0.2);
        color: v.$text-color;
        cursor: pointer;
        font-size: 1rem;
        font-weight: 400;
        padding: 0px;
        transition: background-color 0.2s ease;

        &:hover:not(:disabled) {
          background-color: rgba(v.$accent-color, 0.3);
        }

        &:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      }
    }
  }

  .deadzone-group {
    display: inline-flex;
    width: 1500px;
    gap: 0px;
    margin-bottom: 20px;
  }

  .link-container {
    display: flex;
    width: 150px;
    align-items: center;
    justify-content: center;
    padding: -30px;
    padding-bottom: 20px;
  }

  .link-btn {
    padding: 8px 16px;
    background-color: color.adjust(v.$background-dark, $lightness: -100%);
    color: v.$primary-color;
    border: v.$border-style;
    border-radius: v.$border-radius;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 400;
    height: 32px;
    transition: background-color 0.2s ease;

    &:hover:not(:disabled) {
      background-color: color.adjust(v.$background-dark, $lightness: 10%);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}
</style>