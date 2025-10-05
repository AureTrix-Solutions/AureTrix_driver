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
        <button @click="toggleLinkDeadZones" class="link-btn">{{ deadZonesLinked ? 'Unlink' : 'Link' }} Dead Zones</button>
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
  emits: ['update-notification', 'update-overlay', 'update-single-overlay'],
  setup(props, { emit }) {
    const globalTravel = ref(2.0);
    const pressDead = ref(0.2);
    const releaseDead = ref(0.2);
    const deadZonesLinked = ref(false);
    const showOverlay = ref(false);

    const minTravel = computed(() => {
      return Math.max(0.1, pressDead.value);
    });

    const maxTravel = computed(() => {
      return Math.min(props.profileMaxTravel, props.profileMaxTravel - releaseDead.value);
    });

    // Clamp globalTravel when dead zones change
    watch([pressDead, releaseDead], () => {
      if (globalTravel.value < minTravel.value) {
        globalTravel.value = Number(minTravel.value.toFixed(2));
      } else if (globalTravel.value > maxTravel.value) {
        globalTravel.value = Number(maxTravel.value.toFixed(2));
      }
    });

    const loadGlobalSettings = async () => {
      try {
        const settings = await KeyboardService.getGlobalTouchTravel();
        if (settings instanceof Error) {
          throw settings;
        }
        if (settings.globalTouchTravel >= 0.1 && settings.globalTouchTravel <= 4.0) {
          globalTravel.value = Number(settings.globalTouchTravel.toFixed(2));
        }
        if (settings.pressDead >= 0 && settings.pressDead <= 1.0) {
          pressDead.value = Number(settings.pressDead.toFixed(2));
        }
        if (settings.releaseDead >= 0 && settings.releaseDead <= 1.0) {
          releaseDead.value = Number(settings.releaseDead.toFixed(2));
        }
        emit('update-notification', `Global settings loaded: travel ${globalTravel.value.toFixed(2)} mm`, false);
      } catch (error) {
        console.error(`Failed to load global settings:`, error);
        emit('update-notification', `Failed to load global settings: ${(error as Error).message}`, true);
      }
    };

    const updateGlobalDeadZones = async () => {
      try {
        const keyIds = props.layout.flat().map(keyInfo => keyInfo.physicalKeyValue || keyInfo.keyValue);
        //console.log(`Updating dead zones for global mode keys among ${keyIds.length} keys`);
        const BATCH_SIZE = 80;
        const batches = [];
        for (let i = 0; i < keyIds.length; i += BATCH_SIZE) {
          batches.push(keyIds.slice(i, i + BATCH_SIZE));
        }

        const globalModeKeys: number[] = [];
        // First, collect all global mode keys
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
        //console.log(`Found ${globalModeKeys.length} global mode keys:`, globalModeKeys);

        if (globalModeKeys.length === 0) {
          //console.log('No global mode keys to update dead zones for');
          return;
        }

        // Now, batch set dead zones for global mode keys
        const globalBatches = [];
        for (let i = 0; i < globalModeKeys.length; i += BATCH_SIZE) {
          globalBatches.push(globalModeKeys.slice(i, i + BATCH_SIZE));
        }

        for (const batch of globalBatches) {
          await Promise.all(
            batch.map(async (keyId) => {
              try {
                await Promise.all([
                  KeyboardService.setDp(keyId, pressDead.value),
                  KeyboardService.setDr(keyId, releaseDead.value),
                ]);
              } catch (error) {
                console.warn(`Failed to set dead zones for global key ${keyId}:`, error);
              }
            })
          );
          //console.log(`Updated dead zones for batch of ${batch.length} global keys: press ${pressDead.value.toFixed(2)}, release ${releaseDead.value.toFixed(2)} mm`);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        emit('update-notification', `Updated dead zones for ${globalModeKeys.length} global keys`, false);
      } catch (error) {
        console.error('Failed to update global dead zones:', error);
        emit('update-notification', `Failed to update global dead zones: ${(error as Error).message}`, true);
      }
    };

    const updateGlobalSettings = async () => {
      try {
        const param = { globalTouchTravel: globalTravel.value, pressDead: pressDead.value, releaseDead: releaseDead.value };
        await KeyboardService.setGlobalTouchTravel(param);
        //console.log(`Updated global settings to:`, param);
        await updateGlobalDeadZones(); // Apply dead zones to global keys
        emit('update-notification', `Global settings updated: travel ${globalTravel.value.toFixed(2)} mm`, false);
        // Emit overlay data when sliders are released
        if (showOverlay.value) {
          emit('update-overlay', {
            travel: globalTravel.value.toFixed(2),
            pressDead: pressDead.value.toFixed(2),
            releaseDead: releaseDead.value.toFixed(2),
          });
        }
      } catch (error) {
        console.error(`Failed to update global settings:`, error);
        emit('update-notification', `Failed to update global settings: ${(error as Error).message}`, true);
      }
    };

    const adjustTravel = (delta: number) => {
      const newValue = Math.min(Math.max(globalTravel.value + delta, minTravel.value), maxTravel.value);
      globalTravel.value = Number(newValue.toFixed(2));
      //console.log(`Adjusted global travel to ${globalTravel.value.toFixed(2)} mm`);
      updateGlobalSettings();
    };

    const adjustDeadZone = (delta: number, type: 'press' | 'release') => {
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
      //console.log(`Adjusted ${type} dead zone to ${newValue.toFixed(2)} mm`);
      updateGlobalSettings();
    };

    const toggleLinkDeadZones = () => {
      deadZonesLinked.value = !deadZonesLinked.value;
      if (deadZonesLinked.value) {
        releaseDead.value = pressDead.value;
        updateGlobalSettings();
      }
    };

    const setKeyToGlobalMode = async () => {
      if (props.selectedKeys.length === 0) {
        emit('update-notification', 'No keys selected', true);
        return;
      }
      const keys = props.selectedKeys.map(key => ({
        physicalKeyValue: key.physicalKeyValue || key.keyValue,
        keyValue: key.keyValue,
      }));
      try {
        // Set all keys to global mode in a single Promise.all
        await Promise.all(
          keys.map(({ physicalKeyValue }) =>
            KeyboardService.setPerformanceMode(physicalKeyValue, 'global', 0)
          )
        );
        // Apply global settings to ensure keys adopt current values
        await updateGlobalSettings();
        
        // Clear single overlays (re-poll modes to remove changed keys)
        emit('update-single-overlay', null);
        // Clear global overlays (re-poll modes to ensure consistency)
        emit('update-overlay', null);
        
        // If global overlay is shown, repopulate with current data
        if (showOverlay.value) {
          setTimeout(() => {
            emit('update-overlay', {
              travel: globalTravel.value.toFixed(2),
              pressDead: pressDead.value.toFixed(2),
              releaseDead: releaseDead.value.toFixed(2),
            });
          }, 300); // Small delay to allow clears to process
        }
        
        const keyDisplay = props.selectedKeys.length === 1
          ? keyMap[props.selectedKeys[0].keyValue] || props.selectedKeys[0].keyValue
          : `${props.selectedKeys.length} keys`;
        emit('update-notification', `Set ${keyDisplay} to global mode and applied global settings`, false);
      } catch (error) {
        console.error(`Failed to set global mode or apply global settings for ${keys.length} keys:`, error);
        emit('update-notification', `Failed to set keys to global mode: ${(error as Error).message}`, true);
      }
    };

    const toggleOverlay = () => {
      showOverlay.value = !showOverlay.value;
      // Emit overlay data when toggling
      emit('update-overlay', showOverlay.value ? {
        travel: globalTravel.value.toFixed(2),
        pressDead: pressDead.value.toFixed(2),
        releaseDead: releaseDead.value.toFixed(2),
      } : null);
    };

    watch([pressDead, releaseDead], () => {
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
// (Style remains unchanged from previous version)
@use 'sass:color';
@use '@styles/variables' as v;

.settings-section {
  flex-shrink: 0;
  border: 1px solid rgba(v.$text-color, 0.2);
  height: 170px;
  padding-left: 8px;

  .header-row {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    margin-bottom: 16px;
  }

  h3 {
    color: v.$primary-color;
    flex-shrink: 0;
    width: auto;
    font-size: 1.5rem;
    text-decoration: underline;
    margin: 0;
    margin-right: 10px;
  }

  .show-btn {
    padding: 3px 8px;
    background-color: v.$accent-color;
    color: v.$background-dark;
    border: none;
    border-radius: v.$border-radius;
    cursor: pointer;
    font-size: 0.7rem;
    font-weight: 500;
    transition: background-color 0.2s ease;
    align-self: left;

    &:hover:not(:disabled) {
      background-color: color.adjust(v.$accent-color, $lightness: 10%);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .global-travel-row {
    display: flex;
    flex-shrink: 0;
    height: 10px;
    padding-top: 30px;
    gap: 0px;
    margin-bottom: 20px;
    align-items: center;
  }

  .input-group {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 0px;
    margin-bottom: 20px;
    padding: 10px;
    width: 600px;
    height: 30px;
    border: 1px solid rgba(v.$text-color, 0.1);
    border-radius: v.$border-radius;
    background-color: rgba(v.$background-dark, 0.5);

    &.global-mode-group {
      display: inline;
      padding-left: 5px;
      width: 150px;
      height: 72px;
      gap: 0px;
      height: 30px;
      justify-content: center;
      border: none;
    }

    .label {
      min-width: 180px;
      text-align: center;
      color: v.$text-color;
      font-size: 0.95rem;
      font-weight: 500;
    }

    .slider-container {
      flex: 1;
      display: flex;
      flex-shrink: 0;
      align-items: center;
      gap: 8px;

      input[type="range"] {
        flex: 1;
        max-width: 200px;
        cursor: pointer;
        height: 6px;

        &::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: v.$accent-color;
          cursor: pointer;
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
      flex-shrink: 0;
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
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 50%;
        background-color: rgba(v.$text-color, 0.2);
        color: v.$text-color;
        cursor: pointer;
        font-size: 1rem;
        font-weight: bold;
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
    background-color: v.$accent-color;
    color: v.$background-dark;
    border: none;
    border-radius: v.$border-radius;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: background-color 0.2s ease;

    &:hover:not(:disabled) {
      background-color: color.adjust(v.$accent-color, $lightness: 10%);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .global-mode-btn {
    padding: 8px 16px;
    background-color: v.$primary-color;
    color: v.$background-dark;
    border: none;
    border-radius: v.$border-radius;
    cursor: pointer;
    font-size: .9rem;
    font-weight: 500;
    transition: background-color 0.2s ease;
    width: 140.88px;
    height: 32px;
    text-align: center;
    margin-top: 0px;

    &:hover:not(:disabled) {
      background-color: color.adjust(v.$primary-color, $lightness: 10%);
    }

    &:disabled {
      background-color: color.adjust(v.$primary-color, $lightness: -20%);
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}
</style>