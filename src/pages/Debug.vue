<template>
  <div class="lighting-debug-page">
    <h2 class="title">Lighting Debug & Testing</h2>
    <div v-if="notification" class="notification" :class="{ error: notification.isError }">
      {{ notification.message }}
      <button @click="notification = null" class="dismiss-btn">&times;</button>
    </div>

    <div class="lighting-container">
      <!-- Keyboard Grid -->
      <div v-if="layout.length && loaded" class="key-grid" :style="gridStyle">
        <div v-for="(row, rIdx) in layout" :key="`r-${rIdx}`" class="key-row">
          <div
            v-for="(keyInfo, cIdx) in row"
            :key="`k-${rIdx}-${cIdx}`"
            class="key-btn"
            :class="{ 'lighting-key-selected': loaded && selectedKeys.some(k => (k.physicalKeyValue || k.keyValue) === (keyInfo.physicalKeyValue || keyInfo.keyValue)) }"
            :style="getKeyStyle(rIdx, cIdx)"
            @click="selectKey(keyInfo, rIdx, cIdx)"
          >
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
            <!-- Master Toggle -->
            <div class="settings-section">
              <div class="header-row">
                <h3>closedLighting / setLighting</h3>
              </div>
              <div class="toggle-row">
                <label class="toggle-label">Lighting</label>
                <div class="toggle-switch" @click="toggleLighting" :class="{ disabled: initializing }">
                  <div class="toggle-slider" :class="{ active: lightingEnabled }">
                    <span class="toggle-text">{{ initializing ? 'SYNCING...' : (lightingEnabled ? 'ON' : 'OFF') }}</span>
                  </div>
                </div>
              </div>
              <div class="input-group">
                <div class="label">RGB Brightness (Luminance)</div>
                <select v-model.number="masterLuminance" @change="applyMasterLuminance" class="mode-select" :disabled="initializing || !lightingEnabled">
                  <option :value="0">0 - Off</option>
                  <option :value="1">1 - Low</option>
                  <option :value="2">2 - Medium</option>
                  <option :value="3">3 - High</option>
                  <option :value="4">4 - Maximum</option>
                </select>
              </div>
              <div class="input-group">
                <div class="label">Animation Speed</div>
                <select v-model.number="masterSpeed" @change="applyMasterSpeed" class="mode-select" :disabled="initializing || !lightingEnabled">
                  <option :value="0">0 - Slowest</option>
                  <option :value="1">1 - Slow</option>
                  <option :value="2">2 - Medium</option>
                  <option :value="3">3 - Fast</option>
                  <option :value="4">4 - Fastest</option>
                </select>
              </div>
              <div class="input-group">
                <div class="label">Sleep Timer (minutes)</div>
                <select v-model.number="masterSleepDelay" @change="applyMasterSleepDelay" class="mode-select" :disabled="initializing || !lightingEnabled">
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
            </div>

            <!-- Global Lighting -->
            <div class="settings-section">
              <div class="header-row">
                <h3>setLighting / getLighting</h3>
              </div>
              
              <div class="input-group">
                <div class="label">Mode</div>
                <select v-model="globalLighting.mode" class="mode-select" :disabled="!lightingEnabled">
                  <option value="static">Static</option>
                  <option value="breathing">Breathing</option>
                  <option value="wave">Wave</option>
                  <option value="reactive">Reactive</option>
                  <option value="ripple">Ripple</option>
                  <option value="rainbow">Rainbow</option>
                </select>
              </div>

              <div class="input-group">
                <div class="label">Brightness</div>
                <div class="slider-container">
                  <div class="value-display">{{ lightingRanges.brightness.min }}</div>
                  <input 
                    type="range" 
                    v-model.number="globalLighting.brightness" 
                    :min="lightingRanges.brightness.min" 
                    :max="lightingRanges.brightness.max" 
                    :disabled="!lightingEnabled"
                  />
                  <div class="value-display">{{ lightingRanges.brightness.max }}</div>
                </div>
                <div class="adjusters">
                  <button @click="globalLighting.brightness = Math.max(lightingRanges.brightness.min, globalLighting.brightness - 1)" class="adjust-btn" :disabled="!lightingEnabled">-</button>
                  <input
                    type="number"
                    v-model.number="globalLighting.brightness"
                    :min="lightingRanges.brightness.min"
                    :max="lightingRanges.brightness.max"
                    :disabled="!lightingEnabled"
                  />
                  <button @click="globalLighting.brightness = Math.min(lightingRanges.brightness.max, globalLighting.brightness + 1)" class="adjust-btn" :disabled="!lightingEnabled">+</button>
                </div>
              </div>

              <div class="input-group">
                <div class="label">Speed</div>
                <div class="slider-container">
                  <div class="value-display">{{ lightingRanges.speed.min }}</div>
                  <input 
                    type="range" 
                    v-model.number="globalLighting.speed" 
                    :min="lightingRanges.speed.min" 
                    :max="lightingRanges.speed.max" 
                    :disabled="!lightingEnabled"
                  />
                  <div class="value-display">{{ lightingRanges.speed.max }}</div>
                </div>
                <div class="adjusters">
                  <button @click="globalLighting.speed = Math.max(lightingRanges.speed.min, globalLighting.speed - 1)" class="adjust-btn" :disabled="!lightingEnabled">-</button>
                  <input
                    type="number"
                    v-model.number="globalLighting.speed"
                    :min="lightingRanges.speed.min"
                    :max="lightingRanges.speed.max"
                    :disabled="!lightingEnabled"
                  />
                  <button @click="globalLighting.speed = Math.min(lightingRanges.speed.max, globalLighting.speed + 1)" class="adjust-btn" :disabled="!lightingEnabled">+</button>
                </div>
              </div>

              <div class="input-group">
                <div class="label">Color (RGB)</div>
                <div class="color-inputs">
                  <div class="color-input-group">
                    <label>R</label>
                    <input type="number" v-model.number="globalLighting.color.r" min="0" max="255" :disabled="!lightingEnabled" />
                  </div>
                  <div class="color-input-group">
                    <label>G</label>
                    <input type="number" v-model.number="globalLighting.color.g" min="0" max="255" :disabled="!lightingEnabled" />
                  </div>
                  <div class="color-input-group">
                    <label>B</label>
                    <input type="number" v-model.number="globalLighting.color.b" min="0" max="255" :disabled="!lightingEnabled" />
                  </div>
                  <div class="color-preview" :style="{ backgroundColor: `rgb(${globalLighting.color.r}, ${globalLighting.color.g}, ${globalLighting.color.b})` }"></div>
                </div>
              </div>

              <div class="button-row">
                <button @click="applyGlobalLighting" class="apply-btn" :disabled="!lightingEnabled">Apply</button>
                <button @click="fetchGlobalLighting" class="fetch-btn">Fetch Current</button>
              </div>
            </div>

            <!-- Custom Per-Key Lighting -->
            <div class="settings-section">
              <div class="header-row">
                <h3>setCustomLighting / saveCustomLighting</h3>
              </div>

              <div class="input-group">
                <div class="label">Selected Keys: {{ selectedKeys.length }}</div>
                <div class="color-inputs">
                  <div class="color-input-group">
                    <label>R</label>
                    <input type="number" v-model.number="customLighting.color.r" min="0" max="255" :disabled="!lightingEnabled || selectedKeys.length === 0" />
                  </div>
                  <div class="color-input-group">
                    <label>G</label>
                    <input type="number" v-model.number="customLighting.color.g" min="0" max="255" :disabled="!lightingEnabled || selectedKeys.length === 0" />
                  </div>
                  <div class="color-input-group">
                    <label>B</label>
                    <input type="number" v-model.number="customLighting.color.b" min="0" max="255" :disabled="!lightingEnabled || selectedKeys.length === 0" />
                  </div>
                  <div class="color-preview" :style="{ backgroundColor: `rgb(${customLighting.color.r}, ${customLighting.color.g}, ${customLighting.color.b})` }"></div>
                </div>
              </div>

              <div class="button-row">
                <button @click="applyCustomLighting" class="apply-btn" :disabled="!lightingEnabled || selectedKeys.length === 0">Apply to Selected</button>
                <button @click="saveCustomLighting" class="save-btn" :disabled="!lightingEnabled">Save to Firmware</button>
              </div>
            </div>

            <!-- Special Effects -->
            <div class="settings-section">
              <div class="header-row">
                <h3>setSpecialLighting / getSpecialLighting</h3>
              </div>

              <div class="input-group">
                <div class="label">Effect Mode</div>
                <select v-model="specialLighting.mode" class="mode-select" :disabled="!lightingEnabled">
                  <option value="reactive">Reactive</option>
                  <option value="ripple">Ripple</option>
                  <option value="starlight">Starlight</option>
                </select>
              </div>

              <div class="input-group">
                <div class="label">Brightness</div>
                <div class="slider-container">
                  <div class="value-display">{{ lightingRanges.brightness.min }}</div>
                  <input 
                    type="range" 
                    v-model.number="specialLighting.brightness" 
                    :min="lightingRanges.brightness.min" 
                    :max="lightingRanges.brightness.max" 
                    :disabled="!lightingEnabled"
                  />
                  <div class="value-display">{{ lightingRanges.brightness.max }}</div>
                </div>
                <div class="adjusters">
                  <button @click="specialLighting.brightness = Math.max(lightingRanges.brightness.min, specialLighting.brightness - 1)" class="adjust-btn" :disabled="!lightingEnabled">-</button>
                  <input
                    type="number"
                    v-model.number="specialLighting.brightness"
                    :min="lightingRanges.brightness.min"
                    :max="lightingRanges.brightness.max"
                    :disabled="!lightingEnabled"
                  />
                  <button @click="specialLighting.brightness = Math.min(lightingRanges.brightness.max, specialLighting.brightness + 1)" class="adjust-btn" :disabled="!lightingEnabled">+</button>
                </div>
              </div>

              <div class="input-group">
                <div class="label">Speed</div>
                <div class="slider-container">
                  <div class="value-display">{{ lightingRanges.speed.min }}</div>
                  <input 
                    type="range" 
                    v-model.number="specialLighting.speed" 
                    :min="lightingRanges.speed.min" 
                    :max="lightingRanges.speed.max" 
                    :disabled="!lightingEnabled"
                  />
                  <div class="value-display">{{ lightingRanges.speed.max }}</div>
                </div>
                <div class="adjusters">
                  <button @click="specialLighting.speed = Math.max(lightingRanges.speed.min, specialLighting.speed - 1)" class="adjust-btn" :disabled="!lightingEnabled">-</button>
                  <input
                    type="number"
                    v-model.number="specialLighting.speed"
                    :min="lightingRanges.speed.min"
                    :max="lightingRanges.speed.max"
                    :disabled="!lightingEnabled"
                  />
                  <button @click="specialLighting.speed = Math.min(lightingRanges.speed.max, specialLighting.speed + 1)" class="adjust-btn" :disabled="!lightingEnabled">+</button>
                </div>
              </div>

              <div class="button-row">
                <button @click="applySpecialLighting" class="apply-btn" :disabled="!lightingEnabled">Apply</button>
                <button @click="fetchSpecialLighting" class="fetch-btn">Fetch Current</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Debug Console -->
      <details class="debug-console" open>
        <summary>Debug Console (Click to toggle)</summary>
        <div class="debug-output">
          <pre>{{ debugOutput }}</pre>
        </div>
        <button @click="clearDebugOutput" class="clear-btn">Clear Console</button>
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
    const notification = ref<{ message: string; isError: boolean } | null>(null);
    const initializing = ref(false);
    const lightingEnabled = ref(true);
    const masterLuminance = ref(4);
    const masterSpeed = ref(3);
    const masterSleepDelay = ref(0);
    const debugOutput = ref('Lighting Debug Console\n-------------------\n');
    const selectedKeys = ref<IDefKeyInfo[]>([]);

    const { layout, loaded, gridStyle, getKeyStyle, fetchLayerLayout, error } = useMappedKeyboard(ref(0));

    const globalLighting = ref({
      mode: 'static',
      brightness: 80,
      speed: 50,
      color: { r: 255, g: 255, b: 255 }
    });

    const customLighting = ref({
      color: { r: 255, g: 0, b: 0 }
    });

    const specialLighting = ref({
      mode: 'reactive',
      brightness: 80,
      speed: 50
    });

    const savedLightingState = ref<any>(null);

    // Lighting range constants (single source of truth)
    const lightingRanges = {
      brightness: { min: 0, max: 100 },
      speed: { min: 0, max: 100 }
    };

    const log = (message: string) => {
      const timestamp = new Date().toLocaleTimeString();
      debugOutput.value += `[${timestamp}] ${message}\n`;
    };

    const setNotification = (message: string, isError: boolean) => {
      notification.value = { message, isError };
      setTimeout(() => {
        notification.value = null;
      }, 5000);
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
      log(`Selected keys: ${selectedKeys.value.length}`);
    };

    const selectAll = () => {
      const totalKeys = layout.value.flat().length;
      if (selectedKeys.value.length === totalKeys) {
        selectedKeys.value = [];
        log('Deselected all keys');
      } else {
        selectedKeys.value = layout.value.flat();
        log(`Selected all ${totalKeys} keys`);
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
        log('Deselected WASD keys');
      } else {
        selectedKeys.value = [...selectedKeys.value, ...wasdKeys.filter(key => !selectedKeys.value.some(s => (s.physicalKeyValue || s.keyValue) === (key.physicalKeyValue || key.keyValue)))];
        log('Selected WASD keys');
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
        log('Deselected letter keys');
      } else {
        selectedKeys.value = [...selectedKeys.value, ...letterKeys.filter(key => !selectedKeys.value.some(s => (s.physicalKeyValue || s.keyValue) === (key.physicalKeyValue || key.keyValue)))];
        log('Selected letter keys');
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
        log('Deselected number keys');
      } else {
        selectedKeys.value = [...selectedKeys.value, ...numberKeys.filter(key => !selectedKeys.value.some(s => (s.physicalKeyValue || s.keyValue) === (key.physicalKeyValue || key.keyValue)))];
        log('Selected number keys');
      }
    };

    const selectNone = () => {
      selectedKeys.value = [];
      log('Deselected all keys');
    };

    // Lighting control functions
    const toggleLighting = async () => {
      // Prevent interaction during initialization
      if (initializing.value) {
        log('Toggle blocked: initialization in progress');
        return;
      }
      
      try {
        if (lightingEnabled.value) {
          log('Toggle OFF - Syncing SDK cache to prevent glitch...');
          try {
            const currentState = await debugKeyboardService.getLighting();
            log(`SDK cache synced: ${JSON.stringify(currentState)}`);
          } catch (syncError) {
            log(`WARNING: Cache sync failed (${(syncError as Error).message}), continuing with closedLighting anyway`);
          }
          
          log('Calling closedLighting() to turn off all lighting...');
          await debugKeyboardService.closedLighting();
          lightingEnabled.value = false;
          setNotification('Lighting turned OFF via closedLighting()', false);
          log('closedLighting() called successfully - lights should be off');
        } else {
          log('Toggle ON - Fetching current lighting state...');
          const currentState = await debugKeyboardService.getLighting();
          log(`Raw getLighting() response: ${JSON.stringify(currentState)}`);
          
          if (!currentState) {
            throw new Error('getLighting() returned no data');
          }
          
          // Filter to only required setLighting() parameters (remove 'open' and 'dynamicColorId')
          const { open, dynamicColorId, ...filteredParams } = currentState;
          log(`Filtered parameters for setLighting(): ${JSON.stringify(filteredParams)}`);
          
          log('Calling setLighting() with filtered parameters...');
          await debugKeyboardService.setLighting(filteredParams);
          lightingEnabled.value = true;
          setNotification('Lighting turned ON via setLighting()', false);
          log('setLighting() called successfully - lights should be on');
        }
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
        setNotification('Failed to toggle lighting', true);
      }
    };

    const applyMasterLuminance = async () => {
      try {
        log(`Applying master luminance: ${masterLuminance.value}...`);
        const currentState = await debugKeyboardService.getLighting();
        log(`Current state retrieved: ${JSON.stringify(currentState)}`);
        
        if (!currentState) {
          throw new Error('getLighting() returned no data');
        }
        
        // Filter to only required setLighting() parameters (remove 'open' and 'dynamicColorId')
        const { open, dynamicColorId, ...filteredParams } = currentState;
        
        // Update luminance with the selected value
        filteredParams.luminance = masterLuminance.value;
        log(`Applying lighting with luminance ${masterLuminance.value}: ${JSON.stringify(filteredParams)}`);
        
        await debugKeyboardService.setLighting(filteredParams);
        setNotification(`RGB brightness set to ${masterLuminance.value}`, false);
        log('Master luminance applied successfully');
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
        setNotification('Failed to apply master luminance', true);
      }
    };

    const applyMasterSpeed = async () => {
      try {
        log(`Applying master speed: ${masterSpeed.value}...`);
        const currentState = await debugKeyboardService.getLighting();
        log(`Current state retrieved: ${JSON.stringify(currentState)}`);
        
        if (!currentState) {
          throw new Error('getLighting() returned no data');
        }
        
        // Filter to only required setLighting() parameters (remove 'open' and 'dynamicColorId')
        const { open, dynamicColorId, ...filteredParams } = currentState;
        
        // Update speed with the selected value
        filteredParams.speed = masterSpeed.value;
        log(`Applying lighting with speed ${masterSpeed.value}: ${JSON.stringify(filteredParams)}`);
        
        await debugKeyboardService.setLighting(filteredParams);
        setNotification(`Animation speed set to ${masterSpeed.value}`, false);
        log('Master speed applied successfully');
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
        setNotification('Failed to apply master speed', true);
      }
    };

    const applyMasterSleepDelay = async () => {
      try {
        log(`Applying master sleep delay: ${masterSleepDelay.value}...`);
        const currentState = await debugKeyboardService.getLighting();
        log(`Current state retrieved: ${JSON.stringify(currentState)}`);
        
        if (!currentState) {
          throw new Error('getLighting() returned no data');
        }
        
        // Filter to only required setLighting() parameters (remove 'open' and 'dynamicColorId')
        const { open, dynamicColorId, ...filteredParams } = currentState;
        
        // Update sleepDelay with the selected value
        filteredParams.sleepDelay = masterSleepDelay.value;
        log(`Applying lighting with sleepDelay ${masterSleepDelay.value}: ${JSON.stringify(filteredParams)}`);
        
        await debugKeyboardService.setLighting(filteredParams);
        const displayText = masterSleepDelay.value === 0 ? 'Never' : `${masterSleepDelay.value} minutes`;
        setNotification(`Sleep timer set to ${displayText}`, false);
        log('Master sleep delay applied successfully');
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
        setNotification('Failed to apply master sleep delay', true);
      }
    };

    const applyGlobalLighting = async () => {
      try {
        log(`Applying global lighting: ${JSON.stringify(globalLighting.value)}`);
        await debugKeyboardService.setLighting(globalLighting.value);
        setNotification('Global lighting applied successfully', false);
        log('Global lighting applied successfully');
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
        setNotification('Failed to apply global lighting', true);
      }
    };

    const fetchGlobalLighting = async () => {
      try {
        log('Fetching current global lighting...');
        const result = await debugKeyboardService.getLighting();
        log(`Current global lighting: ${JSON.stringify(result)}`);
        if (result.mode) globalLighting.value.mode = result.mode;
        if (result.brightness !== undefined) globalLighting.value.brightness = result.brightness;
        if (result.speed !== undefined) globalLighting.value.speed = result.speed;
        if (result.color) globalLighting.value.color = result.color;
        setNotification('Global lighting fetched', false);
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
        setNotification('Failed to fetch global lighting', true);
      }
    };

    const applyCustomLighting = async () => {
      try {
        const keys = selectedKeys.value.map(k => ({
          key: k.physicalKeyValue || k.keyValue,
          r: customLighting.value.color.r,
          g: customLighting.value.color.g,
          b: customLighting.value.color.b
        }));
        
        const param = { keys };
        log(`Applying custom lighting to ${keys.length} keys: ${JSON.stringify(param)}`);
        await debugKeyboardService.setCustomLighting(param);
        setNotification(`Custom lighting applied to ${keys.length} key(s)`, false);
        log('Custom lighting applied successfully');
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
        setNotification('Failed to apply custom lighting', true);
      }
    };

    const saveCustomLighting = async () => {
      try {
        log('Saving custom lighting to firmware...');
        await debugKeyboardService.saveCustomLighting();
        setNotification('Custom lighting saved to firmware', false);
        log('Custom lighting saved to firmware successfully');
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
        setNotification('Failed to save custom lighting', true);
      }
    };

    const applySpecialLighting = async () => {
      try {
        log(`Applying special lighting: ${JSON.stringify(specialLighting.value)}`);
        await debugKeyboardService.setSpecialLighting(specialLighting.value);
        setNotification('Special lighting applied successfully', false);
        log('Special lighting applied successfully');
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
        setNotification('Failed to apply special lighting', true);
      }
    };

    const fetchSpecialLighting = async () => {
      try {
        log('Fetching current special lighting...');
        const result = await debugKeyboardService.getSpecialLighting();
        log(`Current special lighting: ${JSON.stringify(result)}`);
        if (result.mode) specialLighting.value.mode = result.mode;
        if (result.brightness !== undefined) specialLighting.value.brightness = result.brightness;
        if (result.speed !== undefined) specialLighting.value.speed = result.speed;
        setNotification('Special lighting fetched', false);
      } catch (error) {
        log(`ERROR: ${(error as Error).message}`);
        setNotification('Failed to fetch special lighting', true);
      }
    };

    const clearDebugOutput = () => {
      debugOutput.value = 'Lighting Debug Console\n-------------------\n';
    };

    const initLightingFromDevice = async () => {
      try {
        initializing.value = true;
        log('Initializing UI from keyboard state...');
        
        const currentState = await debugKeyboardService.getLighting();
        log(`Retrieved lighting state: ${JSON.stringify(currentState)}`);
        
        if (currentState) {
          // Update master controls
          lightingEnabled.value = currentState.open ?? true;
          masterLuminance.value = currentState.luminance ?? 4;
          masterSpeed.value = currentState.speed ?? 3;
          masterSleepDelay.value = currentState.sleepDelay ?? 0;
          
          // Update global lighting form
          if (currentState.mode) globalLighting.value.mode = currentState.mode;
          if (currentState.brightness !== undefined) globalLighting.value.brightness = currentState.brightness;
          if (currentState.speed !== undefined) globalLighting.value.speed = currentState.speed;
          if (currentState.color) globalLighting.value.color = currentState.color;
          
          log('UI synchronized with keyboard state');
          setNotification('UI synchronized with keyboard', false);
        }
      } catch (error) {
        log(`Failed to initialize from device: ${(error as Error).message}`);
        setNotification('Using default settings (device not connected)', true);
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
          
          // Sync UI with keyboard state after connection
          await initLightingFromDevice();
        } catch (promptError) {
          log(`Connection failed: ${(promptError as Error).message}`);
          setNotification('Debug connection failed', true);
          initializing.value = false;
        }
      }
    });

    return {
      notification,
      initializing,
      lightingEnabled,
      masterLuminance,
      masterSpeed,
      masterSleepDelay,
      globalLighting,
      customLighting,
      specialLighting,
      lightingRanges,
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
      applyGlobalLighting,
      fetchGlobalLighting,
      applyCustomLighting,
      saveCustomLighting,
      applySpecialLighting,
      fetchSpecialLighting,
      clearDebugOutput,
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
    font-weight: 700;
  }
}

.notification {
  padding: 10px 15px;
  margin-bottom: 16px;
  border-radius: v.$border-radius;
  background-color: rgba(34, 197, 94, 0.2);
  color: v.$text-color;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &.error {
    background-color: rgba(239, 68, 68, 0.2);
  }

  .dismiss-btn {
    padding: 0 8px;
    background: none;
    border: none;
    color: v.$text-color;
    cursor: pointer;
    font-size: 1.2rem;

    &:hover {
      opacity: 0.7;
    }
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

  .key-label {
    font-size: 0.8rem;
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

    &:hover {
      background-color: color.adjust(v.$accent-color, $lightness: -20%);
      color: white;
    }
  }
}

.parent {
  display: flex;
  justify-content: center;
}

.settings-panel {
  width: 100%;
  max-width: 1200px;
  background: rgba(v.$background-dark, 0.5);
  border: 1px solid rgba(v.$text-color, 0.1);
  border-radius: v.$border-radius;
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.settings-section {
  border: 2px solid rgba(v.$text-color, 0.2);
  border-radius: v.$border-radius;
  padding: 15px;
  background: rgba(v.$background-dark, 0.3);

  .header-row {
    margin-bottom: 15px;

    h3 {
      color: v.$primary-color;
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
    }
  }
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 20px;

  .toggle-label {
    font-size: 1rem;
    font-weight: 500;
  }

  .toggle-switch {
    width: 80px;
    height: 36px;
    background: rgba(v.$text-color, 0.2);
    border-radius: 18px;
    cursor: pointer;
    position: relative;
    transition: background 0.3s;

    &.disabled {
      pointer-events: none;
      opacity: 0.5;
      cursor: not-allowed;
    }

    .toggle-slider {
      position: absolute;
      width: 70px;
      height: 30px;
      background: #6b7280;
      border-radius: 15px;
      top: 3px;
      left: 3px;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;

      .toggle-text {
        font-size: 0.75rem;
        font-weight: 700;
        color: white;
      }

      &.active {
        background: v.$accent-color;
      }
    }
  }
}

.input-group {
  margin-bottom: 15px;

  .label {
    margin-bottom: 8px;
    font-size: 0.9rem;
    color: v.$text-color;
    font-weight: 500;
  }

  .mode-select {
    width: 100%;
    padding: 8px 12px;
    background: rgba(v.$background-dark, 0.8);
    border: 1px solid rgba(v.$text-color, 0.3);
    border-radius: v.$border-radius;
    color: v.$text-color;
    font-size: 0.9rem;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
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
        border-radius: 50%;
        background: v.$accent-color;
        cursor: pointer;
        margin-top: -3px;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .value-display {
      min-width: 40px;
      text-align: center;
      font-size: 0.85rem;
      color: rgba(v.$text-color, 0.7);
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

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .adjust-btn {
      width: 20px;
      height: 20px;
      border: none;
      border-radius: 4%;
      background-color: color.adjust(v.$background-dark, $lightness: 15%);
      color: v.$text-color;
      cursor: pointer;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.2s ease;

      &:hover:not(:disabled) {
        background-color: v.$accent-color;
        color: v.$background-dark;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}

.color-inputs {
  display: flex;
  gap: 10px;
  align-items: center;

  .color-input-group {
    display: flex;
    flex-direction: column;
    gap: 5px;

    label {
      margin: 0;
      font-size: 0.75rem;
      color: v.$text-color;
      font-weight: 600;
    }

    input {
      width: 60px;
      padding: 6px;
      background: rgba(v.$background-dark, 0.8);
      border: 1px solid rgba(v.$text-color, 0.3);
      border-radius: v.$border-radius;
      color: v.$text-color;
      font-size: 0.85rem;
      text-align: center;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  .color-preview {
    width: 50px;
    height: 50px;
    border-radius: v.$border-radius;
    border: 2px solid rgba(v.$text-color, 0.3);
  }
}

.button-row {
  display: flex;
  gap: 10px;
  margin-top: 10px;

  button {
    padding: 10px 20px;
    border: none;
    border-radius: v.$border-radius;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .apply-btn {
    background: v.$accent-color;
    color: v.$background-dark;

    &:hover:not(:disabled) {
      background: color.adjust(v.$accent-color, $lightness: 10%);
    }
  }

  .fetch-btn {
    background: v.$primary-color;
    color: v.$background-dark;

    &:hover:not(:disabled) {
      background: color.adjust(v.$primary-color, $lightness: 10%);
    }
  }

  .save-btn {
    background: #10b981;
    color: white;

    &:hover:not(:disabled) {
      background: color.adjust(#10b981, $lightness: 10%);
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
    color: v.$accent-color;
    user-select: none;

    &:hover {
      background: rgba(v.$accent-color, 0.1);
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

  .clear-btn {
    margin: 0 15px 15px 15px;
    padding: 8px 16px;
    background: #6b7280;
    color: white;
    border: none;
    border-radius: v.$border-radius;
    cursor: pointer;
    font-size: 0.9rem;

    &:hover {
      background: color.adjust(#6b7280, $lightness: 10%);
    }
  }
}
</style>
