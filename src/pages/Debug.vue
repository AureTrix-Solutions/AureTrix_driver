<template>
  <div class="lighting-debug-page">
    <h2 class="title">Lighting Debug & Testing</h2>

    <div class="lighting-container">
      <!-- Keyboard Grid -->
      <div v-if="layout.length && loaded" class="key-grid" :style="gridStyle">
        <div v-for="(row, rIdx) in layout" :key="`r-${rIdx}`" class="key-row">
          <div v-for="(keyInfo, cIdx) in row" :key="`k-${rIdx}-${cIdx}`" class="key-btn"
            :class="{ 'lighting-key-selected': loaded && selectedKeys.some(k => (k.physicalKeyValue || k.keyValue) === (keyInfo.physicalKeyValue || keyInfo.keyValue)) }"
            :style="getKeyStyle(rIdx, cIdx)" @click="selectKey(keyInfo, rIdx, cIdx)">
            <div class="key-label">
              {{ keyInfo.remappedLabel || keyMap[keyInfo.keyValue] || `Key ${keyInfo.keyValue}` }}
            </div>
          </div>
        </div>
      </div>
      <div v-else class="no-layout">
        <p>{{ error || 'No keyboard layout available. Ensure a device is connected and try again.' }}</p>
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
            <!-- RGB Settings Section -->
            <div class="settings-section">
              <div class="header-row">
                <h3>RGB Settings</h3>
                <button @click="toggleLighting" class="show-btn" :disabled="initializing">
                  {{ initializing ? 'SYNCING...' : (lightingEnabled ? 'ON' : 'OFF') }}
                </button>
              </div>
              
              <!-- Row 1: Brightness, Speed, and Lighting Mode -->
              <div class="settings-row settings-row-three">
                <div class="input-group">
                  <div class="label">Brightness</div>
                  <select v-model.number="masterLuminance" @change="applyMasterLuminance" class="mode-select"
                    :disabled="initializing || !lightingEnabled">
                    <option :value="0">0 - Off</option>
                    <option :value="1">1 - Low</option>
                    <option :value="2">2 - Medium</option>
                    <option :value="3">3 - High</option>
                    <option :value="4">4 - Maximum</option>
                  </select>
                </div>
                <div class="input-group">
                  <div class="label">Speed</div>
                  <select v-model.number="masterSpeed" @change="applyMasterSpeed" class="mode-select"
                    :disabled="initializing || !lightingEnabled">
                    <option :value="0">0 - Slowest</option>
                    <option :value="1">1 - Slow</option>
                    <option :value="2">2 - Medium</option>
                    <option :value="3">3 - Fast</option>
                    <option :value="4">4 - Fastest</option>
                  </select>
                </div>
                <div class="input-group">
                  <div class="label">Lighting Mode</div>
                  <select v-model.number="selectedMode" @change="applyModeSelection" class="mode-select"
                    :disabled="initializing || !lightingEnabled">
                    <option :value="0">Static</option>
                    <option :value="1">Wave</option>
                    <option :value="2">Wave 2</option>
                    <option :value="3">Ripple</option>
                    <option :value="4">Wheel</option>
                    <option :value="5">Wheel 2</option>
                    <option :value="6">Collide</option>
                    <option :value="7">Spectrum</option>
                    <option :value="8">Shift</option>
                    <option :value="9">Spot Shift</option>
                    <option :value="10">Race</option>
                    <option :value="11">Rainbow Wave</option>
                    <option :value="12">Snake</option>
                    <option :value="13">Twinkle</option>
                    <option :value="14">Twinkle 2</option>
                    <option :value="15">Twinkle 3</option>
                    <option :value="16">Pong</option>
                    <option :value="17">Pulse</option>
                    <option :value="18">Radiate</option>
                    <option :value="19">Column</option>
                    <option :value="20">Explode</option>
                    <option :value="21">Custom</option>
                  </select>
                  <div v-if="selectedMode === 0" class="color-picker-wrapper">
                    <label for="static-color-picker" class="color-display" :style="{ backgroundColor: staticColor }"></label>
                    <input 
                      type="color" 
                      id="static-color-picker"
                      v-model="staticColor" 
                      @change="applyStaticColor"
                      :disabled="initializing || !lightingEnabled"
                      class="color-input"
                    />
                  </div>
                </div>
              </div>

              <!-- Row 2: Sleep and Reverse -->
              <div class="settings-row">
                <div class="input-group">
                  <div class="label">Sleep</div>
                  <select v-model.number="masterSleepDelay" @change="applyMasterSleepDelay" class="mode-select"
                    :disabled="initializing || !lightingEnabled">
                    <option :value="0">Never</option>
                    <option :value="1">1 minute</option>
                    <option :value="2">2 minutes</option>
                    <option :value="3">3 minutes</option>
                    <option :value="5">5 minutes</option>
                    <option :value="10">10 minutes</option>
                    <option :value="15">15 minutes</option>
                    <option :value="20">20 minutes</option>
                    <option :value="25">25 minutes</option>
                    <option :value="30">30 minutes</option>
                    <option :value="45">45 minutes</option>
                    <option :value="60">60 minutes</option>
                    <option :value="120">120 minutes</option>
                  </select>
                </div>
                <div class="input-group">
                  <div class="label">
                    <input type="checkbox" v-model="masterDirection" @change="applyMasterDirection"
                      :disabled="initializing || !lightingEnabled" class="direction-checkbox" />
                    Reverse
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Debug Console -->
      <details class="debug-console" open>
        <summary>Debug Console (Click to toggle)</summary>
        <div class="console-controls">
          <label class="super-response-label">
            <input 
              type="checkbox" 
              v-model="superResponse" 
              @change="applySuperResponse"
              :disabled="initializing || !lightingEnabled"
              class="super-response-checkbox"
            />
            Super Response
          </label>
        </div>
        <div class="debug-output">
          <pre>{{ debugOutput }}</pre>
        </div>
        <div class="console-buttons">
          <button @click="getLightingInfo" class="debug-btn">Get Lighting</button>
          <button @click="getCustomLightingInfo" class="debug-btn">Get Custom Lighting</button>
          <button @click="getSpecialLightingInfo" class="debug-btn">Get Special Lighting</button>
          <button @click="clearDebugOutput" class="clear-btn">Clear Console</button>
        </div>
      </details>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useMappedKeyboard } from '@utils/MappedKeyboard';
import { keyMap } from '@utils/keyMap';
import debugKeyboardService from '@services/DebugKeyboardService';
import type { IDefKeyInfo } from '../types/types';

export default defineComponent({
  name: 'LightingDebug',
  setup() {
    const initializing = ref(false);
    const lightingEnabled = ref(true);
    const masterLuminance = ref(4);
    const masterSpeed = ref(3);
    const masterSleepDelay = ref(0);
    const masterDirection = ref(false);
    const selectedMode = ref(0);
    const confirmedMode = ref(0); // Tracks last successfully applied mode
    const staticColor = ref('#0037ff'); // Static mode color (colors[0])
    const superResponse = ref(false); // Super response mode
    const debugOutput = ref('Lighting Debug Console\n-------------------\n');
    const selectedKeys = ref<IDefKeyInfo[]>([]);

    const { layout, loaded, gridStyle, getKeyStyle, fetchLayerLayout, error } = useMappedKeyboard(ref(0));

    const log = (message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      debugOutput.value += `[${timestamp}] ${message}\n`;
    };

    // Throttle utility: limits function execution to once per delay period
    const throttle = (func: Function, delay: number) => {
      let lastCall = 0;
      return (...args: any[]) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
          lastCall = now;
          func(...args);
        }
      };
    };

    // Key selection functions
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

    // Lighting control functions
    const toggleLighting = async () => {
      // Prevent interaction during initialization
      if (initializing.value) {
        return;
      }

      try {
        if (lightingEnabled.value) {
          try {
            await debugKeyboardService.getLighting();
          } catch (syncError) {
          }

          await debugKeyboardService.closedLighting();
          lightingEnabled.value = false;
        } else {
          const currentState = await debugKeyboardService.getLighting();

          if (!currentState) {
            throw new Error('getLighting() returned no data');
          }

          // Filter to only required setLighting() parameters (remove 'open' and 'dynamicColorId')
          const { open, dynamicColorId, ...filteredParams } = currentState;

          await debugKeyboardService.setLighting(filteredParams);
          lightingEnabled.value = true;
        }
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
      }
    };

    const applyMasterLuminance = async () => {
      try {
        const currentState = await debugKeyboardService.getLighting();

        if (!currentState) {
          throw new Error('getLighting() returned no data');
        }

        const { open, dynamicColorId, ...filteredParams } = currentState;
        filteredParams.luminance = masterLuminance.value;

        await debugKeyboardService.setLighting(filteredParams);
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
      }
    };

    const applyMasterSpeed = async () => {
      try {
        const currentState = await debugKeyboardService.getLighting();

        if (!currentState) {
          throw new Error('getLighting() returned no data');
        }

        const { open, dynamicColorId, ...filteredParams } = currentState;
        filteredParams.speed = masterSpeed.value;

        await debugKeyboardService.setLighting(filteredParams);
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
      }
    };

    const applyMasterSleepDelay = async () => {
      try {
        const currentState = await debugKeyboardService.getLighting();

        if (!currentState) {
          throw new Error('getLighting() returned no data');
        }

        const { open, dynamicColorId, ...filteredParams } = currentState;
        filteredParams.sleepDelay = masterSleepDelay.value;

        await debugKeyboardService.setLighting(filteredParams);
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
      }
    };

    const applyMasterDirection = async () => {
      try {
        const currentState = await debugKeyboardService.getLighting();

        if (!currentState) {
          throw new Error('getLighting() returned no data');
        }

        const { open, dynamicColorId, ...filteredParams } = currentState;
        filteredParams.direction = masterDirection.value;

        await debugKeyboardService.setLighting(filteredParams);
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
      }
    };

    const applySuperResponse = async () => {
      try {
        const currentState = await debugKeyboardService.getLighting();

        if (!currentState) {
          throw new Error('getLighting() returned no data');
        }

        const { open, dynamicColorId, ...filteredParams } = currentState;
        filteredParams.superResponse = superResponse.value;

        await debugKeyboardService.setLighting(filteredParams);
        log(`Super Response ${superResponse.value ? 'enabled' : 'disabled'}`);
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
      }
    };

    const applyStaticColor = async () => {
      try {
        const currentState = await debugKeyboardService.getLighting();

        if (!currentState) {
          throw new Error('getLighting() returned no data');
        }

        const { open, dynamicColorId, ...filteredParams } = currentState;
        
        // Clone colors array to avoid mutating shared state
        if (!filteredParams.colors || filteredParams.colors.length === 0) {
          filteredParams.colors = [staticColor.value];
        } else {
          filteredParams.colors = [...filteredParams.colors];
          filteredParams.colors[0] = staticColor.value;
        }

        // Ensure Static mode is active
        filteredParams.mode = 0;
        filteredParams.type = 'static';

        await debugKeyboardService.setLighting(filteredParams);
        log(`Static color updated to ${staticColor.value}`);
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
      }
    };

    const applyModeSelection = async () => {
      // Save the state BEFORE Vue updated selectedMode (confirmedMode is the last known good state)
      const previousConfirmedMode = confirmedMode.value;
      const attemptedMode = selectedMode.value; // This is the new value Vue already set

      try {
        if (attemptedMode < 0 || attemptedMode > 21) {
          throw new Error(`Invalid mode selection: ${attemptedMode} is outside supported range (0-21)`);
        }

        const currentState = await debugKeyboardService.getLighting();

        if (!currentState) {
          throw new Error('getLighting() returned no data');
        }

        const { open, dynamicColorId, ...filteredParams } = currentState;

        // Update mode with the numeric value (SDK expects number, not string)
        filteredParams.mode = attemptedMode;

        // Update type based on mode: Static (0) = 'static', Effects (1-20) = 'dynamic', Custom (21) = 'custom'
        if (attemptedMode === 0) {
          filteredParams.type = 'static';
        } else if (attemptedMode === 21) {
          filteredParams.type = 'custom';
        } else {
          filteredParams.type = 'dynamic';
        }

        await debugKeyboardService.setLighting(filteredParams);

        // Update confirmed mode AFTER successful SDK call
        confirmedMode.value = attemptedMode;
      } catch (error) {
        // Rollback dropdown to last confirmed state
        selectedMode.value = previousConfirmedMode;
        log(`ERROR: ${(error as Error).message}`);
      }
    };

    const clearDebugOutput = () => {
      debugOutput.value = 'Lighting Debug Console\n-------------------\n';
    };

    const getLightingInfo = async () => {
      try {
        log('Fetching lighting info...');
        const lightingData = await debugKeyboardService.getLighting();
        log('Lighting Info:\n' + JSON.stringify(lightingData, null, 2));
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
      }
    };

    const getCustomLightingInfo = async () => {
      try {
        if (selectedKeys.value.length === 0) {
          log('ERROR: Please select at least one key on the virtual keyboard first');
          return;
        }

        log(`Fetching custom lighting for ${selectedKeys.value.length} selected key(s)...`);
        
        for (const key of selectedKeys.value) {
          const physicalKeyValue = key.physicalKeyValue || key.keyValue;
          const keyLabel = key.remappedLabel || keyMap[key.keyValue] || `Key ${key.keyValue}`;
          
          try {
            const customLighting = await debugKeyboardService.getCustomLighting(physicalKeyValue);
            log(`Custom Lighting for ${keyLabel} (key ${physicalKeyValue}):\n` + JSON.stringify(customLighting, null, 2));
          } catch (error) {
            log(`ERROR for ${keyLabel}: ${(error as Error).message}`);
          }
        }
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
      }
    };

    const getSpecialLightingInfo = async () => {
      try {
        log('Fetching special lighting info...');
        const specialLightingData = await debugKeyboardService.getSpecialLighting();
        log('Special Lighting Info:\n' + JSON.stringify(specialLightingData, null, 2));
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
      }
    };

    const initLightingFromDevice = async () => {
      try {
        initializing.value = true;

        const currentState = await debugKeyboardService.getLighting();

        if (currentState) {
          lightingEnabled.value = currentState.open ?? true;
          masterLuminance.value = currentState.luminance ?? 4;
          masterSpeed.value = currentState.speed ?? 3;
          masterSleepDelay.value = currentState.sleepDelay ?? 0;
          masterDirection.value = currentState.direction ?? false;
          superResponse.value = currentState.superResponse ?? false;

          // Initialize static color from colors[0]
          if (currentState.colors && currentState.colors.length > 0) {
            staticColor.value = currentState.colors[0];
          }

          // SDK returns mode as a number - use it directly
          if (currentState.mode !== undefined && currentState.mode !== null) {
            const modeNum = currentState.mode;

            if (modeNum >= 0 && modeNum <= 21) {
              selectedMode.value = modeNum;
              confirmedMode.value = modeNum;
            } else {
              selectedMode.value = 0;
              confirmedMode.value = 0;
            }
          } else {
            selectedMode.value = 0;
            confirmedMode.value = 0;
          }
        }
      } catch (error) {
        // Silent failure - initialization errors are non-critical
      } finally {
        initializing.value = false;
      }
    };

    onMounted(async () => {
      log('Debug page mounted, attempting connection...');
      await fetchLayerLayout();

      try {
        await debugKeyboardService.autoConnect();
        log('Debug service connected successfully');

        // Sync UI with keyboard state after connection
        await initLightingFromDevice();
      } catch (error) {
        log(`Auto-connect failed: ${(error as Error).message}`);
        try {
          await debugKeyboardService.requestDevice();
          log('Debug service connected via user prompt');

          await initLightingFromDevice();
        } catch (promptError) {
          log(`Connection failed: ${(promptError as Error).message}`);
          initializing.value = false;
        }
      }
    });

    return {
      initializing,
      lightingEnabled,
      masterLuminance,
      masterSpeed,
      masterSleepDelay,
      masterDirection,
      superResponse,
      selectedMode,
      staticColor,
      debugOutput,
      selectedKeys,
      layout,
      loaded,
      gridStyle,
      getKeyStyle,
      keyMap,
      error,
      selectKey,
      selectAll,
      selectWASD,
      selectLetters,
      selectNumbers,
      selectNone,
      toggleLighting,
      applyMasterLuminance,
      applyMasterSpeed,
      applyMasterSleepDelay,
      applyMasterDirection,
      applySuperResponse,
      applyStaticColor,
      applyModeSelection,
      clearDebugOutput,
      getLightingInfo,
      getCustomLightingInfo,
      getSpecialLightingInfo,
    };
  },
});
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@styles/variables' as v;

.lighting-debug-page {
  padding: 20px;
  color: v.$text-color;

  .title {
    color: v.$primary-color;
    margin-bottom: 20px;
    font-size: 1.5rem;
    font-weight: 600;
    font-family: v.$font-style;
  }
}

.lighting-container {
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

  .key-label {
    font-size: 1rem;
    font-weight: 300;
  }

  &.lighting-key-selected {
    border-color: v.$accent-color;
    box-shadow: 0 0 8px rgba(v.$accent-color, 0.5);
    background: linear-gradient(to bottom, color.adjust(v.$accent-color, $lightness: -20%) 70%, color.adjust(v.$accent-color, $lightness: -10%) 100%);
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3), inset 0 -2px 4px rgba(255, 255, 255, 0.2);
  }
}

.bottom-section {
  display: flex;
  flex: 1;
  flex-shrink: 0;
  gap: 10px;
  position: relative;
  margin-right: auto;
  margin-left: auto;
  margin-top: -50px;
  justify-content: center;
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

.parent {
  display: flex;
  justify-content: center;
}

.settings-panel {
  width: 1425px;
  padding: 10px;
  border: 1px solid rgba(v.$text-color, 0.2);
  border-radius: v.$border-radius;
  background-color: color.adjust(v.$background-dark, $lightness: -100%);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-section {
  flex-shrink: 0;
  border: 1px solid rgba(v.$text-color, 0.2);
  border-radius: v.$border-radius;
  padding: 10px 15px;
  background: rgba(v.$background-dark, 0.3);

  .header-row {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    font-family: v.$font-style;

    h3 {
      color: v.$primary-color;
      width: auto;
      margin: 0;
      margin-bottom: -5px;
      margin-right: 10px;
      font-size: 1.5rem;
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

      &:hover {
        background-color: color.adjust(v.$accent-color, $lightness: -20%);
        color: white;
      }

      &:disabled {
        pointer-events: none;
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }
}

.settings-row {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 10px;

  .input-group {
    margin-bottom: 0;
  }
}

.settings-row-three {
  .input-group {
    flex: 1;
    min-width: 0;
    width: auto;
  }
}

.input-group {
  display: flex;
  align-items: center;
  gap: 0px;
  margin-bottom: 20px;
  padding: 10px;
  width: 400px;
  height: 30px;
  border: v.$border-style;
  border-radius: v.$border-radius;
  background-color: rgba(v.$background-dark, 0.5);
  font-family: v.$font-style;

  .label {
    min-width: 150px;
    text-align: left;
    color: v.$text-color;
    font-size: 0.95rem;
    font-weight: 300;
  }

  .mode-select {
    width: 300px;
    padding: 8px 12px;
    background: rgba(v.$background-dark, 0.8);
    border: 1px solid rgba(v.$text-color, 0.3);
    border-radius: v.$border-radius;
    color: v.$text-color;
    font-size: 0.9rem;
    font-family: v.$font-style;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .color-picker-wrapper {
    display: flex;
    align-items: center;
    margin-left: 15px;
    position: relative;
  }

  .color-display {
    width: 40px;
    height: 40px;
    border: 2px solid rgba(v.$text-color, 0.3);
    border-radius: v.$border-radius;
    cursor: pointer;
    display: block;
    transition: border-color 0.2s ease;

    &:hover {
      border-color: v.$accent-color;
    }
  }

  .color-input {
    position: absolute;
    opacity: 0;
    width: 40px;
    height: 40px;
    cursor: pointer;

    &:disabled {
      cursor: not-allowed;
    }
  }

  .direction-checkbox {
    margin-right: 10px;
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: v.$accent-color;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.debug-console {
  margin-top: 20px;
  border: 1px solid rgba(v.$text-color, 0.2);
  border-radius: v.$border-radius;
  background-color: rgba(v.$background-dark, 0.5);

  summary {
    padding: 12px 15px;
    cursor: pointer;
    font-weight: 600;
    font-family: v.$font-style;
    color: v.$accent-color;
    user-select: none;

    &:hover {
      background: rgba(v.$accent-color, 0.1);
    }
  }

  .console-controls {
    padding: 15px 15px 0 15px;
    margin-bottom: 10px;
  }

  .super-response-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.95rem;
    color: v.$text-color;
    cursor: pointer;
    user-select: none;
  }

  .super-response-checkbox {
    width: 18px;
    height: 18px;
    cursor: pointer;
    accent-color: v.$accent-color;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .debug-output {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(v.$text-color, 0.2);
    border-radius: v.$border-radius;
    padding: 15px;
    margin: 0 15px 15px 15px;
    max-height: 300px;
    overflow-y: auto;

    pre {
      margin: 0;
      font-family: 'Courier New', monospace;
      font-size: 0.85rem;
      color: v.$text-color;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  }

  .console-buttons {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin: 0 15px 15px 15px;
  }

  .debug-btn {
    padding: 8px 16px;
    background: v.$accent-color;
    color: white;
    border: none;
    border-radius: v.$border-radius;
    cursor: pointer;
    font-size: 0.9rem;
    font-family: v.$font-style;
    transition: background 0.2s ease;

    &:hover {
      background: color.adjust(v.$accent-color, $lightness: -10%);
    }
  }

  .clear-btn {
    padding: 8px 16px;
    background: #6b7280;
    color: white;
    border: none;
    border-radius: v.$border-radius;
    cursor: pointer;
    font-size: 0.9rem;
    font-family: v.$font-style;

    &:hover {
      background: color.adjust(#6b7280, $lightness: 10%);
    }
  }
}
</style>
