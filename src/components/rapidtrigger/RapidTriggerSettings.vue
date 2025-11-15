<template>
  <div class="settings-section">
    <div class="header-row">
      <h3>Rapid Trigger Settings</h3>
      <button @click="toggleOverlay" class="show-btn">{{ showOverlay ? 'Hide' : 'Show' }}</button>
    </div>

    <div class="travel-row">
      <div class="input-group">
        <div class="label">Press Travel (<span class="travel-unit">mm</span>)</div>
        <div class="slider-container">
          <div class="value-display">0.10</div>
          <input
            type="range"
            v-model.number="pressTravel"
            id="press-travel-slider"
            min="0.1"
            :max="maxPressTravel"
            step="0.01"
            :disabled="selectedKeys.length === 0"
            @change="updateRTSettings"
          />
          <div class="value-display">{{ maxPressTravel.toFixed(2) }}</div>
        </div>
        <div class="adjusters">
          <button @click="adjustPress(-0.01)" class="adjust-btn" :disabled="selectedKeys.length === 0">-</button>
          <input
            type="number"
            v-model.number="pressTravel"
            id="press-travel-input"
            min="0.1"
            :max="maxPressTravel"
            step="0.01"
            :disabled="selectedKeys.length === 0"
            @change="updateRTSettings"
          />
          <button @click="adjustPress(0.01)" class="adjust-btn" :disabled="selectedKeys.length === 0">+</button>
        </div>
      </div>
    </div>

    <div class="travel-row">
      <div class="input-group">
        <div class="label">Release Travel (<span class="travel-unit">mm</span>)</div>
        <div class="slider-container">
          <div class="value-display">0.10</div>
          <input
            type="range"
            v-model.number="releaseTravel"
            id="release-travel-slider"
            min="0.1"
            :max="maxReleaseTravel"
            step="0.01"
            :disabled="selectedKeys.length === 0"
            @change="updateRTSettings"
          />
          <div class="value-display">{{ maxReleaseTravel.toFixed(2) }}</div>
        </div>
        <div class="adjusters">
          <button @click="adjustRelease(-0.01)" class="adjust-btn" :disabled="selectedKeys.length === 0">-</button>
          <input
            type="number"
            v-model.number="releaseTravel"
            id="release-travel-input"
            min="0.1"
            :max="maxReleaseTravel"
            step="0.01"
            :disabled="selectedKeys.length === 0"
            @change="updateRTSettings"
          />
          <button @click="adjustRelease(0.01)" class="adjust-btn" :disabled="selectedKeys.length === 0">+</button>
        </div>
      </div>
    </div>

    <div class="deadzone-group">
      <div class="input-group">
        <div class="label">Press Deadzone (Dp) (<span class="t-dzone">mm</span>)</div>
        <div class="slider-container">
          <div class="value-display">0.00</div>
          <input
            type="range"
            v-model.number="pressDeadzone"
            min="0.0"
            max="1.0"
            step="0.01"
            :disabled="selectedKeys.length === 0"
            @change="updateDeadzones"
          />
          <div class="value-display">1.00</div>
        </div>
        <div class="adjusters">
          <button @click="adjustDeadzone(-0.01, 'press')" class="adjust-btn" :disabled="selectedKeys.length === 0">-</button>
          <input
            type="number"
            v-model.number="pressDeadzone"
            min="0.0"
            max="1.0"
            step="0.01"
            :disabled="selectedKeys.length === 0"
            @change="updateDeadzones"
          />
          <button @click="adjustDeadzone(0.01, 'press')" class="adjust-btn" :disabled="selectedKeys.length === 0">+</button>
        </div>
      </div>

      <div class="input-group">
        <div class="label">Release Deadzone (Dr) (mm)</div>
        <div class="slider-container">
          <div class="value-display">0.00</div>
          <input
            type="range"
            v-model.number="releaseDeadzone"
            min="0.0"
            max="1.0"
            step="0.01"
            :disabled="selectedKeys.length === 0"
            @change="updateDeadzones"
          />
          <div class="value-display">1.00</div>
        </div>
        <div class="adjusters">
          <button @click="adjustDeadzone(-0.01, 'release')" class="adjust-btn" :disabled="selectedKeys.length === 0">-</button>
          <input
            type="number"
            v-model.number="releaseDeadzone"
            min="0.0"
            max="1.0"
            step="0.01"
            :disabled="selectedKeys.length === 0"
            @change="updateDeadzones"
          />
          <button @click="adjustDeadzone(0.01, 'release')" class="adjust-btn" :disabled="selectedKeys.length === 0">+</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed, PropType } from 'vue';
import KeyboardService from '@services/KeyboardService';
import { useBatchProcessing } from '@/composables/useBatchProcessing';
import type { IDefKeyInfo } from '@/types/types';

export default defineComponent({
  name: 'RapidTriggerSettings',
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
  emits: ['update-overlay', 'update-notification'],
  setup(props, { emit }) {
    const { processBatches } = useBatchProcessing();

    // Core Refs
    const pressTravel = ref(0.1);
    const releaseTravel = ref(0.1);
    const pressDeadzone = ref(0.1);
    const releaseDeadzone = ref(0.1);
    const showOverlay = ref(false);

    // Previous values for change detection
    const prevPressTravel = ref(0.1);
    const prevReleaseTravel = ref(0.1);
    const prevPressDeadzone = ref(0.1);
    const prevReleaseDeadzone = ref(0.1);

    // Computed max values
    const maxPressTravel = computed(() => props.profileMaxTravel);
    const maxReleaseTravel = computed(() => props.profileMaxTravel);

    // Toggle overlay visibility
    const toggleOverlay = () => {
      showOverlay.value = !showOverlay.value;
      if (showOverlay.value) {
        emit('update-overlay', null);
        setTimeout(() => loadAllSettings(), 300);
      } else {
        emit('update-overlay', null);
      }
    };

    // Update RT travel settings
    const updateRTSettings = async () => {
      if (props.selectedKeys.length === 0) return;

      const pressChanged = pressTravel.value !== prevPressTravel.value;
      const releaseChanged = releaseTravel.value !== prevReleaseTravel.value;

      if (!pressChanged && !releaseChanged) return;

      const keys = props.selectedKeys.map(key => key.physicalKeyValue || key.keyValue);

      try {
        await processBatches(keys, async (physicalKeyValue) => {
          if (pressChanged) {
            await KeyboardService.setRtPressTravel(physicalKeyValue, pressTravel.value);
          }
          if (releaseChanged) {
            await KeyboardService.setRtReleaseTravel(physicalKeyValue, releaseTravel.value);
          }
        });

        // Save and reload
        await KeyboardService.saveParameters();
        await KeyboardService.reloadParameters();

        prevPressTravel.value = pressTravel.value;
        prevReleaseTravel.value = releaseTravel.value;

        emit('update-notification', { message: 'Rapid trigger settings updated successfully', isError: false });
        
        if (showOverlay.value) {
          setTimeout(() => emit('update-overlay', null), 500);
        }
      } catch (error) {
        console.error('Failed to update RT settings:', error);
        emit('update-notification', { message: 'Failed to update rapid trigger settings', isError: true });
      }
    };

    // Update deadzones
    const updateDeadzones = async () => {
      if (props.selectedKeys.length === 0) return;

      const dpChanged = pressDeadzone.value !== prevPressDeadzone.value;
      const drChanged = releaseDeadzone.value !== prevReleaseDeadzone.value;

      if (!dpChanged && !drChanged) return;

      const keys = props.selectedKeys.map(key => key.physicalKeyValue || key.keyValue);

      try {
        await processBatches(keys, async (physicalKeyValue) => {
          if (dpChanged) {
            await KeyboardService.setDp(physicalKeyValue, pressDeadzone.value);
          }
          if (drChanged) {
            await KeyboardService.setDr(physicalKeyValue, releaseDeadzone.value);
          }
        });

        // Save and reload
        await KeyboardService.saveParameters();
        await KeyboardService.reloadParameters();

        prevPressDeadzone.value = pressDeadzone.value;
        prevReleaseDeadzone.value = releaseDeadzone.value;

        emit('update-notification', { message: 'Deadzones updated successfully', isError: false });
        
        if (showOverlay.value) {
          setTimeout(() => emit('update-overlay', null), 500);
        }
      } catch (error) {
        console.error('Failed to update deadzones:', error);
        emit('update-notification', { message: 'Failed to update deadzones', isError: true });
      }
    };

    // Load RT travel for selected key
    const loadRTTravel = async () => {
      if (props.selectedKeys.length === 0) {
        pressTravel.value = 0.1;
        releaseTravel.value = 0.1;
        prevPressTravel.value = 0.1;
        prevReleaseTravel.value = 0.1;
        return;
      }

      const physicalKeyValue = props.selectedKeys[0].physicalKeyValue || props.selectedKeys[0].keyValue;
      try {
        const result = await KeyboardService.getRtTravel(physicalKeyValue);
        if (!(result instanceof Error)) {
          pressTravel.value = Number(result.pressTravel.toFixed(2));
          releaseTravel.value = Number(result.releaseTravel.toFixed(2));
          prevPressTravel.value = pressTravel.value;
          prevReleaseTravel.value = releaseTravel.value;
          return;
        }
      } catch (error) {
        console.error('Failed to load RT travel:', error);
      }

      pressTravel.value = 0.1;
      releaseTravel.value = 0.1;
      prevPressTravel.value = 0.1;
      prevReleaseTravel.value = 0.1;
    };

    // Load deadzones for selected key
    const loadDeadzones = async () => {
      if (props.selectedKeys.length === 0) {
        pressDeadzone.value = 0.1;
        releaseDeadzone.value = 0.1;
        prevPressDeadzone.value = 0.1;
        prevReleaseDeadzone.value = 0.1;
        return;
      }

      const physicalKeyValue = props.selectedKeys[0].physicalKeyValue || props.selectedKeys[0].keyValue;
      try {
        const result = await KeyboardService.getDpDr(physicalKeyValue);
        if (!(result instanceof Error)) {
          pressDeadzone.value = Number(result.dpThreshold.toFixed(2));
          releaseDeadzone.value = Number(result.drThreshold.toFixed(2));
          prevPressDeadzone.value = pressDeadzone.value;
          prevReleaseDeadzone.value = releaseDeadzone.value;
          return;
        }
      } catch (error) {
        console.error('Failed to load deadzones:', error);
      }

      pressDeadzone.value = 0.1;
      releaseDeadzone.value = 0.1;
      prevPressDeadzone.value = 0.1;
      prevReleaseDeadzone.value = 0.1;
    };

    // Load all settings
    const loadAllSettings = async () => {
      await Promise.all([
        loadRTTravel(),
        loadDeadzones()
      ]);
      
      if (showOverlay.value) {
        emit('update-overlay', null);
      }
    };

    // Adjust press travel
    const adjustPress = (delta: number) => {
      const newValue = Math.min(Math.max(pressTravel.value + delta, 0.1), maxPressTravel.value);
      pressTravel.value = Number(newValue.toFixed(2));
      updateRTSettings();
    };

    // Adjust release travel
    const adjustRelease = (delta: number) => {
      const newValue = Math.min(Math.max(releaseTravel.value + delta, 0.1), maxReleaseTravel.value);
      releaseTravel.value = Number(newValue.toFixed(2));
      updateRTSettings();
    };

    // Adjust deadzone
    const adjustDeadzone = (delta: number, type: 'press' | 'release') => {
      if (type === 'press') {
        const newValue = Math.min(Math.max(pressDeadzone.value + delta, 0.0), 1.0);
        pressDeadzone.value = Number(newValue.toFixed(2));
      } else {
        const newValue = Math.min(Math.max(releaseDeadzone.value + delta, 0.0), 1.0);
        releaseDeadzone.value = Number(newValue.toFixed(2));
      }
      updateDeadzones();
    };

    // Watch for selected keys changes
    watch(() => props.selectedKeys, async () => {
      if (showOverlay.value) {
        await loadAllSettings();
      }
    }, { deep: true });

    return {
      pressTravel,
      releaseTravel,
      pressDeadzone,
      releaseDeadzone,
      showOverlay,
      maxPressTravel,
      maxReleaseTravel,
      toggleOverlay,
      updateRTSettings,
      updateDeadzones,
      adjustPress,
      adjustRelease,
      adjustDeadzone,
    };
  },
});
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@styles/variables' as v;

.settings-section {
  flex-shrink: 0;
  border: v.$border-style;
  padding: 15px;
  margin-bottom: 10px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  font-family: v.$font-style;

  h3 {
    margin: 0;
    color: v.$primary-color;
    font-size: 1.5rem;
    font-weight: 400;
  }
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

  &:hover:not(:disabled) {
    background-color: color.adjust(v.$background-dark, $lightness: 10%);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.travel-row {
  margin-bottom: 20px;
  font-family: v.$font-style;
}

.deadzone-group {
  display: flex;
  flex-direction: column;
  gap: 0px;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 0px;
  margin-bottom: 20px;
  padding: 10px;
  border: v.$border-style;
  border-radius: v.$border-radius;
  background-color: rgba(v.$background-dark, 0.5);
  font-family: v.$font-style;

  .label {
    min-width: 220px;
    text-align: center;
    color: v.$text-color;
    font-size: 0.95rem;
    font-weight: 300;

    .travel-unit,
    .t-dzone {
      color: v.$accent-color;
    }
  }
}

.slider-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0px;

  .value-display {
    min-width: 40px;
    text-align: center;
    color: v.$text-color;
    font-size: 0.85rem;
    padding: 0 8px;
  }

  input[type='range'] {
    -webkit-appearance: none;
    appearance: none;
    flex: 1;
    max-width: 200px;
    cursor: pointer;
    height: 6px;
    background: transparent;

    &::-webkit-slider-runnable-track {
      background-color: color.adjust(v.$background-dark, $lightness: 10%);
      height: 6px;
      border-radius: 3px;
    }

    &::-webkit-slider-thumb {
      appearance: none;
      opacity: 1;
      width: 12px;
      height: 12px;
      border-radius: 4%;
      background-color: v.$primary-color;
      cursor: pointer;
      margin-top: -3px;
    }

    &::-moz-range-track {
      background-color: color.adjust(v.$background-dark, $lightness: 10%);
      height: 6px;
      border-radius: 3px;
    }

    &::-moz-range-thumb {
      width: 12px;
      height: 12px;
      border-radius: 4%;
      background-color: v.$primary-color;
      cursor: pointer;
      border: none;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.adjusters {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 10px;

  .adjust-btn {
    background-color: color.adjust(v.$background-dark, $lightness: 10%);
    color: v.$text-color;
    border: v.$border-style;
    border-radius: v.$border-radius;
    padding: 4px 10px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.9rem;
    transition: background-color 0.2s ease;

    &:hover:not(:disabled) {
      background-color: color.adjust(v.$background-dark, $lightness: 20%);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  input[type='number'] {
    width: 70px;
    background-color: rgba(v.$background-dark, 0.5);
    color: v.$text-color;
    border: v.$border-style;
    border-radius: v.$border-radius;
    padding: 4px;
    text-align: center;
    font-size: 0.9rem;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }
}
</style>
