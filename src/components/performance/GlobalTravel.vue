<template>
  <div class="settings-section">
    <div class="header-row">
      <h3>Global Travel</h3>
      <button @click="toggleOverlay" class="show-btn">{{ showOverlay ? 'Hide' : 'Show' }}</button>
    </div>
    <div class="global-travel-row">
      <div class="input-group">
        <div class="label">Global Travel (mm)</div>
        <div class="slider-container">
          <div class="value-display">{{ minTravel.toFixed(2) }}</div>
          <input
            type="range"
            v-model.number="globalTravel"
            :min="minTravel"
            :max="maxTravel"
            step="0.01"
            @change="updateGlobalSettings"
          />
          <div class="value-display">{{ maxTravel.toFixed(2) }}</div>
        </div>
        <div class="adjusters">
          <button @click="adjustTravel(-0.01)" class="adjust-btn">-</button>
          <input
            type="number"
            v-model.number="globalTravel"
            :min="minTravel"
            :max="maxTravel"
            step="0.01"
            @change="updateGlobalSettings"
          />
          <button @click="adjustTravel(0.01)" class="adjust-btn">+</button>
        </div>
      </div>
      <div class="input-group global-mode-group">
        <button @click="setKeyToGlobalMode" class="global-mode-btn" :disabled="selectedKeys.length === 0">
          Select to Global
        </button>
      </div>
    </div>
    <div class="deadzone-group">
      <div class="input-group">
        <div class="label">Top Dead Zone (mm)</div>
        <div class="slider-container">
          <div class="value-display">0.00</div>
          <input
            type="range"
            v-model.number="pressDead"
            min="0.0"
            max="1.0"
            step="0.01"
            @change="updateGlobalSettings"
          />
          <div class="value-display">1.00</div>
        </div>
        <div class="adjusters">
          <button @click="adjustDeadZone(-0.01, 'press')" class="adjust-btn">-</button>
          <input
            type="number"
            v-model.number="pressDead"
            min="0.0"
            max="1.0"
            step="0.01"
            @change="updateGlobalSettings"
          />
          <button @click="adjustDeadZone(0.01, 'press')" class="adjust-btn">+</button>
        </div>
      </div>
      <div class="link-container">
        <button @click="toggleLinkDeadZones" class="link-btn">{{ deadZonesLinked ? 'Unlink' : 'Link' }} Zones</button>
      </div>
      <div class="input-group">
        <div class="label">Bottom Dead Zone (mm)</div>
        <div class="slider-container">
          <div class="value-display">0.00</div>
          <input
            type="range"
            v-model.number="releaseDead"
            min="0.0"
            max="1.0"
            step="0.01"
            @change="updateGlobalSettings"
          />
          <div class="value-display">1.00</div>
        </div>
        <div class="adjusters">
          <button @click="adjustDeadZone(-0.01, 'release')" class="adjust-btn">-</button>
          <input
            type="number"
            v-model.number="releaseDead"
            min="0.0"
            max="1.0"
            step="0.01"
            @change="updateGlobalSettings"
          />
          <button @click="adjustDeadZone(0.01, 'release')" class="adjust-btn">+</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType, onMounted, watch } from 'vue';
import KeyboardService from '@services/KeyboardService';
import { keyMap } from '@utils/keyMap';
import { useBatchProcessing } from '@/composables/useBatchProcessing';
import type { IDefKeyInfo } from '@/types/types';

export default defineComponent({
  name: 'GlobalTravel',
  props: {
    layout: {
      type: Array as PropType<IDefKeyInfo[][]>,
      required: true,
    },
    selectedKeys: {
      type: Array as PropType<IDefKeyInfo[]>,
      default: () => [],
    },
    profileMaxTravel: {
      type: Number,
      default: 4.0,
    },
  },
  emits: ['update-overlay', 'update-single-overlay'],
  setup(props, { emit }) {
    const { processBatches } = useBatchProcessing();

    // Core Refs
    const globalTravel = ref(2.0);
    const pressDead = ref(0.2);
    const releaseDead = ref(0.2);
    const deadZonesLinked = ref(false);
    const showOverlay = ref(false);

    // Computed Bounds
    const minTravel = computed(() => Math.max(0.1, pressDead.value));
    const maxTravel = computed(() => Math.min(props.profileMaxTravel, props.profileMaxTravel - releaseDead.value));

    // Load global settings
    const loadGlobalSettings = async () => {
      try {
        const settings = await KeyboardService.getGlobalTouchTravel();
        if (!(settings instanceof Error)) {
          if (settings.globalTouchTravel >= 0.1 && settings.globalTouchTravel <= 4.0) {
            globalTravel.value = Number(settings.globalTouchTravel.toFixed(2));
          }
          if (settings.pressDead >= 0 && settings.pressDead <= 1.0) {
            pressDead.value = Number(settings.pressDead.toFixed(2));
          }
          if (settings.releaseDead >= 0 && settings.releaseDead <= 1.0) {
            releaseDead.value = Number(settings.releaseDead.toFixed(2));
          }
        }
      } catch (error) {
      }
    };

    // Update global dead zones for global mode keys
    const updateGlobalDeadZones = async () => {
      try {
        const keyIds = props.layout.flat().map(keyInfo => keyInfo.physicalKeyValue || keyInfo.keyValue);
        const globalModeKeys = [];
        await processBatches(keyIds, async (keyId) => {
          const mode = await KeyboardService.getPerformanceMode(keyId);
          if (mode.touchMode === 'global') {
            globalModeKeys.push(keyId);
          }
        });
        if (globalModeKeys.length > 0) {
          await processBatches(globalModeKeys, async (keyId) => {
            await Promise.all([
              KeyboardService.setDp(keyId, pressDead.value),
              KeyboardService.setDr(keyId, releaseDead.value),
            ]);
          });
        }
      } catch (error) {
      }
    };

    // Update global settings
    const updateGlobalSettings = async () => {
      try {
        const param = { globalTouchTravel: globalTravel.value, pressDead: pressDead.value, releaseDead: releaseDead.value };
        await KeyboardService.setGlobalTouchTravel(param);
        await updateGlobalDeadZones();
      } catch (error) {
      }
      if (showOverlay.value) {
        emit('update-overlay', {
          travel: globalTravel.value.toFixed(2),
          pressDead: pressDead.value.toFixed(2),
          releaseDead: releaseDead.value.toFixed(2),
        });
      }
    };

    // Adjust travel
    const adjustTravel = (delta: number) => {
      const newValue = Math.min(Math.max(globalTravel.value + delta, minTravel.value), maxTravel.value);
      globalTravel.value = Number(newValue.toFixed(2));
      updateGlobalSettings();
    };

    // Adjust dead zone
    const adjustDeadZone = (delta: number, type: 'press' | 'release') => {
      if (deadZonesLinked.value && type === 'release') return;
      let newValue = type === 'press' ? pressDead.value + delta : releaseDead.value + delta;
      newValue = Math.min(Math.max(newValue, 0), 1.0);
      if (type === 'press') {
        pressDead.value = Number(newValue.toFixed(2));
      } else {
        releaseDead.value = Number(newValue.toFixed(2));
      }
      if (deadZonesLinked.value) {
        const otherType = type === 'press' ? 'release' : 'press';
        (otherType === 'press' ? pressDead : releaseDead).value = Number(newValue.toFixed(2));
      }
      updateGlobalSettings();
    };

    // Toggle linking
    const toggleLinkDeadZones = () => {
      deadZonesLinked.value = !deadZonesLinked.value;
      if (deadZonesLinked.value) {
        releaseDead.value = pressDead.value;
        updateGlobalSettings();
      }
    };

    // Set selected keys to global mode
    const setKeyToGlobalMode = async () => {
      if (props.selectedKeys.length === 0) return;
      const keys = props.selectedKeys.map(key => ({
        physicalKeyValue: key.physicalKeyValue || key.keyValue,
      }));
      try {
        await processBatches(keys, async (physicalKeyValue) => KeyboardService.setPerformanceMode(physicalKeyValue, 'global', 0));
        await updateGlobalSettings();
      } catch (error) {
      }
      emit('update-single-overlay', null);
      emit('update-overlay', null);
      if (showOverlay.value) {
        setTimeout(() => emit('update-overlay', {
          travel: globalTravel.value.toFixed(2),
          pressDead: pressDead.value.toFixed(2),
          releaseDead: releaseDead.value.toFixed(2),
        }), 300);
      }
    };

    // Toggle overlay
    const toggleOverlay = () => {
      showOverlay.value = !showOverlay.value;
      emit('update-overlay', showOverlay.value ? {
        travel: globalTravel.value.toFixed(2),
        pressDead: pressDead.value.toFixed(2),
        releaseDead: releaseDead.value.toFixed(2),
      } : null);
    };

    // Watchers
    watch([pressDead, releaseDead], () => {
      let clamped = false;
      const oldTravel = globalTravel.value;
      if (globalTravel.value < minTravel.value) {
        globalTravel.value = Number(minTravel.value.toFixed(2));
        clamped = true;
      } else if (globalTravel.value > maxTravel.value) {
        globalTravel.value = Number(maxTravel.value.toFixed(2));
        clamped = true;
      }
      if (clamped && globalTravel.value !== oldTravel) {
        updateGlobalSettings();
      }
      if (deadZonesLinked.value) {
        releaseDead.value = pressDead.value;
      }
    });

    onMounted(() => {
      loadGlobalSettings();
    });

    return {
      globalTravel,
      pressDead,
      releaseDead,
      deadZonesLinked,
      minTravel,
      maxTravel,
      updateGlobalSettings,
      adjustTravel,
      adjustDeadZone,
      toggleLinkDeadZones,
      setKeyToGlobalMode,
      showOverlay,
      toggleOverlay,
      keyMap,
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

  .global-travel-row {
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

  .global-mode-btn {
    padding: 8px 16px;
    background-color: color.adjust(v.$background-dark, $lightness: -100%);
    color: v.$primary-color;
    border: v.$border-style;
    border-radius: v.$border-radius;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 400;
    transition: background-color 0.2s ease;
    width: 140.88px;
    height: 32px;
    text-align: center;
    margin-top: 0px;

    &:hover:not(:disabled) {
      background-color: color.adjust(v.$background-dark, $lightness: 10%);
    }

    &:disabled {
      background-color: color.adjust(v.$background-dark, $lightness: -20%);
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}
</style>