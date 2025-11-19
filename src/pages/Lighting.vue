<template>
  <div class="lighting-page">
    <h2 class="title">RGB Lighting</h2>

    <div class="lighting-container">
      <!-- Virtual Keyboard -->
      <div v-if="layout.length && loaded" class="key-grid" :style="gridStyle">
        <div v-for="(row, rIdx) in layout" :key="`r-${rIdx}`" class="key-row">
          <div v-for="(keyInfo, cIdx) in row" :key="`k-${rIdx}-${cIdx}`" class="key-btn"
            :class="{ 'lighting-key-selected': isKeySelected(keyInfo) }" :style="getKeyStyleWithCustomColor(rIdx, cIdx)"
            @click="selectKey(keyInfo)">
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
        <!-- Selection Buttons -->
        <div class="selection-buttons">
          <button @click="selectAll" class="select-btn">Select All</button>
          <button @click="selectWASD" class="select-btn">Select WASD</button>
          <button @click="selectLetters" class="select-btn">Select Letters</button>
          <button @click="selectNumbers" class="select-btn">Select Numbers</button>
          <button @click="selectNone" class="select-btn">Select None</button>
        </div>

        <!-- RGB Settings Panel -->
        <div class="settings-panel">
          <div class="settings-section">
            <div class="header-row">
              <h3>RGB Settings</h3>
              <button @click="toggleLighting" class="toggle-btn" :disabled="initializing">
                {{ initializing ? 'SYNCING...' : (lightingEnabled ? 'ON' : 'OFF') }}
              </button>
            </div>

            <!-- Master Controls Row -->
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
                <!-- Color Picker for Static and Custom modes -->
                <div v-if="selectedMode === 0 || selectedMode === 21" class="color-picker-wrapper">
                  <label for="color-picker" class="color-display" :style="{ backgroundColor: staticColor }"></label>
                  <input type="color" id="color-picker" v-model="staticColor"
                    @input="selectedMode === 0 ? applyStaticColorThrottled() : updateVirtualKeyboardColorOnly()"
                    @change="selectedMode === 0 ? applyStaticColor() : applyCustomColor()"
                    :disabled="initializing || !lightingEnabled" class="color-input" />
                </div>
              </div>
            </div>

            <!-- Additional Controls Row -->
            <div class="settings-row">
              <div class="input-group">
                <div class="label">Sleep Timer</div>
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
                <div class="label">Direction</div>
                <select v-model="masterDirection" @change="applyMasterDirection" class="mode-select"
                  :disabled="initializing || !lightingEnabled">
                  <option :value="false">Normal</option>
                  <option :value="true">Reverse</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed, watch, reactive } from 'vue';
import { useMappedKeyboard } from '@utils/MappedKeyboard';
import { useBatchProcessing } from '@/composables/useBatchProcessing';
import { keyMap } from '@utils/keyMap';
import KeyboardService from '@services/KeyboardService';
import type { IDefKeyInfo } from '../types/types';

export default defineComponent({
  name: 'Lighting',
  setup() {
    const initializing = ref(false);
    const lightingEnabled = ref(true);
    const masterLuminance = ref(4);
    const masterSpeed = ref(3);
    const masterSleepDelay = ref(0);
    const masterDirection = ref(false);
    const selectedMode = ref(0);
    const confirmedMode = ref(0);
    const staticColor = ref('#0037ff');
    const selectedKeys = ref<IDefKeyInfo[]>([]);

    const { layout, loaded, gridStyle, getKeyStyle, fetchLayerLayout, error } = useMappedKeyboard(ref(0));
    const { processBatches } = useBatchProcessing();

    const customColors = reactive<Record<number, { R: number; G: number; B: number }>>({});

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

    const rgbToHex = (r: number, g: number, b: number): string => {
      const toHex = (n: number) => n.toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };

    const hexToRgb = (hex: string): { R: number; G: number; B: number } => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? { R: parseInt(result[1], 16), G: parseInt(result[2], 16), B: parseInt(result[3], 16) }
        : { R: 0, G: 55, B: 255 };
    };

    const displayedColor = computed(() => {
      if (selectedMode.value !== 21) return staticColor.value;
      if (selectedKeys.value.length === 0) return '#ffffff';
      if (selectedKeys.value.length === 1) {
        const keyValue = selectedKeys.value[0].physicalKeyValue || selectedKeys.value[0].keyValue;
        const rgb = customColors[keyValue];
        return rgb ? rgbToHex(rgb.R, rgb.G, rgb.B) : '#ffffff';
      }

      // Multiple keys: return majority color
      const keyColors = selectedKeys.value
        .map(k => {
          const keyValue = k.physicalKeyValue || k.keyValue;
          return customColors[keyValue] ? rgbToHex(customColors[keyValue].R, customColors[keyValue].G, customColors[keyValue].B) : null;
        })
        .filter(c => c !== null) as string[];

      if (keyColors.length === 0) return '#ffffff';

      const colorCounts = new Map<string, number>();
      keyColors.forEach(color => colorCounts.set(color, (colorCounts.get(color) || 0) + 1));

      let maxCount = 0;
      let majorityColor = keyColors[0];
      colorCounts.forEach((count, color) => {
        if (count > maxCount) {
          maxCount = count;
          majorityColor = color;
        }
      });

      return majorityColor;
    });

    watch(
      () => [selectedKeys.value.length, selectedMode.value],
      () => {
        if (selectedMode.value === 21) {
          staticColor.value = displayedColor.value;
        }
      },
      { deep: true }
    );

    const getKeyStyleWithCustomColor = (rIdx: number, cIdx: number) => {
      const baseStyle = getKeyStyle(rIdx, cIdx);

      if (selectedMode.value === 21 && layout.value[rIdx] && layout.value[rIdx][cIdx]) {
        const keyInfo = layout.value[rIdx][cIdx];
        const keyValue = keyInfo.physicalKeyValue || keyInfo.keyValue;
        const rgb = customColors[keyValue];

        if (rgb) {
          const bgColor = rgbToHex(rgb.R, rgb.G, rgb.B);
          return {
            ...baseStyle,
            background: bgColor,
            backgroundImage: 'none',
          };
        }
      }

      return baseStyle;
    };

    const selectKey = (key: IDefKeyInfo) => {
      const physicalKeyValue = key.physicalKeyValue || key.keyValue;
      const existingIndex = selectedKeys.value.findIndex(k => (k.physicalKeyValue || k.keyValue) === physicalKeyValue);
      if (existingIndex > -1) {
        selectedKeys.value.splice(existingIndex, 1);
      } else {
        selectedKeys.value.push(key);
      }
    };

    const isKeySelected = (key: IDefKeyInfo): boolean => {
      const physicalKeyValue = key.physicalKeyValue || key.keyValue;
      return selectedKeys.value.some(k => (k.physicalKeyValue || k.keyValue) === physicalKeyValue);
    };

    const selectAll = () => {
      const totalKeys = layout.value.flat().length;
      selectedKeys.value = selectedKeys.value.length === totalKeys ? [] : layout.value.flat();
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

    const toggleLighting = async () => {
      if (initializing.value) return;

      try {
        if (lightingEnabled.value) {
          const result = await KeyboardService.closedLighting();
          if (!(result instanceof Error)) {
            lightingEnabled.value = false;
          } else {
            console.error('Failed to turn off lighting:', result.message);
          }
        } else {
          const currentState = await KeyboardService.getLighting();
          if (currentState instanceof Error) {
            console.error('Failed to get lighting state:', currentState.message);
            return;
          }

          const { open, dynamicColorId, ...filteredParams } = currentState;
          const result = await KeyboardService.setLighting(filteredParams);
          if (!(result instanceof Error)) {
            lightingEnabled.value = true;
          } else {
            console.error('Failed to turn on lighting:', result.message);
          }
        }
      } catch (error) {
        console.error('Failed to toggle lighting:', error);
      }
    };

    const applyMasterLuminance = async () => {
      try {
        const currentState = await KeyboardService.getLighting();
        if (currentState instanceof Error) {
          console.error('Failed to get lighting state:', currentState.message);
          return;
        }

        const { open, dynamicColorId, ...filteredParams } = currentState;
        filteredParams.luminance = masterLuminance.value;

        const result = await KeyboardService.setLighting(filteredParams);
        if (result instanceof Error) {
          console.error('Failed to set brightness:', result.message);
        }
      } catch (error) {
        console.error('Failed to set brightness:', error);
      }
    };

    const applyMasterSpeed = async () => {
      try {
        const currentState = await KeyboardService.getLighting();
        if (currentState instanceof Error) {
          console.error('Failed to get lighting state:', currentState.message);
          return;
        }

        const { open, dynamicColorId, ...filteredParams } = currentState;
        filteredParams.speed = masterSpeed.value;

        const result = await KeyboardService.setLighting(filteredParams);
        if (result instanceof Error) {
          console.error('Failed to set speed:', result.message);
        }
      } catch (error) {
        console.error('Failed to set speed:', error);
      }
    };

    const applyMasterSleepDelay = async () => {
      try {
        const currentState = await KeyboardService.getLighting();
        if (currentState instanceof Error) {
          console.error('Failed to get lighting state:', currentState.message);
          return;
        }

        const { open, dynamicColorId, ...filteredParams } = currentState;
        filteredParams.sleepDelay = masterSleepDelay.value;

        const result = await KeyboardService.setLighting(filteredParams);
        if (result instanceof Error) {
          console.error('Failed to set sleep timer:', result.message);
        }
      } catch (error) {
        console.error('Failed to set sleep timer:', error);
      }
    };

    const applyMasterDirection = async () => {
      try {
        const currentState = await KeyboardService.getLighting();
        if (currentState instanceof Error) {
          console.error('Failed to get lighting state:', currentState.message);
          return;
        }

        const { open, dynamicColorId, ...filteredParams } = currentState;
        filteredParams.direction = masterDirection.value;

        const result = await KeyboardService.setLighting(filteredParams);
        if (result instanceof Error) {
          console.error('Failed to set direction:', result.message);
        }
      } catch (error) {
        console.error('Failed to set direction:', error);
      }
    };


    const applyStaticColor = async () => {
      try {
        const currentState = await KeyboardService.getLighting();
        if (currentState instanceof Error) {
          console.error('Failed to get lighting state:', currentState.message);
          return;
        }

        const { open, dynamicColorId, ...filteredParams } = currentState;

        if (!filteredParams.colors || filteredParams.colors.length === 0) {
          filteredParams.colors = [staticColor.value];
        } else {
          filteredParams.colors = [...filteredParams.colors];
          filteredParams.colors[0] = staticColor.value;
        }

        filteredParams.mode = 0;
        filteredParams.type = 'static';

        const result = await KeyboardService.setLighting(filteredParams);
        if (result instanceof Error) {
          console.error('Failed to set static color:', result.message);
        }
      } catch (error) {
        console.error('Failed to set static color:', error);
      }
    };

    const applyStaticColorThrottled = throttle(applyStaticColor, 100);

    const applyCustomColor = async (saveToFlash: boolean = true) => {
      try {
        if (selectedKeys.value.length === 0) return;

        const rgb = hexToRgb(staticColor.value);
        const keyIds = selectedKeys.value.map(key => key.physicalKeyValue || key.keyValue);

        await processBatches(
          keyIds,
          async (keyValue: number) => {
            const result = await KeyboardService.setCustomLighting({
              key: keyValue,
              r: rgb.R,
              g: rgb.G,
              b: rgb.B
            });

            if (!(result instanceof Error)) {
              customColors[keyValue] = { R: rgb.R, G: rgb.G, B: rgb.B };
            } else {
              console.error(`Failed to set custom color for key ${keyValue}:`, result.message);
            }
          },
          80
        );

        if (saveToFlash) {
          const saveResult = await KeyboardService.saveCustomLighting();
          if (saveResult instanceof Error) {
            console.error('Failed to save custom lighting:', saveResult.message);
          }
        }
      } catch (error) {
        console.error('Failed to apply custom color:', error);
      }
    };

    const applyCustomColorThrottled = throttle(() => applyCustomColor(false), 100);

    const updateVirtualKeyboardColorOnly = () => {
      if (selectedKeys.value.length === 0) return;

      const rgb = hexToRgb(staticColor.value);
      const keyIds = selectedKeys.value.map(key => key.physicalKeyValue || key.keyValue);

      // Update customColors reactive object for virtual keyboard preview only
      // No SDK calls - instant visual update
      keyIds.forEach(keyValue => {
        customColors[keyValue] = { R: rgb.R, G: rgb.G, B: rgb.B };
      });
    };

    const loadCustomColorsFromKeyboard = async () => {
      if (layout.value.length === 0) return;

      try {
        const allKeys = layout.value.flat();

        for (const key of allKeys) {
          try {
            const keyValue = key.physicalKeyValue || key.keyValue;
            const result = await KeyboardService.getCustomLighting(keyValue);

            if (!(result instanceof Error) && result && result.R !== undefined) {
              customColors[keyValue] = {
                R: result.R,
                G: result.G,
                B: result.B,
              };
            }
          } catch (error) {
            // Skip keys that fail
          }
        }
      } catch (error) {
        console.error('Failed to load custom colors:', error);
      }
    };

    const applyModeSelection = async () => {
      const previousConfirmedMode = confirmedMode.value;
      const attemptedMode = selectedMode.value;

      try {
        if (attemptedMode < 0 || attemptedMode > 21) {
          throw new Error(`Invalid mode selection: ${attemptedMode} is outside supported range (0-21)`);
        }

        const currentState = await KeyboardService.getLighting();
        if (currentState instanceof Error) {
          throw new Error('getLighting() returned error: ' + currentState.message);
        }

        if (!currentState) {
          throw new Error('getLighting() returned no data');
        }

        const { open, dynamicColorId, ...filteredParams } = currentState;
        filteredParams.mode = attemptedMode;

        // Update type based on mode: Static (0) = 'static', Effects (1-20) = 'dynamic', Custom (21) = 'custom'
        if (attemptedMode === 0) {
          filteredParams.type = 'static';
          // Sync color picker to actual static color when switching to Static mode
          if (currentState.colors && currentState.colors.length > 0) {
            staticColor.value = currentState.colors[0];
          }
        } else if (attemptedMode === 21) {
          filteredParams.type = 'custom';
        } else {
          filteredParams.type = 'dynamic';
        }

        const result = await KeyboardService.setLighting(filteredParams);
        if (result instanceof Error) {
          throw new Error('setLighting() failed: ' + result.message);
        }

        // Update confirmed mode AFTER successful SDK call
        confirmedMode.value = attemptedMode;

        // If switching to Custom mode, load all custom colors from keyboard
        if (attemptedMode === 21) {
          await loadCustomColorsFromKeyboard();
        }
      } catch (error) {
        // Rollback dropdown to last confirmed state
        selectedMode.value = previousConfirmedMode;
        console.error('Failed to change lighting mode:', error);
      }
    };

    const initLightingFromDevice = async () => {
      initializing.value = true;

      try {
        const currentState = await KeyboardService.getLighting();
        if (currentState instanceof Error) {
          console.error('Failed to initialize lighting settings:', currentState.message);
          initializing.value = false;
          return;
        }

        lightingEnabled.value = currentState.open === true || currentState.open === 1;
        masterLuminance.value = currentState.luminance ?? 4;
        masterSpeed.value = currentState.speed ?? 3;
        masterSleepDelay.value = currentState.sleepDelay ?? 0;
        masterDirection.value = currentState.direction ?? false;
        selectedMode.value = currentState.mode ?? 0;
        confirmedMode.value = currentState.mode ?? 0;

        if (selectedMode.value === 0 && currentState.colors && currentState.colors.length > 0) {
          staticColor.value = currentState.colors[0];
        }

        if (selectedMode.value === 21) {
          await loadCustomColorsFromKeyboard();
        }
      } catch (error) {
        console.error('Failed to initialize lighting settings:', error);
      } finally {
        initializing.value = false;
      }
    };

    onMounted(async () => {
      await fetchLayerLayout();
      await initLightingFromDevice();
    });

    return {
      selectedKeys,
      layout,
      loaded,
      gridStyle,
      getKeyStyleWithCustomColor,
      keyMap,
      error,
      selectKey,
      isKeySelected,
      selectAll,
      selectWASD,
      selectLetters,
      selectNumbers,
      selectNone,
      toggleLighting,
      initializing,
      lightingEnabled,
      masterLuminance,
      masterSpeed,
      masterSleepDelay,
      masterDirection,
      selectedMode,
      staticColor,
      applyMasterLuminance,
      applyMasterSpeed,
      applyMasterSleepDelay,
      applyMasterDirection,
      applyStaticColor,
      applyStaticColorThrottled,
      applyCustomColor,
      applyCustomColorThrottled,
      updateVirtualKeyboardColorOnly,
      applyModeSelection,
    };
  },
});
</script>

<style lang="scss" scoped>
@use 'sass:color';
@use '@styles/variables' as v;

.lighting-page {
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

    .toggle-btn {
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
  width: 430px;
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
    background: rgba(v.$background-dark, 100%);
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

  .checkbox-input {
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

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  color: v.$text-color;
  cursor: pointer;
  user-select: none;
}
</style>
