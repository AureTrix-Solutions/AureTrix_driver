<template>
  <div class="lighting-page">
    <h2 class="title">RGB Lighting</h2>

    <div class="lighting-container">
      <!-- Virtual Keyboard -->
      <div v-if="layout.length && loaded" class="key-grid" :style="gridStyle">
        <div v-for="(row, rIdx) in layout" :key="`r-${rIdx}`" class="key-row">
          <div v-for="(keyInfo, cIdx) in row" :key="`k-${rIdx}-${cIdx}`" class="key-btn"
            :class="{ 'key-selected': isKeySelected(keyInfo) }"
            :style="getKeyStyleWithCustomColor(rIdx, cIdx)" 
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
                  <input 
                    type="color" 
                    id="color-picker"
                    v-model="staticColor" 
                    @input="selectedMode === 0 ? applyStaticColorThrottled() : applyCustomColorThrottled()"
                    @change="selectedMode === 0 ? applyStaticColor() : applyCustomColor()"
                    :disabled="initializing || !lightingEnabled"
                    class="color-input"
                  />
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
              <div class="input-group">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    v-model="superResponse" 
                    @change="applySuperResponse"
                    :disabled="initializing || !lightingEnabled"
                    class="checkbox-input"
                  />
                  <span>Super Response</span>
                </label>
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
    const superResponse = ref(false);
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
      const wasdKeys = layout.value.flat().filter(keyInfo => {
        const label = keyInfo.remappedLabel || keyMap[keyInfo.keyValue] || '';
        return wasdLabels.includes(label.toUpperCase());
      });
      selectedKeys.value = wasdKeys;
    };

    const selectLetters = () => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      const letterKeys = layout.value.flat().filter(keyInfo => {
        const label = keyInfo.remappedLabel || keyMap[keyInfo.keyValue] || '';
        return letters.includes(label.toUpperCase());
      });
      selectedKeys.value = letterKeys;
    };

    const selectNumbers = () => {
      const numbers = '0123456789'.split('');
      const numberKeys = layout.value.flat().filter(keyInfo => {
        const label = keyInfo.remappedLabel || keyMap[keyInfo.keyValue] || '';
        return numbers.includes(label);
      });
      selectedKeys.value = numberKeys;
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

    const applySuperResponse = async () => {
      try {
        const currentState = await KeyboardService.getLighting();
        if (currentState instanceof Error) {
          console.error('Failed to get lighting state:', currentState.message);
          return;
        }

        const { open, dynamicColorId, ...filteredParams } = currentState;
        filteredParams.superResponse = superResponse.value;

        const result = await KeyboardService.setLighting(filteredParams);
        if (result instanceof Error) {
          console.error('Failed to set super response:', result.message);
        }
      } catch (error) {
        console.error('Failed to set super response:', error);
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
      const previousMode = confirmedMode.value;
      
      try {
        const currentState = await KeyboardService.getLighting();
        if (currentState instanceof Error) {
          console.error('Failed to get lighting state:', currentState.message);
          selectedMode.value = previousMode;
          return;
        }

        const { open, dynamicColorId, ...filteredParams } = currentState;
        filteredParams.mode = selectedMode.value;

        const result = await KeyboardService.setLighting(filteredParams);
        if (result instanceof Error) {
          console.error('Failed to set lighting mode:', result.message);
          selectedMode.value = previousMode;
          return;
        }

        confirmedMode.value = selectedMode.value;

        // Load custom colors when switching to Custom mode
        if (selectedMode.value === 21) {
          await loadCustomColorsFromKeyboard();
        }

        // Sync color picker with static color when switching to Static mode
        if (selectedMode.value === 0 && currentState.colors && currentState.colors.length > 0) {
          staticColor.value = currentState.colors[0];
        }
      } catch (error) {
        console.error('Failed to change lighting mode:', error);
        selectedMode.value = previousMode;
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
        superResponse.value = currentState.superResponse ?? false;
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
      superResponse,
      selectedMode,
      staticColor,
      applyMasterLuminance,
      applyMasterSpeed,
      applyMasterSleepDelay,
      applyMasterDirection,
      applySuperResponse,
      applyStaticColor,
      applyStaticColorThrottled,
      applyCustomColor,
      applyCustomColorThrottled,
      applyModeSelection,
    };
  },
});
</script>

<style scoped lang="scss">
@use 'sass:color';
@use '@styles/variables' as v;

.lighting-page {
  padding: 20px;
  color: v.$text-color;

  .title {
    color: v.$primary-color;
    margin-bottom: 20px;
  }

  .lighting-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .key-grid {
    position: relative;
    margin: 0 auto;
    background: rgba(v.$bg-color, 0.3);
    padding: 20px;
    border-radius: 8px;
    border: 1px solid rgba(v.$primary-color, 0.2);
  }

  .key-row {
    display: flex;
    position: absolute;
  }

  .key-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(135deg, rgba(v.$primary-color, 0.15), rgba(v.$bg-color, 0.25));
    border: 1px solid rgba(v.$primary-color, 0.3);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
    position: absolute;

    &:hover {
      background: linear-gradient(135deg, rgba(v.$primary-color, 0.25), rgba(v.$bg-color, 0.35));
      border-color: rgba(v.$primary-color, 0.6);
      transform: translateY(-1px);
    }

    &.key-selected {
      background: linear-gradient(135deg, rgba(v.$accent-color, 0.4), rgba(v.$primary-color, 0.3));
      border-color: v.$accent-color;
      box-shadow: 0 0 8px rgba(v.$accent-color, 0.5);
    }

    .key-label {
      font-size: 0.7rem;
      color: v.$text-color;
      text-align: center;
      font-weight: 500;
      user-select: none;
    }
  }

  .no-layout {
    text-align: center;
    padding: 40px;
    color: rgba(v.$text-color, 0.6);
  }

  .bottom-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .selection-buttons {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .select-btn {
    padding: 8px 16px;
    background: rgba(v.$primary-color, 0.2);
    border: 1px solid rgba(v.$primary-color, 0.4);
    border-radius: 4px;
    color: v.$text-color;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(v.$primary-color, 0.3);
      border-color: rgba(v.$primary-color, 0.6);
    }

    &:active {
      transform: scale(0.98);
    }
  }

  .settings-panel {
    background: rgba(v.$bg-color, 0.3);
    border: 1px solid rgba(v.$primary-color, 0.2);
    border-radius: 8px;
    padding: 20px;
  }

  .settings-section {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(v.$primary-color, 0.2);

    h3 {
      margin: 0;
      color: v.$primary-color;
    }
  }

  .toggle-btn {
    padding: 6px 16px;
    background: rgba(v.$success-color, 0.2);
    border: 1px solid rgba(v.$success-color, 0.4);
    border-radius: 4px;
    color: v.$success-color;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 600;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &:hover:not(:disabled) {
      background: rgba(v.$success-color, 0.3);
      border-color: rgba(v.$success-color, 0.6);
    }
  }

  .settings-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;

    &.settings-row-three {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .label {
      font-size: 0.85rem;
      color: rgba(v.$text-color, 0.8);
      font-weight: 500;
    }

    .mode-select {
      padding: 8px 12px;
      background: rgba(v.$bg-color, 0.4);
      border: 1px solid rgba(v.$primary-color, 0.3);
      border-radius: 4px;
      color: v.$text-color;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        border-color: rgba(v.$primary-color, 0.5);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  .color-picker-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 8px;

    .color-display {
      width: 32px;
      height: 32px;
      border-radius: 4px;
      border: 2px solid rgba(v.$primary-color, 0.4);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: rgba(v.$primary-color, 0.6);
        transform: scale(1.05);
      }
    }

    .color-input {
      opacity: 0;
      width: 0;
      height: 0;
      position: absolute;
    }
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding-top: 20px;

    .checkbox-input {
      width: 18px;
      height: 18px;
      cursor: pointer;
    }

    span {
      font-size: 0.9rem;
      color: v.$text-color;
      user-select: none;
    }
  }
}
</style>
